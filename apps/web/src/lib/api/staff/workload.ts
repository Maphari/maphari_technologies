// ════════════════════════════════════════════════════════════════════════════
// workload.ts — Staff API client: workload capacity heatmap
// Endpoint : GET /staff/workload-heatmap?weeks=4
// Returns  : { staff: StaffWorkloadRow[] }
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

export interface WorkloadWeek {
  weekLabel:      string;
  allocatedHours: number;
  availableHours: number;
}

export interface StaffWorkloadRow {
  staffId: string;
  name:    string;
  role:    string;
  weeks:   WorkloadWeek[];
}

export interface WorkloadHeatmap {
  staff: StaffWorkloadRow[];
}

// ── API function ──────────────────────────────────────────────────────────────

/** Get 4-week workload capacity heatmap for all active staff */
export async function getWorkloadHeatmap(
  session: AuthSession,
  weeks = 4
): Promise<AuthorizedResult<WorkloadHeatmap>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<WorkloadHeatmap>(
      `/staff/workload-heatmap?weeks=${weeks}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "WORKLOAD_HEATMAP_FAILED",
          response.payload.error?.message ?? "Unable to load workload heatmap."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
