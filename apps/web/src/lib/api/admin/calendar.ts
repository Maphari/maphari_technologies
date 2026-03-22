// ════════════════════════════════════════════════════════════════════════════
// calendar.ts — Admin API client: Unified Calendar Events
// Endpoint : GET /calendar/events?from=ISO_DATE&to=ISO_DATE
// Scope    : ADMIN — sees all appointments, milestones, sprint deadlines
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  type: "appointment" | "milestone" | "sprint_deadline";
  title: string;
  date: string;
  clientName?: string;
  projectName?: string;
  status?: string;
  sourceId: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function loadAdminCalendarEventsWithRefresh(
  session: AuthSession,
  from: string,
  to: string
): Promise<AuthorizedResult<CalendarEvent[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams({ from, to });
    const response = await callGateway<CalendarEvent[]>(
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
