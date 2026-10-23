# ADR-006: Legal & Regulatory Compliance

**Status**: accepted
**Date**: 2026-10-24

## Context

An NBFC in India operates under heavy regulation. Our software must be built to help clients comply — not just as bolt-on reports, but as constraints enforced in the system. This document catalogs every legal/regulatory requirement the software must account for.

---

## 1. RBI Master Directions (NBFC-specific)

The RBI issued 35 consolidated Master Directions for NBFCs on November 28, 2025 (with amendments effective July 1, 2026). Key ones affecting the software:

### Scale-Based Regulation (SBR)
NBFCs are classified into 4 layers: Base, Middle, Upper, Top. Compliance requirements scale with the layer. The app should let the client configure their SBR layer, and adjust required fields/workflows accordingly.

### Fair Practices Code (FPC)
**What the software must enforce:**
- Loan application acknowledgment with a timestamp
- Sanction letter with all terms clearly disclosed BEFORE disbursement
- Interest rate, fees, charges, APR, penalties — all shown to borrower before agreement
- Loan agreement in borrower's preferred language (template per language)
- Reason for rejection must be recorded and communicable
- No prepayment penalty on floating-rate loans (for certain categories)
- Board-approved grievance redressal: nodal officer details in the system, displayed on all outputs

### Income Recognition, Asset Classification & Provisioning (IRACP)
**What the software must enforce:**
- NPA classification: loan overdue > 90 days = NPA (auto-calculated by DPD engine)
- SMA classification: SMA-0 (1-30 days), SMA-1 (31-60 days), SMA-2 (61-90 days)
- Sub-standard (NPA up to 12 months), Doubtful (12-36 months), Loss (>36 months or uncollectable)
- Provisioning percentages auto-calculated per RBI norms
- Interest income on NPAs: not recognized on accrual basis (reversed when NPA)
- Upgrade on recovery: NPA upgraded only when full arrears cleared

### Concentration of Credit / Exposure Norms
- Single borrower exposure limit (configurable per SBR layer)
- Group borrower exposure limit
- Alerts when approaching limits

### Capital Adequacy (CRAR)
- Minimum 15% CRAR for NBFCs
- Not directly calculated in the app, but loan data feeds into capital adequacy reports

---

## 2. Digital Lending Directions 2025

Issued May 8, 2025. Directly impacts the software's lending workflow.

### Key Fact Statement (KFS)
**Must be generated and shown to borrower BEFORE loan agreement execution.**
Contents:
- All-in cost of the loan (APR)
- Tenor, EMI amount, repayment schedule
- Processing fees, insurance charges, all other charges
- Cooling-off / look-up period details
- Grievance officer details

The app must generate KFS as a document and log that it was presented.

### Cooling-Off Period
- Minimum 1 day (3 days for digital loans) where borrower can exit without penalty
- System must track loan creation date and enforce cooling-off window
- If borrower exits during cooling-off: refund all fees, reverse the loan
- Must be configurable (NBFC may offer longer periods)

### Direct Fund Flow
- Disbursement must go directly to borrower's bank account
- Repayment must come directly to the NBFC's account
- No third-party pass-through (enforced in disbursement workflow)

### Borrower Communication
- All communications must clearly identify the NBFC (not just the LSP/DSA)
- System-generated SMS/email must include NBFC name and registration number

### Digital Lending App (DLA) Registration
- If the NBFC has a mobile app, it must be registered with RBI's CIMS portal
- App must track DLA registration status

---

## 3. KYC / AML / PMLA

### KYC Requirements (RBI Master Direction on KYC, 2016)
**What the software must enforce:**
- Customer Due Diligence (CDD) at onboarding — mandatory before disbursement
- KYC documents: PAN (mandatory), Aadhaar (for eKYC), address proof, photo
- Officially Valid Documents (OVDs): passport, voter ID, driving license, NREGA card, Aadhaar
- CKYC (Central KYC): upload KYC data to CKYC registry, fetch existing KYC by CKYC number
- Periodic KYC update: every 2 years for high-risk, 5 years for medium, 10 years for low
- KYC expiry alerts and re-verification workflow

### AML / CFT (Anti-Money Laundering / Counter-Financing of Terrorism)
**What the software must support:**
- Customer risk categorization (low, medium, high) based on profile
- Enhanced Due Diligence (EDD) for high-risk customers
- PEP (Politically Exposed Person) identification
- Transaction monitoring: flag unusual patterns
- Record retention: all KYC records for 5 years after account closure

### PMLA Reporting to FIU-IND
**What the software must generate:**
- Cash Transaction Report (CTR): cash transactions > Rs 10 lakh (or series aggregating to Rs 10 lakh in a month) — monthly report to FIU-IND
- Suspicious Transaction Report (STR): within 7 days of detection
- Non-Profit Organization Transaction Report (NTR) if applicable
- Cross-border Wire Transfer Report (CWTR) if applicable

---

## 4. Data Protection — DPDP Act, 2023

The Digital Personal Data Protection Act, 2023 (with Rules effective 2025) applies to ALL digital personal data processing.

### What the software must enforce:

**Consent Management**
- Clear, specific consent before collecting personal data
- Purpose limitation: data used only for stated purpose
- Consent withdrawal mechanism — and system must stop processing on withdrawal
- Consent logs: record what consent was given, when, for what purpose

**Data Minimization**
- Collect only data necessary for the stated purpose
- No excessive data collection "just in case"

**Security Safeguards**
- Encryption of personal data at rest and in transit
- Masking/tokenization of sensitive fields (PAN, Aadhaar, bank account)
- Access controls: only authorized users see PII
- Audit trail on all PII access (not just modifications)

**Data Retention & Erasure**
- Retain data only as long as necessary for the purpose
- Configurable retention policy per data category
- Erasure/anonymization when retention period expires (respecting legal hold requirements)
- Right to erasure: borrower can request deletion (subject to legal retention requirements like PMLA 5-year rule)

**Breach Notification**
- Data breach must be reported to the Data Protection Board and affected individuals
- System should support breach incident logging and notification workflow

**Significant Data Fiduciary (SDF) — if applicable**
- Data Protection Officer (DPO) designation
- Annual data protection audit
- Data Protection Impact Assessment (DPIA) for new products/processes

---

## 5. Cybersecurity — RBI Directions 2026

RBI (NBFC – Cybersecurity, Technology Risk, Resilience and Assurance Framework) Directions, 2026. Issued July 31, 2026.

### What the software must support:

**Authentication & Access**
- Multi-factor authentication (MFA) for privileged users and critical operations
- Role-based access with least-privilege principle
- Session timeout and auto-logout
- Password policy enforcement (complexity, rotation, history)

**Audit & Logging**
- Comprehensive audit logs for all system access and data changes
- Log retention as per RBI norms
- Tamper-proof / append-only log storage

**Incident Response**
- Cyber incident logging and tracking
- 6-hour reporting window to RBI (via DAKSH platform)
- CERT-In notification support
- Incident history and resolution tracking

**Data Security**
- Encryption at rest (database) and in transit (TLS)
- Regular vulnerability assessment support (the app should not introduce vulnerabilities)
- Secure API design (rate limiting, input validation, authentication on all endpoints)

---

## 6. Credit Bureau Reporting

### CRILC (Central Repository of Information on Large Credits)
- Quarterly reporting to RBI for exposures >= Rs 5 crore
- Data includes borrower details, exposure amount, classification, SMA status

### Credit Information Companies (CICs)
- Report to all 4 bureaus: CIBIL (TransUnion), Experian, Equifax, CRIF High Mark
- Frequency: weekly reporting (from July 2026)
- Full monthly file + incremental weekly files (9th, 16th, 23rd, last day of month)
- Data: all loan accounts, payment history, DPD, NPA status, write-offs, settlements

### CERSAI (Central Registry of Securitisation)
- Register security interest (charge) for secured loans
- File within 30 days of creating the security interest
- Modify/satisfy charge on repayment or closure

---

## 7. Other Legal Requirements

### Interest Rate & Charges
- Interest rate must be annualized and disclosed as APR
- No usurious interest (RBI does not prescribe a cap, but Fair Practices Code applies)
- Penal charges: must be reasonable, disclosed upfront, cannot be capitalized (RBI Oct 2023 circular)
- Penal charges apply on the outstanding, not on the entire loan amount

### Recovery Practices
- No harassment, intimidation, or use of force
- Recovery calls only between 8 AM and 7 PM
- No third-party recovery agents without intimation to borrower
- All recovery agent details must be on NBFC's website
- System must log all recovery actions for audit

### Gold Loan Specific
- LTV cap: 75% of gold value (as per RBI)
- Auction: only after giving 2-week notice to borrower
- Transparent auction process, surplus returned to borrower
- Daily gold rate sourced from IBJA or approved source

### Microfinance Specific (NBFC-MFI)
- Household income assessment mandatory (annual household income <= Rs 3 lakh)
- Total indebtedness cap per borrower
- No prepayment penalty
- Loan to be disbursed to borrower's account (no cash disbursement above Rs 10,000)
- Pricing transparency: all-in cost disclosed as APR

### GST
- GST on processing fees, service charges, and other non-interest income
- System must calculate, collect, and report GST
- GST invoice generation

---

## Consequences for the Software

### Must-Have (built into architecture)
| Requirement | Implementation |
|---|---|
| KFS generation | Document template engine, mandatory before disbursement |
| Cooling-off enforcement | Date-based check in loan workflow, auto-reversal |
| DPD/NPA auto-classification | Nightly batch job or real-time calculation |
| Provisioning calculation | Auto-calculated per IRACP norms |
| Audit trail | Append-only log, every mutation, PII access |
| PII encryption at rest | Field-level encryption for PAN, Aadhaar, bank details |
| PII masking in UI | Show only last 4 digits unless authorized |
| Consent management | Consent capture, purpose tracking, withdrawal |
| Credit bureau reporting | Export in bureau-specified format (weekly) |
| PMLA reports (CTR/STR) | Report generation for FIU-IND submission |
| MFA for admins | TOTP or similar for privileged roles |
| Password policy | Configurable complexity, rotation, history |
| Session management | Timeout, concurrent session limits |
| Recovery time logging | All calls/visits logged with timestamp |

### Configurable (because requirements vary by SBR layer and NBFC type)
- SBR layer selection (adjusts which rules apply)
- Exposure norms thresholds
- KYC review frequency
- Data retention periods
- GST rates
- LTV caps (gold loan)
- MFI income thresholds
