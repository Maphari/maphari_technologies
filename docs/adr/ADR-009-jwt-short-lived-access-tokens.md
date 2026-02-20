# ADR-009: JWT with Short-Lived Access Tokens

- Status: Accepted
- Date: 2026-02-17

## Context

Gateway-enforced auth needs stateless, scalable request verification with secure session continuation.

## Decision

Use short-lived access JWTs plus refresh-token rotation, with gateway claim validation and role/tenant scoping.

## Consequences

- Positive: scalable auth checks and explicit token lifecycle controls.
- Negative: refresh complexity and stronger key-management requirements.
