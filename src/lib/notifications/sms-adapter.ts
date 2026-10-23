/**
 * SMS adapters for notification delivery.
 * Supports MSG91 (Indian SMS gateway) with fallback to console logging.
 */

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsAdapter {
  send(to: string, body: string): Promise<SmsResult>;
  getName(): string;
}

/**
 * MSG91 SMS adapter.
 * Requires: MSG91_AUTH_KEY and MSG91_SENDER_ID env vars.
 * API docs: https://docs.msg91.com/
 */
export class Msg91Adapter implements SmsAdapter {
  private authKey: string;
  private senderId: string;
  private baseUrl = "https://control.msg91.com/api/v5";

  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY ?? "";
    this.senderId = process.env.MSG91_SENDER_ID ?? "NBFCMG";
  }

  getName() {
    return "MSG91";
  }

  async send(to: string, body: string): Promise<SmsResult> {
    if (!this.authKey) {
      console.log(`[MSG91 Stub] To: ${to} | Body: ${body}`);
      return { success: true, messageId: `msg91_stub_${Date.now()}` };
    }

    try {
      // Ensure Indian format
      const phone = to.replace(/\D/g, "");
      const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;

      const res = await fetch(`${this.baseUrl}/flow/`, {
        method: "POST",
        headers: {
          "authkey": this.authKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: this.senderId,
          route: "4", // Transactional
          country: "91",
          sms: [{ message: body, to: [formattedPhone] }],
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        return { success: false, error: `MSG91 error: ${error}` };
      }

      const data = await res.json();
      return { success: true, messageId: data.request_id ?? data.message };
    } catch (e) {
      return { success: false, error: `MSG91 failed: ${e instanceof Error ? e.message : "Unknown"}` };
    }
  }
}

/**
 * Console adapter for development — just logs to console.
 */
export class ConsoleSmsAdapter implements SmsAdapter {
  getName() { return "Console (Dev)"; }

  async send(to: string, body: string): Promise<SmsResult> {
    console.log(`[SMS] To: ${to} | Body: ${body}`);
    return { success: true, messageId: `console_${Date.now()}` };
  }
}

/**
 * Get the configured SMS adapter based on environment.
 */
export function getSmsAdapter(): SmsAdapter {
  if (process.env.MSG91_AUTH_KEY) return new Msg91Adapter();
  return new ConsoleSmsAdapter();
}
