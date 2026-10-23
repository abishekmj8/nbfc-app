import type { EmiInput, EmiSchedule, EmiScheduleRow, EmiRounding } from "./types";
import { daysInYear, dailyInterest, daysBetween } from "./day-count/actual-actual";

/**
 * Calculate the standard EMI using the reducing balance formula.
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 *
 * Uses floating-point for the formula, then converts to paise BigInt.
 * The last EMI is adjusted to clear the exact remaining balance.
 */
export function calculateEmi(
  principal: bigint,
  annualRateBps: number,
  tenureMonths: number,
  rounding: EmiRounding = "ROUND_UP_RUPEE"
): bigint {
  const P = Number(principal);
  const monthlyRate = annualRateBps / 10000 / 12;

  if (monthlyRate === 0) {
    // Zero-interest: simple division
    return roundEmi(BigInt(Math.ceil(P / tenureMonths)), rounding);
  }

  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (P * monthlyRate * factor) / (factor - 1);

  return roundEmi(BigInt(Math.round(emi)), rounding);
}

/**
 * Calculate EMI for flat-rate method.
 * Total interest = Principal × rate × tenure_in_years
 * EMI = (Principal + Total interest) / months
 */
export function calculateFlatRateEmi(
  principal: bigint,
  annualRateBps: number,
  tenureMonths: number,
  rounding: EmiRounding = "ROUND_UP_RUPEE"
): bigint {
  const P = Number(principal);
  const annualRate = annualRateBps / 10000;
  const tenureYears = tenureMonths / 12;
  const totalInterest = P * annualRate * tenureYears;
  const emi = (P + totalInterest) / tenureMonths;

  return roundEmi(BigInt(Math.round(emi)), rounding);
}

function roundEmi(emi: bigint, rounding: EmiRounding): bigint {
  if (rounding === "ROUND_UP_RUPEE") {
    // Round up to nearest rupee (100 paise)
    const remainder = emi % 100n;
    if (remainder === 0n) return emi;
    return emi + (100n - remainder);
  }
  // ROUND_NEAREST_PAISA — already rounded
  return emi;
}

/**
 * Generate the full EMI schedule for a reducing-balance loan.
 * Interest is calculated monthly on the opening balance.
 */
export function generateEmiSchedule(input: EmiInput): EmiSchedule {
  const { principal, annualRateBps, tenureMonths, startDate, interestMethod, emiRounding } = input;

  if (interestMethod === "FLAT_RATE") {
    return generateFlatRateSchedule(input);
  }

  const monthlyEmi = calculateEmi(principal, annualRateBps, tenureMonths, emiRounding);
  const rows: EmiScheduleRow[] = [];
  let balance = principal;
  let totalInterest = 0n;
  let totalPrincipal = 0n;

  for (let i = 1; i <= tenureMonths; i++) {
    const dueDate = addMonths(startDate, i);
    const openingBalance = balance;

    // Monthly interest calculation
    let interestForMonth: bigint;

    if (interestMethod === "DAILY_REDUCING") {
      // Calculate daily interest for each day in the month
      const periodStart = addMonths(startDate, i - 1);
      const periodEnd = dueDate;
      const days = daysBetween(periodStart, periodEnd);
      const year = periodStart.getFullYear();
      interestForMonth = dailyInterest(openingBalance, annualRateBps, year) * BigInt(days);
    } else {
      // MONTHLY_REDUCING: monthly interest on opening balance
      const monthlyRate = BigInt(annualRateBps);
      interestForMonth = (openingBalance * monthlyRate) / (10000n * 12n);
    }

    // Last EMI: adjust to clear exact balance
    const isLast = i === tenureMonths;
    let emi = isLast ? openingBalance + interestForMonth : monthlyEmi;
    let principalComponent = emi - interestForMonth;

    // Safety: principal component should not exceed balance
    if (principalComponent > openingBalance) {
      principalComponent = openingBalance;
      emi = principalComponent + interestForMonth;
    }

    const closingBalance = openingBalance - principalComponent;

    rows.push({
      installmentNumber: i,
      dueDate,
      openingBalance,
      emiAmount: emi,
      principalComponent,
      interestComponent: interestForMonth,
      closingBalance,
    });

    balance = closingBalance;
    totalInterest += interestForMonth;
    totalPrincipal += principalComponent;
  }

  return {
    rows,
    totalEmi: rows.reduce((sum, r) => sum + r.emiAmount, 0n),
    totalInterest,
    totalPrincipal,
    monthlyEmi,
  };
}

function generateFlatRateSchedule(input: EmiInput): EmiSchedule {
  const { principal, annualRateBps, tenureMonths, startDate, emiRounding } = input;

  const monthlyEmi = calculateFlatRateEmi(principal, annualRateBps, tenureMonths, emiRounding);
  const annualRate = annualRateBps / 10000;
  const tenureYears = tenureMonths / 12;
  const totalInterestNum = Number(principal) * annualRate * tenureYears;
  const monthlyInterest = BigInt(Math.round(totalInterestNum / tenureMonths));
  const monthlyPrincipal = monthlyEmi - monthlyInterest;

  const rows: EmiScheduleRow[] = [];
  let balance = principal;
  let totalInterest = 0n;
  let totalPrincipal = 0n;

  for (let i = 1; i <= tenureMonths; i++) {
    const dueDate = addMonths(startDate, i);
    const openingBalance = balance;
    const isLast = i === tenureMonths;

    const interest = isLast ? monthlyInterest : monthlyInterest;
    const princ = isLast ? openingBalance : monthlyPrincipal;
    const emi = princ + interest;
    const closingBalance = openingBalance - princ;

    rows.push({
      installmentNumber: i,
      dueDate,
      openingBalance,
      emiAmount: emi,
      principalComponent: princ,
      interestComponent: interest,
      closingBalance: closingBalance < 0n ? 0n : closingBalance,
    });

    balance = closingBalance < 0n ? 0n : closingBalance;
    totalInterest += interest;
    totalPrincipal += princ;
  }

  return {
    rows,
    totalEmi: rows.reduce((sum, r) => sum + r.emiAmount, 0n),
    totalInterest,
    totalPrincipal,
    monthlyEmi,
  };
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
