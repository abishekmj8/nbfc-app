# NBFC Manager

**Open-source, self-hosted loan management system for Indian Non-Banking Financial Companies.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Why NBFC Manager?

| Problem | Our Solution |
|---|---|
| SaaS tools cost Rs 20L-1Cr/year | **Free** — open source, zero licensing |
| Your data on someone else's cloud | **Self-hosted** — your server, your data |
| English-only interfaces | **Hindi + English** — RBI FPC compliant |
| All-or-nothing features | **28 toggleable modules** — use only what you need |
| No offline capability | **Works on local network** — no internet required |
| Separate Tally for accounting | **Built-in double-entry GL** — trial balance, P&L, balance sheet |

## Features

- **Complete Loan Lifecycle**: Lead capture → KYC → Credit appraisal → Sanction → Disbursement → EMI collection → NPA tracking → Closure
- **RBI Compliant**: Key Fact Statement (Digital Lending 2025), cooling-off period, IRACP NPA classification, Fair Practices Code
- **India-First**: Aadhaar Data Vault, PAN encryption/masking, Indian accounting (paise-based), lakh/crore formatting
- **28 Toggleable Modules**: Core lending, gold loans, vehicle loans, microfinance, co-lending, insurance, DSA channel, EWS, and more
- **PDF Generation**: KFS, loan agreements, payment receipts, EMI schedules, NOC certificates
- **Pluggable Database**: SQLite (dev/small), PostgreSQL (production), MySQL (existing infra)
- **Modern Stack**: Next.js 16, TypeScript, Tailwind CSS, Prisma ORM
- **PWA Installable**: Add to home screen on mobile, works like a native app
- **Dark Mode**: Full dark theme support

## Quick Start

```bash
# Clone
git clone https://github.com/abishekmj8/nbfc-app.git
cd nbfc-app
git checkout develop

# Install
pnpm install

# Set up database
npx prisma db push
pnpm db:seed

# Start
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — Login: `admin@demo-nbfc.com` / `admin123`

## Docker

```bash
# Production (app + PostgreSQL)
docker-compose -f docker/docker-compose.yml up -d

# Dev (just PostgreSQL, app runs locally)
docker-compose -f docker/docker-compose.dev.yml up -d
```

## Architecture

```
Browser → Next.js (App Router + API) → Prisma ORM → SQLite / PostgreSQL / MySQL
                                     → Local Disk / S3 (file storage)
```

- **Single-tenant**: one instance per NBFC, complete data isolation
- **Server Components** by default, minimal client JS
- **Audit trail** on every mutation (append-only, tamper-evident)
- **PII encrypted** at rest (AES-256-GCM for Aadhaar, PAN, bank accounts)

## Modules (28)

| Category | Modules |
|---|---|
| **Core** (always on) | User Management, Company Setup, Audit Trail, Settings |
| **Lending** | Leads, Loan Origination, Loan Management, Collections |
| **Verticals** | Gold Loans, Vehicle Loans, Microfinance |
| **Finance** | Accounting & GL, Treasury, Fee & Charges |
| **Compliance** | Regulatory Compliance, Reports & Analytics |
| **Integrations** | NACH/UPI, Account Aggregator, eSign, e-Stamping, Co-Lending, Insurance, DSA Channel, Early Warning System |
| **Internal** | Notifications, Document Management, HR, Task Management |

Each module can be toggled on/off per deployment. A gold loan NBFC enables 8 modules. An MFI enables 7 different ones. Same app, no bloat.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Database | Prisma 6 (SQLite / PostgreSQL / MySQL) |
| Validation | Zod 4 |
| UI | Tailwind CSS + shadcn-style components |
| Tables | TanStack Table v8 |
| PDF | React-PDF |
| Auth | Session cookies + bcrypt + RBAC |
| i18n | next-intl (English + Hindi) |
| Testing | Vitest (114 tests) |
| Deployment | Docker (multi-stage) |

## Project Stats

- 153 source files
- 39 UI pages
- 114 tests passing
- 53 Prisma models
- 25 Architecture Decision Records
- 0 type errors

## Target Users

- Small to mid-size NBFCs (10-500 employees, 100-100K loans)
- NBFCs who value data sovereignty
- Tier-2/3 city NBFCs with limited internet
- New NBFCs starting operations
- NBFCs frustrated with vendor lock-in

## Contributing

Contributions welcome! See the `specs/` folder for architecture decisions and the implementation plan.

## License

MIT — use it, modify it, deploy it, sell support for it. Your data, your rules.
