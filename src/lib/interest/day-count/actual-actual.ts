/**
 * Actual/Actual day-count convention (RBI mandated default).
 * Daily rate = Annual rate / Actual days in the year (365 or 366).
 */

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 86_400_000;
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / msPerDay);
}

/**
 * Calculate daily interest for a given principal and annual rate.
 * Returns interest in paise (rounded to nearest paisa, half-up).
 */
export function dailyInterest(
  principal: bigint,
  annualRateBps: number,
  year: number
): bigint {
  // principal * (rate/10000) / daysInYear
  // Use integer math: principal * annualRateBps / (10000 * daysInYear)
  const days = daysInYear(year);
  const numerator = principal * BigInt(annualRateBps);
  const denominator = BigInt(10000 * days);
  // Round half-up
  return (numerator + denominator / 2n) / denominator;
}
