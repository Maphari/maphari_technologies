# Web App (`@maphari/web`)

Next.js frontend for marketing/portal/admin surfaces.

## Current Scope

- Public-first marketing routes:
  - `/` (home)
  - `/services`
  - `/pricing`
  - `/case-studies`
  - `/about`
  - `/process`
  - `/contact`
  - `/resources`
- Dedicated login route on `/login`.
- Middleware-protected client workspace route (`/portal`) for `CLIENT`/`STAFF`/`ADMIN`.
- Middleware-protected admin workspace route (`/admin`) for `STAFF`/`ADMIN`.
- Role-aware redirects:
  - logged-in `CLIENT` -> `/portal`
  - logged-in `STAFF`/`ADMIN` -> `/admin`
- Auth-aware login flow (`/api/v1/auth/login` via gateway) and logout.
- HTTP-only refresh-token cookie lifecycle managed by gateway auth routes.
- Access token kept in runtime memory and rotated through `/api/v1/auth/refresh`.
- Auto-refresh retry when protected API calls return unauthorized.
- Route-guard test coverage for proxy redirect behavior (`pnpm --filter @maphari/web test`).
- E2E auth-routing smoke tests (`pnpm --filter @maphari/web test:e2e`).
- Workspace snapshot consuming:
  - `GET /api/v1/clients`
  - `GET /api/v1/projects`
  - `GET /api/v1/leads`
- Admin dashboard modules:
  - KPI strip from clients/projects/leads/invoices/payments
  - Leads pipeline board with persisted stage transitions (`PATCH /api/v1/leads/:leadId/status`)
  - Sortable clients/projects tables and audit log feed

## Environment

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_GATEWAY_BASE_URL="http://localhost:4000/api/v1"
```

## Run

```bash
pnpm --filter @maphari/web dev
```
