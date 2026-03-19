"use client";
import { useState, useMemo } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { ProjectCard } from "../types";
import type { PageId } from "../config";

type PTab = "Active" | "Completed" | "On Hold";
const TABS: PTab[] = ["Active", "Completed", "On Hold"];


function healthColor(h: number) {
  if (h > 80) return "var(--lime)";
  if (h > 60) return "var(--amber)";
  return "var(--red)";
}

export function MyProjectsPage({ projects: apiProjects = [], onNavigate }: { projects?: ProjectCard[]; onNavigate?: (page: PageId) => void }) {
  const [tab, setTab] = useState<PTab>("Active");

  // ── Map API data to display format ──────────────────────────────────────────
  const displayProjects = useMemo(() => {
    if (apiProjects.length === 0) return [];
    return apiProjects.map((p) => {
      const tab: PTab =
        p.status === "Completed" || p.status === "Delivered" ? "Completed"
        : p.status === "On Hold" || p.status === "Paused" ? "On Hold"
        : "Active";
      const healthFromRisk = (riskLevel: string) =>
        riskLevel === "CRITICAL" ? 30
        : riskLevel === "HIGH" ? 50
        : riskLevel === "MEDIUM" ? 70
        : 85;
      const budgetUsed = p.budgetCents * (p.progressPercent / 100);
      const fmtMoney = (cents: number) =>
        `R ${Math.round(cents / 100).toLocaleString("en-ZA")}`;
      return {
        id: p.id,
        tab,
        name: p.name,
        phase: p.status,
        progress: p.progressPercent,
        health: healthFromRisk(p.riskLevel),
        team: p.collaborators.map((c) => ({
          id: c.name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase(),
          name: c.name,
        })),
        due: p.dueAt ? new Date(p.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
        status: p.status,
        borderColor: p.riskLevel === "HIGH" || p.riskLevel === "CRITICAL" ? "var(--red)" : p.progressPercent > 80 ? "var(--lime)" : "var(--amber)",
        budgetPct: p.progressPercent,
        budgetUsed: fmtMoney(budgetUsed),
        budgetTotal: fmtMoney(p.budgetCents),
        nextMilestone: "—",
        milestoneUrgent: false,
      };
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
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => onNavigate?.("projectBrief")}>+ New Project Brief</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Active Projects", value: String(displayProjects.filter(p => p.tab === "Active").length), color: "statCardAccent" },
          { label: "Avg Health Score", value: displayProjects.length > 0 ? `${Math.round(displayProjects.reduce((sum, p) => sum + p.health, 0) / displayProjects.length)}%` : "—", color: "statCardGreen" },
          { label: "On Schedule", value: `${displayProjects.filter(p => p.tab === "Active" && !["At Risk", "Critical"].includes(p.status)).length} / ${displayProjects.filter(p => p.tab === "Active").length}`, color: "statCardAmber" },
          { label: "Total Contract Value", value: apiProjects.length > 0 ? `R ${Math.round(apiProjects.reduce((sum, p) => sum + p.budgetCents, 0) / 100).toLocaleString("en-ZA")}` : "—", color: "statCardBlue" },
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
                  <span className={cx("text11", "fw600", "rdStudioMetric", p.progress > 80 ? "rdStudioMetricPos" : "rdStudioMetricWarn")}>{p.progress}%</span>
                </div>
                <div className={cx("progressTrack")}>
                  <div className={cx("progressFill")} style={{ '--pct': `${p.progress}%` } as React.CSSProperties} />
                </div>
              </div>

              {/* Budget burn */}
              <div className={cx("mb10")}>
                <div className={cx("flexBetween", "mb4")}>
                  <span className={cx("text11", "colorMuted")}>Budget</span>
                  <span className={cx("text11", "colorMuted")}>{p.budgetUsed} of {p.budgetTotal}</span>
                </div>
                <div className={cx("mpBudgetTrack")}>
                  <div className={cx("pctFillRInherit", "dynBgColor")} style={{ '--pct': p.budgetPct, "--bg-color": p.budgetPct > 85 ? "var(--red)" : p.budgetPct > 60 ? "var(--amber)" : "var(--lime)" } as React.CSSProperties} />
                </div>
              </div>

              {/* Next milestone */}
              {p.nextMilestone !== "—" && (
                <div className={cx("flexRow", "gap6", "mb10", "alignCenter")}>
                  <div className={cx("wh6", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": p.milestoneUrgent ? "var(--amber)" : "var(--muted2)" } as React.CSSProperties} />
                  <span className={cx("text11", "colorMuted")}>Next: </span>
                  <span className={cx("text11", "fw600")}>{p.nextMilestone}</span>
                </div>
              )}

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
