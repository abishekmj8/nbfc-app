import { daysInYear } from "./day-count/actual-actual";
import type { PenalCalculation } from "./types";

/**
 * Calculate penal charges on overdue amount.
 * Per RBI: applied on overdue amount only, NEVER capitalized.
 *
 * Penal = overdueAmount × penalRate × daysOverdue / daysInYear
 */
export function calculatePenalCharge(
  overdueAmount: bigint,
  penalRateBps: number,
  daysOverdue: number,
  year: number
): PenalCalculation {
  const days = daysInYear(year);
  const numerator = overdueAmount * BigInt(penalRateBps) * BigInt(daysOverdue);
  const denominator = BigInt(10000 * days);
  const penalAmount = (numerator + denominator / 2n) / denominator;

  return {
    overdueAmount,
    penalRateBps,
    daysOverdue,
    daysInYear: days,
    penalAmount,
  };
}
