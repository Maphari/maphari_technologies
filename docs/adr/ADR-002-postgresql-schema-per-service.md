# ADR-002: PostgreSQL Schema-Per-Service

- Status: Accepted
- Date: 2026-02-17

## Context

The platform has relational workflows (clients/projects/leads, conversations/messages, invoices/payments) and requires transactional consistency.

## Decision

Use PostgreSQL as the primary datastore with schema-per-service isolation (`auth_schema`, `core_schema`, `chat_schema`, `files_schema`, `billing_schema`, `automation_schema`).

## Consequences

- Positive: ACID guarantees with clear data ownership boundaries.
- Negative: requires strict discipline to avoid cross-schema coupling in service logic.
