// ════════════════════════════════════════════════════════════════════════════
// vendors.ts — Admin API client: vendors & contracts
// Endpoints : GET  /vendors
//             POST /vendors
//             GET  /vendors/:id/contracts
//             POST /vendors/:id/contracts
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession, type AuthorizedResult } from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AdminVendorContract {
  id: string;
  vendorId: string;
  startAt: string;
  endAt: string | null;
  valueCents: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVendor {
  id: string;
  name: string;
  category: string | null;
  contactName: string | null;
  contactEmail: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  contracts: AdminVendorContract[];
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function loadVendorsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminVendor[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminVendor[]>("/vendors", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "VENDORS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load vendors.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadVendorContractsWithRefresh(
  session: AuthSession,
  vendorId: string
): Promise<AuthorizedResult<AdminVendorContract[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminVendorContract[]>(`/vendors/${vendorId}/contracts`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "VENDOR_CONTRACTS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load vendor contracts.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
