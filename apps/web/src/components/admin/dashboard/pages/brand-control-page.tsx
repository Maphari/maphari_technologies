"use client";

import { useEffect, useRef, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

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

const whitelabelClients = [
  { client: "Volta Studios", domain: "portal.voltastudios.co.za", logoApplied: false, colorOverride: false, status: "default" },
  { client: "Mira Health", domain: "portal.mirahealth.co.za", logoApplied: true, colorOverride: true, status: "custom" },
];

const tabs = ["brand tokens", "email templates", "custom domains", "white-label clients"] as const;
type Tab = (typeof tabs)[number];

export function BrandControlPage() {
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
                <div className={styles.brandEmailMockText}>Hi Volta Studios, your invoice INV-0041 for R34,800 is now available.</div>
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

      {activeTab === "white-label clients" ? (
        <div className={cx("grid2", "gap20")}>
          {whitelabelClients.map((item) => (
            <div key={item.client} className={styles.brandWhiteLabelCard}>
              <div className={cx("flexBetween", "mb20")}>
                <div>
                  <div className={cx("fw700")}>{item.client}</div>
                  <div className={cx("fontMono", "text11", "colorMuted", "mt4")}>{item.domain}</div>
                </div>
                <span className={cx("badge", item.status === "custom" ? "badgePurple" : "badgeMuted")}>{item.status}</span>
              </div>
              <div className={styles.brandWhiteChecks}>
                <div className={cx("text12")}>{item.logoApplied ? "✓" : "✗"} Custom logo</div>
                <div className={cx("text12")}>{item.colorOverride ? "✓" : "✗"} Color override</div>
              </div>
              <div className={cx("flexRow", "gap8")}>
                <button type="button" className={cx("btnSm", "btnGhost")}>Configure</button>
                <button type="button" className={cx("btnSm", "btnGhost")}>Preview</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
