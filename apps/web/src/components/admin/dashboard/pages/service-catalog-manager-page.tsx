"use client";

import { useState, useEffect, useRef } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import { cx, styles } from "../style";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAdminServiceCatalogWithRefresh,
  createAdminPackageWithRefresh,
  updateAdminPackageWithRefresh,
  deleteAdminPackageWithRefresh,
  type ServicePackage,
  type ServiceAddon,
} from "../../../../lib/api/admin/service-catalog";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(minCents: number, maxCents: number, isCustom = false): string {
  if (isCustom) return "Custom Quote";
  const currency = process.env.NEXT_PUBLIC_BILLING_CURRENCY ?? "ZAR";
  const r = (c: number) => formatMoneyCents(c, { currency, maximumFractionDigits: 0 });
  return minCents === maxCents ? r(minCents) : `${r(minCents)} – ${r(maxCents)}`;
}

// ── Draft type ────────────────────────────────────────────────────────────────

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

const emptyDraft = (): PkgDraft => ({
  name: "", slug: "", tagline: "",
  priceMinCents: 0, priceMaxCents: 0,
  isCustomQuote: false, deliveryDays: "", paymentTerms: "", billingType: "ONCE_OFF",
});

// ── Component ─────────────────────────────────────────────────────────────────

export function ServiceCatalogManagerPage() {
  const { session } = useAdminWorkspaceContext();

  const [view,    setView]    = useState<"packages" | "addons">("packages");
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [addons,   setAddons]   = useState<ServiceAddon[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const loaded = useRef(false);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; draft: PkgDraft; id?: string } | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (loaded.current || !session) { setLoading(false); return; }
    loaded.current = true;
    void (async () => {
      try {
        const result = await loadAdminServiceCatalogWithRefresh(session);
        if (result.nextSession) saveSession(result.nextSession);
        if (result.data) {
          setPackages(result.data.packages);
          setAddons(result.data.addons);
        } else if (result.error) {
          setError(result.error.message ?? "Failed to load service catalog.");
        }
      } catch (err: unknown) {
        setError((err as Error)?.message ?? "Failed to load service catalog.");
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  // ── Package CRUD ──────────────────────────────────────────────────────────

  async function handleSave() {
    if (!session || !modal) return;
    setSaving(true);
    try {
      if (modal.mode === "create") {
        const res = await createAdminPackageWithRefresh(session, {
          ...modal.draft,
          idealFor: [],
          features: [],
          sortOrder: packages.length,
          isActive: true,
        });
        if (res.nextSession) saveSession(res.nextSession);
        if (res.data) setPackages((prev) => [...prev, res.data!]);
        else if (res.error) setError(res.error.message ?? "Failed to create package.");
      } else if (modal.id) {
        const res = await updateAdminPackageWithRefresh(session, modal.id, modal.draft);
        if (res.nextSession) saveSession(res.nextSession);
        if (res.data) setPackages((prev) => prev.map((p) => p.id === modal.id ? res.data! : p));
        else if (res.error) setError(res.error.message ?? "Failed to update package.");
      }
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(pkg: ServicePackage) {
    if (!session) return;
    const res = await updateAdminPackageWithRefresh(session, pkg.id, { isActive: !pkg.isActive });
    if (res.nextSession) saveSession(res.nextSession);
    if (res.data) setPackages((prev) => prev.map((p) => p.id === pkg.id ? res.data! : p));
  }

  async function handleDelete(pkg: ServicePackage) {
    if (!session) return;
    if (!confirm(`Delete "${pkg.name}"? This cannot be undone.`)) return;
    const res = await deleteAdminPackageWithRefresh(session, pkg.id);
    if (res.nextSession) saveSession(res.nextSession);
    setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
    <div className={styles.pageBody}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / KNOWLEDGE</div>
          <h1 className={styles.pageTitle}>Service Catalog Manager</h1>
          <div className={styles.pageSub}>Manage client-facing service offerings, pricing, and timelines</div>
        </div>
        <div className={styles.pageActions}>
          {view === "packages" && (
            <button
              type="button"
              className={cx("btnSm", "btnAccent")}
              onClick={() => setModal({ mode: "create", draft: emptyDraft() })}
            >
              + New Service
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={cx("colorRed", "text12", "mb12")}>{error}</div>
      )}

      {/* Sub-view toggle */}
      <div className={cx("flexRow", "gap8", "mb14")}>
        {(["packages", "addons"] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={cx("btnSm", view === v ? "btnAccent" : "btnGhost")}
            onClick={() => setView(v)}
          >
            {v === "packages"
              ? `Packages (${packages.length})`
              : `Add-ons (${addons.length})`}
          </button>
        ))}
      </div>

      {/* ── Packages view ─────────────────────────────────────────────────────── */}
      {view === "packages" && (
        <div className={styles.pricTableCard}>
          <div className={styles.pricTableInner}>
            <div className={cx(styles.pricTableHead, "fontMono", "text10", "colorMuted", "uppercase")}>
              {"Name|Delivery|Billing|Price Range|Status|".split("|").map((h, i) => <span key={`${h}-${i}`}>{h}</span>)}
            </div>
            {packages.map((pkg, i) => (
              <div key={pkg.id} className={cx(styles.pricTableRow, i < packages.length - 1 ? "borderB" : "")}>
                <span>
                  <div className={cx("fw600")}>{pkg.name}</div>
                  {pkg.tagline && <div className={cx("text11", "colorMuted")}>{pkg.tagline}</div>}
                </span>
                <span className={cx("text11", "colorMuted", "fontMono")}>{pkg.deliveryDays ?? "—"}</span>
                <span className={cx("fontMono", "colorMuted")}>{pkg.billingType.replace("_", " ")}</span>
                <span className={cx("fontMono", "colorAccent", "fw700")}>{fmtPrice(pkg.priceMinCents, pkg.priceMaxCents, pkg.isCustomQuote)}</span>
                <span className={cx("text11", pkg.isActive ? "colorAccent" : "colorMuted")}>
                  {pkg.isActive ? "Active" : "Inactive"}
                </span>
                <div className={cx("flexRow", "gap6")}>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={() => setModal({
                      mode: "edit",
                      id: pkg.id,
                      draft: {
                        name:          pkg.name,
                        slug:          pkg.slug,
                        tagline:       pkg.tagline ?? "",
                        priceMinCents: pkg.priceMinCents,
                        priceMaxCents: pkg.priceMaxCents,
                        isCustomQuote: pkg.isCustomQuote,
                        deliveryDays:  pkg.deliveryDays ?? "",
                        paymentTerms:  pkg.paymentTerms ?? "",
                        billingType:   pkg.billingType,
                      },
                    })}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={() => void handleToggleActive(pkg)}
                  >
                    {pkg.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost", "colorRed")}
                    onClick={() => void handleDelete(pkg)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {packages.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="12" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="10" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className={styles.emptyTitle}>No packages yet</div>
                <div className={styles.emptySub}>Add your first service package to define what you offer clients, including pricing and delivery timelines.</div>
                <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setModal({ mode: "create", draft: emptyDraft() })}>+ New Service</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add-ons view ──────────────────────────────────────────────────────── */}
      {view === "addons" && (
        <div className={styles.pricTableCard}>
          <div className={styles.pricTableInner}>
            <div className={cx(styles.pricTableHead, "fontMono", "text10", "colorMuted", "uppercase")}>
              {"Name|Category|Price Range|Billing|Status|".split("|").map((h, i) => <span key={`${h}-${i}`}>{h}</span>)}
            </div>
            {addons.map((addon, i) => (
              <div key={addon.id} className={cx(styles.pricTableRow, i < addons.length - 1 ? "borderB" : "")}>
                <span>
                  <div className={cx("fw600")}>{addon.name}</div>
                  {addon.description && <div className={cx("text11", "colorMuted")}>{addon.description}</div>}
                </span>
                <span className={cx("text11", "colorMuted")}>{addon.category}</span>
                <span className={cx("fontMono", "colorAccent", "fw700")}>{addon.priceLabel ?? fmtPrice(addon.priceMinCents, addon.priceMaxCents)}</span>
                <span className={cx("fontMono", "colorMuted")}>{addon.billingType.replace("_", " ")}</span>
                <span className={cx("text11", addon.isActive ? "colorAccent" : "colorMuted")}>
                  {addon.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
            {addons.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <polyline points="21 8 21 21 3 21 3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="1" y="3" width="22" height="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="10" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className={styles.emptyTitle}>No add-ons defined</div>
                <div className={styles.emptySub}>Service add-ons are managed via the Pricing page. Visit that section to configure optional extras for your service packages.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create / Edit modal ─────────────────────────────────────────────── */}
      {modal && (
        <div
          className={styles.pricModalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className={styles.pricModalBox}>
            <div className={cx("fw700", "text16", "mb20")}>
              {modal.mode === "create" ? "New Service Package" : "Edit Package"}
            </div>
            <div className={cx("flexCol", "gap14")}>
              {([
                { key: "name",          label: "Name *",                type: "text"   },
                { key: "slug",          label: "Slug *",                type: "text"   },
                { key: "tagline",       label: "Tagline",               type: "text"   },
                { key: "deliveryDays",  label: "Delivery Days",         type: "text"   },
                { key: "paymentTerms",  label: "Payment Terms",         type: "text"   },
                { key: "priceMinCents", label: "Min Price (cents)",     type: "number" },
                { key: "priceMaxCents", label: "Max Price (cents)",     type: "number" },
              ] as const).map(({ key, label, type }) => (
                <div key={key}>
                  <label className={styles.pricModalLabel}>{label}</label>
                  <input
                    type={type}
                    className={styles.formInput}
                    value={modal.draft[key]}
                    onChange={(e) =>
                      setModal((prev) =>
                        prev ? { ...prev, draft: { ...prev.draft, [key]: type === "number" ? Number(e.target.value) : e.target.value } } : null
                      )
                    }
                  />
                </div>
              ))}
              <div>
                <label className={styles.pricModalLabel}>Billing Type</label>
                <select
                  title="Billing Type"
                  className={styles.formInput}
                  value={modal.draft.billingType}
                  onChange={(e) =>
                    setModal((prev) =>
                      prev ? { ...prev, draft: { ...prev.draft, billingType: e.target.value } } : null
                    )
                  }
                >
                  <option value="ONCE_OFF">Once-off</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>
              <div>
                <label className={styles.pricModalCheckLabel}>
                  <input
                    type="checkbox"
                    checked={modal.draft.isCustomQuote}
                    onChange={(e) =>
                      setModal((prev) =>
                        prev ? { ...prev, draft: { ...prev.draft, isCustomQuote: e.target.checked } } : null
                      )
                    }
                  />
                  Custom Quote (hides price range on portal)
                </label>
              </div>
            </div>
            <div className={cx("flexRow", "gap8", "flexEnd", "mt20")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setModal(null)} disabled={saving}>
                Cancel
              </button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                disabled={saving || !modal.draft.name || !modal.draft.slug}
                onClick={() => void handleSave()}
              >
                {saving ? "Saving…" : modal.mode === "create" ? "Create Package" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
