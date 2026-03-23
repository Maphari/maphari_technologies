// ════════════════════════════════════════════════════════════════════════════
// community.ts — Admin API client for community forum + feature request moderation
// Endpoints : GET   /admin/forum/moderation-queue
//             PATCH /admin/forum/threads/:id
//             PATCH /admin/forum/posts/:id
//             PATCH /admin/feature-requests/:id
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ModerationItem {
  id: string;
  type: "thread" | "post" | "feature_request";
  category: string;
  title?: string;
  body?: string;
  description?: string;
  authorId: string;
  anonAlias: string;
  createdAt: string;
  realName?: string;
  threadId?: string;
}

export interface ModerationQueue {
  items: ModerationItem[];
  total: number;
}

// Raw shape returned by the backend
interface ModerationQueueRaw {
  threads: Array<{ id: string; category: string; title: string; anonAlias: string; authorId: string; createdAt: string; type: "thread" }>;
  posts: Array<{ id: string; threadId: string; body: string; anonAlias: string; authorId: string; createdAt: string; type: "post" }>;
  featureRequests: Array<{ id: string; category: string; title: string; description: string; anonAlias: string; authorId: string; createdAt: string; type: "feature_request" }>;
  total: number;
}

// ── Load moderation queue ─────────────────────────────────────────────────────
export async function loadAdminModerationQueueWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ModerationQueue>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ModerationQueueRaw>(
      "/admin/forum/moderation-queue",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "MODERATION_QUEUE_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load moderation queue."
        ),
      };
    }
    const raw = response.payload.data ?? { threads: [], posts: [], featureRequests: [], total: 0 };
    const items: ModerationItem[] = [
      ...raw.threads.map((t) => ({ id: t.id, type: t.type, category: t.category, title: t.title, anonAlias: t.anonAlias, authorId: t.authorId, createdAt: t.createdAt })),
      ...raw.posts.map((p) => ({ id: p.id, type: p.type, category: "reply", body: p.body, anonAlias: p.anonAlias, authorId: p.authorId, createdAt: p.createdAt, threadId: p.threadId })),
      ...raw.featureRequests.map((fr) => ({ id: fr.id, type: fr.type, category: fr.category, title: fr.title, description: fr.description, anonAlias: fr.anonAlias, authorId: fr.authorId, createdAt: fr.createdAt })),
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return {
      unauthorized: false,
      data: { items, total: raw.total },
      error: null,
    };
  });
}

// ── Approve forum thread ──────────────────────────────────────────────────────
export async function approveAdminForumThreadWithRefresh(
  session: AuthSession,
  threadId: string
): Promise<AuthorizedResult<{ ok: true }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ ok: true }>(
      `/admin/forum/threads/${threadId}`,
      accessToken,
      { method: "PATCH", body: { isApproved: true } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "THREAD_APPROVE_FAILED",
          response.payload.error?.message ?? "Unable to approve thread."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? { ok: true }, error: null };
  });
}

// ── Reject forum thread ───────────────────────────────────────────────────────
export async function rejectAdminForumThreadWithRefresh(
  session: AuthSession,
  threadId: string
): Promise<AuthorizedResult<{ ok: true }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ ok: true }>(
      `/admin/forum/threads/${threadId}`,
      accessToken,
      { method: "PATCH", body: { isRejected: true } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "THREAD_REJECT_FAILED",
          response.payload.error?.message ?? "Unable to reject thread."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? { ok: true }, error: null };
  });
}

// ── Approve forum post ────────────────────────────────────────────────────────
export async function approveAdminForumPostWithRefresh(
  session: AuthSession,
  postId: string
): Promise<AuthorizedResult<{ ok: true }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ ok: true }>(
      `/admin/forum/posts/${postId}`,
      accessToken,
      { method: "PATCH", body: { isApproved: true } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "POST_APPROVE_FAILED",
          response.payload.error?.message ?? "Unable to approve post."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? { ok: true }, error: null };
  });
}

// ── Reject forum post ─────────────────────────────────────────────────────────
export async function rejectAdminForumPostWithRefresh(
  session: AuthSession,
  postId: string
): Promise<AuthorizedResult<{ ok: true }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ ok: true }>(
      `/admin/forum/posts/${postId}`,
      accessToken,
      { method: "PATCH", body: { isRejected: true } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "POST_REJECT_FAILED",
          response.payload.error?.message ?? "Unable to reject post."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? { ok: true }, error: null };
  });
}

// ── Approve feature request ───────────────────────────────────────────────────
export async function approveAdminFeatureRequestWithRefresh(
  session: AuthSession,
  requestId: string
): Promise<AuthorizedResult<{ ok: true }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ ok: true }>(
      `/admin/feature-requests/${requestId}`,
      accessToken,
      { method: "PATCH", body: { isApproved: true } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "FEATURE_REQUEST_APPROVE_FAILED",
          response.payload.error?.message ?? "Unable to approve feature request."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? { ok: true }, error: null };
  });
}

// ── Reject feature request ────────────────────────────────────────────────────
export async function rejectAdminFeatureRequestWithRefresh(
  session: AuthSession,
  requestId: string
): Promise<AuthorizedResult<{ ok: true }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ ok: true }>(
      `/admin/feature-requests/${requestId}`,
      accessToken,
      { method: "PATCH", body: { isRejected: true } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "FEATURE_REQUEST_REJECT_FAILED",
          response.payload.error?.message ?? "Unable to reject feature request."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? { ok: true }, error: null };
  });
}

// ── Types for feature request management ──────────────────────────────────────
export interface AdminFeatureRequest {
  id: string;
  category: string;
  title: string;
  description: string;
  authorId: string;
  anonAlias: string;
  status: string; // "under_review" | "planned" | "in_progress" | "done" | "declined"
  voteCount: number;
  isApproved: boolean;
  isRejected: boolean;
  createdAt: string;
  realName?: string; // real company name (admin only)
}

// ── Load all feature requests ─────────────────────────────────────────────────
export async function loadAdminFeatureRequestsWithRefresh(
  session: AuthSession,
  params: { sort?: "votes" | "newest" } = {}
): Promise<AuthorizedResult<AdminFeatureRequest[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const qs = params.sort ? `?sort=${params.sort}` : "";
    const response = await callGateway<AdminFeatureRequest[]>(
      `/admin/feature-requests${qs}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "FEATURE_REQUESTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load feature requests."
        ),
      };
    }
    return {
      unauthorized: false,
      data: response.payload.data ?? [],
      error: null,
    };
  });
}

// ── Update feature request (approve / reject / status) ────────────────────────
export async function updateAdminFeatureRequestWithRefresh(
  session: AuthSession,
  requestId: string,
  body: { isApproved?: boolean; isRejected?: boolean; status?: string }
): Promise<AuthorizedResult<AdminFeatureRequest>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminFeatureRequest>(
      `/admin/feature-requests/${requestId}`,
      accessToken,
      { method: "PATCH", body }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "FEATURE_REQUEST_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update feature request."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}
