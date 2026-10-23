"use server";

import { prisma } from "@/lib/db/prisma";

export interface FeeCalculation {
  feeType: string;
  baseAmount: bigint; // paise
  feeAmount: bigint; // paise
  gstAmount: bigint; // paise (18% GST)
  totalAmount: bigint; // fee + GST
}

const GST_RATE_BPS = 1800; // 18% = 1800 basis points

/**
 * Calculate processing fee for a loan.
 */
export function calculateProcessingFee(
  loanAmount: bigint,
  feePercentBps: number,
  feeFlatPaise: bigint
): FeeCalculation {
  let feeAmount: bigint;

  if (feePercentBps > 0) {
    feeAmount = (loanAmount * BigInt(feePercentBps) + 5000n) / 10000n;
  } else {
    feeAmount = feeFlatPaise;
  }

  const gstAmount = (feeAmount * BigInt(GST_RATE_BPS) + 5000n) / 10000n;

  return {
    feeType: "PROCESSING_FEE",
    baseAmount: loanAmount,
    feeAmount,
    gstAmount,
    totalAmount: feeAmount + gstAmount,
  };
}

/**
 * Calculate late payment fee.
 */
export function calculateLateFee(
  overdueAmount: bigint,
  flatFeePaise: bigint
): FeeCalculation {
  const feeAmount = flatFeePaise;
  const gstAmount = (feeAmount * BigInt(GST_RATE_BPS) + 5000n) / 10000n;

  return {
    feeType: "LATE_PAYMENT_FEE",
    baseAmount: overdueAmount,
    feeAmount,
    gstAmount,
    totalAmount: feeAmount + gstAmount,
  };
}

/**
 * Calculate bounce charges.
 */
export function calculateBounceCharges(flatFeePaise: bigint): FeeCalculation {
  const gstAmount = (flatFeePaise * BigInt(GST_RATE_BPS) + 5000n) / 10000n;

  return {
    feeType: "BOUNCE_CHARGES",
    baseAmount: 0n,
    feeAmount: flatFeePaise,
    gstAmount,
    totalAmount: flatFeePaise + gstAmount,
  };
}

/**
 * Calculate prepayment/foreclosure fee.
 */
export function calculatePrepaymentFee(
  outstandingPrincipal: bigint,
  feePercentBps: number,
  interestType: string
): FeeCalculation {
  // RBI: No prepayment penalty on floating rate individual loans
  if (interestType === "FLOATING") {
    return {
      feeType: "PREPAYMENT_FEE",
      baseAmount: outstandingPrincipal,
      feeAmount: 0n,
      gstAmount: 0n,
      totalAmount: 0n,
    };
  }

  const feeAmount = feePercentBps > 0
    ? (outstandingPrincipal * BigInt(feePercentBps) + 5000n) / 10000n
    : 0n;

  const gstAmount = feeAmount > 0n
    ? (feeAmount * BigInt(GST_RATE_BPS) + 5000n) / 10000n
    : 0n;

  return {
    feeType: "PREPAYMENT_FEE",
    baseAmount: outstandingPrincipal,
    feeAmount,
    gstAmount,
    totalAmount: feeAmount + gstAmount,
  };
}
