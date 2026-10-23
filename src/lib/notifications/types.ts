export interface NotificationChannel {
  send(params: SendParams): Promise<SendResult>;
  getName(): string;
}

export interface SendParams {
  to: string; // phone for SMS, email address for email
  subject?: string; // email only
  body: string;
  templateId?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type NotificationEvent =
  | "LOAN_SANCTIONED"
  | "LOAN_DISBURSED"
  | "EMI_REMINDER"
  | "EMI_OVERDUE"
  | "PAYMENT_RECEIVED"
  | "NACH_PRE_DEBIT"
  | "NACH_BOUNCE"
  | "NPA_CLASSIFIED"
  | "LOAN_CLOSED";
