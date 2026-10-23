# ADR-019: Account Aggregator (AA) Integration

**Status**: accepted
**Date**: 2026-10-24
**Toggleable**: Yes — Settings > Modules > Account Aggregator

## Context

The Account Aggregator (AA) framework is RBI's consent-based financial data sharing system. Instead of asking borrowers for physical bank statements, NBFCs can digitally pull verified financial data with the borrower's consent. It's governed by RBI, SEBI, IRDAI, and PFRDA jointly, with Sahamati as the SRO (recognized June 2026). Rapidly becoming the standard for underwriting in India.

---

## What AA Provides

| Data Type | Source | Use in NBFC |
|---|---|---|
| Bank account statements | Banks | Cash flow analysis, income verification |
| Deposit accounts | Banks | Asset verification |
| Mutual fund holdings | Depositories (CAMS, KFintech) | Asset verification |
| Insurance policies | Insurers | Existing coverage check |
| Tax filings (GST) | GSTN | Business income verification (MSME loans) |
| Pension data | PFRDA | Income verification |

---

## Integration Architecture

The AA ecosystem has 3 parties:
1. **FIU (Financial Information User)** — the NBFC (us). Requests data.
2. **FIP (Financial Information Provider)** — banks, insurers, depositories. Provides data.
3. **AA (Account Aggregator)** — licensed intermediary. Routes consent and data.

```
NBFC App (FIU)  ←→  AA Operator  ←→  Bank/FIP
                     (OneMoney, Finvu,
                      Setu, Anumati, etc.)
```

**Integration approach**: Via AA gateway/TSP (Technology Service Provider) like Setu, Finvu, Saafe, or direct ReBIT API integration.

```
src/lib/account-aggregator/
  adapter.ts                  — common interface
  setu-adapter.ts             — Setu AA gateway
  finvu-adapter.ts            — Finvu gateway
  types.ts                    — FI data types, consent types
```

---

## Consent Flow

```
1. Loan officer initiates AA data request for customer
2. App creates consent request:
   - Purpose: "Loan underwriting for application #LA-2026-001234"
   - Data types: Bank statements (last 6 months)
   - Frequency: One-time
   - Data life: 6 months (how long NBFC can keep the data)
3. Customer receives consent request on their AA app
4. Customer reviews and approves (or rejects)
5. AA fetches data from FIP(s)
6. Encrypted data delivered to NBFC
7. NBFC decrypts and processes (bank statement analysis)
```

---

## Data Model

```
AaConsent:
  id, customerId, loanApplicationId
  aaProvider                — SETU | FINVU | SAAFE | DIRECT
  consentHandle             — AA's consent reference
  purpose                   — LOAN_UNDERWRITING | MONITORING | KYC_REFRESH
  fiTypes                   — ["DEPOSIT", "MUTUAL_FUND", "INSURANCE"]
  dateRange                 — from/to for requested data
  dataLife                  — how long data can be retained
  frequency                 — ONE_TIME | MONTHLY | QUARTERLY
  status                    — REQUESTED | APPROVED | REJECTED | EXPIRED | REVOKED
  requestedAt, approvedAt, revokedAt
  expiresAt

AaDataFetch:
  id, consentId, customerId
  fiType                    — DEPOSIT | MUTUAL_FUND | etc.
  fipId                     — which bank/institution
  accountRef                — masked account reference
  fetchStatus               — PENDING | SUCCESS | PARTIAL | FAILED
  dataEncrypted             — encrypted raw data (JSON)
  dataDecrypted             — decrypted data (JSON, access-logged)
  fetchedAt
  dataExpiresAt             — when NBFC must delete this data

AaBankAnalysis:
  id, dataFetchId, loanApplicationId
  accountType               — SAVINGS | CURRENT
  averageBalance            — paise (6-month average)
  monthlyInflows            — JSON array of monthly totals
  monthlyOutflows           — JSON array of monthly totals
  bounceCount               — cheque/mandate bounces detected
  salaryDetected            — boolean
  estimatedMonthlyIncome    — paise
  emiObligations            — existing EMIs detected (paise/month)
  cashFlowScore             — computed score (0-100)
  redFlags                  — JSON (irregular patterns, sudden drops, etc.)
  analyzedAt
```

---

## Bank Statement Analysis

When bank statement data arrives, auto-analyze:

1. **Income detection**: Identify salary credits, business receipts, rental income
2. **Existing obligations**: Detect EMI outflows to other lenders
3. **Cash flow stability**: Monthly variance, trend (improving/declining)
4. **Bounce history**: Cheque/mandate bounces in the statement
5. **Average balance**: Monthly and 6-month average
6. **Red flags**: Sudden large withdrawals, circular transactions, dormant periods

This analysis feeds into the credit appraisal (Phase 3) as a data point alongside credit bureau score.

---

## Privacy & Data Handling

Per DPDP Act + AA framework rules:
- Data is **encrypted end-to-end** (NBFC holds decryption key)
- Data retained only for the `dataLife` period specified in consent
- When `dataExpiresAt` is reached, data is **auto-deleted** (scheduled job)
- Every access to AA data is audit-logged
- Customer can revoke consent anytime → NBFC must stop using the data
- Raw data never exposed in UI — only the analysis summary

---

## Configuration

```
Settings > Account Aggregator:
  - Enabled: [yes/no]
  - AA Provider: [Setu / Finvu / Saafe / Direct]
  - API credentials
  - Default data types to request: [Bank statements, MF, Insurance]
  - Default date range: [3 months / 6 months / 12 months]
  - Auto-analyze on fetch: [yes/no]
  - Data retention period: [as per consent / max 6 months]
```

---

## Consequences

- **Enables**: Digital bank statement analysis (no more PDFs), faster underwriting, verified data (no fakes), better credit decisions
- **Trade-off**: Customer must have an AA-linked bank account (adoption is high but not 100%)
- **Trade-off**: Depends on AA operator (per-fetch cost)
- **Toggleable**: NBFC can disable and use manual bank statement uploads instead
