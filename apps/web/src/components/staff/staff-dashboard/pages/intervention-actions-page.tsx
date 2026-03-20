// ════════════════════════════════════════════════════════════════════════════
// intervention-actions-page.tsx — Staff Intervention Actions
// Data : GET /staff/interventions → StaffIntervention[]
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { getStaffInterventions, type StaffIntervention } from "../../../../lib/api/staff/interventions";
import type { AuthSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type InterventionActionsPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_ORDER:   Record<string, number> = { "Open": 0, "In Progress": 1, "Done": 2 };
const PRIORITY_ORDER: Record<string, number> = { "Urgent": 0, "High": 1, "Medium": 2 };

function statusCls(s: string): string {
  if (s === "Open")        return "iavStatusOpen";
  if (s === "In Progress") return "iavStatusProgress";
  return "iavStatusDone";
}

function priorityCls(p: string): string {
  if (p === "Urgent") return "iavPriorityUrgent";
  if (p === "High")   return "iavPriorityHigh";
  return "iavPriorityMedium";
}

function priorityStripCls(p: string): string {
  if (p === "Urgent") return "iavCardUrgent";
  if (p === "High")   return "iavCardHigh";
  return "";
}

function typeCls(t: string): string {
  if (t === "Scope Review")          return "iavTypeScope";
  if (t === "Budget Alert")          return "iavTypeBudget";
  if (t === "Response Time")         return "iavTypeResponse";
  if (t === "Client Re-engagement")  return "iavTypeReengage";
  return "";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "Ongoing";
  try {
    return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className={cx("iavStatCard", "opacity50")}>
      <div className={cx("iavStatCardTop")}>
        <div className={cx("skeleBlock10x50p")} />
        <div className={cx("skeleBlock22x35p")} />
      </div>
      <div className={cx("iavStatCardDivider")} />
      <div className={cx("skeleBlock9x60p")} />
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function InterventionActionsPage({ isActive, session }: InterventionActionsPageProps) {
  const [interventions, setInterventions] = useState<StaffIntervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void getStaffInterventions(session).then((result) => {
      if (cancelled) return;
      if (result.data) setInterventions(result.data);
    }).catch((err) => {
      const msg = err?.message ?? "Failed to load interventions";
      setError(msg);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session, isActive]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const openCount       = interventions.filter((i) => i.status === "Open").length;
  const inProgressCount = interventions.filter((i) => i.status === "In Progress").length;
  const doneCount       = interventions.filter((i) => i.status === "Done").length;
  const overdueCount    = interventions.filter((i) => i.isOverdue).length;

  const sorted = [...interventions].sort((a, b) => {
    const sd = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
    if (sd !== 0) return sd;
    return (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
  });

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-intervention-actions">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-intervention-actions">
      {error && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      )}
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Intervention Actions</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Action items from admin health interventions</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("iavStatGrid")}>
        <div className={cx("iavStatCard")}>
          <div className={cx("iavStatCardTop")}>
            <div className={cx("iavStatLabel")}>Open</div>
            <div className={cx("iavStatValue", openCount > 0 ? "colorRed" : "colorGreen")}>{openCount}</div>
          </div>
          <div className={cx("iavStatCardDivider")} />
          <div className={cx("iavStatCardBottom")}>
            <span className={cx("iavStatDot", "dynBgColor")} style={{ "--bg-color": openCount > 0 ? "var(--red)" : "var(--green)" } as React.CSSProperties} />
            <span className={cx("iavStatMeta")}>{openCount > 0 ? "needs action" : "none open"}</span>
          </div>
        </div>

        <div className={cx("iavStatCard")}>
          <div className={cx("iavStatCardTop")}>
            <div className={cx("iavStatLabel")}>Overdue</div>
            <div className={cx("iavStatValue", overdueCount > 0 ? "colorRed" : "colorGreen")}>{overdueCount}</div>
          </div>
          <div className={cx("iavStatCardDivider")} />
          <div className={cx("iavStatCardBottom")}>
            <span className={cx("iavStatDot", "dynBgColor")} style={{ "--bg-color": overdueCount > 0 ? "var(--red)" : "var(--green)" } as React.CSSProperties} />
            <span className={cx("iavStatMeta")}>{overdueCount > 0 ? "past due date" : "on track"}</span>
          </div>
        </div>

        <div className={cx("iavStatCard")}>
          <div className={cx("iavStatCardTop")}>
            <div className={cx("iavStatLabel")}>In Progress</div>
            <div className={cx("iavStatValue", inProgressCount > 0 ? "colorAmber" : "colorMuted2")}>{inProgressCount}</div>
          </div>
          <div className={cx("iavStatCardDivider")} />
          <div className={cx("iavStatCardBottom")}>
            <span className={cx("iavStatDot", "dynBgColor")} style={{ "--bg-color": inProgressCount > 0 ? "var(--amber)" : "var(--muted2)" } as React.CSSProperties} />
            <span className={cx("iavStatMeta")}>being actioned</span>
          </div>
        </div>

        <div className={cx("iavStatCard")}>
          <div className={cx("iavStatCardTop")}>
            <div className={cx("iavStatLabel")}>Done</div>
            <div className={cx("iavStatValue", "colorGreen")}>{doneCount}</div>
          </div>
          <div className={cx("iavStatCardDivider")} />
          <div className={cx("iavStatCardBottom")}>
            <span className={cx("iavStatDot", "dotBgGreen")} />
            <span className={cx("iavStatMeta")}>resolved</span>
          </div>
        </div>
      </div>

      {/* ── Intervention list ─────────────────────────────────────────────── */}
      {interventions.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="check-circle" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No interventions assigned</div>
          <div className={cx("emptyStateSub")}>Intervention actions created by admin will appear here.</div>
        </div>
      ) : (
        <div className={cx("iavSection")}>
          <div className={cx("iavSectionHeader")}>
            <div className={cx("iavSectionTitle")}>All Interventions</div>
            <span className={cx("iavSectionMeta")}>{interventions.length} ACTIONS</span>
          </div>

          <div className={cx("iavList")}>
            {sorted.map((item, idx) => (
              <div
                key={item.id}
                className={cx(
                  "iavCard",
                  priorityStripCls(item.priority),
                  item.isOverdue && "iavCardOverdue",
                  idx === sorted.length - 1 && "iavCardLast",
                )}
              >
                {/* Head: ID + status */}
                <div className={cx("iavCardHead")}>
                  <span className={cx("iavIntId")}>{item.id}</span>
                  <span className={cx("iavStatusBadge", statusCls(item.status))}>{item.status}</span>
                </div>

                {/* Description */}
                <div className={cx("iavAction")}>{item.description}</div>

                {/* Meta row: type + client + priority */}
                <div className={cx("iavMetaRow")}>
                  <span className={cx("iavTypeBadge", typeCls(item.type))}>{item.type}</span>
                  <span className={cx("iavClientTag")}>{item.clientName}</span>
                  <span className={cx("iavPriorityBadge", priorityCls(item.priority))}>{item.priority}</span>
                </div>

                {/* Footer: created + due date */}
                <div className={cx("iavCardFooter")}>
                  <div className={cx("iavFooterCell")}>
                    <span className={cx("iavFooterLabel")}>Created</span>
                    <span className={cx("iavFooterValue")}>{fmtDate(item.createdAt)}</span>
                  </div>
                  <div className={cx("iavFooterDivider")} />
                  <div className={cx("iavFooterCell")}>
                    <span className={cx("iavFooterLabel")}>Due</span>
                    <div className={cx("iavDueWrap")}>
                      {item.isOverdue && <span className={cx("iavOverduePill")}>Overdue</span>}
                      <span className={cx("iavDueDate", item.isOverdue && "iavDueDateOverdue")}>
                        {fmtDate(item.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
