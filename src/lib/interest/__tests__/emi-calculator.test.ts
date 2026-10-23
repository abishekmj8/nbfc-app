import { describe, it, expect } from "vitest";
import { calculateEmi, calculateFlatRateEmi, generateEmiSchedule } from "../emi-calculator";
import type { EmiInput } from "../types";

describe("calculateEmi", () => {
  it("calculates EMI for Rs 1,00,000 at 12% for 12 months", () => {
    // Known value: EMI ≈ Rs 8,884.88 → rounded up to Rs 8,885 (88_85_00 paise) or 8900
    const emi = calculateEmi(10_000_000n, 1200, 12, "ROUND_UP_RUPEE");
    // EMI should be around 888488 paise = Rs 8884.88, rounded up to nearest 100 paise
    expect(emi).toBeGreaterThan(888_000n);
    expect(emi).toBeLessThan(900_000n);
    // Must be divisible by 100 (rounded to rupee)
    expect(emi % 100n).toBe(0n);
  });

  it("calculates EMI for Rs 5,00,000 at 15% for 24 months", () => {
    const emi = calculateEmi(50_000_000n, 1500, 24, "ROUND_UP_RUPEE");
    // Known: ~Rs 24,244/month
    expect(emi).toBeGreaterThan(2_400_000n);
    expect(emi).toBeLessThan(2_450_000n);
    expect(emi % 100n).toBe(0n);
  });

  it("handles zero interest rate", () => {
    const emi = calculateEmi(12_000_000n, 0, 12, "ROUND_UP_RUPEE");
    // Rs 12,00,000 / 12 = Rs 1,00,000
    expect(emi).toBe(1_000_000n);
  });

  it("rounds to nearest paisa when configured", () => {
    const emi = calculateEmi(10_000_000n, 1200, 12, "ROUND_NEAREST_PAISA");
    // Should not be rounded to 100
    expect(emi).toBeGreaterThan(880_000n);
  });
});

describe("calculateFlatRateEmi", () => {
  it("calculates flat rate EMI", () => {
    // Rs 1,00,000 at 12% flat for 12 months
    // Total interest = 1,00,000 × 12% × 1 = 12,000
    // EMI = (1,00,000 + 12,000) / 12 = 9,333.33 → rounded up
    const emi = calculateFlatRateEmi(10_000_000n, 1200, 12, "ROUND_UP_RUPEE");
    expect(emi).toBeGreaterThan(930_000n);
    expect(emi).toBeLessThan(940_000n);
  });
});

describe("generateEmiSchedule", () => {
  const baseInput: EmiInput = {
    principal: 10_000_000n, // Rs 1,00,000
    annualRateBps: 1200,    // 12%
    tenureMonths: 12,
    startDate: new Date("2026-01-01"),
    interestMethod: "DAILY_REDUCING",
    dayCountConvention: "ACTUAL_ACTUAL",
    emiRounding: "ROUND_UP_RUPEE",
  };

  it("generates correct number of rows", () => {
    const schedule = generateEmiSchedule(baseInput);
    expect(schedule.rows.length).toBe(12);
  });

  it("first row opens with full principal", () => {
    const schedule = generateEmiSchedule(baseInput);
    expect(schedule.rows[0].openingBalance).toBe(10_000_000n);
    expect(schedule.rows[0].installmentNumber).toBe(1);
  });

  it("last row closes at zero balance", () => {
    const schedule = generateEmiSchedule(baseInput);
    const lastRow = schedule.rows[schedule.rows.length - 1];
    expect(lastRow.closingBalance).toBe(0n);
  });

  it("total principal equals original principal", () => {
    const schedule = generateEmiSchedule(baseInput);
    expect(schedule.totalPrincipal).toBe(10_000_000n);
  });

  it("each row: EMI = principal + interest", () => {
    const schedule = generateEmiSchedule(baseInput);
    for (const row of schedule.rows) {
      expect(row.emiAmount).toBe(row.principalComponent + row.interestComponent);
    }
  });

  it("closing balance decreases monotonically", () => {
    const schedule = generateEmiSchedule(baseInput);
    for (let i = 1; i < schedule.rows.length; i++) {
      expect(schedule.rows[i].closingBalance).toBeLessThan(
        schedule.rows[i - 1].closingBalance
      );
    }
  });

  it("interest component decreases over time (reducing balance)", () => {
    const schedule = generateEmiSchedule(baseInput);
    // First vs second-to-last (not last, which is adjusted)
    expect(schedule.rows[0].interestComponent).toBeGreaterThan(
      schedule.rows[schedule.rows.length - 2].interestComponent
    );
  });

  it("principal component increases over time (reducing balance)", () => {
    const schedule = generateEmiSchedule(baseInput);
    expect(schedule.rows[0].principalComponent).toBeLessThan(
      schedule.rows[schedule.rows.length - 2].principalComponent
    );
  });

  it("works for monthly reducing balance", () => {
    const schedule = generateEmiSchedule({
      ...baseInput,
      interestMethod: "MONTHLY_REDUCING",
    });
    expect(schedule.rows.length).toBe(12);
    expect(schedule.totalPrincipal).toBe(10_000_000n);
    const lastRow = schedule.rows[schedule.rows.length - 1];
    expect(lastRow.closingBalance).toBe(0n);
  });

  it("works for flat rate", () => {
    const schedule = generateEmiSchedule({
      ...baseInput,
      interestMethod: "FLAT_RATE",
    });
    expect(schedule.rows.length).toBe(12);
    // Flat rate: all interest components should be roughly equal
    const interests = schedule.rows.slice(0, -1).map((r) => r.interestComponent);
    const first = interests[0];
    for (const interest of interests) {
      expect(interest).toBe(first); // Flat rate = equal interest
    }
  });

  it("handles 360-month tenure without rounding overflow", () => {
    const schedule = generateEmiSchedule({
      ...baseInput,
      principal: 500_000_000n, // Rs 50,00,000
      tenureMonths: 360,       // 30 years
      annualRateBps: 900,      // 9%
    });
    expect(schedule.rows.length).toBe(360);
    const lastRow = schedule.rows[schedule.rows.length - 1];
    expect(lastRow.closingBalance).toBe(0n);
    expect(schedule.totalPrincipal).toBe(500_000_000n);
  });

  it("handles leap year correctly", () => {
    const schedule = generateEmiSchedule({
      ...baseInput,
      startDate: new Date("2028-01-01"), // 2028 is a leap year
    });
    expect(schedule.rows.length).toBe(12);
    expect(schedule.totalPrincipal).toBe(10_000_000n);
  });
});
