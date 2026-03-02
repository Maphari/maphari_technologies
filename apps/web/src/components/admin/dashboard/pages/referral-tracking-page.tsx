"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { toneClass } from "./admin-page-utils";

type ReferralStatus = "in-pipeline" | "converted" | "lost";
type RewardStatus = "pending" | "applied" | "n/a";
type Tab = "referral log" | "top referrers" | "program settings" | "analytics";

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

const referrals: Referral[] = [
  { id: "REF-012", referrer: "Volta Studios", referrerColor: "var(--accent)", referee: "Horizon Media", referralDate: "Feb 5", status: "in-pipeline", stage: "Proposal Sent", potentialMRR: 28000, actualMRR: null, reward: "R2,800 credit", rewardStatus: "pending" },
  { id: "REF-011", referrer: "Okafor & Sons", referrerColor: "var(--amber)", referee: "Apex Financial", referralDate: "Jan 22", status: "in-pipeline", stage: "Negotiation", potentialMRR: 45000, actualMRR: null, reward: "R4,500 credit", rewardStatus: "pending" },
  { id: "REF-010", referrer: "Volta Studios", referrerColor: "var(--accent)", referee: "Vivid Commerce", referralDate: "Dec 12", status: "converted", stage: "Closed Won", potentialMRR: 18000, actualMRR: 18000, reward: "R1,800 credit", rewardStatus: "applied" },
  { id: "REF-009", referrer: "Okafor & Sons", referrerColor: "var(--amber)", referee: "Solar Sense", referralDate: "Nov 30", status: "converted", stage: "Closed Won", potentialMRR: 22000, actualMRR: 22000, reward: "R2,200 credit", rewardStatus: "applied" },
  { id: "REF-008", referrer: "Mira Health", referrerColor: "var(--blue)", referee: "Pulse Clinics", referralDate: "Nov 8", status: "lost", stage: "Closed Lost", potentialMRR: 15000, actualMRR: null, reward: null, rewardStatus: "n/a" },
  { id: "REF-007", referrer: "Volta Studios", referrerColor: "var(--accent)", referee: "Beam Studio", referralDate: "Oct 14", status: "converted", stage: "Closed Won", potentialMRR: 28000, actualMRR: 28000, reward: "R2,800 credit", rewardStatus: "applied" },
];

const referralProgram = {
  rewardType: "Invoice Credit",
  rewardRate: "10% of first month's retainer",
  minRetainer: 12000,
  eligibility: "Active clients on Core tier and above",
  payoutTrigger: "After new client's first invoice is paid",
};

const topReferrers: TopReferrer[] = [
  { client: "Volta Studios", color: "var(--accent)", referrals: 3, converted: 2, totalRevenue: 46000, totalReward: 4600 },
  { client: "Okafor & Sons", color: "var(--amber)", referrals: 2, converted: 2, totalRevenue: 40000, totalReward: 4000 },
  { client: "Mira Health", color: "var(--blue)", referrals: 1, converted: 0, totalRevenue: 0, totalReward: 0 },
];

const statusConfig: Record<ReferralStatus, { color: string; label: string }> = {
  "in-pipeline": { color: "var(--blue)", label: "In Pipeline" },
  converted: { color: "var(--accent)", label: "Converted" },
  lost: { color: "var(--red)", label: "Lost" },
};

const tabs: Tab[] = ["referral log", "top referrers", "program settings", "analytics"];

export function ReferralTrackingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("referral log");

  const converted = referrals.filter((r) => r.status === "converted");
  const pipeline = referrals.filter((r) => r.status === "in-pipeline");
  const totalRevenue = converted.reduce((s, r) => s + (r.actualMRR || 0), 0);
  const totalRewards = converted.reduce((s, r) => s + (r.actualMRR ? r.actualMRR * 0.1 : 0), 0);
  const closed = referrals.filter((r) => r.status !== "in-pipeline").length;
  const conversionRate = Math.round((converted.length / Math.max(closed, 1)) * 100);

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
          { label: "Total Referrals", value: referrals.length.toString(), color: "var(--accent)", sub: `${pipeline.length} in pipeline` },
          { label: "Conversion Rate", value: `${conversionRate}%`, color: conversionRate >= 60 ? "var(--accent)" : "var(--amber)", sub: `${converted.length} of ${closed} closed` },
          { label: "Revenue via Referral", value: `R${(totalRevenue / 1000).toFixed(0)}k`, color: "var(--blue)", sub: "Cumulative MRR added" },
          { label: "Rewards Issued", value: `R${(totalRewards / 1000).toFixed(1)}k`, color: "var(--purple)", sub: "Invoice credits applied" },
        ].map((s) => (
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
          {referrals.map((r) => {
            const sc = statusConfig[r.status];
            return (
              <div
                key={r.id}
                className={cx("card", "p20", styles.refToneBorder, toneClass(r.status === "converted" ? "var(--accent)" : r.status === "lost" ? "var(--red)" : "var(--border)"))}
              >
                <div className={styles.refLogRow}>
                  <span className={cx("fontMono", "text10", "colorMuted")}>{r.id}</span>
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
                    <div className={cx("fontMono", "colorAccent", "fw700")}>R{(r.potentialMRR / 1000).toFixed(0)}k</div>
                  </div>
                  <div>
                    <div className={cx("text10", "colorMuted", "mb3")}>Reward</div>
                    <div className={cx("text11", styles.refToneText, toneClass(r.rewardStatus === "applied" ? "var(--accent)" : r.rewardStatus === "pending" ? "var(--amber)" : "var(--muted)"))}>{r.reward || "-"}</div>
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
          {[...topReferrers].sort((a, b) => b.converted - a.converted).map((ref, i) => (
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
                    <span className={cx("fontMono", "text11", styles.refToneText, toneClass(ref.converted > 0 ? "var(--accent)" : "var(--muted)"))}>{Math.round((ref.converted / Math.max(ref.referrals - pipeline.filter((p) => p.referrer === ref.client).length, 1)) * 100)}%</span>
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
            {referrals
              .filter((r) => r.rewardStatus === "pending")
              .map((r) => (
                <div key={r.id} className={cx("bgBg", "mb10", styles.refPendingCard)}>
                  <div className={cx("flexBetween", "mb6")}>
                    <span className={cx("fw600")}>{r.referrer}</span>
                    <span className={cx("fontMono", "colorPurple", "fw700")}>{r.reward}</span>
                  </div>
                  <div className={cx("text11", "colorMuted", "mb10")}>Referred {r.referee} - {r.stage}</div>
                  <button type="button" className={cx("btnSm", "btnAccent", styles.refApplyBtnPurple)}>Apply Credit</button>
                </div>
              ))}
            {referrals.filter((r) => r.rewardStatus === "pending").length === 0 && <div className={cx("text12", "colorMuted")}>No pending rewards</div>}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase")}>Referral Funnel</div>
            {[
              { stage: "Total Referrals", count: referrals.length, color: "var(--blue)" },
              { stage: "In Pipeline", count: pipeline.length, color: "var(--amber)" },
              { stage: "Converted", count: converted.length, color: "var(--accent)" },
              { stage: "Lost", count: referrals.filter((r) => r.status === "lost").length, color: "var(--red)" },
            ].map((f) => (
              <div key={f.stage} className={cx("flexRow", "gap12", "mb14", styles.refAlignCenter)}>
                <span className={cx("text12", styles.refFlex1)}>{f.stage}</span>
                  <div className={cx("progressBar", styles.refProg10)}>
                    <progress className={cx("barFill", "uiProgress", styles.refBarTone, styles.refProgFill10, toneClass(f.color))} max={100} value={(f.count / referrals.length) * 100} />
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
