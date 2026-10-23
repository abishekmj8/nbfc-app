# ADR-022: Co-Lending & Loan Assignment

**Status**: accepted
**Date**: 2026-10-24
**Toggleable**: Yes — Settings > Modules > Co-Lending

## Context

Co-lending is a major funding strategy for NBFCs. Under RBI's Co-Lending Arrangements (CLA) Directions 2025 (effective January 2026), NBFCs can co-originate loans with banks — the bank funds 80% and the NBFC funds 20% (typical split). This significantly expands the NBFC's lending capacity. Loan assignment/securitization is the other channel — selling existing loans to banks/other NBFCs.

---

## Two Models (post-2025 Directions)

### CLM-1: Irrevocable Commitment (the only co-lending model now)
- Both bank and NBFC co-originate the loan jointly
- Both names on the loan agreement
- Simultaneous disbursement from both parties
- Bank's share (typically 80%) is on the bank's books from day one
- NBFC retains 20% on its own books
- Both parties share credit risk proportionally

### Loan Assignment (Transfer of Loan Exposures)
- NBFC originates and disburses 100% of the loan
- Later, sells/assigns a portion (or full) to a bank
- Governed by RBI's Transfer of Loan Exposures (TLE) Directions
- NBFC may retain servicing rights (continues collecting EMIs)
- Minimum Retention Requirement (MRR): NBFC must retain at least 10% (or 5% for priority sector)

**Note**: CLM-2 (discretionary cherry-picking) has been eliminated by RBI 2025 Directions.

---

## Data Model

```
CoLendingPartner:
  id, companyId
  partnerName               — bank name
  partnerType               — BANK | NBFC | HFC | AIFI
  agreementDate
  defaultSplitRatio         — JSON {nbfc: 20, partner: 80}
  products                  — which loan products covered
  status                    — ACTIVE | SUSPENDED | TERMINATED
  contactDetails            — JSON
  apiConfig                 — JSON (if partner has API for data exchange)

CoLendingLoan:
  id, loanAccountId, partnerId
  model                     — CLM1 | LOAN_ASSIGNMENT
  nbfcShare                 — percentage (e.g., 20)
  partnerShare              — percentage (e.g., 80)
  nbfcAmount                — paise
  partnerAmount             — paise
  nbfcInterestRate          — rate on NBFC's portion
  partnerInterestRate       — rate on partner's portion
  blendedRate               — effective rate to borrower
  assignmentDate            — when loan was assigned (for TLE)
  mrrRetained               — minimum retention (paise)
  servicingRights           — NBFC | PARTNER | SHARED
  status                    — ACTIVE | SETTLED | BUYBACK
  partnerLoanReference      — partner's internal reference

CoLendingPayment:
  id, paymentId, coLendingLoanId
  nbfcShareAmount           — NBFC's portion of payment (paise)
  partnerShareAmount        — partner's portion (paise)
  remittedToPartner         — boolean
  remittanceDate
  remittanceReference
```

---

## Key Workflows

### Co-origination (CLM-1)
1. Loan application processed normally (LOS)
2. At sanction, mark as co-lending → select partner, set split ratio
3. Loan agreement shows both NBFC and bank as lenders
4. Disbursement: both parties disburse their shares simultaneously
5. EMI collection: NBFC collects full EMI, remits partner's share
6. NPA classification: both parties classify independently but must use common approach (per RBI 2025)

### Loan Assignment (TLE)
1. Loan originated and disbursed by NBFC (100%)
2. After seasoning period (if any), NBFC decides to assign
3. Create assignment pool (select loans meeting partner's criteria)
4. Partner approves pool
5. Assignment executed: partner pays NBFC for their share
6. NBFC retains MRR (10% minimum)
7. If servicing retained: NBFC continues collection, remits partner's share
8. Reporting: assigned loans reported separately in books

---

## Reporting

Co-lending requires separate tracking for:
- Own book vs co-lent portfolio
- Partner-wise portfolio summary
- Remittance status (what's owed to partner, what's been sent)
- NPA classification per partner agreement
- MRR compliance check

---

## Configuration

```
Settings > Co-Lending:
  - Enabled: [yes/no]
  - Partners: [add/edit co-lending partners]
  - Default model: [CLM-1 / Loan Assignment]
  - Auto-split payments: [yes/no]
  - Remittance schedule: [daily / weekly / monthly]
  - MRR enforcement: [10% / 5% (priority sector) / custom]
```

---

## Consequences

- **Enables**: 4-5x lending capacity with co-lending banks, loan book monetization via assignment
- **Trade-off**: Complex accounting (two-way splits on every payment, NPA sync)
- **Trade-off**: Requires partner bank cooperation (API or manual file exchange)
- **Toggleable**: Most small NBFCs won't co-lend initially. Enable when they get a bank partner.
