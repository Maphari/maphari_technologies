// ════════════════════════════════════════════════════════════════════════════
// profile.ts — Portal API client: Account Profile
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
  accountType?: "COMPANY" | "INDIVIDUAL";
  onboardingCompleted?: boolean;
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
  projectName?: string | null;
  projectBrief?: string | null;
  legalCompanyName?: string | null;
  tradingName?: string | null;
  primaryContactName?: string | null;
  primaryContactRole?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  tagline:        string | null;
  mission:        string | null;
  vision:         string | null;
  description:    string | null;
  officialBlurb?: string | null;
  partnerBlurb?: string | null;
  industry:       string | null;
  website:        string | null;
  logoUrl:        string | null;
  primaryColor:   string | null;
  approvedBrandColors?: string[] | null;
  approvalPreferences?: PortalClientApprovalPreferences | null;
  identityAssets?: PortalClientIdentityAssets | null;
  socialLinks?:   { linkedin?: string; twitter?: string; instagram?: string; github?: string } | null;
  stakeholders?:  PortalClientStakeholder[];
  profileAuditEvents?: PortalClientProfileAuditEvent[];
  profileCompleteness?: PortalClientProfileCompleteness | null;
  previewProfile?: PortalClientProfilePreview | null;
  yearFounded?:   number | null;
  teamSize?:      string | null;
  hqLocation?:    string | null;
  coverImageUrl?: string | null;
  updatedAt?:     string;
}

export interface PortalClientStakeholder {
  id: string;
  role: "DECISION_MAKER" | "BILLING" | "MARKETING" | "OPERATIONS" | "TECHNICAL";
  fullName: string;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  preferredChannel?: "EMAIL" | "PHONE" | "WHATSAPP" | "PORTAL" | null;
  isPrimary: boolean;
  notes?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortalClientApprovalPreferences {
  ownerStakeholderId?: string | null;
  fallbackStakeholderId?: string | null;
  preferredChannel?: "EMAIL" | "PHONE" | "WHATSAPP" | "PORTAL" | null;
  responseTargetHours?: number | null;
  escalationContact?: string | null;
  approvalNotes?: string | null;
}

export interface PortalClientIdentityDocument {
  fileId: string;
  label: string;
  fileName?: string | null;
}

export interface PortalClientIdentityAssets {
  preferredLogoFileId?: string | null;
  companyOverview?: PortalClientIdentityDocument | null;
  brandGuide?: PortalClientIdentityDocument | null;
  registrationDocument?: PortalClientIdentityDocument | null;
  taxDocument?: PortalClientIdentityDocument | null;
}

export interface PortalClientProfileAuditEvent {
  id: string;
  section: string;
  summary: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  actorName?: string | null;
  createdAt: string;
}

export interface PortalClientProfileChecklistItem {
  key: string;
  label: string;
  complete: boolean;
  section: string;
}

export interface PortalClientProfileCompleteness {
  accountType?: "COMPANY" | "INDIVIDUAL";
  onboardingCompleted?: boolean;
  score: number;
  completedItems: number;
  totalItems: number;
  missingKeys: string[];
  requiredMissingFields?: string[];
  checklist: PortalClientProfileChecklistItem[];
}

export interface PortalClientProfilePreview {
  accountType?: "COMPANY" | "INDIVIDUAL";
  displayName: string;
  legalName: string | null;
  tagline: string | null;
  projectBrief?: string | null;
  blurb: string | null;
  website: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
}

export interface PortalClientProfilePatch {
  accountType?: "COMPANY" | "INDIVIDUAL";
  onboardingCompleted?: boolean;
  companyName?:   string;
  projectName?: string;
  projectBrief?: string;
  legalCompanyName?: string;
  tradingName?: string;
  primaryContactName?: string;
  primaryContactRole?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  tagline?:       string;
  mission?:       string;
  vision?:        string;
  description?:   string;
  officialBlurb?: string;
  partnerBlurb?: string;
  industry?:      string;
  website?:       string;
  logoUrl?:       string;
  primaryColor?:  string;
  approvedBrandColors?: string[];
  approvalPreferences?: PortalClientApprovalPreferences;
  identityAssets?: PortalClientIdentityAssets;
  socialLinks?:   { linkedin?: string; twitter?: string; instagram?: string; github?: string };
  stakeholders?:  Array<Omit<PortalClientStakeholder, "createdAt" | "updatedAt">>;
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
          response.payload.error?.message ?? "Unable to load account profile."
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
          response.payload.error?.message ?? "Unable to update account profile."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

// ── Data Privacy ──────────────────────────────────────────────────────────────

export interface DataExportRequestResult {
  id:          string;
  status:      string;
  requestedAt: string;
  clientId:    string | null;
  message:     string;
}

export async function requestDataExportWithRefresh(
  session: AuthSession,
  body?: { reason?: string }
): Promise<AuthorizedResult<DataExportRequestResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<DataExportRequestResult>(
      "/data-export-requests",
      accessToken,
      { method: "POST", body: body ?? {} }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "DATA_EXPORT_FAILED",
          response.payload.error?.message ?? "Unable to submit data export request."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function revokeAllSessionsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<{ revokedCount: number }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ revokedCount: number }>(
      "/auth/revoke-all-sessions",
      accessToken,
      { method: "POST" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "REVOKE_ALL_FAILED",
          response.payload.error?.message ?? "Unable to sign out all devices."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function revokeMySessionsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<{ revokedCount: number }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ revokedCount: number }>(
      "/auth/me/sessions",
      accessToken,
      { method: "DELETE" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "SESSIONS_REVOKE_FAILED",
          response.payload.error?.message ?? "Unable to revoke sessions."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export interface PortalAuthSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export async function loadMyAuthSessionsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalAuthSession[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalAuthSession[]>(
      "/auth/me/sessions",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      const code = response.payload.error?.code ?? "SESSIONS_FETCH_FAILED";
      if (code === "FORBIDDEN") {
        return { unauthorized: false, data: [], error: null };
      }
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          code,
          response.payload.error?.message ?? "Unable to load active sessions."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function requestAccountDeletionWithRefresh(
  session: AuthSession,
  body: { confirmation: string; reason?: string }
): Promise<AuthorizedResult<DataExportRequestResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<DataExportRequestResult>(
      "/account-deletion-requests",
      accessToken,
      { method: "POST", body }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "ACCOUNT_DELETION_FAILED",
          response.payload.error?.message ?? "Unable to submit account deletion request."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
