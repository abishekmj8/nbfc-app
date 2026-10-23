# ADR-011: UI Framework & Component Library

**Status**: accepted
**Date**: 2026-10-24

## Context

The NBFC app is a data-heavy internal tool — lots of tables, forms, dashboards, and document previews. It must be usable by non-technical staff (loan officers, back-office), work well on both desktop and tablet, and support white-labeling for NBFCs who want their own branding.

---

## Decision

| Choice | Technology |
|---|---|
| **CSS Framework** | Tailwind CSS |
| **Component Library** | shadcn/ui |
| **Icons** | Lucide React |
| **Charts** | Recharts (shadcn/ui charts) |
| **Tables** | TanStack Table + shadcn data table |
| **Forms** | React Hook Form + Zod resolver |
| **Date Handling** | date-fns (lightweight, tree-shakeable) |
| **Toast/Notifications** | Sonner (shadcn/ui default) |

---

## Why shadcn/ui

- **Not a dependency** — components are copied into `src/components/ui/`, we own the code
- Fully customizable — modify any component directly, no fighting a library
- Built on Radix UI primitives — accessible by default (keyboard, screen reader, ARIA)
- Tailwind-native — consistent with the CSS framework choice
- Active ecosystem — new components added regularly
- **White-label ready** — theming via CSS variables, not hard-coded colors

### Why not Ant Design?
- Heavier bundle, opinionated styling harder to override
- Less natural fit with Tailwind
- Better for Chinese enterprise apps, less aligned with Indian NBFC needs

### Why not MUI?
- Large bundle size
- Material Design aesthetic doesn't fit a financial tool well
- Theming is complex

---

## Theming & White-Label

### CSS Variable-based theming

```css
/* globals.css */
:root {
  --primary: 222.2 84% 4.9%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  /* ... etc */
}

.dark {
  --primary: 210 40% 98%;
  /* ... dark mode overrides */
}
```

### Per-NBFC branding

```
Settings > Branding:
  - Company name
  - Logo (light + dark versions)
  - Primary color
  - Accent color
  - Favicon
```

These override CSS variables at runtime. No rebuild needed.

---

## Layout Structure

```
┌─────────────────────────────────────────────┐
│  Top Bar: Company logo, search, user menu   │
├──────────┬──────────────────────────────────┤
│          │                                  │
│  Sidebar │      Main Content Area           │
│  (nav)   │                                  │
│          │  ┌────────────────────────────┐   │
│  - Dash  │  │  Page Header + Breadcrumb  │   │
│  - Loans │  ├────────────────────────────┤   │
│  - Cust  │  │                            │   │
│  - Coll  │  │  Page Content              │   │
│  - Acct  │  │  (tables, forms, cards)    │   │
│  - Rpts  │  │                            │   │
│  - Sett  │  └────────────────────────────┘   │
│          │                                  │
├──────────┴──────────────────────────────────┤
│  Footer (optional): version, support link   │
└─────────────────────────────────────────────┘
```

- Sidebar is **collapsible** (icon-only mode for more content space)
- Sidebar shows only modules that are **enabled**
- Responsive: sidebar becomes bottom nav or hamburger on tablet
- Breadcrumb navigation on every page

---

## Component Organization

```
src/components/
  ui/                  — shadcn/ui base components (button, input, dialog, etc.)
  layout/              — shell, sidebar, topbar, breadcrumb
  shared/              — reusable business components
    money-display.tsx  — formats paise to rupees with Indian separators
    masked-field.tsx   — PII masking with reveal-on-permission
    status-badge.tsx   — colored badges for loan/payment status
    date-display.tsx   — UTC to local timezone conversion
    data-table.tsx     — base data table with pagination, sorting, filtering
    form-field.tsx     — form field wrapper with label, error, description
    confirm-dialog.tsx — confirmation modal for destructive actions
    audit-info.tsx     — "Created by X on Y, Updated by Z on W" display
```

**Rules:**
- Base UI components in `ui/` — only modified if shadcn/ui doesn't meet the need
- Business components in `shared/` — reused across modules
- Module-specific components in `src/app/(modules)/{module}/components/`
- No business logic in components — call server actions or pass data from server components

---

## Forms

**React Hook Form + Zod for every form.**

```typescript
const formSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  loanAmount: z.number().int().positive("Amount must be positive"),
  tenureMonths: z.number().int().min(1).max(360),
});

// Schema is shared with the server action — one source of truth
```

**Form patterns:**
- Multi-step forms for complex flows (loan application = 5+ steps)
- Auto-save drafts (for loan applications)
- Inline validation (Zod errors shown per field)
- Dirty-check on navigation (warn before losing unsaved changes)
- Loading states on submit (prevent double-submit)

---

## Tables

**TanStack Table for all data tables.**

Features every table needs:
- Server-side pagination (API handles `page` + `limit`)
- Column sorting (single column)
- Column filtering (per-column filter inputs)
- Column visibility toggle (user hides/shows columns)
- Row selection (for bulk actions)
- Export to CSV/Excel (from current view or full dataset)
- Responsive: horizontal scroll on mobile, or card view for key tables

---

## Accessibility

Non-negotiable for an app used by diverse staff:

- All interactive elements keyboard-accessible
- ARIA labels on icons, buttons without text
- Focus management in modals and drawers
- Color contrast AA minimum (WCAG 2.1)
- Screen reader announcements for toasts and status changes
- No information conveyed by color alone (always include text/icon)

---

## Performance Guidelines

- **Server Components by default** — client components only for interactivity
- Lazy-load heavy modules (charts, PDF preview)
- Virtualized rendering for tables with 1000+ rows (TanStack Virtual)
- Image optimization via Next.js `<Image>` for uploaded photos
- Bundle analysis on CI — alert if client JS exceeds 200KB initial load

---

## Dark Mode

- Supported via Tailwind's `dark:` variant + CSS variables
- User preference stored in settings (light/dark/system)
- All components and custom styles must respect dark mode
- Financial data readability is priority — test contrast in both modes
