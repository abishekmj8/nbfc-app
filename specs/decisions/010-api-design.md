# ADR-010: API Design Conventions

**Status**: accepted
**Date**: 2026-10-24

## Context

The app uses Next.js App Router, which provides Route Handlers (API routes) and Server Actions. We need consistent conventions for how the backend exposes data and operations, both internally (server components calling services) and externally (for future mobile apps, integrations, or third-party access).

---

## Decision: Server Actions + Route Handlers (REST-like)

### Internal (UI to server)
- **Server Actions** for mutations (create, update, delete) — co-located with forms, type-safe, no manual fetch
- **Server Components** for reads — fetch data directly in RSC, no API call needed

### External (mobile apps, integrations, webhooks)
- **Route Handlers** (`app/api/...`) exposing REST-like endpoints
- Used only when server actions can't serve the need (external clients, webhooks, file downloads)

### Why not tRPC?
- Server Actions already give type-safe RPC for the Next.js frontend
- tRPC adds complexity without meaningful benefit when the only client is our own UI
- Route Handlers serve external consumers better than tRPC
- Can add tRPC later if a mobile app or external API becomes a priority

---

## URL Structure

```
/api/v1/{module}/{resource}
```

Examples:
```
GET    /api/v1/loans                     — list loans
GET    /api/v1/loans/:id                 — get one loan
POST   /api/v1/loans                     — create loan application
PATCH  /api/v1/loans/:id                 — update loan
DELETE /api/v1/loans/:id                 — soft-delete loan

GET    /api/v1/customers/:id/loans       — loans for a customer
POST   /api/v1/loans/:id/disburse        — action on a loan (RPC-style for operations)
GET    /api/v1/reports/portfolio-summary  — reports are a separate module
```

**Rules:**
- Plural nouns for resources: `/loans`, `/customers`, `/branches`
- Version prefix: `/v1/` — allows breaking changes in `/v2/` without disrupting existing integrations
- Nested resources max 2 levels: `/customers/:id/loans` (not `/customers/:id/loans/:id/payments/:id`)
- Use RPC-style POST for operations that aren't CRUD: `/loans/:id/disburse`, `/loans/:id/foreclose`

---

## Request Format

### Query Parameters (GET)
```
GET /api/v1/loans?status=ACTIVE&branchId=abc&page=1&limit=20&sort=createdAt&order=desc
```

### Request Body (POST/PATCH)
```json
{
  "customerName": "Ramesh Kumar",
  "loanAmount": 15000000,
  "tenureMonths": 24
}
```

- Body is always JSON (`Content-Type: application/json`)
- camelCase keys (matches TypeScript conventions)
- Money values in **paise** (integer)
- Dates as ISO 8601 strings: `"2026-10-24T10:30:00Z"`

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### Single Resource
```json
{
  "success": true,
  "data": {
    "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "customerName": "Ramesh Kumar",
    "loanAmount": 15000000,
    "status": "ACTIVE",
    "createdAt": "2026-10-24T10:30:00Z"
  }
}
```

### List Response
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "LOAN_ALREADY_DISBURSED",
    "message": "This loan has already been disbursed and cannot be modified.",
    "details": [
      {
        "field": "status",
        "message": "Current status is DISBURSED"
      }
    ]
  }
}
```

---

## Error Codes

### HTTP Status Codes Used

| Code | Meaning | When |
|---|---|---|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST that creates a resource |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed input |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | State conflict (e.g., disbursing an already disbursed loan) |
| 422 | Unprocessable Entity | Business rule violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Application Error Codes
```
Format: {MODULE}_{ERROR}

VALIDATION_FAILED
AUTH_INVALID_CREDENTIALS
AUTH_SESSION_EXPIRED
AUTH_INSUFFICIENT_PERMISSIONS
LOAN_NOT_FOUND
LOAN_ALREADY_DISBURSED
LOAN_INVALID_STATE_TRANSITION
CUSTOMER_DUPLICATE_PAN
CONSENT_NOT_FOUND
CONSENT_EXPIRED
BUREAU_PULL_FAILED
BUREAU_CONSENT_REQUIRED
MODULE_DISABLED
```

Defined in a central error registry (`src/lib/errors/codes.ts`) — never invent ad-hoc error strings.

---

## Validation

**Zod at every route handler and server action entry point.**

```typescript
// Schema
const createLoanSchema = z.object({
  customerId: z.string().cuid(),
  productId: z.string().cuid(),
  loanAmount: z.number().int().positive(), // paise
  tenureMonths: z.number().int().min(1).max(360),
});

// Type inferred from schema
type CreateLoanInput = z.infer<typeof createLoanSchema>;
```

**Rules:**
- Schema defined once, type inferred — never duplicate types
- Validation errors return 400 with field-level detail
- Schemas live next to their route/action: `src/app/api/v1/loans/schema.ts`
- Shared schemas (reused across routes) in `src/lib/schemas/`

---

## Pagination

**Offset-based pagination** (simple, works for most NBFC use cases):

```
GET /api/v1/loans?page=1&limit=20
```

- Default `limit`: 20
- Max `limit`: 100 (prevent runaway queries)
- Response includes `meta.total` and `meta.totalPages`
- Page numbers are 1-indexed

**Cursor-based pagination** reserved for:
- Audit logs (millions of records)
- Activity feeds
- Any table where offset becomes slow

---

## Filtering & Sorting

```
GET /api/v1/loans?status=ACTIVE,OVERDUE&branchId=abc&minAmount=1000000&maxAmount=5000000&sort=createdAt&order=desc
```

- Multiple values: comma-separated (`status=ACTIVE,OVERDUE`)
- Range filters: `min`/`max` prefix (`minAmount`, `maxAmount`, `fromDate`, `toDate`)
- Sort: single column via `sort` param, direction via `order` (asc/desc)
- Default sort: `createdAt desc` unless specified

---

## Authentication & Authorization

### API Authentication
- **Session cookie** (for browser-based access) — default
- **API key** (for external integrations) — optional, issued per integration
- No Bearer tokens unless SSO is enabled (Phase 2)

### Authorization
- Every route handler and server action checks:
  1. Is user authenticated?
  2. Is the module enabled?
  3. Does user have the required permission for this action?
- Permission check: `requirePermission('loans', 'create')` middleware
- Module check: `requireModule('loan-origination')` middleware

---

## Rate Limiting

| Endpoint type | Limit |
|---|---|
| Auth (login, password reset) | 5 requests/minute per IP |
| API read | 100 requests/minute per user |
| API write | 30 requests/minute per user |
| File upload | 10 requests/minute per user |
| Bureau pull | 5 requests/minute per user |

Rate limit info in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1698163200
```

---

## Idempotency

For operations that must not be duplicated (disbursement, payment recording):

```
POST /api/v1/loans/:id/disburse
Headers:
  Idempotency-Key: unique-client-generated-key
```

- Server stores the idempotency key + response for 24 hours
- Duplicate request with same key returns the original response
- Different key = new operation
- Required for: disbursement, payment, bureau pull, SMS/email send

---

## PII in API Responses

- API responses **auto-mask PII** by default
- Full PII only returned if caller has explicit permission AND the request includes `X-PII-Access: true` header
- Every PII access is audit-logged
- Masked format:
  - Aadhaar: `xxxx-xxxx-1234`
  - PAN: `XXXXX1234X`
  - Bank account: `XXXXXXXX1234`
  - Phone: `XXXXXX7890`
  - Email: `r***h@example.com`
