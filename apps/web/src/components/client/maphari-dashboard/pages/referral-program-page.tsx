// ════════════════════════════════════════════════════════════════════════════
// referral-program-page.tsx — Client Referral Programme
// Data     : loadPortalReferralsWithRefresh → GET /referrals
//            createPortalReferralWithRefresh → POST /referrals
// Mobile   : single-column layout below 768px
// ════════════════════════════════════════════════════════════════════════════
"use client";
import { useState, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalReferralsWithRefresh,
  createPortalReferralWithRefresh,
  type PortalReferral,
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReferralRow {
  id: string;
  name: string;
  date: string;
  status: string;
  reward: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapReferral(r: PortalReferral): ReferralRow {
  const statusLabel = r.status === "CONVERTED" ? "Converted"
    : r.status === "PROPOSAL_SENT" ? "Proposal Sent"
    : r.status === "IN_PROGRESS" ? "In Progress"
    : "Pending";
  const reward = r.rewardAmountCents != null
    ? `R ${(r.rewardAmountCents / 100).toLocaleString("en-ZA")}`
    : "Pending";
  return {
    id:     `REF-${r.id.slice(-4).toUpperCase()}`,
    name:   r.referredByName,
    date:   new Date(r.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
    status: statusLabel,
    reward,
  };
}

// ── Static content ────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: "01", title: "Share your code", desc: "Give your unique referral code to any business that could benefit from Maphari's services." },
  { step: "02", title: "They get in touch", desc: "When they contact us and mention your code, we log the referral against your account." },
  { step: "03", title: "We close the deal", desc: "If the referred business signs a project worth R50,000+, you qualify for the reward." },
  { step: "04", title: "You earn", desc: "Receive R2,500 in account credit or 3 bonus support hours — your choice." },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ReferralProgramPage() {
  const { session } = useProjectLayer();

  const [apiReferrals, setApiReferrals] = useState<PortalReferral[]>([]);
  const [dataLoading,  setDataLoading]  = useState(false);
  const [copied,       setCopied]       = useState(false);

  // Submit new referral form
  const [submitName,  setSubmitName]  = useState("");
  const [submitEmail, setSubmitEmail] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitDone,  setSubmitDone]  = useState(false);

  useEffect(() => {
    if (!session) return;
    setDataLoading(true);
    void loadPortalReferralsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setApiReferrals(r.data);
    }).finally(() => setDataLoading(false));
  }, [session]);

  const displayReferrals = apiReferrals.map(mapReferral);
  const convertedCount   = apiReferrals.filter(r => r.status === "CONVERTED").length;
  const pendingCount     = apiReferrals.filter(r => r.status !== "CONVERTED").length;
  const creditsEarnedCents = apiReferrals.reduce((sum, r) => sum + (r.rewardAmountCents ?? 0), 0);
  const creditsStr       = creditsEarnedCents > 0
    ? `R ${(creditsEarnedCents / 100).toLocaleString("en-ZA")}`
    : "—";

  async function handleSubmitReferral() {
    if (!session || !submitName.trim()) return;
    setSubmitting(true);
    try {
      const r = await createPortalReferralWithRefresh(session, {
        referredByName: submitName.trim(),
        referredByEmail: submitEmail.trim() || undefined,
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setApiReferrals(prev => [...prev, r.data!]);
        setSubmitName("");
        setSubmitEmail("");
        setSubmitDone(true);
        setTimeout(() => setSubmitDone(false), 3000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Growth · Referrals</div>
          <h1 className={cx("pageTitle")}>Referral Programme</h1>
          <p className={cx("pageSub")}>Refer a business to Maphari and earn account credits or bonus support hours.</p>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Referrals Sent", value: String(apiReferrals.length), color: "statCardAccent" },
          { label: "Converted",      value: String(convertedCount),       color: "statCardGreen"  },
          { label: "Pending",        value: String(pendingCount),          color: "statCardAmber"  },
          { label: "Credits Earned", value: creditsStr,                    color: "statCardBlue"   },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Referral code banner ────────────────────────────────────────────── */}
      <div className={cx("card", "dynBgColor", "dynBorderColor", "mb16")} style={{ "--bg-color": "var(--lime-d)", "--border-color": "var(--lime)" } as React.CSSProperties}>
        <div className={cx("cardBodyPad", "textCenter", "p32x24")}>
          <div className={cx("fw700", "text12", "mb4")}>Your Referral Code</div>
          <div className={cx("refCodeDisplay")}>MAPHARI-REF</div>
          <div className={cx("flexRow", "gap8", "justifyCenter")}>
            <button
              type="button"
              className={cx("btnSm", "btnAccent")}
              onClick={async () => {
                const referralCode = "MAPHARI-REF";
                try {
                  await navigator.clipboard.writeText(referralCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  // Clipboard unavailable — still show feedback
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
              onClick={() => window.open(`mailto:?subject=Join via my referral&body=Use my code: MAPHARI-REF`, "_blank")}
            >
              Share via Email
            </button>
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
              onClick={() => window.open(`https://wa.me/?text=Join via my referral code: MAPHARI-REF`, "_blank")}
            >
              Share via WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* ── How it works + earnings ─────────────────────────────────────────── */}
      <div className={cx("grid2", "mb16")}>
        <div className={cx("card")}>
          <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>How It Works</span></div>
          <div className={cx("cardBodyPad")}>
            {HOW_IT_WORKS.map((h) => (
              <div key={h.step} className={cx("flexRow", "gap12", "mb16")}>
                <div className={cx("stepCircle28")}>{h.step}</div>
                <div>
                  <div className={cx("fw700", "text12")}>{h.title}</div>
                  <div className={cx("text11", "colorMuted", "mt2")}>{h.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("card")}>
          <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Your Earnings</span></div>
          <div className={cx("cardBodyPad")}>
            {[
              { label: "Total Referrals",  value: String(apiReferrals.length) },
              { label: "Converted",        value: String(convertedCount)       },
              { label: "Earned Credits",   value: creditsStr                   },
              { label: "Pending Rewards",  value: String(pendingCount)          },
            ].map((s) => (
              <div key={s.label} className={cx("flexBetween", "py8_0", "borderB")}>
                <span className={cx("text12", "colorMuted")}>{s.label}</span>
                <span className={cx("text12", "fw700")}>{s.value}</span>
              </div>
            ))}
            <div className={cx("mt14")}>
              <div className={cx("text11", "colorMuted")}>Earn <span className={cx("fw700")}>R 2,500 credit</span> or <span className={cx("fw700")}>3 bonus support hours</span> per converted referral on projects R50,000+.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Submit referral form ─────────────────────────────────────────────── */}
      <div className={cx("card", "mb16")}>
        <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Submit a New Referral</span></div>
        <div className={cx("cardBodyPad")}>
          {submitDone && (
            <div className={cx("accentInfoCard")}>
              <span className={cx("fw600", "text12", "colorAccent")}>Referral submitted! We&apos;ll be in touch.</span>
            </div>
          )}
          <div className={cx("flexRow", "gap10", "flexWrap")}>
            <input
              className={cx("inputSm", "flex1100px")}
              placeholder="Company / Contact name *"
              value={submitName}
              onChange={(e) => setSubmitName(e.target.value)}
            />
            <input
              className={cx("inputSm", "flex1100px")}
              placeholder="Email address (optional)"
              value={submitEmail}
              onChange={(e) => setSubmitEmail(e.target.value)}
            />
            <button
              type="button"
              className={cx("btnSm", "btnAccent", (!submitName.trim() || submitting) && "opacity50")}
              disabled={!submitName.trim() || submitting}
              onClick={handleSubmitReferral}
            >
              {submitting ? "Submitting…" : "Submit Referral"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Referral history ─────────────────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Referral History</span></div>
        {dataLoading && (
          <div className={cx("emptyPad24x16", "textCenter")}>
            <span className={cx("text11", "colorMuted")}>Loading referrals…</span>
          </div>
        )}
        {!dataLoading && displayReferrals.length === 0 && (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="users" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No referrals yet</div>
            <div className={cx("emptyStateSub")}>Submit your first referral above to start earning rewards.</div>
          </div>
        )}
        {!dataLoading && displayReferrals.length > 0 && (
          <div className={cx("listGroup")}>
            {displayReferrals.map((r) => (
              <div key={r.id} className={cx("listRow", "flexBetween")}>
                <div>
                  <div className={cx("fw600", "text12")}>{r.name}</div>
                  <div className={cx("text10", "colorMuted")}>{r.id} · Referred {r.date}</div>
                </div>
                <div className={cx("flexRow", "gap10")}>
                  <span className={cx("fw600", "text12")}>{r.reward}</span>
                  <span className={cx("badge", r.status === "Converted" ? "badgeGreen" : r.status === "Proposal Sent" ? "badgeAmber" : "badgeMuted")}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
