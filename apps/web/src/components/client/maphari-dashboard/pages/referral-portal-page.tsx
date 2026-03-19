// ════════════════════════════════════════════════════════════════════════════
// referral-portal-page.tsx — Client Referral Portal
// Data     : loadPortalReferralsWithRefresh → GET /referrals
//            createPortalReferralWithRefresh → POST /referrals
// Mobile   : Grid collapses to 1-col; history table scrolls
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalReferralsWithRefresh,
  createPortalReferralWithRefresh,
  type PortalReferral
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

// ── Static config ─────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  "Share your referral code with qualifying businesses.",
  "Referral contacts Maphari and cites your code.",
  "They sign a qualifying contract.",
  "You receive payout or service credit.",
];

const EARNINGS = [
  { referrals: "1 referral", value: "R 5 000" },
  { referrals: "3 referrals", value: "R 15 000" },
  { referrals: "5+ referrals", value: "R 30 000+" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function statusBadge(s: string) {
  if (s === "ACCEPTED" || s === "REWARDED") return "badgeGreen";
  if (s === "REJECTED") return "badgeRed";
  return "badgeAmber";
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ReferralPortalPage() {
  const { session } = useProjectLayer();
  const [referrals,  setReferrals]  = useState<PortalReferral[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // Form state
  const [refName, setRefName] = useState("");
  const [refEmail, setRefEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    loadPortalReferralsWithRefresh(session).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) { setError(result.error.message ?? "Failed to load."); setLoading(false); return; }
      if (result.data) setReferrals(result.data);
      setLoading(false);
    });
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!refName.trim() || !session) return;
    setSubmitting(true);

    const result = await createPortalReferralWithRefresh(session, {
      referredByName: refName.trim(),
      referredByEmail: refEmail.trim() || undefined
    });

    if (result.nextSession) saveSession(result.nextSession);
    setSubmitting(false);

    if (result.data) {
      setReferrals((prev) => [result.data!, ...prev]);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setRefName("");
        setRefEmail("");
      }, 3000);
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

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Account · Referrals</div>
          <h1 className={cx("pageTitle")}>Refer a Friend</h1>
          <p className={cx("pageSub")}>
            Refer a business to Maphari and earn rewards for every successful engagement.
          </p>
        </div>
      </div>

      {/* ── KPI ── */}
      <div className={cx("grid2", "mb16")}>
        <div className={cx("card", "p20")}>
          <div className={cx("fw700", "mb12")}>How It Works</div>
          <div className={cx("listGroup")}>
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step} className={cx("listRow")}>
                <div className={cx("flexRow", "gap12")}>
                  <span className={cx("badge", "badgeAccent", "minW22px", "textCenter")}>
                    {index + 1}
                  </span>
                  <span className={cx("text12")}>{step}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("card", "p20")}>
          <div className={cx("fw700", "mb12")}>Your Earnings</div>
          <div className={cx("listGroup")}>
            {EARNINGS.map((row) => (
              <div key={row.referrals} className={cx("listRow")}>
                <span className={cx("text12")}>{row.referrals}</span>
                <span className={cx("fontMono", "fw600", "colorAccent")}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Submit a referral ── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>Submit a Referral</span>
        </div>
        <div className={cx("cardBodyPad", "pt16")}>
          {submitted ? (
            <p className={cx("text13", "colorAccent", "fw600")}>Referral submitted — thank you!</p>
          ) : (
            <form onSubmit={handleSubmit} className={cx("flexCol", "gap14")}>
              <div className={cx("grid2Cols12Gap")}>
                <div>
                  <label className={cx("text11", "colorMuted", "dBlock", "mb6")}>Contact Name *</label>
                  <input className={cx("input")} placeholder="Business contact name" value={refName} onChange={(e) => setRefName(e.target.value)} required />
                </div>
                <div>
                  <label className={cx("text11", "colorMuted", "dBlock", "mb6")}>Contact Email</label>
                  <input className={cx("input")} type="email" placeholder="contact@business.com" value={refEmail} onChange={(e) => setRefEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <button type="submit" className={cx("btnSm", "btnAccent")} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Referral"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Referral history ── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>Referral History ({referrals.length} referrals)</span>
        </div>
        {referrals.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyTitle")}>No referrals yet</div>
            <div className={cx("emptySub")}>Share your code to start earning.</div>
          </div>
        ) : (
          <div className={cx("listGroup")}>
            {referrals.map((r) => (
              <div key={r.id} className={cx("listRow", "flexBetween", "gap12")}>
                <div>
                  <div className={cx("fw600", "text13")}>{r.referredByName}</div>
                  {r.referredByEmail && <div className={cx("text11", "colorMuted")}>{r.referredByEmail}</div>}
                </div>
                <div className={cx("flexRow", "gap8", "alignCenter")}>
                  <span className={cx("fontMono", "text11", "colorMuted")}>{formatDate(r.createdAt)}</span>
                  <span className={cx("badge", statusBadge(r.status))}>{r.status}</span>
                  {r.rewardAmountCents != null && (
                    <span className={cx("fontMono", "fw600", "colorAccent", "text12")}>
                      R {(r.rewardAmountCents / 100).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
