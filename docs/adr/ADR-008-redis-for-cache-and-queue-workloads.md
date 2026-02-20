# ADR-008: Redis for Cache and Queue Workloads

- Status: Accepted
- Date: 2026-02-17

## Context

The platform needs low-latency caching, realtime fan-out support, and lightweight queue/backlog coordination.

## Decision

Use Redis for service cache keys, Socket.IO scaling adapters, and temporary workflow buffering semantics.

## Consequences

- Positive: reduced latency and simpler shared ephemeral state.
- Negative: introduces additional infra dependency and invalidation strategy complexity.
