"use client";

import { useState, useEffect, useRef } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAdminServiceCatalogWithRefresh,
  updateAdminPackageWithRefresh,
  deleteAdminPackageWithRefresh,
  createAdminPackageWithRefresh,
  updateAdminRetainerWithRefresh,
  deleteAdminRetainerWithRefresh,
  createAdminRetainerWithRefresh,
  type ServicePackage,
  type ServiceAddon,
  type RetainerPlan,
} from "../../../../lib/api/admin/service-catalog";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(minCents: number, maxCents: number, isCustom = false): string {
  if (isCustom) return "Custom Quote";
  const currency = process.env.NEXT_PUBLIC_BILLING_CURRENCY ?? "ZAR";
  const r = (c: number) => formatMoneyCents(c, { currency, maximumFractionDigits: 0 });
  return minCents === maxCents ? r(minCents) : `${r(minCents)} – ${r(maxCents)}`;
}

const pendingDiscounts: Array<{ client: string; item: string; discount: number; reason: string; requestedBy: string; status: string }> = [];

const tabs = ["service catalog", "retainer tiers", "quote builder", "discount approvals"] as const;

// ── Create/Edit modal forms ───────────────────────────────────────────────────

interface PkgDraft {
  name:          string;
  slug:          string;
  tagline:       string;
  priceMinCents: number;
  priceMaxCents: number;
  isCustomQuote: boolean;
  deliveryDays:  string;
  paymentTerms:  string;
  billingType:   string;
}

interface RetainerDraft {
  name:          string;
  description:   string;
  priceMinCents: number;
  priceMaxCents: number;
}

const emptyPkgDraft = (): PkgDraft => ({
  name: "", slug: "", tagline: "", priceMinCents: 0, priceMaxCents: 0,
  isCustomQuote: false, deliveryDays: "", paymentTerms: "", billingType: "ONCE_OFF",
});

const emptyRetainerDraft = (): RetainerDraft => ({
  name: "", description: "", priceMinCents: 0, priceMaxCents: 0,
});

// ── Component ─────────────────────────────────────────────────────────────────

export function PricingPage() {
  const { snapshot, session } = useAdminWorkspaceContext();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("service catalog");
  const [quoteClient, setQuoteClient] = useState("");
  const [discount, setDiscount] = useState(0);

  // ── Catalog state ─────────────────────────────────────────────────────────
  const [packages,  setPackages]  = useState<ServicePackage[]>([]);
  const [addons,    setAddons]    = useState<ServiceAddon[]>([]);
  const [retainers, setRetainers] = useState<RetainerPlan[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const loaded                    = useRef(false);

  // ── Catalog sub-filter ────────────────────────────────────────────────────
  const [catalogView, setCatalogView] = useState<"packages" | "addons">("packages");

  // ── Edit/create modal ─────────────────────────────────────────────────────
  const [pkgModal,      setPkgModal]      = useState<{ mode: "create" | "edit"; draft: PkgDraft; id?: string } | null>(null);
  const [retainerModal, setRetainerModal] = useState<{ mode: "create" | "edit"; draft: RetainerDraft; id?: string } | null>(null);

  // ── Load catalog ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (loaded.current || !session) { setLoading(false); return; }
    loaded.current = true;
    void (async () => {
      const result = await loadAdminServiceCatalogWithRefresh(session);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) {
        setPackages(result.data.packages);
        setAddons(result.data.addons);
        setRetainers(result.data.retainers);
      }
      setLoading(false);
    })();
  }, [session]);

  // ── Package CRUD ──────────────────────────────────────────────────────────

  async function savePkg() {
    if (!session || !pkgModal) return;
    setSaving(true);
    try {
      if (pkgModal.mode === "create") {
        const body = {
          ...pkgModal.draft,
          idealFor: [] as string[],
          features: [] as { label: string; included: boolean }[],
          sortOrder: packages.length,
          isActive: true,
        };
        const res = await createAdminPackageWithRefresh(session, body);
        if (res.nextSession) saveSession(res.nextSession);
        if (res.data) setPackages((prev) => [...prev, res.data!]);
      } else if (pkgModal.id) {
        const res = await updateAdminPackageWithRefresh(session, pkgModal.id, pkgModal.draft);
        if (res.nextSession) saveSession(res.nextSession);
        if (res.data) setPackages((prev) => prev.map((p) => p.id === pkgModal.id ? res.data! : p));
      }
      setPkgModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function deletePkg(id: string) {
    if (!session) return;
    const res = await deleteAdminPackageWithRefresh(session, id);
    if (res.nextSession) saveSession(res.nextSession);
    setPackages((prev) => prev.filter((p) => p.id !== id));
  }

  async function togglePkgActive(pkg: ServicePackage) {
    if (!session) return;
    const res = await updateAdminPackageWithRefresh(session, pkg.id, { isActive: !pkg.isActive });
    if (res.nextSession) saveSession(res.nextSession);
    if (res.data) setPackages((prev) => prev.map((p) => p.id === pkg.id ? res.data! : p));
  }

  // ── Retainer CRUD ─────────────────────────────────────────────────────────

  async function saveRetainer() {
    if (!session || !retainerModal) return;
    setSaving(true);
    try {
      if (retainerModal.mode === "create") {
        const body = {
          ...retainerModal.draft,
          features: [] as string[],
          sortOrder: retainers.length,
          isActive: true,
        };
        const res = await createAdminRetainerWithRefresh(session, body);
        if (res.nextSession) saveSession(res.nextSession);
        if (res.data) setRetainers((prev) => [...prev, res.data!]);
      } else if (retainerModal.id) {
        const res = await updateAdminRetainerWithRefresh(session, retainerModal.id, retainerModal.draft);
        if (res.nextSession) saveSession(res.nextSession);
        if (res.data) setRetainers((prev) => prev.map((r) => r.id === retainerModal.id ? res.data! : r));
      }
      setRetainerModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRetainer(id: string) {
    if (!session) return;
    const res = await deleteAdminRetainerWithRefresh(session, id);
    if (res.nextSession) saveSession(res.nextSession);
    setRetainers((prev) => prev.filter((r) => r.id !== id));
  }

  // ── Quote builder (uses loaded packages as line-item source) ──────────────

  const [quoteLines, setQuoteLines] = useState<Array<{ pkgId: string; qty: number }>>([]);
  const quoteSubtotal = quoteLines.reduce((sum, line) => {
    const pkg = packages.find((p) => p.id === line.pkgId);
    return sum + (pkg ? (pkg.priceMinCents / 100) * line.qty : 0);
  }, 0);
  const quoteDiscount = quoteSubtotal * (discount / 100);
  const quoteTotal    = quoteSubtotal - quoteDiscount;
  const quoteVAT      = quoteTotal * 0.15;
  const quoteFinal    = quoteTotal + quoteVAT;

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
    <div className={cx(styles.pageBody, styles.pricRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / PRICING &amp; QUOTE ENGINE</div>
          <h1 className={styles.pageTitle}>Pricing Control</h1>
          <div className={styles.pageSub}>Service catalog · Retainer tiers · Quote builder · Discount approvals</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Pricelist</button>
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            onClick={() => setPkgModal({ mode: "create", draft: emptyPkgDraft() })}
          >
            + New Package
          </button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Packages",         value: String(packages.length),  color: "var(--accent)", sub: "in catalog" },
          { label: "Add-ons",          value: String(addons.length),    color: "var(--blue)",   sub: "available" },
          { label: "Retainer Plans",   value: String(retainers.length), color: "var(--purple)", sub: "active tiers" },
          { label: "Pending Discounts",value: String(pendingDiscounts.length),           color: "var(--amber)",  sub: "needs approval" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={(e) => setActiveTab(e.target.value as (typeof tabs)[number])} className={styles.filterSelect}>
          {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* ── Service Catalog Tab ──────────────────────────────────────────────── */}
      {activeTab === "service catalog" && (
        <div>
          <div className={cx("flexRow", "gap8", "mb14")}>
            {(["packages", "addons"] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={cx("btnSm", catalogView === v ? "btnAccent" : "btnGhost")}
                onClick={() => setCatalogView(v)}
              >
                {v === "packages" ? `Packages (${packages.length})` : `Add-ons (${addons.length})`}
              </button>
            ))}
          </div>

          {catalogView === "packages" && (
            <div className={styles.pricTableCard}>
              <div className={styles.pricTableInner}>
                <div className={cx(styles.pricTableHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                  {"Name|Delivery|Billing|Price Range|Status|".split("|").map((h, i) => <span key={`${h}-${i}`}>{h}</span>)}
                </div>
                {packages.map((pkg, i) => (
                  <div key={pkg.id} className={cx(styles.pricTableRow, i < packages.length - 1 && "borderB")}>
                    <span className={cx("fw600")}>{pkg.name}</span>
                    <span className={cx("text11", "colorMuted", "fontMono")}>{pkg.deliveryDays ?? "—"}</span>
                    <span className={cx("fontMono", "colorMuted")}>{pkg.billingType}</span>
                    <span className={cx("fontMono", "colorAccent", "fw700")}>{fmtPrice(pkg.priceMinCents, pkg.priceMaxCents, pkg.isCustomQuote)}</span>
                    <span className={cx("text11", pkg.isActive ? "colorAccent" : "colorMuted")}>{pkg.isActive ? "Active" : "Inactive"}</span>
                    <div className={cx("flexRow", "gap6")}>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        onClick={() => setPkgModal({
                          mode: "edit",
                          id: pkg.id,
                          draft: {
                            name: pkg.name, slug: pkg.slug, tagline: pkg.tagline ?? "",
                            priceMinCents: pkg.priceMinCents, priceMaxCents: pkg.priceMaxCents,
                            isCustomQuote: pkg.isCustomQuote, deliveryDays: pkg.deliveryDays ?? "",
                            paymentTerms: pkg.paymentTerms ?? "", billingType: pkg.billingType,
                          },
                        })}
                      >
                        Edit
                      </button>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => togglePkgActive(pkg)}>
                        {pkg.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost", "colorRed")}
                        onClick={() => { if (confirm(`Delete "${pkg.name}"?`)) void deletePkg(pkg.id); }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {!loading && packages.length === 0 && (
                  <div className={cx("colorMuted", "text12", styles.pricEmptyRow)}>No packages yet. Create one above.</div>
                )}
              </div>
            </div>
          )}

          {catalogView === "addons" && (
            <div className={styles.pricTableCard}>
              <div className={styles.pricTableInner}>
                <div className={cx(styles.pricTableHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                  {"Name|Category|Price Range|Label|Status|".split("|").map((h, i) => <span key={`${h}-${i}`}>{h}</span>)}
                </div>
                {addons.map((addon, i) => (
                  <div key={addon.id} className={cx(styles.pricTableRow, i < addons.length - 1 && "borderB")}>
                    <span className={cx("fw600")}>{addon.name}</span>
                    <span className={cx("text11", "colorMuted", "fontMono")}>{addon.category}</span>
                    <span className={cx("fontMono", "colorAccent", "fw700")}>{fmtPrice(addon.priceMinCents, addon.priceMaxCents)}</span>
                    <span className={cx("text11", "colorMuted")}>{addon.priceLabel ?? ""}</span>
                    <span className={cx("text11", addon.isActive ? "colorAccent" : "colorMuted")}>{addon.isActive ? "Active" : "Inactive"}</span>
                  </div>
                ))}
                {!loading && addons.length === 0 && (
                  <div className={cx("colorMuted", "text12", styles.pricEmptyRow)}>No add-ons found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Retainer Tiers Tab ───────────────────────────────────────────────── */}
      {activeTab === "retainer tiers" && (
        <div>
          <div className={cx("flexEnd", "mb14")}>
            <button
              type="button"
              className={cx("btnSm", "btnAccent")}
              onClick={() => setRetainerModal({ mode: "create", draft: emptyRetainerDraft() })}
            >
              + New Retainer Plan
            </button>
          </div>
          <div className={styles.pricTierGrid}>
            {retainers.map((plan, i) => (
              <div key={plan.id} className={cx(styles.pricTierCard, i === 1 && styles.pricTierCardPopular)}>
                {i === 1 && <div className={styles.pricPopularTag}>MOST POPULAR</div>}
                <div className={cx(styles.pricTierName, i === 1 ? styles.pricTierNamePopular : "colorText")}>{plan.name}</div>
                <div className={styles.pricTierPrice}>{fmtPrice(plan.priceMinCents, plan.priceMaxCents)}</div>
                <div className={styles.pricTierSub}>per month</div>
                {plan.description && (
                  <div className={cx("text11", "colorMuted", "mb8")}>{plan.description}</div>
                )}
                <div className={styles.pricDivider} />
                <div className={styles.pricFeatureStack}>
                  {plan.features.map((f) => (
                    <div key={f} className={styles.pricFeatureRow}>
                      <span className={styles.pricCheck}>v</span>
                      <span className={styles.colorMuted}>{f}</span>
                    </div>
                  ))}
                </div>
                <div className={cx("flexRow", "gap6", "mt12")}>
                  <button
                    type="button"
                    className={cx("btnSm", i === 1 ? "btnAccent" : "btnGhost", styles.pricBigBtn)}
                    onClick={() => setRetainerModal({
                      mode: "edit",
                      id: plan.id,
                      draft: {
                        name: plan.name,
                        description: plan.description ?? "",
                        priceMinCents: plan.priceMinCents,
                        priceMaxCents: plan.priceMaxCents,
                      },
                    })}
                  >
                    Edit Plan
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost", "colorRed")}
                    onClick={() => { if (confirm(`Delete "${plan.name}"?`)) void deleteRetainer(plan.id); }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!loading && retainers.length === 0 && (
              <div className={cx("colorMuted", "text12")}>No retainer plans found. Create one above.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Quote Builder Tab ────────────────────────────────────────────────── */}
      {activeTab === "quote builder" && (
        <div className={styles.pricQuoteSplit}>
          <div>
            <div className={styles.pricQuoteCard}>
              <div className={styles.pricSectionTitle}>Quote Details</div>
              <div className={styles.pricFormGrid3}>
                <div>
                  <div className={styles.pricFieldLabel}>Client</div>
                  <select title="Quote client" value={quoteClient} onChange={(e) => setQuoteClient(e.target.value)} className={styles.formInput}>
                    <option value="">Select client…</option>
                    {(snapshot.clients ?? []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className={styles.pricFieldLabel}>Valid Until</div>
                  <input type="date" defaultValue="2026-03-23" className={styles.formInput} />
                </div>
                <div>
                  <div className={styles.pricFieldLabel}>Discount %</div>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} min={0} max={30} className={cx("formInput", styles.pricDiscountInput)} />
                </div>
              </div>
            </div>

            <div className={styles.pricTableCard}>
              <div className={cx(styles.pricQuoteHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                {"Service|Qty|Unit Price|Total".split("|").map((h) => <span key={h}>{h}</span>)}
              </div>
              {quoteLines.map((line, i) => {
                const pkg = packages.find((p) => p.id === line.pkgId);
                if (!pkg) return null;
                const unitPrice = pkg.priceMinCents / 100;
                return (
                  <div key={i} className={cx(styles.pricQuoteRow, "borderB")}>
                    <span className={cx("fw600")}>{pkg.name}</span>
                    <span className={cx("fontMono", "colorMuted")}>{line.qty}</span>
                    <span className={cx("fontMono", "colorMuted")}>R{unitPrice.toLocaleString()}</span>
                    <span className={cx("fontMono", "colorAccent", "fw700")}>R{(unitPrice * line.qty).toLocaleString()}</span>
                  </div>
                );
              })}
              <div className={styles.pricPadRow}>
                <div className={cx(styles.pricFieldLabel, "mb6")}>Add Package</div>
                <select
                  title="Add package to quote"
                  className={styles.filterSelect}
                  defaultValue=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setQuoteLines((prev) => [...prev, { pkgId: e.target.value, qty: 1 }]);
                    e.target.value = "";
                  }}
                >
                  <option value="">Select package…</option>
                  {packages.map((p) => <option key={p.id} value={p.id}>{p.name} ({fmtPrice(p.priceMinCents, p.priceMaxCents, p.isCustomQuote)})</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.pricSideStack}>
            <div className={styles.pricQuoteCard}>
              <div className={styles.pricSectionTitle}>Quote Summary</div>
              <div className={styles.pricSummaryStack}>
                {[
                  { label: "Subtotal",          value: `R${quoteSubtotal.toLocaleString()}`,                         color: "var(--text)"  },
                  { label: `Discount (${discount}%)`, value: `-R${quoteDiscount.toLocaleString()}`,                  color: "var(--amber)" },
                  { label: "Excl. VAT",         value: `R${quoteTotal.toLocaleString()}`,                            color: "var(--text)"  },
                  { label: "VAT (15%)",          value: `R${quoteVAT.toLocaleString()}`,                             color: "var(--muted)" },
                ].map((r) => (
                  <div key={r.label} className={styles.pricSummaryRow}>
                    <span className={cx("text13", "colorMuted")}>{r.label}</span>
                    <span className={cx("fontMono", r.color === "var(--text)" ? "colorText" : colorClass(r.color))}>{r.value}</span>
                  </div>
                ))}
                <div className={styles.pricTotalRow}>
                  <span className={styles.pricTotalLabel}>Total</span>
                  <span className={styles.pricTotalValue}>R{quoteFinal.toLocaleString()}</span>
                </div>
              </div>
              <div className={styles.pricActionStack}>
                <button type="button" className={cx("btnSm", "btnAccent", styles.pricBigBtn)}>
                  Send Quote{quoteClient ? ` to ${quoteClient}` : ""}
                </button>
                <button type="button" className={cx("btnSm", "btnGhost", styles.pricBigBtn)} onClick={() => window.print()}>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Discount Approvals Tab ───────────────────────────────────────────── */}
      {activeTab === "discount approvals" && (
        <div className={styles.pricDiscountStack}>
          <div className={styles.pricPolicyCard}>
            <div className={styles.pricPolicyTitle}>Discount Policy</div>
            <div className={styles.pricPolicyText}>Any discount above 10% requires admin approval. Discounts exceeding 20% require justification and are logged for quarterly review. Max allowed discount: 30%.</div>
          </div>
          {pendingDiscounts.length === 0 && (
            <div className={cx("colorMuted", "text12", "p16")}>No pending discount approvals.</div>
          )}
          {pendingDiscounts.map((d, i) => (
            <div key={i} className={styles.pricDiscountCard}>
              <div className={styles.pricDiscountGrid}>
                <div>
                  <div className={styles.pricDiscountClient}>{d.client}</div>
                  <div className={cx("text12", "colorMuted")}>{d.item}</div>
                  <div className={styles.pricRequestedBy}>Requested by: {d.requestedBy}</div>
                </div>
                <div>
                  <div className={styles.pricFieldLabel}>Discount</div>
                  <div className={styles.pricDiscountValue}>{d.discount}%</div>
                </div>
                <div>
                  <div className={styles.pricFieldLabel}>Reason</div>
                  <div className={styles.text13}>{d.reason}</div>
                </div>
                <div className={styles.pricApprovalBtns}>
                  <button type="button" className={cx("btnSm", "btnAccent", styles.pricBigBtn)}>Approve</button>
                  <button type="button" className={cx("btnSm", "btnGhost", styles.pricRejectBtn, styles.pricBigBtn)}>Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Package Create/Edit Modal ────────────────────────────────────────── */}
      {pkgModal && (
        <div
          className={styles.pricModalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setPkgModal(null); }}
        >
          <div className={styles.pricModalBox}>
            <div className={cx("fw700", "text16", "mb20")}>
              {pkgModal.mode === "create" ? "New Package" : "Edit Package"}
            </div>
            <div className={cx("flexCol", "gap14")}>
              {([
                { key: "name",          label: "Name",              type: "text"   },
                { key: "slug",          label: "Slug",              type: "text"   },
                { key: "tagline",       label: "Tagline",           type: "text"   },
                { key: "deliveryDays",  label: "Delivery Days",     type: "text"   },
                { key: "paymentTerms",  label: "Payment Terms",     type: "text"   },
                { key: "priceMinCents", label: "Price Min (cents)", type: "number" },
                { key: "priceMaxCents", label: "Price Max (cents)", type: "number" },
              ] as const).map(({ key, label, type }) => (
                <div key={key}>
                  <label className={styles.pricModalLabel}>{label}</label>
                  <input
                    type={type}
                    className={styles.formInput}
                    value={pkgModal.draft[key]}
                    onChange={(e) =>
                      setPkgModal((prev) =>
                        prev ? { ...prev, draft: { ...prev.draft, [key]: type === "number" ? Number(e.target.value) : e.target.value } } : null
                      )
                    }
                  />
                </div>
              ))}
              <div>
                <label className={styles.pricModalCheckLabel}>
                  <input
                    type="checkbox"
                    checked={pkgModal.draft.isCustomQuote}
                    onChange={(e) =>
                      setPkgModal((prev) =>
                        prev ? { ...prev, draft: { ...prev.draft, isCustomQuote: e.target.checked } } : null
                      )
                    }
                  />
                  Custom Quote (hides price range)
                </label>
              </div>
            </div>
            <div className={cx("flexRow", "gap8", "flexEnd", "mt20")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setPkgModal(null)} disabled={saving}>Cancel</button>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={savePkg} disabled={saving}>
                {saving ? "Saving…" : pkgModal.mode === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Retainer Create/Edit Modal ───────────────────────────────────────── */}
      {retainerModal && (
        <div
          className={styles.pricModalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setRetainerModal(null); }}
        >
          <div className={styles.pricModalBoxSm}>
            <div className={cx("fw700", "text16", "mb20")}>
              {retainerModal.mode === "create" ? "New Retainer Plan" : "Edit Retainer Plan"}
            </div>
            <div className={cx("flexCol", "gap14")}>
              {([
                { key: "name",          label: "Name",              type: "text"   },
                { key: "description",   label: "Description",       type: "text"   },
                { key: "priceMinCents", label: "Price Min (cents)",  type: "number" },
                { key: "priceMaxCents", label: "Price Max (cents)",  type: "number" },
              ] as const).map(({ key, label, type }) => (
                <div key={key}>
                  <label className={styles.pricModalLabel}>{label}</label>
                  <input
                    type={type}
                    className={styles.formInput}
                    value={retainerModal.draft[key]}
                    onChange={(e) =>
                      setRetainerModal((prev) =>
                        prev ? { ...prev, draft: { ...prev.draft, [key]: type === "number" ? Number(e.target.value) : e.target.value } } : null
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <div className={cx("flexRow", "gap8", "flexEnd", "mt20")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setRetainerModal(null)} disabled={saving}>Cancel</button>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={saveRetainer} disabled={saving}>
                {saving ? "Saving…" : retainerModal.mode === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
