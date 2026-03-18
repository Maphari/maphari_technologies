"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getMyTasks,
  type StaffTask
} from "../../../../lib/api/staff/tasks";
import {
  getStaffProjects,
  type StaffProject
} from "../../../../lib/api/staff/projects";
import { cx } from "../style";

type Status = "done" | "in_progress" | "in_revision" | "awaiting_approval" | "not_started";

type ClientRow = {
  id: string;
  name: string;
  avatar: string;
};

type TaskRow = {
  id: string;
  clientId: string;
  title: string;
  status: Status;
  due: string;
  blockedBy: string[];
  blocking: string[];
};

const statusConfig: Record<Status, { label: string; icon: string }> = {
  done: { label: "Done", icon: "\u2713" },
  in_progress: { label: "In Progress", icon: "\u25CF" },
  in_revision: { label: "In Revision", icon: "\u21BB" },
  awaiting_approval: { label: "Awaiting Approval", icon: "\u25CE" },
  not_started: { label: "Not Started", icon: "\u25CB" }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapApiStatus(raw: string): Status {
  switch (raw) {
    case "DONE":
      return "done";
    case "IN_PROGRESS":
      return "in_progress";
    case "BLOCKED":
      return "not_started"; // blocked tasks treated as not yet startable
    default:
      return "not_started";
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "TBD";
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function getInitial(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buildDependencyLinks(
  tasks: StaffTask[],
  projectId: string
): { blockedByMap: Map<string, string[]>; blockingMap: Map<string, string[]> } {
  // Since the API doesn't expose explicit dependency edges, we infer:
  // BLOCKED tasks depend on IN_PROGRESS tasks in the same project.
  const blockedByMap = new Map<string, string[]>();
  const blockingMap = new Map<string, string[]>();

  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const blockedTasks = projectTasks.filter((t) => t.status === "BLOCKED");
  const inProgressTasks = projectTasks.filter((t) => t.status === "IN_PROGRESS");

  for (const bt of blockedTasks) {
    const deps = inProgressTasks.map((ip) => ip.id);
    blockedByMap.set(bt.id, deps);
    for (const ip of inProgressTasks) {
      const existing = blockingMap.get(ip.id) ?? [];
      existing.push(bt.id);
      blockingMap.set(ip.id, existing);
    }
  }

  return { blockedByMap, blockingMap };
}

// ── Component ─────────────────────────────────────────────────────────────────

type PageProps = {
  isActive: boolean;
  session: AuthSession | null;
};

export function TaskDependenciesPage({ isActive, session }: PageProps) {
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [selected, setSelected] = useState<TaskRow | null>(null);
  const [highlight, setHighlight] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [allTasks, setAllTasks] = useState<TaskRow[]>([]);

  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // Fetch projects to build client rows
      const projectsResult = await getStaffProjects(session);
      if (cancelled) return;
      if (projectsResult.nextSession) saveSession(projectsResult.nextSession);

      const projects: StaffProject[] = projectsResult.data ?? [];

      // Fetch tasks
      const tasksResult = await getMyTasks(projectsResult.nextSession ?? session);
      if (cancelled) return;
      if (tasksResult.nextSession) saveSession(tasksResult.nextSession);

      const apiTasks: StaffTask[] = tasksResult.data ?? [];

      // Build unique client rows from projects
      const clientMap = new Map<string, ClientRow>();
      for (const p of projects) {
        if (!clientMap.has(p.clientId)) {
          const name = p.ownerName ?? p.name;
          clientMap.set(p.clientId, {
            id: p.clientId,
            name,
            avatar: getInitial(name)
          });
        }
      }

      // Build task rows with inferred dependency links
      const projectIdToClientId = new Map(projects.map((p) => [p.id, p.clientId]));
      const uniqueProjectIds = [...new Set(apiTasks.map((t) => t.projectId))];

      const allBlockedByMap = new Map<string, string[]>();
      const allBlockingMap = new Map<string, string[]>();

      for (const pid of uniqueProjectIds) {
        const { blockedByMap, blockingMap } = buildDependencyLinks(apiTasks, pid);
        for (const [k, v] of blockedByMap) allBlockedByMap.set(k, v);
        for (const [k, v] of blockingMap) allBlockingMap.set(k, v);
      }

      const taskRows: TaskRow[] = apiTasks.map((t) => ({
        id: t.id,
        clientId: projectIdToClientId.get(t.projectId) ?? t.projectId,
        title: t.title,
        status: mapApiStatus(t.status),
        due: formatDate(t.dueAt),
        blockedBy: allBlockedByMap.get(t.id) ?? [],
        blocking: allBlockingMap.get(t.id) ?? []
      }));

      setClients(Array.from(clientMap.values()));
      setAllTasks(taskRows);
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  // ── Derived lookups ───────────────────────────────────────────────────────
  const taskById = useMemo(() => new Map(allTasks.map((task) => [task.id, task])), [allTasks]);

  function isBlocked(task: TaskRow) {
    return task.blockedBy.some((depId) => {
      const dep = taskById.get(depId);
      return dep ? dep.status !== "done" : false;
    });
  }

  function getDepth(taskId: string, memo: Record<string, number> = {}) {
    if (memo[taskId] !== undefined) return memo[taskId];
    const task = taskById.get(taskId);
    if (!task || task.blockedBy.length === 0) {
      memo[taskId] = 0;
      return 0;
    }
    const maxParent = Math.max(...task.blockedBy.map((parentId) => getDepth(parentId, memo)));
    memo[taskId] = maxParent + 1;
    return maxParent + 1;
  }

  const filteredClients = clientFilter === "all" ? clients : clients.filter((client) => client.id === clientFilter);

  const getRelated = (task: TaskRow) => {
    const ids = new Set<string>([task.id, ...task.blockedBy, ...task.blocking]);
    task.blockedBy.forEach((parentId) => {
      const parent = taskById.get(parentId);
      if (parent) parent.blockedBy.forEach((id) => ids.add(id));
    });
    task.blocking.forEach((childId) => {
      const child = taskById.get(childId);
      if (child) child.blocking.forEach((id) => ids.add(id));
    });
    return [...ids];
  };

  const handleSelect = (task: TaskRow) => {
    if (selected?.id === task.id) {
      setSelected(null);
      setHighlight([]);
      return;
    }
    setSelected(task);
    setHighlight(getRelated(task));
  };

  const blockedCount = allTasks.filter((task) => isBlocked(task) && task.status !== "done").length;
  const readyCount = allTasks.filter((task) => !isBlocked(task) && task.status === "not_started").length;

  const chains = useMemo(
    () =>
      filteredClients.map((client) => {
        const tasks = allTasks.filter((task) => task.clientId === client.id);
        const depths = tasks.map((task) => getDepth(task.id));
        const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;
        const columns = Array.from({ length: maxDepth + 1 }, (_, index) => tasks.filter((task) => getDepth(task.id) === index));
        return { client, columns };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredClients, allTasks, taskById]
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!isActive) return null;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", "pageActive")} id="page-task-dependencies">
        <div className={cx("pageHeaderBar", "borderB", "tdHeaderBar")}>
          <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Planning</div>
          <h1 className={cx("pageTitleText")}>Task Dependencies</h1>
        </div>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateText")}>Loading task dependencies…</div>
        </div>
      </section>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (allTasks.length === 0) {
    return (
      <section className={cx("page", "pageBody", "pageActive")} id="page-task-dependencies">
        <div className={cx("pageHeaderBar", "borderB", "tdHeaderBar")}>
          <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Planning</div>
          <h1 className={cx("pageTitleText")}>Task Dependencies</h1>
        </div>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className={cx("emptyStateTitle")}>No tasks found</div>
          <div className={cx("emptyStateSub")}>Tasks will appear here once assigned to your projects.</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", "pageActive")} id="page-task-dependencies">
      <div className={cx("pageHeaderBar", "borderB", "tdHeaderBar")}>
        <div className={cx("flexBetween", "mb20", "tdHeaderTop")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Planning</div>
            <h1 className={cx("pageTitleText")}>Task Dependencies</h1>
          </div>

          <div className={cx("tdTopStats")}>
            {[
              { label: "Blocked", value: blockedCount, toneClass: blockedCount > 0 ? "colorRed" : "colorMuted2" },
              { label: "Ready to start", value: readyCount, toneClass: readyCount > 0 ? "colorAccent" : "colorMuted2" },
              { label: "Total tasks", value: allTasks.length, toneClass: "colorMuted" }
            ].map((stat) => (
              <div key={stat.label} className={cx("tdStatCard")}>
                <div className={cx("statLabelNew")}>{stat.label}</div>
                <div className={cx("statValueNew", stat.toneClass)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("filterRow")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter projects"
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
          >
            <option value="all">All projects</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={cx("tdLayout", selected && "tdLayoutWithPanel")}>
        <div className={cx("tdGraphPane", selected && "tdGraphPaneWithPanel")}>
          {chains.map(({ client, columns }) => (
            <div key={client.id} className={cx("mb32")}>
              <div className={cx("tdClientHead")}>
                <div className={cx("flexCenter", "tdClientAvatar")} data-client-id={client.id}>{client.avatar}</div>
                <span className={cx("text13", "fw600", "tdClientName")} data-client-id={client.id}>{client.name}</span>
                <div className={cx("flex1", "tdClientLine")} data-client-id={client.id} />
              </div>

              <div className={cx("tdColumns")}>
                {columns.map((columnTasks, columnIndex) => (
                  <div key={String(columnIndex)} className={cx("tdColumnWrap")}>
                    <div className={cx("flexCol", "gap10", "tdColumn")}>
                      {columnTasks.map((task) => {
                        const status = statusConfig[task.status];
                        const blocked = isBlocked(task);
                        const isSelected = selected?.id === task.id;
                        const isHighlighted = highlight.includes(task.id);
                        const isDirectDep = Boolean(selected && (selected.blockedBy.includes(task.id) || selected.blocking.includes(task.id)));
                        const dimmed = highlight.length > 0 && !isHighlighted;

                        return (
                          <div
                            key={task.id}
                            className={cx(
                              "tdTaskNode",
                              "tdTaskCard",
                              isSelected && "tdTaskCardSelected",
                              isDirectDep && "tdTaskCardDirect",
                              blocked && task.status !== "done" && "tdTaskCardBlocked",
                              dimmed && "tdTaskCardDimmed"
                            )}
                            data-client-id={task.clientId}
                            onClick={() => handleSelect(task)}
                          >
                            <div className={cx("flexRow", "gap6", "mb6")}>
                              <span className={cx("text10", "tdStatusTone")} data-status={task.status}>{status.icon}</span>
                              <span className={cx("textXs", "uppercase", "tdStatusTone", "tdStatusLabel")} data-status={task.status}>{status.label}</span>
                              {blocked && task.status !== "done" ? <span className={cx("textXs", "tdBlockedBadge")}>Blocked</span> : null}
                            </div>

                            <div className={cx("text12", "colorText", "mb6", "tdTaskTitle")}>{task.title}</div>
                            <div className={cx("text10", "colorMuted2")}>Due {task.due}</div>

                            {task.blockedBy.length > 0 || task.blocking.length > 0 ? (
                              <div className={cx("flexRow", "gap8", "mt6")}>
                                {task.blockedBy.length > 0 ? <span className={cx("textXs", "colorMuted2")}>&larr; {task.blockedBy.length} dep{task.blockedBy.length > 1 ? "s" : ""}</span> : null}
                                {task.blocking.length > 0 ? <span className={cx("textXs", "colorMuted2")}>{task.blocking.length} blocking &rarr;</span> : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {columnIndex < columns.length - 1 ? (
                      <div className={cx("flexCenter", "tdArrowCol", columnTasks.length > 1 ? "tdArrowColMulti" : "tdArrowColSingle")}>
                        <div className={cx("tdArrowLine")} />
                        <div className={cx("text10", "tdArrowGlyph")}>&rsaquo;</div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selected ? (
          (() => {
            const client = clients.find((candidate) => candidate.id === selected.clientId);
            const status = statusConfig[selected.status];
            const blocked = isBlocked(selected);
            const blockedByTasks = selected.blockedBy.map((id) => taskById.get(id)).filter((task): task is TaskRow => Boolean(task));
            const blockingTasks = selected.blocking.map((id) => taskById.get(id)).filter((task): task is TaskRow => Boolean(task));

            return (
              <div className={cx("flexCol", "gap16", "tdPanel")}>
                <div>
                  <div className={cx("flexRow", "gap8", "mb10", "flexWrap")}>
                    <span className={cx("text10", "uppercase", "tdStatusChip")} data-status={selected.status}>{status.label}</span>
                    {blocked && selected.status !== "done" ? <span className={cx("text10", "uppercase", "tdBlockedChip")}>Blocked</span> : null}
                  </div>

                  <div className={cx("fontDisplay", "fw800", "colorText", "mb6", "tdPanelTitle")}>{selected.title}</div>
                  <div className={cx("flexRow", "gap10")}>
                    <span className={cx("text11", "tdClientName")} data-client-id={selected.clientId}>{client?.name}</span>
                    <span className={cx("text11", "colorMuted2")}>Due {selected.due}</span>
                  </div>
                </div>

                {blocked && selected.status !== "done" ? (
                  <div className={cx("tdBlockedPanel")}>
                    <div className={cx("text11", "mb4", "tdBlockedPanelTitle")}>&starf; This task is blocked</div>
                    <div className={cx("text11", "colorMuted")}>Cannot start until all dependencies are marked done.</div>
                  </div>
                ) : null}

                {blockedByTasks.length > 0 ? (
                  <div>
                    <div className={cx("text10", "colorMuted2", "uppercase", "mb10", "tdMiniHeading")}>Depends on</div>
                    {blockedByTasks.map((task) => {
                      const taskStatus = statusConfig[task.status];
                      return (
                        <div key={task.id} className={cx("tdTaskNode", "flexRow", "gap10", "mb6", "tdMiniTask")} onClick={() => handleSelect(task)}>
                          <span className={cx("text12", "tdStatusTone")} data-status={task.status}>{taskStatus.icon}</span>
                          <div className={cx("flex1")}>
                            <div className={cx("text12", "colorText")}>{task.title}</div>
                            <div className={cx("text10", "tdStatusTone", "tdMiniStatus")} data-status={task.status}>{taskStatus.label}</div>
                          </div>
                          {task.status !== "done" ? <span className={cx("text10", "colorRed")}>Incomplete</span> : <span className={cx("text10", "colorAccent")}>&check; Done</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {blockingTasks.length > 0 ? (
                  <div>
                    <div className={cx("text10", "colorMuted2", "uppercase", "mb10", "tdMiniHeading")}>Blocking</div>
                    {blockingTasks.map((task) => {
                      const taskStatus = statusConfig[task.status];
                      const taskBlocked = isBlocked(task);
                      return (
                        <div key={task.id} className={cx("tdTaskNode", "flexRow", "gap10", "mb6", "tdMiniTask")} onClick={() => handleSelect(task)}>
                          <span className={cx("text12", "tdStatusTone")} data-status={task.status}>{taskStatus.icon}</span>
                          <div className={cx("flex1")}>
                            <div className={cx("text12", "colorText")}>{task.title}</div>
                            <div className={cx("text10", "tdStatusTone", "tdMiniStatus")} data-status={task.status}>{taskStatus.label} &middot; Due {task.due}</div>
                          </div>
                          {taskBlocked ? <span className={cx("text10", "colorRed")}>Still blocked</span> : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {blockedByTasks.length === 0 && blockingTasks.length === 0 ? <div className={cx("text12", "colorMuted2")}>No dependencies - this task is independent.</div> : null}

                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setHighlight([]);
                  }}
                  className={cx("tdCloseBtn")}
                >
                  Close
                </button>
              </div>
            );
          })()
        ) : null}
      </div>
    </section>
  );
}
