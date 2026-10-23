import { describe, it, expect } from "vitest";
import {
  calculateProcessingFee,
  calculateLateFee,
  calculateBounceCharges,
  calculatePrepaymentFee,
} from "../service";

describe("fee calculations", () => {
  describe("calculateProcessingFee", () => {
    it("calculates percentage-based fee with GST", () => {
      // 1% on Rs 1,00,000 = Rs 1,000 + 18% GST = Rs 1,180
      const result = calculateProcessingFee(10_000_000n, 100, 0n);
      expect(result.feeAmount).toBe(100_000n); // Rs 1,000
      expect(result.gstAmount).toBe(18_000n); // Rs 180
      expect(result.totalAmount).toBe(118_000n); // Rs 1,180
    });

    it("calculates flat fee with GST", () => {
      // Rs 500 flat + 18% GST = Rs 590
      const result = calculateProcessingFee(10_000_000n, 0, 50_000n);
      expect(result.feeAmount).toBe(50_000n);
      expect(result.gstAmount).toBe(9_000n);
      expect(result.totalAmount).toBe(59_000n);
    });
  });

  describe("calculateBounceCharges", () => {
    it("calculates bounce charges with GST", () => {
      // Rs 500 bounce charge + 18% GST
      const result = calculateBounceCharges(50_000n);
      expect(result.feeAmount).toBe(50_000n);
      expect(result.totalAmount).toBe(59_000n);
    });
  });

  describe("calculatePrepaymentFee", () => {
    it("returns zero for floating rate loans (RBI rule)", () => {
      const result = calculatePrepaymentFee(50_000_000n, 200, "FLOATING");
      expect(result.feeAmount).toBe(0n);
      expect(result.totalAmount).toBe(0n);
    });

    it("calculates fee for fixed rate loans", () => {
      // 2% on Rs 5,00,000 = Rs 10,000 + GST
      const result = calculatePrepaymentFee(50_000_000n, 200, "FIXED");
      expect(result.feeAmount).toBe(1_000_000n); // Rs 10,000
      expect(result.totalAmount).toBeGreaterThan(1_000_000n); // + GST
    });
  });
});
