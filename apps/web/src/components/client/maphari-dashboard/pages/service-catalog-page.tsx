"use client";

// ════════════════════════════════════════════════════════════════════════════
// service-catalog-page.tsx — Maphari Service Catalogue
// Loads packages + retainers + add-ons from the gateway (/portal/services).
// "Request This Service" opens a modal → POST /portal/support-tickets
//   with category "SERVICE_REQUEST" so admin can act on it.
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { saveSession } from "../../../../lib/auth/session";
import {
  createPortalSupportTicketWithRefresh,
  loadPortalServicesWithRefresh,
  type ServiceAddon,
  type ServicePackage,
  type RetainerPlan,
} from "../../../../lib/api/portal";

// ── Types ─────────────────────────────────────────────────────────────────────

type SCategory = "All" | "Package" | "Retainer";

interface ServiceItem {
  name:        string;
  category:    "Package" | "Retainer";
  description: string;
  from:        string;
  timeline:    string;
  popular?:    boolean;
  icon:        string;
  features:    string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SLUG_ICON: Record<string, string> = {
  "starter-launch":             "🚀",
  "business-growth":            "📈",
  "smart-automation":           "🤖",
  "full-digital-transformation":"🌐",
  "mobile-app-development":     "📱",
};

function slugToIcon(slug: string): string {
  return SLUG_ICON[slug] ?? "⚙️";
}

function fmtPrice(minCents: number, maxCents: number, isCustom = false): string {
  if (isCustom) return "Custom Quote";
  const r = (c: number) =>
    `R ${(c / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  return minCents === maxCents ? r(minCents) : `${r(minCents)} – ${r(maxCents)}`;
}

function pkgToItem(pkg: ServicePackage, idx: number): ServiceItem {
  const featureList = (pkg.features as { label: string; included: boolean | "Basic" }[])
    .filter((f) => f.included !== false)
    .map((f) => f.label)
    .slice(0, 6);
  return {
    name:        pkg.name,
    category:    "Package",
    description: pkg.tagline ?? `${pkg.name} — a tailored digital solution.`,
    from:        fmtPrice(pkg.priceMinCents, pkg.priceMaxCents, pkg.isCustomQuote),
    timeline:    pkg.deliveryDays ?? "Custom",
    popular:     idx === 1,
    icon:        slugToIcon(pkg.slug),
    features:    featureList.length ? featureList : ["Custom scope", "Dedicated team", "Full delivery"],
  };
}

function retainerToItem(plan: RetainerPlan, idx: number): ServiceItem {
  return {
    name:        plan.name,
    category:    "Retainer",
    description: plan.description ?? `${plan.name} — ongoing support and maintenance.`,
    from:        fmtPrice(plan.priceMinCents, plan.priceMaxCents),
    timeline:    "Rolling monthly",
    popular:     idx === 2,
    icon:        "🛡️",
    features:    plan.features.slice(0, 6),
  };
}

// ── Category display config ───────────────────────────────────────────────────

const CATEGORIES: SCategory[] = ["All", "Package", "Retainer"];

const CAT_BADGE: Record<"Package" | "Retainer", string> = {
  Package:  "badgeAccent",
  Retainer: "badgeGreen",
};

const CAT_COLOR: Record<"Package" | "Retainer", string> = {
  Package:  "var(--lime)",
  Retainer: "var(--green)",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ServiceCatalogPage() {
  const { session }              = useProjectLayer();
  const notify                   = usePageToast();
  const [category, setCategory]  = useState<SCategory>("All");

  // ── Catalog state ─────────────────────────────────────────────────────────
  const [services, setServices]  = useState<ServiceItem[]>([]);
  const [addons,   setAddons]    = useState<ServiceAddon[]>([]);
  const [loading,  setLoading]   = useState(true);
  const [error,    setError]     = useState<string | null>(null);
  const loaded                   = useRef(false);

  // ── Request modal state ───────────────────────────────────────────────────
  const [requesting, setRequesting] = useState<ServiceItem | null>(null);
  const [reqDesc,    setReqDesc]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Load catalog ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (loaded.current) return;
    if (!session) { setLoading(false); return; }
    loaded.current = true;
    setError(null);
    void (async () => {
      try {
        const result = await loadPortalServicesWithRefresh(session);
        if (result.nextSession) saveSession(result.nextSession);
        if (result.data) {
          setServices([
            ...result.data.packages.map(pkgToItem),
            ...result.data.retainers.map(retainerToItem),
          ]);
          setAddons(result.data.addons);
        }
      } catch (err) {
        const msg = (err as Error)?.message ?? "Failed to load services";
        setError(msg);
        notify("error", msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [session, notify]);

  const filtered     = category === "All" ? services : services.filter((s) => s.category === category);
  const popularCount = services.filter((s) => s.popular).length;
  const startingFrom = services.length
    ? services.reduce<string>((acc, s) => (acc ? acc : s.from), "")
    : "—";

  // ── Add-ons grouped by category ───────────────────────────────────────────
  const addonGroups = addons.reduce<Record<string, ServiceAddon[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  // ── Submit service request ────────────────────────────────────────────────
  async function submitRequest() {
    if (!session || !requesting) return;
    if (!reqDesc.trim()) {
      notify("error", "Description required", "Please briefly describe what you need.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createPortalSupportTicketWithRefresh(session, {
        clientId:    session.user.clientId ?? "",
        title:       `Service Request: ${requesting.name}`,
        description: reqDesc.trim(),
        category:    "SERVICE_REQUEST",
        priority:    "HIGH",
      });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        notify("error", "Request failed", result.error.message ?? "Please try again.");
      } else {
        notify("success", "Request submitted", "We'll be in touch within 1 business day to discuss your requirements.");
        setRequesting(null);
        setReqDesc("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Growth · Services</div>
          <h1 className={cx("pageTitle")}>Service Catalogue</h1>
          <p className={cx("pageSub")}>Explore what Maphari can build for you next. Request a quote for any service directly from this page.</p>
        </div>
      </div>

      {/* ── Stat strip ──────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack")}>
        {[
          { label: "Services",    value: loading ? "…" : String(services.length), color: "statCardAccent" },
          { label: "Categories",  value: String(CATEGORIES.length - 1),           color: "statCardBlue"   },
          { label: "Most Popular",value: loading ? "…" : String(popularCount),    color: "statCardAmber"  },
          { label: "Add-ons",     value: loading ? "…" : String(addons.length),   color: "statCardGreen"  },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Category tabs ───────────────────────────────────────────────────── */}
      <div className={cx("pillTabs", "mb16")}>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={cx("pillTab", category === c && "pillTabActive")} onClick={() => setCategory(c)}>
            {c !== "All" && (
              <span className={cx("dot6", "inlineBlock", "mr5", "noShrink", "dynBgColor")} style={{ "--bg-color": CAT_COLOR[c] } as React.CSSProperties} />
            )}
            {c === "Package" ? "Packages" : c === "Retainer" ? "Retainer Plans" : c}
          </button>
        ))}
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────────────── */}
      {loading && (
        <div className={cx("grid2Cols14Gap")}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cx("card", "skeleH260Pulse")} />
          ))}
        </div>
      )}

      {/* ── Error state ──────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {!loading && !error && services.length === 0 && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyIcon")}>📦</div>
          <div className={cx("emptyTitle")}>No services available</div>
          <div className={cx("emptySub")}>The service catalogue is being set up. Check back soon.</div>
        </div>
      )}

      {/* ── Service cards grid ───────────────────────────────────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <div className={cx("grid2Cols14Gap")}>
          {filtered.map((s) => {
            const color = CAT_COLOR[s.category];
            return (
              <div
                key={s.name}
                className={cx("card", "p0", "overflowHidden", "flexCol")}
              >
                {/* Category accent bar */}
                <div className={cx("h3", "dynBgColor", "noShrink")} style={{ "--bg-color": color } as React.CSSProperties} />

                <div className={cx("p18x20x18", "flexCol", "flex1")}>

                  {/* Header: icon + category badge + popular badge */}
                  <div className={cx("flexAlignStart", "gap12", "mb14")}>
                    <div
                      className={cx("scIconBox", "dynBgColor", "dynBorderColor")}
                      style={{ "--bg-color": `color-mix(in oklab, ${color} 10%, var(--s2))`, "--border-color": `color-mix(in oklab, ${color} 25%, transparent)` } as React.CSSProperties}
                    >
                      {s.icon}
                    </div>
                    <div className={cx("flex1", "minW0", "pt2")}>
                      <div className={cx("flexBetween", "gap8", "mb5")}>
                        <span className={cx("badge", CAT_BADGE[s.category])}>{s.category === "Retainer" ? "Retainer Plan" : "Package"}</span>
                        {s.popular && (
                          <span className={cx("scPopularBadge")}>★ Popular</span>
                        )}
                      </div>
                      <div className={cx("fw700", "text13", "lineH13")}>{s.name}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className={cx("text11", "colorMuted", "mb14", "lineH16")}>
                    {s.description}
                  </div>

                  {/* Feature list */}
                  <div className={cx("flexCol", "gap6", "mb16", "flex1")}>
                    {s.features.map((feat) => (
                      <div key={feat} className={cx("flexRow", "gap8")}>
                        <span
                          className={cx("scCheckCircle", "dynBgColor", "dynBorderColor", "dynColor")}
                          style={{ "--bg-color": `color-mix(in oklab, ${color} 12%, var(--s3))`, "--border-color": `color-mix(in oklab, ${color} 25%, transparent)`, "--color": color } as React.CSSProperties}
                        >✓</span>
                        <span className={cx("text11")}>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price + timeline pill */}
                  <div className={cx("scPriceStrip")}>
                    <div className={cx("scPriceCell")}>
                      <div className={cx("text10", "colorMuted", "mb2")}>From</div>
                      <div className={cx("fw800", "scPriceValue", "dynColor")} style={{ "--color": color } as React.CSSProperties}>{s.from}</div>
                    </div>
                    <div className={cx("scTimelineCell")}>
                      <div className={cx("text10", "colorMuted", "mb2")}>Timeline</div>
                      <div className={cx("fw600", "text12", "lineH1")}>{s.timeline}</div>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent", "wFull", "mtAuto")}
                    onClick={() => { setRequesting(s); setReqDesc(""); }}
                  >
                    Request This Service →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add-ons section ──────────────────────────────────────────────────── */}
      {!loading && !error && addons.length > 0 && (
        <div className={cx("mt32")}>
          <div className={cx("sectionTitle", "mb14")}>
            Available Add-ons
            <span className={cx("badge", "badgeMuted", "ml8")}>{addons.length}</span>
          </div>

          {Object.entries(addonGroups).map(([groupName, items]) => (
            <div key={groupName} className={cx("mb20")}>
              <div className={cx("text11", "fw700", "colorMuted", "scAddonGroupLabel")}>
                {groupName}
              </div>
              <div className={cx("grid3Cols10Gap")}>
                {items.map((addon) => {
                  const addonPrice = fmtPrice(addon.priceMinCents, addon.priceMaxCents);
                  const label      = addon.priceLabel ? ` ${addon.priceLabel}` : "";
                  return (
                    <div key={addon.id} className={cx("card", "py14_px", "px16_px")}>
                      <div className={cx("fw600", "text12", "mb4")}>{addon.name}</div>
                      {addon.description && (
                        <div className={cx("text10", "colorMuted", "mb8", "lineH15")}>
                          {addon.description}
                        </div>
                      )}
                      <div className={cx("fw700", "text12", "colorAccent")}>
                        {addonPrice}{label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Request modal ────────────────────────────────────────────────────── */}
      {requesting && (
        <div
          className={cx("modalOverlayBlur")}
          onClick={(e) => { if (e.target === e.currentTarget) setRequesting(null); }}
        >
          <div className={cx("modalBox480")}>
            {/* Modal header */}
            <div className={cx("flexAlignStart", "gap14", "mb20")}>
              <div
                className={cx("scModalIconBox", "dynBgColor", "dynBorderColor")}
                style={{ "--bg-color": `color-mix(in oklab, ${CAT_COLOR[requesting.category]} 12%, var(--s2))`, "--border-color": `color-mix(in oklab, ${CAT_COLOR[requesting.category]} 25%, transparent)` } as React.CSSProperties}
              >
                {requesting.icon}
              </div>
              <div className={cx("flex1")}>
                <div className={cx("text10", "colorMuted", "mb3")}>Service Request</div>
                <div className={cx("fw700", "text14", "lineH13")}>{requesting.name}</div>
                <div className={cx("text11", "colorMuted", "mt2")}>From {requesting.from} · {requesting.timeline}</div>
              </div>
              <button
                type="button"
                className={cx("btnSm", "btnGhost", "p4x8", "colorMuted2")}
                onClick={() => setRequesting(null)}
              >
                <Ic n="x" sz={14} c="var(--muted2)" />
              </button>
            </div>

            {/* Description field */}
            <div className={cx("mb16")}>
              <label className={cx("text11", "fw600", "dBlock", "mb6")}>
                What do you need? <span className={cx("colorRed")}>*</span>
              </label>
              <textarea
                className={cx("input", "textareaStd")}
                placeholder={`Briefly describe your requirements for ${requesting.name}…`}
                value={reqDesc}
                onChange={(e) => setReqDesc(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Info note */}
            <div className={cx("scInfoNote")}>
              <Ic n="info" sz={13} c="var(--lime)" />
              <span className={cx("text11", "colorMuted", "lineH155")}>
                Your request will be reviewed by the Maphari team within 1 business day.
                We will reach out to discuss scope, timeline, and pricing.
              </span>
            </div>

            {/* Actions */}
            <div className={cx("flexRow", "gap8", "justifyEnd")}>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => setRequesting(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={submitRequest}
                disabled={submitting || !reqDesc.trim()}
              >
                {submitting ? "Sending…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
