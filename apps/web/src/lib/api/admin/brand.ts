// ════════════════════════════════════════════════════════════════════════════
// brand.ts — Admin API client: Brand Control domain
// Endpoints : GET  /email-templates
//             POST /email-templates
//             PATCH /email-templates/:id
//             DELETE /email-templates/:id
//             GET  /custom-domains
//             POST /custom-domains
//             PATCH /custom-domains/:id
//             DELETE /custom-domains/:id
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminEmailTemplate {
  id: string;
  workspaceId: string;
  templateKey: string;
  name: string;
  subject: string;
  bodyHtml: string;
  status: string;
  sentCount: number;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCustomDomain {
  id: string;
  workspaceId: string;
  domain: string;
  domainType: string;
  status: string;
  sslActive: boolean;
  verified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Email Templates ───────────────────────────────────────────────────────────

export async function loadEmailTemplatesWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminEmailTemplate[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminEmailTemplate[]>("/email-templates", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "EMAIL_TEMPLATES_FETCH_FAILED", response.payload.error?.message ?? "Unable to load email templates.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createEmailTemplateWithRefresh(
  session: AuthSession,
  data: { templateKey: string; name: string; subject?: string; bodyHtml?: string; status?: string }
): Promise<AuthorizedResult<AdminEmailTemplate>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminEmailTemplate>("/email-templates", accessToken, { method: "POST", body: data });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "EMAIL_TEMPLATE_CREATE_FAILED", response.payload.error?.message ?? "Unable to create email template.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateEmailTemplateWithRefresh(
  session: AuthSession,
  id: string,
  data: Partial<{ name: string; subject: string; bodyHtml: string; status: string; sentCount: number }>
): Promise<AuthorizedResult<AdminEmailTemplate>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminEmailTemplate>(`/email-templates/${id}`, accessToken, { method: "PATCH", body: data });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "EMAIL_TEMPLATE_UPDATE_FAILED", response.payload.error?.message ?? "Unable to update email template.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function deleteEmailTemplateWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<{ id: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ id: string }>(`/email-templates/${id}`, accessToken, { method: "DELETE" });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "EMAIL_TEMPLATE_DELETE_FAILED", response.payload.error?.message ?? "Unable to delete email template.") };
    }
    return { unauthorized: false, data: response.payload.data ?? { id }, error: null };
  });
}

// ── Custom Domains ────────────────────────────────────────────────────────────

export async function loadCustomDomainsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminCustomDomain[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminCustomDomain[]>("/custom-domains", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "CUSTOM_DOMAINS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load custom domains.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createCustomDomainWithRefresh(
  session: AuthSession,
  data: { domain: string; domainType?: string; status?: string }
): Promise<AuthorizedResult<AdminCustomDomain>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminCustomDomain>("/custom-domains", accessToken, { method: "POST", body: data });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "CUSTOM_DOMAIN_CREATE_FAILED", response.payload.error?.message ?? "Unable to add custom domain.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateCustomDomainWithRefresh(
  session: AuthSession,
  id: string,
  data: Partial<{ status: string; sslActive: boolean; verified: boolean; verifiedAt: string | null; domainType: string }>
): Promise<AuthorizedResult<AdminCustomDomain>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminCustomDomain>(`/custom-domains/${id}`, accessToken, { method: "PATCH", body: data });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "CUSTOM_DOMAIN_UPDATE_FAILED", response.payload.error?.message ?? "Unable to update custom domain.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function deleteCustomDomainWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<{ id: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ id: string }>(`/custom-domains/${id}`, accessToken, { method: "DELETE" });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "CUSTOM_DOMAIN_DELETE_FAILED", response.payload.error?.message ?? "Unable to delete custom domain.") };
    }
    return { unauthorized: false, data: response.payload.data ?? { id }, error: null };
  });
}
