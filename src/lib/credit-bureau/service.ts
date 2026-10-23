"use server";

import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/service";
import { MockBureauAdapter } from "./mock-adapter";
import type { Bureau, BureauAdapter, BureauPullResponse } from "./types";
import { encrypt } from "@/lib/crypto/encrypt";

function getAdapter(_bureau: Bureau): BureauAdapter {
  // TODO: Return real adapter based on config (Razorpay, FinBox, etc.)
  // For now, always return mock
  return new MockBureauAdapter();
}

/**
 * Pull a credit report for a customer.
 * Requires valid consent and records the pull in the database.
 */
export async function pullCreditReport(params: {
  companyId: string;
  customerId: string;
  loanApplicationId: string;
  bureau: Bureau;
  pullType: "HARD" | "SOFT";
  userId: string;
  userEmail: string;
}): Promise<{ success: boolean; score?: number; error?: string }> {
  const { companyId, customerId, loanApplicationId, bureau, pullType, userId, userEmail } = params;

  // Verify consent exists
  const consent = await prisma.consentRecord.findFirst({
    where: {
      customerId,
      consentType: "CREDIT_BUREAU_PULL",
      isWithdrawn: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  if (!consent) {
    return { success: false, error: "No valid credit bureau consent found for this customer" };
  }

  // Get customer details for the pull
  const customer = await prisma.customer.findFirst({
    where: { id: customerId },
    include: { identities: true },
  });

  if (!customer) {
    return { success: false, error: "Customer not found" };
  }

  const panIdentity = customer.identities.find((i) => i.documentType === "PAN");

  const adapter = getAdapter(bureau);

  let response: BureauPullResponse;
  try {
    response = await adapter.pullReport({
      customerId,
      customerName: `${customer.firstName} ${customer.lastName ?? ""}`.trim(),
      pan: panIdentity?.maskedNumber ?? undefined,
      phone: customer.phone,
      consentId: consent.id,
      bureau,
      pullType,
    });
  } catch (e) {
    return { success: false, error: `Bureau pull failed: ${e instanceof Error ? e.message : "Unknown error"}` };
  }

  // Update the credit appraisal if it exists
  if (response.success && response.score) {
    await prisma.creditAppraisal.updateMany({
      where: { loanApplicationId },
      data: {
        creditScore: response.score,
        updatedAt: new Date(),
      },
    });

    // If no appraisal exists, create one
    const existing = await prisma.creditAppraisal.findUnique({
      where: { loanApplicationId },
    });

    if (!existing) {
      const riskCategory = response.score >= 750 ? "LOW" : response.score >= 650 ? "MEDIUM" : "HIGH";
      await prisma.creditAppraisal.create({
        data: {
          loanApplicationId,
          creditScore: response.score,
          riskCategory,
          recommendation: riskCategory === "LOW" ? "APPROVE" : riskCategory === "MEDIUM" ? "REFER" : "REJECT",
          appraisedBy: userId,
          appraisedAt: new Date(),
        },
      });
    }
  }

  await createAuditLog({
    companyId,
    userId,
    userEmail,
    action: "CREDIT_PULL",
    entityType: "CreditBureau",
    entityId: customerId,
    after: {
      bureau,
      pullType,
      score: response.score,
      success: response.success,
      provider: adapter.getName(),
    },
  });

  return {
    success: response.success,
    score: response.score,
    error: response.error,
  };
}
