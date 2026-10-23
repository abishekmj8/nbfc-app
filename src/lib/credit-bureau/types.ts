export interface BureauPullRequest {
  customerId: string;
  customerName: string;
  pan?: string;
  dateOfBirth?: string;
  phone?: string;
  consentId: string;
  bureau: Bureau;
  pullType: "HARD" | "SOFT";
}

export interface BureauPullResponse {
  success: boolean;
  score?: number;
  scoreVersion?: string;
  reportSummary?: BureauReportSummary;
  rawResponse?: string; // Encrypted JSON
  error?: string;
  providerReference?: string;
}

export interface BureauReportSummary {
  activeAccounts: number;
  closedAccounts: number;
  overdueAccounts: number;
  totalExposure: number; // paise
  currentBalance: number; // paise
  enquiryCountLast6Months: number;
  oldestAccountAge: number; // months
  writeOffCount: number;
  settlementCount: number;
}

export type Bureau = "CIBIL" | "EXPERIAN" | "EQUIFAX" | "CRIF";

export interface BureauAdapter {
  pullReport(request: BureauPullRequest): Promise<BureauPullResponse>;
  getName(): string;
}
