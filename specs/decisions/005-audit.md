# ADR-005: Audit Trail

**Status**: accepted
**Date**: 2026-10-24

## Context

NBFCs are regulated entities. Every financial operation must be traceable — who did what, when, and what changed. This is a regulatory requirement and critical for internal controls (maker-checker, dispute resolution, fraud detection).

## Decision

**Append-only audit log built into the application from day one.**

### Design
- Dedicated `audit_log` table in the database.
- Every mutation (create, update, delete) on business-critical entities writes an audit entry.
- Audit entries are **append-only** — no updates or deletes allowed on this table.

### Audit Entry Schema
```
id            — Unique identifier (ULID or UUID)
timestamp     — When the action occurred (UTC)
user_id       — Who performed the action
user_email    — Denormalized for readability in logs
action        — CREATE | UPDATE | DELETE | LOGIN | LOGOUT | EXPORT | etc.
entity_type   — The type of record (e.g., "loan", "customer", "payment")
entity_id     — The ID of the affected record
before        — JSON snapshot of the record before the change (null for CREATE)
after         — JSON snapshot of the record after the change (null for DELETE)
ip_address    — Client IP address
user_agent    — Client user agent string
metadata      — Additional context (JSON, optional)
```

### Implementation
- Audit logging is handled by a centralized service (`src/lib/audit/`), not scattered across features.
- Every service method that mutates data calls the audit service as part of the same transaction.
- The audit table is excluded from backup-restore "restore" operations — audit history is never overwritten.

### Retention
- Audit logs are retained indefinitely by default.
- A configurable retention policy can be added later (archive to file after N years).

## Consequences

- **Enables**: Full traceability. Regulatory compliance. Dispute resolution. Forensic debugging.
- **Trade-off**: Database grows over time due to append-only logs. Mitigated by archival.
- **Trade-off**: Slightly slower mutations (extra INSERT per operation). Acceptable for financial software where correctness outweighs speed.
- **Prevents**: Nothing. Audit can be queried, exported, or archived independently of the main data.
