// ════════════════════════════════════════════════════════════════════════════
// portfolio.ts — Staff API client: portfolio endpoint
// Endpoint: GET /staff/me/portfolio
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

export interface StaffPortfolioProjectTasks {
  total:      number;
  done:       number;
  inProgress: number;
}

export interface StaffPortfolioProject {
  id:              string;
  name:            string;
  clientId:        string | null;
  clientName:      string;
  status:          string;
  priority:        string;
  progressPercent: number;
  dueAt:           string | null;
  budgetCents:     number;
  spentCents:      number;
  health:          "healthy" | "moderate" | "critical" | "exceeded";
  tasks:           StaffPortfolioProjectTasks;
}

export async function getMyPortfolio(
  session: AuthSession,
): Promise<AuthorizedResult<StaffPortfolioProject[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffPortfolioProject[]>(
      "/staff/me/portfolio",
      accessToken,
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_PORTFOLIO_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load portfolio."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
