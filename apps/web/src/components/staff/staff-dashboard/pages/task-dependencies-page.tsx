"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type Status = "done" | "in_progress" | "in_revision" | "awaiting_approval" | "not_started";

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  color: string;
};

type TaskRow = {
  id: string;
  clientId: number;
  title: string;
  status: Status;
  due: string;
  blockedBy: string[];
  blocking: string[];
};

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "#a78bfa" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "#f5c518" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00" }
];

const allTasks: TaskRow[] = [
  { id: "v1", clientId: 1, title: "Logo & Visual Direction", status: "awaiting_approval", due: "Feb 22", blockedBy: [], blocking: ["v2", "v3"] },
  { id: "v2", clientId: 1, title: "Brand Guidelines Document", status: "not_started", due: "Mar 3", blockedBy: ["v1"], blocking: ["v3"] },
  { id: "v3", clientId: 1, title: "Animation Direction Deck", status: "not_started", due: "Mar 10", blockedBy: ["v1", "v2"], blocking: [] },

  { id: "k1", clientId: 2, title: "Audience Segmentation Analysis", status: "done", due: "Feb 14", blockedBy: [], blocking: ["k2"] },
  { id: "k2", clientId: 2, title: "Campaign Strategy Deck", status: "awaiting_approval", due: "Feb 17", blockedBy: ["k1"], blocking: ["k3", "k4"] },
  { id: "k3", clientId: 2, title: "LinkedIn Channel Brief", status: "in_progress", due: "Feb 26", blockedBy: ["k2"], blocking: ["k5"] },
  { id: "k4", clientId: 2, title: "Paid Media Plan", status: "not_started", due: "Mar 5", blockedBy: ["k2"], blocking: ["k5"] },
  { id: "k5", clientId: 2, title: "Content Calendar Q1", status: "not_started", due: "Mar 12", blockedBy: ["k3", "k4"], blocking: [] },

  { id: "m1", clientId: 3, title: "Mobile Wireframes", status: "in_revision", due: "Feb 24", blockedBy: [], blocking: ["m2"] },
  { id: "m2", clientId: 3, title: "Desktop Wireframes", status: "not_started", due: "Feb 28", blockedBy: ["m1"], blocking: ["m3"] },
  { id: "m3", clientId: 3, title: "Component Library", status: "not_started", due: "Mar 7", blockedBy: ["m2"], blocking: ["m4"] },
  { id: "m4", clientId: 3, title: "Framer Build & Handover", status: "not_started", due: "Mar 21", blockedBy: ["m3"], blocking: [] },

  { id: "d1", clientId: 4, title: "Type & Grid System", status: "awaiting_approval", due: "Feb 9", blockedBy: [], blocking: ["d2"] },
  { id: "d2", clientId: 4, title: "Master Template Set", status: "not_started", due: "Mar 1", blockedBy: ["d1"], blocking: [] },

  { id: "o1", clientId: 5, title: "Data Visualisation Suite", status: "done", due: "Feb 19", blockedBy: [], blocking: ["o2"] },
  { id: "o2", clientId: 5, title: "Layout & Typesetting", status: "in_progress", due: "Feb 27", blockedBy: ["o1"], blocking: ["o3"] },
  { id: "o3", clientId: 5, title: "Cover Design (3 options)", status: "not_started", due: "Mar 3", blockedBy: ["o2"], blocking: ["o4"] },
  { id: "o4", clientId: 5, title: "Final PDF Export & Print Prep", status: "not_started", due: "Mar 10", blockedBy: ["o3"], blocking: [] }
];

const statusConfig: Record<Status, { label: string; color: string; bg: string; icon: string }> = {
  done: { label: "Done", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 10%, transparent)", icon: "✓" },
  in_progress: { label: "In Progress", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", icon: "●" },
  in_revision: { label: "In Revision", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: "↻" },
  awaiting_approval: { label: "Awaiting Approval", color: "#f5c518", bg: "rgba(245,197,24,0.1)", icon: "◎" },
  not_started: { label: "Not Started", color: "var(--muted2)", bg: "rgba(160,160,176,0.06)", icon: "○" }
};

const taskById = new Map(allTasks.map((task) => [task.id, task]));

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

export function TaskDependenciesPage({ isActive }: { isActive: boolean }) {
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [selected, setSelected] = useState<TaskRow | null>(null);
  const [highlight, setHighlight] = useState<string[]>([]);

  const filteredClients = clientFilter === "all" ? clients : clients.filter((client) => client.id === Number(clientFilter));

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
        const maxDepth = Math.max(...tasks.map((task) => getDepth(task.id)));
        const columns = Array.from({ length: maxDepth + 1 }, (_, index) => tasks.filter((task) => getDepth(task.id) === index));
        return { client, columns };
      }),
    [filteredClients]
  );

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-task-dependencies">
      <style>{`
        .td-task-node { transition: all 0.15s ease; cursor: pointer; }
        .td-task-node:hover { border-color: color-mix(in srgb, var(--accent) 30%, transparent) !important; }
        .td-filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .td-filter-btn:hover { opacity: 0.8; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Planning
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Task Dependencies
            </h1>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Blocked", value: blockedCount, color: blockedCount > 0 ? "#ff4444" : "var(--muted2)" },
              { label: "Ready to start", value: readyCount, color: readyCount > 0 ? "var(--accent)" : "var(--muted2)" },
              { label: "Total tasks", value: allTasks.length, color: "#a0a0b0" }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="td-filter-btn"
            onClick={() => setClientFilter("all")}
            style={{ padding: "6px 14px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 2, background: clientFilter === "all" ? "var(--accent)" : "rgba(255,255,255,0.04)", color: clientFilter === "all" ? "#050508" : "var(--muted2)" }}
          >
            All projects
          </button>
          {clients.map((client) => (
            <button
              key={client.id}
              className="td-filter-btn"
              onClick={() => setClientFilter(clientFilter === String(client.id) ? "all" : String(client.id))}
              style={{ padding: "6px 14px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 2, background: clientFilter === String(client.id) ? `${client.color}18` : "rgba(255,255,255,0.04)", color: clientFilter === String(client.id) ? client.color : "var(--muted2)", border: `1px solid ${clientFilter === String(client.id) ? `${client.color}40` : "transparent"}` }}
            >
              {client.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", minHeight: "calc(100vh - 170px)" }}>
        <div style={{ padding: "24px 32px", overflowX: "auto", borderRight: selected ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
          {chains.map(({ client, columns }) => (
            <div key={client.id} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 24, height: 24, borderRadius: 2, background: `${client.color}20`, border: `1px solid ${client.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: client.color }}>
                  {client.avatar}
                </div>
                <span style={{ fontSize: 13, color: client.color, fontWeight: 500 }}>{client.name}</span>
                <div style={{ flex: 1, height: 1, background: `${client.color}20` }} />
              </div>

              <div style={{ display: "flex", gap: 0, alignItems: "flex-start", overflowX: "auto" }}>
                {columns.map((columnTasks, columnIndex) => (
                  <div key={String(columnIndex)} style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 200 }}>
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
                            className="td-task-node"
                            onClick={() => handleSelect(task)}
                            style={{
                              padding: "12px 14px",
                              border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 40%, transparent)" : isDirectDep ? `${client.color}50` : blocked && task.status !== "done" ? "rgba(255,68,68,0.25)" : "rgba(255,255,255,0.07)"}`,
                              borderRadius: 4,
                              background: isSelected ? "color-mix(in srgb, var(--accent) 5%, transparent)" : isDirectDep ? `${client.color}08` : "rgba(255,255,255,0.01)",
                              opacity: dimmed ? 0.25 : 1,
                              transition: "all 0.15s ease"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                              <span style={{ fontSize: 10, color: status.color }}>{status.icon}</span>
                              <span style={{ fontSize: 9, color: status.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{status.label}</span>
                              {blocked && task.status !== "done" ? <span style={{ fontSize: 9, color: "#ff4444", marginLeft: "auto" }}>Blocked</span> : null}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.3, marginBottom: 6 }}>{task.title}</div>
                            <div style={{ fontSize: 10, color: "var(--muted2)" }}>Due {task.due}</div>

                            {task.blockedBy.length > 0 || task.blocking.length > 0 ? (
                              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                {task.blockedBy.length > 0 ? <span style={{ fontSize: 9, color: "#333344" }}>← {task.blockedBy.length} dep{task.blockedBy.length > 1 ? "s" : ""}</span> : null}
                                {task.blocking.length > 0 ? <span style={{ fontSize: 9, color: "#333344" }}>{task.blocking.length} blocking →</span> : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {columnIndex < columns.length - 1 ? (
                      <div style={{ display: "flex", alignItems: "center", padding: "0 10px", paddingTop: columnTasks.length > 1 ? 24 : 20 }}>
                        <div style={{ width: 20, height: 1, background: "rgba(255,255,255,0.1)" }} />
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.1)" }}>›</div>
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
              <div style={{ padding: "24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: status.bg, color: status.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{status.label}</span>
                    {blocked && selected.status !== "done" ? <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: "rgba(255,68,68,0.1)", color: "#ff4444", letterSpacing: "0.08em", textTransform: "uppercase" }}>Blocked</span> : null}
                  </div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 6 }}>{selected.title}</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: client?.color }}>{client?.name}</span>
                    <span style={{ fontSize: 11, color: "var(--muted2)" }}>Due {selected.due}</span>
                  </div>
                </div>

                {blocked && selected.status !== "done" ? (
                  <div style={{ padding: "12px 14px", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 3, background: "rgba(255,68,68,0.06)" }}>
                    <div style={{ fontSize: 11, color: "#ff4444", marginBottom: 4 }}>⚑ This task is blocked</div>
                    <div style={{ fontSize: 11, color: "#a0a0b0" }}>Cannot start until all dependencies are marked done.</div>
                  </div>
                ) : null}

                {blockedByTasks.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Depends on</div>
                    {blockedByTasks.map((task) => {
                      const taskStatus = statusConfig[task.status];
                      return (
                        <div
                          key={task.id}
                          className="td-task-node"
                          onClick={() => handleSelect(task)}
                          style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, marginBottom: 6, background: "rgba(255,255,255,0.01)" }}
                        >
                          <span style={{ fontSize: 12, color: taskStatus.color }}>{taskStatus.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: "var(--text)" }}>{task.title}</div>
                            <div style={{ fontSize: 10, color: taskStatus.color, marginTop: 2 }}>{taskStatus.label}</div>
                          </div>
                          {task.status !== "done" ? <span style={{ fontSize: 10, color: "#ff4444" }}>Incomplete</span> : <span style={{ fontSize: 10, color: "var(--accent)" }}>✓ Done</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {blockingTasks.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Blocking</div>
                    {blockingTasks.map((task) => {
                      const taskStatus = statusConfig[task.status];
                      const taskBlocked = isBlocked(task);
                      return (
                        <div
                          key={task.id}
                          className="td-task-node"
                          onClick={() => handleSelect(task)}
                          style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, marginBottom: 6, background: "rgba(255,255,255,0.01)" }}
                        >
                          <span style={{ fontSize: 12, color: taskStatus.color }}>{taskStatus.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: "var(--text)" }}>{task.title}</div>
                            <div style={{ fontSize: 10, color: taskStatus.color, marginTop: 2 }}>{taskStatus.label} · Due {task.due}</div>
                          </div>
                          {taskBlocked ? <span style={{ fontSize: 10, color: "#ff4444" }}>Still blocked</span> : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {blockedByTasks.length === 0 && blockingTasks.length === 0 ? <div style={{ fontSize: 12, color: "var(--muted2)" }}>No dependencies - this task is independent.</div> : null}

                <button
                  onClick={() => {
                    setSelected(null);
                    setHighlight([]);
                  }}
                  style={{ marginTop: "auto", padding: "10px", fontSize: 11, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--muted2)", cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em" }}
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
