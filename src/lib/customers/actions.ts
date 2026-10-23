"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { createAuditLogTx } from "@/lib/audit/service";
import { encrypt, maskPan, maskBankAccount } from "@/lib/crypto/encrypt";

const createCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().or(z.literal("")),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.email().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  occupation: z.string().optional().or(z.literal("")),
  monthlyIncome: z.string().optional().or(z.literal("")),
  // Address
  addressLine1: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  pincode: z.string().optional().or(z.literal("")),
  // Identity
  panNumber: z.string().optional().or(z.literal("")),
  // Bank
  bankName: z.string().optional().or(z.literal("")),
  ifscCode: z.string().optional().or(z.literal("")),
  accountNumber: z.string().optional().or(z.literal("")),
  accountType: z.enum(["SAVINGS", "CURRENT", "OVERDRAFT"]).optional(),
});

export type CustomerFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  customerId?: string;
};

export async function createCustomerAction(
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const user = await requirePermission("loans", "CREATE");
  const raw = Object.fromEntries(formData.entries());
  const parsed = createCustomerSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const data = parsed.data;
  const incomePaise = data.monthlyIncome
    ? BigInt(Math.round(parseFloat(data.monthlyIncome) * 100))
    : null;

  let customerId: string;

  try {
    customerId = await prisma.$transaction(async (tx) => {
      // Generate customer code
      const count = await tx.customer.count({ where: { companyId: user.companyId } });
      const customerCode = `CUS-${String(count + 1).padStart(6, "0")}`;

      const customer = await tx.customer.create({
        data: {
          companyId: user.companyId,
          branchId: user.branchId,
          customerCode,
          firstName: data.firstName,
          lastName: data.lastName || null,
          phone: data.phone,
          email: data.email || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender ?? null,
          occupation: data.occupation || null,
          monthlyIncome: incomePaise,
          createdBy: user.id,
        },
      });

      // Add address if provided
      if (data.addressLine1 && data.city) {
        await tx.customerAddress.create({
          data: {
            customerId: customer.id,
            type: "CURRENT",
            addressLine1: data.addressLine1,
            city: data.city,
            state: data.state || "",
            pincode: data.pincode || "",
          },
        });
      }

      // Add PAN if provided
      if (data.panNumber && data.panNumber.length === 10) {
        const encryptedPan = encrypt(data.panNumber.toUpperCase());
        await tx.customerIdentity.create({
          data: {
            customerId: customer.id,
            documentType: "PAN",
            documentNumber: encryptedPan,
            maskedNumber: maskPan(data.panNumber.toUpperCase()),
            isVerified: false,
          },
        });
        await tx.customer.update({
          where: { id: customer.id },
          data: { kycStatus: "PARTIAL" },
        });
      }

      // Add bank account if provided
      if (data.bankName && data.accountNumber && data.ifscCode) {
        const encryptedAccount = encrypt(data.accountNumber);
        await tx.customerBankAccount.create({
          data: {
            customerId: customer.id,
            bankName: data.bankName,
            ifscCode: data.ifscCode.toUpperCase(),
            accountNumber: encryptedAccount,
            maskedAccount: maskBankAccount(data.accountNumber),
            accountType: data.accountType ?? "SAVINGS",
            isPrimary: true,
          },
        });
      }

      await createAuditLogTx(tx, {
        companyId: user.companyId,
        userId: user.id,
        userEmail: user.email,
        action: "CREATE",
        entityType: "Customer",
        entityId: customer.id,
        after: { customerCode, name: `${data.firstName} ${data.lastName ?? ""}`.trim() },
      });

      return customer.id;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create customer";
    return { error: msg };
  }

  redirect(`/customers/${customerId}`);
}
