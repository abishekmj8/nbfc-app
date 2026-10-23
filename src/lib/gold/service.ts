"use server";

import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/service";

const LTV_CAP_BPS = 7500; // 75% — RBI mandate

/**
 * Calculate gold valuation and max loan amount.
 */
export function calculateGoldValuation(params: {
  grossWeightMg: number;
  purity: number; // karat (22, 24)
  stoneDeductionMg: number;
  ratePerGramPaise: bigint;
  ltvBps?: number;
}) {
  const netWeightMg = params.grossWeightMg - params.stoneDeductionMg;
  const netWeightGrams = netWeightMg / 1000;
  const purityFraction = params.purity / 24;

  // Valuation = netWeight (grams) × rate per gram × purity fraction
  const valuationAmount = BigInt(Math.round(netWeightGrams * Number(params.ratePerGramPaise) * purityFraction));

  const ltv = params.ltvBps ?? LTV_CAP_BPS;
  const maxLoanAmount = (valuationAmount * BigInt(ltv)) / 10000n;

  return {
    netWeightMg,
    valuationAmount,
    maxLoanAmount,
    ltvBps: ltv,
  };
}

/**
 * Create a gold appraisal record.
 */
export async function createGoldAppraisal(params: {
  companyId: string;
  loanApplicationId?: string;
  itemDescription: string;
  grossWeightMg: number;
  purity: number;
  stoneDeductionMg: number;
  ratePerGramPaise: bigint;
  userId: string;
  userEmail: string;
}) {
  const valuation = calculateGoldValuation({
    grossWeightMg: params.grossWeightMg,
    purity: params.purity,
    stoneDeductionMg: params.stoneDeductionMg,
    ratePerGramPaise: params.ratePerGramPaise,
  });

  const appraisal = await prisma.goldAppraisal.create({
    data: {
      companyId: params.companyId,
      loanApplicationId: params.loanApplicationId,
      itemDescription: params.itemDescription,
      grossWeight: params.grossWeightMg,
      purity: params.purity,
      stoneDeduction: params.stoneDeductionMg,
      netWeight: valuation.netWeightMg,
      ratePerGram: params.ratePerGramPaise,
      valuationAmount: valuation.valuationAmount,
      ltvPercent: valuation.ltvBps,
      maxLoanAmount: valuation.maxLoanAmount,
      appraisedBy: params.userId,
    },
  });

  await createAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    userEmail: params.userEmail,
    action: "CREATE",
    entityType: "GoldAppraisal",
    entityId: appraisal.id,
    after: { valuation: valuation.valuationAmount.toString(), maxLoan: valuation.maxLoanAmount.toString() },
  });

  return appraisal;
}

/**
 * Check auction eligibility and validate 2-week notice period.
 */
export function validateAuctionNotice(noticeDate: Date, auctionDate: Date): {
  valid: boolean;
  error?: string;
} {
  const diffMs = auctionDate.getTime() - noticeDate.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays < 14) {
    return { valid: false, error: `Auction date must be at least 14 days after notice. Current gap: ${diffDays} days.` };
  }
  return { valid: true };
}
