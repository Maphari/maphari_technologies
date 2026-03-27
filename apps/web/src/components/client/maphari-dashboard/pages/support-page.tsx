// ════════════════════════════════════════════════════════════════════════════
// support-page.tsx — Progress Feed, Knowledge Base & Support Tickets
// Data     : loadPortalAnnouncementsWithRefresh    → GET /announcements
//            loadPortalSupportTicketsWithRefresh    → GET /support-tickets
//            loadPortalKnowledgeArticlesWithRefresh → GET /knowledge
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { usePageToast } from "../hooks/use-page-toast";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalSupportTicketsWithRefresh,
  loadPortalKnowledgeArticlesWithRefresh,
  loadPortalAnnouncementsWithRefresh,
  loadPortalNotificationPrefsWithRefresh,
  updatePortalNotificationPrefsWithRefresh,
  createPortalSupportTicketWithRefresh,
  type PortalSupportTicket,
  type PortalKnowledgeArticle,
  type PortalAnnouncement,
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────

type ProgressKnowledgeTab = "Progress Feed" | "Knowledge Base" | "Support Tickets";
type FeedFilter = "All" | "UPDATE" | "RELEASE" | "MILESTONE" | "ALERT" | "MAINTENANCE";

type FeedPost = {
  id:        string;
  av:        string;
  avColor:   string;
  name:      string;
  time:      string;
  isNew:     boolean;
  bg:        string;
  icon:      string;
  caption:   string;
  type:      string;
};

const TABS: ProgressKnowledgeTab[] = ["Progress Feed", "Knowledge Base", "Support Tickets"];

const FEED_FILTERS: { id: FeedFilter; label: string }[] = [
  { id: "All",         label: "All Updates"  },
  { id: "UPDATE",      label: "Updates"      },
  { id: "RELEASE",     label: "Releases"     },
  { id: "MILESTONE",   label: "Milestones"   },
  { id: "ALERT",       label: "Alerts"       },
  { id: "MAINTENANCE", label: "Maintenance"  },
];

// ── Announcement → FeedPost mapping ──────────────────────────────────────────

const ANN_GRADIENTS: Record<string, string> = {
  UPDATE:      "linear-gradient(135deg,var(--lime-d),var(--cyan-d))",
  RELEASE:     "linear-gradient(135deg,var(--purple-d),var(--cyan-d))",
  MILESTONE:   "linear-gradient(135deg,var(--amber-d),var(--green-d))",
  ALERT:       "linear-gradient(135deg,var(--red-d),var(--amber-d))",
  MAINTENANCE: "linear-gradient(135deg,var(--cyan-d),var(--lime-d))",
};

const ANN_ICONS: Record<string, string> = {
  UPDATE: "activity",
  RELEASE: "spark",
  MILESTONE: "flag",
  ALERT: "alert",
  MAINTENANCE: "settings",
};

const ANN_COLORS = ["var(--accent)", "var(--purple)", "var(--amber)", "var(--green)"];

function mapAnnouncementToFeedPost(a: PortalAnnouncement, idx: number): FeedPost {
  const pub    = a.publishedAt ?? a.createdAt;
  const pubDate = new Date(pub);
  const diffMs  = Date.now() - pubDate.getTime();
  const isNew   = diffMs < 3 * 24 * 60 * 60 * 1000;

  let timeStr: string;
  if (diffMs < 24 * 60 * 60 * 1000) {
    timeStr = "Today · " + pubDate.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  } else if (diffMs < 48 * 60 * 60 * 1000) {
    timeStr = "Yesterday · " + pubDate.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  } else {
    timeStr = pubDate.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
      + " · " + pubDate.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  }

  return {
    id:       a.id,
    av:       "MT",
    avColor:  ANN_COLORS[idx % ANN_COLORS.length] ?? "var(--accent)",
    name:     "Maphari Team",
    time:     timeStr,
    isNew,
    bg:       ANN_GRADIENTS[a.type ?? "UPDATE"] ?? ANN_GRADIENTS.UPDATE,
    icon:     ANN_ICONS[a.type ?? "UPDATE"] ?? "message",
    caption:  a.title,
    type:     a.type ?? "UPDATE",
  };
}

// ── Category helpers for Knowledge Base tab ───────────────────────────────────

function categoryIcon(cat: string | null): string {
  if (!cat) return "fileText";
  const c = cat.toLowerCase();
  if (c.includes("getting") || c.includes("start")) return "zap";
  if (c.includes("process") || c.includes("project")) return "layers";
  if (c.includes("billing") || c.includes("finance")) return "dollar";
  if (c.includes("file") || c.includes("deliverable")) return "folder";
  if (c.includes("security") || c.includes("access")) return "lock";
  if (c.includes("technical") || c.includes("tech")) return "code";
  return "fileText";
}

function categoryColor(cat: string | null): string {
  if (!cat) return "var(--muted2)";
  const c = cat.toLowerCase();
  if (c.includes("getting") || c.includes("start")) return "var(--lime)";
  if (c.includes("process") || c.includes("project")) return "var(--lime)";
  if (c.includes("billing") || c.includes("finance")) return "var(--amber)";
  if (c.includes("file") || c.includes("deliverable")) return "var(--purple)";
  if (c.includes("security") || c.includes("access")) return "var(--red)";
  if (c.includes("technical") || c.includes("tech")) return "var(--purple)";
  return "var(--muted2)";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SupportPage() {
  const { session } = useProjectLayer();
  const notify      = usePageToast();

  const [tab,        setTab]        = useState<ProgressKnowledgeTab>("Progress Feed");
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("All");

  // ── Feed state (announcements only — no hardcoded fallback) ──────────────
  const [feedPosts,   setFeedPosts]   = useState<FeedPost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  // ── Knowledge Base state ─────────────────────────────────────────────────
  const [articles,    setArticles]    = useState<PortalKnowledgeArticle[]>([]);
  const [loadingKB,   setLoadingKB]   = useState(false);
  const [kbSearch,    setKbSearch]    = useState("");
  const [kbCategory,  setKbCategory]  = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<PortalKnowledgeArticle | null>(null);

  // ── Support Tickets state ────────────────────────────────────────────────
  const [tickets,        setTickets]        = useState<PortalSupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // ── Subscribe to Feed state ───────────────────────────────────────────────
  const [subscribed,     setSubscribed]     = useState(false);
  const [subscribeBusy,  setSubscribeBusy]  = useState(false);

  // ── Comment modal state ───────────────────────────────────────────────────
  const [commentTarget, setCommentTarget] = useState<{ postId: string; postTitle: string } | null>(null);
  const [commentText,   setCommentText]   = useState("");
  const [commentBusy,   setCommentBusy]   = useState(false);

  const loadFeed = useCallback(async () => {
    if (!session) return;
    setLoadingFeed(true);
    const result = await loadPortalAnnouncementsWithRefresh(session);
    if (result.nextSession) saveSession(result.nextSession);
    const published = (result.data ?? []).filter((a) => a.status === "PUBLISHED");
    const mapped = published.map(mapAnnouncementToFeedPost);
    setFeedPosts(mapped);
    setLoadingFeed(false);
  }, [session]);

  const loadKnowledge = useCallback(async () => {
    if (!session) return;
    setLoadingKB(true);
    const r = await loadPortalKnowledgeArticlesWithRefresh(session);
    if (r.nextSession) saveSession(r.nextSession);
    if (!r.error && r.data) setArticles(r.data);
    setLoadingKB(false);
  }, [session]);

  const loadTickets = useCallback(async () => {
    if (!session) return;
    setLoadingTickets(true);
    const result = await loadPortalSupportTicketsWithRefresh(session);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.data) setTickets(result.data);
    setLoadingTickets(false);
  }, [session]);

  // ── Load announcements for Progress Feed ──────────────────────────────────
  useEffect(() => {
    if (!session) return;
    queueMicrotask(() => {
      void loadFeed();
    });
    loadPortalNotificationPrefsWithRefresh(session).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (!result.error && result.data) setSubscribed(Boolean(result.data.projectUpdates));
    });
  }, [session, loadFeed]);

  // ── Load knowledge articles ───────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "Knowledge Base" || !session) return;
    queueMicrotask(() => {
      void loadKnowledge();
    });
  }, [tab, session, loadKnowledge]);

  // ── Load support tickets ──────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "Support Tickets" || !session) return;
    queueMicrotask(() => {
      void loadTickets();
    });
  }, [tab, session, loadTickets]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredPosts = useMemo(
    () => feedFilter === "All" ? feedPosts : feedPosts.filter((p) => p.type === feedFilter),
    [feedPosts, feedFilter],
  );

  const kbCategories = useMemo(() => {
    const cats = Array.from(new Set(articles.map((a) => a.category ?? "General")));
    return cats.sort();
  }, [articles]);

  const filteredArticles = useMemo(() => {
    let result = kbCategory ? articles.filter((a) => (a.category ?? "General") === kbCategory) : articles;
    if (kbSearch.trim()) {
      const q = kbSearch.toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q));
    }
    return result;
  }, [articles, kbCategory, kbSearch]);

  const newCount = feedPosts.filter((p) => p.isNew).length;

  const handleSubscribeToggle = useCallback(async () => {
    if (!session) return;
    setSubscribeBusy(true);
    const result = await updatePortalNotificationPrefsWithRefresh(session, { projectUpdates: !subscribed });
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.error) {
      setSubscribed(!subscribed);
      notify("success", subscribed ? "Unsubscribed" : "Subscribed", subscribed ? "You will no longer receive feed notifications" : "You will receive notifications for new feed posts");
    } else {
      notify("error", "Failed", "Could not update subscription. Please try again.");
    }
    setSubscribeBusy(false);
  }, [session, subscribed, notify]);

  const handleCommentSubmit = useCallback(async () => {
    if (!session || !session.user.clientId || !commentTarget || !commentText.trim()) return;
    setCommentBusy(true);
    const result = await createPortalSupportTicketWithRefresh(session, {
      clientId: session.user.clientId,
      title: `Comment on: ${commentTarget.postTitle}`,
      description: commentText.trim(),
      category: "FEEDBACK",
      priority: "LOW",
    });
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.error) {
      notify("success", "Comment sent", "Your comment has been shared with the team.");
      setCommentTarget(null);
      setCommentText("");
    } else {
      notify("error", "Failed to send", "Please try again.");
    }
    setCommentBusy(false);
  }, [session, commentTarget, commentText, notify]);

  const handleRefresh = useCallback(async () => {
    if (tab === "Progress Feed") {
      await loadFeed();
      return;
    }
    if (tab === "Knowledge Base") {
      await loadKnowledge();
      return;
    }
    await loadTickets();
  }, [tab, loadFeed, loadKnowledge, loadTickets]);

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Account · Progress</div>
          <h1 className={cx("pageTitle")}>Progress &amp; Knowledge</h1>
          <p className={cx("pageSub")}>Behind-the-scenes updates from the team, and answers to common project questions.</p>
        </div>
        <div className={cx("pageActions")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={() => void handleRefresh()}
          >
            Refresh
          </button>
          <button
            type="button"
            className={cx("btnSm", subscribed ? "btnAccent" : "btnGhost")}
            onClick={() => void handleSubscribeToggle()}
            disabled={subscribeBusy}
          >
            {subscribeBusy ? "Saving…" : subscribed ? "✓ Subscribed" : "Subscribe to Feed"}
          </button>
        </div>
      </div>

      {/* ── Tab navigation ────────────────────────────────────────────────── */}
      <div className={cx("pillTabs", "mb16")}>
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            className={cx("pillTab", tab === item && "pillTabActive")}
            onClick={() => setTab(item)}
          >
            {item}
            {item === "Progress Feed" && newCount > 0 && (
              <span className={cx("badge", "badgeAccent", "ml6")}>{newCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PROGRESS FEED TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "Progress Feed" && (
        <>
          {/* ── Type filter pills ── */}
          <div className={cx("cardS1v2", "p12", "mb16", "supportFilterShell")}>
            <div className={cx("supportFilterHead")}>
              <div className={cx("supportFilterHeadIcon")}>
                <Ic n="filter" sz={13} c="var(--lime)" />
              </div>
              <div className={cx("supportFilterHeadText")}>
                <div className={cx("supportFilterHeadLabel")}>Feed Filters</div>
                <div className={cx("supportFilterHeadSub")}>Narrow the update stream by announcement type.</div>
              </div>
            </div>
            <div className={cx("filterRowWrap")}>
              {FEED_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={cx("btnSm", feedFilter === f.id ? "btnAccent" : "btnGhost")}
                  onClick={() => setFeedFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Loading skeletons ── */}
          {loadingFeed && (
            <div className={cx("flexRow", "gap12", "mb16")}>
              {[1, 2].map((i) => (
                <div key={i} className={cx("card", "flex1", "h220")}>
                  <div className={cx("skeletonLine", "skeleBlock12x40p", "mb10")} />
                  <div className={cx("skeletonLine", "skeleBlock80x100p", "mb6")} />
                  <div className={cx("skeletonLine", "skeleBlock10x60p")} />
                </div>
              ))}
            </div>
          )}

          {/* ── Empty state — no announcements published yet ── */}
          {!loadingFeed && feedPosts.length === 0 && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="activity" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No updates yet</div>
              <div className={cx("emptyStateSub")}>Your team will share project progress updates, releases, and milestones here.</div>
            </div>
          )}

          {/* ── Empty state — filter has no results ── */}
          {!loadingFeed && feedPosts.length > 0 && filteredPosts.length === 0 && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="filter" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No {feedFilter.toLowerCase()} posts yet</div>
              <div className={cx("emptyStateSub")}>Try switching to &quot;All Updates&quot; to see everything.</div>
            </div>
          )}

          {/* ── Feed posts grid ── */}
          {!loadingFeed && filteredPosts.length > 0 && (
            <div className={cx("grid2")}>
              {filteredPosts.map((post) => (
                <div key={post.id} className={cx("card", "p0", "overflowHidden")}>

                  {/* Post header */}
                  <div className={cx("tabStripRow")}>
                    <div className={cx("avatar36", "dynBgColor", "flexCenter", "fs13", "fw700", "colorBg")} style={{ "--bg-color": post.avColor } as React.CSSProperties}>
                      {post.av}
                    </div>
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("fw700", "text12", "lineH12")}>{post.name}</div>
                      <div className={cx("text10", "fontMono", "colorMuted2", "mt1")}>{post.time}</div>
                    </div>
                    {post.isNew && (
                      <span className={cx("newBadgePill")}>NEW</span>
                    )}
                  </div>

                  {/* Gradient media card */}
                  <div className={cx("mediaGradientCard", "dynBgColor")} style={{ "--bg-color": post.bg } as React.CSSProperties}>
                    <div className={cx("iconBox40")} style={{ "--bg-color": "rgba(255,255,255,0.14)", "--color": "rgba(255,255,255,0.2)" } as React.CSSProperties}>
                      <Ic n={post.icon} sz={22} c="#ffffff" />
                    </div>
                    <div className={cx("absB8R10Label")}>
                      {post.type}
                    </div>
                  </div>

                  {/* Caption */}
                  <div className={cx("p0161612")}>
                    <div className={cx("text12", "lineH165", "colorText")}>
                      {post.caption}
                    </div>
                  </div>

                  <div className={cx("flexRow", "gap6", "p10x16", "borderT")}>
                    <div className={cx("text10", "fontMono", "colorMuted2", "flexRow", "flexCenter", "gap6")}>
                      <Ic n={post.icon} sz={12} c="var(--muted2)" />
                      Posted by the delivery team
                    </div>
                    <button
                      type="button"
                      onClick={() => setCommentTarget({ postId: post.id, postTitle: post.caption ?? post.type ?? "Announcement" })}
                      className={cx("flexRow", "gap4", "p4x10", "r20", "bgS3", "borderB1", "pointer", "mlAuto")}
                    >
                      <Ic n="message" sz={12} c="var(--muted2)" />
                      <span className={cx("text10", "colorMuted2")}>Comment</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          KNOWLEDGE BASE TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "Knowledge Base" && (
        <>
          {/* ── Search bar ── */}
          <div className={cx("card", "p16", "mb16")}>
            <div className={cx("relative")}>
              <span className={cx("searchIconWrap")}>
                <Ic n="search" sz={14} c="var(--muted2)" />
              </span>
              <input
                type="text"
                className={cx("input", "pl36")}
                placeholder={loadingKB ? "Loading articles…" : `Search ${articles.length > 0 ? `${articles.length} articles` : "the knowledge base"}…`}
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
              />
            </div>
          </div>

          {/* ── Category filter pills (from real data) ── */}
          {kbCategories.length > 0 && !kbSearch && (
            <>
              <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb12")}>Browse by Category</div>
              <div className={cx("grid3", "mb16")}>
                {kbCategories.map((cat) => {
                  const color    = categoryColor(cat);
                  const icon     = categoryIcon(cat);
                  const count    = articles.filter((a) => (a.category ?? "General") === cat).length;
                  const selected = kbCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={cx("card", "p16", "textLeft", "pointer", "transitionFast", selected && "cardSelected")}
                      onClick={() => setKbCategory(selected ? null : cat)}
                    >
                      <div className={cx("iconBox36", "mb10")}
                        style={{
                          "--bg-color": `color-mix(in oklab, ${color} 12%, transparent)`,
                          "--color": `color-mix(in oklab, ${color} 25%, transparent)`,
                        } as React.CSSProperties}>
                        <Ic n={icon} sz={16} c={color} />
                      </div>
                      <div className={cx("fw700", "text12", "mb3")}>{cat}</div>
                      <div className={cx("text10", "fontMono", "dynColor")} style={{ "--color": selected ? color : "var(--muted2)" } as React.CSSProperties}>
                        {count} {count === 1 ? "article" : "articles"} →
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Articles list ── */}
          <div className={cx("card")}>
            <div className={cx("cardHd")}>
              <Ic n="file" sz={14} c="var(--lime)" />
              <span className={cx("cardHdTitle", "ml8")}>
                {kbCategory ?? (kbSearch ? `Results for "${kbSearch}"` : "All Articles")}
              </span>
              <span className={cx("fontMono", "text11", "colorMuted2", "ml6")}>({filteredArticles.length})</span>
              {(kbCategory ?? kbSearch) && (
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost", "mlAuto")}
                  onClick={() => { setKbCategory(null); setKbSearch(""); }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className={cx("listGroup")}>
              {loadingKB && (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="refresh" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>Loading articles</div>
                  <div className={cx("emptyStateSub")}>Fetching your knowledge base content…</div>
                </div>
              )}
              {!loadingKB && filteredArticles.length === 0 && (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="file" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>
                    {articles.length === 0 ? "No articles yet" : "No matching articles"}
                  </div>
                  <div className={cx("emptyStateSub")}>
                    {articles.length === 0
                      ? "Your team will publish helpful articles and guides here."
                      : "Try a different search term or category."}
                  </div>
                </div>
              )}
              {!loadingKB && filteredArticles.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  className={cx("listRow")}
                  onClick={() => setActiveArticle(article)}
                >
                  <div className={cx("iconBox34")}
                    style={{
                      "--bg-color": `color-mix(in oklab, ${categoryColor(article.category)} 12%, var(--s3))`,
                      "--color": `color-mix(in oklab, ${categoryColor(article.category)} 25%, transparent)`,
                    } as React.CSSProperties}>
                    <Ic n={categoryIcon(article.category)} sz={15} c={categoryColor(article.category)} />
                  </div>
                  <div className={cx("flex1")}>
                    <div className={cx("fw600", "text12", "mb2")}>{article.title}</div>
                    <div className={cx("flexRow", "flexCenter", "gap8")}>
                      <span className={cx("text10", "colorMuted")}>{article.category ?? "General"}</span>
                      <span className={cx("text10", "fontMono", "colorMuted2")}>{article.viewCount} views</span>
                      <span className={cx("text10", "fontMono", "colorMuted2")}>
                        {new Date(article.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <span className={cx("colorAccent", "text14", "noShrink")}>→</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUPPORT TICKETS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "Support Tickets" && (
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <Ic n="alert" sz={14} c="var(--amber)" />
            <span className={cx("cardHdTitle", "ml8")}>My Support Tickets</span>
            <span className={cx("badge", "badgeMuted", "mlAuto")}>
              {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
            </span>
          </div>
          {loadingTickets ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="refresh" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>Loading tickets</div>
              <div className={cx("emptyStateSub")}>Fetching your support history…</div>
            </div>
          ) : tickets.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="info" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No support tickets yet</div>
              <div className={cx("emptyStateSub")}>Submit a request via the SLA &amp; Escalation page. We respond within 2 business hours for urgent issues.</div>
            </div>
          ) : (
            <div className={cx("listGroup")}>
              {tickets.map((ticket) => (
                <div key={ticket.id} className={cx("listRow")}>
                  <div className={cx("dot8", "noShrink", "mt2", "dynBgColor")} style={{ "--bg-color": ticket.status === "OPEN" ? "var(--amber)" :
                      ticket.status === "IN_PROGRESS" ? "var(--lime)" :
                      ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "var(--green)" : "var(--muted2)" } as React.CSSProperties} />
                  <div className={cx("flex1")}>
                    <div className={cx("fw600", "text12", "mb2")}>{ticket.title}</div>
                    <div className={cx("text10", "fontMono", "colorMuted2")}>
                      {ticket.category ? `${ticket.category} · ` : ""}
                      {new Date(ticket.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <span className={cx("badge",
                    ticket.priority === "HIGH" || ticket.priority === "URGENT" ? "badgeRed" :
                    ticket.priority === "MEDIUM" ? "badgeAmber" : "badgeMuted"
                  )}>{ticket.priority}</span>
                  <span className={cx("badge",
                    ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "badgeGreen" :
                    ticket.status === "IN_PROGRESS" ? "badgeAccent" :
                    ticket.status === "OPEN" ? "badgeAmber" : "badgeMuted"
                  )}>{ticket.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Comment modal ─────────────────────────────────────────────────── */}
      {commentTarget && (
        <div className={cx("modalOverlay")} onClick={() => setCommentTarget(null)}>
          <div className={cx("pmModalInner", "maxW480")} onClick={(e) => e.stopPropagation()}>
            <div className={cx("pmModalHd")}>
              <div className={cx("pmTitle")}>Add Comment</div>
              <button type="button" className={cx("iconBtn40x34")} onClick={() => setCommentTarget(null)} aria-label="Close">
                <Ic n="x" sz={14} c="var(--muted2)" />
              </button>
            </div>
            <div className={cx("p16", "flexCol", "gap12")}>
              <div className={cx("text12", "colorMuted", "mb8")}>{commentTarget.postTitle}</div>
              <textarea
                className={cx("profInput")}
                placeholder="Share your thoughts…"
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                autoFocus
              />
              <div className={cx("flexRow", "gap8", "justifyEnd", "mt4")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setCommentTarget(null)}>Cancel</button>
                <button type="button" className={cx("btnSm", "btnAccent")} disabled={commentBusy || !commentText.trim()} onClick={() => void handleCommentSubmit()}>
                  {commentBusy ? "Sending…" : "Send Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeArticle && (
        <div className={cx("modalOverlay")} onClick={() => setActiveArticle(null)}>
          <div className={cx("pmModalInner", "maxW640")} onClick={(e) => e.stopPropagation()}>
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
