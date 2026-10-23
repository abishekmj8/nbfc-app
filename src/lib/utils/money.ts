/**
 * Money utilities.
 * All money is stored as integer paise (BigInt).
 * 1 rupee = 100 paise.
 * Display layer converts to rupees.
 */

/** Convert rupees (number) to paise (bigint). */
export function rupeesToPaise(rupees: number): bigint {
  return BigInt(Math.round(rupees * 100));
}

/** Convert paise (bigint) to rupees (number). */
export function paiseToRupees(paise: bigint): number {
  return Number(paise) / 100;
}

/**
 * Format paise as Indian rupee string.
 * e.g., 15000000n → "₹1,50,000.00"
 */
export function formatMoney(paise: bigint | number): string {
  const rupees = typeof paise === "bigint" ? paiseToRupees(paise) : Number(paise) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Format paise as number string without currency symbol.
 * e.g., 15000000n → "1,50,000.00"
 */
export function formatAmount(paise: bigint | number): string {
  const rupees = typeof paise === "bigint" ? paiseToRupees(paise) : Number(paise) / 100;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}
