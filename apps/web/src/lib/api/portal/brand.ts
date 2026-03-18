// ════════════════════════════════════════════════════════════════════════════
// brand.ts — Portal API client: Brand Assets
// Endpoints : GET  /brand-assets?type=...
//             POST /brand-assets
//             DELETE /brand-assets/:id
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

export interface PortalBrandAsset {
  id:          string;
  clientId:    string;
  type:        string; // LOGO | COLOR | FONT | GUIDELINE
  name:        string;
  fileId?:     string | null;
  storageKey?: string | null;
  mimeType?:   string | null;
  sizeBytes?:  number | null;
  value?:      string | null;   // hex for colors, font family name
  variant?:    string | null;   // PRIMARY | SECONDARY | DARK | LIGHT
  sortOrder:   number;
  createdAt:   string;
  updatedAt:   string;
}

export interface PortalBrandAssetCreate {
  type:        string;
  name:        string;
  fileId?:     string;
  storageKey?: string;
  mimeType?:   string;
  sizeBytes?:  number;
  value?:      string;
  variant?:    string;
  sortOrder?:  number;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function loadPortalBrandAssetsWithRefresh(
  session: AuthSession,
  type?: string
): Promise<AuthorizedResult<PortalBrandAsset[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const qs = type ? `?type=${encodeURIComponent(type)}` : "";
    const response = await callGateway<PortalBrandAsset[]>(`/brand-assets${qs}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "BRAND_ASSETS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load brand assets."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createPortalBrandAssetWithRefresh(
  session: AuthSession,
  body: PortalBrandAssetCreate
): Promise<AuthorizedResult<PortalBrandAsset>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalBrandAsset>("/brand-assets", accessToken, {
      method: "POST",
      body,
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "BRAND_ASSET_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create brand asset."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function deletePortalBrandAssetWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<{ id: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ id: string }>(`/brand-assets/${id}`, accessToken, {
      method: "DELETE",
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "BRAND_ASSET_DELETE_FAILED",
          response.payload.error?.message ?? "Unable to delete brand asset."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}
