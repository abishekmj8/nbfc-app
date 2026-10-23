"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { createAuditLogTx } from "@/lib/audit/service";
import { generateEmiSchedule } from "@/lib/interest/emi-calculator";

// ── Application CRUD ────────────────────────────────────

const updateApplicationSchema = z.object({
  requestedAmount: z.string().min(1),
  tenureMonths: z.string().min(1),
  purpose: z.string().optional().or(z.literal("")),
  interestRateBps: z.string().optional().or(z.literal("")),
});

export type ApplicationFormState = {
  success?: boolean;
  error?: string;
};

export async function updateApplicationAction(
  applicationId: string,
  _prev: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  const user = await requirePermission("loans", "EDIT");
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateApplicationSchema.safeParse(raw);
  if (!parsed.success) return { error: "Please fill all required fields" };

  const data = parsed.data;
  const app = await prisma.loanApplication.findFirst({
    where: { id: applicationId, companyId: user.companyId },
  });
  if (!app) return { error: "Application not found" };
  if (!["DRAFT", "SUBMITTED"].includes(app.status)) {
    return { error: "Application cannot be modified in current status" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.loanApplication.update({
      where: { id: applicationId },
      data: {
        requestedAmount: BigInt(Math.round(parseFloat(data.requestedAmount) * 100)),
        tenureMonths: parseInt(data.tenureMonths, 10),
        purpose: data.purpose || null,
        interestRateBps: data.interestRateBps ? parseInt(data.interestRateBps, 10) : undefined,
        updatedBy: user.id,
      },
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "LoanApplication",
      entityId: applicationId,
      after: data,
    });
  });

  revalidatePath(`/loans/applications/${applicationId}`);
  return { success: true };
}

export async function submitApplicationAction(applicationId: string): Promise<ApplicationFormState> {
  const user = await requirePermission("loans", "EDIT");

  const app = await prisma.loanApplication.findFirst({
    where: { id: applicationId, companyId: user.companyId },
  });
  if (!app) return { error: "Application not found" };
  if (app.status !== "DRAFT") return { error: "Only draft applications can be submitted" };

  await prisma.$transaction(async (tx) => {
    await tx.loanApplication.update({
      where: { id: applicationId },
      data: { status: "SUBMITTED", updatedBy: user.id },
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "LoanApplication",
      entityId: applicationId,
      before: { status: "DRAFT" },
      after: { status: "SUBMITTED" },
    });
  });

  revalidatePath(`/loans/applications/${applicationId}`);
  revalidatePath("/loans/applications");
  return { success: true };
}

// ── Approval (Maker-Checker) ─────────────────────────────

export async function approveApplicationAction(
  applicationId: string,
  remarks?: string
): Promise<ApplicationFormState> {
  const user = await requirePermission("loans", "APPROVE");

  const app = await prisma.loanApplication.findFirst({
    where: { id: applicationId, companyId: user.companyId },
    include: { approvalRequests: true },
  });
  if (!app) return { error: "Application not found" };
  if (!["SUBMITTED", "UNDER_REVIEW"].includes(app.status)) {
    return { error: "Application is not pending approval" };
  }

  await prisma.$transaction(async (tx) => {
    // Create or update approval request
    const existingApproval = app.approvalRequests.find(
      (ar) => ar.status === "PENDING"
    );

    if (existingApproval) {
      await tx.approvalRequest.update({
        where: { id: existingApproval.id },
        data: {
          status: "APPROVED",
          approvedBy: user.id,
          approvedAt: new Date(),
          remarks: remarks || null,
        },
      });
    } else {
      await tx.approvalRequest.create({
        data: {
          companyId: user.companyId,
          entityType: "LOAN_APPLICATION",
          entityId: applicationId,
          loanApplicationId: applicationId,
          level: 1,
          requiredLevels: 1,
          status: "APPROVED",
          requestedBy: app.createdBy ?? user.id,
          approvedBy: user.id,
          approvedAt: new Date(),
          remarks: remarks || null,
        },
      });
    }

    // Move to SANCTIONED with default conditions
    await tx.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: "SANCTIONED",
        approvedAmount: app.requestedAmount,
        interestRateBps: app.interestRateBps,
        sanctionedAt: new Date(),
        updatedBy: user.id,
      },
    });

    // Add default sanction conditions
    const defaultConditions = [
      "All KYC documents verified",
      "Loan agreement signed by borrower",
      "Key Fact Statement acknowledged by borrower",
    ];
    for (const condition of defaultConditions) {
      await tx.sanctionCondition.create({
        data: { loanApplicationId: applicationId, condition },
      });
    }

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "APPROVE",
      entityType: "LoanApplication",
      entityId: applicationId,
      before: { status: app.status },
      after: { status: "SANCTIONED" },
    });
  });

  revalidatePath(`/loans/applications/${applicationId}`);
  revalidatePath("/loans/applications");
  return { success: true };
}

export async function rejectApplicationAction(
  applicationId: string,
  reason: string,
  reasonCode: string
): Promise<ApplicationFormState> {
  const user = await requirePermission("loans", "APPROVE");
  if (!reason) return { error: "Rejection reason is mandatory" };

  const app = await prisma.loanApplication.findFirst({
    where: { id: applicationId, companyId: user.companyId },
  });
  if (!app) return { error: "Application not found" };

  await prisma.$transaction(async (tx) => {
    await tx.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        rejectionCode: reasonCode,
        rejectedBy: user.id,
        rejectedAt: new Date(),
        updatedBy: user.id,
      },
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "REJECT",
      entityType: "LoanApplication",
      entityId: applicationId,
      before: { status: app.status },
      after: { status: "REJECTED", reason, reasonCode },
    });
  });

  revalidatePath(`/loans/applications/${applicationId}`);
  revalidatePath("/loans/applications");
  return { success: true };
}

// ── Disbursement ─────────────────────────────────────────

export async function disburseAction(
  applicationId: string,
  mode: string,
  referenceNumber?: string
): Promise<{ loanAccountId?: string; error?: string }> {
  const user = await requirePermission("loans", "APPROVE");

  const app = await prisma.loanApplication.findFirst({
    where: { id: applicationId, companyId: user.companyId },
    include: {
      sanctionConditions: true,
    },
  });
  if (!app) return { error: "Application not found" };
  if (app.status !== "SANCTIONED") return { error: "Application must be sanctioned first" };

  // Check all mandatory conditions are met
  const unmetConditions = app.sanctionConditions.filter(
    (c) => c.isMandatory && !c.isMet
  );
  if (unmetConditions.length > 0) {
    return { error: `${unmetConditions.length} pre-disbursement condition(s) not met` };
  }

  const product = await prisma.loanProduct.findFirst({
    where: { id: app.loanProductId },
  });
  if (!product) return { error: "Loan product not found" };

  const disbursedAmount = app.approvedAmount ?? app.requestedAmount;
  const rateBps = app.interestRateBps ?? product.defaultInterestRate;
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // Generate loan account number
    const loanCount = await tx.loanAccount.count({ where: { companyId: user.companyId } });
    const accountNumber = `LN-${now.getFullYear()}-${String(loanCount + 1).padStart(6, "0")}`;

    // Calculate maturity date
    const maturityDate = new Date(now);
    maturityDate.setMonth(maturityDate.getMonth() + app.tenureMonths);

    // Generate EMI schedule
    const schedule = generateEmiSchedule({
      principal: disbursedAmount,
      annualRateBps: rateBps,
      tenureMonths: app.tenureMonths,
      startDate: now,
      interestMethod: product.interestMethod as "DAILY_REDUCING" | "MONTHLY_REDUCING" | "FLAT_RATE",
      dayCountConvention: product.dayCountConvention as "ACTUAL_ACTUAL" | "THIRTY_360",
      emiRounding: product.emiRounding as "ROUND_UP_RUPEE" | "ROUND_NEAREST_PAISA",
    });

    // Create loan account
    const loanAccount = await tx.loanAccount.create({
      data: {
        companyId: user.companyId,
        branchId: app.branchId,
        accountNumber,
        loanApplicationId: applicationId,
        customerId: app.customerId,
        loanProductId: app.loanProductId,
        principalAmount: disbursedAmount,
        outstandingPrincipal: disbursedAmount,
        interestRateBps: rateBps,
        interestMethod: product.interestMethod,
        interestType: product.interestType,
        tenureMonths: app.tenureMonths,
        emiAmount: schedule.monthlyEmi,
        disbursedAt: now,
        maturityDate,
        nextEmiDate: schedule.rows[0]?.dueDate,
        status: "ACTIVE",
      },
    });

    // Insert EMI schedule rows
    for (const row of schedule.rows) {
      await tx.emiScheduleRow.create({
        data: {
          loanAccountId: loanAccount.id,
          installmentNumber: row.installmentNumber,
          dueDate: row.dueDate,
          emiAmount: row.emiAmount,
          principalComponent: row.principalComponent,
          interestComponent: row.interestComponent,
          openingBalance: row.openingBalance,
          closingBalance: row.closingBalance,
          status: "UPCOMING",
        },
      });
    }

    // Create disbursement record
    await tx.disbursement.create({
      data: {
        loanApplicationId: applicationId,
        amount: disbursedAmount,
        mode,
        referenceNumber: referenceNumber || null,
        disbursedAt: now,
        disbursedBy: user.id,
      },
    });

    // Update application status
    await tx.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: "DISBURSED",
        loanAccountId: loanAccount.id,
        disbursedAt: now,
        updatedBy: user.id,
      },
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "DISBURSE",
      entityType: "LoanAccount",
      entityId: loanAccount.id,
      after: {
        accountNumber,
        amount: disbursedAmount.toString(),
        rateBps: rateBps,
        tenureMonths: app.tenureMonths,
        emiAmount: schedule.monthlyEmi.toString(),
      },
    });

    return loanAccount;
  });

  revalidatePath(`/loans/applications/${applicationId}`);
  revalidatePath("/loans/applications");
  revalidatePath("/loans");
  return { loanAccountId: result.id };
}

// ── Sanction Condition ───────────────────────────────────

export async function meetConditionAction(
  conditionId: string
): Promise<ApplicationFormState> {
  const user = await requirePermission("loans", "EDIT");

  await prisma.$transaction(async (tx) => {
    await tx.sanctionCondition.update({
      where: { id: conditionId },
      data: { isMet: true, metAt: new Date(), verifiedBy: user.id },
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "SanctionCondition",
      entityId: conditionId,
      after: { isMet: true },
    });
  });

  return { success: true };
}
