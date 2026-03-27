"use client";

// ════════════════════════════════════════════════════════════════════════════
// knowledge-access-page.tsx — Client Portal Knowledge Base access view
// Data     : loadPortalKnowledgeArticlesWithRefresh → GET /knowledge
// Static   : CLIENT_FAQS (contextual static guidance)
// ════════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalKnowledgeArticlesWithRefresh,
  type PortalKnowledgeArticle,
} from "../../../../lib/api/portal";

// ── Static AI FAQs (contextual — no API) ──────────────────────────────────────

const CLIENT_FAQS = [
  {
    q: "What is the current health of my project?",
    a: "Your project health score is visible on the Home and Health Score pages. Check there for the latest completion percentage, active risks, and milestone status.",
  },
  {
    q: "How much of my budget has been used?",
    a: "Your live budget breakdown is on the Budget Tracker page. It shows total spend, remaining balance, and a week-by-week burn chart.",
  },
  {
    q: "When is my next milestone due?",
    a: "Open the Timeline or Milestones page to see all upcoming milestones with due dates. Overdue or at-risk milestones are highlighted in amber or red.",
  },
  {
    q: "What change requests are pending my approval?",
    a: "Navigate to Change Requests under Projects to see all pending scope changes. Items awaiting your approval are shown at the top with an amber badge.",
  },
  {
    q: "How do I raise an urgent issue?",
    a: "Go to Messages → Support Ticket, set priority to High, and submit a ticket. Your account manager will respond within 2 business hours for urgent issues.",
  },
  {
    q: "Can I download all my project files at once?",
    a: "Yes — navigate to Files, select the folders you need, and use the 'Download Selected' option at the top of the page. Final deliverables are packaged on project wrap.",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryIcon(cat: string | null): string {
  if (!cat) return "fileText";
  const c = cat.toLowerCase();
  if (c.includes("getting") || c.includes("start")) return "zap";
  if (c.includes("process") || c.includes("project")) return "layers";
  if (c.includes("billing") || c.includes("finance") || c.includes("invoice")) return "dollar";
  if (c.includes("file") || c.includes("deliverable") || c.includes("asset")) return "folder";
  if (c.includes("security") || c.includes("access")) return "lock";
  if (c.includes("technical") || c.includes("tech") || c.includes("developer")) return "code";
  return "fileText";
}

function categoryColor(cat: string | null): string {
  if (!cat) return "var(--muted2)";
  const c = cat.toLowerCase();
  if (c.includes("getting") || c.includes("start")) return "var(--lime)";
  if (c.includes("process") || c.includes("project")) return "var(--lime)";
  if (c.includes("billing") || c.includes("finance") || c.includes("invoice")) return "var(--amber)";
  if (c.includes("file") || c.includes("deliverable") || c.includes("asset")) return "var(--purple)";
  if (c.includes("security") || c.includes("access")) return "var(--red)";
  if (c.includes("technical") || c.includes("tech") || c.includes("developer")) return "var(--purple)";
  return "var(--muted2)";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function KnowledgeAccessPage() {
  const { session } = useProjectLayer();

  const [articles,  setArticles]  = useState<PortalKnowledgeArticle[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openFaq,   setOpenFaq]   = useState<number | null>(null);
  const [activeArticle, setActiveArticle] = useState<PortalKnowledgeArticle | null>(null);

  const loadArticles = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    const r = await loadPortalKnowledgeArticlesWithRefresh(session);
    if (r.nextSession) saveSession(r.nextSession);
    if (!r.error && r.data) setArticles(r.data);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadArticles();
    });
  }, [loadArticles]);

  const toggleFaq = useCallback((index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  }, []);

  // Derive unique categories from real data
  const categories = useMemo(() => {
    const cats = Array.from(new Set(articles.map((a) => a.category ?? "General")));
    return cats.sort();
  }, [articles]);

  const filtered = useMemo(() => {
    let result = articles;
    if (selectedCategory) result = result.filter((a) => (a.category ?? "General") === selectedCategory);
    if (search.trim()) result = result.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [search, selectedCategory, articles]);

  // Category summary cards (count articles per category)
  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    articles.forEach((a) => {
      const cat = a.category ?? "General";
      map[cat] = (map[cat] ?? 0) + 1;
    });
    return categories.map((c) => ({ name: c, count: map[c] ?? 0, icon: categoryIcon(c), color: categoryColor(c) }));
  }, [articles, categories]);

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
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Account · Knowledge</div>
          <h1 className={cx("pageTitle")}>Knowledge Access</h1>
          <p className={cx("pageSub")}>Browse published guidance, process notes, and client help articles from one place.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void loadArticles()}>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Quick stats bar ── */}
      {articles.length > 0 && (
        <div className={cx("grid3", "mb16")}>
            {[
              { label: "Published Articles", value: String(articles.length), icon: "file" as const },
              { label: "Categories", value: String(categories.length), icon: "layers" as const },
              { label: "Top Article", value: articles.length > 0 ? (articles.reduce((best, a) => a.viewCount > best.viewCount ? a : best, articles[0]).title.slice(0, 24) + "…") : "—", icon: "activity" as const },
            ].map((s) => (
              <div key={s.label} className={cx("statCard", "statCardBlue")}>
                <div className={cx("iconBox36", "mb10")}><Ic n={s.icon} sz={16} c="var(--cyan)" /></div>
                <div className={cx("statLabel")}>{s.label}</div>
                <div className={cx("statValue")}>{s.value}</div>
              </div>
            ))}
        </div>
      )}

      {/* ── Search ── */}
      <div className={cx("cardS1v2", "p16", "mb16")}>
        <div className={cx("relative")}>
          <span className={cx("searchIconWrap")}>
            <Ic n="search" sz={14} c="var(--muted2)" />
          </span>
          <input
            type="text"
            className={cx("input", "pl36")}
            placeholder={`Search ${articles.length > 0 ? articles.length + " articles" : "the knowledge base"}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category cards from real data ── */}
      {categorySummary.length > 0 && (
        <div className={cx("grid3", "mb16")}>
          {categorySummary.map((c) => {
            const isSelected = selectedCategory === c.name;
            return (
              <button
                key={c.name}
                type="button"
                className={cx("card", "textLeft", "p16", "pointer", "transitionFast", isSelected && "cardSelected")}
                onClick={() => setSelectedCategory(isSelected ? null : c.name)}
              >
                <div className={cx("iconBox32", "mb10")}
                  style={{
                    "--bg-color": `color-mix(in oklab, ${c.color} 12%, transparent)`,
                    "--color": `color-mix(in oklab, ${c.color} 22%, transparent)`,
                  } as React.CSSProperties}>
                  <Ic n={c.icon} sz={14} c={c.color} />
                </div>
                <div className={cx("fw700", "text12", "mb4")}>{c.name}</div>
                <div className={cx("text10", "fontMono", "dynColor")} style={{ "--color": isSelected ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>
                  {c.count} {c.count === 1 ? "article" : "articles"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Articles list ── */}
      <div className={cx("card", "mb16")}>
        <div className={cx("cardHd")}>
          <Ic n="file" sz={14} c="var(--lime)" />
          <span className={cx("cardHdTitle", "ml8")}>
            {selectedCategory ?? "All Articles"}
          </span>
          <span className={cx("fontMono", "text11", "colorMuted2", "ml6")}>({filtered.length})</span>
          {selectedCategory && (
            <button type="button" className={cx("btnSm", "btnGhost", "mlAuto")} onClick={() => setSelectedCategory(null)}>
              Clear filter
            </button>
          )}
        </div>
        <div className={cx("listGroup")}>
          {loading && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="refresh" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>Loading articles</div>
              <div className={cx("emptyStateSub")}>Fetching your knowledge base content…</div>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="file" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>{articles.length === 0 ? "No articles yet" : "No matching articles"}</div>
              <div className={cx("emptyStateSub")}>{articles.length === 0 ? "Your team will publish helpful articles and guides here." : "Try a different search term or select a different category."}</div>
            </div>
          )}
          {!loading && filtered.map((a) => (
            <button key={a.id} type="button" className={cx("listRow", "pointer", "textLeft")} onClick={() => setActiveArticle(a)}>
              <div className={cx("flex1")}>
                <div className={cx("fw600", "text12", "mb3")}>{a.title}</div>
                <div className={cx("flexRow", "gap10", "flexWrap", "flexCenter")}>
                  <span className={cx("text10", "colorMuted")}>{a.category ?? "General"}</span>
                  <span className={cx("text10", "fontMono", "colorMuted2")}>{a.viewCount} views</span>
                  <span className={cx("text10", "fontMono", "colorMuted2")}>
                    Updated {new Date(a.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
              <span className={cx("colorAccent", "text14", "noShrink")}>→</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <Ic n="message" sz={14} c="var(--amber)" />
          <span className={cx("cardHdTitle", "ml8")}>Frequently Asked Questions</span>
          <span className={cx("badge", "badgeMuted", "mlAuto")}>Client Guide</span>
        </div>
        <div className={cx("px4_0")}>
          {CLIENT_FAQS.map((faq, index) => (
            <div
              key={faq.q}
              className={cx("faqAccordionItem", openFaq === index && "faqAccordionItemOpen", "m8x12")}
            >
              <button
                type="button"
                className={cx("faqAccordionBtn")}
                aria-expanded={openFaq === index}
                onClick={() => toggleFaq(index)}
              >
                <span className={cx("fw600", "text12")}>{faq.q}</span>
                <span className={cx("faqAccordionArrow", openFaq === index && "faqAccordionArrowOpen")}>→</span>
              </button>
              {openFaq === index && (
                <div className={cx("p0x16x14", "lineH165")}>
                  <div className={cx("text12", "colorText")}>
                    {faq.a}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {activeArticle && (
        <div className={cx("modalOverlay")} onClick={() => setActiveArticle(null)}>
          <div className={cx("pmModalInner", "maxW640")} onClick={(event) => event.stopPropagation()}>
            <div className={cx("pmModalHd")}>
              <div>
                <div className={cx("pmTitle")}>{activeArticle.title}</div>
                <div className={cx("text11", "colorMuted", "mt2")}>
                  {(activeArticle.category ?? "General") + " · " + new Date(activeArticle.updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <button type="button" className={cx("iconBtn40x34")} onClick={() => setActiveArticle(null)} aria-label="Close">
                <Ic n="x" sz={14} c="var(--muted2)" />
              </button>
            </div>
            <div className={cx("p16", "flexCol", "gap12")}>
              <div className={cx("text11", "colorMuted2")}>
                {activeArticle.authorName?.trim() ? "Published by " + activeArticle.authorName : "Published in your client knowledge base"}
              </div>
              <div className={cx("cardS1v2", "p16", "text12", "lineH165")} style={{ whiteSpace: "pre-wrap" }}>
                {activeArticle.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
