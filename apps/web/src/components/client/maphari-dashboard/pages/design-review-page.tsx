"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  approvePortalDesignReviewWithRefresh,
  getPortalDesignReviewsWithRefresh,
  type PortalDesignReview,
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

type ReviewTab = "All" | "Awaiting Feedback" | "Approved";

const TABS: ReviewTab[] = ["All", "Awaiting Feedback", "Approved"];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function mapStatus(status: PortalDesignReview["status"]): Exclude<ReviewTab, "All"> {
  return status === "APPROVED" ? "Approved" : "Awaiting Feedback";
}

function exportReviewsCsv(rows: PortalDesignReview[]) {
  const header = ["Title", "Status", "Requested", "Resolved", "Created", "Updated"];
  const lines = rows.map((row) => [
    row.title,
    mapStatus(row.status),
    row.requestedAt,
    row.resolvedAt ?? "",
    row.createdAt,
    row.updatedAt,
  ]);
  const escape = (value: string) => `"${value.replace(/"/g, "\"\"")}"`;
  const csv = [header, ...lines].map((line) => line.map((cell) => escape(String(cell))).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "design-reviews.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function DesignReviewPage() {
  const { session, projectId } = useProjectLayer();

  const [tab, setTab] = useState<ReviewTab>("All");
  const [reviews, setReviews] = useState<PortalDesignReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  function loadReviews() {
    if (!session || !projectId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    void getPortalDesignReviewsWithRefresh(session, projectId)
      .then((result) => {
        if (result.nextSession) saveSession(result.nextSession);
        if (result.error) {
          setError(result.error.message ?? "Unable to load design reviews.");
          setReviews([]);
          return;
        }
        setReviews(result.data ?? []);
      })
      .catch((err: unknown) => {
        setError((err as Error)?.message ?? "Unable to load design reviews.");
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }

  const loadReviewsEffect = useEffectEvent(() => {
    loadReviews();
  });

  useEffect(() => {
    loadReviewsEffect();
  }, [session, projectId]);

  async function handleApprove(review: PortalDesignReview) {
    if (!session || approvingId) return;
    setApprovingId(review.id);
    try {
      const result = await approvePortalDesignReviewWithRefresh(session, review.id);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setError(result.error.message ?? "Unable to approve design review.");
        return;
      }
      setReviews((current) => current.map((item) => item.id === review.id && result.data ? result.data : item));
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Unable to approve design review.");
    } finally {
      setApprovingId(null);
    }
  }

  const totalCount = reviews.length;
  const awaitingCount = reviews.filter((item) => mapStatus(item.status) === "Awaiting Feedback").length;
  const approvedCount = reviews.filter((item) => mapStatus(item.status) === "Approved").length;
  const latestRequest = reviews[0]?.requestedAt ?? null;

  const filtered = useMemo(() => {
    if (tab === "All") return reviews;
    return reviews.filter((item) => mapStatus(item.status) === tab);
  }, [reviews, tab]);

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

  if (!projectId) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="image" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>Select a project first</div>
          <div className={cx("emptyStateSub")}>Design reviews appear once a project is active in your client dashboard.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Unable to load design reviews</div>
          <div className={cx("errorStateSub")}>{error}</div>
          <button type="button" className={cx("btn", "btnPrimary", "mt12")} onClick={loadReviews}>
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
          <div className={cx("pageEyebrow")}>Communication · Design</div>
          <h1 className={cx("pageTitle")}>Design Review</h1>
          <p className={cx("pageSub")}>Review submitted design rounds, confirm approval, and keep the delivery team moving with real sign-off decisions.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={loadReviews}>
            Refresh
          </button>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => exportReviewsCsv(reviews)}>
            Export CSV
          </button>
        </div>
      </div>

      <div className={cx("grid4", "gap12", "mb20")}>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Rounds</div>
          <div className={cx("text22", "fw800", "colorBlue")}>{totalCount}</div>
          <div className={cx("text12", "colorMuted")}>Design submissions in this project</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Awaiting feedback</div>
          <div className={cx("text22", "fw800", "colorAmber")}>{awaitingCount}</div>
          <div className={cx("text12", "colorMuted")}>Reviews still waiting on your approval</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Approved</div>
          <div className={cx("text22", "fw800", "colorSuccess")}>{approvedCount}</div>
          <div className={cx("text12", "colorMuted")}>Rounds already signed off</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Latest request</div>
          <div className={cx("text22", "fw800", "colorAccent")}>{formatDate(latestRequest)}</div>
          <div className={cx("text12", "colorMuted")}>Most recent design submission date</div>
        </div>
      </div>

      <div className={cx("pillTabs", "mb12")}>
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

      {filtered.length === 0 ? (
        <div className={cx("emptyState", "mt32")}>
          <div className={cx("emptyStateIcon")}><Ic n="image" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No design reviews yet</div>
          <div className={cx("emptyStateSub")}>Submitted design rounds will appear here once your team sends them through for client review.</div>
        </div>
      ) : (
        <div className={cx("flexCol", "gap12")}>
          {filtered.map((review) => {
            const status = mapStatus(review.status);
            const canApprove = status === "Awaiting Feedback";
            return (
              <div key={review.id} className={cx("cardS1v2", "p16", "flexCol", "gap12")}>
                <div className={cx("flexBetween", "gap12", "flexWrap")}>
                  <div className={cx("flexCol", "gap6", "minW0")}>
                    <div className={cx("flexRow", "gap8", "alignCenter", "flexWrap")}>
                      <span className={cx("badge", status === "Approved" ? "badgeGreen" : "badgeAmber")}>{status}</span>
                      <span className={cx("badge", "badgeMuted")}>{review.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className={cx("text16", "fw800", "lineH13")}>{review.title}</div>
                    {review.description ? (
                      <div className={cx("text12", "colorMuted", "lineH15")}>{review.description}</div>
                    ) : (
                      <div className={cx("text12", "colorMuted", "lineH15")}>This review was submitted for client approval. Open the linked design file if one has been attached.</div>
                    )}
                  </div>
                  <div className={cx("flexRow", "gap8", "flexWrap")}>
                    {review.figmaUrl ? (
                      <a
                        href={review.figmaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cx("btnSm", "btnGhost", "noUnderline", "flexCenter", "gap4")}
                      >
                        <Ic n="externalLink" sz={12} c="var(--muted)" /> Open design
                      </a>
                    ) : (
                      <button type="button" className={cx("btnSm", "btnGhost")} disabled>
                        No design link
                      </button>
                    )}
                    {canApprove && (
                      <button
                        type="button"
                        className={cx("btnSm", "btnAccent")}
                        onClick={() => handleApprove(review)}
                        disabled={approvingId === review.id}
                      >
                        <Ic n="check" sz={12} c="var(--bg)" /> {approvingId === review.id ? "Approving..." : "Approve"}
                      </button>
                    )}
                  </div>
                </div>

                <div className={cx("grid3Cols12Gap")}>
                  <div className={cx("cardS2", "p12", "flexCol", "gap4")}>
                    <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Requested</div>
                    <div className={cx("text13", "fw700")}>{formatDate(review.requestedAt)}</div>
                    <div className={cx("text11", "colorMuted")}>When the review round was submitted</div>
                  </div>
                  <div className={cx("cardS2", "p12", "flexCol", "gap4")}>
                    <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Resolved</div>
                    <div className={cx("text13", "fw700")}>{formatDate(review.resolvedAt)}</div>
                    <div className={cx("text11", "colorMuted")}>Client approval completion date</div>
                  </div>
                  <div className={cx("cardS2", "p12", "flexCol", "gap4")}>
                    <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Screens</div>
                    <div className={cx("text13", "fw700")}>{review.screensCount ?? "—"}</div>
                    <div className={cx("text11", "colorMuted")}>Attached screen count from the design handoff</div>
                  </div>
                </div>

                {(review.designerNote || review.figmaUrl) && (
                  <div className={cx("cardS2", "p12", "flexCol", "gap8")}>
                    <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Review context</div>
                    {review.designerNote && (
                      <div className={cx("text12", "colorMuted", "lineH15")}>{review.designerNote}</div>
                    )}
                    {review.figmaUrl && (
                      <div className={cx("text12", "colorMuted")}>A design file link is available for this review round.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
