// ════════════════════════════════════════════════════════════════════════════
// service-catalog-page.tsx — Staff Service Catalog (static reference)
// Data : Static reference catalog — no backend endpoint required
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";

// ── Static catalog data ───────────────────────────────────────────────────────

const services = [
  { name: "Brand Identity Design",        category: "Design",   timeline: "6-8 weeks",  description: "Logo, visual language, guidelines, and asset delivery"                        },
  { name: "Website Design & Development", category: "Digital",  timeline: "8-12 weeks", description: "Full responsive website with CMS integration"                               },
  { name: "Campaign Strategy",            category: "Strategy", timeline: "4-6 weeks",  description: "Audience research, messaging, content plan, and creative direction"          },
  { name: "Design System",                category: "Design",   timeline: "6-10 weeks", description: "Component library, tokens, documentation, and governance"                   },
  { name: "Annual Report Design",         category: "Print",    timeline: "4-6 weeks",  description: "Data viz, layout, photography direction, and print-ready files"             },
  { name: "Social Media Management",      category: "Digital",  timeline: "Ongoing",    description: "Content creation, scheduling, community management, and reporting"          },
  { name: "UX Audit & Research",          category: "Strategy", timeline: "2-3 weeks",  description: "Heuristic evaluation, user testing, and improvement roadmap"                },
  { name: "Motion & Animation",           category: "Design",   timeline: "2-4 weeks",  description: "Explainer videos, UI animations, and brand motion language"                 },
];

const CATEGORIES = [...new Set(services.map((s) => s.category))];

function catColor(c: string): string {
  if (c === "Design")   return "var(--accent)";
  if (c === "Digital")  return "var(--blue)";
  if (c === "Strategy") return "var(--purple)";
  if (c === "Print")    return "var(--amber)";
  return "var(--muted2)";
}

function catCls(c: string): string {
  if (c === "Design")   return "svcCatDesign";
  if (c === "Digital")  return "svcCatDigital";
  if (c === "Strategy") return "svcCatStrategy";
  if (c === "Print")    return "svcCatPrint";
  return "";
}

// ── Props ─────────────────────────────────────────────────────────────────────

type ServiceCatalogPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Page component ────────────────────────────────────────────────────────────

export function ServiceCatalogPage({ isActive, session: _session }: ServiceCatalogPageProps) {
  const totalServices = services.length;
  const totalCats     = CATEGORIES.length;
  const ongoingCount  = services.filter((s) => s.timeline === "Ongoing").length;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-service-catalog">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Knowledge</div>
        <h1 className={cx("pageTitleText")}>Service Catalog</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Client-facing service offerings reference (read-only)</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("svcStatGrid")}>

        <div className={cx("svcStatCard")}>
          <div className={cx("svcStatCardTop")}>
            <div className={cx("svcStatLabel")}>Services</div>
            <div className={cx("svcStatValue", "colorAccent")}>{totalServices}</div>
          </div>
          <div className={cx("svcStatCardDivider")} />
          <div className={cx("svcStatCardBottom")}>
            <span className={cx("svcStatDot", "dotBgAccent")} />
            <span className={cx("svcStatMeta")}>offerings available</span>
          </div>
        </div>

        <div className={cx("svcStatCard")}>
          <div className={cx("svcStatCardTop")}>
            <div className={cx("svcStatLabel")}>Categories</div>
            <div className={cx("svcStatValue", "colorMuted2")}>{totalCats}</div>
          </div>
          <div className={cx("svcStatCardDivider")} />
          <div className={cx("svcStatCardBottom")}>
            <span className={cx("svcStatDot", "dotBgMuted2")} />
            <span className={cx("svcStatMeta")}>service groups</span>
          </div>
        </div>

        <div className={cx("svcStatCard")}>
          <div className={cx("svcStatCardTop")}>
            <div className={cx("svcStatLabel")}>Ongoing</div>
            <div className={cx("svcStatValue", "colorAccent")}>{ongoingCount}</div>
          </div>
          <div className={cx("svcStatCardDivider")} />
          <div className={cx("svcStatCardBottom")}>
            <span className={cx("svcStatDot", "dotBgAccent")} />
            <span className={cx("svcStatMeta")}>retainer services</span>
          </div>
        </div>

        <div className={cx("svcStatCard")}>
          <div className={cx("svcStatCardTop")}>
            <div className={cx("svcStatLabel")}>Pricing</div>
            <div className={cx("svcStatValue", "colorMuted2")}>Custom</div>
          </div>
          <div className={cx("svcStatCardDivider")} />
          <div className={cx("svcStatCardBottom")}>
            <span className={cx("svcStatDot", "dotBgMuted2")} />
            <span className={cx("svcStatMeta")}>contact sales for quotes</span>
          </div>
        </div>

      </div>

      {/* ── Service sections by category ──────────────────────────────────── */}
      {CATEGORIES.map((cat) => {
        const catServices = services.filter((s) => s.category === cat);
        return (
          <div key={cat} className={cx("svcSection")}>

            <div className={cx("svcSectionHeader")}>
              <div className={cx("svcSectionLeft")}>
                <span className={cx("svcCatIndicator", "dynBgColor")} style={{ "--bg-color": catColor(cat) } as React.CSSProperties} />
                <div className={cx("svcSectionTitle")}>{cat}</div>
              </div>
              <span className={cx("svcSectionMeta")}>{catServices.length} SERVICE{catServices.length !== 1 ? "S" : ""}</span>
            </div>

            <div className={cx("svcServiceList")}>
              {catServices.map((s, idx) => (
                <div key={s.name} className={cx("svcCard", idx === catServices.length - 1 && "svcCardLast")}>

                  {/* Name + category badge */}
                  <div className={cx("svcCardHead")}>
                    <div className={cx("svcServiceName")}>{s.name}</div>
                    <span className={cx("svcCatBadge", catCls(s.category))}>{s.category}</span>
                  </div>

                  {/* Description */}
                  <div className={cx("svcDescription")}>{s.description}</div>

                  {/* Footer: timeline chip */}
                  <div className={cx("svcCardFooter")}>
                    <span className={cx("svcTimelineChip", s.timeline === "Ongoing" ? "svcTimelineOngoing" : "svcTimelineFixed")}>
                      {s.timeline}
                    </span>
                  </div>

                </div>
              ))}
            </div>

          </div>
        );
      })}

    </section>
  );
}
