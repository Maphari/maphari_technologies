// ════════════════════════════════════════════════════════════════════════════
// request-viewer-page.tsx — Staff: change request viewer
// Data     : getStaffChangeRequests(session) + getStaffClients for client names
// Mapping  : SUBMITTED/ESTIMATED/ADMIN_APPROVED/etc. → display status
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getStaffChangeRequests,
  type StaffChangeRequest,
} from "../../../../lib/api/staff/projects";
import { getStaffClients, type StaffClient } from "../../../../lib/api/staff/clients";
import { cx } from "../style";

// ── Types ─────────────────────────────────────────────────────────────────────

type PageProps = {
  isActive: boolean;
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
};

type RequestItem = StaffChangeRequest & { clientName: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

type DisplayStatus = "New" | "Under Review" | "Estimated" | "Approved" | "Rejected";

function mapStatus(raw: StaffChangeRequest["status"]): DisplayStatus {
  if (raw === "DRAFT" || raw === "SUBMITTED") return "New";
  if (raw === "ESTIMATED") return "Estimated";
  if (raw === "ADMIN_APPROVED" || raw === "CLIENT_APPROVED") return "Approved";
  if (raw === "ADMIN_REJECTED" || raw === "CLIENT_REJECTED") return "Rejected";
  return "Under Review";
}

function statusCls(s: DisplayStatus): string {
  if (s === "New") return "rqvStatusNew";
  if (s === "Under Review") return "rqvStatusReview";
  if (s === "Estimated") return "rqvStatusEstimated";
  if (s === "Approved") return "rqvStatusEstimated";
  if (s === "Rejected") return "rqvStatusNew";
  return "";
}

function priorityFromCost(cents: number | null): "High" | "Medium" | "Low" {
  if (cents === null) return "Low";
  if (cents >= 2_000_000) return "High";
  if (cents >= 500_000) return "Medium";
  return "Low";
}

function priorityCls(p: string): string {
  if (p === "High") return "rqvPriorityHigh";
  if (p === "Medium") return "rqvPriorityMedium";
  return "rqvPriorityLow";
}

function priorityStripCls(p: string): string {
  if (p === "High") return "rqvCardHigh";
  if (p === "Medium") return "rqvCardMedium";
  return "";
}

function fmtCents(cents: number | null): string {
  if (cents === null) return "—";
  const r = cents / 100;
  if (r >= 1_000_000) return `R${(r / 1_000_000).toFixed(1)}M`;
  if (r >= 1_000) return `R${Math.round(r / 1_000)}K`;
  return `R${r.toLocaleString()}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_ORDER: Record<string, number> = {
  New: 0,
  "Under Review": 1,
  Estimated: 2,
  Approved: 3,
  Rejected: 4,
};

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

// ── Component ─────────────────────────────────────────────────────────────────

export function RequestViewerPage({ isActive, session, onNotify }: PageProps) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) return;
    if (!session) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    void Promise.all([
      getStaffChangeRequests(session),
      getStaffClients(session),
    ]).then(([reqResult, clientsResult]) => {
      if (cancelled) return;

      if (reqResult.nextSession) saveSession(reqResult.nextSession);
      if (clientsResult.nextSession) saveSession(clientsResult.nextSession);

      if (reqResult.error) {
        setError(reqResult.error.message);
        onNotify?.("error", "Unable to load change requests.");
        return;
      }

      const clientMap = new Map<string, StaffClient>(
        (clientsResult.data ?? []).map((c) => [c.id, c])
      );

      const items: RequestItem[] = (reqResult.data ?? []).map((r) => ({
        ...r,
        clientName: clientMap.get(r.clientId)?.name ?? r.clientId,
      }));

      setRequests(items);
    }).catch((err: unknown) => {
      if (!cancelled) {
        const msg = (err as Error)?.message ?? "Failed to load";
        setError(msg);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [isActive, session]);

  const totalRequests = requests.length;
  const newCount = requests.filter((r) => mapStatus(r.status) === "New").length;
  const totalHours = requests.reduce((s, r) => s + (r.estimatedHours ?? 0), 0);
  const totalBudget = requests.reduce((s, r) => s + (r.estimatedCostCents ?? 0), 0);

  const sorted = [...requests].sort((a, b) => {
    const sa = STATUS_ORDER[mapStatus(a.status)] ?? 99;
    const sb = STATUS_ORDER[mapStatus(b.status)] ?? 99;
    if (sa !== sb) return sa - sb;
    const pa = priorityFromCost(a.estimatedCostCents);
    const pb = priorityFromCost(b.estimatedCostCents);
    return (PRIORITY_ORDER[pa] ?? 99) - (PRIORITY_ORDER[pb] ?? 99);
  });

  if (!isActive) return null;

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
        </div>
      </div>
    );
  }

  return (
    <section
      className={cx("page", "pageBody", isActive && "pageActive")}
      id="page-request-viewer"
    >
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Request Viewer</h1>
        <p className={cx("pageSubtitleText", "mb20")}>
          Change requests and project briefs to estimate effort
        </p>
      </div>

      {/* ── Summary stats ─────────────────────────────────────────────── */}
      {(
        <div className={cx("rqvStatGrid")}>

          <div className={cx("rqvStatCard")}>
            <div className={cx("rqvStatCardTop")}>
              <div className={cx("rqvStatLabel")}>Requests</div>
              <div className={cx("rqvStatValue", "colorAccent")}>{totalRequests}</div>
            </div>
            <div className={cx("rqvStatCardDivider")} />
            <div className={cx("rqvStatCardBottom")}>
              <span className={cx("rqvStatDot", "dotBgAccent")} />
              <span className={cx("rqvStatMeta")}>total received</span>
            </div>
          </div>

          <div className={cx("rqvStatCard")}>
            <div className={cx("rqvStatCardTop")}>
              <div className={cx("rqvStatLabel")}>New</div>
              <div
                className={cx("rqvStatValue", newCount > 0 ? "colorAmber" : "colorGreen")}
              >
                {newCount}
              </div>
            </div>
            <div className={cx("rqvStatCardDivider")} />
            <div className={cx("rqvStatCardBottom")}>
              <span
                className={cx("rqvStatDot", "dynBgColor")} style={{ "--bg-color": newCount > 0 ? "var(--amber)" : "var(--green)" } as React.CSSProperties}
              />
              <span className={cx("rqvStatMeta")}>
                {newCount > 0 ? "awaiting review" : "all reviewed"}
              </span>
            </div>
          </div>

          <div className={cx("rqvStatCard")}>
            <div className={cx("rqvStatCardTop")}>
              <div className={cx("rqvStatLabel")}>Est. Hours</div>
              <div className={cx("rqvStatValue", "colorMuted2")}>
                {totalHours}
                <span className={cx("rqvStatSuffix")}>h</span>
              </div>
            </div>
            <div className={cx("rqvStatCardDivider")} />
            <div className={cx("rqvStatCardBottom")}>
              <span className={cx("rqvStatDot", "dotBgMuted2")} />
              <span className={cx("rqvStatMeta")}>across all requests</span>
            </div>
          </div>

          <div className={cx("rqvStatCard")}>
            <div className={cx("rqvStatCardTop")}>
              <div className={cx("rqvStatLabel")}>Est. Budget</div>
              <div className={cx("rqvStatValue", "colorAccent")}>
                {fmtCents(totalBudget)}
              </div>
            </div>
            <div className={cx("rqvStatCardDivider")} />
            <div className={cx("rqvStatCardBottom")}>
              <span className={cx("rqvStatDot", "dotBgAccent")} />
              <span className={cx("rqvStatMeta")}>pipeline value</span>
            </div>
          </div>

        </div>
      )}

      {/* ── Request list ──────────────────────────────────────────────── */}
      {(
        <div className={cx("rqvSection")}>
          <div className={cx("rqvSectionHeader")}>
            <div className={cx("rqvSectionTitle")}>All Requests</div>
            <span className={cx("rqvSectionMeta")}>{requests.length} REQUESTS</span>
          </div>

          {requests.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className={cx("emptyStateTitle")}>No change requests</div>
              <div className={cx("emptyStateSub")}>
                There are no change requests associated with your projects yet.
              </div>
            </div>
          ) : (
            <div className={cx("rqvList")}>
              {sorted.map((r, idx) => {
                const displayStatus = mapStatus(r.status);
                const priority = priorityFromCost(r.estimatedCostCents);
                return (
                  <div
                    key={r.id}
                    className={cx(
                      "rqvCard",
                      priorityStripCls(priority),
                      idx === sorted.length - 1 && "rqvCardLast"
                    )}
                  >
                    {/* Head */}
                    <div className={cx("rqvCardHead")}>
                      <span className={cx("rqvReqId")}>
                        {r.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={cx("rqvStatusBadge", statusCls(displayStatus))}>
                        {displayStatus}
                      </span>
                    </div>

                    {/* Title */}
                    <div className={cx("rqvTitle")}>{r.title}</div>

                    {/* Meta row */}
                    <div className={cx("rqvMetaRow")}>
                      <span className={cx("rqvClientTag")}>{r.clientName}</span>
                      <span className={cx("rqvPriorityBadge", priorityCls(priority))}>
                        {priority}
                      </span>
                    </div>

                    {/* Received date */}
                    <div className={cx("rqvReceivedRow")}>
                      <span className={cx("rqvReceivedLabel")}>Received</span>
                      <span className={cx("rqvReceivedDate")}>
                        {fmtDate(r.requestedAt)}
                      </span>
                    </div>

                    {/* Footer */}
                    <div className={cx("rqvCardFooter")}>
                      <div className={cx("rqvFooterCell")}>
                        <span className={cx("rqvFooterLabel")}>Est. Hours</span>
                        <span className={cx("rqvFooterValue")}>
                          {r.estimatedHours != null ? (
                            <>
                              {r.estimatedHours}
                              <span className={cx("rqvFooterSuffix")}>h</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </span>
                      </div>
                      <div className={cx("rqvFooterDivider")} />
                      <div className={cx("rqvFooterCell")}>
                        <span className={cx("rqvFooterLabel")}>Budget</span>
                        <span className={cx("rqvFooterValue", "colorAccent")}>
                          {fmtCents(r.estimatedCostCents)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
