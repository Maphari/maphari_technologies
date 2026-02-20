# ADR-003: Prisma as ORM

- Status: Accepted
- Date: 2026-02-17

## Context

The team needs strong TypeScript typing, safe migrations, and rapid iteration for service-specific schemas.

## Decision

Use Prisma per service with independent `schema.prisma` and migration history.

## Consequences

- Positive: type-safe data access and fast developer feedback.
- Negative: service boundaries must be enforced; no cross-service Prisma access.
