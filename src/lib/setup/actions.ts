"use server";

import { z } from "zod/v4";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit/service";
import { headers } from "next/headers";

const setupSchema = z.object({
  // Company
  companyName: z.string().min(1, "Company name is required"),
  rbiRegistrationNo: z.string().optional(),
  companyEmail: z.email().optional(),
  companyPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  // Admin user
  adminFirstName: z.string().min(1, "First name is required"),
  adminLastName: z.string().optional(),
  adminEmail: z.email("Valid email is required"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SetupState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function setupAction(
  _prevState: SetupState,
  formData: FormData
): Promise<SetupState> {
  // Check if setup already completed
  const existingCompany = await prisma.company.findFirst();
  if (existingCompany) {
    return { error: "Setup has already been completed" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = setupSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          rbiRegistrationNo: data.rbiRegistrationNo || null,
          email: data.companyEmail || null,
          phone: data.companyPhone || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          pincode: data.pincode || null,
        },
      });

      // Create head office branch
      const branch = await tx.branch.create({
        data: {
          companyId: company.id,
          name: "Head Office",
          code: "HO",
          city: data.city || null,
          state: data.state || null,
          isHeadOffice: true,
        },
      });

      // Create admin role with full permissions
      const modules = ["settings", "users", "audit", "branches", "company", "holidays"];
      const actions = ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"];

      const adminRole = await tx.role.create({
        data: {
          companyId: company.id,
          name: "Admin",
          description: "Full system access",
          isSystem: true,
          permissions: {
            create: modules.flatMap((module) =>
              actions.map((action) => ({ module, action }))
            ),
          },
        },
      });

      // Create officer and viewer roles
      await tx.role.create({
        data: {
          companyId: company.id,
          name: "Manager",
          description: "Branch manager with approval rights",
          isSystem: true,
          permissions: {
            create: modules
              .filter((m) => m !== "settings")
              .flatMap((module) =>
                ["VIEW", "CREATE", "EDIT", "APPROVE"].map((action) => ({ module, action }))
              ),
          },
        },
      });

      await tx.role.create({
        data: {
          companyId: company.id,
          name: "Officer",
          description: "Loan officer with create and edit rights",
          isSystem: true,
          permissions: {
            create: modules
              .filter((m) => !["settings", "users"].includes(m))
              .flatMap((module) =>
                ["VIEW", "CREATE", "EDIT"].map((action) => ({ module, action }))
              ),
          },
        },
      });

      await tx.role.create({
        data: {
          companyId: company.id,
          name: "Viewer",
          description: "Read-only access",
          isSystem: true,
          permissions: {
            create: modules.map((module) => ({ module, action: "VIEW" })),
          },
        },
      });

      // Create admin user
      const passwordHash = await hashPassword(data.adminPassword);
      const adminUser = await tx.user.create({
        data: {
          companyId: company.id,
          branchId: branch.id,
          email: data.adminEmail,
          passwordHash,
          firstName: data.adminFirstName,
          lastName: data.adminLastName || null,
          roleId: adminRole.id,
          status: "ACTIVE",
        },
      });

      // Enable default modules
      const defaultModules = [
        "lead-management",
        "loan-origination",
        "loan-management",
        "collections",
        "accounting",
        "fee-charges",
        "compliance",
        "reports",
        "notifications",
        "documents",
        "task-workflow",
      ];

      for (const moduleId of defaultModules) {
        await tx.systemConfig.create({
          data: {
            companyId: company.id,
            key: `module.${moduleId}.enabled`,
            value: "true",
          },
        });
      }

      // Set app version
      await tx.systemConfig.create({
        data: {
          companyId: company.id,
          key: "app.version",
          value: "0.1.0",
        },
      });

      return { company, adminUser };
    });

    // Create session for the new admin
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") ?? undefined;
    const ua = headersList.get("user-agent") ?? undefined;

    await createSession(result.adminUser.id, ip, ua);

    await createAuditLog({
      companyId: result.company.id,
      userId: result.adminUser.id,
      userEmail: result.adminUser.email,
      action: "SETUP_COMPLETE",
      entityType: "Company",
      entityId: result.company.id,
      after: { companyName: result.company.name },
      ipAddress: ip,
      userAgent: ua,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Setup failed";
    if (message.includes("Unique constraint")) {
      return { error: "A company with this email already exists" };
    }
    return { error: message };
  }

  redirect("/dashboard");
}

/**
 * Check if setup is needed (no company exists).
 */
export async function isSetupNeeded(): Promise<boolean> {
  const count = await prisma.company.count();
  return count === 0;
}
