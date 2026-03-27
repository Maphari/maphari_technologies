"use client";
import { useState, useMemo } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { ProjectCard } from "../types";
import type { PageId } from "../config";

type PTab = "Active" | "Completed" | "On Hold";
const TABS: PTab[] = ["Active", "Completed", "On Hold"];

// ── Risk score helpers ─────────────────────────────────────────────────────
function riskScore(riskLevel: string): number {
  if (riskLevel === "CRITICAL") return 7;
  if (riskLevel === "HIGH")     return 5;
  if (riskLevel === "MEDIUM")   return 3;
  return 1;
}

function isHighRisk(riskLevel: string): boolean {
  return riskLevel === "HIGH" || riskLevel === "CRITICAL";
}

function isActiveStatus(status: string): boolean {
  const upper = status.toUpperCase();
  return upper !== "COMPLETED" && upper !== "CANCELLED" && upper !== "DELIVERED" && upper !== "ARCHIVED";
}

function healthColor(h: number) {
  if (h > 80) return "var(--lime)";
  if (h > 60) return "var(--amber)";
  return "var(--red)";
}

export function MyProjectsPage({ projects: apiProjects = [], onNavigate }: { projects?: ProjectCard[]; onNavigate?: (page: PageId) => void }) {
  const [tab, setTab] = useState<PTab>("Active");

  const fmtMoney = (cents: number) =>
    "R " + Math.round(cents / 100).toLocaleString("en-ZA");

  const portfolioKpis = useMemo(() => {
    if (apiProjects.length === 0) {
      return {
        healthScore: null,
        activeCount: 0,
        alertCount: 0,
        totalContractValue: null,
        averageProgress: null,
        onTrackCount: 0,
      };
    }

    const healthScore = Math.round(
      apiProjects.reduce((sum, p) => sum + (100 - riskScore(p.riskLevel) * 10), 0) / apiProjects.length
    );
    const activeProjects = apiProjects.filter((p) => isActiveStatus(p.status));
    const activeCount = activeProjects.length;
    const alertCount = apiProjects.filter((p) => isHighRisk(p.riskLevel)).length;
    const totalContractValue = fmtMoney(apiProjects.reduce((sum, p) => sum + p.budgetCents, 0));
    const averageProgress = activeProjects.length > 0
      ? Math.round(activeProjects.reduce((sum, p) => sum + p.progressPercent, 0) / activeProjects.length)
      : null;
    const onTrackCount = activeProjects.filter((p) => !isHighRisk(p.riskLevel)).length;

    return { healthScore, activeCount, alertCount, totalContractValue, averageProgress, onTrackCount };
  }, [apiProjects]);

  const alertProjects = useMemo(
    () => apiProjects.filter((p) => isHighRisk(p.riskLevel)),
    [apiProjects]
  );

  // ── Map API data to display format ──────────────────────────────────────────
  const displayProjects = useMemo(() => {
    if (apiProjects.length === 0) return [];
    const mapped = apiProjects.map((p) => {
      const tab: PTab =
        p.status === "Completed" || p.status === "Delivered" ? "Completed"
        : p.status === "On Hold" || p.status === "Paused" ? "On Hold"
        : "Active";
      const healthFromRisk = (riskLevel: string) =>
        riskLevel === "CRITICAL" ? 30
        : riskLevel === "HIGH" ? 50
        : riskLevel === "MEDIUM" ? 70
        : 85;
      return {
        id: p.id,
        tab,
        name: p.name,
        phase: p.status,
        progress: p.progressPercent,
        health: healthFromRisk(p.riskLevel),
        highRisk: isHighRisk(p.riskLevel),
        team: p.collaborators.map((c) => ({
          id: c.name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase(),
          name: c.name,
        })),
        due: p.dueAt ? new Date(p.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
        status: p.status,
        borderColor: p.riskLevel === "HIGH" || p.riskLevel === "CRITICAL" ? "var(--red)" : p.progressPercent > 80 ? "var(--lime)" : "var(--amber)",
        contractValue: fmtMoney(p.budgetCents),
        taskSummary: p.taskCount > 0
          ? String(p.completedTaskCount) + " / " + String(p.taskCount) + " tasks complete"
          : "Task plan not published yet",
        scopeSummary: p.scopeCurrent > 0
          ? String(p.scopeCurrent) + " active scope items"
          : "Scope not published yet",
        scopeDriftLabel: p.scopeDriftPercent === 0
          ? "Scope aligned"
          : (p.scopeDriftPercent > 0 ? "+" : "") + String(p.scopeDriftPercent) + "% scope drift",
      };
    });

    // Sort: high-risk projects float to the top
    return mapped.sort((a, b) => {
      if (a.highRisk && !b.highRisk) return -1;
      if (!a.highRisk && b.highRisk) return 1;
      return 0;
    });
  }, [apiProjects]);

  const filtered = useMemo(() => displayProjects.filter((p) => p.tab === tab), [displayProjects, tab]);

  return (
    <div className={cx("pageBody", "rdStudioPage")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Overview</div>
          <h1 className={cx("pageTitle")}>My Projects</h1>
          <p className={cx("pageSub")}>All your active and completed projects with health scores and progress.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => onNavigate?.("projectRoadmap")}>Project Roadmap</button>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => onNavigate?.("projectBrief")}>+ New Project Brief</button>
        </div>
      </div>

      {/* ── Alert strip (high-risk projects) ────────────────────────────── */}
      {alertProjects.length > 0 && (
        <div className={cx("card", "notifRowRed", "mb16", "px16", "py12")}>
          <div className={cx("flexBetween", "mb6")}>
            <span className={cx("fw600", "text12", "colorRed")}>
              {alertProjects.length === 1
                ? "1 project requires attention"
                : `${alertProjects.length} projects require attention`}
            </span>
          </div>
          <div className={cx("flexRow", "gap8", "flexWrap")}>
            {alertProjects.map((p) => (
              <button
                key={p.id}
                type="button"
                className={cx("badge", "badgeRed")}
                onClick={() => onNavigate?.("riskRegister")}
                aria-label={`View risk details for ${p.name}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Total Projects", value: String(apiProjects.length), color: "statCardAccent" },
          {
            label: "Avg Health Score",
            value: portfolioKpis.healthScore !== null ? String(portfolioKpis.healthScore) + "%" : "—",
            color: portfolioKpis.healthScore !== null && portfolioKpis.healthScore > 80 ? "statCardGreen" : "statCardAmber",
          },
          {
            label: "On Track",
            value: String(portfolioKpis.onTrackCount) + " / " + String(portfolioKpis.activeCount),
            color: portfolioKpis.alertCount > 0 ? "statCardAmber" : "statCardGreen",
          },
          {
            label: "Total Contract Value",
            value: portfolioKpis.totalContractValue ?? "—",
            color: "statCardBlue",
          },
          {
            label: "Average Progress",
            value: portfolioKpis.averageProgress !== null ? String(portfolioKpis.averageProgress) + "%" : "—",
            color: "statCardAccent",
          },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("pillTabs", "mb16")}>
        {TABS.map((t) => (
          <button key={t} type="button" className={cx("pillTab", tab === t && "pillTabActive")} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="folder" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>
            {displayProjects.length === 0 ? "No projects yet" : `No ${tab.toLowerCase()} projects`}
          </div>
          <div className={cx("emptyStateSub")}>
            {displayProjects.length === 0
              ? "Your projects will appear here once your account is set up."
              : `You have no projects in the "${tab}" category.`}
          </div>
        </div>
      )}

      <div className={cx("grid2")}>
        {filtered.map((p) => (
          <div key={p.id} className={cx("card", "p0", "dynBorderLeft3", "rdStudioCard")} style={{ "--color": p.borderColor } as React.CSSProperties}>
            <div className={cx("py14_px", "px16_px")}>
              {/* Header row */}
              <div className={cx("flexBetween", "mb6")}>
                <span className={cx("fw700", "text13")}>{p.name}</span>
                <span className={cx("dynColor", "fw700", "fs085rem")} style={{ "--color": healthColor(p.health) } as React.CSSProperties}>{p.health}</span>
              </div>
              <span className={cx("badge", "badgeMuted", "mb10", "inlineBlock", "rdStudioLabel")}>{p.phase}</span>

              {/* Progress */}
              <div className={cx("mb10")}>
                <div className={cx("flexBetween", "mb4")}>
                  <span className={cx("text11", "colorMuted")}>Progress</span>
                  <span className={cx("text11", "fw600", "rdStudioMetric", p.progress >= 70 ? "rdStudioMetricPos" : "rdStudioMetricWarn")}>{p.progress}%</span>
                </div>
                <div className={cx("progressTrack")}>
                  <div className={cx("progressFill")} style={{ '--pct': `${p.progress}%` } as React.CSSProperties} />
                </div>
              </div>

              <div className={cx("mb10")}>
                <div className={cx("flexBetween", "mb4")}>
                  <span className={cx("text11", "colorMuted")}>Contract Value</span>
                  <span className={cx("text11", "colorMuted")}>{p.contractValue}</span>
                </div>
                <div className={cx("flexBetween", "mb4")}>
                  <span className={cx("text11", "colorMuted")}>Delivery</span>
                  <span className={cx("text11", "colorMuted")}>{p.taskSummary}</span>
                </div>
              </div>

              <div className={cx("flexBetween", "mb10")}>
                <span className={cx("text11", "colorMuted")}>{p.scopeSummary}</span>
                <span className={cx("text11", p.highRisk ? "colorRed" : "colorMuted")}>{p.scopeDriftLabel}</span>
              </div>

              <div className={cx("flexBetween", "mb10")}>
                <span className={cx("text11", "colorMuted")}>Due date</span>
                <span className={cx("text11", "fw600")}>{p.due}</span>
              </div>

              {/* Footer: avatars + quick links */}
              <div className={cx("flexBetween", "mt4")}>
                <div className={cx("flexRow")}>
                  {p.team.map((av, i) => (
                    <div
                      key={av.id}
                      title={av.name}
                      className={cx("avatarStack24", i > 0 && "ml-6")}
                      style={{ '--z': p.team.length - i } as React.CSSProperties}
                    >{av.id}</div>
                  ))}
                </div>
                <div className={cx("flexRow", "gap4")}>
                  <button type="button" className={cx("btnSm", "btnGhost", "p2x8", "fs10")} onClick={() => onNavigate?.("sprintBoard")}>Sprint →</button>
                  <button type="button" className={cx("btnSm", "btnGhost", "p2x8", "fs10")} onClick={() => onNavigate?.("invoices")}>Invoices →</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
