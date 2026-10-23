import type {
  PaymentAutomationAdapter,
  MandateCreateRequest,
  MandateCreateResponse,
  DebitRequest,
  DebitResponse,
} from "./adapter";

/**
 * Razorpay NACH/UPI AutoPay adapter.
 * Uses Razorpay Subscriptions API for recurring payments.
 * Requires: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET env vars.
 */
export class RazorpayAdapter implements PaymentAutomationAdapter {
  private keyId: string;
  private keySecret: string;
  private baseUrl = "https://api.razorpay.com/v1";

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID ?? "";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  }

  getName() {
    return "Razorpay";
  }

  private authHeader(): string {
    return "Basic " + Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
  }

  async createMandate(request: MandateCreateRequest): Promise<MandateCreateResponse> {
    if (!this.keyId || !this.keySecret) {
      console.warn("[Razorpay] API keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
      return { success: false, error: "Razorpay API keys not configured" };
    }

    try {
      const res = await fetch(`${this.baseUrl}/subscriptions`, {
        method: "POST",
        headers: {
          "Authorization": this.authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: "plan_placeholder", // Would use actual plan ID
          customer_notify: 1,
          total_count: Math.ceil(
            (request.endDate.getTime() - request.startDate.getTime()) / (30 * 86_400_000)
          ),
          notes: { purpose: request.purpose, customer: request.customerName },
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        return { success: false, error: `Razorpay error: ${error}` };
      }

      const data = await res.json();
      return {
        success: true,
        mandateId: data.id,
        status: "PENDING",
        authorizationUrl: data.short_url,
      };
    } catch (e) {
      return { success: false, error: `Razorpay request failed: ${e instanceof Error ? e.message : "Unknown"}` };
    }
  }

  async getMandateStatus(mandateId: string) {
    if (!this.keyId) return { status: "UNKNOWN" };

    try {
      const res = await fetch(`${this.baseUrl}/subscriptions/${mandateId}`, {
        headers: { "Authorization": this.authHeader() },
      });
      const data = await res.json();
      return { status: data.status?.toUpperCase() ?? "UNKNOWN" };
    } catch {
      return { status: "UNKNOWN" };
    }
  }

  async submitDebit(_request: DebitRequest): Promise<DebitResponse> {
    // Razorpay auto-charges subscriptions — no manual debit needed
    return { success: true, status: "SUBMITTED", transactionId: `rzp_auto_${Date.now()}` };
  }

  async cancelMandate(mandateId: string) {
    if (!this.keyId) return { success: false };

    try {
      const res = await fetch(`${this.baseUrl}/subscriptions/${mandateId}/cancel`, {
        method: "POST",
        headers: { "Authorization": this.authHeader() },
      });
      return { success: res.ok };
    } catch {
      return { success: false };
    }
  }
}
