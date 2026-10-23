"use server";

import { prisma } from "@/lib/db/prisma";
import type { NotificationEvent } from "./types";

/**
 * Create an in-app notification for a user.
 */
export async function createNotification(params: {
  companyId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  // For now, store in SystemConfig as a lightweight notification store.
  // A dedicated Notification model can be added when the module is fully built.
  // This is a placeholder that enables the notification bell in the UI.
  await prisma.systemConfig.create({
    data: {
      companyId: params.companyId,
      key: `notification.${params.userId}.${Date.now()}`,
      value: JSON.stringify({
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        isRead: false,
        createdAt: new Date().toISOString(),
      }),
    },
  });
}

/**
 * Send an SMS notification.
 * Uses configured provider or logs to console in development.
 */
export async function sendSms(params: {
  to: string;
  body: string;
  companyId: string;
}): Promise<{ success: boolean; error?: string }> {
  // TODO: Integrate with SMS provider (MSG91, Twilio, etc.)
  // For now, log to console
  console.log(`[SMS] To: ${params.to} | Body: ${params.body}`);
  return { success: true };
}

/**
 * Send an email notification.
 * Uses configured SMTP or logs to console in development.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  companyId: string;
}): Promise<{ success: boolean; error?: string }> {
  // TODO: Integrate with SMTP / transactional email (SendGrid, etc.)
  console.log(`[EMAIL] To: ${params.to} | Subject: ${params.subject}`);
  return { success: true };
}

/**
 * Trigger notifications for a loan event.
 * Looks up notification templates and sends via configured channels.
 */
export async function triggerEventNotification(params: {
  companyId: string;
  event: NotificationEvent;
  customerId: string;
  loanAccountId?: string;
  data: Record<string, string>;
}) {
  const customer = await prisma.customer.findFirst({
    where: { id: params.customerId },
    select: { phone: true, email: true, firstName: true },
  });

  if (!customer) return;

  // Template mapping (simplified — real version uses configurable templates from DB)
  const templates: Record<NotificationEvent, { sms: string; email?: string }> = {
    LOAN_SANCTIONED: {
      sms: `Dear ${customer.firstName}, your loan application has been approved. Amount: ${params.data.amount}. - NBFC Manager`,
    },
    LOAN_DISBURSED: {
      sms: `Dear ${customer.firstName}, ${params.data.amount} has been disbursed to your account. Loan A/C: ${params.data.accountNumber}. - NBFC Manager`,
    },
    EMI_REMINDER: {
      sms: `Dear ${customer.firstName}, your EMI of ${params.data.amount} is due on ${params.data.dueDate}. Loan: ${params.data.accountNumber}. - NBFC Manager`,
    },
    EMI_OVERDUE: {
      sms: `Dear ${customer.firstName}, your EMI of ${params.data.amount} for Loan ${params.data.accountNumber} is overdue. Please pay immediately to avoid penalties. - NBFC Manager`,
    },
    PAYMENT_RECEIVED: {
      sms: `Dear ${customer.firstName}, payment of ${params.data.amount} received for Loan ${params.data.accountNumber}. Thank you. - NBFC Manager`,
    },
    NACH_PRE_DEBIT: {
      sms: `Dear ${customer.firstName}, ${params.data.amount} will be debited from your A/C ending ${params.data.last4} on ${params.data.date} for Loan ${params.data.accountNumber}. - NBFC Manager`,
    },
    NACH_BOUNCE: {
      sms: `Dear ${customer.firstName}, auto-debit of ${params.data.amount} for Loan ${params.data.accountNumber} failed. Please ensure sufficient balance. - NBFC Manager`,
    },
    NPA_CLASSIFIED: {
      sms: `Dear ${customer.firstName}, your Loan ${params.data.accountNumber} has been classified as NPA due to non-payment. Contact us immediately. - NBFC Manager`,
    },
    LOAN_CLOSED: {
      sms: `Dear ${customer.firstName}, your Loan ${params.data.accountNumber} has been closed. NOC will be issued shortly. Thank you. - NBFC Manager`,
    },
  };

  const template = templates[params.event];
  if (!template) return;

  if (customer.phone) {
    await sendSms({ to: customer.phone, body: template.sms, companyId: params.companyId });
  }
}
