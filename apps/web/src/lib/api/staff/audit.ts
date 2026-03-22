// ════════════════════════════════════════════════════════════════════════════
// audit.ts — Staff API client: Scoped audit events (project-level)
// Endpoints : GET /admin/audit-events?projectId=<id>
// Scope     : STAFF may only view events for projects they are assigned to.
//             ADMIN sees everything via admin/governance.ts loadAuditEventsWithRefresh.
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

export interface StaffAuditEvent {
  id:           string;
  actorId:      string | null;
  actorRole:    string | null;
  actorName:    string | null;
  action:       string;
  resourceType: string;
  resourceId:   string | null;
  details:      string | null;
  ipAddress:    string | null;
  userAgent:    string | null;
  createdAt:    string;
}

// ── Loader ────────────────────────────────────────────────────────────────────

/**
 * Load audit events scoped to a specific project.
 * STAFF role: must be assigned as a collaborator on the project.
 * The core service enforces the collaborator check server-side.
 */
export async function loadStaffAuditEventsWithRefresh(
  session: AuthSession,
  projectId: string,
  params?: { limit?: number }
): Promise<AuthorizedResult<StaffAuditEvent[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const qs = new URLSearchParams({ projectId });
    if (params?.limit) qs.set("limit", String(params.limit));
    const path = `/admin/audit-events?${qs.toString()}`;
    const res = await callGateway<StaffAuditEvent[]>(path, accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "STAFF_AUDIT_FETCH_FAILED",
          res.payload.error?.message ?? "Unable to load project audit events."
        )
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}
