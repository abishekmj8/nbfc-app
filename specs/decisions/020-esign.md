# ADR-020: eSign & Digital Signature

**Status**: accepted
**Date**: 2026-10-24
**Toggleable**: Yes — Settings > Modules > Digital Signature

## Context

RBI Digital Lending Directions 2025 mandate that loan agreements must be signed with an IT Act-compliant digital signature. Clickwrap and OTP-based "virtual signatures" are NOT compliant. Aadhaar eSign is the most practical solution for NBFCs — legally valid, works remotely, no physical paper.

---

## Accepted Signature Types (per RBI)

| Type | How it works | Legal status | Best for |
|---|---|---|---|
| **Aadhaar eSign** | OTP/biometric/face via Aadhaar | Valid under IT Act | Remote/digital lending |
| **Aadhaar XML eSign** | Offline Aadhaar-based | Valid under IT Act | When online auth is down |
| **DSC Token** | USB hardware token (Class 2/3) | Valid under IT Act | High-value loans, legal docs |
| **PAN eSign** | PAN-based authentication | Valid under IT Act | Alternate to Aadhaar |

**NOT valid**: Clickwrap (checkbox), OTP-only, image of signature, typed name.

---

## Integration Architecture

eSign requires an **ESP (eSign Service Provider)** licensed by CCA (Controller of Certifying Authorities).

```
NBFC App → ESP API → UIDAI (Aadhaar auth) → Signed PDF returned

ESP options: Leegality, Digio, SignDesk, eMudhra, NSDL eSign
```

```
src/lib/esign/
  adapter.ts                — common interface
  leegality-adapter.ts      — Leegality implementation
  digio-adapter.ts          — Digio implementation
  emudhra-adapter.ts        — eMudhra implementation
  types.ts
```

---

## Signing Flow

```
1. App generates loan document (PDF via React-PDF)
2. App uploads PDF to ESP with signature positions defined
3. ESP sends signing request to customer (SMS/email link)
4. Customer opens link → authenticates via Aadhaar OTP
5. ESP creates digital signature → embeds in PDF
6. Signed PDF returned to app via webhook
7. App stores signed PDF, records signing metadata
8. NBFC-side counter-signature (via DSC or authorized signatory eSign)
9. Both-parties-signed document stored as the legal agreement
```

---

## Data Model

```
SigningRequest:
  id, documentId, loanApplicationId
  espProvider               — LEEGALITY | DIGIO | EMUDHRA
  espRequestId              — external reference
  documentType              — LOAN_AGREEMENT | KFS | SANCTION_LETTER | NOC
  signatories               — JSON array [{name, email, phone, role: BORROWER|CO_BORROWER|GUARANTOR|NBFC_AUTHORIZED}]
  signatureType             — AADHAAR_ESIGN | DSC | PAN_ESIGN
  status                    — CREATED | SENT | PARTIALLY_SIGNED | COMPLETED | EXPIRED | CANCELLED
  createdAt, sentAt, completedAt, expiresAt
  signedDocumentPath        — path to signed PDF
  signedDocumentHash        — SHA-256 of signed PDF
  auditTrail                — JSON (ESP's audit trail of signing events)

SignatureRecord:
  id, signingRequestId
  signatoryName
  signatoryRole             — BORROWER | CO_BORROWER | GUARANTOR | NBFC
  signatureType
  signedAt
  certificateSerial         — digital certificate serial number
  ipAddress
  location                  — if captured
  authMode                  — AADHAAR_OTP | AADHAAR_BIOMETRIC | AADHAAR_FACE | DSC_TOKEN
```

---

## Documents That Need Signing

| Document | Who signs | When |
|---|---|---|
| **Loan Agreement** | Borrower + NBFC | Before disbursement |
| **Key Fact Statement** | Borrower (acknowledgment) | Before agreement |
| **Sanction Letter** | NBFC | At sanction |
| **Guarantor Agreement** | Guarantor + NBFC | Before disbursement |
| **NOC / No Dues** | NBFC | At closure |
| **Hypothecation Agreement** | Borrower + NBFC | Vehicle/property loans |

---

## Configuration

```
Settings > Digital Signature:
  - Enabled: [yes/no]
  - ESP Provider: [Leegality / Digio / eMudhra]
  - API credentials
  - Default signature type: [Aadhaar eSign / DSC / PAN eSign]
  - NBFC authorized signatory: [name, designation, DSC details]
  - Signing expiry: [48 hours / 72 hours / 7 days]
  - Require eSign before disbursement: [yes/no]
```

**When disabled**: App generates unsigned PDFs. NBFC handles signing offline (print, sign, scan). Document marked as "physically signed" in the system.

---

## Consequences

- **Enables**: Fully paperless lending, RBI-compliant digital agreements, remote loan execution
- **Trade-off**: Per-signature cost from ESP (Rs 5-25 per signature)
- **Trade-off**: Requires customer to have Aadhaar-linked mobile for OTP
- **Toggleable**: NBFC can disable and use physical signing
