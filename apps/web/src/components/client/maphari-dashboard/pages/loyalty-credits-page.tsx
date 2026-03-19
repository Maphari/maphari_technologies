// ════════════════════════════════════════════════════════════════════════════
// loyalty-credits-page.tsx — Client Portal Loyalty Credits
// Data     : loadMyLoyaltyWithRefresh → GET /loyalty/:clientId
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import {
  loadMyLoyaltyWithRefresh,
  createPortalSupportTicketWithRefresh,
  type PortalLoyaltyAccount,
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";

// ── Static redemption catalogue (product-defined, not from API) ───────────────
const REDEMPTIONS = [
  { name: "1 Support Hour",         credits: 650,  available: true  },
  { name: "2 Support Hours",        credits: 1300, available: true  },
  { name: "Priority Sprint Slot",   credits: 2000, available: true  },
  { name: "Free Design Review",     credits: 2500, available: false },
  { name: "1 Day Strategy Session", credits: 8000, available: false },
];

function tierLabel(raw: string) {
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function tierBadgeCls(raw: string) {
  const t = raw.toUpperCase();
  if (t === "PLATINUM") return "badgePurple";
  if (t === "GOLD")     return "badgeAmber";
  if (t === "SILVER")   return "badgeBlue";
  return "badgeMuted";
}

function nextTierTarget(tier: string): number {
  const t = tier.toUpperCase();
  if (t === "BRONZE")  return 2_500;
  if (t === "SILVER")  return 7_500;
  if (t === "GOLD")    return 20_000;
  return 50_000;
}

function nextTierName(tier: string): string {
  const t = tier.toUpperCase();
  if (t === "BRONZE")  return "Silver";
  if (t === "SILVER")  return "Gold";
  if (t === "GOLD")    return "Platinum";
  return "Max Tier";
}

// ── Component ─────────────────────────────────────────────────────────────────
export function LoyaltyCreditsPage() {
  const { session } = useProjectLayer();
  const [account,   setAccount]   = useState<PortalLoyaltyAccount | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null); // holds the redemption name being processed
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const notify = usePageToast();

  // ── Derived values (declared early so handleRedeem can capture them) ──────
  const balance  = account?.balancePoints ?? 0;
  const earned   = account?.totalEarned   ?? 0;
  const redeemed = earned - balance;
  const tier     = account?.tier ?? "BRONZE";
  const target   = nextTierTarget(tier);
  const nextTier = nextTierName(tier);
  const pct      = target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : 100;

  const transactions = useMemo(() => (account?.transactions ?? []).slice(0, 20), [account]);

  // ── Load account data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadMyLoyaltyWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message ?? "Failed to load."); setLoading(false); return; }
      if (r.data) setAccount(r.data);
      setLoading(false);
    });
  }, [session]);

  // ── Redeem handler ────────────────────────────────────────────────────────
  async function handleRedeem(redemptionName: string, credits: number): Promise<void> {
    if (!session || redeeming) return;
    setRedeeming(redemptionName);
    try {
      const r = await createPortalSupportTicketWithRefresh(session, {
        clientId:    session.user.clientId ?? "",
        title:       `Credit Redemption: ${redemptionName}`,
        description: `The client has requested to redeem ${credits.toLocaleString()} loyalty credits for: ${redemptionName}.\n\nCurrent balance: ${balance.toLocaleString()} pts.`,
        category:    "REDEMPTION",
        priority:    "MEDIUM",
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        notify("error", "Redemption failed", "Could not process your redemption. Please try again.");
      } else {
        notify("success", "Redemption requested", `Your request for "${redemptionName}" has been submitted. The team will confirm within 24 hours.`);
      }
    } catch {
      notify("error", "Redemption failed", "Could not process your redemption. Please try again.");
    } finally {
      setRedeeming(null);
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
          <div className={cx("pageEyebrow")}>Growth · Loyalty</div>
          <h1 className={cx("pageTitle")}>Loyalty Credits</h1>
          <p className={cx("pageSub")}>Earn credits for on-time approvals, referrals, and loyalty milestones. Redeem for support hours, design reviews, and more.</p>
        </div>
      </div>

      {/* Tier hero card */}
      <div className={cx("card", "borderLeftAmber", "mb20", "p20x24")}>
        <div className={cx("flexRow", "gap24", "flexWrap")}>
          <div className={cx("flexRow", "gap12")}>
            <div className={cx("trophyIconBox")}>🏆</div>
            <div>
              <span className={cx("badge", tierBadgeCls(tier), "mb4", "inlineBlock")}>{tierLabel(tier)} Tier</span>
              <div className={cx("fw700", "fs16rem", "lineH1")}>{balance.toLocaleString()} pts</div>
            </div>
          </div>
          <div className={cx("flex1", "minW200")}>
            <div className={cx("flexBetween", "mb6")}>
              <span className={cx("text11", "colorMuted")}>{balance.toLocaleString()} / {target.toLocaleString()} pts to {nextTier}</span>
              <span className={cx("text11", "fw700")}>{pct}%</span>
            </div>
            <div className={cx("progressTrack")}>
              <div className={cx("pctFillRInherit", "dynBgColor")} style={{ '--pct': pct, "--bg-color": "var(--amber)" } as React.CSSProperties} />
            </div>
            <div className={cx("text10", "colorMuted", "mt6")}>{tierLabel(tier)} perks: priority support · dedicated PM · loyalty bonuses</div>
          </div>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Credit Balance", value: `${balance.toLocaleString()} pts`,  color: "statCardAccent" },
          { label: "Total Earned",   value: `${earned.toLocaleString()} pts`,   color: "statCardGreen"  },
          { label: "Total Redeemed", value: `${redeemed.toLocaleString()} pts`, color: "statCardAmber"  },
          { label: "Tier",           value: tierLabel(tier),                    color: "statCardPurple" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("grid2", "mb16")}>
        <div className={cx("card")}>
          <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Redeem Credits</span></div>
          <div className={cx("listGroup")}>
            {REDEMPTIONS.map((r) => {
              const canRedeem = r.available && balance >= r.credits;
              const isRedeeming = redeeming === r.name;
              return (
                <div key={r.name} className={cx("listRow", "flexBetween")}>
                  <div>
                    <div className={cx("fw600", "text12")}>{r.name}</div>
                    <div className={cx("text10", "colorMuted")}>{r.credits.toLocaleString()} credits</div>
                  </div>
                  <button
                    type="button"
                    className={cx("btnSm", canRedeem ? "btnAccent" : "btnGhost")}
                    disabled={!canRedeem || !!redeeming}
                    onClick={() => canRedeem && void handleRedeem(r.name, r.credits)}
                  >
                    {isRedeeming
                      ? "Requesting…"
                      : balance >= r.credits
                        ? "Redeem"
                        : `Need ${(r.credits - balance).toLocaleString()} more`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cx("card")}>
          <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>How to Earn More</span></div>
          <div className={cx("listGroup")}>
            {[
              ["On-time milestone approval",   "+500 pts"],
              ["Successful referral converted", "+2,500 pts"],
              ["Quarterly loyalty bonus",       "+1,000 pts"],
              ["Annual partnership bonus",      "+1,000 pts"],
              ["Early payment bonus",           "+250 pts"],
              ["5-star satisfaction survey",    "+500 pts"],
            ].map(([label, pts]) => (
              <div key={label} className={cx("listRow", "flexBetween")}>
                <span className={cx("text12")}>{label}</span>
                <span className={cx("fw700", "text12", "colorAccent")}>{pts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={cx("card")}>
        <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Transaction History</span></div>
        <div className={cx("listGroup")}>
          {transactions.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="star" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No transactions yet</div>
              <div className={cx("emptyStateSub")}>Points earned and redeemed will appear here.</div>
            </div>
          ) : null}
          {transactions.map((t) => (
            <div key={t.id} className={cx("listRow", "flexBetween")}>
              <div className={cx("flexRow", "gap10")}>
                <div className={cx("dot8", "noShrink", "mt4", "dynBgColor")} style={{ "--bg-color": t.type === "EARNED" ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties} />
                <div>
                  <div className={cx("fw600", "text12")}>{t.description ?? t.type}</div>
                  <div className={cx("text10", "colorMuted")}>{new Date(t.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
              </div>
              <span className={cx("fw700", "text12", "dynColor")} style={{ "--color": t.type === "EARNED" ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>
                {t.type === "REDEEMED" ? `-${t.points.toLocaleString()}` : `+${t.points.toLocaleString()}`} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
