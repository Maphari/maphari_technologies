// ════════════════════════════════════════════════════════════════════════════
// feedback.ts — Portal API: reactions + replies on support tickets
// Endpoints:
//   POST   /feedback/:ticketId/reactions
//   DELETE /feedback/:ticketId/reactions/:emoji
//   GET    /feedback/:ticketId/replies
//   POST   /feedback/:ticketId/replies
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";

// ── NPS Types ─────────────────────────────────────────────────────────────────

export interface PendingNps {
  milestoneId:    string;
  milestoneTitle: string;
  projectName:    string;
  completedAt:    string;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PortalFeedbackReaction {
  id: string;
  ticketId: string;
  clientId: string;
  emoji: string;
  createdAt: string;
}

export interface PortalFeedbackReply {
  id: string;
  ticketId: string;
  authorId: string | null;
  authorRole: string;
  authorName: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

// ── NPS ───────────────────────────────────────────────────────────────────────

/** Load milestones completed in last 7 days that don't yet have an NPS response */
export async function loadPendingNpsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PendingNps[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PendingNps[]>(
      "/portal/nps-pending",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data:  [],
        error: toGatewayError(
          response.payload.error?.code    ?? "NPS_PENDING_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load pending NPS items."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Submit an NPS score (0–10) and optional comment for a completed milestone */
export async function submitNpsResponseWithRefresh(
  session:     AuthSession,
  milestoneId: string,
  score:       number,
  comment?:    string
): Promise<AuthorizedResult<{ success: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ success: boolean }>(
      "/portal/nps-response",
      accessToken,
      { method: "POST", body: { milestoneId, score, comment } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data:  null,
        error: toGatewayError(
          response.payload.error?.code    ?? "NPS_SUBMIT_FAILED",
          response.payload.error?.message ?? "Unable to submit NPS response."
        )
      };
    }
    return { unauthorized: false, data: { success: true }, error: null };
  });
}

// ── Reactions ─────────────────────────────────────────────────────────────────

export async function addPortalFeedbackReactionWithRefresh(
  session: AuthSession,
  ticketId: string,
  emoji: string
): Promise<AuthorizedResult<PortalFeedbackReaction>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalFeedbackReaction>(
      `/feedback/${ticketId}/reactions`,
      accessToken,
      { method: "POST", body: { emoji } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "REACTION_FAILED",
          response.payload.error?.message ?? "Unable to add reaction."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function removePortalFeedbackReactionWithRefresh(
  session: AuthSession,
  ticketId: string,
  emoji: string
): Promise<AuthorizedResult<null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<null>(
      `/feedback/${ticketId}/reactions/${encodeURIComponent(emoji)}`,
      accessToken,
      { method: "DELETE" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    return { unauthorized: false, data: null, error: null };
  });
}

// ── Replies ───────────────────────────────────────────────────────────────────

export async function loadPortalFeedbackRepliesWithRefresh(
  session: AuthSession,
  ticketId: string
): Promise<AuthorizedResult<PortalFeedbackReply[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalFeedbackReply[]>(
      `/feedback/${ticketId}/replies`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "REPLIES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load replies."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function addPortalFeedbackReplyWithRefresh(
  session: AuthSession,
  ticketId: string,
  body: string,
  authorName?: string
): Promise<AuthorizedResult<PortalFeedbackReply>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalFeedbackReply>(
      `/feedback/${ticketId}/replies`,
      accessToken,
      { method: "POST", body: { body, authorName } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "REPLY_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to add reply."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
