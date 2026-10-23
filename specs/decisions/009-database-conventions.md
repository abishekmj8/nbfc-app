# ADR-009: Database Schema Conventions

**Status**: accepted
**Date**: 2026-10-24

## Context

Consistent database conventions prevent bugs, simplify querying, and make the schema self-documenting. For financial software, conventions around money, timestamps, and deletion are especially critical. These rules apply to every Prisma model in the app.

---

## ID Strategy

**Decision: ULID (Universally Unique Lexicographically Sortable Identifier)**

```
id  String  @id @default(cuid())  // Prisma cuid() generates ULID-like IDs
```

Why ULID over alternatives:
- **vs auto-increment**: Exposes record count, not safe in URLs, breaks across multi-instance setups
- **vs UUID v4**: Not sortable by time — bad for pagination and debugging
- **ULID**: Sortable by creation time, URL-safe, no collisions, works across instances

Format: 26-character string, e.g., `01ARZ3NDEKTSV4RRFFQ69G5FAV`

**Exception**: Audit log and high-write tables may use `BigInt` auto-increment for insert performance, with a separate ULID column for external reference.

---

## Timestamps

**Every table gets these 3 columns:**

```prisma
createdAt  DateTime  @default(now())
updatedAt  DateTime  @updatedAt
deletedAt  DateTime?  // null = active, set = soft-deleted
```

**Rules:**
- All timestamps stored in **UTC** — no local timezone in the database
- Display layer converts to user's timezone (configured per branch or user)
- `createdAt` is immutable — never updated after insert
- `updatedAt` auto-managed by Prisma's `@updatedAt`
- `deletedAt` used for soft delete (see below)

**Business event timestamps** (e.g., `disbursedAt`, `sanctionedAt`) are separate columns, not overloads of `createdAt`.

---

## Soft Delete

**Decision: Soft delete for all business entities. Hard delete only for truly ephemeral data.**

```prisma
deletedAt  DateTime?   // null = active record
deletedBy  String?     // user who deleted
```

**Soft-deleted records:**
- Excluded from all normal queries via Prisma middleware (automatic WHERE deletedAt IS NULL)
- Visible in admin/audit views
- Can be restored (set `deletedAt` back to null)
- Permanently purged only by scheduled retention jobs (after legal retention period)

**Hard delete allowed only for:**
- Session tokens (ephemeral)
- OTP records (ephemeral)
- Temporary upload staging data
- Never for: customers, loans, payments, documents, audit logs

---

## Money & Financial Amounts

**Decision: All money stored as integer paise (smallest currency unit). Never floats.**

```prisma
// CORRECT
principalAmount    BigInt    // in paise: 150000 = Rs 1,500.00
interestAmount     BigInt    // in paise
penaltyAmount      BigInt    // in paise

// WRONG - never do this
amount             Float     // floating point loses precision
amount             Decimal   // Prisma Decimal is OK but paise is simpler
```

**Rules:**
- 1 Rupee = 100 paise
- All calculations in paise, convert to rupees only at the display layer
- Use `BigInt` not `Int` — `Int` overflows at ~Rs 2.14 crore (2,147,483,647 paise)
- Rounding: always round to nearest paise, half-up (standard banking rounding)
- Negative amounts allowed only for specific fields (refunds, adjustments) — document which fields allow negative
- Sum validation: `principalAmount + interestAmount + feesAmount = totalAmount` — enforce in application layer

**Display format:**
```
Rs 1,50,000.00    // Indian numbering (lakh/crore separators)
₹1,50,000.00      // with rupee symbol
```

---

## Enum Conventions

**Use string enums, not integer codes.**

```prisma
enum LoanStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  SANCTIONED
  DISBURSED
  ACTIVE
  OVERDUE
  NPA
  CLOSED
  WRITTEN_OFF
  CANCELLED
}
```

Why:
- Self-documenting in the database — `SELECT * FROM loans WHERE status = 'ACTIVE'` is readable
- No need for lookup tables for simple categorizations
- Adding new values doesn't shift existing integer mappings
- Prisma enforces type safety

**Naming**: UPPER_SNAKE_CASE for enum values. Enum name is PascalCase.

---

## Naming Conventions

### Tables
- **PascalCase singular**: `Customer`, `LoanAccount`, `AuditLog`
- Prisma model name = table name (Prisma handles plural mapping to DB)

### Columns
- **camelCase**: `firstName`, `loanAccountId`, `createdAt`
- Foreign keys: `{relatedModel}Id` — e.g., `customerId`, `branchId`, `createdById`
- Boolean columns: `is` or `has` prefix — `isActive`, `isVerified`, `hasConsented`
- Amount columns: suffix with what it is — `principalAmount`, `interestAmount`, not just `amount`
- Date columns: suffix with `At` for timestamps, `On` for dates — `disbursedAt` (DateTime), `dueOn` (Date)

### Indexes
- Named explicitly: `idx_{table}_{columns}` — `idx_loan_account_customer_id`
- Unique constraints: `unq_{table}_{columns}` — `unq_customer_pan_number`

---

## Relationships & Foreign Keys

```prisma
model LoanAccount {
  id          String    @id @default(cuid())
  customer    Customer  @relation(fields: [customerId], references: [id])
  customerId  String
  branch      Branch    @relation(fields: [branchId], references: [id])
  branchId    String
}
```

**Rules:**
- Every relationship has an explicit foreign key column
- **No cascade deletes** on business entities — prevent accidental data loss
- Cascade only on true child records (e.g., delete a draft application deletes its draft documents)
- Use `onDelete: Restrict` as default — force explicit handling

---

## Multi-Tenancy Column (future-proofing)

Even though we're single-tenant now, every major table includes:

```prisma
companyId  String  // links to the Company/tenant record
```

This costs nothing now but makes database-per-tenant or shared-database multi-tenancy possible later without schema migration.

---

## Audit Columns

Beyond `createdAt`/`updatedAt`/`deletedAt`, business-critical tables get:

```prisma
createdBy   String   // user ID who created
updatedBy   String   // user ID who last updated
deletedBy   String?  // user ID who deleted (if soft-deleted)
```

These are set by application middleware, not by the user.

---

## JSON Columns (use sparingly)

**Allowed for:**
- Configuration/settings (schema-less by nature)
- Audit log `before`/`after` snapshots
- External API raw responses (bureau data, eKYC data)
- Metadata bags where schema varies

**Not allowed for:**
- Data you need to query or filter on — normalize it into columns
- Relationships — use proper foreign keys
- Financial amounts — must be typed columns for integrity

When using JSON, define a Zod schema for validation even though the DB won't enforce structure.

---

## Common Model Pattern

Every business entity follows this base pattern:

```prisma
model ExampleEntity {
  // Identity
  id          String    @id @default(cuid())
  companyId   String

  // Business fields
  // ...

  // Status
  status      ExampleStatus  @default(DRAFT)

  // Audit
  createdAt   DateTime  @default(now())
  createdBy   String
  updatedAt   DateTime  @updatedAt
  updatedBy   String
  deletedAt   DateTime?
  deletedBy   String?

  // Relations
  company     Company   @relation(fields: [companyId], references: [id])
  createdByUser  User   @relation("ExampleCreatedBy", fields: [createdBy], references: [id])
  updatedByUser  User   @relation("ExampleUpdatedBy", fields: [updatedBy], references: [id])

  // Indexes
  @@index([companyId])
  @@index([status])
  @@index([createdAt])
}
```

---

## Database-Specific Notes

Since we support SQLite, PostgreSQL, and MySQL:

| Feature | SQLite | PostgreSQL | MySQL |
|---|---|---|---|
| BigInt | Supported | Native | Native |
| JSON columns | Text (app parses) | Native JSONB | Native JSON |
| Enums | String (app enforces) | Native ENUM | Native ENUM |
| Full-text search | FTS5 extension | tsvector | FULLTEXT index |
| Transactions | WAL mode recommended | Native MVCC | InnoDB |
| Max connections | 1 writer (WAL mode) | Configurable pool | Configurable pool |

**Rule**: Use only the common Prisma subset. No raw SQL with database-specific syntax in the core app. Database-specific optimizations go in clearly marked adapter files.
