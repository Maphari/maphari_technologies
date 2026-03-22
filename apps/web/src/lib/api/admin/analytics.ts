// ════════════════════════════════════════════════════════════════════════════
// analytics.ts — Admin CLV + churn risk analytics API
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";

export interface ClientCLV {
  clientId: string;
  clv: number;
  avgMonthly: number;
  engagementMonths: number;
  churnRisk: number;
  missedInvoices: number;
  totalInvoices: number;
  daysSinceLastActivity: number;
}

export async function loadAdminClientCLVWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ClientCLV[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientCLV[]>("/admin/analytics/clv", accessToken);

    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CLV_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load CLV analytics."
        )
      };
    }

    return {
      unauthorized: false,
      data: response.payload.data,
      error: null
    };
  });
}
