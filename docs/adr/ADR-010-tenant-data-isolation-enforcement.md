# ADR-010: Tenant Data Isolation Enforcement

- Status: Accepted
- Date: 2026-02-17

## Context

Client data isolation is a hard security boundary across all business and collaboration domains.

## Decision

Enforce tenant scope at gateway and service levels. CLIENT role operations must be constrained to scoped `clientId`; nested resources require ownership checks.

## Consequences

- Positive: consistent multi-tenant safety model.
- Negative: additional validation/query constraints on many paths.
