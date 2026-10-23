# Feature: Module Registry — Toggleable Feature Modules

**Status**: draft
**Date**: 2026-10-24

## Summary

Every NBFC is different — a gold loan company doesn't need vehicle hypothecation, a microfinance institution doesn't need treasury management. The app ships with all modules, but each one can be turned on/off per deployment via a configuration screen. Disabled modules are completely hidden from navigation, APIs, and permissions.

---

## Module Architecture

```
Settings > Modules > [Toggle each on/off]
```

- Each module is self-contained: its own routes, API endpoints, DB models, and permissions.
- Turning off a module hides it from the UI and disables its API routes.
- Data is never deleted when a module is toggled off — just hidden.
- Some modules have dependencies (e.g., Collections requires Loan Management).

---

## Complete Module List

### CORE (always on, cannot be disabled)

#### 1. User & Access Management
- User accounts (create, edit, deactivate — never hard-delete)
- Role-based access control (RBAC): Admin, Manager, Officer, Viewer, custom roles
- Permissions matrix: per-module, per-action (view, create, edit, approve, delete)
- Maker-checker workflow: configurable per action (e.g., loan sanction needs 2 approvals)
- Login/logout, session management, password policy
- User activity log (who logged in when, from where)

#### 2. Company & Branch Setup
- Company profile (name, RBI registration, PAN, GST, address)
- Multi-branch support (each branch is a location, users belong to branches)
- Branch-level settings and permissions
- Financial year configuration
- Working days / holidays calendar

#### 3. Audit Trail
- Append-only log of every data mutation
- Who, what, when, before/after snapshots
- Filterable by user, entity, action, date range
- Export to CSV/Excel
- Cannot be disabled or modified

#### 4. Settings & Configuration
- Module toggle screen
- System settings (currency, date format, language)
- Email/SMS gateway configuration
- Backup & restore
- Storage configuration (DB, file storage)

---

### LENDING OPERATIONS

#### 5. Lead & Enquiry Management
*For NBFCs with a sales team or DSA (Direct Selling Agent) channel.*

- Lead capture (walk-in, phone, web form, DSA referral)
- Lead assignment to officers (manual or round-robin)
- Lead status tracking (new, contacted, interested, converted, rejected, lost)
- DSA/connector management (registration, payout tracking, performance)
- Follow-up reminders and task scheduling
- Lead-to-application conversion
- **Depends on**: Core only

#### 6. Loan Origination (LOS)
*The application-to-disbursement pipeline.*

- Loan application capture (customer details, loan amount, purpose, tenure)
- Configurable loan products (interest rate, tenure range, fees, penalties)
- Product types: term loan, bullet, EMI, flexi, overdraft
- KYC document collection and verification
  - PAN, Aadhaar, address proof, income proof, bank statements
  - Document upload, status tracking, expiry alerts
- Credit bureau integration (CIBIL, Experian, CRIF, Equifax)
  - Pull credit report, score display, automated decisioning rules
- Collateral capture (for secured loans)
  - Gold: weight, purity, valuation, photo, vault location
  - Vehicle: make, model, year, RC, insurance, hypothecation
  - Property: address, valuation, title verification
- Underwriting / credit appraisal
  - Configurable scoring rules and checklists
  - Manual override with mandatory reason
  - Risk categorization (low, medium, high)
- Sanction workflow
  - Sanction letter generation
  - Maker-checker approval (configurable approval matrix by amount)
  - Sanction conditions (pre-disbursement conditions checklist)
- Disbursement
  - Pre-disbursement condition verification
  - Disbursement modes: bank transfer (NEFT/RTGS/IMPS), cheque, cash
  - Partial disbursement support
  - Key Fact Statement generation (RBI mandate)
  - Welcome letter / loan agreement generation
- **Depends on**: User & Access Management, Company Setup

#### 7. Loan Management (LMS)
*Day-to-day management of active loans.*

- Loan account dashboard (active, closed, NPA, written-off)
- EMI schedule generation (reducing balance, flat rate, rule of 78)
- Interest calculation engine
  - Daily/monthly/quarterly accrual
  - Configurable interest rates (fixed, floating, hybrid)
  - Penal interest on overdue
- Repayment processing
  - Manual receipt entry (cash, cheque, UPI, bank transfer)
  - NACH/ECS mandate registration and tracking
  - Auto-allocation of payments (interest first, then principal, then penalty)
  - Advance payment / prepayment handling
  - Bounce management (NACH bounce, cheque bounce — fees, retries)
- Account servicing
  - Rate of interest change
  - Tenure extension / rescheduling
  - Moratorium / payment holiday
  - Top-up loan on existing account
  - Loan transfer (branch to branch)
- Closure & settlement
  - Foreclosure calculation (with/without waiver)
  - Part-payment and full settlement
  - NOC / No Dues Certificate generation
  - Lien release / hypothecation removal letter
- NPA management
  - DPD (Days Past Due) auto-calculation
  - SMA (Special Mention Account) classification: SMA-0, SMA-1, SMA-2
  - NPA classification (Sub-standard, Doubtful, Loss) per RBI norms
  - Provisioning calculation
  - NPA upgrade on recovery
- **Depends on**: Loan Origination

#### 8. Collections & Recovery
*Managing overdue accounts.*

- Overdue bucket dashboard (1-30, 31-60, 61-90, 90+ days)
- Collection assignment (manual or rule-based allocation to collectors)
- Collection follow-up tracking (calls, visits, notices)
- Field collection with visit logging (date, location, outcome)
- Promise-to-pay tracking
- Demand notice / legal notice generation
- Settlement / one-time settlement (OTS) workflow with approval
- Write-off workflow (with approval matrix)
- Receipt generation for field collections
- Collection agency management (external agency assignment, performance)
- **Depends on**: Loan Management

#### 9. Gold Loan Operations
*Specific to gold loan NBFCs.*

- Gold appraisal (weight, purity, karat, stone deduction)
- Gold valuation (per-gram rate configuration, LTV calculation)
- Vault / packet management (packet ID, branch vault, inter-branch transfer)
- Auction management (for expired/defaulted gold loans — RBI auction rules)
- Gold release workflow (on closure/settlement)
- Daily gold rate update and portfolio revaluation
- Gold insurance tracking
- **Depends on**: Loan Origination, Loan Management

#### 10. Vehicle / Asset Loan Operations
*Specific to vehicle finance and asset finance NBFCs.*

- Vehicle details capture (make, model, variant, year, engine/chassis number)
- RC (Registration Certificate) verification
- Insurance tracking and renewal alerts
- Hypothecation filing with RTO
- Hypothecation removal on closure
- Repossession workflow (for defaulted vehicle loans)
- Dealer management (empanelment, payout, performance)
- **Depends on**: Loan Origination, Loan Management

#### 11. Microfinance Operations
*Specific to NBFC-MFIs.*

- Group/center formation (Joint Liability Groups, Self-Help Groups)
- Group meeting scheduling and attendance
- Center-wise collection sheet generation
- Group-based loan application and approval
- Compulsory group training (CGT) tracking
- Household income assessment (per RBI MFI norms)
- **Depends on**: Loan Origination, Loan Management

---

### FINANCE & ACCOUNTING

#### 12. Accounting & General Ledger
*Financial bookkeeping.*

- Chart of accounts (configurable, multi-level)
- Double-entry bookkeeping (every transaction has debit + credit)
- Auto-generated journal entries from loan events (disbursement, repayment, interest accrual, write-off)
- Manual journal entries (with approval)
- Day book / cash book / bank book
- Bank reconciliation
- Trial balance, P&L, balance sheet generation
- Financial year close workflow
- **Depends on**: Core only

#### 13. Treasury & Fund Management
*Managing the NBFC's own borrowings and investments.*

- Borrowing register (bank loans, NCDs, CP — the NBFC's funding sources)
- Borrowing repayment tracking
- Interest expense accrual
- Fund utilization tracking
- Investment register (FDs, mutual funds, government securities)
- Cash flow forecasting
- **Depends on**: Accounting

#### 14. Fee & Charges Management
*Configuring and tracking all non-interest income.*

- Configurable fee types (processing fee, login fee, documentation charges, late payment fee, cheque bounce charges, prepayment penalty, etc.)
- Fee rules engine (percentage or flat, one-time or recurring, GST applicable or not)
- Auto-calculation and auto-posting to accounting
- GST on fees calculation
- Waiver workflow (with approval)
- **Depends on**: Accounting

---

### COMPLIANCE & REPORTING

#### 15. Regulatory Compliance
*RBI reporting and compliance.*

- CRILC (Central Repository of Information on Large Credits) reporting
- Credit bureau reporting (weekly/fortnightly data submission to CIBIL, Experian, etc.)
- NPA provisioning reports (as per RBI IRACP norms)
- ALM (Asset Liability Management) reports
- Key Fact Statement generation (RBI Digital Lending Directions 2025)
- Cooling-off period enforcement
- Digital Lending App (DLA) compliance tracking
- Fair Practices Code (FPC) checklist
- Ombudsman complaint tracking
- CERSAI (Central Registry) charge registration
- Annual return / statutory filing reminders
- **Depends on**: Loan Management, Accounting

#### 16. Reports & Analytics
*Operational and management reporting.*

- Portfolio dashboard (AUM, disbursement, collection, PAR, NPA%)
- Disbursement reports (daily, monthly, branch-wise, product-wise)
- Collection reports (efficiency, shortfall, agent-wise)
- Overdue and aging reports
- Interest income / fee income reports
- Branch performance comparison
- Employee / officer performance reports
- Custom report builder (select fields, filters, grouping)
- Scheduled report generation (daily/weekly/monthly email)
- Export to CSV, Excel, PDF
- **Depends on**: Core (reads from all enabled modules)

---

### COMMUNICATION

#### 17. Notifications & Communication
*Customer and internal notifications.*

- SMS gateway integration (configurable provider)
- Email integration (SMTP / transactional email service)
- WhatsApp Business API integration (optional)
- Notification templates (configurable per event — loan sanctioned, EMI due, overdue, etc.)
- Bulk SMS / email campaigns
- Communication log (every message sent, to whom, when, delivery status)
- Internal notifications (task assignments, approval requests, alerts)
- **Depends on**: Core only

---

### DOCUMENT MANAGEMENT

#### 18. Document Management
*Storing, generating, and managing all documents.*

- Document upload and categorization (KYC, agreements, receipts, collateral photos)
- Document templates (loan agreement, sanction letter, NOC, demand notice, receipt)
- Template engine with merge fields (auto-fill from loan/customer data)
- Document versioning
- Digital signature support (optional, for future)
- Bulk document generation (e.g., generate all demand notices for overdue loans)
- Document expiry tracking and renewal alerts (insurance, ID proof)
- **Depends on**: Core only

---

### HR & INTERNAL

#### 19. Employee & HR Management
*Internal staff management (lightweight — not a full HRMS).*

- Employee register (name, role, branch, contact, reporting manager)
- Attendance tracking (simple in/out, leave management)
- Target assignment (disbursement targets, collection targets)
- Performance dashboard (targets vs actuals per officer)
- Hierarchy / reporting structure
- Employee document storage (ID, appointment letter, etc.)
- **Depends on**: Core only

#### 20. Task & Workflow Management
*Internal task tracking and process management.*

- Task creation and assignment
- Task types: follow-up, verification, approval, review
- Due date and priority
- Task dashboard per user (my tasks, pending approvals)
- Escalation rules (auto-escalate overdue tasks to manager)
- Workflow templates (configurable multi-step approval chains)
- **Depends on**: Core only

---

### INTEGRATIONS & AUTOMATION

#### 21. Payment Automation (NACH / UPI AutoPay)
*Automated EMI collection via bank mandates.*

- e-NACH mandate registration (via sponsor bank / payment aggregator)
- UPI AutoPay mandate setup
- Auto-debit on EMI due dates
- Pre-debit notification (24 hours before — NPCI mandate)
- Bounce handling with return reason codes
- Auto-retry on insufficient funds (configurable)
- Bounce charges auto-application
- Mandate lifecycle (register, pause, cancel, expire)
- Daily reconciliation (instructions vs settlements)
- Payment aggregator adapter (Razorpay, Cashfree, PayU)
- **Depends on**: Loan Management
- **Spec**: `specs/decisions/018-nach-upi-autopay.md`

#### 22. Account Aggregator (AA)
*Consent-based digital bank statement and financial data fetch.*

- AA consent request flow (customer approves via AA app)
- Bank statement fetch (verified, digital — no PDFs)
- Auto-analysis: income detection, existing EMIs, cash flow, bounces, red flags
- MF/insurance/GST data fetch (optional)
- Data retention per consent policy (auto-delete on expiry)
- AA provider adapter (Setu, Finvu, Saafe)
- **Depends on**: Loan Origination (used in underwriting)
- **Spec**: `specs/decisions/019-account-aggregator.md`

#### 23. eSign & Digital Signature
*Aadhaar eSign for loan agreements — RBI compliant.*

- Aadhaar eSign (OTP/biometric/face) via ESP
- DSC (Digital Signature Certificate) support
- PAN eSign support
- Multi-party signing (borrower + co-borrower + guarantor + NBFC)
- Signed PDF storage with certificate details
- Signing status tracking and reminders
- ESP adapter (Leegality, Digio, eMudhra)
- **Depends on**: Document Management
- **Spec**: `specs/decisions/020-esign.md`

#### 24. e-Stamping
*Digital stamp duty payment for loan agreements.*

- Stamp duty calculation (state-wise rates, configurable)
- e-Stamp purchase via NeSL/SHCIL API
- Certificate embedding in loan agreement PDF
- Manual stamp certificate recording (when API not used)
- **Depends on**: Loan Origination
- **Spec**: `specs/decisions/021-estamping.md`

#### 25. Co-Lending & Loan Assignment
*Co-originate loans with banks, sell/assign loan portfolios.*

- Co-lending partner management
- CLM-1 co-origination workflow (NBFC 20% + Bank 80%)
- Loan assignment/securitization (Transfer of Loan Exposures)
- Payment split and remittance to partner
- MRR (Minimum Retention Requirement) enforcement
- Partner-wise portfolio reporting
- **Depends on**: Loan Management, Accounting
- **Spec**: `specs/decisions/022-co-lending.md`

#### 26. Credit Life Insurance
*Insurance policy tracking, premium management, claims.*

- Insurance policy recording (provider, cover, premium, nominee)
- KFS disclosure (loan cost with and without insurance)
- Premium payment tracking (single/monthly/annual)
- Policy expiry and lapse alerts
- Claim initiation and tracking
- Settlement application to loan outstanding
- **Depends on**: Loan Management
- **Spec**: `specs/decisions/023-insurance.md`

#### 27. DSA / Partner Channel
*External loan sourcing partner management and API.*

- DSA partner registration and management
- Commission structure (per product, percentage/flat)
- Lead tracking by DSA (referral code)
- Commission calculation on disbursement
- TDS deduction and payout tracking
- Clawback rules (on early default)
- DSA portal (limited web view for DSAs)
- Partner API (optional — for tech-savvy DSAs/fintechs)
- **Depends on**: Lead Management, Loan Origination
- **Spec**: `specs/decisions/024-dsa-partner-api.md`

#### 28. Early Warning System (EWS)
*Proactive stress detection before loans go bad.*

- Configurable warning rules (repayment, bureau, cash flow, behavioral)
- Composite stress score per loan (0-100)
- Risk buckets (Green/Yellow/Orange/Red)
- Auto-actions on triggers (notify officer, create task, flag account)
- EWS dashboard with alerts and trends
- Daily batch processing + real-time event triggers
- Bureau monitoring integration (optional)
- AA monitoring integration (optional)
- **Depends on**: Loan Management
- **Spec**: `specs/decisions/025-early-warning-system.md`

---

## Module Dependency Map

```
Core (always on)
  ├── Lead Management
  │     └── DSA / Partner Channel
  ├── Accounting
  │     └── Treasury
  │     └── Fee & Charges
  ├── Notifications
  ├── Document Management
  │     └── eSign & Digital Signature
  ├── HR Management
  ├── Task & Workflow
  ├── Reports & Analytics
  ├── Early Warning System
  └── Loan Origination
        ├── Account Aggregator
        ├── e-Stamping
        └── Loan Management
              ├── Collections
              ├── Payment Automation (NACH/UPI)
              ├── Gold Loan Ops
              ├── Vehicle Loan Ops
              ├── Microfinance Ops
              ├── Co-Lending & Loan Assignment
              ├── Credit Life Insurance
              └── Regulatory Compliance
```

## Typical Configurations by NBFC Type

| Module | Gold Loan | Vehicle Finance | Personal Loan | Microfinance | Diversified |
|---|---|---|---|---|---|
| Lead Management | Optional | Yes | Yes | No | Yes |
| Loan Origination | Yes | Yes | Yes | Yes | Yes |
| Loan Management | Yes | Yes | Yes | Yes | Yes |
| Collections | Yes | Yes | Yes | Yes | Yes |
| Gold Loan Ops | **Yes** | No | No | No | Optional |
| Vehicle Loan Ops | No | **Yes** | No | No | Optional |
| Microfinance Ops | No | No | No | **Yes** | Optional |
| Accounting | Yes | Yes | Yes | Yes | Yes |
| Treasury | Optional | Optional | Optional | Optional | Yes |
| Fee & Charges | Yes | Yes | Yes | Yes | Yes |
| Compliance | Yes | Yes | Yes | Yes | Yes |
| Reports | Yes | Yes | Yes | Yes | Yes |
| Notifications | Yes | Yes | Yes | Yes | Yes |
| Documents | Yes | Yes | Yes | Yes | Yes |
| HR | Optional | Optional | Optional | Optional | Yes |
| Task & Workflow | Optional | Yes | Yes | Optional | Yes |
| Payment Automation | Yes | Yes | Yes | Yes | Yes |
| Account Aggregator | Optional | Optional | Yes | Optional | Yes |
| eSign | Optional | Optional | Yes | Optional | Yes |
| e-Stamping | Optional | Optional | Optional | Optional | Optional |
| Co-Lending | Optional | Optional | Optional | Optional | Yes |
| Insurance | Optional | Yes | Optional | Optional | Yes |
| DSA / Partner Channel | Optional | Yes | Yes | Optional | Yes |
| Early Warning System | Optional | Optional | Yes | Optional | Yes |

## Implementation Notes

- Module toggle stored in `system_config` table.
- Each module registers itself: routes, nav items, permissions, API endpoints.
- Middleware checks module status before serving routes/APIs.
- Database migrations run for all modules regardless of toggle — schema is always complete, only access is gated.
- Module toggle changes are audit-logged and require admin role.
