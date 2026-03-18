import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";
import type {
  AdminClient,
  AdminLead,
  AdminSnapshot,
  AdminInvoice,
  AdminPayment,
  AdminProject,
  ClientContact,
  ClientActivity,
  ClientStatusHistory,
  ClientDirectoryResult,
  ClientDetail,
  LeadActivity,
  LeadPreference,
  LeadAnalyticsSummary
} from "./types";

function emptySnapshot(): AdminSnapshot {
  return { clients: [], projects: [], leads: [], invoices: [], payments: [] };
}

/**
 * Loads admin datasets from gateway routes; the admin UI relies on this
 * snapshot for KPI, pipeline, and table renderers.
 */
export async function loadAdminSnapshotWithRefresh(session: AuthSession): Promise<AuthorizedResult<AdminSnapshot>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const [clients, projects, leads, invoices, payments] = await Promise.all([
      callGateway<AdminClient[]>("/clients", accessToken),
      callGateway<AdminProject[]>("/projects", accessToken),
      callGateway<AdminLead[]>("/leads", accessToken),
      callGateway<AdminInvoice[]>("/invoices", accessToken),
      callGateway<AdminPayment[]>("/payments", accessToken)
    ]);

    if (
      isUnauthorized(clients) ||
      isUnauthorized(projects) ||
      isUnauthorized(leads) ||
      isUnauthorized(invoices) ||
      isUnauthorized(payments)
    ) {
      return { unauthorized: true, data: null, error: null };
    }

    const firstError =
      (!clients.payload.success ? clients.payload.error : null) ||
      (!projects.payload.success ? projects.payload.error : null) ||
      (!leads.payload.success ? leads.payload.error : null) ||
      (!invoices.payload.success ? invoices.payload.error : null) ||
      (!payments.payload.success ? payments.payload.error : null);

    if (firstError) {
      return {
        unauthorized: false,
        data: emptySnapshot(),
        error: toGatewayError(firstError.code, firstError.message)
      };
    }

    return {
      unauthorized: false,
      data: {
        clients: clients.payload.data ?? [],
        projects: projects.payload.data ?? [],
        leads: leads.payload.data ?? [],
        invoices: invoices.payload.data ?? [],
        payments: payments.payload.data ?? []
      },
      error: null
    };
  });
}

/**
 * Persists lead stage movement via gateway/core and returns the updated lead.
 */
export async function updateLeadStatusWithRefresh(
  session: AuthSession,
  leadId: string,
  status: import("./types").LeadPipelineStatus,
  options: { lostReason?: string } = {}
): Promise<AuthorizedResult<AdminLead>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLead>(`/leads/${leadId}/status`, accessToken, {
      method: "PATCH",
      body: { status, lostReason: options.lostReason }
    });

    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "LEAD_STATUS_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to move lead status"
        )
      };
    }

    return {
      unauthorized: false,
      data: response.payload.data,
      error: null
    };
  });
}

export async function updateLeadWithRefresh(
  session: AuthSession,
  leadId: string,
  input: {
    title?: string;
    source?: string;
    notes?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    company?: string;
    ownerName?: string;
    nextFollowUpAt?: string | null;
  }
): Promise<AuthorizedResult<AdminLead>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLead>(`/leads/${leadId}`, accessToken, {
      method: "PATCH",
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
          response.payload.error?.code ?? "LEAD_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update lead."
        )
      };
    }

    return {
      unauthorized: false,
      data: response.payload.data,
      error: null
    };
  });
}

export async function bulkUpdateLeadStatusWithRefresh(
  session: AuthSession,
  input: { leadIds: string[]; status: import("./types").LeadPipelineStatus; lostReason?: string }
): Promise<AuthorizedResult<AdminLead[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLead[]>("/leads/bulk-status", accessToken, {
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
          response.payload.error?.code ?? "LEAD_BULK_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to bulk update leads."
        )
      };
    }

    return {
      unauthorized: false,
      data: response.payload.data,
      error: null
    };
  });
}

export async function mergeLeadsWithRefresh(
  session: AuthSession,
  input: { primaryLeadId: string; duplicateLeadId: string }
): Promise<AuthorizedResult<AdminLead>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLead>("/leads/merge", accessToken, {
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
          response.payload.error?.code ?? "LEAD_MERGE_FAILED",
          response.payload.error?.message ?? "Unable to merge leads."
        )
      };
    }

    return {
      unauthorized: false,
      data: response.payload.data,
      error: null
    };
  });
}

export async function loadLeadActivitiesWithRefresh(
  session: AuthSession,
  leadId: string
): Promise<AuthorizedResult<LeadActivity[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadActivity[]>(`/leads/${leadId}/activities`, accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "LEAD_ACTIVITIES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch lead activities."
        )
      };
    }

    return {
      unauthorized: false,
      data: response.payload.data ?? [],
      error: null
    };
  });
}

export async function getLeadPreferenceWithRefresh(
  session: AuthSession,
  key: "savedView" | "slaConfig"
): Promise<AuthorizedResult<LeadPreference | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadPreference | null>(`/leads/preferences?key=${key}`, accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "LEAD_PREF_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch lead preference."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function setLeadPreferenceWithRefresh(
  session: AuthSession,
  input: { key: "savedView" | "slaConfig"; value: string }
): Promise<AuthorizedResult<LeadPreference>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadPreference>("/leads/preferences", accessToken, {
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
          response.payload.error?.code ?? "LEAD_PREF_SAVE_FAILED",
          response.payload.error?.message ?? "Unable to save lead preference."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadLeadAnalyticsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<LeadAnalyticsSummary | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadAnalyticsSummary>("/leads/analytics", accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "LEAD_ANALYTICS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch lead analytics."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function loadClientDirectoryWithRefresh(
  session: AuthSession,
  query: {
    q?: string;
    status?: "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED";
    tier?: "STARTER" | "GROWTH" | "ENTERPRISE";
    sortBy?: "name" | "updatedAt" | "createdAt" | "contractRenewalAt";
    sortDir?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AuthorizedResult<ClientDirectoryResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    });
    const response = await callGateway<ClientDirectoryResult>(`/clients/directory?${params.toString()}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 20 },
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_DIRECTORY_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client directory."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadClientDetailWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<ClientDetail>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientDetail>(`/clients/${clientId}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_DETAIL_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client details."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createClientWithRefresh(
  session: AuthSession,
  input: {
    name: string;
    status?: "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED";
    priority?: "LOW" | "MEDIUM" | "HIGH";
    tier?: "STARTER" | "GROWTH" | "ENTERPRISE";
    timezone?: string;
    billingEmail?: string;
    ownerName?: string;
    contractStartAt?: string;
    contractRenewalAt?: string;
    slaTier?: "STANDARD" | "PRIORITY" | "ENTERPRISE";
    slaResponseHours?: number;
    notes?: string;
  }
): Promise<AuthorizedResult<AdminClient>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminClient>("/clients", accessToken, { method: "POST", body: input });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create client."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateClientWithRefresh(
  session: AuthSession,
  clientId: string,
  input: {
    name?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    tier?: "STARTER" | "GROWTH" | "ENTERPRISE";
    timezone?: string;
    billingEmail?: string;
    ownerName?: string;
    contractStartAt?: string | null;
    contractRenewalAt?: string | null;
    slaTier?: "STANDARD" | "PRIORITY" | "ENTERPRISE";
    slaResponseHours?: number;
    notes?: string;
  }
): Promise<AuthorizedResult<AdminClient>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminClient>(`/clients/${clientId}`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update client."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateClientStatusWithRefresh(
  session: AuthSession,
  clientId: string,
  status: "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED",
  reason?: string
): Promise<AuthorizedResult<AdminClient>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminClient>(`/clients/${clientId}/status`, accessToken, {
      method: "PATCH",
      body: { status, reason }
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_STATUS_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update client status."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadClientContactsWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<ClientContact[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientContact[]>(`/clients/${clientId}/contacts`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_CONTACTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client contacts."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createClientContactWithRefresh(
  session: AuthSession,
  clientId: string,
  input: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    isPrimary?: boolean;
  }
): Promise<AuthorizedResult<ClientContact>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientContact>(`/clients/${clientId}/contacts`, accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_CONTACT_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create client contact."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateClientContactWithRefresh(
  session: AuthSession,
  clientId: string,
  contactId: string,
  input: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    isPrimary?: boolean;
  }
): Promise<AuthorizedResult<ClientContact>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientContact>(`/clients/${clientId}/contacts/${contactId}`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_CONTACT_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update client contact."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadClientActivitiesWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<ClientActivity[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientActivity[]>(`/clients/${clientId}/activities`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_ACTIVITIES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client activities."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadClientStatusHistoryWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<ClientStatusHistory[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientStatusHistory[]>(`/clients/${clientId}/status-history`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_STATUS_HISTORY_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client status history."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function getClientPreferenceWithRefresh(
  session: AuthSession,
  key: "savedView"
): Promise<AuthorizedResult<LeadPreference | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadPreference | null>(`/client-preferences?key=${key}`, accessToken);
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLIENT_PREF_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to fetch client preference."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function setClientPreferenceWithRefresh(
  session: AuthSession,
  input: { key: "savedView"; value: string }
): Promise<AuthorizedResult<LeadPreference>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LeadPreference>("/client-preferences", accessToken, {
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
          response.payload.error?.code ?? "CLIENT_PREF_SAVE_FAILED",
          response.payload.error?.message ?? "Unable to save client preference."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Client Portal Branding ────────────────────────────────────────────────────

export interface ClientBranding {
  clientId: string;
  logoUrl: string | null;
  primaryColor: string | null;
  companyDisplayName: string | null;
  portalTitle: string | null;
  accentColor: string | null;
  enabled: boolean;
}

export async function loadClientBrandingWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<ClientBranding>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientBranding>(`/admin/clients/${clientId}/branding`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "BRANDING_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client branding."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function updateClientBrandingWithRefresh(
  session: AuthSession,
  clientId: string,
  patch: Partial<ClientBranding>
): Promise<AuthorizedResult<ClientBranding>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientBranding>(`/admin/clients/${clientId}/branding`, accessToken, {
      method: "PATCH",
      body: patch
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "BRANDING_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update client branding."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

/**
 * Creates a new lead in the pipeline.
 * Used by the AI Prospecting page to bulk-insert discovered prospects.
 */
export async function createLeadWithRefresh(
  session: AuthSession,
  input: {
    title: string;
    source?: string;
    status?: import("./types").LeadPipelineStatus;
    notes?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    company?: string;
  }
): Promise<AuthorizedResult<AdminLead>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLead>("/leads", accessToken, {
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
          response.payload.error?.code ?? "LEAD_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create lead."
        )
      };
    }

    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
