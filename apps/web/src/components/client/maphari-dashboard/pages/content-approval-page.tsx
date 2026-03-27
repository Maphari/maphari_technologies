"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { saveSession } from "../../../../lib/auth/session";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalContentSubmissionsWithRefresh,
  updatePortalContentSubmissionWithRefresh,
  type PortalContentSubmission,
} from "../../../../lib/api/portal";
import { usePageToast } from "../hooks/use-page-toast";

type SubmissionStatus = "Awaiting Review" | "Approved" | "Revisions Requested";
type ApprovalTab = "All" | SubmissionStatus;

type ContentItem = {
  id: string;
  title: string;
  typeLabel: string;
  status: SubmissionStatus;
  projectLabel: string;
  submittedByLabel: string;
  summary: string;
  submittedLabel: string;
  reviewedLabel: string;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_BADGE: Record<SubmissionStatus, string> = {
  "Awaiting Review": "badgeAmber",
  "Approved": "badgeAccent",
  "Revisions Requested": "badgeRed",
};

const STATUS_ICON: Record<SubmissionStatus, string> = {
  "Awaiting Review": "clock",
  "Approved": "check",
  "Revisions Requested": "alert",
};

const STATUS_COLOR: Record<SubmissionStatus, string> = {
  "Awaiting Review": "var(--amber)",
  "Approved": "var(--lime)",
  "Revisions Requested": "var(--red)",
};

function formatDateLabel(value: string | null): string {
  if (!value) return "Not yet reviewed";
  return new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function mapSubmissionStatus(status: string): SubmissionStatus {
  if (status === "APPROVED") return "Approved";
  if (status === "REVISIONS_REQUESTED") return "Revisions Requested";
  return "Awaiting Review";
}

function mapSubmissionType(type: string | null): string {
  const key = (type ?? "").toUpperCase();
  if (key === "COPYWRITING") return "Copywriting";
  if (key === "DESIGN") return "Design";
  if (key === "VIDEO") return "Video";
  if (key === "SOCIAL") return "Social Media";
  if (key === "EMAIL") return "Email";
  return type?.trim() || "Content";
}

function mapSubmissionToItem(submission: PortalContentSubmission): ContentItem {
  return {
    id: submission.id,
    title: submission.title,
    typeLabel: mapSubmissionType(submission.type),
    status: mapSubmissionStatus(submission.status),
    projectLabel: submission.projectId ?? "Client-wide",
    submittedByLabel: submission.submittedByName?.trim() || "Not recorded",
    summary: submission.notes?.trim() || "No submission notes were included.",
    submittedLabel: formatDateLabel(submission.createdAt),
    reviewedLabel: formatDateLabel(submission.reviewedAt),
    fileUrl: submission.fileUrl,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

function buildContentApprovalCsv(items: ContentItem[]): string {
  const rows = [
    ["Submission ID", "Title", "Type", "Status", "Project", "Submitted By", "Submitted", "Reviewed", "Notes", "File URL"],
    ...items.map((item) => [
      item.id,
      item.title,
      item.typeLabel,
      item.status,
      item.projectLabel,
      item.submittedByLabel,
      item.submittedLabel,
      item.reviewedLabel,
      item.summary,
      item.fileUrl ?? "—",
    ]),
  ];

  return rows
    .map((row) => row.map((value) => '"' + String(value ?? "").replace(/"/g, '""') + '"').join(","))
    .join("\n");
}

export function ContentApprovalPage() {
  const { session } = useProjectLayer();
  const notify = usePageToast();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [tab, setTab] = useState<ApprovalTab>("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [requestingRevision, setRequestingRevision] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchSubmissions(showRefreshToast = false) {
    if (!session) {
      setItems([]);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (loading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError(null);

    try {
      const result = await loadPortalContentSubmissionsWithRefresh(session);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setError(result.error.message ?? "Unable to load content approvals.");
        return;
      }
      const nextItems = (result.data ?? []).map(mapSubmissionToItem);
      setItems(nextItems);
      if (showRefreshToast) {
        notify("success", "Content approvals refreshed", "Latest submission data loaded.");
      }
    } catch (err) {
      setError((err as Error)?.message ?? "Unable to load content approvals.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const filtered = useMemo(() => {
    let list = tab === "All" ? items : items.filter((item) => item.status === tab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((item) =>
        item.title.toLowerCase().includes(q) ||
        item.typeLabel.toLowerCase().includes(q) ||
        item.projectLabel.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.submittedByLabel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, search, tab]);

  const total = items.length;
  const awaiting = items.filter((item) => item.status === "Awaiting Review").length;
  const approved = items.filter((item) => item.status === "Approved").length;
  const revisions = items.filter((item) => item.status === "Revisions Requested").length;
  const withFiles = items.filter((item) => Boolean(item.fileUrl)).length;
  const recentItems = items.slice(0, 5);

  async function handleApprove(id: string) {
    if (!session || actionLoading[id]) return;
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const result = await updatePortalContentSubmissionWithRefresh(session, id, { status: "APPROVED" });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error || !result.data) {
        notify("error", "Approval failed", result.error?.message ?? "Unable to approve this submission.");
        return;
      }
      setItems((prev) => prev.map((item) => (item.id === id ? mapSubmissionToItem(result.data!) : item)));
      setRequestingRevision(null);
      notify("success", "Content approved", "The submission has been marked as approved.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleSendRevision(id: string) {
    if (!session || actionLoading[id]) return;
    const notes = (feedback[id] ?? "").trim();
    if (!notes) {
      notify("error", "Feedback required", "Add revision notes before sending them.");
      return;
    }
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const result = await updatePortalContentSubmissionWithRefresh(session, id, {
        status: "REVISIONS_REQUESTED",
        notes,
      });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error || !result.data) {
        notify("error", "Revision request failed", result.error?.message ?? "Unable to request revisions.");
        return;
      }
      setItems((prev) => prev.map((item) => (item.id === id ? mapSubmissionToItem(result.data!) : item)));
      setRequestingRevision(null);
      notify("success", "Revision notes sent", "The delivery team has your requested changes.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  function handleExportCsv() {
    if (filtered.length === 0) {
      notify("info", "Nothing to export", "There are no submissions in the current view.");
      return;
    }
    const csv = buildContentApprovalCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "content-approvals.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("success", "Downloading", "Content approval CSV is downloading.");
  }

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

  if (!session) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="file" sz={18} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>Sign in to review content submissions</div>
          <div className={cx("emptyStateText")}>Approval items are tied to the client account and appear once your session is active.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Unable to load content approvals</div>
          <div className={cx("errorStateSub")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnGhost", "mt12")} onClick={() => void fetchSubmissions()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Content</div>
          <h1 className={cx("pageTitle")}>Content Approvals</h1>
          <p className={cx("pageSub")}>Review live content submissions, approve completed work, or send revision notes back to the delivery team.</p>
        </div>
        <div className={cx("pageActions", "flexRow", "gap8")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost", "flexRow", "gap6")}
            onClick={() => void fetchSubmissions(true)}
            disabled={refreshing}
          >
            <Ic n="refresh" sz={13} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")} onClick={handleExportCsv}>
            <Ic n="download" sz={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Items", value: total, color: "statCard", icon: "file", ic: "var(--muted2)" },
          { label: "Awaiting Review", value: awaiting, color: "statCardAmber", icon: "clock", ic: "var(--amber)" },
          { label: "Approved", value: approved, color: "statCardGreen", icon: "check", ic: "var(--lime)" },
          { label: "With Files", value: withFiles, color: "statCardBlue", icon: "attachment", ic: "var(--cyan)" },
        ].map((stat) => (
          <div key={stat.label} className={cx("statCard", stat.color)}>
            <div className={cx("flexBetween", "mb8")}>
              <div className={cx("statLabel")}>{stat.label}</div>
              <Ic n={stat.icon} sz={14} c={stat.ic} />
            </div>
            <div className={cx("statValue")}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("grid2", "mb16")}>
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Review Coverage</span>
            <span className={cx("fontMono", "text10", "colorMuted2")}>{total} submissions</span>
          </div>
          <div className={cx("flexCol", "gap10")}>
            {[
              { label: "Awaiting review", count: awaiting, color: "var(--amber)" },
              { label: "Approved", count: approved, color: "var(--lime)" },
              { label: "Revision requested", count: revisions, color: "var(--red)" },
            ].map((item) => {
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.label} className={cx("flexRow", "gap10")}>
                  <div className={cx("wh10", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": item.color } as React.CSSProperties} />
                  <span className={cx("text11", "w140")}>{item.label}</span>
                  <div className={cx("progressTrack", "flex1")}>
                    <div className={cx("pctFillR99", "dynBgColor")} style={{ "--pct": pct, "--bg-color": item.color } as React.CSSProperties} />
                  </div>
                  <span className={cx("fontMono", "fw700", "text11", "dynColor", "w24", "textRight")} style={{ "--color": item.color } as React.CSSProperties}>
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Recent Queue</span>
            <span className={cx("text11", "colorMuted")}>Latest submissions waiting on client review</span>
          </div>
          {recentItems.length === 0 ? (
            <div className={cx("flexCol", "flexCenter", "gap6", "py16")}>
              <Ic n="check" sz={16} c="var(--muted2)" />
              <span className={cx("text11", "colorMuted2")}>No submissions yet</span>
            </div>
          ) : (
            <div className={cx("flexCol", "gap8")}>
              {recentItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cx("infoChipSm", "textLeft")}
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <div className={cx("fw600", "text11", "mb4", "truncate")}>{item.title}</div>
                  <div className={cx("flexRow", "gap6", "flexWrap")}>
                    <span className={cx("fontMono", "text10", "colorAccent")}>{item.id}</span>
                    <span className={cx("badge", STATUS_BADGE[item.status])}>{item.status}</span>
                    <span className={cx("fontMono", "text10", "colorMuted2")}>{item.submittedLabel}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={cx("flexRow", "flexCenter", "gap10", "mb10")}>
        <div className={cx("pillTabs", "mb0", "flex1", "minW0", "overflowXAuto", "noWrap")}>
          {(["All", "Awaiting Review", "Approved", "Revisions Requested"] as const).map((item) => (
            <button key={item} type="button" className={cx("pillTab", tab === item ? "pillTabActive" : "")} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </div>
        <input
          type="text"
          className={cx("input", "w220", "h36", "noShrink")}
          placeholder="Search title, type, project, owner"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className={cx("card", "overflowHidden")}>
        {filtered.length > 0 && (
          <div className={cx("caListHeader")}>
            {["", "Submission", "Type", "Submitted", "Status", ""].map((heading, index) => (
              <span key={index} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{heading}</span>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className={cx("emptyPad48x24", "textCenter")}>
            <Ic n="check" sz={32} c="var(--muted2)" />
            <div className={cx("fw800", "text13", "mt12", "mb4")}>No items</div>
            <div className={cx("text12", "colorMuted")}>
              {search ? 'No results for "' + search + '"' : "No content submissions match this view."}
            </div>
            {search && (
              <button type="button" className={cx("btnSm", "btnGhost", "mt16")} onClick={() => setSearch("")}>
                Clear filter
              </button>
            )}
          </div>
        )}

        {filtered.map((item, index) => {
          const isOpen = expanded === item.id;
          const isRevReq = requestingRevision === item.id;
          return (
            <div
              key={item.id}
              className={cx("dynBorderLeft3", index < filtered.length - 1 && "borderB")}
              style={{ "--color": STATUS_COLOR[item.status] } as React.CSSProperties}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                className={cx("gridRowBtn6colV4")}
                onClick={() => setExpanded(isOpen ? null : item.id)}
              >
                <div className={cx("pmIconBox36", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, " + STATUS_COLOR[item.status] + " 12%, var(--s2))" } as React.CSSProperties}>
                  <Ic n="file" sz={15} c={STATUS_COLOR[item.status]} />
                </div>

                <div className={cx("minW0")}>
                  <div className={cx("fw600", "text12", "truncate")}>{item.title}</div>
                  <div className={cx("flexRow", "flexCenter", "gap6", "mt2", "flexWrap")}>
                    <span className={cx("fontMono", "text10", "colorAccent")}>{item.id}</span>
                    <span className={cx("fontMono", "text10", "colorMuted2")}>{item.projectLabel}</span>
                  </div>
                </div>

                <span className={cx("text11", "colorMuted2", "truncate")}>{item.typeLabel}</span>
                <span className={cx("fontMono", "text10", "colorMuted2")}>{item.submittedLabel}</span>

                <span className={cx("badge", STATUS_BADGE[item.status], "flexRow", "gap4")}>
                  <Ic n={STATUS_ICON[item.status]} sz={9} c="currentColor" />
                  {item.status}
                </span>

                <span className={cx("chevronIcon", "dynTransform", "flexRow", "justifyCenter")} style={{ "--transform": isOpen ? "rotate(90deg)" : "none" } as React.CSSProperties}>
                  <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                </span>
              </button>

              {isOpen && (
                <div className={cx("dynBgColor", "borderT")} style={{ "--bg-color": "color-mix(in oklab, var(--s1) 100%, transparent)" } as React.CSSProperties}>
                  <div className={cx("grid2Cols252")}>
                    <div className={cx("panelL")}>
                      <div className={cx("cardS1v2", "p12x14", "mb12")}>
                        <div className={cx("flexRow", "flexCenter", "gap6", "mb8")}>
                          <div className={cx("dlSectionIconBox", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, var(--cyan) 12%, var(--s2))" } as React.CSSProperties}>
                            <Ic n="file" sz={10} c="var(--cyan)" />
                          </div>
                          <span className={cx("fontMono", "fw700", "text10", "uppercase", "ls01", "colorAccent")}>Submission Notes</span>
                        </div>
                        <div className={cx("text11", "colorMuted", "lineH165")}>{item.summary}</div>
                      </div>

                      {isRevReq && (
                        <div className={cx("caRevisionForm", "cardS1v2")}>
                          <div className={cx("flexRow", "flexCenter", "gap6", "mb8")}>
                            <Ic n="edit" sz={13} c="var(--amber)" />
                            <span className={cx("fw600", "text11", "colorAmber")}>Revision Notes</span>
                          </div>
                          <textarea
                            className={cx("input", "wFull", "resizeV", "mb8")}
                            rows={3}
                            placeholder="Describe the updates needed before approval..."
                            value={feedback[item.id] ?? ""}
                            onChange={(event) => setFeedback((prev) => ({ ...prev, [item.id]: event.target.value }))}
                          />
                          <div className={cx("flexRow", "gap8")}>
                            <button
                              type="button"
                              className={cx("btnSm", "btnAccent")}
                              onClick={() => void handleSendRevision(item.id)}
                              disabled={actionLoading[item.id]}
                            >
                              {actionLoading[item.id] ? "Sending..." : "Send Feedback"}
                            </button>
                            <button
                              type="button"
                              className={cx("btnSm", "btnGhost")}
                              onClick={() => setRequestingRevision(null)}
                              disabled={actionLoading[item.id]}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {!isRevReq && (
                        <div className={cx("cardS1v2", "p12x14", "flexRow", "gap8", "flexWrap")}>
                          {item.status !== "Approved" && (
                            <>
                              <button type="button" className={cx("btnSm", "btnAccent", "flexRow", "gap5")} onClick={() => void handleApprove(item.id)} disabled={actionLoading[item.id]}>
                                <Ic n="check" sz={11} c="var(--bg)" />
                                {actionLoading[item.id] ? "Approving..." : "Approve"}
                              </button>
                              <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap5")} onClick={() => setRequestingRevision(item.id)} disabled={actionLoading[item.id]}>
                                <Ic n="edit" sz={11} c="var(--muted2)" /> Request Revisions
                              </button>
                            </>
                          )}
                          {item.fileUrl && (
                            <a className={cx("btnSm", "btnGhost", "flexRow", "gap5")} href={item.fileUrl} target="_blank" rel="noreferrer">
                              <Ic n="eye" sz={11} c="var(--muted2)" /> Open Asset
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={cx("sectionPanelL")}>
                      <div className={cx("cardS1v2", "p12x14")}>
                        <div className={cx("grid2Cols", "gap8")}>
                        {[
                          { label: "Type", value: item.typeLabel },
                          { label: "Project", value: item.projectLabel },
                          { label: "Submitted By", value: item.submittedByLabel },
                          { label: "Reviewed", value: item.reviewedLabel },
                        ].map((meta) => (
                          <div key={meta.label} className={cx("infoChipSm")}>
                            <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls008", "mb2", "fs058")}>{meta.label}</div>
                            <div className={cx("fw600", "text11")}>{meta.value}</div>
                          </div>
                        ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
