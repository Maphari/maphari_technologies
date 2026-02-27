"use client";

import { useState } from "react";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  lime: "#c8f135",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

type RiskStatus = "active" | "monitoring" | "resolved";
type RiskCategory = "Client" | "Financial" | "Operations" | "Staff" | "Legal";

type RiskItem = {
  id: string;
  category: RiskCategory;
  title: string;
  description: string;
  likelihood: number;
  impact: number;
  owner: string;
  status: RiskStatus;
  mrrImpact: number;
  dateRaised: string;
  lastUpdated: string;
  mitigations: string[];
  residualLikelihood: number;
  residualImpact: number;
  relatedTo: string | null;
};

const risks: RiskItem[] = [
  { id: "RSK-001", category: "Client", title: "Dune Collective — churn risk", description: "Active scope dispute, overdue invoice, no comms for 5 days. Intervention underway.", likelihood: 5, impact: 4, owner: "Renzo Fabbri", status: "active", mrrImpact: 16000, dateRaised: "Feb 10", lastUpdated: "Feb 22", mitigations: ["Escalation call scheduled Feb 25", "Scope compromise offer prepared", "Sipho to co-join call"], residualLikelihood: 3, residualImpact: 4, relatedTo: "Dune Collective" },
  { id: "RSK-002", category: "Client", title: "Kestrel Capital — invoice dispute + satisfaction drop", description: "INV-0039 overdue 12 days. NPS dropped from 7.5 to 4. Single contact point.", likelihood: 4, impact: 4, owner: "Nomsa Dlamini", status: "active", mrrImpact: 21000, dateRaised: "Feb 14", lastUpdated: "Feb 23", mitigations: ["Formal payment demand sent", "NPS follow-up call booked", "Find secondary stakeholder"], residualLikelihood: 3, residualImpact: 3, relatedTo: "Kestrel Capital" },
  { id: "RSK-003", category: "Financial", title: "Cash flow gap if both at-risk clients don't pay", description: "R37k outstanding between Kestrel and Dune. If neither resolves, Feb/Mar payroll could be tight.", likelihood: 3, impact: 5, owner: "Leilani Fotu", status: "active", mrrImpact: 37000, dateRaised: "Feb 18", lastUpdated: "Feb 22", mitigations: ["Opening balance R285k provides buffer", "Payroll scheduled Feb 25 before deadline", "Backup credit facility discussion with bank"], residualLikelihood: 2, residualImpact: 4, relatedTo: null },
  { id: "RSK-004", category: "Operations", title: "Freelancer cost overrun on Dune project", description: "Studio Outpost costs R18k against original R0 budget due to scope expansion. Not covered by client.", likelihood: 5, impact: 3, owner: "Renzo Fabbri", status: "active", mrrImpact: 18000, dateRaised: "Feb 8", lastUpdated: "Feb 15", mitigations: ["Freelancer approval gate introduced going forward", "Seek partial recovery in scope negotiation"], residualLikelihood: 2, residualImpact: 2, relatedTo: "Dune Collective" },
  { id: "RSK-005", category: "Staff", title: "Tapiwa — first performance review overdue", description: "EMP-006 has never had a formal review. Probation ended Jan 2025. Performance score 3.7 and utilisation 64%.", likelihood: 4, impact: 2, owner: "Leilani Fotu", status: "active", mrrImpact: 0, dateRaised: "Feb 20", lastUpdated: "Feb 20", mitigations: ["Schedule review with Renzo for Mar", "Set measurable 90-day targets"], residualLikelihood: 1, residualImpact: 2, relatedTo: null },
  { id: "RSK-006", category: "Staff", title: "Key person dependency — Renzo Fabbri", description: "Creative Director holds relationships across 3 clients. No deputy CD. Sick leave already 4 days Feb.", likelihood: 2, impact: 5, owner: "Sipho Nkosi", status: "monitoring", mrrImpact: 65600, dateRaised: "Jan 15", lastUpdated: "Feb 10", mitigations: ["Kira Bosman being developed as deputy", "Client relationships being broadened to Nomsa"], residualLikelihood: 2, residualImpact: 3, relatedTo: null },
  { id: "RSK-007", category: "Legal", title: "Renzo work permit expiry — Dec 2027", description: "Italian national on work permit. Expiry is 22 months away but renewal lead time is 6–12 months.", likelihood: 2, impact: 4, owner: "Leilani Fotu", status: "monitoring", mrrImpact: 0, dateRaised: "Jan 28", lastUpdated: "Jan 28", mitigations: ["Initiate renewal process by Jun 2026", "Flag to immigration attorney"], residualLikelihood: 1, residualImpact: 2, relatedTo: null },
  { id: "RSK-008", category: "Client", title: "Revenue concentration — top 2 clients = 65% MRR", description: "Volta + Kestrel account for 65% of portfolio MRR. Single churn event would materially impact business.", likelihood: 2, impact: 5, owner: "Sipho Nkosi", status: "monitoring", mrrImpact: 49000, dateRaised: "Dec 1", lastUpdated: "Feb 1", mitigations: ["3 new clients in pipeline", "Target 5th client by Mar to reduce concentration"], residualLikelihood: 2, residualImpact: 4, relatedTo: null },
  { id: "RSK-009", category: "Financial", title: "FY closeout overdue — accountant review Mar 10", description: "2 overdue expense claims, 1 outstanding invoice, bank rec incomplete. At risk of incomplete FY pack.", likelihood: 3, impact: 2, owner: "Leilani Fotu", status: "monitoring", mrrImpact: 0, dateRaised: "Feb 22", lastUpdated: "Feb 23", mitigations: ["All expense claims to be approved by Feb 27", "Bank rec to be done by Mar 5"], residualLikelihood: 1, residualImpact: 2, relatedTo: null },
  { id: "RSK-010", category: "Operations", title: "No formal scope change process", description: "Dune dispute revealed absence of a signed scope change protocol. Verbal approvals only.", likelihood: 3, impact: 3, owner: "Leilani Fotu", status: "resolved", mrrImpact: 0, dateRaised: "Feb 8", lastUpdated: "Feb 20", mitigations: ["Scope change form drafted and added to Notion", "Client contracts updated going forward"], residualLikelihood: 1, residualImpact: 2, relatedTo: null }
];

const categoryColors: Record<RiskCategory, string> = {
  Client: C.red,
  Financial: C.amber,
  Operations: C.orange,
  Staff: C.blue,
  Legal: C.purple
};

const statusConfig: Record<RiskStatus, { color: string; label: string }> = {
  active: { color: C.red, label: "Active" },
  monitoring: { color: C.amber, label: "Monitoring" },
  resolved: { color: C.lime, label: "Resolved" }
};

function riskLevel(likelihood: number, impact: number): { label: string; color: string } {
  const score = likelihood * impact;
  if (score >= 16) return { label: "Critical", color: "#ff2222" };
  if (score >= 9) return { label: "High", color: C.red };
  if (score >= 4) return { label: "Medium", color: C.amber };
  return { label: "Low", color: C.lime };
}

const tabs = ["risk register", "risk matrix", "by category", "mitigations"] as const;
type Tab = (typeof tabs)[number];
type FilterStatus = "All" | RiskStatus;

export function PortfolioRiskRegisterPage() {
  const [activeTab, setActiveTab] = useState<Tab>("risk register");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");
  const [expanded, setExpanded] = useState("RSK-001");

  const active = risks.filter((risk) => risk.status === "active");
  const critical = risks.filter((risk) => risk.likelihood * risk.impact >= 16);
  const highRisks = risks.filter((risk) => {
    const score = risk.likelihood * risk.impact;
    return score >= 9 && score < 16;
  });
  const totalMRRExposure = active.reduce((sum, risk) => sum + risk.mrrImpact, 0);

  const filtered = filterStatus === "All" ? risks : risks.filter((risk) => risk.status === filterStatus);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / REPORTING &amp; INTELLIGENCE</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Portfolio Risk Register</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Live risk log · Likelihood × impact · Mitigations · Residual exposure</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>+ Add Risk</button>
          <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Export Register</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Active Risks", value: active.length.toString(), color: C.red, sub: `${critical.length} critical, ${highRisks.length} high` },
          { label: "MRR Exposure", value: `R${(totalMRRExposure / 1000).toFixed(0)}k`, color: C.red, sub: "From active client risks" },
          { label: "Monitoring", value: risks.filter((risk) => risk.status === "monitoring").length.toString(), color: C.amber, sub: "Watch-list items" },
          { label: "Resolved (FY2026)", value: risks.filter((risk) => risk.status === "resolved").length.toString(), color: C.lime, sub: "Closed out this year" }
        ].map((stat) => (
          <div key={stat.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                border: "none",
                color: activeTab === tab ? C.lime : C.muted,
                padding: "8px 16px",
                cursor: "pointer",
                fontFamily: "Syne, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                borderBottom: `2px solid ${activeTab === tab ? C.lime : "transparent"}`,
                marginBottom: -1
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        {activeTab === "risk register" ? (
          <div style={{ display: "flex", gap: 6, paddingBottom: 8 }}>
            {(["All", "active", "monitoring", "resolved"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  background: filterStatus === status ? (status === "All" ? C.lime : statusConfig[status].color) : C.surface,
                  color: filterStatus === status ? C.bg : C.muted,
                  border: `1px solid ${filterStatus === status ? (status === "All" ? C.lime : statusConfig[status].color) : C.border}`,
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 10,
                  cursor: "pointer",
                  fontFamily: "DM Mono, monospace",
                  textTransform: "capitalize"
                }}
              >
                {status}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {activeTab === "risk register" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...filtered].sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact).map((risk) => {
            const level = riskLevel(risk.likelihood, risk.impact);
            const residualLevel = riskLevel(risk.residualLikelihood, risk.residualImpact);
            const sc = statusConfig[risk.status];
            const catColor = categoryColors[risk.category] || C.muted;
            const isExp = expanded === risk.id;
            return (
              <div key={risk.id} style={{ background: C.surface, border: `1px solid ${risk.status === "active" && risk.likelihood * risk.impact >= 9 ? `${level.color}44` : C.border}`, borderRadius: 12 }}>
                <div style={{ padding: 20, cursor: "pointer" }} onClick={() => setExpanded(isExp ? "" : risk.id)}>
                  <div style={{ display: "grid", gridTemplateColumns: "60px 80px 1fr 120px 100px 80px 80px", alignItems: "center", gap: 14 }}>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{risk.id}</span>
                    <span style={{ fontSize: 10, color: catColor, background: `${catColor}15`, padding: "3px 8px", borderRadius: 4 }}>{risk.category}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{risk.title}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Owner: {risk.owner.split(" ")[0]} · Raised {risk.dateRaised}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Risk Level</div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: level.color }}>{level.label} ({risk.likelihood}×{risk.impact}={risk.likelihood * risk.impact})</span>
                    </div>
                    {risk.mrrImpact > 0 ? (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>MRR at Risk</div>
                        <span style={{ fontFamily: "DM Mono, monospace", color: C.red, fontWeight: 700 }}>R{(risk.mrrImpact / 1000).toFixed(0)}k</span>
                      </div>
                    ) : (
                      <span />
                    )}
                    <span style={{ fontSize: 10, color: sc.color, background: `${sc.color}15`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace", textAlign: "center" }}>{sc.label}</span>
                    <span style={{ color: isExp ? C.lime : C.muted }}>{isExp ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isExp ? (
                  <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${C.border}` }}>
                    <div style={{ paddingTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Description</div>
                        <div style={{ fontSize: 13, lineHeight: 1.7, color: C.text }}>{risk.description}</div>
                        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div style={{ padding: 12, background: C.bg, borderRadius: 8, borderLeft: `3px solid ${level.color}` }}>
                            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Inherent Risk</div>
                            <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: level.color }}>{level.label}</div>
                            <div style={{ fontSize: 10, color: C.muted }}>L{risk.likelihood} × I{risk.impact} = {risk.likelihood * risk.impact}</div>
                          </div>
                          <div style={{ padding: 12, background: C.bg, borderRadius: 8, borderLeft: `3px solid ${residualLevel.color}` }}>
                            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Residual Risk</div>
                            <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: residualLevel.color }}>{residualLevel.label}</div>
                            <div style={{ fontSize: 10, color: C.muted }}>L{risk.residualLikelihood} × I{risk.residualImpact} = {risk.residualLikelihood * risk.residualImpact}</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Mitigations</div>
                        {risk.mitigations.map((mitigation, index) => (
                          <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8, padding: "8px 12px", background: C.bg, borderRadius: 6 }}>
                            <span style={{ color: C.lime, flexShrink: 0 }}>→</span>
                            <span style={{ fontSize: 12 }}>{mitigation}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: 12, fontSize: 11, color: C.muted }}>Last updated: {risk.lastUpdated}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                      {risk.status === "active" ? <button style={{ background: C.lime, color: C.bg, border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Mark Resolved</button> : null}
                      <button style={{ background: C.border, border: "none", color: C.text, padding: "8px 14px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Update Risk</button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {activeTab === "risk matrix" ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>5×5 Risk Matrix — Likelihood vs Impact</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 24 }}>Bubble = risk item. Position = likelihood (x) × impact (y). Size proportional to MRR exposure.</div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: -28, top: "50%", transform: "rotate(-90deg) translateX(50%)", fontSize: 10, color: C.muted, whiteSpace: "nowrap" }}>Impact →</div>
            <div style={{ display: "grid", gridTemplateColumns: "40px repeat(5, 1fr)", gridTemplateRows: "repeat(5, 80px)", gap: 0, marginLeft: 40 }}>
              {[5, 4, 3, 2, 1].map((impact) =>
                ([null, 1, 2, 3, 4, 5] as const).map((likelihood) => {
                  if (likelihood === null) {
                    return <div key={`y-${impact}`} style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, fontSize: 10, color: C.muted }}>{impact}</div>;
                  }
                  const score = likelihood * impact;
                  const bg = score >= 16 ? "#3a0505" : score >= 9 ? "#1a0a00" : score >= 4 ? "#1a1500" : "#050a05";
                  const borderColor = score >= 16 ? C.red : score >= 9 ? C.amber : score >= 4 ? `${C.lime}33` : `${C.muted}11`;
                  const cellRisks = risks.filter((risk) => risk.likelihood === likelihood && risk.impact === impact);
                  return (
                    <div key={`${impact}-${likelihood}`} style={{ background: bg, border: `1px solid ${borderColor}`, padding: 6, position: "relative", minHeight: 80, display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ position: "absolute", top: 3, right: 5, fontSize: 8, color: C.muted, fontFamily: "DM Mono, monospace" }}>{score}</span>
                      {cellRisks.map((risk) => (
                        <div key={risk.id} title={risk.title} style={{ fontSize: 8, background: `${categoryColors[risk.category]}33`, border: `1px solid ${categoryColors[risk.category]}55`, borderRadius: 3, padding: "2px 4px", color: categoryColors[risk.category], lineHeight: 1.3, cursor: "default" }}>
                          {risk.id} {risk.category[0]}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ display: "flex", marginLeft: 40, marginTop: 6 }}>
              <div style={{ width: 40 }} />
              {[1, 2, 3, 4, 5].map((likelihood) => (
                <div key={likelihood} style={{ flex: 1, textAlign: "center", fontSize: 10, color: C.muted }}>{likelihood}</div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 4, fontSize: 10, color: C.muted }}>Likelihood →</div>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: `${color}55`, border: `1px solid ${color}` }} />
                <span style={{ fontSize: 11, color: C.muted }}>{category}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "by category" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {Object.entries(categoryColors).map(([category, color]) => {
            const catRisks = risks.filter((risk) => risk.category === category);
            const activeCount = catRisks.filter((risk) => risk.status === "active").length;
            return (
              <div key={category} style={{ background: C.surface, border: `1px solid ${color}33`, borderRadius: 10, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{category}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {activeCount > 0 ? <span style={{ fontSize: 10, color: C.red, background: `${C.red}15`, padding: "2px 8px", borderRadius: 4 }}>{activeCount} active</span> : null}
                    <span style={{ fontSize: 10, color: C.muted }}>{catRisks.length} total</span>
                  </div>
                </div>
                {catRisks.map((risk) => {
                  const level = riskLevel(risk.likelihood, risk.impact);
                  const sc = statusConfig[risk.status];
                  return (
                    <div key={risk.id} style={{ padding: "10px 12px", background: C.bg, borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `3px solid ${level.color}` }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{risk.title}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{risk.owner.split(" ")[0]} · {level.label} risk</div>
                      </div>
                      <span style={{ fontSize: 9, color: sc.color, background: `${sc.color}15`, padding: "2px 6px", borderRadius: 4 }}>{sc.label}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : null}

      {activeTab === "mitigations" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {risks
            .filter((risk) => risk.status !== "resolved")
            .sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact)
            .map((risk) => {
              const level = riskLevel(risk.likelihood, risk.impact);
              const residual = riskLevel(risk.residualLikelihood, risk.residualImpact);
              return (
                <div key={risk.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{risk.title}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>Owner: {risk.owner} · {risk.id}</div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, color: C.muted }}>Inherent</div>
                        <div style={{ fontFamily: "DM Mono, monospace", color: level.color, fontWeight: 700 }}>{level.label} ({risk.likelihood * risk.impact})</div>
                      </div>
                      <span style={{ color: C.muted }}>→</span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, color: C.muted }}>Residual</div>
                        <div style={{ fontFamily: "DM Mono, monospace", color: residual.color, fontWeight: 700 }}>{residual.label} ({risk.residualLikelihood * risk.residualImpact})</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {risk.mitigations.map((mitigation, index) => (
                      <div key={index} style={{ display: "flex", gap: 10, padding: "8px 14px", background: C.bg, borderRadius: 6, alignItems: "center" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${C.lime}22`, border: `1px solid ${C.lime}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 9, color: C.lime, fontWeight: 700 }}>→</span>
                        </div>
                        <span style={{ fontSize: 12 }}>{mitigation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      ) : null}
    </div>
  );
}
