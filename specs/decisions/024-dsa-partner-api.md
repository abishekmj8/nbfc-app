# ADR-024: DSA / Partner API

**Status**: accepted
**Date**: 2026-10-24
**Toggleable**: Yes — Settings > Modules > Partner Channel

## Context

DSAs (Direct Selling Agents) source 60%+ of loans for many NBFCs. They're external agents/companies who find borrowers, collect documents, and submit applications to the NBFC. The system needs to manage DSA relationships and optionally expose an API for tech-savvy DSA partners to submit applications programmatically.

---

## DSA Management

```
DsaPartner:
  id, companyId
  type                      — INDIVIDUAL | CORPORATE | FINTECH
  name, contactPerson, phone, email
  panNumber                 — PAN of DSA entity
  gstNumber                 — if applicable
  address
  agreementDate, agreementDocumentId
  commissionStructure       — JSON {productId: {type: PERCENTAGE|FLAT, rate, maxPayout}}
  status                    — ACTIVE | SUSPENDED | TERMINATED
  terminationReason
  apiEnabled                — boolean (can this DSA use the API?)
  apiKeyHash                — hashed API key (if API enabled)
  createdBy

DsaLead:
  id, dsaPartnerId, leadId
  referralCode              — unique per DSA for tracking
  submittedAt
  status                    — SUBMITTED | ACCEPTED | CONVERTED | REJECTED
  conversionDate
  loanApplicationId         — if converted

DsaPayout:
  id, dsaPartnerId, loanAccountId
  payoutAmount              — commission (paise)
  gstOnPayout               — paise
  tdsDeducted               — TDS on commission (paise)
  netPayout                 — paise
  status                    — CALCULATED | APPROVED | PAID | HELD
  payoutDate
  paymentReference
  invoiceNumber             — DSA's invoice reference
```

---

## DSA Portal (Web)

A simplified web view for DSAs (same app, different role/permissions):

- DSA logs in with their own credentials
- Sees only their leads and applications (data isolation by DSA ID)
- Can: submit new leads, upload customer documents, track application status
- Cannot: approve loans, see other DSAs' data, access settings

---

## Partner API (optional, for tech-savvy DSAs/fintechs)

```
Base URL: /api/v1/partner/

Authentication: API key in header (X-API-Key)
Rate limit: 60 requests/minute per key

Endpoints:
  POST /leads              — Submit a new lead
  GET  /leads              — List DSA's leads
  GET  /leads/:id          — Get lead status
  POST /leads/:id/documents — Upload documents for a lead
  GET  /applications/:id   — Track application status (if lead converted)
  GET  /payouts            — List DSA's payouts
  GET  /products           — List available loan products
```

**Request example** (submit lead):
```json
POST /api/v1/partner/leads
{
  "customerName": "Ramesh Kumar",
  "phone": "9876543210",
  "email": "ramesh@example.com",
  "loanProductId": "clm1abc...",
  "requestedAmount": 15000000,
  "referralCode": "DSA-001-REF"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "leadId": "lead_xyz...",
    "status": "SUBMITTED",
    "message": "Lead submitted. Track status via GET /leads/lead_xyz"
  }
}
```

---

## Commission Calculation

```
On loan disbursement:
  1. Check if loan was sourced by a DSA (dsaPartnerId on lead/application)
  2. Look up commission structure for DSA + loan product
  3. Calculate: commission = loanAmount × rate (or flat amount)
  4. Apply TDS (typically 5% for individuals, 10% for corporates)
  5. Create DsaPayout record (status: CALCULATED)
  6. Require approval (maker-checker) before marking APPROVED
  7. On payment to DSA: mark as PAID with reference

Clawback:
  If loan defaults within X months (configurable), commission may be clawed back
  ClawbackRule: {withinMonths: 3, clawbackPercentage: 100}
```

---

## Configuration

```
Settings > Partner Channel:
  - Enabled: [yes/no]
  - DSA management: [add/edit partners]
  - Partner API: [enable/disable]
  - Default commission structure: [per product]
  - TDS rate: [5% individual / 10% corporate]
  - Payout approval: [auto / maker-checker]
  - Clawback period: [0-12 months]
  - Clawback percentage: [0-100%]
```

---

## Consequences

- **Enables**: Managed DSA channel, automated commission calculation, API for fintech partners
- **Trade-off**: Partner API adds an attack surface (API key management, rate limiting, data isolation)
- **Trade-off**: Commission/TDS calculation must be accurate for tax compliance
- **Toggleable**: NBFCs that don't use DSAs can disable entirely
