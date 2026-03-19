"use client";
import { useState, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { saveSession } from "../../../../lib/auth/session";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalSurveysWithRefresh,
  submitPortalSurveyResponsesWithRefresh,
  type PortalSurvey,
} from "../../../../lib/api/portal";

// ── Feedback dimensions + radar helpers ───────────────────────────────────────
const FB_DIMS = ["Communication", "Team Speed", "Quality", "Value", "Transparency"] as const;
type FBDim = typeof FB_DIMS[number];

const INIT_SLIDERS: Record<FBDim, number> = {
  Communication: 8,
  "Team Speed": 7,
  Quality: 9,
  Value: 8,
  Transparency: 9,
};

const N5 = FB_DIMS.length;
const CX5 = 80;
const CY5 = 80;
const R5_MAX = 58;

function fbPt(i: number, val: number): [number, number] {
  const angle = (Math.PI * 2 * i) / N5 - Math.PI / 2;
  const r = (val / 10) * R5_MAX;
  return [CX5 + r * Math.cos(angle), CY5 + r * Math.sin(angle)];
}

function fbRingPts(pct: number): string {
  return Array.from({ length: N5 }, (_, i) => {
    const [x, y] = fbPt(i, pct * 10);
    return `${x},${y}`;
  }).join(" ");
}

// ── Emoji mood dial ───────────────────────────────────────────────────────────
const MOODS = [
  { emoji: "😞", label: "Unhappy" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "🙂", label: "Okay" },
  { emoji: "😊", label: "Happy" },
  { emoji: "🤩", label: "Thrilled" },
];

type PastSurveyRow = { period: string; date: string; mood: string; avgScore: number; tone: string };

function mapSurveyRow(s: PortalSurvey): PastSurveyRow {
  const score = s.csatScore ?? s.npsScore ?? 0;
  return {
    period: `${new Date(s.periodStart).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })} – ${new Date(s.periodEnd).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}`,
    date:   s.completedAt ? new Date(s.completedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—",
    mood:   score >= 8 ? "😊" : score >= 6 ? "🙂" : "😐",
    avgScore: score,
    tone:   score >= 8 ? "badgeGreen" : score >= 6 ? "badgeAccent" : "badgeAmber",
  };
}

type Step = 0 | 1 | 2 | "done";

export function FeedbackSurveyPage() {
  const { session } = useProjectLayer();
  const clientId = session?.user.clientId ?? null;
  const [step, setStep] = useState<Step>(0);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [sliders, setSliders] = useState<Record<FBDim, number>>(INIT_SLIDERS);
  const [comment, setComment] = useState("");
  const [pastSurveys, setPastSurveys] = useState<PastSurveyRow[]>([]);
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!session || !clientId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadPortalSurveysWithRefresh(session, clientId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message ?? "Failed to load."); setLoading(false); return; }
      if (r.data) {
        const completed = r.data.filter(s => s.status === "COMPLETED");
        const pending   = r.data.find(s => s.status === "PENDING");
        setPastSurveys(completed.map(mapSurveyRow));
        if (pending) setActiveSurveyId(pending.id);
      }
      setLoading(false);
    });
  }, [session, clientId]);

  const avgScore = Math.round((Object.values(sliders).reduce((a, b) => a + b, 0) / N5) * 10) / 10;

  const dataPoints = FB_DIMS.map((dim, i) => fbPt(i, sliders[dim]));
  const polygonStr = dataPoints.map(([x, y]) => `${x},${y}`).join(" ");

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

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Account · Feedback</div>
          <h1 className={cx("pageTitle")}>Project Mood Ring</h1>
          <p className={cx("pageSub")}>
            Share how you feel about the project — your feedback shapes how Maphari works with you.
          </p>
        </div>
      </div>

      {/* ── Active survey card ────────────────────────────────────────────────── */}
      <div className={cx("card", "mb20")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>Sprint 5 Mid-Point Survey</span>
          {step !== "done" && <span className={cx("badge", "badgeAmber", "mlAuto")}>Pending</span>}
          {step === "done" && <span className={cx("badge", "badgeGreen", "mlAuto")}>Submitted ✓</span>}
        </div>

        {/* Step indicator */}
        {step !== "done" && (
          <div className={cx("p12x16x0", "flexRow", "mb4")}>
            {[0, 1, 2].map((s) => {
              const done = (step as number) > s;
              const active = step === s;
              return (
                <div key={s} className={cx("flexRow", "flexCenter", s < 2 ? "flex1" : undefined)}>
                  <div
                    className={cx("stepCircle26")}
                    style={{ "--bg-color": done ? "var(--lime)" : active ? "color-mix(in oklab, var(--lime) 20%, transparent)" : "var(--s3)", "--border-color": done ? "var(--lime)" : active ? "var(--lime)" : "var(--b2)", "--color": done ? "var(--bg)" : active ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}
                  >
                    {done ? "✓" : s + 1}
                  </div>
                  {s < 2 && (
                    <div
                      className={cx("stepConnectorH2", "dynBgColor", "mx6")}
                      style={{ "--bg-color": done ? "var(--lime)" : "var(--b1)" } as React.CSSProperties}
                    />
                  )}
                </div>
              );
            })}
            <span className={cx("text10", "colorMuted", "ml12", "noWrap")}>
              {step === 0 ? "How do you feel?" : step === 1 ? "Rate each dimension" : "All done!"}
            </span>
          </div>
        )}

        {/* ── Step 0: Mood Dial ──────────────────────────────────────────────── */}
        {step === 0 && (
          <div className={cx("cardBodyPad")}>
            <div className={cx("text12", "colorMuted", "mb20", "textCenter")}>
              How are you feeling about the project overall?
            </div>
            <div className={cx("flexRow", "justifyCenter", "gap16", "mb24", "flexWrap")}>
              {MOODS.map((m) => {
                const active = selectedMood === m.emoji;
                return (
                  <button
                    key={m.emoji}
                    type="button"
                    onClick={() => setSelectedMood(m.emoji)}
                    className={cx("fbMoodBtn", active && "fbMoodBtnActive")}
                  >
                    <span className={cx("fs2p25rem", "lineH1")}>{m.emoji}</span>
                    <span className={cx("text10", active ? "fw700" : "fw400", active ? "colorAccent" : "colorMuted2")}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={cx("textCenter")}>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                disabled={!selectedMood}
                onClick={() => setStep(1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Sliders + Live Radar ──────────────────────────────────── */}
        {step === 1 && (
          <div className={cx("cardBodyPad")}>
            <div className={cx("text12", "colorMuted", "mb20")}>
              Rate each dimension from 1 (poor) to 10 (excellent). Watch your radar update live.
            </div>
            <div className={cx("flexRow", "gap28", "flexWrap", "flexAlignStart")}>
              {/* Sliders */}
              <div className={cx("flex1", "minW220", "flexCol", "gap16")}>
                {FB_DIMS.map((dim) => (
                  <div key={dim}>
                    <div className={cx("flexBetween", "mb6")}>
                      <span className={cx("fw600", "text12")}>{dim}</span>
                      <span
                        className={cx("fw700", "text12", "dynColor")} style={{ "--color": sliders[dim] >= 8 ? "var(--lime)" : sliders[dim] >= 5 ? "var(--amber)" : "var(--red)", } as React.CSSProperties}
                      >
                        {sliders[dim]}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={sliders[dim]}
                      onChange={(e) => setSliders((p) => ({ ...p, [dim]: Number(e.target.value) }))}
                      className={cx("wFull", "accentLime", "cursorPointer")}
                    />
                  </div>
                ))}
              </div>

              {/* Live SVG radar */}
              <div className={cx("noShrink", "flexCol", "flexCenter", "gap8")}>
                <svg width={160} height={160} viewBox="0 0 160 160" className={cx("noShrink")}>
                  {/* Ring guides at 25%, 50%, 75%, 100% */}
                  {[2.5, 5, 7.5, 10].map((v) => (
                    <polygon key={v} points={fbRingPts(v / 10)} fill="none" stroke="var(--b2)" strokeWidth={1} opacity={0.5} />
                  ))}
                  {/* Axis lines */}
                  {FB_DIMS.map((_, i) => {
                    const [x, y] = fbPt(i, 10);
                    return <line key={i} x1={CX5} y1={CY5} x2={x} y2={y} stroke="var(--b2)" strokeWidth={1} opacity={0.4} />;
                  })}
                  {/* Data polygon */}
                  <polygon
                    points={polygonStr}
                    fill="color-mix(in oklab, var(--lime) 14%, transparent)"
                    stroke="var(--lime)"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    className={cx("transAll")}
                  />
                  {/* Dots */}
                  {dataPoints.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r={3.5} fill="var(--lime)" stroke="var(--s1)" strokeWidth={1.5} className={cx("transAll")} />
                  ))}
                  {/* Axis labels */}
                  {FB_DIMS.map((dim, i) => {
                    const angle = (Math.PI * 2 * i) / N5 - Math.PI / 2;
                    const lr = R5_MAX + 16;
                    const lx = CX5 + lr * Math.cos(angle);
                    const ly = CY5 + lr * Math.sin(angle);
                    return (
                      <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={7} fontWeight={600} fill="var(--muted2)">
                        {dim}
                      </text>
                    );
                  })}
                  {/* Center avg */}
                  <text x={CX5} y={CY5 - 6} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--lime)">{avgScore}</text>
                  <text x={CX5} y={CY5 + 8} textAnchor="middle" fontSize={7} fill="var(--muted2)">/ 10 avg</text>
                </svg>
                <span className={cx("text10", "colorMuted")}>Live radar</span>
              </div>
            </div>

            {/* Optional comment */}
            <div className={cx("mt20", "mb16")}>
              <div className={cx("fw600", "text12", "mb6")}>Additional comments (optional)</div>
              <textarea
                className={cx("textarea", "resizeV")}
                rows={2}
                placeholder="Anything you'd like us to know..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className={cx("flexRow", "gap8")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setStep(0)}>← Back</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={async () => {
                  if (session && clientId && activeSurveyId) {
                    const r = await submitPortalSurveyResponsesWithRefresh(session, clientId, activeSurveyId, {
                      responses: FB_DIMS.map(dim => ({ question: dim, answer: String(sliders[dim]) })),
                      csatScore: avgScore,
                    });
                    if (r.nextSession) saveSession(r.nextSession);
                  }
                  setStep("done");
                }}
              >Submit →</button>
            </div>
          </div>
        )}

        {/* ── Done state ─────────────────────────────────────────────────────── */}
        {step === "done" && (
          <div className={cx("cardBodyPad", "textCenter", "p32x24")}>
            <div className={cx("mb12")}><Ic n="star" sz={52} c="var(--lime)" /></div>
            <div className={cx("fw700", "text16", "mb6")}>Thank you!</div>
            <div className={cx("text12", "colorMuted", "mb20")}>
              Your feedback has been recorded and shared with your account manager.
            </div>
            {/* Score recap */}
            <div className={cx("flexRow", "gap8", "justifyCenter", "flexWrap", "mb20")}>
              {FB_DIMS.map((dim) => (
                <span
                  key={dim}
                  className={cx("badge", sliders[dim] >= 8 ? "badgeGreen" : sliders[dim] >= 5 ? "badgeAmber" : "badgeRed")}
                >
                  {dim} {sliders[dim]}/10
                </span>
              ))}
            </div>
            {selectedMood && (
              <div className={cx("text12", "colorMuted")}>
                Overall mood: <span className={cx("fs20")}>{selectedMood}</span> · Avg score:{" "}
                <span className={cx("fw700", "colorAccent")}>{avgScore}/10</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Past surveys ──────────────────────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Past Surveys</span></div>
        <div className={cx("listGroup")}>
          {pastSurveys.length === 0 && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="star" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No completed surveys yet</div>
              <div className={cx("emptyStateSub")}>Completed feedback surveys will appear here.</div>
            </div>
          )}
          {pastSurveys.map((s) => (
            <div key={s.period} className={cx("listRow", "flexBetween")}>
              <div className={cx("flexRow", "gap12")}>
                <span className={cx("text24")}>{s.mood}</span>
                <div>
                  <div className={cx("fw600", "text12")}>{s.period}</div>
                  <div className={cx("text10", "colorMuted")}>Submitted {s.date}</div>
                </div>
              </div>
              <div className={cx("flexRow", "flexCenter", "gap8")}>
                <span className={cx("fw700", "text16", "colorAccent")}>{s.avgScore}/10</span>
                <span className={cx("badge", s.tone)}>Submitted</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
