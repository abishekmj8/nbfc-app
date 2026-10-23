import { describe, it, expect } from "vitest";
import { calculateForeclosure } from "../foreclosure-calculator";

describe("calculateForeclosure", () => {
  it("calculates foreclosure amount with all components", () => {
    const result = calculateForeclosure({
      outstandingPrincipal: 50_000_000n, // Rs 5,00,000
      annualRateBps: 1200,               // 12%
      lastPaymentDate: new Date("2026-10-01"),
      foreclosureDate: new Date("2026-10-15"),
      penalCharges: 50_000n,             // Rs 500
      foreclosureFeePercent: 200,        // 2%
    });

    expect(result.outstandingPrincipal).toBe(50_000_000n);
    // 14 days of interest on 5L at 12%
    expect(result.accruedInterest).toBeGreaterThan(0n);
    expect(result.penalCharges).toBe(50_000n);
    // Foreclosure fee: 5L × 2% = Rs 10,000
    expect(result.foreclosureFee).toBeGreaterThan(990_000n);
    expect(result.foreclosureFee).toBeLessThan(1_010_000n);
    // Total should be sum of all
    expect(result.totalPayable).toBe(
      result.outstandingPrincipal +
      result.accruedInterest +
      result.penalCharges +
      result.foreclosureFee
    );
  });

  it("works with zero penal charges and zero foreclosure fee", () => {
    const result = calculateForeclosure({
      outstandingPrincipal: 10_000_000n,
      annualRateBps: 1200,
      lastPaymentDate: new Date("2026-10-01"),
      foreclosureDate: new Date("2026-10-01"), // Same day
      penalCharges: 0n,
      foreclosureFeePercent: 0,
    });

    expect(result.accruedInterest).toBe(0n);
    expect(result.penalCharges).toBe(0n);
    expect(result.foreclosureFee).toBe(0n);
    expect(result.totalPayable).toBe(10_000_000n);
  });
});
