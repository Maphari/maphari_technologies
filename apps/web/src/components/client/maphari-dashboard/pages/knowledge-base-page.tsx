// ════════════════════════════════════════════════════════════════════════════
// knowledge-base-page.tsx — Client Portal Knowledge Base
// Data     : loadPortalKnowledgeArticlesWithRefresh → GET /knowledge
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useMemo } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { saveSession } from "../../../../lib/auth/session";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalKnowledgeArticlesWithRefresh,
  type PortalKnowledgeArticle,
} from "../../../../lib/api/portal";

// ── Helpers ───────────────────────────────────────────────────────────────────
function categoryBadge(cat: string | null): string {
  if (!cat) return "badgeMuted";
  const c = cat.toLowerCase();
  if (c.includes("billing") || c.includes("finance")) return "badgeAmber";
  if (c.includes("process") || c.includes("project")) return "badgeAccent";
  if (c.includes("technical") || c.includes("tech"))  return "badgePurple";
  if (c.includes("getting") || c.includes("start"))   return "badgeGreen";
  return "badgeMuted";
}

function categoryColor(cat: string | null): string {
  if (!cat) return "var(--muted2)";
  const c = cat.toLowerCase();
  if (c.includes("billing") || c.includes("finance")) return "var(--amber)";
  if (c.includes("process") || c.includes("project")) return "var(--lime)";
  if (c.includes("technical") || c.includes("tech"))  return "var(--purple)";
  if (c.includes("getting") || c.includes("start"))   return "var(--lime)";
  return "var(--muted2)";
}

function excerpt(content: string): string {
  const plain = content.slice(0, 180);
  return plain.length < content.length ? `${plain}…` : plain;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function KnowledgeBasePage() {
  const { session } = useProjectLayer();
  const [articles,  setArticles]  = useState<PortalKnowledgeArticle[]>([]);
  const [category,  setCategory]  = useState("All");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    if (!session) return;
    void loadPortalKnowledgeArticlesWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setArticles(r.data);
    });
  }, [session]);

  // Derive unique categories from real data
  const categories = useMemo(() => {
    const cats = Array.from(new Set(articles.map((a) => a.category ?? "General")));
    return ["All", ...cats.sort()];
  }, [articles]);

  const filtered = useMemo(() => {
    let items = category === "All" ? articles : articles.filter((a) => (a.category ?? "General") === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
    }
    return items;
  }, [articles, category, search]);

  return (
    <div className={cx("pageBody")}>
      {/* ── Search Hero ── */}
      <div className={cx("kbSearchHero")}>
        <div className={cx("pageEyebrow", "mb8")}>Support · Knowledge Base</div>
        <h1 className={cx("pageTitle", "mb6")}>How can we help?</h1>
        <p className={cx("pageSub", "mb20")}>
          Search {articles.length > 0 ? `${articles.length} articles` : "our knowledge base"} for answers to your questions.
        </p>
        <div className={cx("relative", "maxW520", "mAuto")}>
          <span className={cx("searchIconWrapL14")}>
            <Ic n="search" sz={16} c="var(--muted2)" />
          </span>
          <input
            className={cx("input", "pl40", "fs14")}
            placeholder={`Search ${articles.length > 0 ? articles.length + " articles" : "knowledge base"}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className={cx("pillTabs", "mb20")}>
        {categories.map((c) => (
          <button key={c} type="button" className={cx("pillTab", category === c && "pillTabActive")} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* ── Article count heading ── */}
      {filtered.length > 0 && (
        <div className={cx("flexBetween", "mb12", "pl2")}>
          <span className={cx("text11", "colorMuted")}>
            Showing <span className={cx("fw700", "fontMono", "colorText")}>{filtered.length}</span> {filtered.length === 1 ? "article" : "articles"}
            {category !== "All" && <> in <span className={cx("fw600", "colorAccent")}>{category}</span></>}
          </span>
        </div>
      )}

      {/* ── Article grid ── */}
      {filtered.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="file" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>{articles.length === 0 ? "No articles yet" : "No matching articles"}</div>
          <div className={cx("emptyStateSub")}>{articles.length === 0 ? "Your team will publish helpful articles and guides here." : "Try a different search term or category."}</div>
        </div>
      ) : (
        <div className={cx("grid2Cols14Gap")}>
          {filtered.map((a) => {
            const cat       = a.category ?? "General";
            const catColor  = categoryColor(a.category);
            const catBadge  = categoryBadge(a.category);
            const excerptTx = excerpt(a.content);

            return (
              <div key={a.id} className={cx("card", "p0", "overflowHidden")}>
                {/* Category colour bar at top */}
                <div className={cx("h3", "dynBgColor")} style={{ "--bg-color": catColor } as React.CSSProperties} />
                <div className={cx("p18")}>
                  <div className={cx("mb10")}>
                    <span className={cx("badge", catBadge, "mb8", "inlineBlock")}>
                      {cat}
                    </span>
                    <div className={cx("fw600", "text13", "lineH14")}>{a.title}</div>
                  </div>
                  <div className={cx("text12", "mb14", "lineH165", "colorFg", "opacity75")}>
                    {excerptTx}
                  </div>
                  <div className={cx("flexBetween")}>
                    <div className={cx("flexRow", "gap12")}>
                      <span className={cx("text10", "colorMuted", "fontMono")}>{a.viewCount} views</span>
                      {a.authorName && (
                        <span className={cx("text10", "colorMuted")}>by {a.authorName}</span>
                      )}
                    </div>
                    <button type="button" className={cx("btnSm", "btnAccent", "text11")}>Read →</button>
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
