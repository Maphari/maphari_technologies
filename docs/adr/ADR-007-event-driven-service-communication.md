# ADR-007: Event-Driven Service Communication

- Status: Accepted
- Date: 2026-02-17

## Context

Cross-domain workflows (billing lifecycle, automation reactions, collaboration flows) must avoid tight synchronous coupling.

## Decision

Use domain events over message bus topics for asynchronous inter-service communication.

## Consequences

- Positive: loose coupling and better workflow extensibility.
- Negative: eventual consistency and additional observability requirements.
