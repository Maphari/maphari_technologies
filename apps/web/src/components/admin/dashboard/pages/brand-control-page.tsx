"use client";

import { useState } from "react";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  lime: "#a78bfa",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0",
};

const brandTokens = {
  primary: "#a78bfa",
  secondary: "#050508",
  accent: "#a78bfa",
  fontDisplay: "Syne",
  fontBody: "DM Mono",
  borderRadius: "10px",
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

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / BRAND &amp; WHITE-LABEL</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Brand Control</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Global brand tokens - Email templates - Domains - White-label</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Preview Changes</button>
          <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Publish Brand</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Active Email Templates", value: emailTemplates.filter((t) => t.status === "active").length.toString(), color: C.lime, sub: `${emailTemplates.filter((t) => t.status === "draft").length} drafts` },
          { label: "Custom Domains", value: customDomains.length.toString(), color: C.blue, sub: `${customDomains.filter((d) => d.ssl).length} SSL secured` },
          { label: "White-Label Clients", value: whitelabelClients.length.toString(), color: C.purple, sub: `${whitelabelClients.filter((c) => c.status === "custom").length} custom branded` },
          { label: "Brand Version", value: "v2.4", color: C.amber, sub: "Last updated Feb 2026" },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === t ? C.lime : C.muted,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: `2px solid ${activeTab === t ? C.lime : "transparent"}`,
              marginBottom: -1,
              transition: "all 0.2s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "brand tokens" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Color Palette</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Primary", color: primary, editable: true as const, setter: setPrimary },
                { label: "Secondary", color: C.bg, editable: false as const },
                { label: "Accent", color: accent, editable: true as const, setter: setAccent },
              ].map((sw) => (
                <div key={sw.label}>
                  <div style={{ width: "100%", height: 64, background: sw.color, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: C.muted }}>{sw.label}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.text }}>{sw.color}</div>
                  {sw.editable && (
                    <input
                      type="color"
                      value={sw.color}
                      onChange={(e) => sw.setter(e.target.value)}
                      style={{ marginTop: 6, width: "100%", height: 24, borderRadius: 4, border: "none", cursor: "pointer", background: "none" }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: 16, background: C.bg, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Live Preview</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ background: primary, color: C.bg, border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Primary Button</button>
                <button style={{ background: "transparent", border: `1px solid ${primary}`, color: primary, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Outline Button</button>
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: accent }}>Accent text colour preview</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Typography</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Display Font", value: brandTokens.fontDisplay, preview: "Maphari Creative", style: { fontFamily: "Syne", fontWeight: 800, fontSize: 20 } },
                  { label: "Body Font", value: brandTokens.fontBody, preview: "maphari.co.za/portal", style: { fontFamily: "DM Mono", fontSize: 13 } },
                ].map((f) => (
                  <div key={f.label} style={{ padding: 16, background: C.bg, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
                      {f.label}: <span style={{ color: C.lime, fontFamily: "DM Mono, monospace" }}>{f.value}</span>
                    </div>
                    <div style={{ ...f.style, color: C.text }}>{f.preview}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Logo &amp; Assets</div>
              <div style={{ padding: 24, background: C.bg, borderRadius: 8, textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.lime, fontFamily: "Syne, sans-serif", letterSpacing: "-0.02em" }}>{brandTokens.logoUrl}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Current wordmark</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ flex: 1, background: C.border, border: "none", color: C.text, padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Upload Logo</button>
                <button style={{ flex: 1, background: C.border, border: "none", color: C.text, padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Upload Favicon</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "email templates" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {emailTemplates.map((tmpl) => (
              <div key={tmpl.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, display: "grid", gridTemplateColumns: "1fr 120px 80px 80px auto", alignItems: "center", gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{tmpl.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Last edited: {tmpl.lastEdited}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Times Sent</div>
                  <div style={{ fontFamily: "DM Mono, monospace", color: C.blue }}>{tmpl.sentCount}</div>
                </div>
                <span style={{ fontSize: 10, color: tmpl.status === "active" ? C.lime : C.amber, background: `${tmpl.status === "active" ? C.lime : C.amber}15`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{tmpl.status}</span>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Preview</button>
                <button style={{ background: `${C.lime}15`, border: `1px solid ${C.lime}44`, color: C.lime, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Edit Template</button>
              </div>
            ))}
            <button style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10, padding: 20, color: C.muted, fontSize: 13, cursor: "pointer", textAlign: "center" }}>+ Create New Template</button>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email Preview</div>
            <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ background: C.bg, padding: "16px 20px", borderBottom: "1px solid #eee" }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, color: primary }}>MAPHARI</div>
              </div>
              <div style={{ padding: "20px 20px", background: "#fafafa" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 12 }}>Your invoice is ready</div>
                <div style={{ fontFamily: "Arial, sans-serif", fontSize: 13, color: "#555", lineHeight: 1.7, marginBottom: 16 }}>
                  Hi Volta Studios,
                  <br />
                  <br />
                  Your invoice INV-0041 for R34,800 is now available. Payment is due by 28 Feb 2026.
                </div>
                <div style={{ background: primary, color: C.bg, padding: "10px 20px", borderRadius: 6, fontSize: 13, fontWeight: 700, display: "inline-block", marginBottom: 16 }}>View Invoice -&gt;</div>
                <div style={{ fontSize: 11, color: "#999", borderTop: "1px solid #eee", paddingTop: 12 }}>Maphari Creative Agency - maphari.co.za</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "custom domains" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.blue}33`, borderRadius: 10, padding: 16, fontSize: 12, color: C.muted }}>
            Custom domains allow each portal or service to run under your own domain. SSL certificates are auto-provisioned via Let&apos;s Encrypt. DNS changes may take up to 48h to propagate.
          </div>
          {customDomains.map((d) => (
            <div key={d.domain} style={{ background: C.surface, border: `1px solid ${d.status === "pending" ? `${C.amber}55` : C.border}`, borderRadius: 10, padding: 24, display: "grid", gridTemplateColumns: "1fr 160px 100px 80px 80px auto", alignItems: "center", gap: 20 }}>
              <div>
                <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 14, color: C.blue }}>{d.domain}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{d.type}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 11, display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ color: d.ssl ? C.lime : C.red }}>{d.ssl ? "✓" : "✗"}</span>
                  <span style={{ color: C.muted }}>SSL Active</span>
                </div>
                <div style={{ fontSize: 11, display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ color: d.verified ? C.lime : C.amber }}>{d.verified ? "✓" : "⏳"}</span>
                  <span style={{ color: C.muted }}>DNS Verified</span>
                </div>
              </div>
              <span style={{ fontSize: 10, color: d.status === "active" ? C.lime : C.amber, background: `${d.status === "active" ? C.lime : C.amber}15`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{d.status}</span>
              <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Test</button>
              <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Edit</button>
              <button style={{ background: C.surface, color: C.red, border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Remove</button>
            </div>
          ))}
          <button style={{ background: C.surface, border: `1px dashed ${C.lime}55`, borderRadius: 10, padding: 20, color: C.lime, fontSize: 13, cursor: "pointer", textAlign: "center" }}>+ Add Custom Domain</button>
        </div>
      )}

      {activeTab === "white-label clients" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {whitelabelClients.map((wl) => (
            <div key={wl.client} style={{ background: C.surface, border: `1px solid ${wl.status === "custom" ? `${C.purple}55` : C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{wl.client}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: C.blue }}>{wl.domain}</div>
                </div>
                <span style={{ fontSize: 10, color: wl.status === "custom" ? C.purple : C.muted, background: `${wl.status === "custom" ? C.purple : C.muted}15`, padding: "3px 10px", borderRadius: 4, fontFamily: "DM Mono, monospace", height: "fit-content" }}>{wl.status}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ padding: 14, background: C.bg, borderRadius: 8, display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18, color: wl.logoApplied ? C.lime : C.muted }}>{wl.logoApplied ? "✓" : "○"}</span>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted }}>Custom Logo</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{wl.logoApplied ? "Applied" : "Using default"}</div>
                  </div>
                </div>
                <div style={{ padding: 14, background: C.bg, borderRadius: 8, display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18, color: wl.colorOverride ? C.lime : C.muted }}>{wl.colorOverride ? "✓" : "○"}</span>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted }}>Color Override</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{wl.colorOverride ? "Customised" : "Brand default"}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ flex: 1, background: C.border, border: "none", color: C.text, padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Preview Portal</button>
                <button style={{ flex: 1, background: `${C.purple}15`, border: `1px solid ${C.purple}44`, color: C.purple, padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Configure</button>
              </div>
            </div>
          ))}
          <div style={{ border: `1px dashed ${C.border}`, borderRadius: 10, padding: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted, fontSize: 13 }}>
            + Add White-Label Client
          </div>
        </div>
      )}
    </div>
  );
}
