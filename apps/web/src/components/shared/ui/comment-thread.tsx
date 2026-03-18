"use client";

// ════════════════════════════════════════════════════════════════════════════
// comment-thread.tsx — Shared structured comment thread component
// Used on: deliverables (client), tasks (staff), invoices (admin)
// Data: GET/POST /comments via shared API client
// ════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import u from "@/app/style/shared/utilities.module.css";
import type { AuthSession } from "@/lib/auth/session";
import { saveSession } from "@/lib/auth/session";
import {
  loadCommentsWithRefresh,
  postCommentWithRefresh,
  type Comment,
  type CommentEntityType,
} from "@/lib/api/shared/comments";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function avatarInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CommentThreadProps {
  entityType: CommentEntityType;
  entityId: string;
  session: AuthSession | null;
  currentUserName: string;
  /** When true renders in a compact inline style (no outer border-top) */
  compact?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CommentThread({
  entityType,
  entityId,
  session,
  currentUserName,
  compact = false,
}: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Load comments when entityId / session changes
  const load = useCallback(async () => {
    if (!session || !entityId) return;
    setLoading(true);
    const r = await loadCommentsWithRefresh(session, entityType, entityId);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) setComments(r.data);
    setLoading(false);
  }, [session, entityType, entityId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Scroll to bottom on new comments
  useEffect(() => {
    if (listRef.current && comments.length > 0) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || !session || sending) return;
    setSending(true);
    setDraft("");
    // Optimistic update
    const optimistic: Comment = {
      id: `opt-${Date.now()}`,
      authorName: currentUserName,
      authorRole: session.user?.role ?? "STAFF",
      message: text,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, optimistic]);
    const r = await postCommentWithRefresh(session, entityType, entityId, text);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) {
      // Replace optimistic entry with real one
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? (r.data as Comment) : c))
      );
    }
    setSending(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className={compact ? undefined : u.ctWrap}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span
          style={{
            fontFamily: "var(--font-dm-mono, monospace)",
            fontSize: "0.68rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted, var(--muted2, rgba(240,237,232,0.25)))",
          }}
        >
          Comments
        </span>
        {comments.length > 0 && (
          <span
            style={{
              fontSize: "0.68rem",
              background: "var(--s3, rgba(255,255,255,0.06))",
              borderRadius: "999px",
              padding: "1px 7px",
              color: "var(--text-muted, var(--muted2))",
              fontFamily: "var(--font-dm-mono, monospace)",
            }}
          >
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      <div className={u.ctList} ref={listRef}>
        {loading && (
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted, var(--muted2))",
              textAlign: "center",
              padding: "8px 0",
            }}
          >
            Loading comments…
          </div>
        )}
        {!loading && comments.length === 0 && (
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted, var(--muted2))",
              textAlign: "center",
              padding: "8px 0",
            }}
          >
            No comments yet. Be the first.
          </div>
        )}
        {comments.map((c) => (
          <div key={c.id} className={u.ctItem}>
            <div className={u.ctAvatar}>{avatarInitials(c.authorName)}</div>
            <div className={u.ctBody}>
              <div>
                <span className={u.ctAuthor}>{c.authorName}</span>
                <span className={u.ctTime}>{fmtAgo(c.createdAt)}</span>
              </div>
              <div className={u.ctMsg}>{c.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className={u.ctCompose}>
        <textarea
          className={u.ctTextarea}
          placeholder="Add a comment… (Cmd+Enter to send)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={sending || !session}
          title="Write a comment"
        />
        <button
          type="button"
          className={u.ctSendBtn}
          onClick={() => void handleSend()}
          disabled={sending || !draft.trim() || !session}
          title="Send comment"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
      <div className={u.ctHint}>Use @name to mention a team member · Cmd+Enter to send</div>
    </div>
  );
}
