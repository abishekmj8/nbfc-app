/**
 * All money values are in paise (bigint).
 * All rates are in basis points (integer). 1200 = 12.00%.
 */

export interface EmiInput {
  principal: bigint;          // paise
  annualRateBps: number;      // basis points (1200 = 12%)
  tenureMonths: number;
  startDate: Date;
  interestMethod: InterestMethod;
  dayCountConvention: DayCountConvention;
  emiRounding: EmiRounding;
}

export interface EmiScheduleRow {
  installmentNumber: number;
  dueDate: Date;
  openingBalance: bigint;     // paise
  emiAmount: bigint;          // paise
  principalComponent: bigint; // paise
  interestComponent: bigint;  // paise
  closingBalance: bigint;     // paise
}

export interface EmiSchedule {
  rows: EmiScheduleRow[];
  totalEmi: bigint;           // sum of all EMIs
  totalInterest: bigint;      // sum of all interest
  totalPrincipal: bigint;     // = original principal
  monthlyEmi: bigint;         // standard EMI (last may differ)
}

export interface ForeclosureResult {
  outstandingPrincipal: bigint;
  accruedInterest: bigint;
  penalCharges: bigint;
  foreclosureFee: bigint;
  totalPayable: bigint;
}

export interface PenalCalculation {
  overdueAmount: bigint;
  penalRateBps: number;
  daysOverdue: number;
  daysInYear: number;
  penalAmount: bigint;
}

export type InterestMethod = "DAILY_REDUCING" | "MONTHLY_REDUCING" | "FLAT_RATE";
export type DayCountConvention = "ACTUAL_ACTUAL" | "THIRTY_360";
export type EmiRounding = "ROUND_UP_RUPEE" | "ROUND_NEAREST_PAISA";
