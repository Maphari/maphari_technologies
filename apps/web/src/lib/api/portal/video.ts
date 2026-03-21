// ════════════════════════════════════════════════════════════════════════════
// video.ts — Portal API client: instant video rooms
// Endpoints : POST /portal/video-rooms/instant
// Scope     : CLIENT (all roles)
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

export interface InstantVideoRoom {
  joinUrl:    string;
  roomName:   string;
  expiresAt:  string;
  createdAt:  string;
}

export async function createInstantVideoRoomWithRefresh(
  session: AuthSession,
): Promise<AuthorizedResult<InstantVideoRoom>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<InstantVideoRoom>(
      "/portal/video-rooms/instant",
      accessToken,
      { method: "POST", body: {} }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "VIDEO_UNAVAILABLE",
          response.payload.error?.message ?? "Video service is not available.",
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
