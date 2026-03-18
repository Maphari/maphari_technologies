// ════════════════════════════════════════════════════════════════════════════
// retainer.ts — Portal API client: Retainer weekly burn
// Endpoint : GET /retainer → PortalRetainerWeek[]  (CLIENT scoped to own data)
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PortalRetainerWeek {
  /** Human-readable label, e.g. "Week 1" */
  week: string;
  /** ISO date of Monday for the week, e.g. "2026-01-06" */
  weekStart: string;
  /** Hours logged for Development */
  dev: number;
  /** Hours logged for Design */
  design: number;
  /** Hours logged for Project Management */
  pm: number;
  /** Hours logged for QA & Testing */
  qa: number;
  /** Total hours across all categories */
  total: number;
}

// ── API function ───────────────────────────────────────────────────────────────

export async function loadPortalRetainerWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalRetainerWeek[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<PortalRetainerWeek[]>("/retainer", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "RETAINER_FETCH_FAILED",
          res.payload.error?.message ?? "Unable to load retainer burn data."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}
