# ADR-023: Credit Life Insurance Integration

**Status**: accepted
**Date**: 2026-10-24
**Toggleable**: Yes — Settings > Modules > Insurance

## Context

Credit life insurance covers the outstanding loan amount in case of borrower death or disability. Most NBFCs bundle it with loans — it protects the NBFC's exposure and provides borrower security. IRDAI is tightening rules on bundling (can't force purchase through the lender), and commissions are being capped. The system must handle insurance transparently per regulations.

---

## IRDAI Rules (2025-2026)

- Insurance **cannot be compulsory** with loans (borrower must have choice)
- Loan cost must be shown **with and without** insurance
- Borrower can buy insurance from **any provider** (not forced to use lender's partner)
- Premium must be disclosed in the KFS as a separate line item
- Commission caps being introduced (reducing lender's fee income)

---

## What the System Tracks

```
InsurancePolicy:
  id, loanAccountId, customerId
  provider                  — insurance company name
  policyNumber
  policyType                — CREDIT_LIFE | HEALTH | PROPERTY | VEHICLE
  coverAmount               — sum assured (paise) — typically = outstanding loan
  premium                   — total premium (paise)
  premiumPaymentMode        — SINGLE_UPFRONT | MONTHLY | ANNUAL
  premiumGst                — GST on premium (paise)
  startDate, endDate
  status                    — ACTIVE | LAPSED | CLAIMED | CANCELLED | EXPIRED
  nomineeDetails            — JSON {name, relation, phone}
  certificateDocumentId     — link to uploaded policy document
  bundledWithLoan           — boolean
  borrowerConsented         — boolean (must be true)
  consentRecordId           — link to ConsentRecord

InsurancePremiumPayment:
  id, policyId
  amount                    — paise
  gstAmount                 — paise
  dueDate, paidDate
  status                    — DUE | PAID | OVERDUE | LAPSED
  paymentReference

InsuranceClaim:
  id, policyId, loanAccountId
  claimType                 — DEATH | PERMANENT_DISABILITY | CRITICAL_ILLNESS
  claimDate
  claimAmount               — paise
  status                    — INITIATED | DOCUMENTS_SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | SETTLED
  settlementAmount          — paise (may differ from claim)
  settlementDate
  rejectionReason
  documents                 — JSON (death certificate, medical reports, etc.)
```

---

## Key Workflows

### At Loan Origination
1. Show borrower loan cost WITH and WITHOUT insurance (KFS requirement)
2. If borrower opts in → capture consent (separate from loan consent)
3. Record policy details (if NBFC's partner insurer) or ask borrower to provide external policy
4. Premium added as a fee line item → disclosed in KFS
5. Single premium deducted from disbursement OR monthly premium added to EMI

### During Loan Tenure
- Track premium payments (if recurring)
- Alert on policy expiry / lapse
- If loan outstanding decreases (reducing cover), some policies allow proportional reduction

### On Claim
1. Event occurs (death/disability)
2. NBFC or nominee initiates claim
3. Documents collected (death certificate, medical, FIR if applicable)
4. Submitted to insurer
5. If approved: settlement amount applied to loan outstanding
6. If settlement covers full outstanding → loan closed
7. If partial → remaining balance continues (nominee/guarantor liable)

---

## KFS Disclosure

The Key Fact Statement must show:
```
Loan Amount:            ₹1,50,000
Processing Fee:         ₹1,500
Insurance Premium:      ₹2,250  (optional — borrower may opt out)
Stamp Duty:             ₹100
Net Disbursement:       ₹1,46,150
Total Cost (with ins):  ₹1,83,456  APR: 14.2%
Total Cost (without):   ₹1,81,206  APR: 13.8%
```

---

## Configuration

```
Settings > Insurance:
  - Enabled: [yes/no]
  - Partner insurers: [add/edit]
  - Default policy type: [Credit Life]
  - Premium calculation: [percentage of loan / flat]
  - Premium rate: [X% of loan amount]
  - Payment mode: [Single upfront / Monthly / Annual]
  - Show opt-out option in application: [mandatory yes — per IRDAI]
  - Auto-deduct premium from disbursement: [yes/no]
```

---

## Consequences

- **Enables**: Insurance tracking, premium management, claim processing, transparent KFS disclosure
- **Trade-off**: Not an insurance policy issuance system — just tracks policies. Actual issuance is with the insurer.
- **Toggleable**: Many small NBFCs don't bundle insurance. Enable when they partner with an insurer.
