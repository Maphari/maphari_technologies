# ADR-011: Versioned API Strategy

- Status: Accepted
- Date: 2026-02-17

## Context

Contracts evolve over time and need controlled change without breaking existing consumers.

## Decision

Expose versioned gateway routes under `/api/v1/*`; breaking changes require a new version path with deprecation window governance.

## Consequences

- Positive: predictable API evolution and backward compatibility planning.
- Negative: dual-version maintenance overhead during migrations.
