# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project foundation: CLAUDE.md coding standards and workflow rules (2026-10-24)
- Specs folder with architecture overview and 5 decision records (2026-10-24)
- CHANGELOG.md for tracking all changes (2026-10-24)
- .gitignore for Node.js / Next.js project (2026-10-24)
- Module registry spec: 20 toggleable feature modules covering all NBFC operations (2026-10-24)
- Legal & regulatory compliance spec: RBI directions, DPDP Act, KYC/AML, cybersecurity (2026-10-24)
- Aadhaar & PAN handling rules spec: storage, masking, verification, consent, data vault (2026-10-24)
- Credit bureau integration spec: pull workflow, consent, reporting, disputes, aggregator pattern (2026-10-24)
- Database schema conventions spec: ULID IDs, paise for money, soft delete, naming rules (2026-10-24)
- API design conventions spec: REST routes, error codes, validation, pagination, PII masking (2026-10-24)
- UI framework spec: shadcn/ui + Tailwind, theming, white-label, accessibility (2026-10-24)
- PDF & document generation spec: React-PDF templates, Indian scripts, bulk generation (2026-10-24)
- Multi-language i18n spec: next-intl, English + Hindi Phase 1, document language per borrower (2026-10-24)
- Upgrade & migration strategy spec: auto-migration on startup, forward-only, pre-upgrade backup (2026-10-24)
- Backup & restore spec: encrypted archives, scheduled backups, CLI support, audit continuity (2026-10-24)
- Interest calculation engine spec: daily reducing balance, Actual/Actual, penal charges, NPA handling (2026-10-24)
- Competitive analysis: 10+ competitors analyzed, 8 industry pain points, positioning strategy (2026-10-24)
- Full 8-phase implementation plan with MVP definition at Phase 4 (2026-10-24)
- PWA & mobile-first design spec: installable, offline queue, push notifications, responsive layouts (2026-10-24)
- NACH/UPI AutoPay spec: mandate management, bounce handling, reconciliation (2026-10-24)
- Account Aggregator spec: consent-based bank statement fetch, auto-analysis (2026-10-24)
- eSign spec: Aadhaar eSign, DSC, multi-party signing, ESP integration (2026-10-24)
- e-Stamping spec: NeSL/SHCIL, state-wise rates, certificate tracking (2026-10-24)
- Co-lending spec: CLM-1, loan assignment, payment splits, MRR (2026-10-24)
- Insurance spec: credit life tracking, premium, claims, KFS disclosure (2026-10-24)
- DSA/Partner API spec: partner management, commissions, API endpoints (2026-10-24)
- Early Warning System spec: stress scoring, rule engine, proactive alerts (2026-10-24)
- Module registry updated: 20 → 28 modules (8 new integration/automation modules) (2026-10-24)
- Implementation plan updated to include all 28 modules across 8 phases (2026-10-24)

### Phase 1 Implementation
- Next.js 16 + TypeScript strict + Tailwind CSS + Prisma 6 scaffold (2026-10-24)
- Prisma schema: Company, Branch, User, Role, Permission, Session, AuditLog, SystemConfig, Holiday (2026-10-24)
- Auth system: login, bcrypt, session cookies, RBAC middleware, module gate middleware (2026-10-24)
- Setup wizard: first-launch company + admin creation with default roles and modules (2026-10-24)
- Audit trail: centralized service, audit log viewer with pagination (2026-10-24)
- App shell: sidebar navigation, topbar, authenticated layout (2026-10-24)
- Module toggle system: 28 modules with dependency validation (2026-10-24)
- Branch management: CRUD with audit logging (2026-10-24)
- Docker: multi-stage Dockerfile, docker-compose with PostgreSQL (2026-10-24)
- Vitest: money utility tests (11 passing) (2026-10-24)
- Dev seed: demo company + admin user (admin@demo-nbfc.com / admin123) (2026-10-24)
