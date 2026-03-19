// ════════════════════════════════════════════════════════════════════════════
// project-budget-page.tsx — Staff Project Budget Overview
// Data : GET /staff/projects       → StaffProject[]
//        GET /staff/clients        → StaffClient[]
//        GET /staff/tasks          → StaffTask[]
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { getStaffProjects, type StaffProject } from "../../../../lib/api/staff/projects";
import { getStaffClients, type StaffClient } from "../../../../lib/api/staff/clients";
import { getMyTasks, type StaffTask } from "../../../../lib/api/staff/tasks";
import type { AuthSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type ProjectBudgetPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Derived budget item ───────────────────────────────────────────────────────

type BudgetItem = {
  project: string;
  projectId: string;
  client: string;
  budget: number;
  spent: number;
  tasks: number;
  completedTasks: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function healthLabel(pct: number) {
  if (pct >= 100) return "Over Budget";
  if (pct >= 80)  return "At Risk";
  return "On Track";
}

function healthBadgeCls(pct: number) {
  if (pct >= 100) return "pbHealthRed";
  if (pct >= 80)  return "pbHealthAmber";
  return "pbHealthGreen";
}

function healthValueCls(pct: number) {
  if (pct >= 100) return "colorRed";
  if (pct >= 80)  return "colorAmber";
  return "colorGreen";
}

function progressFillTone(pct: number) {
  if (pct >= 100) return "progressFillRed";
  if (pct >= 80)  return "progressFillAmber";
  return "progressFillGreen";
}

function fmt(n: number) {
  return `R${n.toLocaleString()}`;
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className={cx("pbStatCard", "opacity50")}>
      <div className={cx("pbStatCardTop")}>
        <div className={cx("skeleBlock10x50p")} />
        <div className={cx("skeleBlock22x35p")} />
      </div>
      <div className={cx("pbStatCardDivider")} />
      <div className={cx("skeleBlock9x60p")} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={cx("pbCard", "opacity40")}>
      <div className={cx("pbCardHead")}>
        <div>
          <div className={cx("skeleBlock14x180px")} />
          <div className={cx("skeleBlock10x100px")} />
        </div>
        <div className={cx("skeleBlock14x100px")} />
      </div>
      <div className={cx("pbBars")}>
        <div className={cx("pbBarRow")}>
          <div className={cx("skeleBlock8xFull")} />
        </div>
      </div>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function ProjectBudgetPage({ isActive, session }: ProjectBudgetPageProps) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;

    setLoading(true);
    void Promise.all([
      getStaffProjects(session),
      getStaffClients(session),
      getMyTasks(session),
    ]).then(([projectsResult, clientsResult, tasksResult]) => {
      if (cancelled) return;

      const projects = projectsResult.data ?? [];
      const clients  = clientsResult.data ?? [];
      const tasks    = tasksResult.data ?? [];

      // Build client lookup
      const clientMap = new Map<string, StaffClient>();
      for (const c of clients) clientMap.set(c.id, c);

      // Group tasks by project
      const tasksByProject = new Map<string, StaffTask[]>();
      for (const t of tasks) {
        const arr = tasksByProject.get(t.projectId) ?? [];
        arr.push(t);
        tasksByProject.set(t.projectId, arr);
      }

      // Build budget items from projects that have a budget
      const items: BudgetItem[] = projects
        .filter((p) => p.budgetCents != null && p.budgetCents > 0)
        .map((p) => {
          const budget = Math.round((p.budgetCents ?? 0) / 100);
          // Derive spent from progress percentage as a reasonable approximation
          const spent = Math.round(budget * (p.progressPercent / 100));
          const projectTasks = tasksByProject.get(p.id) ?? [];
          const completedTasks = projectTasks.filter((t) => t.status === "DONE").length;

          return {
            project: p.name,
            projectId: p.id,
            client: clientMap.get(p.clientId)?.name ?? "Unknown Client",
            budget,
            spent,
            tasks: projectTasks.length,
            completedTasks,
          };
        });

      setBudgetItems(items);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  const totalBudget = budgetItems.reduce((s, i) => s + i.budget, 0);
  const totalSpent  = budgetItems.reduce((s, i) => s + i.spent,  0);
  const onTrack     = budgetItems.filter((i) => i.budget > 0 && (i.spent / i.budget) * 100 < 80).length;
  const atRisk      = budgetItems.filter((i) => { const p = i.budget > 0 ? (i.spent / i.budget) * 100 : 0; return p >= 80 && p < 100; }).length;
  const overBudget  = budgetItems.filter((i) => i.spent > i.budget).length;
  const burnPct     = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-project-budget">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Project Budget</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Budget vs. actuals for your assigned projects</p>
      </div>

      {/* ── Summary stat cards ──────────────────────────────────────────── */}
      <div className={cx("pbStatGrid")}>

            {/* Total Budget */}
            <div className={cx("pbStatCard")}>
              <div className={cx("pbStatCardTop")}>
                <div className={cx("pbStatLabel")}>Total Budget</div>
                <div className={cx("pbStatValue")}>{fmt(totalBudget)}</div>
              </div>
              <div className={cx("pbStatCardDivider")} />
              <div className={cx("pbStatCardBottom")}>
                <span className={cx("pbStatDot", "dotBgMuted2")} />
                <span className={cx("pbStatMeta")}>{budgetItems.length} active projects</span>
              </div>
            </div>

            {/* Total Spent */}
            <div className={cx("pbStatCard")}>
              <div className={cx("pbStatCardTop")}>
                <div className={cx("pbStatLabel")}>Total Spent</div>
                <div className={cx("pbStatValue", burnPct >= 100 ? "colorRed" : burnPct >= 80 ? "colorAmber" : "colorAccent")}>
                  {fmt(totalSpent)}
                </div>
              </div>
              <div className={cx("pbStatCardDivider")} />
              <div className={cx("pbStatCardBottom")}>
                <span className={cx("pbStatDot", "dotBgAccent")} />
                <span className={cx("pbStatMeta")}>{burnPct}% of total budget</span>
              </div>
            </div>

            {/* On Track */}
            <div className={cx("pbStatCard")}>
              <div className={cx("pbStatCardTop")}>
                <div className={cx("pbStatLabel")}>On Track</div>
                <div className={cx("pbStatValue", "colorGreen")}>{onTrack}</div>
              </div>
              <div className={cx("pbStatCardDivider")} />
              <div className={cx("pbStatCardBottom")}>
                <span className={cx("pbStatDot", "dotBgGreen")} />
                <span className={cx("pbStatMeta")}>{atRisk} at risk</span>
              </div>
            </div>

            {/* Over Budget */}
            <div className={cx("pbStatCard")}>
              <div className={cx("pbStatCardTop")}>
                <div className={cx("pbStatLabel")}>Over Budget</div>
                <div className={cx("pbStatValue", overBudget > 0 ? "colorRed" : "colorMuted")}>{overBudget}</div>
              </div>
              <div className={cx("pbStatCardDivider")} />
              <div className={cx("pbStatCardBottom")}>
                <span className={cx("pbStatDot", "dynBgColor")} style={{ "--bg-color": overBudget > 0 ? "var(--red)" : "var(--muted2)" } as React.CSSProperties} />
                <span className={cx("pbStatMeta")}>
                  {overBudget > 0 ? `${overBudget} project${overBudget !== 1 ? "s" : ""} exceeded` : "All within budget"}
                </span>
              </div>
            </div>

      </div>

      {/* ── Budget project cards ─────────────────────────────────────────── */}
      <div className={cx("flexCol", "gap12")}>
        {budgetItems.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={cx("emptyStateTitle")}>No projects with budgets found.</div>
          </div>
        ) : (
          budgetItems.map((item) => {
            const spentPct  = item.budget > 0 ? Math.round((item.spent / item.budget) * 100) : 0;
            const remaining = item.budget - item.spent;
            const taskPct   = item.tasks > 0 ? Math.round((item.completedTasks / item.tasks) * 100) : 0;

            return (
              <div key={item.projectId} className={cx("pbCard")}>

                {/* ── Head row ── */}
                <div className={cx("pbCardHead")}>
                  {/* Left: project info + badge */}
                  <div>
                    <div className={cx("pbCardNameRow")}>
                      <div className={cx("pbProjectName")}>{item.project}</div>
                      <span className={cx("pbHealthBadge", healthBadgeCls(spentPct))}>
                        {healthLabel(spentPct)}
                      </span>
                    </div>
                    <div className={cx("pbClientName")}>{item.client}</div>
                  </div>

                  {/* Right: amounts */}
                  <div className={cx("pbAmounts")}>
                    <div className={cx("pbSpent", healthValueCls(spentPct))}>{fmt(item.spent)}</div>
                    <div className={cx("pbBudgetOf")}>of {fmt(item.budget)} budget</div>
                    <div className={cx("pbRemaining", remaining < 0 ? "colorRed" : "colorGreen")}>
                      {remaining < 0
                        ? `${fmt(Math.abs(remaining))} over`
                        : `${fmt(remaining)} remaining`}
                    </div>
                  </div>
                </div>

                {/* ── Progress bars ── */}
                <div className={cx("pbBars")}>

                  {/* Budget burn */}
                  <div className={cx("pbBarRow")}>
                    <div className={cx("pbBarMeta")}>
                      <span className={cx("pbBarLabel")}>Budget Burn</span>
                      <span className={cx("pbBarPct", healthValueCls(spentPct))}>{spentPct}%</span>
                    </div>
                    <div className={cx("progressTrack")}>
                      <div
                        className={cx("progressFill", progressFillTone(spentPct))}
                        style={{ '--pct': `${Math.min(spentPct, 100)}%` } as React.CSSProperties}
                      />
                    </div>
                  </div>

                  {/* Task progress */}
                  <div className={cx("pbBarRow")}>
                    <div className={cx("pbBarMeta")}>
                      <span className={cx("pbBarLabel")}>Task Progress</span>
                      <span className={cx("pbBarPct", "colorAccent")}>{item.completedTasks}/{item.tasks} tasks ({taskPct}%)</span>
                    </div>
                    <div className={cx("progressTrack")}>
                      <div
                        className={cx("progressFill", "progressFillAccent")} style={{ '--pct': `${taskPct}%` } as React.CSSProperties}
                      />
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
