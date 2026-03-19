// ════════════════════════════════════════════════════════════════════════════
// sprint-board-admin-page.tsx — Admin sprint board wired to real API
// Data   : GET /projects  →  project selector
//          GET /projects/:id/sprints  →  sprint list per project
//          GET /projects/:id/sprints/:sid/tasks  →  tasks for active sprint
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminProject, ProjectTask } from "../../../../lib/api/admin/types";
import type { ProjectSprint } from "../../../../lib/api/admin/project-layer";
import {
  getSprints,
} from "../../../../lib/api/admin/project-layer";
import {
  loadAdminSnapshotWithRefresh,
} from "../../../../lib/api/admin/clients";
import {
  callGateway,
  withAuthorizedSession,
  isUnauthorized,
  toGatewayError,
} from "../../../../lib/api/admin/_shared";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "active" | "backlog" | "completed";

// ── Helpers ───────────────────────────────────────────────────────────────────
function sprintStatusBadge(status: string): string {
  const s = status.toLowerCase();
  if (s === "active" || s === "on track") return "badgeGreen";
  if (s === "at risk" || s === "at_risk") return "badgeAmber";
  return "badgeRed";
}

function progressBarClass(progress: number): string {
  if (progress >= 75) return "statBarAccent";
  if (progress >= 40) return "statBarAmber";
  return "statBarRed";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Inline loader for sprint tasks — endpoint: GET /projects/:id/sprints/:sid/tasks
async function loadSprintTasks(
  session: AuthSession,
  projectId: string,
  sprintId: string
): Promise<{ data: ProjectTask[] | null; nextSession: AuthSession | null; error: { code: string; message: string } | null }> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectTask[]>(
      `/projects/${projectId}/sprints/${sprintId}/tasks`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "SPRINT_TASKS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load sprint tasks."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

const tabs: Tab[] = ["active", "backlog", "completed"];

// ── Component ─────────────────────────────────────────────────────────────────
export function SprintBoardAdminPage({ session, onNotify }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [sprints, setSprints] = useState<ProjectSprint[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load project list ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void (async () => {
      const r = await loadAdminSnapshotWithRefresh(session);
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { onNotify("error", r.error.message); return; }
      const list = r.data?.projects ?? [];
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) setSelectedProjectId(list[0].id);
    })();
    return () => { cancelled = true; };
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load sprints for selected project ─────────────────────────────────────
  const loadSprints = useCallback(async () => {
    if (!session || !selectedProjectId) return;
    setLoading(true);
    setSprints([]);
    setTasks([]);
    const r = await getSprints(session, selectedProjectId);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) { onNotify("error", r.error.message); setLoading(false); return; }
    const sprintList = r.data ?? [];
    setSprints(sprintList);

    // Load tasks for the first active sprint
    const activeSprint = sprintList.find((s) => s.status.toLowerCase() === "active");
    if (activeSprint) {
      const tr = await loadSprintTasks(session, selectedProjectId, activeSprint.id);
      if (tr.nextSession) saveSession(tr.nextSession);
      if (!tr.error) setTasks(tr.data ?? []);
    }
    setLoading(false);
  }, [session, selectedProjectId, onNotify]);

  useEffect(() => { void loadSprints(); }, [loadSprints]);

  // ── Derived KPIs ──────────────────────────────────────────────────────────
  const activeSprints = sprints.filter((s) => s.status.toLowerCase() === "active");
  const overdueTasks = sprints.reduce((sum, s) => sum + s.overdueTasks, 0);
  const completedTasks = sprints.reduce((sum, s) => sum + s.completedTasks, 0);
  const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;

  const tabSprints = sprints.filter((s) => {
    const st = s.status.toLowerCase();
    if (activeTab === "active") return st === "active";
    if (activeTab === "backlog") return st === "planned" || st === "backlog" || st === "pending";
    return st === "completed" || st === "done";
  });

  const todoTasks = tasks.filter((t) => t.status === "TODO");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((t) => t.status === "DONE");

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
    <div className={cx(styles.pageBody)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / OPERATIONS</div>
          <h1 className={styles.pageTitle}>Sprint Board</h1>
          <div className={styles.pageSub}>Track active sprints, task progress, and delivery risk across all clients</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ New Sprint</button>
        </div>
      </div>

      {/* ── Project selector ── */}
      {projects.length > 0 && (
        <div className={cx("mb16")}>
          <select
            title="Select project"
            className={styles.filterSelect}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── KPI Grid ── */}
      <div className={styles.cjKpiGrid}>
        {[
          { label: "Active Sprints", value: String(activeSprints.length), sub: "In progress", color: "var(--accent)" },
          { label: "Tasks Overdue", value: String(overdueTasks), sub: "Need attention", color: "var(--red)" },
          { label: "Completed Tasks", value: String(completedTasks), sub: "Tasks done", color: "var(--blue)" },
          { label: "Blocked", value: String(blockedCount), sub: "Awaiting unblock", color: "var(--amber)" },
        ].map((k) => (
          <div key={k.label} className={cx(styles.cjKpiCard, toneClass(k.color))}>
            <div className={styles.cjKpiLabel}>{k.label}</div>
            <div className={cx(styles.cjKpiValue, toneClass(k.color))}>{k.value}</div>
            <div className={styles.cjKpiMeta}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className={styles.teamFilters}>
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={cx("btnSm", activeTab === t ? "btnAccent" : "btnGhost")}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Sprint cards grid ── */}
      {activeTab === "active" && (
        <>
          {tabSprints.length === 0 ? (
            <div className={styles.teamSection}>
              <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No active sprints for this project.</div>
            </div>
          ) : (
            <div className={cx("grid2", "gap16")}>
              {tabSprints.map((sp) => (
                <div key={sp.id} className={cx(styles.card, styles.spbCard)}>
                  <div className={styles.cardInner}>
                    <div className={cx("flexBetween", "mb8")}>
                      <div>
                        <div className={cx("fw700", "text13", "mb2")}>{sp.name}</div>
                        <div className={cx("text11", "colorMuted")}>{sp.ownerName ?? "—"}</div>
                      </div>
                      <span className={cx("badge", sprintStatusBadge(sp.status))}>{sp.status}</span>
                    </div>
                    <div className={cx("flexRow", "gap12", "mb12", "text11", "colorMuted")}>
                      <span className={cx("fontMono")}>{formatDate(sp.startAt)} → {formatDate(sp.endAt)}</span>
                    </div>
                    {/* Progress bar */}
                    <div className={cx("mb8")}>
                      <div className={cx("flexBetween", "mb4")}>
                        <span className={cx("text10", "colorMuted", "fontMono")}>Progress</span>
                        <span className={cx("text10", "fontMono", "fw700")}>{sp.progressPercent}%</span>
                      </div>
                      <div className={styles.statBarBg}>
                        <div className={cx(styles.statBarFill, progressBarClass(sp.progressPercent))} style={{ "--pct": `${sp.progressPercent}%` } as CSSProperties} />
                      </div>
                    </div>
                    <div className={cx("flexRow", "gap16", "text11", "colorMuted", "mt8")}>
                      <span>{sp.completedTasks}/{sp.totalTasks} tasks done</span>
                      {sp.overdueTasks > 0 && <span className={cx("colorRed")}>{sp.overdueTasks} overdue</span>}
                    </div>
                    <div className={cx("mt12", "flexRow", "gap8")}>
                      <button type="button" className={cx("btnSm", "btnGhost", "flex1")}>View Sprint</button>
                      <button type="button" className={cx("btnSm", "btnAccent", "flex1")}>Update</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Kanban task columns for active sprint ── */}
          {tasks.length > 0 && (
            <div className={cx("grid3", "gap16", "mt20")}>
              {[
                { label: "To Do", items: todoTasks, badge: "badgeMuted" },
                { label: "In Progress", items: inProgressTasks, badge: "badgeAmber" },
                { label: "Done", items: doneTasks, badge: "badgeGreen" },
              ].map((col) => (
                <div key={col.label} className={styles.teamSection}>
                  <div className={styles.teamSectionHeader}>
                    <span className={styles.teamSectionTitle}>{col.label}</span>
                    <span className={cx("badge", col.badge)}>{col.items.length}</span>
                  </div>
                  {col.items.length === 0 ? (
                    <div className={cx("p12", "colorMuted", "text11")}>No tasks</div>
                  ) : (
                    col.items.map((task) => (
                      <div key={task.id} className={cx(styles.card, "mb8")}>
                        <div className={styles.cardInner}>
                          <div className={cx("text12", "fw600", "mb4")}>{task.title}</div>
                          {task.assigneeName && (
                            <div className={cx("text10", "colorMuted")}>{task.assigneeName}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab !== "active" && (
        <div className={styles.teamSection}>
          <div className={styles.teamSectionHeader}>
            <span className={styles.teamSectionTitle}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            <span className={styles.teamSectionMeta}>{tabSprints.length} SPRINTS</span>
          </div>
          {tabSprints.length === 0 ? (
            <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No sprints in this view.</div>
          ) : (
            tabSprints.map((sp) => (
              <div key={sp.id} className={cx(styles.card, styles.spbCard, "mb8")}>
                <div className={styles.cardInner}>
                  <div className={cx("flexBetween")}>
                    <div className={cx("fw600", "text13")}>{sp.name}</div>
                    <span className={cx("badge", sprintStatusBadge(sp.status))}>{sp.status}</span>
                  </div>
                  <div className={cx("text11", "colorMuted", "mt4")}>
                    {formatDate(sp.startAt)} → {formatDate(sp.endAt)} · {sp.completedTasks}/{sp.totalTasks} tasks
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
