# ADR-004: NestJS for Backend Services

- Status: Accepted
- Date: 2026-02-17

## Context

Gateway requirements include RBAC guards, interceptors, structured module layout, and maintainable API orchestration.

## Decision

Use NestJS for gateway/BFF and service components where modular framework features are needed.

## Consequences

- Positive: consistent backend patterns for guards/interceptors/modules.
- Negative: additional framework abstraction compared to minimal HTTP stacks.
