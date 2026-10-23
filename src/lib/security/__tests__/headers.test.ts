import { describe, it, expect } from "vitest";
import { checkRateLimit } from "../headers";

describe("rate limiting", () => {
  it("allows requests within limit", () => {
    const key = `test-${Date.now()}-allow`;
    const result = checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests over limit", () => {
    const key = `test-${Date.now()}-block`;
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60000);
    }
    const result = checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks remaining correctly", () => {
    const key = `test-${Date.now()}-remaining`;
    const r1 = checkRateLimit(key, 5, 60000);
    expect(r1.remaining).toBe(4);
    const r2 = checkRateLimit(key, 5, 60000);
    expect(r2.remaining).toBe(3);
    const r3 = checkRateLimit(key, 5, 60000);
    expect(r3.remaining).toBe(2);
  });
});
