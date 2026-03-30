# P0 Group 2: Public API Persistence + Webhook Signature Hardening

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-memory public API key store with a persistent, encrypted DB-backed store, and replace the weak JSON.stringify-based signature with a canonical timestamp + raw-body HMAC scheme with Redis-backed replay protection.

**Architecture:** Two new Prisma models (`PublicApiProject`, `PublicApiKey`) are added to core's schema and migrated. The `public-api` service gets its own Prisma schema (pointing to the same DB) for a locally-generated client. Key secrets are stored AES-256-GCM encrypted — not hashed, because they are HMAC keys that must be decryptable. Signature verification becomes async, gating on Redis nonce checks and DB key lookups. Notifications receives aligned dual-path signature support.

**Tech Stack:** Prisma, PostgreSQL, Redis (ioredis), Node.js `crypto` (AES-256-GCM + HMAC-SHA256 + timingSafeEqual), Fastify, Vitest

**Spec:** `docs/superpowers/specs/2026-03-30-production-readiness-30day-design.md` — Group 2

**DEPENDENCY:** Group 1 must be merged and deployed before this plan is deployed to production.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `services/core/prisma/schema.prisma` | Modify | Add `PublicApiProject`, `PublicApiKey`, `PublicApiKeyStatus`; add inverse relations to `Client` |
| `services/public-api/prisma/schema.prisma` | Create | Own Prisma schema for local client generation |
| `services/public-api/package.json` | Modify | Add `prisma` (dev), `@prisma/client`, `ioredis`; add `prisma:generate` script |
| `services/public-api/src/lib/crypto.ts` | Create | AES-256-GCM encrypt/decrypt helpers |
| `services/public-api/src/lib/prisma.ts` | Create | Prisma client singleton |
| `services/public-api/src/lib/redis.ts` | Create | Redis client singleton |
| `services/public-api/src/lib/key-store.ts` | Create | Prisma-backed key CRUD + lookup adapter |
| `services/public-api/src/lib/auth.ts` | Replace | New async `verifyPublicApiRequest` with canonical signature |
| `services/public-api/src/lib/store.ts` | Delete | Remove in-memory arrays |
| `services/public-api/src/lib/validate-env.ts` | Create | Startup env validation (same pattern as Group 1) |
| `services/public-api/src/index.ts` | Modify | Startup validation + Redis/Prisma connection check |
| `services/public-api/src/routes/public-api.ts` | Modify | Update all `verifyPublicApiRequest` call sites to `await` |
| `services/public-api/src/app.ts` | Modify | Register raw-body capture hook |
| `services/notifications/src/routes/notifications.ts` | Modify | Add dual-path canonical signature verification |
| `services/public-api/src/__tests__/crypto.test.ts` | Create | AES-GCM encrypt/decrypt tests |
| `services/public-api/src/__tests__/auth.test.ts` | Create | Signature verification tests |
| `services/public-api/src/__tests__/key-store.test.ts` | Create | Key CRUD unit tests (with Prisma mock) |
| `scripts/check-schema-parity.sh` | Create | CI parity check between core and public-api schemas |

---

## Task 1: Add Prisma models to core schema + run migration

**Files:**
- Modify: `services/core/prisma/schema.prisma`

- [ ] **Step 1: Add models to core schema**

Open `services/core/prisma/schema.prisma`. Find the `Client` model and add two inverse relation fields:

```prisma
model Client {
  // ... existing fields ...
  publicApiProjects  PublicApiProject[] @relation("ClientPublicApiProjects")
  publicApiKeys      PublicApiKey[]     @relation("ClientPublicApiKeys")
}
```

Then append the new models at the end of the schema file:

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
  keyId            String             @unique
  keySecretEnc     String
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

- [ ] **Step 2: Validate schema generates without errors**

```bash
pnpm --filter @maphari/core prisma:generate
```

Expected: generates successfully, no relation errors

- [ ] **Step 3: Create and apply migration**

```bash
pnpm --filter @maphari/core exec prisma migrate dev --name add-public-api-key-models
```

Expected: migration file created under `services/core/prisma/migrations/`, applied to local dev DB

- [ ] **Step 4: Commit**

```bash
git add services/core/prisma/schema.prisma services/core/prisma/migrations/
git commit -m "feat(core/prisma): add PublicApiProject, PublicApiKey, PublicApiKeyStatus models"
```

---

## Task 2: Set up public-api Prisma schema + local generated client

**Files:**
- Create: `services/public-api/prisma/schema.prisma`
- Modify: `services/public-api/package.json`

- [ ] **Step 1: Create public-api's own Prisma schema**

Create `services/public-api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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
  id               String             @id @default(cuid())
  projectId        String
  project          PublicApiProject   @relation(fields: [projectId], references: [id])
  clientId         String
  label            String
  keyId            String             @unique
  keySecretEnc     String
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

Note: No `Client` FK relation here — this schema is only for the public-api service's local generated client. The core schema owns the FK enforcement; the public-api schema is a projection for its generated types.

- [ ] **Step 2: Add prisma dependency and generate script to package.json**

Open `services/public-api/package.json`. Add:

```json
{
  "scripts": {
    "prisma:generate": "prisma generate --schema ./prisma/schema.prisma"
  },
  "dependencies": {
    "@prisma/client": "^6.x"
  },
  "devDependencies": {
    "prisma": "^6.x"
  }
}
```

Match the Prisma version used by `services/core/package.json`.

Also add `ioredis`:
```json
{
  "dependencies": {
    "ioredis": "^5.x"
  }
}
```

Check which Redis package other services use (`services/auth` or `services/core`) and match that version.

- [ ] **Step 3: Install and generate**

```bash
pnpm install
pnpm --filter @maphari/public-api prisma:generate
```

Expected: `services/public-api/src/generated/prisma/` created

- [ ] **Step 4: Add generated directory to .gitignore**

In `services/public-api/.gitignore` (create if needed), add:
```
src/generated/
```

- [ ] **Step 5: Commit**

```bash
git add services/public-api/prisma/schema.prisma services/public-api/package.json services/public-api/.gitignore pnpm-lock.yaml
git commit -m "feat(public-api): add own Prisma schema with local generated client"
```

---

## Task 3: AES-256-GCM crypto utilities

**Files:**
- Create: `services/public-api/src/lib/crypto.ts`
- Create: `services/public-api/src/__tests__/crypto.test.ts`

- [ ] **Step 1: Write failing tests**

Create `services/public-api/src/__tests__/crypto.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret } from "../lib/crypto.js";

describe("encryptSecret / decryptSecret", () => {
  const KEY = Buffer.from("a".repeat(64), "hex").toString("base64"); // 32-byte base64

  it("round-trips a secret correctly", () => {
    const original = "sk_abc123def456";
    const encrypted = encryptSecret(original, KEY);
    const decrypted = decryptSecret(encrypted, KEY);
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext on each call (unique IV)", () => {
    const secret = "sk_same_secret";
    const enc1 = encryptSecret(secret, KEY);
    const enc2 = encryptSecret(secret, KEY);
    expect(enc1).not.toBe(enc2);
  });

  it("encrypted output is a valid JSON string with iv, ciphertext, tag fields", () => {
    const encrypted = encryptSecret("sk_test", KEY);
    const parsed = JSON.parse(Buffer.from(encrypted, "base64url").toString("utf8"));
    expect(parsed).toHaveProperty("iv");
    expect(parsed).toHaveProperty("ciphertext");
    expect(parsed).toHaveProperty("tag");
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encryptSecret("sk_test", KEY);
    const parsed = JSON.parse(Buffer.from(encrypted, "base64url").toString("utf8"));
    parsed.ciphertext = "tampered";
    const tampered = Buffer.from(JSON.stringify(parsed)).toString("base64url");
    expect(() => decryptSecret(tampered, KEY)).toThrow();
  });

  it("throws on wrong key", () => {
    const KEY2 = Buffer.from("b".repeat(64), "hex").toString("base64");
    const encrypted = encryptSecret("sk_test", KEY);
    expect(() => decryptSecret(encrypted, KEY2)).toThrow();
  });
});
```

- [ ] **Step 2: Run test — verify fails**

```bash
pnpm --filter @maphari/public-api test -- crypto
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement crypto.ts**

Create `services/public-api/src/lib/crypto.ts`:

```ts
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function loadKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) {
    throw new Error("API_KEY_ENCRYPTION_KEY must be a 32-byte base64 string");
  }
  return key;
}

export function encryptSecret(plaintext: string, base64Key: string): string {
  const key = loadKey(base64Key);
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = JSON.stringify({
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    tag: tag.toString("base64"),
  });
  return Buffer.from(payload).toString("base64url");
}

export function decryptSecret(encrypted: string, base64Key: string): string {
  const key = loadKey(base64Key);
  const payload = JSON.parse(Buffer.from(encrypted, "base64url").toString("utf8")) as {
    iv: string;
    ciphertext: string;
    tag: string;
  };
  const iv = Buffer.from(payload.iv, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
pnpm --filter @maphari/public-api test -- crypto
```

Expected: all 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add services/public-api/src/lib/crypto.ts services/public-api/src/__tests__/crypto.test.ts
git commit -m "feat(public-api): add AES-256-GCM encrypt/decrypt for key secret storage"
```

---

## Task 4: Prisma singleton + Redis client + validate-env

**Files:**
- Create: `services/public-api/src/lib/prisma.ts`
- Create: `services/public-api/src/lib/redis.ts`
- Create: `services/public-api/src/lib/validate-env.ts`

- [ ] **Step 1: Create Prisma singleton**

Create `services/public-api/src/lib/prisma.ts`:

```ts
import { PrismaClient } from "../generated/prisma/index.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 2: Create Redis client**

Create `services/public-api/src/lib/redis.ts`:

```ts
import Redis from "ioredis";

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("[startup] REDIS_URL is required");
    _redis = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    _redis.on("error", (err) => {
      console.error("[redis] connection error", err);
    });
  }
  return _redis;
}

export async function closeRedis(): Promise<void> {
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}
```

- [ ] **Step 3: Create validate-env.ts**

Create `services/public-api/src/lib/validate-env.ts`:

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

- [ ] **Step 4: Update index.ts with startup validation and connection checks**

Open `services/public-api/src/index.ts`. Replace with:

```ts
import { validateRequiredEnv } from "./lib/validate-env.js";

validateRequiredEnv(["DATABASE_URL", "REDIS_URL", "API_KEY_ENCRYPTION_KEY"]);

import { createPublicApiApp } from "./app.js";
import { getRedis, closeRedis } from "./lib/redis.js";
import { prisma } from "./lib/prisma.js";

// Verify Redis is reachable before starting
try {
  await getRedis().ping();
} catch (err) {
  console.error("[startup] Redis connection failed:", err);
  process.exit(1);
}

const app = await createPublicApiApp();
const port = Number(process.env.PORT ?? 4010);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Public API service listening on :${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });

async function shutdown(): Promise<void> {
  await closeRedis();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

- [ ] **Step 5: TypeScript check**

```bash
pnpm --filter @maphari/public-api exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add services/public-api/src/lib/prisma.ts services/public-api/src/lib/redis.ts services/public-api/src/lib/validate-env.ts services/public-api/src/index.ts
git commit -m "feat(public-api): add Prisma singleton, Redis client, and startup env validation"
```

---

## Task 5: Key store adapter (Prisma-backed)

**Files:**
- Create: `services/public-api/src/lib/key-store.ts`
- Create: `services/public-api/src/__tests__/key-store.test.ts`

- [ ] **Step 1: Write failing tests**

Create `services/public-api/src/__tests__/key-store.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    publicApiKey: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    publicApiProject: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock crypto so we can inspect encrypted values
vi.mock("../lib/crypto.js", () => ({
  encryptSecret: vi.fn((s: string) => `enc:${s}`),
  decryptSecret: vi.fn((s: string) => s.replace("enc:", "")),
}));

import { prisma } from "../lib/prisma.js";
import {
  createApiKey,
  lookupActiveKey,
  revokeApiKey,
} from "../lib/key-store.js";

const mockPrisma = prisma as unknown as {
  publicApiKey: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  publicApiProject: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

describe("createApiKey", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists encrypted secret and returns raw secret once", async () => {
    mockPrisma.publicApiKey.create.mockResolvedValue({
      id: "key-1",
      keyId: "pk_abc",
      clientId: "client-1",
      projectId: "proj-1",
      label: "Test",
      status: "ACTIVE",
      createdAt: new Date(),
    });

    const result = await createApiKey({
      clientId: "client-1",
      projectId: "proj-1",
      label: "Test",
      encryptionKey: "dummy-key",
    });

    expect(result.keyId).toMatch(/^pk_/);
    expect(result.keySecret).toMatch(/^sk_/);
    // Prisma was called with encrypted secret, not raw
    const createCall = mockPrisma.publicApiKey.create.mock.calls[0][0];
    expect(createCall.data.keySecretEnc).toMatch(/^enc:/);
    expect(createCall.data.keySecretEnc).not.toContain(result.keySecret);
  });
});

describe("lookupActiveKey", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null for unknown keyId", async () => {
    mockPrisma.publicApiKey.findUnique.mockResolvedValue(null);
    const result = await lookupActiveKey("pk_unknown", "dummy-key");
    expect(result).toBeNull();
  });

  it("returns null for REVOKED key", async () => {
    mockPrisma.publicApiKey.findUnique.mockResolvedValue({
      status: "REVOKED",
      keyId: "pk_abc",
      clientId: "client-1",
      keySecretEnc: "enc:sk_secret",
      expiresAt: null,
    });
    const result = await lookupActiveKey("pk_abc", "dummy-key");
    expect(result).toBeNull();
  });

  it("returns null for expired key", async () => {
    mockPrisma.publicApiKey.findUnique.mockResolvedValue({
      status: "ACTIVE",
      keyId: "pk_abc",
      clientId: "client-1",
      keySecretEnc: "enc:sk_secret",
      expiresAt: new Date(Date.now() - 1000), // 1 second in the past
    });
    const result = await lookupActiveKey("pk_abc", "dummy-key");
    expect(result).toBeNull();
  });

  it("returns decrypted keySecret for valid active key", async () => {
    mockPrisma.publicApiKey.findUnique.mockResolvedValue({
      status: "ACTIVE",
      keyId: "pk_abc",
      clientId: "client-1",
      keySecretEnc: "enc:sk_real_secret",
      expiresAt: null,
    });
    const result = await lookupActiveKey("pk_abc", "dummy-key");
    expect(result?.keySecret).toBe("sk_real_secret");
    expect(result?.clientId).toBe("client-1");
  });
});
```

- [ ] **Step 2: Run test — verify fails**

```bash
pnpm --filter @maphari/public-api test -- key-store
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement key-store.ts**

Create `services/public-api/src/lib/key-store.ts`:

```ts
import { randomUUID } from "node:crypto";
import { prisma } from "./prisma.js";
import { encryptSecret, decryptSecret } from "./crypto.js";

export interface ApiKeyRecord {
  keyId: string;
  keySecret: string; // Raw secret — returned only at creation
  clientId: string;
}

export interface LookedUpKey {
  keySecret: string;
  clientId: string;
}

export async function createApiKey(params: {
  clientId: string;
  projectId: string;
  label: string;
  encryptionKey: string;
  createdBy?: string;
  expiresAt?: Date;
}): Promise<ApiKeyRecord> {
  const keyId = `pk_${randomUUID().replace(/-/g, "")}`;
  const keySecret = `sk_${randomUUID().replace(/-/g, "")}`;
  const keySecretEnc = encryptSecret(keySecret, params.encryptionKey);

  await prisma.publicApiKey.create({
    data: {
      keyId,
      keySecretEnc,
      clientId: params.clientId,
      projectId: params.projectId,
      label: params.label,
      status: "ACTIVE",
      createdBy: params.createdBy ?? null,
      expiresAt: params.expiresAt ?? null,
    },
  });

  return { keyId, keySecret, clientId: params.clientId };
}

export async function lookupActiveKey(
  keyId: string,
  encryptionKey: string
): Promise<LookedUpKey | null> {
  const record = await prisma.publicApiKey.findUnique({ where: { keyId } });
  if (!record) return null;
  if (record.status !== "ACTIVE") return null;
  if (record.expiresAt && record.expiresAt < new Date()) return null;

  const keySecret = decryptSecret(record.keySecretEnc, encryptionKey);
  return { keySecret, clientId: record.clientId };
}

export async function revokeApiKey(
  keyId: string,
  revokedBy: string
): Promise<void> {
  await prisma.publicApiKey.update({
    where: { keyId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedBy,
    },
  });
}

export async function touchLastUsed(keyId: string, log: { error: (obj: object) => void }): Promise<void> {
  prisma.publicApiKey
    .update({ where: { keyId }, data: { lastUsedAt: new Date() } })
    .catch((err) => log.error({ err, event: "lastUsedAt_update_failed" }));
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
pnpm --filter @maphari/public-api test -- key-store
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add services/public-api/src/lib/key-store.ts services/public-api/src/__tests__/key-store.test.ts
git commit -m "feat(public-api): add DB-backed key-store with AES-GCM encrypted secret storage"
```

---

## Task 6: Raw body capture in Fastify app (signed routes only)

**Files:**
- Modify: `services/public-api/src/app.ts`
- Create: `services/public-api/src/types.d.ts`

The spec requires raw body capture **without replacing Fastify's global JSON parser**. The approach is a `preParsing` hook registered only on the public-api routes (route-scoped), which reads the stream into a Buffer and stores it on the request before the default parser runs.

- [ ] **Step 1: Add TypeScript declaration for rawBody**

Create `services/public-api/src/types.d.ts`:

```ts
import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
}
```

- [ ] **Step 2: Register preParsing hook in app.ts**

Open `services/public-api/src/app.ts`. After the Fastify instance is created, add a `preParsing` hook that captures the raw stream into a Buffer on the request object. This fires before any parsing and leaves Fastify's default JSON parser untouched:

```ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Readable } from "node:stream";

// Inside createPublicApiApp, after app is created:

// Capture raw body bytes before Fastify parses them.
// Uses preParsing lifecycle — does NOT replace the global JSON parser.
// The payload stream is read into a Buffer stored on request.rawBody,
// then a new Readable is returned so Fastify's parser still receives the data.
app.addHook(
  "preParsing",
  async (request: FastifyRequest, _reply: FastifyReply, payload: NodeJS.ReadableStream) => {
    const chunks: Buffer[] = [];
    for await (const chunk of payload) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
    }
    const raw = Buffer.concat(chunks);
    request.rawBody = raw;
    // Return a new readable that re-emits the same bytes for the JSON parser
    const stream = new Readable();
    stream.push(raw);
    stream.push(null);
    return stream;
  }
);
```

- [ ] **Step 3: TypeScript check**

```bash
pnpm --filter @maphari/public-api exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add services/public-api/src/app.ts services/public-api/src/types.d.ts
git commit -m "feat(public-api): capture raw body via preParsing hook — preserves default JSON parser"
```

---

## Task 7: Rewrite auth.ts — canonical async signature verification

**Files:**
- Replace: `services/public-api/src/lib/auth.ts`
- Create: `services/public-api/src/__tests__/auth.test.ts`

- [ ] **Step 1: Write failing tests**

Create `services/public-api/src/__tests__/auth.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest } from "fastify";

// Mock dependencies
vi.mock("../lib/key-store.js", () => ({
  lookupActiveKey: vi.fn(),
  touchLastUsed: vi.fn(),
}));
vi.mock("../lib/redis.js", () => ({
  getRedis: vi.fn(() => ({
    set: vi.fn(),
  })),
}));

import { lookupActiveKey, touchLastUsed } from "../lib/key-store.js";
import { getRedis } from "../lib/redis.js";
import { verifyPublicApiRequest } from "../lib/auth.js";
import { createHmac } from "node:crypto";

const mockLookup = lookupActiveKey as ReturnType<typeof vi.fn>;
const mockRedis = getRedis as ReturnType<typeof vi.fn>;

function makeRequest(overrides: Partial<{
  headers: Record<string, string>;
  rawBody: Buffer;
  body: unknown;
}>): FastifyRequest {
  const body = overrides.body ?? {};
  const rawBody = overrides.rawBody ?? Buffer.from(JSON.stringify(body), "utf8");
  return {
    headers: overrides.headers ?? {},
    rawBody,
    body,
    log: { info: vi.fn(), error: vi.fn() },
  } as unknown as FastifyRequest;
}

function makeSignature(timestamp: string, rawBody: Buffer, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody.toString("utf8")}`)
    .digest("hex");
}

describe("verifyPublicApiRequest", () => {
  const ENC_KEY = Buffer.from("a".repeat(64), "hex").toString("base64");
  const keyId = "pk_abc123";
  const keySecret = "sk_secret123";
  const clientId = "client-1";

  beforeEach(() => {
    vi.clearAllMocks();
    mockLookup.mockResolvedValue({ keySecret, clientId });
    mockRedis.mockReturnValue({
      set: vi.fn().mockResolvedValue("OK"), // "OK" = key was set (not a replay)
    });
  });

  it("returns ok=true with valid signature and timestamp", async () => {
    const timestamp = String(Date.now());
    const nonce = "550e8400-e29b-41d4-a716-446655440000";
    const rawBody = Buffer.from(JSON.stringify({ foo: "bar" }), "utf8");
    const sig = makeSignature(timestamp, rawBody, keySecret);

    const req = makeRequest({
      headers: {
        "x-api-key-id": keyId,
        "x-timestamp": timestamp,
        "x-nonce": nonce,
        "x-api-signature": sig,
      },
      rawBody,
    });

    const result = await verifyPublicApiRequest(req, ENC_KEY);
    expect(result.ok).toBe(true);
    expect(result.clientId).toBe(clientId);
  });

  it("rejects missing x-timestamp header", async () => {
    const req = makeRequest({
      headers: { "x-api-key-id": keyId },
    });
    const result = await verifyPublicApiRequest(req, ENC_KEY);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("UNAUTHORIZED");
  });

  it("rejects timestamp outside 5-minute window", async () => {
    const staleTimestamp = String(Date.now() - 6 * 60 * 1000); // 6 minutes ago
    const nonce = "550e8400-e29b-41d4-a716-446655440001";
    const rawBody = Buffer.from("{}", "utf8");
    const sig = makeSignature(staleTimestamp, rawBody, keySecret);

    const req = makeRequest({
      headers: {
        "x-api-key-id": keyId,
        "x-timestamp": staleTimestamp,
        "x-nonce": nonce,
        "x-api-signature": sig,
      },
      rawBody,
    });
    const result = await verifyPublicApiRequest(req, ENC_KEY);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("TIMESTAMP_EXPIRED");
  });

  it("rejects replayed nonce", async () => {
    const timestamp = String(Date.now());
    const nonce = "550e8400-e29b-41d4-a716-446655440002";
    const rawBody = Buffer.from("{}", "utf8");
    const sig = makeSignature(timestamp, rawBody, keySecret);

    // Redis returns null = key already exists (replay)
    mockRedis.mockReturnValue({
      set: vi.fn().mockResolvedValue(null),
    });

    const req = makeRequest({
      headers: {
        "x-api-key-id": keyId,
        "x-timestamp": timestamp,
        "x-nonce": nonce,
        "x-api-signature": sig,
      },
      rawBody,
    });
    const result = await verifyPublicApiRequest(req, ENC_KEY);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("REPLAY_DETECTED");
  });

  it("rejects invalid signature", async () => {
    const timestamp = String(Date.now());
    const nonce = "550e8400-e29b-41d4-a716-446655440003";
    const rawBody = Buffer.from("{}", "utf8");

    const req = makeRequest({
      headers: {
        "x-api-key-id": keyId,
        "x-timestamp": timestamp,
        "x-nonce": nonce,
        "x-api-signature": "wrong-signature",
      },
      rawBody,
    });
    const result = await verifyPublicApiRequest(req, ENC_KEY);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("UNAUTHORIZED");
  });
});
```

- [ ] **Step 2: Run test — verify fails**

```bash
pnpm --filter @maphari/public-api test -- auth
```

Expected: FAIL — `verifyPublicApiRequest` has wrong signature (not async)

- [ ] **Step 3: Rewrite auth.ts**

Replace the entire contents of `services/public-api/src/lib/auth.ts`:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { lookupActiveKey, touchLastUsed } from "./key-store.js";
import { getRedis } from "./redis.js";

export interface PublicApiAuthResult {
  ok: boolean;
  clientId?: string;
  errorCode?: string;
  errorMessage?: string;
}

const FRESHNESS_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const NONCE_TTL_SECONDS = 300; // Same as freshness window

export async function verifyPublicApiRequest(
  request: FastifyRequest & { rawBody?: Buffer },
  encryptionKey: string
): Promise<PublicApiAuthResult> {
  const keyId = request.headers["x-api-key-id"] as string | undefined;
  const timestampStr = request.headers["x-timestamp"] as string | undefined;
  const nonce = request.headers["x-nonce"] as string | undefined;
  const signature = request.headers["x-api-signature"] as string | undefined;

  if (!keyId || !timestampStr || !nonce || !signature) {
    return {
      ok: false,
      errorCode: "UNAUTHORIZED",
      errorMessage: "Missing required headers: x-api-key-id, x-timestamp, x-nonce, x-api-signature",
    };
  }

  // 1. Validate timestamp
  const timestamp = Number(timestampStr);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, errorCode: "UNAUTHORIZED", errorMessage: "Invalid x-timestamp" };
  }
  if (Math.abs(Date.now() - timestamp) > FRESHNESS_WINDOW_MS) {
    return { ok: false, errorCode: "TIMESTAMP_EXPIRED", errorMessage: "Request timestamp is outside the 5-minute window" };
  }

  // 2. Lookup key
  const keyRecord = await lookupActiveKey(keyId, encryptionKey);
  if (!keyRecord) {
    return { ok: false, errorCode: "UNAUTHORIZED", errorMessage: "Unknown or inactive API key" };
  }

  // 3. Nonce replay check
  const redis = getRedis();
  const nonceKey = `replay:${keyId}:${nonce}`;
  const stored = await redis.set(nonceKey, "1", "NX", "EX", NONCE_TTL_SECONDS);
  if (stored === null) {
    return { ok: false, errorCode: "REPLAY_DETECTED", errorMessage: "Nonce has already been used" };
  }

  // 4. Verify signature over canonical payload
  const rawBody = request.rawBody ?? Buffer.from(JSON.stringify(request.body ?? {}));
  const canonicalPayload = `${timestampStr}.${rawBody.toString("utf8")}`;
  const expected = createHmac("sha256", keyRecord.keySecret)
    .update(canonicalPayload)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  const match =
    expectedBuf.length === signatureBuf.length &&
    timingSafeEqual(expectedBuf, signatureBuf);

  if (!match) {
    return { ok: false, errorCode: "UNAUTHORIZED", errorMessage: "Invalid request signature" };
  }

  // 5. Fire-and-forget lastUsedAt update
  touchLastUsed(keyId, request.log);

  return { ok: true, clientId: keyRecord.clientId };
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
pnpm --filter @maphari/public-api test -- auth
```

Expected: all 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add services/public-api/src/lib/auth.ts services/public-api/src/__tests__/auth.test.ts
git commit -m "feat(public-api): rewrite signature verification — async, canonical format, replay protection"
```

---

## Task 8: Update route handlers + delete store.ts

**Files:**
- Modify: `services/public-api/src/routes/public-api.ts`
- Delete: `services/public-api/src/lib/store.ts`

- [ ] **Step 1: Update all call sites to await verifyPublicApiRequest**

Open `services/public-api/src/routes/public-api.ts`. Find every call to `verifyPublicApiRequest(request)` and:
1. Add `await` before the call
2. Update the function call to pass `encryptionKey`:

```ts
// Before:
const auth = verifyPublicApiRequest(request);

// After:
const encryptionKey = process.env.API_KEY_ENCRYPTION_KEY as string;
const auth = await verifyPublicApiRequest(request, encryptionKey);
```

There are approximately 5 call sites in this file. Update all of them.

Also update the key creation route to use `createApiKey` from `key-store.ts` instead of the old `store.ts` function:

```ts
import { createApiKey, revokeApiKey } from "../lib/key-store.js";
// Remove: import { createApiKey, listApiKeys, clearPublicApiStore } from "../lib/store.js";
```

Wire up the project and key listing routes to use Prisma queries via `key-store.ts` helpers. For any `listApiKeys()` or `listPartnerProjects()` calls still referencing `store.ts`, add equivalent Prisma query functions to `key-store.ts`:

```ts
// Add to key-store.ts:
export async function listApiKeys(clientId?: string) {
  return prisma.publicApiKey.findMany({
    where: clientId ? { clientId, status: "ACTIVE" } : { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
}

export async function listProjects(clientId?: string) {
  return prisma.publicApiProject.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { createdAt: "desc" },
  });
}
```

- [ ] **Step 2: Delete store.ts**

```bash
rm services/public-api/src/lib/store.ts
```

- [ ] **Step 3: TypeScript check**

```bash
pnpm --filter @maphari/public-api exec tsc --noEmit
```

Expected: no errors (all store.ts imports removed)

- [ ] **Step 4: Run all public-api tests**

```bash
pnpm --filter @maphari/public-api test
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add services/public-api/src/routes/public-api.ts services/public-api/src/lib/key-store.ts
git rm services/public-api/src/lib/store.ts
git commit -m "feat(public-api): migrate routes to DB-backed key store, remove in-memory store.ts"
```

---

## Task 9: Tenant enforcement in route handlers

**Files:**
- Modify: `services/public-api/src/routes/public-api.ts`

The spec requires that `clientId` is **derived from the key record** (not trusted from client-supplied headers) and cross-checked against route params and body resource identifiers. After `verifyPublicApiRequest` returns `ok: true` with a `clientId`, each route handler must verify that the resource being accessed belongs to that `clientId`.

- [ ] **Step 1: Identify all routes that access client-scoped resources**

Open `services/public-api/src/routes/public-api.ts`. Identify each route handler that:
- Accepts a `clientId` as a URL param or query string
- Returns data scoped to a client
- Creates resources under a client

These are the routes that need tenant enforcement.

- [ ] **Step 2: Add a tenant guard helper**

Add this helper at the top of `public-api.ts` (or in a shared location):

```ts
function assertTenantMatch(
  authedClientId: string,
  requestedClientId: string | undefined,
  reply: FastifyReply
): boolean {
  if (requestedClientId && requestedClientId !== authedClientId) {
    reply.status(403).send({
      ok: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Requested resource does not belong to the authenticated client",
    });
    return false;
  }
  return true;
}
```

- [ ] **Step 3: Apply tenant guard in each route handler**

For each route that accepts a client-scoped resource identifier, add the check immediately after `verifyPublicApiRequest` succeeds:

```ts
const auth = await verifyPublicApiRequest(request, encryptionKey);
if (!auth.ok) {
  return reply.status(401).send({ ok: false, errorCode: auth.errorCode, errorMessage: auth.errorMessage });
}

// Tenant enforcement: derive clientId from key record, never from request
const requestedClientId =
  (request.params as Record<string, string>)?.clientId ??
  (request.body as Record<string, string>)?.clientId;

if (!assertTenantMatch(auth.clientId!, requestedClientId, reply)) return;
```

- [ ] **Step 4: TypeScript check**

```bash
pnpm --filter @maphari/public-api exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add services/public-api/src/routes/public-api.ts
git commit -m "feat(public-api): enforce key-derived tenant clientId against route/body resource ownership"
```

---

## Task 10: Notifications dual-path signature alignment

**Files:**
- Modify: `services/notifications/src/routes/notifications.ts`

- [ ] **Step 1: Add canonical signature verification path**

Open `services/notifications/src/routes/notifications.ts`. Find the callback verification section (around line 280-295). Add a dual-path verification function:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

function verifyCallbackSignature(
  rawBody: string,
  secret: string,
  headers: {
    "x-timestamp"?: string;
    "x-nonce"?: string;
    "x-api-signature"?: string;
    // Legacy header:
    "x-maphari-signature"?: string;
  },
  log: { warn: (obj: object) => void }
): boolean {
  const timestamp = headers["x-timestamp"];
  const signature = headers["x-api-signature"];

  // New canonical format: timestamp.rawBody
  if (timestamp && signature) {
    const payload = `${timestamp}.${rawBody}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    const sigBuf = Buffer.from(signature, "utf8");
    if (expectedBuf.length !== sigBuf.length) return false;
    return timingSafeEqual(expectedBuf, sigBuf);
  }

  // Legacy fallback: JSON.stringify(body) — accepted during migration window
  const legacySig = headers["x-maphari-signature"];
  if (legacySig) {
    log.warn({ event: "legacy_callback_signature", provider: headers["x-provider-name"] });
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    const legacyBuf = Buffer.from(legacySig, "utf8");
    if (expectedBuf.length !== legacyBuf.length) return false;
    return timingSafeEqual(expectedBuf, legacyBuf);
  }

  return false;
}
```

Replace the existing signature check in the callback route with a call to `verifyCallbackSignature(rawBody, callbackSecret, request.headers, request.log)`.

The raw body must be captured the same way as in `public-api`: ensure the notifications app also registers a content-type parser that stores `rawBody` on the request. Check `services/notifications/src/app.ts` and add the same `addContentTypeParser` pattern if not already present.

- [ ] **Step 2: TypeScript check**

```bash
pnpm --filter @maphari/notifications exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add services/notifications/src/routes/notifications.ts services/notifications/src/app.ts
git commit -m "feat(notifications): add dual-path canonical callback signature verification with migration fallback"
```

---

## Task 11: Schema parity CI check

**Files:**
- Create: `scripts/check-schema-parity.sh`

- [ ] **Step 1: Create parity check script**

Create `scripts/check-schema-parity.sh`:

```bash
#!/bin/bash
# Checks that PublicApiProject, PublicApiKey, PublicApiKeyStatus exist in both
# services/core/prisma/schema.prisma and services/public-api/prisma/schema.prisma.
set -e

CORE="services/core/prisma/schema.prisma"
PUBLIC_API="services/public-api/prisma/schema.prisma"
MODELS=("PublicApiProject" "PublicApiKey" "PublicApiKeyStatus")
FAIL=0

for MODEL in "${MODELS[@]}"; do
  if ! grep -q "model $MODEL\|enum $MODEL" "$CORE" 2>/dev/null; then
    echo "MISSING in core schema: $MODEL"
    FAIL=1
  fi
  if ! grep -q "model $MODEL\|enum $MODEL" "$PUBLIC_API" 2>/dev/null; then
    echo "MISSING in public-api schema: $MODEL"
    FAIL=1
  fi
done

if [ $FAIL -ne 0 ]; then
  echo "Schema parity check FAILED — PublicApi models must exist in both schemas"
  exit 1
fi

echo "Schema parity check OK"
```

```bash
chmod +x scripts/check-schema-parity.sh
```

- [ ] **Step 2: Verify it passes**

```bash
./scripts/check-schema-parity.sh
```

Expected: `Schema parity check OK`

- [ ] **Step 3: Commit**

```bash
git add scripts/check-schema-parity.sh
git commit -m "chore(ci): add schema parity check for PublicApi models across core and public-api"
```

---

## Task 12: Full verification

- [ ] **Step 1: Run all public-api tests**

```bash
pnpm --filter @maphari/public-api test
```

Expected: all PASS

- [ ] **Step 2: TypeScript check all affected services**

```bash
pnpm --filter @maphari/public-api exec tsc --noEmit
pnpm --filter @maphari/notifications exec tsc --noEmit
pnpm --filter @maphari/core exec tsc --noEmit
```

- [ ] **Step 3: Verify store.ts is gone**

```bash
ls services/public-api/src/lib/
```

Expected: `store.ts` absent; `crypto.ts`, `key-store.ts`, `auth.ts`, `prisma.ts`, `redis.ts`, `validate-env.ts` present

- [ ] **Step 4: Parity check**

```bash
./scripts/check-schema-parity.sh
```

Expected: OK

---

## Acceptance Criteria Checklist

- [ ] `store.ts` deleted; no in-memory arrays remain
- [ ] `public-api` has `@prisma/client` dependency and `prisma.ts` singleton
- [ ] `public-api` has Redis client and `redis.ts` module
- [ ] `DATABASE_URL`, `REDIS_URL`, `API_KEY_ENCRYPTION_KEY` validated at startup
- [ ] `PublicApiProject` and `PublicApiKey` models in both schemas
- [ ] Named `@relation` disambiguators on core schema; inverse arrays added to `Client`
- [ ] Migration run via `pnpm --filter @maphari/core prisma:deploy` before public-api starts
- [ ] Key secrets encrypted AES-256-GCM; raw secret returned only at creation
- [ ] `keyId` lookup enforces `status=ACTIVE` and expiry check
- [ ] Signature uses `${timestamp}.${rawBody}` canonical format
- [ ] Timestamp freshness enforced (±5 min)
- [ ] Nonce stored in Redis: `replay:${keyId}:${nonce}`, `NX EX 300`
- [ ] All HMAC comparisons use `timingSafeEqual`; never `===`
- [ ] `verifyPublicApiRequest` is async; all call sites use `await`
- [ ] Notifications dual-verification active with deprecation logging
- [ ] Raw-body capture via `preParsing` hook — does NOT replace global JSON parser; standard error behavior preserved
- [ ] Tenant enforcement: `clientId` derived from key record; cross-checked against route params/body resource identifiers
- [ ] Schema parity CI check script present and passing
