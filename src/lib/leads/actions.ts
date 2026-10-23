"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { createAuditLogTx } from "@/lib/audit/service";

const createLeadSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.email().optional().or(z.literal("")),
  source: z.enum(["WALK_IN", "PHONE", "WEB", "DSA", "REFERRAL"]),
  loanProductId: z.string().optional().or(z.literal("")),
  requestedAmount: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type LeadFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createLeadAction(
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const user = await requirePermission("leads", "CREATE");
  const raw = Object.fromEntries(formData.entries());
  const parsed = createLeadSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const data = parsed.data;
  const amountPaise = data.requestedAmount
    ? BigInt(Math.round(parseFloat(data.requestedAmount) * 100))
    : null;

  await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        companyId: user.companyId,
        branchId: user.branchId,
        customerName: data.customerName,
        phone: data.phone,
        email: data.email || null,
        source: data.source,
        loanProductId: data.loanProductId || null,
        requestedAmount: amountPaise,
        assignedTo: user.id,
        notes: data.notes || null,
        createdBy: user.id,
      },
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "Lead",
      entityId: lead.id,
      after: { customerName: lead.customerName, source: lead.source },
    });
  });

  revalidatePath("/leads");
  return { success: true };
}

export async function updateLeadStatusAction(
  leadId: string,
  status: string
): Promise<LeadFormState> {
  const user = await requirePermission("leads", "EDIT");

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, companyId: user.companyId, deletedAt: null },
  });
  if (!lead) return { error: "Lead not found" };

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: leadId },
      data: { status, updatedAt: new Date() },
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "Lead",
      entityId: leadId,
      before: { status: lead.status },
      after: { status },
    });
  });

  revalidatePath("/leads");
  return { success: true };
}

/**
 * Convert a lead to a loan application.
 * Creates a Customer (if not exists) and a LoanApplication.
 */
export async function convertLeadAction(leadId: string): Promise<{ applicationId?: string; error?: string }> {
  const user = await requirePermission("leads", "EDIT");

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, companyId: user.companyId, deletedAt: null },
  });
  if (!lead) return { error: "Lead not found" };
  if (lead.status === "CONVERTED") return { error: "Lead already converted" };
  if (!lead.loanProductId) return { error: "Select a loan product before converting" };

  const result = await prisma.$transaction(async (tx) => {
    // Create customer from lead data
    const nameParts = lead.customerName.split(" ");
    const customer = await tx.customer.create({
      data: {
        companyId: user.companyId,
        branchId: lead.branchId,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" ") || null,
        phone: lead.phone,
        email: lead.email,
        createdBy: user.id,
      },
    });

    // Generate application number
    const count = await tx.loanApplication.count({ where: { companyId: user.companyId } });
    const appNumber = `LA-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;

    // Create loan application
    const application = await tx.loanApplication.create({
      data: {
        companyId: user.companyId,
        branchId: lead.branchId,
        applicationNumber: appNumber,
        customerId: customer.id,
        loanProductId: lead.loanProductId!,
        leadId: lead.id,
        requestedAmount: lead.requestedAmount ?? 0n,
        tenureMonths: 12, // Default, editable later
        status: "DRAFT",
        createdBy: user.id,
      },
    });

    // Update lead status
    await tx.lead.update({
      where: { id: leadId },
      data: {
        status: "CONVERTED",
        convertedToApplicationId: application.id,
      },
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "LoanApplication",
      entityId: application.id,
      after: { applicationNumber: appNumber, fromLead: leadId },
    });

    return application;
  });

  revalidatePath("/leads");
  revalidatePath("/loans/applications");
  return { applicationId: result.id };
}
