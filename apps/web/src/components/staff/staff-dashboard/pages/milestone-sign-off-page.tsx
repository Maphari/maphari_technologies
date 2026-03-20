// ════════════════════════════════════════════════════════════════════════════
// milestone-sign-off-page.tsx — Staff Milestone Sign-Off Queue
// Data : GET /staff/me/milestone-signoffs → StaffMilestoneSignoff[]
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState, useMemo } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import {
  getStaffMilestoneSignoffs,
  type StaffMilestoneSignoff,
} from "../../../../lib/api/staff/performance";
import { resolveStaffApproval } from "../../../../lib/api/staff/approvals";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type MilestoneSignOffPageProps = {
  isActive:  boolean;
  session:   AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
};

type FilterKey = "all" | "PENDING" | "APPROVED" | "REJECTED";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<string, number> = { PENDING: 0, APPROVED: 1, REJECTED: 2 };

function statusCls(s: string): string {
  if (s === "PENDING")  return "msoStatusPending";
  if (s === "APPROVED") return "msoStatusApproved";
  return "msoStatusRejected";
}

function statusLabel(s: string): string {
  if (s === "PENDING")  return "Awaiting Approval";
  if (s === "APPROVED") return "Approved";
  return "Rejected";
}

function deliverableDone(s: string): boolean {
  return s === "COMPLETED" || s === "APPROVED";
}

function deliverableInProgress(s: string): boolean {
  return s === "IN_PROGRESS";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

function relTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)   return `${days} days ago`;
  if (days < 30)  return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? "s" : ""} ago`;
}

function progressPct(item: StaffMilestoneSignoff): number {
  const total = item.deliverables.length;
  if (total === 0) return item.status === "APPROVED" ? 100 : 0;
  const done = item.deliverables.filter((d) => deliverableDone(d.status)).length;
  return Math.round((done / total) * 100);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className={cx("msoListRow", "opacity40")}>
      <div className={cx("skeleBlock11x55p")} />
      <div className={cx("skeleBlock9x35p")} />
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function MilestoneSignOffPage({ isActive, session, onNotify }: MilestoneSignOffPageProps) {
  const [items, setItems]           = useState<StaffMilestoneSignoff[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [selected, setSelected]     = useState<string | null>(null);
  const [filter, setFilter]         = useState<FilterKey>("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void getStaffMilestoneSignoffs(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error || !result.data) {
        setError(result.error?.message ?? "Failed to load data. Please try again.");
        return;
      }
      setItems(result.data);
      const firstPending = result.data.find((i) => i.status === "PENDING");
      setSelected(firstPending?.id ?? result.data[0]?.id ?? null);
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load data.");
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const sorted = useMemo(() => [...items].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
  ), [items]);

  const filtered = useMemo(() =>
    filter === "all" ? sorted : sorted.filter((i) => i.status === filter),
    [sorted, filter]
  );

  const pending  = items.filter((i) => i.status === "PENDING").length;
  const approved = items.filter((i) => i.status === "APPROVED").length;
  const detail   = items.find((i) => i.id === selected) ?? null;

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all",      label: "All" },
    { key: "PENDING",  label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
  ];

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-milestone-sign-off">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-milestone-sign-off">
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-milestone-sign-off">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Projects</div>
        <h1 className={cx("pageTitleText")}>Milestone Sign-offs</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Client approval requests for project milestones</p>
      </div>

      {/* ── Summary pills ────────────────────────────────────────────────── */}
      <div className={cx("msoSummaryRow")}>
        <div className={cx("msoPill")}>
          <span
            className={cx("msoPillDot", "dynBgColor")}
            style={{ "--bg-color": pending > 0 ? "var(--amber)" : "var(--muted2)" } as React.CSSProperties}
          />
          <span className={cx("msoPillLabel")}>{pending} Pending</span>
        </div>
        <div className={cx("msoPill")}>
          <span className={cx("msoPillDot", "dotBgGreen")} />
          <span className={cx("msoPillLabel")}>{approved} Approved</span>
        </div>
        <div className={cx("msoPill")}>
          <span className={cx("msoPillDot", "dotBgMuted2")} />
          <span className={cx("msoPillLabel")}>{items.length} Total</span>
        </div>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className={cx("msoFilterRow")}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={cx("apptFilterBtn", filter === f.key && "apptFilterBtnActive")}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key !== "all" && (
                <span className={cx("msoFilterCount")}>
                  {items.filter((i) => i.status === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="flag" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No sign-off requests</div>
          <div className={cx("emptyStateSub")}>Milestone approval requests from clients will appear here.</div>
        </div>
      ) : (
        <div className={cx("msoPaneLayout")}>

          {/* ── List pane ── */}
          <div className={cx("msoListPane")}>
            {filtered.length === 0
                ? (
                  <div className={cx("emptyState")}>
                    <div className={cx("emptyStateTitle", "text13")}>No {filter.toLowerCase()} milestones</div>
                  </div>
                )
                : filtered.map((item) => {
                    const pct = progressPct(item);
                    return (
                      <div
                        key={item.id}
                        className={cx("msoListRow", selected === item.id && "msoListRowActive")}
                        onClick={() => setSelected(item.id)}
                      >
                        <div className={cx("msoListRowTop")}>
                          <span className={cx("msoMilestoneTitle")}>{item.milestoneTitle}</span>
                          <span className={cx("msoStatusBadge", statusCls(item.status))}>
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <div className={cx("msoListRowMeta")}>
                          <span>{item.clientName}</span>
                          <span className={cx("msoMetaSep")}>·</span>
                          <span>{item.projectName}</span>
                        </div>
                        <div className={cx("msoListRowFooter")}>
                          {/* Progress bar */}
                          {item.deliverables.length > 0 && (
                            <div className={cx("msoProgressBar")}>
                              <div
                                className={cx("msoProgressBarFill", pct === 100 ? "msoProgressFillGreen" : "msoProgressFillAccent")}
                                style={{ "--pct": `${pct}%` } as React.CSSProperties}
                              />
                            </div>
                          )}
                          <div className={cx("msoListRowDate")}>
                            {relTime(item.requestedAt)}
                            <span className={cx("msoMetaSep")}>·</span>
                            {fmtDate(item.requestedAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
            }
          </div>

          {/* ── Detail pane ── */}
          <div className={cx("msoDetailPane")}>
            {!detail ? (
              <div className={cx("msoDetailEmpty")}>
                <div className={cx("colorMuted2", "text12")}>Select a milestone to view details</div>
              </div>
            ) : (() => {
              const dlvTotal = detail.deliverables.length;
              const dlvDone  = detail.deliverables.filter((d) => deliverableDone(d.status)).length;
              const dlvPct   = dlvTotal > 0 ? Math.round((dlvDone / dlvTotal) * 100) : (detail.status === "APPROVED" ? 100 : 0);

              return (
                <>
                  {/* Head */}
                  <div className={cx("msoDetailHead")}>
                    <div>
                      <div className={cx("msoDetailTitle")}>{detail.milestoneTitle}</div>
                      <div className={cx("msoDetailSub")}>{detail.projectName} · {detail.clientName}</div>
                    </div>
                    <span className={cx("msoStatusBadge", statusCls(detail.status))}>
                      {statusLabel(detail.status)}
                    </span>
                  </div>

                  {/* ── Action buttons (PENDING only) ── */}
                  {detail.status === "PENDING" && (
                    <div className={cx("msoActionRow")}>
                      <button
                        type="button"
                        className={cx("aqApproveBtn")}
                        disabled={actioningId === detail.id}
                        onClick={async () => {
                          if (!session) return;
                          setActioningId(detail.id);
                          const result = await resolveStaffApproval(session, "milestone", detail.id, "approve");
                          if (result.nextSession) saveSession(result.nextSession);
                          if (result.error) {
                            onNotify?.("error", result.error.message ?? "Unable to approve milestone.");
                          } else {
                            onNotify?.("success", `Milestone "${detail.milestoneTitle}" approved.`);
                            setItems((prev) =>
                              prev.map((m) => m.id === detail.id ? { ...m, status: "APPROVED", approvedAt: new Date().toISOString() } : m)
                            );
                          }
                          setActioningId(null);
                        }}
                      >
                        {actioningId === detail.id ? "Processing…" : "✓ Approve"}
                      </button>
                      <button
                        type="button"
                        className={cx("aqRejectBtn")}
                        disabled={actioningId === detail.id}
                        onClick={() => {
                          onNotify?.("info", "Change request submitted to the project manager.");
                          setItems((prev) =>
                            prev.map((m) => m.id === detail.id ? { ...m, status: "REJECTED" } : m)
                          );
                        }}
                      >
                        Request Changes
                      </button>
                    </div>
                  )}

                  {/* Dates */}
                  <div className={cx("msoDateRow")}>
                    <div className={cx("msoDateCell")}>
                      <span className={cx("msoDateLabel")}>Requested</span>
                      <span className={cx("msoDateValue")}>{fmtDate(detail.requestedAt)}</span>
                    </div>
                    <div className={cx("msoDateDivider")} />
                    <div className={cx("msoDateCell")}>
                      <span className={cx("msoDateLabel")}>Approved</span>
                      <span className={cx("msoDateValue")}>{fmtDate(detail.approvedAt)}</span>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div className={cx("msoDlvSection")}>
                    <div className={cx("msoDlvHeader")}>
                      <span className={cx("msoDlvTitle")}>Deliverables</span>
                      <div className={cx("msoDlvHeaderRight")}>
                        {dlvTotal > 0 && (
                          <span className={cx("msoDeliverablesPct", dlvPct === 100 ? "colorGreen" : dlvPct >= 50 ? "colorAmber" : "colorMuted2")}>
                            {dlvDone}/{dlvTotal} complete
                          </span>
                        )}
                        <span className={cx("msoDlvCount")}>{dlvTotal}</span>
                      </div>
                    </div>

                    {/* Deliverables progress bar */}
                    {dlvTotal > 0 && (
                      <div className={cx("msoDetailProgressBar", "mb12")}>
                        <div
                          className={cx("msoDetailProgressFill", dlvPct === 100 ? "msoProgressFillGreen" : "msoProgressFillAccent")}
                          style={{ "--pct": `${dlvPct}%` } as React.CSSProperties}
                        />
                      </div>
                    )}

                    {dlvTotal === 0 ? (
                      <div className={cx("colorMuted2", "text11", "mt8")}>No deliverables listed.</div>
                    ) : (
                      <div className={cx("msoDlvList")}>
                        {detail.deliverables.map((d) => (
                          <div key={d.id} className={cx("msoDlvRow")}>
                            <span className={cx("msoDlvIconWrap")}>
                              {deliverableDone(d.status) ? (
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                  <circle cx="8" cy="8" r="7" fill="var(--green)" fillOpacity=".15" stroke="var(--green)" strokeWidth="1.2"/>
                                  <path d="M5 8l2.5 2.5L11 5.5" stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              ) : deliverableInProgress(d.status) ? (
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                  <circle cx="8" cy="8" r="7" fill="var(--amber)" fillOpacity=".12" stroke="var(--amber)" strokeWidth="1.2"/>
                                  <path d="M8 5v3l2 1.5" stroke="var(--amber)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                  <circle cx="8" cy="8" r="7" stroke="var(--muted2)" strokeWidth="1.2"/>
                                </svg>
                              )}
                            </span>
                            <span className={cx("msoDlvName")}>{d.title}</span>
                            <span className={cx("msoDlvStatus",
                              deliverableDone(d.status) ? "colorGreen" :
                              deliverableInProgress(d.status) ? "colorAmber" : "colorMuted2"
                            )}>
                              {d.status.replace(/_/g, " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Audit trail ── */}
                  <div className={cx("msoTimeline")}>
                    <div className={cx("msoTimelineTitle")}>Timeline</div>
                    <div className={cx("msoTimelineList")}>
                      <div className={cx("msoTimelineItem")}>
                        <span className={cx("msoTimelineDot", "dotBgMuted2")} />
                        <div className={cx("msoTimelineContent")}>
                          <span className={cx("msoTimelineLabel")}>Sign-off requested</span>
                          <span className={cx("msoTimelineDate")}>{fmtDate(detail.requestedAt)}</span>
                        </div>
                      </div>
                      {detail.approvedAt && (
                        <div className={cx("msoTimelineItem")}>
                          <span className={cx("msoTimelineDot", "dotBgGreen")} />
                          <div className={cx("msoTimelineContent")}>
                            <span className={cx("msoTimelineLabel")}>
                              {detail.status === "APPROVED" ? "Approved by client" : "Review completed"}
                            </span>
                            <span className={cx("msoTimelineDate")}>{fmtDate(detail.approvedAt)}</span>
                          </div>
                        </div>
                      )}
                      {detail.status === "PENDING" && (
                        <div className={cx("msoTimelineItem", "msoTimelineItemPending")}>
                          <span className={cx("msoTimelineDot", "dotBgAmber")} />
                          <div className={cx("msoTimelineContent")}>
                            <span className={cx("msoTimelineLabel", "colorAmber")}>Awaiting client review</span>
                            <span className={cx("msoTimelineDate")}>{relTime(detail.requestedAt)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
}
