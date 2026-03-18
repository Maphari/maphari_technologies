import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";

// ── Types ──────────────────────────────────────────────────────────────────────

export type FunnelStage = {
  stage: "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";
  count: number;
  value: number;
  conversionRate: number;
};

export type PipelineAnalytics = {
  funnel: FunnelStage[];
  avgDealSizeZAR: number;
  avgSalesCycleDays: number;
  wonThisMonth: number;
  lostThisMonth: number;
  forecastNextMonth: number;
  topLossReasons: { reason: string; count: number }[];
  monthlyTrend: { month: string; won: number; lost: number; revenue: number }[];
};

// ── API call ───────────────────────────────────────────────────────────────────

export async function loadPipelineAnalyticsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PipelineAnalytics>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PipelineAnalytics>(
      "/admin/pipeline/conversion-analytics",
      accessToken
    );

    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PIPELINE_ANALYTICS_FAILED",
          response.payload.error?.message ?? "Failed to load pipeline analytics."
        )
      };
    }

    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
