import type { BureauAdapter, BureauPullRequest, BureauPullResponse } from "./types";

/**
 * Mock bureau adapter for development and testing.
 * Returns realistic-looking scores and summaries.
 */
export class MockBureauAdapter implements BureauAdapter {
  getName() {
    return "Mock Bureau (Development)";
  }

  async pullReport(request: BureauPullRequest): Promise<BureauPullResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate a deterministic-ish score based on the customer name
    const hash = request.customerName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const score = 600 + (hash % 250); // Range: 600-850

    return {
      success: true,
      score,
      scoreVersion: `${request.bureau} Mock v1.0`,
      reportSummary: {
        activeAccounts: 2 + (hash % 5),
        closedAccounts: 1 + (hash % 3),
        overdueAccounts: hash % 3 === 0 ? 1 : 0,
        totalExposure: (500000 + (hash % 20) * 100000) * 100, // paise
        currentBalance: (200000 + (hash % 10) * 50000) * 100,
        enquiryCountLast6Months: 1 + (hash % 4),
        oldestAccountAge: 12 + (hash % 60),
        writeOffCount: 0,
        settlementCount: hash % 7 === 0 ? 1 : 0,
      },
      providerReference: `MOCK-${Date.now()}`,
    };
  }
}
