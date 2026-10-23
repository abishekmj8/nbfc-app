import { describe, it, expect } from "vitest";
import { isLeapYear, daysInYear, daysBetween, dailyInterest } from "../day-count/actual-actual";

describe("actual/actual day count", () => {
  describe("isLeapYear", () => {
    it("identifies leap years", () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2028)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
    });

    it("identifies non-leap years", () => {
      expect(isLeapYear(2025)).toBe(false);
      expect(isLeapYear(2026)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
    });
  });

  describe("daysInYear", () => {
    it("returns 366 for leap years", () => {
      expect(daysInYear(2024)).toBe(366);
    });

    it("returns 365 for non-leap years", () => {
      expect(daysInYear(2026)).toBe(365);
    });
  });

  describe("daysBetween", () => {
    it("calculates days between two dates", () => {
      expect(daysBetween(new Date("2026-01-01"), new Date("2026-01-31"))).toBe(30);
      expect(daysBetween(new Date("2026-01-01"), new Date("2026-02-01"))).toBe(31);
    });

    it("returns 0 for same date", () => {
      expect(daysBetween(new Date("2026-06-15"), new Date("2026-06-15"))).toBe(0);
    });

    it("handles month boundaries", () => {
      // Feb in non-leap year
      expect(daysBetween(new Date("2026-02-01"), new Date("2026-03-01"))).toBe(28);
      // Feb in leap year
      expect(daysBetween(new Date("2028-02-01"), new Date("2028-03-01"))).toBe(29);
    });
  });

  describe("dailyInterest", () => {
    it("calculates daily interest correctly", () => {
      // Rs 1,00,000 at 12% in 2026 (365 days)
      // Daily = 100000 × 0.12 / 365 ≈ Rs 32.88 = 3288 paise
      const interest = dailyInterest(10_000_000n, 1200, 2026);
      expect(interest).toBeGreaterThan(3280n);
      expect(interest).toBeLessThan(3300n);
    });

    it("returns slightly less per day in a leap year", () => {
      const nonLeap = dailyInterest(10_000_000n, 1200, 2026);
      const leap = dailyInterest(10_000_000n, 1200, 2028);
      expect(leap).toBeLessThan(nonLeap);
    });
  });
});
