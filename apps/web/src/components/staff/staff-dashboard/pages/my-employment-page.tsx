"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getMyProfile, type StaffProfile } from "../../../../lib/api/staff/profile";
import {
  loadMyPayslipsWithRefresh,
  loadMyPeerReviewsWithRefresh,
  type StaffPayslipRecord,
  type StaffPeerReview,
} from "../../../../lib/api/staff/hr";

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeTenure(dateStr: string): string {
  const start  = new Date(dateStr);
  const now    = new Date();
  let years    = now.getFullYear() - start.getFullYear();
  let months   = now.getMonth()    - start.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years > 0 && months > 0) return `${years}y ${months}m`;
  if (years > 0) return `${years}y`;
  return `${months}m`;
}

function reviewRatingCls(rating: string) {
  if (rating.includes("Exceeds")) return "empRatingExceeds";
  if (rating.includes("Meets"))   return "empRatingMeets";
  return "empRatingBelow";
}

function scoreBarPct(score: string): number {
  const parts = score.split("/");
  const val   = parseFloat(parts[0] ?? "0");
  const max   = parseFloat(parts[1] ?? "5");
  if (isNaN(val) || isNaN(max) || max === 0) return 0;
  return Math.round((val / max) * 100);
}

function scoreBarFillCls(score: string): string {
  const pct = scoreBarPct(score);
  if (pct >= 80) return "empFillGreen";
  if (pct >= 60) return "empFillAmber";
  return "empFillRed";
}

function scoreValueCls(score: string): string {
  const pct = scoreBarPct(score);
  if (pct >= 80) return "colorGreen";
  if (pct >= 60) return "colorAmber";
  return "colorRed";
}

function formatGross(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPayslipPeriod(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
  const e = new Date(end).toLocaleDateString("en-ZA",   { month: "short", year: "numeric" });
  return `${s} – ${e}`;
}

// ── Local row types ───────────────────────────────────────────────────────────

type CompRow   = { period: string; salary: string; change: string };
type ReviewRow = { period: string; rating: string; score: string; reviewer: string };

// ── Component ─────────────────────────────────────────────────────────────────

export function MyEmploymentPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [profile,  setProfile]  = useState<StaffProfile | null>(null);
  const [payslips, setPayslips] = useState<StaffPayslipRecord[]>([]);
  const [reviews,  setReviews]  = useState<StaffPeerReview[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, payslipsRes, reviewsRes] = await Promise.all([
          getMyProfile(session),
          loadMyPayslipsWithRefresh(session),
          loadMyPeerReviewsWithRefresh(session),
        ]);
        if (cancelled) return;
        if (profileRes.nextSession)  saveSession(profileRes.nextSession);
        if (payslipsRes.nextSession) saveSession(payslipsRes.nextSession);
        if (reviewsRes.nextSession)  saveSession(reviewsRes.nextSession);
        if (profileRes.data)  setProfile(profileRes.data);
        if (payslipsRes.data) setPayslips(payslipsRes.data);
        if (reviewsRes.data)  setReviews(
          reviewsRes.data.filter((r) => r.score !== null || r.status === "SUBMITTED")
        );
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message ?? "Failed to load data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  // ── Derived values ────────────────────────────────────────────────────────

  const name       = profile ? `${profile.firstName} ${profile.lastName}` : "—";
  const role       = profile?.role       ?? "—";
  const department = profile?.department ?? "—";
  const employeeId = profile ? profile.id.slice(0, 8).toUpperCase() : "—";
  const startDate  = profile?.startDate
    ? new Date(profile.startDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const tenure = profile?.startDate ? computeTenure(profile.startDate) : "—";

  // Payslips → compensation rows (newest first)
  const sorted = [...payslips].sort(
    (a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
  );
  const compensation: CompRow[] = sorted.map((p, idx) => {
    const prev = sorted[idx + 1];
    let change = "Starting";
    if (prev && prev.grossPayCents > 0) {
      const pct = ((p.grossPayCents - prev.grossPayCents) / prev.grossPayCents) * 100;
      change = pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
    }
    return {
      period: formatPayslipPeriod(p.periodStart, p.periodEnd),
      salary: `${formatGross(p.grossPayCents)}/month`,
      change,
    };
  });

  // Peer reviews → display rows
  const reviewRows: ReviewRow[] = reviews.map((r) => ({
    period:   new Date(r.createdAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }),
    rating:   r.score !== null
      ? r.score >= 4 ? "Exceeds Expectations" : r.score >= 3 ? "Meets Expectations" : "Below Expectations"
      : "Pending",
    score:    r.score !== null ? `${r.score.toFixed(1)}/5` : "—",
    reviewer: "Maphari",
  }));

  const currentComp = compensation[0];
  const latestScore = reviewRows[0]?.score && reviewRows[0].score !== "—" ? reviewRows[0].score : null;

  // ── Loading ───────────────────────────────────────────────────────────────

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

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-employment">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / HR</div>
        <h1 className={cx("pageTitleText")}>My Employment</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal records, contracts, and compensation (read-only)</p>
      </div>

      {/* ── Summary stats ──────────────────────────────────────────────────── */}
      <div className={cx("empStatGrid")}>

        <div className={cx("empStatCard")}>
          <div className={cx("empStatCardTop")}>
            <div className={cx("empStatLabel")}>Current Salary</div>
            <div className={cx("empStatValue", "colorAccent")}>
              {currentComp
                ? <>{currentComp.salary.replace("/month", "")}<span className={cx("empStatSuffix")}>/mo</span></>
                : "—"}
            </div>
          </div>
          <div className={cx("empStatCardDivider")} />
          <div className={cx("empStatCardBottom")}>
            <span className={cx("empStatDot", "dotBgAccent")} />
            <span className={cx("empStatMeta")}>{currentComp?.period.split("–")[0].trim() ?? "—"}</span>
          </div>
        </div>

        <div className={cx("empStatCard")}>
          <div className={cx("empStatCardTop")}>
            <div className={cx("empStatLabel")}>Tenure</div>
            <div className={cx("empStatValue", "colorMuted2")}>{tenure}</div>
          </div>
          <div className={cx("empStatCardDivider")} />
          <div className={cx("empStatCardBottom")}>
            <span className={cx("empStatDot", "dotBgMuted2")} />
            <span className={cx("empStatMeta")}>since {startDate}</span>
          </div>
        </div>

        <div className={cx("empStatCard")}>
          <div className={cx("empStatCardTop")}>
            <div className={cx("empStatLabel")}>Latest Score</div>
            <div className={cx("empStatValue", "colorGreen")}>
              {latestScore
                ? <>{latestScore.split("/")[0]}<span className={cx("empStatSuffix")}>/5</span></>
                : "—"}
            </div>
          </div>
          <div className={cx("empStatCardDivider")} />
          <div className={cx("empStatCardBottom")}>
            <span className={cx("empStatDot", "dotBgGreen")} />
            <span className={cx("empStatMeta")}>{reviewRows[0]?.period ?? "No reviews yet"}</span>
          </div>
        </div>

        <div className={cx("empStatCard")}>
          <div className={cx("empStatCardTop")}>
            <div className={cx("empStatLabel")}>Salary Growth</div>
            <div className={cx("empStatValue", "colorGreen")}>{currentComp?.change ?? "—"}</div>
          </div>
          <div className={cx("empStatCardDivider")} />
          <div className={cx("empStatCardBottom")}>
            <span className={cx("empStatDot", "dotBgGreen")} />
            <span className={cx("empStatMeta")}>last adjustment</span>
          </div>
        </div>

      </div>

      {/* ── Personal details ────────────────────────────────────────────────── */}
      <div className={cx("empSection")}>
        <div className={cx("empSectionHeader")}>
          <div className={cx("empSectionTitle")}>Personal Details</div>
          <span className={cx("empSectionMeta")}>{employeeId}</span>
        </div>

        <div className={cx("empProfileHead")}>
          <div className={cx("empProfileLeft")}>
            <div className={cx("empProfileName")}>{name}</div>
            <div className={cx("empProfileRole")}>{role} · {department}</div>
          </div>
          <span className={cx("empProfileIdBadge")}>{employeeId}</span>
        </div>

        <div className={cx("empDetailStrip")}>
          <div className={cx("empDetailCell")}>
            <div className={cx("empDetailLabel")}>Start Date</div>
            <div className={cx("empDetailValue")}>{startDate}</div>
          </div>
          <div className={cx("empDetailCell")}>
            <div className={cx("empDetailLabel")}>Tenure</div>
            <div className={cx("empDetailValue")}>{tenure}</div>
          </div>
          <div className={cx("empDetailCell")}>
            <div className={cx("empDetailLabel")}>Department</div>
            <div className={cx("empDetailValue")}>{department}</div>
          </div>
          <div className={cx("empDetailCell")}>
            <div className={cx("empDetailLabel")}>Status</div>
            <div className={cx("empDetailValue", "colorGreen")}>Active</div>
          </div>
        </div>
      </div>

      {/* ── Compensation history ─────────────────────────────────────────────── */}
      <div className={cx("empSection")}>
        <div className={cx("empSectionHeader")}>
          <div className={cx("empSectionTitle")}>Compensation History</div>
          <span className={cx("empSectionMeta")}>{compensation.length} PERIODS</span>
        </div>

        {compensation.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 8h10M7 12h7M7 16h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <div className={cx("emptyStateTitle")}>No payslips yet</div>
            <div className={cx("emptyStateSub")}>Your payslip history will appear here once processed by HR.</div>
          </div>
        ) : (
          <div className={cx("empCompList")}>
            {compensation.map((c, idx) => (
              <div
                key={c.period}
                className={cx(
                  "empCompCard",
                  idx === 0 && "empCompCardCurrent",
                  idx === compensation.length - 1 && "empCompCardLast",
                )}
              >
                <div className={cx("empCompHead")}>
                  <span className={cx("empCompPeriod")}>{c.period}</span>
                  <span className={cx("empChangeBadge", c.change.startsWith("+") ? "empChangePlus" : "empChangeNeutral")}>
                    {c.change}
                  </span>
                </div>
                <div className={cx("empCompSalary")}>{c.salary}</div>
                <div className={cx("empCompStatusRow")}>
                  <span className={cx("empCompStatusChip", idx === 0 ? "empCompStatusCurrent" : "empCompStatusPrev")}>
                    {idx === 0 ? "Current" : "Previous"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Performance reviews ──────────────────────────────────────────────── */}
      <div className={cx("empSection")}>
        <div className={cx("empSectionHeader")}>
          <div className={cx("empSectionTitle")}>Performance Reviews</div>
          <span className={cx("empSectionMeta")}>{reviewRows.length} REVIEWS</span>
        </div>

        {reviewRows.length === 0 ? (
          <div className={cx("colorMuted", "text12", "py12_0")}>
            No performance reviews on record yet.
          </div>
        ) : (
          <div className={cx("empReviewList")}>
            {reviewRows.map((r, idx) => (
              <div
                key={`${r.period}-${idx}`}
                className={cx("empReviewCard", idx === reviewRows.length - 1 && "empReviewCardLast")}
              >
                <div className={cx("empReviewHead")}>
                  <span className={cx("empReviewPeriod")}>{r.period}</span>
                  <span className={cx("empScoreBadge", reviewRatingCls(r.rating))}>{r.score}</span>
                </div>

                <span className={cx("empRatingBadge", reviewRatingCls(r.rating))}>{r.rating}</span>

                <div className={cx("empScoreBarWrap")}>
                  <div className={cx("empScoreBarMeta")}>
                    <span className={cx("empScoreBarLabel")}>Score</span>
                    <span className={cx("empScoreBarPct", r.score !== "—" ? scoreValueCls(r.score) : "colorMuted2")}>
                      {r.score}
                    </span>
                  </div>
                  <div className={cx("empScoreTrack")}>
                    <div
                      className={cx("empScoreFill", r.score !== "—" ? scoreBarFillCls(r.score) : "empFillAmber")}
                      style={{ '--pct': r.score !== "—" ? `${scoreBarPct(r.score)}%` : "0%" } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div className={cx("empReviewerRow")}>
                  <span className={cx("empReviewerLabel")}>Reviewer</span>
                  <span className={cx("empReviewerName")}>{r.reviewer}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
  );
}
