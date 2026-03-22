// ════════════════════════════════════════════════════════════════════════════
// files.ts — Portal API client: File management endpoints
// Endpoints : GET  /files                     (list)
//             POST /files/upload-url          (presigned PUT URL)
//             POST /files/confirm-upload      (mark uploaded)
//             GET  /files/:id/download-url    (presigned GET URL)
// Scope     : CLIENT sees own files; STAFF/ADMIN see all
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
// PortalFile is declared in types.ts (shared) — re-exported below for callers
import type { PortalFile } from "./types";
export type { PortalFile };

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PortalUploadUrlResult {
  uploadUrl: string;
  fileId: string;
  key: string;
}

export interface PortalDownloadUrlResult {
  downloadUrl: string;
  expiresAt: string;
}

// ── List files ────────────────────────────────────────────────────────────────

export async function loadPortalFilesWithRefresh(
  session: AuthSession,
  options?: { category?: string; projectId?: string }
): Promise<AuthorizedResult<PortalFile[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (options?.category) params.set("category", options.category);
    if (options?.projectId) params.set("projectId", options.projectId);
    const qs = params.toString();
    const response = await callGateway<PortalFile[]>(
      `/files${qs ? `?${qs}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "FILES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load files."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Request presigned upload URL ──────────────────────────────────────────────

export async function createPortalUploadUrlWithRefresh(
  session: AuthSession,
  body: { fileName: string; mimeType: string; sizeBytes: number; clientId?: string; projectId?: string; category?: string }
): Promise<AuthorizedResult<PortalUploadUrlResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalUploadUrlResult>(
      "/files/upload-url",
      accessToken,
      { method: "POST", body }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "UPLOAD_URL_FAILED",
          response.payload.error?.message ?? "Unable to get upload URL."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Confirm upload completed ──────────────────────────────────────────────────

export async function confirmPortalUploadWithRefresh(
  session: AuthSession,
  fileId: string
): Promise<AuthorizedResult<PortalFile>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalFile>(
      "/files/confirm-upload",
      accessToken,
      { method: "POST", body: { fileId } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CONFIRM_UPLOAD_FAILED",
          response.payload.error?.message ?? "Unable to confirm upload."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Approval status type ──────────────────────────────────────────────────────

export type FileApprovalStatus = "PENDING_REVIEW" | "APPROVED" | "CHANGES_REQUESTED";

// ── Update approval status ────────────────────────────────────────────────────

export async function updatePortalFileApprovalWithRefresh(
  session: AuthSession,
  fileId: string,
  body: { status: FileApprovalStatus; note?: string }
): Promise<AuthorizedResult<PortalFile>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalFile>(
      `/files/${fileId}/approval`,
      accessToken,
      { method: "PATCH", body }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "FILE_APPROVAL_FAILED",
          response.payload.error?.message ?? "Unable to update approval status."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Load file version history ─────────────────────────────────────────────────

export async function loadPortalFileVersionsWithRefresh(
  session: AuthSession,
  fileId: string
): Promise<AuthorizedResult<PortalFile[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalFile[]>(
      `/files/${fileId}/versions`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "FILE_VERSIONS_FAILED",
          response.payload.error?.message ?? "Unable to load file versions."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Request presigned download URL ────────────────────────────────────────────

export async function getPortalFileDownloadUrlWithRefresh(
  session: AuthSession,
  fileId: string
): Promise<AuthorizedResult<PortalDownloadUrlResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalDownloadUrlResult>(
      `/files/${fileId}/download-url`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "DOWNLOAD_URL_FAILED",
          response.payload.error?.message ?? "Unable to get download URL."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
