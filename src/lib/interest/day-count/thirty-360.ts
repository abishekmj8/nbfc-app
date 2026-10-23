/**
 * 30/360 day-count convention.
 * Every month = 30 days, year = 360 days.
 * Not used in Indian NBFC regulation but supported for legacy.
 */

export function dailyInterest30360(
  principal: bigint,
  annualRateBps: number
): bigint {
  const numerator = principal * BigInt(annualRateBps);
  const denominator = BigInt(10000 * 360);
  return (numerator + denominator / 2n) / denominator;
}
