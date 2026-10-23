"use server";

import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/service";

/**
 * Calculate co-lending split for a loan.
 */
export function calculateCoLendingSplit(
  totalAmount: bigint,
  nbfcShareBps: number // basis points (2000 = 20%)
): { nbfcAmount: bigint; partnerAmount: bigint } {
  const nbfcAmount = (totalAmount * BigInt(nbfcShareBps)) / 10000n;
  const partnerAmount = totalAmount - nbfcAmount;
  return { nbfcAmount, partnerAmount };
}

/**
 * Calculate payment split for a co-lent loan.
 */
export function splitPayment(
  paymentAmount: bigint,
  nbfcShareBps: number
): { nbfcShare: bigint; partnerShare: bigint } {
  const nbfcShare = (paymentAmount * BigInt(nbfcShareBps)) / 10000n;
  const partnerShare = paymentAmount - nbfcShare;
  return { nbfcShare, partnerShare };
}

/**
 * Create a co-lending arrangement for a loan.
 */
export async function createCoLendingLoan(params: {
  loanAccountId: string;
  partnerId: string;
  model: "CLM1" | "LOAN_ASSIGNMENT";
  totalAmount: bigint;
  nbfcShareBps: number;
  companyId: string;
  userId: string;
  userEmail: string;
}) {
  const { nbfcAmount, partnerAmount } = calculateCoLendingSplit(
    params.totalAmount,
    params.nbfcShareBps
  );

  const coLoan = await prisma.coLendingLoan.create({
    data: {
      loanAccountId: params.loanAccountId,
      partnerId: params.partnerId,
      model: params.model,
      nbfcSharePct: params.nbfcShareBps,
      partnerSharePct: 10000 - params.nbfcShareBps,
      nbfcAmount,
      partnerAmount,
    },
  });

  await createAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    userEmail: params.userEmail,
    action: "CREATE",
    entityType: "CoLendingLoan",
    entityId: coLoan.id,
    after: {
      model: params.model,
      nbfcAmount: nbfcAmount.toString(),
      partnerAmount: partnerAmount.toString(),
    },
  });

  return coLoan;
}
