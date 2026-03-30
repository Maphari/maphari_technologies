"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { loadClientBrandingWithRefresh, updateClientBrandingWithRefresh, type ClientBranding } from "../../../../lib/api/admin/clients";
import { loadEmailTemplatesWithRefresh, loadCustomDomainsWithRefresh, type AdminEmailTemplate, type AdminCustomDomain } from "../../../../lib/api/admin/brand";
import { saveSession } from "../../../../lib/auth/session";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

const brandTokens = {
  primary: "var(--accent)",
  secondary: "var(--bg)",
  accent: "var(--accent)",
  fontDisplay: "Syne",
  fontBody: "DM Mono",
  logoUrl: "MAPHARI",
};

// emailTemplates and customDomains are loaded dynamically from the API in BrandControlPage

const whitelabelClients: { client: string; domain: string; logoApplied: boolean; colorOverride: boolean; status: string }[] = [];

const tabs = ["brand tokens", "email templates", "custom domains", "white-label clients"] as const;
type Tab = (typeof tabs)[number];

// ── White-label branding section ─────────────────────────────────────────────

function ClientBrandingSection({ session }: { session: import("../../../../lib/auth/session").AuthSession }) {
  const { snapshot } = useAdminWorkspaceContext();
  const clients = snapshot.clients;

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [branding, setBranding] = useState<ClientBranding | null>(null);
  const [loadingBranding, setLoadingBranding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Form state
  const [companyDisplayName, setCompanyDisplayName] = useState("");
  const [portalTitle, setPortalTitle] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#c8f135");
  const [logoUrl, setLogoUrl] = useState("");
  const [enabled, setEnabled] = useState(false);

  const loadBranding = useCallback(async (clientId: string) => {
    setLoadingBranding(true);
    const r = await loadClientBrandingWithRefresh(session, clientId);
    if (r.nextSession) saveSession(r.nextSession);
    setLoadingBranding(false);
    if (!r.error && r.data) {
      setBranding(r.data);
      setCompanyDisplayName(r.data.companyDisplayName ?? "");
      setPortalTitle(r.data.portalTitle ?? "");
      setPrimaryColor(r.data.primaryColor ?? "#c8f135");
      setLogoUrl(r.data.logoUrl ?? "");
      setEnabled(r.data.enabled);
    }
  }, [session]);

  useEffect(() => {
    if (!selectedClientId) { setBranding(null); return; }
    void loadBranding(selectedClientId);
  }, [selectedClientId, loadBranding]);

  const handleSave = async () => {
    if (!selectedClientId) return;
    setSaving(true);
    setSaveMsg(null);
    const r = await updateClientBrandingWithRefresh(session, selectedClientId, {
      companyDisplayName: companyDisplayName || null,
      portalTitle: portalTitle || null,
      primaryColor: primaryColor || null,
      logoUrl: logoUrl || null,
      enabled,
    });
    if (r.nextSession) saveSession(r.nextSession);
    setSaving(false);
    if (!r.error && r.data) {
      setBranding(r.data);
      setSaveMsg("Branding saved.");
    } else {
      setSaveMsg("Save failed.");
    }
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleReset = async () => {
    if (!selectedClientId) return;
    setSaving(true);
    const r = await updateClientBrandingWithRefresh(session, selectedClientId, { enabled: false });
    if (r.nextSession) saveSession(r.nextSession);
    setSaving(false);
    if (!r.error && r.data) {
      setBranding(r.data);
      setCompanyDisplayName("");
      setPortalTitle("");
      setPrimaryColor("#c8f135");
      setLogoUrl("");
      setEnabled(false);
      setSaveMsg("Branding reset.");
    }
    setTimeout(() => setSaveMsg(null), 3000);
  };

  // Live preview topbar colour
  const previewColor = enabled ? primaryColor : "var(--accent)";

  return (
    <div className={cx("flexCol", "gap20")}>
      <div className={cx("card", "p20")}>
        <div className={styles.brandSectionTitle}>Client Portal Branding</div>
        <div className={cx("text12", "colorMuted", "mb16")}>
          Configure per-client white-label branding. When enabled, the client portal reflects their brand colours and identity.
        </div>
        <div className={cx("flexRow", "gap12", "mb20")}>
          <div className={cx("flexCol", "gap4")} style={{ flex: 1 }}>
            <label className={cx("text11", "colorMuted")} htmlFor="cb-client-select">Select Client</label>
            <select
              id="cb-client-select"
              title="Select client to configure branding"
              className={styles.filterSelect}
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
            >
              <option value="">— Choose a client —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedClientId ? (
          loadingBranding ? (
            <div className={cx("text12", "colorMuted")}>Loading branding…</div>
          ) : (
            <div className={styles.cbLayout}>
              {/* ── Form ── */}
              <div className={styles.cbForm}>
                <div className={cx("flexCol", "gap16")}>
                  <div className={cx("flexCol", "gap6")}>
                    <label className={cx("text11", "colorMuted")} htmlFor="cb-company-name">Company display name</label>
                    <input
                      id="cb-company-name"
                      className={styles.input ?? ""}
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={companyDisplayName}
                      onChange={e => setCompanyDisplayName(e.target.value)}
                    />
                  </div>

                  <div className={cx("flexCol", "gap6")}>
                    <label className={cx("text11", "colorMuted")} htmlFor="cb-portal-title">Portal tab title</label>
                    <input
                      id="cb-portal-title"
                      className={styles.input ?? ""}
                      type="text"
                      placeholder="e.g. Acme Client Portal"
                      value={portalTitle}
                      onChange={e => setPortalTitle(e.target.value)}
                    />
                  </div>

                  <div className={cx("flexCol", "gap6")}>
                    <label className={cx("text11", "colorMuted")}>Primary colour</label>
                    <div className={styles.cbColorRow}>
                      <input
                        type="color"
                        className={styles.cbColorSwatch}
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        title="Pick primary colour"
                      />
                      <input
                        type="text"
                        className={cx(styles.input ?? "", styles.cbColorInput)}
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        placeholder="#c8f135"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  <div className={cx("flexCol", "gap6")}>
                    <label className={cx("text11", "colorMuted")} htmlFor="cb-logo-url">Logo URL</label>
                    <input
                      id="cb-logo-url"
                      className={styles.input ?? ""}
                      type="url"
                      placeholder="https://cdn.example.com/logo.png"
                      value={logoUrl}
                      onChange={e => setLogoUrl(e.target.value)}
                    />
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        style={{ height: 32, objectFit: "contain", marginTop: 6, borderRadius: 4 }}
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                  </div>

                  <div className={styles.cbToggleRow}>
                    <span className={cx("text13", "fw600")}>Enable branding</span>
                    <button
                      type="button"
                      className={cx("btnSm", enabled ? "btnAccent" : "btnGhost")}
                      onClick={() => setEnabled(v => !v)}
                    >
                      {enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>

                <div className={cx("flexRow", "gap8", "mt16")}>
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save Branding"}
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={handleReset}
                    disabled={saving}
                  >
                    Reset to Default
                  </button>
                  {saveMsg ? <span className={cx("text12", "colorMuted")}>{saveMsg}</span> : null}
                </div>
              </div>

              {/* ── Live preview ── */}
              <div className={styles.cbPreviewPanel}>
                <div className={styles.cbPreviewTitle}>Live Preview</div>
                <div className={styles.cbPreviewTopbar} style={{ borderTop: `2px solid ${previewColor}` }}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="logo" className={styles.cbPreviewLogo} />
                  ) : (
                    <div
                      className={styles.cbPreviewLogo}
                      style={{ background: previewColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", fontWeight: 800, color: "#050508" }}
                    >
                      {(companyDisplayName || "Co").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={styles.cbPreviewWordmark}
                    style={{ color: previewColor }}
                  >
                    {companyDisplayName || "Client Portal"}
                  </span>
                </div>
                <div className={cx("text11", "colorMuted")}>
                  {enabled
                    ? "Branding active — clients see this portal identity"
                    : "Branding inactive — clients see default Maphari branding"}
                </div>
                {branding ? (
                  <div className={cx("text10", "colorMuted", "mt8")}>
                    Last saved: {branding.enabled ? "Custom brand active" : "Default"}
                  </div>
                ) : null}
              </div>
            </div>
          )
        ) : (
          <div className={cx("text12", "colorMuted")}>Select a client above to configure their portal branding.</div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BrandControlPage() {
  const { session } = useAdminWorkspaceContext();
  const [activeTab, setActiveTab] = useState<Tab>("brand tokens");
  const [primary, setPrimary] = useState(brandTokens.primary);
  const [accent, setAccent] = useState(brandTokens.accent);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [emailTemplates, setEmailTemplates] = useState<AdminEmailTemplate[]>([]);
  const [customDomains, setCustomDomains] = useState<AdminCustomDomain[]>([]);

  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.style.setProperty("--brand-primary", primary);
    rootRef.current.style.setProperty("--brand-accent", accent);
  }, [primary, accent]);

  useEffect(() => {
    if (!session) return;
    void loadEmailTemplatesWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setEmailTemplates(r.data);
    });
    void loadCustomDomainsWithRefresh(session).then((r) => {
      if (!r.error && r.data) setCustomDomains(r.data);
    });
  }, [session]);

  const activeTemplates  = emailTemplates.filter(t => t.status === "active").length;
  const draftTemplates   = emailTemplates.filter(t => t.status === "draft").length;
  const sslDomains       = customDomains.filter(d => d.sslActive).length;

  const templateStatusData = [
    { label: "Active", count: activeTemplates },
    { label: "Draft",  count: draftTemplates  },
  ];

  const tableRows = emailTemplates.map(t => ({
    name:    t.name,
    status:  t.status,
    sent:    t.sentCount,
    edited:  new Date(t.lastEditedAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }),
  }));

  return (
    <div ref={rootRef} className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / BRAND</div>
          <h1 className={styles.pageTitle}>Brand Control</h1>
          <div className={styles.pageSub}>Global brand tokens · Email templates · Domains · White-label</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Preview Changes</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>Publish Brand</button>
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Active Email Templates" value={activeTemplates} sub={`${draftTemplates} drafts`} tone="accent" />
        <StatWidget label="Custom Domains" value={customDomains.length} sub={`${sslDomains} SSL secured`} tone="default" />
        <StatWidget label="White-Label Clients" value={whitelabelClients.length} sub="Custom branded" tone="default" />
        <StatWidget label="Brand Version" value="v2.4" sub="Last updated Feb 2026" tone="default" />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Email Templates by Status"
          data={templateStatusData}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Domain Health"
          stages={[
            { label: "Total",    count: customDomains.length,                                              total: Math.max(customDomains.length, 1), color: "#8b6fff" },
            { label: "SSL",      count: sslDomains,                                                        total: Math.max(customDomains.length, 1), color: "#34d98b" },
            { label: "Verified", count: customDomains.filter(d => d.verified).length,                     total: Math.max(customDomains.length, 1), color: "#34d98b" },
            { label: "Active",   count: customDomains.filter(d => d.status === "active").length,           total: Math.max(customDomains.length, 1), color: "#8b6fff" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Email Templates"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "name",   header: "Template" },
            { key: "status", header: "Status", render: (v) => {
              const val = v as string;
              const cls = val === "active" ? cx("badge", "badgeGreen") : cx("badge", "badgeAmber");
              return <span className={cls}>{val}</span>;
            }},
            { key: "sent",   header: "Sent",    align: "right" },
            { key: "edited", header: "Edited",  align: "right" },
          ]}
          emptyMessage="No email templates configured"
        />
      </WidgetGrid>

      {/* Tab-specific detail sections below widgets */}
      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "white-label clients" && session ? (
        <ClientBrandingSection session={session} />
      ) : null}
    </div>
  );
}
