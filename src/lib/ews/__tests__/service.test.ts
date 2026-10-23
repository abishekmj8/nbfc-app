import { describe, it, expect } from "vitest";
import { calculateStressScore } from "../service";

describe("EWS stress scoring", () => {
  it("returns GREEN for healthy loan", () => {
    const result = calculateStressScore({
      dpd: 0, bounceCount: 0, partialPayments: 0,
    });
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.riskBucket).toBe("GREEN");
  });

  it("returns YELLOW for moderate stress", () => {
    const result = calculateStressScore({
      dpd: 20, bounceCount: 2, partialPayments: 1,
      creditScoreDrop: 25,
    });
    expect(result.score).toBeGreaterThan(25);
    expect(result.score).toBeLessThanOrEqual(50);
    expect(result.riskBucket).toBe("YELLOW");
  });

  it("returns ORANGE or RED for significant stress", () => {
    const result = calculateStressScore({
      dpd: 70, bounceCount: 3, partialPayments: 2,
      creditScoreDrop: 55, otherOverdueAccounts: 1,
      balanceDrop: true,
    });
    expect(result.score).toBeGreaterThan(50);
    expect(["ORANGE", "RED"]).toContain(result.riskBucket);
  });

  it("returns RED for severe stress", () => {
    const result = calculateStressScore({
      dpd: 95, bounceCount: 4, partialPayments: 3,
      creditScoreDrop: 60, otherOverdueAccounts: 2,
      balanceDrop: true, incomeDisrupted: true, unreachable: true,
    });
    expect(result.score).toBeGreaterThan(75);
    expect(result.riskBucket).toBe("RED");
  });

  it("score never exceeds 100", () => {
    const result = calculateStressScore({
      dpd: 200, bounceCount: 20, partialPayments: 20,
      creditScoreDrop: 200, otherOverdueAccounts: 10,
      balanceDrop: true, incomeDisrupted: true, unreachable: true,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns component scores", () => {
    const result = calculateStressScore({
      dpd: 60, bounceCount: 2, partialPayments: 1,
    });
    expect(result.components).toHaveProperty("repayment");
    expect(result.components).toHaveProperty("bureau");
    expect(result.components).toHaveProperty("cashFlow");
    expect(result.components).toHaveProperty("behavioral");
  });
});
