# ADR-002: Authentication

**Status**: accepted
**Date**: 2026-10-24

## Context

The app needs user authentication. Clients are NBFCs running their own instances — some on isolated networks without internet access. We need a solution that works offline and can be extended to support enterprise SSO later.

## Decision

**Phase 1 (now): Self-managed authentication**
- Email/password stored in the app's own database.
- Passwords hashed with bcrypt (or argon2 if available).
- Session-based auth with secure HTTP-only cookies.
- Role-based access control (RBAC): admin, manager, officer, viewer.
- Password reset via email (when SMTP is configured) or admin reset.

**Phase 2 (future): SSO integration**
- OAuth 2.0 / OpenID Connect support (Google, Microsoft Entra ID).
- LDAP/Active Directory integration for enterprise clients.
- Auth adapter interface so Phase 2 doesn't require rewriting Phase 1.

## Consequences

- **Enables**: Works fully offline. No external auth dependency. Simple setup for small NBFCs.
- **Trade-off**: We own the auth stack — must handle password hashing, session management, and CSRF correctly.
- **Trade-off**: No MFA in Phase 1 (should be added before production use with sensitive data).
- **Prevents**: Nothing. The adapter pattern allows SSO to be added without breaking self-managed auth.
