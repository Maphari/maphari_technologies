// ════════════════════════════════════════════════════════════════════════════
// performance.ts — Staff API client: personal + team performance, top-tasks,
//                  response-times, milestone sign-offs
// Endpoints : GET /staff/me/top-tasks
//             GET /staff/me/performance
//             GET /staff/team-performance
//             GET /staff/me/response-times
//             GET /staff/me/milestone-signoffs
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

export interface StaffTopTask {
  id:       string;
  title:    string;
  status:   string;
  priority: string;
  dueDate:  string | null;
  project:  string;
  client:   string;
}

export interface StaffPerformanceWeek {
  week:           string;
  hoursLogged:    number;
  tasksCompleted: number;
}

export interface StaffPerformanceClient {
  clientId:    string;
  clientName:  string;
  hoursLogged: number;
}

export interface StaffPerformanceMilestone {
  id:         string;
  title:      string;
  status:     string;
  approvedAt: string | null;
}

export interface StaffPerformance {
  weeklyData:       StaffPerformanceWeek[];
  clientBreakdown:  StaffPerformanceClient[];
  milestoneHistory: StaffPerformanceMilestone[];
}

export interface StaffTeamMember {
  id:             string;
  name:           string;
  role:           string;
  department:     string | null;
  hoursThisWeek:  number;
  tasksCompleted: number;
  utilizationPct: number;
  peerRating:     number | null;
  avatarInitials: string;       // ADD THIS
  isSelf:         boolean;      // ADD THIS
}

export interface StaffResponseTimeWeek {
  week: string;
  avg:  number;
}

export interface StaffResponseTimeClient {
  clientId: string;
  name:     string;
  avg:      number;
}

export interface StaffResponseTimes {
  target:      number;
  overallAvg:  number;
  weeklyTrend: StaffResponseTimeWeek[];
  byClient:    StaffResponseTimeClient[];
}

export interface StaffMilestoneDeliverable {
  id:     string;
  title:  string;
  status: string;
}

export type MilestoneSignoffStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface StaffMilestoneSignoff {
  id:             string;
  milestoneId:    string;
  milestoneTitle: string;
  projectName:    string;
  clientName:     string;
  deliverables:   StaffMilestoneDeliverable[];
  status:         MilestoneSignoffStatus;
  requestedAt:    string;
  approvedAt:     string | null;
  dueDate:        string | null;
  comment:        string | null;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** Get top 3 active tasks assigned to the authenticated staff member */
export async function getStaffTopTasks(
  session: AuthSession
): Promise<AuthorizedResult<StaffTopTask[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffTopTask[]>(
      "/staff/me/top-tasks",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_TOP_TASKS_FAILED",
          response.payload.error?.message ?? "Unable to load top tasks."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Get personal performance data for the authenticated staff member */
export async function getStaffMyPerformance(
  session: AuthSession
): Promise<AuthorizedResult<StaffPerformance>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffPerformance>(
      "/staff/me/performance",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_PERFORMANCE_FAILED",
          response.payload.error?.message ?? "Unable to load performance data."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Get team-wide performance for all active staff members */
export async function getStaffTeamPerformance(
  session: AuthSession
): Promise<AuthorizedResult<StaffTeamMember[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffTeamMember[]>(
      "/staff/team-performance",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_TEAM_PERFORMANCE_FAILED",
          response.payload.error?.message ?? "Unable to load team performance."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Get response-time SLA records for the authenticated staff member */
export async function getStaffResponseTimes(
  session: AuthSession
): Promise<AuthorizedResult<StaffResponseTimes>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffResponseTimes>(
      "/staff/me/response-times",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_RESPONSE_TIMES_FAILED",
          response.payload.error?.message ?? "Unable to load response time data."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Get milestone approval items assigned to the authenticated staff member */
export async function getStaffMilestoneSignoffs(
  session: AuthSession
): Promise<AuthorizedResult<StaffMilestoneSignoff[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffMilestoneSignoff[]>(
      "/staff/me/milestone-signoffs",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_MILESTONE_SIGNOFFS_FAILED",
          response.payload.error?.message ?? "Unable to load milestone sign-offs."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
