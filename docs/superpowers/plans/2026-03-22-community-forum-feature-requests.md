# Community Forum & Feature Requests — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a threaded Community Forum and a Feature-Requests voting board to the Maphari client portal, with anonymous client identities, admin moderation, and full gateway + frontend wiring.

**Architecture:** Extend `services/core` with two new route files and four new Prisma models; add two NestJS proxy controllers to the gateway; wire two portal API clients and two client-portal pages plus two admin pages in the Next.js app.

**Tech Stack:** TypeScript, Prisma (PostgreSQL), Fastify (core service), NestJS (gateway), Next.js 16 (web app), CSS Modules.

---

## Spec Reference

`docs/superpowers/specs/2026-03-22-community-forum-feature-requests-design.md`

---

## File Map

| File | Action |
|------|--------|
| `services/core/prisma/schema.prisma` | Add 4 models: `ForumThread`, `ForumPost`, `FeatureRequest`, `FeatureVote` |
| `services/core/src/lib/alias.ts` | **New** — deterministic `@adjective-animal` alias generator |
| `services/core/src/routes/forum.ts` | **New** — forum + admin moderation routes |
| `services/core/src/routes/feature-requests.ts` | **New** — feature request + vote routes |
| `services/core/src/app.ts` | Register 2 new route sets |
| `apps/gateway/src/routes/forum.controller.ts` | **New** — NestJS proxy for forum routes |
| `apps/gateway/src/routes/feature-requests.controller.ts` | **New** — NestJS proxy for feature-request routes |
| `apps/gateway/src/modules/app.module.ts` | Register 2 new controllers |
| `apps/web/src/lib/api/portal/forum.ts` | **New** — portal API client for forum |
| `apps/web/src/lib/api/portal/feature-requests.ts` | **New** — portal API client for feature requests |
| `apps/web/src/components/client/maphari-dashboard/config.ts` | Add 2 `PageId` entries + new `Community` `NavSection` |
| `apps/web/src/components/client/maphari-dashboard/pages/community-forum-page.tsx` | **New** — client forum UI |
| `apps/web/src/components/client/maphari-dashboard/pages/feature-requests-page.tsx` | **New** — client feature-requests UI |
| `apps/web/src/components/client/maphari-client-dashboard.tsx` | Mount 2 new pages |
| `apps/web/src/app/style/client/pages-misc.module.css` | Add forum + FR CSS classes |
| `apps/web/src/components/admin/dashboard/config.ts` | Add 2 `PageId` entries + 2 flat `NavItem` entries |
| `apps/web/src/components/admin/dashboard/constants.ts` | Add 2 `pageTitles` entries |
| `apps/web/src/components/admin/dashboard/pages/admin-community-moderation-page.tsx` | **New** — admin moderation queue UI |
| `apps/web/src/components/admin/dashboard/pages/admin-community-feature-requests-page.tsx` | **New** — admin FR manager UI |
| `apps/web/src/components/admin/maphari-dashboard.tsx` | Mount 2 new admin pages |
| `apps/web/src/app/style/admin/pages-misc.module.css` | Add admin community CSS classes |

---

## Task 1: DB Schema — 4 Prisma Models

**Files:**
- Modify: `services/core/prisma/schema.prisma`

- [ ] **Step 1: Open schema and append 4 new models at the very end (before the last line)**

Append the following to `services/core/prisma/schema.prisma`:

```prisma
model ForumThread {
  id         String      @id @default(uuid())
  category   String      // "tips" | "qa" | "announcements" | "general"
  title      String      @db.VarChar(200)
  authorId   String      // real userId — never exposed to other clients
  anonAlias  String      @db.VarChar(60)   // e.g. "@amber-falcon"
  isPinned   Boolean     @default(false)
  isLocked   Boolean     @default(false)
  isApproved Boolean     @default(false)
  isRejected Boolean     @default(false)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  posts      ForumPost[]

  @@index([category, isApproved])
  @@index([isApproved, createdAt])
  @@map("forum_threads")
}

model ForumPost {
  id         String      @id @default(uuid())
  threadId   String
  thread     ForumThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  authorId   String
  anonAlias  String      @db.VarChar(60)
  body       String      @db.Text
  isApproved Boolean     @default(false)
  isRejected Boolean     @default(false)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  @@index([threadId, isApproved])
  @@map("forum_posts")
}

model FeatureRequest {
  id          String        @id @default(uuid())
  category    String        // "portal-ux" | "reporting" | "integrations" | "delivery" | "billing" | "other"
  title       String        @db.VarChar(200)
  description String        @db.Text
  authorId    String
  anonAlias   String        @db.VarChar(60)
  status      String        @default("under_review") // "under_review" | "planned" | "in_progress" | "done" | "declined"
  voteCount   Int           @default(0)
  isApproved  Boolean       @default(false)
  isRejected  Boolean       @default(false)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  votes       FeatureVote[]

  @@index([category, status, isApproved])
  @@index([isApproved, voteCount])
  @@map("feature_requests")
}

model FeatureVote {
  id               String         @id @default(uuid())
  featureRequestId String
  featureRequest   FeatureRequest @relation(fields: [featureRequestId], references: [id], onDelete: Cascade)
  voterId          String
  createdAt        DateTime       @default(now())

  @@unique([featureRequestId, voterId])
  @@map("feature_votes")
}
```

- [ ] **Step 2: Run Prisma migration**

```bash
cd services/core && pnpm exec prisma migrate dev --name add_community_forum_feature_requests
```

Expected: migration file created, `prisma generate` runs automatically, client regenerated.

- [ ] **Step 3: Verify types exist**

```bash
cd services/core && grep -n "ForumThread\|ForumPost\|FeatureRequest\|FeatureVote" src/generated/prisma/index.d.ts | head -20
```

Expected: 4 model types present.

- [ ] **Step 4: Commit**

```bash
git add services/core/prisma/schema.prisma services/core/prisma/migrations/
git commit -m "feat: add ForumThread, ForumPost, FeatureRequest, FeatureVote prisma models"
```

---

## Task 2: Alias Utility

**Files:**
- Create: `services/core/src/lib/alias.ts`

- [ ] **Step 1: Create the alias utility**

Create `services/core/src/lib/alias.ts`:

```typescript
// Deterministic @adjective-animal alias generator.
// Given the same userId it always returns the same string.
// ~50 × ~50 = 2,500 unique combinations.

const ADJECTIVES = [
  "amber", "azure", "bold", "bright", "calm", "cobalt", "cool", "coral",
  "crisp", "crystal", "cyan", "dark", "dawn", "deep", "dusk", "emerald",
  "faded", "fierce", "fiery", "foggy", "forest", "frosty", "glowing",
  "golden", "grand", "green", "grey", "hazy", "icy", "indigo", "ivory",
  "jade", "keen", "lofty", "lunar", "misty", "neon", "noble", "obsidian",
  "onyx", "opal", "pine", "prism", "quiet", "rapid", "rose", "ruby",
  "scarlet", "serene", "shadow", "sharp", "silent", "silver", "slate",
];

const ANIMALS = [
  "albatross", "badger", "bear", "bison", "buck", "condor", "crane",
  "crow", "dingo", "dolphin", "dove", "eagle", "elk", "falcon", "finch",
  "fox", "gecko", "heron", "hound", "ibis", "jackal", "jaguar", "kestrel",
  "kite", "koala", "lemur", "leopard", "lynx", "mako", "marlin", "mink",
  "moose", "narwhal", "newt", "orca", "osprey", "otter", "panther", "puma",
  "raven", "robin", "sable", "salmon", "shark", "snipe", "sparrow", "swift",
  "tiger", "viper", "vole", "weasel", "wolf",
];

/**
 * Hash a string into a non-negative 32-bit integer using djb2.
 */
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0; // keep 32-bit signed
  }
  return Math.abs(hash);
}

/**
 * Generate a deterministic anonymous alias for a userId.
 * Example: generateAlias("user-abc-123") → "@amber-falcon"
 */
export function generateAlias(userId: string): string {
  const hash = djb2(userId);
  const adj = ADJECTIVES[hash % ADJECTIVES.length];
  const animal = ANIMALS[Math.floor(hash / ADJECTIVES.length) % ANIMALS.length];
  return `@${adj}-${animal}`;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd services/core && pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add services/core/src/lib/alias.ts
git commit -m "feat: add deterministic alias generator for anonymous community identities"
```

---

## Task 3: Core Forum Routes

**Files:**
- Create: `services/core/src/routes/forum.ts`

- [ ] **Step 1: Create the forum routes file**

Create `services/core/src/routes/forum.ts`:

```typescript
// ════════════════════════════════════════════════════════════════════════════
// forum.ts — Community Forum routes
// Service : core
// Scope   : CLIENT (read approved, create own) | ADMIN (moderate, approve, reject)
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";
import { generateAlias } from "../lib/alias.js";

export async function registerForumRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /portal/forum/threads ─────────────────────────────────────────────
  app.get("/portal/forum/threads", async (request) => {
    const scope = readScopeHeaders(request);
    const q = request.query as { category?: string; page?: string; limit?: string };
    const page = Math.max(1, parseInt(q.page ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where = {
      isApproved: true,
      isRejected: false,
      ...(q.category ? { category: q.category } : {}),
    };

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          category: true,
          title: true,
          anonAlias: true,
          isPinned: true,
          isLocked: true,
          createdAt: true,
          _count: { select: { posts: { where: { isApproved: true, isRejected: false } } } },
        },
      }),
      prisma.forumThread.count({ where }),
    ]);

    // Never expose authorId to clients
    const data = threads.map(({ _count, ...t }) => ({ ...t, replyCount: _count.posts }));
    return { success: true, data, meta: { requestId: scope.requestId, page, limit, total } } as ApiResponse<typeof data>;
  });

  // ── POST /portal/forum/threads ────────────────────────────────────────────
  app.post("/portal/forum/threads", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only clients may post threads." } } as ApiResponse);
    }
    const body = request.body as { category?: string; title?: string; body?: string };
    if (!body.category || !body.title) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "category and title are required." } } as ApiResponse);
    }
    const validCategories = ["tips", "qa", "announcements", "general"];
    if (!validCategories.includes(body.category)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: `category must be one of: ${validCategories.join(", ")}` } } as ApiResponse);
    }

    const anonAlias = generateAlias(scope.userId ?? scope.clientId ?? "unknown");
    const thread = await prisma.forumThread.create({
      data: {
        category: body.category,
        title: body.title.slice(0, 200),
        authorId: scope.userId ?? scope.clientId ?? "unknown",
        anonAlias,
        isApproved: false,
        isRejected: false,
      },
      select: { id: true, category: true, title: true, anonAlias: true, createdAt: true },
    });

    return reply.code(201).send({ success: true, data: thread, meta: { requestId: scope.requestId } } as ApiResponse<typeof thread>);
  });

  // ── GET /portal/forum/threads/:id ─────────────────────────────────────────
  app.get("/portal/forum/threads/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };

    const thread = await prisma.forumThread.findFirst({
      where: { id, isApproved: true, isRejected: false },
      select: {
        id: true,
        category: true,
        title: true,
        anonAlias: true,
        isPinned: true,
        isLocked: true,
        createdAt: true,
        posts: {
          where: { isApproved: true, isRejected: false },
          orderBy: { createdAt: "asc" },
          select: { id: true, anonAlias: true, body: true, createdAt: true },
        },
      },
    });

    if (!thread) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Thread not found." } } as ApiResponse);
    }

    return { success: true, data: thread, meta: { requestId: scope.requestId } } as ApiResponse<typeof thread>;
  });

  // ── POST /portal/forum/threads/:id/posts ──────────────────────────────────
  app.post("/portal/forum/threads/:id/posts", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only clients may reply." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { body?: string };
    if (!body.body?.trim()) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "body is required." } } as ApiResponse);
    }

    const thread = await prisma.forumThread.findFirst({ where: { id, isApproved: true, isRejected: false } });
    if (!thread) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Thread not found." } } as ApiResponse);
    }
    if (thread.isLocked) {
      return reply.code(409).send({ success: false, error: { code: "LOCKED", message: "Thread is locked." } } as ApiResponse);
    }

    const anonAlias = generateAlias(scope.userId ?? scope.clientId ?? "unknown");
    const post = await prisma.forumPost.create({
      data: {
        threadId: id,
        authorId: scope.userId ?? scope.clientId ?? "unknown",
        anonAlias,
        body: body.body,
        isApproved: false,
        isRejected: false,
      },
      select: { id: true, anonAlias: true, body: true, createdAt: true },
    });

    return reply.code(201).send({ success: true, data: post, meta: { requestId: scope.requestId } } as ApiResponse<typeof post>);
  });

  // ── PATCH /admin/forum/threads/:id ────────────────────────────────────────
  app.patch("/admin/forum/threads/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { isApproved?: boolean; isRejected?: boolean; isPinned?: boolean; isLocked?: boolean };

    const thread = await prisma.forumThread.update({
      where: { id },
      data: {
        ...(body.isApproved !== undefined ? { isApproved: body.isApproved } : {}),
        ...(body.isRejected !== undefined ? { isRejected: body.isRejected } : {}),
        ...(body.isPinned !== undefined ? { isPinned: body.isPinned } : {}),
        ...(body.isLocked !== undefined ? { isLocked: body.isLocked } : {}),
      },
      select: { id: true, isApproved: true, isRejected: true, isPinned: true, isLocked: true },
    });

    return { success: true, data: thread, meta: { requestId: scope.requestId } } as ApiResponse<typeof thread>;
  });

  // ── PATCH /admin/forum/posts/:id ──────────────────────────────────────────
  app.patch("/admin/forum/posts/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { isApproved?: boolean; isRejected?: boolean };

    const post = await prisma.forumPost.update({
      where: { id },
      data: {
        ...(body.isApproved !== undefined ? { isApproved: body.isApproved } : {}),
        ...(body.isRejected !== undefined ? { isRejected: body.isRejected } : {}),
      },
      select: { id: true, isApproved: true, isRejected: true },
    });

    return { success: true, data: post, meta: { requestId: scope.requestId } } as ApiResponse<typeof post>;
  });

  // ── GET /admin/forum/moderation-queue ─────────────────────────────────────
  app.get("/admin/forum/moderation-queue", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }

    const [threads, posts, featureRequests] = await Promise.all([
      prisma.forumThread.findMany({
        where: { isApproved: false, isRejected: false },
        orderBy: { createdAt: "asc" },
        select: { id: true, category: true, title: true, anonAlias: true, authorId: true, createdAt: true },
      }),
      prisma.forumPost.findMany({
        where: { isApproved: false, isRejected: false },
        orderBy: { createdAt: "asc" },
        select: { id: true, threadId: true, body: true, anonAlias: true, authorId: true, createdAt: true },
      }),
      prisma.featureRequest.findMany({
        where: { isApproved: false, isRejected: false },
        orderBy: { createdAt: "asc" },
        select: { id: true, category: true, title: true, description: true, anonAlias: true, authorId: true, createdAt: true },
      }),
    ]);

    const data = {
      threads: threads.map((t) => ({ ...t, type: "thread" as const })),
      posts: posts.map((p) => ({ ...p, type: "post" as const })),
      featureRequests: featureRequests.map((fr) => ({ ...fr, type: "feature_request" as const })),
      total: threads.length + posts.length + featureRequests.length,
    };

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });
}
```

- [ ] **Step 2: Check TypeScript**

```bash
cd services/core && pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add services/core/src/routes/forum.ts
git commit -m "feat: add core forum routes (threads, posts, admin moderation)"
```

---

## Task 4: Core Feature-Request Routes

**Files:**
- Create: `services/core/src/routes/feature-requests.ts`

- [ ] **Step 1: Create the feature-requests routes file**

Create `services/core/src/routes/feature-requests.ts`:

```typescript
// ════════════════════════════════════════════════════════════════════════════
// feature-requests.ts — Feature Request + Vote routes
// Service : core
// Scope   : CLIENT (list approved, submit, vote) | ADMIN (all records, moderate, update status)
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";
import { generateAlias } from "../lib/alias.js";

const VALID_CATEGORIES = ["portal-ux", "reporting", "integrations", "delivery", "billing", "other"];
const VALID_STATUSES = ["under_review", "planned", "in_progress", "done", "declined"];

export async function registerFeatureRequestRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /portal/feature-requests ──────────────────────────────────────────
  app.get("/portal/feature-requests", async (request) => {
    const scope = readScopeHeaders(request);
    const q = request.query as { category?: string; status?: string; sort?: string; page?: string; limit?: string };
    const page = Math.max(1, parseInt(q.page ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where = {
      isApproved: true,
      isRejected: false,
      ...(q.category ? { category: q.category } : {}),
      ...(q.status ? { status: q.status } : {}),
    };

    const orderBy = q.sort === "newest"
      ? { createdAt: "desc" as const }
      : { voteCount: "desc" as const };

    const [requests, total] = await Promise.all([
      prisma.featureRequest.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          category: true,
          title: true,
          description: true,
          anonAlias: true,
          status: true,
          voteCount: true,
          createdAt: true,
          // Include voter IDs so frontend can highlight if current user voted
          votes: { select: { voterId: true } },
        },
      }),
      prisma.featureRequest.count({ where }),
    ]);

    // Strip authorId from every response
    return { success: true, data: requests, meta: { requestId: scope.requestId, page, limit, total } } as ApiResponse<typeof requests>;
  });

  // ── POST /portal/feature-requests ─────────────────────────────────────────
  app.post("/portal/feature-requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only clients may submit feature requests." } } as ApiResponse);
    }
    const body = request.body as { category?: string; title?: string; description?: string };
    if (!body.category || !body.title || !body.description) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "category, title, and description are required." } } as ApiResponse);
    }
    if (!VALID_CATEGORIES.includes(body.category)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: `category must be one of: ${VALID_CATEGORIES.join(", ")}` } } as ApiResponse);
    }

    const anonAlias = generateAlias(scope.userId ?? scope.clientId ?? "unknown");
    const fr = await prisma.featureRequest.create({
      data: {
        category: body.category,
        title: body.title.slice(0, 200),
        description: body.description,
        authorId: scope.userId ?? scope.clientId ?? "unknown",
        anonAlias,
        isApproved: false,
        isRejected: false,
      },
      select: { id: true, category: true, title: true, anonAlias: true, status: true, createdAt: true },
    });

    return reply.code(201).send({ success: true, data: fr, meta: { requestId: scope.requestId } } as ApiResponse<typeof fr>);
  });

  // ── POST /portal/feature-requests/:id/vote ────────────────────────────────
  app.post("/portal/feature-requests/:id/vote", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only clients may vote." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const voterId = scope.userId ?? scope.clientId ?? "unknown";

    const fr = await prisma.featureRequest.findFirst({ where: { id, isApproved: true, isRejected: false } });
    if (!fr) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Feature request not found." } } as ApiResponse);
    }
    // Clients cannot vote on their own submission
    if (fr.authorId === voterId) {
      return reply.code(409).send({ success: false, error: { code: "SELF_VOTE", message: "You cannot vote on your own submission." } } as ApiResponse);
    }

    let voted: boolean;
    await prisma.$transaction(async (tx) => {
      const existing = await tx.featureVote.findUnique({
        where: { featureRequestId_voterId: { featureRequestId: id, voterId } },
      });
      if (existing) {
        await tx.featureVote.delete({ where: { id: existing.id } });
        await tx.featureRequest.update({ where: { id }, data: { voteCount: { decrement: 1 } } });
        voted = false;
      } else {
        await tx.featureVote.create({ data: { featureRequestId: id, voterId } });
        await tx.featureRequest.update({ where: { id }, data: { voteCount: { increment: 1 } } });
        voted = true;
      }
    });

    const updated = await prisma.featureRequest.findUnique({ where: { id }, select: { voteCount: true } });
    return { success: true, data: { voted: voted!, voteCount: updated?.voteCount ?? 0 }, meta: { requestId: scope.requestId } } as ApiResponse;
  });

  // ── PATCH /admin/feature-requests/:id ─────────────────────────────────────
  app.patch("/admin/feature-requests/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { isApproved?: boolean; isRejected?: boolean; status?: string };

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: `status must be one of: ${VALID_STATUSES.join(", ")}` } } as ApiResponse);
    }

    const fr = await prisma.featureRequest.update({
      where: { id },
      data: {
        ...(body.isApproved !== undefined ? { isApproved: body.isApproved } : {}),
        ...(body.isRejected !== undefined ? { isRejected: body.isRejected } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
      select: { id: true, isApproved: true, isRejected: true, status: true, voteCount: true },
    });

    return { success: true, data: fr, meta: { requestId: scope.requestId } } as ApiResponse<typeof fr>;
  });

  // ── GET /admin/feature-requests ───────────────────────────────────────────
  app.get("/admin/feature-requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const q = request.query as { sort?: string };
    const orderBy = q.sort === "newest" ? { createdAt: "desc" as const } : { voteCount: "desc" as const };

    const requests = await prisma.featureRequest.findMany({
      orderBy,
      select: {
        id: true,
        category: true,
        title: true,
        authorId: true,  // admin sees real authorId for company lookup
        anonAlias: true,
        status: true,
        voteCount: true,
        isApproved: true,
        isRejected: true,
        createdAt: true,
      },
    });

    return { success: true, data: requests, meta: { requestId: scope.requestId } } as ApiResponse<typeof requests>;
  });
}
```

- [ ] **Step 2: Check TypeScript**

```bash
cd services/core && pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add services/core/src/routes/feature-requests.ts
git commit -m "feat: add core feature-request routes (submit, vote toggle, admin)"
```

---

## Task 5: Register Core Routes in app.ts

**Files:**
- Modify: `services/core/src/app.ts`

- [ ] **Step 1: Add imports**

In `services/core/src/app.ts`, find the last import block (around line 116, just before `export async function createCoreApp`). Add:

```typescript
// ── Community Forum & Feature Requests ────────────────────────────────────
import { registerForumRoutes } from "./routes/forum.js";
import { registerFeatureRequestRoutes } from "./routes/feature-requests.js";
```

- [ ] **Step 2: Register routes**

In `createCoreApp()`, find the last `await register` call (`await registerStaffScheduleRoutes(app)` around line 278). Add directly after it, before `return app`:

```typescript
  // ── Community Forum & Feature Requests ────────────────────────────────────
  await registerForumRoutes(app);
  await registerFeatureRequestRoutes(app);
```

- [ ] **Step 3: Check TypeScript**

```bash
cd services/core && pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add services/core/src/app.ts
git commit -m "feat: register forum and feature-request routes in core service"
```

---

## Task 6: Gateway Forum Controller

**Files:**
- Create: `apps/gateway/src/routes/forum.controller.ts`

- [ ] **Step 1: Create the controller**

Create `apps/gateway/src/routes/forum.controller.ts`:

```typescript
import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class ForumController {
  private get baseUrl(): string {
    return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  }

  private headers(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
    return {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? "",
    };
  }

  // ── Portal routes ─────────────────────────────────────────────────────────

  @Roles("CLIENT")
  @Get("portal/forum/threads")
  async listThreads(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    const q = query as Record<string, string>;
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(q).filter(([, v]) => v))).toString();
    return proxyRequest(`${this.baseUrl}/portal/forum/threads${qs ? `?${qs}` : ""}`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("CLIENT")
  @Post("portal/forum/threads")
  async createThread(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/portal/forum/threads`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("CLIENT")
  @Get("portal/forum/threads/:id")
  async getThread(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/portal/forum/threads/${id}`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("CLIENT")
  @Post("portal/forum/threads/:id/posts")
  async createPost(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/portal/forum/threads/${id}/posts`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── Admin routes ──────────────────────────────────────────────────────────

  @Roles("ADMIN")
  @Get("admin/forum/moderation-queue")
  async getModerationQueue(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/admin/forum/moderation-queue`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Patch("admin/forum/threads/:id")
  async moderateThread(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/admin/forum/threads/${id}`, "PATCH", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Patch("admin/forum/posts/:id")
  async moderatePost(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/admin/forum/posts/${id}`, "PATCH", body, this.headers(userId, role, clientId, requestId, traceId));
  }
}
```

- [ ] **Step 2: Check TypeScript**

```bash
cd apps/gateway && pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/gateway/src/routes/forum.controller.ts
git commit -m "feat: add gateway NestJS ForumController proxying core forum routes"
```

---

## Task 7: Gateway Feature-Requests Controller

**Files:**
- Create: `apps/gateway/src/routes/feature-requests.controller.ts`

- [ ] **Step 1: Create the controller**

Create `apps/gateway/src/routes/feature-requests.controller.ts`:

```typescript
import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class FeatureRequestsController {
  private get baseUrl(): string {
    return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  }

  private headers(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
    return {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? "",
    };
  }

  // ── Portal routes ─────────────────────────────────────────────────────────

  @Roles("CLIENT")
  @Get("portal/feature-requests")
  async listFeatureRequests(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    const q = query as Record<string, string>;
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(q).filter(([, v]) => v))).toString();
    return proxyRequest(`${this.baseUrl}/portal/feature-requests${qs ? `?${qs}` : ""}`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("CLIENT")
  @Post("portal/feature-requests")
  async submitFeatureRequest(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/portal/feature-requests`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("CLIENT")
  @Post("portal/feature-requests/:id/vote")
  async toggleVote(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/portal/feature-requests/${id}/vote`, "POST", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── Admin routes ──────────────────────────────────────────────────────────

  @Roles("ADMIN")
  @Get("admin/feature-requests")
  async adminListFeatureRequests(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    const q = query as Record<string, string>;
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(q).filter(([, v]) => v))).toString();
    return proxyRequest(`${this.baseUrl}/admin/feature-requests${qs ? `?${qs}` : ""}`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Patch("admin/feature-requests/:id")
  async adminUpdateFeatureRequest(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/admin/feature-requests/${id}`, "PATCH", body, this.headers(userId, role, clientId, requestId, traceId));
  }
}
```

- [ ] **Step 2: Check TypeScript**

```bash
cd apps/gateway && pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/gateway/src/routes/feature-requests.controller.ts
git commit -m "feat: add gateway NestJS FeatureRequestsController"
```

---

## Task 8: Register Gateway Controllers in app.module.ts

**Files:**
- Modify: `apps/gateway/src/modules/app.module.ts`

- [ ] **Step 1: Add imports**

In `app.module.ts`, find the last two import lines (e.g. `import { SurveyController }...` and `import { MetricsController }...`). Append after them:

```typescript
import { ForumController } from "../routes/forum.controller.js";
import { FeatureRequestsController } from "../routes/feature-requests.controller.js";
```

- [ ] **Step 2: Add to controllers array**

Find `MetricsController` in the `controllers: [...]` array (last entry). Change:
```typescript
    MetricsController
```
to:
```typescript
    MetricsController,
    ForumController,
    FeatureRequestsController,
```

- [ ] **Step 3: Check TypeScript**

```bash
cd apps/gateway && pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/gateway/src/modules/app.module.ts
git commit -m "feat: register ForumController and FeatureRequestsController in gateway"
```

---

## Task 9: Portal API Client — Forum

**Files:**
- Create: `apps/web/src/lib/api/portal/forum.ts`

- [ ] **Step 1: Create the portal API client**

Create `apps/web/src/lib/api/portal/forum.ts`:

```typescript
import type { Session } from "next-auth";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./internal";

export interface ForumThread {
  id: string;
  category: string;
  title: string;
  anonAlias: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  replyCount: number;
}

export interface ForumPost {
  id: string;
  anonAlias: string;
  body: string;
  createdAt: string;
}

export interface ForumThreadDetail extends Omit<ForumThread, "replyCount"> {
  posts: ForumPost[];
}

export interface ForumThreadListMeta {
  page: number;
  limit: number;
  total: number;
  requestId?: string;
}

/** List approved threads, optionally filtered by category. */
export async function loadPortalForumThreadsWithRefresh(
  session: Session,
  params?: { category?: string; page?: number; limit?: number },
): Promise<{ data: ForumThread[]; meta: ForumThreadListMeta }> {
  return withAuthorizedSession(session, async (headers) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const url = `/portal/forum/threads${qs.toString() ? `?${qs}` : ""}`;
    const res = await callGateway(url, "GET", undefined, headers);
    if (!res.success) throw toGatewayError(res);
    if (isUnauthorized(res)) throw toGatewayError(res);
    return res as { data: ForumThread[]; meta: ForumThreadListMeta };
  });
}

/** Get a single thread with its approved posts. */
export async function loadPortalForumThreadWithRefresh(
  session: Session,
  threadId: string,
): Promise<ForumThreadDetail> {
  return withAuthorizedSession(session, async (headers) => {
    const res = await callGateway(`/portal/forum/threads/${threadId}`, "GET", undefined, headers);
    if (!res.success) throw toGatewayError(res);
    return (res as { data: ForumThreadDetail }).data;
  });
}

/** Create a new thread (pending admin approval). */
export async function createPortalForumThreadWithRefresh(
  session: Session,
  body: { category: string; title: string },
): Promise<{ id: string; category: string; title: string; anonAlias: string; createdAt: string }> {
  return withAuthorizedSession(session, async (headers) => {
    const res = await callGateway("/portal/forum/threads", "POST", body, headers);
    if (!res.success) throw toGatewayError(res);
    return (res as { data: { id: string; category: string; title: string; anonAlias: string; createdAt: string } }).data;
  });
}

/** Reply to a thread (pending admin approval). */
export async function createPortalForumPostWithRefresh(
  session: Session,
  threadId: string,
  body: { body: string },
): Promise<ForumPost> {
  return withAuthorizedSession(session, async (headers) => {
    const res = await callGateway(`/portal/forum/threads/${threadId}/posts`, "POST", body, headers);
    if (!res.success) throw toGatewayError(res);
    return (res as { data: ForumPost }).data;
  });
}
```

- [ ] **Step 2: Check TypeScript**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/api/portal/forum.ts
git commit -m "feat: add portal API client for community forum"
```

---

## Task 10: Portal API Client — Feature Requests

**Files:**
- Create: `apps/web/src/lib/api/portal/feature-requests.ts`

- [ ] **Step 1: Create the portal API client**

Create `apps/web/src/lib/api/portal/feature-requests.ts`:

```typescript
import type { Session } from "next-auth";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./internal";

export interface FeatureRequest {
  id: string;
  category: string;
  title: string;
  description: string;
  anonAlias: string;
  status: string;
  voteCount: number;
  createdAt: string;
  votes: Array<{ voterId: string }>;
}

export interface FeatureRequestListMeta {
  page: number;
  limit: number;
  total: number;
  requestId?: string;
}

/** List approved feature requests. */
export async function loadPortalFeatureRequestsWithRefresh(
  session: Session,
  params?: { category?: string; status?: string; sort?: "votes" | "newest"; page?: number; limit?: number },
): Promise<{ data: FeatureRequest[]; meta: FeatureRequestListMeta }> {
  return withAuthorizedSession(session, async (headers) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.status) qs.set("status", params.status);
    if (params?.sort) qs.set("sort", params.sort === "newest" ? "newest" : "votes");
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const url = `/portal/feature-requests${qs.toString() ? `?${qs}` : ""}`;
    const res = await callGateway(url, "GET", undefined, headers);
    if (!res.success) throw toGatewayError(res);
    if (isUnauthorized(res)) throw toGatewayError(res);
    return res as { data: FeatureRequest[]; meta: FeatureRequestListMeta };
  });
}

/** Submit a new feature request (pending admin approval). */
export async function submitPortalFeatureRequestWithRefresh(
  session: Session,
  body: { category: string; title: string; description: string },
): Promise<{ id: string; category: string; title: string; anonAlias: string; status: string; createdAt: string }> {
  return withAuthorizedSession(session, async (headers) => {
    const res = await callGateway("/portal/feature-requests", "POST", body, headers);
    if (!res.success) throw toGatewayError(res);
    return (res as { data: { id: string; category: string; title: string; anonAlias: string; status: string; createdAt: string } }).data;
  });
}

/** Toggle vote on a feature request (idempotent). */
export async function togglePortalFeatureVoteWithRefresh(
  session: Session,
  requestId: string,
): Promise<{ voted: boolean; voteCount: number }> {
  return withAuthorizedSession(session, async (headers) => {
    const res = await callGateway(`/portal/feature-requests/${requestId}/vote`, "POST", undefined, headers);
    if (!res.success) throw toGatewayError(res);
    return (res as { data: { voted: boolean; voteCount: number } }).data;
  });
}
```

- [ ] **Step 2: Check TypeScript**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/api/portal/feature-requests.ts
git commit -m "feat: add portal API client for feature requests"
```

---

## Task 11: Client Portal Config — PageIds + NavSection

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/config.ts`

- [ ] **Step 1: Add two new PageId entries to the union**

Find the last line of the `PageId` union (`| "offboarding";`). Change:
```typescript
  | "offboarding";
```
to:
```typescript
  | "offboarding"
  | "communityForum"
  | "featureRequests";
```

- [ ] **Step 2: Add the Community NavSection**

Find the closing `]` of the `navSections` array (the last `},` before the final `]`). Append a new section just before the final `]`:

```typescript
  {
    title: "Community",
    items: [
      { id: "communityForum", label: "Forum" },
      { id: "featureRequests", label: "Feature Requests" },
    ],
  },
```

- [ ] **Step 3: Check TypeScript**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/client/maphari-dashboard/config.ts
git commit -m "feat: add communityForum and featureRequests to client portal nav"
```

---

## Task 12: Client Forum Page + CSS

**Files:**
- Create: `apps/web/src/components/client/maphari-dashboard/pages/community-forum-page.tsx`
- Modify: `apps/web/src/app/style/client/pages-misc.module.css`

- [ ] **Step 1: Add CSS classes to pages-misc.module.css**

Append the following at the end of `apps/web/src/app/style/client/pages-misc.module.css`:

```css
/* ── Community Forum ──────────────────────────────────────────────────── */
.forumPage { display: flex; flex-direction: column; gap: 20px; }
.forumHeader { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.forumPrivacyNotice { font-size: 12px; color: rgba(255,255,255,.4); margin-top: -12px; }
.forumCategoryTabs { display: flex; gap: 6px; flex-wrap: wrap; }
.forumTab { padding: 5px 14px; border-radius: var(--r-sm); border: 1px solid var(--b2); background: transparent; color: rgba(255,255,255,.5); font-size: 12px; cursor: pointer; transition: all .15s; }
.forumTab:hover { border-color: var(--b3); color: rgba(255,255,255,.8); }
.forumTabActive { border-color: var(--lime); color: var(--lime); background: var(--lime-g); }
.forumThreadList { display: flex; flex-direction: column; gap: 8px; }
.forumThreadRow { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; background: var(--s1); border: 1px solid var(--b2); border-radius: var(--r-md); cursor: pointer; transition: border-color .15s; }
.forumThreadRow:hover { border-color: var(--b3); }
.forumPinned { border-left: 2px solid var(--lime); }
.forumThreadAvatar { width: 32px; height: 32px; border-radius: 50%; background: var(--s2); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.forumThreadMeta { flex: 1; min-width: 0; }
.forumThreadTitle { font-size: 13px; font-weight: 600; color: var(--text, #e8e8f0); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.forumAlias { font-size: 11px; color: rgba(255,255,255,.4); }
.forumCategoryBadge { display: inline-block; font-size: 10px; padding: 1px 8px; border-radius: 10px; background: rgba(139,111,255,.12); color: #8b6fff; margin-right: 6px; }
.forumReplyCount { font-size: 11px; color: rgba(255,255,255,.4); }
.forumLocked { opacity: .55; }
.forumDetailView { background: var(--s1); border: 1px solid var(--b2); border-radius: var(--r-md); padding: 16px; }
.forumPostRow { padding: 10px 0; border-bottom: 1px solid var(--b1); }
.forumPostRow:last-child { border-bottom: none; }
.forumReplyForm { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }

@media (max-width: 900px) {
  .forumCategoryTabs { gap: 4px; }
  .forumThreadRow { gap: 8px; }
}
```

- [ ] **Step 2: Create the forum page component**

Create `apps/web/src/components/client/maphari-dashboard/pages/community-forum-page.tsx`:

```tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import type { Session } from "next-auth";
import {
  loadPortalForumThreadsWithRefresh,
  loadPortalForumThreadWithRefresh,
  createPortalForumThreadWithRefresh,
  createPortalForumPostWithRefresh,
  type ForumThread,
  type ForumThreadDetail,
} from "@/lib/api/portal/forum";
import { useStyles } from "../style";

interface Props {
  session: Session;
  onNotify?: (msg: string, type?: "success" | "error") => void;
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "tips", label: "💡 Tips & Tricks" },
  { id: "qa", label: "❓ Q&A" },
  { id: "announcements", label: "📢 Announcements" },
  { id: "general", label: "☕ General" },
] as const;

const CATEGORY_EMOJIS: Record<string, string> = { tips: "💡", qa: "❓", announcements: "📢", general: "☕" };

export function CommunityForumPage({ session, onNotify }: Props) {
  const s = useStyles();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedThread, setSelectedThread] = useState<ForumThreadDetail | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);

  // New thread form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  // Reply form
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await loadPortalForumThreadsWithRefresh(session, {
        category: activeCategory === "all" ? undefined : activeCategory,
      });
      setThreads(res.data);
    } catch {
      onNotify?.("Failed to load threads", "error");
    } finally {
      setLoading(false);
    }
  }, [session, activeCategory, onNotify]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  async function openThread(id: string) {
    try {
      const detail = await loadPortalForumThreadWithRefresh(session, id);
      setSelectedThread(detail);
    } catch {
      onNotify?.("Failed to load thread", "error");
    }
  }

  async function handleCreateThread() {
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      await createPortalForumThreadWithRefresh(session, { category: newCategory, title: newTitle });
      setNewTitle("");
      setShowNewThread(false);
      onNotify?.("Thread submitted — pending review", "success");
    } catch {
      onNotify?.("Failed to submit thread", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply() {
    if (!replyBody.trim() || !selectedThread) return;
    setReplying(true);
    try {
      await createPortalForumPostWithRefresh(session, selectedThread.id, { body: replyBody });
      setReplyBody("");
      onNotify?.("Reply submitted — pending review", "success");
    } catch {
      onNotify?.("Failed to submit reply", "error");
    } finally {
      setReplying(false);
    }
  }

  if (selectedThread) {
    return (
      <div className={s("forumPage")}>
        <div className={s("forumHeader")}>
          <button className={s("btnSecondary")} onClick={() => setSelectedThread(null)}>← Back to Forum</button>
        </div>
        <div className={s("forumDetailView")}>
          <div className={s("forumCategoryBadge")}>{CATEGORY_EMOJIS[selectedThread.category] ?? "📋"} {selectedThread.category}</div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "8px 0 4px" }}>{selectedThread.title}</h2>
          <div className={s("forumAlias")}>{selectedThread.anonAlias}</div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 0 }}>
            {selectedThread.posts.map((post) => (
              <div key={post.id} className={s("forumPostRow")}>
                <div className={s("forumAlias")} style={{ marginBottom: 4 }}>{post.anonAlias}</div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.85)", margin: 0 }}>{post.body}</p>
              </div>
            ))}
          </div>
          {!selectedThread.isLocked && (
            <div className={s("forumReplyForm")}>
              <textarea
                className={s("textarea")}
                rows={3}
                placeholder="Write a reply…"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
              />
              <button className={s("btnAccent")} onClick={handleReply} disabled={replying || !replyBody.trim()}>
                {replying ? "Posting…" : "Post Reply"}
              </button>
            </div>
          )}
          {selectedThread.isLocked && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 12 }}>🔒 This thread is locked</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={s("forumPage")}>
      <div className={s("forumHeader")}>
        <h1 className={s("pageTitle")}>Community Forum</h1>
        <button className={s("btnAccent")} onClick={() => setShowNewThread(true)}>+ New Thread</button>
      </div>
      <p className={s("forumPrivacyNotice")}>All posts are anonymous — your identity is never shown to other clients</p>

      {showNewThread && (
        <div className={s("forumDetailView")}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>New Thread</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              className={s("input")}
              type="text"
              placeholder="Thread title…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={200}
            />
            <select className={s("select")} value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              {CATEGORIES.slice(1).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={s("btnAccent")} onClick={handleCreateThread} disabled={submitting || !newTitle.trim()}>
                {submitting ? "Submitting…" : "Submit"}
              </button>
              <button className={s("btnSecondary")} onClick={() => setShowNewThread(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className={s("forumCategoryTabs")}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={s("forumTab", activeCategory === cat.id ? "forumTabActive" : "")}
            onClick={() => { setActiveCategory(cat.id); setSelectedThread(null); }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>Loading…</p>
      ) : threads.length === 0 ? (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>No threads yet. Be the first to post!</p>
      ) : (
        <div className={s("forumThreadList")}>
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={s("forumThreadRow", thread.isPinned ? "forumPinned" : "", thread.isLocked ? "forumLocked" : "")}
              onClick={() => openThread(thread.id)}
            >
              <div className={s("forumThreadAvatar")}>{CATEGORY_EMOJIS[thread.category] ?? "📋"}</div>
              <div className={s("forumThreadMeta")}>
                <div className={s("forumThreadTitle")}>
                  {thread.isPinned && "📌 "}
                  {thread.isLocked && "🔒 "}
                  {thread.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={s("forumCategoryBadge")}>{thread.category}</span>
                  <span className={s("forumAlias")}>{thread.anonAlias}</span>
                  <span className={s("forumReplyCount")}>{thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Check TypeScript**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/client/maphari-dashboard/pages/community-forum-page.tsx apps/web/src/app/style/client/pages-misc.module.css
git commit -m "feat: add CommunityForumPage component and forum CSS classes"
```

---

## Task 13: Client Feature-Requests Page + CSS

**Files:**
- Create: `apps/web/src/components/client/maphari-dashboard/pages/feature-requests-page.tsx`
- Modify: `apps/web/src/app/style/client/pages-misc.module.css`

- [ ] **Step 1: Append feature-requests CSS to pages-misc.module.css**

Append to `apps/web/src/app/style/client/pages-misc.module.css`:

```css
/* ── Feature Requests ────────────────────────────────────────────────────── */
.frPage { display: flex; flex-direction: column; gap: 20px; }
.frHeader { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.frFilters { display: flex; gap: 8px; flex-wrap: wrap; }
.frList { display: flex; flex-direction: column; gap: 8px; }
.frCard { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; background: var(--s1); border: 1px solid var(--b2); border-radius: var(--r-md); transition: border-color .15s; }
.frCard:hover { border-color: var(--b3); }
.frVoteBtn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 10px; border-radius: var(--r-sm); border: 1px solid var(--b2); background: transparent; color: rgba(255,255,255,.5); cursor: pointer; min-width: 44px; transition: all .15s; flex-shrink: 0; }
.frVoteBtn:hover { border-color: var(--b3); color: rgba(255,255,255,.85); }
.frVoteBtnActive { border-color: var(--lime); color: var(--lime); background: var(--lime-g); }
.frVoteCount { font-size: 14px; font-weight: 700; }
.frVoteArrow { font-size: 14px; line-height: 1; }
.frMeta { flex: 1; min-width: 0; }
.frTitle { font-size: 13px; font-weight: 600; color: var(--text, #e8e8f0); margin-bottom: 4px; }
.frDesc { font-size: 12px; color: rgba(255,255,255,.5); margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.frBadgeRow { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.frCategoryBadge { font-size: 10px; padding: 1px 8px; border-radius: 10px; background: rgba(255,255,255,.06); color: rgba(255,255,255,.5); }
.frStatusBadge { font-size: 10px; padding: 1px 8px; border-radius: 10px; background: rgba(255,255,255,.06); color: rgba(255,255,255,.4); }
.frStatusPlanned { background: rgba(139,111,255,.15); color: #8b6fff; }
.frStatusInProgress { background: rgba(255,193,7,.12); color: #ffc107; }
.frStatusDone { background: rgba(80,200,120,.12); color: #50c878; }
.frStatusDeclined { background: rgba(255,80,80,.08); color: rgba(255,80,80,.5); text-decoration: line-through; }

@media (max-width: 900px) {
  .frFilters { gap: 6px; }
  .frCard { gap: 8px; }
}
```

- [ ] **Step 2: Create the feature-requests page component**

Create `apps/web/src/components/client/maphari-dashboard/pages/feature-requests-page.tsx`:

```tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import type { Session } from "next-auth";
import {
  loadPortalFeatureRequestsWithRefresh,
  submitPortalFeatureRequestWithRefresh,
  togglePortalFeatureVoteWithRefresh,
  type FeatureRequest,
} from "@/lib/api/portal/feature-requests";
import { useStyles } from "../style";

interface Props {
  session: Session;
  onNotify?: (msg: string, type?: "success" | "error") => void;
}

const FR_CATEGORIES = [
  { id: "portal-ux", label: "🖥 Portal UX" },
  { id: "reporting", label: "📊 Reporting" },
  { id: "integrations", label: "🔗 Integrations" },
  { id: "delivery", label: "🚀 Project Delivery" },
  { id: "billing", label: "💰 Billing" },
  { id: "other", label: "✨ Other" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  under_review: "Under Review",
  planned: "Planned",
  in_progress: "In Progress",
  done: "Done",
  declined: "Declined",
};

function statusClass(status: string, s: (a: string) => string): string {
  if (status === "planned") return s("frStatusBadge frStatusPlanned");
  if (status === "in_progress") return s("frStatusBadge frStatusInProgress");
  if (status === "done") return s("frStatusBadge frStatusDone");
  if (status === "declined") return s("frStatusBadge frStatusDeclined");
  return s("frStatusBadge");
}

export function FeatureRequestsPage({ session, onNotify }: Props) {
  const s = useStyles();
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"votes" | "newest">("votes");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Submit form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("portal-ux");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = (session.user as { id?: string })?.id ?? "";

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await loadPortalFeatureRequestsWithRefresh(session, {
        sort,
        category: filterCategory || undefined,
        status: filterStatus || undefined,
      });
      setRequests(res.data);
    } catch {
      onNotify?.("Failed to load feature requests", "error");
    } finally {
      setLoading(false);
    }
  }, [session, sort, filterCategory, filterStatus, onNotify]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleVote(id: string) {
    try {
      const result = await togglePortalFeatureVoteWithRefresh(session, id);
      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const newVotes = result.voted
            ? [...r.votes, { voterId: currentUserId }]
            : r.votes.filter((v) => v.voterId !== currentUserId);
          return { ...r, voteCount: result.voteCount, votes: newVotes };
        })
      );
    } catch {
      onNotify?.("Failed to record vote", "error");
    }
  }

  async function handleSubmit() {
    if (!newTitle.trim() || !newDescription.trim()) return;
    setSubmitting(true);
    try {
      await submitPortalFeatureRequestWithRefresh(session, {
        category: newCategory,
        title: newTitle,
        description: newDescription,
      });
      setNewTitle("");
      setNewDescription("");
      setShowForm(false);
      onNotify?.("Idea submitted — pending review", "success");
    } catch {
      onNotify?.("Failed to submit idea", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={s("frPage")}>
      <div className={s("frHeader")}>
        <h1 className={s("pageTitle")}>Feature Requests</h1>
        <button className={s("btnAccent")} onClick={() => setShowForm(true)}>+ Submit Idea</button>
      </div>

      {showForm && (
        <div className={s("forumDetailView")}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Submit an Idea</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              className={s("input")}
              type="text"
              placeholder="Title (max 200 chars)…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={200}
            />
            <select className={s("select")} value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              {FR_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <textarea
              className={s("textarea")}
              rows={3}
              placeholder="Describe your idea…"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className={s("btnAccent")} onClick={handleSubmit} disabled={submitting || !newTitle.trim() || !newDescription.trim()}>
                {submitting ? "Submitting…" : "Submit"}
              </button>
              <button className={s("btnSecondary")} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className={s("frFilters")}>
        <select className={s("select")} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ fontSize: 12 }}>
          <option value="">All Categories</option>
          {FR_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select className={s("select")} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ fontSize: 12 }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={s("select")} value={sort} onChange={(e) => setSort(e.target.value as "votes" | "newest")} style={{ fontSize: 12 }}>
          <option value="votes">Most Voted</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>Loading…</p>
      ) : requests.length === 0 ? (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>No feature requests yet. Submit the first idea!</p>
      ) : (
        <div className={s("frList")}>
          {requests.map((fr) => {
            const hasVoted = fr.votes.some((v) => v.voterId === currentUserId);
            const isOwnSubmission = false; // authorId is never returned from portal endpoint

            return (
              <div key={fr.id} className={s("frCard")}>
                <button
                  className={s("frVoteBtn", hasVoted ? "frVoteBtnActive" : "")}
                  onClick={() => !isOwnSubmission && handleVote(fr.id)}
                  disabled={isOwnSubmission}
                  title={isOwnSubmission ? "You cannot vote on your own submission" : hasVoted ? "Remove vote" : "Vote for this"}
                >
                  <span className={s("frVoteArrow")}>▲</span>
                  <span className={s("frVoteCount")}>{fr.voteCount}</span>
                </button>
                <div className={s("frMeta")}>
                  <div className={s("frTitle")}>{fr.title}</div>
                  <div className={s("frDesc")}>{fr.description}</div>
                  <div className={s("frBadgeRow")}>
                    <span className={s("frCategoryBadge")}>{fr.category}</span>
                    <span className={statusClass(fr.status, s)}>{STATUS_LABELS[fr.status] ?? fr.status}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>{fr.anonAlias}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Check TypeScript**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/client/maphari-dashboard/pages/feature-requests-page.tsx apps/web/src/app/style/client/pages-misc.module.css
git commit -m "feat: add FeatureRequestsPage component and FR CSS classes"
```

---

## Task 14: Wire Client Dashboard

**Files:**
- Modify: `apps/web/src/components/client/maphari-client-dashboard.tsx`

- [ ] **Step 1: Add imports**

In `maphari-client-dashboard.tsx`, find the last import block for pages (near the bottom of the imports). Add:

```typescript
import { CommunityForumPage } from "./maphari-dashboard/pages/community-forum-page";
import { FeatureRequestsPage } from "./maphari-dashboard/pages/feature-requests-page";
```

- [ ] **Step 2: Mount the pages**

Find where pages are rendered (the large `{page === "..." ? <Component ...> : null}` block). Find the last page entry and add after it:

```tsx
{page === "communityForum" ? <CommunityForumPage session={session} onNotify={pageNotify} /> : null}
{page === "featureRequests" ? <FeatureRequestsPage session={session} onNotify={pageNotify} /> : null}
```

- [ ] **Step 3: Check TypeScript**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/client/maphari-client-dashboard.tsx
git commit -m "feat: mount CommunityForumPage and FeatureRequestsPage in client dashboard"
```

---

## Task 15: Admin Config — PageIds, NavItems, pageTitles

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/config.ts`
- Modify: `apps/web/src/components/admin/dashboard/constants.ts`

- [ ] **Step 1: Add PageId entries in config.ts**

Find `| "settings";` (last entry in the `PageId` union in `config.ts`). Change:
```typescript
  | "settings";
```
to:
```typescript
  | "settings"
  | "communityModeration"
  | "communityFeatureRequests";
```

- [ ] **Step 2: Add NavItem entries**

Find the last NavItem entry in `navItems` (e.g. `{ id: "settings", label: "Settings", section: "Account" }`). Add after it:

```typescript
  { id: "communityModeration",      label: "Moderation Queue", section: "Community", badgeRed: true },
  { id: "communityFeatureRequests", label: "Feature Requests", section: "Community" },
```

- [ ] **Step 3: Add pageTitles entries in constants.ts**

Find `settings: ["Account", "Settings"]` (last entry in `pageTitles`). Add before the closing `}`:

```typescript
  communityModeration:      ["Community", "Moderation Queue"],
  communityFeatureRequests: ["Community", "Feature Requests"],
```

- [ ] **Step 4: Check TypeScript**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/admin/dashboard/config.ts apps/web/src/components/admin/dashboard/constants.ts
git commit -m "feat: add communityModeration and communityFeatureRequests to admin config"
```

---

## Task 16: Admin Moderation Page + CSS

**Files:**
- Create: `apps/web/src/components/admin/dashboard/pages/admin-community-moderation-page.tsx`
- Modify: `apps/web/src/app/style/admin/pages-misc.module.css`

- [ ] **Step 1: Add admin community CSS to pages-misc.module.css**

Append to `apps/web/src/app/style/admin/pages-misc.module.css`:

```css
/* ── Admin Community ──────────────────────────────────────────────────── */
.commModPage { display: flex; flex-direction: column; gap: 20px; }
.commModList { display: flex; flex-direction: column; gap: 8px; }
.commModItem { padding: 12px 14px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); border-radius: 8px; }
.commModItemType { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.commModBadge { display: inline-block; font-size: 10px; font-weight: 600; padding: 1px 8px; border-radius: 10px; background: rgba(139,111,255,.18); color: #8b6fff; }
.commModItemLabel { font-size: 10px; color: rgba(255,255,255,.3); }
.commModTitle { font-size: 12px; font-weight: 600; color: #e8e8f0; margin-bottom: 3px; }
.commModRealName { font-size: 11px; color: rgba(255,255,255,.4); margin-bottom: 8px; }
.commModRealName strong { color: rgba(255,255,255,.7); }
.commModActions { display: flex; gap: 6px; }
.commModApproveBtn { background: #8b6fff; color: #fff; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 5px; border: none; cursor: pointer; }
.commModApproveBtn:hover { background: #7c5ef0; }
.commModRejectBtn { background: rgba(255,80,80,.12); color: #ff6b6b; border: 1px solid rgba(255,80,80,.2); font-size: 10px; font-weight: 600; padding: 4px 12px; border-radius: 5px; cursor: pointer; }
.commModRejectBtn:hover { background: rgba(255,80,80,.2); }
.commModCount { background: rgba(255,80,80,.18); color: #ff6b6b; padding: 1px 8px; border-radius: 10px; font-size: 11px; margin-left: 8px; }
```

- [ ] **Step 2: Create the admin moderation page**

Create `apps/web/src/components/admin/dashboard/pages/admin-community-moderation-page.tsx`:

```tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import type { Session } from "next-auth";
import { callGateway } from "@/lib/api/portal/internal";
import { useAdminStyles } from "../style";

interface Props {
  session: Session;
  onNotify?: (msg: string, type?: "success" | "error") => void;
}

interface ModerationItem {
  id: string;
  type: "thread" | "post" | "feature_request";
  category: string;
  title?: string;
  body?: string;
  description?: string;
  anonAlias: string;
  authorId: string;
  createdAt: string;
}

interface ModerationQueue {
  threads: ModerationItem[];
  posts: ModerationItem[];
  featureRequests: ModerationItem[];
  total: number;
}

function getHeaders(session: Session): Record<string, string> {
  const user = session.user as { id?: string; role?: string; clientId?: string };
  return {
    "x-user-id": user.id ?? "",
    "x-user-role": user.role ?? "ADMIN",
    "x-client-id": user.clientId ?? "",
  };
}

export function AdminCommunityModerationPage({ session, onNotify }: Props) {
  const s = useAdminStyles();
  const [queue, setQueue] = useState<ModerationQueue | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await callGateway("/admin/forum/moderation-queue", "GET", undefined, getHeaders(session));
      if (res.success) setQueue((res as { data: ModerationQueue }).data);
    } catch {
      onNotify?.("Failed to load moderation queue", "error");
    } finally {
      setLoading(false);
    }
  }, [session, onNotify]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  async function handleApprove(item: ModerationItem) {
    const url = item.type === "thread"
      ? `/admin/forum/threads/${item.id}`
      : item.type === "post"
        ? `/admin/forum/posts/${item.id}`
        : `/admin/feature-requests/${item.id}`;
    try {
      await callGateway(url, "PATCH", { isApproved: true }, getHeaders(session));
      onNotify?.("Approved", "success");
      fetchQueue();
    } catch {
      onNotify?.("Failed to approve", "error");
    }
  }

  async function handleReject(item: ModerationItem) {
    const url = item.type === "thread"
      ? `/admin/forum/threads/${item.id}`
      : item.type === "post"
        ? `/admin/forum/posts/${item.id}`
        : `/admin/feature-requests/${item.id}`;
    try {
      await callGateway(url, "PATCH", { isRejected: true }, getHeaders(session));
      onNotify?.("Rejected", "success");
      fetchQueue();
    } catch {
      onNotify?.("Failed to reject", "error");
    }
  }

  const allItems: ModerationItem[] = queue
    ? [
        ...queue.threads,
        ...queue.posts,
        ...queue.featureRequests,
      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const typeLabelMap: Record<string, string> = { thread: "New Thread", post: "Reply", feature_request: "Feature Request" };

  return (
    <div className={s("commModPage")}>
      <h1 className={s("pageTitle")}>
        Moderation Queue
        {queue && queue.total > 0 && <span className={s("commModCount")}>{queue.total}</span>}
      </h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: -12 }}>Review submissions before they go live to all clients</p>

      {loading ? (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>Loading…</p>
      ) : allItems.length === 0 ? (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>Queue is empty — all caught up!</p>
      ) : (
        <div className={s("commModList")}>
          {allItems.map((item) => (
            <div key={`${item.type}-${item.id}`} className={s("commModItem")}>
              <div className={s("commModItemType")}>
                <span className={s("commModBadge")}>{item.category}</span>
                <span className={s("commModItemLabel")}>{typeLabelMap[item.type]}</span>
              </div>
              <div className={s("commModTitle")}>
                {item.title ?? (item.body ? `"${item.body.slice(0, 80)}${item.body.length > 80 ? "…" : ""}"` : item.description?.slice(0, 80))}
              </div>
              <div className={s("commModRealName")}>
                From <strong>{item.authorId}</strong> (shown as {item.anonAlias}) · {new Date(item.createdAt).toLocaleString()}
              </div>
              <div className={s("commModActions")}>
                <button className={s("commModApproveBtn")} onClick={() => handleApprove(item)}>✓ Approve</button>
                <button className={s("commModRejectBtn")} onClick={() => handleReject(item)}>✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Check TypeScript**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/admin-community-moderation-page.tsx apps/web/src/app/style/admin/pages-misc.module.css
git commit -m "feat: add AdminCommunityModerationPage and admin community CSS"
```

---

## Task 17: Admin Feature-Requests Page + CSS

**Files:**
- Create: `apps/web/src/components/admin/dashboard/pages/admin-community-feature-requests-page.tsx`
- Modify: `apps/web/src/app/style/admin/pages-misc.module.css`

- [ ] **Step 1: Append admin FR CSS to pages-misc.module.css**

Append to `apps/web/src/app/style/admin/pages-misc.module.css`:

```css
.commFrPage { display: flex; flex-direction: column; gap: 20px; }
.commFrTable { display: flex; flex-direction: column; background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06); border-radius: 8px; overflow: hidden; }
.commFrHeader { display: grid; grid-template-columns: 50px 1fr 110px 100px 120px; gap: 0; padding: 7px 14px; font-size: 10px; color: rgba(255,255,255,.3); text-transform: uppercase; letter-spacing: .07em; border-bottom: 1px solid rgba(255,255,255,.05); }
.commFrRow { display: grid; grid-template-columns: 50px 1fr 110px 100px 120px; gap: 0; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,.04); align-items: center; }
.commFrRow:last-child { border-bottom: none; }
.commFrVoteCount { font-size: 14px; font-weight: 700; color: #8b6fff; }
.commFrVoteCountLow { color: rgba(255,255,255,.4); }
.commFrTitle { font-size: 12px; font-weight: 500; color: #e8e8f0; }
.commFrCategoryLabel { font-size: 10px; color: rgba(255,255,255,.3); margin-top: 2px; }
.commFrRealName { font-size: 11px; color: rgba(255,255,255,.45); }
.commFrStatusSelect { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 5px; color: rgba(255,255,255,.5); font-size: 10px; padding: 3px 6px; width: 100%; cursor: pointer; }
.commFrStatusSelectPlanned { background: rgba(139,111,255,.15); border-color: rgba(139,111,255,.3); color: #8b6fff; }

@media (max-width: 900px) {
  .commFrHeader { grid-template-columns: 44px 1fr 90px; }
  .commFrRow { grid-template-columns: 44px 1fr 90px; }
}
```

- [ ] **Step 2: Create the admin feature-requests page**

Create `apps/web/src/components/admin/dashboard/pages/admin-community-feature-requests-page.tsx`:

```tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import type { Session } from "next-auth";
import { callGateway } from "@/lib/api/portal/internal";
import { useAdminStyles } from "../style";

interface Props {
  session: Session;
  onNotify?: (msg: string, type?: "success" | "error") => void;
}

interface AdminFeatureRequest {
  id: string;
  category: string;
  title: string;
  authorId: string;
  anonAlias: string;
  status: string;
  voteCount: number;
  isApproved: boolean;
  isRejected: boolean;
  createdAt: string;
}

const STATUSES = ["under_review", "planned", "in_progress", "done", "declined"];
const STATUS_LABELS: Record<string, string> = {
  under_review: "Under Review",
  planned: "Planned",
  in_progress: "In Progress",
  done: "Done",
  declined: "Declined",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  "portal-ux": "🖥",
  reporting: "📊",
  integrations: "🔗",
  delivery: "🚀",
  billing: "💰",
  other: "✨",
};

function getHeaders(session: Session): Record<string, string> {
  const user = session.user as { id?: string; role?: string; clientId?: string };
  return {
    "x-user-id": user.id ?? "",
    "x-user-role": user.role ?? "ADMIN",
    "x-client-id": user.clientId ?? "",
  };
}

export function AdminCommunityFeatureRequestsPage({ session, onNotify }: Props) {
  const s = useAdminStyles();
  const [requests, setRequests] = useState<AdminFeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("votes");

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const qs = sort === "newest" ? "?sort=newest" : "";
      const res = await callGateway(`/admin/feature-requests${qs}`, "GET", undefined, getHeaders(session));
      if (res.success) setRequests((res as { data: AdminFeatureRequest[] }).data);
    } catch {
      onNotify?.("Failed to load feature requests", "error");
    } finally {
      setLoading(false);
    }
  }, [session, sort, onNotify]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleStatusChange(id: string, status: string, isApproved: boolean) {
    try {
      await callGateway(`/admin/feature-requests/${id}`, "PATCH", { status, isApproved }, getHeaders(session));
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status, isApproved } : r));
    } catch {
      onNotify?.("Failed to update status", "error");
    }
  }

  return (
    <div className={s("commFrPage")}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 className={s("pageTitle")}>Feature Requests</h1>
        <select
          style={{ fontSize: 12, padding: "4px 8px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, color: "rgba(255,255,255,.6)" }}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="votes">Most Voted</option>
          <option value="newest">Newest</option>
        </select>
      </div>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: -12 }}>Real company names visible to admins only</p>

      {loading ? (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>Loading…</p>
      ) : (
        <div className={s("commFrTable")}>
          <div className={s("commFrHeader")}>
            <div>Votes</div>
            <div>Request</div>
            <div>From</div>
            <div>Approval</div>
            <div>Status</div>
          </div>
          {requests.map((fr) => (
            <div key={fr.id} className={s("commFrRow")}>
              <div className={s("commFrVoteCount", fr.voteCount < 5 ? "commFrVoteCountLow" : "")}>{fr.voteCount}</div>
              <div>
                <div className={s("commFrTitle")}>{fr.title}</div>
                <div className={s("commFrCategoryLabel")}>{CATEGORY_EMOJIS[fr.category] ?? "✨"} {fr.category}</div>
              </div>
              <div className={s("commFrRealName")}>{fr.authorId}</div>
              <div style={{ fontSize: 10 }}>
                {fr.isRejected
                  ? <span style={{ color: "#ff6b6b" }}>Rejected</span>
                  : fr.isApproved
                    ? <span style={{ color: "#50c878" }}>Approved</span>
                    : (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          style={{ background: "#8b6fff", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 10, cursor: "pointer" }}
                          onClick={() => handleStatusChange(fr.id, fr.status, true)}
                        >✓</button>
                        <button
                          style={{ background: "rgba(255,80,80,.15)", color: "#ff6b6b", border: "1px solid rgba(255,80,80,.2)", borderRadius: 4, padding: "2px 8px", fontSize: 10, cursor: "pointer" }}
                          onClick={() => callGateway(`/admin/feature-requests/${fr.id}`, "PATCH", { isRejected: true }, getHeaders(session)).then(fetchRequests)}
                        >✕</button>
                      </div>
                    )
                }
              </div>
              <div>
                <select
                  className={s("commFrStatusSelect", fr.status === "planned" ? "commFrStatusSelectPlanned" : "")}
                  value={fr.status}
                  onChange={(e) => handleStatusChange(fr.id, e.target.value, fr.isApproved)}
                >
                  {STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Check TypeScript**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/admin-community-feature-requests-page.tsx apps/web/src/app/style/admin/pages-misc.module.css
git commit -m "feat: add AdminCommunityFeatureRequestsPage component"
```

---

## Task 18: Wire Admin Dashboard

**Files:**
- Modify: `apps/web/src/components/admin/maphari-dashboard.tsx`

- [ ] **Step 1: Add imports**

In `maphari-dashboard.tsx`, find the last page import lines. Add:

```typescript
import { AdminCommunityModerationPage } from "./dashboard/pages/admin-community-moderation-page";
import { AdminCommunityFeatureRequestsPage } from "./dashboard/pages/admin-community-feature-requests-page";
```

- [ ] **Step 2: Mount the pages**

Find the page rendering block. Find the last `{page === "..." ? <Component ...> : null}` entry and add:

```tsx
{page === "communityModeration" ? <AdminCommunityModerationPage session={session} onNotify={pageNotify} /> : null}
{page === "communityFeatureRequests" ? <AdminCommunityFeatureRequestsPage session={session} onNotify={pageNotify} /> : null}
```

- [ ] **Step 3: Check TypeScript — full clean pass**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/admin/maphari-dashboard.tsx
git commit -m "feat: mount AdminCommunityModerationPage and AdminCommunityFeatureRequestsPage in admin dashboard"
```

---

## Task 19: Final Verification

- [ ] **Step 1: Full TypeScript check across the monorepo**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1
cd services/core && pnpm exec tsc --noEmit 2>&1
cd apps/gateway && pnpm exec tsc --noEmit 2>&1
```

Expected: zero errors in all three.

- [ ] **Step 2: Verify migration is applied**

```bash
cd services/core && pnpm exec prisma migrate status
```

Expected: all migrations applied, no pending migrations.

- [ ] **Step 3: Verify route registrations are correct (no duplicate routes)**

```bash
grep -n "forum\|feature-request" services/core/src/app.ts
grep -rn "ForumController\|FeatureRequestsController" apps/gateway/src/modules/app.module.ts
```

Expected: 2 lines each — one import and one registration.

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git status
# If all clean, no commit needed. Otherwise:
git add -p && git commit -m "chore: final cleanup for community forum feature"
```

---

## Verification Checklist

| Check | How to verify |
|-------|--------------|
| DB models created | `prisma migrate status` → all applied |
| Alias utility works | `generateAlias("user-abc")` returns `"@amber-falcon"` (or similar consistent output) |
| Forum routes registered | Gateway starts without FST_ERR_DUPLICATED_ROUTE |
| Client nav shows Community section | Log into client portal → sidebar shows "Forum" and "Feature Requests" under Community |
| Forum thread list loads | Navigate to Forum → threads appear (or "No threads yet" if empty) |
| Thread submission works | Click "+ New Thread" → submit → "pending review" toast appears |
| Feature request voting works | Click ▲ on a request → count updates, button highlights |
| Admin moderation queue loads | Admin → Community → Moderation Queue → pending items visible |
| Admin FR table loads | Admin → Community → Feature Requests → all requests in table |
| Admin approve/reject works | Click ✓ on a moderation item → item disappears from queue |
| TypeScript clean | `pnpm --filter @maphari/web exec tsc --noEmit` → zero errors |
