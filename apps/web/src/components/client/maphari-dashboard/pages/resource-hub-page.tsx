"use client";

// ════════════════════════════════════════════════════════════════════════════
// resource-hub-page.tsx — Client Resource Hub
// Loads knowledge articles (category=resource) from the governance API.
// Falls back to curated static list when the API returns no published articles.
// ════════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { saveSession } from "@/lib/auth/session";
import {
  loadPortalKnowledgeArticlesWithRefresh,
  type PortalKnowledgeArticle,
} from "@/lib/api/portal/governance";

// ── Types ─────────────────────────────────────────────────────────────────────

type RHCategory = "All" | "Templates" | "Guides" | "Checklists" | "Videos";

interface ResourceItem {
  id:       string;
  title:    string;
  category: RHCategory;
  icon:     string;
  color:    string;
  ext:      string;
  size:     string;
  updated:  string;
  isNew:    boolean;
  desc:     string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: RHCategory[] = ["All", "Templates", "Guides", "Checklists", "Videos"];

const CAT_COLOR: Record<RHCategory, string> = {
  All:        "var(--muted)",
  Templates:  "var(--amber)",
  Guides:     "var(--purple)",
  Checklists: "var(--green)",
  Videos:     "var(--lime)",
};

const CAT_BADGE: Record<RHCategory, string> = {
  All:        "badgeMuted",
  Templates:  "badgeAmber",
  Guides:     "badgePurple",
  Checklists: "badgeGreen",
  Videos:     "badgeAccent",
};

const CAT_ICON: Record<RHCategory, string> = {
  All:        "file",
  Templates:  "file",
  Guides:     "star",
  Checklists: "check",
  Videos:     "zap",
};

const EXT_COLOR: Record<string, string> = {
  PDF:   "var(--red)",
  DOCX:  "var(--accent)",
  PPTX:  "var(--amber)",
  VIDEO: "var(--purple)",
};

// ── Curated fallback (shown when API returns no published articles) ─────────────

const CURATED: ResourceItem[] = [
  { id: "r01", title: "Project Brief Template",      category: "Templates",  icon: "file",   color: "var(--lime)",   ext: "PDF",   size: "245 KB",  updated: "2 Mar 2026",  isNew: true,  desc: "Structured template for scoping new projects. Covers goals, timelines, budget, and stakeholder sign-off." },
  { id: "r02", title: "Brand Voice Guide",           category: "Guides",     icon: "star",   color: "var(--amber)",  ext: "PDF",   size: "1.2 MB",  updated: "28 Feb 2026", isNew: false, desc: "Tone, vocabulary, and communication principles for all client-facing copy across channels." },
  { id: "r03", title: "Sprint Planning Checklist",   category: "Checklists", icon: "check",  color: "var(--green)",  ext: "PDF",   size: "89 KB",   updated: "1 Mar 2026",  isNew: true,  desc: "Pre-sprint checklist for aligning on goals, capacity, and acceptance criteria before each sprint." },
  { id: "r04", title: "Client Onboarding Guide",     category: "Guides",     icon: "link",   color: "var(--purple)", ext: "PDF",   size: "3.1 MB",  updated: "15 Feb 2026", isNew: false, desc: "Step-by-step walkthrough of the Maphari onboarding process — tools, contacts, and first-sprint expectations." },
  { id: "r05", title: "Figma Handoff Checklist",     category: "Checklists", icon: "check",  color: "var(--lime)",   ext: "PDF",   size: "156 KB",  updated: "20 Feb 2026", isNew: false, desc: "Ensure every handoff includes named layers, exported assets, spacing notes, and component annotations." },
  { id: "r06", title: "Presentation Deck Template",  category: "Templates",  icon: "layers", color: "var(--amber)",  ext: "PPTX",  size: "8.4 MB",  updated: "10 Feb 2026", isNew: false, desc: "Branded slide template for sprint demos, strategy calls, and board presentations. Fully editable." },
  { id: "r07", title: "API Integration Guide",       category: "Guides",     icon: "code",   color: "var(--green)",  ext: "PDF",   size: "512 KB",  updated: "5 Feb 2026",  isNew: false, desc: "Technical guide for connecting third-party APIs — auth, rate limits, and error handling patterns." },
  { id: "r08", title: "QA Testing Checklist",        category: "Checklists", icon: "check",  color: "var(--purple)", ext: "PDF",   size: "203 KB",  updated: "22 Feb 2026", isNew: false, desc: "Full functional, accessibility, and performance checklist for pre-launch quality assurance sign-off." },
  { id: "r09", title: "Project Kickoff Walkthrough", category: "Videos",     icon: "zap",    color: "var(--accent)", ext: "VIDEO", size: "45 min",  updated: "1 Jan 2026",  isNew: false, desc: "Video walkthrough of the entire project kickoff process — from contract signing to first sprint planning." },
  { id: "r10", title: "Brand Guidelines PDF",        category: "Guides",     icon: "file",   color: "var(--lime)",   ext: "PDF",   size: "4.2 MB",  updated: "14 Feb 2026", isNew: false, desc: "Complete brand identity system: logo usage, color palette, typography scale, and do/don't examples." },
  { id: "r11", title: "Change Request Template",     category: "Templates",  icon: "edit",   color: "var(--amber)",  ext: "DOCX",  size: "67 KB",   updated: "18 Feb 2026", isNew: true,  desc: "Formal change request document template with impact analysis and approval sign-off fields." },
  { id: "r12", title: "Post-Launch Report Template", category: "Templates",  icon: "chart",  color: "var(--green)",  ext: "DOCX",  size: "134 KB",  updated: "8 Feb 2026",  isNew: false, desc: "Template for summarising launch outcomes: metrics, wins, issues, and next-phase recommendations." },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derive a RHCategory from the article's category string. */
function mapCategory(raw: string | null): Exclude<RHCategory, "All"> {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("template"))  return "Templates";
  if (s.includes("checklist")) return "Checklists";
  if (s.includes("video"))     return "Videos";
  return "Guides";
}

/** Derive a file extension label from the article's tag list. */
function mapExt(tags: string | null): string {
  const t = (tags ?? "").toLowerCase();
  if (t.includes("video") || t.includes("mp4")) return "VIDEO";
  if (t.includes("pptx") || t.includes("slides")) return "PPTX";
  if (t.includes("docx") || t.includes("word"))   return "DOCX";
  return "PDF";
}

/** Format an ISO date string to a human-readable label (e.g. "5 Mar 2026"). */
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Map a PortalKnowledgeArticle to a ResourceItem. */
function mapArticle(a: PortalKnowledgeArticle): ResourceItem {
  const cat   = mapCategory(a.category);
  const ext   = mapExt(a.tags);
  const color = CAT_COLOR[cat] === "var(--muted)" ? "var(--lime)" : CAT_COLOR[cat];
  const icon  = CAT_ICON[cat];

  // isNew = published within the last 14 days
  const pubAt  = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
  const isNew  = pubAt > 0 && Date.now() - pubAt < 14 * 24 * 60 * 60 * 1000;

  return {
    id:      a.id,
    title:   a.title,
    category: cat,
    icon,
    color,
    ext,
    size:    "—",
    updated: fmtDate(a.updatedAt),
    isNew,
    desc:    a.content.slice(0, 180) + (a.content.length > 180 ? "…" : ""),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ResourceHubPage() {
  const { session }           = useProjectLayer();
  const notify                = usePageToast();
  const [tab,     setTab]     = useState<RHCategory>("All");
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<ResourceItem[]>([]);

  // ── Load knowledge articles (category=resource) from API ──────────────────
  useEffect(() => {
    if (!session) {
      // No session yet — use curated list immediately (no skeleton flash)
      setResources(CURATED);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadPortalKnowledgeArticlesWithRefresh(session)
      .then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        const articles = r.data ?? [];
        // Filter to published articles with resource-related category/tags
        const resourceArticles = articles.filter(
          (a) =>
            a.status === "PUBLISHED" &&
            (
              (a.category ?? "").toLowerCase().includes("resource") ||
              (a.tags ?? "").toLowerCase().includes("resource") ||
              (a.tags ?? "").toLowerCase().includes("template") ||
              (a.tags ?? "").toLowerCase().includes("guide") ||
              (a.tags ?? "").toLowerCase().includes("checklist")
            )
        );
        // Use API articles when available, otherwise fall back to curated list
        setResources(resourceArticles.length > 0 ? resourceArticles.map(mapArticle) : CURATED);
      })
      .catch(() => {
        // API error — silently fall back to curated list
        setResources(CURATED);
      })
      .finally(() => setLoading(false));
  }, [session]);

  // ── Derived counts for stat cards ─────────────────────────────────────────
  const templateCount  = resources.filter((r) => r.category === "Templates").length;
  const guideCount     = resources.filter((r) => r.category === "Guides").length;

  // ── Filtered list for the grid ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = tab === "All" ? resources : resources.filter((r) => r.category === tab);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q));
    }
    return list;
  }, [tab, query, resources]);

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Files · Resources</div>
          <h1 className={cx("pageTitle")}>Resource Hub</h1>
          <p className={cx("pageSub")}>Templates, guides, and tools to help you get the most from your project.</p>
        </div>
        <div className={cx("pageActions")}>
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            disabled={loading || resources.length === 0}
            onClick={() => notify("success", "Preparing download", "Your resource pack will be ready shortly.")}
          >
            <Ic n="download" sz={12} c="var(--bg)" /> Download All
          </button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack")}>
        {[
          { label: "Total Resources", value: loading ? "—" : String(resources.length), color: "statCardAccent" },
          { label: "Templates",       value: loading ? "—" : String(templateCount),     color: "statCardAmber"  },
          { label: "Guides",          value: loading ? "—" : String(guideCount),         color: "statCardPurple" },
          { label: "Total Downloads", value: "—",                                        color: "statCardGreen"  },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className={cx("relative")}>
        <span className={cx("searchIconWrap")}>
          <Ic n="search" sz={13} c="var(--muted2)" />
        </span>
        <input
          className={cx("input", "pl36")}
          placeholder={`Search ${resources.length} resources…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* ── Category tabs ───────────────────────────────────────────────────── */}
      <div className={cx("pillTabs")}>
        {TABS.map((t) => (
          <button key={t} type="button" className={cx("pillTab", tab === t && "pillTabActive")} onClick={() => setTab(t)}>
            {t !== "All" && (
              <span className={cx("wh6", "rounded50", "dynBgColor", "inlineBlock", "mr5", "noShrink")} style={{ "--bg-color": CAT_COLOR[t] } as React.CSSProperties} />
            )}
            {t}
          </button>
        ))}
      </div>

      {/* ── Loading skeleton ────────────────────────────────────────────────── */}
      {loading ? (
        <div className={cx("grid3Cols", "gap14")}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cx("card", "rhSkeleCard")}>
              <div className={cx("h3", "dotBgB1")} />
              <div className={cx("p16x18x14")}>
                <div className={cx("skeletonLine", "skeleBlock14x60p", "mb10")} />
                <div className={cx("skeletonLine", "skeleBlock10x100p", "mb6")} />
                <div className={cx("skeletonLine", "skeleBlock10x80p")} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (

        /* ── Empty state ──────────────────────────────────────────────────── */
        <div className={cx("textCenter", "py48_0", "colorMuted2")}>
          <Ic n="search" sz={28} c="var(--muted2)" />
          <div className={cx("text12", "mt12")}>No resources match your search.</div>
        </div>
      ) : (

        /* ── Resource grid ────────────────────────────────────────────────── */
        <div className={cx("grid3Cols", "gap14")}>
          {filtered.map((r) => {
            const catColor = CAT_COLOR[r.category as RHCategory];
            const extColor = EXT_COLOR[r.ext] ?? "var(--muted2)";
            return (
              <div key={r.id} className={cx("card", "p0", "overflowHidden", "flexCol")}>

                {/* Category accent bar */}
                <div className={cx("h3", "dynBgColor", "noShrink")} style={{ "--bg-color": catColor } as React.CSSProperties} />

                {/* Card body */}
                <div className={cx("p16x18x14", "flex1", "flexCol")}>

                  {/* Icon + badges + title */}
                  <div className={cx("rhIconRow")}>
                    <div className={cx("rhIconBox", "dynBgColor", "dynBorderColor")} style={{ "--bg-color": `color-mix(in oklab, ${r.color} 12%, var(--s2))`, "--border-color": `color-mix(in oklab, ${r.color} 25%, transparent)` } as React.CSSProperties}>
                      <Ic n={r.icon} sz={16} c={r.color} />
                    </div>
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("flexRow", "gap5", "alignCenter", "mb5", "flexWrap")}>
                        <span className={cx("badge", CAT_BADGE[r.category as RHCategory])}>{r.category}</span>
                        {r.isNew && <span className={cx("badge", "badgeAccent", "fs9")}>NEW</span>}
                      </div>
                      <div className={cx("fw700", "text12", "lineH135")}>{r.title}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={cx("text11", "colorMuted", "lineH16", "flex1")}>{r.desc}</p>
                </div>

                {/* Card footer */}
                <div className={cx("rhCardFooter")}>
                  {/* Meta row */}
                  <div className={cx("flexRow", "flexCenter", "gap8", "mb10")}>
                    <span className={cx("rhExtBadge", "dynColor", "dynBgColor", "dynBorderColor")} style={{ "--color": extColor, "--bg-color": `color-mix(in oklab, ${extColor} 10%, transparent)`, "--border-color": `color-mix(in oklab, ${extColor} 22%, transparent)` } as React.CSSProperties}>
                      {r.ext}
                    </span>
                    <span className={cx("text10", "colorMuted")}>{r.size}</span>
                    <span className={cx("opacity30", "fs10")}>·</span>
                    <span className={cx("text10", "colorMuted")}>Updated {r.updated}</span>
                  </div>

                  {/* Actions row */}
                  <div className={cx("flexRow", "gap6")}>
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost", "flex1")}
                      onClick={() => notify("info", "Preview", `Opening preview for "${r.title}"`)}
                    >
                      <Ic n="eye" sz={14} c="var(--muted)" /> Preview
                    </button>
                    <button
                      type="button"
                      className={cx("btnSm", "btnAccent", "flex1")}
                      onClick={() => notify("success", r.ext === "VIDEO" ? "Opening video" : "Download started", `"${r.title}" will open shortly.`)}
                    >
                      <Ic n="download" sz={14} c="var(--bg)" />
                      {r.ext === "VIDEO" ? "Watch" : "Download"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
