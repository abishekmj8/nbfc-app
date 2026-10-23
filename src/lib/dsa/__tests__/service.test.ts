import { describe, it, expect } from "vitest";
import { calculateDsaCommission } from "../service";

describe("DSA commission", () => {
  it("calculates commission with GST and TDS", () => {
    // 1% commission on Rs 5,00,000, 5% TDS
    const result = calculateDsaCommission({
      loanAmount: 50_000_000n, // Rs 5,00,000
      commissionBps: 100, // 1%
      tdsRateBps: 500, // 5%
    });

    expect(result.commissionAmount).toBe(500_000n); // Rs 5,000
    expect(result.gstOnCommission).toBe(90_000n); // Rs 900 (18%)
    expect(result.tdsDeducted).toBe(25_000n); // Rs 250 (5% of commission)
    // Net = 5000 + 900 - 250 = Rs 5,650
    expect(result.netPayout).toBe(565_000n);
  });

  it("handles zero commission", () => {
    const result = calculateDsaCommission({
      loanAmount: 50_000_000n,
      commissionBps: 0,
      tdsRateBps: 500,
    });

    expect(result.commissionAmount).toBe(0n);
    expect(result.netPayout).toBe(0n);
  });
});
