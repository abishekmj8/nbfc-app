# Plan: All Pending Items — v0.1 Completion

## Context

The NBFC app has 119 files, 74 tests, 53 Prisma models, and 28 modules committed on `develop`. Backend services are complete but many UI pages are missing, PDF generation isn't built, file upload doesn't work, tests have critical gaps, and i18n dictionaries are empty. This plan covers everything needed to make v0.1 production-ready.

Organized into 6 batches, each independently committable.

---

## Batch A: Critical Tests (payment allocation, DPD, encryption, auth)

**Why first**: These test the most critical financial logic. Bugs here = money errors.

### A1. Payment allocation tests
**File**: `src/lib/loan-management/__tests__/payment-service.test.ts`
- Test: single EMI payment allocated correctly (interest → penalty → principal)
- Test: overpayment goes to principal prepayment
- Test: partial payment marks EMI as PARTIALLY_PAID
- Test: loan auto-closes when outstanding reaches zero
- Test: bounce reverses allocation, adds back to outstanding

### A2. DPD/NPA engine tests
**File**: `src/lib/loan-management/__tests__/dpd-engine.test.ts`
- Test: DPD = 0 when all EMIs paid
- Test: SMA-0 at 1-30 DPD, SMA-1 at 31-60, SMA-2 at 61-90
- Test: NPA classification at 91+ DPD (Sub-standard, Doubtful, Loss)
- Test: NPA upgrade when full arrears cleared
- Test: EMIs marked DUE when due date arrives

### A3. Encryption roundtrip tests
**File**: `src/lib/crypto/__tests__/encrypt.test.ts`
- Test: encrypt → decrypt roundtrip for PAN, bank account
- Test: masked PAN format (XXXXX1234X)
- Test: masked Aadhaar format (xxxx-xxxx-1234)
- Test: masked bank account, masked phone
- Test: different inputs produce different ciphertexts (salt randomness)

### A4. Auth tests
**File**: `src/lib/auth/__tests__/password.test.ts`
- Test: hashPassword → verifyPassword roundtrip
- Test: wrong password returns false
- Test: different passwords produce different hashes

**Estimated**: ~30 new tests, ~4 new test files

---

## Batch B: PDF Generation (KFS, Agreement, Receipt, NOC)

**Why**: KFS is RBI-mandatory. Receipts needed for every payment.

### B1. Install React-PDF
```bash
pnpm add @react-pdf/renderer
```

### B2. PDF infrastructure
- `src/lib/documents/generator.ts` — unified generate function (template + data → PDF buffer)
- `src/lib/documents/money-text.ts` — amount in words ("Rupees One Lakh Fifty Thousand Only")
- `src/lib/documents/components/header.tsx` — React-PDF company header (name, address, reg number)
- `src/lib/documents/components/footer.tsx` — page number, disclaimer

### B3. Templates
- `src/lib/documents/templates/key-fact-statement.tsx` — KFS per RBI Digital Lending 2025 (APR, EMI, tenure, fees, cooling-off)
- `src/lib/documents/templates/loan-agreement.tsx` — basic loan agreement
- `src/lib/documents/templates/payment-receipt.tsx` — receipt with allocation breakdown
- `src/lib/documents/templates/emi-schedule.tsx` — full EMI schedule table
- `src/lib/documents/templates/noc-certificate.tsx` — No Objection Certificate on loan closure

### B4. API route for PDF download
- `src/app/api/v1/documents/[type]/route.ts` — GET with loanId param, streams PDF
- Types: kfs, agreement, receipt, emi-schedule, noc

### B5. Money-in-words tests
**File**: `src/lib/documents/__tests__/money-text.test.ts`
- Test: 150000 → "Rupees One Lakh Fifty Thousand Only"
- Test: 0 → "Rupees Zero Only"
- Test: paise handling

**Estimated**: ~12 new files

---

## Batch C: File Upload + KYC Document Management

### C1. File storage service
- `src/lib/storage/file-service.ts` — upload, download, delete (uses local or S3 adapter from `src/lib/storage/`)
- Save to `./uploads/{companyId}/{entityType}/{entityId}/{filename}`
- Return file path for storage in Document model

### C2. Upload API route
- `src/app/api/v1/upload/route.ts` — POST multipart form, validate file type/size, save, create Document record

### C3. Document upload UI component
- `src/components/shared/file-upload.tsx` — drag-and-drop or click, shows upload progress, file type validation (PDF, JPG, PNG, max 10MB)

### C4. Wire into customer and application pages
- Customer detail: upload KYC documents (PAN card image, Aadhaar, address proof)
- Application detail: upload supporting documents section
- Show document list with status badges (UPLOADED/VERIFIED/REJECTED)

**Estimated**: ~5 new files, 3 modified

---

## Batch D: Missing UI Pages (Accounting, EWS, Tasks, Verticals)

### D1. Accounting pages
- `src/app/(app)/accounting/chart-of-accounts/page.tsx` — tree view of CoA
- `src/app/(app)/accounting/day-book/page.tsx` — journal entries by date
- `src/app/(app)/accounting/trial-balance/page.tsx` — call `generateTrialBalance()`, show table
- `src/app/(app)/accounting/profit-loss/page.tsx` — call `generateProfitAndLoss()`, show income vs expense
- `src/app/(app)/accounting/balance-sheet/page.tsx` — call `generateBalanceSheet()`, show assets vs liabilities+equity
- Wire `seedChartOfAccounts()` into setup wizard

### D2. EWS dashboard
- `src/app/(app)/ews/page.tsx` — risk bucket summary (GREEN/YELLOW/ORANGE/RED counts), alert list, trend

### D3. Task management
- `src/app/(app)/tasks/page.tsx` — task list (my tasks, all tasks), create task form, status updates

### D4. Sidebar updates
- Add Accounting section (CoA, Day Book, Trial Balance, P&L, Balance Sheet)
- Add EWS and Tasks to relevant sections

### D5. Gold/Vehicle/MFI pages (basic list + create)
- `src/app/(app)/gold-loans/page.tsx` — gold appraisal list
- `src/app/(app)/vehicle-loans/page.tsx` — vehicle detail list
- `src/app/(app)/microfinance/page.tsx` — group list

### D6. Co-lending/Insurance/DSA pages (basic list)
- `src/app/(app)/co-lending/page.tsx` — partner list, co-lent loans
- `src/app/(app)/insurance/page.tsx` — policy list
- `src/app/(app)/dsa/page.tsx` — DSA partner list, payouts

### D7. Treasury/HR pages (basic)
- `src/app/(app)/treasury/page.tsx` — borrowings + investments
- `src/app/(app)/hr/page.tsx` — employee list, attendance

**Estimated**: ~20 new page files, sidebar updates

---

## Batch E: i18n + PWA

### E1. Populate English dictionary
- `src/messages/en.json` — all UI strings (nav, buttons, labels, statuses, errors, form fields)
- Organized by section: common, auth, dashboard, customers, loans, settings, etc.

### E2. Hindi dictionary
- `src/messages/hi.json` — translate all strings to Hindi
- Key areas: navigation labels, status names, form labels, error messages

### E3. Wire i18n into pages
- `src/middleware.ts` — locale detection (cookie → Accept-Language → default)
- `src/i18n/config.ts` — supported locales, default
- Replace hardcoded strings in key pages with `t()` calls (start with sidebar, login, dashboard)

### E4. PWA manifest
- `public/manifest.json` — app name, icons, start_url, display: standalone
- `public/icons/` — icon-192.png, icon-512.png, icon-maskable-512.png
- `src/app/layout.tsx` — link manifest, add meta tags (theme-color, apple-mobile-web-app)

### E5. Service worker (basic)
- `public/sw.js` — cache app shell (HTML, CSS, JS), network-first for API
- Register in layout

**Estimated**: ~8 new/modified files

---

## Batch F: Refactor Old Pages + Polish

### F1. Refactor to shadcn components
Pages to update (replace raw HTML with Button, Input, Card, Badge, Table):
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/setup/page.tsx`
- `src/app/(app)/leads/page.tsx` + `lead-form.tsx` + `lead-actions.tsx`
- `src/app/(app)/loans/applications/page.tsx`
- `src/app/(app)/loans/applications/[id]/page.tsx` + `application-actions.tsx`
- `src/app/(app)/loans/page.tsx`
- `src/app/(app)/loans/[id]/page.tsx` + `payment-form.tsx`
- `src/app/(app)/collections/page.tsx`
- `src/app/(app)/reports/page.tsx`
- `src/app/(app)/compliance/page.tsx`
- `src/app/(app)/settings/audit-log/page.tsx`
- `src/app/(app)/settings/branches/page.tsx` + `branch-form.tsx`
- `src/app/(app)/settings/modules/module-toggle.tsx`

### F2. Roles permission matrix UI
- `src/app/(app)/settings/roles/page.tsx` — grid of modules × actions (VIEW/CREATE/EDIT/APPROVE/DELETE) with checkboxes per role

### F3. Settings index page
- `src/app/(app)/settings/page.tsx` — card grid linking to all settings pages

**Estimated**: ~15 files modified, 2 new

---

## Execution Order

```
Batch A (Tests)        — no dependencies, do first for safety
    ↓
Batch B (PDF)          — independent
Batch C (File Upload)  — independent
    ↓ (A, B, C can run in parallel)
Batch D (UI Pages)     — uses components from earlier commits
    ↓
Batch E (i18n + PWA)   — touch many files, do after pages are stable
    ↓
Batch F (Refactor)     — last, polish pass over everything
```

Each batch is one commit on `develop`.

---

## Summary

| Batch | New files | Modified | New tests | Focus |
|-------|-----------|----------|-----------|-------|
| A | 4 | 0 | ~30 | Critical test gaps |
| B | 12 | 0 | ~5 | PDF generation |
| C | 5 | 3 | 0 | File upload |
| D | 20 | 2 | 0 | Missing UI pages |
| E | 8 | 3 | 0 | i18n + PWA |
| F | 2 | 15 | 0 | Refactor + polish |
| **Total** | **~51** | **~23** | **~35** | |

After all batches: ~170 files, ~109 tests, full UI coverage for all 28 modules.

---

## Verification

After each batch:
1. `npx tsc --noEmit` — zero type errors
2. `pnpm test:run` — all tests pass (growing from 74 to ~109)
3. `pnpm dev` — pages load correctly
4. End-to-end: create customer → create product → lead → convert → sanction → disburse → pay → download PDF receipt
