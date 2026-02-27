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

type OnboardingTask = {
  category: string;
  task: string;
  done: boolean;
  doneDate?: string;
  owner: string;
};

type OnboardingStatus = "upcoming" | "active" | "complete";

type Onboarding = {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  color: string;
  startDate: string;
  manager: string;
  buddyAssigned: string;
  status: OnboardingStatus;
  daysUntilStart: number | null;
  checklist: OnboardingTask[];
};

const onboardings: Onboarding[] = [
  {
    id: "SOB-003",
    name: "Zoe Hendricks",
    role: "Junior Copywriter",
    department: "Creative",
    avatar: "ZH",
    color: C.primary,
    startDate: "Mar 3 2026",
    manager: "Tapiwa Moyo",
    buddyAssigned: "Kira Bosman",
    status: "upcoming",
    daysUntilStart: 8,
    checklist: [
      { category: "Pre-Start Admin", task: "Offer letter signed and returned", done: true, doneDate: "Feb 18", owner: "Leilani" },
      { category: "Pre-Start Admin", task: "Employment contract sent", done: true, doneDate: "Feb 19", owner: "Leilani" },
      { category: "Pre-Start Admin", task: "Background check completed", done: false, owner: "Leilani" },
      { category: "Pre-Start Admin", task: "Bank details collected for payroll", done: true, doneDate: "Feb 20", owner: "Leilani" },
      { category: "Pre-Start Admin", task: "Tax number confirmed", done: false, owner: "Leilani" },
      { category: "Tech & Tools Setup", task: "Laptop ordered and configured", done: true, doneDate: "Feb 22", owner: "Sipho" },
      { category: "Tech & Tools Setup", task: "Email account created", done: false, owner: "Sipho" },
      { category: "Tech & Tools Setup", task: "Slack, Notion, Asana access granted", done: false, owner: "Sipho" },
      { category: "Tech & Tools Setup", task: "Adobe CC licence assigned", done: false, owner: "Sipho" },
      { category: "Day 1 Welcome", task: "Welcome email sent to new hire", done: false, owner: "Leilani" },
      { category: "Day 1 Welcome", task: "Desk and workspace ready", done: false, owner: "Leilani" },
      { category: "Day 1 Welcome", task: "Studio tour and team intro scheduled", done: false, owner: "Tapiwa" },
      { category: "Day 1 Welcome", task: "Welcome lunch booked", done: false, owner: "Nomsa" },
      { category: "Week 1 Training", task: "Maphari brand values walkthrough", done: false, owner: "Sipho" },
      { category: "Week 1 Training", task: "Client portfolio overview with manager", done: false, owner: "Tapiwa" },
      { category: "Week 1 Training", task: "Copy style guide review", done: false, owner: "Tapiwa" },
      { category: "Week 1 Training", task: "First project brief assigned", done: false, owner: "Tapiwa" },
      { category: "30-Day Check-In", task: "1:1 check-in with manager", done: false, owner: "Tapiwa" },
      { category: "30-Day Check-In", task: "Pulse survey sent to new hire", done: false, owner: "Leilani" },
      { category: "30-Day Check-In", task: "Initial performance notes documented", done: false, owner: "Tapiwa" }
    ]
  },
  {
    id: "SOB-002",
    name: "Tapiwa Moyo",
    role: "Copywriter",
    department: "Creative",
    avatar: "TM",
    color: C.blue,
    startDate: "Jan 15 2024",
    manager: "Renzo Fabbri",
    buddyAssigned: "Kira Bosman",
    status: "complete",
    daysUntilStart: null,
    checklist: Array.from({ length: 20 }, (_, i) => ({ task: `Task ${i + 1}`, done: true, doneDate: "Jan 2024", owner: "Leilani", category: "Admin" }))
  }
];

const categories = ["Pre-Start Admin", "Tech & Tools Setup", "Day 1 Welcome", "Week 1 Training", "30-Day Check-In"] as const;

const categoryColors: Record<(typeof categories)[number], string> = {
  "Pre-Start Admin": C.primary,
  "Tech & Tools Setup": C.blue,
  "Day 1 Welcome": C.primary,
  "Week 1 Training": C.orange,
  "30-Day Check-In": C.amber
};

const statusConfig: Record<OnboardingStatus, { color: string; label: string }> = {
  upcoming: { color: C.amber, label: "Upcoming" },
  active: { color: C.blue, label: "Active" },
  complete: { color: C.primary, label: "Complete" }
};

const templateChecklist: Record<(typeof categories)[number], string[]> = {
  "Pre-Start Admin": [
    "Offer letter signed and returned",
    "Employment contract sent",
    "Background check completed",
    "Bank details collected for payroll",
    "Tax number confirmed",
    "ID copy received"
  ],
  "Tech & Tools Setup": [
    "Laptop ordered and configured",
    "Email account created",
    "Slack, Notion, Asana access granted",
    "Adobe CC / Figma licence assigned",
    "VPN and security setup"
  ],
  "Day 1 Welcome": [
    "Welcome email sent to new hire",
    "Desk and workspace ready",
    "Studio tour and team intro scheduled",
    "Welcome lunch booked",
    "Buddy assigned and introduced"
  ],
  "Week 1 Training": [
    "Maphari brand values walkthrough",
    "Client portfolio overview with manager",
    "Department-specific tool training",
    "First project brief assigned",
    "Company processes & SOPs reviewed"
  ],
  "30-Day Check-In": [
    "1:1 check-in with manager",
    "Pulse survey sent to new hire",
    "Initial performance notes documented",
    "Probation goals set"
  ]
};

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

const tabs = ["active onboardings", "template", "completed"] as const;
type Tab = (typeof tabs)[number];

export function StaffOnboardingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("active onboardings");
  const [expanded, setExpanded] = useState<string>("SOB-003");

  const active = useMemo(() => onboardings.filter((o) => o.status !== "complete"), []);
  const complete = useMemo(() => onboardings.filter((o) => o.status === "complete"), []);
  const allTasks = active[0]?.checklist ?? [];
  const doneTasks = allTasks.filter((t) => t.done).length;
  const overallPct = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

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
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / STAFF</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Staff Onboarding</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>New hire checklists, pre-start tasks, week 1 welcome, and 30-day check-ins</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Start Onboarding</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Upcoming Starts", value: active.length.toString(), color: C.amber, sub: `${active[0]?.name ?? "-"} - ${active[0]?.startDate ?? "-"}` },
          { label: "SOB-003 Progress", value: `${overallPct}%`, color: overallPct >= 60 ? C.primary : C.amber, sub: `${doneTasks}/${allTasks.length} tasks done` },
          { label: "Days Until Start", value: active[0]?.daysUntilStart?.toString() ?? "-", color: (active[0]?.daysUntilStart ?? 99) <= 7 ? C.red : C.blue, sub: "Zoe Hendricks - Mar 3" },
          { label: "Completed Onboardings", value: complete.length.toString(), color: C.primary, sub: "This FY" }
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
        {activeTab === "active onboardings" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(active[0]?.daysUntilStart ?? 999) <= 10 ? (
              <div style={{ padding: 16, background: "#1a0f00", border: `1px solid ${C.amber}44`, display: "flex", gap: 16, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.amber }}>Action Required - Zoe starts in {active[0]?.daysUntilStart} days</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {allTasks.filter((t) => !t.done && t.category === "Pre-Start Admin").length} pre-start admin tasks still outstanding.
                  </div>
                </div>
              </div>
            ) : null}

            {active.map((onb) => {
              const done = onb.checklist.filter((t) => t.done).length;
              const total = onb.checklist.length;
              const pct = Math.round((done / total) * 100);
              const sc = statusConfig[onb.status];
              const isExp = expanded === onb.id;

              return (
                <div key={onb.id} style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div style={{ padding: 24, cursor: "pointer" }} onClick={() => setExpanded(isExp ? "" : onb.id)}>
                    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 120px 120px 100px auto", alignItems: "center", gap: 20 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <Avatar initials={onb.avatar} color={onb.color} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{onb.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{onb.role}</div>
                          <div style={{ fontSize: 10, color: C.muted }}>Starts {onb.startDate}</div>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: C.muted }}>{done}/{total} tasks</span>
                          <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: pct >= 70 ? C.primary : C.amber }}>{pct}%</span>
                        </div>
                        <div style={{ height: 8, background: C.border }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: pct >= 70 ? C.primary : C.amber }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Manager</div>
                        <div style={{ fontSize: 12 }}>{onb.manager.split(" ")[0]}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Buddy</div>
                        <div style={{ fontSize: 12 }}>{onb.buddyAssigned.split(" ")[0]}</div>
                      </div>
                      <span style={{ fontSize: 10, color: sc.color, background: `${sc.color}15`, padding: "4px 10px" }}>{sc.label}</span>
                      <span style={{ color: isExp ? C.primary : C.muted }}>{isExp ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isExp ? (
                    <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${C.border}` }}>
                      <div style={{ paddingTop: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                        {categories.slice(0, 3).map((cat) => {
                          const catTasks = onb.checklist.filter((t) => t.category === cat);
                          const catDone = catTasks.filter((t) => t.done).length;
                          const catColor = categoryColors[cat];
                          return (
                            <div key={cat} style={{ padding: 16, background: C.bg, border: `1px solid ${catColor}22` }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: catColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>{cat}</span>
                                <span style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color: catDone === catTasks.length ? C.primary : C.muted }}>{catDone}/{catTasks.length}</span>
                              </div>
                              {catTasks.map((task, i) => (
                                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                                  <div style={{ width: 14, height: 14, border: `2px solid ${task.done ? C.primary : C.border}`, background: task.done ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                    {task.done ? <span style={{ fontSize: 8, color: C.bg, fontWeight: 800 }}>✓</span> : null}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, color: task.done ? C.muted : C.text, textDecoration: task.done ? "line-through" : "none" }}>{task.task}</div>
                                    <div style={{ fontSize: 9, color: C.muted }}>{task.owner}{task.doneDate ? ` - Done ${task.doneDate}` : ""}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                        {categories.slice(3).map((cat) => {
                          const catTasks = onb.checklist.filter((t) => t.category === cat);
                          const catDone = catTasks.filter((t) => t.done).length;
                          const catColor = categoryColors[cat];
                          return (
                            <div key={cat} style={{ padding: 16, background: C.bg, border: `1px solid ${catColor}22` }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: catColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>{cat}</span>
                                <span style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color: catDone === catTasks.length ? C.primary : C.muted }}>{catDone}/{catTasks.length}</span>
                              </div>
                              {catTasks.map((task, i) => (
                                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                                  <div style={{ width: 14, height: 14, border: `2px solid ${task.done ? C.primary : C.border}`, background: task.done ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                    {task.done ? <span style={{ fontSize: 8, color: C.bg, fontWeight: 800 }}>✓</span> : null}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, color: task.done ? C.muted : C.text, textDecoration: task.done ? "line-through" : "none" }}>{task.task}</div>
                                    <div style={{ fontSize: 9, color: C.muted }}>{task.owner}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                        <button style={{ background: C.primary, color: C.bg, border: "none", padding: "10px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Update Tasks</button>
                        <button style={{ background: C.border, border: "none", color: C.text, padding: "10px 16px", fontSize: 12, cursor: "pointer" }}>View Timeline</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "template" ? (
          <div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Standard onboarding template applied to all new hires. Edit to customize per role or department.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {Object.entries(templateChecklist).map(([cat, tasks]) => {
                const color = categoryColors[cat as keyof typeof categoryColors];
                return (
                  <div key={cat} style={{ background: C.surface, border: `1px solid ${color}33`, padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{cat}</div>
                      <span style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color: C.muted }}>{tasks.length} tasks</span>
                    </div>
                    {tasks.map((task, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                        <div style={{ width: 14, height: 14, border: `2px solid ${C.border}`, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, flex: 1 }}>{task}</span>
                      </div>
                    ))}
                    <button style={{ marginTop: 12, background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "4px 12px", fontSize: 11, cursor: "pointer" }}>+ Add Task</button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeTab === "completed" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {complete.map((onb) => (
              <div key={onb.id} style={{ background: C.surface, border: `1px solid ${C.primary}22`, padding: 20, display: "grid", gridTemplateColumns: "220px 1fr 120px 120px auto", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Avatar initials={onb.avatar} color={onb.color} size={28} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{onb.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{onb.role}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>Started {onb.startDate}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Manager: {onb.manager.split(" ")[0]}</div>
                <span style={{ fontSize: 10, color: C.primary }}>100% Complete</span>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>View Archive</button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
