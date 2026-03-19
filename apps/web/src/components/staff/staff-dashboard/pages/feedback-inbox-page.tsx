// ════════════════════════════════════════════════════════════════════════════
// feedback-inbox-page.tsx — Staff Feedback Inbox
// Data : GET  /staff/feedback → StaffFeedbackItem[]
//        PATCH /staff/feedback/:type/:id/acknowledge
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useState } from "react";
import { cx } from "../style";
import {
  getStaffFeedback,
  acknowledgeStaffFeedback,
  type StaffFeedbackItem,
} from "../../../../lib/api/staff/feedback";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type FeedbackInboxPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function typeCls(t: string): string {
  if (t === "Praise")    return "fbiTypePraise";
  if (t === "Complaint") return "fbiTypeComplaint";
  if (t === "CSAT")      return "fbiTypeCsat";
  if (t === "NPS")       return "fbiTypeNps";
  return "fbiTypeComment";
}

function ratingMax(t: string): number {
  return t === "CSAT" ? 5 : 10;
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className={cx("fbiStatCard", "opacity50")}>
      <div className={cx("fbiStatCardTop")}>
        <div className={cx("skeleBlock10x50p")} />
        <div className={cx("skeleBlock22x35p")} />
      </div>
      <div className={cx("fbiStatCardDivider")} />
      <div className={cx("skeleBlock9x60p")} />
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function FeedbackInboxPage({ isActive, session }: FeedbackInboxPageProps) {
  const [items, setItems]     = useState<StaffFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acking, setAcking]   = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;

    setLoading(true);
    void getStaffFeedback(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setItems(result.data);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken]);

  // ── Acknowledge handler ────────────────────────────────────────────────────
  const handleAck = useCallback(async (item: StaffFeedbackItem) => {
    if (!session || acking) return;
    setAcking(item.id);
    const result = await acknowledgeStaffFeedback(session, item.rawType, item.rawId);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.data) {
      setItems((prev) =>
        prev.map((f) => f.id === item.id ? { ...f, status: result.data!.status } : f)
      );
    }
    setAcking(null);
  }, [session, acking]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const pending    = items.filter((f) => f.status === "PENDING");
  const complaints = items.filter((f) => f.type === "Complaint").length;
  const csatItems  = items.filter((f) => f.type === "CSAT" && f.rating != null);
  const csatAvg    = csatItems.length > 0
    ? (csatItems.reduce((s, f) => s + (f.rating ?? 0), 0) / csatItems.length).toFixed(1)
    : "—";

  const sorted = [...items].sort((a, b) => {
    const aP = a.status === "PENDING" ? 0 : 1;
    const bP = b.status === "PENDING" ? 0 : 1;
    return aP - bP;
  });

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

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-feedback-inbox">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
        <h1 className={cx("pageTitleText")}>Feedback Inbox</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Aggregated client feedback on your deliverables</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("fbiStatGrid")}>
        {loading ? (
          [1, 2, 3, 4].map((n) => <SkeletonStat key={n} />)
        ) : (
          <>
            <div className={cx("fbiStatCard")}>
              <div className={cx("fbiStatCardTop")}>
                <div className={cx("fbiStatLabel")}>Unread</div>
                <div className={cx("fbiStatValue", pending.length > 0 ? "colorAmber" : "colorGreen")}>{pending.length}</div>
              </div>
              <div className={cx("fbiStatCardDivider")} />
              <div className={cx("fbiStatCardBottom")}>
                <span className={cx("fbiStatDot", "dynBgColor")} style={{ "--bg-color": pending.length > 0 ? "var(--amber)" : "var(--green)" } as React.CSSProperties} />
                <span className={cx("fbiStatMeta")}>{pending.length > 0 ? "needs acknowledgement" : "all caught up"}</span>
              </div>
            </div>

            <div className={cx("fbiStatCard")}>
              <div className={cx("fbiStatCardTop")}>
                <div className={cx("fbiStatLabel")}>Complaints</div>
                <div className={cx("fbiStatValue", complaints > 0 ? "colorRed" : "colorGreen")}>{complaints}</div>
              </div>
              <div className={cx("fbiStatCardDivider")} />
              <div className={cx("fbiStatCardBottom")}>
                <span className={cx("fbiStatDot", "dynBgColor")} style={{ "--bg-color": complaints > 0 ? "var(--red)" : "var(--muted2)" } as React.CSSProperties} />
                <span className={cx("fbiStatMeta")}>{complaints > 0 ? "requires action" : "none raised"}</span>
              </div>
            </div>

            <div className={cx("fbiStatCard")}>
              <div className={cx("fbiStatCardTop")}>
                <div className={cx("fbiStatLabel")}>Avg CSAT</div>
                <div className={cx("fbiStatValue", "colorAccent")}>{csatAvg}</div>
              </div>
              <div className={cx("fbiStatCardDivider")} />
              <div className={cx("fbiStatCardBottom")}>
                <span className={cx("fbiStatDot", "dotBgAccent")} />
                <span className={cx("fbiStatMeta")}>out of 5</span>
              </div>
            </div>

            <div className={cx("fbiStatCard")}>
              <div className={cx("fbiStatCardTop")}>
                <div className={cx("fbiStatLabel")}>Total Feedback</div>
                <div className={cx("fbiStatValue")}>{items.length}</div>
              </div>
              <div className={cx("fbiStatCardDivider")} />
              <div className={cx("fbiStatCardBottom")}>
                <span className={cx("fbiStatDot", "dotBgMuted2")} />
                <span className={cx("fbiStatMeta")}>across all projects</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Feedback list ────────────────────────────────────────────────── */}
      {!loading && items.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
          <div className={cx("emptyStateTitle")}>No feedback yet</div>
          <div className={cx("emptyStateSub")}>Client feedback from surveys and support tickets will appear here.</div>
        </div>
      ) : (
        <div className={cx("fbiSection")}>
          <div className={cx("fbiSectionHeader")}>
            <div className={cx("fbiSectionLeft")}>
              <div className={cx("fbiSectionTitle")}>All Feedback</div>
              {pending.length > 0 && (
                <span className={cx("fbiUnreadPill")}>{pending.length} unread</span>
              )}
            </div>
            <span className={cx("fbiSectionMeta")}>{items.length} ITEM{items.length !== 1 ? "S" : ""}</span>
          </div>

          <div className={cx("fbiFeedList")}>
            {sorted.map((item, idx) => {
              const isUnread = item.status === "PENDING";
              return (
                <div
                  key={item.id}
                  className={cx(
                    "fbiCard",
                    isUnread && "fbiCardUnread",
                    idx === sorted.length - 1 && "fbiCardLast",
                  )}
                >
                  {/* Head: avatar + client/project | type + rating + date */}
                  <div className={cx("fbiCardHead")}>
                    <div className={cx("fbiCardLeft")}>
                      <div className={cx("fbiAvatar")}>{initials(item.clientName)}</div>
                      <div>
                        <div className={cx("fbiClientName")}>{item.clientName}</div>
                        <div className={cx("fbiProjectName")}>{item.projectName ?? "—"}</div>
                      </div>
                    </div>
                    <div className={cx("fbiCardRight")}>
                      <span className={cx("fbiTypeBadge", typeCls(item.type))}>{item.type}</span>
                      {item.rating != null && (
                        <span className={cx("fbiRatingChip")}>{item.rating} / {ratingMax(item.type)}</span>
                      )}
                      <span className={cx("fbiDate")}>{fmtDate(item.receivedAt)}</span>
                    </div>
                  </div>

                  {/* Message */}
                  <div className={cx("fbiMessage")}>{item.summary}</div>

                  {/* Footer */}
                  <div className={cx("fbiCardFooter")}>
                    <span className={cx("fbiFeedId")}>{item.id}</span>
                    <span className={cx("fbiFooterSep")} />
                    <span className={cx("fbiAckBadge", isUnread ? "fbiAckPending" : "fbiAckDone")}>
                      {isUnread ? "Unread" : "Acknowledged"}
                    </span>
                    {isUnread && (
                      <>
                        <span className={cx("fbiFooterSep")} />
                        <button
                          type="button"
                          className={cx("fbiAckBtn")}
                          disabled={acking === item.id}
                          onClick={() => void handleAck(item)}
                        >
                          {acking === item.id ? "…" : "Mark as read"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
