"use server";

import { prisma } from "@/lib/db/prisma";

const SCORE_WEIGHTS = {
  repayment: 40,
  bureau: 25,
  cashFlow: 25,
  behavioral: 10,
};

/**
 * Calculate composite EWS stress score for a loan.
 * Score 0-100: higher = more stress.
 */
export function calculateStressScore(params: {
  dpd: number;
  bounceCount: number;
  partialPayments: number;
  creditScoreDrop?: number;
  otherOverdueAccounts?: number;
  balanceDrop?: boolean;
  incomeDisrupted?: boolean;
  unreachable?: boolean;
}): { score: number; riskBucket: string; components: Record<string, number> } {
  // Repayment score (0-100)
  let repaymentScore = 0;
  if (params.dpd > 90) repaymentScore = 100;
  else if (params.dpd > 60) repaymentScore = 80;
  else if (params.dpd > 30) repaymentScore = 60;
  else if (params.dpd > 0) repaymentScore = 30;
  repaymentScore += Math.min(params.bounceCount * 15, 40);
  repaymentScore += Math.min(params.partialPayments * 10, 20);
  repaymentScore = Math.min(repaymentScore, 100);

  // Bureau score
  let bureauScore = 0;
  if (params.creditScoreDrop && params.creditScoreDrop > 50) bureauScore += 40;
  else if (params.creditScoreDrop && params.creditScoreDrop > 20) bureauScore += 20;
  if (params.otherOverdueAccounts && params.otherOverdueAccounts > 0) bureauScore += 30;
  bureauScore = Math.min(bureauScore, 100);

  // Cash flow score
  let cashFlowScore = 0;
  if (params.balanceDrop) cashFlowScore += 50;
  if (params.incomeDisrupted) cashFlowScore += 50;
  cashFlowScore = Math.min(cashFlowScore, 100);

  // Behavioral score
  let behavioralScore = 0;
  if (params.unreachable) behavioralScore += 60;
  behavioralScore = Math.min(behavioralScore, 100);

  // Weighted composite
  const score = Math.round(
    (repaymentScore * SCORE_WEIGHTS.repayment +
      bureauScore * SCORE_WEIGHTS.bureau +
      cashFlowScore * SCORE_WEIGHTS.cashFlow +
      behavioralScore * SCORE_WEIGHTS.behavioral) / 100
  );

  // Risk bucket
  let riskBucket: string;
  if (score <= 25) riskBucket = "GREEN";
  else if (score <= 50) riskBucket = "YELLOW";
  else if (score <= 75) riskBucket = "ORANGE";
  else riskBucket = "RED";

  return {
    score,
    riskBucket,
    components: {
      repayment: repaymentScore,
      bureau: bureauScore,
      cashFlow: cashFlowScore,
      behavioral: behavioralScore,
    },
  };
}

/**
 * Run EWS processing for all active loans.
 * Creates alerts for loans that cross severity thresholds.
 */
export async function runEwsProcessing(companyId: string): Promise<{
  processed: number;
  alertsCreated: number;
}> {
  const loans = await prisma.loanAccount.findMany({
    where: { companyId, status: { in: ["ACTIVE", "OVERDUE"] } },
    include: {
      payments: {
        where: { isBounced: true },
        select: { id: true },
      },
      emiSchedule: {
        where: { status: "PARTIALLY_PAID" },
        select: { id: true },
      },
    },
  });

  let alertsCreated = 0;

  for (const loan of loans) {
    const { score, riskBucket, components } = calculateStressScore({
      dpd: loan.dpd,
      bounceCount: loan.payments.length,
      partialPayments: loan.emiSchedule.length,
    });

    // Upsert EWS score
    const existingScore = await prisma.ewsScore.findFirst({
      where: { loanAccountId: loan.id },
      orderBy: { calculatedAt: "desc" },
    });

    const trend = existingScore
      ? score > existingScore.score ? "DETERIORATING"
        : score < existingScore.score ? "IMPROVING"
        : "STABLE"
      : undefined;

    await prisma.ewsScore.create({
      data: {
        loanAccountId: loan.id,
        score,
        riskBucket,
        components: JSON.stringify(components),
        previousScore: existingScore?.score,
        trend,
      },
    });

    // Create alert if score is in ORANGE or RED and didn't already have one today
    if (score > 50) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const existingAlert = await prisma.ewsAlert.findFirst({
        where: {
          loanAccountId: loan.id,
          createdAt: { gte: todayStart },
        },
      });

      if (!existingAlert) {
        const severity = score > 75 ? "CRITICAL" : "HIGH";
        await prisma.ewsAlert.create({
          data: {
            companyId,
            loanAccountId: loan.id,
            severity,
            signalType: `Stress score ${score}/100 (${riskBucket})`,
            signalData: JSON.stringify({ score, riskBucket, components, dpd: loan.dpd }),
          },
        });
        alertsCreated++;
      }
    }
  }

  return { processed: loans.length, alertsCreated };
}
