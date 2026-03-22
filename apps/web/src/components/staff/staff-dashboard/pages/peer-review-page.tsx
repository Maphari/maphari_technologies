// ════════════════════════════════════════════════════════════════════════════
// peer-review-page.tsx — Structured peer review cycle for staff
// Data : loadMyPeerReviewsWithRefresh → reviews assigned to/from me
//        submitPeerReviewWithRefresh  → submit score + feedback
//        getStaffTeamPerformance      → colleague roster for the form
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getMyProfile } from "../../../../lib/api/staff/profile";
import {
  loadMyPeerReviewsWithRefresh,
  submitPeerReviewWithRefresh,
  type StaffPeerReview,
} from "../../../../lib/api/staff/hr";
import { getStaffTeamPerformance, type StaffTeamMember } from "../../../../lib/api/staff/performance";

// ── Types ─────────────────────────────────────────────────────────────────────

type ReviewFormState = {
  reviewId:  string | null;
  revieweeId: string;
  score:     number;
  feedback:  string;
};

type Tab = "write" | "received";

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentQuarter(): string {
  const month = new Date().getMonth(); // 0-indexed
  const year  = new Date().getFullYear();
  const q = Math.floor(month / 3) + 1;
  return `Q${q}-${year}`;
}

const CURRENT_QUARTER = currentQuarter();

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Score label for 1–5 */
function scoreLabel(score: number): string {
  const labels: Record<number, string> = {
    1: "Needs improvement",
    2: "Below expectations",
    3: "Meets expectations",
    4: "Exceeds expectations",
    5: "Outstanding",
  };
  return labels[score] ?? "";
}

/** Colour class for a given score */
function scoreToneClass(score: number): string {
  if (score >= 5) return "colorAccent";
  if (score >= 4) return "colorGreen";
  if (score >= 3) return "colorBlue";
  if (score >= 2) return "colorAmber";
  return "colorRed";
}

// ── Star rating component ─────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value:    number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className={cx("prwStars")} role="group" aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          className={cx("prwStar", display >= star ? "prwStarFilled" : "prwStarEmpty")}
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function PeerReviewPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session:  AuthSession | null;
}) {
  const [tab, setTab]             = useState<Tab>("write");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [colleagues, setColleagues]   = useState<StaffTeamMember[]>([]);
  const [reviews, setReviews]         = useState<StaffPeerReview[]>([]);
  const [selectedReviewee, setSelectedReviewee] = useState<string>("");
  const [form, setForm] = useState<ReviewFormState>({
    reviewId:   null,
    revieweeId: "",
    score:      0,
    feedback:   "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || !session?.accessToken) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void Promise.all([
      getMyProfile(session),
      loadMyPeerReviewsWithRefresh(session),
      getStaffTeamPerformance(session),
    ]).then(([profileRes, reviewsRes, teamRes]) => {
      if (profileRes.nextSession) saveSession(profileRes.nextSession);
      if (reviewsRes.nextSession) saveSession(reviewsRes.nextSession);
      if (teamRes.nextSession) saveSession(teamRes.nextSession);

      if (!profileRes.error && profileRes.data) {
        setMyProfileId(profileRes.data.id);
      }
      if (!reviewsRes.error && reviewsRes.data) {
        setReviews(reviewsRes.data);
      }
      if (!teamRes.error && teamRes.data) {
        // Exclude self from colleague list
        const profileId = profileRes.data?.id ?? null;
        const peers = teamRes.data.filter((m) => m.id !== profileId);
        setColleagues(peers);
        if (peers.length > 0 && !selectedReviewee) {
          setSelectedReviewee(peers[0]?.id ?? "");
        }
      }
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load data.");
    }).finally(() => setLoading(false));
  }, [isActive, session?.accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── When reviewee changes, pre-fill existing pending review if any ────────
  useEffect(() => {
    if (!selectedReviewee || !myProfileId) return;
    const existing = reviews.find(
      (r) => r.reviewerId === myProfileId && r.revieweeId === selectedReviewee && r.status !== "SUBMITTED"
    );
    setForm({
      reviewId:   existing?.id ?? null,
      revieweeId: selectedReviewee,
      score:      existing?.score ?? 0,
      feedback:   existing?.feedback ?? "",
    });
    setSubmitFeedback(null);
  }, [selectedReviewee, myProfileId, reviews]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const mySubmitted = reviews.filter(
    (r) => myProfileId && r.reviewerId === myProfileId && r.status === "SUBMITTED"
  );
  const receivedReviews = reviews.filter(
    (r) => myProfileId && r.revieweeId === myProfileId && r.status === "SUBMITTED"
  );

  const revieweeColleague = colleagues.find((c) => c.id === selectedReviewee);

  const handleSubmit = useCallback(async () => {
    if (!session || !form.reviewId || form.score === 0) return;
    setSubmitting(true);
    setSubmitFeedback(null);
    try {
      const result = await submitPeerReviewWithRefresh(session, form.reviewId, {
        score:    form.score,
        feedback: form.feedback.trim() || undefined,
      });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error || !result.data) {
        setSubmitFeedback({ tone: "error", text: result.error?.message ?? "Failed to submit review." });
      } else {
        setSubmitFeedback({ tone: "success", text: "Review submitted successfully." });
        // Update local state to reflect submission
        setReviews((prev) =>
          prev.map((r) => (r.id === form.reviewId ? { ...r, status: "SUBMITTED", score: form.score, feedback: form.feedback } : r))
        );
      }
    } finally {
      setSubmitting(false);
    }
  }, [session, form]);

  // ── Render guards ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-peer-review">
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
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-peer-review">
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-peer-review">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className={cx("pageHeaderBar", "borderB", "pb0")}>
        <div className={cx("flexBetween", "mb20")}>
          <div>
            <div className={cx("pageEyebrow")}>Staff Dashboard / HR</div>
            <h1 className={cx("pageTitle")}>Peer Reviews</h1>
          </div>
          <div className={cx("flexRow", "gap20")}>
            <div className={cx("textRight")}>
              <div className={cx("prwStatLabel")}>Quarter</div>
              <div className={cx("prwStatValue")}>{CURRENT_QUARTER}</div>
            </div>
            <div className={cx("textRight")}>
              <div className={cx("prwStatLabel")}>Submitted</div>
              <div className={cx("prwStatValue", mySubmitted.length > 0 ? "colorAccent" : "colorMuted2")}>
                {mySubmitted.length}
              </div>
            </div>
            <div className={cx("textRight")}>
              <div className={cx("prwStatLabel")}>Received</div>
              <div className={cx("prwStatValue", receivedReviews.length > 0 ? "colorGreen" : "colorMuted2")}>
                {receivedReviews.length}
              </div>
            </div>
          </div>
        </div>

        <div className={cx("staffSegControl")}>
          {([
            { key: "write",    label: "Write a Review" },
            { key: "received", label: `Reviews I've Received${receivedReviews.length > 0 ? ` (${receivedReviews.length})` : ""}` },
          ] as const).map((t) => (
            <button
              key={t.key}
              type="button"
              className={cx("staffSegBtn", tab === t.key && "staffSegBtnActive")}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Write a Review tab ───────────────────────────────────────────────── */}
      {tab === "write" && (
        <div className={cx("prwLayout")}>

          {/* Reviewee selector panel */}
          <div className={cx("prwColleagueList")}>
            <div className={cx("prwColleagueListHeader")}>Select colleague</div>
            {colleagues.length === 0 ? (
              <div className={cx("prwColleagueEmpty")}>
                <Ic n="users" sz={20} c="var(--muted2)" />
                <span>No colleagues found</span>
              </div>
            ) : (
              colleagues.map((colleague) => {
                const isSelected = selectedReviewee === colleague.id;
                const alreadySubmitted = reviews.some(
                  (r) => r.reviewerId === myProfileId && r.revieweeId === colleague.id && r.status === "SUBMITTED"
                );
                return (
                  <button
                    key={colleague.id}
                    type="button"
                    className={cx("prwColleagueCard", isSelected && "prwColleagueCardActive")}
                    onClick={() => setSelectedReviewee(colleague.id)}
                  >
                    <div className={cx("prwColleagueAvatar")}>
                      {buildInitials(colleague.name)}
                    </div>
                    <div className={cx("prwColleagueInfo")}>
                      <div className={cx("prwColleagueName")}>{colleague.name}</div>
                      <div className={cx("prwColleagueRole")}>{colleague.role}</div>
                    </div>
                    {alreadySubmitted && (
                      <span className={cx("prwSubmittedBadge")}>
                        <Ic n="check" sz={10} c="inherit" />
                        Done
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Review form */}
          {selectedReviewee && revieweeColleague ? (
            <div className={cx("prwFormPanel")}>
              <div className={cx("prwFormHeader")}>
                <div className={cx("prwFormAvatar")}>{buildInitials(revieweeColleague.name)}</div>
                <div>
                  <div className={cx("prwFormName")}>{revieweeColleague.name}</div>
                  <div className={cx("prwFormRole")}>{revieweeColleague.role}</div>
                </div>
              </div>

              {/* Check for assigned review */}
              {!form.reviewId ? (
                <div className={cx("prwNoAssignment")}>
                  <Ic n="file" sz={20} c="var(--muted2)" />
                  <div className={cx("prwNoAssignmentTitle")}>No review assigned</div>
                  <div className={cx("prwNoAssignmentSub")}>
                    Reviews are assigned by your manager at the start of each cycle.
                    Ask your manager to assign a {CURRENT_QUARTER} review for {revieweeColleague.name}.
                  </div>
                </div>
              ) : (() => {
                const isAlreadySubmitted = reviews.find((r) => r.id === form.reviewId)?.status === "SUBMITTED";

                if (isAlreadySubmitted) {
                  const submitted = reviews.find((r) => r.id === form.reviewId);
                  return (
                    <div className={cx("prwSubmittedState")}>
                      <div className={cx("prwSubmittedIcon")}>
                        <Ic n="check" sz={20} c="var(--accent)" />
                      </div>
                      <div className={cx("prwSubmittedTitle")}>Review submitted</div>
                      <div className={cx("prwSubmittedMeta")}>
                        You gave {revieweeColleague.name} a score of{" "}
                        <span className={cx("fw700", "colorAccent")}>{submitted?.score ?? "—"}/5</span>
                      </div>
                      {submitted?.feedback ? (
                        <div className={cx("prwSubmittedFeedback")}>{submitted.feedback}</div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <>
                    <div className={cx("prwFormSection")}>
                      <div className={cx("prwFormSectionLabel")}>Overall score</div>
                      <div className={cx("prwFormSectionSub")}>Rate {revieweeColleague.name}&apos;s overall performance this quarter (1 = needs improvement, 5 = outstanding)</div>
                      <div className={cx("prwScoreRow")}>
                        <StarRating value={form.score} onChange={(v) => setForm((p) => ({ ...p, score: v }))} />
                        {form.score > 0 && (
                          <span className={cx("prwScoreLabel", scoreToneClass(form.score))}>
                            {form.score}/5 — {scoreLabel(form.score)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={cx("prwFormSection")}>
                      <label className={cx("prwFormSectionLabel")} htmlFor="prw-feedback">
                        Written feedback <span className={cx("colorMuted2")}>(optional)</span>
                      </label>
                      <div className={cx("prwFormSectionSub")}>
                        Share specific observations about communication, delivery quality, teamwork, and initiative.
                      </div>
                      <textarea
                        id="prw-feedback"
                        value={form.feedback}
                        onChange={(e) => setForm((p) => ({ ...p, feedback: e.target.value }))}
                        placeholder={`What has ${revieweeColleague.name} done well? What could they improve? Give concrete examples.`}
                        className={cx("prwFeedbackArea")}
                        rows={6}
                      />
                    </div>

                    {submitFeedback && (
                      <div className={cx(submitFeedback.tone === "success" ? "colorAccent" : "colorRed", "text12")}>
                        {submitFeedback.text}
                      </div>
                    )}

                    <div className={cx("prwSubmitRow")}>
                      <button
                        type="button"
                        className={cx("btnSm", "btnAccent")}
                        disabled={form.score === 0 || submitting}
                        onClick={() => void handleSubmit()}
                      >
                        {submitting ? "Submitting…" : "Submit review →"}
                      </button>
                      <span className={cx("prwSubmitHint")}>
                        {form.score === 0 ? "Select a score to continue" : "Review will be locked after submission"}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className={cx("prwFormPanel", "prwFormPanelEmpty")}>
              <Ic n="users" sz={28} c="var(--muted2)" />
              <div className={cx("prwEmptyTitle")}>Select a colleague to review</div>
            </div>
          )}
        </div>
      )}

      {/* ── Reviews I've Received tab ─────────────────────────────────────────── */}
      {tab === "received" && (
        <div className={cx("prwReceivedSection")}>
          {receivedReviews.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="star" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No reviews received yet</div>
              <div className={cx("emptyStateSub")}>
                Reviews submitted by your colleagues will appear here once the cycle closes.
              </div>
            </div>
          ) : (
            <>
              <div className={cx("prwReceivedHeader")}>
                <div className={cx("prwReceivedTitle")}>Feedback for you — {CURRENT_QUARTER}</div>
                <div className={cx("prwReceivedMeta")}>{receivedReviews.length} REVIEW{receivedReviews.length !== 1 ? "S" : ""}</div>
              </div>

              {/* Average score card */}
              {(() => {
                const scores = receivedReviews.map((r) => r.score).filter((s): s is number => s !== null);
                if (scores.length === 0) return null;
                const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
                return (
                  <div className={cx("prwAvgCard")}>
                    <div className={cx("prwAvgScore", scoreToneClass(Math.round(avg)))}>{avg}</div>
                    <div className={cx("prwAvgLabel")}>Average score</div>
                    <StarRating value={Math.round(avg)} readonly />
                    <div className={cx("prwAvgSub")}>{scoreLabel(Math.round(avg))}</div>
                  </div>
                );
              })()}

              <div className={cx("prwReceivedList")}>
                {receivedReviews.map((review) => (
                  <div key={review.id} className={cx("prwReceivedCard")}>
                    <div className={cx("prwReceivedCardHead")}>
                      <div className={cx("prwAnonymousAvatar")}>PR</div>
                      <div className={cx("prwReceivedCardMeta")}>
                        <div className={cx("prwAnonymousLabel")}>Anonymous reviewer</div>
                        <div className={cx("prwReceivedDate")}>
                          {review.submittedAt
                            ? new Date(review.submittedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </div>
                      </div>
                      {review.score !== null && (
                        <div className={cx("prwReceivedScore")}>
                          <span className={cx("prwReceivedScoreNum", scoreToneClass(review.score))}>
                            {review.score}/5
                          </span>
                          <StarRating value={review.score} readonly />
                        </div>
                      )}
                    </div>
                    {review.feedback ? (
                      <div className={cx("prwReceivedFeedback")}>{review.feedback}</div>
                    ) : (
                      <div className={cx("prwReceivedNoFeedback")}>No written feedback provided.</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
