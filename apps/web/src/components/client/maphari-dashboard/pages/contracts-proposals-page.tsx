"use client";

// ════════════════════════════════════════════════════════════════════════════
// contracts-proposals-page.tsx — Client Portal Contracts & Proposals
// Data     : loadPortalProjectsWithRefresh → GET /projects
//            loadPortalInvoicesWithRefresh → GET /invoices
// Note     : No dedicated contracts API for portal; projects + invoices are
//            used as contract proxies (each project = engagement contract).
//            All hardcoded DOCS data removed.
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function centsToRands(cents: number): string {
  return "R " + Math.round(cents / 100).toLocaleString("en-ZA");
}

function projectContractStatus(proj: PortalProject): string {
  switch (proj.status) {
    case "ACTIVE":    return "Active";
    case "COMPLETED": return "Completed";
    case "ON_HOLD":   return "On Hold";
    case "CANCELLED": return "Cancelled";
    default:          return proj.status;
  }
}

function statusBadge(status: string): string {
  switch (status) {
    case "Active":    return "badgeGreen";
    case "Completed": return "badgeAccent";
    case "On Hold":   return "badgeAmber";
    case "Cancelled": return "badgeMuted";
    default:          return "badgeMuted";
  }
}

function invoiceStatusLabel(status: string): string {
  switch (status) {
    case "PAID":    return "Paid";
    case "ISSUED":  return "Outstanding";
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

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContractsProposalsPage() {
  const { session } = useProjectLayer();

  const [projects,  setProjects]  = useState<PortalProject[]>([]);
  const [invoices,  setInvoices]  = useState<PortalInvoice[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [expanded,  setExpanded]  = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    Promise.all([
      loadPortalProjectsWithRefresh(session).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (r.data) setProjects(r.data);
      }),
      loadPortalInvoicesWithRefresh(session).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (r.data) setInvoices(r.data);
      }),
    ]).finally(() => setLoading(false));
  }, [session]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeCount    = projects.filter((p) => p.status === "ACTIVE").length;
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;
  const totalBudget    = projects.reduce((s, p) => s + (p.budgetCents ?? 0), 0);

  const paidCents      = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amountCents, 0);
  const pendingInvoices= invoices.filter((i) => i.status === "ISSUED" || i.status === "OVERDUE");


  return (
    <div className={cx("pageBody")}>

      {/* ── Header ── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Contracts</div>
          <h1 className={cx("pageTitle")}>Contracts &amp; Proposals</h1>
          <p className={cx("pageSub")}>Your active engagements, project budgets, and invoice status — all in one place.</p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Total Engagements", value: loading ? "…" : String(projects.length),  color: "statCardAccent" },
          { label: "Active",            value: loading ? "…" : String(activeCount),       color: "statCardGreen"  },
          { label: "Completed",         value: loading ? "…" : String(completedCount),    color: "statCard"       },
          { label: "Pending Invoices",  value: loading ? "…" : String(pendingInvoices.length), color: pendingInvoices.length > 0 ? "statCardAmber" : "statCard" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className={cx("card", "p24", "textCenter")}>
          <div className={cx("colorMuted", "text12")}>Loading contracts…</div>
        </div>
      )}

      {/* ── Pending invoice alert ── */}
      {!loading && pendingInvoices.length > 0 && (
        <div className={cx("card", "borderLeftAmber", "mb16", "p14x16")}>
          <div className={cx("flexRow", "gap12")}>
            <div className={cx("iconBox34")}
              style={{ "--bg-color": "color-mix(in oklab, var(--amber) 12%, var(--s2))", "--color": "color-mix(in oklab, var(--amber) 25%, transparent)" } as React.CSSProperties}>
              <Ic n="alert" sz={15} c="var(--amber)" />
            </div>
            <div>
              <div className={cx("fw700", "text12", "colorAmber")}>Outstanding invoices</div>
              <div className={cx("text11", "colorMuted")}>
                {pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? "s" : ""} pending payment
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Portfolio summary ── */}
      {!loading && projects.length > 0 && totalBudget > 0 && (
        <div className={cx("card", "mb16", "p16x20")}>
          <div className={cx("flexBetween", "mb8")}>
            <span className={cx("fw600", "text12")}>Portfolio Budget</span>
            <span className={cx("fw700", "text12", "colorAccent")}>{centsToRands(totalBudget)}</span>
          </div>
          <div className={cx("flexRow", "gap16")}>
            <div className={cx("text11", "colorMuted")}>
              Paid: <strong className={cx("colorAccent")}>{centsToRands(paidCents)}</strong>
            </div>
            {pendingInvoices.length > 0 && (
              <div className={cx("text11", "colorMuted")}>
                Pending: <strong className={cx("colorAmber")}>
                  {centsToRands(pendingInvoices.reduce((s, i) => s + i.amountCents, 0))}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Project engagement list ── */}
      {!loading && projects.length === 0 && (
        <div className={cx("card", "p24", "textCenter")}>
          <Ic n="file" sz={24} c="var(--muted2)" />
          <div className={cx("fw700", "text13", "mt12", "mb4")}>No engagements yet</div>
          <div className={cx("text12", "colorMuted")}>Your project contracts will appear here once confirmed.</div>
        </div>
      )}

      <div className={cx("flexCol", "gap8")}>
        {projects.map((proj) => {
          const status      = projectContractStatus(proj);
          const isExpanded  = expanded === proj.id;
          const projInvoices= invoices.filter((inv) =>
            inv.status !== "VOID"
          ).slice(0, 3); // show recent invoices as financial activity
          return (
            <div
              key={proj.id}
              className={cx("card", "p0", "overflowHidden", "dynBorderLeft3")}
              style={{ "--color": status === "Active" ? "var(--lime)" : status === "Completed" ? "var(--lime)" : status === "On Hold" ? "var(--amber)" : "var(--b2)" } as React.CSSProperties}
            >
              {/* Row header */}
              <button
                type="button"
                className={cx("cardRowBtn")}
                onClick={() => setExpanded(isExpanded ? null : proj.id)}
              >
                {/* Icon */}
                <div className={cx("iconBox40")}>
                  <Ic n="file" sz={16} c="var(--lime)" />
                </div>

                {/* Title + meta */}
                <div className={cx("flex1", "minW0")}>
                  <div className={cx("fw600", "text13", "truncate")}>
                    {proj.name}
                  </div>
                  <div className={cx("text10", "colorMuted", "mt2")}>
                    Started {fmtDate(proj.startAt)}
                    {proj.dueAt ? ` · Due ${fmtDate(proj.dueAt)}` : ""}
                    {proj.budgetCents ? ` · ${centsToRands(proj.budgetCents)}` : ""}
                  </div>
                </div>

                {/* Badges */}
                <div className={cx("flexRow", "gap8", "noShrink")}>
                  <span className={cx("badge", "badgeAccent")}>Contract</span>
                  <span className={cx("badge", statusBadge(status))}>{status}</span>
                </div>

                {/* Chevron */}
                <div className={cx(isExpanded ? "chevronMuted2Rotated" : "chevronMuted2")}>
                  <Ic n="chevronDown" sz={14} c="var(--muted2)" />
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className={cx("borderT")}>
                  <div className={cx("p16x18", "borderB")}>
                    {proj.description ? (
                      <p className={cx("text12", "colorMuted", "lineH175", "mb12")}>
                        {proj.description}
                      </p>
                    ) : null}
                    <div className={cx("grid3Cols8Gap")}>
                      {[
                        { label: "Status",   value: status                               },
                        { label: "Progress", value: proj.progressPercent > 0 ? `${proj.progressPercent}%` : "—" },
                        { label: "Budget",   value: proj.budgetCents ? centsToRands(proj.budgetCents) : "—" },
                        { label: "Start",    value: fmtDate(proj.startAt)                },
                        { label: "Due",      value: fmtDate(proj.dueAt)                  },
                        { label: "Priority", value: proj.priority ?? "—"                 },
                      ].map((item) => (
                        <div key={item.label} className={cx("cardS2", "p8x12")}>
                          <div className={cx("text10", "colorMuted", "fw700", "ls006", "mb2")}>{item.label.toUpperCase()}</div>
                          <div className={cx("fw600", "text12")}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent invoices for this engagement */}
                  {projInvoices.length > 0 && (
                    <div className={cx("py14_px", "px18_px")}>
                      <div className={cx("text10", "colorMuted", "fw700", "ls006", "mb10")}>RECENT INVOICES</div>
                      <div className={cx("flexCol", "gap8")}>
                        {projInvoices.map((inv) => (
                          <div key={inv.id} className={cx("flexBetween")}>
                            <div>
                              <div className={cx("fw600", "text11")}>{inv.number}</div>
                              <div className={cx("text10", "colorMuted")}>{fmtDate(inv.issuedAt)}</div>
                            </div>
                            <div className={cx("flexRow", "gap8")}>
                              <span className={cx("fw600", "text11")}>{centsToRands(inv.amountCents)}</span>
                              <span className={cx("badge", invoiceStatusBadge(inv.status))}>{invoiceStatusLabel(inv.status)}</span>
                            </div>
                          </div>
                        ))}
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
  );
}
