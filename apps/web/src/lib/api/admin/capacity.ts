// ════════════════════════════════════════════════════════════════════════════
// capacity.ts — Admin API client: Capacity Planning Forecast
// Endpoint  : GET /admin/capacity-forecast
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ForecastPeriodLabel = "Next 30 days" | "31-60 days" | "61-90 days";

export interface ForecastPeriod {
  label:                ForecastPeriodLabel;
  totalCapacityHours:   number;
  projectedDemandHours: number;
  utilizationRate:      number;
  surplus:              number;
}

export interface StaffForecast {
  staffId:           string;
  name:              string;
  role:              string;
  allocatedHours30d: number;
  allocatedHours60d: number;
  allocatedHours90d: number;
  availableHours30d: number;
  status30d:         "OVER" | "NEAR" | "OK";
}

export interface CapacityForecast {
  periods:          ForecastPeriod[];
  staffForecast:    StaffForecast[];
  hiringSignal:     "OVERSTAFFED" | "BALANCED" | "UNDER_CAPACITY" | "CRITICAL";
  recommendedHires: number;
}

// ── API function ──────────────────────────────────────────────────────────────

export async function loadCapacityForecastWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<CapacityForecast>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<CapacityForecast>(
      "/admin/capacity-forecast",
      accessToken
    );

    if (isUnauthorized(res)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!res.payload.success || !res.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "CAPACITY_FORECAST_ERROR",
          res.payload.error?.message ?? "Failed to load capacity forecast."
        )
      };
    }

    return { unauthorized: false, data: res.payload.data, error: null };
  });
}
