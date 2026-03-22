// ════════════════════════════════════════════════════════════════════════════
// meetings.ts — Portal API client: Meeting archive
// Endpoints : GET  /meetings
//             POST /meetings/:id/mood
// Scope     : CLIENT read-own; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

// ── Calendar Event type (shared with portal calendar view) ────────────────────

export interface PortalCalendarEvent {
  id: string;
  type: "appointment" | "milestone" | "sprint_deadline";
  title: string;
  date: string;
  clientName?: string;
  projectName?: string;
  status?: string;
  sourceId: string;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PortalMeeting {
  id: string;
  clientId: string;
  title: string;
  meetingAt: string;
  durationMins: number;
  attendeeCount: number;
  hasRecording: boolean;
  recordingFileId: string | null;
  actionItemStatus: string;
  notes: string | null;
  clientMoodRating: number | null;
  createdAt: string;
  updatedAt: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function loadPortalMeetingsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalMeeting[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalMeeting[]>("/meetings", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "MEETINGS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load meetings."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function ratePortalMeetingWithRefresh(
  session: AuthSession,
  meetingId: string,
  rating: number
): Promise<AuthorizedResult<PortalMeeting>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalMeeting>(
      `/meetings/${meetingId}/mood`,
      accessToken,
      { method: "POST", body: { rating } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "MOOD_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update meeting rating."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function loadPortalCalendarEventsWithRefresh(
  session: AuthSession,
  from: string,
  to: string
): Promise<AuthorizedResult<PortalCalendarEvent[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams({ from, to });
    const response = await callGateway<PortalCalendarEvent[]>(
      `/calendar/events?${params.toString()}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CALENDAR_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load calendar events."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
