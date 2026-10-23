/**
 * Convert a paise amount to Indian English words.
 * e.g., 15000000n → "Rupees One Lakh Fifty Thousand Only"
 *       723456n  → "Rupees Seven Thousand Two Hundred Thirty-Four and Fifty-Six Paise Only"
 */

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitWords(n: number): string {
  if (n < 20) return ones[n];
  const t = tens[Math.floor(n / 10)];
  const o = ones[n % 10];
  return o ? `${t}-${o}` : t;
}

function threeDigitWords(n: number): string {
  if (n === 0) return "";
  if (n < 100) return twoDigitWords(n);
  const h = ones[Math.floor(n / 100)];
  const remainder = n % 100;
  if (remainder === 0) return `${h} Hundred`;
  return `${h} Hundred ${twoDigitWords(remainder)}`;
}

/**
 * Convert a number to Indian English words.
 * Indian numbering: ones, thousands, lakhs, crores.
 */
function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  if (n < 0) return `Minus ${numberToWords(-n)}`;

  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;

  if (crore > 0) parts.push(`${threeDigitWords(crore)} Crore`);
  if (lakh > 0) parts.push(`${twoDigitWords(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${twoDigitWords(thousand)} Thousand`);
  if (hundred > 0) parts.push(threeDigitWords(hundred));

  return parts.join(" ");
}

/**
 * Convert paise (bigint) to Indian English money words.
 */
export function moneyInWords(paise: bigint): string {
  const totalPaise = Number(paise);
  const rupees = Math.floor(totalPaise / 100);
  const paiseRemainder = totalPaise % 100;

  if (rupees === 0 && paiseRemainder === 0) {
    return "Rupees Zero Only";
  }

  let result = `Rupees ${numberToWords(rupees)}`;

  if (paiseRemainder > 0) {
    result += ` and ${numberToWords(paiseRemainder)} Paise`;
  }

  return `${result} Only`;
}
