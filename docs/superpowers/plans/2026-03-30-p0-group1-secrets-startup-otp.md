# P0 Group 1: Secret Fallbacks + Startup Validation + OTP Log Removal

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all insecure secret fallbacks from 5 services, add fail-fast startup validation, and delete OTP/PIN values from auth logs.

**Architecture:** Each service's entry point (`index.ts` / `main.ts`) calls a local `validateRequiredEnv()` before starting the server. Fastify route files have their hardcoded fallback strings removed. Two `console.log` calls in auth that print OTP/PIN values are deleted and replaced with structured metadata-only log entries.

**Tech Stack:** TypeScript, Fastify (auth/files/notifications services), NestJS (gateway), Vitest (tests)

**Spec:** `docs/superpowers/specs/2026-03-30-production-readiness-30day-design.md` — Group 1

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `services/auth/src/lib/validate-env.ts` | Create | Pure `validateRequiredEnv` function + unit tests hook |
| `services/auth/src/__tests__/validate-env.test.ts` | Create | Unit tests for `validateRequiredEnv` |
| `services/auth/src/index.ts` | Modify | Call `validateRequiredEnv` before `readAuthConfig()` |
| `services/auth/src/lib/config.ts` | Modify | Remove `?? "dev-access-secret"` fallback from `JWT_ACCESS_SECRET` |
| `services/auth/src/routes/auth.ts` | Modify | Delete OTP log (line 242) and PIN log (line 472) |
| `services/files/src/lib/validate-env.ts` | Create | Same pure function, scoped to files service |
| `services/files/src/index.ts` | Modify | Call `validateRequiredEnv(["UPLOAD_TOKEN_SECRET"])` before `createFilesApp()` |
| `services/files/src/routes/upload-flow.ts` | Modify | Remove 3× `?? "maphari-upload-secret"` fallbacks |
| `services/notifications/src/lib/validate-env.ts` | Create | Same pure function, scoped to notifications service |
| `services/notifications/src/index.ts` | Modify | Call `validateRequiredEnv(["NOTIFICATION_CALLBACK_SECRET"])` |
| `services/notifications/src/routes/notifications.ts` | Modify | Remove `?? "dev-notification-callback-secret"` fallback |
| `apps/gateway/src/lib/validate-env.ts` | Create | Same pure function, scoped to gateway |
| `apps/gateway/src/main.ts` | Modify | Call `validateRequiredEnv(["JWT_ACCESS_SECRET"])` before `createGatewayApp()` |
| `apps/gateway/src/auth/rbac.guard.ts` | Modify | Remove `?? "dev-access-secret"` fallback |

---

## Task 1: validateRequiredEnv — auth service

**Files:**
- Create: `services/auth/src/lib/validate-env.ts`
- Create: `services/auth/src/__tests__/validate-env.test.ts`

- [ ] **Step 1: Write the failing test**

Create `services/auth/src/__tests__/validate-env.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateRequiredEnv } from "../lib/validate-env.js";

describe("validateRequiredEnv", () => {
  const ORIGINAL = { ...process.env };

  afterEach(() => {
    // Restore env after each test
    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL)) delete process.env[key];
    }
    Object.assign(process.env, ORIGINAL);
  });

  it("does not throw when all vars are present and non-empty", () => {
    process.env.FOO = "bar";
    process.env.BAZ = "qux";
    expect(() => validateRequiredEnv(["FOO", "BAZ"])).not.toThrow();
  });

  it("throws listing all missing vars in one message", () => {
    delete process.env.MISSING_A;
    delete process.env.MISSING_B;
    expect(() => validateRequiredEnv(["MISSING_A", "MISSING_B"])).toThrow(
      /\[startup\].*MISSING_A.*MISSING_B/
    );
  });

  it("treats undefined as missing", () => {
    delete process.env.UNDEF_VAR;
    expect(() => validateRequiredEnv(["UNDEF_VAR"])).toThrow(/UNDEF_VAR/);
  });

  it("treats empty string as missing", () => {
    process.env.EMPTY_VAR = "";
    expect(() => validateRequiredEnv(["EMPTY_VAR"])).toThrow(/EMPTY_VAR/);
  });

  it("treats whitespace-only string as missing", () => {
    process.env.WHITESPACE_VAR = "   ";
    expect(() => validateRequiredEnv(["WHITESPACE_VAR"])).toThrow(/WHITESPACE_VAR/);
  });

  it("does not throw for a non-empty string with surrounding whitespace content", () => {
    process.env.PADDED_VAR = "  actual-secret  ";
    expect(() => validateRequiredEnv(["PADDED_VAR"])).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/maphari/Projects/maphari_technologies
pnpm --filter @maphari/auth test -- validate-env
```

Expected: FAIL — `validateRequiredEnv` not found

- [ ] **Step 3: Implement validateRequiredEnv**

Create `services/auth/src/lib/validate-env.ts`:

```ts
export function validateRequiredEnv(required: string[]): void {
  const missing = required.filter((key) => {
    const val = process.env[key];
    return val === undefined || val === null || val.trim() === "";
  });
  if (missing.length > 0) {
    throw new Error(
      `[startup] Missing required environment variables: ${missing.join(", ")}. Service cannot start.`
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @maphari/auth test -- validate-env
```

Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add services/auth/src/lib/validate-env.ts services/auth/src/__tests__/validate-env.test.ts
git commit -m "feat(auth): add validateRequiredEnv with full test coverage"
```

---

## Task 2: Auth service — remove secret fallback + startup validation

**Files:**
- Modify: `services/auth/src/lib/config.ts`
- Modify: `services/auth/src/index.ts`

- [ ] **Step 1: Write failing test for config with missing secret**

Add to `services/auth/src/__tests__/validate-env.test.ts` (append to existing file):

```ts
import { readAuthConfig } from "../lib/config.js";

describe("readAuthConfig — no fallback secrets", () => {
  it("reads JWT_ACCESS_SECRET directly from env without fallback", () => {
    const saved = process.env.JWT_ACCESS_SECRET;
    process.env.JWT_ACCESS_SECRET = "my-real-secret";
    const config = readAuthConfig(process.env);
    expect(config.accessTokenSecret).toBe("my-real-secret");
    if (saved !== undefined) process.env.JWT_ACCESS_SECRET = saved;
    else delete process.env.JWT_ACCESS_SECRET;
  });

  it("returns undefined (not 'dev-access-secret') when JWT_ACCESS_SECRET is absent", () => {
    const saved = process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_ACCESS_SECRET;
    const config = readAuthConfig(process.env);
    // After removing fallback, value will be undefined — not the hardcoded dev string
    expect(config.accessTokenSecret).toBeUndefined();
    if (saved !== undefined) process.env.JWT_ACCESS_SECRET = saved;
  });
});
```

- [ ] **Step 2: Run test — verify second case currently fails (returns "dev-access-secret" not undefined)**

```bash
pnpm --filter @maphari/auth test -- validate-env
```

Expected: "returns undefined" test FAILS — currently returns `"dev-access-secret"`

- [ ] **Step 3: Remove fallback in config.ts**

Open `services/auth/src/lib/config.ts`. Find the line:
```ts
accessTokenSecret: env.JWT_ACCESS_SECRET ?? "dev-access-secret",
```
Change to:
```ts
accessTokenSecret: env.JWT_ACCESS_SECRET,
```

Also add `ADMIN_LOGIN_PASSWORD` and `STAFF_LOGIN_PASSWORD` to the required env list by removing their `?? ""` defaults. Find:
```ts
adminPassword: env.ADMIN_LOGIN_PASSWORD ?? "",
staffPassword: env.STAFF_LOGIN_PASSWORD ?? "",
```
Change to:
```ts
adminPassword: env.ADMIN_LOGIN_PASSWORD,
staffPassword: env.STAFF_LOGIN_PASSWORD,
```

Update the `AuthConfig` interface to allow these fields to potentially be undefined during construction (they will be validated at startup before use):
- If TypeScript complains, change `adminPassword: string` and `staffPassword: string` to `adminPassword: string | undefined` and `staffPassword: string | undefined` in the interface — OR keep them as `string` and cast with `!` since startup validation guarantees presence.

The cleanest approach: keep them as `string` in the interface, use non-null assertion:
```ts
adminPassword: env.ADMIN_LOGIN_PASSWORD!,
staffPassword: env.STAFF_LOGIN_PASSWORD!,
```

- [ ] **Step 4: Add startup validation to index.ts**

Open `services/auth/src/index.ts`. Add at the very top, before all other logic (after `loadEnv` call):

```ts
import { validateRequiredEnv } from "./lib/validate-env.js";

// ... existing imports ...

// After loadEnv({ path: ... }) line, add:
validateRequiredEnv([
  "JWT_ACCESS_SECRET",
  "REDIS_URL",
  "ADMIN_LOGIN_PASSWORD",
  "STAFF_LOGIN_PASSWORD",
]);
```

Place the `validateRequiredEnv` call immediately after the `loadEnv` call, before `readAuthConfig()`.

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @maphari/auth test -- validate-env
```

Expected: All tests PASS. TypeScript check:
```bash
pnpm --filter @maphari/auth exec tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add services/auth/src/lib/config.ts services/auth/src/index.ts services/auth/src/__tests__/validate-env.test.ts
git commit -m "feat(auth): remove JWT_ACCESS_SECRET fallback and add startup env validation"
```

---

## Task 3: Auth service — remove OTP/PIN logs

**Files:**
- Modify: `services/auth/src/routes/auth.ts`

- [ ] **Step 1: Write test verifying OTP value is not logged**

Add to `services/auth/src/__tests__/validate-env.test.ts`:

```ts
import { vi } from "vitest";

describe("auth route — OTP log redaction", () => {
  it("auth.ts does not contain console.log with otp variable reference", async () => {
    // Static check: read the source file and verify neither otp nor plainPin
    // values are passed to console.log
    const fs = await import("node:fs");
    const src = fs.readFileSync(
      new URL("../routes/auth.ts", import.meta.url),
      "utf8"
    );
    // Should not have console.log calls that reference otp or plainPin
    expect(src).not.toMatch(/console\.log\([^)]*otp[^)]*\)/);
    expect(src).not.toMatch(/console\.log\([^)]*plainPin[^)]*\)/);
  });
});
```

- [ ] **Step 2: Run test — verify it fails (console.log with otp still exists)**

```bash
pnpm --filter @maphari/auth test -- validate-env
```

Expected: FAIL — regex matches existing console.log lines

- [ ] **Step 3: Delete both console.log calls in auth.ts**

Open `services/auth/src/routes/auth.ts`.

**Line 242** — find and delete:
```ts
console.log(`\n[DEV] Admin OTP for ${email}: ${otp}\n`);
```
Replace with:
```ts
request.log.info({ event: "otp_issued", role: "admin" });
```

**Line 472** — find and delete:
```ts
console.log(`[DEV] Staff register OTP/PIN for ${email}: ${plainPin}`);
```
Replace with:
```ts
request.log.info({ event: "pin_issued", role: "staff" });
```

- [ ] **Step 4: Run test — verify it passes**

```bash
pnpm --filter @maphari/auth test -- validate-env
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add services/auth/src/routes/auth.ts services/auth/src/__tests__/validate-env.test.ts
git commit -m "fix(auth): delete OTP/PIN console.log — replace with metadata-only request.log entries"
```

---

## Task 4: Files service — remove secret fallback + startup validation

**Files:**
- Create: `services/files/src/lib/validate-env.ts`
- Modify: `services/files/src/index.ts`
- Modify: `services/files/src/routes/upload-flow.ts`

- [ ] **Step 1: Create validate-env.ts for files service (identical logic, local scope)**

Create `services/files/src/lib/validate-env.ts` with the same implementation as auth:

```ts
export function validateRequiredEnv(required: string[]): void {
  const missing = required.filter((key) => {
    const val = process.env[key];
    return val === undefined || val === null || val.trim() === "";
  });
  if (missing.length > 0) {
    throw new Error(
      `[startup] Missing required environment variables: ${missing.join(", ")}. Service cannot start.`
    );
  }
}
```

- [ ] **Step 2: Write a static test verifying no upload secret fallback in upload-flow.ts**

Create `services/files/src/__tests__/validate-env.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateRequiredEnv } from "../lib/validate-env.js";

describe("validateRequiredEnv (files service)", () => {
  it("throws when UPLOAD_TOKEN_SECRET is missing", () => {
    const saved = process.env.UPLOAD_TOKEN_SECRET;
    delete process.env.UPLOAD_TOKEN_SECRET;
    expect(() => validateRequiredEnv(["UPLOAD_TOKEN_SECRET"])).toThrow(/UPLOAD_TOKEN_SECRET/);
    if (saved !== undefined) process.env.UPLOAD_TOKEN_SECRET = saved;
  });
});

describe("upload-flow.ts — no hardcoded secret fallback", () => {
  it("does not contain the maphari-upload-secret fallback string", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync(
      new URL("../routes/upload-flow.ts", import.meta.url),
      "utf8"
    );
    expect(src).not.toContain("maphari-upload-secret");
  });
});
```

- [ ] **Step 3: Run test — second test fails (fallback still exists)**

```bash
pnpm --filter @maphari/files test -- validate-env
```

Expected: `does not contain the maphari-upload-secret fallback string` FAILS

- [ ] **Step 4: Remove all 3 fallbacks in upload-flow.ts**

Open `services/files/src/routes/upload-flow.ts`. Search for all occurrences of `?? "maphari-upload-secret"` (there are 3). Remove each fallback, leaving just `process.env.UPLOAD_TOKEN_SECRET`:

```ts
// Before:
process.env.UPLOAD_TOKEN_SECRET ?? "maphari-upload-secret"

// After:
process.env.UPLOAD_TOKEN_SECRET
```

Do this for all 3 occurrences at lines ~119, ~121, ~181, ~240 (exact line numbers may vary).

- [ ] **Step 5: Add startup validation to files index.ts**

Open `services/files/src/index.ts`. Add at the very top:

```ts
import { validateRequiredEnv } from "./lib/validate-env.js";

validateRequiredEnv(["UPLOAD_TOKEN_SECRET"]);
```

Place this immediately before `import { createFilesApp } from "./app.js";` so it runs before any module initialization.

- [ ] **Step 6: Run tests and TypeScript check**

```bash
pnpm --filter @maphari/files test -- validate-env
pnpm --filter @maphari/files exec tsc --noEmit
```

Expected: all tests PASS, no TypeScript errors

- [ ] **Step 7: Commit**

```bash
git add services/files/src/lib/validate-env.ts services/files/src/__tests__/validate-env.test.ts services/files/src/index.ts services/files/src/routes/upload-flow.ts
git commit -m "feat(files): remove UPLOAD_TOKEN_SECRET fallback and add startup env validation"
```

---

## Task 5: Notifications service — remove secret fallback + startup validation

**Files:**
- Create: `services/notifications/src/lib/validate-env.ts`
- Modify: `services/notifications/src/index.ts`
- Modify: `services/notifications/src/routes/notifications.ts`

- [ ] **Step 1: Create validate-env.ts (same implementation)**

Create `services/notifications/src/lib/validate-env.ts`:

```ts
export function validateRequiredEnv(required: string[]): void {
  const missing = required.filter((key) => {
    const val = process.env[key];
    return val === undefined || val === null || val.trim() === "";
  });
  if (missing.length > 0) {
    throw new Error(
      `[startup] Missing required environment variables: ${missing.join(", ")}. Service cannot start.`
    );
  }
}
```

- [ ] **Step 2: Write tests**

Create `services/notifications/src/__tests__/validate-env.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateRequiredEnv } from "../lib/validate-env.js";

describe("validateRequiredEnv (notifications service)", () => {
  it("throws when NOTIFICATION_CALLBACK_SECRET is missing", () => {
    const saved = process.env.NOTIFICATION_CALLBACK_SECRET;
    delete process.env.NOTIFICATION_CALLBACK_SECRET;
    expect(() => validateRequiredEnv(["NOTIFICATION_CALLBACK_SECRET"])).toThrow(
      /NOTIFICATION_CALLBACK_SECRET/
    );
    if (saved !== undefined) process.env.NOTIFICATION_CALLBACK_SECRET = saved;
  });
});

describe("notifications.ts — no hardcoded secret fallback", () => {
  it("does not contain the dev-notification-callback-secret string", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync(
      new URL("../routes/notifications.ts", import.meta.url),
      "utf8"
    );
    expect(src).not.toContain("dev-notification-callback-secret");
  });
});
```

- [ ] **Step 3: Run tests — second test fails**

```bash
pnpm --filter @maphari/notifications test -- validate-env
```

Expected: FAIL on `dev-notification-callback-secret` check

- [ ] **Step 4: Remove fallback in notifications.ts**

Open `services/notifications/src/routes/notifications.ts`. Find line ~282:
```ts
const callbackSecret = process.env.NOTIFICATION_CALLBACK_SECRET ?? "dev-notification-callback-secret";
```
Change to:
```ts
const callbackSecret = process.env.NOTIFICATION_CALLBACK_SECRET as string;
```

- [ ] **Step 5: Add startup validation to notifications index.ts**

Open `services/notifications/src/index.ts`. Add at the very top:

```ts
import { validateRequiredEnv } from "./lib/validate-env.js";

validateRequiredEnv(["NOTIFICATION_CALLBACK_SECRET"]);
```

Place before `import { createNotificationsApp }`.

- [ ] **Step 6: Run tests and TypeScript check**

```bash
pnpm --filter @maphari/notifications test -- validate-env
pnpm --filter @maphari/notifications exec tsc --noEmit
```

Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add services/notifications/src/lib/validate-env.ts services/notifications/src/__tests__/validate-env.test.ts services/notifications/src/index.ts services/notifications/src/routes/notifications.ts
git commit -m "feat(notifications): remove NOTIFICATION_CALLBACK_SECRET fallback and add startup env validation"
```

---

## Task 6: Gateway — remove secret fallback + startup validation

**Files:**
- Create: `apps/gateway/src/lib/validate-env.ts`
- Modify: `apps/gateway/src/main.ts`
- Modify: `apps/gateway/src/auth/rbac.guard.ts`

- [ ] **Step 1: Create validate-env.ts in gateway**

Create `apps/gateway/src/lib/validate-env.ts`:

```ts
export function validateRequiredEnv(required: string[]): void {
  const missing = required.filter((key) => {
    const val = process.env[key];
    return val === undefined || val === null || val.trim() === "";
  });
  if (missing.length > 0) {
    throw new Error(
      `[startup] Missing required environment variables: ${missing.join(", ")}. Service cannot start.`
    );
  }
}
```

- [ ] **Step 2: Write static test that rbac.guard.ts has no fallback**

Create `apps/gateway/src/__tests__/validate-env.test.ts` (or add to existing test file if one exists):

```ts
import { describe, it, expect } from "vitest";
import { validateRequiredEnv } from "../lib/validate-env.js";

describe("validateRequiredEnv (gateway)", () => {
  it("throws when JWT_ACCESS_SECRET is missing", () => {
    const saved = process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_ACCESS_SECRET;
    expect(() => validateRequiredEnv(["JWT_ACCESS_SECRET"])).toThrow(/JWT_ACCESS_SECRET/);
    if (saved !== undefined) process.env.JWT_ACCESS_SECRET = saved;
  });
});

describe("rbac.guard.ts — no hardcoded secret fallback", () => {
  it("does not contain dev-access-secret fallback", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync(
      new URL("../auth/rbac.guard.ts", import.meta.url),
      "utf8"
    );
    expect(src).not.toContain("dev-access-secret");
  });
});
```

- [ ] **Step 3: Run test — second test fails**

```bash
pnpm --filter @maphari/gateway test -- validate-env
```

If the gateway uses Jest instead of Vitest, adapt accordingly (check `apps/gateway/package.json`). Expected: FAIL on `dev-access-secret` check.

- [ ] **Step 4: Remove fallback in rbac.guard.ts**

Open `apps/gateway/src/auth/rbac.guard.ts`. Find the line that reads:
```ts
JWT_ACCESS_SECRET ?? "dev-access-secret"
```
Remove the fallback so it reads:
```ts
process.env.JWT_ACCESS_SECRET
```

The exact location depends on where the secret is read inside the guard. It may be in a `verifyAccessToken` helper call or in a jwt verification call — find it by searching for `dev-access-secret`.

- [ ] **Step 5: Add startup validation to gateway main.ts**

Open `apps/gateway/src/main.ts`. Add at the very top, before all other logic:

```ts
import { validateRequiredEnv } from "./lib/validate-env.js";

validateRequiredEnv(["JWT_ACCESS_SECRET"]);
```

Place this call before `const app = await createGatewayApp();`.

- [ ] **Step 6: Run tests and TypeScript check**

```bash
pnpm --filter @maphari/gateway test -- validate-env
pnpm --filter @maphari/gateway exec tsc --noEmit
```

Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add apps/gateway/src/lib/validate-env.ts apps/gateway/src/__tests__/validate-env.test.ts apps/gateway/src/main.ts apps/gateway/src/auth/rbac.guard.ts
git commit -m "feat(gateway): remove JWT_ACCESS_SECRET fallback and add startup env validation"
```

---

## Task 7: Full verification run

- [ ] **Step 1: Run all affected service tests**

```bash
pnpm --filter @maphari/auth test
pnpm --filter @maphari/files test
pnpm --filter @maphari/notifications test
pnpm --filter @maphari/gateway test
```

Expected: all suites PASS

- [ ] **Step 2: TypeScript check across all affected packages**

```bash
pnpm --filter @maphari/auth exec tsc --noEmit
pnpm --filter @maphari/files exec tsc --noEmit
pnpm --filter @maphari/notifications exec tsc --noEmit
pnpm --filter @maphari/gateway exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Grep confirm — no insecure fallbacks remain**

```bash
grep -rn "dev-access-secret\|maphari-upload-secret\|dev-notification-callback-secret" \
  services/auth services/files services/notifications apps/gateway \
  --include="*.ts" 2>/dev/null
```

Expected: no matches

- [ ] **Step 4: Grep confirm — no OTP/PIN values in console.log**

```bash
grep -n "console\.log.*otp\|console\.log.*plainPin\|console\.log.*OTP\|console\.log.*PIN" \
  services/auth/src/routes/auth.ts
```

Expected: no matches

- [ ] **Step 5: Final commit if any clean-up needed**

```bash
git add -p  # review and stage any remaining changes
git commit -m "chore(p0-group1): final cleanup — all secret fallbacks removed, validation verified"
```

---

## Acceptance Criteria Checklist

- [ ] Service exits before binding port when any required secret env var is missing
- [ ] Error message lists all missing vars in one message
- [ ] Missing = `undefined` OR `null` OR empty string after trim
- [ ] `validateRequiredEnv` is called in `main.ts` / `index.ts` (entry point), not in route or guard files
- [ ] No `?? "dev-..."` or `?? ""` fallback remains for any security-sensitive secret
- [ ] `REDIS_URL` included in auth service required env list
- [ ] `ADMIN_LOGIN_PASSWORD` and `STAFF_LOGIN_PASSWORD` included in auth required env list
- [ ] Both `console.log` OTP/PIN calls in `auth.ts` are **deleted** (not conditionally guarded)
- [ ] OTP and PIN values never appear in logs; only metadata (event type) logged via `request.log`
