// ════════════════════════════════════════════════════════════════════════════
// vendor-directory-page.tsx — Staff: read-only vendor directory
// Data     : GET /vendors (billing, STAFF read)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
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

type VendorContract = {
  id: string;
  vendorId: string;
  startAt: string;
  endAt: string | null;
  valueCents: number;
  status: string;
};

type Vendor = {
  id: string;
  name: string;
  category: string | null;
  contactName: string | null;
  contactEmail: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  contracts: VendorContract[];
};

// ── API helper ────────────────────────────────────────────────────────────────

async function loadVendors(session: AuthSession): Promise<AuthorizedResult<Vendor[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<Vendor[]>("/vendors", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: {
          code: res.payload.error?.code ?? "VENDORS_FETCH_FAILED",
          message: res.payload.error?.message ?? "Unable to load vendors.",
        },
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function badgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":   return "badgeGreen";
    case "INACTIVE": return "badgeMuted";
    case "REVIEW":   return "badgeAmber";
    default:         return "badgeMuted";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VendorDirectoryPage({ isActive, session, onNotify }: PageProps) {
  const [vendors, setVendors]   = useState<Vendor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    if (!isActive) return;
    if (!session) { setLoading(false); return; }
    let cancelled = false;

    void loadVendors(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setError(result.error.message);
        onNotify?.("error", "Unable to load vendor data.");
      } else {
        setVendors(result.data ?? []);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [isActive, session?.accessToken]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const activeVendors  = vendors.filter((v) => v.status.toUpperCase() === "ACTIVE");
  const reviewVendors  = vendors.filter((v) => v.status.toUpperCase() === "REVIEW");
  const allContracts   = vendors.flatMap((v) => v.contracts);
  const activeContracts = allContracts.filter((c) => c.status.toUpperCase() === "ACTIVE");
  const monthlySpend   = activeContracts.reduce((sum, c) => {
    if (!c.endAt) return sum + (c.valueCents / 12);
    const start = new Date(c.startAt);
    const end   = new Date(c.endAt);
    const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth());
    return sum + c.valueCents / months;
  }, 0);

  const filtered = vendors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      (v.category ?? "").toLowerCase().includes(q) ||
      (v.contactName ?? "").toLowerCase().includes(q)
    );
  });

  // ── Render ──────────────────────────────────────────────────────────────────

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

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-vendor-directory">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Vendor Directory</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Approved vendor list and tool subscriptions (read-only)</p>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      {(
        <div className={cx("vdStatGrid")}>

          <div className={cx("vdStatCard")}>
            <div className={cx("vdStatCardTop")}>
              <div className={cx("vdStatLabel")}>Active Vendors</div>
              <div className={cx("vdStatValue", "colorGreen")}>{activeVendors.length}</div>
            </div>
            <div className={cx("vdStatCardDivider")} />
            <div className={cx("vdStatCardBottom")}>
              <span className={cx("vdStatDot", "dotBgGreen")} />
              <span className={cx("vdStatMeta")}>{vendors.length} total</span>
            </div>
          </div>

          <div className={cx("vdStatCard")}>
            <div className={cx("vdStatCardTop")}>
              <div className={cx("vdStatLabel")}>Est. Monthly Spend</div>
              <div className={cx("vdStatValue", "colorAccent")}>{formatCents(Math.round(monthlySpend))}</div>
            </div>
            <div className={cx("vdStatCardDivider")} />
            <div className={cx("vdStatCardBottom")}>
              <span className={cx("vdStatDot", "dotBgAccent")} />
              <span className={cx("vdStatMeta")}>{activeContracts.length} active contract{activeContracts.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className={cx("vdStatCard")}>
            <div className={cx("vdStatCardTop")}>
              <div className={cx("vdStatLabel")}>Annual Contracts</div>
              <div className={cx("vdStatValue", "colorMuted2")}>{allContracts.length}</div>
            </div>
            <div className={cx("vdStatCardDivider")} />
            <div className={cx("vdStatCardBottom")}>
              <span className={cx("vdStatDot", "dotBgMuted2")} />
              <span className={cx("vdStatMeta")}>on file</span>
            </div>
          </div>

          <div className={cx("vdStatCard")}>
            <div className={cx("vdStatCardTop")}>
              <div className={cx("vdStatLabel")}>Under Review</div>
              <div className={cx("vdStatValue", "colorAmber")}>{reviewVendors.length}</div>
            </div>
            <div className={cx("vdStatCardDivider")} />
            <div className={cx("vdStatCardBottom")}>
              <span className={cx("vdStatDot", "dotBgAmber")} />
              <span className={cx("vdStatMeta")}>{reviewVendors.length === 0 ? "all clear" : "needs attention"}</span>
            </div>
          </div>

        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────── */}
      {(
        <div className={cx("ivTableSection")}>

          {/* Search */}
          <div className={cx("ivTableHeader", "mb12")}>
            <div className={cx("ivTableTitle")}>Vendor List</div>
            <input
              type="text"
              className={cx("searchInput")}
              placeholder="Search vendors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className={cx("emptyStateTitle")}>
                {vendors.length === 0 ? "No vendors on file" : "No vendors match your search"}
              </div>
              <div className={cx("emptyStateSub")}>
                {vendors.length === 0
                  ? "Vendor records will appear here once the admin adds them."
                  : "Try a different search term."}
              </div>
            </div>
          ) : (
            <div className={cx("tableWrap")}>
              <table className={cx("table")}>
                <thead>
                  <tr>
                    <th scope="col">Vendor</th>
                    <th scope="col">Category</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Contracts</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr key={v.id}>
                      <td className={cx("fw600")}>{v.name}</td>
                      <td className={cx("colorMuted")}>{v.category ?? "—"}</td>
                      <td className={cx("colorMuted", "text12")}>
                        {v.contactName
                          ? <>{v.contactName}{v.contactEmail ? <><br /><span className={cx("opacity70")}>{v.contactEmail}</span></> : null}</>
                          : "—"}
                      </td>
                      <td className={cx("fontMono", "text12")}>{v.contracts.length}</td>
                      <td>
                        <span className={cx("badge", badgeClass(v.status))}>
                          {v.status}
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
