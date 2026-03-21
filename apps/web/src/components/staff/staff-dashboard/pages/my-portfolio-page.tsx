"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { StaffEmptyState, EmptyIcons } from "../empty-state";
import { getStaffProjects, type StaffProject } from "@/lib/api/staff/projects";
import { getMyTasks, type StaffTask } from "@/lib/api/staff/tasks";
import { getStaffClients, type StaffClient } from "@/lib/api/staff/clients";
import { saveSession, type AuthSession } from "@/lib/auth/session";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IcoCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IcoClock() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 3.5V6l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IcoFolder() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1.5 3.5h4l1.5 1.5H12.5v6a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

// ── Filter options ────────────────────────────────────────────────────────────

const FILTER_OPTS = [
  { value: "all",   label: "All"      },
  { value: "track", label: "On Track" },
  { value: "risk",  label: "At Risk"  },
  { value: "done",  label: "Complete" },
] as const;

type FilterValue = typeof FILTER_OPTS[number]["value"];

// ── Derived project type (enriched with task counts) ──────────────────────────

type PortfolioProject = {
  id: string;
  name: string;
  client: string;
  progress: number;
  health: "healthy" | "moderate" | "critical" | "exceeded";
  tasks: { total: number; done: number; inProgress: number };
  budget: { total: number; spent: number };
  dueAt: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
};

type Health = PortfolioProject["health"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveHealth(project: StaffProject): Health {
  if (project.progressPercent >= 100) return "healthy";
  if (project.status === "AT_RISK" || project.status === "BLOCKED") return "critical";
  if (project.status === "ON_HOLD") return "moderate";
  return "healthy";
}

function normalizePriority(p: string): "HIGH" | "MEDIUM" | "LOW" {
  const upper = p.toUpperCase();
  if (upper === "HIGH") return "HIGH";
  if (upper === "MEDIUM") return "MEDIUM";
  return "LOW";
}

function healthCfg(h: Health) {
  if (h === "healthy")  return { label: "Healthy",     chipCls: "pfChipGreen", dotCls: "pfDotGreen", fillCls: "pfFillGreen" };
  if (h === "moderate") return { label: "Moderate",    chipCls: "pfChipAmber", dotCls: "pfDotAmber", fillCls: "pfFillAmber" };
  if (h === "critical") return { label: "Critical",    chipCls: "pfChipRed",   dotCls: "pfDotRed",   fillCls: "pfFillAmber" };
  return                       { label: "Over Budget", chipCls: "pfChipRed",   dotCls: "pfDotRed",   fillCls: "pfFillRed"   };
}

function priorityCfg(p: string) {
  if (p === "HIGH")   return { cls: "pfPriorityHigh" };
  if (p === "MEDIUM") return { cls: "pfPriorityMed"  };
  return                     { cls: "pfPriorityLow"  };
}

function fmt(n: number) {
  return `R${n.toLocaleString()}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "No date";
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className={cx("pfProjectCard", "opacity45")}>
      <div className={cx("pfProjectHeader")}>
        <div className={cx("skeleBlock14x40p")} />
        <div className={cx("skeleBlock12x25p")} />
      </div>
      <div className={cx("pfCardMetrics", "mt12")}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={cx("pfMetricCell")}>
            <div className={cx("skeleBlock9x60p_r3")} />
            <div className={cx("skeleBlock16x45p")} />
          </div>
        ))}
      </div>
      <div className={cx("pfBars", "mt10")}>
        <div className={cx("skeleBarFull")} />
        <div className={cx("skeleBarFullMt8")} />
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className={cx("pfStatCard", "opacity45")}>
      <div className={cx("pfStatCardTop")}>
        <div className={cx("skeleBlock10x50p")} />
        <div className={cx("skeleBlock22x35p")} />
      </div>
      <div className={cx("pfStatCardDivider")} />
      <div className={cx("skeleBlock9x60p")} />
    </div>
  );
}

// ── Page props ────────────────────────────────────────────────────────────────

type MyPortfolioPageProps = {
  isActive: boolean;
  session: AuthSession | null;
};

// ── Page component ────────────────────────────────────────────────────────────

export function MyPortfolioPage({ isActive, session }: MyPortfolioPageProps) {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const [projectsResult, tasksResult, clientsResult] = await Promise.all([
          getStaffProjects(session),
          getMyTasks(session),
          getStaffClients(session),
        ]);

        if (cancelled) return;

        // Persist refreshed sessions
        if (projectsResult.nextSession) saveSession(projectsResult.nextSession);
        if (tasksResult.nextSession) saveSession(tasksResult.nextSession);
        if (clientsResult.nextSession) saveSession(clientsResult.nextSession);

        const rawProjects = projectsResult.data ?? [];
        const rawTasks = tasksResult.data ?? [];
        const rawClients = clientsResult.data ?? [];

        // Build client lookup
        const clientMap = new Map<string, StaffClient>();
        for (const c of rawClients) clientMap.set(c.id, c);

        // Group tasks by projectId
        const tasksByProject = new Map<string, StaffTask[]>();
        for (const t of rawTasks) {
          const list = tasksByProject.get(t.projectId) ?? [];
          list.push(t);
          tasksByProject.set(t.projectId, list);
        }

        // Build portfolio projects
        const portfolio: PortfolioProject[] = rawProjects.map((p) => {
          const projectTasks = tasksByProject.get(p.id) ?? [];
          const doneTasks = projectTasks.filter((t) => t.status === "DONE").length;
          const inProgressTasks = projectTasks.filter((t) => t.status === "IN_PROGRESS").length;
          const budgetTotal = (p.budgetCents ?? 0) / 100;

          // Estimate spent as proportional to progress (best effort without dedicated spend endpoint)
          const budgetSpent = budgetTotal > 0 ? Math.round(budgetTotal * (p.progressPercent / 100)) : 0;

          return {
            id: p.id,
            name: p.name,
            client: clientMap.get(p.clientId)?.name ?? "Unknown Client",
            progress: p.progressPercent,
            health: deriveHealth(p),
            tasks: { total: projectTasks.length, done: doneTasks, inProgress: inProgressTasks },
            budget: { total: budgetTotal, spent: budgetSpent },
            dueAt: formatDate(p.dueAt),
            priority: normalizePriority(p.priority),
          };
        });

        setProjects(portfolio);
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message ?? "Failed to load data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  const filtered = projects.filter((project) => {
    if (filter === "track") return project.health === "healthy";
    if (filter === "risk")  return project.health === "critical" || project.health === "exceeded";
    if (filter === "done")  return project.progress === 100;
    return true;
  });

  const totalTasks  = projects.reduce((s, p) => s + p.tasks.total, 0);
  const doneTasks   = projects.reduce((s, p) => s + p.tasks.done,  0);
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;
  const atRisk      = projects.filter((p) => p.health === "critical" || p.health === "exceeded").length;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-portfolio">
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
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-portfolio">
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-portfolio">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Project Management</div>
        <h1 className={cx("pageTitleText")}>My Portfolio</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Aggregated view of all your assigned projects</p>
      </div>

      {/* ── Summary strip ────────────────────────────────────────────────── */}
      <div className={cx("staffKpiStrip", "mb20")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Projects</div>
          <div className={cx("staffKpiValue", "colorAccent")}>{projects.length}</div>
          <div className={cx("staffKpiSub")}>assigned to you</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Avg Progress</div>
          <div className={cx("staffKpiValue", "colorGreen")}>{avgProgress}%</div>
          <div className={cx("staffKpiSub")}>across all projects</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Tasks Done</div>
          <div className={cx("staffKpiValue")}>{doneTasks}<span style={{ fontSize: "0.7em", opacity: 0.6 }}>/{totalTasks}</span></div>
          <div className={cx("staffKpiSub")}>completed tasks</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>At Risk</div>
          <div className={cx("staffKpiValue", atRisk > 0 ? "colorRed" : "colorGreen")}>{atRisk}</div>
          <div className={cx("staffKpiSub")}>{atRisk > 0 ? "needs attention" : "all clear"}</div>
        </div>
      </div>

      {/* ── Project list section ──────────────────────────────────────────── */}
      <div className={cx("pfSection")}>

        {/* Filter header */}
        <div className={cx("pfSectionHeader")}>
          <div className={cx("pfFilterRow")}>
            {FILTER_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cx("pfFilterPill", filter === opt.value ? "pfFilterPillActive" : "pfFilterPillIdle")}
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
            <span className={cx("pfFilterCount")}>
              <span className={cx("inlineFlex", "gap5")}>
                <IcoFolder />{filtered.length} project{filtered.length !== 1 ? "s" : ""}
              </span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className={cx("pfCardList")}>
          {filtered.length === 0 ? (
            <StaffEmptyState icon={EmptyIcons.building} title={projects.length === 0 ? "No projects assigned" : "No projects match this filter"} sub={projects.length === 0 ? "Projects assigned to you will appear here." : "Try a different filter tab."} />
          ) : (
            filtered.map((project) => {
              const health = healthCfg(project.health);
              const priority = priorityCfg(project.priority);
              const budgetPct = project.budget.total > 0 ? Math.round((project.budget.spent / project.budget.total) * 100) : 0;
              const budgetRemaining = project.budget.total - project.budget.spent;

              return (
                <div key={project.id} className={cx("pfProjectCard")}>

                  {/* ── Header ── */}
                  <div className={cx("pfProjectHeader")}>
                    <div className={cx("pfProjectLeft")}>
                      <span className={cx("pfHealthDot", health.dotCls)} />
                      <div>
                        <div className={cx("pfProjectName")}>{project.name}</div>
                        <div className={cx("pfProjectMeta")}>{project.client} · Due {project.dueAt}</div>
                      </div>
                    </div>
                    <div className={cx("pfProjectBadges")}>
                      <span className={cx("pfPriorityChip", priority.cls)}>{project.priority}</span>
                      <span className={cx("pfHealthChip", health.chipCls)}>{health.label}</span>
                    </div>
                  </div>

                  {/* ── Metrics strip ── */}
                  <div className={cx("pfCardMetrics")}>
                    <div className={cx("pfMetricCell")}>
                      <div className={cx("pfMetricLabel")}>Budget</div>
                      <div className={cx("pfMetricValue")}>{fmt(project.budget.total)}</div>
                    </div>
                    <div className={cx("pfMetricCell")}>
                      <div className={cx("pfMetricLabel")}>Spent</div>
                      <div className={cx("pfMetricValue", budgetPct >= 100 ? "colorRed" : budgetPct >= 80 ? "colorAmber" : "colorAccent")}>
                        {fmt(project.budget.spent)}
                      </div>
                    </div>
                    <div className={cx("pfMetricCell")}>
                      <div className={cx("pfMetricLabel")}>Remaining</div>
                      <div className={cx("pfMetricValue", budgetRemaining < 0 ? "colorRed" : "colorGreen")}>
                        {budgetRemaining < 0 ? `-${fmt(Math.abs(budgetRemaining))}` : fmt(budgetRemaining)}
                      </div>
                    </div>
                    <div className={cx("pfMetricCell")}>
                      <div className={cx("pfMetricLabel")}>Tasks</div>
                      <div className={cx("pfMetricValue")}>
                        {project.tasks.done}<span className={cx("pfStatSuffix")}>/{project.tasks.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Progress bars ── */}
                  <div className={cx("pfBars")}>
                    <div className={cx("pfBarRow")}>
                      <div className={cx("pfBarMeta")}>
                        <span className={cx("pfBarLabel")}>Task Progress</span>
                        <span className={cx("pfBarPct")}>{project.progress}%</span>
                      </div>
                      <div className={cx("pfProgressTrack")}>
                        <div className={cx("pfProgressFill", health.fillCls)} style={{ '--pct': `${project.progress}%` } as React.CSSProperties} />
                      </div>
                    </div>
                    <div className={cx("pfBarRow")}>
                      <div className={cx("pfBarMeta")}>
                        <span className={cx("pfBarLabel")}>Budget Burn</span>
                        <span className={cx("pfBarPct", budgetPct >= 100 ? "colorRed" : budgetPct >= 80 ? "colorAmber" : "colorGreen")}>
                          {budgetPct}%
                        </span>
                      </div>
                      <div className={cx("pfProgressTrack")}>
                        <div
                          className={cx("pfProgressFill", budgetPct >= 100 ? "pfFillRed" : budgetPct >= 80 ? "pfFillAmber" : "pfFillGreen")} style={{ '--pct': `${Math.min(budgetPct, 100)}%` } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Footer: task pills ── */}
                  <div className={cx("pfProjectFooter")}>
                    <div className={cx("pfTaskPills")}>
                      <span className={cx("pfTaskChip", "pfTaskDone")}>
                        <span className={cx("inlineFlex", "gap4")}>
                          <IcoCheck /> {project.tasks.done} done
                        </span>
                      </span>
                      <span className={cx("pfTaskChip", "pfTaskActive")}>
                        <span className={cx("inlineFlex", "gap4")}>
                          <IcoClock /> {project.tasks.inProgress} active
                        </span>
                      </span>
                      <span className={cx("pfTaskChip", "pfTaskTotal")}>
                        {project.tasks.total} total
                      </span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </section>
  );
}
