# ADR-025: Early Warning System (EWS)

**Status**: accepted
**Date**: 2026-10-24
**Toggleable**: Yes — Settings > Modules > Early Warning System

## Context

RBI's Credit Risk Management Directions 2025 require NBFCs to maintain continuous portfolio monitoring — not just react when loans become overdue. An Early Warning System detects borrower stress BEFORE default, enabling proactive intervention. Studies show recovery probability is 2.3x higher when accounts are contacted at pre-delinquency stage vs 30 DPD.

---

## Signal Categories

### 1. Repayment Behavior Signals
| Signal | Trigger | Severity |
|---|---|---|
| First-time delay | EMI paid late for the first time | LOW |
| Partial payment | EMI paid but less than full amount | MEDIUM |
| NACH/mandate bounce | Auto-debit failed | MEDIUM |
| Multiple bounces | 2+ bounces in 3 months | HIGH |
| SMA-0 entry | 1-30 days past due | MEDIUM |
| SMA-1 entry | 31-60 days past due | HIGH |
| SMA-2 entry | 61-90 days past due | CRITICAL |

### 2. Credit Bureau Signals (if bureau monitoring enabled)
| Signal | Trigger | Severity |
|---|---|---|
| Score drop | Credit score drops >50 points | MEDIUM |
| New loan detected | Borrower takes loan from another lender | LOW |
| Other account overdue | Borrower overdue at another lender | HIGH |
| High credit utilization | Total exposure > threshold | MEDIUM |
| Enquiry spike | Multiple credit enquiries in short period | MEDIUM |

### 3. Account Aggregator Signals (if AA monitoring enabled)
| Signal | Trigger | Severity |
|---|---|---|
| Balance drop | Average balance dropped >50% month-on-month | HIGH |
| Income disruption | Salary/income credit stopped | CRITICAL |
| High outflows | Unusual large withdrawals | MEDIUM |
| Bounce in bank | Cheque/mandate bounce detected in statement | HIGH |

### 4. Behavioral Signals
| Signal | Trigger | Severity |
|---|---|---|
| Contact unreachable | Customer not reachable on 3+ attempts | MEDIUM |
| Address change | Customer changed address without updating NBFC | LOW |
| Business closure | For MSME loans — GST filings stopped | CRITICAL |

---

## Data Model

```
EwsRule:
  id, companyId
  name                      — "First-time EMI delay"
  category                  — REPAYMENT | BUREAU | ACCOUNT | BEHAVIORAL
  triggerCondition          — JSON (configurable rule definition)
  severity                  — LOW | MEDIUM | HIGH | CRITICAL
  autoAction                — NOTIFY_OFFICER | CREATE_TASK | FLAG_ACCOUNT | NONE
  isActive                  — boolean
  productIds                — which loan products this rule applies to (null = all)

EwsAlert:
  id, loanAccountId, customerId
  ruleId
  severity
  signalType                — description of what triggered
  signalData                — JSON (details: score before/after, bounce reason, etc.)
  status                    — NEW | ACKNOWLEDGED | INVESTIGATING | RESOLVED | FALSE_POSITIVE
  acknowledgedBy, acknowledgedAt
  resolvedBy, resolvedAt
  resolutionNotes
  autoActionTaken           — what auto-action was triggered
  taskId                    — if a collection/follow-up task was auto-created

EwsScore:
  id, loanAccountId
  calculatedAt
  score                     — composite stress score (0-100, higher = more stress)
  components                — JSON {repaymentScore, bureauScore, cashFlowScore, behavioralScore}
  riskBucket                — GREEN | YELLOW | ORANGE | RED
  previousScore
  trend                     — IMPROVING | STABLE | DETERIORATING
```

---

## Composite Stress Score

Each loan gets a stress score (0-100) calculated from weighted signals:

```
Stress Score = (Repayment signals × 40%)
             + (Bureau signals × 25%)
             + (Cash flow signals × 25%)
             + (Behavioral signals × 10%)

Buckets:
  0-25:  GREEN  — healthy, no action
  26-50: YELLOW — watch list, monthly review
  51-75: ORANGE — pre-delinquency, weekly review, proactive contact
  76-100: RED   — high stress, immediate action, escalate to manager
```

Weights configurable per NBFC.

---

## EWS Dashboard

```
┌────────────────────────────────────────┐
│ Early Warning Dashboard                │
├──────┬──────┬──────┬──────┬───────────┤
│ 🟢   │ 🟡   │ 🟠   │ 🔴   │ Total     │
│ 8,432│ 1,204│  356 │   89 │ 10,081    │
│ 84%  │ 12%  │ 3.5% │ 0.9% │ Active    │
├──────┴──────┴──────┴──────┴───────────┤
│ New Alerts Today: 23                   │
│ ┌─────────────────────────────────────┐│
│ │ 🔴 Suresh K — Income stopped       ││
│ │    LA-2026-001234 · ₹3L outstanding ││
│ │    [View] [Assign] [Acknowledge]    ││
│ ├─────────────────────────────────────┤│
│ │ 🟠 Priya S — Score dropped 72 pts  ││
│ │    LA-2026-001567 · ₹1.5L outst.   ││
│ │    [View] [Assign] [Acknowledge]    ││
│ └─────────────────────────────────────┘│
│ Trend: Deteriorating accounts ↑ 3%     │
│        this month vs last month        │
└────────────────────────────────────────┘
```

---

## Processing

### Daily EWS Job (scheduled)
1. For each active loan:
   - Check repayment signals (DPD, bounces, partial payments)
   - Check recent bureau data (if monitoring pull available)
   - Check AA data (if periodic consent exists)
2. Calculate/update stress score
3. Compare against rules → generate alerts for triggered rules
4. Execute auto-actions (notify officer, create task, flag account)
5. Update EWS dashboard

### Event-Driven Triggers (real-time)
- NACH bounce received → immediate alert
- Payment received on stressed account → update score
- Bureau monitoring alert received → immediate alert

---

## Configuration

```
Settings > Early Warning System:
  - Enabled: [yes/no]
  - Rules: [add/edit/disable individual rules]
  - Score weights: [repayment %, bureau %, cash flow %, behavioral %]
  - Bucket thresholds: [green/yellow/orange/red boundaries]
  - Auto-actions per severity:
    - LOW: log only
    - MEDIUM: notify assigned officer
    - HIGH: create follow-up task + notify officer
    - CRITICAL: create urgent task + notify officer + notify manager
  - Bureau monitoring frequency: [off / quarterly / monthly]
  - AA monitoring: [off / with consent]
  - Daily processing time: [HH:MM]
```

---

## Consequences

- **Enables**: Proactive stress detection, lower NPA rates, better recovery, RBI compliance on continuous monitoring
- **Trade-off**: Bureau monitoring pulls have per-pull cost
- **Trade-off**: AA monitoring requires ongoing borrower consent
- **Trade-off**: False positives need human review (not everything is real stress)
- **Toggleable**: Small NBFCs can start with repayment signals only (free, no external dependency). Add bureau/AA monitoring later.
