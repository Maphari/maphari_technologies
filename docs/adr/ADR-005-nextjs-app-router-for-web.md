# ADR-005: Next.js App Router for Web

- Status: Accepted
- Date: 2026-02-17

## Context

The web surface includes marketing, client portal, and admin dashboard with SEO, SSR, and fast iteration requirements.

## Decision

Use Next.js (App Router) for the frontend and route all API access through gateway `/api/v1/*` contracts.

## Consequences

- Positive: strong rendering flexibility and SEO support.
- Negative: dependency on framework conventions and build/runtime constraints.
