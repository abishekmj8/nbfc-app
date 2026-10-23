import { describe, it, expect } from "vitest";
import { calculateCoLendingSplit, splitPayment } from "../service";

describe("co-lending", () => {
  describe("calculateCoLendingSplit", () => {
    it("splits loan 20/80 (NBFC/Bank)", () => {
      const result = calculateCoLendingSplit(100_000_000n, 2000); // Rs 10L, 20%
      expect(result.nbfcAmount).toBe(20_000_000n); // Rs 2L
      expect(result.partnerAmount).toBe(80_000_000n); // Rs 8L
    });

    it("handles 50/50 split", () => {
      const result = calculateCoLendingSplit(100_000_000n, 5000);
      expect(result.nbfcAmount).toBe(50_000_000n);
      expect(result.partnerAmount).toBe(50_000_000n);
    });
  });

  describe("splitPayment", () => {
    it("splits EMI payment proportionally", () => {
      // Rs 10,000 EMI, 20/80 split
      const result = splitPayment(1_000_000n, 2000);
      expect(result.nbfcShare).toBe(200_000n); // Rs 2,000
      expect(result.partnerShare).toBe(800_000n); // Rs 8,000
    });
  });
});
