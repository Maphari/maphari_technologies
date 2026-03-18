// ════════════════════════════════════════════════════════════════════════════
// comments.ts — Shared API client: Structured comment threads
// Endpoints : GET  /comments?entityType=X&entityId=Y
//             POST /comments  body: { entityType, entityId, message, authorName }
// Scope     : CLIENT, STAFF, ADMIN (server-side scope enforced)
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "../portal/internal";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CommentEntityType =
  | "task"
  | "invoice"
  | "deliverable"
  | "milestone"
  | "ticket";

export interface Comment {
  id: string;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
}

// ── Load comments ─────────────────────────────────────────────────────────────

export async function loadCommentsWithRefresh(
  session: AuthSession,
  entityType: CommentEntityType,
  entityId: string,
): Promise<AuthorizedResult<Comment[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const qs = new URLSearchParams({ entityType, entityId }).toString();
    const response = await callGateway<Comment[]>(`/comments?${qs}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "COMMENTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load comments.",
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Post a comment ────────────────────────────────────────────────────────────

export async function postCommentWithRefresh(
  session: AuthSession,
  entityType: CommentEntityType,
  entityId: string,
  message: string,
): Promise<AuthorizedResult<Comment>> {
  const authorName =
    session.user?.email?.split("@")[0] ?? "User";

  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<Comment>("/comments", accessToken, {
      method: "POST",
      body: { entityType, entityId, message, authorName },
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "COMMENT_POST_FAILED",
          response.payload.error?.message ?? "Unable to post comment.",
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
