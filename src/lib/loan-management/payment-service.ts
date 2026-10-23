"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { createAuditLogTx } from "@/lib/audit/service";

const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  mode: z.enum(["CASH", "CHEQUE", "UPI", "NEFT", "NACH", "RTGS"]),
  referenceNumber: z.string().optional().or(z.literal("")),
  receivedDate: z.string().min(1, "Date is required"),
});

export type PaymentFormState = {
  success?: boolean;
  error?: string;
};

/**
 * Record a payment and auto-allocate to interest → penalty → principal.
 */
export async function recordPaymentAction(
  loanAccountId: string,
  _prev: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const user = await requirePermission("loans", "CREATE");
  const raw = Object.fromEntries(formData.entries());
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) return { error: "Please fill all required fields" };

  const data = parsed.data;
  const amountPaise = BigInt(Math.round(parseFloat(data.amount) * 100));
  if (amountPaise <= 0n) return { error: "Amount must be positive" };

  const loan = await prisma.loanAccount.findFirst({
    where: { id: loanAccountId, companyId: user.companyId },
    include: {
      emiSchedule: {
        where: { status: { in: ["DUE", "OVERDUE", "PARTIALLY_PAID"] } },
        orderBy: { dueDate: "asc" },
      },
    },
  });
  if (!loan) return { error: "Loan account not found" };
  if (loan.status === "CLOSED") return { error: "Loan is already closed" };

  await prisma.$transaction(async (tx) => {
    let remaining = amountPaise;
    let totalInterest = 0n;
    let totalPrincipal = 0n;
    let totalPenalty = 0n;

    // Allocate to overdue/due EMIs in order: interest → penalty → principal
    for (const emi of loan.emiSchedule) {
      if (remaining <= 0n) break;

      const outstandingEmi = emi.emiAmount - emi.paidAmount;
      if (outstandingEmi <= 0n) continue;

      // Penalty first
      const penaltyDue = emi.penalInterest;
      if (penaltyDue > 0n && remaining > 0n) {
        const penaltyPayment = remaining < penaltyDue ? remaining : penaltyDue;
        totalPenalty += penaltyPayment;
        remaining -= penaltyPayment;
      }

      // Interest portion
      const interestDue = emi.interestComponent - (emi.paidAmount > emi.interestComponent ? emi.interestComponent : emi.paidAmount);
      const interestPayment = remaining < interestDue ? remaining : (interestDue > 0n ? interestDue : 0n);
      if (interestPayment > 0n) {
        totalInterest += interestPayment;
        remaining -= interestPayment;
      }

      // Principal portion
      const principalDue = outstandingEmi - interestPayment - (penaltyDue > 0n ? penaltyDue : 0n);
      const principalPayment = remaining < principalDue ? remaining : (principalDue > 0n ? principalDue : 0n);
      if (principalPayment > 0n) {
        totalPrincipal += principalPayment;
        remaining -= principalPayment;
      }

      const totalPaidForEmi = emi.paidAmount + interestPayment + principalPayment;
      const newStatus = totalPaidForEmi >= emi.emiAmount ? "PAID" : "PARTIALLY_PAID";

      await tx.emiScheduleRow.update({
        where: { id: emi.id },
        data: {
          paidAmount: totalPaidForEmi,
          paidDate: new Date(data.receivedDate),
          status: newStatus,
          daysOverdue: 0,
        },
      });
    }

    // If there's remaining amount, allocate to principal prepayment
    if (remaining > 0n) {
      totalPrincipal += remaining;
      remaining = 0n;
    }

    // Generate receipt number
    const paymentCount = await tx.payment.count({ where: { companyId: user.companyId } });
    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(6, "0")}`;

    // Create payment record
    const payment = await tx.payment.create({
      data: {
        companyId: user.companyId,
        loanAccountId,
        amount: amountPaise,
        mode: data.mode,
        referenceNumber: data.referenceNumber || null,
        receivedDate: new Date(data.receivedDate),
        allocatedToPrincipal: totalPrincipal,
        allocatedToInterest: totalInterest,
        allocatedToPenalty: totalPenalty,
        status: "ALLOCATED",
        receiptNumber,
        createdBy: user.id,
      },
    });

    // Update outstanding principal
    const newOutstanding = loan.outstandingPrincipal - totalPrincipal;
    const updateData: Record<string, unknown> = {
      outstandingPrincipal: newOutstanding < 0n ? 0n : newOutstanding,
    };

    // Check if loan is fully paid
    if (newOutstanding <= 0n) {
      updateData.status = "CLOSED";
      updateData.closedAt = new Date();
      updateData.closureType = "NORMAL";
    }

    await tx.loanAccount.update({
      where: { id: loanAccountId },
      data: updateData,
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "Payment",
      entityId: payment.id,
      after: {
        amount: amountPaise.toString(),
        mode: data.mode,
        principal: totalPrincipal.toString(),
        interest: totalInterest.toString(),
        penalty: totalPenalty.toString(),
        receiptNumber,
      },
    });
  });

  revalidatePath(`/loans/${loanAccountId}`);
  revalidatePath("/loans");
  return { success: true };
}

/**
 * Mark a payment as bounced (NACH/cheque bounce).
 */
export async function bouncePaymentAction(
  paymentId: string,
  reason: string,
  bounceChargesPaise: bigint
): Promise<PaymentFormState> {
  const user = await requirePermission("loans", "EDIT");

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, companyId: user.companyId },
  });
  if (!payment) return { error: "Payment not found" };
  if (payment.isBounced) return { error: "Payment already marked as bounced" };

  await prisma.$transaction(async (tx) => {
    // Reverse the payment allocation
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        isBounced: true,
        bounceReason: reason,
        bounceCharges: bounceChargesPaise,
        status: "BOUNCED",
      },
    });

    // Add back the principal to outstanding
    await tx.loanAccount.update({
      where: { id: payment.loanAccountId },
      data: {
        outstandingPrincipal: { increment: payment.allocatedToPrincipal },
      },
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "Payment",
      entityId: paymentId,
      before: { status: "ALLOCATED" },
      after: { status: "BOUNCED", reason, bounceCharges: bounceChargesPaise.toString() },
    });
  });

  revalidatePath(`/loans/${payment.loanAccountId}`);
  return { success: true };
}
