# ADR-015: Backup & Restore

**Status**: accepted
**Date**: 2026-10-24

## Context

Self-hosted NBFC clients are responsible for their own data. Many will be small teams without dedicated IT staff. The app must provide a simple, reliable backup and restore mechanism that protects against data loss, supports disaster recovery, and meets regulatory data retention requirements.

---

## Decision: Built-in backup to encrypted archive + scheduled automation

---

## What Gets Backed Up

| Component | Method | Included |
|---|---|---|
| **Database** | Full dump (pg_dump / mysqldump / SQLite file copy) | All tables, all data |
| **Uploaded files** | Archive from file storage directory | KYC docs, agreements, photos |
| **Configuration** | Export from system_config table | Settings, branding, module toggles |
| **Audit logs** | Included in DB dump | Full audit history |

**NOT backed up** (reconstructible):
- Node modules, build artifacts
- Session data, temp files
- Cache

---

## Backup Format

```
backup-nbfc-2026-10-24-103000.tar.gz.enc
  │
  ├── metadata.json          — backup info (version, timestamp, DB type, record counts)
  ├── database/
  │   └── dump.sql           — full database dump (or .db for SQLite)
  ├── files/
  │   └── uploads/           — all uploaded files, preserving directory structure
  └── config/
      └── system-config.json — exported system configuration
```

- **Compressed**: tar.gz (significant size reduction for SQL dumps)
- **Encrypted**: AES-256 encryption with a backup passphrase
- **Single file**: one `.tar.gz.enc` file — easy to move, store, transfer
- Passphrase set by admin in Settings > Backup > Encryption Key

---

## Backup Types

### 1. Full Backup
- Complete database dump + all files
- Used for: disaster recovery, migration, pre-upgrade safety
- Size: proportional to data (could be GBs for large portfolios with many documents)

### 2. Incremental Backup (Phase 2)
- Only changes since last full backup
- Faster, smaller
- Requires the base full backup to restore
- Implemented via DB WAL shipping (PostgreSQL) or binary log (MySQL)
- Not available for SQLite

---

## Backup Triggers

### Manual
```
Settings > Backup > Create Backup Now
  → Shows progress bar
  → Downloads backup file when complete
  → OR saves to configured backup location
```

### Scheduled (automated)
```
Settings > Backup > Schedule:
  - Frequency: Daily | Weekly | Monthly
  - Time: [HH:MM] (run during off-hours)
  - Retention: Keep last N backups (default: 7 daily, 4 weekly, 3 monthly)
  - Backup location: Local path | Network share | S3-compatible
```

### Pre-upgrade (automatic)
- Triggered automatically before database migrations run
- Stored locally with tag: `pre-upgrade-from-1.3.0-to-1.4.0`
- Retained until manually deleted

---

## Backup Storage Locations

| Location | Configuration | Best for |
|---|---|---|
| **Local directory** | File path | Simple setups, NAS |
| **Network share** | SMB/NFS mount path | Office server + NAS backup |
| **S3-compatible** | Endpoint, bucket, credentials | Cloud backup (AWS S3, MinIO) |

The backup storage adapter reuses the same pattern as file storage (ADR-003).

---

## Restore Flow

```
Settings > Backup > Restore
  1. Upload backup file (or select from backup location)
  2. Enter encryption passphrase
  3. System validates:
     - Backup integrity (checksum)
     - Backup version compatibility (can this app version restore this backup?)
     - Decryption success
  4. Preview: shows backup metadata (date, version, record counts)
  5. Confirmation: "This will REPLACE all current data. Are you sure?"
  6. Double confirmation: type "RESTORE" to proceed
  7. Restore executes:
     - App enters maintenance mode (no user access)
     - Database dropped and recreated from dump
     - Files restored from archive
     - Config restored
     - Post-restore migrations run (if backup is from older version)
     - App exits maintenance mode
  8. Restore log saved (who restored, when, from which backup)
```

**Safety measures:**
- Auto-backup of CURRENT data before restoring (so you can undo the restore)
- Restore cannot be triggered via API — UI only, admin role only
- Double confirmation prevents accidental restores
- Maintenance mode prevents data corruption during restore

---

## Backup Verification

```
Settings > Backup > Verify Backup
  - Upload a backup file
  - System checks:
    - File integrity (not corrupted)
    - Decryption works
    - SQL dump is valid
    - Version is compatible
  - Does NOT restore — just validates
```

Scheduled verification: optionally verify the latest backup weekly (test-restore to a temp database, validate record counts, discard).

---

## Audit Log Special Handling

**Audit logs are NEVER overwritten during restore.**

When restoring:
- Audit logs from the backup are merged into the current audit log
- A special audit entry is created: "SYSTEM_RESTORE performed by {admin} at {timestamp}, restored from backup dated {backup_date}"
- This ensures the audit trail is continuous and tamper-evident

---

## Regulatory Considerations

| Requirement | How backup handles it |
|---|---|
| PMLA 5-year retention | Backup includes all data; retention policy prevents premature deletion |
| IT Act 8-year retention | PAN and financial records included in backup |
| DPDP Act data erasure | Erasure requests tracked — restored data re-applies pending erasure requests |
| RBI audit trail | Audit logs never overwritten, continuous across restores |

---

## CLI Support

For automated/scripted backups (Docker deployments, cron jobs):

```bash
# Create backup
npx nbfc-backup create --output /backups/ --passphrase-file /secrets/backup-key

# Restore
npx nbfc-backup restore --input /backups/backup-2026-10-24.tar.gz.enc --passphrase-file /secrets/backup-key

# Verify
npx nbfc-backup verify --input /backups/backup-2026-10-24.tar.gz.enc --passphrase-file /secrets/backup-key

# List backups
npx nbfc-backup list --location /backups/

# Prune old backups (keep per retention policy)
npx nbfc-backup prune --location /backups/ --keep-daily 7 --keep-weekly 4 --keep-monthly 3
```

---

## Monitoring & Alerts

```
Settings > Backup > Alerts:
  - Alert if no backup in last [N] days (default: 2)
  - Alert if backup size changes by more than [N]% (possible data loss or corruption)
  - Alert if scheduled backup fails
  - Alert via: in-app notification + email (if SMTP configured)
```

Dashboard widget: "Last backup: 6 hours ago (2.3 GB) ✓"

---

## Consequences

- **Enables**: Disaster recovery, safe upgrades, regulatory compliance, client confidence
- **Trade-off**: Full backup of large portfolios (100K+ loans, lots of documents) can take minutes and produce multi-GB files
- **Trade-off**: Encrypted backups mean a lost passphrase = lost backup (document passphrase recovery in setup guide)
- **Architecture impact**: Backup/restore is a core system command, not a module — cannot be disabled
