// ════════════════════════════════════════════════════════════════════════════
// feedback.ts — Staff API client: client feedback inbox
// Endpoints : GET   /staff/feedback
//             PATCH /staff/feedback/:feedbackType/:id/acknowledge
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

// ── Types ─────────────────────────────────────────────────────────────────────

export type FeedbackRawType = "survey" | "ticket";

export interface StaffFeedbackItem {
  id:          string;
  rawType:     FeedbackRawType;
  rawId:       string;
  type:        string;         // "Praise" | "Complaint" | "CSAT" | "NPS" | "Comment"
  clientName:  string;
  projectName: string | null;
  summary:     string;
  rating:      number | null;  // 1-10 for surveys, null for tickets
  status:      string;         // "PENDING" | "REVIEWED" | "RESOLVED"
  receivedAt:  string;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** Fetch all client feedback items (surveys + support tickets) */
export async function getStaffFeedback(
  session: AuthSession
): Promise<AuthorizedResult<StaffFeedbackItem[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffFeedbackItem[]>(
      "/staff/feedback",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_FEEDBACK_FAILED",
          response.payload.error?.message ?? "Unable to load feedback."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Mark a feedback item as acknowledged / reviewed */
export async function acknowledgeStaffFeedback(
  session:      AuthSession,
  feedbackType: FeedbackRawType,
  id:           string
): Promise<AuthorizedResult<{ id: string; status: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ id: string; status: string }>(
      `/staff/feedback/${feedbackType}/${id}/acknowledge`,
      accessToken,
      { method: "PATCH" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_FEEDBACK_ACK_FAILED",
          response.payload.error?.message ?? "Unable to acknowledge feedback."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
