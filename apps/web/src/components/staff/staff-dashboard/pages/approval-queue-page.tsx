"use client";

import { useCallback, useEffect, useState } from "react";
import { cx, styles } from "../style";
import {
  getStaffApprovals,
  resolveStaffApproval,
  sendStaffApprovalReminderWithRefresh,
  type StaffApprovalItem,
  type ApprovalItemType,
  type ApprovalEntityType
} from "@/lib/api/staff/approvals";
import type { AuthSession } from "@/lib/auth/session";
import { saveSession } from "@/lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type ApprovalQueuePageProps = {
  isActive: boolean;
  session:  AuthSession | null;
  onFeedback?: (tone: "success" | "error" | "warning" | "info", message: string) => void;
};

// ── Icon components ───────────────────────────────────────────────────────────

function IcoCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoX() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcoBell() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1a3.5 3.5 0 0 0-3.5 3.5v2L1 8h10l-1.5-1.5v-2A3.5 3.5 0 0 0 6 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M5 9.5a1 1 0 0 0 2 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_OPTS = ["All", "Milestone", "Change Request", "Design Review"] as const;
type TypeFilter = typeof TYPE_OPTS[number];

/** Threshold in days — items waiting longer show "Send Reminder" */
const REMINDER_THRESHOLD_DAYS = 2;

function priorityTone(p: string) {
  if (p === "Urgent") return "badgeRed";
  if (p === "Normal") return "badgeAmber";
  return "badge";
}

function statusTone(s: string) {
  if (s === "Approved") return "badgeGreen";
  if (s === "Pending")  return "badgeAmber";
  return "badgeRed";
}

/** Map UI ApprovalItemType → API entity-type path segment */
function toEntityType(type: ApprovalItemType): ApprovalEntityType {
  if (type === "Milestone")      return "milestone";
  if (type === "Change Request") return "change-request";
  return "design-review";
}

/** Format ISO date string as human-readable short date */
function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** How many whole days since the given ISO date */
function daysSince(iso: string): number {
  try {
    const ms = Date.now() - new Date(iso).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/** True if item is past its due date */
function isOverdue(item: StaffApprovalItem): boolean {
  if (!item.dueDate) return false;
  return new Date(item.dueDate).getTime() < Date.now();
}

// ── Page component ────────────────────────────────────────────────────────────

export function ApprovalQueuePage({ isActive, session, onFeedback }: ApprovalQueuePageProps) {
  const [items, setItems]         = useState<StaffApprovalItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [resolving, setResolving] = useState<string | null>(null); // item.id being resolved
  const [reminding, setReminding] = useState<string | null>(null); // item.id whose reminder is in flight

  // ── Load approvals ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;

    setLoading(true);
    void getStaffApprovals(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setItems(result.data);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken]);

  // ── Resolve handler ─────────────────────────────────────────────────────
  const handleResolve = useCallback(async (item: StaffApprovalItem, action: "approve" | "reject") => {
    if (!session || resolving) return;
    setResolving(item.id);

    const result = await resolveStaffApproval(session, toEntityType(item.type), item.id, action);
    if (result.nextSession) saveSession(result.nextSession);

    if (result.data) {
      // Optimistically update the item status in local state
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: action === "approve" ? "Approved" : "Rejected" }
            : i
        )
      );
      onFeedback?.(
        "success",
        action === "approve"
          ? `"${item.title}" approved — requester notified.`
          : `"${item.title}" rejected.`
      );
    } else if (result.error) {
      onFeedback?.("error", result.error.message ?? "Failed to process approval.");
    }
    setResolving(null);
  }, [session, resolving, onFeedback]);

  // ── Remind handler ──────────────────────────────────────────────────────
  const handleRemind = useCallback(async (item: StaffApprovalItem) => {
    if (!session || reminding) return;
    setReminding(item.id);

    const result = await sendStaffApprovalReminderWithRefresh(session, item.id);
    if (result.nextSession) saveSession(result.nextSession);

    if (result.data) {
      onFeedback?.("success", `Reminder sent for "${item.title}".`);
    } else if (result.error) {
      onFeedback?.("error", result.error.message ?? "Failed to send reminder.");
    }
    setReminding(null);
  }, [session, reminding, onFeedback]);

  // ── Derived data ────────────────────────────────────────────────────────
  const pending   = items.filter((i) => i.status === "Pending");
  const processed = items.filter((i) => i.status !== "Pending");
  const urgent    = pending.filter((i) => i.priority === "Urgent");
  const approved  = items.filter((i) => i.status === "Approved").length;
  const rejected  = items.filter((i) => i.status === "Rejected").length;

  const filteredPending = typeFilter === "All"
    ? pending
    : pending.filter((i) => i.type === typeFilter);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-approval-queue">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Workflow</div>
        <h1 className={cx("pageTitleText")}>Approval Queue</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Items pending your technical review and approval.</p>
      </div>

      {/* ── 4-stat grid ────────────────────────────────────────────────── */}
      <div className={cx("aqStatGrid", "mb20")}>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentAmber")} />
          <div className={styles.statLabel}>Pending</div>
          <div className={styles.statValue}>{loading ? "…" : pending.length}</div>
          <div className={styles.statSub}>Awaiting action</div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentRed")} />
          <div className={styles.statLabel}>Urgent</div>
          <div className={styles.statValue}>{loading ? "…" : urgent.length}</div>
          <div className={styles.statSub}>
            <span className={urgent.length > 0 ? styles.dn : styles.up}>
              {urgent.length > 0 ? "Act now" : "None urgent"}
            </span>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentGreen")} />
          <div className={styles.statLabel}>Approved</div>
          <div className={styles.statValue}>{loading ? "…" : approved}</div>
          <div className={styles.statSub}>Processed</div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentMuted")} />
          <div className={styles.statLabel}>Rejected</div>
          <div className={styles.statValue}>{loading ? "…" : rejected}</div>
          <div className={styles.statSub}>Declined</div>
        </div>
      </div>

      {/* ── Pending Review card ─────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Pending Review</span>
          {!loading && (
            <span className={cx("badge", pending.length > 0 ? "badgeAmber" : "badgeGreen")}>
              {pending.length > 0 ? `${pending.length} pending` : "Queue clear"}
            </span>
          )}
        </div>

        {/* Type filter pills */}
        <div className={cx("aqFilterRow")}>
          {TYPE_OPTS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={cx("aqFilterPill", typeFilter === opt ? "aqFilterPillActive" : "aqFilterPillIdle")}
              onClick={() => setTypeFilter(opt)}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Type</th>
                <th scope="col">Project</th>
                <th scope="col">Requested By</th>
                <th scope="col">Date</th>
                <th scope="col">Priority</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>Loading approval queue…</td>
                </tr>
              ) : filteredPending.length === 0 ? (
                typeFilter === "All" ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyState}>
                      <div className={cx("emptyState")}>
                        <div className={cx("emptyStateIcon")}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className={cx("emptyStateTitle")}>Queue is clear</div>
                        <div className={cx("emptyStateSub")}>All approval items have been processed.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={7} className={styles.emptyState}>
                      <div className={cx("emptyState")}>
                        <div className={cx("emptyStateSub")}>No items match the selected filter.</div>
                      </div>
                    </td>
                  </tr>
                )
              ) : (
                filteredPending.map((item) => {
                  const waiting = daysSince(item.requestedAt);
                  const overdue = isOverdue(item);
                  const showRemind = waiting >= REMINDER_THRESHOLD_DAYS;

                  return (
                    <tr key={item.id} className={overdue ? cx("aqRowOverdue") : undefined}>
                      <td>
                        <div className={cx("aqItemTitle")}>{item.title}</div>
                        <div className={cx("aqItemClient")}>{item.client}</div>
                        {/* Days waiting / overdue sub-text */}
                        {waiting > 0 && (
                          <div className={overdue ? cx("aqWaitingText", "aqWaitingTextOverdue") : cx("aqWaitingText")}>
                            {overdue ? `Overdue · ${waiting}d waiting` : `Waiting ${waiting} day${waiting === 1 ? "" : "s"}`}
                          </div>
                        )}
                      </td>
                      <td><span className={cx("aqTypeChip")}>{item.type}</span></td>
                      <td className={cx("text12", "colorMuted")}>{item.project}</td>
                      <td className={cx("text12")}>{item.requestedBy}</td>
                      <td className={cx("text12", "colorMuted")}>{fmtDate(item.requestedAt)}</td>
                      <td><span className={cx("badge", priorityTone(item.priority))}>{item.priority}</span></td>
                      <td>
                        <div className={cx("aqActionRow")}>
                          <button
                            type="button"
                            className={cx("aqApproveBtn")}
                            disabled={resolving === item.id}
                            onClick={() => void handleResolve(item, "approve")}
                            aria-label={`Approve ${item.title}`}
                          >
                            <span className={cx("aqBtnIco")}><IcoCheck /></span>
                            {resolving === item.id ? "…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            className={cx("aqRejectBtn")}
                            disabled={resolving === item.id}
                            onClick={() => void handleResolve(item, "reject")}
                            aria-label={`Reject ${item.title}`}
                          >
                            <span className={cx("aqBtnIco")}><IcoX /></span>
                            {resolving === item.id ? "…" : "Reject"}
                          </button>
                          {/* Send Reminder — only shown after threshold days */}
                          {showRemind && (
                            <button
                              type="button"
                              className={cx("aqRemindBtn")}
                              disabled={reminding === item.id}
                              onClick={() => void handleRemind(item)}
                              aria-label={`Send reminder for ${item.title}`}
                            >
                              <span className={cx("aqBtnIco")}><IcoBell /></span>
                              {reminding === item.id ? "…" : "Remind"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── History card ────────────────────────────────────────────────── */}
      {!loading && processed.length > 0 && (
        <div className={cx("card", "mt16")}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>History</span>
            <span className={cx("badge", "badgeMuted")}>{processed.length} processed</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Type</th>
                  <th scope="col">Project</th>
                  <th scope="col">Status</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {processed.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={cx("aqItemTitle")}>{item.title}</div>
                      <div className={cx("aqItemClient")}>{item.client}</div>
                    </td>
                    <td><span className={cx("aqTypeChip")}>{item.type}</span></td>
                    <td className={cx("text12", "colorMuted")}>{item.project}</td>
                    <td><span className={cx("badge", statusTone(item.status))}>{item.status}</span></td>
                    <td className={cx("text12", "colorMuted")}>{fmtDate(item.requestedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
