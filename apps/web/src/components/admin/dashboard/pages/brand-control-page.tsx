"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { loadClientBrandingWithRefresh, updateClientBrandingWithRefresh, type ClientBranding } from "../../../../lib/api/admin/clients";
import { saveSession } from "../../../../lib/auth/session";

const brandTokens = {
  primary: "var(--accent)",
  secondary: "var(--bg)",
  accent: "var(--accent)",
  fontDisplay: "Syne",
  fontBody: "DM Mono",
  logoUrl: "MAPHARI",
};

const emailTemplates = [
  { id: "welcome", name: "Client Welcome Email", lastEdited: "Jan 2026", status: "active", sentCount: 12 },
  { id: "invoice", name: "Invoice Notification", lastEdited: "Feb 2026", status: "active", sentCount: 147 },
  { id: "milestone", name: "Milestone Approved", lastEdited: "Dec 2025", status: "active", sentCount: 34 },
  { id: "overdue", name: "Invoice Overdue Reminder", lastEdited: "Feb 2026", status: "active", sentCount: 18 },
  { id: "report", name: "Monthly Report Delivery", lastEdited: "Jan 2026", status: "active", sentCount: 45 },
  { id: "churn", name: "Renewal Reminder", lastEdited: "Nov 2025", status: "draft", sentCount: 0 },
];

const customDomains = [
  { domain: "portal.maphari.co.za", type: "Client Portal", status: "active", ssl: true, verified: true },
  { domain: "reports.maphari.co.za", type: "Report Delivery", status: "active", ssl: true, verified: true },
  { domain: "app.maphari.co.za", type: "Staff Dashboard", status: "pending", ssl: false, verified: false },
];

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

  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.style.setProperty("--brand-primary", primary);
    rootRef.current.style.setProperty("--brand-accent", accent);
  }, [primary, accent]);

  return (
    <div ref={rootRef} className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / BRAND & WHITE-LABEL</div>
          <h1 className={styles.pageTitle}>Brand Control</h1>
          <div className={styles.pageSub}>Global brand tokens · Email templates · Domains · White-label</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Preview Changes</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>Publish Brand</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Active Email Templates", value: emailTemplates.filter((t) => t.status === "active").length.toString(), color: "var(--accent)", sub: `${emailTemplates.filter((t) => t.status === "draft").length} drafts` },
          { label: "Custom Domains", value: customDomains.length.toString(), color: "var(--blue)", sub: `${customDomains.filter((d) => d.ssl).length} SSL secured` },
          { label: "White-Label Clients", value: whitelabelClients.length.toString(), color: "var(--purple)", sub: `${whitelabelClients.filter((c) => c.status === "custom").length} custom branded` },
          { label: "Brand Version", value: "v2.4", color: "var(--amber)", sub: "Last updated Feb 2026" },
        ].map((stat) => (
          <div key={stat.label} className={cx(styles.statCard, toneClass(stat.color))}>
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={cx(styles.statValue, styles.brandToneText)}>{stat.value}</div>
            <div className={cx("text11", "colorMuted")}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "brand tokens" ? (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.brandSectionTitle}>Color Palette</div>
            <div className={styles.brandColorGrid}>
              {[
                { label: "Primary", color: primary, editable: true as const, setter: setPrimary },
                { label: "Secondary", color: "var(--bg)", editable: false as const },
                { label: "Accent", color: accent, editable: true as const, setter: setAccent },
              ].map((swatch) => (
                <div key={swatch.label}>
                  <div className={styles.brandSwatch}>
                    <svg viewBox="0 0 100 64" className={styles.brandSwatchSvg} aria-hidden="true" focusable="false">
                      <rect x="0" y="0" width="100" height="64" fill={swatch.color} />
                    </svg>
                  </div>
                  <div className={cx("text11", "colorMuted")}>{swatch.label}</div>
                  <div className={cx("fontMono", "text11")}>{swatch.color}</div>
                  {swatch.editable ? (
                    <input
                      type="color"
                      value={swatch.color}
                      onChange={(event) => swatch.setter(event.target.value)}
                      className={styles.brandColorInput}
                      title={`${swatch.label} color`}
                    />
                  ) : null}
                </div>
              ))}
            </div>
            <div className={styles.brandPreviewCard}>
              <div className={cx("text11", "colorMuted", "mb8")}>Live Preview</div>
              <div className={cx("flexRow", "gap8")}>
                <button type="button" className={cx(styles.brandPrimaryBtn, styles.brandTonePrimary)}>Primary Button</button>
                <button type="button" className={cx(styles.brandOutlineBtn, styles.brandTonePrimary)}>Outline Button</button>
              </div>
              <div className={cx(styles.brandAccentText, styles.brandToneAccent)}>Accent text colour preview</div>
            </div>
          </div>

          <div className={cx("flexCol", "gap16")}>
            <div className={cx("card", "p24")}>
              <div className={styles.brandSectionTitle}>Typography</div>
              <div className={cx("flexCol", "gap16")}>
                <div className={styles.brandTypoCard}>
                  <div className={cx("text11", "colorMuted", "mb8")}>Display Font: <span className={cx("fontMono", "colorAccent")}>{brandTokens.fontDisplay}</span></div>
                  <div className={styles.brandDisplaySample}>Maphari Creative</div>
                </div>
                <div className={styles.brandTypoCard}>
                  <div className={cx("text11", "colorMuted", "mb8")}>Body Font: <span className={cx("fontMono", "colorAccent")}>{brandTokens.fontBody}</span></div>
                  <div className={styles.brandBodySample}>maphari.co.za/portal</div>
                </div>
              </div>
            </div>

            <div className={cx("card", "p24")}>
              <div className={styles.brandSectionTitle}>Logo & Assets</div>
              <div className={styles.brandLogoCard}>
                <div className={styles.brandLogoWordmark}>{brandTokens.logoUrl}</div>
                <div className={cx("text11", "colorMuted", "mt4")}>Current wordmark</div>
              </div>
              <div className={cx("grid2", "gap8")}>
                <button type="button" className={cx("btnSm", "btnGhost", styles.brandWFull)}>Upload Logo</button>
                <button type="button" className={cx("btnSm", "btnGhost", styles.brandWFull)}>Upload Favicon</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "email templates" ? (
        <div className={styles.brandEmailLayout}>
          <div className={cx("flexCol", "gap12")}>
            {emailTemplates.map((template) => (
              <div key={template.id} className={styles.brandTemplateCard}>
                <div>
                  <div className={cx("fw600", "mb4")}>{template.name}</div>
                  <div className={cx("text12", "colorMuted")}>Last edited: {template.lastEdited}</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted", "mb2")}>Times Sent</div>
                  <div className={cx("fontMono", "colorBlue")}>{template.sentCount}</div>
                </div>
                <span className={cx("badge", template.status === "active" ? "badgeGreen" : "badgeAmber")}>{template.status}</span>
                <button type="button" className={cx("btnSm", "btnGhost")}>Preview</button>
                <button type="button" className={cx("btnSm", "btnAccent")}>Edit Template</button>
              </div>
            ))}
            <button type="button" className={styles.brandCreateCard}>+ Create New Template</button>
          </div>

          <div className={cx("card", "p24")}>
            <div className={styles.brandSectionTitle}>Email Preview</div>
              <div className={styles.brandEmailMockOuter}>
                <div className={styles.brandEmailMockHead}>
                <div className={cx(styles.brandEmailMark, styles.brandTonePrimary)}>MAPHARI</div>
                </div>
              <div className={styles.brandEmailMockBody}>
                <div className={styles.brandEmailMockTitle}>Your invoice is ready</div>
                <div className={styles.brandEmailMockText}>Hi [Client Name], your latest invoice is now available in your portal.</div>
                <div className={cx(styles.brandEmailMockBtn, styles.brandTonePrimary)}>View Invoice -&gt;</div>
                <div className={styles.brandEmailMockFoot}>Maphari Creative Agency - maphari.co.za</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "custom domains" ? (
        <div className={cx("flexCol", "gap16")}>
          <div className={styles.brandInfoCard}>Custom domains allow each portal or service to run under your own domain. SSL certificates are auto-provisioned and DNS may take up to 48h.</div>
          {customDomains.map((domain) => (
            <div key={domain.domain} className={styles.brandDomainCard}>
              <div>
                <div className={cx("fontMono", "fw700", "text14", "colorBlue")}>{domain.domain}</div>
                <div className={cx("text12", "colorMuted", "mt4")}>{domain.type}</div>
              </div>
              <div className={cx("flexCol", "gap4")}>
                <div className={cx("text11", "colorMuted")}>{domain.ssl ? "✓" : "✗"} SSL Active</div>
                <div className={cx("text11", "colorMuted")}>{domain.verified ? "✓" : "⏳"} DNS Verified</div>
              </div>
              <span className={cx("badge", domain.status === "active" ? "badgeGreen" : "badgeAmber")}>{domain.status}</span>
              <button type="button" className={cx("btnSm", "btnGhost")}>Test</button>
              <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
              <button type="button" className={cx("btnSm", styles.brandDangerBtn)}>Remove</button>
            </div>
          ))}
          <button type="button" className={styles.brandCreateAccentCard}>+ Add Custom Domain</button>
        </div>
      ) : null}

      {activeTab === "white-label clients" && session ? (
        <ClientBrandingSection session={session} />
      ) : null}
    </div>
  );
}
