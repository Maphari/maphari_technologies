// ════════════════════════════════════════════════════════════════════════════
// staff-schedule.ts — Admin API client: Staff scheduling timeline
// Endpoint : GET /admin/staff-schedule
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./_shared";
// ── Types ─────────────────────────────────────────────────────────────────────

export interface StaffScheduleWeek {
  weekStart: string; // ISO date string (YYYY-MM-DD)
  status: "available" | "partial" | "on-leave";
  leaveReason?: string;
  projectAssignments: Array<{ projectId: string; projectName: string }>;
}

export interface StaffScheduleEntry {
  staffId: string;
  staffName: string;
  role: string;
  weeklyCapacity: number; // hours (default 40)
  weeks: StaffScheduleWeek[];
}

// ── API function ──────────────────────────────────────────────────────────────

export async function loadAdminStaffScheduleWithRefresh(
  session: AuthSession,
  weekStart?: string,
  weeksAhead?: number
): Promise<AuthorizedResult<StaffScheduleEntry[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (weekStart) params.set("weekStart", weekStart);
    if (weeksAhead !== undefined) params.set("weeksAhead", String(weeksAhead));
    const qs = params.size > 0 ? `?${params.toString()}` : "";

    const response = await callGateway<StaffScheduleEntry[]>(
      `/admin/staff-schedule${qs}`,
      accessToken
    );

    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_SCHEDULE_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load staff schedule."
        ),
      };
    }

    return {
      unauthorized: false,
      data: response.payload.data,
      error: null,
    };
  });
}

