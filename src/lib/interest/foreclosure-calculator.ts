import { dailyInterest, daysInYear, daysBetween } from "./day-count/actual-actual";
import type { ForeclosureResult } from "./types";

/**
 * Calculate foreclosure (prepayment) amount.
 *
 * Foreclosure = Outstanding principal
 *             + Accrued interest (till foreclosure date)
 *             + Penal charges (if any)
 *             + Foreclosure fee
 */
export function calculateForeclosure(params: {
  outstandingPrincipal: bigint;
  annualRateBps: number;
  lastPaymentDate: Date;
  foreclosureDate: Date;
  penalCharges: bigint;
  foreclosureFeePercent: number; // basis points
}): ForeclosureResult {
  const {
    outstandingPrincipal,
    annualRateBps,
    lastPaymentDate,
    foreclosureDate,
    penalCharges,
    foreclosureFeePercent,
  } = params;

  // Accrued interest from last payment to foreclosure date
  const days = daysBetween(lastPaymentDate, foreclosureDate);
  const year = foreclosureDate.getFullYear();
  const daily = dailyInterest(outstandingPrincipal, annualRateBps, year);
  const accruedInterest = daily * BigInt(Math.max(0, days));

  // Foreclosure fee on outstanding principal
  const foreclosureFee =
    foreclosureFeePercent > 0
      ? (outstandingPrincipal * BigInt(foreclosureFeePercent) + 5000n) / 10000n
      : 0n;

  const totalPayable = outstandingPrincipal + accruedInterest + penalCharges + foreclosureFee;

  return {
    outstandingPrincipal,
    accruedInterest,
    penalCharges,
    foreclosureFee,
    totalPayable,
  };
}
