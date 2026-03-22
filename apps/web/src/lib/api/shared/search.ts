/**
 * Global search API — shared by admin, staff and client dashboards.
 * Calls GET /search?q= through the gateway.
 */

import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession, type AuthorizedResult } from "../portal/internal";

export type SearchResultType = "client" | "project" | "lead" | "task" | "ticket" | "proposal" | "deliverable" | "article";

export interface SearchHit {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  status?: string;
  clientId?: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchHit[];
}

/**
 * Calls the gateway /search endpoint and returns results.
 * Handles token refresh transparently via withAuthorizedSession.
 */
export async function searchGlobal(
  query: string,
  session: AuthSession
): Promise<AuthorizedResult<SearchResponse>> {
  const q = query.trim();
  if (q.length < 2) {
    return {
      data: { query: q, total: 0, results: [] },
      nextSession: session,
      error: null
    };
  }

  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<SearchResponse>(
      `/search?q=${encodeURIComponent(q)}`,
      accessToken
    );
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "SEARCH_FAILED",
          res.payload.error?.message ?? "Search request failed."
        )
      };
    }
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}
