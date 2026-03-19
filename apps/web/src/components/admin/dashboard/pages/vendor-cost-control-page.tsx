// ════════════════════════════════════════════════════════════════════════════
// vendor-cost-control-page.tsx — Admin Vendor & Cost Control
// Data     : loadVendorsWithRefresh → GET /vendors
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { loadVendorsWithRefresh, type AdminVendor } from "../../../../lib/api/admin";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────
type VendorCategory = "Software" | "Freelancer" | "Supplier" | "Infrastructure" | string;
type Tab = "vendor registry" | "software spend" | "freelancers" | "cost per project";
const tabs: Tab[] = ["vendor registry", "software spend", "freelancers", "cost per project"];

const categoryColors: Record<string, string> = {
  Software: "var(--blue)", Freelancer: "var(--purple)",
  Supplier: "var(--amber)", Infrastructure: "var(--accent)"
};

// ── Component ─────────────────────────────────────────────────────────────────
export function VendorCostControlPage({ session }: { session: AuthSession | null }) {
  const [apiVendors, setApiVendors] = useState<AdminVendor[]>([]);
  const [activeTab,  setActiveTab]  = useState<Tab>("vendor registry");
  const [filterCat,  setFilterCat]  = useState<VendorCategory | "All">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadVendorsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) setError(r.error.message ?? "Failed to load.");
      else if (r.data) setApiVendors(r.data);
      setLoading(false);
    });
  }, [session]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const vendors = useMemo(() => apiVendors.map((v) => {
    // Use the most recent active contract's value as monthly cost proxy
    const activeContract = v.contracts.find((c) => c.status === "ACTIVE");
    const monthlyCost = activeContract ? Math.round(activeContract.valueCents / 100 / 12) : 0;
    const annualCost  = activeContract ? Math.round(activeContract.valueCents / 100) : 0;
    const renewalDate = activeContract?.endAt
      ? new Date(activeContract.endAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
      : "Per project";
    return {
      id:          v.id,
      name:        v.name,
      category:    v.category ?? "Other",
      monthlyCost,
      annualCost,
      seats:       null as number | null,
      renewalDate,
      status:      v.status.toLowerCase(),
      priority:    "medium" as const,
    };
  }), [apiVendors]);

  const categories = useMemo(
    () => ["All", ...new Set(vendors.map((v) => v.category))] as const,
    [vendors]
  );

  const filtered = filterCat === "All" ? vendors : vendors.filter((v) => v.category === filterCat);

  const totalMonthly    = vendors.filter((v) => v.status !== "cancelled").reduce((s, v) => s + v.monthlyCost, 0);
  const softwareMonthly = vendors.filter((v) => v.category === "Software").reduce((s, v) => s + v.monthlyCost, 0);
  const upcomingRenewals = vendors.filter((v) => {
    if (v.renewalDate === "Per project" || v.renewalDate === "Per order") return false;
    return new Date(v.renewalDate) < new Date(Date.now() + 60 * 86_400_000);
  }).length;

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
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / VENDOR & COST MANAGEMENT</div>
          <h1 className={styles.pageTitle}>Vendor & Cost Control</h1>
          <div className={styles.pageSub}>Vendors · Software spend · Freelancers · Cost per project</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Add Vendor</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          { label: "Total Monthly Vendor Cost", value: `R${(totalMonthly / 1000).toFixed(1)}k`,    color: "var(--red)",   sub: "All active vendors" },
          { label: "Software Spend",            value: `R${(softwareMonthly / 1000).toFixed(1)}k`, color: "var(--blue)",  sub: `${vendors.filter((v) => v.category === "Software").length} tools` },
          { label: "Freelancer Spend",          value: `R${(vendors.filter((v) => v.category === "Freelancer").reduce((s, v) => s + v.monthlyCost, 0) / 1000).toFixed(1)}k`, color: "var(--purple)", sub: "Monthly freelancers" },
          { label: "Renewals Due (60d)",        value: upcomingRenewals.toString(),                 color: "var(--amber)", sub: "Require review" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, "vendorToneText", toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="View" value={activeTab} onChange={(e) => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {activeTab === "vendor registry" ? (
          <select title="Category" value={filterCat} onChange={(e) => setFilterCat(e.target.value as VendorCategory | "All")} className={styles.filterSelect}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        ) : null}
      </div>

      {activeTab === "vendor registry" && (
        <div>
          <div className={cx("card", "overflowHidden")}>
            <div className={cx("fontMono", "text10", "colorMuted", "uppercase", "vendorRegHead")}>
              {["Vendor", "Category", "Monthly", "Annual", "Renewal", "Status", ""].map((h) => <span key={h}>{h}</span>)}
            </div>
            {filtered.length === 0 ? (
              <div className={cx("colorMuted", "text12", "textCenter", "py24")}>No vendors found.</div>
            ) : null}
            {filtered.map((v, i) => (
              <div key={v.id} className={cx("vendorRegRow", i < filtered.length - 1 && "borderB", v.status === "reviewing" && "vendorReviewRow")}>
                <div>
                  <div className={cx("fw600", "text13")}>{v.name}</div>
                  {v.seats ? <div className={cx("text11", "colorMuted")}>{v.seats} seats</div> : null}
                </div>
                <span className={cx("text10", "fontMono", "vendorToneTag", toneClass(categoryColors[v.category] ?? "var(--muted)"))}>{v.category}</span>
                <span className={cx("fontMono", "colorRed", "fw700")}>{v.monthlyCost > 0 ? `R${v.monthlyCost.toLocaleString()}` : "—"}</span>
                <span className={cx("fontMono", "colorMuted", "text12")}>{v.annualCost > 0 ? `R${(v.annualCost / 1000).toFixed(0)}k` : "—"}</span>
                <span className={cx("text11", "fontMono", "colorMuted")}>{v.renewalDate}</span>
                <span className={cx("text10", "fontMono", "vendorToneTag", toneClass(v.status === "active" ? "var(--accent)" : "var(--amber)"))}>{v.status}</span>
                <div className={cx("flexRow", "gap6")}>
                  <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "software spend" && (
        <div className={cx("vendorSoftwareSplit", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>Software Spend by Tool</div>
            <div className={cx("flexCol", "gap16")}>
              {vendors.filter((v) => v.category === "Software").sort((a, b) => b.monthlyCost - a.monthlyCost).map((v) => {
                const maxCost = vendors.filter((v2) => v2.category === "Software").reduce((m, v2) => Math.max(m, v2.monthlyCost), 0);
                return (
                  <div key={v.id}>
                    <div className={cx("flexBetween", "mb6")}>
                      <span className={cx("text13", "fw600")}>{v.name}</span>
                      <span className={cx("fontMono", "colorRed", "fw700")}>R{v.monthlyCost.toLocaleString()}</span>
                    </div>
                    <div className={cx("progressBar", "vendorBarSm")}>
                      <progress className={cx("vendorBarFillRound")} max={maxCost || 1} value={v.monthlyCost} aria-label={`${v.name} monthly spend`} />
                    </div>
                    {v.renewalDate !== "Per project" ? <div className={cx("text10", "colorMuted", "mt3")}>Annual: R{v.annualCost.toLocaleString()} · Renews {v.renewalDate}</div> : null}
                  </div>
                );
              })}
              {vendors.filter((v) => v.category === "Software").length === 0 ? (
                <div className={cx("colorMuted", "text12")}>No software vendors.</div>
              ) : null}
            </div>
          </div>
          <div className={cx("flexCol", "gap16")}>
            <div className={cx("card", "p24")}>
              <div className={cx("text13", "fw700", "mb12", "uppercase", "tracking")}>Cost Per Head</div>
              <div className={cx("fontMono", "fw800", "colorBlue", "mb4", "vendorCostHead")}>
                R{vendors.filter((v) => v.category === "Software").length > 0 ? Math.round(softwareMonthly / 5).toLocaleString() : "0"}
              </div>
              <div className={cx("text12", "colorMuted")}>Software cost per staff member / month</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "freelancers" && (
        <div className={cx("flexCol", "gap16")}>
          {vendors.filter((v) => v.category === "Freelancer").map((f) => (
            <div key={f.id} className={cx("card", "vendorFreeRow")}>
              <div>
                <div className={cx("fw700", "mb4")}>{f.name}</div>
                <div className={cx("text12", "colorMuted")}>Freelancer</div>
              </div>
              <div>
                <div className={cx("text11", "colorMuted", "mb4")}>Monthly</div>
                <div className={cx("fontMono", "fw700", "text13")}>{f.monthlyCost > 0 ? `R${f.monthlyCost.toLocaleString()}` : "—"}</div>
              </div>
              <div>
                <div className={cx("text11", "colorMuted", "mb4")}>Annual Value</div>
                <div className={cx("fontMono", "colorPurple", "fw700")}>{f.annualCost > 0 ? `R${f.annualCost.toLocaleString()}` : "—"}</div>
              </div>
              <span className={cx("text10", "fontMono", "vendorToneTag", toneClass(f.status === "active" ? "var(--accent)" : "var(--amber)"))}>{f.status}</span>
              <div className={cx("flexRow", "gap8")}>
                <button type="button" className={cx("btnSm", "btnGhost")}>Brief</button>
                <button type="button" className={cx("btnSm", "btnGhost")}>Invoice</button>
              </div>
            </div>
          ))}
          {vendors.filter((v) => v.category === "Freelancer").length === 0 ? (
            <div className={cx("colorMuted", "text12", "textCenter", "py24")}>No freelancers found.</div>
          ) : null}
          <button type="button" className={cx("btnSm", "btnGhost", "textCenter", "vendorAddBtn")}>+ Add Freelancer</button>
        </div>
      )}

      {activeTab === "cost per project" && (
        <div className={cx("card", "p24")}>
          <div className={cx("colorMuted", "text12", "textCenter")}>
            Cost-per-project analytics require project cost allocation data. Available after projects are linked to vendor contracts.
          </div>
        </div>
      )}
    </div>
  );
}
