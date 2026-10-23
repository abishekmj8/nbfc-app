# NBFC Manager

Open-source, self-hosted loan management system for Indian Non-Banking Financial Companies.

## Features

- **28 toggleable modules** — use only what you need
- **Self-hosted** — runs on your server, your data stays with you
- **Pluggable database** — SQLite, PostgreSQL, or MySQL
- **RBI compliant** — KFS, cooling-off, NPA classification, IRACP provisioning
- **India-first** — Aadhaar vault, PAN masking, Indian accounting, paise-based money
- **Modern stack** — Next.js, TypeScript, Tailwind CSS

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 10+

### Development

```bash
# Clone and install
pnpm install

# Set up database (SQLite by default)
npx prisma db push

# Seed demo data
pnpm db:seed

# Start development server
pnpm dev
```

Open http://localhost:3000. Login: `admin@demo-nbfc.com` / `admin123`

### Docker

```bash
# Production (app + PostgreSQL)
docker-compose -f docker/docker-compose.yml up -d

# Development (PostgreSQL only, app runs locally)
docker-compose -f docker/docker-compose.dev.yml up -d
```

## Architecture

```
Browser → Next.js App (App Router + API) → Prisma ORM → SQLite / PostgreSQL / MySQL
                                         → Local Disk / S3 (file storage)
```

- **Single-tenant**: one instance per NBFC
- **Server Components** by default, client components at leaves
- **Server Actions** for mutations, Route Handlers for external API
- **Audit trail** on every data mutation (append-only)

## Project Structure

```
src/
  app/           — Next.js pages and API routes
  components/    — UI components (layout, shared)
  lib/           — Business logic
    auth/        — Authentication, RBAC, sessions
    audit/       — Audit trail service
    interest/    — Interest calculation engine
    loan-*/      — Loan origination and management
    crypto/      — PII encryption (AES-256)
    credit-bureau/ — Bureau integration adapter
    ews/         — Early warning system
    ...          — 20+ service modules
prisma/          — Schema and migrations
specs/           — Architecture decisions and feature specs
docker/          — Dockerfile and compose files
```

## Modules (28 total)

**Core** (always on): User Management, Company Setup, Audit Trail, Settings

**Lending**: Leads, Loan Origination, Loan Management, Collections, Gold Loans, Vehicle Loans, Microfinance

**Finance**: Accounting & GL, Treasury, Fee & Charges

**Compliance**: Regulatory Compliance, Reports & Analytics

**Integrations**: NACH/UPI, Account Aggregator, eSign, e-Stamping, Co-Lending, Insurance, DSA Channel, Early Warning System

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Database | Prisma 6 (SQLite / PostgreSQL / MySQL) |
| Validation | Zod |
| UI | Tailwind CSS |
| Testing | Vitest |
| Deployment | Docker |

## License

MIT
