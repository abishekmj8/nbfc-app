"use server";

import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/service";

/**
 * Calculate DSA commission for a disbursed loan.
 */
export function calculateDsaCommission(params: {
  loanAmount: bigint; // paise
  commissionBps: number; // basis points (100 = 1%)
  tdsRateBps: number; // basis points (500 = 5%)
}): {
  commissionAmount: bigint;
  gstOnCommission: bigint;
  tdsDeducted: bigint;
  netPayout: bigint;
} {
  const commissionAmount = (params.loanAmount * BigInt(params.commissionBps)) / 10000n;
  const gstOnCommission = (commissionAmount * 1800n) / 10000n; // 18% GST
  const grossPayout = commissionAmount + gstOnCommission;
  const tdsDeducted = (commissionAmount * BigInt(params.tdsRateBps)) / 10000n;
  const netPayout = grossPayout - tdsDeducted;

  return { commissionAmount, gstOnCommission, tdsDeducted, netPayout };
}

/**
 * Create a DSA payout record on loan disbursement.
 */
export async function createDsaPayout(params: {
  dsaPartnerId: string;
  loanAccountId: string;
  loanAmount: bigint;
  companyId: string;
  userId: string;
  userEmail: string;
}) {
  const partner = await prisma.dsaPartner.findFirst({
    where: { id: params.dsaPartnerId, companyId: params.companyId },
  });
  if (!partner) return null;

  const calc = calculateDsaCommission({
    loanAmount: params.loanAmount,
    commissionBps: partner.commissionPct,
    tdsRateBps: partner.tdsRatePct,
  });

  const payout = await prisma.dsaPayout.create({
    data: {
      dsaPartnerId: params.dsaPartnerId,
      loanAccountId: params.loanAccountId,
      loanAmount: params.loanAmount,
      commissionAmount: calc.commissionAmount,
      gstOnCommission: calc.gstOnCommission,
      tdsDeducted: calc.tdsDeducted,
      netPayout: calc.netPayout,
    },
  });

  await createAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    userEmail: params.userEmail,
    action: "CREATE",
    entityType: "DsaPayout",
    entityId: payout.id,
    after: {
      commission: calc.commissionAmount.toString(),
      net: calc.netPayout.toString(),
    },
  });

  return payout;
}

/**
 * Check if a loan is within clawback period and claw back commission.
 */
export async function checkClawback(
  loanAccountId: string,
  defaultDate: Date,
  companyId: string,
  userId: string,
  userEmail: string
): Promise<boolean> {
  const payout = await prisma.dsaPayout.findFirst({
    where: { loanAccountId, status: { in: ["CALCULATED", "APPROVED", "PAID"] } },
    include: { dsaPartner: true },
  });

  if (!payout || payout.clawedBack) return false;

  const disbursedLoan = await prisma.loanAccount.findFirst({
    where: { id: loanAccountId },
  });
  if (!disbursedLoan) return false;

  const monthsSinceDisbursement = Math.floor(
    (defaultDate.getTime() - disbursedLoan.disbursedAt.getTime()) / (30 * 86_400_000)
  );

  if (monthsSinceDisbursement <= payout.dsaPartner.clawbackMonths) {
    await prisma.dsaPayout.update({
      where: { id: payout.id },
      data: {
        clawedBack: true,
        clawbackReason: `Loan defaulted within ${payout.dsaPartner.clawbackMonths} months`,
        status: "CLAWED_BACK",
      },
    });

    await createAuditLog({
      companyId, userId, userEmail,
      action: "UPDATE",
      entityType: "DsaPayout",
      entityId: payout.id,
      after: { clawedBack: true, monthsSinceDisbursement },
    });

    return true;
  }

  return false;
}
