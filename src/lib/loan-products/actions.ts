"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { createAuditLogTx } from "@/lib/audit/service";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  code: z.string().min(1, "Product code is required").max(20),
  description: z.string().optional().or(z.literal("")),
  productType: z.enum(["TERM_LOAN", "BULLET", "EMI", "FLEXI", "OVERDRAFT"]),
  collateralType: z.enum(["NONE", "GOLD", "VEHICLE", "PROPERTY", "OTHER"]),
  interestMethod: z.enum(["DAILY_REDUCING", "MONTHLY_REDUCING", "FLAT_RATE"]),
  dayCountConvention: z.enum(["ACTUAL_ACTUAL", "THIRTY_360"]),
  interestType: z.enum(["FIXED", "FLOATING", "HYBRID"]),
  minInterestRate: z.string().min(1),
  maxInterestRate: z.string().min(1),
  defaultInterestRate: z.string().min(1),
  minTenureMonths: z.string().min(1),
  maxTenureMonths: z.string().min(1),
  minAmount: z.string().min(1),
  maxAmount: z.string().min(1),
  penalRateAdditional: z.string().optional().or(z.literal("")),
  prepaymentFeePercent: z.string().optional().or(z.literal("")),
  processingFeePercent: z.string().optional().or(z.literal("")),
  emiRounding: z.enum(["ROUND_UP_RUPEE", "ROUND_NEAREST_PAISA"]),
});

export type ProductFormState = { success?: boolean; error?: string };

function percentToBps(pct: string): number {
  return Math.round(parseFloat(pct) * 100);
}

function rupeesToPaise(rupees: string): bigint {
  return BigInt(Math.round(parseFloat(rupees) * 100));
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const user = await requirePermission("settings", "CREATE");
  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { error: "Please fill all required fields correctly" };

  const d = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.loanProduct.create({
        data: {
          companyId: user.companyId,
          name: d.name,
          code: d.code.toUpperCase(),
          description: d.description || null,
          productType: d.productType,
          collateralType: d.collateralType,
          interestMethod: d.interestMethod,
          dayCountConvention: d.dayCountConvention,
          interestType: d.interestType,
          minInterestRate: percentToBps(d.minInterestRate),
          maxInterestRate: percentToBps(d.maxInterestRate),
          defaultInterestRate: percentToBps(d.defaultInterestRate),
          minTenureMonths: parseInt(d.minTenureMonths),
          maxTenureMonths: parseInt(d.maxTenureMonths),
          minAmount: rupeesToPaise(d.minAmount),
          maxAmount: rupeesToPaise(d.maxAmount),
          penalRateAdditional: d.penalRateAdditional ? percentToBps(d.penalRateAdditional) : 200,
          prepaymentFeePercent: d.prepaymentFeePercent ? percentToBps(d.prepaymentFeePercent) : 0,
          processingFeePercent: d.processingFeePercent ? percentToBps(d.processingFeePercent) : 100,
          emiRounding: d.emiRounding,
          createdBy: user.id,
        },
      });

      await createAuditLogTx(tx, {
        companyId: user.companyId,
        userId: user.id,
        userEmail: user.email,
        action: "CREATE",
        entityType: "LoanProduct",
        entityId: product.id,
        after: { name: d.name, code: d.code },
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Unique constraint")) return { error: "Product code already exists" };
    return { error: msg };
  }

  redirect("/settings/loan-products");
}
