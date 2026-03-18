// ════════════════════════════════════════════════════════════════════════════
// project-wrap-page.tsx — Client Portal Project Wrap
// Data     : useProjectLayer() → session + projectId
//            Testimonial submission → POST /support-tickets (category: TESTIMONIAL)
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState } from "react";
import { cx } from "../style";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { saveSession } from "../../../../lib/auth/session";
import { createPortalSupportTicketWithRefresh } from "../../../../lib/api/portal";

// ── Static wrap content ───────────────────────────────────────────────────────

const CHECKLIST = [
  "Final Project Report (PDF)",
  "Asset Handover Pack (Source Files)",
  "Knowledge Base & How-To Guide",
  "Testimonial Request Sent",
  "Re-engagement Offer Presented",
];

const NEXT_STEPS = [
  { action: "Download your assets", desc: "All files available in the Files section" },
  { action: "Leave a testimonial", desc: "Share your experience to help others" },
  { action: "Explore retainer plans", desc: "Keep the momentum going" },
  { action: "Refer a colleague", desc: "Earn R5 000 for every referral" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectWrapPage() {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();

  const [rating,     setRating]     = useState(0);
  const [text,       setText]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  async function handleSubmitTestimonial(): Promise<void> {
    if (!session || submitting || submitted) return;
    if (rating === 0) {
      notify("error", "Rating required", "Please select a star rating before submitting.");
      return;
    }
    if (text.trim().length < 20) {
      notify("error", "More detail needed", "Please write at least 20 characters in your testimonial.");
      return;
    }
    setSubmitting(true);
    try {
      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      const r = await createPortalSupportTicketWithRefresh(session, {
        clientId:    session.user.clientId ?? "",
        title:       `Client Testimonial — ${stars} (${rating}/5)`,
        description: `Project: ${projectId ?? "N/A"}\n\nTestimonial:\n${text.trim()}`,
        category:    "TESTIMONIAL",
        priority:    "LOW",
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        notify("error", "Submission failed", "Could not submit your testimonial. Please try again.");
      } else {
        setSubmitted(true);
        notify("success", "Testimonial submitted", "Thank you! Your feedback has been shared with the Maphari team.");
      }
    } catch {
      notify("error", "Submission failed", "Could not submit your testimonial. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Wrap</div>
          <h1 className={cx("pageTitle")}>Project Wrap</h1>
          <p className={cx("pageSub")}>
            Your project has been completed. Here&apos;s everything you need for a smooth handover.
          </p>
        </div>
      </div>

      <div
        className={cx("card", "p20", "mb16", "borderLeftAccent")}
      >
        <div className={cx("fw700", "mb4")}>Project Completed</div>
        <div className={cx("text12", "colorMuted")}>
          Your Brand Identity project wrapped on Jan 28, 2026. All deliverables have been handed over.
        </div>
      </div>

      <div className={cx("grid2", "mb16")}>
        <div className={cx("card", "p20")}>
          <div className={cx("fw700", "mb12")}>Wrap Checklist</div>
          <div className={cx("listGroup")}>
            {CHECKLIST.map((item) => (
              <div key={item} className={cx("listRow")}>
                <div className={cx("flexRow", "gap8")}>
                  <span className={cx("colorAccent", "fw700")}>✓</span>
                  <span className={cx("text12")}>{item}</span>
                </div>
                <span className={cx("badge", "badgeGreen")}>Done</span>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("card", "p20")}>
          <div className={cx("fw700", "mb12")}>What Happens Next</div>
          <div className={cx("listGroup")}>
            {NEXT_STEPS.map((step) => (
              <div key={step.action} className={cx("listRow")}>
                <div>
                  <div className={cx("fw600", "text12")}>{step.action}</div>
                  <div className={cx("text11", "colorMuted")}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        <div className={cx("card", "p16")}>
          <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Duration</div>
          <div className={cx("fw800")}>4 months</div>
        </div>
        <div className={cx("card", "p16")}>
          <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Deliverables</div>
          <div className={cx("fw800", "colorAccent")}>12 delivered</div>
        </div>
        <div className={cx("card", "p16")}>
          <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Milestones</div>
          <div className={cx("fw800")}>3 of 3</div>
        </div>
        <div className={cx("card", "p16")}>
          <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Team</div>
          <div className={cx("fw800")}>4 members</div>
        </div>
      </div>

      {/* ── Testimonial form ──────────────────────────────────────────────── */}
      <div className={cx("card", "p20")}>
        <div className={cx("fw700", "mb12")}>Leave a Testimonial</div>

        {submitted ? (
          <div className={cx("textCenter", "py24_0")}>
            <div className={cx("pwSuccessEmoji")}>🎉</div>
            <div className={cx("fw700", "mb4")}>Thank you for your feedback!</div>
            <div className={cx("text12", "colorMuted")}>Your testimonial has been shared with the Maphari team.</div>
          </div>
        ) : (
          <>
            {/* Star rating */}
            <div className={cx("flexRow", "gap4", "mb12")}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={cx("btnGhost", "pwStarBtn")}
                  aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                  onClick={() => setRating(value)}
                >
                  {rating >= value ? "★" : "☆"}
                </button>
              ))}
              {rating > 0 && (
                <span className={cx("text11", "colorMuted", "alignSelfCenter", "ml6")}>
                  {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                </span>
              )}
            </div>

            {/* Testimonial textarea */}
            <textarea
              rows={4}
              placeholder="Share your experience working with Maphari..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={submitting}
              className={cx("input", "wFull", "resizeV", "mb12", submitting && "opacity60")}
            />

            {/* Submit button */}
            <button
              type="button"
              className={cx("btnSm", "btnAccent")}
              disabled={submitting || !session}
              onClick={() => void handleSubmitTestimonial()}
            >
              {submitting ? "Submitting…" : "Submit Testimonial"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
