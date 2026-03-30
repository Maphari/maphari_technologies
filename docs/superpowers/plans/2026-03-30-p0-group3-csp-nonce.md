# P0 Group 3: CSP Nonce Hardening

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `unsafe-eval`/`unsafe-inline` CSP in `next.config.ts` with per-request nonce-based CSP generated in `proxy.ts`, so production has no `unsafe-eval` or `unsafe-inline` in `script-src`.

**Architecture:** `proxy.ts` generates a cryptographically random nonce per request, sets `x-csp-nonce` on the forwarded request headers, and writes the `Content-Security-Policy` header on the response. The proxy matcher is widened to cover all HTML routes (not just authenticated subdomains). `layout.tsx` reads the nonce via `await headers()` and applies it to `<Script>` and inline script tags. CSP is deployed report-only first, then enforced. A deterministic unit test and a shell guard replace the fragile regex CI check.

**Tech Stack:** Next.js 16, `proxy.ts`, `node:crypto` (synchronous `randomBytes`), Vitest

**Spec:** `docs/superpowers/specs/2026-03-30-production-readiness-30day-design.md` — Group 3

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/proxy.ts` | Modify | Add nonce generation, widen matcher, set CSP on response |
| `apps/web/src/proxy.csp.test.ts` | Create | Deterministic unit test for `buildCsp()` |
| `apps/web/next.config.ts` | Modify | Remove static `Content-Security-Policy` header |
| `apps/web/src/app/layout.tsx` | Modify | Consume `x-csp-nonce` via `await headers()`, apply to scripts |
| `scripts/check-csp.sh` | Create | CI shell guard for static CSP reintroduction |

---

## Task 1: Extract and test buildCsp

**Files:**
- Create: `apps/web/src/proxy.csp.test.ts`
- Modify: `apps/web/src/proxy.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/proxy.csp.test.ts`:

```ts
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

// We'll import buildCsp once it's exported from proxy.ts
// For now import will fail — that's expected

let buildCsp: (nonce: string) => string;

beforeEach(async () => {
  // Re-import fresh module after env changes
  vi.resetModules();
  const mod = await import("./proxy.js");
  buildCsp = (mod as unknown as { buildCsp: typeof buildCsp }).buildCsp;
});

describe("buildCsp — production mode", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  it("includes nonce in script-src", () => {
    const csp = buildCsp("test-nonce-abc");
    expect(csp).toContain("'nonce-test-nonce-abc'");
  });

  it("does NOT include unsafe-eval in production", () => {
    const csp = buildCsp("nonce123");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("does NOT include unsafe-inline in script-src production", () => {
    const csp = buildCsp("nonce123");
    // unsafe-inline should not appear in the script-src directive
    // (it is allowed in style-src intentionally)
    const scriptSrcLine = csp.split(";").find((d) => d.trim().startsWith("script-src"));
    expect(scriptSrcLine).toBeDefined();
    expect(scriptSrcLine).not.toContain("unsafe-inline");
  });

  it("does NOT include localhost in connect-src in production", () => {
    const csp = buildCsp("nonce123");
    const connectSrcLine = csp.split(";").find((d) => d.trim().startsWith("connect-src"));
    expect(connectSrcLine).toBeDefined();
    expect(connectSrcLine).not.toContain("localhost");
  });

  it("includes strict-dynamic in script-src", () => {
    const csp = buildCsp("nonce123");
    expect(csp).toContain("'strict-dynamic'");
  });
});

describe("buildCsp — development mode", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  it("includes unsafe-eval in development", () => {
    const csp = buildCsp("nonce123");
    expect(csp).toContain("unsafe-eval");
  });

  it("includes localhost in connect-src in development", () => {
    const csp = buildCsp("nonce123");
    expect(csp).toContain("localhost");
  });
});
```

- [ ] **Step 2: Run test — verify fails**

```bash
pnpm --filter @maphari/web test -- proxy.csp
```

Expected: FAIL — `buildCsp` not exported from `proxy.ts`

- [ ] **Step 3: Implement buildCsp and export it from proxy.ts**

Open `apps/web/src/proxy.ts`. Add the following near the top (after imports):

```ts
import { randomBytes } from "node:crypto";

export function buildCsp(nonce: string): string {
  const isProd = process.env.NODE_ENV === "production";
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
  ].join("; ");
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
pnpm --filter @maphari/web test -- proxy.csp
```

Expected: all 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/proxy.ts apps/web/src/proxy.csp.test.ts
git commit -m "feat(web/proxy): extract and export buildCsp with prod/dev split and full test coverage"
```

---

## Task 2: Add nonce generation + CSP header to proxy.ts

**Files:**
- Modify: `apps/web/src/proxy.ts`

- [ ] **Step 1: Read current proxy function signature**

Open `apps/web/src/proxy.ts` and find the `export function proxy(request: NextRequest): NextResponse` function. Note: it is synchronous — do NOT add `async`.

- [ ] **Step 2: Add nonce generation and CSP header inside proxy()**

Locate the section in `proxy()` where a `NextResponse` is built (typically `NextResponse.next()` or `NextResponse.redirect()`). For all paths that return `NextResponse.next()`, add nonce generation and CSP header injection.

At the top of the `proxy()` function body (before any routing logic), add:

```ts
const nonce = randomBytes(16).toString("base64");
```

Then, wherever `NextResponse.next()` is called to pass through the request, replace it with:

```ts
const requestHeaders = new Headers(request.headers);
requestHeaders.set("x-csp-nonce", nonce);
const response = NextResponse.next({ request: { headers: requestHeaders } });
response.headers.set("Content-Security-Policy-Report-Only", buildCsp(nonce));
// NOTE: using Report-Only for Phase 1 rollout — switch to Content-Security-Policy after violations are clean
return response;
```

For redirect responses (`NextResponse.redirect(...)`), do NOT set CSP — redirects do not need it.

The `proxy()` function must remain synchronous. `randomBytes` from `node:crypto` is synchronous — no `await` required.

- [ ] **Step 3: Run proxy CSP tests**

```bash
pnpm --filter @maphari/web test -- proxy.csp
```

Expected: PASS (tests still pass because `buildCsp` is unchanged)

- [ ] **Step 4: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/proxy.ts
git commit -m "feat(web/proxy): inject per-request nonce and CSP-Report-Only header (Phase 1 rollout)"
```

---

## Task 3: Widen proxy matcher

**Files:**
- Modify: `apps/web/src/proxy.ts`

- [ ] **Step 1: Find the config.matcher export**

Open `apps/web/src/proxy.ts` and find the `export const config` object with the `matcher` array. It currently covers only authenticated subpaths like `/client/:path*`, `/admin/:path*`, etc.

- [ ] **Step 2: Replace matcher**

Replace the existing matcher with a universal pattern that covers all HTML routes while excluding static assets:

```ts
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT static files:
     * - _next/static (Next.js static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     * - Common static extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|eot|ico)$).*)",
  ],
};
```

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/proxy.ts
git commit -m "feat(web/proxy): widen matcher to cover all HTML routes including landing page"
```

---

## Task 4: Remove static CSP from next.config.ts

**Files:**
- Modify: `apps/web/next.config.ts`

- [ ] **Step 1: Remove only the CSP entry**

Open `apps/web/next.config.ts`. Find the `securityHeaders` array. Remove **only** the object with `key: "Content-Security-Policy"`:

```ts
// Remove this object from securityHeaders:
{
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // ...
  ].join("; ")
}
```

Leave all other security headers intact: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.

- [ ] **Step 2: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 3: Verify CSP no longer appears in config**

```bash
grep -n "Content-Security-Policy\|unsafe-eval\|unsafe-inline" apps/web/next.config.ts
```

Expected: no matches (static CSP entirely removed)

- [ ] **Step 4: Commit**

```bash
git add apps/web/next.config.ts
git commit -m "feat(web): remove static CSP header from next.config.ts — proxy now owns CSP generation"
```

---

## Task 5: Update layout.tsx to consume nonce

**Files:**
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Add headers import and read nonce**

Open `apps/web/src/app/layout.tsx`. Add `headers` to the import from `next/headers`:

```ts
import { cookies, headers } from "next/headers";
```

Inside `RootLayout` (which is already `async`), add after the cookies line:

```ts
const cookieStore = await cookies();
const headersList = await headers();
const nonce = headersList.get("x-csp-nonce") ?? "";
```

- [ ] **Step 2: Apply nonce to both inline script tags**

Find the two `<script dangerouslySetInnerHTML={...}>` tags in the `<head>` block.

**Tag 1** (theme detection script):
```tsx
// Before:
<script dangerouslySetInnerHTML={{ __html: `...theme detection...` }} />

// After:
<script nonce={nonce} dangerouslySetInnerHTML={{ __html: `...theme detection...` }} />
```

**Tag 2** (service worker registration script):
```tsx
// Before:
<script dangerouslySetInnerHTML={{ __html: `...service worker...` }} />

// After:
<script nonce={nonce} dangerouslySetInnerHTML={{ __html: `...service worker...` }} />
```

- [ ] **Step 3: If any next/script Script components exist in layout, add nonce**

Search for `<Script` (capital S) in `layout.tsx`. For each one, add `nonce={nonce}`:
```tsx
<Script nonce={nonce} ... />
```

If none exist, skip this step.

- [ ] **Step 4: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no errors. If TypeScript complains about `nonce` prop on `<script>`, add the intrinsic element attribute — this is standard HTML and is in `@types/react`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/layout.tsx
git commit -m "feat(web/layout): read x-csp-nonce from headers and apply to all inline script tags"
```

---

## Task 6: CI shell guard

**Files:**
- Create: `scripts/check-csp.sh`

- [ ] **Step 1: Create the script**

Create `scripts/check-csp.sh`:

```bash
#!/bin/bash
set -e

echo "Checking for static CSP reintroduction in next.config.ts..."

# Fail if Content-Security-Policy appears as a static header key in next.config.ts
if grep -n "\"Content-Security-Policy\"\|'Content-Security-Policy'" apps/web/next.config.ts 2>/dev/null | grep -v "//"; then
  echo "FAIL: static Content-Security-Policy header found in next.config.ts"
  echo "CSP is now managed by proxy.ts — do not re-add it to next.config.ts"
  exit 1
fi

echo "Static CSP check OK"

echo "Running deterministic CSP production test..."
pnpm --filter @maphari/web test -- proxy.csp
echo "CSP test OK"
```

```bash
chmod +x scripts/check-csp.sh
```

- [ ] **Step 2: Verify the script passes**

```bash
./scripts/check-csp.sh
```

Expected: `Static CSP check OK` and `CSP test OK`

- [ ] **Step 3: Commit**

```bash
git add scripts/check-csp.sh
git commit -m "chore(ci): add CSP guard script to prevent static CSP reintroduction in next.config.ts"
```

---

## Task 7: Full verification

- [ ] **Step 1: Run all web tests**

```bash
pnpm --filter @maphari/web test
```

Expected: proxy.csp tests PASS, no regressions

- [ ] **Step 2: Run CI check**

```bash
./scripts/check-csp.sh
```

Expected: OK

- [ ] **Step 3: TypeScript full check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 4: Grep audit — unsafe directives gone from config**

```bash
grep -rn "unsafe-eval\|unsafe-inline" apps/web/next.config.ts apps/web/src/proxy.ts 2>/dev/null
```

Expected: `proxy.ts` contains `unsafe-eval` only inside the dev branch (`!== 'production'` context). `next.config.ts`: no matches.

- [ ] **Step 5: Phase 1 deploy note**

The proxy currently sets `Content-Security-Policy-Report-Only`. Deploy this to staging/production and monitor for 24-48 hours. Check browser DevTools console on:
- `/` (landing page)
- `/login`
- `/admin` dashboard
- `/client` portal
- `/staff` dashboard

When no violations appear, proceed to Task 8 to switch to enforcement.

---

## Task 8: Switch from report-only to enforcing CSP (Phase 2)

**Files:**
- Modify: `apps/web/src/proxy.ts`

Do this task **only after** Phase 1 monitoring confirms zero CSP violations.

- [ ] **Step 1: Switch header name in proxy.ts**

Open `apps/web/src/proxy.ts`. Find:
```ts
response.headers.set("Content-Security-Policy-Report-Only", buildCsp(nonce));
```

Change to:
```ts
response.headers.set("Content-Security-Policy", buildCsp(nonce));
```

- [ ] **Step 2: Run tests**

```bash
pnpm --filter @maphari/web test -- proxy.csp
./scripts/check-csp.sh
```

Expected: all PASS

- [ ] **Step 3: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/proxy.ts
git commit -m "feat(web/csp): switch CSP from report-only to enforcing — P0-5 closed"
```

---

## Acceptance Criteria Checklist

- [ ] `Content-Security-Policy` removed from `next.config.ts` static headers
- [ ] Nonce generated per-request using `randomBytes(16).toString('base64')`
- [ ] Nonce forwarded via `x-csp-nonce` request header using `NextResponse.next({ request: { headers: ... } })`
- [ ] CSP set on same `NextResponse` object
- [ ] Proxy matcher covers `/` and all HTML routes; excludes `_next/static`, images, fonts, favicon
- [ ] Production CSP: no `unsafe-eval`, no `unsafe-inline` in `script-src`
- [ ] Dev CSP: `unsafe-eval` only when `NODE_ENV !== 'production'`
- [ ] `headers()` called with `await` in `layout.tsx`
- [ ] `nonce` prop applied to all `<Script>` and inline `<script>` tags in root layout
- [ ] No CSP violations in browser DevTools on home, login, and dashboard pages
- [ ] `proxy.csp.test.ts` deterministic test passes in CI
- [ ] `scripts/check-csp.sh` fails CI if static CSP reintroduced in `next.config.ts`
- [ ] Deployed with `Content-Security-Policy-Report-Only` first; switched to enforce after violations are clean
