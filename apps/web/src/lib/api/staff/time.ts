// ════════════════════════════════════════════════════════════════════════════
// time.ts — Staff API client: time-log endpoints
// Endpoints : GET  /time-entries
//             POST /time-entries
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Returns the ISO week string for the given date, e.g. "2026-W12" */
export function getIsoWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Returns the ISO week number (1-52) for the given date */
export function getIsoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface StaffTimeEntry {
  id: string;
  projectId: string;
  staffId: string;
  taskLabel: string | null;
  minutes: number;
  loggedAt: string;
  createdAt: string;
  status?: string;       // DRAFT | SUBMITTED | APPROVED | REJECTED
  submittedAt?: string | null;
  submittedWeek?: string | null;
}

export interface LogTimeInput {
  projectId: string;
  taskLabel?: string;
  minutes: number;
  loggedAt?: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** Get time entries for the authenticated staff member */
export async function getMyTimeEntries(
  session: AuthSession
): Promise<AuthorizedResult<StaffTimeEntry[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffTimeEntry[]>(
      "/time-entries",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_TIME_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load time entries."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Log a time entry for the authenticated staff member */
export async function logTime(
  session: AuthSession,
  input: LogTimeInput
): Promise<AuthorizedResult<StaffTimeEntry>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffTimeEntry>(
      "/time-entries",
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_TIME_LOG_FAILED",
          response.payload.error?.message ?? "Unable to log time entry."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Stop an active time entry and record its end time + minutes */
export async function stopTimeEntryWithRefresh(
  session: AuthSession,
  entryId: string,
  body?: { taskLabel?: string }
): Promise<AuthorizedResult<StaffTimeEntry>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffTimeEntry>(
      `/time-entries/${entryId}/stop`,
      accessToken,
      { method: "PATCH", body: body ?? {} }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TIME_ENTRY_STOP_FAILED",
          response.payload.error?.message ?? "Unable to stop time entry."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Submit all DRAFT time entries for the given ISO week (e.g. "2026-W12") */
export async function submitWeekTimesheetWithRefresh(
  session: AuthSession,
  week: string
): Promise<AuthorizedResult<{ count: number }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ count: number }>(
      "/time-entries/submit-week",
      accessToken,
      { method: "PATCH", body: { week } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "TIMESHEET_SUBMIT_FAILED",
          response.payload.error?.message ?? "Unable to submit timesheet."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
