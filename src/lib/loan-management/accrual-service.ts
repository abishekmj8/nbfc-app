import { prisma } from "@/lib/db/prisma";
import { dailyInterest, daysInYear } from "@/lib/interest/day-count/actual-actual";

/**
 * Run daily interest accrual for all active loans.
 * For NPA loans, interest is not recognized on accrual basis.
 */
export async function runDailyAccrual(): Promise<{
  processed: number;
  totalInterestAccrued: bigint;
}> {
  const today = new Date();
  let totalInterestAccrued = 0n;

  const activeLoans = await prisma.loanAccount.findMany({
    where: { status: { in: ["ACTIVE", "OVERDUE"] } },
    select: {
      id: true,
      outstandingPrincipal: true,
      interestRateBps: true,
      status: true,
    },
  });

  for (const loan of activeLoans) {
    // NPA loans: do not accrue (recognized on cash basis only)
    // This function only runs for ACTIVE and OVERDUE
    const year = today.getFullYear();
    const interest = dailyInterest(loan.outstandingPrincipal, loan.interestRateBps, year);
    totalInterestAccrued += interest;
  }

  return {
    processed: activeLoans.length,
    totalInterestAccrued,
  };
}
