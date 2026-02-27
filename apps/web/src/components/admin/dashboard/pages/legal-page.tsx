"use client";

import { useState } from "react";
import { AdminTabs } from "./shared";

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
  text: "#e8e8f0"
} as const;

const contracts = [
  { id: "CTR-001", client: "Volta Studios", type: "Retainer Agreement", signed: "2024-09-01", expires: "2026-09-01", status: "active", value: "R336,000", monthsLeft: 7 },
  { id: "CTR-002", client: "Kestrel Capital", type: "Project Contract", signed: "2025-11-15", expires: "2026-04-15", status: "expiring-soon", value: "R84,000", monthsLeft: 2 },
  { id: "CTR-003", client: "Mira Health", type: "Retainer Agreement", signed: "2025-07-01", expires: "2026-07-01", status: "active", value: "R258,000", monthsLeft: 5 },
  { id: "CTR-004", client: "Dune Collective", type: "Project Contract", signed: "2025-12-01", expires: "2026-06-01", status: "active", value: "R192,000", monthsLeft: 4 },
  { id: "CTR-005", client: "Okafor & Sons", type: "NDA + Retainer", signed: "2024-06-01", expires: "2026-03-01", status: "expiring-soon", value: "R144,000", monthsLeft: 1 },
  { id: "CTR-006", client: "Studio Outpost", type: "Contractor Agreement", signed: "2025-01-15", expires: "2026-01-15", status: "expired", value: "N/A", monthsLeft: 0 }
] as const;

const compliance = [
  { area: "POPIA Compliance", status: "compliant", lastReview: "Jan 2026", nextReview: "Jan 2027", risk: "low" },
  { area: "BBBEE Certification", status: "compliant", lastReview: "Oct 2025", nextReview: "Oct 2026", risk: "low" },
  { area: "CIPC Registration", status: "compliant", lastReview: "Mar 2025", nextReview: "Mar 2026", risk: "medium" },
  { area: "Employment Contracts", status: "attention", lastReview: "Aug 2025", nextReview: "Overdue", risk: "high" },
  { area: "Terms of Service", status: "compliant", lastReview: "Dec 2025", nextReview: "Dec 2026", risk: "low" },
  { area: "Privacy Policy", status: "attention", lastReview: "Sep 2025", nextReview: "Overdue", risk: "medium" }
] as const;

const dataRetention = [
  { category: "Client Contracts", retentionYears: 7, policy: "POPIA §14", records: 24, lastAudit: "Jan 2026" },
  { category: "Financial Records", retentionYears: 5, policy: "SARS Requirement", records: 412, lastAudit: "Jan 2026" },
  { category: "Employee Records", retentionYears: 10, policy: "Employment Act", records: 18, lastAudit: "Oct 2025" },
  { category: "Client Communications", retentionYears: 3, policy: "Internal Policy", records: 2840, lastAudit: "Nov 2025" },
  { category: "Project Files", retentionYears: 5, policy: "Client Agreements", records: 156, lastAudit: "Jan 2026" }
] as const;

const incidents = [
  { id: "INC-001", type: "Data Query", description: "Mira Health requested client data export", date: "2026-02-10", status: "resolved", severity: "low" },
  { id: "INC-002", type: "Contract Dispute", description: "Luma Events - payment dispute, settled at 80%", date: "2026-01-22", status: "resolved", severity: "medium" },
  { id: "INC-003", type: "IP Concern", description: "Usage rights query on Volta Studios deliverables", date: "2026-02-18", status: "open", severity: "medium" }
] as const;

const statusStyles: Record<string, { color: string; bg: string }> = {
  active: { color: C.lime, bg: `${C.lime}15` },
  "expiring-soon": { color: C.amber, bg: `${C.amber}15` },
  expired: { color: C.red, bg: `${C.red}15` },
  compliant: { color: C.lime, bg: `${C.lime}15` },
  attention: { color: C.amber, bg: `${C.amber}15` },
  resolved: { color: C.lime, bg: `${C.lime}15` },
  open: { color: C.orange, bg: `${C.orange}15` }
};

function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] || { color: C.muted, bg: `${C.muted}15` };
  return (
    <span style={{ fontSize: 10, fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: "0.06em", color: s.color, background: s.bg, padding: "3px 8px", borderRadius: 4 }}>
      {status.replace(/-/g, " ")}
    </span>
  );
}

function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  const colors = { low: C.lime, medium: C.amber, high: C.red };
  return (
    <span style={{ color: colors[risk], fontFamily: "DM Mono, monospace", fontSize: 11, fontWeight: 700 }}>
      {risk === "high" ? "!" : risk === "medium" ? "△" : "✓"} {risk.toUpperCase()}
    </span>
  );
}

const tabs = ["contracts", "compliance", "data retention", "legal incidents"] as const;

export function LegalPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("contracts");

  const expiringCount = contracts.filter((c) => c.status === "expiring-soon").length;
  const expiredCount = contracts.filter((c) => c.status === "expired").length;
  const highRisk = compliance.filter((c) => c.risk === "high").length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>
            ADMIN / COMPLIANCE & LEGAL
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Legal Control Center</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Contracts · Compliance · Data retention · Legal incidents</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Generate Report</button>
          <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ New Contract</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Active Contracts", value: "5", color: C.lime, sub: "Total value R1.01M", alert: false },
          { label: "Expiring < 60 days", value: String(expiringCount), color: C.amber, sub: "Renew immediately", alert: true },
          { label: "Expired (no renewal)", value: String(expiredCount), color: C.red, sub: "Action required", alert: true },
          { label: "Compliance Issues", value: String(highRisk), color: highRisk > 0 ? C.red : C.lime, sub: highRisk > 0 ? "High-risk items" : "All clear", alert: highRisk > 0 }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${s.alert ? `${s.color}44` : C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor={C.lime}
        mutedColor={C.muted}
        panelColor={C.surface}
        borderColor={C.border}
      />

      {activeTab === "contracts" && (
        <div>
          <div style={{ background: C.surface, border: `1px solid ${C.amber}44`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em", color: C.amber }}>Expiry Calendar - Next 12 Months</div>
            <div style={{ display: "flex", gap: 0, position: "relative" }}>
              <div style={{ position: "absolute", top: 20, left: 0, right: 0, height: 2, background: C.border }} />
              {["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m, i) => {
                const contractsThisMonth = contracts.filter((c) => {
                  const month = new Date(c.expires).getMonth();
                  return month === i + 2;
                });
                return (
                  <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted }}>{m}</div>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: contractsThisMonth.length > 0 ? C.amber : C.border, border: `2px solid ${C.bg}`, zIndex: 1 }} />
                    {contractsThisMonth.map((c) => (
                      <div key={c.id} style={{ fontSize: 9, color: C.amber, textAlign: "center", background: `${C.amber}15`, padding: "2px 6px", borderRadius: 4 }}>{c.client}</div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflowX: "auto" }}>
            <div style={{ minWidth: 980 }}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 160px 120px 120px 100px 120px auto", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {["ID", "Client", "Type", "Signed", "Expires", "Value", "Status", ""].map((h) => <span key={h}>{h}</span>)}
              </div>
              {contracts.map((c, i) => (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 160px 120px 120px 100px 120px auto", padding: "16px 24px", borderBottom: i < contracts.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", background: c.status === "expired" ? `${C.red}12` : c.status === "expiring-soon" ? C.surface : "transparent" }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{c.id}</span>
                  <span style={{ fontWeight: 600 }}>{c.client}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>{c.type}</span>
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: "DM Mono, monospace" }}>{c.signed}</span>
                  <div>
                    <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: c.monthsLeft <= 2 ? C.red : C.muted }}>{c.expires}</div>
                    {c.monthsLeft > 0 ? <div style={{ fontSize: 10, color: C.muted }}>{c.monthsLeft}mo left</div> : null}
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: C.lime }}>{c.value}</span>
                  <StatusBadge status={c.status} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ background: C.border, border: "none", color: C.text, padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>View</button>
                    {c.status !== "active" ? <button style={{ background: c.status === "expired" ? C.surface : C.surface, border: "none", color: c.status === "expired" ? C.red : C.amber, padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Renew</button> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "compliance" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 80px 120px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {["Area", "Status", "Last Review", "Risk", "Next Review"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {compliance.map((c, i) => (
              <div key={c.area} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 80px 120px", padding: "16px 24px", borderBottom: i < compliance.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", background: c.status === "attention" ? `${C.amber}12` : "transparent" }}>
                <span style={{ fontWeight: 600 }}>{c.area}</span>
                <StatusBadge status={c.status} />
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "DM Mono, monospace" }}>{c.lastReview}</span>
                <RiskBadge risk={c.risk} />
                <span style={{ fontSize: 12, color: c.nextReview === "Overdue" ? C.red : C.muted, fontFamily: "DM Mono, monospace" }}>{c.nextReview}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.red}33`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 12, textTransform: "uppercase" }}>Requires Action</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {compliance.filter((c) => c.status === "attention").map((c) => (
                  <div key={c.area} style={{ padding: 12, background: C.bg, borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{c.area}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Review overdue · {c.risk} risk</div>
                    <button style={{ marginTop: 8, background: C.amber, color: C.bg, border: "none", padding: "4px 12px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Schedule Review</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Overall Compliance Score</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: C.amber, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>78/100</div>
              <div style={{ height: 8, background: C.border, borderRadius: 4, marginBottom: 8 }}>
                <div style={{ height: "100%", width: "78%", background: C.amber, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>2 items require attention to reach 90+ score</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "data retention" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.blue}33`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, color: C.blue, marginBottom: 4 }}>POPIA Data Retention Policy</div>
            <div style={{ fontSize: 12, color: C.muted }}>All personal data must only be retained for as long as necessary for the original purpose of collection, as required by POPIA §14. Scheduled deletions run automatically on the 1st of each month.</div>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflowX: "auto" }}>
            <div style={{ minWidth: 900 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 80px 120px 120px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {["Data Category", "Retain (yrs)", "Policy Basis", "Records", "Last Audit", "Action"].map((h) => <span key={h}>{h}</span>)}
              </div>
              {dataRetention.map((d, i) => (
                <div key={d.category} style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 80px 120px 120px", padding: "16px 24px", borderBottom: i < dataRetention.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>{d.category}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.amber }}>{d.retentionYears}y</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{d.policy}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.blue }}>{d.records}</span>
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: "DM Mono, monospace" }}>{d.lastAudit}</span>
                  <button style={{ background: C.border, border: "none", color: C.text, padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Audit Now</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "legal incidents" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <button style={{ background: C.red, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>+ Log New Incident</button>
          </div>
          {incidents.map((inc) => (
            <div key={inc.id} style={{ background: C.surface, border: `1px solid ${inc.status === "open" ? `${C.orange}55` : C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 120px 1fr 120px 100px auto", gap: 20, alignItems: "center" }}>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{inc.id}</span>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>Type</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{inc.type}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>Description</div>
                  <div style={{ fontSize: 13, color: C.text }}>{inc.description}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>Date</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{inc.date}</div>
                </div>
                <StatusBadge status={inc.status} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>View</button>
                  {inc.status === "open" ? <button style={{ background: `${C.lime}22`, color: C.lime, border: `1px solid ${C.lime}44`, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Resolve</button> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
