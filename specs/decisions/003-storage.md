# ADR-003: Pluggable Storage

**Status**: accepted
**Date**: 2026-10-24

## Context

Different NBFC clients have different infrastructure. Some run a server in their office, some use a NAS, some prefer cloud. The app must adapt to what the client has, not dictate infrastructure.

## Decision

### Database
Support three database engines via Prisma:
- **SQLite** — zero-config, perfect for small setups and NAS devices. Single file database.
- **PostgreSQL** — recommended for production. Best performance, features, and ecosystem.
- **MySQL** — supported for clients with existing MySQL infrastructure.

The client chooses their database by setting `DATABASE_URL` in the environment. Prisma handles the abstraction — one schema, multiple engines.

### File Storage (documents, KYC images, agreements)
Two backends via a file storage adapter interface:
- **Local disk** — files stored in a configurable directory. Works on any server or NAS.
- **S3-compatible** — works with AWS S3, MinIO (self-hosted), Backblaze B2, or any S3-compatible service.

The client chooses by setting `FILE_STORAGE_TYPE=local|s3` and the relevant config (path or S3 credentials).

### Backup & Restore
Built-in commands:
- **Backup**: Dumps the database + archives uploaded files into a single `.tar.gz` bundle.
- **Restore**: Takes a backup bundle and restores the database + files.
- Works regardless of which storage backend is in use.

### Setup Wizard
On first launch (empty database), a setup wizard guides the client through:
1. Database connection (auto-detected from `DATABASE_URL`)
2. File storage configuration
3. Admin account creation
4. Basic company settings

## Consequences

- **Enables**: Maximum deployment flexibility. Client uses what they already have.
- **Trade-off**: Must test against 3 database engines. Some Prisma features behave differently across engines.
- **Trade-off**: SQLite has concurrency limitations — acceptable for small teams, not for high-throughput setups.
- **Prevents**: Database-specific features (PostgreSQL JSON operators, full-text search) can't be used in the core app. Must use the common Prisma subset.
