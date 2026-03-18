// ════════════════════════════════════════════════════════════════════════════
// integrations.ts — Portal API client: integration options
// Endpoints : GET /portal/settings/integrations
// Scope     : CLIENT read own; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

export interface PortalIntegration {
  provider: string;
  label: string;
  category: string;
  status: "connected" | "not_connected";
  connectedAt: string | null;
}

export async function loadPortalIntegrationsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalIntegration[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalIntegration[]>(
      "/portal/settings/integrations",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "INTEGRATIONS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load integrations."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
