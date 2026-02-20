# ADR-001: Microservices-First Architecture

- Status: Accepted
- Date: 2026-02-17

## Context

The product requires independent scaling across auth, core CRM, realtime chat, files, billing, and automation workflows while preserving clean domain boundaries.

## Decision

Adopt a microservices-first runtime split with a gateway/BFF in front of domain services. Each service is independently deployable and owns its persistence boundary.

## Consequences

- Positive: better fault isolation, independent scaling, and clearer ownership.
- Negative: higher operational complexity and stronger dependency on platform tooling.
