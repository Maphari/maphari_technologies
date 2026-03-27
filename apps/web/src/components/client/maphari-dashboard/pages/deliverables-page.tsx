"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import {
  loadPortalDeliverablesWithRefresh,
  approvePortalDeliverableWithRefresh,
  requestChangesPortalDeliverableWithRefresh,
  reviewPortalDeliverableWithRefresh,
  type PortalDeliverable,
} from "../../../../lib/api/portal/project-layer";
import { saveSession } from "../../../../lib/auth/session";
import { CommentThread } from "../../../shared/ui/comment-thread";
import {
  getPortalAnnotationsWithRefresh,
  createPortalAnnotationWithRefresh,
  resolvePortalAnnotationWithRefresh,
  type PortalAnnotation,
} from "../../../../lib/api/portal/annotations";

type DStatus = "Accepted" | "Pending Review" | "Changes Requested" | "In Progress" | "Upcoming";
type DTab = "All" | DStatus;

type Deliverable = {
  id: string;
  name: string;
  milestone: string;
  status: DStatus;
  dueLabel: string;
  deliveredLabel: string;
  createdLabel: string;
  updatedLabel: string;
  ownerName: string;
  ownerInitials: string;
  kind: string;
  clientFeedback: string;
  reviewedByName: string | null;
  reviewedAtLabel: string;
};

const STATUS_COLOR: Record<DStatus, string> = {
  "Accepted": "var(--lime)",
  "Pending Review": "var(--amber)",
  "Changes Requested": "var(--red)",
  "In Progress": "var(--cyan)",
  "Upcoming": "var(--muted2)",
};

const STATUS_BADGE: Record<DStatus, string> = {
  "Accepted": "badgeAccent",
  "Pending Review": "badgeAmber",
  "Changes Requested": "badgeRed",
  "In Progress": "badgeCyan",
  "Upcoming": "badgeMuted",
};

const STATUS_ICON: Record<DStatus, string> = {
  "Accepted": "check",
  "Pending Review": "clock",
  "Changes Requested": "edit",
  "In Progress": "activity",
  "Upcoming": "lock",
};

const TABS: DTab[] = ["All", "Pending Review", "In Progress", "Accepted", "Changes Requested", "Upcoming"];

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function apiStatusToUi(status: string): DStatus {
  switch (status) {
    case "ACCEPTED":
    case "APPROVED":
      return "Accepted";
    case "DELIVERED":
    case "PENDING_REVIEW":
      return "Pending Review";
    case "CHANGES_REQUESTED":
      return "Changes Requested";
    case "IN_PROGRESS":
      return "In Progress";
    default:
      return "Upcoming";
  }
}

function deriveKind(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".fig") || lower.includes("figma")) return "Design file";
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".mp4") || lower.includes("video")) return "Video";
  if (lower.includes("prototype")) return "Prototype";
  if (lower.endsWith(".docx") || lower.endsWith(".doc") || lower.includes("spec")) return "Specification";
  return "Deliverable";
}

function mapApiDeliverable(deliverable: PortalDeliverable, index: number): Deliverable {
  const ownerName = deliverable.ownerName ?? "Project team";
  const ownerInitials = ownerName
    .split(" ")
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PT";

  return {
    id: deliverable.id,
    name: deliverable.name,
    milestone: deliverable.milestoneId ? deliverable.milestoneId.slice(-6).toUpperCase() : "M-" + String(index + 1).padStart(2, "0"),
    status: apiStatusToUi(deliverable.status),
    dueLabel: formatDate(deliverable.dueAt),
    deliveredLabel: formatDate(deliverable.deliveredAt),
    createdLabel: formatDate(deliverable.createdAt),
    updatedLabel: formatDate(deliverable.updatedAt),
    ownerName,
    ownerInitials,
    kind: deriveKind(deliverable.name),
    clientFeedback: deliverable.clientFeedback ?? "",
    reviewedByName: deliverable.reviewedByName ?? null,
    reviewedAtLabel: formatDate(deliverable.reviewedAt),
  };
}

function mapUpdatedDeliverable(deliverable: PortalDeliverable, previous: Deliverable): Deliverable {
  const next = mapApiDeliverable(deliverable, 0);
  return {
    ...next,
    milestone: previous.milestone,
  };
}

export function DeliverablesPage() {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();

  const [data, setData] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DTab>("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});

  const [annotations, setAnnotations] = useState<Record<string, PortalAnnotation[]>>({});
  const [annotLoading, setAnnotLoading] = useState<Record<string, boolean>>({});
  const [annotComment, setAnnotComment] = useState<Record<string, string>>({});
  const [annotPage, setAnnotPage] = useState<Record<string, string>>({});
  const [annotSubmitting, setAnnotSubmitting] = useState<Record<string, boolean>>({});

  const loadDeliverables = useCallback(async (mode: "initial" | "refresh" = "initial"): Promise<boolean> => {
    if (!session || !projectId) {
      setData([]);
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return false;
    }

    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setError(null);

    try {
      const result = await loadPortalDeliverablesWithRefresh(session, projectId);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setError(result.error.message ?? "Unable to load deliverables.");
        setData([]);
        return false;
      }
      setData((result.data ?? []).map((item, index) => mapApiDeliverable(item, index)));
      return true;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load deliverables.");
      setData([]);
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, session]);

  useEffect(() => {
    void loadDeliverables("initial");
  }, [loadDeliverables]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = tab === "All" ? data : data.filter((item) => item.status === tab);
    if (!query) return list;
    return list.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.milestone.toLowerCase().includes(query) ||
      item.kind.toLowerCase().includes(query) ||
      item.ownerName.toLowerCase().includes(query)
    );
  }, [data, search, tab]);

  const totalAccepted = data.filter((item) => item.status === "Accepted").length;
  const totalPending = data.filter((item) => item.status === "Pending Review").length;
  const totalChanges = data.filter((item) => item.status === "Changes Requested").length;
  const totalProgress = data.filter((item) => item.status === "In Progress").length;
  const acceptanceRate = data.length > 0 ? Math.round((totalAccepted / data.length) * 100) : 0;

  const milestoneRows = useMemo(() => {
    const milestones = [...new Set(data.map((item) => item.milestone))];
    return milestones.map((milestone) => {
      const items = data.filter((item) => item.milestone === milestone);
      const approved = items.filter((item) => item.status === "Accepted").length;
      return { milestone, total: items.length, approved };
    });
  }, [data]);

  async function handleRefresh(): Promise<void> {
    const ok = await loadDeliverables("refresh");
    if (ok) {
      notify("success", "Deliverables refreshed", "Latest deliverable review activity has been loaded.");
    }
  }

  function handleExport(): void {
    if (data.length === 0) {
      notify("info", "Nothing to export", "There are no deliverables for this project yet.");
      return;
    }

    const rows = [
      ["Deliverable", "Status", "Milestone", "Owner", "Kind", "Created", "Due", "Delivered", "Reviewed At", "Reviewed By", "Client Feedback"],
      ...data.map((item) => [
        item.name,
        item.status,
        item.milestone,
        item.ownerName,
        item.kind,
        item.createdLabel,
        item.dueLabel,
        item.deliveredLabel,
        item.reviewedAtLabel,
        item.reviewedByName ?? "—",
        item.clientFeedback.replace(/\s+/g, " ").trim() || "—",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, "\"\"")}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "deliverables.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("success", "Downloading", "Deliverables CSV is downloading.");
  }

  async function handleApprove(deliverable: Deliverable): Promise<void> {
    if (!session || !projectId || submitting[deliverable.id]) return;
    setSubmitting((prev) => ({ ...prev, [deliverable.id]: true }));
    try {
      const reviewerName = session.user.email.split("@")[0];
      const feedback = feedbackText[deliverable.id]?.trim() || undefined;
      const result = await reviewPortalDeliverableWithRefresh(session, deliverable.id, "APPROVED", feedback, reviewerName);
      if (result.nextSession) saveSession(result.nextSession);

      let updated = result.data;
      if (!updated && result.error) {
        const fallback = await approvePortalDeliverableWithRefresh(session, projectId, deliverable.id);
        if (fallback.nextSession) saveSession(fallback.nextSession);
        if (fallback.error) {
          notify("error", "Approval failed", fallback.error.message);
          return;
        }
        updated = fallback.data;
      }

      if (!updated) {
        notify("error", "Approval failed", result.error?.message ?? "Unable to approve deliverable.");
        return;
      }

      setData((prev) => prev.map((item) => item.id === deliverable.id ? mapUpdatedDeliverable(updated, item) : item));
      notify("success", "Deliverable approved", "Your approval has been recorded.");
    } finally {
      setSubmitting((prev) => ({ ...prev, [deliverable.id]: false }));
    }
  }

  async function handleRequestChanges(deliverable: Deliverable): Promise<void> {
    if (!session || !projectId || submitting[deliverable.id]) return;
    const feedback = feedbackText[deliverable.id]?.trim();
    if (!feedback) {
      notify("error", "Feedback required", "Add revision notes before requesting changes.");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [deliverable.id]: true }));
    try {
      const reviewerName = session.user.email.split("@")[0];
      const result = await reviewPortalDeliverableWithRefresh(session, deliverable.id, "CHANGES_REQUESTED", feedback, reviewerName);
      if (result.nextSession) saveSession(result.nextSession);

      let updated = result.data;
      if (!updated && result.error) {
        const fallback = await requestChangesPortalDeliverableWithRefresh(session, projectId, deliverable.id, feedback);
        if (fallback.nextSession) saveSession(fallback.nextSession);
        if (fallback.error) {
          notify("error", "Request failed", fallback.error.message);
          return;
        }
        updated = fallback.data;
      }

      if (!updated) {
        notify("error", "Request failed", result.error?.message ?? "Unable to request changes.");
        return;
      }

      setData((prev) => prev.map((item) => item.id === deliverable.id ? mapUpdatedDeliverable(updated, item) : item));
      notify("success", "Changes requested", "Your feedback has been sent to the team.");
    } finally {
      setSubmitting((prev) => ({ ...prev, [deliverable.id]: false }));
    }
  }

  async function loadAnnotations(deliverableId: string): Promise<void> {
    if (!session || annotations[deliverableId] !== undefined || annotLoading[deliverableId]) return;
    setAnnotLoading((prev) => ({ ...prev, [deliverableId]: true }));
    const result = await getPortalAnnotationsWithRefresh(session, deliverableId);
    if (result.nextSession) saveSession(result.nextSession);
    setAnnotations((prev) => ({ ...prev, [deliverableId]: result.data ?? [] }));
    setAnnotLoading((prev) => ({ ...prev, [deliverableId]: false }));
  }

  async function handleAddAnnotation(deliverableId: string): Promise<void> {
    const comment = annotComment[deliverableId]?.trim();
    if (!session || !comment || annotSubmitting[deliverableId]) return;
    const rawPage = annotPage[deliverableId]?.trim();
    const pageNumber = rawPage ? parseInt(rawPage, 10) : undefined;
    setAnnotSubmitting((prev) => ({ ...prev, [deliverableId]: true }));
    const result = await createPortalAnnotationWithRefresh(session, deliverableId, {
      comment,
      ...(pageNumber && !isNaN(pageNumber) ? { pageNumber } : {}),
    });
    if (result.nextSession) saveSession(result.nextSession);
    if (result.data) {
      setAnnotations((prev) => ({ ...prev, [deliverableId]: [...(prev[deliverableId] ?? []), result.data!] }));
      setAnnotComment((prev) => ({ ...prev, [deliverableId]: "" }));
      setAnnotPage((prev) => ({ ...prev, [deliverableId]: "" }));
    }
    setAnnotSubmitting((prev) => ({ ...prev, [deliverableId]: false }));
  }

  async function handleResolveAnnotation(deliverableId: string, annotationId: string): Promise<void> {
    if (!session) return;
    const result = await resolvePortalAnnotationWithRefresh(session, annotationId);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.data) {
      setAnnotations((prev) => ({
        ...prev,
        [deliverableId]: (prev[deliverableId] ?? []).map((item) =>
          item.id === annotationId ? { ...item, resolvedAt: result.data!.resolvedAt } : item
        ),
      }));
    }
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

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnGhost", "mt12")} onClick={() => void loadDeliverables("refresh")}>
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
          <div className={cx("pageEyebrow")}>Projects · Deliverables</div>
          <h1 className={cx("pageTitle")}>Deliverables</h1>
          <p className={cx("pageSub")}>Review delivered work, leave feedback, and approve handoffs from one place.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void handleRefresh()}>
            <Ic n="refresh" sz={13} /> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={handleExport}>
            <Ic n="download" sz={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total", value: data.length, color: "statCard", icon: "layers", ic: "var(--muted2)" },
          { label: "Accepted", value: totalAccepted, color: "statCardGreen", icon: "check", ic: "var(--lime)" },
          { label: "Pending Review", value: totalPending, color: "statCardAmber", icon: "clock", ic: "var(--amber)" },
          { label: "Changes Requested", value: totalChanges, color: "statCardRed", icon: "edit", ic: "var(--red)" },
        ].map((item) => (
          <div key={item.label} className={cx("statCard", item.color)}>
            <div className={cx("flexBetween", "mb8")}>
              <div className={cx("statLabel")}>{item.label}</div>
              <Ic n={item.icon} sz={14} c={item.ic} />
            </div>
            <div className={cx("statValue")}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("grid2", "mb16")}>
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Review Progress</span>
            <span className={cx("fontMono", "text10", "colorMuted2")}>{acceptanceRate}% accepted</span>
          </div>
          <div className={cx("flexCol", "gap10", "mb14")}>
            {([
              ["Accepted", totalAccepted, "var(--lime)"],
              ["Pending Review", totalPending, "var(--amber)"],
              ["Changes Requested", totalChanges, "var(--red)"],
              ["In Progress", totalProgress, "var(--cyan)"],
            ] as [string, number, string][]).map(([label, count, color]) => {
              const pct = data.length > 0 ? Math.round((count / data.length) * 100) : 0;
              return (
                <div key={label} className={cx("flexRow", "gap10")}>
                  <div className={cx("wh10", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": color } as React.CSSProperties} />
                  <span className={cx("text11", "w112")}>{label}</span>
                  <div className={cx("progressTrack", "flex1")}>
                    <div className={cx("pctFillR99", "dynBgColor")} style={{ "--pct": pct, "--bg-color": color } as React.CSSProperties} />
                  </div>
                  <span className={cx("fontMono", "fw700", "text11", "w32", "textRight", "noShrink", "mlAuto", "dynColor")} style={{ "--color": color } as React.CSSProperties}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className={cx("progressTrackFlex")}>
            {[totalAccepted, totalPending, totalChanges, totalProgress].filter((count) => count > 0).map((count, index) => {
              const colors = ["var(--lime)", "var(--amber)", "var(--red)", "var(--cyan)"];
              return <div key={index} className={cx("dynFlex", "dynBgColor")} style={{ "--flex": count, "--bg-color": colors[index] } as React.CSSProperties} />;
            })}
          </div>
        </div>

        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Milestone Coverage</span>
          </div>
          <div className={cx("flexCol", "gap10")}>
            {milestoneRows.length === 0 ? (
              <div className={cx("flexCol", "flexCenter", "gap6", "py16")}>
                <Ic n="flag" sz={16} c="var(--muted2)" />
                <span className={cx("text11", "colorMuted2")}>No milestone-linked deliverables yet</span>
              </div>
            ) : (
              milestoneRows.map(({ milestone, total, approved }) => {
                const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
                const color = pct === 100 ? "var(--lime)" : pct > 50 ? "var(--cyan)" : "var(--amber)";
                return (
                  <div key={milestone} className={cx("flexRow", "gap10")}>
                    <span className={cx("badge", "badgeMuted", "w54", "textCenter", "justifyCenter", "noShrink")}>{milestone}</span>
                    <div className={cx("progressTrack")}>
                      <div className={cx("pctFillR99", "dynBgColor")} style={{ "--pct": pct, "--bg-color": color } as React.CSSProperties} />
                    </div>
                    <span className={cx("fontMono", "text10", "colorMuted2", "w54", "textRight")}>{approved}/{total}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {totalPending > 0 && (
        <div className={cx("delivPendingAlert")}>
          <Ic n="clock" sz={14} c="var(--amber)" />
          <span className={cx("text12", "colorAmber")}>
            <strong>{totalPending} deliverable{totalPending !== 1 ? "s" : ""}</strong> awaiting your review.
          </span>
        </div>
      )}

      <div className={cx("flexRow", "flexCenter", "gap12", "mb12")}>
        <div className={cx("flexRow", "gap6", "flex1", "minW0", "overflowXAuto")}>
          {TABS.map((item) => (
            <button key={item} type="button" className={cx("pillTab", tab === item ? "pillTabActive" : "")} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </div>
        <input
          type="text"
          className={cx("input", "w220", "h36", "noShrink")}
          placeholder="Search deliverables…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className={cx("card", "overflowHidden")}>
        {filtered.length > 0 ? (
          <div className={cx("delivColHd")}>
            {["", "Deliverable", "Milestone", "Due", "Status", ""].map((label, index) => (
              <span key={index} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{label}</span>
            ))}
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <div className={cx("emptyPad48x24", "textCenter")}>
            <Ic n="layers" sz={28} c="var(--muted2)" />
            <div className={cx("fw800", "text13", "mt12", "mb4")}>No deliverables found</div>
            <div className={cx("text12", "colorMuted")}>{search ? `No results for "${search}"` : "Nothing in this category yet."}</div>
            {search ? <button type="button" className={cx("btnSm", "btnGhost", "mt16")} onClick={() => setSearch("")}>Clear search</button> : null}
          </div>
        ) : null}

        {filtered.map((deliverable, index) => {
          const isOpen = expanded === deliverable.id;
          const statusColor = STATUS_COLOR[deliverable.status];

          return (
            <div key={deliverable.id} className={cx("dynBorderLeft3", index < filtered.length - 1 && "borderB")} style={{ "--color": statusColor } as React.CSSProperties}>
              <button
                type="button"
                aria-expanded={isOpen}
                className={cx("gridRowBtn6colV5", "cursorPointer")}
                onClick={() => {
                  const nextOpen = !isOpen;
                  setExpanded(nextOpen ? deliverable.id : null);
                  if (nextOpen) void loadAnnotations(deliverable.id);
                }}
              >
                <div className={cx("pmIconBox36", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, " + statusColor + " 12%, var(--s2))", "--color": "color-mix(in oklab, " + statusColor + " 25%, transparent)" } as React.CSSProperties}>
                  <Ic n={STATUS_ICON[deliverable.status]} sz={15} c={statusColor} />
                </div>
                <div className={cx("minW0")}>
                  <div className={cx("fw600", "text12", "truncate")}>{deliverable.name}</div>
                  <div className={cx("flexRow", "flexCenter", "gap6", "mt2")}>
                    <span className={cx("fontMono", "text10", "colorAccent")}>{deliverable.id}</span>
                    <span className={cx("badge", "badgeMuted", "fs06")}>{deliverable.kind}</span>
                  </div>
                </div>
                <span className={cx("badge", "badgeMuted")}>{deliverable.milestone}</span>
                <span className={cx("text11", "colorMuted")}>{deliverable.dueLabel}</span>
                <span className={cx("badge", STATUS_BADGE[deliverable.status], "flexRow", "gap4")}>
                  <Ic n={STATUS_ICON[deliverable.status]} sz={9} c="currentColor" />{deliverable.status}
                </span>
                <span className={cx("chevronIcon", "dynTransform", "flexRow", "justifyCenter")} style={{ "--transform": isOpen ? "rotate(90deg)" : "none" } as React.CSSProperties}>
                  <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                </span>
              </button>

              {isOpen ? (
                <div className={cx("borderT", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, " + statusColor + " 4%, var(--s2))" } as React.CSSProperties}>
                  <div className={cx("grid2Cols260")}>
                    <div className={cx("panelLWide")}>
                      <div className={cx("mb14")}>
                        <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb6")}>Deliverable Record</div>
                        <div className={cx("text12", "colorMuted", "lineH17")}>
                          This item was created on {deliverable.createdLabel}, last updated on {deliverable.updatedLabel}, and is currently marked as {deliverable.status.toLowerCase()}.
                        </div>
                      </div>

                      <CommentThread
                        entityType="deliverable"
                        entityId={deliverable.id}
                        session={session}
                        currentUserName={session?.user?.email?.split("@")[0] ?? "You"}
                        compact
                      />

                      <div className={cx("borderT", "pt14", "mt14")}>
                        <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb10")}>Annotations</div>

                        {annotLoading[deliverable.id] ? (
                          <div className={cx("text11", "colorMuted")}>Loading…</div>
                        ) : (annotations[deliverable.id] ?? []).length === 0 ? (
                          <div className={cx("text11", "colorMuted", "mb10")}>No annotations yet.</div>
                        ) : (
                          <div className={cx("flexCol", "gap8", "mb12")}>
                            {(annotations[deliverable.id] ?? []).map((annotation) => (
                              <div key={annotation.id} className={cx("cardRowS1", "p10x12")}>
                                <div className={cx("flexCol", "gap4", "flex1")}>
                                  <div className={cx("text11", "lineH165")}>{annotation.comment}</div>
                                  <div className={cx("flexRow", "gap8")}>
                                    {annotation.pageNumber !== null ? (
                                      <span className={cx("fontMono", "text10", "colorMuted2")}>p.{annotation.pageNumber}</span>
                                    ) : null}
                                    <span className={cx("fontMono", "text10", "colorMuted2")}>{formatDate(annotation.createdAt)}</span>
                                    {annotation.resolvedAt ? <span className={cx("badge", "badgeAccent", "fs06")}>Resolved</span> : null}
                                  </div>
                                </div>
                                {!annotation.resolvedAt ? (
                                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void handleResolveAnnotation(deliverable.id, annotation.id)} title="Mark as resolved">
                                    <Ic n="check" sz={11} c="var(--lime)" />
                                  </button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className={cx("flexCol", "gap6")}>
                          <textarea
                            className={cx("input")}
                            placeholder="Add a comment or annotation…"
                            value={annotComment[deliverable.id] ?? ""}
                            onChange={(event) => setAnnotComment((prev) => ({ ...prev, [deliverable.id]: event.target.value }))}
                            rows={2}
                            title="Annotation comment"
                          />
                          <div className={cx("flexRow", "gap6")}>
                            <input
                              className={cx("input")}
                              type="number"
                              min={1}
                              placeholder="Page #"
                              value={annotPage[deliverable.id] ?? ""}
                              onChange={(event) => setAnnotPage((prev) => ({ ...prev, [deliverable.id]: event.target.value }))}
                              title="Optional page number"
                            />
                            <button
                              type="button"
                              className={cx("btnSm", "btnAccent")}
                              onClick={() => void handleAddAnnotation(deliverable.id)}
                              disabled={annotSubmitting[deliverable.id] || !(annotComment[deliverable.id]?.trim())}
                            >
                              {annotSubmitting[deliverable.id] ? "Saving…" : "Add Comment"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={cx("p16x20x16x16", "flexCol", "gap14")}>
                      <div className={cx("cardRowS1", "p14x16")}>
                        <Av initials={deliverable.ownerInitials} size={32} />
                        <div>
                          <div className={cx("fw700", "text12")}>{deliverable.ownerName}</div>
                          <div className={cx("text10", "colorMuted2")}>Assigned owner</div>
                        </div>
                      </div>

                      <div className={cx("grid2Cols", "gap7")}>
                        {[
                          { label: "Milestone", value: deliverable.milestone },
                          { label: "Kind", value: deliverable.kind },
                          { label: "Due", value: deliverable.dueLabel },
                          { label: "Delivered", value: deliverable.deliveredLabel },
                          { label: "Reviewed", value: deliverable.reviewedAtLabel },
                          { label: "Reviewed By", value: deliverable.reviewedByName ?? "—" },
                        ].map((item) => (
                          <div key={item.label} className={cx("infoChipSm")}>
                            <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls008", "mb2", "fs058")}>{item.label}</div>
                            <div className={cx("fw600", "text11")}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {deliverable.clientFeedback ? (
                        <div className={cx("delivAuthorNote")}>
                          <div className={cx("flexRow", "flexCenter", "gap5", "mb5")}>
                            <Ic n="info" sz={10} c="var(--amber)" />
                            <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>Latest Client Feedback</span>
                          </div>
                          <div className={cx("text11", "colorMuted", "lineH165")}>{deliverable.clientFeedback}</div>
                        </div>
                      ) : null}

                      {deliverable.status === "Pending Review" || deliverable.status === "Changes Requested" ? (
                        <div className={cx("flexCol", "gap7")}>
                          <textarea
                            className={cx("input")}
                            placeholder="Add review notes…"
                            rows={3}
                            title="Feedback for this review decision"
                            value={feedbackText[deliverable.id] ?? ""}
                            onChange={(event) => setFeedbackText((prev) => ({ ...prev, [deliverable.id]: event.target.value }))}
                          />
                          <button
                            type="button"
                            className={cx("btnSm", "btnAccent", "flexRow", "flexCenter", "justifyCenter", "gap6")}
                            onClick={() => void handleApprove(deliverable)}
                            disabled={submitting[deliverable.id]}
                          >
                            <Ic n="check" sz={11} c="var(--bg)" /> {submitting[deliverable.id] ? "Saving…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            className={cx("btnSm", "btnGhost", "flexRow", "flexCenter", "justifyCenter", "gap6")}
                            onClick={() => void handleRequestChanges(deliverable)}
                            disabled={submitting[deliverable.id]}
                          >
                            <Ic n="edit" sz={11} /> {submitting[deliverable.id] ? "Saving…" : "Request Changes"}
                          </button>
                        </div>
                      ) : deliverable.status === "Accepted" ? (
                        <div className={cx("delivAcceptedBanner")}>
                          <Ic n="check" sz={12} c="var(--lime)" />
                          <span className={cx("fontMono", "fw700", "text11", "colorAccent")}>Accepted</span>
                        </div>
                      ) : deliverable.status === "In Progress" ? (
                        <div className={cx("delivInProgressBanner")}>
                          <Ic n="activity" sz={12} c="var(--cyan)" />
                          <span className={cx("fontMono", "fw700", "text11", "colorCyan")}>In Progress</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
