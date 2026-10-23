import { describe, it, expect } from "vitest";
import { calculateGoldValuation, validateAuctionNotice } from "../service";

describe("gold loan operations", () => {
  describe("calculateGoldValuation", () => {
    it("calculates valuation for 22K gold", () => {
      // 10 grams of 22K gold at Rs 6,000/gram
      const result = calculateGoldValuation({
        grossWeightMg: 10_000, // 10 grams
        purity: 22,
        stoneDeductionMg: 0,
        ratePerGramPaise: 600_000n, // Rs 6,000/gram
      });

      // Valuation = 10g × 6000 × 22/24 = Rs 55,000
      expect(result.valuationAmount).toBe(5_500_000n);
      // Max loan at 75% LTV = Rs 41,250
      expect(result.maxLoanAmount).toBe(4_125_000n);
    });

    it("applies stone deduction", () => {
      const result = calculateGoldValuation({
        grossWeightMg: 10_000,
        purity: 22,
        stoneDeductionMg: 2_000, // 2 grams stone
        ratePerGramPaise: 600_000n,
      });

      // Net weight = 8 grams
      expect(result.netWeightMg).toBe(8_000);
      // Valuation = 8g × 6000 × 22/24 = Rs 44,000
      expect(result.valuationAmount).toBe(4_400_000n);
    });

    it("enforces 75% LTV cap by default", () => {
      const result = calculateGoldValuation({
        grossWeightMg: 10_000,
        purity: 24,
        stoneDeductionMg: 0,
        ratePerGramPaise: 700_000n, // Rs 7,000/gram
      });

      // Valuation = 10g × 7000 × 24/24 = Rs 70,000
      // Max loan = 75% = Rs 52,500
      expect(result.maxLoanAmount).toBe(5_250_000n);
      expect(result.ltvBps).toBe(7500);
    });
  });

  describe("validateAuctionNotice", () => {
    it("rejects notice < 14 days before auction", () => {
      const notice = new Date("2026-10-10");
      const auction = new Date("2026-10-20"); // 10 days
      const result = validateAuctionNotice(notice, auction);
      expect(result.valid).toBe(false);
    });

    it("accepts notice >= 14 days before auction", () => {
      const notice = new Date("2026-10-01");
      const auction = new Date("2026-10-20"); // 19 days
      const result = validateAuctionNotice(notice, auction);
      expect(result.valid).toBe(true);
    });

    it("accepts exactly 14 days", () => {
      const notice = new Date("2026-10-06");
      const auction = new Date("2026-10-20"); // 14 days
      const result = validateAuctionNotice(notice, auction);
      expect(result.valid).toBe(true);
    });
  });
});
