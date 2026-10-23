/**
 * e-Stamping adapter interface.
 * Integrations: NeSL, SHCIL.
 * See specs/decisions/021-estamping.md
 */

export interface StampDutyRequest {
  state: string;
  documentType: string;
  loanAmount: bigint; // paise
}

export interface StampDutyResponse {
  success: boolean;
  stampAmount: bigint; // paise
  certificateNumber?: string;
  error?: string;
}

export interface StampDutyConfig {
  state: string;
  documentType: string;
  calculationType: "PERCENTAGE" | "FLAT";
  rateBps?: number; // basis points for percentage
  flatAmount?: bigint; // paise for flat
  maxAmount?: bigint; // cap in paise
}

export interface EStampingAdapter {
  purchaseStamp(request: StampDutyRequest): Promise<StampDutyResponse>;
  getName(): string;
}

/**
 * Calculate stamp duty from config (offline, no API call).
 */
export function calculateStampDuty(
  config: StampDutyConfig,
  loanAmount: bigint
): bigint {
  if (config.calculationType === "FLAT") {
    return config.flatAmount ?? 0n;
  }

  let duty = (loanAmount * BigInt(config.rateBps ?? 0) + 5000n) / 10000n;
  if (config.maxAmount && duty > config.maxAmount) {
    duty = config.maxAmount;
  }
  return duty;
}

/**
 * Stub adapter for development.
 */
export class StubEStampingAdapter implements EStampingAdapter {
  getName() { return "Stub e-Stamping (Development)"; }

  async purchaseStamp(request: StampDutyRequest): Promise<StampDutyResponse> {
    console.log(`[e-Stamp Stub] Purchasing stamp for ${request.state}, amount: ${request.loanAmount}`);
    return {
      success: true,
      stampAmount: 10000n, // Rs 100 flat (common for many states)
      certificateNumber: `ESTAMP-STUB-${Date.now()}`,
    };
  }
}
