"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type Status = "done" | "in_progress" | "in_revision" | "awaiting_approval" | "not_started";

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
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
  { id: 1, name: "Volta Studios", avatar: "VS" },
  { id: 2, name: "Kestrel Capital", avatar: "KC" },
  { id: 3, name: "Mira Health", avatar: "MH" },
  { id: 4, name: "Dune Collective", avatar: "DC" },
  { id: 5, name: "Okafor & Sons", avatar: "OS" }
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

const statusConfig: Record<Status, { label: string; icon: string }> = {
  done: { label: "Done", icon: "✓" },
  in_progress: { label: "In Progress", icon: "●" },
  in_revision: { label: "In Revision", icon: "↻" },
  awaiting_approval: { label: "Awaiting Approval", icon: "◎" },
  not_started: { label: "Not Started", icon: "○" }
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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-task-dependencies">
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
              <option key={client.id} value={String(client.id)}>
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
                <div className={cx("flexCenter", "tdClientAvatar")} data-client-id={String(client.id)}>{client.avatar}</div>
                <span className={cx("text13", "fw600", "tdClientName")} data-client-id={String(client.id)}>{client.name}</span>
                <div className={cx("flex1", "tdClientLine")} data-client-id={String(client.id)} />
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
                            data-client-id={String(task.clientId)}
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
                                {task.blockedBy.length > 0 ? <span className={cx("textXs", "colorMuted2")}>← {task.blockedBy.length} dep{task.blockedBy.length > 1 ? "s" : ""}</span> : null}
                                {task.blocking.length > 0 ? <span className={cx("textXs", "colorMuted2")}>{task.blocking.length} blocking →</span> : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {columnIndex < columns.length - 1 ? (
                      <div className={cx("flexCenter", "tdArrowCol", columnTasks.length > 1 ? "tdArrowColMulti" : "tdArrowColSingle")}>
                        <div className={cx("tdArrowLine")} />
                        <div className={cx("text10", "tdArrowGlyph")}>›</div>
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
                    <span className={cx("text11", "tdClientName")} data-client-id={String(selected.clientId)}>{client?.name}</span>
                    <span className={cx("text11", "colorMuted2")}>Due {selected.due}</span>
                  </div>
                </div>

                {blocked && selected.status !== "done" ? (
                  <div className={cx("tdBlockedPanel")}> 
                    <div className={cx("text11", "mb4", "tdBlockedPanelTitle")}>⚑ This task is blocked</div>
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
                          {task.status !== "done" ? <span className={cx("text10", "colorRed")}>Incomplete</span> : <span className={cx("text10", "colorAccent")}>✓ Done</span>}
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
                            <div className={cx("text10", "tdStatusTone", "tdMiniStatus")} data-status={task.status}>{taskStatus.label} · Due {task.due}</div>
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
