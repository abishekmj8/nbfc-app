/**
 * Account Aggregator adapter interface.
 * Integrations: Setu, Finvu, Saafe.
 * See specs/decisions/019-account-aggregator.md
 */

export interface AAConsentRequest {
  customerId: string;
  customerPhone: string;
  purpose: string;
  fiTypes: Array<"DEPOSIT" | "MUTUAL_FUND" | "INSURANCE" | "GST">;
  dateRangeMonths: number; // How many months of data
  dataLifeMonths: number; // How long NBFC can keep the data
}

export interface AAConsentResponse {
  success: boolean;
  consentHandle?: string;
  status?: "REQUESTED" | "APPROVED" | "REJECTED" | "EXPIRED" | "REVOKED";
  error?: string;
}

export interface AADataFetchResponse {
  success: boolean;
  accounts: Array<{
    fiType: string;
    fipName: string;
    maskedAccountNumber: string;
    data: unknown; // Parsed bank statement / MF / insurance data
  }>;
  error?: string;
}

export interface BankAnalysis {
  averageMonthlyBalance: bigint; // paise
  estimatedMonthlyIncome: bigint; // paise
  existingEmiObligations: bigint; // paise per month
  bounceCount: number;
  salaryDetected: boolean;
  cashFlowScore: number; // 0-100
  redFlags: string[];
}

export interface AAAdapter {
  requestConsent(request: AAConsentRequest): Promise<AAConsentResponse>;
  checkConsentStatus(consentHandle: string): Promise<AAConsentResponse>;
  fetchData(consentHandle: string): Promise<AADataFetchResponse>;
  getName(): string;
}

/**
 * Stub adapter for development.
 */
export class StubAAAdapter implements AAAdapter {
  getName() { return "Stub Account Aggregator (Development)"; }

  async requestConsent(request: AAConsentRequest): Promise<AAConsentResponse> {
    console.log(`[AA Stub] Consent requested for customer: ${request.customerId}`);
    return {
      success: true,
      consentHandle: `AA-STUB-${Date.now()}`,
      status: "REQUESTED",
    };
  }

  async checkConsentStatus(consentHandle: string): Promise<AAConsentResponse> {
    return { success: true, consentHandle, status: "APPROVED" };
  }

  async fetchData(_consentHandle: string): Promise<AADataFetchResponse> {
    return {
      success: true,
      accounts: [{
        fiType: "DEPOSIT",
        fipName: "State Bank of India",
        maskedAccountNumber: "XXXXXXXX1234",
        data: { transactions: [], summary: { averageBalance: 5000000 } },
      }],
    };
  }
}
