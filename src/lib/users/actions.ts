"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { hashPassword } from "@/lib/auth/password";
import { createAuditLogTx } from "@/lib/audit/service";
import { validatePassword } from "@/lib/security/session-config";

const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().or(z.literal("")),
  email: z.email("Valid email required"),
  password: z.string().min(8, "Min 8 characters"),
  roleId: z.string().min(1, "Role is required"),
  branchId: z.string().optional().or(z.literal("")),
});

export type UserFormState = { success?: boolean; error?: string };

export async function createUserAction(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const admin = await requirePermission("users", "CREATE");
  const raw = Object.fromEntries(formData.entries());
  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) return { error: "Please fill all required fields" };

  const d = parsed.data;

  const pwCheck = validatePassword(d.password);
  if (!pwCheck.valid) return { error: pwCheck.errors[0] };

  try {
    await prisma.$transaction(async (tx) => {
      const passwordHash = await hashPassword(d.password);
      const user = await tx.user.create({
        data: {
          companyId: admin.companyId,
          email: d.email,
          passwordHash,
          firstName: d.firstName,
          lastName: d.lastName || null,
          roleId: d.roleId,
          branchId: d.branchId || null,
          createdBy: admin.id,
        },
      });

      await createAuditLogTx(tx, {
        companyId: admin.companyId,
        userId: admin.id,
        userEmail: admin.email,
        action: "CREATE",
        entityType: "User",
        entityId: user.id,
        after: { email: d.email, firstName: d.firstName, roleId: d.roleId },
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Unique constraint")) return { error: "Email already exists" };
    return { error: msg };
  }

  revalidatePath("/settings/users");
  return { success: true };
}

export async function deactivateUserAction(userId: string): Promise<UserFormState> {
  const admin = await requirePermission("users", "DELETE");

  if (userId === admin.id) return { error: "Cannot deactivate yourself" };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { status: "DEACTIVATED", updatedBy: admin.id },
    });
    // Invalidate all sessions
    await tx.session.deleteMany({ where: { userId } });

    await createAuditLogTx(tx, {
      companyId: admin.companyId,
      userId: admin.id,
      userEmail: admin.email,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      after: { status: "DEACTIVATED" },
    });
  });

  revalidatePath("/settings/users");
  return { success: true };
}
