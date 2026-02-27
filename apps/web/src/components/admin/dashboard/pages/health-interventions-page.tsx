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
  text: "#e8e8f0",
};

type TriggerType = "health-drop" | "invoice-overdue" | "nps-drop" | "quality-complaint" | "silent-client";
type InterventionStatus = "open" | "resolved" | "churned";
type Tab = "all interventions" | "open" | "resolved" | "patterns";

type InterventionAction = {
  date: string;
  action: string;
  outcome: string;
  by: string;
};

type Intervention = {
  id: string;
  client: string;
  clientColor: string;
  trigger: string;
  triggerType: TriggerType;
  adminWhoActed: string;
  date: string;
  status: InterventionStatus;
  healthBefore: number;
  healthAfter: number | null;
  churnRiskBefore: number;
  churnRiskAfter: number | null;
  actions: InterventionAction[];
  nextStep: string | null;
  mrrAtRisk: number;
  notes: string;
};

const interventions: Intervention[] = [
  {
    id: "INT-018",
    client: "Kestrel Capital",
    clientColor: C.purple,
    trigger: "Health score dropped from 72 -> 44 in 14 days",
    triggerType: "health-drop",
    adminWhoActed: "Sipho Nkosi",
    date: "Feb 22",
    status: "open",
    healthBefore: 72,
    healthAfter: null,
    churnRiskBefore: 38,
    churnRiskAfter: null,
    actions: [
      { date: "Feb 22", action: "Called client CEO directly", outcome: "Acknowledged invoice dispute. Agreed to 72h resolution window.", by: "Sipho Nkosi" },
      { date: "Feb 22", action: "Paused non-critical AM tasks to focus on Kestrel", outcome: "Nomsa cleared schedule for Monday follow-up.", by: "Sipho Nkosi" },
    ],
    nextStep: "Follow-up call Feb 24 @ 10:00 to confirm invoice resolution",
    mrrAtRisk: 21000,
    notes: "Client may be experiencing internal budget pressure. Keep tone supportive, not transactional.",
  },
  {
    id: "INT-017",
    client: "Dune Collective",
    clientColor: C.amber,
    trigger: "Invoice overdue 14+ days + communication breakdown",
    triggerType: "invoice-overdue",
    adminWhoActed: "Sipho Nkosi",
    date: "Feb 19",
    status: "open",
    healthBefore: 54,
    healthAfter: null,
    churnRiskBefore: 52,
    churnRiskAfter: null,
    actions: [
      { date: "Feb 19", action: "Reviewed full project history with Renzo", outcome: "Identified scope creep as root cause of tension.", by: "Sipho Nkosi" },
      { date: "Feb 20", action: "Reached out to Dune Collective via personal email", outcome: "No response yet.", by: "Sipho Nkosi" },
      { date: "Feb 21", action: "Sent formal scope change documentation", outcome: "Awaiting client signature.", by: "Renzo Fabbri" },
    ],
    nextStep: "Chase scope doc signature by Feb 25. If no response, consider escalation to legal review.",
    mrrAtRisk: 16000,
    notes: "Dune's founder is hard to reach. Consider going through their ops manager instead.",
  },
  {
    id: "INT-016",
    client: "Mira Health",
    clientColor: C.blue,
    trigger: "NPS dropped from 8 -> 6 in two consecutive surveys",
    triggerType: "nps-drop",
    adminWhoActed: "Leilani Fotu",
    date: "Jan 15",
    status: "resolved",
    healthBefore: 61,
    healthAfter: 74,
    churnRiskBefore: 44,
    churnRiskAfter: 22,
    actions: [
      { date: "Jan 15", action: "Reviewed all client comms from past 6 weeks", outcome: "Identified response time delays as key frustration.", by: "Leilani Fotu" },
      { date: "Jan 16", action: "Restructured project workflow to add weekly status email", outcome: "Implemented immediately.", by: "Leilani Fotu" },
      { date: "Jan 20", action: "Nomsa scheduled bi-weekly check-ins with client", outcome: "First check-in positive - client felt heard.", by: "Nomsa Dlamini" },
      { date: "Feb 5", action: "NPS re-survey sent", outcome: "Score improved to 8. Client praised increased communication.", by: "Nomsa Dlamini" },
    ],
    nextStep: null,
    mrrAtRisk: 21600,
    notes: "This intervention worked. Pattern: structured communication frequency was the fix.",
  },
  {
    id: "INT-015",
    client: "Helios Digital",
    clientColor: C.orange,
    trigger: "Client requested project pause - quality concerns",
    triggerType: "quality-complaint",
    adminWhoActed: "Sipho Nkosi",
    date: "Jan 5",
    status: "churned",
    healthBefore: 41,
    healthAfter: 0,
    churnRiskBefore: 68,
    churnRiskAfter: 100,
    actions: [
      { date: "Jan 5", action: "Admin called client founder directly", outcome: "Client expressed deep frustration with revision quality.", by: "Sipho Nkosi" },
      { date: "Jan 8", action: "Offered free revision round + discounted next month", outcome: "Client declined - decided to exit.", by: "Sipho Nkosi" },
      { date: "Jan 10", action: "Initiated structured offboarding", outcome: "Exit completed Jan 31. R16k MRR lost.", by: "Leilani Fotu" },
    ],
    nextStep: null,
    mrrAtRisk: 16000,
    notes: "Post-mortem completed. Main lesson: QA gate at round 2 should have triggered admin review.",
  },
];

const triggerTypeConfig: Record<TriggerType, { color: string; label: string; icon: string }> = {
  "health-drop": { color: C.red, label: "Health Drop", icon: "📉" },
  "invoice-overdue": { color: C.amber, label: "Invoice Overdue", icon: "💸" },
  "nps-drop": { color: C.orange, label: "NPS Drop", icon: "📊" },
  "quality-complaint": { color: C.purple, label: "Quality Complaint", icon: "⚠" },
  "silent-client": { color: C.red, label: "Silent Client", icon: "🔇" },
};

const statusConfig: Record<InterventionStatus, { color: string; label: string }> = {
  open: { color: C.red, label: "Open" },
  resolved: { color: C.lime, label: "Resolved" },
  churned: { color: C.muted, label: "Churned" },
};

const tabs: Tab[] = ["all interventions", "open", "resolved", "patterns"];

export function HealthInterventionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all interventions");
  const [expanded, setExpanded] = useState<string | null>("INT-018");

  const open = interventions.filter((i) => i.status === "open");
  const resolved = interventions.filter((i) => i.status === "resolved");
  const churned = interventions.filter((i) => i.status === "churned");
  const mrrAtRisk = open.reduce((s, i) => s + i.mrrAtRisk, 0);

  const displayList = activeTab === "open" ? open : activeTab === "resolved" ? resolved : interventions;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.red, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Health Interventions</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Every time admin stepped in - Why - What happened - Outcome</div>
        </div>
        <button style={{ background: C.red, color: "#fff", padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Log Intervention</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Open Interventions", value: open.length.toString(), color: C.red, sub: "Active cases" },
          { label: "MRR at Risk", value: `R${(mrrAtRisk / 1000).toFixed(0)}k`, color: C.red, sub: "Across open cases" },
          { label: "Resolved (90d)", value: resolved.length.toString(), color: C.lime, sub: "Health recovered" },
          { label: "Churned Despite Intervention", value: churned.length.toString(), color: C.muted, sub: "Couldn't save" },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${s.label === "Open Interventions" ? `${C.red}55` : C.border}`, borderRadius: 10, padding: 20 }}>
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

      {(activeTab === "all interventions" || activeTab === "open" || activeTab === "resolved") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {displayList.map((intv) => {
            const sc = statusConfig[intv.status];
            const tc = triggerTypeConfig[intv.triggerType];
            const isExp = expanded === intv.id;
            return (
              <div key={intv.id} style={{ background: C.surface, border: `2px solid ${intv.status === "open" ? `${tc.color}55` : intv.status === "resolved" ? `${C.lime}33` : C.border}`, borderRadius: 12 }}>
                <div style={{ padding: 24, cursor: "pointer" }} onClick={() => setExpanded(isExp ? null : intv.id)}>
                  <div style={{ display: "grid", gridTemplateColumns: "60px 180px 1fr 120px 100px 100px 80px", alignItems: "center", gap: 16 }}>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{intv.id}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: intv.clientColor, fontSize: 15 }}>{intv.client}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>by {intv.adminWhoActed} - {intv.date}</div>
                    </div>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 14 }}>{tc.icon}</span>
                        <span style={{ fontSize: 10, color: tc.color, fontFamily: "DM Mono, monospace", textTransform: "uppercase" }}>{tc.label}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{intv.trigger}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Health: before -&gt; after</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 13 }}>
                        <span style={{ color: intv.healthBefore < 60 ? C.red : C.amber }}>{intv.healthBefore}</span>
                        <span style={{ color: C.muted }}> -&gt; </span>
                        <span style={{ color: intv.healthAfter ? (intv.healthAfter >= 70 ? C.lime : C.amber) : C.muted }}>{intv.healthAfter ?? "-"}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>MRR at Risk</div>
                      <div style={{ fontFamily: "DM Mono, monospace", color: C.red, fontWeight: 700 }}>R{(intv.mrrAtRisk / 1000).toFixed(0)}k</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Actions</div>
                      <div style={{ fontFamily: "DM Mono, monospace", color: C.blue, fontWeight: 700 }}>{intv.actions.length}</div>
                    </div>
                    <span style={{ fontSize: 10, color: sc.color, background: `${sc.color}15`, padding: "4px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace", textAlign: "center" }}>{sc.label}</span>
                  </div>
                </div>

                {isExp && (
                  <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${C.border}` }}>
                    <div style={{ paddingTop: 20, display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Action Timeline</div>
                        <div style={{ position: "relative" }}>
                          <div style={{ position: "absolute", left: 55, top: 0, bottom: 0, width: 1, background: C.border }} />
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {intv.actions.map((a, i) => (
                              <div key={i} style={{ display: "grid", gridTemplateColumns: "55px 20px 1fr", gap: 12, alignItems: "flex-start" }}>
                                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, textAlign: "right", paddingTop: 2 }}>{a.date}</span>
                                <div style={{ width: 12, height: 12, borderRadius: "50%", background: tc.color, border: `2px solid ${C.bg}`, marginTop: 2, zIndex: 1, flexShrink: 0 }} />
                                <div style={{ padding: 12, background: C.bg, borderRadius: 8, borderLeft: `3px solid ${tc.color}44` }}>
                                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{a.action}</div>
                                  <div style={{ fontSize: 11, color: C.lime, marginBottom: 4 }}>-&gt; {a.outcome}</div>
                                  <div style={{ fontSize: 10, color: C.muted }}>{a.by}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {intv.nextStep && (
                          <div style={{ marginTop: 16, padding: 14, background: C.surface, border: `1px solid ${C.lime}22`, borderRadius: 8 }}>
                            <div style={{ fontSize: 10, color: C.lime, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Next Step</div>
                            <div style={{ fontSize: 13 }}>{intv.nextStep}</div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {intv.notes && (
                          <div style={{ padding: 16, background: C.surface, borderRadius: 8, border: `1px solid ${C.blue}22` }}>
                            <div style={{ fontSize: 10, color: C.blue, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Private Admin Note</div>
                            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{intv.notes}</div>
                          </div>
                        )}
                        <div style={{ padding: 16, background: C.bg, borderRadius: 8 }}>
                          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Health Impact</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {[
                              { label: "Health Before", value: intv.healthBefore, color: intv.healthBefore < 60 ? C.red : C.amber },
                              { label: "Health After", value: intv.healthAfter ?? "-", color: intv.healthAfter ? (intv.healthAfter >= 70 ? C.lime : C.amber) : C.muted },
                              { label: "Churn Risk Before", value: `${intv.churnRiskBefore}%`, color: intv.churnRiskBefore > 50 ? C.red : C.amber },
                              { label: "Churn Risk After", value: intv.churnRiskAfter !== null ? `${intv.churnRiskAfter}%` : "-", color: intv.churnRiskAfter !== null ? (intv.churnRiskAfter < 30 ? C.lime : C.amber) : C.muted },
                            ].map((m) => (
                              <div key={m.label} style={{ padding: 10, background: C.surface, borderRadius: 6, textAlign: "center" }}>
                                <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 18, color: m.color }}>{m.value}</div>
                                <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{m.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {intv.status === "open" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ flex: 1, background: C.lime, color: C.bg, border: "none", padding: "10px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Mark Resolved</button>
                            <button style={{ flex: 1, background: C.border, border: "none", color: C.text, padding: "10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Log Action</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "patterns" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Most Common Triggers</div>
            {(Object.entries(triggerTypeConfig) as Array<[TriggerType, { color: string; label: string; icon: string }]>).map(([key, cfg]) => {
              const count = interventions.filter((i) => i.triggerType === key).length;
              if (count === 0) return null;
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 16, width: 24 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 12, flex: 1, color: cfg.color }}>{cfg.label}</span>
                  <div style={{ width: 80, height: 8, background: C.border, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${(count / interventions.length) * 100}%`, background: cfg.color, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: cfg.color, fontWeight: 700, width: 16 }}>{count}</span>
                </div>
              );
            })}
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Intervention Outcomes</div>
            {[
              { label: "Resolved - health recovered", count: resolved.length, color: C.lime },
              { label: "Open - still in progress", count: open.length, color: C.amber },
              { label: "Churned despite intervention", count: churned.length, color: C.red },
            ].map((o) => (
              <div key={o.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 12, flex: 1, color: o.color }}>{o.label}</span>
                <div style={{ width: 80, height: 8, background: C.border, borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${(o.count / interventions.length) * 100}%`, background: o.color, borderRadius: 4 }} />
                </div>
                <span style={{ fontFamily: "DM Mono, monospace", color: o.color, fontWeight: 700, width: 16 }}>{o.count}</span>
              </div>
            ))}
            <div style={{ marginTop: 20, padding: 16, background: C.surface, borderRadius: 8, border: `1px solid ${C.lime}22` }}>
              <div style={{ fontSize: 11, color: C.lime, marginBottom: 4 }}>Key Learning</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
                Interventions triggered by NPS drops have the highest recovery rate. Invoice and quality issues are harder to recover - earlier detection is critical.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
