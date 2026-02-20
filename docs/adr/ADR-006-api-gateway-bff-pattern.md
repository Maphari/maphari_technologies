# ADR-006: API Gateway BFF Pattern

- Status: Accepted
- Date: 2026-02-17

## Context

Direct frontend access to many services increases complexity and weakens centralized auth/RBAC/policy enforcement.

## Decision

Use a gateway/BFF layer as the only frontend API surface for routing, policy enforcement, validation, and response normalization.

## Consequences

- Positive: centralized security, versioning, and contract control.
- Negative: gateway becomes a critical availability dependency.
