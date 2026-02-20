import { useState } from "react";
import { cx, styles } from "../style";
import { formatDateLong, formatDateShort, formatMoney, formatStatus, getInitials } from "../utils";
import type { ProjectCard } from "./types";
import type { PortalFile, PortalProjectChangeRequest } from "../../../../lib/api/portal";

type ProjectsPageProps = {
  active: boolean;
  projectsCount: number;
  projectCards: ProjectCard[];
  animateProgress: boolean;
  milestoneApprovals: Record<string, { status: "PENDING" | "APPROVED" | "REJECTED" }>;
  onApproveMilestone: (milestoneId: string) => void;
  onRejectMilestone: (milestoneId: string) => void;
  onExportProjects: () => void;
  currency: string;
  files: PortalFile[];
  changeRequests: PortalProjectChangeRequest[];
  changeRequestForm: {
    projectId: string;
    title: string;
    description: string;
    reason: string;
    impactSummary: string;
  };
  onChangeRequestFormChange: (next: ProjectsPageProps["changeRequestForm"]) => void;
  onSubmitChangeRequest: () => void;
  submittingChangeRequest: boolean;
  onClientDecision: (
    changeRequestId: string,
    status: "CLIENT_APPROVED" | "CLIENT_REJECTED",
    metadata?: { addendumFileId?: string; additionalPaymentInvoiceId?: string; additionalPaymentId?: string }
  ) => void;
};

export function ClientProjectsPage({
  active,
  projectsCount,
  projectCards,
  animateProgress,
  milestoneApprovals,
  onApproveMilestone,
  onRejectMilestone,
  onExportProjects,
  currency,
  files,
  changeRequests,
  changeRequestForm,
  onChangeRequestFormChange,
  onSubmitChangeRequest,
  submittingChangeRequest,
  onClientDecision
}: ProjectsPageProps) {
  const [changeApprovalMeta, setChangeApprovalMeta] = useState<Record<string, { addendumFileId: string; additionalPaymentInvoiceId: string; additionalPaymentId: string }>>({});
  const changeRequestRows = [...changeRequests]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const canSubmit =
    Boolean(changeRequestForm.projectId) &&
    changeRequestForm.title.trim().length >= 3 &&
    !submittingChangeRequest;

  return (
    <section className={cx("page", active && "pageActive")} id="page-projects">
      <div className={styles.pageHeader} id="tour-page-projects">
        <div>
          <div className={styles.pageEyebrow}>Your Engagements</div>
          <div className={styles.pageTitle}>My Projects</div>
          <div className={styles.pageSub}>
            {projectsCount} active project{projectsCount === 1 ? "" : "s"} across your current engagement.
          </div>
        </div>
        <button className={cx("button", "buttonGhost")} type="button" onClick={onExportProjects}>📥 Export</button>
      </div>

      {projectCards.length === 0 ? (
        <div className={styles.card} style={{ padding: 18 }}>
          <div className={styles.cardHeaderTitle}>No projects yet</div>
          <div className={styles.pageSub} style={{ marginTop: 6 }}>
            Projects will appear here as soon as they are created for your account.
          </div>
        </div>
      ) : (
        projectCards.map((project) => (
          <div key={project.id} className={styles.projectCard}>
            <div className={styles.projectCardHeader}>
              <div>
                <div className={styles.projectCardName}>{project.name}</div>
                <div className={styles.projectCardType}>
                  {project.description ?? "Project delivery"} · {formatStatus(project.priority)} priority
                </div>
              </div>
              <span className={cx("badge", project.statusTone)}>{formatStatus(project.status)}</span>
            </div>
            <div className={styles.progressRow} style={{ marginBottom: 6 }}>
              <div className={styles.progressBar} style={{ height: 5 }}>
                <div
                  className={cx("progressFill", project.progressTone)}
                  style={{ width: animateProgress ? `${project.progressPercent}%` : "0%" }}
                />
              </div>
              <span className={styles.progressPct}>{project.progressPercent}%</span>
            </div>
            <div className={styles.projectCardSub}>
              {project.dueAt ? `Due ${formatDateLong(project.dueAt)}` : "Timeline TBD"}
            </div>
            <div className={styles.projectCardBody}>
              <div className={styles.projectCardStat}>
                <div className={styles.projectCardStatLabel}>Deadline</div>
                <div className={styles.projectCardStatValue}>{project.dueAt ? formatDateLong(project.dueAt) : "TBD"}</div>
              </div>
              <div className={styles.projectCardStat}>
                <div className={styles.projectCardStatLabel}>Owner</div>
                <div className={styles.projectCardAvatars}>
                  <div className={styles.avatar} style={{ background: "var(--accent)", color: "#050508" }}>
                    {project.ownerName ? getInitials(project.ownerName) : "M"}
                  </div>
                </div>
              </div>
              <div className={styles.projectCardStat}>
                <div className={styles.projectCardStatLabel}>Budget</div>
                <div className={styles.projectCardStatValue}>{formatMoney(project.budgetCents, currency)}</div>
              </div>
            </div>

            <div className={styles.projectCardMilestones} style={{ marginTop: 10 }}>
              <div className={styles.projectCardMilestonesLabel}>Delivery Team</div>
              <div className={styles.projectCardMilestonesGrid}>
                {project.collaborators.length === 0 ? (
                  <div className={styles.projectCardMilestoneMuted}>
                    <div className={styles.milestoneCheck} style={{ width: 15, height: 15 }} />
                    Team assignments will appear once staff is mapped to tasks.
                  </div>
                ) : (
                  project.collaborators.slice(0, 5).map((member) => (
                    <div key={`${project.id}-${member.name}`} className={styles.projectCardMilestone}>
                      <div className={styles.milestoneCheck} style={{ width: 15, height: 15 }}>
                        {member.activeSessions > 0 ? "•" : ""}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div>{member.name}</div>
                        <div className={styles.milestoneDate}>
                          {formatStatus(member.role)} · {member.taskCount} task{member.taskCount === 1 ? "" : "s"}
                          {member.activeSessions > 0 ? ` · ${member.activeSessions} active` : ""}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.projectCardMilestones}>
              <div className={styles.projectCardMilestonesLabel}>Milestones</div>
              <div className={styles.projectCardMilestonesGrid}>
                {project.milestones.length === 0 ? (
                  <div className={styles.projectCardMilestoneMuted}>
                    <div className={styles.milestoneCheck} style={{ width: 15, height: 15 }}></div>
                    No milestones logged yet
                  </div>
                ) : (
                  project.milestones.slice(0, 6).map((milestone) => {
                    const statusClass =
                      milestone.status === "COMPLETED"
                        ? "milestoneDone"
                        : milestone.status === "IN_PROGRESS"
                        ? "milestoneNow"
                        : "";
                    const rowClass =
                      milestone.status === "COMPLETED"
                        ? styles.projectCardMilestone
                        : milestone.status === "IN_PROGRESS"
                        ? styles.projectCardMilestoneActive
                        : styles.projectCardMilestoneMuted;
                    const approval = milestoneApprovals[milestone.id]?.status ?? "PENDING";
                    return (
                      <div key={milestone.id} className={rowClass}>
                        <div className={cx("milestoneCheck", statusClass)} style={{ width: 15, height: 15, fontSize: "0.5rem" }}>
                          {milestone.status === "COMPLETED" ? "✓" : milestone.status === "IN_PROGRESS" ? "→" : ""}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div>{milestone.title}</div>
                          <div className={styles.milestoneDate}>Approval: {approval}</div>
                          {approval === "PENDING" ? (
                            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                              <button
                                type="button"
                                className={cx("button", "buttonGreen")}
                                style={{ padding: "4px 10px", fontSize: "0.55rem" }}
                                onClick={() => onApproveMilestone(milestone.id)}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className={cx("button", "buttonGhost")}
                                style={{ padding: "4px 10px", fontSize: "0.55rem" }}
                                onClick={() => onRejectMilestone(milestone.id)}
                              >
                                Reject
                              </button>
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
        ))
      )}

      <div className={styles.card} style={{ marginTop: 18 }}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Change Requests</span>
          <span className={styles.pageSub}>Client initiated scope updates</span>
        </div>
        <div className={styles.cardBody}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 14 }}>
            <select
              className={styles.fieldInput}
              value={changeRequestForm.projectId}
              onChange={(event) =>
                onChangeRequestFormChange({ ...changeRequestForm, projectId: event.target.value })
              }
            >
              <option value="">Select project</option>
              {projectCards.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <input
              className={styles.fieldInput}
              placeholder="Request title"
              value={changeRequestForm.title}
              onChange={(event) =>
                onChangeRequestFormChange({ ...changeRequestForm, title: event.target.value })
              }
            />
            <textarea
              className={styles.fieldInput}
              style={{ minHeight: 88, resize: "vertical" }}
              placeholder="Describe what should change"
              value={changeRequestForm.description}
              onChange={(event) =>
                onChangeRequestFormChange({ ...changeRequestForm, description: event.target.value })
              }
            />
            <input
              className={styles.fieldInput}
              placeholder="Business reason"
              value={changeRequestForm.reason}
              onChange={(event) =>
                onChangeRequestFormChange({ ...changeRequestForm, reason: event.target.value })
              }
            />
            <input
              className={styles.fieldInput}
              placeholder="Impact summary (timeline/budget)"
              value={changeRequestForm.impactSummary}
              onChange={(event) =>
                onChangeRequestFormChange({ ...changeRequestForm, impactSummary: event.target.value })
              }
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className={cx("button", "buttonAccent")}
                onClick={onSubmitChangeRequest}
                disabled={!canSubmit}
              >
                {submittingChangeRequest ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </div>

          {changeRequestRows.length === 0 ? (
            <div className={styles.emptyState}>No change requests yet.</div>
          ) : (
            <div className={styles.milestoneList}>
              {changeRequestRows.map((request) => (
                <div key={request.id} className={styles.milestoneItem}>
                  <div className={styles.milestoneTitle} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{request.title}</span>
                    <span
                      className={cx(
                        "badge",
                        request.status === "CLIENT_APPROVED"
                          ? "bgGreen"
                          : request.status === "CLIENT_REJECTED" || request.status === "ADMIN_REJECTED"
                          ? "bgRed"
                          : request.status === "ADMIN_APPROVED"
                          ? "bgPurple"
                          : request.status === "ESTIMATED"
                          ? "bgAmber"
                          : "bgMuted"
                      )}
                    >
                      {formatStatus(request.status)}
                    </span>
                  </div>
                  <div className={styles.milestoneDate}>
                    Requested {formatDateShort(request.createdAt)}
                    {request.estimatedCostCents !== null ? ` · ${formatMoney(request.estimatedCostCents, currency)}` : ""}
                    {request.estimatedHours !== null ? ` · ${request.estimatedHours}h` : ""}
                  </div>
                  {request.staffAssessment ? (
                    <div className={styles.milestoneDate} style={{ marginTop: 4 }}>
                      Staff note: {request.staffAssessment}
                    </div>
                  ) : null}
                  {request.status === "ADMIN_APPROVED" ? (
                    <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                      {request.estimatedCostCents !== null && request.estimatedCostCents > 0 ? (
                        <>
                          <select
                            className={styles.fieldInput}
                            value={changeApprovalMeta[request.id]?.addendumFileId ?? ""}
                            onChange={(event) =>
                              setChangeApprovalMeta((previous) => ({
                                ...previous,
                                [request.id]: {
                                  addendumFileId: event.target.value,
                                  additionalPaymentInvoiceId: previous[request.id]?.additionalPaymentInvoiceId ?? "",
                                  additionalPaymentId: previous[request.id]?.additionalPaymentId ?? ""
                                }
                              }))
                            }
                          >
                            <option value="">Select signed addendum file</option>
                            {files
                              .filter((file) => /addendum|agreement|contract/i.test(file.fileName))
                              .map((file) => (
                                <option key={`${request.id}-${file.id}`} value={file.id}>{file.fileName}</option>
                              ))}
                          </select>
                          <input
                            className={styles.fieldInput}
                            placeholder="Additional payment invoice ID"
                            value={changeApprovalMeta[request.id]?.additionalPaymentInvoiceId ?? ""}
                            onChange={(event) =>
                              setChangeApprovalMeta((previous) => ({
                                ...previous,
                                [request.id]: {
                                  addendumFileId: previous[request.id]?.addendumFileId ?? "",
                                  additionalPaymentInvoiceId: event.target.value,
                                  additionalPaymentId: previous[request.id]?.additionalPaymentId ?? ""
                                }
                              }))
                            }
                          />
                          <input
                            className={styles.fieldInput}
                            placeholder="Additional payment ID"
                            value={changeApprovalMeta[request.id]?.additionalPaymentId ?? ""}
                            onChange={(event) =>
                              setChangeApprovalMeta((previous) => ({
                                ...previous,
                                [request.id]: {
                                  addendumFileId: previous[request.id]?.addendumFileId ?? "",
                                  additionalPaymentInvoiceId: previous[request.id]?.additionalPaymentInvoiceId ?? "",
                                  additionalPaymentId: event.target.value
                                }
                              }))
                            }
                          />
                          <div className={styles.pageSub} style={{ marginTop: 0 }}>
                            Priced scope changes require a signed addendum and additional payment confirmation.
                          </div>
                        </>
                      ) : null}
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className={cx("button", "buttonAccent")}
                          style={{ padding: "5px 10px", fontSize: "0.58rem" }}
                          onClick={() =>
                            onClientDecision(request.id, "CLIENT_APPROVED", {
                              addendumFileId: changeApprovalMeta[request.id]?.addendumFileId,
                              additionalPaymentInvoiceId: changeApprovalMeta[request.id]?.additionalPaymentInvoiceId,
                              additionalPaymentId: changeApprovalMeta[request.id]?.additionalPaymentId
                            })
                          }
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className={cx("button", "buttonGhost")}
                          style={{ padding: "5px 10px", fontSize: "0.58rem" }}
                          onClick={() => onClientDecision(request.id, "CLIENT_REJECTED")}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
