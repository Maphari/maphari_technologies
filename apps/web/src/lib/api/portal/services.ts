// ════════════════════════════════════════════════════════════════════════════
// services.ts — Portal API: service catalog (packages, addons, retainers, bundles)
// Endpoint:
//   GET /portal/services → full active catalog for authenticated clients
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

export interface ServiceFeature {
  label:    string;
  included: true | false | "Basic";
}

export interface ServicePackage {
  id:            string;
  name:          string;
  slug:          string;
  tagline:       string | null;
  priceMinCents: number;
  priceMaxCents: number;
  isCustomQuote: boolean;
  deliveryDays:  string | null;
  paymentTerms:  string | null;
  idealFor:      string[];
  features:      ServiceFeature[];
  billingType:   string;
  sortOrder:     number;
  isActive:      boolean;
  createdAt:     string;
  updatedAt:     string;
}

export interface ServiceAddon {
  id:            string;
  category:      string;
  name:          string;
  description:   string | null;
  priceMinCents: number;
  priceMaxCents: number;
  priceLabel:    string | null;
  billingType:   string;
  isActive:      boolean;
  sortOrder:     number;
  createdAt:     string;
  updatedAt:     string;
}

export interface RetainerPlan {
  id:            string;
  name:          string;
  description:   string | null;
  priceMinCents: number;
  priceMaxCents: number;
  features:      string[];
  sortOrder:     number;
  isActive:      boolean;
  createdAt:     string;
  updatedAt:     string;
}

export interface ServiceBundle {
  id:          string;
  name:        string;
  description: string | null;
  discountPct: number;
  isActive:    boolean;
  sortOrder:   number;
  createdAt:   string;
  updatedAt:   string;
  packages:    Array<{ id: string; name: string; slug: string }>;
}

export interface ServiceCatalog {
  packages:  ServicePackage[];
  addons:    ServiceAddon[];
  retainers: RetainerPlan[];
  bundles:   ServiceBundle[];
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function loadPortalServicesWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ServiceCatalog>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const raw = await callGateway<ServiceCatalog>("/portal/services", accessToken);
    if (isUnauthorized(raw)) return { unauthorized: true, data: null, error: null };
    if (!raw.payload.success || !raw.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          raw.payload.error?.code ?? "CATALOG_LOAD_FAILED",
          raw.payload.error?.message ?? "Failed to load service catalog."
        )
      };
    }
    return { unauthorized: false, data: raw.payload.data, error: null };
  });
}
