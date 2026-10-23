# ADR-014: Upgrade & Migration Strategy

**Status**: accepted
**Date**: 2026-10-24

## Context

The app is self-hosted — each NBFC client runs their own instance. When we release a new version, clients need a safe, simple way to upgrade without losing data or experiencing extended downtime. This is the hardest part of self-hosted software and must be designed from day one.

---

## Decision: Semantic versioning + automated migration on startup

---

## Version Scheme

**Semantic Versioning**: `MAJOR.MINOR.PATCH`

| Type | When | Example | Breaking? |
|---|---|---|---|
| MAJOR | Breaking DB schema changes, API changes | 2.0.0 | Yes — migration required |
| MINOR | New features, new modules, non-breaking schema additions | 1.3.0 | No — safe to upgrade |
| PATCH | Bug fixes, security patches | 1.3.2 | No — safe to upgrade |

Version stored in:
- `package.json` (source of truth)
- `system_config` table in DB (current running version)
- Displayed in Settings > About

---

## Upgrade Flow

### For Docker deployments (recommended)

```bash
# 1. Pull new image
docker pull nbfc-app:1.3.0

# 2. Stop current container
docker-compose down

# 3. Start with new image (migrations run automatically)
docker-compose up -d

# That's it. Migrations run on startup.
```

### For standalone Node.js deployments

```bash
# 1. Download new release
# 2. Stop the app
# 3. Replace files
# 4. Start the app (migrations run automatically)
node server.js
```

---

## Database Migration Strategy

### Prisma Migrate

- All schema changes go through Prisma migrations
- Migration files are versioned and sequential: `20261024_add_loan_status_field`
- Migrations run **automatically on app startup** before the app accepts requests

### Startup migration flow

```
App starts
  → Check DB connection
  → Read current schema version from DB
  → Compare with expected schema version in code
  → If behind:
    → Run pending Prisma migrations in order
    → Run data migrations (if any)
    → Update schema version in system_config
  → If up to date:
    → Continue startup
  → If ahead (DB is newer than code):
    → REFUSE TO START — prevent running old code against new schema
    → Log error: "Database schema is newer than application. Please upgrade the application."
```

### Data migrations (beyond schema)

Some upgrades need data transformations, not just schema changes:

```
src/lib/migrations/
  data/
    001-backfill-company-id.ts
    002-encrypt-existing-pan-fields.ts
    003-recalculate-dpd-values.ts
```

- Data migrations run after schema migrations
- Each has a unique ID, tracked in `data_migrations` table
- Each is idempotent — safe to run multiple times
- Each logs progress (for large tables: "Migrated 5,000 of 50,000 records")

---

## Rollback Strategy

### Schema rollback

- Prisma generates `down` migrations — but we prefer **forward-only migrations**
- If something goes wrong, fix it in a new migration rather than rolling back
- Why: rollback can lose data (dropped columns, changed types)

### Application rollback

- Keep the previous Docker image / application files
- If the new version has a critical bug:
  1. Stop the new version
  2. **Restore from pre-upgrade backup** (see ADR-015)
  3. Start the old version
- This is why **pre-upgrade backup is mandatory** (enforced by the upgrade process)

### Pre-upgrade backup (enforced)

```
App starts with pending migrations
  → Check: does a recent backup exist? (within last 24 hours)
  → If no backup:
    → Auto-create backup before migrating
    → OR refuse to migrate and prompt user to backup first
  → If backup exists:
    → Proceed with migration
```

---

## Breaking Changes Policy

### What counts as a breaking change (MAJOR version bump):

- Removing a DB column or table
- Changing a column type
- Removing an API endpoint
- Changing API response structure
- Changing authentication mechanism
- Removing a feature/module

### How we handle breaking changes:

1. **Deprecation notice** in the MINOR version before removal
2. **Migration guide** in the release notes
3. **Automated data migration** handles the transition
4. **Never delete data** — move to archive tables if removing a feature

---

## Multi-Database Considerations

Since we support SQLite, PostgreSQL, and MySQL:

- Prisma generates database-specific SQL for each migration
- Migration files tested against all 3 databases in CI
- Some migrations may need conditional logic per database
- **Critical**: Test migration performance on large datasets (100K+ loans) for each DB

---

## Update Notification

The app can optionally check for new versions:

```
Settings > Updates:
  - Check for updates: [on/off] (default: off for air-gapped deployments)
  - Update channel: stable | beta
  - Current version: 1.3.0
  - Latest available: 1.4.0
  - Changelog: [view]
```

- Check is a simple HTTPS GET to a version manifest (no telemetry, no data sent)
- Air-gapped deployments: this is off by default, manual upgrade only
- Never auto-update — always manual (financial software must be intentionally upgraded)

---

## Release Artifacts

Each release produces:

| Artifact | For |
|---|---|
| Docker image (`nbfc-app:x.y.z`) | Docker deployments |
| Standalone tarball (`.tar.gz`) | Node.js deployments |
| Standalone ZIP (`.zip`) | Windows deployments without Docker |
| Migration SQL (per database) | DBAs who want to review SQL before running |
| Changelog | All deployments |
| Migration guide (if MAJOR) | All deployments |

---

## Consequences

- **Enables**: Safe, predictable upgrades for non-technical NBFC IT staff
- **Trade-off**: Forward-only migrations mean we can't easily undo a bad migration — mitigated by mandatory pre-upgrade backup
- **Trade-off**: Auto-migration on startup adds a few seconds to cold start — acceptable
- **Prevents**: Nothing. The strategy is standard for self-hosted apps (GitLab, Nextcloud, etc. use the same pattern)
