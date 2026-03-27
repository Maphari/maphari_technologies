// ════════════════════════════════════════════════════════════════════════════
// client-profile.ts — Account profile routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : CLIENT read/write own; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

type StakeholderRole = "DECISION_MAKER" | "BILLING" | "MARKETING" | "OPERATIONS" | "TECHNICAL";
type PreferredChannel = "EMAIL" | "PHONE" | "WHATSAPP" | "PORTAL";
type AccountType = "COMPANY" | "INDIVIDUAL";

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((item) => normalizeString(item))
    .filter((item): item is string => Boolean(item));
  return items.length > 0 ? items : [];
}

function normalizeAccountType(value: unknown): AccountType {
  if (value === "INDIVIDUAL") return "INDIVIDUAL";
  return "COMPANY";
}

function requiredMissingFields(profile: Record<string, unknown>): string[] {
  const accountType = normalizeAccountType(profile.accountType);
  const missing: string[] = [];

  if (!profile.primaryContactName) missing.push("primaryContactName");
  if (!profile.primaryContactEmail) missing.push("primaryContactEmail");

  if (accountType === "COMPANY") {
    if (!profile.companyName && !profile.name) missing.push("companyName");
    if (!profile.industry) missing.push("industry");
  } else {
    if (!profile.projectName) missing.push("projectName");
  }

  return missing;
}

function buildProfileCompleteness(profile: Record<string, unknown>) {
  const accountType = normalizeAccountType(profile.accountType);
  const isCompany = accountType === "COMPANY";
  const checklist = [
    { key: "account_type", label: "Account type selected", section: "identity", complete: Boolean(profile.accountType) },
    { key: "primary_contact_name", label: "Primary contact name added", section: "identity", complete: Boolean(profile.primaryContactName) },
    { key: "primary_contact_email", label: "Primary contact email added", section: "identity", complete: Boolean(profile.primaryContactEmail) },
    ...(isCompany
      ? [
          { key: "company_name", label: "Company name added", section: "identity", complete: Boolean(profile.companyName ?? profile.name) },
          { key: "industry", label: "Industry added", section: "identity", complete: Boolean(profile.industry) },
        ]
      : [
          { key: "project_name", label: "Project name added", section: "identity", complete: Boolean(profile.projectName) },
          { key: "project_brief", label: "Project brief added", section: "story", complete: Boolean(profile.projectBrief ?? profile.description) },
        ]),
    { key: "website", label: isCompany ? "Website added" : "Portfolio/website added", section: "identity", complete: Boolean(profile.website) },
    { key: "story", label: isCompany ? "Company story added" : "Personal/project story added", section: "story", complete: Boolean(profile.description || profile.mission) },
  ];
  const completedItems = checklist.filter((item) => item.complete).length;
  return {
    accountType,
    onboardingCompleted: requiredMissingFields(profile).length === 0,
    score: Math.round((completedItems / checklist.length) * 100),
    completedItems,
    totalItems: checklist.length,
    missingKeys: checklist.filter((item) => !item.complete).map((item) => item.key),
    requiredMissingFields: requiredMissingFields(profile),
    checklist,
  };
}

function buildPreviewProfile(profile: Record<string, unknown>) {
  const accountType = normalizeAccountType(profile.accountType);
  const isCompany = accountType === "COMPANY";
  return {
    accountType,
    displayName: isCompany
      ? ((profile.companyName as string | null) ?? (profile.name as string) ?? "Your Company")
      : ((profile.projectName as string | null) ?? (profile.primaryContactName as string | null) ?? "Your Project"),
    legalName: (profile.legalCompanyName as string | null) ?? null,
    tagline: (profile.tagline as string | null) ?? null,
    projectBrief: (profile.projectBrief as string | null) ?? null,
    blurb: (profile.officialBlurb as string | null) ?? (profile.description as string | null) ?? null,
    website: (profile.website as string | null) ?? null,
    logoUrl: (profile.logoUrl as string | null) ?? null,
    primaryColor: (profile.primaryColor as string | null) ?? null,
  };
}

function inferSectionFromPayload(body: Record<string, unknown>): string {
  if ("stakeholders" in body) return "stakeholders";
  if ("approvalPreferences" in body) return "approvals";
  if ("identityAssets" in body || "approvedBrandColors" in body || "logoUrl" in body || "coverImageUrl" in body) return "brand";
  if ("billingEmail" in body || "timezone" in body) return "account";
  return "identity";
}

function buildAuditSummary(section: string, body: Record<string, unknown>): string {
  const changedKeys = Object.keys(body);
  if (section === "stakeholders") return `Updated stakeholder directory (${changedKeys.length} fields)`;
  if (section === "approvals") return "Updated approval preferences";
  if (section === "brand") return "Updated brand and document identity";
  if (section === "account") return "Updated account profile details";
  return `Updated profile (${changedKeys.length} fields)`;
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerClientProfileRoutes(app: FastifyInstance): Promise<void> {

  /** GET /portal/profile — fetch the client's account profile */
  app.get("/portal/profile", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    if (!scopedClientId) {
      reply.status(400);
      return { success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse;
    }

    try {
      const cacheKey = `core:client-profile:${scopedClientId}`;
      const profile = await withCache(cacheKey, 120, async () => {
        const [client, profile] = await Promise.all([
          prisma.client.findUnique({
            where: { id: scopedClientId },
            select: {
              id: true, name: true, billingEmail: true, ownerName: true,
              timezone: true, tier: true, slaTier: true,
              contractStartAt: true, contractRenewalAt: true,
            }
          }),
          prisma.clientProfile.findUnique({
            where: { clientId: scopedClientId },
            include: {
              stakeholders: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
              auditEvents: { orderBy: { createdAt: "desc" }, take: 8 },
            }
          }),
        ]);
        if (!client) return null;
        const merged = {
          ...client,
          ...profile,
          stakeholders: profile?.stakeholders ?? [],
          profileAuditEvents: profile?.auditEvents ?? [],
        };
        return {
          ...merged,
          profileCompleteness: buildProfileCompleteness(merged),
          previewProfile: buildPreviewProfile(merged),
        };
      });

      if (!profile) {
        reply.status(404);
        return { success: false, error: { code: "CLIENT_NOT_FOUND", message: "Client not found." } } as ApiResponse;
      }

      return { success: true, data: profile, meta: { requestId: scope.requestId } } as ApiResponse<typeof profile>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROFILE_FETCH_FAILED", message: "Unable to fetch account profile." } } as ApiResponse;
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Per-client portal branding configuration
  // ────────────────────────────────────────────────────────────────────────────

  /** GET /admin/clients/:id/branding — admin: fetch branding for a client */
  app.get("/admin/clients/:id/branding", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id: clientId } = request.params as { id: string };

    try {
      const cacheKey = `core:client-branding:${clientId}`;
      const profile = await withCache(cacheKey, 120, async () =>
        prisma.clientProfile.findUnique({ where: { clientId } })
      );

      const branding = {
        clientId,
        logoUrl: profile?.logoUrl ?? null,
        primaryColor: profile?.primaryColor ?? null,
        companyDisplayName: profile?.companyName ?? null,
        portalTitle: null as string | null,
        accentColor: null as string | null,
        enabled: !!(profile?.primaryColor || profile?.logoUrl || profile?.companyName),
      };

      return { success: true, data: branding, meta: { requestId: scope.requestId } } as ApiResponse<typeof branding>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "BRANDING_FETCH_FAILED", message: "Unable to fetch client branding." } } as ApiResponse;
    }
  });

  /** PATCH /admin/clients/:id/branding — admin: update branding for a client */
  app.patch("/admin/clients/:id/branding", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id: clientId } = request.params as { id: string };

    const body = request.body as {
      logoUrl?: string | null;
      primaryColor?: string | null;
      companyDisplayName?: string | null;
      portalTitle?: string | null;
      accentColor?: string | null;
      enabled?: boolean;
    };

    try {
      // Map branding fields to ClientProfile columns
      const updateData: Record<string, unknown> = {};
      if ("logoUrl"             in body) updateData.logoUrl      = body.logoUrl;
      if ("primaryColor"        in body) updateData.primaryColor = body.primaryColor;
      if ("companyDisplayName"  in body) updateData.companyName  = body.companyDisplayName;
      // If enabled is explicitly false, clear the colour
      if (body.enabled === false) {
        updateData.primaryColor = null;
        updateData.logoUrl      = null;
        updateData.companyName  = null;
      }

      const profile = await prisma.clientProfile.upsert({
        where:  { clientId },
        create: { clientId, ...updateData },
        update: updateData,
      });

      await cache.delete(`core:client-branding:${clientId}`);
      await cache.delete(`core:client-profile:${clientId}`);

      const branding = {
        clientId,
        logoUrl: profile.logoUrl ?? null,
        primaryColor: profile.primaryColor ?? null,
        companyDisplayName: profile.companyName ?? null,
        portalTitle: null as string | null,
        accentColor: null as string | null,
        enabled: !!(profile.primaryColor || profile.logoUrl || profile.companyName),
      };

      return { success: true, data: branding, meta: { requestId: scope.requestId } } as ApiResponse<typeof branding>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "BRANDING_UPDATE_FAILED", message: "Unable to update client branding." } } as ApiResponse;
    }
  });

  /** GET /portal/branding — CLIENT: returns their own portal branding config */
  app.get("/portal/branding", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    if (!scopedClientId) {
      reply.status(400);
      return { success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse;
    }

    try {
      const cacheKey = `core:client-branding:${scopedClientId}`;
      const profile = await withCache(cacheKey, 120, async () =>
        prisma.clientProfile.findUnique({ where: { clientId: scopedClientId } })
      );

      const branding = {
        clientId: scopedClientId,
        logoUrl: profile?.logoUrl ?? null,
        primaryColor: profile?.primaryColor ?? null,
        companyDisplayName: profile?.companyName ?? null,
        portalTitle: null as string | null,
        accentColor: null as string | null,
        enabled: !!(profile?.primaryColor || profile?.logoUrl || profile?.companyName),
      };

      return { success: true, data: branding, meta: { requestId: scope.requestId } } as ApiResponse<typeof branding>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "BRANDING_FETCH_FAILED", message: "Unable to fetch portal branding." } } as ApiResponse;
    }
  });

  /** PATCH /portal/profile — upsert the client's account profile */
  app.patch("/portal/profile", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    if (!scopedClientId) {
      reply.status(400);
      return { success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse;
    }

    const body = request.body as {
      accountType?: AccountType;
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
      approvalPreferences?: {
        ownerStakeholderId?: string | null;
        fallbackStakeholderId?: string | null;
        preferredChannel?: PreferredChannel | null;
        responseTargetHours?: number | null;
        escalationContact?: string | null;
        approvalNotes?: string | null;
      };
      identityAssets?: {
        preferredLogoFileId?: string | null;
        companyOverview?: { fileId: string; label: string; fileName?: string | null } | null;
        brandGuide?: { fileId: string; label: string; fileName?: string | null } | null;
        registrationDocument?: { fileId: string; label: string; fileName?: string | null } | null;
        taxDocument?: { fileId: string; label: string; fileName?: string | null } | null;
      };
      socialLinks?:   Record<string, string>;
      stakeholders?: Array<{
        id?: string;
        role: StakeholderRole;
        fullName: string;
        jobTitle?: string | null;
        email?: string | null;
        phone?: string | null;
        preferredChannel?: PreferredChannel | null;
        isPrimary?: boolean;
        notes?: string | null;
        sortOrder?: number;
      }>;
      yearFounded?:   number;
      teamSize?:      string;
      hqLocation?:    string;
      coverImageUrl?: string;
      onboardingCompleted?: boolean;
    };

    try {
      const existing = await prisma.clientProfile.findUnique({
        where: { clientId: scopedClientId },
        select: {
          accountType: true,
          companyName: true,
          projectName: true,
          projectBrief: true,
          industry: true,
          primaryContactName: true,
          primaryContactEmail: true,
          onboardingCompleted: true,
        },
      });

      const effective = {
        accountType: normalizeAccountType(body.accountType ?? existing?.accountType),
        companyName: body.companyName !== undefined ? normalizeString(body.companyName) : (existing?.companyName ?? null),
        projectName: body.projectName !== undefined ? normalizeString(body.projectName) : (existing?.projectName ?? null),
        projectBrief: body.projectBrief !== undefined ? normalizeString(body.projectBrief) : (existing?.projectBrief ?? null),
        industry: body.industry !== undefined ? normalizeString(body.industry) : (existing?.industry ?? null),
        primaryContactName: body.primaryContactName !== undefined ? normalizeString(body.primaryContactName) : (existing?.primaryContactName ?? null),
        primaryContactEmail: body.primaryContactEmail !== undefined ? normalizeString(body.primaryContactEmail) : (existing?.primaryContactEmail ?? null),
      };

      const requiredMissing = requiredMissingFields(effective as unknown as Record<string, unknown>);
      if (body.onboardingCompleted === true && requiredMissing.length > 0) {
        reply.status(400);
        return {
          success: false,
          error: {
            code: "PROFILE_REQUIRED_FIELDS_MISSING",
            message: "Complete required profile fields before finishing onboarding.",
            details: { missingFields: requiredMissing },
          },
        } as ApiResponse;
      }

      const profile = await prisma.$transaction(async (tx) => {
        const createApprovedBrandColors = body.approvedBrandColors === undefined
          ? undefined
          : (normalizeStringArray(body.approvedBrandColors) ?? []);
        const upserted = await tx.clientProfile.upsert({
          where: { clientId: scopedClientId },
          create: {
            clientId: scopedClientId,
            accountType: normalizeAccountType(body.accountType),
            companyName: normalizeString(body.companyName),
            projectName: normalizeString(body.projectName),
            projectBrief: normalizeString(body.projectBrief),
            legalCompanyName: normalizeString(body.legalCompanyName),
            tradingName: normalizeString(body.tradingName),
            primaryContactName: normalizeString(body.primaryContactName),
            primaryContactRole: normalizeString(body.primaryContactRole),
            primaryContactEmail: normalizeString(body.primaryContactEmail),
            primaryContactPhone: normalizeString(body.primaryContactPhone),
            tagline: normalizeString(body.tagline),
            mission: normalizeString(body.mission),
            vision: normalizeString(body.vision),
            description: normalizeString(body.description),
            officialBlurb: normalizeString(body.officialBlurb),
            partnerBlurb: normalizeString(body.partnerBlurb),
            industry: normalizeString(body.industry),
            website: normalizeString(body.website),
            logoUrl: normalizeString(body.logoUrl),
            primaryColor: normalizeString(body.primaryColor),
            approvedBrandColors: createApprovedBrandColors,
            approvalPreferences: body.approvalPreferences ?? undefined,
            identityAssets: body.identityAssets ?? undefined,
            socialLinks: body.socialLinks ?? undefined,
            yearFounded: body.yearFounded,
            teamSize: normalizeString(body.teamSize),
            hqLocation: normalizeString(body.hqLocation),
            coverImageUrl: normalizeString(body.coverImageUrl),
            onboardingCompleted: body.onboardingCompleted === true || requiredMissing.length === 0,
          },
          update: {
            ...(body.accountType !== undefined ? { accountType: normalizeAccountType(body.accountType) } : {}),
            ...(body.companyName !== undefined ? { companyName: normalizeString(body.companyName) } : {}),
            ...(body.projectName !== undefined ? { projectName: normalizeString(body.projectName) } : {}),
            ...(body.projectBrief !== undefined ? { projectBrief: normalizeString(body.projectBrief) } : {}),
            ...(body.legalCompanyName !== undefined ? { legalCompanyName: normalizeString(body.legalCompanyName) } : {}),
            ...(body.tradingName !== undefined ? { tradingName: normalizeString(body.tradingName) } : {}),
            ...(body.primaryContactName !== undefined ? { primaryContactName: normalizeString(body.primaryContactName) } : {}),
            ...(body.primaryContactRole !== undefined ? { primaryContactRole: normalizeString(body.primaryContactRole) } : {}),
            ...(body.primaryContactEmail !== undefined ? { primaryContactEmail: normalizeString(body.primaryContactEmail) } : {}),
            ...(body.primaryContactPhone !== undefined ? { primaryContactPhone: normalizeString(body.primaryContactPhone) } : {}),
            ...(body.tagline !== undefined ? { tagline: normalizeString(body.tagline) } : {}),
            ...(body.mission !== undefined ? { mission: normalizeString(body.mission) } : {}),
            ...(body.vision !== undefined ? { vision: normalizeString(body.vision) } : {}),
            ...(body.description !== undefined ? { description: normalizeString(body.description) } : {}),
            ...(body.officialBlurb !== undefined ? { officialBlurb: normalizeString(body.officialBlurb) } : {}),
            ...(body.partnerBlurb !== undefined ? { partnerBlurb: normalizeString(body.partnerBlurb) } : {}),
            ...(body.industry !== undefined ? { industry: normalizeString(body.industry) } : {}),
            ...(body.website !== undefined ? { website: normalizeString(body.website) } : {}),
            ...(body.logoUrl !== undefined ? { logoUrl: normalizeString(body.logoUrl) } : {}),
            ...(body.primaryColor !== undefined ? { primaryColor: normalizeString(body.primaryColor) } : {}),
            ...(body.approvedBrandColors !== undefined ? { approvedBrandColors: normalizeStringArray(body.approvedBrandColors) ?? [] } : {}),
            ...(body.approvalPreferences !== undefined ? { approvalPreferences: body.approvalPreferences } : {}),
            ...(body.identityAssets !== undefined ? { identityAssets: body.identityAssets } : {}),
            ...(body.socialLinks !== undefined ? { socialLinks: body.socialLinks } : {}),
            ...(body.yearFounded !== undefined ? { yearFounded: body.yearFounded } : {}),
            ...(body.teamSize !== undefined ? { teamSize: normalizeString(body.teamSize) } : {}),
            ...(body.hqLocation !== undefined ? { hqLocation: normalizeString(body.hqLocation) } : {}),
            ...(body.coverImageUrl !== undefined ? { coverImageUrl: normalizeString(body.coverImageUrl) } : {}),
            ...(body.onboardingCompleted !== undefined
              ? { onboardingCompleted: body.onboardingCompleted === true && requiredMissing.length === 0 }
              : { onboardingCompleted: requiredMissing.length === 0 }),
          },
        });

        if (Array.isArray(body.stakeholders)) {
          await tx.clientProfileStakeholder.deleteMany({ where: { clientProfileId: upserted.id } });
          if (body.stakeholders.length > 0) {
            await tx.clientProfileStakeholder.createMany({
              data: body.stakeholders.map((stakeholder, index) => ({
                clientProfileId: upserted.id,
                role: stakeholder.role,
                fullName: stakeholder.fullName.trim(),
                jobTitle: normalizeString(stakeholder.jobTitle),
                email: normalizeString(stakeholder.email),
                phone: normalizeString(stakeholder.phone),
                preferredChannel: normalizeString(stakeholder.preferredChannel),
                isPrimary: Boolean(stakeholder.isPrimary),
                notes: normalizeString(stakeholder.notes),
                sortOrder: stakeholder.sortOrder ?? index,
              })),
            });
          }
        }

        await tx.clientProfileAuditEvent.create({
          data: {
            clientProfileId: upserted.id,
            actorUserId: scope.userId ?? null,
            actorRole: scope.role,
            actorName: scope.role === "CLIENT" ? "Client Portal" : null,
            section: inferSectionFromPayload(body as Record<string, unknown>),
            summary: buildAuditSummary(inferSectionFromPayload(body as Record<string, unknown>), body as Record<string, unknown>),
          },
        });

        return tx.clientProfile.findUnique({
          where: { id: upserted.id },
          include: {
            stakeholders: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
            auditEvents: { orderBy: { createdAt: "desc" }, take: 8 },
          },
        });
      });

      await cache.delete(`core:client-profile:${scopedClientId}`);
      const [client] = await Promise.all([
        prisma.client.findUnique({
          where: { id: scopedClientId },
          select: {
            id: true, name: true, billingEmail: true, ownerName: true,
            timezone: true, tier: true, slaTier: true,
            contractStartAt: true, contractRenewalAt: true,
          }
        }),
      ]);
      const merged = {
        ...client,
        ...profile,
        stakeholders: profile?.stakeholders ?? [],
        profileAuditEvents: profile?.auditEvents ?? [],
      };
      const responseProfile = {
        ...merged,
        profileCompleteness: buildProfileCompleteness(merged),
        previewProfile: buildPreviewProfile(merged),
      };

      return { success: true, data: responseProfile, meta: { requestId: scope.requestId } } as ApiResponse<typeof responseProfile>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PROFILE_UPDATE_FAILED", message: "Unable to update account profile." } } as ApiResponse;
    }
  });
}
