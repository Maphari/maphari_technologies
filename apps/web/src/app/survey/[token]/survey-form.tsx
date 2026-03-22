"use client";

// ════════════════════════════════════════════════════════════════════════════
// survey-form.tsx — Interactive NPS survey form (client component)
// Public page — no auth required
// ════════════════════════════════════════════════════════════════════════════

import { useState } from "react";

interface SurveyData {
  surveyId: string;
  clientId: string;
  companyName: string;
  periodStart: string;
  periodEnd: string;
}

interface Props {
  token: string;
  survey: SurveyData;
}

const GATEWAY_BASE = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:4000/api/v1";

function formatPeriod(start: string, end: string): string {
  try {
    const s = new Date(start).toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
    const e = new Date(end).toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
    return s === e ? s : `${s} – ${e}`;
  } catch {
    return "";
  }
}

function scoreColor(score: number): string {
  if (score <= 6) return "#ef4444";
  if (score <= 8) return "#f59e0b";
  return "#22c55e";
}

function scoreLabel(score: number): string {
  if (score <= 6) return "Detractor";
  if (score <= 8) return "Passive";
  return "Promoter";
}

export function SurveyForm({ token, survey }: Props) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const period = formatPeriod(survey.periodStart, survey.periodEnd);

  async function handleSubmit() {
    if (selectedScore === null) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${GATEWAY_BASE}/public/survey/${token}/respond`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ npsScore: selectedScore, comment: comment.trim() || undefined })
      });

      const json = (await res.json()) as { success: boolean; error?: { message: string } };

      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c8f135" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ ...styles.title, marginBottom: 12 }}>Thank you!</h1>
          <p style={styles.subtitle}>
            Your feedback for <strong style={{ color: "#fff" }}>{survey.companyName}</strong> has been received. We appreciate you taking the time to share your experience.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoMark}>M</div>
          <span style={styles.logoText}>Maphari Technologies</span>
        </div>

        <div style={styles.divider} />

        {/* Company + period */}
        <div style={styles.meta}>
          <p style={styles.metaCompany}>{survey.companyName}</p>
          {period ? <p style={styles.metaPeriod}>{period}</p> : null}
        </div>

        {/* Question */}
        <h2 style={styles.question}>
          How likely are you to recommend Maphari Technologies to a friend or colleague?
        </h2>

        {/* Score labels */}
        <div style={styles.scaleLabels}>
          <span style={styles.scaleLabelLeft}>Not at all likely</span>
          <span style={styles.scaleLabelRight}>Extremely likely</span>
        </div>

        {/* Score buttons */}
        <div style={styles.scoreRow}>
          {Array.from({ length: 11 }, (_, i) => {
            const isSelected = selectedScore === i;
            const color = scoreColor(i);
            return (
              <button
                key={i}
                onClick={() => setSelectedScore(i)}
                style={{
                  ...styles.scoreBtn,
                  background: isSelected ? color : "rgba(255,255,255,0.05)",
                  border: isSelected ? `2px solid ${color}` : "2px solid rgba(255,255,255,0.1)",
                  color: isSelected ? "#000" : "rgba(255,255,255,0.7)",
                  fontWeight: isSelected ? 700 : 400,
                  transform: isSelected ? "scale(1.1)" : "scale(1)"
                }}
              >
                {i}
              </button>
            );
          })}
        </div>

        {/* Score feedback */}
        {selectedScore !== null && (
          <div style={styles.scoreFeedback}>
            <span
              style={{
                color: scoreColor(selectedScore),
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase"
              }}
            >
              {scoreLabel(selectedScore)}
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginLeft: 8 }}>
              — score {selectedScore} / 10
            </span>
          </div>
        )}

        {/* Comment */}
        <div style={{ marginTop: 24 }}>
          <label style={styles.label} htmlFor="survey-comment">
            What&apos;s the main reason for your score? <span style={{ color: "rgba(255,255,255,0.35)" }}>(optional)</span>
          </label>
          <textarea
            id="survey-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share any thoughts, feedback, or suggestions..."
            rows={4}
            style={styles.textarea}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={styles.errorMsg}>{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={selectedScore === null || submitting}
          style={{
            ...styles.submitBtn,
            opacity: selectedScore === null || submitting ? 0.4 : 1,
            cursor: selectedScore === null || submitting ? "not-allowed" : "pointer"
          }}
        >
          {submitting ? "Submitting…" : "Submit feedback"}
        </button>

        <p style={styles.footer}>
          Your response is confidential and helps us improve our service.
        </p>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#050508",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: "32px 16px"
  } as React.CSSProperties,

  card: {
    maxWidth: 600,
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: "40px 36px",
    boxShadow: "0 24px 48px rgba(0,0,0,0.4)"
  } as React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20
  } as React.CSSProperties,

  logoMark: {
    width: 32,
    height: 32,
    background: "#c8f135",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 800,
    color: "#000",
    letterSpacing: "-0.02em"
  } as React.CSSProperties,

  logoText: {
    fontSize: 14,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: "-0.01em"
  } as React.CSSProperties,

  divider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    marginBottom: 24
  } as React.CSSProperties,

  meta: {
    marginBottom: 24
  } as React.CSSProperties,

  metaCompany: {
    fontSize: 20,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 4px",
    letterSpacing: "-0.02em"
  } as React.CSSProperties,

  metaPeriod: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    margin: 0
  } as React.CSSProperties,

  question: {
    fontSize: 16,
    fontWeight: 500,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 1.5,
    margin: "0 0 20px",
    letterSpacing: "-0.01em"
  } as React.CSSProperties,

  scaleLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8
  } as React.CSSProperties,

  scaleLabelLeft: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: "0.02em"
  } as React.CSSProperties,

  scaleLabelRight: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: "0.02em"
  } as React.CSSProperties,

  scoreRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap" as const
  } as React.CSSProperties,

  scoreBtn: {
    flex: "1 1 0",
    minWidth: 36,
    height: 44,
    borderRadius: 10,
    fontSize: 15,
    cursor: "pointer",
    transition: "all 0.15s ease",
    outline: "none"
  } as React.CSSProperties,

  scoreFeedback: {
    marginTop: 10,
    height: 20,
    display: "flex",
    alignItems: "center"
  } as React.CSSProperties,

  label: {
    display: "block",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 8,
    fontWeight: 500
  } as React.CSSProperties,

  textarea: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    color: "#fff",
    resize: "vertical" as const,
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.5,
    boxSizing: "border-box" as const
  } as React.CSSProperties,

  errorMsg: {
    marginTop: 14,
    fontSize: 13,
    color: "#f87171",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: 8,
    padding: "10px 14px"
  } as React.CSSProperties,

  submitBtn: {
    marginTop: 20,
    width: "100%",
    height: 48,
    background: "#c8f135",
    color: "#000",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    transition: "opacity 0.15s ease"
  } as React.CSSProperties,

  footer: {
    marginTop: 16,
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center" as const
  } as React.CSSProperties,

  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 16px",
    letterSpacing: "-0.02em"
  } as React.CSSProperties,

  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.6,
    margin: 0
  } as React.CSSProperties,

  successIcon: {
    width: 64,
    height: 64,
    background: "rgba(200,241,53,0.1)",
    border: "1px solid rgba(200,241,53,0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px"
  } as React.CSSProperties
};
