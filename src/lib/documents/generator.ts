import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { KeyFactStatement, type KfsData } from "./templates/key-fact-statement";
import { PaymentReceipt, type ReceiptData } from "./templates/payment-receipt";
import { EmiScheduleDocument, type EmiScheduleData } from "./templates/emi-schedule";
import { NocCertificate, type NocData } from "./templates/noc-certificate";

export type DocumentType = "kfs" | "receipt" | "emi-schedule" | "noc";

/**
 * Generate a PDF document and return as Buffer.
 */
export async function generatePdf(
  type: DocumentType,
  data: KfsData | ReceiptData | EmiScheduleData | NocData
): Promise<Buffer> {
  let element: React.ReactElement;

  switch (type) {
    case "kfs":
      element = React.createElement(KeyFactStatement, { data: data as KfsData });
      break;
    case "receipt":
      element = React.createElement(PaymentReceipt, { data: data as ReceiptData });
      break;
    case "emi-schedule":
      element = React.createElement(EmiScheduleDocument, { data: data as EmiScheduleData });
      break;
    case "noc":
      element = React.createElement(NocCertificate, { data: data as NocData });
      break;
    default:
      throw new Error(`Unknown document type: ${type}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}
