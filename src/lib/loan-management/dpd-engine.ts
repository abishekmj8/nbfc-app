import { prisma } from "@/lib/db/prisma";
import { daysBetween } from "@/lib/interest/day-count/actual-actual";

/**
 * Calculate DPD and update SMA/NPA classifications for all active loans.
 * Called by the daily cron job.
 */
export async function runDpdCalculation(): Promise<{
  processed: number;
  updatedToOverdue: number;
  updatedToNpa: number;
}> {
  const today = new Date();
  let processed = 0;
  let updatedToOverdue = 0;
  let updatedToNpa = 0;

  const activeLoans = await prisma.loanAccount.findMany({
    where: { status: { in: ["ACTIVE", "OVERDUE", "NPA"] } },
    include: {
      emiSchedule: {
        where: { status: { in: ["DUE", "OVERDUE", "PARTIALLY_PAID"] } },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  for (const loan of activeLoans) {
    processed++;

    // Find the oldest unpaid/partially paid EMI
    const oldestOverdue = loan.emiSchedule[0];
    if (!oldestOverdue) {
      // All EMIs paid — ensure status is ACTIVE
      if (loan.status !== "ACTIVE") {
        await prisma.loanAccount.update({
          where: { id: loan.id },
          data: { dpd: 0, status: "ACTIVE", smaClassification: null, npaClassification: null, npaDate: null },
        });
      }
      continue;
    }

    const dpd = daysBetween(oldestOverdue.dueDate, today);
    if (dpd <= 0) continue; // Not yet overdue

    // Update DPD on the EMI row
    for (const emi of loan.emiSchedule) {
      const emiDpd = daysBetween(emi.dueDate, today);
      if (emiDpd > 0) {
        await prisma.emiScheduleRow.update({
          where: { id: emi.id },
          data: { status: "OVERDUE", daysOverdue: emiDpd },
        });
      }
    }

    // Classify
    let smaClassification: string | null = null;
    let npaClassification: string | null = null;
    let newStatus = loan.status;

    if (dpd >= 1 && dpd <= 30) {
      smaClassification = "SMA_0";
      newStatus = "OVERDUE";
    } else if (dpd >= 31 && dpd <= 60) {
      smaClassification = "SMA_1";
      newStatus = "OVERDUE";
    } else if (dpd >= 61 && dpd <= 90) {
      smaClassification = "SMA_2";
      newStatus = "OVERDUE";
    } else if (dpd > 90) {
      // NPA classification
      smaClassification = null;
      newStatus = "NPA";

      const monthsAsNpa = Math.floor(dpd / 30);
      if (monthsAsNpa <= 12) {
        npaClassification = "SUB_STANDARD";
      } else if (monthsAsNpa <= 36) {
        npaClassification = "DOUBTFUL";
      } else {
        npaClassification = "LOSS";
      }
    }

    const npaDate = dpd > 90 && !loan.npaDate ? today : loan.npaDate;

    if (loan.status !== newStatus || loan.dpd !== dpd) {
      await prisma.loanAccount.update({
        where: { id: loan.id },
        data: { dpd, smaClassification, npaClassification, npaDate, status: newStatus },
      });

      if (newStatus === "OVERDUE" && loan.status === "ACTIVE") updatedToOverdue++;
      if (newStatus === "NPA" && loan.status !== "NPA") updatedToNpa++;
    }
  }

  return { processed, updatedToOverdue, updatedToNpa };
}

/**
 * Mark upcoming EMIs as DUE when their due date arrives.
 */
export async function markEmisDue(): Promise<number> {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const result = await prisma.emiScheduleRow.updateMany({
    where: {
      status: "UPCOMING",
      dueDate: { lte: today },
    },
    data: { status: "DUE" },
  });

  return result.count;
}
