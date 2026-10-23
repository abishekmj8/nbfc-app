import { describe, it, expect } from "vitest";
import { moneyInWords } from "../money-text";

describe("moneyInWords", () => {
  it("converts zero", () => {
    expect(moneyInWords(0n)).toBe("Rupees Zero Only");
  });

  it("converts Rs 1,50,000", () => {
    expect(moneyInWords(15000000n)).toBe("Rupees One Lakh Fifty Thousand Only");
  });

  it("converts Rs 1,00,000", () => {
    expect(moneyInWords(10000000n)).toBe("Rupees One Lakh Only");
  });

  it("converts Rs 10,00,000 (ten lakh)", () => {
    expect(moneyInWords(100000000n)).toBe("Rupees Ten Lakh Only");
  });

  it("converts Rs 1,00,00,000 (one crore)", () => {
    expect(moneyInWords(1000000000n)).toBe("Rupees One Crore Only");
  });

  it("converts with paise", () => {
    const result = moneyInWords(15000050n); // Rs 1,50,000.50
    expect(result).toBe("Rupees One Lakh Fifty Thousand and Fifty Paise Only");
  });

  it("converts Rs 999", () => {
    expect(moneyInWords(99900n)).toBe("Rupees Nine Hundred Ninety-Nine Only");
  });

  it("converts Rs 12,345", () => {
    expect(moneyInWords(1234500n)).toBe("Rupees Twelve Thousand Three Hundred Forty-Five Only");
  });

  it("converts Rs 7,23,456.78", () => {
    expect(moneyInWords(72345678n)).toBe("Rupees Seven Lakh Twenty-Three Thousand Four Hundred Fifty-Six and Seventy-Eight Paise Only");
  });

  it("ends with Only", () => {
    expect(moneyInWords(100n)).toMatch(/Only$/);
  });
});
