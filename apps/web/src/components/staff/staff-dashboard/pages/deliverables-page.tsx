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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-deliverables">
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

      <div className={cx("kanbanControls", "mb12")}>
        <div className={cx("filterRow")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter deliverables"
            value={deliverableFilter}
            onChange={(event) =>
              setDeliverableFilter(event.target.value as "all" | "overdue" | "due_week" | "completed" | "needs_attachment")
            }
          >
            <option value="all">All</option>
            <option value="overdue">Overdue</option>
            <option value="due_week">Due this week</option>
            <option value="completed">Completed</option>
            <option value="needs_attachment">Needs attachment</option>
          </select>
          <select
            className={cx("filterSelect", "dlSortSelect")}
            aria-label="Sort deliverables"
            value={deliverableSort}
            onChange={(event) => setDeliverableSort(event.target.value as "due_asc" | "due_desc" | "status" | "title")}
          >
            <option value="due_asc">Sort: due soonest</option>
            <option value="due_desc">Sort: due latest</option>
            <option value="status">Sort: status</option>
            <option value="title">Sort: title</option>
          </select>
        </div>
      </div>

      {showComposer ? (
        <div className={cx("card", "mb12")}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Create Deliverable</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid2}>
              <select
                className={styles.fieldInput}
                aria-label="Project for new deliverable"
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
            <div className={styles.dlComposerSubmit}>
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

      <div className={cx("stats", "stats3", "mb20")}>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentRed")} />
          <div className={styles.statLabel}>Overdue</div>
          <div className={styles.statValue}>{milestoneStats.overdue}</div>
          <div className={styles.statSub}><span className={styles.dn}>{milestoneStats.overdue ? "Immediate attention" : "No overdue deliverables"}</span></div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentAmber")} />
          <div className={styles.statLabel}>Due This Week</div>
          <div className={styles.statValue}>{milestoneStats.dueThisWeek}</div>
          <div className={styles.statSub}><span className={styles.warn}>{milestoneStats.dueThisWeek ? "In progress" : "No deliverables due"}</span></div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentGreen")} />
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
              <div className={cx("cardBody", "pt8", "pb8")}>
                <div className={styles.deliverableList}>
                  {group.items.length === 0 ? (
                    <div className={styles.emptyState}>No deliverables listed.</div>
                  ) : (
                    group.items.map((item) => (
                      <div key={item.title} className={styles.deliverableItem}>
                        <div className={cx("deliverableCheck", item.status && `deliverable${capitalize(item.status)}`)}>
                          {item.status === "done" ? "✓" : item.status === "doing" ? "→" : ""}
                        </div>
                        <div className={styles.flex1}>
                          <div className={cx("deliverableTitle", item.titleTone === "var(--muted)" && "dlTitleMuted", item.status === "done" && "dlTitleDone")}>
                            {item.title}
                          </div>
                          <div className={cx("deliverableMeta", item.metaTone === "var(--accent)" && "dlMetaAccent", item.metaTone === "var(--muted)" && "dlMetaMuted")}>
                            {item.meta}
                          </div>
                          <div className={cx("deliverableMeta", "mt6")}>
                            Attachment: {item.fileName ?? "None"}
                          </div>
                          <select
                            className={cx("fieldInput", "dlAttachSelect")}
                            aria-label="Attach file to deliverable"
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
                            <div className={styles.dlActionRow}>
                              {item.milestoneStatus !== "PENDING" ? (
                                <button
                                  type="button"
                                  className={cx("btnXxs", "buttonGhost")}
                                  onClick={() => onMilestoneStatusUpdate(item.projectId!, item.milestoneId!, "PENDING")}
                                >
                                  Reopen
                                </button>
                              ) : null}
                              {item.milestoneStatus === "PENDING" ? (
                                <button
                                  type="button"
                                  className={cx("btnXxs", "buttonGhost")}
                                  onClick={() => onMilestoneStatusUpdate(item.projectId!, item.milestoneId!, "IN_PROGRESS")}
                                >
                                  Start
                                </button>
                              ) : null}
                              {item.milestoneStatus !== "COMPLETED" ? (
                                <button
                                  type="button"
                                  className={cx("btnXxs", "buttonBlue")}
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

      <div className={cx("card", "mt20")}>
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
                  <div key={request.id} className={cx("deliverableItem", "dlItemStart")}>
                    <div className={styles.flex1}>
                      <div className={styles.deliverableTitle}>{request.title}</div>
                      <div className={styles.deliverableMeta}>
                        {request.reason ?? request.description ?? "No request details supplied."}
                      </div>
                      <div className={cx("deliverableMeta", "mt6")}>
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                      <div className={styles.dlEstimateGrid}>
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
                        className={cx("fieldInput", "dlTextarea")}
                        placeholder="Staff assessment for admin review"
                        value={draft.assessment}
                        onChange={(event) => onEstimateDraftChange(request.id, "assessment", event.target.value)}
                      />
                      <div className={styles.dlSubmitRow}>
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

      <div className={cx("card", "mt20")}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Client Handoff Exports</span>
          <div className={styles.dlExportActions}>
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
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">File</th>
                    <th scope="col">Format</th>
                    <th scope="col">Generated</th>
                    <th scope="col">Summary</th>
                    <th className={cx("textCenter")} scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {handoffExports.slice(0, 8).map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.fileName}</td>
                      <td>{entry.format.toUpperCase()}</td>
                      <td>{formatDateLong(entry.generatedAt)}</td>
                      <td>
                        <div className={styles.dlHandoffSummary}>
                          <span>{entry.docs} docs · {entry.decisions} decisions · {entry.blockers} blockers</span>
                        </div>
                      </td>
                      <td className={cx("textCenter")}>
                        <button
                          type="button"
                          className={cx("btnXxs", "buttonGhost")}
                          onClick={() => onDownloadHandoffExport(entry.id)}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
