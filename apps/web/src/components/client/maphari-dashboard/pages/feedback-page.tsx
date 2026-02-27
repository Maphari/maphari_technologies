"use client";

import { useState } from "react";
import { cx, styles } from "../style";

/* ── Types ──────────────────────────────────────────────────────────────── */

type Survey = {
  id: string;
  title: string;
  project: string;
  milestone?: string;
  status: "active" | "completed";
  rating: number | null;
  comment: string;
  submittedAt: string | null;
};

type SatisfactionEntry = {
  month: string;
  score: number;
};

type NpsData = {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
};

type Testimonial = {
  id: string;
  text: string;
  date: string;
  isPublic: boolean;
};

type FeedbackTab = "Surveys" | "Satisfaction" | "Testimonials";

/* ── Seed data ──────────────────────────────────────────────────────────── */

const INITIAL_SURVEYS: Survey[] = [
  {
    id: "srv-1",
    title: "Mid-Project Check-In",
    project: "Client Portal v2",
    milestone: "Sprint 3 Delivery",
    status: "active",
    rating: null,
    comment: "",
    submittedAt: null,
  },
  {
    id: "srv-2",
    title: "Design Review Feedback",
    project: "Lead Pipeline Rebuild",
    milestone: "Wireframes v2",
    status: "active",
    rating: null,
    comment: "",
    submittedAt: null,
  },
  {
    id: "srv-3",
    title: "Onboarding Experience",
    project: "Automation Suite",
    status: "active",
    rating: null,
    comment: "",
    submittedAt: null,
  },
  {
    id: "srv-4",
    title: "Sprint 1 Retrospective",
    project: "Client Portal v2",
    milestone: "Sprint 1 Delivery",
    status: "completed",
    rating: 5,
    comment: "Excellent communication and timely delivery. The team exceeded expectations on every milestone.",
    submittedAt: "Jan 22, 2026",
  },
  {
    id: "srv-5",
    title: "Initial Kickoff Survey",
    project: "Lead Pipeline Rebuild",
    status: "completed",
    rating: 4,
    comment: "Great kickoff session. Clear goals and well-structured plan. Minor delay on document sharing.",
    submittedAt: "Jan 10, 2026",
  },
];

const SATISFACTION_DATA: SatisfactionEntry[] = [
  { month: "Sep", score: 74 },
  { month: "Oct", score: 78 },
  { month: "Nov", score: 82 },
  { month: "Dec", score: 80 },
  { month: "Jan", score: 86 },
  { month: "Feb", score: 89 },
];

const NPS: NpsData = {
  score: 72,
  promoters: 58,
  passives: 24,
  detractors: 18,
  total: 100,
};

const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    text: "Maphari transformed our entire client experience. Their attention to detail and proactive communication made the engagement seamless from start to finish.",
    date: "Feb 12, 2026",
    isPublic: true,
  },
  {
    id: "test-2",
    text: "The team delivered ahead of schedule and the quality of the portal exceeded our expectations. Highly recommend for any digital product work.",
    date: "Jan 28, 2026",
    isPublic: true,
  },
  {
    id: "test-3",
    text: "Professional, responsive, and technically excellent. The Lead Pipeline rebuild has already improved our conversion rates by 34%.",
    date: "Jan 15, 2026",
    isPublic: false,
  },
];

/* ── Helpers ────────────────────────────────────────────────────────────── */

function getNpsCategory(score: number): { label: string; cls: string } {
  if (score >= 50) return { label: "Promoter", cls: "npsCategoryPromoter" };
  if (score >= 0) return { label: "Passive", cls: "npsCategoryPassive" };
  return { label: "Detractor", cls: "npsCategoryDetractor" };
}

function buildPolylinePoints(
  data: SatisfactionEntry[],
  width: number,
  height: number,
  padX: number,
  padY: number
): string {
  const minScore = Math.min(...data.map((d) => d.score)) - 5;
  const maxScore = Math.max(...data.map((d) => d.score)) + 5;
  const range = maxScore - minScore || 1;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  return data
    .map((d, i) => {
      const x = padX + (i / (data.length - 1)) * usableW;
      const y = padY + usableH - ((d.score - minScore) / range) * usableH;
      return `${x},${y}`;
    })
    .join(" ");
}

/* ── Star Rating ────────────────────────────────────────────────────────── */

function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number | null;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={cx("star", (value ?? 0) >= star && "starActive", hover >= star && "starActive")}
          style={readOnly ? { cursor: "default", pointerEvents: "none" } : undefined}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function ClientFeedbackPage({ active }: { active: boolean }) {
  const [activeTab, setActiveTab] = useState<FeedbackTab>("Surveys");
  const [surveys, setSurveys] = useState<Survey[]>(INITIAL_SURVEYS);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [newTestimonial, setNewTestimonial] = useState("");
  const [testimonialPublic, setTestimonialPublic] = useState(false);
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);

  const activeSurveys = surveys.filter((s) => s.status === "active");
  const completedSurveys = surveys.filter((s) => s.status === "completed");

  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3200);
  };

  const updateSurveyRating = (id: string, rating: number) => {
    setSurveys((prev) =>
      prev.map((s) => (s.id === id ? { ...s, rating } : s))
    );
  };

  const updateSurveyComment = (id: string, comment: string) => {
    setSurveys((prev) =>
      prev.map((s) => (s.id === id ? { ...s, comment } : s))
    );
  };

  const submitSurvey = (id: string) => {
    setSurveys((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "completed" as const,
              submittedAt: new Date().toLocaleDateString("en-ZA", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              }),
            }
          : s
      )
    );
    showToast("Survey submitted", "Thank you for your feedback");
  };

  const submitTestimonial = () => {
    if (!newTestimonial.trim()) return;
    const item: Testimonial = {
      id: `test-${Date.now()}`,
      text: newTestimonial.trim(),
      date: new Date().toLocaleDateString("en-ZA", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      isPublic: testimonialPublic,
    };
    setTestimonials((prev) => [item, ...prev]);
    setNewTestimonial("");
    setTestimonialPublic(false);
    showToast("Testimonial submitted", "Your feedback has been recorded");
  };

  /* ── Satisfaction chart dimensions ────────────────────── */
  const chartW = 480;
  const chartH = 140;
  const padX = 40;
  const padY = 16;
  const polyline = buildPolylinePoints(SATISFACTION_DATA, chartW, chartH, padX, padY);
  const npsCategory = getNpsCategory(NPS.score);

  const tabs: FeedbackTab[] = ["Surveys", "Satisfaction", "Testimonials"];

  return (
    <section className={cx("page", active && "pageActive")} id="page-feedback">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Account</div>
          <div className={styles.pageTitle}>Feedback</div>
          <div className={styles.pageSub}>
            Share your experience through surveys, track satisfaction trends, and submit testimonials.
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={cx("badge", "badgeAccent")}>
            {activeSurveys.length} active
          </span>
          <span className={cx("badge", "badgeMuted")}>
            {completedSurveys.length} completed
          </span>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className={styles.filterBar} style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={cx("filterTab", activeTab === tab && "filterTabActive")}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Surveys tab ──────────────────────────────────────── */}
      {activeTab === "Surveys" ? (
        <div className={styles.pageBody}>
          {/* Active surveys */}
          {activeSurveys.length > 0 ? (
            <div style={{ marginBottom: 28 }}>
              <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>
                Active Surveys
              </div>
              {activeSurveys.map((survey, i) => (
                <div
                  key={survey.id}
                  className={styles.surveyCard}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <div className={styles.surveyCardHeader}>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                        {survey.title}
                      </div>
                      <div style={{ fontSize: "0.64rem", color: "var(--muted)", marginTop: 2 }}>
                        {survey.project}
                        {survey.milestone ? ` \u00b7 ${survey.milestone}` : ""}
                      </div>
                    </div>
                    <span className={cx("badge", "badgeAmber")}>Pending</span>
                  </div>

                  <div className={styles.ratingSection}>
                    <div className={styles.ratingLabel}>How would you rate this experience?</div>
                    <div className={styles.ratingHint}>Click a star to rate</div>
                    <StarRating
                      value={survey.rating}
                      onChange={(v) => updateSurveyRating(survey.id, v)}
                    />
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <label className={styles.formLabel}>Additional Comments</label>
                    <textarea
                      className={styles.formTextarea}
                      rows={3}
                      placeholder="Share your thoughts on this milestone or project phase..."
                      value={survey.comment}
                      onChange={(e) => updateSurveyComment(survey.id, e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                    <button
                      type="button"
                      className={cx("button", "buttonAccent")}
                      onClick={() => submitSurvey(survey.id)}
                      disabled={!survey.rating}
                      style={!survey.rating ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                    >
                      Submit Feedback
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState} style={{ padding: "32px 0" }}>
              No active surveys at the moment. Check back after your next milestone.
            </div>
          )}

          {/* Completed surveys */}
          {completedSurveys.length > 0 ? (
            <div>
              <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>
                Completed Surveys
              </div>
              {completedSurveys.map((survey, i) => (
                <div
                  key={survey.id}
                  className={styles.surveyCard}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <div className={styles.surveyCardHeader}>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                        {survey.title}
                      </div>
                      <div style={{ fontSize: "0.64rem", color: "var(--muted)", marginTop: 2 }}>
                        {survey.project}
                        {survey.milestone ? ` \u00b7 ${survey.milestone}` : ""}
                      </div>
                    </div>
                    <span className={cx("badge", "badgeGreen")}>Completed</span>
                  </div>

                  <div className={styles.ratingSection}>
                    <div className={styles.ratingLabel}>Your Rating</div>
                    <StarRating value={survey.rating} readOnly />
                  </div>

                  {survey.comment ? (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: "0.64rem", color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>
                        Your Comment
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text)", lineHeight: 1.6, background: "var(--s2)", padding: "10px 14px", borderRadius: "var(--r-sm)", border: "1px solid var(--b1)" }}>
                        {survey.comment}
                      </div>
                    </div>
                  ) : null}

                  <div style={{ fontSize: "0.58rem", color: "var(--muted)", marginTop: 10 }}>
                    Submitted {survey.submittedAt}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Satisfaction tab ──────────────────────────────────── */}
      {activeTab === "Satisfaction" ? (
        <div className={styles.pageBody}>
          {/* NPS Score */}
          <div className={styles.card} style={{ marginBottom: 20, padding: "24px 28px" }}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Net Promoter Score</div>
                <div className={styles.cardSub}>Based on your engagement feedback across all projects</div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span className={styles.npsScore}>{NPS.score}</span>
                <span className={cx("npsCategory", npsCategory.cls)}>
                  {npsCategory.label}
                </span>
              </div>

              {/* Breakdown bar */}
              <div className={styles.npsBreakdown}>
                <div
                  className={styles.npsBreakdownSeg}
                  style={{
                    width: `${(NPS.promoters / NPS.total) * 100}%`,
                    background: "var(--green)",
                  }}
                />
                <div
                  className={styles.npsBreakdownSeg}
                  style={{
                    width: `${(NPS.passives / NPS.total) * 100}%`,
                    background: "var(--amber)",
                  }}
                />
                <div
                  className={styles.npsBreakdownSeg}
                  style={{
                    width: `${(NPS.detractors / NPS.total) * 100}%`,
                    background: "var(--red)",
                  }}
                />
              </div>

              {/* Score breakdown cards */}
              <div className={styles.statGrid} style={{ marginTop: 16 }}>
                {[
                  { label: "Promoters", value: NPS.promoters, pct: `${NPS.promoters}%`, bar: "statBarGreen" },
                  { label: "Passives", value: NPS.passives, pct: `${NPS.passives}%`, bar: "statBarAmber" },
                  { label: "Detractors", value: NPS.detractors, pct: `${NPS.detractors}%`, bar: "statBarRed" },
                ].map((item) => (
                  <div key={item.label} className={styles.statCard}>
                    <div className={cx("statBar", item.bar)} />
                    <div style={{ fontSize: "0.6rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "var(--font-syne)" }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "var(--muted)" }}>
                      {item.pct} of responses
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Satisfaction Trend Chart */}
          <div className={cx("chartCard")}>
            <div className={styles.chartTitle}>6-Month Satisfaction Trend</div>
            <div className={styles.trendChart}>
              <svg
                className={styles.trendChartSvg}
                viewBox={`0 0 ${chartW} ${chartH}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Grid lines */}
                {[60, 70, 80, 90, 100].map((val) => {
                  const minScore = Math.min(...SATISFACTION_DATA.map((d) => d.score)) - 5;
                  const maxScore = Math.max(...SATISFACTION_DATA.map((d) => d.score)) + 5;
                  const range = maxScore - minScore || 1;
                  const usableH = chartH - padY * 2;
                  const y = padY + usableH - ((val - minScore) / range) * usableH;
                  return (
                    <g key={val}>
                      <line
                        x1={padX}
                        y1={y}
                        x2={chartW - padX}
                        y2={y}
                        stroke="var(--b1)"
                        strokeWidth={1}
                      />
                      <text
                        x={padX - 8}
                        y={y + 3}
                        textAnchor="end"
                        fontSize={9}
                        fill="var(--muted)"
                        fontFamily="var(--font-dm-mono)"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area fill */}
                <polygon
                  points={`${polyline} ${chartW - padX},${chartH - padY} ${padX},${chartH - padY}`}
                  fill="var(--lime-g)"
                />

                {/* Line */}
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Data points and labels */}
                {SATISFACTION_DATA.map((d, i) => {
                  const minScore = Math.min(...SATISFACTION_DATA.map((dd) => dd.score)) - 5;
                  const maxScore = Math.max(...SATISFACTION_DATA.map((dd) => dd.score)) + 5;
                  const range = maxScore - minScore || 1;
                  const usableW = chartW - padX * 2;
                  const usableH = chartH - padY * 2;
                  const x = padX + (i / (SATISFACTION_DATA.length - 1)) * usableW;
                  const y = padY + usableH - ((d.score - minScore) / range) * usableH;
                  return (
                    <g key={d.month}>
                      <circle cx={x} cy={y} r={4} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} />
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight={700}
                        fill="var(--text)"
                        fontFamily="var(--font-dm-mono)"
                      >
                        {d.score}
                      </text>
                      <text
                        x={x}
                        y={chartH - 2}
                        textAnchor="middle"
                        fontSize={9}
                        fill="var(--muted)"
                        fontFamily="var(--font-dm-mono)"
                      >
                        {d.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Testimonials tab ─────────────────────────────────── */}
      {activeTab === "Testimonials" ? (
        <div className={styles.pageBody}>
          {/* Submission form */}
          <div className={styles.card} style={{ marginBottom: 24, padding: "20px 24px" }}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Submit a Testimonial</div>
                <div className={styles.cardSub}>
                  Share your experience working with Maphari. Your words help us improve and inspire other clients.
                </div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Your Testimonial</label>
                <textarea
                  className={styles.formTextarea}
                  rows={4}
                  placeholder="Tell us about your experience..."
                  value={newTestimonial}
                  onChange={(e) => setNewTestimonial(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    className={cx("toggle", testimonialPublic && "toggleOn")}
                    onClick={() => setTestimonialPublic(!testimonialPublic)}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    Allow public use
                  </span>
                </div>
                <button
                  type="button"
                  className={cx("button", "buttonAccent")}
                  onClick={submitTestimonial}
                  disabled={!newTestimonial.trim()}
                  style={!newTestimonial.trim() ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                >
                  Submit Testimonial
                </button>
              </div>
            </div>
          </div>

          {/* Previous testimonials */}
          <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>
            Previous Testimonials
          </div>
          {testimonials.length === 0 ? (
            <div className={styles.emptyState}>
              No testimonials submitted yet. Be the first to share your experience.
            </div>
          ) : (
            testimonials.map((t, i) => (
              <div
                key={t.id}
                className={styles.testimonialCard}
                style={{ "--i": i } as React.CSSProperties}
              >
                <div className={styles.testimonialText}>
                  &ldquo;{t.text}&rdquo;
                </div>
                <div className={styles.testimonialMeta}>
                  <span>{t.date}</span>
                  <span style={{ width: 1, height: 10, background: "var(--b1)" }} />
                  {t.isPublic ? (
                    <span className={cx("badge", "badgeGreen")} style={{ fontSize: "0.52rem" }}>
                      Public
                    </span>
                  ) : (
                    <span className={cx("badge", "badgeMuted")} style={{ fontSize: "0.52rem" }}>
                      Private
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* ── Toast ────────────────────────────────────────────── */}
      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            background: "var(--surface)",
            border: "1px solid var(--accent)",
            padding: "14px 20px",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "slideUp var(--dur-normal, 250ms) var(--ease-out, cubic-bezier(0.23,1,0.32,1))",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              background: "var(--accent)",
              color: "var(--on-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 700,
              flexShrink: 0,
              borderRadius: "50%",
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
