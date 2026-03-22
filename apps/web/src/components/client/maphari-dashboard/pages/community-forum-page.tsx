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

function aliasEmoji(alias: string): string {
  const animals: Record<string, string> = {
    falcon: "🦅", hawk: "🦅", eagle: "🦅",
    leopard: "🐆", lion: "🦁", tiger: "🐯",
    otter: "🦦", bear: "🐻", wolf: "🐺",
    shark: "🦈", whale: "🐳", dolphin: "🐬",
    horse: "🐴", deer: "🦌", fox: "🦊",
    owl: "🦉", raven: "🐦", crane: "🦢",
  };
  const animal = alias.split("-").pop() ?? "";
  return animals[animal] ?? "🌿";
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",           label: "All" },
  { id: "tips",          label: "💡 Tips & Tricks" },
  { id: "qa",            label: "❓ Q&A" },
  { id: "announcements", label: "📢 Announcements" },
  { id: "general",       label: "☕ General" },
];

const CAT_LABELS: Record<string, string> = {
  tips: "💡 Tips",
  qa: "❓ Q&A",
  announcements: "📢 Announcements",
  general: "☕ General",
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cx("forumPage")}>

      {/* Header */}
      <div className={cx("forumHeader")}>
        <div>
          <h1>Community Forum</h1>
          <p className={cx("forumPrivacyNotice")}>
            All posts are anonymous — your identity is never shown to other clients
          </p>
        </div>
        <div className={cx("forumHeaderActions")}>
          <button
            className={cx("forumNewBtn")}
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

      {/* Error banner */}
      {error && (
        <div className={cx("forumLockedNotice")} style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Thread list */}
      {loading ? (
        <div className={cx("forumDetailEmpty")}>Loading threads…</div>
      ) : threads.length === 0 ? (
        <div className={cx("forumDetailEmpty")}>No threads yet in this category.</div>
      ) : (
        <div className={cx("forumThreadList")}>
          {threads.map((thread) => {
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
                    {aliasEmoji(thread.anonAlias)}
                  </div>
                  <div className={cx("forumThreadMeta")}>
                    <div className={cx("forumThreadMeta")} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className={cx("forumCategoryBadge")}>
                        {CAT_LABELS[thread.category] ?? thread.category}
                      </span>
                      {thread.isPinned && <span title="Pinned">📌</span>}
                      {thread.isLocked && <span className={cx("forumLocked")} title="Locked">🔒</span>}
                      <span className={cx("forumAlias")}>{thread.anonAlias}</span>
                      <span className={cx("forumReplyCount")}>
                        {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
                      </span>
                      <span className={cx("forumReplyCount")}>{relTime(thread.createdAt)}</span>
                    </div>
                    <div style={{ fontWeight: 500, marginTop: 4 }}>{thread.title}</div>
                  </div>
                </div>

                {/* Inline thread detail */}
                {isSelected && (
                  <div className={cx("forumDetailView")}>
                    <div className={cx("forumDetailHeader")}>
                      <span>{thread.title}</span>
                      <button
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1rem" }}
                        onClick={() => setSelectedThread(null)}
                        aria-label="Close thread"
                      >
                        ✕
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
                                  {aliasEmoji(post.anonAlias)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
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
                            🔒 This thread is locked
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
            className={cx("forumSlideOver")}
            aria-modal="true"
            role="dialog"
            aria-label="New Thread"
          >
            <div className={cx("forumSlideOverHeader")}>
              <span>New Thread</span>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1.1rem" }}
                onClick={() => setShowNewThread(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleNewThreadSubmit}>
              <div className={cx("forumSlideOverBody")}>
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
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>
                  Your thread will be reviewed before it appears publicly. All posts are anonymous.
                </p>
              </div>
              <div className={cx("forumSlideOverFooter")}>
                <button
                  type="button"
                  onClick={() => setShowNewThread(false)}
                  style={{ background: "none", border: "1px solid var(--b2)", color: "var(--muted)", borderRadius: "var(--r-sm)", padding: "8px 16px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting || !newThread.title.trim()} className={cx("forumNewBtn")}>
                  {submitting ? "Submitting…" : "Submit Thread"}
                </button>
              </div>
            </form>
          </div>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
              zIndex: 49, backdropFilter: "blur(2px)",
            }}
            onClick={() => setShowNewThread(false)}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
