# Specs

This folder contains all specifications and documentation for the NBFC application.

## Structure

```
specs/
  architecture.md        — System architecture overview
  decisions/             — Architecture Decision Records (ADRs)
  features/              — Feature specifications (one per feature)
  api/                   — API endpoint specifications
```

## How to Use

- **Before building a feature**: write or update its spec in `features/`.
- **Before changing architecture**: write or update an ADR in `decisions/`.
- **After adding/changing an API**: update the relevant doc in `api/`.
- **Every change** that touches specs must also update `CHANGELOG.md`.

## Decision Record Template

Use this template for new files in `decisions/`:

```markdown
# ADR-NNN: Title

**Status**: proposed | accepted | deprecated | superseded by ADR-NNN
**Date**: YYYY-MM-DD

## Context

What is the issue or problem that motivated this decision?

## Decision

What is the change that we're proposing or have agreed to?

## Consequences

What are the trade-offs? What does this enable? What does it prevent?
```

## Feature Spec Template

Use this template for new files in `features/`:

```markdown
# Feature: Title

**Status**: draft | approved | in-progress | complete
**Date**: YYYY-MM-DD

## Summary

One-paragraph description of what this feature does and why.

## User Stories

- As a [role], I want [action] so that [benefit].

## Requirements

- [ ] Requirement 1
- [ ] Requirement 2

## Data Model

Relevant schema changes or new models.

## API Endpoints

Endpoints this feature introduces or modifies.

## UI / Screens

Key screens or components.

## Security Considerations

Auth, authorization, PII, audit requirements.

## Open Questions

Unresolved decisions or unknowns.
```
