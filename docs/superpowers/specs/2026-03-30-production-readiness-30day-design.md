# Production Readiness — 30-Day P0 Hardening Design

**Date:** 2026-03-30
**Scope:** First 30 days of the production readiness audit (audit doc: `docs/production-readiness-audit-2026-03-30.md`)
**Audit items addressed:** P0-1, P0-2, P0-3, P0-4 (partial), P0-5, plus OTP log removal and stylelint enforcement
**Execution strategy:** Parallel subagent dispatch across 4 independent workstreams

---

## Execution Strategy

Items are grouped into 4 parallel workstreams. Groups 1, 3, and 4 are fully independent. Group 2 depends on Group 1 completing first to confirm no schema conflicts, then runs independently.

| Group | Items | Dependencies |
|-------|-------|--------------|
| 1 | Secret fallbacks + startup validation + OTP log removal | None |
| 2 | Public API persistence + webhook signature hardening | Group 1 complete |
| 3 | CSP nonce hardening | None |
| 4 | Stylelint setup + .gitignore fixes | None |

---

## Group 1: Secret Fallbacks + Startup Validation + OTP Log Removal

### Audit items closed
- P0-1: Default/fallback secrets in security-sensitive paths
- Auth service OTP/PIN sensitive log leak

### Files touched
- `services/auth/src/lib/config.ts`
- `services/files/src/routes/upload-flow.ts`
- `services/notifications/src/routes/notifications.ts`
- `apps/gateway/src/auth/rbac.guard.ts` (and its `jwt.ts` dependency for secret read)
- `services/auth/src/routes/auth.ts` (lines 242, 472)

### Design

**Startup validation pattern (applied to all affected services):**

Each service's config load function (`readAuthConfig`, etc.) calls `validateRequiredEnv()` before returning. The validator:
- Checks each required env var for `undefined`, `null`, and `""` after `.trim()`
- Collects **all** missing vars before throwing (not fail-fast on first)
- Throws a single descriptive `Error` listing every missing var
- This error propagates before the service binds any port

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

Validation is called at the **config load path** (in `readConfig()` / `readAuthConfig()` etc.), not in route modules, so failure is deterministic at startup regardless of import order.

**Secret fallbacks to remove:**

| File | Var | Current fallback | Action |
|------|-----|-----------------|--------|
| `services/auth/src/lib/config.ts` | `JWT_ACCESS_SECRET` | `"dev-access-secret"` | Remove fallback, add to `validateRequiredEnv` |
| `services/files/src/routes/upload-flow.ts` (×3) | `UPLOAD_TOKEN_SECRET` | `"maphari-upload-secret"` | Remove all 3 fallbacks; validate at module init via env guard |
| `services/notifications/src/routes/notifications.ts` | `NOTIFICATION_CALLBACK_SECRET` | `"dev-notification-callback-secret"` | Remove fallback, validate at startup |
| `apps/gateway/src/auth/rbac.guard.ts` | `JWT_ACCESS_SECRET` | `"dev-access-secret"` | Remove fallback, validate at guard module init |

**OTP/PIN log removal (`services/auth/src/routes/auth.ts`):**

- Line 242: `console.log(`\n[DEV] Admin OTP for ${email}: ${otp}\n`)` → Remove entirely. Replace with structured log: `logger.info({ event: "otp_issued", role: "admin", userId: ... })` (no OTP value)
- Line 472: `console.log(`[DEV] Staff register OTP/PIN for ${email}: ${plainPin}`)` → Remove entirely. Replace with structured log: `logger.info({ event: "pin_issued", role: "staff", userId: ... })` (no PIN value)

### Acceptance criteria
- [ ] Service exits before binding port when any required secret env var is missing
- [ ] Error message lists all missing vars in one message
- [ ] Missing = undefined OR null OR empty string after trim
- [ ] No `?? "dev-..."` fallback remains for any security-sensitive secret
- [ ] OTP and PIN values never appear in logs; only metadata (event type, user/request IDs)

---

## Group 2: Public API Persistence + Webhook Signature Hardening

### Audit items closed
- P0-2: Public API key store is in-memory (non-persistent)
- P0-3: Request signature/replay protection is weak
- Notifications callback signature alignment

### Dependencies
- Group 1 must be complete first (confirms no blocking conflicts before schema migration)

### Files touched
- `services/core/prisma/schema.prisma` — new models + migration
- `services/public-api/src/lib/store.ts` — **deleted**
- `services/public-api/src/lib/key-store.ts` — **new** Prisma-backed adapter
- `services/public-api/src/lib/auth.ts` — replace signature verification
- `services/public-api/src/routes/` — update all handlers
- `services/notifications/src/routes/notifications.ts` — align callback signature verification

### Design

**Prisma schema additions (`services/core/prisma/schema.prisma`):**

```prisma
model PublicApiProject {
  id          String          @id @default(cuid())
  clientId    String
  name        String
  description String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  keys        PublicApiKey[]
}

model PublicApiKey {
  id             String           @id @default(cuid())
  projectId      String
  clientId       String
  label          String
  keyId          String           @unique   // pk_... stored plaintext for lookup
  keySecretHash  String                     // scrypt hash of sk_... — never stored plaintext
  status         PublicApiKeyStatus @default(ACTIVE)
  expiresAt      DateTime?
  createdBy      String?
  revokedAt      DateTime?
  revokedBy      String?
  lastUsedAt     DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  project        PublicApiProject @relation(fields: [projectId], references: [id])
}

enum PublicApiKeyStatus {
  ACTIVE
  REVOKED
}
```

**Key creation:**
- Generate `keyId` (`pk_${uuid}`) and `keySecret` (`sk_${uuid}`) at creation time
- Hash `keySecret` using `scrypt` (aligns with auth service's existing hash posture)
- Return raw secret **once only** in the creation response — never stored plaintext, never re-retrievable
- Store `keySecretHash` in DB

**Key lookup path (`key-store.ts`):**
1. Find by `keyId` — enforce `status = ACTIVE`
2. Verify `clientId` and `projectId` scoping
3. Check `expiresAt` if set
4. Only if all above pass, proceed to signature verification

**Canonical signature contract (public-api + notifications):**

Client sends:
- `x-timestamp`: Unix milliseconds as string
- `x-nonce`: UUID v4
- `x-api-signature`: `HMAC-SHA256(${timestamp}.${rawBody}, keySecret)`

Server verifies:
1. Parse `x-timestamp` — reject if missing or non-numeric
2. Freshness window: `|now - timestamp| <= 5 minutes` — reject if outside window
3. Nonce uniqueness: `SET replay:${keyId}:${nonce} 1 NX EX 600` in Redis — reject if key already exists (replay detected)
4. Compute `HMAC-SHA256(${timestamp}.${rawBody}, keySecretHash)` — use `timingSafeEqual` for comparison (never `===`)
5. **Redis is required** for nonce cache — no in-memory fallback in production

**Raw body capture:**
- Add Fastify `addContentTypeParser` or `preParsing` hook to capture raw body bytes before JSON parsing
- Store on `request.rawBody` for use in signature verification
- Verify `content-encoding` handling does not corrupt raw bytes

**Notifications compatibility:**
- During migration, support dual verification: attempt new canonical format first, fall back to old `JSON.stringify(body)` format with a deprecation log
- Set a cutover date (suggested: 30 days after deploy) after which old format is rejected
- Log which format was used per request for migration tracking

### Acceptance criteria
- [ ] `store.ts` deleted; no in-memory arrays remain
- [ ] API keys and projects persisted in DB with migration applied
- [ ] Key secrets hashed with scrypt at rest; raw secret returned only at creation
- [ ] `keyId` lookup enforces `status=ACTIVE`, client/project scoping, expiry check
- [ ] Signature uses `${timestamp}.${rawBody}` canonical format
- [ ] Timestamp freshness enforced (±5 min window)
- [ ] Nonce stored in Redis with `replay:${keyId}:${nonce}` key, `NX EX 600`
- [ ] All HMAC comparisons use `timingSafeEqual`
- [ ] Redis is required for replay cache — startup fails without Redis connection
- [ ] Notifications dual-verification active with cutover logging

---

## Group 3: CSP Nonce Hardening

### Audit items closed
- P0-5: Frontend CSP unsafe directives

### Files touched
- `apps/web/src/proxy.ts` — nonce generation + CSP header assembly
- `apps/web/next.config.ts` — remove static CSP header; keep all other security headers
- `apps/web/src/app/layout.tsx` (or root layout) — read nonce, pass to `<Script>` and inline scripts
- `scripts/check-csp.sh` (new) — CI check for unsafe directives
- `.github/workflows/` (or equivalent CI config) — add CSP check step

### Design

**`proxy.ts` nonce generation:**
- Matcher scoped to HTML document requests only — exclude `_next/static/**`, `_next/image/**`, `favicon.ico`, font/image file extensions
- Per-request: `const nonce = crypto.randomBytes(16).toString('base64')`
- Forward nonce to server components via `NextResponse.next({ request: { headers: { 'x-csp-nonce': nonce } } })`
- Set CSP response header on the same `NextResponse` object

**CSP string assembly in proxy.ts:**

Production (`NODE_ENV === 'production'`):
```
script-src 'self' 'nonce-${nonce}' 'strict-dynamic'
```

Development (`NODE_ENV !== 'production'`):
```
script-src 'self' 'nonce-${nonce}' 'unsafe-eval'
```
(`unsafe-eval` needed for Next.js HMR/fast-refresh in dev only — never in production branch)

**`next.config.ts`:**
- Remove the `Content-Security-Policy` header entry entirely
- All other security headers remain (X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

**Root layout (`layout.tsx`):**
- Read nonce from request headers server-side: `headers().get('x-csp-nonce')`
- Pass to `<Script nonce={nonce}>` for all next/script usages
- Pass to any inline `<script>` blocks as `nonce={nonce}` attribute
- Pass nonce to `<meta>` or `<html>` if needed by third-party integrations

**Rollout sequence:**
1. Deploy with `Content-Security-Policy-Report-Only` header first (not enforcing)
2. Monitor violation reports for 1-2 days
3. Switch to enforcing `Content-Security-Policy` once violations are clean

**CI check (`scripts/check-csp.sh`):**
```bash
#!/bin/bash
# Fail if unsafe-eval or unsafe-inline appear in production CSP generation
# Check both next.config.ts AND proxy.ts
if grep -n "unsafe-eval\|unsafe-inline" apps/web/next.config.ts apps/web/src/proxy.ts 2>/dev/null | grep -v "NODE_ENV.*production\|dev\|#"; then
  echo "ERROR: unsafe CSP directive found in production path"
  exit 1
fi
```
The script is context-aware: fails only if the unsafe directive is outside an explicit dev/non-production guard.

### Acceptance criteria
- [ ] `Content-Security-Policy` no longer set in `next.config.ts` static headers
- [ ] Nonce generated per-request in `proxy.ts` using `crypto.randomBytes(16).toString('base64')`
- [ ] Nonce forwarded to server components via `x-csp-nonce` request header
- [ ] CSP set on same `NextResponse` object
- [ ] Proxy matcher excludes `_next/static`, `_next/image`, fonts, and other static assets
- [ ] Production CSP contains no `unsafe-eval` or `unsafe-inline`
- [ ] Dev CSP allows `unsafe-eval` only when `NODE_ENV !== 'production'`
- [ ] All `<Script>` and inline `<script>` tags in layout receive nonce
- [ ] `scripts/check-csp.sh` fails CI if unsafe directives found in production path of `next.config.ts` or `proxy.ts`
- [ ] Deployed first with `Content-Security-Policy-Report-Only`; switched to enforce after violations are clean

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

**`apps/web/package.json` — new dev dependencies:**
- `stylelint`
- `stylelint-config-standard`
- `stylelint-config-css-modules`

**`apps/web/package.json` — new scripts:**
```json
"lint:styles": "stylelint 'src/**/*.css'",
"lint:styles:fix": "stylelint 'src/**/*.css' --fix"
```
Lints all CSS files under `src/` — both module files and global/shared CSS. Not limited to `*.module.css`.

**`apps/web/.stylelintrc.json`:**
```json
{
  "extends": ["stylelint-config-standard", "stylelint-config-css-modules"],
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

**`apps/web/.stylelintignore`:**
```
tmp/**
test-results/**
.next/**
node_modules/**
```
Keeps CI output actionable by excluding generated and legacy noise.

**`apps/web/.gitignore` additions:**
```
tmp/
test-results/
```
Removes build/test artifacts from git tracking (audit item 3.2C).

**CI pipeline:**
- Add `pnpm --filter @maphari/web lint:styles` as a required step alongside existing eslint step
- Fails PR if stylelint violations found

### Acceptance criteria
- [ ] `stylelint 'src/**/*.css'` runs without configuration errors
- [ ] `lint:styles` and `lint:styles:fix` scripts present in `apps/web/package.json`
- [ ] `.stylelintignore` excludes `tmp/`, `test-results/`, `.next/`, `node_modules/`
- [ ] `apps/web/.gitignore` includes `tmp/` and `test-results/`
- [ ] CI gate fails on stylelint violations
- [ ] `selector-class-pattern: null` confirmed in config (camelCase class names preserved)

---

## Summary: Audit Checklist Items Closed by This Work

| Checklist item | Group |
|----------------|-------|
| All services fail startup when required secrets are missing | 1 |
| No security secret has a default fallback | 1 |
| No auth OTP/PIN values appear in logs | 1 |
| Public API keys persisted in DB and hashed | 2 |
| Key rotation/revocation and audit trails implemented | 2 |
| Webhook/API signatures use raw-body canonicalization | 2 |
| Replay protection (timestamp + nonce/idempotency) implemented | 2 |
| CSP in production has no `unsafe-inline`/`unsafe-eval` | 3 |
| stylelint + CSS standards enforcement active in CI | 4 |
| Generated tmp/test artifacts excluded from git | 4 |

**Remaining 23 checklist items** are addressed in the 31-60 day and 61-90 day phases (not in scope here).
