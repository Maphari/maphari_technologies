"use client";

import { useMemo, useState } from "react";
import { cx, styles } from "../style";
import { Ic } from "../ui";
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

const FILTER_OPTS = [
  { value: "all",              label: "All"            },
  { value: "overdue",          label: "Overdue"        },
  { value: "due_week",         label: "Due This Week"  },
  { value: "completed",        label: "Completed"      },
  { value: "needs_attachment", label: "Needs File"     },
] as const;

const SORT_OPTS = [
  { value: "due_asc",  label: "Due Soon" },
  { value: "due_desc", label: "Due Late" },
  { value: "status",   label: "Status"   },
  { value: "title",    label: "Title"    },
] as const;

function IcoDone() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" fill="var(--green)" opacity="0.15" />
      <circle cx="7" cy="7" r="6" stroke="var(--green)" strokeWidth="1.3" />
      <path d="M4.5 7l2 2 3-3" stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoDoing() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" fill="var(--accent)" opacity="0.12" />
      <circle cx="7" cy="7" r="6" stroke="var(--accent)" strokeWidth="1.3" />
      <path d="M5 7h4M7.5 5L10 7l-2.5 2" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoPending() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke="var(--border2)" strokeWidth="1.3" strokeDasharray="2 2" />
      <circle cx="7" cy="7" r="1.8" fill="var(--muted2)" />
    </svg>
  );
}

function IcoPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IcoX() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcoMd() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 9.5V5.5l2 2.5 2-2.5v4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6v3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function IcoJson() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 2.5C4 2.5 3.5 3 3.5 3.5v7c0 .5.5 1 1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9 2.5c1 0 1.5.5 1.5 1v7c0 .5-.5 1-1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.5 7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IcoDownload() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2v7M4.5 6.5L7 9l2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 12h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IcoAttach() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M10.5 6.5l-4.5 4.5A3 3 0 0 1 1.5 7l4.5-4.5a2 2 0 0 1 2.83 2.83L5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoSend() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7h9M9 4.5L11.5 7 9 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoWarning() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1.5L12.5 11H1.5L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7 5.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7" cy="9.5" r="0.7" fill="currentColor" />
    </svg>
  );
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: "Pending",     cls: "dlStatusPending"     },
  IN_PROGRESS: { label: "In Progress", cls: "dlStatusInProgress"  },
  COMPLETED:   { label: "Completed",   cls: "dlStatusCompleted"   },
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
      <div className={cx("pageHeaderBar")}>
        <div className={cx("flexBetween", "gap24", "mb20")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Output</div>
            <h1 className={cx("pageTitleText")}>Deliverables</h1>
            <p className={cx("pageSubtitleText")}>Track what needs to be handed to clients.</p>
          </div>
          <div className={cx("pageActions")}>
            <button className={cx("button", "buttonBlue", "dlAddBtn")} type="button" onClick={onToggleComposer}>
              <span className={cx("dlBtnIco")}>{showComposer ? <IcoX /> : <IcoPlus />}</span>
              {showComposer ? "Close" : "Add Deliverable"}
            </button>
          </div>
        </div>
      </div>

      {/* Filter + Sort pills */}
      <div className={cx("dlControlRow", "mb12")}>
        <div className={cx("dlFilterPills")}>
          {FILTER_OPTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cx("dlFilterPill", deliverableFilter === opt.value ? "dlFilterPillActive" : "dlFilterPillIdle")}
              onClick={() => setDeliverableFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={cx("dlSortPills")}>
          <span className={cx("dlSortLabel")}>Sort</span>
          {SORT_OPTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cx("dlSortPill", deliverableSort === opt.value ? "dlSortPillActive" : "dlSortPillIdle")}
              onClick={() => setDeliverableSort(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
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
                className={cx("button", "buttonBlue", "dlAddBtn")}
                type="button"
                onClick={onCreateDeliverable}
                disabled={creatingDeliverable || !newDeliverable.projectId || newDeliverable.title.trim().length < 3}
              >
                <span className={cx("dlBtnIco")}><IcoPlus /></span>
                {creatingDeliverable ? "Creating…" : "Create Deliverable"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Stats */}
      <div className={cx("stats", "stats3", "mb20")}>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentRed")} />
          <div className={styles.statLabel}>Overdue</div>
          <div className={styles.statValue}>{milestoneStats.overdue}</div>
          <div className={styles.statSub}>
            <span className={cx("dlStatNote", milestoneStats.overdue ? "dlStatNoteRed" : "dlStatNoteOk")}>
              {milestoneStats.overdue ? (
                <><span className={cx("dlStatIco")}><IcoWarning /></span>Immediate attention</>
              ) : "None overdue"}
            </span>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentAmber")} />
          <div className={styles.statLabel}>Due This Week</div>
          <div className={styles.statValue}>{milestoneStats.dueThisWeek}</div>
          <div className={styles.statSub}>
            <span className={cx("dlStatNote", milestoneStats.dueThisWeek ? "dlStatNoteAmber" : "dlStatNoteOk")}>
              {milestoneStats.dueThisWeek ? "In progress" : "Nothing due"}
            </span>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentGreen")} />
          <div className={styles.statLabel}>Delivered (Month)</div>
          <div className={styles.statValue}>{milestoneStats.deliveredThisMonth}</div>
          <div className={styles.statSub}>
            <span className={cx("dlStatNote", "dlStatNoteOk")}>On track</span>
          </div>
        </div>
      </div>

      {/* Deliverable groups grid */}
      <div className={styles.grid2}>
        {visibleGroups.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="check-square" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No deliverables found</div>
            <div className={cx("emptyStateSub")}>No deliverables match the current filter. Try clearing your search or changing the filter.</div>
          </div>
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
                    <div className={cx("emptyState")}>
                      <div className={cx("emptyStateTitle", "text12")}>No deliverables</div>
                      <div className={cx("emptyStateSub")}>No deliverables listed for this group.</div>
                    </div>
                  ) : (
                    group.items.map((item) => {
                      const statusBadge = item.milestoneStatus ? STATUS_BADGE[item.milestoneStatus] : null;
                      return (
                        <div key={item.title} className={styles.deliverableItem}>
                          <div className={cx("dlCheckIco", item.status && `deliverable${capitalize(item.status)}`)}>
                            {item.status === "done" ? <IcoDone /> : item.status === "doing" ? <IcoDoing /> : <IcoPending />}
                          </div>
                          <div className={styles.flex1}>
                            <div className={cx("dlItemHeader")}>
                              <span className={cx("deliverableTitle", item.titleTone === "var(--muted)" && "dlTitleMuted", item.status === "done" && "dlTitleDone")}>
                                {item.title}
                              </span>
                              {statusBadge ? (
                                <span className={cx("dlStatusChip", statusBadge.cls)}>{statusBadge.label}</span>
                              ) : null}
                            </div>
                            <div className={cx("deliverableMeta", item.metaTone === "var(--accent)" && "dlMetaAccent", item.metaTone === "var(--muted)" && "dlMetaMuted")}>
                              {item.meta}
                            </div>
                            <div className={cx("dlAttachRow")}>
                              <span className={cx("dlAttachIco", item.fileId ? "dlAttachIcoOk" : "dlAttachIcoNone")}><IcoAttach /></span>
                              <span className={cx("dlAttachLabel", item.fileId ? "dlAttachLabelOk" : "dlAttachLabelNone")}>
                                {item.fileName ?? "No file attached"}
                              </span>
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
                              <option value="">— attach a file —</option>
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
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Change Request Queue */}
      <div className={cx("card", "mt20")}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Change Request Queue</span>
          <span className={cx("badge", pendingRequests.length ? "badgeAmber" : "badgeBlue")}>
            {pendingRequests.length} pending
          </span>
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
                      <div className={cx("deliverableMeta", "mt4")}>
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                      <div className={cx("dlEstimateGrid", "mt8")}>
                        <input
                          className={styles.fieldInput}
                          placeholder="Estimated hours"
                          value={draft.hours}
                          onChange={(event) => onEstimateDraftChange(request.id, "hours", event.target.value)}
                        />
                        <input
                          className={styles.fieldInput}
                          placeholder="Cost estimate (cents)"
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
                          className={cx("button", "buttonBlue", "dlSubmitBtn")}
                          onClick={() => onEstimateChangeRequest(request.id)}
                        >
                          <span className={cx("dlBtnIco")}><IcoSend /></span>
                          Submit Estimate
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

      {/* Client Handoff Exports */}
      <div className={cx("card", "mt20")}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Client Handoff Exports</span>
          <div className={styles.dlExportActions}>
            <button
              type="button"
              className={cx("button", "buttonGhost", "dlExportBtn")}
              onClick={() => onGenerateHandoffExport("markdown")}
              disabled={generatingHandoffExport}
            >
              <span className={cx("dlBtnIco")}><IcoMd /></span>
              {generatingHandoffExport ? "Generating…" : "Export MD"}
            </button>
            <button
              type="button"
              className={cx("button", "buttonBlue", "dlExportBtn")}
              onClick={() => onGenerateHandoffExport("json")}
              disabled={generatingHandoffExport}
            >
              <span className={cx("dlBtnIco")}><IcoJson /></span>
              {generatingHandoffExport ? "Generating…" : "Export JSON"}
            </button>
          </div>
        </div>
        <div className={styles.cardBody}>
          {handoffExports.length === 0 ? (
            <div className={styles.emptyState}>No handoff exports yet. Generate one above.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">File</th>
                    <th scope="col">Format</th>
                    <th scope="col">Generated</th>
                    <th scope="col">Contents</th>
                    <th className={cx("textCenter")} scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {handoffExports.slice(0, 8).map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.fileName}</td>
                      <td>
                        <span className={cx("dlFormatChip", entry.format === "json" ? "dlFormatJson" : "dlFormatMd")}>
                          {entry.format.toUpperCase()}
                        </span>
                      </td>
                      <td>{formatDateLong(entry.generatedAt)}</td>
                      <td>
                        <div className={cx("dlHandoffMeta")}>
                          <span className={cx("dlHandoffChip")}>{entry.docs} docs</span>
                          <span className={cx("dlHandoffChip")}>{entry.decisions} decisions</span>
                          {entry.blockers > 0 ? (
                            <span className={cx("dlHandoffChip", "dlHandoffChipRed")}>{entry.blockers} blockers</span>
                          ) : null}
                        </div>
                      </td>
                      <td className={cx("textCenter")}>
                        <button
                          type="button"
                          className={cx("btnXxs", "buttonGhost", "dlDownloadBtn")}
                          onClick={() => onDownloadHandoffExport(entry.id)}
                        >
                          <span className={cx("dlBtnIco")}><IcoDownload /></span>
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
