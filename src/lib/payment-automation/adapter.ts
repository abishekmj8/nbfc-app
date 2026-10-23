/**
 * NACH / UPI AutoPay adapter interface.
 * Integrations: Razorpay, Cashfree, PayU.
 * See specs/decisions/018-nach-upi-autopay.md
 */

export interface MandateCreateRequest {
  customerName: string;
  customerPhone: string;
  bankAccountNumber?: string; // For NACH
  ifscCode?: string;
  upiId?: string; // For UPI AutoPay
  mandateType: "NACH" | "UPI_AUTOPAY";
  maxAmount: bigint; // paise — max per debit
  frequency: "MONTHLY" | "QUARTERLY" | "AS_PRESENTED";
  startDate: Date;
  endDate: Date;
  purpose: string;
}

export interface MandateCreateResponse {
  success: boolean;
  mandateId?: string;
  authorizationUrl?: string; // Customer redirected here to authorize
  status?: "PENDING" | "REGISTERED" | "ACTIVE" | "FAILED";
  error?: string;
}

export interface DebitRequest {
  mandateId: string;
  amount: bigint; // paise
  scheduledDate: Date;
  description: string;
}

export interface DebitResponse {
  success: boolean;
  transactionId?: string;
  status?: "SUBMITTED" | "SUCCESS" | "BOUNCED";
  returnReasonCode?: string;
  error?: string;
}

export interface PaymentAutomationAdapter {
  createMandate(request: MandateCreateRequest): Promise<MandateCreateResponse>;
  getMandateStatus(mandateId: string): Promise<{ status: string }>;
  submitDebit(request: DebitRequest): Promise<DebitResponse>;
  cancelMandate(mandateId: string): Promise<{ success: boolean }>;
  getName(): string;
}

/**
 * Stub adapter for development.
 */
export class StubPaymentAutomationAdapter implements PaymentAutomationAdapter {
  getName() { return "Stub Payment Automation (Development)"; }

  async createMandate(request: MandateCreateRequest): Promise<MandateCreateResponse> {
    console.log(`[NACH Stub] Creating ${request.mandateType} mandate for ${request.customerName}`);
    return {
      success: true,
      mandateId: `MANDATE-STUB-${Date.now()}`,
      status: "PENDING",
      authorizationUrl: "#stub-auth-url",
    };
  }

  async getMandateStatus(mandateId: string) {
    return { status: "ACTIVE" };
  }

  async submitDebit(request: DebitRequest): Promise<DebitResponse> {
    console.log(`[NACH Stub] Debit: ${request.amount} on mandate ${request.mandateId}`);
    return {
      success: true,
      transactionId: `TXN-STUB-${Date.now()}`,
      status: "SUCCESS",
    };
  }

  async cancelMandate(mandateId: string) {
    return { success: true };
  }
}
