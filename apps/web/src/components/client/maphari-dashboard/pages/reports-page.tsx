"use client";

// ════════════════════════════════════════════════════════════════════════════
// reports-page.tsx — Client Portal Reports
// Data     : loadPortalProjectsWithRefresh  → GET /projects
//            loadPortalInvoicesWithRefresh  → GET /invoices
//            loadPortalDeliverablesWithRefresh → GET /projects/:id/deliverables
// Computed : deliverable completion %, total invoiced, outstanding balance,
//            project count — no dedicated reports endpoint
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalProjectsWithRefresh,
  loadPortalInvoicesWithRefresh,
  type PortalProject,
  type PortalInvoice,
} from "../../../../lib/api/portal";
import {
  loadPortalDeliverablesWithRefresh,
  type PortalDeliverable,
} from "../../../../lib/api/portal/project-layer";

// ── Helpers ───────────────────────────────────────────────────────────────────

function centsToRands(cents: number): string {
  return "R " + Math.round(cents / 100).toLocaleString("en-ZA");
}

function projectStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":     return "Active";
    case "COMPLETED":  return "Completed";
    case "ON_HOLD":    return "On Hold";
    case "CANCELLED":  return "Cancelled";
    default:           return status;
  }
}

function projectStatusBadge(status: string): string {
  switch (status) {
    case "ACTIVE":    return "badgeGreen";
    case "COMPLETED": return "badgeAccent";
    case "ON_HOLD":   return "badgeAmber";
    default:          return "badgeMuted";
  }
}

function invoiceStatusLabel(status: string): string {
  switch (status) {
    case "PAID":    return "Paid";
    case "ISSUED":  return "Issued";
    case "OVERDUE": return "Overdue";
    case "DRAFT":   return "Draft";
    case "VOID":    return "Void";
    default:        return status;
  }
}

function invoiceStatusBadge(status: string): string {
  switch (status) {
    case "PAID":    return "badgeGreen";
    case "ISSUED":  return "badgeAmber";
    case "OVERDUE": return "badgeRed";
    default:        return "badgeMuted";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { session, projectId } = useProjectLayer();

  const [projects,     setProjects]     = useState<PortalProject[]>([]);
  const [invoices,     setInvoices]     = useState<PortalInvoice[]>([]);
  const [deliverables, setDeliverables] = useState<PortalDeliverable[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);

    const fetches: Promise<void>[] = [
      loadPortalProjectsWithRefresh(session).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (r.data) setProjects(r.data);
      }),
      loadPortalInvoicesWithRefresh(session).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (r.data) setInvoices(r.data);
      }),
    ];

    if (projectId) {
      fetches.push(
        loadPortalDeliverablesWithRefresh(session, projectId).then((r) => {
          if (r.nextSession) saveSession(r.nextSession);
          if (r.data) setDeliverables(r.data);
        })
      );
    }

    Promise.all(fetches).finally(() => setLoading(false));
  }, [session, projectId]);

  // ── Computed metrics ────────────────────────────────────────────────────────
  const totalInvoicedCents = invoices.reduce((s, inv) => s + inv.amountCents, 0);
  const paidCents          = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((s, inv) => s + inv.amountCents, 0);
  const outstandingCents   = invoices
    .filter((inv) => inv.status === "ISSUED" || inv.status === "OVERDUE")
    .reduce((s, inv) => s + inv.amountCents, 0);

  const totalDeliverables = deliverables.length;
  const acceptedCount     = deliverables.filter((d) =>
    d.status === "ACCEPTED" || d.status === "DELIVERED"
  ).length;
  const completionPct     = totalDeliverables > 0
    ? Math.round((acceptedCount / totalDeliverables) * 100)
    : 0;

  const activeProjects    = projects.filter((p) => p.status === "ACTIVE").length;

  // ── Invoice breakdown ───────────────────────────────────────────────────────
  const recentInvoices = [...invoices]
    .sort((a, b) => (b.issuedAt ?? b.createdAt).localeCompare(a.issuedAt ?? a.createdAt))
    .slice(0, 8);

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

      {/* ── Page header ── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Account · Reports</div>
          <h1 className={cx("pageTitle")}>Reports</h1>
          <p className={cx("pageSub")}>Summary metrics computed from your live project, invoice, and deliverable data.</p>
        </div>
      </div>

      {/* ── Top stat cards ── */}
      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Projects",          value: String(projects.length),            sub: `${activeProjects} active`,                   color: "statCardAccent" },
          { label: "Deliverable Done",  value: `${completionPct}%`,                sub: `${acceptedCount}/${totalDeliverables} items`, color: "statCardGreen"  },
          { label: "Total Invoiced",    value: centsToRands(totalInvoicedCents),   sub: `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`, color: "statCard" },
          { label: "Outstanding",       value: centsToRands(outstandingCents),     sub: outstandingCents === 0 ? "All clear" : "Awaiting payment", color: outstandingCents > 0 ? "statCardAmber" : "statCardGreen" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
            <div className={cx("text10", "colorMuted", "mt4")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <>
        {/* ── Project overview ── */}
          {projects.length > 0 && (
            <div className={cx("card", "mb16")}>
              <div className={cx("cardHd")}>
                <span className={cx("cardHdTitle")}>Projects Overview</span>
                <span className={cx("text11", "colorMuted")}>{projects.length} total</span>
              </div>
              <div className={cx("listGroup")}>
                {projects.map((proj) => {
                  const budget = proj.budgetCents
                    ? centsToRands(proj.budgetCents)
                    : "—";
                  return (
                    <div key={proj.id} className={cx("listRow", "flexBetween")}>
                      <div className={cx("flexRow", "gap10", "flexCenter")}>
                        <div className={cx("rpProjectIconBox")}>
                          <Ic n="layers" sz={13} c="var(--lime)" />
                        </div>
                        <div>
                          <div className={cx("fw600", "text12")}>{proj.name}</div>
                          <div className={cx("text10", "colorMuted")}>
                            Budget: {budget}
                            {proj.progressPercent > 0 ? ` · ${proj.progressPercent}% done` : ""}
                            {proj.dueAt ? ` · Due ${new Date(proj.dueAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                          </div>
                        </div>
                      </div>
                      <span className={cx("badge", projectStatusBadge(proj.status))}>
                        {projectStatusLabel(proj.status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Deliverable completion bar ── */}
          {totalDeliverables > 0 && (
            <div className={cx("card", "mb16", "p16x20")}>
              <div className={cx("flexBetween", "mb10")}>
                <span className={cx("fw600", "text12")}>Deliverable Completion</span>
                <span className={cx("badge", completionPct >= 80 ? "badgeAccent" : completionPct >= 50 ? "badgeAmber" : "badgeMuted")}>
                  {completionPct}% accepted
                </span>
              </div>
              <div className={cx("rpProgressTrack")}>
                <div className={cx("rpProgressFill", "dynBgColor")} style={{ '--pct': `${completionPct}%`, "--bg-color": completionPct >= 80 ? "var(--lime)" : completionPct >= 50 ? "var(--amber)" : "var(--muted2)" } as React.CSSProperties} />
              </div>
              <div className={cx("text10", "colorMuted", "mt6")}>
                {acceptedCount} of {totalDeliverables} deliverable{totalDeliverables !== 1 ? "s" : ""} accepted
              </div>
            </div>
          )}

          {/* ── Invoice table ── */}
          <div className={cx("card")}>
            <div className={cx("cardHd")}>
              <span className={cx("cardHdTitle")}>Invoice Summary</span>
              <div className={cx("flexRow", "gap10")}>
                <span className={cx("text11", "colorMuted")}>Paid: <strong className={cx("colorAccent")}>{centsToRands(paidCents)}</strong></span>
                {outstandingCents > 0 && (
                  <span className={cx("text11", "colorMuted")}>Outstanding: <strong className={cx("colorAmber")}>{centsToRands(outstandingCents)}</strong></span>
                )}
              </div>
            </div>

            {recentInvoices.length === 0 ? (
              <div className={cx("cardInner", "textCenter")}>
                <p className={cx("text12", "colorMuted")}>No invoices yet.</p>
              </div>
            ) : (
              <div className={cx("listGroup")}>
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className={cx("listRow", "flexBetween")}>
                    <div>
                      <div className={cx("fw600", "text12")}>{inv.number}</div>
                      <div className={cx("text10", "colorMuted")}>
                        {inv.issuedAt
                          ? new Date(inv.issuedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                        {inv.dueAt ? ` · Due ${new Date(inv.dueAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                      </div>
                    </div>
                    <div className={cx("flexRow", "gap10", "flexCenter")}>
                      <span className={cx("fw700", "text12")}>{centsToRands(inv.amountCents)}</span>
                      <span className={cx("badge", invoiceStatusBadge(inv.status))}>
                        {invoiceStatusLabel(inv.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
    </div>
  );
}
