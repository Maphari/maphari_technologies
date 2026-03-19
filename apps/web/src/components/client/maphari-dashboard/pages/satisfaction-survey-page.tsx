// ════════════════════════════════════════════════════════════════════════════
// satisfaction-survey-page.tsx — Client Satisfaction Survey
// Data     : loadPortalSurveysWithRefresh → GET /clients/:id/surveys
//            submitPortalSurveyResponsesWithRefresh → POST /:surveyId/responses
// Mobile   : Cards stack; NPS row wraps
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalSurveysWithRefresh,
  submitPortalSurveyResponsesWithRefresh,
  type PortalSurvey
} from "../../../../lib/api/portal";
import {
  loadPendingNpsWithRefresh,
  submitNpsResponseWithRefresh,
  type PendingNps
} from "../../../../lib/api/portal/feedback";
import { saveSession } from "../../../../lib/auth/session";

// ── Static config ─────────────────────────────────────────────────────────────
const STAR_QUESTIONS = [
  { id: "quality",       label: "Quality of Work",    desc: "How satisfied are you with the quality of deliverables?" },
  { id: "communication", label: "Communication",       desc: "How would you rate the clarity and responsiveness of the team?" },
  { id: "timeliness",   label: "Delivery Timeliness", desc: "How well did the team meet agreed timelines and deadlines?" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function npsColor(n: number) {
  return n >= 9 ? "var(--green)" : n >= 7 ? "var(--amber)" : "var(--red)";
}
function npsLabel(n: number) {
  return n >= 9 ? "Promoter" : n >= 7 ? "Passive" : "Detractor";
}
function starColor(n: number) {
  return n >= 4 ? "var(--lime)" : n >= 3 ? "var(--amber)" : "var(--red)";
}
function formatPeriod(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-ZA", { month: "short", year: "numeric" })} – ${e.toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}`;
}

// ── Stars sub-component ───────────────────────────────────────────────────────
function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className={cx("flexRow", "gap6")} onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          className={cx("ssStarBtn", "dynBgColor")}
          style={{ "--bg-color": n <= display ? `color-mix(in oklab, ${starColor(display)} 14%, transparent)` : "var(--s3)" } as React.CSSProperties}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          <span className={cx(n <= display ? "starFilled" : "starEmpty")} aria-hidden="true">★</span>
        </button>
      ))}
      {value > 0 && (
        <span className={cx("text12", "fw600", "dynColor", "alignSelfCenter", "ml4")} style={{ "--color": starColor(value) } as React.CSSProperties}>
          {value}/5
        </span>
      )}
    </div>
  );
}

// ── NPS score colour helper ───────────────────────────────────────────────────
function npsScoreClass(n: number): string {
  return n >= 9 ? "npsScoreGreen" : n >= 7 ? "npsScoreAmber" : "npsScoreRed";
}

// ── NPS Quick Check sub-component ─────────────────────────────────────────────
function NpsQuickCard({
  item,
  onDone,
  session,
}: {
  item: PendingNps;
  onDone: (milestoneId: string) => void;
  session: ReturnType<typeof useProjectLayer>["session"];
}) {
  const [score,     setScore]     = useState<number | null>(null);
  const [comment,   setComment]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);

  async function handleSubmit() {
    if (score === null || !session) return;
    setSaving(true);
    const result = await submitNpsResponseWithRefresh(session, item.milestoneId, score, comment.trim() || undefined);
    if (result.nextSession) saveSession(result.nextSession);
    setSaving(false);
    setSubmitted(true);
    setTimeout(() => onDone(item.milestoneId), 1600);
  }

  if (submitted) {
    return (
      <div className={cx("npsQuickCard", "npsThanks")}>
        Thanks for your feedback on <em>{item.milestoneTitle}</em>!
      </div>
    );
  }

  return (
    <div className={cx("npsQuickCard")}>
      <div className={cx("flexBetween", "mb8")}>
        <div>
          <div className={cx("fw700", "text14")}>{item.milestoneTitle}</div>
          <div className={cx("text11", "colorMuted")}>{item.projectName}</div>
        </div>
        <span className={cx("badge", "badgeMuted")}>Milestone complete</span>
      </div>
      <div className={cx("text12", "colorMuted", "mb4")}>
        How likely are you to recommend us after this milestone? (0 = not at all · 10 = extremely likely)
      </div>
      <div className={cx("npsScoreRow")} onMouseLeave={() => {}}>
        {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button
            key={n}
            type="button"
            className={cx("npsScoreBtn", score === n && "npsScoreBtnSelected", score === null && npsScoreClass(n))}
            onClick={() => setScore(n)}
            aria-label={`Rate ${n} out of 10`}
          >
            {n}
          </button>
        ))}
      </div>
      {score !== null && (
        <>
          <textarea
            className={cx("input", "wFull", "resizeV", "mt12", "mb12")}
            rows={2}
            placeholder="Any comments? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? "Submitting…" : "Submit"}
          </button>
        </>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SatisfactionSurveyPage() {
  const { session } = useProjectLayer();
  const [surveys, setSurveys] = useState<PortalSurvey[]>([]);

  // NPS Quick Check state
  const [pendingNps, setPendingNps] = useState<PendingNps[]>([]);

  // Form state
  const [nps,       setNps]       = useState(-1);
  const [npsHover,  setNpsHover]  = useState(-1);
  const [stars,     setStars]     = useState<Record<string, number>>({});
  const [comment,   setComment]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void Promise.all([
      loadPortalSurveysWithRefresh(session, session.user.clientId ?? ""),
      loadPendingNpsWithRefresh(session),
    ]).then(([survR, npsR]) => {
      if (survR.nextSession) saveSession(survR.nextSession);
      if (npsR.nextSession)  saveSession(npsR.nextSession);
      if (survR.error) { setError(survR.error.message ?? "Failed to load."); setLoading(false); return; }
      if (survR.data) setSurveys(survR.data);
      if (npsR.data)  setPendingNps(npsR.data);
      setLoading(false);
    });
  }, [session]);

  const pendingSurvey = surveys.find((s) => s.status === "PENDING");
  const completedSurveys = surveys.filter((s) => s.status === "COMPLETED");

  const allAnswered = nps >= 0 && STAR_QUESTIONS.every((q) => (stars[q.id] ?? 0) > 0);
  const displayNps  = npsHover >= 0 ? npsHover : nps;

  async function submit() {
    if (!allAnswered || !session || !pendingSurvey) return;
    setSubmitting(true);

    const responses = [
      ...STAR_QUESTIONS.map((q) => ({ question: q.label, answer: String(stars[q.id] ?? 0) })),
      ...(comment.trim() ? [{ question: "Additional Comments", answer: comment.trim() }] : [])
    ];
    const csatRaw = STAR_QUESTIONS.reduce((sum, q) => sum + (stars[q.id] ?? 0), 0) / STAR_QUESTIONS.length;
    const csatScore = Math.round(csatRaw * 2); // 5-point → 10-point scale

    const result = await submitPortalSurveyResponsesWithRefresh(
      session,
      session.user.clientId ?? "",
      pendingSurvey.id,
      { responses, npsScore: nps, csatScore }
    );

    if (result.nextSession) saveSession(result.nextSession);
    setSubmitting(false);

    if (result.data) {
      setSurveys((prev) => prev.map((s) =>
        s.id === pendingSurvey.id ? { ...s, status: "COMPLETED", npsScore: nps, csatScore } : s
      ));
      setSubmitted(true);
    }
  }

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("pageHeader", "mb0")}>
          <div>
            <div className={cx("pageEyebrow")}>Account · Feedback</div>
            <h1 className={cx("pageTitle")}>Give Feedback</h1>
          </div>
        </div>
        <div className={cx("card", "emptyPad48x24", "textCenter")}>
          <div className={cx("ssSubmitSuccessCircle")}>
            <Ic n="check" sz={24} c="var(--green)" />
          </div>
          <div className={cx("fw700", "ssSubmitSuccessTitle")}>Thank you for your feedback</div>
          <div className={cx("text12", "colorMuted")}>Your responses help us continually improve our service.</div>
          <button type="button" className={cx("btnSm", "btnGhost", "mt20")} onClick={() => { setSubmitted(false); setNps(-1); setStars({}); setComment(""); }}>
            Submit another response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Account · Feedback</div>
          <h1 className={cx("pageTitle")}>Satisfaction Survey</h1>
          <p className={cx("pageSub")}>Your monthly satisfaction survey. Takes under 2 minutes — your feedback directly shapes how we work.</p>
        </div>
      </div>

      {/* Quick NPS Check — pending milestone pulses */}
      {pendingNps.length > 0 && (
        <div className={cx("mb24")}>
          <div className={cx("text11", "colorMuted", "mb12", "fw700", "textUpper", "ls007")}>
            Quick NPS Check
          </div>
          {pendingNps.map((item) => (
            <NpsQuickCard
              key={item.milestoneId}
              item={item}
              session={session}
              onDone={(id) => setPendingNps((prev) => prev.filter((n) => n.milestoneId !== id))}
            />
          ))}
        </div>
      )}

      {!pendingSurvey ? (
        <div className={cx("card")}>
          <div className={cx("cardInner")}>
            <p className={cx("text13", "colorMuted")}>No pending survey at this time. Check back next month!</p>
          </div>
        </div>
      ) : (
        <>
          {/* NPS card */}
          <div className={cx("card", "mb14")}>
            <div className={cx("cardHd")}>
              <span className={cx("cardHdTitle")}>How likely are you to recommend Maphari?</span>
              {nps >= 0 && (
                <span className={cx("badge", nps >= 9 ? "badgeGreen" : nps >= 7 ? "badgeAmber" : "badgeRed", "mlAuto")}>
                  {npsLabel(nps)}
                </span>
              )}
            </div>
            <div className={cx("cardBodyPad")}>
              <div className={cx("text11", "colorMuted", "mb14")}>0 = Not at all likely &nbsp;·&nbsp; 10 = Extremely likely</div>
              <div className={cx("flexRow", "gap6", "flexWrap")} onMouseLeave={() => setNpsHover(-1)}>
                {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNps(n)}
                    onMouseEnter={() => setNpsHover(n)}
                    className={cx("ssNpsBtn", "dynBgColor", "dynBorderColor", "dynColor")}
                  style={{
                    "--bg-color": n === nps ? `color-mix(in oklab, ${npsColor(n)} 18%, transparent)` : n <= displayNps && displayNps >= 0 && n !== nps ? `color-mix(in oklab, ${npsColor(displayNps)} 8%, transparent)` : "var(--s2)",
                    "--border-color": n === nps ? npsColor(n) : n <= displayNps && displayNps >= 0 ? `color-mix(in oklab, ${npsColor(displayNps)} 40%, var(--b2))` : "var(--b2)",
                    "--color": n <= displayNps && displayNps >= 0 ? npsColor(displayNps) : "var(--muted2)",
                    "--fw": n === nps ? 800 : 600,
                  } as React.CSSProperties}
                    aria-label={`Rate ${n} out of 10`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Star rating questions */}
          <div className={cx("flexCol", "gap12", "mb14")}>
            {STAR_QUESTIONS.map((q) => (
              <div key={q.id} className={cx("card")}>
                <div className={cx("cardHd")}>
                  <span className={cx("cardHdTitle")}>{q.label}</span>
                  {(stars[q.id] ?? 0) > 0 && (
                    <span className={cx("badge", stars[q.id] >= 4 ? "badgeGreen" : stars[q.id] >= 3 ? "badgeAmber" : "badgeRed", "mlAuto")}>
                      {stars[q.id]}/5
                    </span>
                  )}
                </div>
                <div className={cx("cardBodyPad")}>
                  <div className={cx("text11", "colorMuted", "mb12")}>{q.desc}</div>
                  <Stars value={stars[q.id] ?? 0} onChange={(n) => setStars((p) => ({ ...p, [q.id]: n }))} />
                </div>
              </div>
            ))}
          </div>

          {/* Comment */}
          <div className={cx("card", "mb14")}>
            <div className={cx("cardHd")}>
              <span className={cx("cardHdTitle")}>Anything else? <span className={cx("colorMuted", "fw400")}>(optional)</span></span>
            </div>
            <div className={cx("cardBodyPad")}>
              <textarea
                className={cx("input", "wFull", "resizeV")}
                rows={3}
                placeholder="Share specific feedback, suggestions, or things we did well..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <div className={cx("flexRow", "gap12")}>
            <button
              type="button"
              className={cx("btnSm", allAnswered ? "btnAccent" : "btnGhost")}
              disabled={!allAnswered || submitting}
              onClick={submit}
            >
              <Ic n="check" sz={12} c={allAnswered ? "var(--bg)" : "var(--muted2)"} />
              {submitting ? "Submitting…" : "Submit Feedback"}
            </button>
            {!allAnswered && (
              <span className={cx("text11", "colorMuted")}>Please answer all required questions to submit.</span>
            )}
          </div>
        </>
      )}

      {/* History */}
      {completedSurveys.length > 0 && (
        <div className={cx("card", "mt24")}>
          <div className={cx("cardHd")}>
            <Ic n="activity" sz={14} c="var(--lime)" />
            <span className={cx("cardHdTitle", "ml8")}>Previous Responses</span>
          </div>
          <div className={cx("overflowHidden")}>
            <div className={cx("ssHistoryRow", "ssBorderB")}>
              {["Period", "NPS", "CSAT", "Status"].map((h) => (
                <div key={h} className={cx("text10", "colorMuted", "fw700", "textUpper", "ls007")}>{h}</div>
              ))}
            </div>
            {completedSurveys.map((s, idx) => (
              <div
                key={s.id}
                className={cx("ssHistoryRow", idx < completedSurveys.length - 1 && "ssBorderB")}
              >
                <div className={cx("fw600", "text12")}>{formatPeriod(s.periodStart, s.periodEnd)}</div>
                <div className={cx("fw700", "text12", "dynColor")} style={{ "--color": s.npsScore != null ? npsColor(s.npsScore) : "var(--muted2)" } as React.CSSProperties}>
                  {s.npsScore != null ? `${s.npsScore}/10` : "—"}
                </div>
                <div className={cx("fw600", "text12", "dynColor")} style={{ "--color": s.csatScore != null ? (s.csatScore >= 7 ? "var(--lime)" : s.csatScore >= 5 ? "var(--amber)" : "var(--red)") : "var(--muted2)" } as React.CSSProperties}>
                  {s.csatScore != null ? `${s.csatScore}/10` : "—"}
                </div>
                <span className={cx("badge", "badgeGreen")}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
