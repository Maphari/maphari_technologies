"use client";

import { useCallback, useEffect, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getStaffClients,
  type StaffClient
} from "../../../../lib/api/staff/clients";
import {
  loadPortalOffboardingWithRefresh,
  patchPortalOffboardingTaskWithRefresh,
  type PortalOffboardingTask
} from "../../../../lib/api/portal/client-cx";

// ── Local types ───────────────────────────────────────────────────────────────

type TaskRow = {
  id: string;
  task: string;
  client: string;
  clientId: string;
  dueAt: string;
  status: "Pending" | "Done";
};

type Status = TaskRow["status"];

function isOverdue(dueAt: string, status: Status): boolean {
  if (status === "Done") return false;
  return new Date(dueAt) < new Date();
}

// ── Map API data to local shape ───────────────────────────────────────────────

function mapOffboardingTasks(
  clients: StaffClient[],
  tasksByClient: Map<string, PortalOffboardingTask[]>
): TaskRow[] {
  const rows: TaskRow[] = [];
  for (const client of clients) {
    const tasks = tasksByClient.get(client.id) ?? [];
    for (const t of tasks) {
      rows.push({
        id: t.id,
        task: t.label,
        client: client.name,
        clientId: client.id,
        dueAt: t.completedAt
          ? new Date(t.completedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
          : new Date(t.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
        status: t.status.toLowerCase() === "complete" || t.status.toLowerCase() === "done" ? "Done" : "Pending"
      });
    }
  }
  return rows;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OffboardingTasksPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const clientsResult = await getStaffClients(session);
      if (clientsResult.nextSession) saveSession(clientsResult.nextSession);
      const staffClients = clientsResult.data ?? [];

      const offResults = await Promise.all(
        staffClients.map((c) => loadPortalOffboardingWithRefresh(session, c.id))
      );

      const tasksByClient = new Map<string, PortalOffboardingTask[]>();
      staffClients.forEach((c, i) => {
        const result = offResults[i];
        if (result) {
          if (result.nextSession) saveSession(result.nextSession);
          const data = result.data ?? [];
          if (data.length > 0) tasksByClient.set(c.id, data);
        }
      });

      setTasks(mapOffboardingTasks(staffClients, tasksByClient));
    } catch {
      // keep previous state on network error
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // ── Mark done handler ───────────────────────────────────────────────────────
  const handleMarkDone = useCallback(async (task: TaskRow) => {
    if (!session) return;
    setMarking(task.id);
    try {
      const r = await patchPortalOffboardingTaskWithRefresh(
        session,
        task.clientId,
        task.id,
        { status: "complete", completedAt: new Date().toISOString() }
      );
      if (r.nextSession) saveSession(r.nextSession);
      await fetchData();
    } catch {
      // swallow
    } finally {
      setMarking(null);
    }
  }, [session, fetchData]);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const totalTasks   = tasks.length;
  const doneCount    = tasks.filter((t) => t.status === "Done").length;
  const pendingCount = tasks.filter((t) => t.status === "Pending").length;
  const overdueCount = tasks.filter((t) => isOverdue(t.dueAt, t.status)).length;
  const progress     = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const sorted = [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === "Pending" ? -1 : 1;
    const aOver = isOverdue(a.dueAt, a.status);
    const bOver = isOverdue(b.dueAt, b.status);
    if (aOver !== bOver) return aOver ? -1 : 1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading && tasks.length === 0) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-offboarding-tasks">
        <div className={cx("p24", "colorMuted", "text12", "textCenter")}>
          Loading offboarding tasks...
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-offboarding-tasks">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Offboarding Tasks</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal offboarding action items</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("obtStatGrid")}>

        <div className={cx("obtStatCard")}>
          <div className={cx("obtStatCardTop")}>
            <div className={cx("obtStatLabel")}>Tasks</div>
            <div className={cx("obtStatValue", "colorAccent")}>{totalTasks}</div>
          </div>
          <div className={cx("obtStatCardDivider")} />
          <div className={cx("obtStatCardBottom")}>
            <span className={cx("obtStatDot", "dotBgAccent")} />
            <span className={cx("obtStatMeta")}>total items</span>
          </div>
        </div>

        <div className={cx("obtStatCard")}>
          <div className={cx("obtStatCardTop")}>
            <div className={cx("obtStatLabel")}>Done</div>
            <div className={cx("obtStatValue", "colorGreen")}>{doneCount}</div>
          </div>
          <div className={cx("obtStatCardDivider")} />
          <div className={cx("obtStatCardBottom")}>
            <span className={cx("obtStatDot", "dotBgGreen")} />
            <span className={cx("obtStatMeta")}>completed</span>
          </div>
        </div>

        <div className={cx("obtStatCard")}>
          <div className={cx("obtStatCardTop")}>
            <div className={cx("obtStatLabel")}>Pending</div>
            <div className={cx("obtStatValue", pendingCount > 0 ? "colorAmber" : "colorGreen")}>{pendingCount}</div>
          </div>
          <div className={cx("obtStatCardDivider")} />
          <div className={cx("obtStatCardBottom")}>
            <span className={cx("obtStatDot", "dynBgColor")} style={{ "--bg-color": pendingCount > 0 ? "var(--amber)" : "var(--green)" } as React.CSSProperties} />
            <span className={cx("obtStatMeta")}>{pendingCount > 0 ? "still to complete" : "all done"}</span>
          </div>
        </div>

        <div className={cx("obtStatCard")}>
          <div className={cx("obtStatCardTop")}>
            <div className={cx("obtStatLabel")}>Overdue</div>
            <div className={cx("obtStatValue", overdueCount > 0 ? "colorRed" : "colorGreen")}>{overdueCount}</div>
          </div>
          <div className={cx("obtStatCardDivider")} />
          <div className={cx("obtStatCardBottom")}>
            <span className={cx("obtStatDot", "dynBgColor")} style={{ "--bg-color": overdueCount > 0 ? "var(--red)" : "var(--green)" } as React.CSSProperties} />
            <span className={cx("obtStatMeta")}>{overdueCount > 0 ? "past due date" : "on track"}</span>
          </div>
        </div>

      </div>

      {/* ── Task checklist ────────────────────────────────────────────────── */}
      <div className={cx("obtSection")}>

        <div className={cx("obtSectionHeader")}>
          <div className={cx("obtSectionTitle")}>Offboarding Checklist</div>
          <span className={cx("obtSectionMeta")}>{tasks.length} TASKS</span>
        </div>

        {/* Progress bar */}
        <div className={cx("obtProgressWrap")}>
          <div className={cx("obtProgressMeta")}>
            <span className={cx("obtProgressLabel")}>Overall Progress</span>
            <span className={cx("obtProgressPct", doneCount === totalTasks ? "colorGreen" : "colorAccent")}>{progress}%</span>
          </div>
          <div className={cx("obtProgressTrack")}>
            <div className={cx("obtProgressFill")} style={{ '--pct': `${progress}%` } as React.CSSProperties} />
          </div>
        </div>

        {/* Empty state */}
        {sorted.length === 0 && !loading ? (
          <div className={cx("p24", "colorMuted", "text12", "textCenter")}>
            No offboarding tasks found.
          </div>
        ) : null}

        {/* Task list */}
        <div className={cx("obtTaskList")}>
          {sorted.map((t, idx) => {
            const over = isOverdue(t.dueAt, t.status);
            const done = t.status === "Done";
            const isMarking = marking === t.id;
            return (
              <div
                key={t.id}
                className={cx(
                  "obtTaskRow",
                  done && "obtTaskRowDone",
                  over && "obtTaskRowOverdue",
                  idx === sorted.length - 1 && "obtTaskRowLast",
                )}
              >
                {/* Checkbox — clickable to mark done */}
                <span
                  className={cx("obtCheckbox", done && "obtCheckboxDone")}
                  onClick={!done && !isMarking ? () => void handleMarkDone(t) : undefined}
                  role={!done ? "button" : undefined}
                  tabIndex={!done ? 0 : undefined}
                  title={done ? "Completed" : isMarking ? "Saving..." : "Mark done"}
                />

                {/* Task info */}
                <div className={cx("obtTaskInfo")}>
                  <span className={cx("obtTaskName")}>{t.task}</span>
                  <span className={cx("obtTaskClient")}>{t.client}</span>
                </div>

                {/* Due date + overdue pill */}
                <div className={cx("obtDueWrap")}>
                  {over && <span className={cx("obtOverduePill")}>Overdue</span>}
                  <span className={cx("obtDueDate", over && "obtDueDateOverdue")}>{t.dueAt}</span>
                </div>

                {/* Status badge */}
                <span className={cx("obtStatusBadge", done ? "obtStatusDone" : "obtStatusPending")}>
                  {isMarking ? "Saving..." : t.status}
                </span>

              </div>
            );
          })}
        </div>

      </div>

    </section>
  );
}
