import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";
import type { AdminLead } from "./types";

// ── Types ──────────────────────────────────────────────────────────────────────

export type OpportunityFilter = "no_website" | "needs_redesign" | "needs_automation" | "needs_seo";

export interface ProspectResult {
  name: string;
  company: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  rating?: number;
  opportunityType: OpportunityFilter;
  opportunityReason: string;
  pitch: string;
  source: "serpapi" | "mock";
  industry?: string;
  // Enriched fields
  healthScore?: number;    // 0–100 PageSpeed mobile performance score
  healthIssues?: string[]; // Key performance issues detected
  leadScore?: number;      // 0–100 composite lead quality score
}

export interface ProspectingInput {
  industry: string;
  location: string;
  count: number;
  filters: OpportunityFilter[];
  draftPitch?: boolean;
}

export interface ProspectingResult {
  prospects: ProspectResult[];
  totalFound: number;
  jobId: string;
}

// ── Run prospecting ────────────────────────────────────────────────────────────

export async function runProspectingWithRefresh(
  session: AuthSession,
  input: ProspectingInput
): Promise<AuthorizedResult<ProspectingResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProspectingResult>("/ai/prospect", accessToken, {
      method: "POST",
      body: input
    });

    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROSPECTING_FAILED",
          response.payload.error?.message ?? "Prospecting request failed. Please try again."
        )
      };
    }

    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Dedup: fetch existing leads for client-side matching ──────────────────────

export async function fetchLeadsForDedupWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminLead[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLead[]>("/leads", accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: [], error: null };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Build a Set of lowercased company names from an existing leads list. */
export function buildDuplicateSet(leads: AdminLead[]): Set<string> {
  return new Set(
    leads
      .map((l) => l.company?.toLowerCase().trim())
      .filter((c): c is string => !!c)
  );
}

// ── Send pitch email ───────────────────────────────────────────────────────────

export interface SendPitchInput {
  to: string;
  subject: string;
  body: string;
}

export async function sendPitchWithRefresh(
  session: AuthSession,
  input: SendPitchInput
): Promise<AuthorizedResult<{ sent: boolean; to: string; subject: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ sent: boolean; to: string; subject: string }>(
      "/ai/prospect/send-pitch",
      accessToken,
      { method: "POST", body: input }
    );

    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "SEND_FAILED",
          response.payload.error?.message ?? "Failed to send pitch email."
        )
      };
    }

    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
