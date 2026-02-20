# Maphari v12 Implementation Plan

## Phase 1: Foundation (completed on 2026-02-17)

- Set up monorepo workspaces (`apps`, `services`, `packages`, `infra`)
- Create shared contracts package for API envelope and RBAC types
- Scaffold `apps/web` with Next.js + TypeScript
- Scaffold `apps/gateway` (NestJS) with `/api/v1` routing
- Scaffold `services/auth` and `services/core` (Fastify)

## Phase 2: Data and Auth (completed on 2026-02-17)

- [x] Add Prisma to `services/auth` and `services/core`
- [x] Define `auth_schema` and `core_schema` migrations
- [x] Implement login flow with refresh token persistence
- [x] Add gateway RBAC and tenant-scoping header checks
- [x] Replace placeholder token issuance with signed JWT and refresh rotation
- [x] Add shared Zod DTO schemas and validation in auth/core/gateway write endpoints

## Phase 3: Product Surface

- [x] Implement core entities (clients, projects, leads)
- [x] Wire web app data access through gateway only
- [x] Build auth-aware web flow (login, token storage, refresh retry, logout)
- [x] Build portal/admin routes in Next.js
- [x] Add integration tests for gateway/core tenant-scope behavior

## Phase 4: Platform Hardening

- [x] Add Redis and message bus integration
- [x] Add automation service subscriptions
- [x] Add observability (structured logs, metrics, alerts)
- [x] Add CI/CD and runbooks in `infra`

## Phase 5: Collaboration Surface (completed on 2026-02-17)

- [x] Scaffold `services/chat` with tenant-safe conversations/messages APIs
- [x] Scaffold `services/files` with tenant-safe file metadata APIs
- [x] Add Prisma schemas/migrations for chat and files domains
- [x] Extend gateway with chat/files proxy routes and payload validation
- [x] Extend automation subscriptions for chat/files domain events
- [x] Add tenant-scope integration tests for chat and files services
- [x] Add gateway integration tests for chat/files proxy behavior
- [x] Publish OpenAPI contract docs for chat/files gateway endpoints
- [x] Define chat/files alert thresholds with runbook guidance

## Phase 6: Product Completion + UI Standardization (completed on 2026-02-17)

- [x] P6-001 Billing service foundation (`services/billing`) delivered
- [x] P6-002 Billing API + gateway integration delivered
- [x] P6-003 Billing events + automation workflows delivered
- [x] P6-004 Marketing UI rebuild to design prompt delivered
- [x] P6-005 Client portal UI completion (chat/files/billing views) delivered
- [x] P6-006 Real-time chat delivery (Socket.IO + Redis adapter) delivered
- [x] P6-007 File upload pipeline (presigned URL flow) delivered
- [x] P6-008 Admin dashboard product completion delivered
- [x] P6-009 Security hardening set delivered
- [x] P6-010 Observability expansion delivered
- [x] P6-011 ADR refactor into atomic decision files delivered
- [x] P6-012 Plan/docs synchronization delivered
- [x] Execute ticketed backlog in `docs/backlog/phase-6-backlog.md`
- [x] Enforce UI standards from `docs/maphari_marketing_design_prompt.html` across marketing/portal/admin
- [x] Deliver billing service + gateway + automation flows
- [x] Deliver real-time chat and S3 presigned uploads end-to-end
- [x] Complete security hardening and extended observability signals

## Phase 7: Future Extension Services (completed on 2026-02-17)

- [x] P7-001 AI service foundation delivered
- [x] P7-002 Analytics service foundation delivered
- [x] P7-003 Notification service foundation delivered
- [x] P7-004 Public API service delivered
- [x] P7-005 Cross-service hardening delivered
