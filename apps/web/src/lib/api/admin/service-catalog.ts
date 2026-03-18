// ════════════════════════════════════════════════════════════════════════════
// service-catalog.ts — Admin API: full CRUD for service packages, add-ons,
//                       retainer plans, and bundles
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession, type AuthorizedResult } from "./_shared";

// Re-export shared catalog types so consumers can import from one place
export type { ServicePackage, ServiceAddon, RetainerPlan, ServiceBundle, ServiceCatalog, ServiceFeature } from "../portal/services";
import type { ServicePackage, ServiceAddon, RetainerPlan, ServiceBundle, ServiceCatalog } from "../portal/services";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fail<T>(payload: { error?: { code?: string; message?: string } | null }, fallbackMsg: string): { unauthorized: false; data: null; error: ReturnType<typeof toGatewayError> } {
  return {
    unauthorized: false,
    data: null,
    error: toGatewayError(
      payload.error?.code ?? "REQUEST_FAILED",
      payload.error?.message ?? fallbackMsg
    ) as ReturnType<typeof toGatewayError>
  };
}

// ── Read — full catalog (all packages including inactive) ─────────────────────

export async function loadAdminServiceCatalogWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<{ packages: ServicePackage[]; addons: ServiceAddon[]; retainers: RetainerPlan[]; bundles: ServiceBundle[] }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const [pkgs, addons, retainers, bundles] = await Promise.all([
      callGateway<ServicePackage[]>("/admin/services/packages", accessToken),
      callGateway<ServiceAddon[]>("/admin/services/addons", accessToken),
      callGateway<RetainerPlan[]>("/admin/services/retainers", accessToken),
      callGateway<ServiceBundle[]>("/admin/services/bundles", accessToken),
    ]);
    if (isUnauthorized(pkgs) || isUnauthorized(addons) || isUnauthorized(retainers) || isUnauthorized(bundles)) {
      return { unauthorized: true, data: null, error: null };
    }
    return {
      unauthorized: false,
      data: {
        packages:  pkgs.payload.data      ?? [],
        addons:    addons.payload.data    ?? [],
        retainers: retainers.payload.data ?? [],
        bundles:   bundles.payload.data   ?? [],
      },
      error: null,
    };
  });
}

// ── Packages ──────────────────────────────────────────────────────────────────

export async function createAdminPackageWithRefresh(
  session: AuthSession,
  body: Omit<ServicePackage, "id" | "createdAt" | "updatedAt">
): Promise<AuthorizedResult<ServicePackage>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<ServicePackage>("/admin/services/packages", accessToken, { method: "POST", body });
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    if (!raw.payload.success || !raw.payload.data) return fail(raw.payload, "Failed to create package.");
    return { unauthorized: false, data: raw.payload.data, error: null };
  });
}

export async function updateAdminPackageWithRefresh(
  session: AuthSession,
  id: string,
  body: Partial<Omit<ServicePackage, "id" | "createdAt" | "updatedAt">>
): Promise<AuthorizedResult<ServicePackage>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<ServicePackage>(`/admin/services/packages/${id}`, accessToken, { method: "PATCH", body });
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    if (!raw.payload.success || !raw.payload.data) return fail(raw.payload, "Failed to update package.");
    return { unauthorized: false, data: raw.payload.data, error: null };
  });
}

export async function deleteAdminPackageWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<null>(`/admin/services/packages/${id}`, accessToken, { method: "DELETE" });
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    return { unauthorized: false, data: null, error: null };
  });
}

// ── Add-ons ───────────────────────────────────────────────────────────────────

export async function createAdminAddonWithRefresh(
  session: AuthSession,
  body: Omit<ServiceAddon, "id" | "createdAt" | "updatedAt">
): Promise<AuthorizedResult<ServiceAddon>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<ServiceAddon>("/admin/services/addons", accessToken, { method: "POST", body });
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    if (!raw.payload.success || !raw.payload.data) return fail(raw.payload, "Failed to create add-on.");
    return { unauthorized: false, data: raw.payload.data, error: null };
  });
}

export async function updateAdminAddonWithRefresh(
  session: AuthSession,
  id: string,
  body: Partial<Omit<ServiceAddon, "id" | "createdAt" | "updatedAt">>
): Promise<AuthorizedResult<ServiceAddon>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<ServiceAddon>(`/admin/services/addons/${id}`, accessToken, { method: "PATCH", body });
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    if (!raw.payload.success || !raw.payload.data) return fail(raw.payload, "Failed to update add-on.");
    return { unauthorized: false, data: raw.payload.data, error: null };
  });
}

export async function deleteAdminAddonWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<null>(`/admin/services/addons/${id}`, accessToken, { method: "DELETE" });
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    return { unauthorized: false, data: null, error: null };
  });
}

// ── Retainer Plans ────────────────────────────────────────────────────────────

export async function createAdminRetainerWithRefresh(
  session: AuthSession,
  body: Omit<RetainerPlan, "id" | "createdAt" | "updatedAt">
): Promise<AuthorizedResult<RetainerPlan>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<RetainerPlan>("/admin/services/retainers", accessToken, { method: "POST", body });
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    if (!raw.payload.success || !raw.payload.data) return fail(raw.payload, "Failed to create retainer plan.");
    return { unauthorized: false, data: raw.payload.data, error: null };
  });
}

export async function updateAdminRetainerWithRefresh(
  session: AuthSession,
  id: string,
  body: Partial<Omit<RetainerPlan, "id" | "createdAt" | "updatedAt">>
): Promise<AuthorizedResult<RetainerPlan>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<RetainerPlan>(`/admin/services/retainers/${id}`, accessToken, { method: "PATCH", body });
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    if (!raw.payload.success || !raw.payload.data) return fail(raw.payload, "Failed to update retainer plan.");
    return { unauthorized: false, data: raw.payload.data, error: null };
  });
}

export async function deleteAdminRetainerWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<null>(`/admin/services/retainers/${id}`, accessToken, { method: "DELETE" });
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    return { unauthorized: false, data: null, error: null };
  });
}

// ── Bundles ───────────────────────────────────────────────────────────────────

export async function createAdminBundleWithRefresh(
  session: AuthSession,
  body: { name: string; description?: string; discountPct: number; packageIds: string[]; sortOrder?: number }
): Promise<AuthorizedResult<ServiceBundle>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<ServiceBundle>("/admin/services/bundles", accessToken, { method: "POST", body });
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    if (!raw.payload.success || !raw.payload.data) return fail(raw.payload, "Failed to create bundle.");
    return { unauthorized: false, data: raw.payload.data, error: null };
  });
}

export async function updateAdminBundleWithRefresh(
  session: AuthSession,
  id: string,
  body: { name?: string; description?: string; discountPct?: number; packageIds?: string[]; isActive?: boolean; sortOrder?: number }
): Promise<AuthorizedResult<ServiceBundle>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<ServiceBundle>(`/admin/services/bundles/${id}`, accessToken, { method: "PATCH", body });
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    if (!raw.payload.success || !raw.payload.data) return fail(raw.payload, "Failed to update bundle.");
    return { unauthorized: false, data: raw.payload.data, error: null };
  });
}

export async function deleteAdminBundleWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<null>(`/admin/services/bundles/${id}`, accessToken, { method: "DELETE" });
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    return { unauthorized: false, data: null, error: null };
  });
}
