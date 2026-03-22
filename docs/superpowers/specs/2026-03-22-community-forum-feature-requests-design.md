# Community Forum & Feature Requests — Design Spec

**Date:** 2026-03-22
**Status:** Approved

---

## Goal

Add two new pages to the Maphari client portal: a threaded **Community Forum** and a **Feature Requests** voting board. Both are private to paying clients, with anonymous identities so clients can engage openly without revealing their company to peers. Admins see real identities and moderate all content before it goes live.

## Decisions Made

| Decision | Choice | Reason |
|----------|--------|--------|
| Audience | Clients only | Keeps the space exclusive, no auth complexity for public users |
| Identity model | Anonymous peer community | B2B clients won't post if competitors can see them; anonymous posting still aggregates votes |
| Structure | Two separate nav entries | Clean separation, each page has a single purpose |
| Forum categories | Tips & Tricks, Q&A, Announcements, General | Focused scope with one open-ended escape valve |
| Feature request categories | Portal UX, Reporting, Integrations, Project Delivery, Billing, Other | Covers both platform and service improvements |
| Architecture | Extend `services/core` | No new service overhead; follows existing portal patterns |

---

## Architecture

### Backend — `services/core`

Two new route files:

**`services/core/src/routes/forum.ts`**
```
GET   /portal/forum/threads              list threads (filter by category, paginated, isApproved: true)
POST  /portal/forum/threads              create thread (CLIENT scope) → isApproved: false
GET   /portal/forum/threads/:id          get thread with all approved posts
POST  /portal/forum/threads/:id/posts    reply to thread (CLIENT scope) → isApproved: false
PATCH /admin/forum/threads/:id           pin / lock / approve / reject thread (ADMIN scope)
PATCH /admin/forum/posts/:id             approve / reject post (ADMIN scope)
GET   /admin/forum/moderation-queue      list all pending (isApproved: false, isRejected: false) items across threads, posts, and feature requests
```

**`services/core/src/routes/feature-requests.ts`**
```
GET   /portal/feature-requests           list (filter by category/status, sort by voteCount or createdAt, isApproved: true only)
POST  /portal/feature-requests           submit new request (CLIENT scope) → isApproved: false
POST  /portal/feature-requests/:id/vote  toggle vote on/off — idempotent (CLIENT scope)
PATCH /admin/feature-requests/:id        approve / reject / update status (ADMIN scope)
```

### Gateway — `apps/gateway/src/routes/`

Two new NestJS controllers:
- `forum.controller.ts` — proxies all `/forum/*` and `/admin/forum/*` routes; registered in `app.module.ts`
- `feature-requests.controller.ts` — proxies all `/feature-requests/*` and `/admin/feature-requests/*` routes; registered in `app.module.ts`

### Portal API Clients — `apps/web/src/lib/api/portal/`

**`forum.ts`**
- `loadPortalForumThreadsWithRefresh(session, params)` — GET list
- `loadPortalForumThreadWithRefresh(session, threadId)` — GET single with posts
- `createPortalForumThreadWithRefresh(session, body)` — POST new thread
- `createPortalForumPostWithRefresh(session, threadId, body)` — POST reply

**`feature-requests.ts`**
- `loadPortalFeatureRequestsWithRefresh(session, params)` — GET list
- `submitPortalFeatureRequestWithRefresh(session, body)` — POST new request
- `togglePortalFeatureVoteWithRefresh(session, requestId)` — POST vote toggle

---

## Data Models

Four new Prisma models in `services/core/prisma/schema.prisma`. All follow the existing codebase convention: `@id @default(uuid())` (no `@db.VarChar(36)` on PKs).

### `ForumThread`
```prisma
model ForumThread {
  id          String      @id @default(uuid())
  category    String      // "tips" | "qa" | "announcements" | "general"
  title       String      @db.VarChar(200)
  authorId    String      // real userId — never included in client-facing API responses
  anonAlias   String      @db.VarChar(60)   // e.g. "@amber-falcon" — shown publicly
  isPinned    Boolean     @default(false)
  isLocked    Boolean     @default(false)
  isApproved  Boolean     @default(false)   // admin must approve before visible to other clients
  isRejected  Boolean     @default(false)   // set true on admin reject; record is retained for audit
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  posts       ForumPost[]

  @@index([category, isApproved])
  @@index([isApproved, createdAt])
}
```

### `ForumPost`
```prisma
model ForumPost {
  id          String      @id @default(uuid())
  threadId    String
  thread      ForumThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  authorId    String      // real userId — never included in client-facing API responses
  anonAlias   String      @db.VarChar(60)
  body        String      @db.Text
  isApproved  Boolean     @default(false)
  isRejected  Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([threadId, isApproved])
}
```

### `FeatureRequest`
```prisma
model FeatureRequest {
  id          String        @id @default(uuid())
  category    String        // "portal-ux" | "reporting" | "integrations" | "delivery" | "billing" | "other"
  title       String        @db.VarChar(200)
  description String        @db.Text
  authorId    String        // real userId — never included in client-facing API responses
  anonAlias   String        @db.VarChar(60)
  status      String        @default("under_review") // "under_review" | "planned" | "in_progress" | "done" | "declined"
  voteCount   Int           @default(0)   // denormalized counter — kept consistent via atomic Prisma transaction (see Vote Toggle below)
  isApproved  Boolean       @default(false)
  isRejected  Boolean       @default(false)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  votes       FeatureVote[]

  @@index([category, status, isApproved])
  @@index([isApproved, voteCount])
}
```

### `FeatureVote`
```prisma
model FeatureVote {
  id               String         @id @default(uuid())
  featureRequestId String
  featureRequest   FeatureRequest @relation(fields: [featureRequestId], references: [id], onDelete: Cascade)
  voterId          String         // real userId
  createdAt        DateTime       @default(now())

  @@unique([featureRequestId, voterId])  // one vote per client enforced at DB level
}
```

---

## Anonymous Alias Generation

- Each `userId` maps deterministically to a word-pair alias: `@{adjective}-{animal}` (e.g. `@amber-falcon`, `@cobalt-horizon`)
- Generated by hashing the userId and using the hash to index into two fixed word lists (~50 adjectives × ~50 animals = 2,500 combinations)
- **Application-layer responsibility:** the alias is recomputed from `generateAlias(authorId)` at write time (POST thread / POST post / POST feature-request) and stored directly on the row. The stored value is the source of truth for display. No separate user-alias lookup table.
- Same user always gets the same alias because `generateAlias` is a pure deterministic function — given the same userId it always returns the same string
- Admin views show the real company/user name alongside the alias for moderation context

---

## Vote Toggle — Atomic `voteCount` Update

The `POST /portal/feature-requests/:id/vote` handler uses a single Prisma `$transaction` to atomically check vote existence and update the counter:

```typescript
// Pseudocode — implementation follows this pattern
await prisma.$transaction(async (tx) => {
  const existing = await tx.featureVote.findUnique({
    where: { featureRequestId_voterId: { featureRequestId: id, voterId } }
  });
  if (existing) {
    await tx.featureVote.delete({ where: { id: existing.id } });
    await tx.featureRequest.update({
      where: { id },
      data: { voteCount: { decrement: 1 } }
    });
  } else {
    await tx.featureVote.create({ data: { featureRequestId: id, voterId } }); // id generated by @default(uuid())
    await tx.featureRequest.update({
      where: { id },
      data: { voteCount: { increment: 1 } }
    });
  }
});
```

Prisma's `increment`/`decrement` operations are atomic at the DB level. Combined with the transaction, this prevents race conditions where two concurrent requests could produce an incorrect count.

---

## Moderation Flow

1. Client submits thread, post, or feature request → `isApproved: false`, `isRejected: false`
2. Admin sees it in the **Moderation Queue** (red badge count = items where `isApproved: false AND isRejected: false`)
3. Admin clicks **Approve** → `isApproved: true` → immediately visible to other clients in portal GET responses
4. Admin clicks **Reject** → `isRejected: true` → record is retained for audit but never shown to any client; the submitting client receives no notification (v1 — out of scope)
5. All portal GET endpoints filter `WHERE isApproved = true AND isRejected = false`
6. Admin moderation queue GET returns items where `isApproved = false AND isRejected = false`
7. Admin feature requests GET returns all records regardless of approval state, sorted by voteCount

---

## Frontend — Client Portal

### Nav changes (`apps/web/src/components/client/maphari-dashboard/config.ts`)

New `PageId` union entries:
```typescript
| "communityForum"
| "featureRequests"
```

New `NavSection` block added to `navSections` array (client uses `NavSection[]` with `title` + `items`, not flat `NavItem[]`):
```typescript
{
  title: "Community",
  items: [
    { id: "communityForum",  label: "Forum" },
    { id: "featureRequests", label: "Feature Requests" },
  ],
},
```

### Forum Page (`community-forum-page.tsx`)

- **Header:** title + "New Thread" button → opens slide-over form (title, category select, body textarea)
- **Privacy notice:** subtle line below header — "All posts are anonymous — your identity is never shown"
- **Category tabs:** All · 💡 Tips & Tricks · ❓ Q&A · 📢 Announcements · ☕ General
- **Thread list:** avatar (emoji derived from alias) · category badge · title · reply count · relative timestamp · `@alias`
- **Thread detail:** clicking expands inline or navigates to thread view; shows all approved posts; reply textarea at bottom (hidden if thread is locked)
- Pinned threads float to the top with a distinct background tint; locked threads show a 🔒 badge

### Feature Requests Page (`feature-requests-page.tsx`)

- **Header:** title + "Submit Idea" button → opens slide-over form (title, category select, description textarea)
- **Filters:** Category dropdown · Status dropdown · Sort toggle (Most Voted / Newest)
- **Request cards:** upvote button (▲ + count, highlighted lime when client has voted) · title · category badge · status badge · `@alias` · relative timestamp
- **Vote toggle:** clicking ▲ on a request the client already voted for removes their vote (idempotent POST)
- **Status badges:** Under Review (muted) · Planned (purple) · In Progress (amber) · Done (green) · Declined (muted/strikethrough)
- Client cannot vote on their own submitted request (backend enforces via `voterId !== authorId` check)
- Pending/rejected submissions are not shown to the submitting client in v1

---

## Frontend — Admin Dashboard

### Nav changes (`apps/web/src/components/admin/dashboard/config.ts`)

New `PageId` union entries:
```typescript
| "communityModeration"
| "communityFeatureRequests"
```

New flat `NavItem` entries (admin uses `NavItem[]` with `section: string`):
```typescript
{ id: "communityModeration",      label: "Moderation Queue", section: "Community", badgeRed: true },
{ id: "communityFeatureRequests", label: "Feature Requests", section: "Community" },
```

### Moderation Queue Page (`admin-community-moderation-page.tsx`)

- Lists all pending (`isApproved: false, isRejected: false`) threads, posts, and feature requests in one chronological list
- Each item shows: type badge (Thread / Reply / Feature Request) · category badge · title/body preview · **real company name** (shown alongside alias) · submission time
- **Approve** button (purple) and **Reject** button (red/muted) per item
- Red badge on nav entry = count of pending items

### Feature Requests Admin Page (`admin-community-feature-requests-page.tsx`)

- Table view: vote count · title · category · **real company name** · status dropdown
- Status dropdown fires `PATCH /admin/feature-requests/:id` immediately (optimistic update)
- The same PATCH endpoint handles both approval (`isApproved: true`) and status updates (`status: "planned"` etc.) via request body fields
- Sortable by vote count (default) or submission date
- Shows all records regardless of approval state

---

## CSS

### Client portal — `apps/web/src/app/style/client/pages-misc.module.css`

Forum classes: `forumPage`, `forumHeader`, `forumPrivacyNotice`, `forumCategoryTabs`, `forumTab`, `forumTabActive`, `forumThreadList`, `forumThreadRow`, `forumThreadAvatar`, `forumThreadMeta`, `forumAlias`, `forumCategoryBadge`, `forumReplyCount`, `forumPinned`, `forumLocked`, `forumDetailView`, `forumPostRow`, `forumReplyForm`

Feature request classes: `frPage`, `frHeader`, `frFilters`, `frList`, `frCard`, `frVoteBtn`, `frVoteBtnActive`, `frVoteCount`, `frTitle`, `frMeta`, `frStatusBadge`, `frStatusPlanned`, `frStatusInProgress`, `frStatusDone`, `frStatusDeclined`

### Admin dashboard — `apps/web/src/app/style/admin/pages-misc.module.css`

Classes: `commModPage`, `commModList`, `commModItem`, `commModItemType`, `commModRealName`, `commModActions`, `commFrPage`, `commFrTable`, `commFrRow`, `commFrVoteCount`, `commFrStatusSelect`

---

## Files to Create or Modify

| File | Action |
|------|--------|
| `services/core/prisma/schema.prisma` | Add 4 new models (`ForumThread`, `ForumPost`, `FeatureRequest`, `FeatureVote`) |
| `services/core/src/routes/forum.ts` | New — forum + admin moderation routes |
| `services/core/src/routes/feature-requests.ts` | New — feature request + vote routes |
| `apps/gateway/src/routes/forum.controller.ts` | New |
| `apps/gateway/src/routes/feature-requests.controller.ts` | New |
| `apps/gateway/src/modules/app.module.ts` | Register 2 new controllers |
| `apps/web/src/lib/api/portal/forum.ts` | New |
| `apps/web/src/lib/api/portal/feature-requests.ts` | New |
| `apps/web/src/components/client/maphari-dashboard/config.ts` | Add 2 `PageId` entries + new `NavSection` block |
| `apps/web/src/components/client/maphari-dashboard/pages/community-forum-page.tsx` | New |
| `apps/web/src/components/client/maphari-dashboard/pages/feature-requests-page.tsx` | New |
| `apps/web/src/components/client/maphari-client-dashboard.tsx` | Mount 2 new pages |
| `apps/web/src/app/style/client/pages-misc.module.css` | Add forum + FR CSS classes |
| `apps/web/src/components/admin/dashboard/config.ts` | Add 2 `PageId` entries + 2 flat `NavItem` entries |
| `apps/web/src/components/admin/dashboard/pages/admin-community-moderation-page.tsx` | New |
| `apps/web/src/components/admin/dashboard/pages/admin-community-feature-requests-page.tsx` | New |
| `apps/web/src/components/admin/maphari-dashboard.tsx` | Mount 2 new admin pages |
| `apps/web/src/app/style/admin/pages-misc.module.css` | Add admin community CSS classes |

---

## Out of Scope (v1)

- Public-facing community (no public subdomain or unauthenticated access)
- Notifying the submitting client when their post is rejected
- Showing a client their own pending/rejected submissions (`GET /portal/forum/my-submissions`)
- Client-to-client direct messaging via the forum
- Rich text / markdown in posts (plain text only)
- Email notifications on new replies
- Voting on forum posts (upvotes on feature requests only)
- Full-text search across forum threads
- Forum search (category filter is sufficient for v1)
