# ADR-018: NACH / UPI AutoPay — Automated EMI Collection

**Status**: accepted
**Date**: 2026-10-24
**Toggleable**: Yes — Settings > Modules > Payment Automation

## Context

~90% of EMI collections in Indian NBFCs happen via NACH (National Automated Clearing House) or UPI AutoPay. Without this, the NBFC relies on manual payment collection — unscalable. Approximately 1 in 4 auto-debits bounce, so bounce handling and retry logic are critical.

---

## How It Works

### NACH (e-NACH)
1. Customer signs an e-NACH mandate (digital consent via Aadhaar OTP or net banking)
2. NBFC submits mandate to NPCI via a **sponsor bank**
3. NPCI registers the mandate (24-48 hours for e-NACH, 5-10 days for physical)
4. On EMI due date, NBFC instructs sponsor bank to debit customer's account
5. NPCI processes the debit, returns success or failure (return reason code)

### UPI AutoPay
1. Customer sets up recurring mandate via UPI app (Google Pay, PhonePe, etc.)
2. Mandate registered on UPI platform
3. On due date, debit instruction sent via UPI
4. Pre-transaction notification sent 24 hours before debit (NPCI mandate)
5. Debits up to Rs 15,000: no additional auth needed. Above Rs 15,000: requires customer approval

---

## Integration Approach

**NBFCs cannot access NACH directly** — must go through a sponsor bank or payment aggregator.

```
Payment Aggregator Adapter (like Razorpay, Cashfree, PayU, Decentro)
  ├── e-NACH mandate creation
  ├── UPI AutoPay mandate creation
  ├── Debit instruction submission
  ├── Status callbacks (webhook)
  └── Reconciliation file download
```

**Adapter pattern** (same as credit bureau): interface + provider-specific implementations.

```
src/lib/payment-automation/
  adapter.ts                    — common interface
  razorpay-adapter.ts           — Razorpay implementation
  cashfree-adapter.ts           — Cashfree implementation
  generic-adapter.ts            — manual/CSV-based for banks without API
```

---

## Data Model

```
Mandate:
  id, loanAccountId, customerId
  type                    — NACH | UPI_AUTOPAY
  provider                — RAZORPAY | CASHFREE | MANUAL
  providerMandateId       — external reference
  bankAccountId           — customer's bank account
  upiId                   — for UPI AutoPay
  maxAmount               — maximum debit per transaction (paise)
  frequency               — MONTHLY | QUARTERLY | AS_PRESENTED
  startDate, endDate
  status                  — PENDING | REGISTERED | ACTIVE | PAUSED | CANCELLED | EXPIRED | FAILED
  registeredAt, cancelledAt
  failureReason           — if registration failed
  sponsorBank             — bank facilitating the mandate

DebitInstruction:
  id, mandateId, loanAccountId
  amount                  — EMI amount (paise)
  scheduledDate           — when to debit
  status                  — SCHEDULED | SUBMITTED | SUCCESS | BOUNCED | CANCELLED
  providerTransactionId   — external reference
  submittedAt, processedAt
  returnReasonCode        — NPCI return code if bounced
  returnReason            — human-readable reason
  retryCount
  retryScheduledAt

BounceRecord:
  id, debitInstructionId, loanAccountId
  bounceDate
  reasonCode              — INSUFFICIENT_FUNDS | ACCOUNT_CLOSED | MANDATE_NOT_REGISTERED | SIGNATURE_MISMATCH | TECHNICAL_DECLINE | etc.
  bounceCharges           — fee applied (paise)
  retryAction             — AUTO_RETRY | MANUAL_COLLECTION | SKIP
  retried                 — boolean
  retriedAt
```

---

## Mandate Lifecycle

```
Customer signs e-NACH/UPI mandate
  → Status: PENDING
  → Submit to payment aggregator
  → Aggregator submits to NPCI via sponsor bank
  → Webhook: registration success → Status: ACTIVE
  → Webhook: registration failed → Status: FAILED (log reason)

On EMI due date (T):
  T-1 day: Send pre-debit notification to customer (NPCI mandate)
  T: Submit debit instruction to aggregator
  T+1 to T+3: Processing
  Webhook: Success → Payment recorded, allocation applied
  Webhook: Bounce → BounceRecord created, bounce charges applied

Customer cancels mandate (CASR — Cancel/Amend/Suspend/Revoke):
  → Webhook notification
  → Status: CANCELLED
  → Alert to NBFC: "Mandate cancelled for LA-2026-001234"
  → Fall back to manual collection
```

---

## Bounce Handling

### Return Reason Codes (NPCI)

| Code | Reason | Auto-Retry? | Action |
|---|---|---|---|
| `68` | Insufficient funds | Yes (after 3 days) | Retry once, then manual |
| `03` | No account / account closed | No | Mark mandate invalid, manual collection |
| `12` | Invalid / absent mandate | No | Re-register mandate |
| `57` | Transaction not permitted | No | Investigate, contact bank |
| `96` | Technical decline | Yes (next day) | Auto-retry |
| `AM` | Amount exceeds limit | No | Split or manual collection |

### Retry Strategy (configurable per NBFC)
- Auto-retry: once after 3 business days for insufficient funds
- Max retries: 2 per instruction (configurable)
- After max retries: mark as failed, create collection task
- Bounce charges: auto-applied per fee configuration (ADR Fee & Charges module)
- Bounce notification: SMS/email to customer

---

## Pre-Debit Notification (mandatory from 2025)

NPCI requires 24-hour advance notification before every recurring debit:

```
SMS/Email to customer:
"Dear {name}, Rs {amount} will be debited from A/c ending {last4} on {date} for your loan {loanId} EMI. Contact {nbfc_phone} for queries."
```

- System auto-generates and sends T-1 day
- Logged in communication log
- If notification fails, debit should still proceed (notification is best-effort per NPCI)

---

## Reconciliation

Daily reconciliation between:
1. Debit instructions sent by the app
2. Settlement reports from the payment aggregator
3. Actual payments received in the NBFC's bank account

```
ReconciliationRecord:
  id, date
  instructionsSent         — count
  successCount, bounceCount, pendingCount
  totalAmountDebited       — paise
  totalAmountSettled        — paise (after aggregator fees)
  discrepancies            — JSON (mismatches found)
  status                   — MATCHED | HAS_DISCREPANCIES | PENDING
  reconciledBy, reconciledAt
```

---

## Configuration

```
Settings > Payment Automation:
  - Provider: [Razorpay / Cashfree / PayU / Manual]
  - API credentials: [key, secret, webhook URL]
  - Sponsor bank: [dropdown]
  - Default mandate type: [NACH / UPI AutoPay / Both]
  - Auto-retry on bounce: [yes/no]
  - Max retries: [1-3]
  - Retry delay (days): [1-5]
  - Bounce charges: [link to Fee & Charges module]
  - Pre-debit notification: [SMS / Email / Both]
  - Reconciliation: [auto-daily / manual]
```

---

## Consequences

- **Enables**: Automated EMI collection for 90%+ of repayments, reduced manual work, lower bounce rates with smart retry
- **Trade-off**: Depends on payment aggregator (vendor cost per transaction)
- **Trade-off**: e-NACH registration takes 1-2 days, UPI AutoPay is instant but limited to Rs 15K without auth
- **Toggleable**: NBFC can disable this and do manual collections only
