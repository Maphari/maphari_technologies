"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type OnboardingStatus = "complete" | "in_progress" | "stuck";
type StepCategory = "Staff" | "Client" | "Both";
type MilestoneStatus = "awaiting_approval" | "in_progress" | "not_started" | "overdue" | "approved";

type OnboardingStep = {
  id: string;
  label: string;
  category: StepCategory;
  done: boolean;
  doneAt: string | null;
  scheduledFor?: string;
  blocked?: boolean;
  overdue?: boolean;
  overdueDays?: number;
};

type OnboardingClient = {
  id: number;
  client: string;
  avatar: string;
  contact: string;
  project: string;
  startDate: string;
  status: OnboardingStatus;
  completedAt: string | null;
  daysToComplete: number | null;
  steps: OnboardingStep[];
  notes: string;
  health: number;
};

const onboardingClients: OnboardingClient[] = [
  {
    id: 1,
    client: "Volta Studios",
    avatar: "VS",
    contact: "Lena Muller",
    project: "Brand Identity System",
    startDate: "Jan 6, 2026",
    status: "complete",
    completedAt: "Jan 10, 2026",
    daysToComplete: 4,
    steps: [
      { id: "welcome", label: "Welcome email sent", category: "Staff", done: true, doneAt: "Jan 6" },
      { id: "brief", label: "Project brief shared", category: "Staff", done: true, doneAt: "Jan 6" },
      { id: "contract", label: "Contract signed", category: "Client", done: true, doneAt: "Jan 7" },
      { id: "deposit", label: "Deposit invoice paid", category: "Client", done: true, doneAt: "Jan 8" },
      { id: "portal", label: "Client portal activated", category: "Staff", done: true, doneAt: "Jan 8" },
      { id: "kickoff", label: "Kickoff call completed", category: "Both", done: true, doneAt: "Jan 9" },
      { id: "assets", label: "Brand assets received from client", category: "Client", done: true, doneAt: "Jan 10" },
      { id: "access", label: "Drive & tools access granted", category: "Staff", done: true, doneAt: "Jan 10" }
    ],
    notes: "Smooth onboarding - Lena was responsive throughout. Assets were delivered ahead of schedule.",
    health: 95
  },
  {
    id: 2,
    client: "Sunfield Ventures",
    avatar: "SV",
    contact: "Tariq Osei",
    project: "Go-to-Market Strategy",
    startDate: "Feb 17, 2026",
    status: "in_progress",
    completedAt: null,
    daysToComplete: null,
    steps: [
      { id: "welcome", label: "Welcome email sent", category: "Staff", done: true, doneAt: "Feb 17" },
      { id: "brief", label: "Project brief shared", category: "Staff", done: true, doneAt: "Feb 17" },
      { id: "contract", label: "Contract signed", category: "Client", done: true, doneAt: "Feb 18" },
      { id: "deposit", label: "Deposit invoice paid", category: "Client", done: true, doneAt: "Feb 19" },
      { id: "portal", label: "Client portal activated", category: "Staff", done: true, doneAt: "Feb 20" },
      { id: "kickoff", label: "Kickoff call completed", category: "Both", done: false, doneAt: null, scheduledFor: "Feb 24" },
      { id: "assets", label: "Brand assets received from client", category: "Client", done: false, doneAt: null },
      { id: "access", label: "Drive & tools access granted", category: "Staff", done: false, doneAt: null }
    ],
    notes: "Kickoff call scheduled for Feb 24. Assets request sent but no upload yet.",
    health: 72
  },
  {
    id: 3,
    client: "Meridian Labs",
    avatar: "ML",
    contact: "Priya Shenoy",
    project: "Product UX Design",
    startDate: "Feb 10, 2026",
    status: "stuck",
    completedAt: null,
    daysToComplete: null,
    steps: [
      { id: "welcome", label: "Welcome email sent", category: "Staff", done: true, doneAt: "Feb 10" },
      { id: "brief", label: "Project brief shared", category: "Staff", done: true, doneAt: "Feb 10" },
      { id: "contract", label: "Contract signed", category: "Client", done: true, doneAt: "Feb 11" },
      { id: "deposit", label: "Deposit invoice paid", category: "Client", done: false, doneAt: null, overdue: true, overdueDays: 5 },
      { id: "portal", label: "Client portal activated", category: "Staff", done: false, doneAt: null, blocked: true },
      { id: "kickoff", label: "Kickoff call completed", category: "Both", done: false, doneAt: null, blocked: true },
      { id: "assets", label: "Brand assets received from client", category: "Client", done: false, doneAt: null, blocked: true },
      { id: "access", label: "Drive & tools access granted", category: "Staff", done: false, doneAt: null, blocked: true }
    ],
    notes:
      "Stuck on deposit payment - 5 days overdue. Portal cannot be activated until payment clears. Follow up with Priya or escalate to account manager.",
    health: 38
  },
  {
    id: 4,
    client: "Hawthorn & Co",
    avatar: "HC",
    contact: "Sophie van der Berg",
    project: "Annual Brand Refresh",
    startDate: "Feb 20, 2026",
    status: "in_progress",
    completedAt: null,
    daysToComplete: null,
    steps: [
      { id: "welcome", label: "Welcome email sent", category: "Staff", done: true, doneAt: "Feb 20" },
      { id: "brief", label: "Project brief shared", category: "Staff", done: true, doneAt: "Feb 20" },
      { id: "contract", label: "Contract signed", category: "Client", done: false, doneAt: null, scheduledFor: "Feb 23" },
      { id: "deposit", label: "Deposit invoice paid", category: "Client", done: false, doneAt: null },
      { id: "portal", label: "Client portal activated", category: "Staff", done: false, doneAt: null },
      { id: "kickoff", label: "Kickoff call completed", category: "Both", done: false, doneAt: null },
      { id: "assets", label: "Brand assets received from client", category: "Client", done: false, doneAt: null },
      { id: "access", label: "Drive & tools access granted", category: "Staff", done: false, doneAt: null }
    ],
    notes: "Very early stage - started 3 days ago. Contract sent, awaiting signature by Feb 23.",
    health: 55
  }
];

const statusConfig: Record<OnboardingStatus, { label: string; color: string; bg: string }> = {
  complete: { label: "Complete", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 8%, transparent)" },
  in_progress: { label: "In Progress", color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
  stuck: { label: "Stuck", color: "#ff4444", bg: "rgba(255,68,68,0.08)" }
};

const categoryConfig: Record<StepCategory, { color: string; label: string }> = {
  Staff: { color: "#60a5fa", label: "Staff action" },
  Client: { color: "var(--accent)", label: "Client action" },
  Both: { color: "#a78bfa", label: "Joint" }
};

const milestoneStatusConfig: Record<MilestoneStatus, { label: string; color: string }> = {
  awaiting_approval: { label: "Awaiting Approval", color: "#f5c518" },
  in_progress: { label: "In Progress", color: "#60a5fa" },
  not_started: { label: "Not Started", color: "var(--muted2)" },
  overdue: { label: "Overdue", color: "#ff4444" },
  approved: { label: "Approved", color: "var(--accent)" }
};

function ProgressRing({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={color} fontFamily="'DM Mono', monospace" fontSize="11" fontWeight="500">
        {pct}%
      </text>
    </svg>
  );
}

export function ClientOnboardingPage({ isActive }: { isActive: boolean }) {
  const [selected, setSelected] = useState(onboardingClients[0].id);
  const [filter, setFilter] = useState<"all" | OnboardingStatus>("all");

  const filtered = useMemo(
    () => onboardingClients.filter((client) => (filter === "all" ? true : client.status === filter)),
    [filter]
  );
  const current = onboardingClients.find((client) => client.id === selected) ?? onboardingClients[0];

  const doneSteps = current.steps.filter((step) => step.done).length;
  const totalSteps = current.steps.length;
  const pct = Math.round((doneSteps / totalSteps) * 100);
  const sCfg = statusConfig[current.status];

  const staffSteps = current.steps.filter((step) => step.category === "Staff" || step.category === "Both");
  const clientSteps = current.steps.filter((step) => step.category === "Client" || step.category === "Both");
  const staffDone = staffSteps.filter((step) => step.done).length;
  const clientDone = clientSteps.filter((step) => step.done).length;

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-client-onboarding">
      <style>{`
        .onb-client-item { transition: all 0.12s ease; cursor: pointer; }
        .onb-client-item:hover { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; background: color-mix(in srgb, var(--accent) 3%, transparent) !important; }
        .onb-filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .onb-step-row { transition: background 0.1s ease; }
        .onb-step-row:hover { background: rgba(255,255,255,0.02) !important; }
        .onb-action-btn { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .onb-action-btn:hover { opacity: 0.75; }
        .onb-step-connector { width: 1px; height: 20px; margin-left: 8px; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Client Management
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Client Onboarding
            </h1>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Active", value: onboardingClients.filter((client) => client.status === "in_progress").length, color: "#60a5fa" },
              { label: "Stuck", value: onboardingClients.filter((client) => client.status === "stuck").length, color: "#ff4444" },
              { label: "Complete", value: onboardingClients.filter((client) => client.status === "complete").length, color: "var(--accent)" }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[
            { key: "all", label: "All" },
            { key: "in_progress", label: "In Progress" },
            { key: "stuck", label: "Stuck" },
            { key: "complete", label: "Complete" }
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              className="onb-filter-btn"
              onClick={() => setFilter(option.key as "all" | OnboardingStatus)}
              style={{
                padding: "8px 14px",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                borderRadius: 2,
                background: filter === option.key ? "var(--accent)" : "rgba(255,255,255,0.04)",
                color: filter === option.key ? "#050508" : "#a0a0b0"
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", minHeight: "calc(100vh - 190px)" }}>
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((client) => {
            const isSelected = selected === client.id;
            const done = client.steps.filter((step) => step.done).length;
            const progress = Math.round((done / client.steps.length) * 100);
            const cfg = statusConfig[client.status];
            return (
              <div
                key={client.id}
                className="onb-client-item"
                onClick={() => setSelected(client.id)}
                style={{
                  padding: "14px",
                  borderRadius: 3,
                  border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "rgba(255,255,255,0.06)"}`,
                  background: isSelected ? "color-mix(in srgb, var(--accent) 4%, transparent)" : "rgba(255,255,255,0.01)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 2, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#a0a0b0", flexShrink: 0 }}>
                    {client.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: isSelected ? "#fff" : "#a0a0b0", fontWeight: isSelected ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {client.client}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {client.project}
                    </div>
                  </div>
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 2, background: cfg.bg, color: cfg.color, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {cfg.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: cfg.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, color: cfg.color, minWidth: 28 }}>{progress}%</span>
                </div>
                <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 6 }}>
                  {done}/{client.steps.length} steps - started {client.startDate.split(",")[0]}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "24px 28px", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <ProgressRing pct={pct} color={sCfg.color} size={64} />
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{current.client}</div>
                <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 6 }}>
                  {current.contact} - {current.project}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: sCfg.bg, color: sCfg.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{sCfg.label}</span>
                  <span style={{ fontSize: 10, color: "var(--muted2)" }}>Started {current.startDate}</span>
                  {current.completedAt ? <span style={{ fontSize: 10, color: "var(--accent)" }}>Completed {current.completedAt} ({current.daysToComplete} days)</span> : null}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 14 }}>
              {[
                { label: "Staff", done: staffDone, total: staffSteps.length, color: "#60a5fa" },
                { label: "Client", done: clientDone, total: clientSteps.length, color: "var(--accent)" }
              ].map((group) => (
                <div key={group.label} style={{ padding: "12px 16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)", textAlign: "center", minWidth: 80 }}>
                  <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{group.label}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: group.color }}>
                    {group.done}/{group.total}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--muted2)", marginTop: 4 }}>steps done</div>
                </div>
              ))}
            </div>
          </div>

          {current.status === "stuck" ? (
            <div style={{ padding: "12px 16px", border: "1px solid rgba(255,68,68,0.25)", borderRadius: 3, background: "rgba(255,68,68,0.06)", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, color: "#ff4444", flexShrink: 0 }}>⚠</span>
              <div>
                <div style={{ fontSize: 12, color: "#ff4444", marginBottom: 4 }}>Onboarding blocked</div>
                <div style={{ fontSize: 11, color: "#a0a0b0" }}>{current.notes}</div>
              </div>
            </div>
          ) : null}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Onboarding Checklist</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {current.steps.map((step, index) => {
                const catCfg = categoryConfig[step.category];
                const isLast = index === current.steps.length - 1;
                const isBlocked = Boolean(step.blocked);
                const isOverdue = Boolean(step.overdue);
                return (
                  <div key={step.id}>
                    <div className="onb-step-row" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px", borderRadius: 3, background: isOverdue ? "rgba(255,68,68,0.04)" : "transparent", border: isOverdue ? "1px solid rgba(255,68,68,0.15)" : "1px solid transparent", marginBottom: 2 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 2 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${step.done ? "var(--accent)" : isBlocked ? "rgba(255,255,255,0.08)" : isOverdue ? "#ff4444" : "rgba(255,255,255,0.15)"}`, background: step.done ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--accent)", flexShrink: 0 }}>
                          {step.done ? "✓" : isOverdue ? "!" : ""}
                        </div>
                        {!isLast ? (
                          <div className="onb-step-connector" style={{ background: step.done ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "rgba(255,255,255,0.06)" }} />
                        ) : null}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, color: step.done ? "var(--muted2)" : isBlocked ? "#333344" : "var(--text)", textDecoration: step.done ? "line-through" : "none" }}>{step.label}</span>
                          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 2, background: `${catCfg.color}15`, color: catCfg.color, letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>
                            {catCfg.label}
                          </span>
                          {isBlocked && !isOverdue ? <span style={{ fontSize: 9, color: "#333344" }}>Blocked</span> : null}
                          {isOverdue ? <span style={{ fontSize: 9, color: "#ff4444" }}>Overdue {step.overdueDays} days</span> : null}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 3 }}>
                          {step.done ? `Completed ${step.doneAt}` : step.scheduledFor ? `Scheduled ${step.scheduledFor}` : step.blocked ? "Waiting on previous step" : "Pending"}
                        </div>
                      </div>
                    </div>
                    {!isLast ? <div style={{ height: 2 }} /> : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding: "14px 16px", background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.12)", borderRadius: 3, marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: "#a78bfa", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Staff Notes</div>
            <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.7 }}>{current.notes}</div>
          </div>

          {current.status !== "complete" ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", width: "100%", marginBottom: 4 }}>Actions</div>
              {current.status === "stuck" ? (
                <button type="button" className="onb-action-btn" style={{ padding: "10px 16px", border: "1px solid rgba(255,68,68,0.25)", borderRadius: 3, background: "rgba(255,68,68,0.06)", color: "#ff4444", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Escalate to admin
                </button>
              ) : null}
              <button type="button" className="onb-action-btn" style={{ padding: "10px 16px", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 3, background: "color-mix(in srgb, var(--accent) 6%, transparent)", color: "var(--accent)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Send reminder to client
              </button>
              <button type="button" className="onb-action-btn" style={{ padding: "10px 16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, background: "transparent", color: "#a0a0b0", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                View client portal
              </button>
            </div>
          ) : (
            <div style={{ padding: 16, border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 3, background: "color-mix(in srgb, var(--accent) 4%, transparent)", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 20 }}>✓</span>
              <div>
                <div style={{ fontSize: 13, color: "var(--accent)" }}>Onboarding complete</div>
                <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>
                  Completed in {current.daysToComplete} days - project fully active.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
