// ════════════════════════════════════════════════════════════════════════════
// feature-requests-page.tsx — Client Portal Feature Requests
// Data     : loadPortalFeatureRequestsWithRefresh  → GET /portal/feature-requests
//            submitPortalFeatureRequestWithRefresh  → POST /portal/feature-requests
//            togglePortalFeatureVoteWithRefresh     → POST /portal/feature-requests/:id/vote
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useCallback } from "react";
import { cx } from "../style";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalFeatureRequestsWithRefresh,
  submitPortalFeatureRequestWithRefresh,
  togglePortalFeatureVoteWithRefresh,
  type FeatureRequest,
} from "../../../../lib/api/portal/feature-requests";

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

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",           label: "All Categories" },
  { id: "portal-ux",    label: "🖥 Portal UX" },
  { id: "reporting",    label: "📊 Reporting" },
  { id: "integrations", label: "🔗 Integrations" },
  { id: "delivery",     label: "🚀 Project Delivery" },
  { id: "billing",      label: "💰 Billing" },
  { id: "other",        label: "📌 Other" },
];

const CAT_LABELS: Record<string, string> = {
  "portal-ux":    "🖥 Portal UX",
  "reporting":    "📊 Reporting",
  "integrations": "🔗 Integrations",
  "delivery":     "🚀 Delivery",
  "billing":      "💰 Billing",
  "other":        "📌 Other",
};

const STATUSES = [
  { id: "all",          label: "All Statuses" },
  { id: "under_review", label: "Under Review" },
  { id: "planned",      label: "Planned" },
  { id: "in_progress",  label: "In Progress" },
  { id: "done",         label: "Done" },
  { id: "declined",     label: "Declined" },
];

const STATUS_CLASSES: Record<string, string> = {
  under_review: "frStatusUnderReview",
  planned:      "frStatusPlanned",
  in_progress:  "frStatusInProgress",
  done:         "frStatusDone",
  declined:     "frStatusDeclined",
};

const STATUS_LABELS: Record<string, string> = {
  under_review: "Under Review",
  planned:      "Planned",
  in_progress:  "In Progress",
  done:         "Done",
  declined:     "Declined",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function FeatureRequestsPage() {
  const { session } = useProjectLayer();

  const [requests,    setRequests]    = useState<FeatureRequest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [category,    setCategory]    = useState<string>("all");
  const [status,      setStatus]      = useState<string>("all");
  const [sort,        setSort]        = useState<"votes" | "newest">("votes");
  const [showSubmit,  setShowSubmit]  = useState(false);
  const [newReq,      setNewReq]      = useState({ title: "", category: "portal-ux", description: "" });
  const [submitting,  setSubmitting]  = useState(false);
  const [votingId,    setVotingId]    = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ── Load requests ─────────────────────────────────────────────────────────

  const loadRequests = useCallback(async (
    cat: string,
    st: string,
    srt: "votes" | "newest"
  ) => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const params: { category?: string; status?: string; sort?: "votes" | "newest" } = { sort: srt };
      if (cat !== "all") params.category = cat;
      if (st !== "all") params.status = st;
      const r = await loadPortalFeatureRequestsWithRefresh(session, params);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message); return; }
      if (r.data) setRequests(r.data.data);
    } catch {
      setError("Failed to load feature requests.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) loadRequests(category, status, sort);
    else setLoading(false);
  }, [session, category, status, sort, loadRequests]);

  // ── Vote toggle ───────────────────────────────────────────────────────────

  async function handleVote(req: FeatureRequest) {
    if (!session || votingId) return;
    setVotingId(req.id);
    try {
      const r = await togglePortalFeatureVoteWithRefresh(session, req.id);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message); return; }
      if (r.data) {
        const userId = session.user.id;
        setRequests((prev) =>
          prev.map((item) => {
            if (item.id !== req.id) return item;
            const updatedVotes = r.data!.voted
              ? [...item.votes.filter((v) => v.voterId !== userId), { voterId: userId }]
              : item.votes.filter((v) => v.voterId !== userId);
            return { ...item, voteCount: r.data!.voteCount, votes: updatedVotes };
          })
        );
      }
    } catch {
      setError("Failed to toggle vote.");
    } finally {
      setVotingId(null);
    }
  }

  // ── Submit new request ────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !newReq.title.trim() || !newReq.description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await submitPortalFeatureRequestWithRefresh(session, {
        category: newReq.category,
        title: newReq.title.trim(),
        description: newReq.description.trim(),
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message); return; }
      setSubmitSuccess(true);
      setNewReq({ title: "", category: "portal-ux", description: "" });
      setTimeout(() => {
        setShowSubmit(false);
        setSubmitSuccess(false);
      }, 2500);
    } catch {
      setError("Failed to submit feature request.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cx("frPage")}>

      {/* Header */}
      <div className={cx("frHeader")}>
        <div>
          <h1>Feature Requests</h1>
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>
            Vote on ideas or submit your own — all submissions are anonymous
          </p>
        </div>
        <div className={cx("frHeaderActions")}>
          <button className={cx("frSubmitBtn")} onClick={() => setShowSubmit(true)}>
            + Submit Idea
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={cx("frFilters")}>
        <div className={cx("frFilterRow")}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className={cx("frSortBtn", sort === "votes" ? "frSortBtnActive" : "")}
              onClick={() => setSort("votes")}
            >
              Most Voted
            </button>
            <button
              className={cx("frSortBtn", sort === "newest" ? "frSortBtnActive" : "")}
              onClick={() => setSort("newest")}
            >
              Newest
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className={cx("frErrorBanner")}>{error}</div>
      )}

      {/* Request list */}
      {loading ? (
        <div className={cx("frEmptyState")}>Loading feature requests…</div>
      ) : requests.length === 0 ? (
        <div className={cx("frEmptyState")}>No feature requests found.</div>
      ) : (
        <div className={cx("frList")}>
          {requests.map((req) => {
            const userId = session?.user.id ?? "";
            const hasVoted = req.votes.some((v) => v.voterId === userId);
            const isVoting = votingId === req.id;
            const isDeclined = req.status === "declined";

            return (
              <div
                key={req.id}
                className={cx("frCard", isDeclined ? "frCardDeclined" : "")}
              >
                <div className={cx("frCardInner")}>
                  {/* Vote area */}
                  <div className={cx("frVoteArea")}>
                    <button
                      className={cx("frVoteBtn", hasVoted ? "frVoteBtnActive" : "")}
                      onClick={() => handleVote(req)}
                      disabled={isVoting}
                      aria-label={hasVoted ? "Remove vote" : "Upvote"}
                      title={hasVoted ? "Remove vote" : "Upvote this idea"}
                    >
                      ▲
                    </button>
                    <span className={cx("frVoteCount")}>{req.voteCount}</span>
                  </div>

                  {/* Card content */}
                  <div className={cx("frCardContent")}>
                    <div className={cx("frTitle", isDeclined ? "frTitleDeclined" : "")}>
                      {req.title}
                    </div>
                    <div className={cx("frMeta")}>
                      <span className={cx("frCategoryBadge")}>
                        {CAT_LABELS[req.category] ?? req.category}
                      </span>
                      <span
                        className={cx(
                          "frStatusBadge",
                          STATUS_CLASSES[req.status] ?? ""
                        )}
                      >
                        {STATUS_LABELS[req.status] ?? req.status}
                      </span>
                      <span className={cx("frAlias")}>@{req.anonAlias}</span>
                      <span className={cx("frTimestamp")}>{relTime(req.createdAt)}</span>
                    </div>
                    {req.description && (
                      <div className={cx("frDescription")}>{req.description}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over: Submit Idea */}
      {showSubmit && (
        <>
          <div
            className={cx("frSlideOver")}
            aria-modal="true"
            role="dialog"
            aria-label="Submit Idea"
          >
            <div className={cx("frSlideOverHeader")}>
              <span>Submit an Idea</span>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1.1rem" }}
                onClick={() => { setShowSubmit(false); setSubmitSuccess(false); }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className={cx("frSlideOverBody")}>
                <div className={cx("frPendingNote")}>
                  Submitted! Your idea will be reviewed before appearing publicly.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className={cx("frSlideOverBody")}>
                  <div className={cx("frInputGroup")}>
                    <label htmlFor="fr-title">Title</label>
                    <input
                      id="fr-title"
                      type="text"
                      placeholder="Describe your idea in one line…"
                      value={newReq.title}
                      onChange={(e) => setNewReq((p) => ({ ...p, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className={cx("frInputGroup")}>
                    <label htmlFor="fr-category">Category</label>
                    <select
                      id="fr-category"
                      value={newReq.category}
                      onChange={(e) => setNewReq((p) => ({ ...p, category: e.target.value }))}
                    >
                      {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className={cx("frInputGroup")}>
                    <label htmlFor="fr-description">Description</label>
                    <textarea
                      id="fr-description"
                      placeholder="Explain the problem it solves or the value it adds…"
                      value={newReq.description}
                      onChange={(e) => setNewReq((p) => ({ ...p, description: e.target.value }))}
                      rows={4}
                      required
                    />
                  </div>

                  <p style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    All submissions are anonymous and will be reviewed before appearing publicly.
                  </p>
                </div>

                <div className={cx("frSlideOverFooter")}>
                  <button
                    type="button"
                    onClick={() => setShowSubmit(false)}
                    style={{
                      background: "none",
                      border: "1px solid var(--b2)",
                      color: "var(--muted)",
                      borderRadius: "var(--r-sm)",
                      padding: "8px 16px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={cx("frSubmitBtn")}
                    disabled={submitting || !newReq.title.trim() || !newReq.description.trim()}
                  >
                    {submitting ? "Submitting…" : "Submit Idea"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 49,
              backdropFilter: "blur(2px)",
            }}
            onClick={() => { setShowSubmit(false); setSubmitSuccess(false); }}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
