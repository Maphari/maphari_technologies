"use client";

// ════════════════════════════════════════════════════════════════════════════
// change-requests-page.tsx — Client Portal Change Requests (Decision Simulator)
// Data     : loadPortalChangeRequestsWithRefresh  → GET /change-requests
//            createPortalChangeRequestWithRefresh → POST /change-requests
//            updatePortalChangeRequestWithRefresh → PATCH /change-requests/:id
// Static   : BASE_END_DATE, BASE_BUDGET (project baseline, no API yet)
//            D_COLOR, D_BG (UI-only visual mapping)
// ════════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalChangeRequestsWithRefresh,
  createPortalChangeRequestWithRefresh,
  updatePortalChangeRequestWithRefresh,
  type PortalProjectChangeRequest,
} from "../../../../lib/api/portal";

// ── Types ─────────────────────────────────────────────────────────────────────

type Decision = "Approve" | "Defer" | "Reject" | null;

// ── Static display constants ───────────────────────────────────────────────────

const BASE_END_DATE = "Apr 25 2026";
const BASE_BUDGET   = 280_000;

function addDays(dateStr: string, days: number): string {
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7 };
  const parts = dateStr.split(" ");
  const dt    = new Date(+parts[2], months[parts[0]] ?? 0, +parts[1]);
  dt.setDate(dt.getDate() + days);
  return dt.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

const D_COLOR: Record<string, string> = {
  Approve: "var(--lime)",
  Defer:   "var(--amber)",
  Reject:  "var(--muted2)",
};
const D_BG: Record<string, string> = {
  Approve: "color-mix(in oklab, var(--lime)   8%, transparent)",
  Defer:   "color-mix(in oklab, var(--amber)  7%, transparent)",
  Reject:  "color-mix(in oklab, var(--muted2) 6%, transparent)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function badgeClass(status: string): string {
  if (status === "CLIENT_APPROVED" || status === "ADMIN_APPROVED") return "badgeGreen";
  if (status === "CLIENT_REJECTED" || status === "ADMIN_REJECTED") return "badgeRed";
  if (status === "SUBMITTED" || status === "ESTIMATED")            return "badgeAmber";
  return "badgeMuted";
}

function statusLabel(status: string): string {
  if (status === "CLIENT_APPROVED")  return "Approved";
  if (status === "CLIENT_REJECTED")  return "Declined";
  if (status === "ADMIN_APPROVED")   return "Approved";
  if (status === "ADMIN_REJECTED")   return "Declined";
  if (status === "SUBMITTED")        return "Pending";
  if (status === "ESTIMATED")        return "Estimated";
  if (status === "DRAFT")            return "Draft";
  return status;
}

function isPendingClientAction(cr: PortalProjectChangeRequest): boolean {
  return cr.status === "ESTIMATED" || cr.status === "ADMIN_APPROVED";
}

function isHistorical(cr: PortalProjectChangeRequest): boolean {
  return (
    cr.status === "CLIENT_APPROVED" ||
    cr.status === "CLIENT_REJECTED" ||
    cr.status === "ADMIN_REJECTED"
  );
}

// Derive cost display from API data (estimatedCostCents → Rands)
function costRands(cents: number | null): number {
  return cents ? Math.round(cents / 100) : 0;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChangeRequestsPage() {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();

  const [allCrs,     setAllCrs]     = useState<PortalProjectChangeRequest[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [decisions,  setDecisions]  = useState<Record<string, Decision>>({});
  const [showNew,    setShowNew]    = useState(false);
  const [title,      setTitle]      = useState("");
  const [desc,       setDesc]       = useState("");
  const [showHistory,setShowHistory]= useState(false);

  // Fetch change requests from API
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    void loadPortalChangeRequestsWithRefresh(session, projectId ? { projectId } : {}).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setAllCrs(r.data);
    }).finally(() => setLoading(false));
  }, [session, projectId]);

  // Partition: actionable (pending client decision) vs historical
  const pendingCrs    = useMemo(() => allCrs.filter((c) => isPendingClientAction(c)), [allCrs]);
  const historicalCrs = useMemo(() => allCrs.filter((c) => isHistorical(c)),          [allCrs]);

  const toggle = (id: string, d: Decision) =>
    setDecisions((p) => ({ ...p, [id]: p[id] === d ? null : d }));

  const impact = useMemo(() => {
    const approved = pendingCrs.filter((cr) => decisions[cr.id] === "Approve");
    return {
      cost:  approved.reduce((a, c) => a + costRands(c.estimatedCostCents), 0),
      hours: approved.reduce((a, c) => a + (c.estimatedHours ?? 0), 0),
      count: approved.length,
    };
  }, [decisions, pendingCrs]);

  const allDecided = pendingCrs.length > 0 && pendingCrs.every((cr) => !!decisions[cr.id]);
  const undecided  = pendingCrs.filter((cr) => !decisions[cr.id]).length;

  // Submit new change request
  async function handleSubmitNew() {
    if (!session || !title.trim() || !projectId) {
      setShowNew(false);
      setTitle("");
      setDesc("");
      return;
    }
    setSubmitting(true);
    const r = await createPortalChangeRequestWithRefresh(session, {
      projectId,
      title: title.trim(),
      description: desc.trim() || undefined,
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (!r.error && r.data) {
      setAllCrs((prev) => [r.data!, ...prev]);
      notify("success", "Change request submitted", "Your request is under review by the team.");
    } else if (r.error) {
      notify("error", "Submission failed", r.error.message ?? "Could not submit your change request.");
    }
    setSubmitting(false);
    setShowNew(false);
    setTitle("");
    setDesc("");
  }

  // Lock in client decisions — PATCH each decided CR to CLIENT_APPROVED or CLIENT_REJECTED
  async function handleLockDecisions() {
    if (!session) return;
    setSubmitting(true);
    const statusMap = {
      Approve: "CLIENT_APPROVED",
      Reject:  "CLIENT_REJECTED",
      Defer:   "DEFERRED",
    } as const;
    const updates = pendingCrs
      .filter((cr) => !!decisions[cr.id])
      .map((cr) =>
        updatePortalChangeRequestWithRefresh(session, cr.id, {
          status: statusMap[decisions[cr.id]!],
        })
      );
    const results = await Promise.all(updates);
    let successCount = 0;
    let failCount = 0;
    results.forEach((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        setAllCrs((prev) => prev.map((c) => (c.id === r.data!.id ? r.data! : c)));
        successCount++;
      } else {
        failCount++;
      }
    });
    setDecisions({});
    setSubmitting(false);
    if (successCount > 0 && failCount === 0) {
      notify("success", "Decisions locked", `${successCount} change request${successCount !== 1 ? "s" : ""} processed successfully.`);
    } else if (successCount > 0 && failCount > 0) {
      notify("warning", "Partial success", `${successCount} processed, ${failCount} failed. Please retry.`);
    } else if (failCount > 0) {
      notify("error", "Decisions failed", "Could not process your change request decisions. Please try again.");
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

  return (
    <div className={cx("pageBody")}>

      {/* ── New request modal ── */}
      {showNew && (
        <div className={cx("modalOverlay")}>
          <div className={cx("card", "w480", "p24")}>
            <div className={cx("fw700", "text13", "mb16")}>Submit Change Request</div>
            <div className={cx("flexCol", "gap12")}>
              <input className={cx("input")} placeholder="Request title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea className={cx("textarea", "resizeV")} rows={4} placeholder="Describe the change in detail..." value={desc} onChange={(e) => setDesc(e.target.value)}  />
            </div>
            <div className={cx("flexRow", "gap8", "mt16")}>
              <button type="button" className={cx("btnSm", "btnAccent")} disabled={submitting || !title.trim()} onClick={handleSubmitNew}>
                {submitting ? "Submitting…" : "Submit →"}
              </button>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => { setShowNew(false); setTitle(""); setDesc(""); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Changes</div>
          <h1 className={cx("pageTitle")}>Decision Impact Simulator</h1>
          <p className={cx("pageSub")}>See exactly how each CR shifts your timeline, budget, and scope before you commit. Decisions update projections live.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowNew(true)}>+ New Request</button>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Awaiting Decision",  value: String(undecided),                                                          color: "statCardAmber"  },
          { label: "Approved",           value: String(pendingCrs.filter((c) => decisions[c.id] === "Approve").length),     color: "statCardGreen"  },
          { label: "Budget Impact",      value: impact.cost > 0 ? `+R ${impact.cost.toLocaleString()}` : "—",               color: "statCardBlue"   },
          { label: "Hours Added",        value: impact.hours > 0 ? `+${impact.hours}h` : "—",                               color: impact.hours > 40 ? "statCardRed" : "statCardAccent" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {pendingCrs.length === 0 && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="edit" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No pending change requests</div>
          <div className={cx("emptyStateSub")}>Change requests awaiting your decision will appear here.</div>
        </div>
      )}

      {/* ── Decision action banner ── */}
      {undecided > 0 && (
        <div className={cx("crDecisionBanner")}>
          <Ic n="alert" sz={14} c="var(--amber)" />
          <span>
            <strong>{undecided} change request{undecided !== 1 ? "s" : ""} waiting for your decision.</strong>
            {" "}Review and approve, defer, or decline below.
          </span>
        </div>
      )}

      {/* ── Interactive CR decision cards ── */}
      {pendingCrs.length > 0 && (
        <div className={cx("flexCol", "gap14", "mb16")}>
          {pendingCrs.map((cr) => {
            const d    = decisions[cr.id];
            const cost = costRands(cr.estimatedCostCents);
            return (
              <div
                key={cr.id}
                className={cx("card", "dynBorderLeft3", d && "dynBgColor")} style={{ "--color": d ? D_COLOR[d] : "var(--amber)", "--bg-color": d ? D_BG[d] : "transparent" } as React.CSSProperties}
              >
                <div className={cx("cardHd")}>
                  <span className={cx("badge", "badgeMuted")}>{cr.id.slice(0, 8).toUpperCase()}</span>
                  <span className={cx("cardHdTitle", "ml8")}>{cr.title}</span>
                  {d ? (
                    <span className={cx("badge", d === "Approve" ? "badgeGreen" : d === "Defer" ? "badgeAmber" : "badgeMuted", "mlAuto")}>
                      {d === "Approve" ? "✓ Approving" : d === "Defer" ? "⏸ Deferring" : "✕ Rejecting"}
                    </span>
                  ) : (
                    <span className={cx("badge", "badgeAmber", "mlAuto")}>Awaiting decision</span>
                  )}
                </div>

                <div className={cx("cardBodyPad")}>
                  <p className={cx("text12", "colorMuted", "mb16")}>{cr.description ?? "No description provided."}</p>

                  {/* Impact waterfall */}
                  <div className={cx("grid3Cols", "gap10", "mb16")}>
                    {[
                      { label: "💰 Budget Impact",   value: cost > 0 ? `+R ${cost.toLocaleString()}` : "TBD",                       color: "var(--amber)",  pct: cost > 0 ? Math.min(100, (cost / (BASE_BUDGET * 0.1)) * 100) : 0 },
                      { label: "⏱ Estimated Hours", value: cr.estimatedHours ? `+${cr.estimatedHours}h` : "TBD",                     color: "var(--red)",    pct: cr.estimatedHours ? Math.min(100, (cr.estimatedHours / 80) * 100) : 0 },
                      { label: "📝 Requested by",   value: cr.requestedByName ?? (cr.requestedByRole ?? "Unknown"),                   color: "var(--purple)", pct: 100 },
                    ].map((col) => (
                      <div key={col.label} className={cx("crImpactCard")}>
                        <div className={cx("text10", "colorMuted", "mb6")}>{col.label}</div>
                        <div className={cx("fw700", "text13", "dynColor", "mb10")} style={{ "--color": col.color } as React.CSSProperties}>{col.value}</div>
                        <div className={cx("progressTrackSm")}>
                          <div className={cx("pctFillRInherit", "dynBgColor")} style={{ '--pct': col.pct, "--bg-color": col.color } as React.CSSProperties} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Decision toggle buttons */}
                  <div className={cx("flexRow", "gap8", "flexWrap", "flexCenter")}>
                    <span className={cx("text11", "colorMuted")}>Your decision:</span>
                    {(["Approve", "Defer", "Reject"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={cx("btnSm", d === opt ? "btnAccent" : "btnGhost", "dynColor", d === opt && "dynBorderColor")} style={{ "--color": d === opt ? D_COLOR[opt] : "inherit", "--border-color": d === opt ? D_COLOR[opt] : "var(--b2)" } as React.CSSProperties}
                        onClick={() => toggle(cr.id, opt)}
                      >
                        {opt === "Approve" ? "✓ Approve" : opt === "Defer" ? "⏸ Defer" : "✕ Reject"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Live aggregate cascade panel ── */}
      {!loading && pendingCrs.length > 0 && (
        <div
          className={cx("card", "dynBorderLeft3", "mb16")} style={{ "--color": impact.count > 0 ? "var(--lime)" : "var(--b2)" } as React.CSSProperties}
        >
          <div className={cx("cardHd")}>
            <span className={cx("cardHdTitle")}>Project Impact Cascade</span>
            {impact.count > 0 && (
              <span className={cx("badge", "badgeAccent", "ml8")}>
                {impact.count} CR{impact.count !== 1 ? "s" : ""} approved
              </span>
            )}
          </div>
          <div className={cx("cardBodyPad")}>
            <div className={cx("grid4Cols", "gap12", "mb16")}>
              {[
                { label: "Budget Added",   value: impact.cost  > 0 ? `+R ${impact.cost.toLocaleString()}` : "No change",                  changed: impact.cost  > 0 },
                { label: "Hours Added",    value: impact.hours > 0 ? `+${impact.hours}h` : "No change",                                   changed: impact.hours > 0 },
                { label: "New Budget",     value: impact.cost  > 0 ? `R ${(BASE_BUDGET + impact.cost).toLocaleString()}` : `R ${BASE_BUDGET.toLocaleString()}`, changed: impact.cost > 0 },
                { label: "New End Date",   value: impact.hours > 0 ? addDays(BASE_END_DATE, Math.ceil(impact.hours / 8)) : BASE_END_DATE,  changed: impact.hours > 0 },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cx("crCascadeCard", item.changed && "crCascadeCardChanged")}
                >
                  <div className={cx("text10", "colorMuted", "mb4")}>{item.label}</div>
                  <div className={cx("fw700", "text12", "dynColor")} style={{ "--color": item.changed ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>{item.value}</div>
                </div>
              ))}
            </div>

            <div className={cx("flexRow", "gap10", "flexCenter", "flexWrap")}>
              {allDecided ? (
                <>
                  <button type="button" className={cx("btnSm", "btnAccent")} disabled={submitting} onClick={handleLockDecisions}>
                    {submitting ? "Submitting…" : "Lock in all decisions →"}
                  </button>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setDecisions({})}>Reset</button>
                </>
              ) : (
                <span className={cx("text11", "colorMuted")}>
                  {undecided} decision{undecided !== 1 ? "s" : ""} remaining before you can lock in.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Historical ── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>Decision History</span>
          <button type="button" className={cx("btnSm", "btnGhost", "mlAuto")} onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? "Hide ↑" : "Show ↓"}
          </button>
        </div>
        {showHistory && (
          <div className={cx("listGroup")}>
            {historicalCrs.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="clock" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No historical decisions</div>
                <div className={cx("emptyStateSub")}>Change requests you've approved or rejected will appear here.</div>
              </div>
            ) : null}
            {historicalCrs.map((cr) => (
              <div key={cr.id} className={cx("listRow", "flexBetween")}>
                <div className={cx("flexRow", "gap8")}>
                  <span className={cx("badge", "badgeMuted")}>{cr.id.slice(0, 8).toUpperCase()}</span>
                  <div>
                    <div className={cx("fw600", "text12")}>{cr.title}</div>
                    <div className={cx("text10", "colorMuted")}>
                      {new Date(cr.requestedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                      {cr.estimatedCostCents ? ` · +R ${costRands(cr.estimatedCostCents).toLocaleString()}` : ""}
                      {cr.estimatedHours ? ` · +${cr.estimatedHours}h` : ""}
                      {cr.clientDecisionNote ? ` · ${cr.clientDecisionNote}` : ""}
                    </div>
                  </div>
                </div>
                <span className={cx("badge", badgeClass(cr.status))}>{statusLabel(cr.status)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
