"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalProfileWithRefresh,
  updatePortalProfileWithRefresh,
  createPortalUploadUrlWithRefresh,
  confirmPortalUploadWithRefresh,
  getPortalFileDownloadUrlWithRefresh,
  type PortalClientApprovalPreferences,
  type PortalClientIdentityAssets,
  type PortalClientProfile,
  type PortalClientProfilePatch,
  type PortalClientStakeholder,
} from "../../../../lib/api/portal";

type EditableSection = "identity" | "story" | "stakeholders" | "approvals" | "brand" | null;
type StakeholderRole = PortalClientStakeholder["role"];
type IdentityAssetKey = keyof NonNullable<PortalClientProfile["identityAssets"]>;
type AccountType = NonNullable<PortalClientProfile["accountType"]>;

const TEAM_SIZE_OPTIONS = ["1–10", "11–50", "51–200", "201–500", "500+"];
const STAKEHOLDER_ROLES: Array<{ value: StakeholderRole; label: string }> = [
  { value: "DECISION_MAKER", label: "Decision Maker" },
  { value: "BILLING", label: "Billing" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "TECHNICAL", label: "Technical" },
];
const CHANNEL_OPTIONS: Array<{ value: NonNullable<PortalClientApprovalPreferences["preferredChannel"]>; label: string }> = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "PORTAL", label: "Portal" },
];
const SOCIAL_FIELDS: Array<{ key: "linkedin" | "twitter" | "instagram" | "github"; label: string; placeholder: string; color: string }> = [
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/…", color: "#0A66C2" },
  { key: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/…", color: "#1DA1F2" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…", color: "#E1306C" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/…", color: "var(--text)" },
];
const DOCUMENT_SLOTS: Array<{ key: "companyOverview" | "brandGuide" | "registrationDocument" | "taxDocument"; label: string; hint: string }> = [
  { key: "companyOverview", label: "Company Overview", hint: "Your primary company overview or capabilities deck." },
  { key: "brandGuide", label: "Brand Guide", hint: "Approved brand guide used in proposals and delivery." },
  { key: "registrationDocument", label: "Registration Document", hint: "Registration or compliance paperwork for onboarding." },
  { key: "taxDocument", label: "Tax Document", hint: "Tax clearance, VAT, or account-supporting tax document." },
];

function tierBadge(tier: string): string {
  const value = tier.toUpperCase();
  if (value === "ENTERPRISE") return "badgePurple";
  if (value === "PROFESSIONAL" || value === "PRO") return "badgeAccent";
  return "badgeMuted";
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function localId(prefix: string): string {
  return prefix + "-" + Math.random().toString(36).slice(2, 10);
}

function stakeholderRoleLabel(role: StakeholderRole): string {
  return STAKEHOLDER_ROLES.find((item) => item.value === role)?.label ?? role;
}

function hydrateDraft(profile: PortalClientProfile): PortalClientProfilePatch {
  return {
    accountType: profile.accountType ?? "COMPANY",
    onboardingCompleted: profile.onboardingCompleted ?? false,
    companyName: profile.companyName ?? "",
    projectName: profile.projectName ?? "",
    projectBrief: profile.projectBrief ?? "",
    primaryContactName: profile.primaryContactName ?? "",
    primaryContactRole: profile.primaryContactRole ?? "",
    primaryContactEmail: profile.primaryContactEmail ?? "",
    primaryContactPhone: profile.primaryContactPhone ?? "",
    legalCompanyName: profile.legalCompanyName ?? "",
    tradingName: profile.tradingName ?? "",
    tagline: profile.tagline ?? "",
    mission: profile.mission ?? "",
    vision: profile.vision ?? "",
    description: profile.description ?? "",
    officialBlurb: profile.officialBlurb ?? "",
    partnerBlurb: profile.partnerBlurb ?? "",
    industry: profile.industry ?? "",
    website: profile.website ?? "",
    logoUrl: profile.logoUrl ?? "",
    primaryColor: profile.primaryColor ?? "",
    approvedBrandColors: profile.approvedBrandColors ?? [],
    approvalPreferences: profile.approvalPreferences ?? {},
    identityAssets: profile.identityAssets ?? {},
    socialLinks: profile.socialLinks ?? {},
    stakeholders: (profile.stakeholders ?? []).map((stakeholder) => ({
      id: stakeholder.id,
      role: stakeholder.role,
      fullName: stakeholder.fullName,
      jobTitle: stakeholder.jobTitle ?? "",
      email: stakeholder.email ?? "",
      phone: stakeholder.phone ?? "",
      preferredChannel: stakeholder.preferredChannel ?? undefined,
      isPrimary: stakeholder.isPrimary,
      notes: stakeholder.notes ?? "",
      sortOrder: stakeholder.sortOrder,
    })),
    yearFounded: profile.yearFounded ?? undefined,
    teamSize: profile.teamSize ?? "",
    hqLocation: profile.hqLocation ?? "",
    coverImageUrl: profile.coverImageUrl ?? "",
  };
}

function sanitizePatchValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "";
}

function buildSectionPatch(section: Exclude<EditableSection, null>, draft: PortalClientProfilePatch): PortalClientProfilePatch {
  if (section === "identity") {
    return {
      accountType: draft.accountType,
      companyName: draft.companyName,
      projectName: draft.projectName,
      projectBrief: draft.projectBrief,
      primaryContactName: draft.primaryContactName,
      primaryContactRole: draft.primaryContactRole,
      primaryContactEmail: draft.primaryContactEmail,
      primaryContactPhone: draft.primaryContactPhone,
      legalCompanyName: draft.legalCompanyName,
      tradingName: draft.tradingName,
      tagline: draft.tagline,
      industry: draft.industry,
      website: draft.website,
      yearFounded: draft.yearFounded,
      teamSize: draft.teamSize,
      hqLocation: draft.hqLocation,
      primaryColor: draft.primaryColor,
      onboardingCompleted: false,
    };
  }
  if (section === "story") {
    return {
      description: draft.description,
      projectBrief: draft.projectBrief,
      mission: draft.mission,
      vision: draft.vision,
      officialBlurb: draft.officialBlurb,
      partnerBlurb: draft.partnerBlurb,
    };
  }
  if (section === "stakeholders") {
    return {
      stakeholders: (draft.stakeholders ?? []).map((stakeholder, index) => ({
        id: stakeholder.id ?? localId("stk"),
        role: stakeholder.role,
        fullName: String(sanitizePatchValue(stakeholder.fullName) ?? ""),
        jobTitle: String(sanitizePatchValue(stakeholder.jobTitle) ?? ""),
        email: String(sanitizePatchValue(stakeholder.email) ?? ""),
        phone: String(sanitizePatchValue(stakeholder.phone) ?? ""),
        preferredChannel: stakeholder.preferredChannel,
        isPrimary: Boolean(stakeholder.isPrimary),
        notes: String(sanitizePatchValue(stakeholder.notes) ?? ""),
        sortOrder: stakeholder.sortOrder ?? index,
      })),
    };
  }
  if (section === "approvals") {
    return {
      approvalPreferences: draft.approvalPreferences ?? {},
    };
  }
  return {
    approvedBrandColors: draft.approvedBrandColors ?? [],
    identityAssets: draft.identityAssets ?? {},
    socialLinks: draft.socialLinks ?? {},
    logoUrl: draft.logoUrl,
  };
}

export function CompanyProfilePage() {
  const { session } = useProjectLayer();
  const notify = usePageToast();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<PortalClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<EditableSection>(null);
  const [savingSection, setSavingSection] = useState<Exclude<EditableSection, null> | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingDocumentKey, setUploadingDocumentKey] = useState<string | null>(null);
  const [finalizingProfile, setFinalizingProfile] = useState(false);
  const [draft, setDraft] = useState<PortalClientProfilePatch>({});
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [documentSlot, setDocumentSlot] = useState<IdentityAssetKey | null>(null);

  const loadProfile = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    const result = await loadPortalProfileWithRefresh(session);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error) {
      notify("error", "Profile unavailable", result.error.message);
    } else if (result.data) {
      setProfile(result.data);
    }
    setLoading(false);
  }, [notify, session]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadProfile();
    });
  }, [loadProfile]);

  useEffect(() => {
    const logoFileId = profile?.logoUrl;
    if (!session || !logoFileId) {
      setLogoPreviewUrl(null);
      return;
    }
    if (logoFileId.startsWith("http")) {
      setLogoPreviewUrl(logoFileId);
      return;
    }
    void (async () => {
      const result = await getPortalFileDownloadUrlWithRefresh(session, logoFileId);
      if (!result.error && result.data) setLogoPreviewUrl(result.data.downloadUrl);
    })();
  }, [profile?.logoUrl, session]);

  const accountType: AccountType = profile?.accountType ?? "COMPANY";
  const isIndividual = accountType === "INDIVIDUAL";
  const displayName = isIndividual
    ? (profile?.projectName ?? profile?.primaryContactName ?? "Your Project")
    : (profile?.companyName ?? profile?.name ?? "Your Company");
  const initials = displayName.split(" ").map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
  const preview = profile?.previewProfile ?? null;
  const completeness = profile?.profileCompleteness ?? null;
  const auditEvents = profile?.profileAuditEvents ?? [];
  const stakeholders = profile?.stakeholders ?? [];
  const socialLinks = profile?.socialLinks ?? {};
  const identityAssets = profile?.identityAssets ?? {};
  const qualityFlags: string[] = [];
  if (!profile?.primaryContactName) qualityFlags.push("Primary contact missing");
  if (!profile?.primaryContactEmail) qualityFlags.push("Primary contact email missing");
  if (!profile?.website) qualityFlags.push(isIndividual ? "Portfolio/website missing" : "Website missing");
  if (!isIndividual && !profile?.companyName) qualityFlags.push("Company name missing");
  if (isIndividual && !profile?.projectName) qualityFlags.push("Project name missing");
  if (!isIndividual && !stakeholders.some((item) => item.role === "DECISION_MAKER" || item.isPrimary)) qualityFlags.push("Decision maker missing");
  if (!profile?.description && !profile?.projectBrief) qualityFlags.push(isIndividual ? "Project description missing" : "Company description missing");

  const beginSectionEdit = useCallback((section: Exclude<EditableSection, null>) => {
    if (!profile) return;
    setDraft(hydrateDraft(profile));
    setEditingSection(section);
  }, [profile]);

  const cancelSectionEdit = useCallback(() => {
    setEditingSection(null);
    setDraft({});
  }, []);

  const saveSection = useCallback(async (section: Exclude<EditableSection, null>) => {
    if (!session) return;
    setSavingSection(section);
    try {
      const patch = buildSectionPatch(section, draft);
      const result = await updatePortalProfileWithRefresh(session, patch);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        notify("error", "Save failed", result.error.message);
      } else if (result.data) {
        setProfile(result.data);
        setEditingSection(null);
        setDraft({});
        notify("success", "Profile updated", "The " + section + " section has been saved.");
      }
    } catch {
      notify("error", "Save failed", "An unexpected error occurred.");
    } finally {
      setSavingSection(null);
    }
  }, [draft, notify, session]);

  const uploadProfileFile = useCallback(async (file: File, category: string) => {
    if (!session) return null;
    const urlRes = await createPortalUploadUrlWithRefresh(session, {
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      category,
    });
    if (urlRes.nextSession) saveSession(urlRes.nextSession);
    if (urlRes.error || !urlRes.data) {
      notify("error", "Upload failed", urlRes.error?.message ?? "Could not get an upload URL.");
      return null;
    }
    const put = await fetch(urlRes.data.uploadUrl, {
      method: "PUT",
      headers: { "content-type": file.type },
      body: file,
    });
    if (!put.ok) {
      notify("error", "Upload failed", "Could not transfer the file.");
      return null;
    }
    const confirmRes = await confirmPortalUploadWithRefresh(session, urlRes.data.fileId);
    if (confirmRes.nextSession) saveSession(confirmRes.nextSession);
    if (confirmRes.error || !confirmRes.data) {
      notify("error", "Upload failed", confirmRes.error?.message ?? "Could not confirm the upload.");
      return null;
    }
    return confirmRes.data;
  }, [notify, session]);

  const handleLogoUpload = useCallback(async (file: File) => {
    setUploadingLogo(true);
    try {
      const uploaded = await uploadProfileFile(file, "logo");
      if (!uploaded || !session) return;
      const nextIdentityAssets: PortalClientIdentityAssets = {
        ...(profile?.identityAssets ?? {}),
        preferredLogoFileId: uploaded.id,
      };
      const result = await updatePortalProfileWithRefresh(session, { logoUrl: uploaded.id, identityAssets: nextIdentityAssets });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        notify("error", "Logo update failed", result.error.message);
      } else if (result.data) {
        setProfile(result.data);
        notify("success", "Logo updated", "Your profile logo has been uploaded.");
      }
    } finally {
      setUploadingLogo(false);
    }
  }, [notify, profile?.identityAssets, session, uploadProfileFile]);

  const handleDocumentUpload = useCallback(async (slot: IdentityAssetKey, file: File) => {
    if (!session) return;
    setUploadingDocumentKey(slot);
    try {
      const uploaded = await uploadProfileFile(file, "company-profile");
      if (!uploaded) return;
      const nextIdentityAssets: PortalClientIdentityAssets = {
        ...(profile?.identityAssets ?? {}),
        [slot]: {
          fileId: uploaded.id,
          label: DOCUMENT_SLOTS.find((item) => item.key === slot)?.label ?? slot,
          fileName: uploaded.fileName,
        },
      };
      const result = await updatePortalProfileWithRefresh(session, { identityAssets: nextIdentityAssets });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        notify("error", "Document update failed", result.error.message);
      } else if (result.data) {
        setProfile(result.data);
        notify("success", "Document linked", "The document is now part of your operating profile.");
      }
    } finally {
      setUploadingDocumentKey(null);
    }
  }, [notify, profile?.identityAssets, session, uploadProfileFile]);

  const openDocument = useCallback(async (fileId: string) => {
    if (!session) return;
    const result = await getPortalFileDownloadUrlWithRefresh(session, fileId);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error || !result.data) {
      notify("error", "Document unavailable", result.error?.message ?? "Could not open this document.");
      return;
    }
    window.open(result.data.downloadUrl, "_blank", "noopener,noreferrer");
  }, [notify, session]);

  const setStakeholderField = useCallback((index: number, key: keyof NonNullable<PortalClientProfilePatch["stakeholders"]>[number], value: string | boolean | undefined) => {
    setDraft((prev) => {
      const stakeholders = [...(prev.stakeholders ?? [])];
      const target = { ...(stakeholders[index] ?? { id: localId("stk"), role: "DECISION_MAKER", fullName: "", isPrimary: false, sortOrder: index }) };
      (target as Record<string, unknown>)[key] = value;
      stakeholders[index] = target;
      return { ...prev, stakeholders };
    });
  }, []);

  const addStakeholder = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      stakeholders: [
        ...(prev.stakeholders ?? []),
        {
          id: localId("stk"),
          role: "DECISION_MAKER",
          fullName: "",
          jobTitle: "",
          email: "",
          phone: "",
          preferredChannel: "EMAIL",
          isPrimary: false,
          notes: "",
          sortOrder: (prev.stakeholders ?? []).length,
        },
      ],
    }));
  }, []);

  const removeStakeholder = useCallback((id: string | undefined) => {
    setDraft((prev) => ({
      ...prev,
      stakeholders: (prev.stakeholders ?? []).filter((stakeholder) => stakeholder.id !== id).map((stakeholder, index) => ({ ...stakeholder, sortOrder: index })),
    }));
  }, []);

  const jumpToSection = useCallback((sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!session) return;
    setFinalizingProfile(true);
    try {
      const result = await updatePortalProfileWithRefresh(session, { onboardingCompleted: true });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        notify("error", "Profile incomplete", result.error.message);
      } else if (result.data) {
        setProfile(result.data);
        notify("success", "Profile completed", "Required onboarding details are now complete.");
      }
    } finally {
      setFinalizingProfile(false);
    }
  }, [notify, session]);

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("pageHeader", "mb0")}>
          <div>
            <div className={cx("pageEyebrow")}>Account</div>
            <h1 className={cx("pageTitle")}>Profile</h1>
          </div>
        </div>
        <div className={cx("skeletonBlock", "skeleH160", "mb16")} />
        <div className={cx("skeletonBlock", "skeleH200")} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("pageHeader", "mb0")}>
          <div>
            <div className={cx("pageEyebrow")}>Account · Profile</div>
            <h1 className={cx("pageTitle")}>Profile</h1>
            <p className={cx("pageSub")}>Profile data could not be loaded for this account right now.</p>
          </div>
          <div className={cx("pageActions")}>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void loadProfile()}>
              Refresh
            </button>
          </div>
        </div>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="briefcase" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>Profile unavailable</div>
          <div className={cx("emptyStateSub")}>Refresh to try again, or return once the client record is available in the portal.</div>
        </div>
      </div>
    );
  }

  const identityDraft = draft;
  const stakeholderDraft = draft.stakeholders ?? [];
  const approvalDraft = draft.approvalPreferences ?? {};

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Account · Operating Profile</div>
          <h1 className={cx("pageTitle")}>{isIndividual ? "Personal Project Profile" : "Company Profile"}</h1>
          <p className={cx("pageSub")}>
            {isIndividual
              ? "Manage your personal details, project context, approvals, and documents used across delivery."
              : "Manage the identity, contacts, approvals, documents, and account context your delivery team uses every day."}
          </p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void loadProfile()}>
            Refresh
          </button>
        </div>
      </div>

      <div className={cx("grid3", "mb16")}>
        <div className={cx("statCard", "statCardBlue")}>
          <div className={cx("iconBox36", "mb10")}><Ic n="briefcase" sz={16} c="var(--cyan)" /></div>
          <div className={cx("statLabel")}>Profile Coverage</div>
          <div className={cx("statValue")}>{completeness ? completeness.completedItems + "/" + completeness.totalItems : "—"}</div>
          <div className={cx("text11", "colorMuted", "mt6")}>{completeness ? completeness.score + "% complete" : "Profile health unavailable"}</div>
        </div>
        <div className={cx("statCard", "statCardAccent")}>
          <div className={cx("iconBox36", "mb10")}><Ic n="users" sz={16} c="var(--lime)" /></div>
          <div className={cx("statLabel")}>Stakeholders</div>
          <div className={cx("statValue")}>{stakeholders.length}</div>
          <div className={cx("text11", "colorMuted", "mt6")}>{stakeholders.length === 0 ? "No delivery contacts linked" : "Structured contact directory"}</div>
        </div>
        <div className={cx("statCard", "statCardAmber")}>
          <div className={cx("iconBox36", "mb10")}><Ic n="shield" sz={16} c="var(--amber)" /></div>
          <div className={cx("statLabel")}>Service Tier</div>
          <div className={cx("statValue")}>{profile?.tier ?? "—"}</div>
          <div className={cx("text11", "colorMuted", "mt6")}>{(profile?.slaTier ?? "—") + " SLA · renews " + fmtDate(profile?.contractRenewalAt)}</div>
        </div>
      </div>

      <div className={cx("grid2", "mb16")}>
        <div className={cx("card")}>
          <div className={cx("cardBodyPad", "cpIdentityCardPad")}>
            <div className={cx("cpIdentityHero")}>
              <div className={cx("cpIdentityTop")}>
                <div className={cx("relative", "noShrink")}>
                  <div
                    className={cx("companyLogoBox", "cpIdentityLogo", "dynBgColor")}
                    style={{
                      "--bg-color": logoPreviewUrl ? `url(${logoPreviewUrl}) center/cover no-repeat` : "color-mix(in oklab, var(--lime) 15%, var(--s3))",
                      "--color": "color-mix(in oklab, var(--lime) 25%, var(--b2))",
                    } as React.CSSProperties}
                  >
                    {!logoPreviewUrl && <span className={cx("fw800", "colorAccent", "fs2rem")}>{initials}</span>}
                  </div>
                  <button type="button" title="Upload logo" className={cx("cpLogoUploadBtn")} onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    {uploadingLogo ? <span className={cx("fs9")}>…</span> : <Ic n="upload" sz={11} c="var(--bg)" />}
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className={cx("dNone")}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleLogoUpload(file);
                      event.target.value = "";
                    }}
                  />
                </div>

                <div className={cx("cpIdentityMain")}>
                  <div className={cx("flexBetween", "gap12", "flexWrap")}>
                    <div className={cx("minW220")}>
                      <div className={cx("text10", "uppercase", "tracking", "colorMuted", "mb6")}>{isIndividual ? "Personal Identity" : "Company Identity"}</div>
                      <div className={cx("fontSyne", "fw800", "fs14rem", "mb4")}>{displayName}</div>
                    </div>
                    <div className={cx("cpIdentityTierPill", tierBadge(profile?.tier ?? "STANDARD"))}>
                      <span className={cx("cpIdentityTierIcon")}>
                        <Ic n="shield" sz={11} c="currentColor" />
                      </span>
                      <span className={cx("cpIdentityTierCopy")}>
                        <span className={cx("cpIdentityTierLabel")}>Service tier</span>
                        <span className={cx("cpIdentityTierValue")}>{profile?.tier ?? "STANDARD"}</span>
                      </span>
                    </div>
                  </div>
                  <div className={cx("cpIdentityTagline")}>{profile?.tagline ?? (isIndividual ? "Add a tagline for your project profile." : "Add a tagline to make the company identity more useful in proposals and project reporting.")}</div>
                  <div className={cx("flexRow", "gap8", "flexWrap", "mt12")}>
                    {profile?.industry && <span className={cx("badge", "badgeMuted")}>{profile.industry}</span>}
                    {profile?.teamSize && <span className={cx("badge", "badgeMuted")}>{profile.teamSize} team</span>}
                    {profile?.hqLocation && <span className={cx("badge", "badgeMuted")}><Ic n="location" sz={9} c="var(--muted2)" /> {profile.hqLocation}</span>}
                    {profile?.website && <span className={cx("badge", "badgeMuted")}><Ic n="link" sz={9} c="var(--muted2)" /> Website linked</span>}
                  </div>
                </div>
              </div>

              <div className={cx("cpIdentityMetaGrid")}>
                <div className={cx("cpIdentityMetaCard")}>
                  <div className={cx("cpIdentityMetaLabel")}>{isIndividual ? "Primary Contact" : "Legal Name"}</div>
                  <div className={cx("cpIdentityMetaValue")}>{isIndividual ? (profile?.primaryContactName || "Not set") : (profile?.legalCompanyName || "Not set")}</div>
                </div>
                <div className={cx("cpIdentityMetaCard")}>
                  <div className={cx("cpIdentityMetaLabel")}>Trading Name</div>
                  <div className={cx("cpIdentityMetaValue")}>{profile?.tradingName || "Not set"}</div>
                </div>
                <div className={cx("cpIdentityMetaCard")}>
                  <div className={cx("cpIdentityMetaLabel")}>Website</div>
                  <div className={cx("cpIdentityMetaValue", "truncate")}>{profile?.website || "Not linked"}</div>
                </div>
                <div className={cx("cpIdentityMetaCard")}>
                  <div className={cx("cpIdentityMetaLabel")}>{isIndividual ? "Project / Location" : "Founded / HQ"}</div>
                  <div className={cx("cpIdentityMetaValue")}>
                    {(profile?.yearFounded ? String(profile.yearFounded) : "—") + " · " + (profile?.hqLocation || "Not set")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cx("cardS1v2", "p16")}>
          <div className={cx("flexBetween", "gap12", "mb12")}>
            <div>
              <div className={cx("sectionTitle", "mb4")}>Profile Quality</div>
              <div className={cx("text12", "colorMuted")}>Fill the highest-signal gaps to make proposals, approvals, and delivery smoother.</div>
            </div>
            <div className={cx("badge", completeness && completeness.score >= 70 ? "badgeAccent" : "badgeAmber")}>
              {completeness ? completeness.score + "%" : "Needs setup"}
            </div>
          </div>
          <div className={cx("flexCol", "gap8")}>
            {(completeness?.checklist ?? []).map((item) => (
              <button
                key={item.key}
                type="button"
                className={cx("cpQualityRow", item.complete ? "cpQualityRowReady" : "cpQualityRowMissing")}
                onClick={() => jumpToSection(item.section)}
              >
                <span className={cx("cpQualityRowMain")}>
                  <Ic n={item.complete ? "check" : "alert"} sz={12} c={item.complete ? "var(--lime)" : "var(--amber)"} />
                  <span className={cx("cpQualityRowText")}>{item.label}</span>
                </span>
                <span className={cx("cpQualityRowStatus", item.complete ? "cpQualityRowStatusReady" : "cpQualityRowStatusMissing")}>{item.complete ? "Ready" : "Missing"}</span>
              </button>
            ))}
          </div>
          {Array.isArray(completeness?.requiredMissingFields) && completeness.requiredMissingFields.length > 0 && (
            <div className={cx("mt12", "pt12", "borderT")}>
              <div className={cx("text10", "uppercase", "tracking", "colorMuted", "mb6")}>Required To Finish Onboarding</div>
              <div className={cx("flexRow", "gap6", "flexWrap")}>
                {completeness.requiredMissingFields.map((field) => (
                  <span key={field} className={cx("badge", "badgeAmber")}>{field}</span>
                ))}
              </div>
            </div>
          )}
          {qualityFlags.length > 0 && (
            <div className={cx("mt12", "pt12", "borderT")}>
              <div className={cx("text10", "uppercase", "tracking", "colorMuted", "mb6")}>Key Warnings</div>
              <div className={cx("flexRow", "gap6", "flexWrap")}>
                {qualityFlags.map((flag) => (
                  <span key={flag} className={cx("badge", "badgeAmber")}>{flag}</span>
                ))}
              </div>
            </div>
          )}
          <div className={cx("mt12", "pt12", "borderT", "flexBetween", "gap8", "flexWrap")}>
            <div className={cx("text11", "colorMuted")}>
              {profile.onboardingCompleted ? "Onboarding profile is complete." : "Finish required profile details to complete onboarding."}
            </div>
            <button
              type="button"
              className={cx("btnSm", profile.onboardingCompleted ? "btnGhost" : "btnAccent")}
              disabled={finalizingProfile || profile.onboardingCompleted}
              onClick={() => void completeOnboarding()}
            >
              {finalizingProfile ? "Saving…" : profile.onboardingCompleted ? "Completed" : "Mark Onboarding Complete"}
            </button>
          </div>
        </div>
      </div>

      <div className={cx("grid2", "mb16")}>
        <div className={cx("card")} id="identity">
          <div className={cx("cardHd")}>
            <Ic n="briefcase" sz={14} c="var(--lime)" />
            <span className={cx("cardHdTitle", "ml8")}>{isIndividual ? "Identity & Project" : "Identity & Governance"}</span>
            <div className={cx("mlAuto", "flexRow", "gap8")}>
              {editingSection === "identity" ? (
                <>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={cancelSectionEdit}>Cancel</button>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void saveSection("identity")} disabled={savingSection === "identity"}>
                    {savingSection === "identity" ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => beginSectionEdit("identity")}>Edit</button>
              )}
            </div>
          </div>
          <div className={cx("cardBodyPad", "cpSectionBodyPad")}>
            {editingSection === "identity" ? (
              <div className={cx("grid2Cols12Gap")}>
                <div>
                  <label className={cx("formLabel")}>Account type</label>
                  <select className={cx("input")} value={identityDraft.accountType ?? "COMPANY"} onChange={(e) => setDraft((prev) => ({ ...prev, accountType: e.target.value as AccountType }))}>
                    <option value="COMPANY">Company</option>
                    <option value="INDIVIDUAL">Individual</option>
                  </select>
                </div>
                <div>
                  <label className={cx("formLabel")}>{(identityDraft.accountType ?? accountType) === "INDIVIDUAL" ? "Project name" : "Company name"}</label>
                  <input
                    className={cx("input")}
                    value={(identityDraft.accountType ?? accountType) === "INDIVIDUAL" ? (identityDraft.projectName ?? "") : (identityDraft.companyName ?? "")}
                    onChange={(e) => setDraft((prev) => ((identityDraft.accountType ?? accountType) === "INDIVIDUAL"
                      ? { ...prev, projectName: e.target.value }
                      : { ...prev, companyName: e.target.value }))}
                  />
                </div>
                {(identityDraft.accountType ?? accountType) === "INDIVIDUAL" && (
                  <div>
                    <label className={cx("formLabel")}>Project brief</label>
                    <input className={cx("input")} value={identityDraft.projectBrief ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, projectBrief: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label className={cx("formLabel")}>Primary contact name</label>
                  <input className={cx("input")} value={identityDraft.primaryContactName ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, primaryContactName: e.target.value }))} />
                </div>
                <div>
                  <label className={cx("formLabel")}>Primary contact role</label>
                  <input className={cx("input")} value={identityDraft.primaryContactRole ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, primaryContactRole: e.target.value }))} />
                </div>
                <div>
                  <label className={cx("formLabel")}>Primary contact email</label>
                  <input className={cx("input")} value={identityDraft.primaryContactEmail ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, primaryContactEmail: e.target.value }))} />
                </div>
                <div>
                  <label className={cx("formLabel")}>Primary contact phone</label>
                  <input className={cx("input")} value={identityDraft.primaryContactPhone ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, primaryContactPhone: e.target.value }))} />
                </div>
                {(identityDraft.accountType ?? accountType) !== "INDIVIDUAL" && (
                <>
                <div>
                  <label className={cx("formLabel")}>Trading name</label>
                  <input className={cx("input")} value={identityDraft.tradingName ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, tradingName: e.target.value }))} />
                </div>
                <div>
                  <label className={cx("formLabel")}>Legal company name</label>
                  <input className={cx("input")} value={identityDraft.legalCompanyName ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, legalCompanyName: e.target.value }))} />
                </div>
                </>
                )}
                <div>
                  <label className={cx("formLabel")}>Tagline</label>
                  <input className={cx("input")} value={identityDraft.tagline ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, tagline: e.target.value }))} />
                </div>
                <div>
                  <label className={cx("formLabel")}>Industry</label>
                  <input className={cx("input")} value={identityDraft.industry ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, industry: e.target.value }))} />
                </div>
                <div>
                  <label className={cx("formLabel")}>{(identityDraft.accountType ?? accountType) === "INDIVIDUAL" ? "Website / Portfolio" : "Website"}</label>
                  <input className={cx("input")} value={identityDraft.website ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, website: e.target.value }))} placeholder="https://yourcompany.com" />
                </div>
                <div>
                  <label className={cx("formLabel")}>Year founded</label>
                  <input className={cx("input")} type="number" value={identityDraft.yearFounded ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, yearFounded: e.target.value ? parseInt(e.target.value, 10) : undefined }))} />
                </div>
                <div>
                  <label className={cx("formLabel")}>Team size</label>
                  <select className={cx("input")} value={identityDraft.teamSize ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, teamSize: e.target.value }))}>
                    <option value="">Select…</option>
                    {TEAM_SIZE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cx("formLabel")}>HQ location</label>
                  <input className={cx("input")} value={identityDraft.hqLocation ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, hqLocation: e.target.value }))} />
                </div>
                <div>
                  <label className={cx("formLabel")}>Primary colour</label>
                  <input className={cx("input")} value={identityDraft.primaryColor ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, primaryColor: e.target.value }))} placeholder="#C8F135" />
                </div>
              </div>
            ) : (
              <div className={cx("grid2Cols12Gap")}>
                {(
                  isIndividual
                    ? [
                        ["Account type", accountType],
                        ["Display name", displayName],
                        ["Project name", profile?.projectName ?? "—"],
                        ["Primary contact", profile?.primaryContactName ?? "—"],
                        ["Primary email", profile?.primaryContactEmail ?? "—"],
                        ["Website / Portfolio", profile?.website ?? "—"],
                        ["HQ", profile?.hqLocation ?? "—"],
                        ["Primary colour", profile?.primaryColor ?? "—"],
                      ]
                    : [
                        ["Account type", accountType],
                        ["Display name", displayName],
                        ["Primary contact", profile?.primaryContactName ?? "—"],
                        ["Primary email", profile?.primaryContactEmail ?? "—"],
                        ["Trading name", profile?.tradingName ?? "—"],
                        ["Legal name", profile?.legalCompanyName ?? "—"],
                        ["Website", profile?.website ?? "—"],
                        ["Industry", profile?.industry ?? "—"],
                        ["HQ", profile?.hqLocation ?? "—"],
                        ["Team size", profile?.teamSize ?? "—"],
                        ["Primary colour", profile?.primaryColor ?? "—"],
                      ]
                ).map(([label, value]) => (
                  <div key={label} className={cx("cardS1v2", "p12")}>
                    <div className={cx("formLabel")}>{label}</div>
                    <div className={cx("text12", "fw600")}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={cx("card")} id="preview">
          <div className={cx("cardHd")}>
            <Ic n="eye" sz={14} c="var(--cyan)" />
            <span className={cx("cardHdTitle", "ml8")}>Proposal / Report Preview</span>
          </div>
          <div className={cx("cardBodyPad", "cpSectionBodyPad")}>
            <div className={cx("cardS1v2", "p20")}>
              <div className={cx("flexAlignStart", "gap14", "mb16")}>
                <div className={cx("iconBox36")}>
                  {logoPreviewUrl ? <Ic n="image" sz={16} c="var(--cyan)" /> : <Ic n="file" sz={16} c="var(--muted2)" />}
                </div>
                <div className={cx("flex1")}>
                  <div className={cx("fontSyne", "fw800", "text16", "mb4")}>{preview?.displayName ?? displayName}</div>
                  <div className={cx("text12", "colorMuted")}>{preview?.tagline ?? "Tagline not set."}</div>
                </div>
              </div>
              <div className={cx("text12", "lineH165", "mb14")}>
                {preview?.blurb ?? (isIndividual
                  ? "Add a project summary so proposals and reports introduce your work clearly."
                  : "Add an official blurb or company description so proposals and reports introduce the business clearly.")}
              </div>
              {preview?.legalName || preview?.website || profile?.tier ? (
                <div className={cx("flexRow", "gap8", "flexWrap")}>
                  {preview?.legalName && <span className={cx("badge", "badgeMuted")}>{preview.legalName}</span>}
                  {preview?.website && <span className={cx("badge", "badgeMuted")}>{preview.website}</span>}
                  {profile?.tier && <span className={cx("badge", tierBadge(profile.tier))}>{profile.tier}</span>}
                </div>
              ) : (
                <div className={cx("text11", "colorMuted")}>This preview will become richer once identity, website, and profile story details are added.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={cx("grid2", "mb16")}>
        <div className={cx("card")} id="story">
          <div className={cx("cardHd")}>
            <Ic n="info" sz={14} c="var(--lime)" />
            <span className={cx("cardHdTitle", "ml8")}>{isIndividual ? "Project Story" : "Company Story"}</span>
            <div className={cx("mlAuto", "flexRow", "gap8")}>
              {editingSection === "story" ? (
                <>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={cancelSectionEdit}>Cancel</button>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void saveSection("story")} disabled={savingSection === "story"}>
                    {savingSection === "story" ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => beginSectionEdit("story")}>Edit</button>
              )}
            </div>
          </div>
          <div className={cx("cardBodyPad", "cpSectionBodyPad")}>
            {editingSection === "story" ? (
              <div className={cx("flexCol", "gap12")}>
                <div>
                  <label className={cx("formLabel")}>{isIndividual ? "Project summary" : "What we do"}</label>
                  <textarea className={cx("input", "resizeV", "minH100")} value={identityDraft.description ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} />
                </div>
                {isIndividual && (
                  <div>
                    <label className={cx("formLabel")}>Project brief</label>
                    <textarea className={cx("input", "resizeV", "minH100")} value={identityDraft.projectBrief ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, projectBrief: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label className={cx("formLabel")}>Mission</label>
                  <textarea className={cx("input", "resizeV", "minH100")} value={identityDraft.mission ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, mission: e.target.value }))} />
                </div>
                <div>
                  <label className={cx("formLabel")}>Vision</label>
                  <textarea className={cx("input", "resizeV", "minH100")} value={identityDraft.vision ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, vision: e.target.value }))} />
                </div>
                <div>
                  <label className={cx("formLabel")}>{isIndividual ? "Official profile blurb" : "Official company blurb"}</label>
                  <textarea className={cx("input", "resizeV", "minH100")} value={identityDraft.officialBlurb ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, officialBlurb: e.target.value }))} />
                </div>
                <div>
                  <label className={cx("formLabel")}>{isIndividual ? "Partner / press profile description" : "Partner / press description"}</label>
                  <textarea className={cx("input", "resizeV", "minH100")} value={identityDraft.partnerBlurb ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, partnerBlurb: e.target.value }))} />
                </div>
              </div>
            ) : (
              [profile?.description, profile?.projectBrief, profile?.mission, profile?.vision, profile?.officialBlurb, profile?.partnerBlurb].some(Boolean) ? (
                <div className={cx("flexCol", "gap16")}>
                  {(
                    isIndividual
                      ? [
                          ["Project Summary", profile?.description],
                          ["Project Brief", profile?.projectBrief],
                          ["Mission", profile?.mission],
                          ["Vision", profile?.vision],
                          ["Official Blurb", profile?.officialBlurb],
                          ["Partner / Press Description", profile?.partnerBlurb],
                        ]
                      : [
                          ["What We Do", profile?.description],
                          ["Mission", profile?.mission],
                          ["Vision", profile?.vision],
                          ["Official Blurb", profile?.officialBlurb],
                          ["Partner / Press Description", profile?.partnerBlurb],
                        ]
                  ).map(([label, value]) => (
                    <div key={label}>
                      <div className={cx("formLabel")}>{label}</div>
                      <div className={cx("text12", "lineH165")}>{value || "—"}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="info" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>{isIndividual ? "Project story not published yet" : "Company story not published yet"}</div>
                  <div className={cx("emptyStateSub")}>{isIndividual ? "Add a project summary, mission, vision, and profile blurb so proposals and reports introduce your work consistently." : "Add a description, mission, vision, and official blurb so proposals and reports introduce the business consistently."}</div>
                </div>
              )
            )}
          </div>
        </div>

        <div className={cx("card")} id="stakeholders">
          <div className={cx("cardHd")}>
            <Ic n="users" sz={14} c="var(--purple)" />
            <span className={cx("cardHdTitle", "ml8")}>Stakeholder Directory</span>
            <div className={cx("mlAuto", "flexRow", "gap8")}>
              {editingSection === "stakeholders" ? (
                <>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={addStakeholder}>Add</button>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={cancelSectionEdit}>Cancel</button>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void saveSection("stakeholders")} disabled={savingSection === "stakeholders"}>
                    {savingSection === "stakeholders" ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => beginSectionEdit("stakeholders")}>Manage</button>
              )}
            </div>
          </div>
          <div className={cx("cardBodyPad", "cpSectionBodyPad")}>
            {editingSection === "stakeholders" ? (
              <div className={cx("flexCol", "gap12")}>
                {stakeholderDraft.map((stakeholder, index) => (
                  <div key={stakeholder.id ?? index} className={cx("cardS1v2", "p12")}>
                    <div className={cx("flexBetween", "mb10", "gap8")}>
                      <div className={cx("formLabel")}>Stakeholder {index + 1}</div>
                      <button type="button" className={cx("btnXs", "btnGhost")} onClick={() => removeStakeholder(stakeholder.id)}>Remove</button>
                    </div>
                    <div className={cx("grid2Cols12Gap")}>
                      <div>
                        <label className={cx("formLabel")}>Role</label>
                        <select className={cx("input")} value={stakeholder.role} onChange={(e) => setStakeholderField(index, "role", e.target.value as StakeholderRole)}>
                          {STAKEHOLDER_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={cx("formLabel")}>Full name</label>
                        <input className={cx("input")} value={stakeholder.fullName} onChange={(e) => setStakeholderField(index, "fullName", e.target.value)} />
                      </div>
                      <div>
                        <label className={cx("formLabel")}>Job title</label>
                        <input className={cx("input")} value={stakeholder.jobTitle ?? ""} onChange={(e) => setStakeholderField(index, "jobTitle", e.target.value)} />
                      </div>
                      <div>
                        <label className={cx("formLabel")}>Email</label>
                        <input className={cx("input")} value={stakeholder.email ?? ""} onChange={(e) => setStakeholderField(index, "email", e.target.value)} />
                      </div>
                      <div>
                        <label className={cx("formLabel")}>Phone</label>
                        <input className={cx("input")} value={stakeholder.phone ?? ""} onChange={(e) => setStakeholderField(index, "phone", e.target.value)} />
                      </div>
                      <div>
                        <label className={cx("formLabel")}>Preferred channel</label>
                        <select className={cx("input")} value={stakeholder.preferredChannel ?? ""} onChange={(e) => setStakeholderField(index, "preferredChannel", e.target.value || undefined)}>
                          <option value="">Select…</option>
                          {CHANNEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                      <div className={cx("grid2Cols12Gap", "colSpan2")}>
                        <div>
                          <label className={cx("formLabel")}>Notes</label>
                          <textarea className={cx("input", "resizeV", "minH80")} value={stakeholder.notes ?? ""} onChange={(e) => setStakeholderField(index, "notes", e.target.value)} />
                        </div>
                        <div className={cx("flexCol", "justifyCenter")}>
                          <label className={cx("flexRow", "gap8", "flexCenter", "mt20")}>
                            <input type="checkbox" checked={Boolean(stakeholder.isPrimary)} onChange={(e) => setStakeholderField(index, "isPrimary", e.target.checked)} />
                            <span className={cx("text12")}>Primary contact</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {stakeholderDraft.length === 0 && (
                  <div className={cx("emptyState")}>
                    <div className={cx("emptyStateTitle")}>No stakeholders yet</div>
                    <div className={cx("emptyStateSub")}>Add decision, billing, marketing, operations, and technical contacts for delivery clarity.</div>
                  </div>
                )}
              </div>
            ) : stakeholders.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="users" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No stakeholders linked</div>
                <div className={cx("emptyStateSub")}>Add the people who approve, finance, market, and support the account.</div>
              </div>
            ) : (
              <div className={cx("grid2Cols12Gap")}>
                {stakeholders.map((stakeholder) => (
                  <div key={stakeholder.id} className={cx("cardS1v2", "p12")}>
                    <div className={cx("flexBetween", "gap8", "mb8")}>
                      <span className={cx("badge", stakeholder.isPrimary ? "badgeAccent" : "badgeMuted")}>{stakeholderRoleLabel(stakeholder.role)}</span>
                      {stakeholder.isPrimary && <span className={cx("text10", "colorAccent")}>Primary</span>}
                    </div>
                    <div className={cx("text12", "fw700", "mb4")}>{stakeholder.fullName}</div>
                    <div className={cx("text11", "colorMuted", "mb8")}>{stakeholder.jobTitle ?? "No title set"}</div>
                    <div className={cx("flexCol", "gap4")}>
                      <div className={cx("text11", "colorMuted2")}>{stakeholder.email ?? "No email"}</div>
                      <div className={cx("text11", "colorMuted2")}>{stakeholder.phone ?? "No phone"}</div>
                      <div className={cx("text11", "colorMuted2")}>{stakeholder.preferredChannel ?? "No preferred channel"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={cx("grid2", "mb16")}>
        <div className={cx("card")} id="approvals">
          <div className={cx("cardHd")}>
            <Ic n="check" sz={14} c="var(--amber)" />
            <span className={cx("cardHdTitle", "ml8")}>Approval Preferences</span>
            <div className={cx("mlAuto", "flexRow", "gap8")}>
              {editingSection === "approvals" ? (
                <>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={cancelSectionEdit}>Cancel</button>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void saveSection("approvals")} disabled={savingSection === "approvals"}>
                    {savingSection === "approvals" ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => beginSectionEdit("approvals")}>Edit</button>
              )}
            </div>
          </div>
          <div className={cx("cardBodyPad", "cpSectionBodyPad")}>
            {editingSection === "approvals" ? (
              <div className={cx("grid2Cols12Gap")}>
                <div>
                  <label className={cx("formLabel")}>Primary approver</label>
                  <select className={cx("input")} value={approvalDraft.ownerStakeholderId ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, approvalPreferences: { ...(prev.approvalPreferences ?? {}), ownerStakeholderId: e.target.value || null } }))}>
                    <option value="">Select…</option>
                    {stakeholderDraft.map((stakeholder) => <option key={stakeholder.id} value={stakeholder.id}>{stakeholder.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cx("formLabel")}>Fallback approver</label>
                  <select className={cx("input")} value={approvalDraft.fallbackStakeholderId ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, approvalPreferences: { ...(prev.approvalPreferences ?? {}), fallbackStakeholderId: e.target.value || null } }))}>
                    <option value="">Select…</option>
                    {stakeholderDraft.map((stakeholder) => <option key={stakeholder.id} value={stakeholder.id}>{stakeholder.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cx("formLabel")}>Preferred channel</label>
                  <select className={cx("input")} value={approvalDraft.preferredChannel ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, approvalPreferences: { ...(prev.approvalPreferences ?? {}), preferredChannel: (e.target.value || null) as PortalClientApprovalPreferences["preferredChannel"] } }))}>
                    <option value="">Select…</option>
                    {CHANNEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cx("formLabel")}>Response target (hours)</label>
                  <input className={cx("input")} type="number" value={approvalDraft.responseTargetHours ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, approvalPreferences: { ...(prev.approvalPreferences ?? {}), responseTargetHours: e.target.value ? parseInt(e.target.value, 10) : null } }))} />
                </div>
                <div>
                  <label className={cx("formLabel")}>Escalation contact</label>
                  <input className={cx("input")} value={approvalDraft.escalationContact ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, approvalPreferences: { ...(prev.approvalPreferences ?? {}), escalationContact: e.target.value } }))} />
                </div>
                <div className={cx("colSpan2")}>
                  <label className={cx("formLabel")}>Approval notes</label>
                  <textarea className={cx("input", "resizeV", "minH100")} value={approvalDraft.approvalNotes ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, approvalPreferences: { ...(prev.approvalPreferences ?? {}), approvalNotes: e.target.value } }))} />
                </div>
              </div>
            ) : (
              profile?.approvalPreferences?.ownerStakeholderId ||
              profile?.approvalPreferences?.fallbackStakeholderId ||
              profile?.approvalPreferences?.preferredChannel ||
              profile?.approvalPreferences?.responseTargetHours ||
              profile?.approvalPreferences?.escalationContact ||
              profile?.approvalPreferences?.approvalNotes ? (
                <div className={cx("grid2Cols12Gap")}>
                  {[
                    ["Primary approver", stakeholders.find((item) => item.id === profile?.approvalPreferences?.ownerStakeholderId)?.fullName ?? "—"],
                    ["Fallback approver", stakeholders.find((item) => item.id === profile?.approvalPreferences?.fallbackStakeholderId)?.fullName ?? "—"],
                    ["Preferred channel", profile?.approvalPreferences?.preferredChannel ?? "—"],
                    ["Response target", profile?.approvalPreferences?.responseTargetHours ? profile.approvalPreferences.responseTargetHours + " hours" : "—"],
                    ["Escalation contact", profile?.approvalPreferences?.escalationContact ?? "—"],
                    ["Approval notes", profile?.approvalPreferences?.approvalNotes ?? "—"],
                  ].map(([label, value]) => (
                    <div key={label} className={cx("cardS1v2", "p12")}>
                      <div className={cx("formLabel")}>{label}</div>
                      <div className={cx("text12", "fw600", "lineH165")}>{value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="check" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>Approval preferences not configured</div>
                  <div className={cx("emptyStateSub")}>Assign approvers, response targets, and escalation routing so delivery approvals follow a clear operating path.</div>
                </div>
              )
            )}
          </div>
        </div>

        <div className={cx("card")} id="brand">
          <div className={cx("cardHd")}>
            <Ic n="layers" sz={14} c="var(--purple)" />
            <span className={cx("cardHdTitle", "ml8")}>Brand & Documents</span>
            <div className={cx("mlAuto", "flexRow", "gap8")}>
              {editingSection === "brand" ? (
                <>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={cancelSectionEdit}>Cancel</button>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void saveSection("brand")} disabled={savingSection === "brand"}>
                    {savingSection === "brand" ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => beginSectionEdit("brand")}>Edit</button>
              )}
            </div>
          </div>
          <div className={cx("cardBodyPad")}>
            {editingSection === "brand" && (
              <div className={cx("grid2Cols12Gap", "mb16")}>
                <div className={cx("colSpan2")}>
                  <label className={cx("formLabel")}>Approved brand colours</label>
                  <input
                    className={cx("input")}
                    value={(draft.approvedBrandColors ?? []).join(", ")}
                    onChange={(e) => setDraft((prev) => ({ ...prev, approvedBrandColors: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))}
                    placeholder="#C8F135, #0F172A"
                  />
                </div>
                {SOCIAL_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label className={cx("formLabel")}>{field.label}</label>
                    <input
                      className={cx("input")}
                      value={(draft.socialLinks as Record<string, string> | undefined)?.[field.key] ?? ""}
                      onChange={(e) => setDraft((prev) => ({
                        ...prev,
                        socialLinks: { ...(prev.socialLinks ?? {}), [field.key]: e.target.value },
                      }))}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className={cx("cpBrandColoursBlock", "mb16")}>
              <div className={cx("formLabel", "mb8")}>Approved Brand Colours</div>
              <div className={cx("flexRow", "gap8", "flexWrap")}>
                {(profile?.approvedBrandColors ?? []).length > 0 ? (profile?.approvedBrandColors ?? []).map((color) => (
                  <span key={color} className={cx("badge", "badgeMuted")}>{color}</span>
                )) : <span className={cx("text11", "colorMuted")}>No approved colours listed yet.</span>}
              </div>
            </div>

            <div className={cx("flexCol", "gap10")}>
              {DOCUMENT_SLOTS.map((slot) => {
                const asset = identityAssets?.[slot.key as keyof typeof identityAssets] as { fileId?: string; label?: string; fileName?: string } | null | undefined;
                const docFileId = asset?.fileId ?? null;
                return (
                  <div key={slot.key} className={cx("cardS1v2", "p12", "flexBetween", "gap12", "flexWrap")}>
                    <div className={cx("flex1")}>
                      <div className={cx("fw600", "text12", "mb4")}>{slot.label}</div>
                      <div className={cx("text11", "colorMuted", "mb6")}>{slot.hint}</div>
                      <div className={cx("text10", "colorMuted2")}>{asset?.fileName ?? "No file linked"}</div>
                    </div>
                    <div className={cx("flexRow", "gap8")}>
                      {docFileId && (
                        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void openDocument(docFileId)}>
                          View
                        </button>
                      )}
                      <button
                        type="button"
                        className={cx("btnSm", "btnAccent")}
                        onClick={() => {
                          setDocumentSlot(slot.key);
                          documentInputRef.current?.click();
                        }}
                        disabled={uploadingDocumentKey === slot.key}
                      >
                        {uploadingDocumentKey === slot.key ? "Uploading…" : "Upload"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={cx("mt16")}>
              <div className={cx("formLabel", "mb8")}>Social Links</div>
              <div className={cx("flexCol", "gap6")}>
                {SOCIAL_FIELDS.map((field) => {
                  const value = socialLinks?.[field.key];
                  return (
                    <div key={field.key} className={cx("flexBetween", "py8_0", "borderB")}>
                      <span className={cx("text12", "colorMuted")}>{field.label}</span>
                      {value ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" className={cx("text12", "dynColor")} style={{ "--color": field.color } as React.CSSProperties}>
                          {value.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                        </a>
                      ) : (
                        <span className={cx("text11", "colorMuted")}>Not set</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <input
              ref={documentInputRef}
              type="file"
              className={cx("dNone")}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && documentSlot) void handleDocumentUpload(documentSlot, file);
                event.target.value = "";
                setDocumentSlot(null);
              }}
            />
          </div>
        </div>
      </div>

      <div className={cx("grid2")}>
        <div className={cx("card")} id="account">
          <div className={cx("cardHd")}>
            <Ic n="shield" sz={14} c="var(--amber)" />
            <span className={cx("cardHdTitle", "ml8")}>Account Health</span>
          </div>
          <div className={cx("cardBodyPad")}>
            {[
              ["Owner / Contact", profile?.ownerName ?? "—"],
              ["Billing Email", profile?.billingEmail ?? "—"],
              ["Timezone", profile?.timezone ?? "—"],
              ["Tier", profile?.tier ?? "—"],
              ["SLA Level", profile?.slaTier ?? "—"],
              ["Contract Start", fmtDate(profile?.contractStartAt)],
              ["Contract Renewal", fmtDate(profile?.contractRenewalAt)],
              ["Last Profile Update", fmtDate(profile?.updatedAt)],
            ].map(([label, value]) => (
              <div key={label} className={cx("flexBetween", "py9_0", "borderB")}>
                <span className={cx("text12", "colorMuted")}>{label}</span>
                <span className={cx("fw600", "text12")}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("card")} id="audit">
          <div className={cx("cardHd")}>
            <Ic n="activity" sz={14} c="var(--cyan)" />
            <span className={cx("cardHdTitle", "ml8")}>Audit Trail</span>
          </div>
          <div className={cx("cardBodyPad")}>
            {auditEvents.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="activity" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No recent profile changes</div>
                <div className={cx("emptyStateSub")}>Recent updates to identity, contacts, approvals, and brand governance will appear here.</div>
              </div>
            ) : (
              <div className={cx("flexCol", "gap10")}>
                {auditEvents.map((event) => (
                  <div key={event.id} className={cx("cardS1v2", "p12")}>
                    <div className={cx("flexBetween", "gap8", "mb4")}>
                      <span className={cx("badge", "badgeMuted")}>{event.section}</span>
                      <span className={cx("text10", "colorMuted2")}>{fmtDate(event.createdAt)}</span>
                    </div>
                    <div className={cx("text12", "fw600", "mb4")}>{event.summary}</div>
                    <div className={cx("text11", "colorMuted")}>{event.actorName ?? event.actorRole ?? "System"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
