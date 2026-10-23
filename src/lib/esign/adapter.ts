/**
 * eSign adapter interface.
 * Integrations: Leegality, Digio, eMudhra.
 * See specs/decisions/020-esign.md
 */

export interface ESignRequest {
  documentPath: string;
  documentType: string;
  signatories: Array<{
    name: string;
    email?: string;
    phone: string;
    role: "BORROWER" | "CO_BORROWER" | "GUARANTOR" | "NBFC";
    signatureType: "AADHAAR_ESIGN" | "DSC" | "PAN_ESIGN";
  }>;
  expiryHours?: number;
}

export interface ESignResponse {
  success: boolean;
  requestId?: string;
  signingUrl?: string;
  status?: "CREATED" | "SENT" | "PARTIALLY_SIGNED" | "COMPLETED" | "EXPIRED";
  signedDocumentPath?: string;
  error?: string;
}

export interface ESignAdapter {
  createSigningRequest(request: ESignRequest): Promise<ESignResponse>;
  getStatus(requestId: string): Promise<ESignResponse>;
  getName(): string;
}

/**
 * Stub adapter for development. Simulates eSign completion.
 */
export class StubESignAdapter implements ESignAdapter {
  getName() { return "Stub eSign (Development)"; }

  async createSigningRequest(request: ESignRequest): Promise<ESignResponse> {
    console.log(`[eSign Stub] Creating signing request for ${request.signatories.length} signatories`);
    return {
      success: true,
      requestId: `ESIGN-STUB-${Date.now()}`,
      status: "CREATED",
      signingUrl: "#stub-signing-url",
    };
  }

  async getStatus(requestId: string): Promise<ESignResponse> {
    return { success: true, requestId, status: "COMPLETED" };
  }
}
