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

function healthChipCls(pct: number) {
  if (pct >= 100) return "staffChipRed";
  if (pct >= 80)  return "staffChipAmber";
  return "staffChipGreen";
}

function healthValueCls(pct: number) {
  if (pct >= 100) return "colorRed";
  if (pct >= 80)  return "colorAmber";
  return "colorGreen";
}

function fillCls(pct: number) {
  if (pct >= 100) return "pbFillRed";
  if (pct >= 80)  return "pbFillAmber";
  return "pbFillGreen";
}

function fmt(n: number) {
  return `R${n.toLocaleString()}`;
}

// ── Page component ────────────────────────────────────────────────────────────

export function ProjectBudgetPage({ isActive, session }: ProjectBudgetPageProps) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void Promise.all([
      getStaffProjects(session),
      getStaffClients(session),
      getMyTasks(session),
    ]).then(([projectsResult, clientsResult, tasksResult]) => {
      if (cancelled) return;

      const projects = projectsResult.data ?? [];
      const clients  = clientsResult.data ?? [];
      const tasks    = tasksResult.data ?? [];

      const clientMap = new Map<string, StaffClient>();
      for (const c of clients) clientMap.set(c.id, c);

      const tasksByProject = new Map<string, StaffTask[]>();
      for (const t of tasks) {
        const arr = tasksByProject.get(t.projectId) ?? [];
        arr.push(t);
        tasksByProject.set(t.projectId, arr);
      }

      const items: BudgetItem[] = projects
        .filter((p) => p.budgetCents != null && p.budgetCents > 0)
        .map((p) => {
          const budget         = Math.round((p.budgetCents ?? 0) / 100);
          const spent          = Math.round(budget * (p.progressPercent / 100));
          const projectTasks   = tasksByProject.get(p.id) ?? [];
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
    }).catch((err) => {
      const msg = (err as Error)?.message ?? "Failed to load";
      setError(msg);
    }).finally(() => {
      if (!cancelled) setLoading(false);
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
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-project-budget">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-project-budget">
        <div className={cx("staffEmpty")}>
          <div className={cx("staffEmptyTitle")}>Something went wrong</div>
          <div className={cx("staffEmptyNote")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-project-budget">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Project Budget</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Budget vs. actuals for your assigned projects</p>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div className={cx("staffKpiStrip", "mb20")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Total Budget</div>
          <div className={cx("staffKpiValue")}>{fmt(totalBudget)}</div>
          <div className={cx("staffKpiSub")}>{budgetItems.length} projects</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Total Spent</div>
          <div className={cx("staffKpiValue", burnPct >= 100 ? "colorRed" : burnPct >= 80 ? "colorAmber" : "colorAccent")}>
            {fmt(totalSpent)}
          </div>
          <div className={cx("staffKpiSub")}>{burnPct}% of budget</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>On Track</div>
          <div className={cx("staffKpiValue", "colorGreen")}>{onTrack}</div>
          <div className={cx("staffKpiSub")}>{atRisk} at risk</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Over Budget</div>
          <div className={cx("staffKpiValue", overBudget > 0 ? "colorRed" : "colorGreen")}>{overBudget}</div>
          <div className={cx("staffKpiSub")}>{overBudget > 0 ? "exceeded" : "All within budget"}</div>
        </div>
      </div>

      {/* ── Budget project cards ─────────────────────────────────────────── */}
      <div className={cx("flexCol", "gap12")}>
        {budgetItems.length === 0 ? (
          <div className={cx("staffEmpty")}>
            <div className={cx("staffEmptyIcon")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={cx("staffEmptyTitle")}>No projects with budgets found.</div>
          </div>
        ) : (
          budgetItems.map((item) => {
            const spentPct  = item.budget > 0 ? Math.round((item.spent / item.budget) * 100) : 0;
            const remaining = item.budget - item.spent;
            const taskPct   = item.tasks > 0 ? Math.round((item.completedTasks / item.tasks) * 100) : 0;

            return (
              <div key={item.projectId} className={cx("staffCard")}>

                {/* Head row */}
                <div className={cx("staffSectionHd")}>
                  <div className={cx("pbCardNameCol")}>
                    <div className={cx("pbProjectName")}>{item.project}</div>
                    <div className={cx("pbClientName")}>{item.client}</div>
                  </div>
                  <span className={cx("staffChip", healthChipCls(spentPct))}>
                    {healthLabel(spentPct)}
                  </span>
                </div>

                {/* Large metric: spent vs budget */}
                <div className={cx("pbAmountsRow")}>
                  <div className={cx("staffMetricBlock", healthValueCls(spentPct))}>
                    <div className={cx("pbSpentValue")}>{fmt(item.spent)}</div>
                    <div className={cx("pbSpentOf")}>of {fmt(item.budget)}</div>
                  </div>
                  <div className={cx("staffMetricBlock", remaining < 0 ? "colorRed" : "colorGreen")}>
                    <div className={cx("pbRemainingValue")}>
                      {remaining < 0 ? fmt(Math.abs(remaining)) : fmt(remaining)}
                    </div>
                    <div className={cx("pbRemainingLabel")}>{remaining < 0 ? "over budget" : "remaining"}</div>
                  </div>
                </div>

                {/* Budget burn row */}
                <div className={cx("staffListRow", "pbBarRow")}>
                  <span className={cx("pbBarLabel")}>Budget Burn</span>
                  <div className={cx("staffBar", "pbBar")}>
                    <div
                      className={cx("staffBarFill", fillCls(spentPct))}
                      style={{ "--fill-pct": `${Math.min(spentPct, 100)}%` } as React.CSSProperties}
                    />
                  </div>
                  <span className={cx("pbBarPct", healthValueCls(spentPct))}>{spentPct}%</span>
                </div>

                {/* Task progress row */}
                <div className={cx("staffListRow", "pbBarRow")}>
                  <span className={cx("pbBarLabel")}>Tasks</span>
                  <div className={cx("staffBar", "pbBar")}>
                    <div
                      className={cx("staffBarFill", "pbFillAccent")}
                      style={{ "--fill-pct": `${taskPct}%` } as React.CSSProperties}
                    />
                  </div>
                  <span className={cx("pbBarPct", "colorAccent")}>
                    {item.completedTasks}/{item.tasks}
                  </span>
                </div>

              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
