# ADR-012: Monorepo Structure

- Status: Accepted
- Date: 2026-02-17

## Context

The platform shares contracts, infra scripts, and cross-service tooling that benefit from unified versioning.

## Decision

Use a monorepo structure with `apps/`, `services/`, `packages/`, `infrastructure/`, and `docs/`.

## Consequences

- Positive: coherent refactors and centralized CI workflows.
- Negative: larger repository blast radius for broad changes.
