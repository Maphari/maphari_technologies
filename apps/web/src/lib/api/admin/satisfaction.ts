// ════════════════════════════════════════════════════════════════════════════
// satisfaction.ts — Admin API client for NPS survey token generation
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";

// ── generateSurveyTokenWithRefresh ────────────────────────────────────────────

/**
 * Admin/Staff — generate a one-time share link token for the given survey.
 * Returns the raw token, its expiry ISO string, and the full survey URL.
 */
export async function generateSurveyTokenWithRefresh(
  session: AuthSession,
  clientId: string,
  surveyId: string
): Promise<AuthorizedResult<{ token: string; expiresAt: string; surveyUrl: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const result = await callGateway<{ token: string; expiresAt: string; surveyUrl: string }>(
      `/clients/${clientId}/surveys/${surveyId}/tokens`,
      accessToken,
      { method: "POST", body: {} }
    );

    if (isUnauthorized(result)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!result.payload.success) {
      const err = result.payload.error;
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(err?.code ?? "UNKNOWN", err?.message ?? "Failed to generate survey token.")
      };
    }

    return { unauthorized: false, data: result.payload.data ?? null, error: null };
  });
}
