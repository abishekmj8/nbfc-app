import { describe, it, expect } from "vitest";
import { calculatePenalCharge } from "../penal-calculator";

describe("calculatePenalCharge", () => {
  it("calculates penal interest on overdue amount", () => {
    // Rs 10,000 overdue at 2% penal for 30 days in a non-leap year
    const result = calculatePenalCharge(
      1_000_000n, // Rs 10,000 in paise
      200,        // 2% = 200 basis points
      30,         // 30 days overdue
      2026        // non-leap year
    );

    // Expected: 10000 × 0.02 × 30/365 ≈ Rs 16.44
    expect(result.penalAmount).toBeGreaterThan(1600n);
    expect(result.penalAmount).toBeLessThan(1700n);
    expect(result.overdueAmount).toBe(1_000_000n);
    expect(result.daysInYear).toBe(365);
  });

  it("calculates correctly for leap year", () => {
    const result = calculatePenalCharge(1_000_000n, 200, 30, 2028);
    expect(result.daysInYear).toBe(366);
    // Slightly less than non-leap year (366 denominator)
  });

  it("returns zero for zero days overdue", () => {
    const result = calculatePenalCharge(1_000_000n, 200, 0, 2026);
    expect(result.penalAmount).toBe(0n);
  });

  it("returns zero for zero overdue amount", () => {
    const result = calculatePenalCharge(0n, 200, 30, 2026);
    expect(result.penalAmount).toBe(0n);
  });
});
