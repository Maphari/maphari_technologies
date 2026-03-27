// ════════════════════════════════════════════════════════════════════════════
// team.ts — Portal API client: Client Team Management
// Endpoints : GET  /clients/:clientId/team           (list team members)
//             POST /clients/:clientId/team/invite    (invite new member)
// Scope     : CLIENT scoped to own clientId; ADMIN/STAFF can query any
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
export interface PortalTeamMember {
  id: string;
  clientId: string;
  name: string;
  email: string;
  role: string;
  canManageAccess: boolean;
  status: string;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface PortalTeamInvite {
  id: string;
  email: string;
  role: string;
  canManageAccess: boolean;
  status: string;
  createdAt: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function loadPortalTeamMembersWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<PortalTeamMember[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<PortalTeamMember[]>(
      `/clients/${clientId}/team`,
      accessToken
    );
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          res.payload.error?.code ?? "TEAM_FETCH_FAILED",
          res.payload.error?.message ?? "Unable to load team members."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function invitePortalTeamMemberWithRefresh(
  session: AuthSession,
  clientId: string,
  body: { email: string; role: string; name?: string }
): Promise<AuthorizedResult<PortalTeamInvite>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<PortalTeamInvite>(
      `/clients/${clientId}/team/invite`,
      accessToken,
      { method: "POST", body }
    );
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success || !res.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "TEAM_INVITE_FAILED",
          res.payload.error?.message ?? "Unable to send invitation."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data, error: null };
  });
}
