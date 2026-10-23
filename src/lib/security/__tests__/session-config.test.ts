import { describe, it, expect } from "vitest";
import { validatePassword, PASSWORD_POLICY } from "../session-config";

describe("password validation", () => {
  it("accepts a strong password", () => {
    const result = validatePassword("Str0ngPass");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects short passwords", () => {
    const result = validatePassword("Ab1");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain(`${PASSWORD_POLICY.minLength}`);
  });

  it("rejects passwords without uppercase", () => {
    const result = validatePassword("alllowercase1");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("uppercase"))).toBe(true);
  });

  it("rejects passwords without lowercase", () => {
    const result = validatePassword("ALLUPPERCASE1");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("lowercase"))).toBe(true);
  });

  it("rejects passwords without digits", () => {
    const result = validatePassword("NoDigitsHere");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("digit"))).toBe(true);
  });

  it("accepts minimum length password with all requirements", () => {
    const result = validatePassword("Abcdefg1");
    expect(result.valid).toBe(true);
  });
});
