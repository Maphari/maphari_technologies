// ════════════════════════════════════════════════════════════════════════════
// interventions.ts — Staff API client: client intervention queue
// Endpoints : GET /staff/interventions
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

export interface StaffIntervention {
  id:          string;
  clientId:    string;
  clientName:  string;
  type:        string;
  description: string;
  priority:    string;
  status:      string;
  dueDate:     string | null;
  createdAt:   string;
  isOverdue:   boolean;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** List all client interventions visible to the authenticated staff member */
export async function getStaffInterventions(
  session: AuthSession
): Promise<AuthorizedResult<StaffIntervention[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffIntervention[]>(
      "/staff/interventions",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_INTERVENTIONS_FAILED",
          response.payload.error?.message ?? "Unable to load interventions."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Create intervention ────────────────────────────────────────────────────────

export interface CreateInterventionInput {
  clientId:    string;
  type:        string;
  description: string;
  priority?:   string;
}

/** Create a new intervention for a client */
export async function createStaffInterventionWithRefresh(
  session: AuthSession,
  input:   CreateInterventionInput
): Promise<AuthorizedResult<StaffIntervention>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffIntervention>(
      "/interventions",
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "INTERVENTION_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create intervention."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
