import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UtilisationRow {
  staffId:          string;
  name:             string;
  role:             string;
  avatarInitials:   string;
  avatarColor:      string | null;
  billableHours:    number;
  totalHours:       number;
  utilisationRate:  number;
  target:           number;
}

export interface UtilisationSummary {
  avgBillableRate:    number;
  totalBillableHours: number;
  teamSize:           number;
}

export interface StaffUtilisationData {
  staff:   UtilisationRow[];
  summary: UtilisationSummary;
}

// ── API client ────────────────────────────────────────────────────────────────

export async function loadStaffUtilisationWithRefresh(
  session: AuthSession,
  period: "30d" | "90d" | "month" = "30d"
): Promise<AuthorizedResult<StaffUtilisationData>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffUtilisationData>(
      `/admin/staff-utilisation?period=${period}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code    ?? "UTILISATION_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load staff utilisation data."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}
