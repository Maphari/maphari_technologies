// ════════════════════════════════════════════════════════════════════════════
// knowledge-base-page.tsx — Staff Knowledge Base
// Data     : loadStaffKnowledgeArticlesWithRefresh → GET /knowledge
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useMemo, useState, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadStaffKnowledgeArticlesWithRefresh,
  type StaffKnowledgeArticle,
} from "../../../../lib/api/staff";

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseArticleTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

function estimateReadTime(content: string): string {
  const words   = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

// ── ArticleRow ────────────────────────────────────────────────────────────────
function ArticleRow({
  article,
  selected,
  onSelect,
  bookmarked,
  onBookmark,
}: {
  article:    StaffKnowledgeArticle;
  selected:   boolean;
  onSelect:   () => void;
  bookmarked: boolean;
  onBookmark: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cx("kbArticleRow", "kbArticleRowShell", selected && "kbArticleRowSelected", "mb4")}
    >
      <div className={cx("flexRow", "gap8", "kbArticleRowTop")}>
        <span className={cx("text11", "noShrink", "colorMuted2")}>◎</span>

        <div className={cx("flex1", "minW0")}>
          <div className={cx("text12", "mb4", "kbArticleTitle", selected && "kbArticleTitleSelected")}>
            {article.title}
          </div>
          <div className={cx("flexRow", "gap8")}>
            <span className={cx("textXs", "colorMuted2")}>{formatUpdatedAt(article.updatedAt)}</span>
            <span className={cx("textXs", "colorMuted2")}>{estimateReadTime(article.content)}</span>
          </div>
        </div>

        <button
          type="button"
          className={cx("kbBookmarkBtn", bookmarked && "kbBookmarkBtnActive")}
          onClick={(event) => {
            event.stopPropagation();
            onBookmark();
          }}
        >
          {bookmarked ? "★" : "☆"}
        </button>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function KnowledgeBasePage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [articles,       setArticles]       = useState<StaffKnowledgeArticle[]>([]);
  const [selectedCat,    setSelectedCat]    = useState<string>("all");
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [search,         setSearch]         = useState("");
  const [bookmarked,     setBookmarked]     = useState<string[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadStaffKnowledgeArticlesWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) {
        setError(r.error?.message ?? "Failed to load data. Please try again.");
        return;
      }
      setArticles(r.data);
      if (r.data.length > 0) setSelectedId(r.data[0]?.id ?? null);
      setError(null);
    }).catch((err: unknown) => {
      const msg = (err as Error)?.message ?? "Failed to load data.";
      setError(msg);
    }).finally(() => setLoading(false));
  }, [session?.accessToken]);

  // Derive unique categories from real data
  const categories = useMemo(() => {
    return Array.from(new Set(articles.map((a) => a.category ?? "General"))).sort();
  }, [articles]);

  const categoryFiltered = useMemo(() => {
    if (selectedCat === "bookmarked") return articles.filter((a) => bookmarked.includes(a.id));
    if (selectedCat === "all")        return articles;
    return articles.filter((a) => (a.category ?? "General") === selectedCat);
  }, [articles, selectedCat, bookmarked]);

  const filtered = useMemo(() => {
    if (!search) return categoryFiltered;
    const q = search.toLowerCase();
    return categoryFiltered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.tags ?? "").toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
    );
  }, [categoryFiltered, search]);

  const selectedArticle = articles.find((a) => a.id === selectedId) ?? null;

  const toggleBookmark = (id: string) =>
    setBookmarked((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));

  // Render markdown-like content
  const renderContent = (content: string) =>
    content.split("\n").map((line, index) => {
      if (line.startsWith("## ")) {
        return (
          <div key={index} className={cx("kbDocHeading")}>
            {line.replace("## ", "")}
          </div>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <div key={index} className={cx("kbDocStrong")}>
            {line.replace(/\*\*/g, "")}
          </div>
        );
      }
      if (line.startsWith("- [ ]")) {
        return (
          <div key={index} className={cx("kbDocChecklistRow")}>
            <div className={cx("kbDocCheckbox")} />
            <span className={cx("text12", "colorMuted", "kbDocChecklistText")}>{line.replace("- [ ] ", "")}</span>
          </div>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <div key={index} className={cx("kbDocBulletRow")}>
            <span className={cx("kbDocBullet")}>●</span>
            <span className={cx("text12", "colorMuted", "kbDocBulletText")}>{line.replace("- ", "")}</span>
          </div>
        );
      }
      if (line === "") return <div key={index} className={cx("kbDocSpacer")} />;
      return (
        <p key={index} className={cx("text13", "colorMuted", "kbDocParagraph")}>
          {line}
        </p>
      );
    });

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-knowledge-base">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-knowledge-base">
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cx("page", "pageBody", isActive && "pageActive", "p0")}
      id="page-knowledge-base"
      style={isActive ? { height: "100%", display: "flex", flexDirection: "column", padding: 0 } : undefined}
    >
      <div className={cx("kbShell")}>
        {/* ── Sidebar ── */}
        <div className={cx("flexCol", "kbSidebar")}>
          <div className={cx("pageHeaderBar", "kbSidePad8")}>
            <div className={cx("pageEyebrowText", "mb6")}>Staff Dashboard / Operations</div>
            <h1 className={cx("pageTitleText", "mb20", "kbSideTitle")}>Knowledge Base</h1>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search articles..."
            className={cx("kbSearchInput")}
          />

          {/* All articles */}
          <button
            type="button"
            className={cx(
              "kbCatBtn", "flexBetween", "mb4", "kbCatBtnBase",
              selectedCat === "all" ? "kbCatBtnAllActive" : "kbCatBtnIdle"
            )}
            onClick={() => setSelectedCat("all")}
          >
            <span>All articles</span>
            <span className={cx("text10", "colorMuted2")}>{articles.length}</span>
          </button>

          <div className={cx("kbDivider")} />

          {/* Dynamic categories from real data */}
          {categories.map((cat) => {
            const count    = articles.filter((a) => (a.category ?? "General") === cat).length;
            const isActive = selectedCat === cat;
            return (
              <button
                key={cat}
                type="button"
                className={cx(
                  "kbCatBtn", "flexRow", "gap8", "kbCatBtnBase", "kbCatBtnCategory",
                  isActive ? "kbCatBtnCategoryActive" : "kbCatBtnIdle"
                )}
                onClick={() => setSelectedCat(cat)}
              >
                <span className={cx("text12")}>◎</span>
                <span className={cx("flex1", "kbCatLabel")}>{cat}</span>
                <span className={cx("text10", "colorMuted2")}>{count}</span>
              </button>
            );
          })}

          <div className={cx("kbSidebarBottom")}>
            <div className={cx("kbDivider", "kbDividerBottom")} />
            <button
              type="button"
              className={cx(
                "kbCatBtn", "wFull", "flexRow", "gap8", "kbCatBtnBase",
                selectedCat === "bookmarked" ? "kbBookBtnActive" : "kbCatBtnIdle"
              )}
              onClick={() => setSelectedCat("bookmarked")}
            >
              <span>★</span>
              <span>Bookmarked</span>
              <span className={cx("text10", "colorMuted2", "kbMlAuto")}>{bookmarked.length}</span>
            </button>
          </div>
        </div>

        {/* ── Article list pane ── */}
        <div className={cx("kbListPane")}>
          {filtered.map((article) => (
            <ArticleRow
              key={article.id}
              article={article}
              selected={selectedId === article.id}
              onSelect={() => setSelectedId(article.id)}
              bookmarked={bookmarked.includes(article.id)}
              onBookmark={() => toggleBookmark(article.id)}
            />
          ))}
          {filtered.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="book-open" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No articles found</div>
              <div className={cx("emptyStateSub")}>Try a different search term or browse all categories.</div>
            </div>
          ) : null}
        </div>

        {/* ── Article detail pane ── */}
        <div className={cx("kbDetailPane")}>
          {selectedArticle ? (
            <>
              <div className={cx("flexBetween", "mb20", "kbDetailTop")}>
                <div className={cx("flex1")}>
                  <div className={cx("flexRow", "gap8", "mb10")}>
                    <span className={cx("text10", "uppercase", "kbCategoryChip")}>
                      {selectedArticle.category ?? "General"}
                    </span>
                  </div>
                  <h2 className={cx("fontDisplay", "fw800", "colorText", "mb10", "kbDetailTitle")}>
                    {selectedArticle.title}
                  </h2>
                  <div className={cx("flexRow", "gap14")}>
                    <span className={cx("text10", "colorMuted2")}>
                      By {selectedArticle.authorName ?? "Team"}
                    </span>
                    <span className={cx("text10", "colorMuted2")}>
                      Updated {formatUpdatedAt(selectedArticle.updatedAt)}
                    </span>
                    <span className={cx("text10", "colorMuted2")}>
                      {estimateReadTime(selectedArticle.content)} read
                    </span>
                    <span className={cx("text10", "colorMuted2")}>
                      {selectedArticle.viewCount} views
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className={cx("kbBookmarkMain", bookmarked.includes(selectedArticle.id) && "kbBookmarkMainActive")}
                  onClick={() => toggleBookmark(selectedArticle.id)}
                >
                  {bookmarked.includes(selectedArticle.id) ? "★" : "☆"}
                </button>
              </div>

              {/* Tags */}
              {parseArticleTags(selectedArticle.tags).length > 0 ? (
                <div className={cx("flexRow", "gap6", "mb28", "flexWrap")}>
                  {parseArticleTags(selectedArticle.tags).map((tag) => (
                    <span key={tag} className={cx("text10", "colorMuted2", "kbTagChip")}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className={cx("kbDocWrap")}>{renderContent(selectedArticle.content)}</div>
            </>
          ) : (
            <div className={cx("textCenter", "kbDetailEmpty")}>
              {articles.length === 0 ? "No articles available." : "Select an article to read"}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
