# CLAUDE.md — NBFC Application

## Project Overview

Self-hostable web application for Non-Banking Financial Companies. Clients deploy on their own infrastructure (server, NAS, cloud) and access via browser. Single deployable — same codebase serves all storage backends.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma (multi-DB: SQLite, PostgreSQL, MySQL)
- **Validation**: Zod at all boundaries
- **Auth**: Self-managed (email/password), SSO planned
- **Testing**: Vitest
- **Containerization**: Docker + docker-compose
- **Package Manager**: pnpm

## Architecture Decisions

| Decision | Choice | Spec |
|---|---|---|
| Tenancy | Single-tenant (one instance per client) | `specs/decisions/004-tenancy.md` |
| Auth | Self-managed, SSO later | `specs/decisions/002-auth.md` |
| Database | Pluggable: SQLite / PostgreSQL / MySQL | `specs/decisions/003-storage.md` |
| File Storage | Local disk + optional S3-compatible | `specs/decisions/003-storage.md` |
| Audit | Every mutation logged, append-only | `specs/decisions/005-audit.md` |
| Backup | Built-in DB dump + file archive | `specs/decisions/003-storage.md` |
| Reporting | Built-in basics + CSV/Excel export | — |

## Folder Structure

```
src/
  app/              — Next.js App Router (pages, layouts, route handlers)
  components/       — Shared React components
  lib/              — Business logic and utilities
    storage/        — Storage adapter layer (DB + files)
    auth/           — Authentication logic
    audit/          — Audit trail
  prisma/           — Prisma schema and migrations
public/             — Static assets
docker/             — Dockerfile, docker-compose.yml
specs/              — Specifications and decision records
  decisions/        — Architecture Decision Records (ADRs)
  features/         — Feature specs (added as features are built)
  api/              — API endpoint specs
```

## Coding Standards

### TypeScript
- `strict: true` always. No `any` — use `unknown` + narrowing or generics.
- Model illegal states as unrepresentable. Union types over boolean flags.
- Zod schemas at every untrusted boundary. Infer types from schemas (`z.infer<typeof schema>`), never duplicate.
- `readonly` and `const` assertions by default.

### Next.js
- Server Components by default. Push `"use client"` to leaf components only.
- Fetch data on the server (RSC, route handlers, server actions). No `useEffect`-fetch when a server component can do it.
- Server actions and route handlers validate input with Zod before processing.
- Accessibility: proper roles, labels, keyboard navigation.

### Database & Money
- All DB access through Prisma. No raw SQL unless absolutely necessary (and parameterized).
- **Money is stored as integer paise** (1 rupee = 100 paise). Never use floats for money.
- Multi-step writes wrapped in `prisma.$transaction()`.
- Every mutation creates an audit log entry.

### Error Handling
- Design for the unhappy path: null, empty, timeout, partial failure.
- External calls get timeouts. Retries only where idempotent.
- User-facing errors are actionable. Internal errors are logged with context.
- No bare `catch` that swallows errors.

### Naming
- Files: `kebab-case.ts` for modules, `PascalCase.tsx` for components.
- Functions/variables: `camelCase`. Types/interfaces: `PascalCase`.
- Descriptive, intent-based names. No abbreviations except well-known ones (id, url, db).

### Testing
- Vitest for all tests. Test behavior and contracts, not implementation.
- New logic ships with tests. Bug fixes start with a failing test.
- Use the existing test patterns — don't introduce a second runner.

## Mandatory Workflow Rules

### Every change MUST:

1. **Update specs**: If a change affects architecture, a feature, or an API — update or create the relevant doc in `specs/`. New features get a spec in `specs/features/`. API changes update `specs/api/`.

2. **Update CHANGELOG.md**: Add an entry under `## [Unreleased]` in the appropriate section (Added/Changed/Fixed/Removed/Security). Format: `- Description of change (YYYY-MM-DD)`.

3. **Reference specs in commits**: When a change relates to a spec, mention it in the commit message (e.g., `ref: specs/decisions/003-storage.md`).

### Spec Template (for new specs)
See `specs/README.md` for the standard template.

## Security Baseline

- Validate and sanitize all external input.
- Never log secrets, tokens, or PII (PAN, Aadhaar, bank details).
- PII fields encrypted at rest in the database.
- Auth and authorization checked at every protected boundary.
- CSRF protection on all mutations.
- Rate limiting on auth endpoints.
