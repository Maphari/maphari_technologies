/**
 * Admin Document Vault API — wraps /admin/documents gateway endpoints.
 */

import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DocCategory = "CONTRACT" | "BRIEF" | "DELIVERABLE" | "INVOICE" | "ASSET" | "TEMPLATE" | "MISC";
export type DocStatus   = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface VaultDocument {
  id:          string;
  title:       string;
  category:    DocCategory;
  description: string | null;
  status:      DocStatus;
  clientId:    string | null;
  fileName:    string;
  mimeType:    string;
  sizeBytes:   number;
  storageKey:  string;
  uploadedBy:  string;
  version:     number;
  tags:        string[];
  createdAt:   string;
  updatedAt:   string;
}

export interface DocumentsResponse {
  documents: VaultDocument[];
  total:     number;
  stats: {
    byCategory: Record<string, number>;
    byStatus:   Record<string, number>;
  };
}

export interface CreateDocumentInput {
  title:        string;
  category:     DocCategory;
  description?: string;
  status?:      DocStatus;
  clientId?:    string | null;
  fileName:     string;
  mimeType:     string;
  sizeBytes?:   number;
  storageKey:   string;
  uploadedBy?:  string;
  tags?:        string[];
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Fetch all vault documents. Optionally filter by category, clientId, status.
 */
export async function loadDocumentsWithRefresh(
  session: AuthSession,
  filters?: { category?: string; clientId?: string; status?: string }
): Promise<AuthorizedResult<DocumentsResponse>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== "ALL") params.set("category", filters.category);
    if (filters?.clientId)  params.set("clientId", filters.clientId);
    if (filters?.status)    params.set("status", filters.status);

    const qs = params.toString();
    const response = await callGateway<DocumentsResponse>(
      `/admin/documents${qs ? `?${qs}` : ""}`,
      accessToken
    );

    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "DOCUMENTS_FETCH_FAILED",
          response.payload.error?.message ?? "Failed to load documents."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

/**
 * Create a new vault document record.
 * The file should already be uploaded to S3 — storageKey is required.
 */
export async function createDocumentWithRefresh(
  session: AuthSession,
  input: CreateDocumentInput
): Promise<AuthorizedResult<VaultDocument>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<VaultDocument>("/admin/documents", accessToken, {
      method: "POST",
      body: input,
    });

    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "DOCUMENT_CREATE_FAILED",
          response.payload.error?.message ?? "Failed to create document."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

/**
 * Update vault document metadata (title, category, description, status, tags).
 */
export async function updateDocumentWithRefresh(
  session: AuthSession,
  id: string,
  patch: { title?: string; category?: DocCategory; description?: string; status?: DocStatus; tags?: string[] }
): Promise<AuthorizedResult<VaultDocument>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<VaultDocument>(`/admin/documents/${id}`, accessToken, {
      method: "PATCH",
      body: patch,
    });

    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "DOCUMENT_UPDATE_FAILED",
          response.payload.error?.message ?? "Failed to update document."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

/**
 * Archive (soft-delete) a vault document. ADMIN only.
 */
export async function archiveDocumentWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<{ id: string; archived: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ id: string; archived: boolean }>(
      `/admin/documents/${id}`,
      accessToken,
      { method: "PATCH", body: { status: "ARCHIVED" } }
    );

    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "DOCUMENT_ARCHIVE_FAILED",
          response.payload.error?.message ?? "Failed to archive document."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

/**
 * Trigger the export-index CSV download from the browser.
 * Returns the gateway URL — caller opens it or sets window.location.
 */
export function getDocumentExportIndexUrl(accessToken: string): string {
  const base = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:4000/api/v1";
  return `${base}/admin/documents/export-index?_token=${encodeURIComponent(accessToken)}`;
}
