# ADR-012: PDF & Document Generation Engine

**Status**: accepted
**Date**: 2026-10-24

## Context

NBFCs generate a LOT of documents — loan agreements, sanction letters, KFS, receipts, demand notices, NOCs, statements, reports. These must be:
- Professionally formatted
- Configurable per NBFC (logo, address, terms)
- Generated in multiple languages (as required by Fair Practices Code)
- Printable (A4 standard, proper margins)
- Stored and audit-logged

---

## Decision: React-PDF for templates + Puppeteer fallback for complex layouts

### Primary: @react-pdf/renderer

```
Template (React components) → PDF buffer → Store / Stream to browser
```

**Why React-PDF:**
- Templates written as React components — same language as the rest of the app
- Server-side rendering — no browser dependency
- Supports: tables, images, headers/footers, page numbers, custom fonts (Indian scripts)
- Lightweight — no headless browser needed
- Deterministic output — same input = same PDF every time

**Use for:**
- Loan agreements, sanction letters
- Key Fact Statement (KFS)
- Payment receipts
- Demand notices, legal notices
- NOC / No Dues Certificate
- Account statements
- EMI schedule printout
- Form 60

### Fallback: Puppeteer (headless Chrome)

**Use only for:**
- Complex reports with charts (portfolio dashboard PDF)
- HTML-heavy documents that are hard to replicate in React-PDF
- Bulk report generation where HTML templates already exist

**Why not Puppeteer as primary:**
- Heavy dependency (headless Chrome ~400MB)
- Slower than React-PDF
- Harder to deploy on NAS/minimal servers
- Non-deterministic rendering (font rendering varies by environment)

---

## Template Architecture

```
src/lib/documents/
  templates/
    loan-agreement.tsx       — React-PDF template
    sanction-letter.tsx
    key-fact-statement.tsx
    payment-receipt.tsx
    demand-notice.tsx
    noc-certificate.tsx
    account-statement.tsx
    emi-schedule.tsx
    form-60.tsx
  components/
    header.tsx               — reusable company header (logo, address, reg number)
    footer.tsx               — reusable footer (page numbers, disclaimer)
    signature-block.tsx      — signature area with name, designation, date
    table.tsx                — reusable table component for PDF
    money-text.tsx           — "Rupees One Lakh Fifty Thousand Only" converter
  fonts/
    noto-sans-devanagari/    — Hindi
    noto-sans-tamil/         — Tamil
    noto-sans-telugu/        — Telugu
    noto-sans-bengali/       — Bengali
    ... (other Indian scripts)
  generator.ts               — unified PDF generation service
  storage.ts                 — save generated PDF + metadata
```

---

## Template Data Flow

```
1. Service prepares data (loan details, customer info, amounts)
        ↓
2. Data validated against template schema (Zod)
        ↓
3. Template renders React-PDF components with data
        ↓
4. PDF buffer generated server-side
        ↓
5. PDF stored in file storage (local disk / S3)
        ↓
6. Document record created in DB:
   - document_id, type, entity_id, generated_at, generated_by
   - file_path, file_hash (SHA-256)
   - template_version (for auditability)
        ↓
7. Audit log entry created
        ↓
8. PDF streamed to browser or sent via email
```

---

## Template Configuration

Each NBFC customizes document templates via settings:

```
Settings > Document Templates:
  - Company header (logo, name, address, registration numbers)
  - Authorized signatory (name, designation)
  - Terms & conditions (per document type)
  - Disclaimer text
  - Language (per template)
  - Custom clauses (appended to agreements)
```

**Implementation:**
- Base templates are code (React-PDF components)
- Variable content injected from configuration
- Custom clauses stored in DB, merged at generation time
- Template versioning — old documents reference the template version they were generated with

---

## Document Types & Requirements

| Document | When generated | Language | Legal requirement |
|---|---|---|---|
| **Key Fact Statement** | Before loan agreement | Borrower's preferred | RBI Digital Lending 2025 |
| **Loan Agreement** | At sanction/disbursement | Borrower's preferred | FPC |
| **Sanction Letter** | At loan approval | English + regional | FPC |
| **Payment Receipt** | On every payment | English + regional | Standard practice |
| **EMI Schedule** | At disbursement + on request | Any | Standard practice |
| **Account Statement** | On request / periodic | Any | Standard practice |
| **Demand Notice** | On overdue (configurable DPD) | Borrower's preferred | Recovery regulations |
| **NOC / No Dues** | On loan closure | English + regional | Standard practice |
| **Gold Pledge Receipt** | On gold loan disbursement | Borrower's preferred | Gold loan regulations |
| **Auction Notice** | 2 weeks before gold auction | Borrower's preferred | RBI gold loan rules |
| **Form 60** | When PAN not available | English / Hindi | Income Tax Act |

---

## Money in Words

Financial documents require amounts in words:

```
Rs 1,50,000.00 → "Rupees One Lakh Fifty Thousand Only"
Rs 7,23,456.78 → "Rupees Seven Lakh Twenty-Three Thousand Four Hundred Fifty-Six and Seventy-Eight Paise Only"
```

- Indian numbering system (lakh, crore — not million, billion)
- Implemented in `money-text.tsx` — supports English and Hindi
- "Only" suffix is standard on financial documents

---

## Print Optimization

- A4 page size (210mm × 297mm) as default
- Proper margins: 20mm top/bottom, 15mm left/right
- Page break handling — don't split tables/sections across pages awkwardly
- Print-friendly: no background colors that waste ink, high contrast text
- Letterhead mode: first page has full header, subsequent pages have minimal header + page number

---

## Bulk Generation

For operations that generate many documents at once:

- Bulk demand notices (all overdue accounts)
- Monthly statements (all active accounts)
- Bureau reporting cover letters

**Implementation:**
- Queue-based: documents added to a generation queue
- Processed in background (not blocking the user)
- Progress tracking: "Generated 45 of 230 demand notices"
- Downloadable as ZIP when complete
- Individual documents also stored per account

---

## Digital Signature (Future)

Placeholder for future implementation:
- eSign integration (Aadhaar-based eSign via ESP)
- DSC (Digital Signature Certificate) support
- Signature position marked in templates
- Not in Phase 1 — but templates are designed to accommodate it
