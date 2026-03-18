// ════════════════════════════════════════════════════════════════════════════
// sprints.ts — Staff API client: sprint burn-down endpoint
// Endpoint : GET /sprints/burn-down?projectId=X
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

export interface DailyBurnPoint {
  date: string;
  /** Remaining points/tasks. -1 means future (no actual data yet). */
  remaining: number;
  ideal: number;
}

export interface VelocityEntry {
  sprintName: string;
  planned: number;
  completed: number;
}

export interface BurnDownData {
  sprintId: string;
  sprintName: string;
  startDate: string;
  endDate: string;
  totalPoints: number;
  completedPoints: number;
  dailyRemaining: DailyBurnPoint[];
  velocityHistory: VelocityEntry[];
}

// ── API function ──────────────────────────────────────────────────────────────

/** Load sprint burn-down chart data for a project (or the most recent active sprint). */
export async function loadSprintBurnDownWithRefresh(
  session: AuthSession,
  projectId?: string
): Promise<AuthorizedResult<BurnDownData | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
    const response = await callGateway<BurnDownData | null>(
      `/sprints/burn-down${qs}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "BURNDOWN_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load burn-down data."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}
