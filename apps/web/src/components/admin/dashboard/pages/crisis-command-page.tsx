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
  text: "#e8e8f0"
} as const;

type Severity = "critical" | "high" | "medium" | "low";
type CrisisTab = "active crises" | "escalation chain" | "recovery playbooks" | "resolved";

type Crisis = {
  id: string;
  client: string;
  color: string;
  severity: Severity;
  title: string;
  opened: string;
  daysOpen: number;
  owner: string;
  stage: string;
  lastAction: string;
  nextAction: string;
  health: number;
  revenue: number;
  timeline: Array<{ date: string; event: string; who: string }>;
};

const activeCrises: Crisis[] = [
  {
    id: "CRS-003",
    client: "Kestrel Capital",
    color: C.purple,
    severity: "critical",
    title: "Invoice dispute + communication breakdown",
    opened: "2026-02-17",
    daysOpen: 6,
    owner: "Nomsa Dlamini",
    stage: "Escalated to Admin",
    lastAction: "Admin called CEO Feb 22",
    nextAction: "Follow-up call Feb 24 @ 10:00",
    health: 34,
    revenue: 21000,
    timeline: [
      { date: "Feb 17", event: "Client flagged invoice as disputed", who: "Kestrel Capital" },
      { date: "Feb 18", event: "Nomsa sent payment breakdown", who: "Nomsa Dlamini" },
      { date: "Feb 19", event: "No response - 2nd reminder sent", who: "Nomsa Dlamini" },
      { date: "Feb 21", event: "Escalated to Admin", who: "Nomsa Dlamini" },
      { date: "Feb 22", event: "Admin called client CEO", who: "Sipho Nkosi" }
    ]
  },
  {
    id: "CRS-004",
    client: "Dune Collective",
    color: C.amber,
    severity: "high",
    title: "Project delay + scope creep complaint",
    opened: "2026-02-19",
    daysOpen: 4,
    owner: "Renzo Fabbri",
    stage: "Account Manager handling",
    lastAction: "Scope review sent Feb 21",
    nextAction: "Await client response by Feb 25",
    health: 43,
    revenue: 16000,
    timeline: [
      { date: "Feb 19", event: "Client emailed re: missed milestone", who: "Dune Collective" },
      { date: "Feb 20", event: "Renzo reviewed with Kira", who: "Renzo Fabbri" },
      { date: "Feb 21", event: "Scope change doc sent to client", who: "Renzo Fabbri" }
    ]
  }
];

const resolved = [
  { id: "CRS-001", client: "Luma Events", severity: "medium" as Severity, title: "Payment dispute - settled at 80%", resolved: "Jan 2026", daysToResolve: 12, outcome: "Write-off R3,200" },
  { id: "CRS-002", client: "Helios Digital", severity: "high" as Severity, title: "Project scope breakdown - client exited", resolved: "Jan 2026", daysToResolve: 21, outcome: "Client churned" }
] as const;

const escalationChain = [
  { level: 1, role: "Account Manager", person: "Nomsa Dlamini", trigger: "Client unresponsive 3+ days", color: C.lime },
  { level: 2, role: "Operations Admin", person: "Leilani Fotu", trigger: "AM escalation or invoice 7+ days overdue", color: C.blue },
  { level: 3, role: "Super Admin / Owner", person: "Sipho Nkosi", trigger: "Churn risk confirmed or legal threat", color: C.red }
] as const;

const recoveryPlaybooks = [
  { name: "Silent Client", steps: ["Send personal message from AM", "Follow-up with value recap", "Offer check-in call", "Escalate if 5 days silent"] },
  { name: "Invoice Dispute", steps: ["Send itemised breakdown", "Offer to schedule review call", "Offer flexible payment plan", "Escalate to admin if unresolved in 7 days"] },
  { name: "Scope Conflict", steps: ["Acknowledge the issue directly", "Share original scope document", "Propose change order", "Offer project reset session"] },
  { name: "Quality Complaint", steps: ["Apologise without admitting full fault", "Schedule quality review", "Offer revision at no cost", "Send satisfaction check 72h later"] }
] as const;

const severityColors: Record<Severity, string> = { critical: C.red, high: C.orange, medium: C.amber, low: C.muted };

const tabs = ["active crises", "escalation chain", "recovery playbooks", "resolved"] as const;

export function CrisisCommandPage() {
  const [activeTab, setActiveTab] = useState<CrisisTab>("active crises");
  const [expanded, setExpanded] = useState<string | null>("CRS-003");

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.red, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / CRISIS & ESCALATION</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Crisis Command</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Active crises · Escalation chains · Recovery playbooks</div>
        </div>
        <button style={{ background: C.red, color: "#fff", padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>
          + Log New Crisis
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Active Crises", value: activeCrises.length.toString(), color: C.red, sub: `${activeCrises.filter((c) => c.severity === "critical").length} critical` },
          { label: "Revenue at Risk", value: `R${(activeCrises.reduce((s, c) => s + c.revenue, 0) / 1000).toFixed(0)}k`, color: C.orange, sub: "Monthly retainer value" },
          { label: "Avg Days Open", value: `${Math.round(activeCrises.reduce((s, c) => s + c.daysOpen, 0) / activeCrises.length)}d`, color: C.amber, sub: "Active cases only" },
          { label: "Resolved (90d)", value: resolved.length.toString(), color: C.lime, sub: `Avg ${Math.round(resolved.reduce((s, c) => s + c.daysToResolve, 0) / resolved.length)}d to resolve` }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${s.label === "Active Crises" ? `${C.red}55` : C.border}`, borderRadius: 10, padding: 20 }}>
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
              color: activeTab === t ? C.red : C.muted,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: `2px solid ${activeTab === t ? C.red : "transparent"}`,
              marginBottom: -1,
              transition: "all 0.2s"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "active crises" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {activeCrises.map((crisis) => (
            <div key={crisis.id} style={{ background: C.surface, border: `2px solid ${severityColors[crisis.severity]}55`, borderRadius: 12 }}>
              <div style={{ padding: 24, cursor: "pointer" }} onClick={() => setExpanded(expanded === crisis.id ? null : crisis.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 4, height: 48, borderRadius: 2, background: severityColors[crisis.severity], flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{crisis.id}</span>
                        <span style={{ fontSize: 10, color: severityColors[crisis.severity], background: `${severityColors[crisis.severity]}18`, padding: "2px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace", textTransform: "uppercase" }}>
                          {crisis.severity}
                        </span>
                        <span style={{ fontSize: 12, color: crisis.color, fontWeight: 700 }}>{crisis.client}</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{crisis.title}</div>
                      <div style={{ display: "flex", gap: 20, fontSize: 12, color: C.muted }}>
                        <span>
                          Owner: <span style={{ color: C.text }}>{crisis.owner}</span>
                        </span>
                        <span>
                          Stage: <span style={{ color: C.amber }}>{crisis.stage}</span>
                        </span>
                        <span>
                          Open: <span style={{ color: crisis.daysOpen >= 7 ? C.red : C.amber }}>{crisis.daysOpen}d</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Revenue at risk</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 20, fontWeight: 800, color: C.red }}>R{crisis.revenue.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                      Health: <span style={{ color: crisis.health < 50 ? C.red : C.amber }}>{crisis.health}/100</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ padding: 12, background: C.bg, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Last Action</div>
                    <div style={{ fontSize: 12 }}>{crisis.lastAction}</div>
                  </div>
                  <div style={{ padding: 12, background: C.surface, borderRadius: 8, border: `1px solid ${C.lime}22` }}>
                    <div style={{ fontSize: 10, color: C.lime, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Next Action</div>
                    <div style={{ fontSize: 12 }}>{crisis.nextAction}</div>
                  </div>
                </div>
              </div>

              {expanded === crisis.id ? (
                <div style={{ padding: "0 24px 24px" }}>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                    <div style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Crisis Timeline</div>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: 55, top: 0, bottom: 0, width: 1, background: C.border }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {crisis.timeline.map((event, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "55px 20px 1fr", gap: 12, alignItems: "flex-start" }}>
                            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted, textAlign: "right" }}>{event.date}</span>
                            <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.border, border: `2px solid ${severityColors[crisis.severity]}`, marginTop: 3, zIndex: 1, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 13 }}>{event.event}</div>
                              <div style={{ fontSize: 11, color: C.muted }}>{event.who}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                      <button style={{ background: C.lime, color: C.bg, border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Log Action</button>
                      <button style={{ background: C.border, border: "none", color: C.text, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Escalate</button>
                      <button style={{ background: C.surface, border: `1px solid ${C.lime}44`, color: C.lime, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Mark Resolved</button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "escalation chain" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {escalationChain.map((level, i) => (
                <div key={level.level}>
                  <div style={{ background: C.surface, border: `1px solid ${level.color}44`, borderRadius: 10, padding: 24 }}>
                    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${level.color}15`, border: `2px solid ${level.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: level.color, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
                        {level.level}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{level.role}</div>
                        <div style={{ fontSize: 13, color: level.color, marginBottom: 6 }}>{level.person}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>Trigger: {level.trigger}</div>
                      </div>
                      <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Contact Now</button>
                    </div>
                  </div>
                  {i < escalationChain.length - 1 ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
                      <div style={{ fontSize: 18, color: C.border }}>↓</div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Escalation Policy</div>
            {[
              { threshold: "3 days silent", action: "AM sends personal message", level: 1 },
              { threshold: "5 days silent", action: "AM logs alert + checks in", level: 1 },
              { threshold: "7 days silent", action: "Escalate to Operations Admin", level: 2 },
              { threshold: "Invoice 7+ days overdue", action: "Auto-escalate to Admin", level: 2 },
              { threshold: "Churn risk > 60%", action: "Super Admin intervention", level: 3 },
              { threshold: "Legal threat received", action: "Immediate Super Admin + legal review", level: 3 }
            ].map((policy) => (
              <div key={policy.threshold} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: escalationChain[policy.level - 1].color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.bg, fontWeight: 800, flexShrink: 0 }}>
                  {policy.level}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: C.amber, marginBottom: 2, fontFamily: "DM Mono, monospace" }}>{policy.threshold}</div>
                  <div style={{ fontSize: 12, color: C.text }}>{policy.action}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "recovery playbooks" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {recoveryPlaybooks.map((pb) => (
            <div key={pb.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: C.amber }}>{pb.name}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>Recovery Protocol</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pb.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.lime, fontFamily: "DM Mono, monospace", fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: 13, paddingTop: 3, lineHeight: 1.4 }}>{step}</div>
                  </div>
                ))}
              </div>
              <button style={{ marginTop: 20, width: "100%", background: `${C.amber}15`, border: `1px solid ${C.amber}44`, color: C.amber, padding: "10px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                Apply to Active Crisis →
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "resolved" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {resolved.map((r) => (
            <div key={r.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, display: "grid", gridTemplateColumns: "80px 80px 1fr 80px 120px 160px auto", alignItems: "center", gap: 20 }}>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{r.id}</span>
              <span style={{ fontSize: 10, color: severityColors[r.severity], background: `${severityColors[r.severity]}18`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace", textTransform: "uppercase" }}>{r.severity}</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{r.client}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{r.title}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Days</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700 }}>{r.daysToResolve}d</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Resolved</div>
                <div style={{ fontSize: 12 }}>{r.resolved}</div>
              </div>
              <div style={{ fontSize: 12, color: r.outcome.includes("churned") ? C.red : C.amber }}>{r.outcome}</div>
              <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>View Post-Mortem</button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
