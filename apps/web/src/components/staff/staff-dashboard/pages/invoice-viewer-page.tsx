// ════════════════════════════════════════════════════════════════════════════
// invoice-viewer-page.tsx — Staff: read-only invoice overview
// Data     : GET /invoices (billing) + GET /staff/clients
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffClients, type StaffClient } from "../../../../lib/api/staff/clients";
import {
  callGateway,
  isUnauthorized,
  withAuthorizedSession,
  type AuthorizedResult,
} from "../../../../lib/api/staff/internal";
import { cx } from "../style";

// ── Types ─────────────────────────────────────────────────────────────────────

type PageProps = {
  isActive: boolean;
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
};

type InvoiceRecord = {
  id: string;
  clientId: string;
  number: string;
  amountCents: number;
  currency: string;
  status: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

type InvoiceFilter = "all" | "PAID" | "OVERDUE" | "SENT" | "DRAFT";

// ── API helper ────────────────────────────────────────────────────────────────

async function loadInvoices(
  session: AuthSession
): Promise<AuthorizedResult<InvoiceRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<InvoiceRecord[]>("/invoices", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: { code: res.payload.error?.code ?? "INVOICES_FETCH_FAILED", message: res.payload.error?.message ?? "Unable to load invoices." },
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── Utilities ─────────────────────────────────────────────────────────────────


function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function badgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "PAID":    return "badgeGreen";
    case "OVERDUE": return "badgeRed";
    case "SENT":    return "badgeAccent";
    case "DRAFT":   return "badgeMuted";
    default:        return "badgeMuted";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InvoiceViewerPage({ isActive, session, onNotify }: PageProps) {
  const [clients, setClients]   = useState<StaffClient[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [filter, setFilter]     = useState<InvoiceFilter>("all");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) return;
    if (!session) { setLoading(false); return; }
    let cancelled = false;

    void Promise.all([
      getStaffClients(session),
      loadInvoices(session),
    ]).then(([clientsResult, invoicesResult]) => {
      if (cancelled) return;
      if (clientsResult.nextSession) saveSession(clientsResult.nextSession);
      if (invoicesResult.nextSession) saveSession(invoicesResult.nextSession);

      if (clientsResult.error || invoicesResult.error) {
        const msg = clientsResult.error?.message ?? invoicesResult.error?.message ?? "Failed to load data.";
        setError(msg);
        onNotify?.("error", "Unable to load invoice data.");
      } else {
        setClients(clientsResult.data ?? []);
        setInvoices(invoicesResult.data ?? []);
      }
    }).catch((err) => {
      if (!cancelled) setError(err?.message ?? "Failed to load");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [isActive, session?.accessToken]);

  // ── Derived data ────────────────────────────────────────────────────────────

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  const filtered = filter === "all"
    ? invoices
    : invoices.filter((inv) => inv.status.toUpperCase() === filter);

  const totalValue   = invoices.reduce((sum, inv) => sum + (inv.amountCents ?? 0), 0);
  const paidValue    = invoices.filter((inv) => inv.status.toUpperCase() === "PAID").reduce((sum, inv) => sum + (inv.amountCents ?? 0), 0);
  const overdueCount = invoices.filter((inv) => inv.status.toUpperCase() === "OVERDUE").length;
  const pendingCount = invoices.filter((inv) => ["SENT", "DRAFT"].includes(inv.status.toUpperCase())).length;

  const FILTERS: { key: InvoiceFilter; label: string }[] = [
    { key: "all",     label: "All"     },
    { key: "SENT",    label: "Sent"    },
    { key: "PAID",    label: "Paid"    },
    { key: "OVERDUE", label: "Overdue" },
    { key: "DRAFT",   label: "Draft"   },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!isActive) return null;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-invoice-viewer">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Invoice Viewer</h1>
        <p className={cx("pageSubtitleText", "mb20")}>
          Read-only view of invoices across all clients
        </p>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className={cx("ivStatGrid")}>

          <div className={cx("ivStatCard")}>
            <div className={cx("ivStatCardTop")}>
              <div className={cx("ivStatLabel")}>Total Invoiced</div>
              <div className={cx("ivStatValue", "colorAccent")}>{formatMoneyCents(totalValue, { maximumFractionDigits: 0 })}</div>
            </div>
            <div className={cx("ivStatCardDivider")} />
            <div className={cx("ivStatCardBottom")}>
              <span className={cx("ivStatDot", "dotBgAccent")} />
              <span className={cx("ivStatMeta")}>{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className={cx("ivStatCard")}>
            <div className={cx("ivStatCardTop")}>
              <div className={cx("ivStatLabel")}>Collected</div>
              <div className={cx("ivStatValue", "colorGreen")}>{formatMoneyCents(paidValue, { maximumFractionDigits: 0 })}</div>
            </div>
            <div className={cx("ivStatCardDivider")} />
            <div className={cx("ivStatCardBottom")}>
              <span className={cx("ivStatDot", "dotBgGreen")} />
              <span className={cx("ivStatMeta")}>paid in full</span>
            </div>
          </div>

          <div className={cx("ivStatCard")}>
            <div className={cx("ivStatCardTop")}>
              <div className={cx("ivStatLabel")}>Overdue</div>
              <div className={cx("ivStatValue", "colorRed")}>{overdueCount}</div>
            </div>
            <div className={cx("ivStatCardDivider")} />
            <div className={cx("ivStatCardBottom")}>
              <span className={cx("ivStatDot", "dotBgRed")} />
              <span className={cx("ivStatMeta")}>need attention</span>
            </div>
          </div>

          <div className={cx("ivStatCard")}>
            <div className={cx("ivStatCardTop")}>
              <div className={cx("ivStatLabel")}>Pending</div>
              <div className={cx("ivStatValue", "colorMuted2")}>{pendingCount}</div>
            </div>
            <div className={cx("ivStatCardDivider")} />
            <div className={cx("ivStatCardBottom")}>
              <span className={cx("ivStatDot", "dotBgMuted2")} />
              <span className={cx("ivStatMeta")}>awaiting payment</span>
            </div>
          </div>

        </div>
      )}

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && (
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH40")} />
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className={cx("ivTableSection")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateTitle")}>Failed to load invoices.</div>
            <div className={cx("emptyStateSub")}>{error}</div>
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className={cx("ivTableSection")}>

          {/* Filter tabs */}
          <div className={cx("filterTabs")}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={cx("filterTab", filter === f.key && "filterTabActive")}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                {f.key !== "all" && (
                  <span className={cx("filterTabCount")}>
                    {invoices.filter((inv) => inv.status.toUpperCase() === f.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className={cx("ivTableHeader")}>
            <div className={cx("ivTableTitle")}>
              {filter === "all" ? "All Invoices" : `${filter.charAt(0) + filter.slice(1).toLowerCase()} Invoices`}
            </div>
            <span className={cx("ivTableCount")}>{filtered.length} RECORD{filtered.length !== 1 ? "S" : ""}</span>
          </div>

          {filtered.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className={cx("emptyStateTitle")}>No invoices found</div>
              <div className={cx("emptyStateSub")}>
                {invoices.length === 0
                  ? "No invoices have been created yet."
                  : `No invoices match the "${filter}" filter.`}
              </div>
            </div>
          ) : (
            <div className={cx("tableWrap")}>
              <table className={cx("table")}>
                <thead>
                  <tr>
                    <th scope="col">Invoice #</th>
                    <th scope="col">Client</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Issued</th>
                    <th scope="col">Due</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id}>
                      <td className={cx("fontMono", "text12", "fw600")}>{inv.number || "—"}</td>
                      <td className={cx("fw600")}>{clientMap.get(inv.clientId) ?? "—"}</td>
                      <td className={cx("fontMono", "text12")}>{formatMoneyCents(inv.amountCents, { currency: inv.currency, maximumFractionDigits: 0 })}</td>
                      <td className={cx("colorMuted", "text12")}>{formatDate(inv.issuedAt)}</td>
                      <td className={cx("colorMuted", "text12")}>{formatDate(inv.dueAt)}</td>
                      <td>
                        <span className={cx("badge", badgeClass(inv.status))}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </section>
  );
}
