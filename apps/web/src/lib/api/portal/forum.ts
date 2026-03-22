// ════════════════════════════════════════════════════════════════════════════
// forum.ts — Portal API: community forum threads + posts
// Endpoints:
//   GET    /portal/forum/threads
//   GET    /portal/forum/threads/:threadId
//   POST   /portal/forum/threads
//   POST   /portal/forum/threads/:threadId/posts
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";

// ── Types ─────────────────────────────────────────────────────────────────────

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

export interface ForumThreadListResult {
  data: ForumThread[];
  meta: ForumThreadListMeta;
}

export interface CreatedForumThread {
  id: string;
  category: string;
  title: string;
  anonAlias: string;
  createdAt: string;
}

// ── API functions ──────────────────────────────────────────────────────────────

/** List approved threads, optionally filtered by category. */
export async function loadPortalForumThreadsWithRefresh(
  session: AuthSession,
  params?: { category?: string; page?: number; limit?: number }
): Promise<AuthorizedResult<ForumThreadListResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const url = `/portal/forum/threads${qs.toString() ? `?${qs}` : ""}`;
    const response = await callGateway<ForumThreadListResult>(url, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "FORUM_THREADS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load forum threads."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

/** Get a single thread with its approved posts. */
export async function loadPortalForumThreadWithRefresh(
  session: AuthSession,
  threadId: string
): Promise<AuthorizedResult<ForumThreadDetail>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ForumThreadDetail>(
      `/portal/forum/threads/${threadId}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "FORUM_THREAD_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load forum thread."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Create a new thread (pending admin approval). */
export async function createPortalForumThreadWithRefresh(
  session: AuthSession,
  body: { category: string; title: string }
): Promise<AuthorizedResult<CreatedForumThread>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<CreatedForumThread>(
      "/portal/forum/threads",
      accessToken,
      { method: "POST", body }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "FORUM_THREAD_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create forum thread."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Reply to a thread (pending admin approval). */
export async function createPortalForumPostWithRefresh(
  session: AuthSession,
  threadId: string,
  body: { body: string }
): Promise<AuthorizedResult<ForumPost>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ForumPost>(
      `/portal/forum/threads/${threadId}/posts`,
      accessToken,
      { method: "POST", body }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "FORUM_POST_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create forum post."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
