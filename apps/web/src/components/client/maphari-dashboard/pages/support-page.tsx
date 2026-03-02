"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";

type ProgressKnowledgeTab = "Progress Feed" | "Knowledge Base";
type FeedFilter = "All" | "Design" | "Development" | "QA" | "Brand";
type ReactionType = "love" | "fire" | "eyes";

type FeedPost = {
  av: string;
  avColor: string;
  name: string;
  time: string;
  isNew: boolean;
  bg: string;
  emoji: string;
  caption: string;
  tags: string[];
  reactions: Record<ReactionType, number>;
};

type KnowledgeCategory = {
  icon: string;
  name: string;
  desc: string;
  count: number;
};

type KnowledgeArticle = {
  icon: string;
  title: string;
  meta: string;
  tag: "c-a" | "c-am" | "c-g" | "c-m" | "c-p";
};

const TABS: ProgressKnowledgeTab[] = ["Progress Feed", "Knowledge Base"];
const FEED_FILTERS: FeedFilter[] = ["All", "Design", "Development", "QA", "Brand"];

const FEED_POSTS: FeedPost[] = [
  {
    av: "SN",
    avColor: "#c8f135",
    name: "Sipho Ndlovu",
    time: "Today · 11:34",
    isNew: true,
    bg: "linear-gradient(135deg,rgba(200,241,53,.1),rgba(61,217,214,.08))",
    emoji: "🖥",
    caption:
      "Dashboard UI is taking shape. Just finished the main analytics widget and it is reading clean. Adding micro-animations to the charts tomorrow.",
    tags: ["UI/UX Design", "Dashboard"],
    reactions: { love: 3, fire: 5, eyes: 1 },
  },
  {
    av: "LM",
    avColor: "#8b6fff",
    name: "Lerato Mokoena",
    time: "Yesterday · 16:20",
    isNew: true,
    bg: "linear-gradient(135deg,rgba(139,111,255,.12),rgba(61,217,214,.06))",
    emoji: "🎨",
    caption:
      "Final brand guidelines document is complete. 82 pages covering logo usage, typography, and tone of voice standards.",
    tags: ["Brand Identity", "Design System"],
    reactions: { love: 7, fire: 4, eyes: 2 },
  },
  {
    av: "TK",
    avColor: "#f5a623",
    name: "Thabo Khumalo",
    time: "Feb 19 · 09:15",
    isNew: false,
    bg: "linear-gradient(135deg,rgba(245,166,35,.1),rgba(77,222,143,.06))",
    emoji: "📱",
    caption:
      "Started QA preparation. Automated test suites are being set up for authentication flows and will run when login screens land.",
    tags: ["QA", "Testing"],
    reactions: { love: 2, fire: 1, eyes: 3 },
  },
];

const KB_CATEGORIES: KnowledgeCategory[] = [
  {
    icon: "🚀",
    name: "Getting Started",
    desc: "Portal walkthrough, account setup, and key first actions.",
    count: 8,
  },
  {
    icon: "📋",
    name: "Project Process",
    desc: "Review cycles, scope changes, and communication norms.",
    count: 12,
  },
  {
    icon: "💰",
    name: "Billing & Invoices",
    desc: "Payment terms, invoice schedules, and budget management.",
    count: 6,
  },
  {
    icon: "📁",
    name: "Files & Deliverables",
    desc: "How to access, download, and review project files.",
    count: 9,
  },
  {
    icon: "🔒",
    name: "Security & Access",
    desc: "2FA, team permissions, and confidentiality controls.",
    count: 5,
  },
  {
    icon: "🛠",
    name: "Technical",
    desc: "Integrations, performance, and developer handoff details.",
    count: 7,
  },
];

const KB_ARTICLES: KnowledgeArticle[] = [
  { icon: "❓", title: "How do I give feedback on a design?", meta: "Last updated Feb 14 · 2 min read", tag: "c-a" },
  { icon: "💬", title: "What is the difference between a scope change and a revision?", meta: "Last updated Feb 10 · 3 min read", tag: "c-p" },
  { icon: "💰", title: "When will I receive my next invoice?", meta: "Last updated Feb 18 · 1 min read", tag: "c-g" },
  { icon: "📄", title: "How do I access source files after project completion?", meta: "Last updated Jan 20 · 2 min read", tag: "c-m" },
  { icon: "🔑", title: "How do I add a team member to my portal?", meta: "Last updated Jan 15 · 1 min read", tag: "c-m" },
  { icon: "📞", title: "How do I schedule a call with my project lead?", meta: "Last updated Jan 12 · 1 min read", tag: "c-m" },
  { icon: "⏱", title: "What happens if the project runs over timeline?", meta: "Last updated Feb 5 · 4 min read", tag: "c-am" },
  { icon: "🔒", title: "Is my project data secure and confidential?", meta: "Last updated Jan 8 · 2 min read", tag: "c-g" },
];

function articleTagLabel(tag: KnowledgeArticle["tag"]): string {
  if (tag === "c-a") return "Popular";
  if (tag === "c-am") return "Important";
  if (tag === "c-g") return "Billing";
  return "General";
}

function matchesFeedFilter(post: FeedPost, filter: FeedFilter): boolean {
  if (filter === "All") return true;
  if (filter === "Design") return post.tags.some((tag) => tag.toLowerCase().includes("design"));
  if (filter === "Development") return post.tags.some((tag) => tag.toLowerCase().includes("dashboard") || tag.toLowerCase().includes("dev"));
  if (filter === "QA") return post.tags.some((tag) => tag.toLowerCase().includes("qa") || tag.toLowerCase().includes("testing"));
  return post.tags.some((tag) => tag.toLowerCase().includes("brand"));
}

export function SupportPage() {
  const [tab, setTab] = useState<ProgressKnowledgeTab>("Progress Feed");
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("All");
  const [reactions, setReactions] = useState<Array<Record<ReactionType, number>>>(() =>
    FEED_POSTS.map((post) => ({ ...post.reactions })),
  );
  const [reacted, setReacted] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredPosts = useMemo(
    () => FEED_POSTS.filter((post) => matchesFeedFilter(post, feedFilter)),
    [feedFilter],
  );
  const filteredArticles = useMemo(
    () =>
      KB_ARTICLES.filter((article) =>
        article.title.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [search],
  );
  const newCount = FEED_POSTS.filter((post) => post.isNew).length;

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  function toggleReaction(postIndex: number, reactionType: ReactionType): void {
    const reactionKey = `${postIndex}-${reactionType}`;
    const wasReacted = Boolean(reacted[reactionKey]);
    setReacted((prev) => ({ ...prev, [reactionKey]: !wasReacted }));
    setReactions((prev) =>
      prev.map((item, idx) =>
        idx === postIndex
          ? {
              ...item,
              [reactionType]: wasReacted ? item[reactionType] - 1 : item[reactionType] + 1,
            }
          : item,
      ),
    );
  }

  return (
    <div className={cx("pageBody", styles.progKnowRoot)}>
      <div className={styles.progKnowLayout}>
        <aside className={styles.progKnowSidebar}>
          <div className={styles.progKnowSection}>Sections</div>
          {[
            { label: "Progress Feed", tone: styles.progKnowToneAccent, badge: newCount },
            { label: "Knowledge Base", tone: styles.progKnowToneBlue },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={cx(styles.progKnowSideItem, tab === item.label && styles.progKnowSideItemActive)}
              onClick={() => setTab(item.label as ProgressKnowledgeTab)}
            >
              <span className={cx(styles.progKnowDot, item.tone)} />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? <span className={styles.progKnowBadge}>{item.badge}</span> : null}
            </button>
          ))}

          <div className={styles.progKnowDivider} />
          <div className={styles.progKnowSection}>Feed Filter</div>
          {FEED_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={cx(styles.progKnowFilterItem, feedFilter === item && styles.progKnowFilterItemActive)}
              onClick={() => setFeedFilter(item)}
            >
              <span className={styles.progKnowDotMuted} />
              <span>{item}</span>
            </button>
          ))}

          <div className={styles.progKnowDivider} />
          <div className={styles.progKnowHintCard}>
            <div className={styles.progKnowHintText}>
              The team posts work-in-progress updates here so you always stay connected to what is being built.
            </div>
          </div>
        </aside>

        <section className={styles.progKnowMain}>
          <div className={cx("pageHeader", "mb0")}>
            <div>
              <div className={cx("pageEyebrow")}>Veldt Finance · Updates</div>
              <h1 className={cx("pageTitle")}>Progress &amp; Knowledge</h1>
              <p className={cx("pageSub")}>
                Behind-the-scenes updates from the team, and answers to common project questions.
              </p>
            </div>
            <div className={cx("pageActions")}>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => notify("Subscribed", "You will receive notifications for new feed posts")}
              >
                Subscribe to Feed
              </button>
            </div>
          </div>

          <div className={styles.progKnowTabs}>
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                className={cx(styles.progKnowTab, tab === item && styles.progKnowTabActive)}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === "Progress Feed" ? (
            <div className={styles.progKnowContent}>
              <div>
                <div className={styles.progKnowSectionTitle}>Work in Progress</div>
                {filteredPosts.map((post, postIdx) => (
                  <div key={`${post.name}-${post.time}`} className={styles.progKnowFeedItem}>
                    <div className={styles.progKnowFeedHead}>
                      <div className={styles.progKnowFeedAvatar} style={{ background: post.avColor, color: "#050508" }}>
                        {post.av}
                      </div>
                      <div className={styles.progKnowGrow}>
                        <div className={styles.progKnowFeedName}>{post.name}</div>
                        <div className={styles.progKnowFeedTime}>{post.time}</div>
                      </div>
                      {post.isNew ? <span className={styles.progKnowFeedNew}>NEW</span> : null}
                    </div>

                    <div className={styles.progKnowFeedMedia} style={{ background: post.bg }}>
                      <span className={styles.progKnowFeedEmoji}>{post.emoji}</span>
                      <div className={styles.progKnowFeedMediaTag}>Work in Progress</div>
                    </div>

                    <div className={styles.progKnowFeedCaption}>
                      <div className={styles.progKnowFeedText}>{post.caption}</div>
                      <div className={styles.progKnowTagRow}>
                        {post.tags.map((tag) => (
                          <span key={tag} className={cx("badge", "badgeMuted")}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={styles.progKnowReactionRow}>
                      {(
                        [
                          { key: "love", emoji: "❤️" },
                          { key: "fire", emoji: "🔥" },
                          { key: "eyes", emoji: "👀" },
                        ] as const
                      ).map((reaction) => (
                        <button
                          key={`${post.name}-${reaction.key}`}
                          type="button"
                          className={cx(
                            styles.progKnowReactionBtn,
                            reacted[`${postIdx}-${reaction.key}`] && styles.progKnowReactionBtnActive,
                          )}
                          onClick={() => toggleReaction(postIdx, reaction.key)}
                        >
                          <span>{reaction.emoji}</span>
                          <span className={styles.progKnowReactionCount}>{reactions[postIdx][reaction.key]}</span>
                        </button>
                      ))}

                      <button
                        type="button"
                        className={cx(styles.progKnowReactionBtn, styles.progKnowCommentBtn)}
                        onClick={() => notify("Comment sent", "Your comment has been posted")}
                      >
                        <span>💬</span>
                        <span className={styles.progKnowCommentLabel}>Comment</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "Knowledge Base" ? (
            <div className={styles.progKnowContent}>
              <div>
                <div className={styles.progKnowSearchWrap}>
                  <span className={styles.progKnowSearchIcon}>🔍</span>
                  <input
                    className={styles.progKnowSearch}
                    placeholder="Search the knowledge base..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                {!search ? (
                  <>
                    <div className={styles.progKnowSectionTitle}>Browse by Category</div>
                    <div className={styles.progKnowGrid3}>
                      {KB_CATEGORIES.map((category) => (
                        <button
                          key={category.name}
                          type="button"
                          className={styles.progKnowCategoryCard}
                          onClick={() => notify("Category opened", category.name)}
                        >
                          <div className={styles.progKnowCategoryIcon}>{category.icon}</div>
                          <div className={styles.progKnowCategoryName}>{category.name}</div>
                          <div className={styles.progKnowCategoryDesc}>{category.desc}</div>
                          <div className={styles.progKnowCategoryCount}>{category.count} articles →</div>
                        </button>
                      ))}
                    </div>

                    <div className={styles.progKnowSectionTitle}>Popular Tags</div>
                    <div className={styles.progKnowPopularTags}>
                      {[
                        "Feedback",
                        "Invoices",
                        "Scope changes",
                        "Timeline",
                        "Files",
                        "Design",
                        "Approval",
                        "Revisions",
                        "Budget",
                        "Communication",
                      ].map((tag) => (
                        <button key={tag} type="button" className={styles.progKnowTagBtn} onClick={() => setSearch(tag)}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                <div className={styles.progKnowSectionTitle}>
                  {search ? `Results for "${search}"` : "All Articles"}
                </div>
                <div className={cx("card", styles.progKnowArticleCard)}>
                  {(search ? filteredArticles : KB_ARTICLES).map((article) => (
                    <button
                      key={article.title}
                      type="button"
                      className={styles.progKnowArticleRow}
                      onClick={() => notify("Article opened", article.title)}
                    >
                      <span className={styles.progKnowArticleIcon}>{article.icon}</span>
                      <span className={styles.progKnowGrow}>
                        <span className={styles.progKnowArticleTitle}>{article.title}</span>
                        <span className={styles.progKnowArticleMeta}>{article.meta}</span>
                      </span>
                      <span className={cx("badge", article.tag, styles.progKnowArticleTag)}>
                        {articleTagLabel(article.tag)}
                      </span>
                    </button>
                  ))}

                  {search && filteredArticles.length === 0 ? (
                    <div className={styles.progKnowEmptyState}>
                      No articles found for "{search}".
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost", styles.progKnowAskBtn)}
                        onClick={() => notify("Question submitted", "We will add an article within 48 hours")}
                      >
                        Ask a question
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {toast ? (
        <div className={cx("toastStack")}>
          <div className={cx("toast", "toastSuccess")}>
            <strong>{toast.title}</strong>
            <div>{toast.subtitle}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
