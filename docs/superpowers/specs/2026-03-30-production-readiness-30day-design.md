# Production Readiness — 30-Day P0 Hardening Design

**Date:** 2026-03-30
**Scope:** First 30 days of the production readiness audit (audit doc: `docs/production-readiness-audit-2026-03-30.md`)
**Audit items addressed:** P0-1, P0-2, P0-3, P0-4 (partial), P0-5, plus OTP log removal and stylelint enforcement
**Execution strategy:** Parallel subagent dispatch across 4 independent workstreams

---

## Execution Strategy

Items are grouped into 4 parallel workstreams. Groups 1, 3, and 4 are fully independent and run concurrently. Group 2 has a security-critical dependency on Group 1: Group 1 removes the `JWT_ACCESS_SECRET` fallback from the auth service. If the auth service were deployed before Group 1 completes, the gateway's auth-protected public-API routes would silently use the insecure fallback secret during Group 2's deploy window. Group 2 must not be deployed until Group 1 is confirmed deployed and all secrets are set.

| Group | Items | Dependencies |
|-------|-------|--------------|
| 1 | Secret fallbacks + startup validation + OTP log removal | None |
| 2 | Public API persistence + webhook signature hardening | Group 1 deployed (security-critical) |
| 3 | CSP nonce hardening | None |
| 4 | Stylelint setup + .gitignore fixes | None |

---

## Group 1: Secret Fallbacks + Startup Validation + OTP Log Removal

### Audit items closed
- P0-1: Default/fallback secrets in security-sensitive paths
- Auth service OTP/PIN sensitive log leak

### Files touched
- `services/auth/src/lib/config.ts`
- `services/auth/src/index.ts` (or `main.ts`) — startup validation call site
- `services/files/src/index.ts` — startup validation call site (no existing config module)
- `services/files/src/routes/upload-flow.ts` — remove fallbacks
- `services/notifications/src/index.ts` — startup validation call site
- `services/notifications/src/routes/notifications.ts` — remove fallback
- `apps/gateway/src/main.ts` — startup validation for gateway secrets
- `services/auth/src/routes/auth.ts` (lines 242, 472)

### Design

**Startup validation pattern:**

Each affected service gets a `validateRequiredEnv()` call at its **entry point**, before the server starts listening. For the gateway (NestJS), this means calling it in `apps/gateway/src/main.ts` before `await createGatewayApp()`. For all Fastify services (auth, files, notifications, public-api), this means calling it at the top of `index.ts` before `createXxxApp()` is invoked. This ensures failure is deterministic at startup regardless of import order.

```ts
function validateRequiredEnv(required: string[]): void {
  const missing = required.filter((key) => {
    const val = process.env[key];
    return val === undefined || val === null || val.trim() === "";
  });
  if (missing.length > 0) {
    throw new Error(
      `[startup] Missing required environment variables: ${missing.join(", ")}. ` +
      `Service cannot start.`
    );
  }
}
```

Missing = `undefined`, `null`, or `""` after `.trim()`. All missing vars are collected before throwing — no fail-fast on first. The function is defined inline in each service's entry point (`main.ts` or `index.ts`); no shared-package coupling.

**NestJS gateway — `apps/gateway/src/main.ts`:**
Call `validateRequiredEnv(["JWT_ACCESS_SECRET"])` at the top of `apps/gateway/src/main.ts`, before `await createGatewayApp()`. The gateway does not have a `bootstrap()` wrapper — `createGatewayApp()` is the factory function that calls `NestFactory.create` internally. Do not place validation in `rbac.guard.ts` (injectable guards have no safe module-init hook for startup-blocking throws).

**Auth service — `services/auth/src/index.ts`:**
Call `validateRequiredEnv(["JWT_ACCESS_SECRET", "REDIS_URL"])` at the top of the entry point, before `createAuthApp()`. `REDIS_URL` is required because the JTI blacklist is a security control — a missing Redis connection silently disables revoked-token blocking.

Additional auth env vars in scope: `ADMIN_LOGIN_PASSWORD` and `STAFF_LOGIN_PASSWORD` currently fall back to `""`. If either is empty, the auth route returns 503 rather than silently allowing auth. However, these are security credentials and must be present in production. Add both to `validateRequiredEnv`. Note: `authBootstrapLogs` in the config has a default of `false` which is safe and intentional — do not add it to required vars.

**Files service — `services/files/src/index.ts`:**
No config module exists for this service. Call `validateRequiredEnv(["UPLOAD_TOKEN_SECRET"])` at the top of `index.ts`, before `createFilesApp()`. Do not add inline validation in `upload-flow.ts` — route modules are not a reliable validation boundary.

**Notifications service — `services/notifications/src/index.ts`:**
Call `validateRequiredEnv(["NOTIFICATION_CALLBACK_SECRET"])` at the top of `index.ts`, before `createNotificationsApp()`.

**Secret fallbacks to remove:**

| File | Var | Current fallback | Action |
|------|-----|-----------------|--------|
| `services/auth/src/lib/config.ts` | `JWT_ACCESS_SECRET` | `"dev-access-secret"` | Remove fallback; validation now in `index.ts` |
| `services/files/src/routes/upload-flow.ts` (×3 occurrences) | `UPLOAD_TOKEN_SECRET` | `"maphari-upload-secret"` | Remove all 3; validation in `index.ts` |
| `services/notifications/src/routes/notifications.ts` | `NOTIFICATION_CALLBACK_SECRET` | `"dev-notification-callback-secret"` | Remove fallback; validation in `index.ts` |
| `apps/gateway/src/auth/rbac.guard.ts` | `JWT_ACCESS_SECRET` | `"dev-access-secret"` | Remove fallback; validation in `main.ts` |

**OTP/PIN log removal (`services/auth/src/routes/auth.ts`):**

Both `console.log` calls must be **deleted entirely** — not made conditional. A `NODE_ENV !== "production"` guard is not sufficient because the acceptance criterion requires the value never appear in any log.

- Line 242: Delete `console.log(`\n[DEV] Admin OTP for ${email}: ${otp}\n`)`. Replace with `request.log.info({ event: "otp_issued", role: "admin" })`. Use `request.log` (Fastify's logger surface at this call site), not a standalone `logger` variable.
- Line 472: Delete `console.log(`[DEV] Staff register OTP/PIN for ${email}: ${plainPin}`)`. Replace with `request.log.info({ event: "pin_issued", role: "staff" })`.

### Acceptance criteria
- [ ] Service exits before binding port when any required secret env var is missing
- [ ] Error message lists all missing vars in one message
- [ ] Missing = `undefined` OR `null` OR empty string after trim
- [ ] `validateRequiredEnv` is called in `main.ts` / `index.ts` (entry point), not in route or guard files
- [ ] No `?? "dev-..."` or `?? ""` fallback remains for any security-sensitive secret
- [ ] `REDIS_URL` included in auth service required env list
- [ ] `ADMIN_LOGIN_PASSWORD` and `STAFF_LOGIN_PASSWORD` included in auth required env list
- [ ] Both `console.log` OTP/PIN calls in `auth.ts` are **deleted** (not conditionally guarded)
- [ ] OTP and PIN values never appear in logs; only metadata (event type) logged via `request.log`

---

## Group 2: Public API Persistence + Webhook Signature Hardening

### Audit items closed
- P0-2: Public API key store is in-memory (non-persistent)
- P0-3: Request signature/replay protection is weak
- Notifications callback signature alignment

### Dependencies
- **Security-critical:** Group 1 must be deployed before Group 2 is deployed. See execution strategy note above.

### Files touched
- `services/core/prisma/schema.prisma` — new models + migration
- `services/public-api/src/lib/store.ts` — **deleted**
- `services/public-api/src/lib/prisma.ts` — **new** Prisma client singleton
- `services/public-api/src/lib/key-store.ts` — **new** Prisma-backed adapter
- `services/public-api/src/lib/auth.ts` — replace signature verification (now async)
- `services/public-api/src/lib/redis.ts` — **new** Redis client for nonce cache
- `services/public-api/src/routes/` — update all call sites to `await verifyPublicApiRequest()`
- `services/public-api/src/index.ts` — startup validation + Redis/Prisma connection check
- `services/public-api/package.json` — add `@prisma/client`, `ioredis` (or existing Redis package)
- `services/notifications/src/routes/notifications.ts` — align callback signature verification

### Design

**Public-api service setup:**
The `public-api` service currently has no Prisma client. Before any persistence work:
1. Create `services/public-api/prisma/schema.prisma` with its own schema file. Set `output = "../src/generated/prisma"` in the `generator` block, and point `datasource db` at `DATABASE_URL`. Include only the `PublicApiProject`, `PublicApiKey`, and `PublicApiKeyStatus` definitions (not the full core schema). Add a `prisma:generate` script to `services/public-api/package.json` and add `prisma` as a dev dependency alongside `@prisma/client` as a production dependency. Do **not** import from `services/core/src/generated/prisma` — cross-service generated client imports create a coupling that breaks independent deployability.
2. Create `services/public-api/src/lib/prisma.ts` with a singleton `PrismaClient` importing from `../generated/prisma`.
3. Add a Redis client (`services/public-api/src/lib/redis.ts`) for nonce replay cache, reading `REDIS_URL` from env.
4. In `services/public-api/src/index.ts`, call `validateRequiredEnv(["DATABASE_URL", "REDIS_URL", "API_KEY_ENCRYPTION_KEY"])` and verify both connections before binding the port.

**Prisma schema additions — two locations:**
The `PublicApiProject` and `PublicApiKey` models must be added to **both** `services/core/prisma/schema.prisma` (so migrations are managed centrally from the core service) **and** `services/public-api/prisma/schema.prisma` (for the local generated client). The migration is always run from `services/core`. Run `pnpm --filter @maphari/core prisma:deploy` (or `prisma migrate deploy`) as part of the Group 2 deploy pipeline step, before starting the public-api service.

**Prisma relation name disambiguation:**
Both `PublicApiProject` and `PublicApiKey` reference the `Client` model. Prisma requires explicit `@relation(name: "...")` disambiguators when multiple relations exist between the same two models. Add named relations and the corresponding inverse fields on `Client`:

```prisma
// In Client model — add these two inverse relation arrays:
publicApiProjects  PublicApiProject[] @relation("ClientPublicApiProjects")
publicApiKeys      PublicApiKey[]     @relation("ClientPublicApiKeys")
```

**`services/core/prisma/schema.prisma` model additions:**

```prisma
model PublicApiProject {
  id          String          @id @default(cuid())
  clientId    String
  client      Client          @relation("ClientPublicApiProjects", fields: [clientId], references: [id])
  name        String
  description String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  keys        PublicApiKey[]
}

model PublicApiKey {
  id               String             @id @default(cuid())
  projectId        String
  project          PublicApiProject   @relation(fields: [projectId], references: [id])
  clientId         String
  client           Client             @relation("ClientPublicApiKeys", fields: [clientId], references: [id])
  label            String
  keyId            String             @unique   // pk_... stored plaintext for lookup
  keySecretEnc     String                       // AES-256-GCM encrypted sk_... — see Key secret storage section
  status           PublicApiKeyStatus @default(ACTIVE)
  expiresAt        DateTime?
  createdBy        String?
  revokedAt        DateTime?
  revokedBy        String?
  lastUsedAt       DateTime?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
}

enum PublicApiKeyStatus {
  ACTIVE
  REVOKED
}
```

**Key secret storage — encrypted, not hashed:**

API key secrets are HMAC keys, not passwords. They must be **retrievable** to verify signatures. Therefore, they cannot be stored as a one-way hash (hashing is for passwords only). Instead:
- Encrypt the raw `keySecret` using AES-256-GCM with an application-level encryption key (`API_KEY_ENCRYPTION_KEY` env var, 32-byte base64)
- Store the ciphertext + IV + auth tag in `keySecretEnc` (e.g. as base64url-encoded JSON: `{iv, ciphertext, tag}`)
- Add `API_KEY_ENCRYPTION_KEY` to `validateRequiredEnv` for the public-api service
- Decrypt at verification time, use the raw secret for HMAC, never log or return the decrypted value

Add `API_KEY_ENCRYPTION_KEY` to the services required env list.

**Key creation flow:**
1. Generate `keyId` (`pk_${randomUUID().replace(/-/g,"")}`) and `keySecret` (`sk_${randomUUID().replace(/-/g,"")}`)
2. Encrypt `keySecret` → `keySecretEnc`
3. Persist to DB with `status: ACTIVE`
4. Return `keyId` and raw `keySecret` to caller **once only** — never stored plaintext, never re-retrievable after this response

**Key lookup path (`key-store.ts`):**
1. Find record by `keyId` (`SELECT WHERE keyId = ? AND status = 'ACTIVE'`)
2. Reject if `expiresAt` is set and has passed
3. Reject if `clientId` does not match the authenticated tenant context (derived from key record itself — no separate header needed from client)
4. Decrypt `keySecretEnc` → raw `keySecret`
5. Return `{ keySecret, clientId }` to auth layer for signature verification

**Canonical signature contract:**

Client sends:
- `x-timestamp`: Unix milliseconds as string
- `x-nonce`: UUID v4
- `x-api-key-id`: the `keyId` (`pk_...`)
- `x-api-signature`: `HMAC-SHA256(${timestamp}.${rawBody}, keySecret)` using the raw secret

Server verifies in order:
1. Parse `x-timestamp` — reject if missing or non-numeric
2. Freshness window: `|now - timestamp| ≤ 300_000ms (5 minutes)` — reject if outside window
3. Lookup key by `keyId` — enforce `status=ACTIVE`, expiry check (see above)
4. Nonce uniqueness: `SET replay:${keyId}:${nonce} 1 NX EX 300` in Redis — reject if key already exists; TTL is exactly the freshness window (300s) — this is intentionally not doubled since the timestamp check already gates the outer window
5. Decrypt `keySecretEnc` → `keySecret`
6. Capture raw request body (see below)
7. Compute `HMAC-SHA256(${timestamp}.${rawBody}, keySecret)`
8. Compare using `timingSafeEqual` — **never `===`**
9. On success, update `lastUsedAt` asynchronously (fire-and-forget, do not block response). Must include error handling: `.catch((err) => request.log.error({ err, event: "lastUsedAt_update_failed" }))` to prevent unhandled promise rejections from crashing the process.

**Raw body capture (Fastify):**
Use `addContentTypeParser('application/json', { parseAs: 'buffer' }, ...)` so Fastify delivers the raw `Buffer` instead of the parsed object. In the parser callback, store the buffer on a custom request property (`request.rawBody = buffer`) and assign `request.body = JSON.parse(buffer.toString('utf8'))`. This guarantees the signature is computed over the exact bytes the client sent. Register this content type parser in the Fastify app setup before routes are registered.

**`verifyPublicApiRequest` becomes async:**
The function signature changes from `(request) => PublicApiAuthResult` to `async (request) => Promise<PublicApiAuthResult>`. All call sites in `services/public-api/src/routes/` must be updated to `await verifyPublicApiRequest(request)`.

**Redis required for replay cache:**
Redis is not optional. If Redis is unavailable at startup, the service does not start. No in-memory fallback for nonce cache.

**Notifications callback alignment:**
The notifications service verifies webhook callbacks using `NOTIFICATION_CALLBACK_SECRET`. Apply the same canonical signature contract (`${timestamp}.${rawBody}`) to this route.

Migration strategy: For 30 days post-deploy, accept both new format (with `x-timestamp` + `x-nonce`) and old format (body-string only). The old-format path logs `{ event: "legacy_callback_signature", provider: ... }` as a deprecation warning. After the cutover date, remove the old-format path. Note: the old format provides no replay protection during the migration window — this is an accepted, time-bounded risk. Any providers that can be updated immediately should be.

### Acceptance criteria
- [ ] `store.ts` deleted; no in-memory arrays remain
- [ ] `public-api` has `@prisma/client` dependency and `prisma.ts` singleton
- [ ] `public-api` has Redis client and `redis.ts` module
- [ ] `DATABASE_URL`, `REDIS_URL`, `API_KEY_ENCRYPTION_KEY` validated at startup
- [ ] `PublicApiProject` and `PublicApiKey` models added to both `services/core/prisma/schema.prisma` and `services/public-api/prisma/schema.prisma`
- [ ] Named `@relation` disambiguators on both models; inverse relation arrays added to `Client` model
- [ ] `prisma generate` runs without errors in both `services/core` and `services/public-api`
- [ ] Migration run via `pnpm --filter @maphari/core prisma:deploy` before public-api service starts
- [ ] `public-api` has its own `prisma/schema.prisma` with `output = "../src/generated/prisma"`; does NOT import from `services/core/src/generated/prisma`
- [ ] Key secrets encrypted with AES-256-GCM at rest; raw secret returned only at creation
- [ ] `keyId` lookup enforces `status=ACTIVE`, expiry check; `clientId` derived from key record
- [ ] Signature uses `${timestamp}.${rawBody}` canonical format with raw Buffer body
- [ ] Timestamp freshness enforced (±5 min / 300_000ms window)
- [ ] Nonce stored in Redis: `replay:${keyId}:${nonce}`, `NX EX 300`; startup fails without Redis
- [ ] All HMAC comparisons use `timingSafeEqual`; never `===`
- [ ] `verifyPublicApiRequest` is async; all call sites use `await`
- [ ] Raw body captured via `addContentTypeParser('application/json', { parseAs: 'buffer' })` with manual `JSON.parse` fallback
- [ ] Notifications dual-verification active with cutover date and deprecation logging

---

## Group 3: CSP Nonce Hardening

### Audit items closed
- P0-5: Frontend CSP unsafe directives

### Files touched
- `apps/web/src/proxy.ts` — nonce generation + CSP header assembly
- `apps/web/next.config.ts` — remove static CSP header; keep all other security headers
- `apps/web/src/app/layout.tsx` — read nonce (async), pass to `<Script>` and inline scripts
- `scripts/check-csp.sh` (new) — CI check for unsafe directives in both `proxy.ts` and `next.config.ts`
- CI pipeline config — add CSP check step

### Design

**Proxy matcher scope:**
The nonce logic must run for all HTML document requests. The current matcher covers `/client/:path*`, `/admin/:path*`, `/staff/:path*`, `/login`, `/internal/:path*` but misses `/` (landing page) and any other public HTML routes. Widen the matcher to include `/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|eot|ico)$).*)` so all non-static-asset requests are covered. Static assets (fonts, images, `_next/static`) are explicitly excluded — they don't need or use a nonce.

**Nonce generation in `proxy.ts`:**
```ts
import { randomBytes } from 'node:crypto';
const nonce = randomBytes(16).toString('base64');
```

Forward nonce to server components via `NextResponse.next()`:
```ts
const requestHeaders = new Headers(request.headers);
requestHeaders.set('x-csp-nonce', nonce);
const response = NextResponse.next({ request: { headers: requestHeaders } });
```

Set CSP on the **same** `response` object (not a separate `NextResponse`):
```ts
response.headers.set('Content-Security-Policy', buildCsp(nonce));
```

**CSP string assembly:**

The `buildCsp(nonce, isProd)` function must be structured as a `NODE_ENV !== 'production'` guard (not `=== 'production'` with an else) so the CI regex can reliably verify that `unsafe-eval` only appears inside the dev branch. Example structure:

```ts
function buildCsp(nonce: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `'self' 'nonce-${nonce}' 'unsafe-eval'`;
  const connectSrc = isProd
    ? `'self' https://*.livekit.cloud wss://*.livekit.cloud https://cloud.livekit.io`
    : `'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:* https://*.livekit.cloud wss://*.livekit.cloud https://cloud.livekit.io`;
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://sandbox.payfast.co.za https://www.payfast.co.za",
  ].join('; ');
}
```

Production `script-src`: `'self' 'nonce-${nonce}' 'strict-dynamic'` — no `unsafe-eval`, no `unsafe-inline`.
Production `connect-src`: no `localhost:*` entries (dev-only). The `localhost:*` origins are included in the dev branch only.
Dev `script-src`: adds `'unsafe-eval'` for Next.js HMR/fast-refresh.
Dev `connect-src`: includes `localhost:*` for local API and WebSocket connections.
(`unsafe-eval` required for Next.js HMR/fast-refresh in dev — never in production branch.)

Note on `style-src 'unsafe-inline'`: Next.js injects inline styles for font optimization and CSS-in-JS. This is an accepted limitation. `style-src` with nonces is not currently feasible without significant refactoring and is out of scope for this group. The XSS risk from `unsafe-inline` on styles is lower than on scripts.

Note on `proxy()` function: `randomBytes(16)` from `node:crypto` is synchronous. The `proxy()` function stays **synchronous** after this change — no `async` keyword is introduced. Do not make it async; all nonce and CSP logic in the proxy is synchronous.

**`next.config.ts`:**
Remove the `Content-Security-Policy` entry from `securityHeaders`. All other headers remain (X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). This is safe because all HTML requests are now covered by the widened proxy matcher above.

**`layout.tsx` — nonce consumption:**
`headers()` is async in Next.js 16. Read as:
```ts
const headersList = await headers();
const nonce = headersList.get('x-csp-nonce') ?? '';
```

Pass to `<Script>` tags:
```tsx
<Script nonce={nonce} ... />
```

For the two existing `dangerouslySetInnerHTML` inline scripts (theme detection and service worker registration): React server components do not strip the `nonce` prop from `<script>` elements when using `dangerouslySetInnerHTML` in RSC mode. Apply `nonce={nonce}` directly on the `<script>` element alongside `dangerouslySetInnerHTML`. After deployment, perform a browser check (open DevTools Console, filter for CSP violations) on the home page, admin dashboard, and login page to confirm no CSP violation errors appear for these scripts.

**Rollout sequence:**
1. Deploy with `Content-Security-Policy-Report-Only` first (add as a separate header alongside the enforcing one, or swap the header name)
2. Monitor for 24-48 hours — check browser DevTools and any CSP reporting endpoint for violations
3. Switch to enforcing `Content-Security-Policy` once violations are confirmed clean

**CI check (`scripts/check-csp.sh`):**
Scope the check to find `unsafe-eval` or `unsafe-inline` in `script-src` context only (not `style-src`, which is intentionally kept). Use a targeted pattern that accounts for production code paths:
```bash
#!/bin/bash
set -e
# Check for unsafe script-src directives in production code paths
# Looks for the pattern in proxy.ts outside of a dev/non-production conditional
RESULT=$(node -e "
const fs = require('fs');
const files = ['apps/web/src/proxy.ts', 'apps/web/next.config.ts'];
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  // Look for unsafe directives not inside a !== 'production' or dev guard
  if (/script-src[^;]*unsafe-(eval|inline)/.test(src)) {
    const inDevGuard = /NODE_ENV[^=]*!==.*production[\s\S]{0,1000}unsafe-(eval|inline)/.test(src);
    if (!inDevGuard) {
      console.log('FAIL: ' + f);
      process.exit(1);
    }
  }
}
console.log('OK');
")
echo "\$RESULT"
```
This uses Node.js for the check to avoid shell grep false-positive/false-negative issues.

### Acceptance criteria
- [ ] `Content-Security-Policy` removed from `next.config.ts` static headers
- [ ] Nonce generated per-request in `proxy.ts` using `randomBytes(16).toString('base64')`
- [ ] Nonce forwarded to server components via `x-csp-nonce` request header using `NextResponse.next({ request: { headers: ... } })`
- [ ] CSP set on same `NextResponse` object
- [ ] Proxy matcher covers `/` and all HTML-serving routes; excludes `_next/static`, images, fonts, favicon
- [ ] Production CSP: no `unsafe-eval`, no `unsafe-inline` in `script-src`
- [ ] Dev CSP: `unsafe-eval` only when `NODE_ENV !== 'production'`
- [ ] `headers()` called with `await` in `layout.tsx`
- [ ] `nonce` prop applied to all `<Script>` tags and `dangerouslySetInnerHTML` `<script>` elements in root layout
- [ ] No CSP violations in browser DevTools on home, login, and dashboard pages
- [ ] `scripts/check-csp.sh` uses Node.js check (not plain grep) and fails CI if unsafe directives found outside dev guard
- [ ] Deployed with `Content-Security-Policy-Report-Only` first; switched to enforce after violations are clean

---

## Group 4: Stylelint Setup + .gitignore Fixes

### Audit items closed
- Frontend: No style linting policy (section 3.2B)
- Build/test artifacts tracked in repo (section 3.2C)

### Files touched
- `apps/web/package.json`
- `apps/web/.stylelintrc.json` (new)
- `apps/web/.stylelintignore` (new)
- `apps/web/.gitignore`
- CI pipeline config

### Design

**Package versions:**
Before installation, verify compatibility with the current `stylelint` version. Use `stylelint-config-standard` (actively maintained). Do **not** use `stylelint-config-css-modules` — it is unmaintained and has known peer-dependency conflicts with `stylelint` v15+. CSS module support is handled by `stylelint-config-standard` with `selector-class-pattern: null` (see below).

Dev dependencies to add:
- `stylelint` (pin to current latest, e.g. `^16.x`)
- `stylelint-config-standard`

**`apps/web/package.json` — new scripts:**
```json
"lint:styles": "stylelint 'src/**/*.css'",
"lint:styles:fix": "stylelint 'src/**/*.css' --fix"
```
Lints all CSS under `src/` — both module files and global/shared CSS.

**`apps/web/.stylelintrc.json`:**
```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "selector-class-pattern": null,
    "max-nesting-depth": 2,
    "declaration-block-no-duplicate-properties": true,
    "no-duplicate-selectors": true,
    "color-no-invalid-hex": true,
    "unit-no-unknown": true
  }
}
```
`selector-class-pattern: null` disables the default kebab-case enforcement — required because the codebase uses camelCase CSS module class names (e.g. `badgeGreen`, `topbarStatusAmber`) that are referenced dynamically and must not be renamed.

**Baseline fix before enabling CI gate:**
Before adding the CI gate, run `pnpm --filter @maphari/web lint:styles:fix` against the existing codebase to auto-fix all fixable violations. Manually review and fix any remaining violations. Commit the result as a separate baseline commit. Only then add the CI gate. Skipping this step will immediately fail every PR on the entire existing CSS surface.

**`apps/web/.stylelintignore`:**
```
tmp/**
test-results/**
.next/**
node_modules/**
src/generated/**
```
Covers generated/legacy noise to keep CI output actionable.

**`apps/web/.gitignore` additions:**
```
tmp/
test-results/
```

**CI pipeline:**
- Add `pnpm --filter @maphari/web lint:styles` as a required step alongside existing eslint step
- Only enable after baseline fix commit is merged

### Acceptance criteria
- [ ] `stylelint-config-css-modules` NOT used (unmaintained); `stylelint-config-standard` only
- [ ] `stylelint` version pinned and verified compatible with `stylelint-config-standard`
- [ ] `lint:styles` and `lint:styles:fix` scripts present in `apps/web/package.json` targeting `src/**/*.css`
- [ ] `.stylelintignore` excludes `tmp/`, `test-results/`, `.next/`, `node_modules/`, `src/generated/`
- [ ] `apps/web/.gitignore` includes `tmp/` and `test-results/`
- [ ] Baseline `lint:styles:fix` run and committed before CI gate is enabled
- [ ] CI gate fails on stylelint violations
- [ ] `selector-class-pattern: null` confirmed in config (camelCase class names preserved)

---

## Summary: Audit Checklist Items Closed by This Work

| Checklist item | Group |
|----------------|-------|
| All services fail startup when required secrets are missing | 1 |
| No security secret has a default fallback | 1 |
| No auth OTP/PIN values appear in logs | 1 |
| Public API keys persisted in DB and encrypted at rest | 2 |
| Key rotation/revocation and audit trails implemented | 2 |
| Webhook/API signatures use raw-body canonicalization | 2 |
| Replay protection (timestamp + nonce/idempotency) implemented | 2 |
| CSP in production has no `unsafe-inline`/`unsafe-eval` in script-src | 3 |
| stylelint + CSS standards enforcement active in CI | 4 |
| Generated tmp/test artifacts excluded from git | 4 |

**Remaining 23 checklist items** are addressed in the 31-60 day and 61-90 day phases (not in scope here).
