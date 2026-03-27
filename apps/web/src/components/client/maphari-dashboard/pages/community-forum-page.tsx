// ════════════════════════════════════════════════════════════════════════════
// community-forum-page.tsx — Client Portal Community Forum
// Data     : loadPortalForumThreadsWithRefresh  → GET /portal/forum/threads
//            loadPortalForumThreadWithRefresh   → GET /portal/forum/threads/:id
//            createPortalForumThreadWithRefresh → POST /portal/forum/threads
//            createPortalForumPostWithRefresh   → POST /portal/forum/threads/:id/posts
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useCallback } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalForumThreadsWithRefresh,
  loadPortalForumThreadWithRefresh,
  createPortalForumThreadWithRefresh,
  createPortalForumPostWithRefresh,
  type ForumThread,
  type ForumThreadDetail,
} from "../../../../lib/api/portal/forum";

// ── Helpers ───────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function aliasMonogram(alias: string): string {
  return alias
    .split("-")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function exportForumThreadsCsv(threads: ForumThread[]): void {
  const header = ["Title", "Category", "Alias", "Replies", "Pinned", "Locked", "Created"];
  const rows = threads.map((thread) => [
    thread.title,
    thread.category,
    thread.anonAlias,
    String(thread.replyCount),
    thread.isPinned ? "Yes" : "No",
    thread.isLocked ? "Yes" : "No",
    thread.createdAt,
  ]);
  const escape = (value: string) => "\"" + value.replace(/"/g, "\"\"") + "\"";
  const csv = [header, ...rows].map((row) => row.map((cell) => escape(String(cell))).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "community-forum.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",           label: "All" },
  { id: "tips",          label: "Tips & Tricks" },
  { id: "qa",            label: "Q&A" },
  { id: "announcements", label: "Announcements" },
  { id: "general",       label: "General" },
];

const CAT_LABELS: Record<string, string> = {
  tips: "Tips",
  qa: "Q&A",
  announcements: "Announcements",
  general: "General",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommunityForumPage() {
  const { session } = useProjectLayer();

  const [threads,        setThreads]        = useState<ForumThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ForumThreadDetail | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading,        setLoading]        = useState(true);
  const [loadingThread,  setLoadingThread]  = useState(false);
  const [showNewThread,  setShowNewThread]  = useState(false);
  const [newThread,      setNewThread]      = useState({ title: "", category: "general", body: "" });
  const [replyBody,      setReplyBody]      = useState("");
  const [query,          setQuery]          = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  // ── Load threads ─────────────────────────────────────────────────────────────

  const loadThreads = useCallback(async (category: string) => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const params = category !== "all" ? { category } : undefined;
      const r = await loadPortalForumThreadsWithRefresh(session, params);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message); return; }
      if (r.data) {
        // Sort: pinned first, then by createdAt desc
        const sorted = [...r.data.data].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setThreads(sorted);
      }
    } catch {
      setError("Failed to load forum threads.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) loadThreads(activeCategory);
    else setLoading(false);
  }, [session, activeCategory, loadThreads]);

  // ── Thread click → load detail ────────────────────────────────────────────

  async function handleThreadClick(thread: ForumThread) {
    if (!session) return;
    // Toggle off if already selected
    if (selectedThread?.id === thread.id) {
      setSelectedThread(null);
      return;
    }
    setLoadingThread(true);
    setReplyBody("");
    try {
      const r = await loadPortalForumThreadWithRefresh(session, thread.id);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message); return; }
      if (r.data) {
        // Posts in ascending createdAt order (natural conversation flow)
        const detail: ForumThreadDetail = {
          ...r.data,
          posts: [...r.data.posts].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),
        };
        setSelectedThread(detail);
      }
    } catch {
      setError("Failed to load thread.");
    } finally {
      setLoadingThread(false);
    }
  }

  // ── New thread submit ─────────────────────────────────────────────────────

  async function handleNewThreadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !newThread.title.trim()) return;
    setSubmitting(true);
    try {
      const r = await createPortalForumThreadWithRefresh(session, {
        category: newThread.category,
        title: newThread.title.trim(),
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message); return; }
      // Thread is pending approval — close form and refresh list
      setShowNewThread(false);
      setNewThread({ title: "", category: "general", body: "" });
      await loadThreads(activeCategory);
    } catch {
      setError("Failed to create thread.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Reply submit ──────────────────────────────────────────────────────────

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !selectedThread || !replyBody.trim()) return;
    setSubmitting(true);
    try {
      const r = await createPortalForumPostWithRefresh(session, selectedThread.id, {
        body: replyBody.trim(),
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message); return; }
      // Refresh thread detail to show new post (may be pending approval)
      const refreshed = await loadPortalForumThreadWithRefresh(session, selectedThread.id);
      if (refreshed.nextSession) saveSession(refreshed.nextSession);
      if (refreshed.data) {
        const detail: ForumThreadDetail = {
          ...refreshed.data,
          posts: [...refreshed.data.posts].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),
        };
        setSelectedThread(detail);
      }
      setReplyBody("");
    } catch {
      setError("Failed to post reply.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Category change ───────────────────────────────────────────────────────

  function handleCategoryChange(id: string) {
    setActiveCategory(id);
    setSelectedThread(null);
  }

  const visibleThreads = threads.filter((thread) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return thread.title.toLowerCase().includes(q) || thread.anonAlias.toLowerCase().includes(q);
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cx("forumPage")}>

      {/* Header */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Community · Forum</div>
          <h1 className={cx("pageTitle")}>Community Forum</h1>
          <p className={cx("pageSub", "forumPrivacyNotice")}>
            All posts are anonymous — your identity is never shown to other clients
          </p>
        </div>
        <div className={cx("pageActions")}>
          <button
            className={cx("btnSm", "btnGhost")}
            onClick={() => void loadThreads(activeCategory)}
            disabled={loading}
          >
            Refresh
          </button>
          <button
            className={cx("btnSm", "btnGhost")}
            onClick={() => exportForumThreadsCsv(visibleThreads)}
            disabled={visibleThreads.length === 0}
          >
            Export CSV
          </button>
          <button
            className={cx("btnSm", "btnAccent")}
            onClick={() => setShowNewThread(true)}
          >
            + New Thread
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className={cx("forumTabsWrap")}>
        <div className={cx("forumCategoryTabs")}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={cx("forumTab", activeCategory === cat.id ? "forumTabActive" : "")}
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cx("relative", "mb12")}>
        <span className={cx("searchIconWrap")}>
          <Ic n="search" sz={13} c="var(--muted2)" />
        </span>
        <input
          className={cx("input", "pl36")}
          placeholder={"Search " + String(threads.length) + " threads…"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className={cx("emptyState", "mb12")}>
          <div className={cx("emptyStateIcon")}><Ic n="alert" sz={20} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnGhost", "mt12")} onClick={() => void loadThreads(activeCategory)}>
            Retry
          </button>
        </div>
      )}

      {/* Thread list */}
      {loading ? (
        <div className={cx("forumDetailEmpty")}>Loading threads…</div>
      ) : visibleThreads.length === 0 ? (
        <div className={cx("forumDetailEmpty")}>No threads yet in this category.</div>
      ) : (
        <div className={cx("forumThreadList")}>
          {visibleThreads.map((thread) => {
            const isSelected = selectedThread?.id === thread.id;
            return (
              <div key={thread.id}>
                {/* Thread row */}
                <div
                  className={cx(
                    "forumThreadRow",
                    thread.isPinned ? "forumPinned" : "",
                    isSelected ? "forumThreadRowSelected" : ""
                  )}
                  onClick={() => handleThreadClick(thread)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleThreadClick(thread); }}
                >
                  <div className={cx("forumThreadAvatar")}>
                    {aliasMonogram(thread.anonAlias)}
                  </div>
                  <div className={cx("forumThreadMeta")}>
                    <div className={cx("flexRow", "gap8", "flexAlignCenter", "flexWrap")}>
                      <span className={cx("forumCategoryBadge")}>
                        {CAT_LABELS[thread.category] ?? thread.category}
                      </span>
                      {thread.isPinned && <Ic n="pin" sz={12} c="var(--accent)" />}
                      {thread.isLocked && <Ic n="lock" sz={12} c="var(--muted2)" />}
                      <span className={cx("forumAlias")}>{thread.anonAlias}</span>
                      <span className={cx("forumReplyCount")}>
                        {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
                      </span>
                      <span className={cx("forumReplyCount")}>{relTime(thread.createdAt)}</span>
                    </div>
                    <div className={cx("fw600", "mt4")}>{thread.title}</div>
                  </div>
                </div>

                {/* Inline thread detail */}
                {isSelected && (
                  <div className={cx("forumDetailView")}>
                    <div className={cx("forumDetailHeader")}>
                      <span>{thread.title}</span>
                      <button
                        className={cx("iconBtn40x34")}
                        onClick={() => setSelectedThread(null)}
                        aria-label="Close thread"
                      >
                        <Ic n="x" sz={14} c="var(--muted2)" />
                      </button>
                    </div>

                    {loadingThread ? (
                      <div className={cx("forumDetailEmpty")}>Loading…</div>
                    ) : (
                      <>
                        <div className={cx("forumDetailPosts")}>
                          {selectedThread.posts.length === 0 ? (
                            <div className={cx("forumDetailEmpty")}>No replies yet. Be the first to reply.</div>
                          ) : (
                            selectedThread.posts.map((post) => (
                              <div key={post.id} className={cx("forumPostRow")}>
                                <div className={cx("forumPostAvatar")}>
                                  {aliasMonogram(post.anonAlias)}
                                </div>
                                <div className={cx("flex1", "minW0")}>
                                  <div className={cx("forumPostMeta")}>
                                    <span className={cx("forumAlias")}>{post.anonAlias}</span>
                                    <span className={cx("forumReplyCount")}>{relTime(post.createdAt)}</span>
                                  </div>
                                  <div className={cx("forumPostBody")}>{post.body}</div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Reply form or locked notice */}
                        {selectedThread.isLocked ? (
                          <div className={cx("forumLockedNotice")}>
                            <Ic n="lock" sz={12} c="var(--muted2)" /> This thread is locked
                          </div>
                        ) : (
                          <form className={cx("forumReplyForm")} onSubmit={handleReplySubmit}>
                            <div className={cx("forumInputGroup")}>
                              <textarea
                                placeholder="Write a reply… (anonymous)"
                                value={replyBody}
                                onChange={(e) => setReplyBody(e.target.value)}
                                rows={3}
                                required
                              />
                            </div>
                            <button type="submit" disabled={submitting || !replyBody.trim()}>
                              {submitting ? "Posting…" : "Post Reply"}
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over new thread form */}
      {showNewThread && (
        <>
          <div
            className={cx("forumBackdrop")}
            onClick={() => setShowNewThread(false)}
            aria-hidden="true"
          />
          <div
            className={cx("forumModalWrap")}
            aria-modal="true"
            role="dialog"
            aria-label="New Thread"
          >
            <div className={cx("pmModalInner", "maxW640")} onClick={(event) => event.stopPropagation()}>
              <div className={cx("pmModalHd")}>
                <div>
                  <div className={cx("text10", "uppercase", "ls01", "colorMuted2", "mb3")}>Community</div>
                  <div className={cx("pmTitle")}>New Thread</div>
                  <div className={cx("text11", "colorMuted", "mt2")}>
                    Start a new anonymous discussion for the client community.
                  </div>
                </div>
                <button
                  className={cx("iconBtn40x34")}
                  onClick={() => setShowNewThread(false)}
                  aria-label="Close"
                >
                  <Ic n="x" sz={14} c="var(--muted2)" />
                </button>
              </div>
              <form onSubmit={handleNewThreadSubmit}>
                <div className={cx("cardS1v2", "p16", "flexCol", "gap16")}>
                  <div className={cx("forumInputGroup")}>
                    <label htmlFor="forum-title">Title</label>
                    <input
                      id="forum-title"
                      type="text"
                      placeholder="Thread title…"
                      value={newThread.title}
                      onChange={(e) => setNewThread((p) => ({ ...p, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={cx("forumInputGroup")}>
                    <label htmlFor="forum-category">Category</label>
                    <select
                      id="forum-category"
                      value={newThread.category}
                      onChange={(e) => setNewThread((p) => ({ ...p, category: e.target.value }))}
                    >
                      {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={cx("forumLockedNotice", "m0")}>
                    <Ic n="shield" sz={12} c="var(--muted2)" />
                    Your thread will be reviewed before it appears publicly. All posts are anonymous.
                  </div>
                  <div className={cx("flexRow", "gap8", "justifyEnd")}>
                    <button
                      type="button"
                      onClick={() => setShowNewThread(false)}
                      className={cx("btnSm", "btnGhost")}
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting || !newThread.title.trim()} className={cx("btnSm", "btnAccent")}>
                      {submitting ? "Submitting…" : "Submit Thread"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
