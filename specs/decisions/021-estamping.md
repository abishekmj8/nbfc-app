# ADR-021: e-Stamping for Loan Agreements

**Status**: accepted
**Date**: 2026-10-24
**Toggleable**: Yes — Settings > Modules > e-Stamping

## Context

Loan agreements in India require stamp duty payment. Physical stamp papers are being phased out — digital e-stamping is mandatory across India from July 1, 2025. Stamp duty rates vary by state and loan type. Two platforms handle this: SHCIL (general) and NeSL (financial lending-specific).

---

## Platforms

| Platform | Full Name | Best for |
|---|---|---|
| **NeSL** | National E-Governance Services Ltd | Lending workflows (integrates eStamp + eSign in one flow) |
| **SHCIL** | Stock Holding Corporation of India | General-purpose stamping |
| **GRAS** | Government Receipt Accounting System | Some states route through GRAS |

**Recommendation**: NeSL for NBFCs — designed specifically for financial lending.

---

## Stamp Duty Rates (examples — vary by state)

| State | Loan Agreement | Mortgage |
|---|---|---|
| Maharashtra | 0.1% of loan amount (max Rs 10L) | 0.3% |
| Karnataka | 0.5% | 0.5% |
| Tamil Nadu | Rs 100 flat (unsecured) | 1% |
| Delhi | Rs 100 flat | 1% |
| Gujarat | 0.1% | 0.25% |

**Rates are configurable per state in the system** — each NBFC sets rates for states they operate in.

---

## Integration Flow

```
1. Loan sanctioned → system calculates stamp duty based on state + loan amount
2. System calls NeSL/SHCIL API to purchase e-stamp
3. e-Stamp certificate number received
4. Certificate embedded in loan agreement PDF
5. eSigned agreement includes stamp reference
6. Stamp duty amount recorded as a charge (passed to borrower or absorbed by NBFC)
```

---

## Data Model

```
StampDutyConfig:
  id, state, documentType
  calculationType           — PERCENTAGE | FLAT
  rate                      — percentage or flat amount (paise)
  maxAmount                 — cap if any (paise)
  paidBy                    — BORROWER | NBFC | SPLIT

StampRecord:
  id, loanApplicationId, documentId
  provider                  — NESL | SHCIL | MANUAL
  state                     — state where stamp is purchased
  stampCertificateNumber    — unique certificate ID
  stampAmount               — duty paid (paise)
  purchasedAt
  status                    — PURCHASED | APPLIED | FAILED
  providerReference         — external ID
```

---

## Configuration

```
Settings > e-Stamping:
  - Enabled: [yes/no]
  - Provider: [NeSL / SHCIL / Manual]
  - API credentials
  - Stamp duty rates: [per state, per document type]
  - Default payer: [Borrower / NBFC]
  - Auto-stamp on sanction: [yes/no]
```

**When disabled**: NBFC handles stamp duty offline (physical stamp paper or manual e-stamp purchase). System records the stamp certificate number manually.

---

## Consequences

- **Enables**: Fully digital stamp duty payment, auto-calculated per state, integrated with eSign flow
- **Trade-off**: State-wise rate configuration requires maintenance when rates change
- **Toggleable**: NBFC can handle stamping offline and just record the certificate number
