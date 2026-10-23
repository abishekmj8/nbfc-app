# ADR-001: Tech Stack

**Status**: accepted
**Date**: 2026-10-24

## Context

We need to choose a tech stack for a self-hostable NBFC web application. Requirements:
- Must run on client infrastructure (servers, NAS, cloud)
- Must support multiple database backends
- Must produce a single deployable unit
- Must be maintainable by a small team
- Financial data demands correctness and security

## Decision

- **Next.js 15 (App Router)** — full-stack React framework. Server-side rendering, API routes, and server actions in one deployable. Large ecosystem, strong TypeScript support.
- **TypeScript (strict)** — type safety across the entire stack. Non-negotiable for financial software.
- **Prisma** — ORM with first-class support for SQLite, PostgreSQL, and MySQL from a single schema. Typed queries, migrations, and introspection.
- **Zod** — runtime validation at all boundaries. Types inferred from schemas to avoid duplication.
- **Vitest** — fast, Vite-native test runner. Compatible with the Next.js ecosystem.
- **pnpm** — fast, disk-efficient package manager.
- **Docker** — primary distribution method. Single `docker-compose.yml` for app + database.

## Consequences

- **Enables**: Single codebase for all deployment models. Strong type safety end-to-end. Easy onboarding for TypeScript developers.
- **Trade-off**: Next.js is heavier than a pure API server, but eliminates the need for a separate frontend deployment.
- **Trade-off**: Prisma adds a query engine binary per platform, slightly increasing the Docker image size.
- **Prevents**: Nothing significant. All choices are mainstream with large communities and escape hatches.
