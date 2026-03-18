// ════════════════════════════════════════════════════════════════════════════
// activity.ts — Portal API client: real-time project activity feed
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

export interface ActivityItem {
  id:         string;
  action:     string;
  entityType: string;
  entityId:   string | null;
  actorName:  string | null;
  createdAt:  string;
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadActivityFeedWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ActivityItem[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ActivityItem[]>("/portal/activity-feed", accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "ACTIVITY_FEED_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load activity feed"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
