// ════════════════════════════════════════════════════════════════════════════
// profile.ts — Portal API client: Company Profile
// Endpoints : GET  /portal/profile
//             PATCH /portal/profile
// Scope     : CLIENT read/write own; STAFF/ADMIN full access
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

export interface PortalClientProfile {
  id: string;
  clientId?: string;
  /** Base Client fields (merged) */
  name: string;
  billingEmail: string | null;
  ownerName: string | null;
  timezone: string | null;
  tier: string;
  slaTier: string;
  contractStartAt: string | null;
  contractRenewalAt: string | null;
  /** Profile fields */
  companyName:    string | null;
  tagline:        string | null;
  mission:        string | null;
  vision:         string | null;
  description:    string | null;
  industry:       string | null;
  website:        string | null;
  logoUrl:        string | null;
  primaryColor:   string | null;
  socialLinks?:   { linkedin?: string; twitter?: string; instagram?: string; github?: string } | null;
  yearFounded?:   number | null;
  teamSize?:      string | null;
  hqLocation?:    string | null;
  coverImageUrl?: string | null;
  updatedAt?:     string;
}

export interface PortalClientProfilePatch {
  companyName?:   string;
  tagline?:       string;
  mission?:       string;
  vision?:        string;
  description?:   string;
  industry?:      string;
  website?:       string;
  logoUrl?:       string;
  primaryColor?:  string;
  socialLinks?:   { linkedin?: string; twitter?: string; instagram?: string; github?: string };
  yearFounded?:   number;
  teamSize?:      string;
  hqLocation?:    string;
  coverImageUrl?: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function loadPortalProfileWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalClientProfile>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalClientProfile>("/portal/profile", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROFILE_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load company profile."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function updatePortalProfileWithRefresh(
  session: AuthSession,
  patch: PortalClientProfilePatch
): Promise<AuthorizedResult<PortalClientProfile>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalClientProfile>("/portal/profile", accessToken, {
      method: "PATCH",
      body: patch,
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PROFILE_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update company profile."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}
