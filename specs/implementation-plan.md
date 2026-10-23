# NBFC App — Full Implementation Plan

**Date**: 2026-10-24
**Status**: approved

## Context

We have completed all pre-coding work: 16 architecture decision records, a 20-module feature registry, and a competitive analysis. The `D:\NBFC` directory has specs, CLAUDE.md, and .gitignore — no code yet. This plan defines how to build the entire application in 8 phases, with MVP reached at Phase 4.

**Specs reference**: `specs/decisions/001-016`, `specs/features/000-module-registry.md`, `specs/competitive-analysis.md`

---

## Phase 1: Foundation & Core Modules

**Goal**: Runnable app with auth, company setup, audit trail, settings, and module toggle system.

### 1.1 Project Scaffold
- `pnpm create next-app` — App Router, TypeScript strict, Tailwind CSS
- Prisma setup (SQLite default dev, PG for prod)
- shadcn/ui init + base components (button, input, dialog, table, form, select, dropdown-menu, toast, sheet, tabs, badge, card, separator, avatar)
- Docker + docker-compose (app + PG)
- Vitest config
- ESLint + Prettier
- Zod-validated env config (`src/lib/config/env.ts`)
- next-intl setup with `en.json` + `hi.json` skeletons
- `.env.example` with all required variables documented

### 1.2 Database Foundation (Prisma Schema)
Models (all follow ADR-009 pattern: ULID id, companyId, timestamps, audit columns):
- `Company` — name, RBI reg, PAN, GST, address, branding (logo, colors), financialYearStart
- `Branch` — name, address, code, companyId, timezone, isHeadOffice
- `User` — email, passwordHash, name, role, branchId, status, preferredLocale, lastLoginAt
- `Role` — name, description, isSystem
- `Permission` — module, action (VIEW/CREATE/EDIT/APPROVE/DELETE), roleId
- `Session` — token, userId, expiresAt, ipAddress, userAgent
- `AuditLog` — per ADR-005 (append-only, full before/after JSON)
- `SystemConfig` — key/value store (module toggles, app version, settings)
- `Holiday` — date, name, branchId, type

### 1.3 Auth System (Module 1: User & Access Management)
- Login page, password hashing (bcrypt), session cookies (HTTP-only, secure)
- Session middleware, RBAC middleware (`requirePermission`), module gate (`requireModule`)
- User CRUD (deactivate, never hard-delete), role management, permission matrix UI
- User profile (change password, language), rate limiting (auth: 5/min/IP), CSRF protection

### 1.4 Company & Branch Setup (Module 2)
- First-launch setup wizard (detect empty DB → guide through company + admin + branch creation)
- Company settings page, branch CRUD, financial year config, holiday calendar

### 1.5 Audit Trail (Module 3)
- Centralized audit service (`src/lib/audit/service.ts`) — called within transaction on every mutation
- Audit log viewer with filters + cursor-based pagination + CSV export

### 1.6 Settings & Configuration (Module 4)
- Module toggle screen (dependency validation: can't enable Collections without LMS)
- System settings (currency, date format, language)
- Backup placeholder UI, About page (version)

### 1.7 App Shell & Layout
- Sidebar nav (only enabled modules), top bar (logo, search placeholder, user menu, language switch)
- Breadcrumbs, dark mode toggle
- Shared components: `MoneyDisplay`, `DateDisplay`, `StatusBadge`, `MaskedField`, `DataTable`, `FormField`, `ConfirmDialog`, `AuditInfo`

### Key files (~60-70 files)
```
src/app/(auth)/login/page.tsx
src/app/(app)/layout.tsx, dashboard/page.tsx
src/app/(app)/settings/{modules,company,branches,users,roles,holidays,audit-log}/page.tsx
src/app/(app)/setup/page.tsx
src/app/api/v1/health/route.ts
src/components/{ui/,layout/,shared/}
src/lib/{auth/,audit/,config/,db/,errors/,utils/,schemas/,storage/}
src/i18n/, src/messages/{en,hi}.json
prisma/schema.prisma
docker/{Dockerfile,docker-compose.yml,docker-compose.dev.yml}
```

### Tests
- Unit: password hashing, money formatting, ULID, date utils, Zod schemas
- Integration: auth flow, RBAC checks, audit log creation, module toggle
- E2E: setup wizard → login → settings page

### Demoable
Setup wizard, login/logout, user/role management, module toggles, audit log, dark mode, Hindi switch, Docker deployment

---

## Phase 2: Customer, Interest Engine & Accounting Foundation

**Goal**: Mathematical core built and proven. Customer records with KYC/PII protection. Accounting foundation.

### 2.1 Customer Model
- `Customer` — name, DOB, gender, occupation, address, phone, email, photo
- `CustomerIdentity` — PAN (encrypted), Aadhaar ref (vault pointer + last 4), voter ID, passport, DL
- `AadhaarVault` — separate encrypted table per ADR-007 (AES-256, access-logged)
- `CustomerAddress` — current, permanent, office
- `CustomerBankAccount` — bank, IFSC, account number (encrypted), type
- Encryption utils (`src/lib/crypto/`), PII masking middleware, PII access audit
- Customer CRUD UI with masked fields, search (name, phone, masked PAN last-4)
- Form 60 capture (when no PAN)
- Consent management foundation: `ConsentRecord` table + reusable UI component

### 2.2 Loan Product Configuration
- `LoanProduct` — name, code, type (TERM/BULLET/EMI/FLEXI/OD), interest method, day-count, rate range, tenure range, amount range, penal rate, prepayment fee, EMI rounding, collateral type
- `LoanProductFee` — fee type, calculation, GST
- Product CRUD UI

### 2.3 Interest Calculation Engine (ADR-016 — the mathematical core)
Located at `src/lib/interest/`:
- `engine.ts` — orchestrator
- `methods/daily-reducing.ts` — DEFAULT (RBI mandated)
- `methods/monthly-reducing.ts` — legacy
- `methods/flat-rate.ts` — legacy with deprecation warning
- `day-count/actual-actual.ts` — DEFAULT
- `emi-calculator.ts` — EMI formula + full schedule generation
- `penal-calculator.ts` — never capitalized
- `foreclosure-calculator.ts` — prepayment/foreclosure
- `types.ts` — all interfaces
- `__tests__/` — EXTENSIVE (cross-verified with Excel, edge cases for leap year, month boundaries, 360-month rounding)

All calculations in BigInt paise. Zero floating-point in the pipeline.

### 2.4 Accounting Foundation (Module 12 — partial)
- `ChartOfAccount` — code, name, type (ASSET/LIABILITY/INCOME/EXPENSE/EQUITY), parent, level
- Default CoA seeder (standard NBFC chart)
- `JournalEntry` + `JournalEntryLine` — double-entry (debit = credit validation)
- Day book viewer

### Key files (~50-60 files)
```
src/app/(app)/customers/{page,new,[id]}/
src/app/(app)/settings/loan-products/
src/app/(app)/accounting/{day-book,chart-of-accounts}/
src/lib/{interest/,crypto/,customers/,accounting/}
```

### Tests
- **Interest engine**: highest test density in the app. Every method with known-good values. Edge cases. 360-month rounding accumulation. Cross-verify with Excel.
- Encryption roundtrip, masked output format
- Accounting: double-entry balance validation

### Demoable
Customer creation with masked PII, loan product config, interest engine demo (input params → EMI schedule), chart of accounts, journal entries

---

## Phase 3: Loan Origination (LOS)

**Goal**: Complete application-to-disbursement pipeline. First "real NBFC workflow."

### 3.1 Lead Management (Module 5)
- `Lead` — source, customer details, assigned officer, status, follow-ups
- Lead capture, list, assignment, lead-to-application conversion

### 3.2 Loan Application (Module 6)
- `LoanApplication` — customerId, productId, amount, tenure, purpose, status (DRAFT→SUBMITTED→UNDER_REVIEW→APPROVED→SANCTIONED→DISBURSED→REJECTED→CANCELLED)
- Multi-step form: customer → loan details → KYC docs → collateral → review
- Auto-save drafts, application pipeline view

### 3.3 KYC Document Management
- `Document` — entityType, entityId, docType, file path, status (UPLOADED/VERIFIED/REJECTED/EXPIRED), expiryDate
- File upload (local/S3), verification workflow, viewer (image/PDF), expiry tracking

### 3.4 Credit Appraisal
- `CreditAppraisal` — scorecard results, risk category, recommendation, manual override with reason
- Configurable scoring checklist per product (credit bureau integration stubbed — real in Phase 5)

### 3.5 Sanction Workflow
- `ApprovalRequest` — maker-checker with configurable approval matrix (by loan amount)
- Sanction letter generation (React-PDF)
- `SanctionCondition` — pre-disbursement checklist

### 3.6 Disbursement
- Disbursement form (mode, bank details, amount)
- Pre-disbursement condition check (all must be met)
- **KFS generation** (React-PDF — RBI mandatory before agreement)
- Loan agreement + welcome letter generation
- On disburse: create `LoanAccount`, generate EMI schedule, post journal entry (Dr. Loan Receivable, Cr. Bank), audit + notification placeholder

### 3.7 PDF Template Engine (Module 18 — partial)
- `src/lib/documents/` — generator, storage, templates/, components/, fonts/
- Templates: KFS, sanction letter, loan agreement, EMI schedule
- Company header/footer components, money-in-words (English + Hindi)
- Noto Sans Devanagari font for Hindi PDFs

### Key files (~70-80 files)
```
src/app/(app)/leads/
src/app/(app)/loans/applications/{page,[id]/steps/,[id]/appraisal/,[id]/sanction/,[id]/disburse/}
src/lib/{leads/,loan-origination/,documents/}
```

### Tests
- Full origination flow (lead → disbursement), approval matrix (1/2/3 levels), KFS mandatory fields, PDF structure
- Concurrent approval race conditions

### Demoable
Full pipeline — capture lead, convert, upload KYC, appraise, sanction, generate KFS + agreement, disburse. PDFs generated. This is the first "real NBFC demo."

---

## Phase 4: Loan Management & Collections (= MVP)

**Goal**: Active loan management. After this phase = **Minimum Viable Product** for a real NBFC.

### 4.1 Loan Account Dashboard (Module 7)
- Loan list (ACTIVE/OVERDUE/NPA/CLOSED/WRITTEN_OFF), detail page (summary, EMI schedule, payments, documents, audit)
- Portfolio summary dashboard (AUM, active count, overdue count, NPA%, collection efficiency)

### 4.2 Interest Accrual (daily batch)
- Daily accrual service, post journal entries, NPA interest reversal (90+ DPD → cash basis)
- Cron endpoint (`/api/v1/cron/daily-accrual`)

### 4.3 Repayment Processing
- `Payment` — amount, mode, reference, allocation (interest/principal/penal/fees)
- Payment receipt entry, auto-allocation, advance/prepayment, bounce management
- Payment receipt PDF

### 4.4 DPD / NPA Engine
- DPD auto-calculation, SMA classification (0/1/2), NPA classification (Sub-standard/Doubtful/Loss)
- Auto-transition, NPA upgrade on recovery, provisioning per RBI IRACP

### 4.5 Account Servicing
- Rate change (floating), tenure extension, moratorium, foreclosure, part-prepayment, loan closure + NOC

### 4.6 Collections (Module 8)
- Overdue bucket dashboard, `CollectionTask`, assignment, follow-up tracking, promise-to-pay
- Demand notice PDF, field collection receipt

### 4.7 In-App Notifications (Module 17 — partial)
- `Notification` model, notification bell UI (pending approvals, overdue tasks, alerts)

### Key files (~70-80 files)
```
src/app/(app)/loans/[id]/{page,payments,foreclose,close}/
src/app/(app)/collections/
src/app/(app)/dashboard/
src/lib/{loan-management/,interest/accrual-service.ts,interest/npa-handler.ts,collections/,notifications/}
src/app/api/v1/cron/{daily-accrual,dpd-calculation}/
src/lib/documents/templates/{payment-receipt,demand-notice,noc-certificate}.tsx
```

### Tests
- Payment allocation (all permutations), DPD/NPA (exact day counts), accrual (monthly sum verification), NPA reversal, foreclosure calculation, concurrent payments

### Demoable
**Complete loan lifecycle** — originate → disburse → collect EMIs → track overdue → classify NPA → close with NOC. Portfolio dashboard. Collections workflow. Daily accrual running. **A real NBFC can operate with this.**

---

## Phase 5: Integrations, Compliance & Communication

**Goal**: External system integration, regulatory compliance features, real notifications.

### 5.1 Credit Bureau Integration (ADR-008)
- Bureau adapter + aggregator adapter, credit pull workflow (consent → pull → score → decision)
- Score interpretation rules engine (configurable per product)
- Bureau reporting (outbound weekly files), dispute tracking (30-day SLA)
- Integrated into Phase 3 appraisal workflow

### 5.2 NACH / UPI AutoPay (Module 21 — ADR-018)
- Payment aggregator adapter (Razorpay, Cashfree, PayU)
- e-NACH mandate registration, UPI AutoPay mandate setup
- Auto-debit on EMI due dates, pre-debit notification (24hr — NPCI mandate)
- Bounce handling with return reason codes, auto-retry (configurable)
- Bounce charges auto-application
- Mandate lifecycle (register, pause, cancel, expire)
- Daily reconciliation (instructions vs settlements vs bank credits)

### 5.3 Account Aggregator (Module 22 — ADR-019)
- AA provider adapter (Setu, Finvu, Saafe)
- Consent request flow → customer approves on AA app
- Bank statement fetch (digital, verified)
- Auto-analysis: income detection, existing EMIs, cash flow score, red flags
- Data retention per consent policy, auto-delete on expiry
- Integrated into Phase 3 credit appraisal as data point

### 5.4 Notifications & Communication (Module 17 — full)
- SMS adapter (configurable provider), email (SMTP), WhatsApp stub
- Notification templates with merge fields, template editor UI
- Communication log, bulk notifications, event-based triggers
- (loan sanctioned → SMS, 3 days before EMI → reminder, overdue → demand)
- Pre-debit NACH notification (automated, 24hr before debit)

### 5.5 Regulatory Compliance (Module 15)
- Cooling-off enforcement, KFS compliance check, CRILC reporting
- NPA provisioning reports, Fair Practices Code checklist
- PMLA reporting stubs (CTR/STR), exposure norm alerts

### 5.6 Fee & Charges (Module 14)
- `FeeType`, `FeeCharge` — rules engine (% or flat, recurring, GST)
- Auto-calculate + auto-post to accounting, waiver workflow
- Bounce charges, processing fees, prepayment penalties — all configurable

### 5.7 eSign & Digital Signature (Module 23 — ADR-020)
- ESP adapter (Leegality, Digio, eMudhra)
- Aadhaar eSign (OTP/biometric), DSC, PAN eSign
- Multi-party signing (borrower + co-borrower + guarantor + NBFC)
- Signing status tracking, reminders, signed PDF storage
- Integrated into Phase 3 disbursement (sign before disburse)

### 5.8 e-Stamping (Module 24 — ADR-021)
- NeSL/SHCIL adapter
- State-wise stamp duty rate configuration
- Auto-calculate stamp duty on sanction
- e-Stamp certificate purchase and embedding in agreement PDF
- Manual certificate recording fallback

### 5.9 Reports & Analytics (Module 16 — partial)
- Portfolio dashboard (Recharts), disbursement/collection/overdue/income reports
- CSV/Excel export

### Key files (~90-100 files)
```
src/lib/{credit-bureau/,payment-automation/,account-aggregator/,notifications/,compliance/,fees/,esign/,estamping/,reports/}
src/app/(app)/{compliance,reports}/
```

### Demoable
Credit bureau pull during appraisal, AA bank statement analysis, NACH mandate → auto-debit → bounce handling, eSign on loan agreement, e-Stamp purchase, SMS/email on loan events, compliance dashboard, fee auto-calculation, portfolio reports with charts

---

## Phase 6: Verticals, Co-Lending, Insurance & DSA

**Goal**: NBFC-type-specific features + business expansion modules. All optional/toggleable.

### 6.1 Gold Loan Ops (Module 9)
- Gold appraisal (weight, purity, LTV 75% cap), vault/packet management, daily rate update
- Portfolio revaluation, auction management (2-week notice), gold release, gold pledge receipt PDF

### 6.2 Vehicle Loan Ops (Module 10)
- Vehicle details, RC verification tracking, insurance tracking, hypothecation filing/removal
- Repossession workflow, dealer management

### 6.3 Microfinance Ops (Module 11)
- Group/center management (JLG/SHG), meeting scheduling + attendance
- Center-wise collection sheet PDF, group loan application, CGT tracking, household income assessment

### 6.4 Co-Lending & Loan Assignment (Module 25 — ADR-022)
- Co-lending partner management (banks, HFCs)
- CLM-1 co-origination workflow (NBFC 20% + Bank 80%)
- Loan assignment/securitization (Transfer of Loan Exposures)
- Payment split: auto-calculate NBFC share vs partner share on every payment
- Remittance tracking (what's owed to partner, what's been sent)
- MRR (Minimum Retention Requirement) enforcement (10% / 5% priority sector)
- Partner-wise portfolio reporting, NPA classification sync

### 6.5 Credit Life Insurance (Module 26 — ADR-023)
- Insurance policy recording (provider, cover amount, premium, nominee)
- KFS disclosure: loan cost with AND without insurance (IRDAI mandate)
- Premium payment tracking (single upfront / monthly / annual)
- Policy expiry and lapse alerts
- Claim initiation: documents → submit to insurer → track status
- Settlement application to loan outstanding (partial or full closure)

### 6.6 DSA / Partner Channel (Module 27 — ADR-024)
- DSA partner registration and management (individual, corporate, fintech)
- Commission structure per product (percentage / flat, with TDS)
- Lead tracking by DSA (referral code attribution)
- Commission auto-calculation on disbursement
- Payout approval (maker-checker), payment tracking
- Clawback rules (if loan defaults within X months)
- DSA portal: limited web view for DSAs (see only their leads/applications)
- Partner API: REST endpoints for tech-savvy DSAs to submit leads programmatically

### Key files (~80-90 files)
```
src/app/(app)/{gold-loans,vehicle-loans,microfinance,co-lending,insurance,dsa}/
src/lib/{gold/,vehicle/,microfinance/,co-lending/,insurance/,dsa/}
src/app/api/v1/partner/
```

### Demoable
Gold workflow (appraise → disburse → vault → auction), Vehicle workflow (hypothecation → repossession), MFI workflow (group → meeting → collection sheet), Co-lending (co-originate → split payments → remit to bank), Insurance (bind policy → track premium → process claim), DSA (register partner → source lead → auto-commission on disburse)

---

## Phase 7: Accounting Completion, Treasury, HR & Tasks

**Goal**: Complete supporting modules.

### 7.1 Accounting — Full (Module 12)
- Bank reconciliation (CSV import, match, flag mismatches)
- Trial balance, P&L, balance sheet generation
- Cash book / bank book, financial year close, manual journal with approval

### 7.2 Treasury (Module 13)
- Borrowing register, repayment tracking, interest expense accrual
- Investment register, fund utilization, cash flow forecast

### 7.3 Employee & HR (Module 19)
- Employee register, attendance (in/out), leave management
- Target assignment, performance dashboard (targets vs actuals)

### 7.4 Task & Workflow (Module 20)
- Task CRUD, types, my-tasks dashboard, overdue escalation, workflow templates

### 7.5 Early Warning System (Module 28 — ADR-025)
- Configurable warning rules (repayment behavior, bureau signals, cash flow, behavioral)
- Composite stress score per loan (0-100) with weighted components
- Risk buckets: Green / Yellow / Orange / Red
- Auto-actions on triggers (notify officer, create task, flag account, escalate)
- EWS dashboard: alerts, trends, deteriorating accounts
- Daily batch processing + real-time event triggers (bounce → immediate alert)
- Bureau monitoring integration (optional soft pulls)
- AA monitoring integration (optional with ongoing consent)

### 7.6 Reports — Full (Module 16)
- Branch/officer performance, custom report builder (basic), scheduled reports, PDF export
- EWS reports: stress distribution, signal frequency, intervention effectiveness

### Key files (~50-60 files)
```
src/app/(app)/{accounting,treasury,hr,tasks}/
src/lib/{accounting/(reconciliation,financial-statements),treasury/,hr/,tasks/}
```

### Demoable
Trial balance + P&L + balance sheet from auto-posted entries, treasury tracking, HR management, task workflows

---

## Phase 8: Production Hardening

**Goal**: Production-ready. Backup/restore, Docker production, performance, security.

### 8.1 Backup & Restore (ADR-015)
- Full backup (DB dump + files + config → encrypted .tar.gz.enc)
- Restore with double confirmation + maintenance mode
- Scheduled backups, pre-upgrade auto-backup, verification, CLI commands
- Monitoring alerts (no backup in N days)

### 8.2 Upgrade System (ADR-014)
- Startup migration flow (check version → run pending → refuse if DB ahead)
- Data migration runner, version display, optional update check

### 8.3 Docker Production
- Multi-stage Dockerfile, production docker-compose (PG + optional MinIO)
- Health check, graceful shutdown, volume config

### 8.4 Performance
- Index audit, 100K-loan load test, batch optimization (accrual), table virtualization, bundle analysis

### 8.5 Security Hardening
- Security headers (CSP, HSTS), rate limiting all endpoints, session timeout
- Password rotation, CSRF audit, input sanitization audit, PII encryption audit, dependency audit

### 8.6 UX Polish
- Loading states, error boundaries, empty states, keyboard nav audit, mobile responsiveness, print stylesheets

### Demoable
Production Docker deployment, backup/restore roundtrip, 100K-loan performance, security hardened

---

## MVP Definition

**MVP = Phase 1 + 2 + 3 + 4**. At MVP, an NBFC has:
1. Auth with RBAC + maker-checker
2. Company + branch setup
3. Audit trail
4. Customer management with KYC + PII protection
5. Configurable loan products
6. Full origination (lead → KYC → appraisal → sanction → KFS → disburse)
7. Loan management (EMI, accrual, repayments, NPA classification)
8. Collections & recovery
9. Basic accounting (auto-journal entries)
10. PDF generation (KFS, agreements, receipts, NOC)
11. English + Hindi
12. Dark mode, accessible UI

Enough for a personal loan or unsecured lending NBFC. Gold/Vehicle/MFI/Co-lending/Insurance/DSA come in Phase 6. NACH/eSign/AA/e-Stamping come in Phase 5. EWS in Phase 7.

**Total modules: 28** (4 core always-on + 24 toggleable)

---

## Dependency Chain

```
Phase 1 (Core — 4 modules)
  │
  v
Phase 2 (Customer + Interest + Accounting foundation)
  │
  v
Phase 3 (Loan Origination — LOS)
  │
  v
Phase 4 (Loan Management + Collections) ══ MVP
  │
  ├──→ Phase 5 (NACH, AA, eSign, eStamp, Bureau, Notifications,
  │             Compliance, Fees, Reports)
  │
  ├──→ Phase 6 (Gold, Vehicle, MFI, Co-Lending, Insurance, DSA)
  │             ↑ can run in parallel with Phase 5
  │
  v
Phase 7 (Accounting full, Treasury, HR, Tasks, EWS)
  │
  v
Phase 8 (Production Hardening — backup, Docker, security, perf)
```

---

## Cross-Phase Rules

**Every phase**:
- All strings through `t()` (i18n from day one)
- Hindi translations alongside English
- Update `specs/features/` per module, `specs/api/` per route handler
- Update `CHANGELOG.md` for every change
- Tests: unit (pure functions) + integration (DB) + E2E (critical paths)
- CI against SQLite (fast) + PostgreSQL (production)
- Prisma migrations tested against all 3 DBs
- No destructive migrations in minor versions
- Seed data for development (realistic NBFC data)

---

## Verification

After each phase:
1. All tests pass on SQLite + PostgreSQL
2. Docker deployment works end-to-end
3. Demo scenario completable without errors
4. Audit trail captures all mutations
5. PII properly masked in all UI and API responses
6. Hindi language switch works on all new pages
7. Specs and changelog updated

---

## Starting Point

**Phase 1 begins with**: `pnpm create next-app` scaffold, Prisma schema, auth system, setup wizard, app shell. This is pure infrastructure — no lending features — but everything subsequent depends on it being solid.
