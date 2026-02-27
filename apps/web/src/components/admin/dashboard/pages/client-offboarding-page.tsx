"use client";

import { useMemo, useState } from "react";
import { AdminTabs } from "./shared";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  primary: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

type ReasonType = "natural" | "churn" | "paused";

type ChecklistItem = {
  id: number;
  category: "Financial" | "Delivery" | "Legal" | "Communication" | "System" | "BD";
  task: string;
  done: boolean;
  doneDate?: string;
};

type Offboarding = {
  id: string;
  client: string;
  clientColor: string;
  reason: string;
  reasonType: ReasonType;
  am: string;
  startedDate: string;
  targetDate: string;
  mrr: number;
  outstandingInvoice: number;
  status: "in-progress" | "complete";
  checklist: ChecklistItem[];
};

type PostMortem = {
  client: string;
  clientColor: string;
  type: "churn" | "natural";
  completedDate: string;
  rootCause: string;
  whatWentWell: string[];
  whatWentWrong: string[];
  preventionActions: string[];
  npsScore: number;
};

const offboardings: Offboarding[] = [
  {
    id: "OFB-003",
    client: "Studio Outpost",
    clientColor: C.red,
    reason: "Project complete - no retainer renewal",
    reasonType: "natural",
    am: "Nomsa Dlamini",
    startedDate: "Feb 10",
    targetDate: "Feb 28",
    mrr: 0,
    outstandingInvoice: 8400,
    status: "in-progress",
    checklist: [
      { id: 1, category: "Financial", task: "Send final invoice", done: true, doneDate: "Feb 11" },
      { id: 2, category: "Financial", task: "Confirm payment received", done: false },
      { id: 3, category: "Financial", task: "Issue credit note if applicable", done: true, doneDate: "Feb 11" },
      { id: 4, category: "Delivery", task: "Deliver all final files to client", done: true, doneDate: "Feb 12" },
      { id: 5, category: "Delivery", task: "Transfer project assets (source files, fonts, IP)", done: false },
      { id: 6, category: "Legal", task: "Confirm IP transfer signed off", done: false },
      { id: 7, category: "Legal", task: "Archive contract copy", done: true, doneDate: "Feb 13" },
      { id: 8, category: "Communication", task: "Send farewell email from AM", done: true, doneDate: "Feb 14" },
      { id: 9, category: "Communication", task: "Request exit feedback / NPS", done: false },
      { id: 10, category: "System", task: "Revoke client portal access", done: false },
      { id: 11, category: "System", task: "Archive project in system", done: false },
      { id: 12, category: "BD", task: "Log re-engagement date (6 months)", done: false }
    ]
  },
  {
    id: "OFB-002",
    client: "Helios Digital",
    clientColor: C.orange,
    reason: "Client churned - dissatisfied with deliverable quality",
    reasonType: "churn",
    am: "Renzo Fabbri",
    startedDate: "Jan 10",
    targetDate: "Jan 31",
    mrr: 16000,
    outstandingInvoice: 0,
    status: "complete",
    checklist: [
      { id: 1, category: "Financial", task: "Send final invoice", done: true, doneDate: "Jan 11" },
      { id: 2, category: "Financial", task: "Confirm payment received", done: true, doneDate: "Jan 20" },
      { id: 3, category: "Delivery", task: "Deliver all final files", done: true, doneDate: "Jan 12" },
      { id: 4, category: "Legal", task: "IP transfer confirmed", done: true, doneDate: "Jan 15" },
      { id: 5, category: "Communication", task: "Exit survey sent", done: true, doneDate: "Jan 14" },
      { id: 6, category: "System", task: "Portal access revoked", done: true, doneDate: "Jan 31" },
      { id: 7, category: "BD", task: "Post-mortem completed", done: true, doneDate: "Feb 2" }
    ]
  }
];

const postMortems: PostMortem[] = [
  {
    client: "Helios Digital",
    clientColor: C.orange,
    type: "churn",
    completedDate: "Feb 2",
    rootCause: "Deliverable quality did not meet client expectations on rounds 3+. No escalation was triggered until too late.",
    whatWentWell: ["Project kickoff smooth", "Communication was frequent", "Invoice process clean"],
    whatWentWrong: ["QA gate missed on Rd 2", "Client feedback loop too slow", "AM did not flag scope risk early enough"],
    preventionActions: [
      "Add QA escalation trigger at Rd 2",
      "AM to flag any 3rd round revision to admin within 24h",
      "Bi-weekly project health check for all projects"
    ],
    npsScore: 3
  }
];

const offboardingTemplate: Array<{ category: ChecklistItem["category"]; tasks: string[] }> = [
  { category: "Financial", tasks: ["Send final invoice", "Confirm payment received", "Issue credit note if applicable"] },
  { category: "Delivery", tasks: ["Deliver all final files to client", "Transfer source files, fonts, IP", "Confirm no outstanding deliverables"] },
  { category: "Legal", tasks: ["Confirm IP transfer signed off", "Archive contract copy", "Check for any NDA obligations"] },
  { category: "Communication", tasks: ["Send farewell email from AM", "Request exit feedback / NPS", "Admin personal note to client founder"] },
  { category: "System", tasks: ["Revoke client portal access", "Archive project in system", "Remove from active reporting"] },
  { category: "BD", tasks: ["Log churn reason", "Set re-engagement reminder (3-6 months)", "Document learnings for post-mortem"] }
];

const tabs = ["active offboardings", "post-mortems", "offboarding template", "churn analysis"] as const;
type Tab = (typeof tabs)[number];

const categoryColors: Record<ChecklistItem["category"], string> = {
  Financial: C.primary,
  Delivery: C.blue,
  Legal: C.primary,
  Communication: C.amber,
  System: C.orange,
  BD: C.muted
};

const reasonColors: Record<ReasonType, string> = {
  natural: C.blue,
  churn: C.red,
  paused: C.amber
};

export function ClientOffboardingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("active offboardings");
  const [expanded, setExpanded] = useState<string>("OFB-003");

  const active = useMemo(() => offboardings.filter((o) => o.status === "in-progress"), []);
  const complete = useMemo(() => offboardings.filter((o) => o.status === "complete"), []);

  return (
    <div
      style={{
        background: C.bg,
        height: "100%",
        fontFamily: "Syne, sans-serif",
        color: C.text,
        padding: 0,
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "auto auto auto 1fr",
        minHeight: 0
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / OPERATIONS</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Client Offboarding</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Structured exits, file handover, IP transfer, and post-mortems</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Start Offboarding</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Active Offboardings", value: active.length.toString(), color: C.amber, sub: "In progress" },
          { label: "Completed (90d)", value: complete.length.toString(), color: C.muted, sub: "Archived" },
          { label: "Outstanding Invoices", value: `R${offboardings.reduce((s, o) => s + o.outstandingInvoice, 0).toLocaleString()}`, color: offboardings.some((o) => o.outstandingInvoice > 0) ? C.red : C.primary, sub: "Across active offboardings" },
          { label: "MRR Lost (90d)", value: `R${offboardings.filter((o) => o.status === "complete").reduce((s, o) => s + o.mrr, 0).toLocaleString()}`, color: C.red, sub: "From churned clients" }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
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
        primaryColor={C.primary}
        mutedColor={C.muted}
        panelColor={C.surface}
        borderColor={C.border}
      />

      <div style={{ overflow: "auto", minHeight: 0 }}>
        {activeTab === "active offboardings" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {offboardings.map((ofb) => {
              const done = ofb.checklist.filter((t) => t.done).length;
              const total = ofb.checklist.length;
              const pct = Math.round((done / total) * 100);
              const isExpanded = expanded === ofb.id;
              const byCategory = offboardingTemplate
                .map((c) => ({ ...c, tasks: ofb.checklist.filter((t) => t.category === c.category) }))
                .filter((c) => c.tasks.length > 0);

              return (
                <div key={ofb.id} style={{ background: C.surface, border: `1px solid ${ofb.status === "complete" ? C.primary + "33" : C.border}` }}>
                  <div style={{ padding: 24, cursor: "pointer" }} onClick={() => setExpanded(isExpanded ? "" : ofb.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 4, height: 52, background: ofb.status === "complete" ? C.primary : reasonColors[ofb.reasonType], flexShrink: 0 }} />
                        <div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{ofb.id}</span>
                            <span style={{ fontSize: 10, color: reasonColors[ofb.reasonType], background: `${reasonColors[ofb.reasonType]}15`, padding: "2px 8px", fontFamily: "DM Mono, monospace" }}>{ofb.reasonType}</span>
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: ofb.clientColor, marginBottom: 4 }}>{ofb.client}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>{ofb.reason}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>AM: {ofb.am} · Target: {ofb.targetDate}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: pct === 100 ? C.primary : pct >= 60 ? C.amber : C.red, fontFamily: "DM Mono, monospace" }}>{pct}%</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{done}/{total} tasks</div>
                        {ofb.outstandingInvoice > 0 ? <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>R{ofb.outstandingInvoice.toLocaleString()} outstanding</div> : null}
                      </div>
                    </div>
                    <div style={{ height: 8, background: C.border }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? C.primary : pct >= 60 ? C.amber : C.red }} />
                    </div>
                  </div>

                  {isExpanded ? (
                    <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${C.border}` }}>
                      <div style={{ paddingTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                        {byCategory.map((cat) => (
                          <div key={cat.category} style={{ padding: 16, background: C.bg }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: categoryColors[cat.category], textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{cat.category}</div>
                            {cat.tasks.map((task) => (
                              <div key={task.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                                <div style={{ width: 14, height: 14, border: `2px solid ${task.done ? C.primary : C.border}`, background: task.done ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                                  {task.done ? <span style={{ fontSize: 8, color: C.bg, fontWeight: 800 }}>✓</span> : null}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, color: task.done ? C.muted : C.text, textDecoration: task.done ? "line-through" : "none" }}>{task.task}</div>
                                  {task.doneDate ? <div style={{ fontSize: 9, color: C.muted }}>{task.doneDate}</div> : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      {ofb.status === "in-progress" ? (
                        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                          <button style={{ background: C.primary, color: C.bg, border: "none", padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Mark Complete</button>
                          <button style={{ background: C.border, border: "none", color: C.text, padding: "8px 16px", fontSize: 12, cursor: "pointer" }}>Update Progress</button>
                          <button style={{ background: `${C.primary}15`, border: `1px solid ${C.primary}44`, color: C.primary, padding: "8px 16px", fontSize: 12, cursor: "pointer" }}>Start Post-Mortem</button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "post-mortems" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {postMortems.map((pm) => (
              <div key={pm.client} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: pm.clientColor, marginBottom: 4 }}>{pm.client}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Post-mortem completed {pm.completedDate}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Exit NPS</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 28, fontWeight: 800, color: pm.npsScore >= 8 ? C.primary : pm.npsScore >= 5 ? C.amber : C.red }}>{pm.npsScore}/10</div>
                  </div>
                </div>
                <div style={{ padding: 16, background: C.bg, marginBottom: 16, borderLeft: `3px solid ${C.red}` }}>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Root Cause</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>{pm.rootCause}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div style={{ padding: 16, background: "#0a1a0a" }}>
                    <div style={{ fontSize: 11, color: C.primary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>What Went Well</div>
                    {pm.whatWentWell.map((w) => <div key={w} style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>+ {w}</div>)}
                  </div>
                  <div style={{ padding: 16, background: "#1a0a0a" }}>
                    <div style={{ fontSize: 11, color: C.red, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>What Went Wrong</div>
                    {pm.whatWentWrong.map((w) => <div key={w} style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>- {w}</div>)}
                  </div>
                  <div style={{ padding: 16, background: "#0a0f1a" }}>
                    <div style={{ fontSize: 11, color: C.blue, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Prevention Actions</div>
                    {pm.preventionActions.map((a) => <div key={a} style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>&gt; {a}</div>)}
                  </div>
                </div>
              </div>
            ))}
            <button style={{ background: C.surface, border: `1px dashed ${C.border}`, padding: 20, color: C.muted, fontSize: 13, cursor: "pointer", textAlign: "center" }}>+ Create Post-Mortem</button>
          </div>
        ) : null}

        {activeTab === "offboarding template" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {offboardingTemplate.map((cat) => (
              <div key={cat.category} style={{ background: C.surface, border: `1px solid ${categoryColors[cat.category]}33`, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: categoryColors[cat.category], marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>{cat.category}</div>
                {cat.tasks.map((task, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                    <div style={{ width: 14, height: 14, border: `2px solid ${C.border}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 12 }}>{task}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "churn analysis" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Offboarding Reasons</div>
              {[
                { reason: "Project complete - no renewal", count: 1, color: C.blue },
                { reason: "Quality dissatisfaction", count: 1, color: C.red },
                { reason: "Budget constraints", count: 0, color: C.amber },
                { reason: "Went in-house", count: 0, color: C.muted }
              ].map((r) => (
                <div key={r.reason} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, flex: 1 }}>{r.reason}</span>
                  <div style={{ width: 80, height: 8, background: C.border }}>
                    <div style={{ height: "100%", width: `${(r.count / offboardings.length) * 100}%`, background: r.color }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: r.color, fontWeight: 700, width: 16 }}>{r.count}</span>
                </div>
              ))}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Re-Engagement Pipeline</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>
                Clients who leave on good terms are logged for re-engagement at 3-6 months. Churned clients are logged with context for learnings only.
              </div>
              {[
                { client: "Studio Outpost", date: "Aug 2026", type: "Re-engage", color: C.primary },
                { client: "Helios Digital", date: "n/a", type: "Learnings only", color: C.muted }
              ].map((re) => (
                <div key={re.client} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{re.client}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{re.type}</div>
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: re.color, fontSize: 12 }}>{re.date}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
