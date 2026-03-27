"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import {
  loadPortalSignOffsWithRefresh,
  loadProjectRoadmapWithRefresh,
  submitApprovalDecisionWithRefresh,
  type PortalSignOff,
  type RoadmapMilestone,
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

type MStatus = "Approved" | "Pending Approval" | "Revisions Requested" | "Upcoming";
type MTab = "All" | MStatus;

type Milestone = {
  id: string;
  name: string;
  status: MStatus;
  due: string;
  dueRaw: string | null;
  recordedOn: string;
  recordedOnRaw: string;
  completedOn?: string;
  completedOnRaw?: string | null;
  signedByName?: string | null;
  note: string;
  highlight: string;
  paymentStage: string | null;
  sourceStatus: string;
  decisionUpdatedOn: string;
  decisionUpdatedOnRaw: string;
  roadmapMatched: boolean;
};

const STATUS_COLOR: Record<MStatus, string> = {
  "Approved": "var(--lime)",
  "Pending Approval": "var(--amber)",
  "Revisions Requested": "var(--red)",
  "Upcoming": "var(--muted2)",
};

const STATUS_BADGE: Record<MStatus, string> = {
  "Approved": "badgeGreen",
  "Pending Approval": "badgeAmber",
  "Revisions Requested": "badgeRed",
  "Upcoming": "badgeMuted",
};

const STATUS_ICON: Record<MStatus, string> = {
  "Approved": "check",
  "Pending Approval": "clock",
  "Revisions Requested": "alert",
  "Upcoming": "calendar",
};

const TABS: MTab[] = ["All", "Pending Approval", "Approved", "Revisions Requested", "Upcoming"];

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalizeMilestoneName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function getMilestoneStatus(status: string): MStatus {
  const value = status.toUpperCase();
  if (value === "SIGNED" || value === "APPROVED") return "Approved";
  if (value === "PENDING") return "Pending Approval";
  if (value === "REVISION_REQUESTED" || value === "REJECTED") return "Revisions Requested";
  return "Upcoming";
}

function buildRoadmapLookup(milestones: RoadmapMilestone[]): Map<string, RoadmapMilestone> {
  const lookup = new Map<string, RoadmapMilestone>();
  milestones.forEach((milestone) => {
    lookup.set(normalizeMilestoneName(milestone.title), milestone);
  });
  return lookup;
}

function mapSignOffToMilestone(
  signOff: PortalSignOff,
  roadmapLookup: Map<string, RoadmapMilestone>
): Milestone {
  const roadmapMatch = roadmapLookup.get(normalizeMilestoneName(signOff.name));
  const status = getMilestoneStatus(signOff.status);

  return {
    id: signOff.id,
    name: signOff.name,
    status,
    due: formatDate(roadmapMatch?.dueAt ?? null),
    dueRaw: roadmapMatch?.dueAt ?? null,
    recordedOn: formatDate(signOff.createdAt),
    recordedOnRaw: signOff.createdAt,
    completedOn: formatDate(signOff.signedAt),
    completedOnRaw: signOff.signedAt,
    signedByName: signOff.signedByName,
    note: signOff.description ?? "",
    highlight:
      signOff.description?.trim() ||
      (status === "Pending Approval"
        ? "This milestone is ready for your decision."
        : status === "Approved"
          ? "Client approval has been recorded for this milestone."
          : status === "Revisions Requested"
            ? "Revision feedback has been recorded for the team."
            : "This milestone has been logged and will become actionable once it is submitted for approval."),
    paymentStage: roadmapMatch?.paymentStage ?? null,
    sourceStatus: signOff.status,
    decisionUpdatedOn: formatDate(signOff.updatedAt),
    decisionUpdatedOnRaw: signOff.updatedAt,
    roadmapMatched: Boolean(roadmapMatch),
  };
}

export function MilestonesPage() {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<MTab>("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const loadMilestones = useCallback(async (mode: "initial" | "refresh" = "initial"): Promise<boolean> => {
    if (!session || !projectId) {
      setMilestones([]);
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return false;
    }

    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setError(null);

    try {
      const [signOffResult, roadmapResult] = await Promise.all([
        loadPortalSignOffsWithRefresh(session, projectId),
        loadProjectRoadmapWithRefresh(session),
      ]);

      if (signOffResult.nextSession) saveSession(signOffResult.nextSession);
      if (roadmapResult.nextSession) saveSession(roadmapResult.nextSession);

      if (signOffResult.error) {
        setError(signOffResult.error.message ?? "Unable to load milestone approvals.");
        setMilestones([]);
        return false;
      }

      const roadmapProject =
        roadmapResult.data?.projects.find((project) => project.id === projectId) ?? null;
      const roadmapLookup = buildRoadmapLookup(roadmapProject?.milestones ?? []);
      const nextMilestones = (signOffResult.data ?? []).map((item) => mapSignOffToMilestone(item, roadmapLookup));
      setMilestones(nextMilestones);
      return true;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load milestone approvals.");
      setMilestones([]);
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, session]);

  useEffect(() => {
    void loadMilestones("initial");
  }, [loadMilestones]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = tab === "All" ? milestones : milestones.filter((item) => item.status === tab);
    if (!query) return list;
    return list.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query) ||
      (item.paymentStage ?? "").toLowerCase().includes(query)
    );
  }, [milestones, search, tab]);

  const totalCount = milestones.length;
  const approvedCount = milestones.filter((item) => item.status === "Approved").length;
  const pendingCount = milestones.filter((item) => item.status === "Pending Approval").length;
  const revisionCount = milestones.filter((item) => item.status === "Revisions Requested").length;
  const upcomingCount = milestones.filter((item) => item.status === "Upcoming").length;
  const completionPct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
  const nextPending = milestones
    .filter((item) => item.status === "Pending Approval")
    .sort((a, b) => {
      if (!a.dueRaw && !b.dueRaw) return 0;
      if (!a.dueRaw) return 1;
      if (!b.dueRaw) return -1;
      return new Date(a.dueRaw).getTime() - new Date(b.dueRaw).getTime();
    })[0] ?? null;

  async function handleRefresh(): Promise<void> {
    const ok = await loadMilestones("refresh");
    if (ok) {
      notify("success", "Milestones refreshed", "Latest milestone approval activity has been loaded.");
    }
  }

  function handleExport(): void {
    if (filtered.length === 0) {
      notify("info", "Nothing to export", "There are no milestone records in the current view.");
      return;
    }

    const rows = [
      ["Milestone", "Status", "Recorded On", "Due", "Completed On", "Payment Stage", "Signed By", "Latest Note"],
      ...filtered.map((item) => [
        item.name,
        item.status,
        item.recordedOn,
        item.due,
        item.completedOn ?? "—",
        item.paymentStage ?? "—",
        item.signedByName ?? "—",
        item.note.replace(/\s+/g, " ").trim() || "—",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${value.replace(/"/g, "\"\"")}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "milestones-approvals.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("success", "Downloading", "Milestones and approvals CSV is downloading.");
  }

  async function handleDecision(milestoneId: string, status: "APPROVED" | "REVISION_REQUESTED"): Promise<void> {
    if (!session) {
      notify("error", "Sign in required", "Sign in again to submit your milestone decision.");
      return;
    }

    const note = (noteDraft[milestoneId] ?? "").trim();
    if (status === "REVISION_REQUESTED" && !note) {
      notify("error", "Feedback required", "Add revision notes before sending the milestone back.");
      return;
    }

    setActionLoading((prev) => ({ ...prev, [milestoneId]: true }));
    try {
      const result = await submitApprovalDecisionWithRefresh(session, milestoneId, {
        status,
        notes: note || undefined,
      });

      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        notify(
          "error",
          status === "APPROVED" ? "Approval failed" : "Revision request failed",
          result.error.message
        );
        return;
      }

      if (status === "APPROVED") {
        notify("success", "Milestone approved", "Your approval has been recorded and the team has been notified.");
      } else {
        notify("success", "Revision request sent", "Your feedback has been recorded for the delivery team.");
      }

      setNoteDraft((prev) => ({ ...prev, [milestoneId]: "" }));
      await loadMilestones("refresh");
    } finally {
      setActionLoading((prev) => ({ ...prev, [milestoneId]: false }));
    }
  }

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Governance</div>
          <h1 className={cx("pageTitle")}>Milestones & Approvals</h1>
          <p className={cx("pageSub")}>
            Review sign-off items, track what is due next, and submit real approval decisions for your project.
          </p>
        </div>
        <div className={cx("flexRow", "gap8", "noShrink")}>
          <button type="button" className={cx("btnGhost")} onClick={() => void handleRefresh()}>
            <Ic n="refresh" sz={14} /> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className={cx("btnGhost")} onClick={handleExport}>
            <Ic n="download" sz={14} /> Export CSV
          </button>
        </div>
      </div>

      {!projectId && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="flag" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>Choose a project first</div>
          <div className={cx("emptyStateSub")}>
            Milestone approvals are tied to the active project in your client workspace.
          </div>
        </div>
      )}

      {projectId && (
        <>
          <div className={cx("topCardsStack", "mb20")}>
            {([
              ["Total Sign-Offs", totalCount, "statCardAccent"],
              ["Approved", approvedCount, "statCardGreen"],
              ["Pending Approval", pendingCount, "statCardAmber"],
              ["Revisions Requested", revisionCount, "statCardRed"],
            ] as [string, number, string][]).map(([label, value, color]) => (
              <div key={label} className={cx("statCard", color)}>
                <div className={cx("statLabel")}>{label}</div>
                <div className={cx("statValue")}>{value}</div>
              </div>
            ))}
          </div>

          {loading && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateSub")}>Loading milestone approvals…</div>
            </div>
          )}

          {!loading && error && (
            <div className={cx("amberWarnBanner")}>
              <Ic n="alert" sz={16} c="var(--amber)" />
              <div className={cx("flex1")}>
                <span className={cx("fw600", "text12", "colorAmber")}>Unable to load milestone approvals</span>
                <span className={cx("text12", "colorMuted")}> · {error}</span>
              </div>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void loadMilestones("refresh")}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && milestones.length === 0 && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="flag" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No milestone approvals yet</div>
              <div className={cx("emptyStateSub")}>
                Sign-off items will appear here once your delivery team submits milestones for review.
              </div>
            </div>
          )}

          {!loading && !error && milestones.length > 0 && (
            <>
              <div className={cx("grid2", "mb20")}>
                <div className={cx("card")}>
                  <div className={cx("cardHd")}>
                    <Ic n="check" sz={14} c="var(--lime)" />
                    <span className={cx("cardHdTitle", "ml8")}>Approval Snapshot</span>
                    <span className={cx("badge", "badgeMuted", "mlAuto")}>{completionPct}% complete</span>
                  </div>
                  <div className={cx("cardBodyPad")}>
                    <div className={cx("trackH6Mb22")}>
                      <div style={{ "--pct": completionPct + "%" } as React.CSSProperties} />
                    </div>
                    <div className={cx("flexCol", "gap10")}>
                      {([
                        ["Approved", approvedCount, "var(--lime)"],
                        ["Pending", pendingCount, "var(--amber)"],
                        ["Revisions", revisionCount, "var(--red)"],
                        ["Upcoming", upcomingCount, "var(--muted2)"],
                      ] as [string, number, string][]).map(([label, count, color]) => (
                        <div key={label} className={cx("flexRow", "gap8")}>
                          <div className={cx("wh8", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": color } as React.CSSProperties} />
                          <span className={cx("text12", "flex1")}>{label}</span>
                          <span className={cx("fw700", "text12")}>{count}</span>
                          <div className={cx("trackW56h4")}>
                            <div
                              className={cx("pctFillR2", "dynBgColor")}
                              style={{ "--pct": (totalCount > 0 ? (count / totalCount) * 100 : 0) + "%", "--bg-color": color } as React.CSSProperties}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={cx("card")}>
                  <div className={cx("cardHd")}>
                    <Ic n="calendar" sz={14} c="var(--accent)" />
                    <span className={cx("cardHdTitle", "ml8")}>Next Review Window</span>
                  </div>
                  <div className={cx("cardBodyPad", "flexCol", "gap14")}>
                    {nextPending ? (
                      <>
                        <div>
                          <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls008", "mb6")}>Next Pending Milestone</div>
                          <div className={cx("fw700", "text14", "mb4")}>{nextPending.name}</div>
                          <div className={cx("text12", "colorMuted")}>
                            Due {nextPending.due}{nextPending.paymentStage ? " · " + nextPending.paymentStage : ""}
                          </div>
                        </div>
                        <div className={cx("cardS1v2", "p14")}>
                          <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls007", "mb8")}>Latest context</div>
                          <div className={cx("text12")}>{nextPending.highlight}</div>
                        </div>
                      </>
                    ) : (
                      <div className={cx("emptyStateSub")}>
                        There are no milestones awaiting your approval right now. Completed and upcoming sign-offs remain listed below.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {pendingCount > 0 && (
                <div className={cx("amberWarnBanner")}>
                  <Ic n="alert" sz={16} c="var(--amber)" />
                  <div className={cx("flex1")}>
                    <span className={cx("fw600", "text12", "colorAmber")}>
                      {pendingCount} milestone{pendingCount !== 1 ? "s" : ""} awaiting your approval
                    </span>
                    <span className={cx("text12", "colorMuted")}> · Review the pending items below to keep delivery moving.</span>
                  </div>
                </div>
              )}

              <div className={cx("flexRow", "flexCenter", "gap12", "mb16")}>
                <div className={cx("flexRow", "h36")}>
                  <div className={cx("pillTabs")}>
                    {TABS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={cx("pillTab", tab === item && "pillTabActive")}
                        onClick={() => setTab(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={cx("mlAuto", "relative")}>
                  <div className={cx("searchIconWrap")}>
                    <Ic n="filter" sz={13} c="var(--muted2)" />
                  </div>
                  <input
                    className={cx("inputSm", "pl30", "w200")}
                    placeholder="Search milestone approvals…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className={cx("card")}>
                <div className={cx("msColHd")} style={{ gridTemplateColumns: "minmax(0, 2.1fr) 120px 120px 140px 84px" }}>
                  <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls006")}>Milestone</div>
                  <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls006")}>Recorded</div>
                  <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls006")}>Due</div>
                  <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls006")}>Status</div>
                  <div />
                </div>

                {filtered.map((milestone) => {
                  const isExpanded = expanded === milestone.id;
                  const color = STATUS_COLOR[milestone.status];
                  const loadingAction = actionLoading[milestone.id] ?? false;
                  const decisionNote = noteDraft[milestone.id] ?? "";
                  const canReview = milestone.status === "Pending Approval" || milestone.status === "Revisions Requested";

                  return (
                    <div key={milestone.id}>
                      <div
                        onClick={() => setExpanded(isExpanded ? null : milestone.id)}
                        className={cx("msRowHd", "dynBorderLeft3", "dynBgColor")}
                        style={{
                          "--color": color,
                          "--bg-color": isExpanded ? "var(--s2)" : "transparent",
                          gridTemplateColumns: "minmax(0, 2.1fr) 120px 120px 140px 84px",
                        } as React.CSSProperties}
                      >
                        <div className={cx("flexRow", "gap10", "minW0")}>
                          <div
                            className={cx("iconBox40")}
                            style={{ "--bg-color": "color-mix(in oklab, " + color + " 12%, transparent)", "--color": "color-mix(in oklab, " + color + " 25%, transparent)" } as React.CSSProperties}
                          >
                            <Ic n={STATUS_ICON[milestone.status]} sz={16} c={color} />
                          </div>
                          <div className={cx("minW0")}>
                            <div className={cx("flexRow", "flexCenter", "gap8", "mb2", "flexWrap")}>
                              <span className={cx("fw600", "text13")}>{milestone.name}</span>
                              {milestone.paymentStage ? <span className={cx("badge", "badgeMuted")}>{milestone.paymentStage}</span> : null}
                              {!milestone.roadmapMatched ? <span className={cx("badge", "badgeMuted")}>Sign-off only</span> : null}
                            </div>
                            <div className={cx("text11", "colorMuted")}>
                              {milestone.highlight}
                            </div>
                          </div>
                        </div>
                        <div className={cx("text11", "colorMuted")}>{milestone.recordedOn}</div>
                        <div className={cx("text11", "colorMuted")}>{milestone.due}</div>
                        <div>
                          <span className={cx("badge", STATUS_BADGE[milestone.status])}>{milestone.status}</span>
                        </div>
                        <div className={cx("chevronIcon", isExpanded ? "chevronMuted2Rotated" : "chevronMuted2")}>
                          <Ic n="chevronDown" sz={14} c="var(--muted2)" />
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className={cx("msExpandBody", "dynBorderLeft3")} style={{ "--color": color } as React.CSSProperties}>
                          <div className={cx("flexCol", "gap16")}>
                            <div className={cx("grid2Cols", "gap10")}>
                              <div className={cx("cardS1v2", "p14")}>
                                <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls007", "mb8")}>Approval Context</div>
                                <div className={cx("text12", "mb10")}>{milestone.highlight}</div>
                                {milestone.note ? (
                                  <div className={cx("text11", "colorMuted")}>{milestone.note}</div>
                                ) : (
                                  <div className={cx("text11", "colorMuted")}>No additional notes have been recorded for this milestone yet.</div>
                                )}
                              </div>
                              <div className={cx("cardS1v2", "p14")}>
                                <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls007", "mb8")}>Timeline</div>
                                <div className={cx("flexCol", "gap8")}>
                                  <div className={cx("flexBetween", "gap10")}>
                                    <span className={cx("text11", "colorMuted")}>Recorded</span>
                                    <span className={cx("text12", "fw600")}>{milestone.recordedOn}</span>
                                  </div>
                                  <div className={cx("flexBetween", "gap10")}>
                                    <span className={cx("text11", "colorMuted")}>Due date</span>
                                    <span className={cx("text12", "fw600")}>{milestone.due}</span>
                                  </div>
                                  <div className={cx("flexBetween", "gap10")}>
                                    <span className={cx("text11", "colorMuted")}>Last updated</span>
                                    <span className={cx("text12", "fw600")}>{milestone.decisionUpdatedOn}</span>
                                  </div>
                                  <div className={cx("flexBetween", "gap10")}>
                                    <span className={cx("text11", "colorMuted")}>Signed on</span>
                                    <span className={cx("text12", "fw600")}>{milestone.completedOn ?? "—"}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className={cx("cardS1v2", "p14")}>
                              <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls007", "mb8")}>Decision Record</div>
                              <div className={cx("grid2Cols", "gap10")}>
                                <div>
                                  <div className={cx("text10", "colorMuted", "mb3")}>Current status</div>
                                  <div className={cx("fw600", "text12")}>{milestone.status}</div>
                                </div>
                                <div>
                                  <div className={cx("text10", "colorMuted", "mb3")}>Signed by</div>
                                  <div className={cx("fw600", "text12")}>{milestone.signedByName ?? "—"}</div>
                                </div>
                                <div>
                                  <div className={cx("text10", "colorMuted", "mb3")}>Payment stage</div>
                                  <div className={cx("fw600", "text12")}>{milestone.paymentStage ?? "—"}</div>
                                </div>
                                <div>
                                  <div className={cx("text10", "colorMuted", "mb3")}>Source state</div>
                                  <div className={cx("fw600", "text12")}>{milestone.sourceStatus}</div>
                                </div>
                              </div>
                            </div>

                            {canReview ? (
                              <div className={cx("msReviewBox")}>
                                <div className={cx("msReviewBoxHd")}>
                                  <Ic n="alert" sz={13} c={milestone.status === "Revisions Requested" ? "var(--red)" : "var(--amber)"} />
                                  <span className={cx("fw600", "text12", milestone.status === "Revisions Requested" ? "colorRed" : "colorAmber")}>
                                    {milestone.status === "Revisions Requested" ? "Revision Loop Active" : "Approval Required"}
                                  </span>
                                </div>
                                <div className={cx("py14_px", "px16_px")}>
                                  <div className={cx("text12", "fw600", "mb4")}>Submit a real milestone decision</div>
                                  <div className={cx("text11", "colorMuted", "mb12")}>
                                    Approving records the sign-off immediately. Requesting revisions sends your note back to the team.
                                  </div>
                                  <textarea
                                    className={cx("textarea", "resizeV", "mb10")}
                                    rows={3}
                                    placeholder="Add optional approval context or required revisions..."
                                    value={decisionNote}
                                    onChange={(event) => setNoteDraft((prev) => ({ ...prev, [milestone.id]: event.target.value }))}
                                  />
                                  <div className={cx("flexRow", "gap8", "flexWrap")}>
                                    <button
                                      type="button"
                                      className={cx("btnSm", "btnAccent")}
                                      disabled={loadingAction}
                                      onClick={() => void handleDecision(milestone.id, "APPROVED")}
                                    >
                                      <Ic n="check" sz={12} /> {loadingAction ? "Saving..." : "Approve Milestone"}
                                    </button>
                                    <button
                                      type="button"
                                      className={cx("btnSm", "btnGhost")}
                                      disabled={loadingAction}
                                      onClick={() => void handleDecision(milestone.id, "REVISION_REQUESTED")}
                                    >
                                      <Ic n="edit" sz={12} /> Request Revisions
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className={cx("flexCol", "gap12")}>
                            <div className={cx("cardS1v2", "p14")}>
                              <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls007", "mb8")}>Review Readiness</div>
                              <div className={cx("flexCol", "gap8")}>
                                <div className={cx("text12")}>
                                  {milestone.roadmapMatched
                                    ? "Timeline data is linked to this sign-off, so due dates and payment-stage context are available."
                                    : "This sign-off is stored without linked roadmap metadata, so only approval records are available here."}
                                </div>
                                <div className={cx("text11", "colorMuted")}>
                                  {milestone.status === "Pending Approval"
                                    ? "This item is ready for your decision."
                                    : milestone.status === "Approved"
                                      ? "No further action is required unless a new sign-off is issued."
                                      : milestone.status === "Revisions Requested"
                                        ? "The team should revise and resubmit this milestone."
                                        : "This milestone has not been submitted for approval yet."}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {filtered.length === 0 ? (
                  <div className={cx("emptyPad40x16", "textCenter")}>
                    <Ic n="flag" sz={24} c="var(--muted2)" />
                    <div className={cx("text12", "colorMuted", "mt8")}>No milestone approvals match your current filter.</div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
