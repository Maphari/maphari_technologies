"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAllReferralsWithRefresh, type AdminReferral } from "../../../../lib/api/admin/client-ops";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";

type ReferralStatus = "in-pipeline" | "converted" | "lost";
type RewardStatus   = "pending" | "applied" | "n/a";
type Tab            = "referral log" | "top referrers" | "program settings" | "analytics";

type Referral = {
  id: string;
  referrer: string;
  referrerColor: string;
  referee: string;
  referralDate: string;
  status: ReferralStatus;
  stage: string;
  potentialMRR: number;
  actualMRR: number | null;
  reward: string | null;
  rewardStatus: RewardStatus;
};

type TopReferrer = {
  client: string;
  color: string;
  referrals: number;
  converted: number;
  totalRevenue: number;
  totalReward: number;
};

const referralProgram = {
  rewardType:     "Invoice Credit",
  rewardRate:     "10% of first month's retainer",
  minRetainer:    12000,
  eligibility:    "Active clients on Core tier and above",
  payoutTrigger:  "After new client's first invoice is paid",
};

const statusConfig: Record<ReferralStatus, { color: string; label: string }> = {
  "in-pipeline": { color: "var(--blue)",   label: "In Pipeline" },
  converted:     { color: "var(--accent)", label: "Converted"   },
  lost:          { color: "var(--red)",    label: "Lost"        },
};

const tabs: Tab[] = ["referral log", "top referrers", "program settings", "analytics"];

const CLIENT_COLORS = [
  "var(--accent)", "var(--blue)", "var(--amber)",
  "var(--purple)", "var(--red)",  "var(--green)",
];

function colorFor(idx: number): string {
  return CLIENT_COLORS[idx % CLIENT_COLORS.length];
}

function mapReferralStatus(dbStatus: string): ReferralStatus {
  if (dbStatus === "CONVERTED") return "converted";
  if (dbStatus === "REJECTED")  return "lost";
  return "in-pipeline";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function mapReferral(r: AdminReferral, referrerIdx: number, clientName?: string): Referral {
  const status      = mapReferralStatus(r.status);
  const refReward   = r.rewardAmountCents ? `R${(r.rewardAmountCents / 100).toFixed(0)}` : null;
  const rewardStatus: RewardStatus = r.rewardedAt ? "applied" : status === "converted" ? "pending" : "n/a";
  return {
    id:           r.id,
    referrer:     r.referredByName,
    referrerColor: colorFor(referrerIdx),
    referee:      clientName ?? r.referredByEmail ?? "Prospect",
    referralDate: fmtDate(r.createdAt),
    status,
    stage:        r.notes ?? (status === "converted" ? "Active Client" : status === "in-pipeline" ? "Proposal" : "Lost"),
    potentialMRR: 0,
    actualMRR:    status === "converted" ? (r.rewardAmountCents ? r.rewardAmountCents * 10 : 0) : null,
    reward:       refReward,
    rewardStatus,
  };
}

function buildTopReferrers(referrals: Referral[]): TopReferrer[] {
  const map = new Map<string, TopReferrer>();
  referrals.forEach((r, i) => {
    if (!map.has(r.referrer)) {
      map.set(r.referrer, {
        client:       r.referrer,
        color:        r.referrerColor,
        referrals:    0,
        converted:    0,
        totalRevenue: 0,
        totalReward:  0,
      });
    }
    const entry = map.get(r.referrer)!;
    entry.referrals += 1;
    if (r.status === "converted") {
      entry.converted     += 1;
      entry.totalRevenue  += r.actualMRR ?? 0;
    }
    if (r.rewardStatus === "applied" && r.reward) {
      entry.totalReward += parseInt(r.reward.replace("R", "")) || 0;
    }
    void i;
  });
  return [...map.values()];
}

export function ReferralTrackingPage({ session }: { session: AuthSession | null }) {
  const [referrals, setReferrals]     = useState<Referral[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<Tab>("referral log");

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const [refRes, snapRes] = await Promise.all([
        loadAllReferralsWithRefresh(session),
        loadAdminSnapshotWithRefresh(session),
      ]);
      if (cancelled) return;
      if (refRes.nextSession)       saveSession(refRes.nextSession);
      else if (snapRes.nextSession) saveSession(snapRes.nextSession);
      const clientMap = new Map<string, string>(
        (snapRes.data?.clients ?? []).map(c => [c.id, c.name])
      );
      // Build a unique referrer→index map for consistent colors
      const referrerIndexMap = new Map<string, number>();
      let nextIdx = 0;
      const raw  = refRes.data ?? [];
      const mapped = raw.map(r => {
        if (!referrerIndexMap.has(r.referredByName)) {
          referrerIndexMap.set(r.referredByName, nextIdx++);
        }
        const idx        = referrerIndexMap.get(r.referredByName) ?? 0;
        const clientName = r.referredClientId ? clientMap.get(r.referredClientId) : undefined;
        return mapReferral(r, idx, clientName);
      });
      setReferrals(mapped);
      setTopReferrers(buildTopReferrers(mapped));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session]);

  const converted     = referrals.filter(r => r.status === "converted");
  const pipeline      = referrals.filter(r => r.status === "in-pipeline");
  const totalRevenue  = converted.reduce((s, r) => s + (r.actualMRR || 0), 0);
  const totalRewards  = converted.reduce((s, r) => s + (r.actualMRR ? r.actualMRR * 0.1 : 0), 0);
  const closed        = referrals.filter(r => r.status !== "in-pipeline").length;
  const conversionRate = Math.round((converted.length / Math.max(closed, 1)) * 100);

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
    <div className={styles.pageBody}>
      <div className={cx("flexBetween", "mb32")}>
        <div>
          <div className={cx("pageEyebrow")}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 className={cx("pageTitle")}>Referral Tracking</h1>
          <div className={cx("pageSub")}>Client referrals - Rewards - Conversion - Attribution</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent", "fontMono")}>+ Log Referral</button>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          { label: "Total Referrals",     value: referrals.length.toString(),                                                          color: "var(--accent)", sub: `${pipeline.length} in pipeline`      },
          { label: "Conversion Rate",     value: `${conversionRate}%`,                                                                 color: conversionRate >= 60 ? "var(--accent)" : "var(--amber)", sub: `${converted.length} of ${closed} closed` },
          { label: "Revenue via Referral", value: `R${(totalRevenue / 1000).toFixed(0)}k`,                                             color: "var(--blue)",   sub: "Cumulative MRR added"             },
          { label: "Rewards Issued",      value: `R${(totalRewards / 1000).toFixed(1)}k`,                                             color: "var(--purple)", sub: "Invoice credits applied"           },
        ].map(s => (
          <div key={s.label} className={cx("statCard")}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue", styles.refToneText, toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor="var(--accent)"
        mutedColor="var(--muted)"
        panelColor="var(--surface)"
        borderColor="var(--border)"
      />

      {activeTab === "referral log" && (
        <div className={cx("flexCol", "gap10")}>
          {referrals.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateTitle")}>No referrals yet</div>
              <p className={cx("emptyStateSub")}>Referrals logged by admin will appear here.</p>
            </div>
          ) : referrals.map(r => {
            const sc = statusConfig[r.status];
            return (
              <div
                key={r.id}
                className={cx("card", "p20", styles.refToneBorder, toneClass(r.status === "converted" ? "var(--accent)" : r.status === "lost" ? "var(--red)" : "var(--border)"))}
              >
                <div className={styles.refLogRow}>
                  <span className={cx("fontMono", "text10", "colorMuted")}>{r.id.slice(0, 8)}</span>
                  <div>
                    <div className={cx("text11", "colorMuted", "mb3")}>Referrer</div>
                    <div className={cx("fw700", styles.refToneText, toneClass(r.referrerColor))}>{r.referrer}</div>
                  </div>
                  <div>
                    <div className={cx("text11", "colorMuted", "mb3")}>Referee</div>
                    <div className={cx("fw600")}>{r.referee}</div>
                  </div>
                  <div>
                    <div className={cx("text10", "colorMuted", "mb3")}>Referred</div>
                    <div className={cx("fontMono", "text11")}>{r.referralDate}</div>
                  </div>
                  <div>
                    <div className={cx("text10", "colorMuted", "mb3")}>Stage</div>
                    <div className={cx("text11", styles.refToneText, toneClass(sc.color))}>{r.stage}</div>
                  </div>
                  <div>
                    <div className={cx("text10", "colorMuted", "mb3")}>Pot. MRR</div>
                    <div className={cx("fontMono", "colorAccent", "fw700")}>—</div>
                  </div>
                  <div>
                    <div className={cx("text10", "colorMuted", "mb3")}>Reward</div>
                    <div className={cx("text11", styles.refToneText, toneClass(r.rewardStatus === "applied" ? "var(--accent)" : r.rewardStatus === "pending" ? "var(--amber)" : "var(--muted)"))}>{r.reward || "—"}</div>
                  </div>
                  <span className={cx("text10", "fontMono", styles.refToneTag, toneClass(sc.color))}>{sc.label}</span>
                  <button type="button" className={cx("btnSm", "btnGhost")}>Update</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "top referrers" && (
        <div className={cx("flexCol", "gap16")}>
          {topReferrers.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateTitle")}>No referrer data</div>
              <p className={cx("emptyStateSub")}>Top referrers will appear once referrals are logged.</p>
            </div>
          ) : [...topReferrers].sort((a, b) => b.converted - a.converted).map((ref, i) => (
            <div key={ref.client} className={cx("card", "p24", styles.refToneBorder, toneClass(ref.color))}>
              <div className={styles.refTopRow}>
                <div className={cx("flexRow", "gap12", styles.refAlignCenter)}>
                  <div className={cx("flexCenter", "fontMono", "fw800", styles.refTopRank, toneClass(ref.color))}>
                    {i + 1}
                  </div>
                  <div className={cx("fw700", styles.refTitle15, styles.refToneText, toneClass(ref.color))}>{ref.client}</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted", "mb3")}>Referrals</div>
                  <div className={cx("fontMono", "fw800", "colorBlue", styles.refValue20)}>{ref.referrals}</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted", "mb3")}>Converted</div>
                  <div className={cx("fontMono", "fw800", styles.refValue20, styles.refToneText, toneClass(ref.converted > 0 ? "var(--accent)" : "var(--muted)"))}>{ref.converted}</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted", "mb3")}>Revenue Added</div>
                  <div className={cx("fontMono", "fw700", "colorAccent")}>R{(ref.totalRevenue / 1000).toFixed(0)}k</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted", "mb3")}>Rewards Earned</div>
                  <div className={cx("fontMono", "fw700", "colorPurple")}>R{(ref.totalReward / 1000).toFixed(1)}k</div>
                </div>
                <button type="button" className={cx("btnSm", styles.refToneBtn, toneClass(ref.color))}>Thank Client</button>
              </div>
              {ref.referrals > 0 && (
                <div className={cx("mt16")}>
                  <div className={cx("flexBetween", "mb6")}>
                    <span className={cx("text11", "colorMuted")}>Conversion rate</span>
                    <span className={cx("fontMono", "text11", styles.refToneText, toneClass(ref.converted > 0 ? "var(--accent)" : "var(--muted)"))}>
                      {Math.round((ref.converted / Math.max(ref.referrals - pipeline.filter(p => p.referrer === ref.client).length, 1)) * 100)}%
                    </span>
                  </div>
                  <div className={cx("progressBar")}>
                    <progress className={cx("barFill", "uiProgress", styles.refBarTone, toneClass(ref.color))} max={100} value={(ref.converted / ref.referrals) * 100} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "program settings" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", styles.refPad28)}>
            <div className={cx("text13", "fw700", "mb20", "uppercase")}>Current Program Rules</div>
            {Object.entries(referralProgram).map(([key, val]) => (
              <div key={key} className={cx("flexBetween", "borderB", "gap20", styles.refRuleRow)}>
                <span className={cx("text12", "colorMuted", "capitalize", "noShrink")}>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                <span className={cx("text12", "fw600", "textRight")}>{String(val)}</span>
              </div>
            ))}
            <button type="button" className={cx("btnSm", "btnAccent", "mt20")}>Edit Program Rules</button>
          </div>
          <div className={cx("card", styles.refPad28)}>
            <div className={cx("text13", "fw700", "mb20", "uppercase")}>Pending Rewards</div>
            {referrals.filter(r => r.rewardStatus === "pending").map(r => (
              <div key={r.id} className={cx("bgBg", "mb10", styles.refPendingCard)}>
                <div className={cx("flexBetween", "mb6")}>
                  <span className={cx("fw600")}>{r.referrer}</span>
                  <span className={cx("fontMono", "colorPurple", "fw700")}>{r.reward}</span>
                </div>
                <div className={cx("text11", "colorMuted", "mb10")}>Referred {r.referee} — {r.stage}</div>
                <button type="button" className={cx("btnSm", "btnAccent", styles.refApplyBtnPurple)}>Apply Credit</button>
              </div>
            ))}
            {referrals.filter(r => r.rewardStatus === "pending").length === 0 && (
              <div className={cx("text12", "colorMuted")}>No pending rewards</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase")}>Referral Funnel</div>
            {[
              { stage: "Total Referrals", count: referrals.length,                                    color: "var(--blue)"   },
              { stage: "In Pipeline",     count: pipeline.length,                                     color: "var(--amber)"  },
              { stage: "Converted",       count: converted.length,                                    color: "var(--accent)" },
              { stage: "Lost",            count: referrals.filter(r => r.status === "lost").length,   color: "var(--red)"    },
            ].map(f => (
              <div key={f.stage} className={cx("flexRow", "gap12", "mb14", styles.refAlignCenter)}>
                <span className={cx("text12", styles.refFlex1)}>{f.stage}</span>
                <div className={cx("progressBar", styles.refProg10)}>
                  <progress className={cx("barFill", "uiProgress", styles.refBarTone, styles.refProgFill10, toneClass(f.color))} max={100} value={referrals.length > 0 ? (f.count / referrals.length) * 100 : 0} />
                </div>
                <span className={cx("fontMono", "fw800", styles.refToneText, styles.refW20, toneClass(f.color))}>{f.count}</span>
              </div>
            ))}
          </div>
          <div className={cx("card", "p24", styles.refAccentBorder)}>
            <div className={cx("text13", "fw700", "mb16", "colorAccent", "uppercase")}>Referral Program ROI</div>
            <div className={cx("fontMono", "fw800", "colorAccent", styles.refValue40)}>R{(totalRevenue / 1000).toFixed(0)}k</div>
            <div className={cx("text12", "colorMuted", "mb16")}>MRR generated via referrals</div>
            <div className={cx("flexBetween", "text12", "mb8")}>
              <span className={cx("colorMuted")}>Rewards paid out</span>
              <span className={cx("colorPurple", "fontMono", "fw700")}>R{(totalRewards / 1000).toFixed(1)}k</span>
            </div>
            <div className={cx("flexBetween", "text12")}>
              <span className={cx("colorMuted")}>Net revenue per R1 reward</span>
              <span className={cx("colorAccent", "fontMono", "fw700")}>R{(totalRevenue / Math.max(totalRewards, 1)).toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
