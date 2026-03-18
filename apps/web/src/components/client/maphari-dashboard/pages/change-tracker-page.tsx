"use client";

// ════════════════════════════════════════════════════════════════════════════
// change-tracker-page.tsx — Client Portal Change Tracker (History View)
// Data     : loadPortalChangeRequestsWithRefresh → GET /change-requests
// Note     : Distinct from change-requests-page (decision simulator).
//            This page shows ALL change requests as a timeline/history
//            grouped by date, showing status transitions and approval state.
//            All hardcoded CHANGES data removed.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalChangeRequestsWithRefresh,
  type PortalProjectChangeRequest,
} from "../../../../lib/api/portal";

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterTab = "All" | "Pending" | "Approved" | "Declined" | "Draft";

const TABS: FilterTab[] = ["All", "Pending", "Approved", "Declined", "Draft"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusLabel(status: PortalProjectChangeRequest["status"]): string {
  switch (status) {
    case "CLIENT_APPROVED":
    case "ADMIN_APPROVED":  return "Approved";
    case "CLIENT_REJECTED":
    case "ADMIN_REJECTED":  return "Declined";
    case "SUBMITTED":       return "Pending";
    case "ESTIMATED":       return "Estimated";
    case "DRAFT":           return "Draft";
    default:                return status;
  }
}

function filterCategory(status: PortalProjectChangeRequest["status"]): FilterTab {
  switch (status) {
    case "CLIENT_APPROVED":
    case "ADMIN_APPROVED":  return "Approved";
    case "CLIENT_REJECTED":
    case "ADMIN_REJECTED":  return "Declined";
    case "SUBMITTED":
    case "ESTIMATED":       return "Pending";
    case "DRAFT":           return "Draft";
    default:                return "Pending";
  }
}

function statusBadge(status: PortalProjectChangeRequest["status"]): string {
  switch (status) {
    case "CLIENT_APPROVED":
    case "ADMIN_APPROVED":  return "badgeGreen";
    case "CLIENT_REJECTED":
    case "ADMIN_REJECTED":  return "badgeMuted";
    case "SUBMITTED":
    case "ESTIMATED":       return "badgeAmber";
    case "DRAFT":           return "badgeMuted";
    default:                return "badgeMuted";
  }
}

function borderColor(status: PortalProjectChangeRequest["status"]): string {
  if (status === "CLIENT_APPROVED" || status === "ADMIN_APPROVED") return "var(--lime)";
  if (status === "CLIENT_REJECTED" || status === "ADMIN_REJECTED")  return "var(--b2)";
  if (status === "SUBMITTED" || status === "ESTIMATED")              return "var(--amber)";
  return "var(--b2)";
}

function dotColor(status: PortalProjectChangeRequest["status"]): string {
  if (status === "CLIENT_APPROVED" || status === "ADMIN_APPROVED") return "var(--lime)";
  if (status === "CLIENT_REJECTED" || status === "ADMIN_REJECTED")  return "var(--muted2)";
  if (status === "SUBMITTED" || status === "ESTIMATED")              return "var(--amber)";
  return "var(--muted2)";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function groupKey(iso: string): string {
  // Returns "Mar 2026" style key for grouping
  return new Date(iso).toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}

function centsToRands(cents: number | null): string {
  if (!cents) return "—";
  return "R " + Math.round(cents / 100).toLocaleString("en-ZA");
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChangeTrackerPage() {
  const { session, projectId } = useProjectLayer();

  const [allCrs,  setAllCrs]  = useState<PortalProjectChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState<FilterTab>("All");
  const [expanded,setExpanded]= useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    void loadPortalChangeRequestsWithRefresh(session, projectId ? { projectId } : {})
      .then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (r.data) setAllCrs(r.data);
      })
      .finally(() => setLoading(false));
  }, [session, projectId]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const sorted = [...allCrs].sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
    if (tab === "All") return sorted;
    return sorted.filter((cr) => filterCategory(cr.status) === tab);
  }, [allCrs, tab]);

  // ── Grouped by month ────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, PortalProjectChangeRequest[]>();
    for (const cr of filtered) {
      const key = groupKey(cr.requestedAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(cr);
    }
    return [...map.entries()];
  }, [filtered]);

  // ── Stat counts ────────────────────────────────────────────────────────────
  const pendingCount  = allCrs.filter((c) => filterCategory(c.status) === "Pending").length;
  const approvedCount = allCrs.filter((c) => filterCategory(c.status) === "Approved").length;
  const declinedCount = allCrs.filter((c) => filterCategory(c.status) === "Declined").length;
  const totalCost     = allCrs
    .filter((c) => c.status === "CLIENT_APPROVED" || c.status === "ADMIN_APPROVED")
    .reduce((s, c) => s + (c.estimatedCostCents ?? 0), 0);

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Changes</div>
          <h1 className={cx("pageTitle")}>Change History</h1>
          <p className={cx("pageSub")}>Full timeline of all scope change requests — grouped by date with status transitions and approval records.</p>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Requests", value: loading ? "…" : String(allCrs.length), color: "statCard"       },
          { label: "Pending",        value: loading ? "…" : String(pendingCount),   color: "statCardAmber"  },
          { label: "Approved",       value: loading ? "…" : String(approvedCount),  color: "statCardGreen"  },
          { label: "Approved Cost",  value: loading ? "…" : centsToRands(totalCost), color: "statCardAccent" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className={cx("pillTabs", "mb16")}>
        {TABS.map((t) => (
          <button key={t} type="button" className={cx("pillTab", tab === t && "pillTabActive")} onClick={() => setTab(t)}>
            {t}
            {t !== "All" && !loading && (
              <span className={cx("text10", "colorMuted", "ml4", "opacity60")}>
                {t === "Pending"  ? pendingCount  :
                 t === "Approved" ? approvedCount :
                 t === "Declined" ? declinedCount :
                 allCrs.filter((c) => c.status === "DRAFT").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className={cx("card", "p24", "textCenter")}>
          <div className={cx("colorMuted", "text12")}>Loading change history…</div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div className={cx("card", "p24", "textCenter")}>
          <Ic n="layers" sz={24} c="var(--muted2)" />
          <div className={cx("fw700", "text13", "mt12", "mb4")}>No change requests</div>
          <div className={cx("text12", "colorMuted")}>
            {tab === "All" ? "No change requests have been raised yet." : `No ${tab.toLowerCase()} change requests.`}
          </div>
        </div>
      )}

      {/* ── Timeline grouped by month ── */}
      {!loading && grouped.length > 0 && (
        <div className={cx("flexCol", "gap24")}>
          {grouped.map(([month, crs]) => (
            <div key={month}>
              {/* Month group header */}
              <div className={cx("flexRow", "gap10", "mb12")}>
                <div className={cx("flexDividerLine")} />
                <span className={cx("text10", "colorMuted", "fw700", "ls01")}>
                  {month.toUpperCase()}
                </span>
                <div className={cx("flexDivider")} />
              </div>

              {/* Cards for this month */}
              <div className={cx("flexCol", "gap8")}>
                {crs.map((cr) => {
                  const isOpen = expanded === cr.id;
                  return (
                    <div
                      key={cr.id}
                      className={cx("card", "p0", "overflowHidden", "dynBorderLeft3")}
                      style={{ "--color": borderColor(cr.status) } as React.CSSProperties}
                    >
                      {/* Row header */}
                      <button
                        type="button"
                        className={cx("cardRowBtnSm")}
                        onClick={() => setExpanded(isOpen ? null : cr.id)}
                      >
                        {/* Timeline dot */}
                        <div className={cx("timelineDot10", "dynBgColor")} style={{ "--bg-color": dotColor(cr.status) } as React.CSSProperties} />

                        <div className={cx("flex1", "minW0")}>
                          <div className={cx("fw600", "text12", "truncate")}>
                            {cr.title}
                          </div>
                          <div className={cx("text10", "colorMuted", "mt2")}>
                            {fmtDate(cr.requestedAt)}
                            {cr.requestedByName ? ` · by ${cr.requestedByName}` : ""}
                          </div>
                        </div>

                        <div className={cx("flexRow", "gap8", "noShrink")}>
                          {cr.estimatedCostCents ? (
                            <span className={cx("badge", "badgeAmber")}>{centsToRands(cr.estimatedCostCents)}</span>
                          ) : null}
                          <span className={cx("badge", statusBadge(cr.status))}>
                            {statusLabel(cr.status)}
                          </span>
                          <div className={cx("chevronIcon", isOpen ? "chevronMuted2Rotated" : "chevronMuted2")}>
                            <Ic n="chevronDown" sz={13} c="var(--muted2)" />
                          </div>
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isOpen && (
                        <div className={cx("changeDetailPanel")}>
                          {cr.description ? (
                            <p className={cx("text12", "colorMuted", "lineH17", "mb12")}>
                              {cr.description}
                            </p>
                          ) : null}

                          <div className={cx(cr.clientDecisionNote || cr.adminDecisionNote ? "changeDetailGrid3Mb12" : "changeDetailGrid3")}>
                            {[
                              { label: "Requested",  value: fmtDate(cr.requestedAt) },
                              { label: "Est. Hours", value: cr.estimatedHours ? `${cr.estimatedHours}h` : "—" },
                              { label: "Est. Cost",  value: centsToRands(cr.estimatedCostCents) },
                            ].map((item) => (
                              <div key={item.label} className={cx("infoChip")}>
                                <div className={cx("detailLabel")}>{item.label.toUpperCase()}</div>
                                <div className={cx("fw600", "text11")}>{item.value}</div>
                              </div>
                            ))}
                          </div>

                          {/* Decision notes */}
                          {(cr.clientDecisionNote || cr.adminDecisionNote) && (
                            <div className={cx("infoChip")}>
                              <div className={cx("text10", "colorMuted", "fw700", "ls006", "mb4")}>DECISION NOTE</div>
                              <div className={cx("text11", "colorMuted", "lineH16")}>
                                {cr.clientDecisionNote ?? cr.adminDecisionNote}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
