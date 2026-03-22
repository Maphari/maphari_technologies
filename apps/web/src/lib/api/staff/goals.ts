// ════════════════════════════════════════════════════════════════════════════
// goals.ts — Staff API client: OKR / personal goal tracking endpoints
// Endpoints : GET    /staff/goals?quarter=Q1-2026
//             POST   /staff/goals
//             PATCH  /staff/goals/:id
//             DELETE /staff/goals/:id
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

// ── Types ─────────────────────────────────────────────────────────────────────

export type GoalStatus = "ACTIVE" | "ACHIEVED" | "CANCELLED";

export interface StaffGoal {
  id:          string;
  staffUserId: string;
  title:       string;
  description: string | null;
  targetDate:  string;
  progress:    number;
  status:      GoalStatus;
  quarter:     string;
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateGoalInput {
  title:        string;
  description?: string;
  targetDate:   string;
  quarter:      string;
  progress?:    number;
}

export interface UpdateGoalInput {
  title?:       string;
  description?: string;
  targetDate?:  string;
  quarter?:     string;
  progress?:    number;
  status?:      GoalStatus;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** Fetch goals for the authenticated staff user, optionally filtered by quarter */
export async function loadStaffGoalsWithRefresh(
  session: AuthSession,
  quarter?: string
): Promise<AuthorizedResult<StaffGoal[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const qs = quarter ? `?quarter=${encodeURIComponent(quarter)}` : "";
    const response = await callGateway<StaffGoal[]>(
      `/staff/goals${qs}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "GOALS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load goals."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Create a new personal goal */
export async function createStaffGoalWithRefresh(
  session: AuthSession,
  data: CreateGoalInput
): Promise<AuthorizedResult<StaffGoal>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffGoal>(
      "/staff/goals",
      accessToken,
      { method: "POST", body: data }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "GOAL_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create goal."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Update progress, status, title, or other fields on a goal */
export async function updateStaffGoalWithRefresh(
  session: AuthSession,
  id: string,
  data: UpdateGoalInput
): Promise<AuthorizedResult<StaffGoal>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffGoal>(
      `/staff/goals/${id}`,
      accessToken,
      { method: "PATCH", body: data }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "GOAL_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update goal."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Soft-delete (cancel) a goal */
export async function deleteStaffGoalWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<void>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<null>(
      `/staff/goals/${id}`,
      accessToken,
      { method: "DELETE" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "GOAL_DELETE_FAILED",
          response.payload.error?.message ?? "Unable to cancel goal."
        )
      };
    }
    return { unauthorized: false, data: undefined, error: null };
  });
}
