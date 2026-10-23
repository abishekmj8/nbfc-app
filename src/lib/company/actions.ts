"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { createAuditLogTx } from "@/lib/audit/service";

// ── Branch CRUD ──────────────────────────────────────────

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  code: z.string().min(1, "Branch code is required").max(10),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.email().optional().or(z.literal("")),
});

export type BranchFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createBranchAction(
  _prevState: BranchFormState,
  formData: FormData
): Promise<BranchFormState> {
  const user = await requirePermission("branches", "CREATE");
  const raw = Object.fromEntries(formData.entries());
  const parsed = branchSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({
        data: {
          companyId: user.companyId,
          name: data.name,
          code: data.code.toUpperCase(),
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          pincode: data.pincode || null,
          phone: data.phone || null,
          email: data.email || null,
        },
      });

      await createAuditLogTx(tx, {
        companyId: user.companyId,
        userId: user.id,
        userEmail: user.email,
        action: "CREATE",
        entityType: "Branch",
        entityId: branch.id,
        after: branch,
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create branch";
    if (msg.includes("Unique constraint")) {
      return { error: "A branch with this code already exists" };
    }
    return { error: msg };
  }

  revalidatePath("/settings/branches");
  return { success: true };
}

export async function deleteBranchAction(branchId: string): Promise<BranchFormState> {
  const user = await requirePermission("branches", "DELETE");

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, companyId: user.companyId, deletedAt: null },
  });

  if (!branch) return { error: "Branch not found" };
  if (branch.isHeadOffice) return { error: "Cannot delete the head office branch" };

  // Check if any active users are in this branch
  const usersInBranch = await prisma.user.count({
    where: { branchId, deletedAt: null },
  });
  if (usersInBranch > 0) {
    return { error: `Cannot delete branch with ${usersInBranch} active user(s). Reassign them first.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.branch.update({
      where: { id: branchId },
      data: { deletedAt: new Date() },
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "DELETE",
      entityType: "Branch",
      entityId: branchId,
      before: branch,
    });
  });

  revalidatePath("/settings/branches");
  return { success: true };
}

// ── Holiday CRUD ─────────────────────────────────────────

const holidaySchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["NATIONAL", "STATE", "CUSTOM"]).default("CUSTOM"),
  branchId: z.string().optional(),
});

export type HolidayFormState = {
  success?: boolean;
  error?: string;
};

export async function createHolidayAction(
  _prevState: HolidayFormState,
  formData: FormData
): Promise<HolidayFormState> {
  const user = await requirePermission("holidays", "CREATE");
  const raw = Object.fromEntries(formData.entries());
  const parsed = holidaySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Please fill all required fields" };
  }

  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    const holiday = await tx.holiday.create({
      data: {
        companyId: user.companyId,
        name: data.name,
        date: new Date(data.date),
        type: data.type,
        branchId: data.branchId || null,
        createdBy: user.id,
      },
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "Holiday",
      entityId: holiday.id,
      after: holiday,
    });
  });

  revalidatePath("/settings/holidays");
  return { success: true };
}

export async function deleteHolidayAction(holidayId: string): Promise<HolidayFormState> {
  const user = await requirePermission("holidays", "DELETE");

  await prisma.$transaction(async (tx) => {
    const holiday = await tx.holiday.findFirst({
      where: { id: holidayId, companyId: user.companyId },
    });

    if (!holiday) return;

    await tx.holiday.update({
      where: { id: holidayId },
      data: { deletedAt: new Date() },
    });

    await createAuditLogTx(tx, {
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "DELETE",
      entityType: "Holiday",
      entityId: holidayId,
      before: holiday,
    });
  });

  revalidatePath("/settings/holidays");
  return { success: true };
}
