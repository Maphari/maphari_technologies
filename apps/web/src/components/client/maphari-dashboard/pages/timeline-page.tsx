"use client";
import { useState, useEffect } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { loadPortalPhasesWithRefresh, type PortalPhase } from "../../../../lib/api/portal";
import {
  loadPortalChangeRequestsWithRefresh,
  updatePortalChangeRequestWithRefresh,
} from "../../../../lib/api/portal/projects";
import { saveSession } from "../../../../lib/auth/session";
import { usePageToast } from "../hooks/use-page-toast";

type ViewMode   = "gantt" | "summary" | "arc";
type PhaseStatus = "Completed" | "In Progress" | "Upcoming";

type Phase = {
  id: string; name: string; start: number; end: number;
  pct: number; status: PhaseStatus; color: string; icon: string;
  ownerName: string; ownerInitials: string; deliverables: number; desc: string;
};

// 16-week grid: starts 4 weeks before today, aligned to Monday
const TOTAL_WEEKS = 16;
const _WEEKS_HISTORY = 4; // weeks of history shown before today
const _GRID_ANCHOR   = new Date();
_GRID_ANCHOR.setDate(_GRID_ANCHOR.getDate() - _WEEKS_HISTORY * 7);
// Align to the nearest Monday
_GRID_ANCHOR.setDate(_GRID_ANCHOR.getDate() - ((_GRID_ANCHOR.getDay() + 6) % 7));
const _GRID_START_MS = _GRID_ANCHOR.getTime();
const WEEK_LABELS = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
  const d = new Date(_GRID_START_MS + i * 7 * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
});
const TODAY_WEEK = Math.max(1, Math.min(
  Math.ceil((Date.now() - _GRID_START_MS) / (7 * 24 * 60 * 60 * 1000)),
  TOTAL_WEEKS
));

// ── No phases/milestones mock data — loaded from API (loadPortalPhasesWithRefresh) ──
const PHASES: Phase[] = [];

const STATUS_BADGE: Record<PhaseStatus, string> = {
  "Completed":   "badgeGreen",
  "In Progress": "badgeAmber",
  "Upcoming":    "badgeMuted",
};

const MILESTONE_MARKERS: { id:string; name:string; week:number; done:boolean }[] = [];

const MILESTONES_FULL: {
  id:string; name:string; due:string; completedOn?:string;
  status:"Completed"|"Pending"|"Upcoming"; ownerInitials:string; ownerName:string;
}[] = [];

// No CR API yet — will be wired in Batch 2 (sign-offs / change requests)
const PENDING_CRS: { id:string; label:string; days:number; cost:number; scope:string }[] = [];
const BASE_END_LABEL = "TBD";

// Derived stats — computed from live data inside the component
const completedPhases     = PHASES.filter(p => p.status === "Completed").length;
const overallPct          = PHASES.length > 0 ? Math.round(PHASES.reduce((s, p) => s + p.pct, 0) / PHASES.length) : 0;
const weeksRemaining      = TODAY_WEEK > 0 ? TOTAL_WEEKS - TODAY_WEEK + 1 : TOTAL_WEEKS;
const completedMilestones = MILESTONE_MARKERS.filter(m => m.done).length;

// Gantt position helpers
const gPct   = (week: number) => `${((week - 1) / TOTAL_WEEKS) * 100}%`;
const gWidth = (s: number, e: number) => `${((e - s) / TOTAL_WEEKS) * 100}%`;
const gCtr   = (week: number) => `${((week - 0.5) / TOTAL_WEEKS) * 100}%`;

// SVG ring (r=22, viewBox 0 0 60 60)
const RING_R    = 22;
const RING_CIRC = 2 * Math.PI * RING_R; // ≈ 138.2

// No multi-project API yet — project list will be driven by real data
const PROJECTS: string[] = [];
type Project = string;

// ── API phase mapper ──────────────────────────────────────────────────────────
const PHASE_COLORS = ["var(--purple)", "var(--lime)", "var(--amber)", "var(--blue)", "var(--red)"];
const PHASE_ICONS  = ["folder", "image", "code", "shieldCheck", "rocket"] as const;

function apiToTimelinePhase(p: PortalPhase, idx: number): Phase {
  const pct    = p.budgetedHours > 0 ? Math.min(Math.round((p.loggedHours / p.budgetedHours) * 100), 100) : 0;
  const status: PhaseStatus = pct >= 100 ? "Completed" : p.loggedHours > 0 ? "In Progress" : "Upcoming";
  return {
    id:             p.id,
    name:           p.name,
    start:          (p.sortOrder * 3) + 1,
    end:            Math.min((p.sortOrder * 3) + 4, TOTAL_WEEKS),
    pct,
    status,
    color:          p.color ?? PHASE_COLORS[idx % PHASE_COLORS.length],
    icon:           PHASE_ICONS[idx % PHASE_ICONS.length],
    ownerName:      "—",
    ownerInitials:  "—",
    deliverables:   0,
    desc:           `${p.budgetedHours}h budgeted · ${p.loggedHours}h logged`,
  };
}

// ── CR Simulator sub-component ────────────────────────────────────────────────
function CRSimulator({
  activeCRs, toggleCR, extraDays, extraCost, onClear,
  onSubmit, isSubmitting, pendingCRs,
}: {
  activeCRs:    Set<string>;
  toggleCR:     (id: string) => void;
  extraDays:    number;
  extraCost:    number;
  onClear:      () => void;
  onSubmit:     () => Promise<void>;
  isSubmitting: boolean;
  pendingCRs:   { id: string; label: string; days: number; cost: number; scope: string }[];
}) {
  const endDay = 30 + extraDays;
  const endLabel = extraDays > 0 ? `Apr ${endDay}, 2026` : BASE_END_LABEL;

  return (
    <div className={cx("card", "borderLeftAmber")}>
      <div className={cx("cardHd")}>
        <Ic n="zap" sz={14} c="var(--amber)" />
        <span className={cx("cardHdTitle", "ml8")}>What-If CR Simulator</span>
        <span className={cx("badge", "badgeAmber", "ml8")}>Live</span>
      </div>
      <div className={cx("cardBodyPad")}>
        <div className={cx("text12", "colorMuted", "mb14")}>
          Toggle pending change requests to see the live impact on your end date and cost.
        </div>

        {/* CR chips */}
        <div className={cx("crChipsWrap")}>
          {pendingCRs.length === 0 && (
            <p className={cx("text11", "colorMuted")}>No draft change requests found.</p>
          )}
          {pendingCRs.map(cr => {
            const on = activeCRs.has(cr.id);
            return (
              <button
                key={cr.id} type="button" onClick={() => toggleCR(cr.id)}
                className={cx("crFilterChip", on ? "fw700" : "fw400")}
                style={{
                  "--bg-color": on ? "color-mix(in oklab, var(--amber) 12%, transparent)" : "var(--s2)",
                  "--color": on ? "var(--amber)" : "var(--muted2)",
                } as React.CSSProperties}
              >
                <Ic n={on ? "check" : "plus"} sz={10} c={on ? "var(--amber)" : "var(--muted2)"} />
                <span>{cr.id} · {cr.label}</span>
                <span className={cx("opacity70")}>+{cr.days}d · R{cr.cost.toLocaleString()}</span>
              </button>
            );
          })}
        </div>

        {/* Impact cards */}
        <div className={cx("grid2Cols", "gap10", "mb14")}>
          {([
            ["Projected End", endLabel, extraDays > 0 ? `+${extraDays} days from ${activeCRs.size} CR${activeCRs.size !== 1 ? "s" : ""}` : "No CRs selected — on schedule", extraDays > 0],
            ["Additional Cost", extraCost > 0 ? `R ${extraCost.toLocaleString()}` : "R 0", extraCost > 0 ? `${activeCRs.size} CR${activeCRs.size !== 1 ? "s" : ""} selected` : "Select CRs above", extraCost > 0],
          ] as [string, string, string, boolean][]).map(([label, value, sub, warn]) => (
            <div key={label} className={cx("impactCard")}
              style={{
                "--bg-color": warn ? "color-mix(in oklab, var(--amber) 6%, transparent)" : "color-mix(in oklab, var(--lime) 5%, transparent)",
                "--color": warn ? "color-mix(in oklab, var(--amber) 30%, transparent)" : "color-mix(in oklab, var(--lime) 25%, transparent)",
              } as React.CSSProperties}>
              <div className={cx("text10", "colorMuted", "mb4")}>{label}</div>
              <div className={cx("fw700", "text13", "dynColor")} style={{ "--color": warn ? "var(--amber)" : "var(--lime)" } as React.CSSProperties}>{value}</div>
              <div className={cx("text10", "colorMuted", "mt2")}>{sub}</div>
            </div>
          ))}
        </div>

        {activeCRs.size > 0 && (
          <div className={cx("flexRow", "gap8")}>
            <button
              type="button"
              className={cx("btnSm", "btnAccent")}
              disabled={isSubmitting}
              onClick={onSubmit}
            >
              {isSubmitting ? "Submitting…" : "Submit Selected CRs →"}
            </button>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={onClear} disabled={isSubmitting}>Clear</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Type for a pending CR entry in the simulator (derived from API data)
type PendingCR = { id: string; label: string; days: number; cost: number; scope: string };

// ── Main component ─────────────────────────────────────────────────────────────
export function TimelinePage() {
  const notify = usePageToast();

  const [view, setView]           = useState<ViewMode>("gantt");
  const [project, setProject]     = useState<Project>(PROJECTS[0] ?? "");
  const [activeCRs, setActiveCRs] = useState<Set<string>>(new Set());
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);
  const [apiPhases, setApiPhases] = useState<Phase[]>([]);
  const [pendingCRs, setPendingCRs] = useState<PendingCR[]>([]);
  const [isSubmittingCRs, setIsSubmittingCRs] = useState(false);

  const { session, projectId } = useProjectLayer();

  useEffect(() => {
    if (!session || !projectId) return;
    loadPortalPhasesWithRefresh(session, projectId).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data && r.data.length > 0) {
        setApiPhases(r.data.map(apiToTimelinePhase));
      }
    });
  }, [session, projectId]);

  // Load DRAFT change requests for the simulator
  useEffect(() => {
    if (!session || !projectId) return;
    loadPortalChangeRequestsWithRefresh(session, { projectId, status: "DRAFT" }).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data && r.data.length > 0) {
        setPendingCRs(r.data.map(cr => ({
          id:    cr.id,
          label: cr.title,
          days:  cr.estimatedHours != null ? Math.ceil(cr.estimatedHours / 8) : 0,
          cost:  cr.estimatedCostCents != null ? Math.round(cr.estimatedCostCents / 100) : 0,
          scope: cr.impactSummary ?? "",
        })));
      }
    });
  }, [session, projectId]);

  // Submit all selected (DRAFT) CRs by patching their status to SUBMITTED
  const handleSubmitCRs = async () => {
    if (!session || activeCRs.size === 0) return;
    setIsSubmittingCRs(true);
    try {
      const results = await Promise.all(
        Array.from(activeCRs).map(id =>
          updatePortalChangeRequestWithRefresh(session, id, { status: "SUBMITTED" })
        )
      );
      const allOk = results.every(r => r.data !== null && !r.error);
      if (allOk) {
        const count = activeCRs.size;
        notify("success", `${count} change request${count !== 1 ? "s" : ""} submitted.`);
        // Remove submitted CRs from the pending list and clear selection
        const submitted = new Set(activeCRs);
        setPendingCRs(prev => prev.filter(cr => !submitted.has(cr.id)));
        setActiveCRs(new Set());
      } else {
        notify("error", "Failed to submit change requests.");
      }
    } catch {
      notify("error", "Failed to submit change requests.");
    } finally {
      setIsSubmittingCRs(false);
    }
  };

  // Use API phases — no mock fallback
  const displayPhases = apiPhases;

  const selectedCRs = pendingCRs.filter(cr => activeCRs.has(cr.id));
  const extraDays   = selectedCRs.reduce((s, cr) => s + cr.days, 0);
  const extraCost   = selectedCRs.reduce((s, cr) => s + cr.cost, 0);

  const toggleCR = (id: string) => setActiveCRs(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const clearCRs = () => setActiveCRs(new Set());

  // Derived stats from displayPhases
  const completedPhasesDyn = displayPhases.filter(p => p.status === "Completed").length;
  const overallPctDyn      = displayPhases.length > 0 ? Math.round(displayPhases.reduce((s, p) => s + p.pct, 0) / displayPhases.length) : 0;

  return (
    <div className={cx("pageBody")}>
      {/* Header */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Timeline</div>
          <h1 className={cx("pageTitle")}>Project Timeline</h1>
          <p className={cx("pageSub")}>Gantt chart, phase summary, and story arc with a live change-request impact simulator.</p>
        </div>
        <div className={cx("flexRow", "gap8", "noShrink")}>
          <button type="button" className={cx("btnGhost")} title="Export not yet available" disabled>
            <Ic n="download" sz={14} /> Export
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className={cx("topCardsStack", "mb20")}>
        {([
          ["Overall Progress", `${overallPctDyn}%`,                                         "statCardAccent"],
          ["Phases Complete",  `${completedPhasesDyn} / ${displayPhases.length}`,           "statCardGreen"],
          ["Milestones Done",  `${completedMilestones} / ${MILESTONE_MARKERS.length}`,       "statCardAmber"],
          ["Weeks Remaining",  String(weeksRemaining),                                       "statCardBlue"],
        ] as [string, string, string][]).map(([label, value, color]) => (
          <div key={label} className={cx("statCard", color)}>
            <div className={cx("statLabel")}>{label}</div>
            <div className={cx("statValue")}>{value}</div>
          </div>
        ))}
      </div>

      {/* View switcher */}
      <div className={cx("flexRow", "h36", "mb16")}>
        <div className={cx("pillTabs")}>
          {(["gantt", "summary", "arc"] as ViewMode[]).map(v => (
            <button key={v} type="button" className={cx("pillTab", view === v && "pillTabActive")} onClick={() => setView(v)}>
              {v === "gantt" ? "Gantt Chart" : v === "summary" ? "Summary" : "Story Arc"}
            </button>
          ))}
        </div>
      </div>

      {/* ── GANTT VIEW ── */}
      {view === "gantt" && (
        <>
          {/* Project selector */}
          <div className={cx("flexRow", "h32", "mb16")}>
            <div className={cx("pillTabs")}>
              {PROJECTS.map(p => (
                <button key={p} type="button" className={cx("pillTab", project === p && "pillTabActive")} onClick={() => setProject(p)}>{p}</button>
              ))}
            </div>
          </div>

          <div className={cx("card", "mb16", "p16x20x20", "overflowXAuto")}>
            <div className={cx("cardHd", "mb14")}>
              <Ic n="calendar" sz={14} c="var(--accent)" />
              <span className={cx("cardHdTitle", "ml8")}>Phase Timeline — {project}</span>
              <span className={cx("badge", "badgeAccent", "ml8")}>Week {TODAY_WEEK} · Today</span>
              <span className={cx("text10", "colorMuted", "mlAuto")}>{WEEK_LABELS[0]} – {WEEK_LABELS[TOTAL_WEEKS - 1]} · {TOTAL_WEEKS} weeks</span>
            </div>

            <div className={cx("minW640")}>
              {/* Week header */}
              <div className={cx("flexRow", "mb8")}>
                <div className={cx("w130", "noShrink")} />
                <div className={cx("flex1", "ganttGrid16")}>
                  {WEEK_LABELS.map((w, i) => (
                    <div key={w} className={cx(i + 1 === TODAY_WEEK ? "ganttWeekLabelToday" : "ganttWeekLabel")}>{w}</div>
                  ))}
                </div>
              </div>

              {/* Bar area */}
              <div className={cx("flexCol", "relative")}>
                {/* Alternate week column shading */}
                <div className={cx("absInset", "pointerNone", "flexRow")}>
                  <div className={cx("w130", "noShrink")} />
                  <div className={cx("flex1", "ganttGrid16")}>
                    {Array.from({ length: TOTAL_WEEKS }, (_, i) => (
                      <div key={i} className={cx("dynBgColor")} style={{ "--bg-color": i % 2 !== 0 ? "color-mix(in oklab, var(--muted2) 3%, transparent)" : "transparent" } as React.CSSProperties} />
                    ))}
                  </div>
                </div>

                {/* Today line */}
                <div className={cx("chartMaskR")}>
                  <div className={cx("todayLine")} style={{ "--left": gCtr(TODAY_WEEK) } as React.CSSProperties}>
                    <div className={cx("ganttTodayLabel")}>TODAY</div>
                  </div>
                </div>

                {/* Phase rows */}
                {displayPhases.map(ph => (
                  <div
                    key={ph.id}
                    className={cx("flexRow", "mb9")}
                    onMouseEnter={() => setHoveredPhase(ph.id)}
                    onMouseLeave={() => setHoveredPhase(null)}
                  >
                    <div className={cx("w130", "noShrink", "pr10")}>
                      <div className={cx("ganttPhaseName", "dynColor")} style={{ "--color": hoveredPhase === ph.id ? ph.color : "inherit" } as React.CSSProperties}>{ph.name}</div>
                      <div className={cx("text9", "colorMuted")}>{ph.deliverables} deliverables</div>
                    </div>
                    <div className={cx("flex1", "relative", "h28")}>
                      {/* Track */}
                      <div className={cx("absBgHighlight")} />
                      {/* Bar */}
                      <div
                        className={cx("ganttBar")}
                        style={{
                          "--bar-left": gPct(ph.start),
                          "--bar-width": gWidth(ph.start, Math.min(ph.end, TOTAL_WEEKS + 1)),
                          "--bg-color": ph.status === "Upcoming" ? "var(--s3)" : `color-mix(in oklab, ${ph.color} 20%, transparent)`,
                          "--color": `color-mix(in oklab, ${ph.color} ${ph.status === "Upcoming" ? "18" : "45"}%, transparent)`,
                        } as React.CSSProperties}
                      >
                        {ph.status === "In Progress" && ph.pct > 0 && (
                          <div className={cx("ganttBarFillProgress")} style={{ "--pct": `${ph.pct}%`, "--bg-color": `color-mix(in oklab, ${ph.color} 55%, transparent)` } as React.CSSProperties} />
                        )}
                        {ph.status === "Completed" && (
                          <div className={cx("ganttBarFillComplete")} style={{ "--bg-color": `color-mix(in oklab, ${ph.color} 45%, transparent)` } as React.CSSProperties} />
                        )}
                        {ph.status !== "Upcoming" && (
                          <span className={cx("absPhaseLabel", "dynColor")} style={{ "--color": ph.color } as React.CSSProperties}>
                            {ph.status === "Completed" ? "✓" : `${ph.pct}%`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Milestone markers */}
                <div className={cx("flexRow", "mt4")}>
                  <div className={cx("w130", "noShrink")}>
                    <span className={cx("text10", "colorMuted")}>Milestones</span>
                  </div>
                  <div className={cx("flex1", "relative", "h22")}>
                    {MILESTONE_MARKERS.map(ms => (
                      <div
                        key={ms.id}
                        title={`${ms.id}: ${ms.name}`}
                        className={cx("ganttMsMarker")}
                        style={{
                          "--left": gCtr(ms.week),
                          "--bg-color": ms.done ? "var(--lime)" : "var(--s3)",
                          "--color": ms.done ? "var(--lime)" : "var(--b2)",
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className={cx("flexRow", "gap16", "mt18", "flexWrap")}>
                {([["Completed","var(--lime)"],["In Progress","var(--amber)"],["Upcoming","var(--muted2)"]] as [string,string][]).map(([label, color]) => (
                  <div key={label} className={cx("flexRow", "flexCenter", "gap6")}>
                    <div className={cx("legendSwatch")} style={{ "--bg-color": `color-mix(in oklab, ${color} 45%, transparent)`, "--color": `color-mix(in oklab, ${color} 55%, transparent)` } as React.CSSProperties} />
                    <span className={cx("text10", "colorMuted")}>{label}</span>
                  </div>
                ))}
                <div className={cx("flexRow", "flexCenter", "gap6")}>
                  <div className={cx("accentDot10")} />
                  <span className={cx("text10", "colorMuted")}>Milestone (done)</span>
                </div>
                <div className={cx("flexRow", "flexCenter", "gap6")}>
                  <div className={cx("accentBar1x14")} />
                  <span className={cx("text10", "colorMuted")}>Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Milestone list + Summary */}
          <div className={cx("grid2")}>
            <div className={cx("card")}>
              <div className={cx("cardHd")}>
                <Ic n="flag" sz={13} c="var(--accent)" />
                <span className={cx("cardHdTitle", "ml8")}>Milestones</span>
                <span className={cx("badge", "badgeMuted", "mlAuto")}>{completedMilestones} / {MILESTONE_MARKERS.length} done</span>
              </div>
              <div>
                {MILESTONES_FULL.map((m, idx) => (
                  <div key={m.id} className={cx("flexRow", "flexCenter", "gap10", "p10x16", idx > 0 && "borderTopDivider")}>
                    <div className={cx("msIconCircle24")} style={{ "--bg-color": m.status === "Completed" ? "color-mix(in oklab, var(--lime) 15%, transparent)" : "var(--s3)", "--color": m.status === "Completed" ? "var(--lime)" : "var(--b2)" } as React.CSSProperties}>
                      <Ic n={m.status === "Completed" ? "check" : m.status === "Pending" ? "clock" : "calendar"} sz={10} c={m.status === "Completed" ? "var(--lime)" : "var(--muted2)"} />
                    </div>
                    <div className={cx("flex1")}>
                      <div className={cx("flexRow", "gap6")}>
                        <span className={cx("badge", "badgeMuted")}>{m.id}</span>
                        <span className={cx("fw600", "text12")}>{m.name}</span>
                      </div>
                      <div className={cx("text10", "colorMuted", "mt1")}>
                        Due {m.due} 2026{m.completedOn ? ` · Completed ${m.completedOn}` : ""}
                      </div>
                    </div>
                    <Av initials={m.ownerInitials} size={22} />
                    <span className={cx("badge", m.status === "Completed" ? "badgeGreen" : m.status === "Pending" ? "badgeAmber" : "badgeMuted")}>{m.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cx("card")}>
              <div className={cx("cardHd")}>
                <Ic n="activity" sz={13} c="var(--accent)" />
                <span className={cx("cardHdTitle", "ml8")}>Project Summary</span>
              </div>
              <div className={cx("cardBodyPad")}>
                {([
                  ["Project Start",    WEEK_LABELS[0] ?? "—",                                                ""],
                  ["Projected End",    WEEK_LABELS[TOTAL_WEEKS - 1] ?? "—",                                  ""],
                  ["Total Duration",   `${TOTAL_WEEKS} weeks`,                                               ""],
                  ["Current Phase",    displayPhases.find(p => p.status === "In Progress")?.name ?? "—",     displayPhases.find(p => p.status === "In Progress") ? "badgeAmber" : "badgeMuted"],
                  ["Overall Progress", `${overallPctDyn}%`,                                                  overallPctDyn >= 75 ? "badgeGreen" : overallPctDyn >= 40 ? "badgeAmber" : "badgeMuted"],
                  ["Phases Complete",  `${completedPhasesDyn} / ${displayPhases.length}`,                    completedPhasesDyn === displayPhases.length && displayPhases.length > 0 ? "badgeGreen" : "badgeAmber"],
                ] as [string, string, string][]).map(([k, v, badge]) => (
                  <div key={k} className={cx("kvRow")}>
                    <span className={cx("text12", "colorMuted")}>{k}</span>
                    {badge ? <span className={cx("badge", badge)}>{v}</span> : <span className={cx("text12", "fw600")}>{v}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── SUMMARY VIEW ── */}
      {view === "summary" && (
        <>
          {/* Phase breakdown */}
          <div className={cx("card", "mb16")}>
            <div className={cx("cardHd")}>
              <Ic n="activity" sz={14} c="var(--accent)" />
              <span className={cx("cardHdTitle", "ml8")}>Phase Breakdown</span>
            </div>
            <div className={cx("cardBodyPad")}>
              {displayPhases.map((ph, idx) => (
                <div key={ph.id} className={idx > 0 ? cx("phaseSectionDivider") : undefined}>
                  <div className={cx("flexRow", "flexCenter", "gap10", "mb8")}>
                    <div className={cx("phaseIconBox34")} style={{ "--bg-color": `color-mix(in oklab, ${ph.color} 12%, transparent)`, "--color": `color-mix(in oklab, ${ph.color} 25%, transparent)` } as React.CSSProperties}>
                      <Ic n={ph.icon} sz={15} c={ph.color} />
                    </div>
                    <div className={cx("flex1")}>
                      <div className={cx("flexRow", "flexCenter", "gap8", "mb2")}>
                        <span className={cx("fw600", "text12")}>{ph.name}</span>
                        <span className={cx("badge", STATUS_BADGE[ph.status])}>{ph.status}</span>
                      </div>
                      <div className={cx("text11", "colorMuted")}>{ph.desc} · {ph.deliverables} deliverables</div>
                    </div>
                    <Av initials={ph.ownerInitials} size={28} />
                    <span className={cx("phasePctLabel", "dynColor")} style={{ "--color": ph.status === "Upcoming" ? "var(--muted2)" : ph.color } as React.CSSProperties}>{ph.pct}%</span>
                  </div>
                  <div className={cx("trackH6")}>
                    <div className={cx("phaseProgressFill")} style={{ "--pct": `${ph.pct}%`, "--bg-color": ph.status === "Completed" ? ph.color : `color-mix(in oklab, ${ph.color} 65%, transparent)` } as React.CSSProperties} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Health + Upcoming */}
          <div className={cx("grid2", "mb16")}>
            <div className={cx("card")}>
              <div className={cx("cardHd")}>
                <Ic n="shieldCheck" sz={14} c="var(--lime)" />
                <span className={cx("cardHdTitle", "ml8")}>Timeline Health</span>
                <span className={cx("badge", "badgeGreen", "mlAuto")}>On Track</span>
              </div>
              <div className={cx("cardBodyPad")}>
                {([
                  ["Overall Progress", `${overallPctDyn}%`,                                          overallPctDyn >= 60 ? "lime" : "amber"],
                  ["Phases Complete",  `${completedPhasesDyn} / ${displayPhases.length}`,            completedPhasesDyn === displayPhases.length && displayPhases.length > 0 ? "lime" : "amber"],
                  ["Active Phase",     displayPhases.find(p => p.status === "In Progress")?.name ?? "None", "amber"],
                  ["Weeks Remaining",  `${weeksRemaining} of ${TOTAL_WEEKS}`,                       weeksRemaining <= 4 ? "amber" : "lime"],
                  ["Milestones Done",  `${completedMilestones} / ${MILESTONE_MARKERS.length}`,       completedMilestones === MILESTONE_MARKERS.length && MILESTONE_MARKERS.length > 0 ? "lime" : "muted2"],
                  ["Pending CRs",      `${pendingCRs.length}`,                                     pendingCRs.length > 0 ? "amber" : "lime"],
                ] as [string, string, string][]).map(([label, value, color]) => (
                  <div key={label} className={cx("kvRow9")}>
                    <span className={cx("text12", "colorMuted")}>{label}</span>
                    <span className={cx("healthKvVal", "dynColor")} style={{ "--color": `var(--${color})` } as React.CSSProperties}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cx("card")}>
              <div className={cx("cardHd")}>
                <Ic n="clock" sz={14} c="var(--amber)" />
                <span className={cx("cardHdTitle", "ml8")}>Upcoming Deadlines</span>
              </div>
              <div>
                {MILESTONES_FULL.filter(m => m.status !== "Completed").map((m, idx) => (
                  <div key={m.id} className={cx("flexRow", "flexCenter", "gap10", "p10x16", idx > 0 && "borderTopDivider")}>
                    <div className={cx("dot8", "noShrink")} style={{ "--bg-color": m.status === "Pending" ? "var(--amber)" : "var(--muted2)" } as React.CSSProperties} />
                    <div className={cx("flex1")}>
                      <div className={cx("fw600", "text12")}>{m.name}</div>
                      <div className={cx("text10", "colorMuted")}>Due {m.due} 2026 · {m.ownerName}</div>
                    </div>
                    <span className={cx("badge", m.status === "Pending" ? "badgeAmber" : "badgeMuted")}>{m.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <CRSimulator activeCRs={activeCRs} toggleCR={toggleCR} extraDays={extraDays} extraCost={extraCost} onClear={clearCRs} onSubmit={handleSubmitCRs} isSubmitting={isSubmittingCRs} pendingCRs={pendingCRs} />
        </>
      )}

      {/* ── STORY ARC VIEW ── */}
      {view === "arc" && (
        <>
          <div className={cx("card", "mb16", "p18x20x22", "overflowXAuto")}>
            <div className={cx("cardHd", "mb20")}>
              <Ic n="trending" sz={14} c="var(--accent)" />
              <span className={cx("cardHdTitle", "ml8")}>Project Story Arc</span>
              <span className={cx("badge", "badgeAccent", "ml8")}>{displayPhases.length} phases</span>
              <span className={cx("text10", "colorMuted", "mlAuto")}>{TOTAL_WEEKS} weeks</span>
            </div>

            <div className={cx("flexRow", "minW700", "alignStretch")}>
              {displayPhases.map((ph, ci) => {
                const isActive = ph.status === "In Progress";
                const isDone   = ph.status === "Completed";
                const dashArr  = `${((ph.pct / 100) * RING_CIRC).toFixed(1)} ${RING_CIRC.toFixed(1)}`;

                return (
                  <div key={ph.id} className={cx("flexRow", "flex1", "minW140")}>
                    <div className={cx("flex1", "arcPhaseContainer", ph.status === "Upcoming" ? "arcPhaseUpcoming" : "arcPhaseFull")}>
                      {/* Chapter header */}
                      <div className={cx("arcChapterHd")} style={{ "--bg-color": `color-mix(in oklab, ${ph.color} 12%, transparent)`, "--color": ph.color } as React.CSSProperties}>
                        <div className={cx("arcIconBox26")} style={{ "--bg-color": `color-mix(in oklab, ${ph.color} 20%, transparent)` } as React.CSSProperties}>
                          <Ic n={ph.icon} sz={13} c={ph.color} />
                        </div>
                        <span className={cx("fw700", "text12", "flex1", "dynColor")} style={{ "--color": ph.color } as React.CSSProperties}>{ph.name}</span>
                        {isDone   && <span className={cx("badge", "badgeGreen", "fs06")}>Done</span>}
                        {isActive && <span className={cx("badge", "badgeAmber", "fs06")}>Active</span>}
                      </div>

                      {/* Chapter body */}
                      <div className={cx("p12", "flexCol", "gap10", "flexCenter")}>
                        {/* SVG ring */}
                        <svg width={56} height={56} viewBox="0 0 60 60">
                          <circle cx={30} cy={30} r={RING_R} fill="none" stroke="var(--b2)" strokeWidth={5} />
                          {ph.pct > 0 && (
                            <circle cx={30} cy={30} r={RING_R} fill="none" stroke={ph.color} strokeWidth={5}
                              strokeLinecap="round" strokeDasharray={dashArr} transform="rotate(-90 30 30)"
                              className={isActive ? cx("arcRingGlow") : undefined}
                              style={isActive ? { "--glow-color": ph.color } as React.CSSProperties : undefined}
                            />
                          )}
                          <text x={30} y={34} textAnchor="middle" fontSize={12} fontWeight={800} fill={ph.pct > 0 ? ph.color : "var(--muted2)"}>{ph.pct}%</text>
                        </svg>

                        <div className={cx("textCenter")}>
                          <div className={cx("text10", "colorMuted", "mb4", "lineH14")}>{ph.desc}</div>
                          <div className={cx("fw600", "text11")}>{ph.deliverables} deliverables</div>
                        </div>

                        <div className={cx("wFull", "flexRow", "gap7")}>
                          <Av initials={ph.ownerInitials} size={20} />
                          <span className={cx("text10", "colorMuted", "spanTruncate")}>{ph.ownerName}</span>
                        </div>
                      </div>
                    </div>

                    {ci < displayPhases.length - 1 && (
                      <div className={cx("px6_0", "noShrink")}>
                        <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <CRSimulator activeCRs={activeCRs} toggleCR={toggleCR} extraDays={extraDays} extraCost={extraCost} onClear={clearCRs} onSubmit={handleSubmitCRs} isSubmitting={isSubmittingCRs} pendingCRs={pendingCRs} />
        </>
      )}
    </div>
  );
}
