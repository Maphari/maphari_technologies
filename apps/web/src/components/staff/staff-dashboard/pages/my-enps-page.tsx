// ════════════════════════════════════════════════════════════════════════════
// my-enps-page.tsx — Staff eNPS / Pulse Survey
// Data     : loadMyStandupsWithRefresh → GET /standup  (engagement signal)
//            loadMyPeerReviewsWithRefresh → GET /peer-reviews (score signal)
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadMyStandupsWithRefresh,
  loadMyPeerReviewsWithRefresh,
} from "../../../../lib/api/staff";

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function scoreZone(n: number): "promoter" | "passive" | "detractor" {
  if (n >= 9) return "promoter";
  if (n >= 7) return "passive";
  return "detractor";
}

function zoneColor(z: "promoter" | "passive" | "detractor") {
  if (z === "promoter") return "colorGreen";
  if (z === "passive")  return "colorAmber";
  return "colorRed";
}

function zoneDotBg(z: "promoter" | "passive" | "detractor") {
  if (z === "promoter") return "var(--green)";
  if (z === "passive")  return "var(--amber)";
  return "var(--red)";
}

function scoreBtnSelectedCls(n: number, selected: number | null): string | false {
  if (n !== selected) return false;
  const z = scoreZone(n);
  if (z === "promoter") return "enpScoreBtnPromoter";
  if (z === "passive")  return "enpScoreBtnPassive";
  return "enpScoreBtnDetractor";
}

function histScoreCls(score: number) {
  const z = scoreZone(score);
  if (z === "promoter") return "enpHistScorePromoter";
  if (z === "passive")  return "enpHistScorePassive";
  return "enpHistScoreDetractor";
}

function histBarFillCls(score: number) {
  const z = scoreZone(score);
  if (z === "promoter") return "enpHistFillGreen";
  if (z === "passive")  return "enpHistFillAmber";
  return "enpHistFillRed";
}

// Derive a 0-10 engagement score from a peer review score (0-100 scale → 0-10)
function peerScoreToEnps(score: number | null): number {
  if (score === null) return 0;
  return Math.round((score / 100) * 10);
}

// Format a date string to "Month YYYY"
function toMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

export function MyEnpsPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  // Derived from API data
  const [standupCount, setStandupCount]       = useState<number>(0);
  const [reviewScores, setReviewScores]        = useState<Array<{ month: string; score: number }>>([]);
  const [loading, setLoading]                 = useState(false);

  useEffect(() => {
    if (!session || !isActive) return;
    setLoading(true);

    void (async () => {
      const [standupsResult, reviewsResult] = await Promise.all([
        loadMyStandupsWithRefresh(session),
        loadMyPeerReviewsWithRefresh(session),
      ]);

      if (standupsResult.nextSession) saveSession(standupsResult.nextSession);
      if (reviewsResult.nextSession)  saveSession(reviewsResult.nextSession);

      // Count standups this month as engagement signal
      const now    = new Date();
      const thisM  = now.getMonth();
      const thisY  = now.getFullYear();
      const allStandups = standupsResult.data ?? [];
      const monthStandups = allStandups.filter((s) => {
        const d = new Date(s.createdAt);
        return d.getMonth() === thisM && d.getFullYear() === thisY;
      });
      setStandupCount(monthStandups.length);

      // Build review history from submitted peer reviews (reviewer = me, has a score)
      const submitted = (reviewsResult.data ?? [])
        .filter((r) => r.status === "SUBMITTED" && r.score !== null && r.submittedAt !== null)
        .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())
        .slice(0, 6)
        .map((r) => ({
          month: toMonthLabel(r.submittedAt!),
          score: peerScoreToEnps(r.score),
        }));

      setReviewScores(submitted);
      setLoading(false);
    })();
  }, [isActive, session?.accessToken]);

  const latestScore = reviewScores[0]?.score ?? null;
  const latestZone  = latestScore !== null ? scoreZone(latestScore) : "passive";
  const avgScore    = reviewScores.length > 0
    ? (reviewScores.reduce((s, r) => s + r.score, 0) / reviewScores.length).toFixed(1)
    : "—";

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

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-enps">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / HR</div>
        <h1 className={cx("pageTitleText")}>My Feedback (eNPS)</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Submit pulse survey responses and view your feedback history</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("enpStatGrid")}>

        <div className={cx("enpStatCard")}>
          <div className={cx("enpStatCardTop")}>
            <div className={cx("enpStatLabel")}>Latest Score</div>
            <div className={cx("enpStatValue", latestScore !== null ? zoneColor(latestZone) : "colorMuted2")}>
              {latestScore !== null ? latestScore : "—"}
              <span className={cx("enpStatSuffix")}>/10</span>
            </div>
          </div>
          <div className={cx("enpStatCardDivider")} />
          <div className={cx("enpStatCardBottom")}>
            <span className={cx("enpStatDot", "dynBgColor")} style={{ "--bg-color": latestScore !== null ? zoneDotBg(latestZone) : "var(--muted2)" } as React.CSSProperties} />
            <span className={cx("enpStatMeta")}>{reviewScores[0]?.month ?? "No reviews yet"}</span>
          </div>
        </div>

        <div className={cx("enpStatCard")}>
          <div className={cx("enpStatCardTop")}>
            <div className={cx("enpStatLabel")}>Avg Score</div>
            <div className={cx("enpStatValue", "colorAccent")}>
              {avgScore}<span className={cx("enpStatSuffix")}>{reviewScores.length > 0 ? "/10" : ""}</span>
            </div>
          </div>
          <div className={cx("enpStatCardDivider")} />
          <div className={cx("enpStatCardBottom")}>
            <span className={cx("enpStatDot", "dotBgAccent")} />
            <span className={cx("enpStatMeta")}>across all responses</span>
          </div>
        </div>

        <div className={cx("enpStatCard")}>
          <div className={cx("enpStatCardTop")}>
            <div className={cx("enpStatLabel")}>Responses</div>
            <div className={cx("enpStatValue")}>{reviewScores.length}</div>
          </div>
          <div className={cx("enpStatCardDivider")} />
          <div className={cx("enpStatCardBottom")}>
            <span className={cx("enpStatDot", "dotBgMuted2")} />
            <span className={cx("enpStatMeta")}>surveys submitted</span>
          </div>
        </div>

        <div className={cx("enpStatCard")}>
          <div className={cx("enpStatCardTop")}>
            <div className={cx("enpStatLabel")}>Standups</div>
            <div className={cx("enpStatValue", "colorAccent")}>{standupCount}</div>
          </div>
          <div className={cx("enpStatCardDivider")} />
          <div className={cx("enpStatCardBottom")}>
            <span className={cx("enpStatDot", "dotBgAccent")} />
            <span className={cx("enpStatMeta")}>this month</span>
          </div>
        </div>

      </div>

      {/* ── Current pulse survey ──────────────────────────────────────────── */}
      <div className={cx("enpSection")}>

        <div className={cx("enpSectionHeader")}>
          <div className={cx("enpSectionTitle")}>Current Pulse Survey</div>
          <span className={cx("enpSectionPeriod")}>
            {new Date().toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
          </span>
        </div>

        <div className={cx("enpSurveyBody")}>

          {/* NPS score picker */}
          <div className={cx("enpFormField")}>
            <div className={cx("enpFieldLabel")}>
              How likely are you to recommend Maphari as a workplace?
              <span className={cx("enpFieldSub")}>Rate from 0 (not at all) to 10 (extremely likely)</span>
            </div>
            <div className={cx("enpScoreRow")}>
              {SCORES.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cx("enpScoreBtn", scoreBtnSelectedCls(n, selectedScore))}
                  onClick={() => setSelectedScore(n === selectedScore ? null : n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className={cx("enpZoneLabels")}>
              <span className={cx("enpZoneLabel", "colorRed")}>Detractor (0–6)</span>
              <span className={cx("enpZoneLabel", "colorAmber")}>Passive (7–8)</span>
              <span className={cx("enpZoneLabel", "colorGreen")}>Promoter (9–10)</span>
            </div>
            {selectedScore !== null && (
              <div className={cx("enpScoreFeedback", zoneColor(scoreZone(selectedScore)))}>
                You selected <strong>{selectedScore}</strong> —{" "}
                {scoreZone(selectedScore) === "promoter" ? "Promoter · thank you for the endorsement!" :
                 scoreZone(selectedScore) === "passive"  ? "Passive · we appreciate your honesty." :
                                                           "Detractor · your feedback helps us improve."}
              </div>
            )}
          </div>


        </div>
      </div>

      {/* ── Previous responses ────────────────────────────────────────────── */}
      <div className={cx("enpSection")}>

        <div className={cx("enpSectionHeader")}>
          <div className={cx("enpSectionTitle")}>Previous Responses</div>
          <span className={cx("enpSectionMeta")}>{reviewScores.length} RECORDS</span>
        </div>

        <div className={cx("enpHistoryList")}>
          {reviewScores.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <div className={cx("emptyStateTitle")}>No review history yet</div>
              <div className={cx("emptyStateSub")}>Peer review scores will appear here once reviews are submitted.</div>
            </div>
          ) : reviewScores.map((r, idx) => (
            <div key={r.month} className={cx("enpHistoryCard", idx === reviewScores.length - 1 && "enpHistoryCardLast")}>

              {/* Head: month | score badge */}
              <div className={cx("enpHistHead")}>
                <div className={cx("enpHistMonth")}>{r.month}</div>
                <span className={cx("enpHistScore", histScoreCls(r.score))}>{r.score} / 10</span>
              </div>

              {/* Score bar + zone label */}
              <div className={cx("enpHistBarWrap")}>
                <div className={cx("enpHistBarTrack")}>
                  <div
                    className={cx("enpHistBarFill", histBarFillCls(r.score))}
                    style={{ '--pct': `${(r.score / 10) * 100}%` } as React.CSSProperties}
                  />
                </div>
                <span className={cx("enpHistZone", zoneColor(scoreZone(r.score)))}>
                  {scoreZone(r.score) === "promoter" ? "Promoter" : scoreZone(r.score) === "passive" ? "Passive" : "Detractor"}
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>

    </section>
  );
}
