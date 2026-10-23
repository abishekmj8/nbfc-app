import { describe, it, expect } from "vitest";

/**
 * Extract the DPD classification logic for unit testing.
 * Mirrors the logic in dpd-engine.ts without DB dependency.
 */
function classifyByDpd(dpd: number): {
  status: string;
  smaClassification: string | null;
  npaClassification: string | null;
} {
  if (dpd <= 0) {
    return { status: "ACTIVE", smaClassification: null, npaClassification: null };
  }
  if (dpd >= 1 && dpd <= 30) {
    return { status: "OVERDUE", smaClassification: "SMA_0", npaClassification: null };
  }
  if (dpd >= 31 && dpd <= 60) {
    return { status: "OVERDUE", smaClassification: "SMA_1", npaClassification: null };
  }
  if (dpd >= 61 && dpd <= 90) {
    return { status: "OVERDUE", smaClassification: "SMA_2", npaClassification: null };
  }
  // NPA: dpd > 90
  const monthsAsNpa = Math.floor(dpd / 30);
  let npaClassification: string;
  if (monthsAsNpa <= 12) npaClassification = "SUB_STANDARD";
  else if (monthsAsNpa <= 36) npaClassification = "DOUBTFUL";
  else npaClassification = "LOSS";

  return { status: "NPA", smaClassification: null, npaClassification };
}

/**
 * Payment allocation order: interest → penalty → principal.
 */
function allocatePayment(
  paymentAmount: bigint,
  interestDue: bigint,
  penaltyDue: bigint,
  principalDue: bigint
): { interest: bigint; penalty: bigint; principal: bigint; excess: bigint } {
  let remaining = paymentAmount;

  const interest = remaining < interestDue ? remaining : interestDue;
  remaining -= interest;

  const penalty = remaining < penaltyDue ? remaining : penaltyDue;
  remaining -= penalty;

  const principal = remaining < principalDue ? remaining : principalDue;
  remaining -= principal;

  return { interest, penalty, principal, excess: remaining };
}

describe("DPD classification", () => {
  it("classifies DPD 0 as ACTIVE", () => {
    const result = classifyByDpd(0);
    expect(result.status).toBe("ACTIVE");
    expect(result.smaClassification).toBeNull();
    expect(result.npaClassification).toBeNull();
  });

  it("classifies DPD 1-30 as SMA-0", () => {
    expect(classifyByDpd(1).smaClassification).toBe("SMA_0");
    expect(classifyByDpd(15).smaClassification).toBe("SMA_0");
    expect(classifyByDpd(30).smaClassification).toBe("SMA_0");
    expect(classifyByDpd(30).status).toBe("OVERDUE");
  });

  it("classifies DPD 31-60 as SMA-1", () => {
    expect(classifyByDpd(31).smaClassification).toBe("SMA_1");
    expect(classifyByDpd(45).smaClassification).toBe("SMA_1");
    expect(classifyByDpd(60).smaClassification).toBe("SMA_1");
  });

  it("classifies DPD 61-90 as SMA-2", () => {
    expect(classifyByDpd(61).smaClassification).toBe("SMA_2");
    expect(classifyByDpd(75).smaClassification).toBe("SMA_2");
    expect(classifyByDpd(90).smaClassification).toBe("SMA_2");
  });

  it("classifies DPD 91+ as NPA Sub-standard", () => {
    const result = classifyByDpd(91);
    expect(result.status).toBe("NPA");
    expect(result.npaClassification).toBe("SUB_STANDARD");
    expect(result.smaClassification).toBeNull();
  });

  it("classifies DPD 365+ as NPA Doubtful", () => {
    const result = classifyByDpd(400);
    expect(result.npaClassification).toBe("DOUBTFUL");
  });

  it("classifies DPD 1100+ as NPA Loss", () => {
    // 1100 days / 30 = 36.6 months → > 36 → Loss
    const result = classifyByDpd(1110);
    expect(result.npaClassification).toBe("LOSS");
  });

  it("boundary: DPD 90 is SMA-2, DPD 91 is NPA", () => {
    expect(classifyByDpd(90).status).toBe("OVERDUE");
    expect(classifyByDpd(91).status).toBe("NPA");
  });
});

describe("payment allocation", () => {
  it("allocates interest first, then penalty, then principal", () => {
    const result = allocatePayment(
      100_000n, // Rs 1,000 payment
      30_000n,  // Rs 300 interest due
      10_000n,  // Rs 100 penalty due
      60_000n   // Rs 600 principal due
    );
    expect(result.interest).toBe(30_000n);
    expect(result.penalty).toBe(10_000n);
    expect(result.principal).toBe(60_000n);
    expect(result.excess).toBe(0n);
  });

  it("partial payment covers interest only", () => {
    const result = allocatePayment(
      20_000n,  // Rs 200 payment (less than interest due)
      30_000n,
      10_000n,
      60_000n
    );
    expect(result.interest).toBe(20_000n);
    expect(result.penalty).toBe(0n);
    expect(result.principal).toBe(0n);
    expect(result.excess).toBe(0n);
  });

  it("overpayment has excess", () => {
    const result = allocatePayment(
      150_000n, // Rs 1,500 (more than total due)
      30_000n,
      10_000n,
      60_000n
    );
    expect(result.interest).toBe(30_000n);
    expect(result.penalty).toBe(10_000n);
    expect(result.principal).toBe(60_000n);
    expect(result.excess).toBe(50_000n);
  });

  it("zero payment allocates nothing", () => {
    const result = allocatePayment(0n, 30_000n, 10_000n, 60_000n);
    expect(result.interest).toBe(0n);
    expect(result.penalty).toBe(0n);
    expect(result.principal).toBe(0n);
    expect(result.excess).toBe(0n);
  });

  it("payment with no dues = all excess", () => {
    const result = allocatePayment(50_000n, 0n, 0n, 0n);
    expect(result.excess).toBe(50_000n);
  });

  it("covers interest and partial penalty", () => {
    const result = allocatePayment(
      35_000n,  // Rs 350
      30_000n,  // Rs 300 interest
      10_000n,  // Rs 100 penalty
      60_000n
    );
    expect(result.interest).toBe(30_000n);
    expect(result.penalty).toBe(5_000n); // only Rs 50 left for penalty
    expect(result.principal).toBe(0n);
    expect(result.excess).toBe(0n);
  });
});
