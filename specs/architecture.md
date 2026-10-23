# System Architecture

## Overview

The NBFC application is a self-hostable web app. Each client deploys their own instance on infrastructure they control — a local server, NAS device, cloud VM, or managed hosting. Users access the app through a web browser.

## High-Level Architecture

```
Browser (any device)
    |
    v
+-----------------------+
|     Next.js App       |
|  (App Router + API)   |
+-----------+-----------+
            |
  +---------+---------+
  |  Storage Adapter   |
  |      Layer         |
  +--+-----+-----+----+
     |     |     |
     v     v     v
  SQLite  PG   MySQL     (Database — client chooses one)

  +--+-----+-----+----+
  | File Storage Adapter|
  +--+-----+-----+----+
     |     |
     v     v
  Local   S3-compatible   (Files — KYC docs, agreements, etc.)
  Disk    (MinIO/AWS)
```

## Deployment Models

### 1. Docker (recommended)
Single `docker-compose up` that starts the app + database. Works on any server, VPS, or NAS that runs Docker (Synology, QNAP, Unraid).

### 2. Standalone Node.js
`node server.js` — for environments without Docker. Client provides their own database.

### 3. Managed Cloud
Same Docker image deployed to AWS/GCP/Azure. Database on managed service (RDS, Cloud SQL, etc.).

## Storage Adapter Layer

The app never talks to a specific database or file system directly. All data access goes through an adapter interface:

- **Database adapter**: Prisma handles this — same schema, different connection string per DB engine.
- **File storage adapter**: Interface with implementations for local disk and S3-compatible storage. Client configures which one at setup time.

Configuration is done via environment variables (`.env`) or a setup wizard on first launch.

## Key Architectural Properties

- **Single-tenant**: One instance = one company. No shared infrastructure between clients.
- **Stateless app layer**: All state lives in the database and file storage. The app server can be restarted or replaced without data loss.
- **Audit trail**: Every data mutation is logged to an append-only audit table. Logs include who, what, when, and the before/after state.
- **Backup**: Built-in backup command that dumps the database and archives uploaded files into a single restorable bundle.

## Security Boundaries

- All user input validated at the API boundary (Zod schemas).
- PII (PAN, Aadhaar, bank details) encrypted at rest in the database.
- Authentication required for all routes except the login page.
- Role-based access control (RBAC) on all protected operations.
- CSRF protection on all state-changing requests.
