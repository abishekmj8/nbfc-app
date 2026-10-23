# ADR-008: Credit Bureau Integration

**Status**: accepted
**Date**: 2026-10-24

## Context

Credit bureau data is central to NBFC lending — used for underwriting decisions, portfolio monitoring, and regulatory reporting. NBFCs must report to all 4 bureaus but may pull from 1-2 based on cost and coverage. The app must handle both pulling reports and submitting data, with strict consent and dispute workflows.

---

## The 4 Bureaus

| Bureau | Full Name | Strength | Typical Users |
|---|---|---|---|
| **CIBIL** | TransUnion CIBIL | De-facto retail standard, widest coverage | Banks, large NBFCs |
| **Experian** | Experian India | Strong commercial + retail data | Banks, NBFCs |
| **Equifax** | Equifax India | Niche segments, growing coverage | NBFCs, fintechs |
| **CRIF** | CRIF High Mark | Best MFI + rural + MSME coverage, cheapest | MFIs, small NBFCs |

---

## Integration Approach: Bureau Aggregator

**Decision: Use a bureau aggregator API rather than direct integration with each bureau.**

Reasons:
- Aggregators normalize the response format across all 4 bureaus
- Handle consent capture, KYC matching, and error handling
- Single integration point instead of 4 separate APIs
- Most offer Account Aggregator data bundled in
- Easier to switch or add bureaus

**Aggregator options** (NBFC configures which one):
- FinBox, Roopya, Perfios, Lentra, IDfy, AuthBridge
- Or direct integration for large NBFCs who prefer it

**The app supports both:**
```
credit-bureau/
  adapter.ts              — common interface
  aggregator-adapter.ts   — aggregator API implementation (default)
  direct-cibil.ts         — direct CIBIL integration (optional)
  direct-experian.ts      — direct Experian integration (optional)
  direct-equifax.ts       — direct Equifax integration (optional)
  direct-crif.ts          — direct CRIF integration (optional)
```

Configuration determines which adapter is active per bureau.

---

## Credit Pull Workflow

### Step 1: Consent (MANDATORY before any pull)

```
consent_records table:
  id
  customer_id
  consent_type         — CREDIT_BUREAU_PULL
  consent_text         — exact text shown to customer
  consent_mode         — DIGITAL_SIGNATURE | CHECKBOX | PHYSICAL_FORM | ESIGN
  consented_at         — timestamp
  consented_via        — WEB | APP | BRANCH | DSA
  ip_address           — if digital
  bureaus_consented    — ["CIBIL", "EXPERIAN", "CRIF", "EQUIFAX"]
  purpose              — "Loan application #LA-2026-001234"
  validity_period      — consent valid for (e.g., 6 months)
  expires_at           — auto-calculated
  withdrawn            — boolean
  withdrawn_at         — timestamp (if withdrawn)
  document_ref         — link to signed consent document
```

**Rules:**
- Consent must name the specific bureau(s)
- Consent must state the purpose
- Consent is time-limited (configurable, typically 6 months)
- Must be obtained BEFORE the pull — system blocks pull without valid consent
- Consent records retained for **7 years minimum**
- Customer can withdraw consent (future pulls blocked, past pulls unaffected)

### Step 2: Credit Pull

```
credit_pulls table:
  id
  customer_id
  loan_application_id  — linked to the application
  consent_id           — must reference valid consent
  bureau               — CIBIL | EXPERIAN | EQUIFAX | CRIF
  pull_type            — HARD | SOFT
  request_timestamp
  response_timestamp
  status               — SUCCESS | FAILED | TIMEOUT | CONSENT_EXPIRED
  credit_score         — numeric score (300-900 range)
  score_version        — e.g., "CIBIL v2.0", "Experian v3"
  report_summary       — JSON: active loans, overdue count, total exposure, enquiry count
  raw_response         — encrypted JSON (full bureau response)
  pulled_by            — user who initiated
  error_message        — if failed
```

**Rules:**
- **Hard pull** — used for loan decisions, visible on borrower's report, affects score slightly
- **Soft pull** — used for pre-qualification or monitoring, not visible to borrower
- System must track pull count per customer (too many hard pulls = red flag)
- Failed pulls must be retried or escalated, not silently ignored
- Raw response stored encrypted (contains PII)

### Step 3: Score Interpretation

Configurable rules engine — each NBFC sets their own thresholds:

```
bureau_score_rules table:
  id
  loan_product_id      — rules can vary by product
  bureau               — which bureau this rule applies to
  score_min            — lower bound
  score_max            — upper bound
  risk_category        — GREEN | YELLOW | RED | NTC
  action               — AUTO_APPROVE_ELIGIBLE | MANUAL_REVIEW | ENHANCED_SCRUTINY | ALTERNATIVE_ASSESSMENT
  max_auto_approve_amt — auto-approval limit for this category (optional)
  active               — boolean
```

**Default categories:**
| Score Range | Category | Meaning |
|---|---|---|
| 750+ | GREEN | Low risk, eligible for auto-approval |
| 650-749 | YELLOW | Medium risk, manual review required |
| Below 650 | RED | High risk, enhanced scrutiny (NOT auto-reject) |
| No score | NTC (New To Credit) | First-time borrower, alternative assessment |

**Critical rule: The system CANNOT auto-reject based on credit score alone.**
- RBI prohibits rejecting first-time borrowers for having no score
- Every rejection must have a specific, documented reason
- Credit score is one input to the decision, not the decision itself

### Step 4: Decision & Rejection Handling

```
credit_decisions table:
  id
  loan_application_id
  credit_pull_id
  decision             — APPROVED | REJECTED | REFERRED_TO_MANAGER
  decision_by          — user who made the decision
  decision_at          — timestamp
  rejection_reason     — mandatory if rejected (free text + reason code)
  rejection_code       — standardized: LOW_SCORE | HIGH_EXPOSURE | OVERDUE_HISTORY | INSUFFICIENT_INCOME | etc.
  rejection_communicated — boolean
  rejection_communicated_at — timestamp
  rejection_communicated_via — SMS | EMAIL | LETTER | IN_PERSON
```

**Rules:**
- Rejection reason is **mandatory** — system blocks rejection without reason
- Reason must be communicated to the borrower
- Communication must be logged (when, how)
- Borrower can dispute — links to grievance workflow

---

## Bureau Reporting (Outbound)

### What NBFCs must report

All loan accounts to all 4 bureaus, including:
- Account opened/closed/updated
- Payment history (paid, overdue, DPD)
- Outstanding balance
- NPA/write-off/settlement status
- Current credit limit (for OD/CC facilities)

### Reporting frequency (from July 2026)

| Submission | Date | Type |
|---|---|---|
| Weekly file 1 | 9th of month | Incremental |
| Weekly file 2 | 16th of month | Incremental |
| Weekly file 3 | 23rd of month | Incremental |
| Weekly file 4 | Last day of month | Incremental |
| Monthly full file | Last day of month | Full snapshot |

### Report format

Each bureau has its own file format specification. The app generates:

```
bureau_reports table:
  id
  bureau               — CIBIL | EXPERIAN | EQUIFAX | CRIF
  report_type          — INCREMENTAL | FULL
  period_start
  period_end
  record_count         — number of accounts in the file
  file_path            — generated file location
  file_hash            — SHA-256 for integrity
  status               — GENERATED | SUBMITTED | ACCEPTED | REJECTED | ERROR
  submitted_at
  rejection_reason     — if bureau rejected the file
  generated_by
  generated_at
```

**The app provides:**
- Automated report generation (scheduled job on reporting dates)
- Pre-submission validation (catch errors before sending)
- Submission tracking (status per bureau per period)
- Error/rejection handling with correction workflow
- Dashboard showing reporting compliance status

---

## Credit Monitoring (Post-Disbursement)

For active loans, periodic credit monitoring:

- **Trigger-based pulls**: auto-pull when loan becomes SMA-1 or SMA-2
- **Periodic portfolio review**: configurable (quarterly/half-yearly)
- **Alert on score drop**: if borrower's score drops below threshold, flag for review
- **Multi-borrower check**: for group/related party exposure monitoring

All monitoring pulls use **soft pull** (doesn't affect borrower's score).

---

## Dispute Handling

When a borrower disputes their credit report data:

```
bureau_disputes table:
  id
  customer_id
  bureau               — which bureau the dispute is with
  dispute_type         — INCORRECT_DPD | WRONG_BALANCE | ACCOUNT_NOT_MINE | CLOSED_SHOWING_OPEN | etc.
  dispute_details      — borrower's description
  received_at
  received_via         — BRANCH | EMAIL | GRIEVANCE_PORTAL | OMBUDSMAN
  loan_account_id      — affected account
  current_reported_value — what was reported
  correct_value        — what should be reported
  status               — RECEIVED | UNDER_REVIEW | CORRECTED | REJECTED | ESCALATED
  resolved_at
  resolution_details
  corrected_in_next_report — boolean
  sla_deadline         — 30 days from received_at (RBI mandate)
```

**Rules:**
- NBFC must respond within **30 days** (RBI mandate)
- If dispute is valid, correct data in next bureau submission
- If rejected, provide written reason to borrower
- Borrower can escalate to RBI Ombudsman
- All disputes are audit-logged

---

## Configuration (per NBFC deployment)

```
Settings > Credit Bureau Configuration:
  - Active bureaus: [checkbox per bureau]
  - Bureau for credit pull: [select primary + fallback]
  - Integration mode: Aggregator | Direct
  - Aggregator provider: [dropdown]
  - API credentials: [per bureau or aggregator]
  - Score thresholds: [configurable per product]
  - Auto-pull on application: [yes/no]
  - Monitoring frequency: [quarterly/half-yearly/annual]
  - Report generation schedule: [auto on RBI dates / manual]
```

---

## Consequences

- **Enables**: Compliant credit decisioning, full audit trail on every pull and decision, automated bureau reporting, dispute tracking within SLA
- **Trade-off**: Aggregator adds a vendor dependency and per-pull cost — but saves 4x integration effort
- **Trade-off**: Storing raw bureau responses increases storage — but needed for audit/dispute resolution
- **Architecture impact**: Bureau adapter pattern allows switching providers without changing business logic. Consent system is reusable for other consent-driven features (Aadhaar, DPDP).
