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

type OnboardingStatus = "in-progress" | "overdue" | "complete" | "not-started";
const categories = ["Admin", "Setup", "Discovery", "Kick-off"] as const;
type Category = (typeof categories)[number];
type Tab = "active onboardings" | "template" | "analytics";

type ChecklistTask = {
  category: Category;
  task: string;
  done: boolean;
  doneDate?: string;
  owner: string;
  blocker?: string;
};

type Onboarding = {
  id: string;
  client: string;
  clientColor: string;
  avatar: string;
  am: string;
  tier: string;
  startedDate: string;
  targetDate: string;
  daysElapsed: number;
  targetDays: number;
  status: OnboardingStatus;
  contactName: string;
  contactEmail: string;
  mrr: number;
  checklist: ChecklistTask[];
};

const onboardings: Onboarding[] = [
  {
    id: "ONB-005",
    client: "Bloom Wellness",
    clientColor: C.blue,
    avatar: "BW",
    am: "Nomsa Dlamini",
    tier: "Core",
    startedDate: "Feb 18",
    targetDate: "Mar 4",
    daysElapsed: 5,
    targetDays: 14,
    status: "in-progress",
    contactName: "Priya Singh",
    contactEmail: "priya@bloomwellness.co.za",
    mrr: 28000,
    checklist: [
      { category: "Admin", task: "Contract signed", done: true, doneDate: "Feb 18", owner: "Nomsa" },
      { category: "Admin", task: "Invoice terms confirmed", done: true, doneDate: "Feb 18", owner: "Nomsa" },
      { category: "Admin", task: "NDA executed (if required)", done: false, owner: "Nomsa" },
      { category: "Setup", task: "Client portal account created", done: true, doneDate: "Feb 19", owner: "Leilani" },
      { category: "Setup", task: "Portal walkthrough call completed", done: false, owner: "Nomsa" },
      { category: "Setup", task: "Communication preferences set", done: true, doneDate: "Feb 19", owner: "Nomsa" },
      { category: "Discovery", task: "Brand brief completed", done: true, doneDate: "Feb 20", owner: "Renzo" },
      { category: "Discovery", task: "Stakeholder map completed", done: false, owner: "Nomsa" },
      { category: "Discovery", task: "Existing asset audit done", done: false, owner: "Renzo" },
      { category: "Kick-off", task: "Kick-off call scheduled", done: true, doneDate: "Feb 21", owner: "Leilani" },
      { category: "Kick-off", task: "Project timeline shared", done: false, owner: "Leilani" },
      { category: "Kick-off", task: "Key contacts introduced to team", done: false, owner: "Nomsa" },
    ],
  },
  {
    id: "ONB-004",
    client: "Craft & Co",
    clientColor: C.purple,
    avatar: "CC",
    am: "Nomsa Dlamini",
    tier: "Core",
    startedDate: "Feb 10",
    targetDate: "Feb 24",
    daysElapsed: 13,
    targetDays: 14,
    status: "overdue",
    contactName: "Marco Russo",
    contactEmail: "marco@craftandco.co.za",
    mrr: 18000,
    checklist: [
      { category: "Admin", task: "Contract signed", done: true, doneDate: "Feb 10", owner: "Nomsa" },
      { category: "Admin", task: "Invoice terms confirmed", done: true, doneDate: "Feb 10", owner: "Nomsa" },
      { category: "Admin", task: "NDA executed", done: true, doneDate: "Feb 11", owner: "Nomsa" },
      { category: "Setup", task: "Client portal account created", done: true, doneDate: "Feb 11", owner: "Leilani" },
      { category: "Setup", task: "Portal walkthrough call completed", done: true, doneDate: "Feb 13", owner: "Nomsa" },
      { category: "Setup", task: "Communication preferences set", done: true, doneDate: "Feb 13", owner: "Nomsa" },
      { category: "Discovery", task: "Brand brief completed", done: false, owner: "Renzo", blocker: "Client hasn't submitted brand assets" },
      { category: "Discovery", task: "Stakeholder map completed", done: false, owner: "Nomsa" },
      { category: "Discovery", task: "Existing asset audit done", done: false, owner: "Renzo" },
      { category: "Kick-off", task: "Kick-off call scheduled", done: true, doneDate: "Feb 14", owner: "Leilani" },
      { category: "Kick-off", task: "Project timeline shared", done: false, owner: "Leilani" },
      { category: "Kick-off", task: "Key contacts introduced to team", done: true, doneDate: "Feb 14", owner: "Nomsa" },
    ],
  },
  {
    id: "ONB-003",
    client: "Mira Health",
    clientColor: C.lime,
    avatar: "MH",
    am: "Nomsa Dlamini",
    tier: "Core",
    startedDate: "Jan 28",
    targetDate: "Feb 11",
    daysElapsed: 26,
    targetDays: 14,
    status: "complete",
    contactName: "Dr. Aisha Obi",
    contactEmail: "aisha@mirahealth.co.za",
    mrr: 21600,
    checklist: [
      { category: "Admin", task: "Contract signed", done: true, doneDate: "Jan 28", owner: "Nomsa" },
      { category: "Admin", task: "Invoice terms confirmed", done: true, doneDate: "Jan 28", owner: "Nomsa" },
      { category: "Admin", task: "NDA executed", done: true, doneDate: "Jan 29", owner: "Nomsa" },
      { category: "Setup", task: "Client portal account created", done: true, doneDate: "Jan 29", owner: "Leilani" },
      { category: "Setup", task: "Portal walkthrough call completed", done: true, doneDate: "Feb 1", owner: "Nomsa" },
      { category: "Setup", task: "Communication preferences set", done: true, doneDate: "Jan 30", owner: "Nomsa" },
      { category: "Discovery", task: "Brand brief completed", done: true, doneDate: "Feb 3", owner: "Renzo" },
      { category: "Discovery", task: "Stakeholder map completed", done: true, doneDate: "Feb 4", owner: "Nomsa" },
      { category: "Discovery", task: "Existing asset audit done", done: true, doneDate: "Feb 5", owner: "Renzo" },
      { category: "Kick-off", task: "Kick-off call scheduled", done: true, doneDate: "Feb 6", owner: "Leilani" },
      { category: "Kick-off", task: "Project timeline shared", done: true, doneDate: "Feb 7", owner: "Leilani" },
      { category: "Kick-off", task: "Key contacts introduced to team", done: true, doneDate: "Feb 6", owner: "Nomsa" },
    ],
  },
];

const categoryColors: Record<Category, string> = {
  Admin: C.lime,
  Setup: C.blue,
  Discovery: C.purple,
  "Kick-off": C.orange,
};

const statusConfig: Record<OnboardingStatus, { color: string; label: string }> = {
  "in-progress": { color: C.blue, label: "In Progress" },
  overdue: { color: C.red, label: "Overdue" },
  complete: { color: C.lime, label: "Complete" },
  "not-started": { color: C.muted, label: "Not Started" },
};

const tabs: Tab[] = ["active onboardings", "template", "analytics"];

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function ClientOnboardingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("active onboardings");
  const [expanded, setExpanded] = useState<string | null>("ONB-005");

  const active = onboardings.filter((o) => o.status !== "complete");
  const complete = onboardings.filter((o) => o.status === "complete");
  const overdue = onboardings.filter((o) => o.status === "overdue");
  const avgDays = Math.round(complete.reduce((s, o) => s + o.daysElapsed, 0) / (complete.length || 1));

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Client Onboarding</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>New client setup - Steps - Blockers - Completion tracking</div>
        </div>
        <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Start Onboarding</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Active Onboardings", value: active.length.toString(), color: C.blue, sub: `${overdue.length} overdue` },
          { label: "Completed (90d)", value: complete.length.toString(), color: C.lime, sub: `Avg ${avgDays} days` },
          { label: "Overdue", value: overdue.length.toString(), color: overdue.length > 0 ? C.red : C.lime, sub: "Past target date" },
          { label: "New MRR Onboarding", value: `R${(active.reduce((s, o) => s + o.mrr, 0) / 1000).toFixed(0)}k`, color: C.purple, sub: "Monthly value in pipeline" },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${s.label === "Overdue" && overdue.length > 0 ? `${C.red}55` : C.border}`, borderRadius: 10, padding: 20 }}>
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

      {activeTab === "active onboardings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {onboardings.map((onb) => {
            const done = onb.checklist.filter((t) => t.done).length;
            const total = onb.checklist.length;
            const pct = Math.round((done / total) * 100);
            const sc = statusConfig[onb.status];
            const isExp = expanded === onb.id;
            const blockers = onb.checklist.filter((t) => t.blocker);

            return (
              <div key={onb.id} style={{ background: C.surface, border: `1px solid ${onb.status === "overdue" ? `${C.red}55` : onb.status === "complete" ? `${C.lime}33` : C.border}`, borderRadius: 12 }}>
                <div style={{ padding: 24, cursor: "pointer" }} onClick={() => setExpanded(isExp ? null : onb.id)}>
                  <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 120px 100px 80px auto", alignItems: "center", gap: 20 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <Avatar initials={onb.avatar} color={onb.clientColor} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{onb.client}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {onb.tier} - {onb.am}
                        </div>
                        <div style={{ fontSize: 10, color: C.muted }}>Started {onb.startedDate}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: C.muted }}>
                          {done}/{total} tasks
                        </span>
                        <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: pct === 100 ? C.lime : pct >= 60 ? C.blue : C.amber }}>{pct}%</span>
                      </div>
                      <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? C.lime : pct >= 60 ? C.blue : C.amber, borderRadius: 4, transition: "width 0.8s" }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Target Date</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: onb.status === "overdue" ? C.red : C.muted }}>{onb.targetDate}</div>
                      <div style={{ fontSize: 10, color: onb.status === "overdue" ? C.red : C.muted }}>{onb.daysElapsed}d elapsed</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>MRR</div>
                      <div style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{(onb.mrr / 1000).toFixed(0)}k</div>
                    </div>
                    {blockers.length > 0 ? (
                      <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}44`, borderRadius: 6, padding: "4px 10px", fontSize: 11, color: C.red, textAlign: "center" }}>🚧 {blockers.length}</div>
                    ) : (
                      <div style={{ fontSize: 11, color: C.lime, textAlign: "center" }}>✓ Clear</div>
                    )}
                    <span style={{ fontSize: 10, color: sc.color, background: `${sc.color}15`, padding: "4px 10px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{sc.label}</span>
                  </div>
                </div>

                {isExp ? (
                  <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${C.border}` }}>
                    <div style={{ paddingTop: 20, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                      {categories.map((cat) => {
                        const catTasks = onb.checklist.filter((t) => t.category === cat);
                        const catDone = catTasks.filter((t) => t.done).length;
                        const catColor = categoryColors[cat];
                        return (
                          <div key={cat} style={{ padding: 16, background: C.bg, borderRadius: 8, border: `1px solid ${catColor}22` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: catColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>{cat}</span>
                              <span style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color: catDone === catTasks.length ? C.lime : C.muted }}>
                                {catDone}/{catTasks.length}
                              </span>
                            </div>
                            {catTasks.map((task, i) => (
                              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                                <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${task.done ? C.lime : task.blocker ? C.red : C.border}`, background: task.done ? C.lime : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                  {task.done ? <span style={{ fontSize: 8, color: C.bg, fontWeight: 800 }}>✓</span> : task.blocker ? <span style={{ fontSize: 8, color: C.red }}>!</span> : null}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 11, color: task.done ? C.muted : C.text, textDecoration: task.done ? "line-through" : "none" }}>{task.task}</div>
                                  {task.blocker ? <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>{task.blocker}</div> : null}
                                  {task.doneDate ? <div style={{ fontSize: 9, color: C.muted }}>{task.doneDate} - {task.owner}</div> : <div style={{ fontSize: 9, color: C.muted }}>{task.owner}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                      <div style={{ padding: 12, background: C.bg, borderRadius: 8, flex: 1 }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Contact</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{onb.contactName}</div>
                        <div style={{ fontSize: 11, color: C.blue }}>{onb.contactEmail}</div>
                      </div>
                      <button style={{ background: C.lime, color: C.bg, border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{onb.status === "complete" ? "View Summary" : "Update Progress"}</button>
                      {onb.status !== "complete" ? <button style={{ background: `${C.lime}15`, border: `1px solid ${C.lime}44`, color: C.lime, padding: "10px 20px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Mark Complete</button> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "template" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {categories.map((cat) => (
            <div key={cat} style={{ background: C.surface, border: `1px solid ${categoryColors[cat]}33`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: categoryColors[cat], marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>{cat}</div>
              {onboardings[0].checklist
                .filter((t) => t.category === cat)
                .map((task, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${C.border}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, flex: 1 }}>{task.task}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{task.owner}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {activeTab === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Onboarding Speed</div>
            {onboardings
              .filter((o) => o.status === "complete")
              .map((o) => (
                <div key={o.client} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <Avatar initials={o.avatar} color={o.clientColor} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12 }}>{o.client}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", color: o.daysElapsed <= o.targetDays ? C.lime : C.amber }}>{o.daysElapsed}d</span>
                    </div>
                    <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${Math.min((o.daysElapsed / 30) * 100, 100)}%`, background: o.daysElapsed <= o.targetDays ? C.lime : C.amber, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              ))}
            <div style={{ marginTop: 16, padding: 14, background: C.bg, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Average Onboarding Time</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 28, fontWeight: 800, color: C.lime }}>{avgDays} days</div>
              <div style={{ fontSize: 11, color: C.muted }}>Target: 14 days</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Most Common Blockers</div>
              {["Client delays submitting brand assets", "Portal walkthrough not yet scheduled", "Stakeholder map incomplete"].map((b, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.muted }}>
                  <span style={{ color: C.red }}>🚧</span> {b}
                </div>
              ))}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Category Completion Rates</div>
              {categories.map((cat) => {
                const allTasks = onboardings.flatMap((o) => o.checklist.filter((t) => t.category === cat));
                const doneTasks = allTasks.filter((t) => t.done);
                const rate = allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0;
                return (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, width: 80, color: categoryColors[cat] }}>{cat}</span>
                    <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${rate}%`, background: categoryColors[cat], borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: categoryColors[cat], width: 32, textAlign: "right" }}>{rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
