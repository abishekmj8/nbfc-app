# ADR-016: Interest Calculation Engine

**Status**: accepted
**Date**: 2026-10-24

## Context

Interest calculation is the mathematical core of an NBFC. Getting it wrong by even 1 paisa per day compounds into audit findings, customer disputes, and regulatory issues. The RBI's draft Interest Rate Directions 2026 mandate daily reducing balance with Actual/Actual day-count for all new loans from April 2027. The engine must support multiple methods (for legacy and transition) but default to the RBI-mandated method.

---

## Interest Calculation Methods

### Method 1: Daily Reducing Balance (RBI mandated — DEFAULT)

**How it works:**
- Interest calculated daily on the outstanding principal balance
- Each payment reduces principal → next day's interest is lower
- Interest charged at monthly rests (accumulated daily interest debited monthly)

**Formula:**
```
Daily interest = Outstanding principal × (Annual rate / Days in year)

Where:
  Outstanding principal = Previous principal - principal portion of last payment
  Days in year = Actual days in the calendar year (365 or 366)
```

**Example:**
```
Loan: Rs 1,00,000 at 12% p.a.
Day 1 principal: Rs 1,00,000
Daily interest = 1,00,000 × (12/100) / 365 = Rs 32.88

After first EMI of Rs 8,884.88:
  Interest portion: Rs 986.30 (accumulated daily interest for month)
  Principal portion: Rs 7,898.58
  New principal: Rs 92,101.42
Day 31+ daily interest = 92,101.42 × (12/100) / 365 = Rs 30.28
```

**This is the default and recommended method.**

### Method 2: Monthly Reducing Balance (legacy — being phased out)

**How it works:**
- Interest calculated monthly on the principal at the start of each month
- Simpler but slightly less favorable to borrower than daily reducing

**Formula:**
```
Monthly interest = Outstanding principal × (Annual rate / 12)
```

**Status:** Allowed for existing loans. New loans from April 2027 must use daily reducing balance.

### Method 3: Flat Rate (NOT recommended — being phased out)

**How it works:**
- Interest calculated on the ORIGINAL principal for the entire tenure
- Does not reduce as principal is repaid
- Effective rate is roughly double the stated flat rate

**Formula:**
```
Total interest = Original principal × Annual rate × Tenure in years
EMI = (Principal + Total interest) / Number of months
```

**Status:** RBI draft directions prohibit flat rate. The app supports it for legacy data but shows a warning: "Flat rate is being phased out by RBI. Consider switching to reducing balance."

### Method 4: Rule of 78 (NOT recommended)

**How it works:**
- Pre-computed interest allocation that front-loads interest in early EMIs
- Used for prepayment/foreclosure calculation in some legacy systems

**Status:** Not RBI-mandated. Supported only for foreclosure calculation if configured, with a warning. Default foreclosure uses actual outstanding method.

---

## Day-Count Convention

### Actual/Actual (RBI mandated — DEFAULT)

```
Daily rate = Annual rate / Actual days in the year
  - Non-leap year: Annual rate / 365
  - Leap year: Annual rate / 366

Interest for a period = Principal × Daily rate × Actual days in the period
```

### 30/360 (not used in India, but supported for reference)

```
Daily rate = Annual rate / 360
Every month = 30 days
```

**Decision:** Default to **Actual/Actual**. Configurable per product for legacy compatibility.

---

## EMI Calculation

### Standard EMI (Equal Monthly Installment)

```
EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)

Where:
  P = Principal amount (in paise)
  r = Monthly interest rate = Annual rate / 12 / 100
  n = Tenure in months
```

**All calculations in paise (BigInt). Convert to rupees only for display.**

### Rounding Rules

- Interest per day: round to nearest paisa (half-up)
- EMI amount: round up to nearest rupee (standard banking practice)
- Last EMI: adjusted to clear the exact remaining balance (may differ from other EMIs)
- Running balance: never negative (if overpaid, create a refund)

### EMI Schedule Generation

```
emi_schedule table:
  id
  loanAccountId
  installmentNumber     — 1, 2, 3, ...
  dueDate               — when this EMI is due
  emiAmount              — total EMI (paise)
  principalComponent     — principal portion (paise)
  interestComponent      — interest portion (paise)
  openingBalance         — principal at start of period (paise)
  closingBalance         — principal at end of period (paise)
  status                 — UPCOMING | DUE | PAID | OVERDUE | PARTIALLY_PAID
  paidAmount             — actual amount paid (paise)
  paidDate               — when payment was received
  daysOverdue            — DPD for this installment
  penalInterest          — penal interest charged (paise)
```

---

## Interest Types

### Fixed Rate
- Rate stays constant throughout the loan tenure
- Stored as: `interestRate` on the loan account

### Floating Rate
- Rate linked to a benchmark (e.g., RBI repo rate, MCLR, prime rate)
- Changes when benchmark changes
- Stored as: `benchmarkRate + spread`

```
loan_account:
  interestType          — FIXED | FLOATING
  interestRate          — current effective rate (for fixed, this never changes)
  benchmarkType         — REPO_RATE | MCLR | PRIME_RATE | CUSTOM (for floating)
  benchmarkRate         — current benchmark rate
  spread                — margin over benchmark
  effectiveRate         — benchmarkRate + spread (auto-calculated)
  rateChangeHistory     — JSON array of {date, oldRate, newRate, reason}
```

**When benchmark changes:**
1. System recalculates effective rate
2. Option A: EMI changes, tenure stays same
3. Option B: Tenure changes, EMI stays same
4. Option chosen at product level or per-loan
5. Borrower notified of rate change
6. New EMI schedule generated from the change date

### Hybrid (fixed for initial period, then floating)
- E.g., 2 years fixed at 10%, then floating at repo + 4%
- System tracks the switch date and auto-transitions

---

## Penal Interest / Charges

### RBI rules (October 2023 circular + Draft Directions 2026):
- Penal charges must be **reasonable**
- Cannot be **capitalized** (not added to principal for further interest calculation)
- Must be disclosed upfront in KFS and loan agreement
- Applied on the **overdue amount**, not the entire outstanding

### Implementation:

```
Penal charge = Overdue amount × Penal rate × Days overdue / Days in year

Where:
  Overdue amount = sum of overdue EMI amounts (not total outstanding)
  Penal rate = configured per product (e.g., 2% p.a. over normal rate)
  Days overdue = actual days past the due date
```

```
penal_charges table:
  id
  loanAccountId
  installmentNumber     — which EMI is overdue
  overdueAmount         — the unpaid EMI amount (paise)
  penalRate             — rate applied
  daysOverdue
  penalAmount           — calculated charge (paise)
  collectedAmount       — how much has been collected
  waivedAmount          — how much was waived (with approval)
  status                — ACCRUED | COLLECTED | WAIVED | PARTIALLY_COLLECTED
```

**Penal amount is tracked separately — never added to principal.**

---

## Interest Accrual

### Daily accrual process (scheduled job)

```
For each active loan:
  1. Calculate daily interest on current outstanding principal
  2. Add to accrued_interest (accumulated but not yet due)
  3. On EMI due date: move accrued interest to "due" status
  4. Post journal entry: Dr. Interest Receivable, Cr. Interest Income
```

### NPA interest reversal

When a loan becomes NPA (90+ DPD):
- Stop accruing interest on accrual basis
- Reverse any unrealized interest income from P&L
- Interest recognized only on cash basis (when actually received)
- System automatically handles this transition based on DPD

```
interest_accrual table:
  id
  loanAccountId
  accrualDate           — the day this interest was calculated for
  principalBalance      — principal on this day (paise)
  interestRate          — rate used
  dailyInterest         — interest for this day (paise)
  accrualStatus         — ACCRUED | REVERSED_NPA | COLLECTED
  journalEntryId        — link to accounting entry
```

---

## Prepayment / Foreclosure

### Foreclosure calculation

```
Foreclosure amount = Outstanding principal
                   + Accrued interest (till foreclosure date)
                   + Any overdue amounts
                   + Penal charges (if any)
                   + Foreclosure fee (if applicable, per product config)
                   - Waiver (if approved)
```

### RBI rules:
- No prepayment penalty on floating-rate loans (for individual borrowers)
- Fixed-rate loans: prepayment fee must be reasonable and disclosed upfront
- System enforces this rule based on interest type and borrower type

### Part-prepayment

- Borrower pays extra amount towards principal
- System recalculates:
  - Option A: Reduce EMI, same tenure
  - Option B: Reduce tenure, same EMI
  - Option C: Borrower chooses
- New EMI schedule generated from the part-prepayment date

---

## Calculation Engine Architecture

```
src/lib/interest/
  engine.ts                — main calculation engine
  methods/
    daily-reducing.ts      — daily reducing balance (default)
    monthly-reducing.ts    — monthly reducing balance (legacy)
    flat-rate.ts           — flat rate (legacy, with warning)
  day-count/
    actual-actual.ts       — Actual/Actual (default)
    thirty-360.ts          — 30/360 (reference only)
  emi-calculator.ts        — EMI formula + schedule generation
  penal-calculator.ts      — penal interest/charges
  accrual-service.ts       — daily accrual job
  foreclosure-calculator.ts — prepayment/foreclosure
  npa-handler.ts           — NPA interest reversal logic
  types.ts                 — all types and interfaces
  __tests__/               — extensive test coverage
```

**Testing requirements for this module are HIGHER than any other:**
- Every calculation method tested with known-good expected values
- Edge cases: leap year, month-end, 28/29/30/31 day months
- Rounding tested: verify no accumulated rounding errors over 360-month tenure
- NPA transition tested: accrual → reversal → cash basis → upgrade
- Penal interest tested: capitalization must NOT happen
- Cross-verified with Excel-based calculations (standard NBFC practice)

---

## Configuration (per loan product)

```
Loan Product settings:
  - Interest method: Daily Reducing | Monthly Reducing | Flat Rate
  - Day-count convention: Actual/Actual | 30/360
  - Interest type: Fixed | Floating | Hybrid
  - Benchmark (if floating): Repo Rate | Custom
  - Spread: X% over benchmark
  - Penal rate: X% p.a.
  - Penal applies on: Overdue installments | Outstanding amount
  - Prepayment fee: X% (0% for floating rate individual loans)
  - EMI rounding: Round up to nearest rupee | Round to nearest paisa
  - Rate change effect: Change EMI | Change Tenure | Borrower chooses
```

---

## Consequences

- **Enables**: Accurate, auditable, RBI-compliant interest calculations across all loan types
- **Trade-off**: Daily accrual job adds a nightly batch process — but is standard for any lending system
- **Trade-off**: Supporting legacy methods (flat rate, monthly reducing) adds code complexity — but necessary for existing loan book migration
- **Critical**: This module needs the most thorough testing of any module in the app. Financial calculations must be provably correct.
