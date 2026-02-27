"use client";

import { useMemo, useState } from "react";
import { cx, styles } from "../style";
import type { DeliverableGroup } from "../types";
import { capitalize } from "../utils";
import type { ProjectChangeRequest } from "../../../../lib/api/admin";
import { formatDateLong } from "../utils";

type FileRecord = {
  id: string;
  clientId: string;
  fileName: string;
};

type MilestoneStats = {
  overdue: number;
  dueThisWeek: number;
  deliveredThisMonth: number;
};

type DeliverablesPageProps = {
  isActive: boolean;
  nowTs: number;
  milestoneStats: MilestoneStats;
  projects: Array<{ id: string; name: string }>;
  showComposer: boolean;
  onToggleComposer: () => void;
  newDeliverable: { projectId: string; title: string; dueAt: string };
  onNewDeliverableChange: (patch: Partial<{ projectId: string; title: string; dueAt: string }>) => void;
  creatingDeliverable: boolean;
  onCreateDeliverable: () => void;
  deliverableGroups: DeliverableGroup[];
  files: FileRecord[];
  onMilestoneAttachment: (projectId: string, milestoneId: string, fileId: string | null) => void;
  onMilestoneStatusUpdate: (
    projectId: string,
    milestoneId: string,
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  ) => void;
  changeRequests: ProjectChangeRequest[];
  estimateDrafts: Record<string, { hours: string; costCents: string; assessment: string }>;
  onEstimateDraftChange: (
    changeRequestId: string,
    field: "hours" | "costCents" | "assessment",
    value: string
  ) => void;
  onEstimateChangeRequest: (changeRequestId: string) => void;
  handoffExports: Array<{
    id: string;
    format: "json" | "markdown";
    fileName: string;
    docs: number;
    decisions: number;
    blockers: number;
    generatedAt: string;
  }>;
  generatingHandoffExport: boolean;
  onGenerateHandoffExport: (format: "json" | "markdown") => void;
  onDownloadHandoffExport: (exportId: string) => void;
};

export function DeliverablesPage({
  isActive,
  nowTs,
  milestoneStats,
  projects,
  showComposer,
  onToggleComposer,
  newDeliverable,
  onNewDeliverableChange,
  creatingDeliverable,
  onCreateDeliverable,
  deliverableGroups,
  files,
  onMilestoneAttachment,
  onMilestoneStatusUpdate,
  changeRequests,
  estimateDrafts,
  onEstimateDraftChange,
  onEstimateChangeRequest,
  handoffExports,
  generatingHandoffExport,
  onGenerateHandoffExport,
  onDownloadHandoffExport
}: DeliverablesPageProps) {
  const pendingRequests = changeRequests
    .filter((request) => request.status === "SUBMITTED")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const [deliverableFilter, setDeliverableFilter] = useState<"all" | "overdue" | "due_week" | "completed" | "needs_attachment">("all");
  const [deliverableSort, setDeliverableSort] = useState<"due_asc" | "due_desc" | "status" | "title">("due_asc");

  const visibleGroups = useMemo(() => {
    const weekAhead = nowTs + 1000 * 60 * 60 * 24 * 7;
    const includesByFilter = (item: DeliverableGroup["items"][number]) => {
      if (deliverableFilter === "all") return true;
      if (deliverableFilter === "completed") return item.milestoneStatus === "COMPLETED";
      if (deliverableFilter === "needs_attachment") return !item.fileId;
      const dueTs = item.dueAt ? new Date(item.dueAt).getTime() : null;
      if (deliverableFilter === "overdue") return Boolean(dueTs && dueTs < nowTs && item.milestoneStatus !== "COMPLETED");
      if (deliverableFilter === "due_week") return Boolean(dueTs && dueTs >= nowTs && dueTs <= weekAhead && item.milestoneStatus !== "COMPLETED");
      return true;
    };
    const sortItems = (a: DeliverableGroup["items"][number], b: DeliverableGroup["items"][number]) => {
      if (deliverableSort === "title") return a.title.localeCompare(b.title);
      if (deliverableSort === "status") {
        const weight = (status?: "PENDING" | "IN_PROGRESS" | "COMPLETED") =>
          status === "PENDING" ? 1 : status === "IN_PROGRESS" ? 2 : status === "COMPLETED" ? 3 : 0;
        return weight(a.milestoneStatus) - weight(b.milestoneStatus);
      }
      const aTs = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
      const bTs = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
      return deliverableSort === "due_desc" ? bTs - aTs : aTs - bTs;
    };
    return deliverableGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(includesByFilter).sort(sortItems)
      }))
      .filter((group) => group.items.length > 0);
  }, [deliverableFilter, deliverableGroups, deliverableSort, nowTs]);

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-deliverables">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>Output Tracking</div>
          <div className={styles.pageTitle}>Deliverables</div>
          <div className={styles.pageSub}>Track what needs to be handed to clients.</div>
        </div>
        <button className={cx("button", "buttonBlue")} type="button" onClick={onToggleComposer}>
          {showComposer ? "Close" : "+ Add Deliverable"}
        </button>
      </div>

      <div className={styles.kanbanControls} style={{ marginBottom: 12 }}>
        <div className={styles.filterTabs}>
          {[
            { id: "all", label: "All" },
            { id: "overdue", label: "Overdue" },
            { id: "due_week", label: "Due This Week" },
            { id: "completed", label: "Completed" },
            { id: "needs_attachment", label: "Needs Attachment" }
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={cx("filterTab", deliverableFilter === filter.id && "filterTabActive")}
              onClick={() => setDeliverableFilter(filter.id as "all" | "overdue" | "due_week" | "completed" | "needs_attachment")}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label className={styles.fieldLabel} htmlFor="deliverable-sort" style={{ marginBottom: 0 }}>Sort</label>
          <select
            id="deliverable-sort"
            className={cx("fieldInput", "fieldSelect")}
            style={{ width: 170, paddingTop: 7, paddingBottom: 7 }}
            value={deliverableSort}
            onChange={(event) => setDeliverableSort(event.target.value as "due_asc" | "due_desc" | "status" | "title")}
          >
            <option value="due_asc">Due date (soonest)</option>
            <option value="due_desc">Due date (latest)</option>
            <option value="status">Status</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {showComposer ? (
        <div className={styles.card} style={{ marginBottom: 12 }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Create Deliverable</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <select
                className={styles.fieldInput}
                value={newDeliverable.projectId}
                onChange={(event) => onNewDeliverableChange({ projectId: event.target.value })}
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <input
                className={styles.fieldInput}
                placeholder="Deliverable title"
                value={newDeliverable.title}
                onChange={(event) => onNewDeliverableChange({ title: event.target.value })}
              />
              <input
                className={styles.fieldInput}
                type="datetime-local"
                value={newDeliverable.dueAt}
                onChange={(event) => onNewDeliverableChange({ dueAt: event.target.value })}
              />
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button
                className={cx("button", "buttonBlue")}
                type="button"
                onClick={onCreateDeliverable}
                disabled={creatingDeliverable || !newDeliverable.projectId || newDeliverable.title.trim().length < 3}
              >
                {creatingDeliverable ? "Creating..." : "Create Deliverable"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={cx("stats", "stats3")} style={{ marginBottom: 20 }}>
        <div className={styles.stat}>
          <div className={styles.statAccent} style={{ background: "var(--red)" }} />
          <div className={styles.statLabel}>Overdue</div>
          <div className={styles.statValue}>{milestoneStats.overdue}</div>
          <div className={styles.statSub}><span className={styles.dn}>{milestoneStats.overdue ? "Immediate attention" : "No overdue deliverables"}</span></div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statAccent} style={{ background: "var(--amber)" }} />
          <div className={styles.statLabel}>Due This Week</div>
          <div className={styles.statValue}>{milestoneStats.dueThisWeek}</div>
          <div className={styles.statSub}><span className={styles.warn}>{milestoneStats.dueThisWeek ? "In progress" : "No deliverables due"}</span></div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statAccent} style={{ background: "var(--green)" }} />
          <div className={styles.statLabel}>Delivered (Month)</div>
          <div className={styles.statValue}>{milestoneStats.deliveredThisMonth}</div>
          <div className={styles.statSub}><span className={styles.up}>On track</span></div>
        </div>
      </div>

      <div className={styles.grid2}>
        {visibleGroups.length === 0 ? (
          <div className={styles.emptyState}>No deliverables available yet.</div>
        ) : visibleGroups.map((group) => {
          const availableFiles = files.filter((file) => file.clientId === group.clientId);
          return (
            <div key={group.title} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardHeaderTitle}>{group.title}</span>
                <span className={cx("badge", `badge${capitalize(group.badge.tone)}`)}>{group.badge.label}</span>
              </div>
              <div className={styles.cardBody} style={{ paddingTop: 8, paddingBottom: 8 }}>
                <div className={styles.deliverableList}>
                  {group.items.length === 0 ? (
                    <div className={styles.emptyState}>No deliverables listed.</div>
                  ) : (
                    group.items.map((item) => (
                      <div key={item.title} className={styles.deliverableItem}>
                        <div className={cx("deliverableCheck", item.status && `deliverable${capitalize(item.status)}`)}>
                          {item.status === "done" ? "✓" : item.status === "doing" ? "→" : ""}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className={styles.deliverableTitle} style={item.titleTone ? { color: item.titleTone } : item.status === "done" ? { textDecoration: "line-through", color: "var(--muted)" } : undefined}>
                            {item.title}
                          </div>
                          <div className={styles.deliverableMeta} style={item.metaTone ? { color: item.metaTone } : undefined}>
                            {item.meta}
                          </div>
                          <div className={styles.deliverableMeta} style={{ marginTop: 6 }}>
                            Attachment: {item.fileName ?? "None"}
                          </div>
                          <select
                            className={styles.fieldInput}
                            style={{ marginTop: 6, width: "100%", background: "var(--bg)", fontSize: "0.68rem" }}
                            value={item.fileId ?? ""}
                            onChange={(event) =>
                              onMilestoneAttachment(item.projectId ?? "", item.milestoneId ?? "", event.target.value || null)
                            }
                            disabled={!item.projectId || !item.milestoneId}
                          >
                            <option value="">Attach file</option>
                            {availableFiles.map((file) => (
                              <option key={file.id} value={file.id}>{file.fileName}</option>
                            ))}
                          </select>
                          {item.projectId && item.milestoneId ? (
                            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 6 }}>
                              {item.milestoneStatus !== "PENDING" ? (
                                <button
                                  type="button"
                                  className={cx("button", "buttonGhost")}
                                  style={{ padding: "4px 10px", fontSize: "0.58rem" }}
                                  onClick={() => onMilestoneStatusUpdate(item.projectId!, item.milestoneId!, "PENDING")}
                                >
                                  Reopen
                                </button>
                              ) : null}
                              {item.milestoneStatus === "PENDING" ? (
                                <button
                                  type="button"
                                  className={cx("button", "buttonGhost")}
                                  style={{ padding: "4px 10px", fontSize: "0.58rem" }}
                                  onClick={() => onMilestoneStatusUpdate(item.projectId!, item.milestoneId!, "IN_PROGRESS")}
                                >
                                  Start
                                </button>
                              ) : null}
                              {item.milestoneStatus !== "COMPLETED" ? (
                                <button
                                  type="button"
                                  className={cx("button", "buttonBlue")}
                                  style={{ padding: "4px 10px", fontSize: "0.58rem" }}
                                  onClick={() => onMilestoneStatusUpdate(item.projectId!, item.milestoneId!, "COMPLETED")}
                                >
                                  Complete
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.card} style={{ marginTop: 20 }}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Change Request Queue</span>
          <span className={cx("badge", "badgeBlue")}>{pendingRequests.length} pending</span>
        </div>
        <div className={styles.cardBody}>
          {pendingRequests.length === 0 ? (
            <div className={styles.emptyState}>No pending change requests.</div>
          ) : (
            <div className={styles.deliverableList}>
              {pendingRequests.map((request) => {
                const draft = estimateDrafts[request.id] ?? { hours: "", costCents: "", assessment: "" };
                return (
                  <div key={request.id} className={styles.deliverableItem} style={{ alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div className={styles.deliverableTitle}>{request.title}</div>
                      <div className={styles.deliverableMeta}>
                        {request.reason ?? request.description ?? "No request details supplied."}
                      </div>
                      <div className={styles.deliverableMeta} style={{ marginTop: 6 }}>
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: 8 }}>
                        <input
                          className={styles.fieldInput}
                          placeholder="Estimated hours"
                          value={draft.hours}
                          onChange={(event) => onEstimateDraftChange(request.id, "hours", event.target.value)}
                        />
                        <input
                          className={styles.fieldInput}
                          placeholder="Estimated cost (cents)"
                          value={draft.costCents}
                          onChange={(event) => onEstimateDraftChange(request.id, "costCents", event.target.value)}
                        />
                      </div>
                      <textarea
                        className={styles.fieldInput}
                        style={{ marginTop: 6, minHeight: 72, resize: "vertical" }}
                        placeholder="Staff assessment for admin review"
                        value={draft.assessment}
                        onChange={(event) => onEstimateDraftChange(request.id, "assessment", event.target.value)}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <button
                          type="button"
                          className={cx("button", "buttonBlue")}
                          onClick={() => onEstimateChangeRequest(request.id)}
                        >
                          Submit estimate
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: 20 }}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Client Handoff Exports</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className={cx("button", "buttonGhost")}
              onClick={() => onGenerateHandoffExport("markdown")}
              disabled={generatingHandoffExport}
            >
              {generatingHandoffExport ? "Generating..." : "Export Markdown"}
            </button>
            <button
              type="button"
              className={cx("button", "buttonBlue")}
              onClick={() => onGenerateHandoffExport("json")}
              disabled={generatingHandoffExport}
            >
              {generatingHandoffExport ? "Generating..." : "Export JSON"}
            </button>
          </div>
        </div>
        <div className={styles.cardBody}>
          {handoffExports.length === 0 ? (
            <div className={styles.emptyState}>No handoff exports yet.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Format</th>
                  <th>Generated</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {handoffExports.slice(0, 8).map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.fileName}</td>
                  <td>{entry.format.toUpperCase()}</td>
                  <td>{formatDateLong(entry.generatedAt)}</td>
                  <td style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{entry.docs} docs · {entry.decisions} decisions · {entry.blockers} blockers</span>
                    <button
                      type="button"
                      className={cx("button", "buttonGhost")}
                      style={{ padding: "4px 10px", fontSize: "0.58rem" }}
                      onClick={() => onDownloadHandoffExport(entry.id)}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
