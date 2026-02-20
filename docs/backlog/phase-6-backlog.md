# Phase 6 Backlog: Product Completion + UI Standardization

## Objective

Close the remaining v12 gaps with production-ready implementation detail, while enforcing the visual and UX standards defined in `docs/maphari_marketing_design_prompt.html`.

## UI Standards Baseline (Applies to all frontend tickets)

- Color tokens must use:
  - `#0B1220` (Deep Tech Navy)
  - `#12D6C5` (Electric Teal)
  - `#F6C445` (Sun Gold)
  - `#F7F8FA` (Off White)
  - `#1B1F2A` (Charcoal)
  - `#E6E8EE` (Soft Grey)
- Typography must follow the design prompt roles:
  - `Syne` for hero/headline emphasis
  - `DM Sans` for body text
  - `JetBrains Mono` for labels/system text
- Component and motion rules must be enforced:
  - 12px button/input radius, 16px feature-card radius
  - Teal primary CTA hover lift and glow
  - Section reveal + stagger motion behavior
  - Mobile-first responsiveness at 375/768/1024/1280 breakpoints
- Frontend API usage must remain gateway-only (`/api/v1/*`), never direct service calls.

## Ticket List

### P6-001: Billing Service Foundation

- Status:
  - Completed on 2026-02-17.
- Scope:
  - Create `services/billing` with Fastify + Prisma + tenant scope helpers.
  - Add billing schema and migrations for invoices/payments.
  - Add health/metrics endpoints and baseline tests.
- Dependencies:
  - Existing platform package (`@maphari/platform`) and contracts package.
- Acceptance criteria:
  - `services/billing` boots locally and passes `typecheck`, `test`, `build`.
  - Prisma migration creates billing tables with indexes and status enums.
  - `GET /health` and `GET /metrics` return valid responses.

### P6-002: Billing API + Gateway Integration

- Status:
  - Completed on 2026-02-17.
- Scope:
  - Add billing routes in service (`GET/POST invoices`, `GET/POST payments` as needed).
  - Add DTO/Zod validation in contracts and gateway write routes.
  - Add gateway proxy controllers for billing endpoints.
- Dependencies:
  - P6-001.
- Acceptance criteria:
  - Gateway exposes billing routes under `/api/v1/*`.
  - Create payloads are validated before proxy.
  - Gateway integration tests verify tenant scope forwarding and validation behavior.

### P6-003: Billing Events + Automation Workflows

- Status:
  - Completed on 2026-02-17.
- Scope:
  - Emit billing domain events (`invoice.issued`, `invoice.paid`, `invoice.overdue`).
  - Add automation subscribers and handlers for billing workflows.
- Dependencies:
  - P6-001.
- Acceptance criteria:
  - Billing events are published with `eventId`, `occurredAt`, `requestId`, `clientId`.
  - Automation service receives and logs billing events.
  - Event flows have integration coverage for at least one success path per event type.

### P6-004: Marketing UI Rebuild to Design Prompt

- Status:
  - Completed on 2026-02-17.
- Scope:
  - Redesign `apps/web` marketing routes to match `docs/maphari_marketing_design_prompt.html`.
  - Implement section structure, tokens, typography, CTA variants, interaction effects.
- Dependencies:
  - None.
- Acceptance criteria:
  - Visual system matches prompt tokens/components/motion rules.
  - Hero, features, testimonials, and contact sections follow defined structure and copy tone.
  - Lighthouse accessibility score >= 90 on marketing home in local production build.

### P6-005: Client Portal UI Completion (Chat + Files + Billing Views)

- Status:
  - Completed on 2026-02-17.
- Scope:
  - Add portal screens for conversations/messages, file library, invoices/payments.
  - Add scoped data fetching and error states via gateway APIs.
- Dependencies:
  - P6-002, P6-006, P6-007.
- Acceptance criteria:
  - CLIENT role can view own chat/files/invoices only.
  - All portal pages follow prompt layout language (sidebar, cards, status badges, spacing system).
  - UI handles `ApiResponse` success/error consistently.

### P6-006: Real-time Chat Delivery (Socket.IO + Redis Adapter)

- Status:
  - Completed on 2026-02-17.
- Scope:
  - Implement WebSocket chat channel with tenant-safe room strategy.
  - Add Redis adapter for multi-instance scaling.
- Dependencies:
  - P6-005 (UI consumption), existing Redis infrastructure.
- Acceptance criteria:
  - Message sent by one client session appears in another active session in same tenant.
  - Cross-tenant message leakage is blocked by scope enforcement.
  - Metrics capture active socket connections and message latency.

### P6-007: File Upload Pipeline (Presigned URL Flow)

- Status:
  - Completed on 2026-02-17.
- Scope:
  - Add upload URL issuance endpoint through gateway path.
  - Implement direct-to-object-storage upload + upload confirmation API flow.
  - Update portal files UI to use presigned upload flow.
- Dependencies:
  - Object storage configuration.
- Acceptance criteria:
  - Upload sequence works: issue URL -> upload -> confirm metadata.
  - Files metadata persists and appears in scoped file list.
  - Upload failures return structured errors and UI rollback state.

### P6-008: Admin Dashboard Product Completion

- Status:
  - Completed on 2026-02-17.
- Scope:
  - Build admin data-dense views:
    - KPI row
    - Leads pipeline board
    - Sortable clients/projects tables
    - Audit log table
  - Enforce ADMIN/STAFF role-based visibility.
- Dependencies:
  - Existing core/auth APIs, P6-002 for billing modules.
- Acceptance criteria:
  - Admin views render real gateway data (no placeholders).
  - Role badges and status colors align with design prompt usage.
  - Leads board supports status transitions with persisted updates.

### P6-009: Security Hardening Set

- Status:
  - Completed on 2026-02-17.
- Scope:
  - Gateway and service rate limiting policies.
  - Strict CORS configuration by environment.
  - Webhook signature verification utilities (for external integrations).
  - Secret-loading strategy for runtime (vault-compatible abstraction).
- Dependencies:
  - None.
- Acceptance criteria:
  - Rate limits configurable and tested for protected/public paths.
  - CORS defaults deny unknown origins in non-local environments.
  - Signature verification has positive and tamper-path tests.

### P6-010: Observability Expansion (SLO Metrics + Alerts)

- Status:
  - Completed on 2026-02-17.
- Scope:
  - Extend metrics coverage for:
    - DB query latency
    - Queue depth / event backlog
    - WebSocket connection count
  - Add alert thresholds + runbook entries for new signals.
- Dependencies:
  - P6-006, P6-007, P6-003.
- Acceptance criteria:
  - New metrics exposed in `/metrics` of relevant services.
  - Alert rules checked by CI validation and documented in runbooks.
  - Incident runbook references alert-specific triage actions.

### P6-011: ADR Refactor into Atomic Decision Files

- Status:
  - Completed on 2026-02-17.
- Scope:
  - Replace monolithic generated ADR markdown with discrete ADR files (`ADR-001..ADR-0xx`).
  - Add an ADR index document.
- Dependencies:
  - None.
- Acceptance criteria:
  - Each major decision has one standalone ADR file with context/decision/consequences.
  - `docs/adr/README.md` indexes all ADRs and statuses.
  - No generated placeholder text remains as primary ADR source.

### P6-012: Plan and Docs Synchronization

- Status:
  - Completed on 2026-02-17.
- Scope:
  - Normalize backlog status wording (`in progress` vs completed phases).
  - Align architecture docs and runbooks with implemented endpoints and flows.
- Dependencies:
  - Completion of P6-001..P6-011.
- Acceptance criteria:
  - `docs/backlog/implementation-plan.md` reflects actual completion state.
  - `docs/architecture.md` and service READMEs reflect live route/service inventory.
  - Local bootstrap doc includes all operational services and setup steps.

## Suggested Execution Order

1. `P6-001`, `P6-002`, `P6-003`
2. `P6-006`, `P6-007`
3. `P6-004`, `P6-005`, `P6-008`
4. `P6-009`, `P6-010`
5. `P6-011`, `P6-012`

## Phase Exit Criteria

- All Phase 6 tickets satisfy acceptance criteria and have passing CI.
- Gateway, services, and web pass `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- UI implementation demonstrably follows `docs/maphari_marketing_design_prompt.html`.
