# Web Entry + Auth Routing Spec

## Goal

Set the website to a public-first conversion flow where marketing pages are always the default entry, while portal and admin surfaces are protected and role-gated after login.

## Primary Product Decision

- Default first page: `/` (marketing homepage).
- Protected product areas:
  - `/portal` and `/portal/*` for `CLIENT`, `STAFF`, `ADMIN`.
  - `/admin` and `/admin/*` for `STAFF`, `ADMIN`.
- Login page:
  - `/login` for explicit authentication.

## Route Architecture

### Public Routes (No auth required)

- `/`
- `/services`
- `/pricing`
- `/case-studies`
- `/about`
- `/process`
- `/contact`
- `/resources` (optional)
- `/login`

### Protected Routes (Auth required)

- `/portal`
- `/portal/*`
- `/admin`
- `/admin/*`

## Middleware / Guard Behavior

## 1. Anonymous user on protected route

- Condition: no valid session.
- Behavior: redirect to `/login?next=<encoded-original-path>`.

## 2. Logged-in user on `/login`

- Condition: valid session exists.
- Behavior:
  - `CLIENT` -> redirect to `/portal`
  - `STAFF` or `ADMIN` -> redirect to `/admin`

## 3. Logged-in user with wrong role

- `CLIENT` requesting `/admin/*`:
  - redirect to `/portal` with non-blocking notice.
- `STAFF` or `ADMIN` requesting `/portal/*`:
  - allow.

## 4. Preserve deep links

- If `next` query exists and is valid protected path, use it after login.
- If `next` is missing or invalid, use role home redirect.

## Session and Token Lifecycle

## Session model

- Keep refresh token in secure HTTP-only cookie (recommended target state).
- Use short-lived access token for API calls to gateway (`/api/v1/*`).
- Maintain the existing refresh-on-401 strategy in API clients.

## Refresh behavior

- On access token expiry:
  - attempt `POST /api/v1/auth/refresh`
  - retry failed protected request once with new token
- If refresh fails:
  - clear session
  - redirect to `/login?next=<current-path>`

## Security rules

- Never call domain services directly from web app.
- All app API traffic remains gateway-only.
- Reject open redirects: `next` must be same-origin and match allowed protected route prefixes.

## UX and Conversion Flow

## Header behavior

- Anonymous header:
  - `Services`, `Pricing`, `Case Studies`, `Process`, `Contact`
  - CTA 1: `Book Consultation`
  - CTA 2: `Client Login`
- Logged-in header:
  - Replace `Client Login` with `Open Portal` or `Dashboard`.
  - Add account menu with `Sign out`.

## CTA placement strategy

- Primary CTA appears:
  - Hero section
  - Mid-page after solution/services
  - Final page footer section
- Secondary CTA appears:
  - Header
  - Final CTA block

Recommended button copy:

- Primary: `Book a Strategy Call`
- Secondary: `View Service Packages`
- Login CTA: `Client Login`

## Implementation Plan (No code changes in this document)

1. Add route groups in `apps/web/src/app`:
   - `(public)` for marketing pages.
   - `(app)` for portal/admin pages.
2. Add `apps/web/src/proxy.ts` for auth + role routing.
3. Add dedicated `/login` page and move inline login panels into reusable auth component.
4. Update nav components to switch menu/CTA based on auth state.
5. Normalize post-login redirect logic with validated `next` param.
6. Use gateway-managed HTTP-only refresh-token cookies and runtime-only access token state in the web app.

## Acceptance Criteria

- Opening the site at `/` always lands on marketing homepage for anonymous users.
- Anonymous users cannot access `/portal/*` or `/admin/*` directly.
- Logged-in `CLIENT` users land on `/portal`; `STAFF`/`ADMIN` users land on `/admin`.
- `next` deep-link redirects work only for allowed internal paths.
- Header and CTAs render correctly for anonymous vs logged-in states.
- All protected data calls still use gateway routes (`/api/v1/*`) only.

## Test Coverage Required

- Middleware route tests:
  - anonymous redirect from `/portal` and `/admin`.
  - role redirect on `/login`.
  - invalid `next` is ignored.
- E2E smoke:
  - anonymous -> `/` -> CTA -> `/contact` flow.
  - login as `CLIENT` -> `/portal`.
  - login as `ADMIN` -> `/admin`.
