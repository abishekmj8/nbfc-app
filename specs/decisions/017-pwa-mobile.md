# ADR-017: Progressive Web App (PWA) & Mobile-First Design

**Status**: accepted
**Date**: 2026-10-24

## Context

NBFC staff work across multiple contexts — back-office desktops, branch tablets, and field officers on phones. Building separate native apps (iOS + Android) is expensive and unnecessary for our target market. A PWA gives us installability, offline caching, and a native-like experience from one codebase.

---

## Decision: PWA with mobile-first responsive design

---

## What PWA Gives Us

| Feature | What it means |
|---|---|
| **Installable** | "Add to Home Screen" on Android/iOS — launches like a native app with app icon, splash screen, no browser chrome |
| **Offline shell** | App shell (layout, nav, static assets) cached — loads instantly even without network |
| **Background sync** | Queued actions (payment entry, collection visit log) sync when connection returns |
| **Push notifications** | Browser push notifications for approvals, overdue alerts, task assignments |
| **Auto-update** | Service worker updates the app in background — user always gets latest version |
| **No app store** | No Play Store/App Store submission, no review delays, no 30% commission |

---

## PWA Implementation

### Service Worker (via next-pwa or Serwist)

```
next.config.ts:
  - Register service worker
  - Configure caching strategies
  - Generate manifest.json
```

### Caching Strategy

| Resource | Strategy | Reason |
|---|---|---|
| App shell (HTML, CSS, JS) | **Cache-first** | Instant load, update in background |
| Static assets (icons, fonts) | **Cache-first** | Rarely change |
| API data (loans, customers) | **Network-first** | Always want fresh data, fall back to cache if offline |
| Images (KYC docs, photos) | **Cache-first** with revalidation | Large files, don't re-download |
| Auth endpoints | **Network-only** | Security — never cache auth |

### Web App Manifest

```json
{
  "name": "NBFC Manager",
  "short_name": "NBFC",
  "description": "Loan Management System",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#dynamic-from-branding",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- `theme_color` dynamically set from NBFC branding config
- Maskable icon for Android adaptive icons
- `display: standalone` removes browser chrome

---

## Offline Capabilities

### What works offline (cached)
- App shell and navigation
- Previously viewed loan details (read-only)
- Previously viewed customer details (read-only)
- EMI schedule (read-only)
- Dashboard (last synced data)

### What queues for sync (offline mutations)
- Collection visit log (date, location, outcome, notes)
- Payment receipt entry (queued, posted when online)
- Lead capture (basic details)
- Task status updates

### What requires online (no offline support)
- Login / authentication
- New loan application (too complex for offline)
- Credit bureau pull
- Document upload
- PDF generation
- Any maker-checker approval
- Reports generation

### Offline Queue Implementation

```typescript
// src/lib/offline/queue.ts
interface OfflineAction {
  id: string;
  type: 'COLLECTION_VISIT' | 'PAYMENT_ENTRY' | 'LEAD_CAPTURE' | 'TASK_UPDATE';
  payload: unknown;
  createdAt: string;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
}
```

- Stored in IndexedDB (via idb library)
- Synced when connection returns (Background Sync API)
- Conflict resolution: server wins (offline data is provisional until synced)
- UI shows sync status: "2 actions pending sync" indicator
- Failed syncs alert the user with details

---

## Mobile-First Responsive Design

### Breakpoints

| Breakpoint | Width | Target |
|---|---|---|
| `sm` | 640px+ | Large phones (landscape) |
| `md` | 768px+ | Tablets |
| `lg` | 1024px+ | Small laptops |
| `xl` | 1280px+ | Desktops |

**Design mobile-first**: start with phone layout, expand for larger screens.

### Layout Adaptation

| Component | Phone (<768px) | Tablet (768-1024px) | Desktop (1024px+) |
|---|---|---|---|
| **Sidebar** | Hidden, hamburger menu or bottom nav | Collapsed (icons only) | Full sidebar with labels |
| **Data tables** | Card/list view | Horizontal scroll | Full table |
| **Forms** | Single column, full width | Two columns | Two/three columns |
| **Dashboard** | Stacked cards | 2-column grid | 3-4 column grid |
| **Loan detail** | Tabbed sections | Tabbed sections | Side-by-side panels |
| **Dialogs/modals** | Full-screen sheet (bottom) | Centered modal | Centered modal |
| **Actions** | Bottom action bar (sticky) | Top + contextual | Top toolbar |

### Mobile-Specific UI Patterns

**Bottom Navigation (phone)**
```
┌─────────────────────────┐
│                         │
│     Page Content        │
│                         │
├─────────────────────────┤
│ 🏠  📋  ➕  🔔  ☰     │
│Home Loans  New  Alerts  │
└─────────────────────────┘
```
- 5 items max in bottom nav
- Items configurable based on user role:
  - Loan officer: Home, Applications, New Application, Collections, More
  - Manager: Home, Approvals, Reports, Alerts, More

**Touch-Friendly**
- Minimum tap target: 44x44px (Apple HIG)
- Adequate spacing between interactive elements
- Swipe gestures on lists (swipe to call, swipe to view)
- Pull-to-refresh on list pages
- Long-press for context menu (mobile alternative to right-click)

**Phone-Optimized Features**
- Click-to-call on customer phone numbers (`tel:` links)
- Click-to-WhatsApp on customer numbers
- GPS location capture for field collection visits
- Camera access for document scanning / photo upload
- Share button for generated PDFs (system share sheet)

---

## Key Screen Adaptations

### Dashboard (Phone)
```
┌─────────────────────┐
│ Good morning, Ramesh │
│ Branch: Mumbai HO    │
├─────────────────────┤
│ ┌─────┐ ┌─────┐    │
│ │ 234 │ │ ₹12Cr│   │
│ │Active│ │ AUM  │   │
│ └─────┘ └─────┘    │
│ ┌─────┐ ┌─────┐    │
│ │  18 │ │ 4.2%│    │
│ │Over │ │ NPA% │   │
│ │due  │ │      │   │
│ └─────┘ └─────┘    │
├─────────────────────┤
│ Pending Approvals (3)│
│ ┌───────────────────┐│
│ │ Suresh K - ₹2.5L  ││
│ │ Personal Loan      ││
│ │ [Approve] [Reject] ││
│ └───────────────────┘│
│ ...                   │
├─────────────────────┤
│ Today's Collections   │
│ 5 of 12 completed     │
│ [View Route]          │
└─────────────────────┘
```

### Loan List (Phone — Card View)
```
┌─────────────────────┐
│ 🔍 Search loans...   │
│ [Active ▼] [Sort ▼] │
├─────────────────────┤
│ ┌───────────────────┐│
│ │ LA-2026-001234    ││
│ │ Ramesh Kumar      ││
│ │ ₹1,50,000 · 12mo  ││
│ │ EMI: ₹13,245      ││
│ │ ● Active  DPD: 0  ││
│ └───────────────────┘│
│ ┌───────────────────┐│
│ │ LA-2026-001235    ││
│ │ Priya Sharma      ││
│ │ ₹3,00,000 · 24mo  ││
│ │ EMI: ₹14,125      ││
│ │ ● Overdue DPD: 15 ││
│ └───────────────────┘│
└─────────────────────┘
```

### Collection Visit (Phone — Optimized for Field)
```
┌─────────────────────┐
│ ← Collection Visit   │
├─────────────────────┤
│ Ramesh Kumar         │
│ LA-2026-001234       │
│ Overdue: ₹26,490    │
│ DPD: 45              │
│                      │
│ 📞 Call  💬 WhatsApp │
│ 📍 Get Directions    │
├─────────────────────┤
│ Visit Outcome:       │
│ ○ Payment collected  │
│ ○ Promise to pay     │
│ ○ Not available      │
│ ○ Refused            │
│ ○ Dispute            │
│                      │
│ Amount: [₹_________]│
│ Notes:  [__________] │
│                      │
│ 📷 Add Photo         │
│ 📍 Auto-capture GPS  │
│                      │
│ [Save Visit Log]     │
└─────────────────────┘
```

---

## Push Notifications

### Implementation
- Service Worker + Push API (web standard)
- Server sends push via web-push library (VAPID keys)
- User opts in per notification category

### Notification Categories

| Category | Example | Default |
|---|---|---|
| Approvals | "New loan sanction pending your approval" | On |
| Overdue alerts | "3 loans crossed 30 DPD today" | On |
| Task assignments | "New collection task assigned to you" | On |
| Payment received | "₹13,245 received for LA-2026-001234" | Off |
| System alerts | "Backup failed" (admin only) | On |

### User Control
```
Settings > Notifications:
  ☑ Approval requests
  ☑ Overdue alerts
  ☑ Task assignments
  ☐ Payment confirmations
  ☑ System alerts (admin)
```

---

## Performance Budget (Mobile)

| Metric | Target | Why |
|---|---|---|
| First Contentful Paint | < 1.5s | Users on 4G/3G |
| Largest Contentful Paint | < 2.5s | Core Web Vitals |
| Time to Interactive | < 3s | Must be usable quickly |
| Total JS bundle (initial) | < 150KB gzipped | Low-end phones |
| Lighthouse PWA score | 100 | Full PWA compliance |
| Lighthouse Performance | > 90 | Fast on mobile |

### How we hit these:
- Server Components (minimal client JS)
- Dynamic imports for heavy modules (charts, PDF preview)
- Image optimization (Next.js Image, WebP)
- Font subsetting (only load glyphs for active locale)
- Aggressive code splitting per route

---

## Testing (Mobile)

- **Chrome DevTools** device emulation for development
- **Real device testing**: Android (Chrome) + iOS (Safari) — PWA behavior differs
- **Lighthouse CI**: PWA audit on every PR
- **Touch interaction testing**: tap targets, swipe gestures, pull-to-refresh
- **Offline testing**: disable network in DevTools, verify cached shell loads, verify queue works
- **Slow network testing**: throttle to 3G, verify acceptable load times

---

## iOS Limitations (known)

PWAs on iOS have restrictions:
- No push notifications on iOS < 16.4 (supported from 16.4+)
- No Background Sync API (queue syncs on next app open, not in background)
- Storage limited to ~50MB per origin (enough for app shell, not large file caching)
- No badging API
- Must add to home screen manually (no install prompt)

**Mitigation**: The app works fine in Safari as a regular web app. PWA features are progressive enhancements — the core functionality works everywhere.

---

## Consequences

- **Enables**: Field officers use the app on phones without a native app. Branch tablets run it as installed app. Offline collection visits. Push notifications for approvals.
- **Trade-off**: PWA on iOS is limited vs Android. Not a dealbreaker — most NBFC field staff use Android.
- **Trade-off**: Offline mutations need conflict resolution (server-wins strategy keeps it simple).
- **Architecture impact**: Mobile-first responsive design from Phase 1. Service worker + manifest added in Phase 1. Offline queue added in Phase 4 (when collections are built).
- **No app store dependency**: Updates are instant, no review process, no platform fees.
