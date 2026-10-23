import { describe, it, expect } from "vitest";
import { rupeesToPaise, paiseToRupees, formatMoney, formatAmount } from "../money";

describe("money utilities", () => {
  describe("rupeesToPaise", () => {
    it("converts whole rupees", () => {
      expect(rupeesToPaise(1500)).toBe(150000n);
    });

    it("converts rupees with paise", () => {
      expect(rupeesToPaise(1500.50)).toBe(150050n);
    });

    it("handles zero", () => {
      expect(rupeesToPaise(0)).toBe(0n);
    });

    it("rounds to nearest paisa", () => {
      expect(rupeesToPaise(100.999)).toBe(10100n);
    });
  });

  describe("paiseToRupees", () => {
    it("converts paise to rupees", () => {
      expect(paiseToRupees(150000n)).toBe(1500);
    });

    it("handles fractional rupees", () => {
      expect(paiseToRupees(150050n)).toBe(1500.50);
    });

    it("handles zero", () => {
      expect(paiseToRupees(0n)).toBe(0);
    });
  });

  describe("formatMoney", () => {
    it("formats with Indian separators and rupee symbol", () => {
      const result = formatMoney(15000000n);
      // ₹1,50,000.00 — Indian number format uses lakh separators
      expect(result).toContain("1,50,000");
      expect(result).toContain("₹");
    });

    it("formats zero", () => {
      const result = formatMoney(0n);
      expect(result).toContain("0.00");
    });

    it("formats small amounts", () => {
      const result = formatMoney(100n);
      expect(result).toContain("1.00");
    });
  });

  describe("formatAmount", () => {
    it("formats without currency symbol", () => {
      const result = formatAmount(15000000n);
      expect(result).toContain("1,50,000.00");
      expect(result).not.toContain("₹");
    });
  });
});
