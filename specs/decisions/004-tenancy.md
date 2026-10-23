# ADR-004: Single-Tenant Architecture

**Status**: accepted
**Date**: 2026-10-24

## Context

We need to decide whether the app serves one company per instance (single-tenant) or multiple companies from one instance (multi-tenant).

## Decision

**Single-tenant**: Each NBFC client runs their own instance of the application with their own database.

Reasons:
- Matches the self-hosted deployment model — the client owns their data completely.
- Simpler data model — no tenant ID on every table, no row-level security, no cross-tenant leak risk.
- Easier compliance — client's data never touches shared infrastructure.
- Simpler backup/restore — dump the whole database, no filtering.

**Future multi-tenant path**: If we offer a managed SaaS version, multi-tenancy can be added via:
- Database-per-tenant (each tenant gets their own database, same app instance routes to the right one).
- This avoids schema changes to the single-tenant model.

## Consequences

- **Enables**: Data isolation by default. Simple architecture. Easy for clients to reason about.
- **Trade-off**: Each client needs their own deployment. Operational overhead if managing many clients.
- **Trade-off**: No shared dashboard across multiple NBFCs (not a current requirement).
- **Prevents**: Nothing permanent. Database-per-tenant multi-tenancy is additive, not a rewrite.
