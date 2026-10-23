import { createTransport, type Transporter } from "nodemailer";

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailAdapter {
  send(to: string, subject: string, body: string): Promise<EmailResult>;
  getName(): string;
}

/**
 * SMTP email adapter using nodemailer.
 * Requires: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM env vars.
 */
export class SmtpEmailAdapter implements EmailAdapter {
  private transporter: Transporter | null = null;
  private from: string;

  constructor() {
    this.from = process.env.SMTP_FROM ?? "noreply@nbfc-manager.local";

    if (process.env.SMTP_HOST) {
      this.transporter = createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  getName() {
    return this.transporter ? "SMTP" : "Console (Dev)";
  }

  async send(to: string, subject: string, body: string): Promise<EmailResult> {
    if (!this.transporter) {
      console.log(`[EMAIL] To: ${to} | Subject: ${subject} | Body: ${body.substring(0, 100)}...`);
      return { success: true, messageId: `console_${Date.now()}` };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text: body,
        html: `<div style="font-family: sans-serif; max-width: 600px;">${body.replace(/\n/g, "<br>")}</div>`,
      });

      return { success: true, messageId: info.messageId };
    } catch (e) {
      return { success: false, error: `Email failed: ${e instanceof Error ? e.message : "Unknown"}` };
    }
  }
}

/**
 * Get the configured email adapter.
 */
export function getEmailAdapter(): EmailAdapter {
  return new SmtpEmailAdapter();
}
