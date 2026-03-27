"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { saveSession } from "../../../../lib/auth/session";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalMeetingsWithRefresh,
  loadPortalSurveysWithRefresh,
  submitPortalSurveyResponsesWithRefresh,
  type PortalMeeting,
  type PortalSurvey,
} from "../../../../lib/api/portal";

const FB_DIMS = ["Communication", "Team Speed", "Quality", "Value", "Transparency"] as const;
type FBDim = typeof FB_DIMS[number];

const MOODS = [
  { rating: 1, emoji: "😞", label: "Unhappy" },
  { rating: 2, emoji: "😐", label: "Flat" },
  { rating: 3, emoji: "🙂", label: "Okay" },
  { rating: 4, emoji: "😊", label: "Happy" },
  { rating: 5, emoji: "🤩", label: "Thrilled" },
] as const;

type Step = 0 | 1 | "done";

const NEUTRAL_SLIDERS: Record<FBDim, number> = {
  Communication: 5,
  "Team Speed": 5,
  Quality: 5,
  Value: 5,
  Transparency: 5,
};

const N5 = FB_DIMS.length;
const CX5 = 80;
const CY5 = 80;
const R5_MAX = 58;

function fbPt(index: number, value: number): [number, number] {
  const angle = (Math.PI * 2 * index) / N5 - Math.PI / 2;
  const radius = (value / 10) * R5_MAX;
  return [CX5 + radius * Math.cos(angle), CY5 + radius * Math.sin(angle)];
}

function fbRingPts(value: number): string {
  return Array.from({ length: N5 }, (_, index) => {
    const [x, y] = fbPt(index, value);
    return `${x},${y}`;
  }).join(" ");
}

function formatPeriod(start: string, end: string): string {
  return `${new Date(start).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} - ${new Date(end).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`;
}

function formatMood(score: number | null): { emoji: string; tone: string; label: string } {
  if (score === null) return { emoji: "—", tone: "badgeMuted", label: "No rating" };
  if (score >= 8) return { emoji: "🤩", tone: "badgeGreen", label: "Strong" };
  if (score >= 6) return { emoji: "😊", tone: "badgeAccent", label: "Positive" };
  if (score >= 4) return { emoji: "🙂", tone: "badgeAmber", label: "Mixed" };
  return { emoji: "😐", tone: "badgeRed", label: "Low" };
}

function mapSurveyRow(survey: PortalSurvey) {
  const score = survey.csatScore ?? survey.npsScore;
  const mood = formatMood(score);
  return {
    id: survey.id,
    period: formatPeriod(survey.periodStart, survey.periodEnd),
    date: survey.completedAt
      ? new Date(survey.completedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
      : "—",
    score,
    mood,
    status: survey.status,
  };
}

export function FeedbackSurveyPage() {
  const { session } = useProjectLayer();
  const clientId = session?.user.clientId ?? null;

  const [step, setStep] = useState<Step>(0);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [sliders, setSliders] = useState<Record<FBDim, number>>(NEUTRAL_SLIDERS);
  const [comment, setComment] = useState("");
  const [surveys, setSurveys] = useState<PortalSurvey[]>([]);
  const [meetings, setMeetings] = useState<PortalMeeting[]>([]);
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    void Promise.all([
      loadPortalSurveysWithRefresh(session, clientId),
      loadPortalMeetingsWithRefresh(session),
    ]).then(([surveyResult, meetingsResult]) => {
      if (surveyResult.nextSession) saveSession(surveyResult.nextSession);
      if (meetingsResult.nextSession) saveSession(meetingsResult.nextSession);

      if (surveyResult.error) {
        setError(surveyResult.error.message ?? "Failed to load feedback data.");
        return;
      }
      if (meetingsResult.error) {
        setError(meetingsResult.error.message ?? "Failed to load feedback data.");
        return;
      }

      const surveyRows = surveyResult.data ?? [];
      const pendingSurvey = surveyRows.find((survey) => survey.status === "PENDING") ?? null;

      setSurveys(surveyRows);
      setMeetings(meetingsResult.data ?? []);
      setActiveSurveyId(pendingSurvey?.id ?? null);
      setStep(pendingSurvey ? 0 : "done");
    }).finally(() => setLoading(false));
  }, [session, clientId]);

  const pendingSurvey = useMemo(
    () => surveys.find((survey) => survey.id === activeSurveyId) ?? null,
    [surveys, activeSurveyId]
  );

  const completedSurveys = useMemo(
    () => surveys.filter((survey) => survey.status === "COMPLETED").map(mapSurveyRow),
    [surveys]
  );

  const ratedMeetings = useMemo(
    () => meetings.filter((meeting) => meeting.clientMoodRating !== null),
    [meetings]
  );

  const averageMeetingMood = useMemo(() => {
    if (!ratedMeetings.length) return null;
    return ratedMeetings.reduce((sum, meeting) => sum + (meeting.clientMoodRating ?? 0), 0) / ratedMeetings.length;
  }, [ratedMeetings]);

  const latestMeetingMood = ratedMeetings[0]?.clientMoodRating ?? null;
  const avgScore = Math.round((Object.values(sliders).reduce((a, b) => a + b, 0) / N5) * 10) / 10;
  const derivedCsat = Math.max(1, Math.min(10, Math.round(avgScore)));
  const moodMeta = formatMood(selectedMood ? selectedMood * 2 : null);
  const meetingMoodMeta = formatMood(averageMeetingMood ? averageMeetingMood * 2 : null);
  const dataPoints = FB_DIMS.map((dim, index) => fbPt(index, sliders[dim]));
  const polygonStr = dataPoints.map(([x, y]) => `${x},${y}`).join(" ");
  const canSubmit = !!session && !!clientId && !!activeSurveyId && selectedMood !== null && !submitting;

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
          <div className={cx("errorStateTitle")}>Failed to load feedback</div>
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
          <p className={cx("pageSub", "mb16")}>Share live project sentiment using actual survey windows and meeting pulse data.</p>
        </div>
      </div>

      <div className={cx("grid3", "mb16")}>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Pending survey</div>
          <div className={cx("text18", "fw800", pendingSurvey ? "colorAccent" : "colorMuted")}>
            {pendingSurvey ? "Open" : "None"}
          </div>
          <div className={cx("text12", "colorMuted")}>
            {pendingSurvey ? formatPeriod(pendingSurvey.periodStart, pendingSurvey.periodEnd) : "No active feedback survey right now"}
          </div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Completed surveys</div>
          <div className={cx("text18", "fw800", "colorBlue")}>{completedSurveys.length}</div>
          <div className={cx("text12", "colorMuted")}>Only completed backend survey records are counted here</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Meeting pulse</div>
          <div className={cx("text18", "fw800", averageMeetingMood ? "colorSuccess" : "colorMuted")}>
            {averageMeetingMood ? `${averageMeetingMood.toFixed(1)} / 5` : "—"}
          </div>
          <div className={cx("text12", "colorMuted")}>Average of actual meeting mood ratings already captured</div>
        </div>
      </div>

      {pendingSurvey ? (
        <div className={cx("card", "mb20")}>
          <div className={cx("cardHd")}>
            <span className={cx("cardHdTitle")}>Active Survey</span>
            <span className={cx("badge", step === "done" ? "badgeGreen" : "badgeAmber", "mlAuto")}>
              {step === "done" ? "Submitted" : "Pending"}
            </span>
          </div>

          <div className={cx("cardBodyPad", "pb0")}>
            <div className={cx("grid2", "mb20")}>
              <div className={cx("cardS2", "p12", "flexCol", "gap6")}>
                <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Survey window</div>
                <div className={cx("text14", "fw700")}>{formatPeriod(pendingSurvey.periodStart, pendingSurvey.periodEnd)}</div>
                <div className={cx("text12", "colorMuted")}>Responses post into the live survey record attached to your account.</div>
              </div>
              <div className={cx("cardS2", "p12", "flexCol", "gap6")}>
                <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Latest meeting mood</div>
                <div className={cx("text14", "fw700")}>
                  {latestMeetingMood ? `${latestMeetingMood} / 5` : "No meeting rating yet"}
                </div>
                <div className={cx("text12", "colorMuted")}>Useful context if you want your survey response to reflect recent delivery sessions.</div>
              </div>
            </div>

            {step !== "done" && (
              <div className={cx("p12x16x0", "flexRow", "mb12")}>
                {[0, 1].map((current) => {
                  const done = (step as number) > current;
                  const active = step === current;
                  return (
                    <div key={current} className={cx("flexRow", "flexCenter", current < 1 ? "flex1" : undefined)}>
                      <div
                        className={cx("stepCircle26")}
                        style={{
                          "--bg-color": done ? "var(--lime)" : active ? "color-mix(in oklab, var(--lime) 20%, transparent)" : "var(--s3)",
                          "--border-color": done ? "var(--lime)" : active ? "var(--lime)" : "var(--b2)",
                          "--color": done ? "var(--bg)" : active ? "var(--lime)" : "var(--muted2)",
                        } as React.CSSProperties}
                      >
                        {done ? "✓" : current + 1}
                      </div>
                      {current < 1 && (
                        <div
                          className={cx("stepConnectorH2", "dynBgColor", "mx6")}
                          style={{ "--bg-color": done ? "var(--lime)" : "var(--b1)" } as React.CSSProperties}
                        />
                      )}
                    </div>
                  );
                })}
                <span className={cx("text10", "colorMuted", "ml12", "noWrap")}>
                  {step === 0 ? "Overall mood" : "Dimension ratings"}
                </span>
              </div>
            )}
          </div>

          {step === 0 && (
            <div className={cx("cardBodyPad")}>
              <div className={cx("text12", "colorMuted", "mb20", "textCenter")}>
                How are you feeling about the project right now?
              </div>
              <div className={cx("flexRow", "justifyCenter", "gap16", "mb24", "flexWrap")}>
                {MOODS.map((mood) => {
                  const active = selectedMood === mood.rating;
                  return (
                    <button
                      key={mood.rating}
                      type="button"
                      onClick={() => setSelectedMood(mood.rating)}
                      className={cx("fbMoodBtn", active && "fbMoodBtnActive")}
                    >
                      <span className={cx("fs2p25rem", "lineH1")}>{mood.emoji}</span>
                      <span className={cx("text10", active ? "fw700" : "fw400", active ? "colorAccent" : "colorMuted2")}>
                        {mood.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className={cx("textCenter")}>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  disabled={selectedMood === null}
                  onClick={() => setStep(1)}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className={cx("cardBodyPad")}>
              <div className={cx("text12", "colorMuted", "mb20")}>
                Rate each dimension from 1 to 10. These scores are submitted into the live survey record, not local placeholder state.
              </div>

              <div className={cx("flexRow", "gap28", "flexWrap", "flexAlignStart")}>
                <div className={cx("flex1", "minW220", "flexCol", "gap16")}>
                  {FB_DIMS.map((dim) => (
                    <div key={dim}>
                      <div className={cx("flexBetween", "mb6")}>
                        <span className={cx("fw600", "text12")}>{dim}</span>
                        <span
                          className={cx("fw700", "text12", "dynColor")}
                          style={{ "--color": sliders[dim] >= 8 ? "var(--lime)" : sliders[dim] >= 5 ? "var(--amber)" : "var(--red)" } as React.CSSProperties}
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
                        onChange={(e) => setSliders((current) => ({ ...current, [dim]: Number(e.target.value) }))}
                        className={cx("wFull", "accentLime", "cursorPointer")}
                      />
                    </div>
                  ))}
                </div>

                <div className={cx("noShrink", "flexCol", "flexCenter", "gap8")}>
                  <svg width={160} height={160} viewBox="0 0 160 160" className={cx("noShrink")}>
                    {[2.5, 5, 7.5, 10].map((value) => (
                      <polygon key={value} points={fbRingPts(value)} fill="none" stroke="var(--b2)" strokeWidth={1} opacity={0.5} />
                    ))}
                    {FB_DIMS.map((_, index) => {
                      const [x, y] = fbPt(index, 10);
                      return <line key={index} x1={CX5} y1={CY5} x2={x} y2={y} stroke="var(--b2)" strokeWidth={1} opacity={0.4} />;
                    })}
                    <polygon
                      points={polygonStr}
                      fill="color-mix(in oklab, var(--lime) 14%, transparent)"
                      stroke="var(--lime)"
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                      className={cx("transAll")}
                    />
                    {dataPoints.map(([x, y], index) => (
                      <circle key={index} cx={x} cy={y} r={3.5} fill="var(--lime)" stroke="var(--s1)" strokeWidth={1.5} className={cx("transAll")} />
                    ))}
                    {FB_DIMS.map((dim, index) => {
                      const angle = (Math.PI * 2 * index) / N5 - Math.PI / 2;
                      const labelRadius = R5_MAX + 16;
                      const lx = CX5 + labelRadius * Math.cos(angle);
                      const ly = CY5 + labelRadius * Math.sin(angle);
                      return (
                        <text key={dim} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={7} fontWeight={600} fill="var(--muted2)">
                          {dim}
                        </text>
                      );
                    })}
                    <text x={CX5} y={CY5 - 6} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--lime)">{avgScore}</text>
                    <text x={CX5} y={CY5 + 8} textAnchor="middle" fontSize={7} fill="var(--muted2)">/ 10 avg</text>
                  </svg>
                  <span className={cx("text10", "colorMuted")}>Live survey radar</span>
                </div>
              </div>

              <div className={cx("mt20", "mb16")}>
                <div className={cx("fw600", "text12", "mb6")}>Additional context</div>
                <textarea
                  className={cx("textarea", "resizeV")}
                  rows={3}
                  placeholder="Share blockers, concerns, or what is working especially well..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {submitError && (
                <div className={cx("alert", "alertError", "mb12")}>{submitError}</div>
              )}

              <div className={cx("flexRow", "gap8")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setStep(0)} disabled={submitting}>
                  Back
                </button>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  disabled={!canSubmit}
                  onClick={async () => {
                    if (!session || !clientId || !activeSurveyId || selectedMood === null) return;
                    setSubmitting(true);
                    setSubmitError(null);

                    const result = await submitPortalSurveyResponsesWithRefresh(session, clientId, activeSurveyId, {
                      responses: [
                        { question: "Overall Mood", answer: String(selectedMood) },
                        ...FB_DIMS.map((dim) => ({ question: dim, answer: String(sliders[dim]) })),
                        ...(comment.trim() ? [{ question: "Comment", answer: comment.trim() }] : []),
                      ],
                      csatScore: derivedCsat,
                    });

                    if (result.nextSession) saveSession(result.nextSession);

                    if (result.error) {
                      setSubmitError(result.error.message ?? "Unable to submit this survey.");
                      setSubmitting(false);
                      return;
                    }

                    setSurveys((current) => current.map((survey) => (
                      survey.id === activeSurveyId
                        ? {
                            ...survey,
                            status: "COMPLETED",
                            completedAt: new Date().toISOString(),
                            csatScore: derivedCsat,
                          }
                        : survey
                    )));
                    setStep("done");
                    setSubmitting(false);
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className={cx("cardBodyPad", "textCenter", "p32x24")}>
              <div className={cx("mb12")}><Ic n="star" sz={52} c="var(--lime)" /></div>
              <div className={cx("fw700", "text16", "mb6")}>Feedback submitted</div>
              <div className={cx("text12", "colorMuted", "mb20")}>
                Your response is stored on the active survey record and is now visible in completed survey history.
              </div>
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
              {selectedMood !== null && (
                <div className={cx("text12", "colorMuted")}>
                  Mood: <span className={cx("fs20")}>{moodMeta.emoji}</span> · Recorded CSAT:{" "}
                  <span className={cx("fw700", "colorAccent")}>{derivedCsat}/10</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className={cx("card", "mb20")}>
          <div className={cx("emptyStateGlow", "p32x24")}>
            <div className={cx("emptyStateGlowIcon")}><Ic n="heart" sz={24} c="var(--muted2)" /></div>
            <div className={cx("emptyStateGlowTitle")}>No active mood survey right now</div>
            <div className={cx("emptyStateGlowSub")}>This page only opens a response flow when a real pending survey exists for your account.</div>
          </div>
        </div>
      )}

      <div className={cx("grid2", "mb20")}>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap8")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Meeting pulse summary</div>
          <div className={cx("flexRow", "gap10", "alignCenter")}>
            <span className={cx("text24")}>{meetingMoodMeta.emoji}</span>
            <div className={cx("text14", "fw700")}>
              {averageMeetingMood ? `${averageMeetingMood.toFixed(1)} / 5 average mood` : "No meeting mood ratings yet"}
            </div>
          </div>
          <div className={cx("text12", "colorMuted")}>
            Based on {ratedMeetings.length} meeting {ratedMeetings.length === 1 ? "rating" : "ratings"} captured in the meeting archive.
          </div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap8")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Survey history integrity</div>
          <div className={cx("text14", "fw700")}>Completed records only</div>
          <div className={cx("text12", "colorMuted")}>
            The history below is built only from surveys whose backend status is `COMPLETED`. There are no fabricated rows or placeholder periods.
          </div>
        </div>
      </div>

      <div className={cx("card")}>
        <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Past Surveys</span></div>
        <div className={cx("listGroup")}>
          {completedSurveys.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="star" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No completed surveys yet</div>
              <div className={cx("emptyStateSub")}>Completed survey submissions will appear here automatically once a real survey has been filed.</div>
            </div>
          ) : completedSurveys.map((survey) => (
            <div key={survey.id} className={cx("listRow", "flexBetween")}>
              <div className={cx("flexRow", "gap12")}>
                <span className={cx("text24")}>{survey.mood.emoji}</span>
                <div>
                  <div className={cx("fw600", "text12")}>{survey.period}</div>
                  <div className={cx("text10", "colorMuted")}>Submitted {survey.date}</div>
                </div>
              </div>
              <div className={cx("flexRow", "flexCenter", "gap8")}>
                <span className={cx("fw700", "text16", "colorAccent")}>{survey.score ?? "—"} / 10</span>
                <span className={cx("badge", survey.mood.tone)}>{survey.mood.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
