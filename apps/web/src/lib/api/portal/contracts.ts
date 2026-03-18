// ════════════════════════════════════════════════════════════════════════════
// contracts.ts — Portal API: client contract list + download
// Endpoints:
//   GET    /contracts            → list own contracts
//   PATCH  /contracts/:id        → sign a contract (signed=true)
//   GET    /contracts/:id/download → { fileId } → use with getPortalFileDownloadUrlWithRefresh
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PortalContract {
  id:         string;
  clientId:   string;
  title:      string;
  type:       string;   // NDA | SOW | DPA | MSA | CONTRACT
  ref:        string | null;
  status:     string;   // PENDING | SIGNED | VOID
  signed:     boolean;
  signedAt:   string | null;
  fileId:     string | null;
  storageKey: string | null;
  mimeType:   string | null;
  sizeBytes:  number | null;
  notes:      string | null;
  sortOrder:  number;
  createdAt:  string;
  updatedAt:  string;
}

export interface PortalContractFileRef {
  fileId: string;
}

// ── List contracts ────────────────────────────────────────────────────────────

export async function loadPortalContractsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalContract[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalContract[]>("/contracts", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code    ?? "CONTRACTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load contracts."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Sign a contract ───────────────────────────────────────────────────────────

export async function signPortalContractWithRefresh(
  session: AuthSession,
  contractId: string,
  signedByName: string
): Promise<AuthorizedResult<PortalContract>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalContract>(
      `/contracts/${contractId}`,
      accessToken,
      { method: "PATCH", body: { signed: true, signedByName } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code    ?? "CONTRACT_SIGN_FAILED",
          response.payload.error?.message ?? "Unable to sign contract."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Get contract download fileId ──────────────────────────────────────────────

export async function getPortalContractFileIdWithRefresh(
  session: AuthSession,
  contractId: string
): Promise<AuthorizedResult<PortalContractFileRef>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalContractFileRef>(
      `/contracts/${contractId}/download`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code    ?? "CONTRACT_DOWNLOAD_FAILED",
          response.payload.error?.message ?? "No file attached to this contract."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Load a rendered contract template ────────────────────────────────────────

export interface ContractTemplateResult {
  renderedHtml: string;
}

export async function loadContractTemplateWithRefresh(
  session: AuthSession,
  templateId: string,
  variables: Record<string, string>
): Promise<AuthorizedResult<ContractTemplateResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const qs = new URLSearchParams(variables).toString();
    const path = `/contract-templates/${templateId}${qs ? `?${qs}` : ""}`;
    const response = await callGateway<ContractTemplateResult>(path, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code    ?? "CONTRACT_TEMPLATE_FAILED",
          response.payload.error?.message ?? "Unable to load contract template."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
