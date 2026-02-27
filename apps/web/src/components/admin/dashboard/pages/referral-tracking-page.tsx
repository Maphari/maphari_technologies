"use client";

import { useState } from "react";
import { AdminTabs } from "./shared";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  lime: "#a78bfa",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0",
};

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
  { id: "REF-012", referrer: "Volta Studios", referrerColor: C.lime, referee: "Horizon Media", referralDate: "Feb 5", status: "in-pipeline", stage: "Proposal Sent", potentialMRR: 28000, actualMRR: null, reward: "R2,800 credit", rewardStatus: "pending" },
  { id: "REF-011", referrer: "Okafor & Sons", referrerColor: C.orange, referee: "Apex Financial", referralDate: "Jan 22", status: "in-pipeline", stage: "Negotiation", potentialMRR: 45000, actualMRR: null, reward: "R4,500 credit", rewardStatus: "pending" },
  { id: "REF-010", referrer: "Volta Studios", referrerColor: C.lime, referee: "Vivid Commerce", referralDate: "Dec 12", status: "converted", stage: "Closed Won", potentialMRR: 18000, actualMRR: 18000, reward: "R1,800 credit", rewardStatus: "applied" },
  { id: "REF-009", referrer: "Okafor & Sons", referrerColor: C.orange, referee: "Solar Sense", referralDate: "Nov 30", status: "converted", stage: "Closed Won", potentialMRR: 22000, actualMRR: 22000, reward: "R2,200 credit", rewardStatus: "applied" },
  { id: "REF-008", referrer: "Mira Health", referrerColor: C.blue, referee: "Pulse Clinics", referralDate: "Nov 8", status: "lost", stage: "Closed Lost", potentialMRR: 15000, actualMRR: null, reward: null, rewardStatus: "n/a" },
  { id: "REF-007", referrer: "Volta Studios", referrerColor: C.lime, referee: "Beam Studio", referralDate: "Oct 14", status: "converted", stage: "Closed Won", potentialMRR: 28000, actualMRR: 28000, reward: "R2,800 credit", rewardStatus: "applied" },
];

const referralProgram = {
  rewardType: "Invoice Credit",
  rewardRate: "10% of first month's retainer",
  minRetainer: 12000,
  eligibility: "Active clients on Core tier and above",
  payoutTrigger: "After new client's first invoice is paid",
};

const topReferrers: TopReferrer[] = [
  { client: "Volta Studios", color: C.lime, referrals: 3, converted: 2, totalRevenue: 46000, totalReward: 4600 },
  { client: "Okafor & Sons", color: C.orange, referrals: 2, converted: 2, totalRevenue: 40000, totalReward: 4000 },
  { client: "Mira Health", color: C.blue, referrals: 1, converted: 0, totalRevenue: 0, totalReward: 0 },
];

const statusConfig: Record<ReferralStatus, { color: string; label: string }> = {
  "in-pipeline": { color: C.blue, label: "In Pipeline" },
  converted: { color: C.lime, label: "Converted" },
  lost: { color: C.red, label: "Lost" },
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
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Referral Tracking</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Client referrals - Rewards - Conversion - Attribution</div>
        </div>
        <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Log Referral</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Referrals", value: referrals.length.toString(), color: C.lime, sub: `${pipeline.length} in pipeline` },
          { label: "Conversion Rate", value: `${conversionRate}%`, color: conversionRate >= 60 ? C.lime : C.amber, sub: `${converted.length} of ${closed} closed` },
          { label: "Revenue via Referral", value: `R${(totalRevenue / 1000).toFixed(0)}k`, color: C.blue, sub: "Cumulative MRR added" },
          { label: "Rewards Issued", value: `R${(totalRewards / 1000).toFixed(1)}k`, color: C.purple, sub: "Invoice credits applied" },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor={C.lime}
        mutedColor={C.muted}
        panelColor={C.surface}
        borderColor={C.border}
      />

      {activeTab === "referral log" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {referrals.map((r) => {
            const sc = statusConfig[r.status];
            return (
              <div
                key={r.id}
                style={{
                  background: C.surface,
                  border: `1px solid ${r.status === "converted" ? `${C.lime}33` : r.status === "lost" ? `${C.red}33` : C.border}`,
                  borderRadius: 10,
                  padding: 20,
                  display: "grid",
                  gridTemplateColumns: "70px 160px 160px 100px 120px 100px 120px 100px auto",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{r.id}</span>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>Referrer</div>
                  <div style={{ fontWeight: 700, color: r.referrerColor }}>{r.referrer}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>Referee</div>
                  <div style={{ fontWeight: 600 }}>{r.referee}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Referred</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11 }}>{r.referralDate}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Stage</div>
                  <div style={{ fontSize: 11, color: sc.color }}>{r.stage}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Pot. MRR</div>
                  <div style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{(r.potentialMRR / 1000).toFixed(0)}k</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Reward</div>
                  <div style={{ fontSize: 11, color: r.rewardStatus === "applied" ? C.lime : r.rewardStatus === "pending" ? C.amber : C.muted }}>{r.reward || "-"}</div>
                </div>
                <span style={{ fontSize: 10, color: sc.color, background: `${sc.color}15`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{sc.label}</span>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Update</button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "top referrers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[...topReferrers].sort((a, b) => b.converted - a.converted).map((ref, i) => (
            <div key={ref.client} style={{ background: C.surface, border: `1px solid ${ref.color}33`, borderRadius: 10, padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "240px 100px 100px 120px 120px auto", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${ref.color}22`, border: `2px solid ${ref.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: ref.color, fontFamily: "DM Mono, monospace" }}>{i + 1}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: ref.color }}>{ref.client}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Referrals</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 20, color: C.blue }}>{ref.referrals}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Converted</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 20, color: ref.converted > 0 ? C.lime : C.muted }}>{ref.converted}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Revenue Added</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.lime }}>R{(ref.totalRevenue / 1000).toFixed(0)}k</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Rewards Earned</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.purple }}>R{(ref.totalReward / 1000).toFixed(1)}k</div>
                </div>
                <button style={{ background: `${ref.color}15`, border: `1px solid ${ref.color}44`, color: ref.color, padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Thank Client</button>
              </div>
              {ref.referrals > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>Conversion rate</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: ref.converted > 0 ? C.lime : C.muted }}>{Math.round((ref.converted / Math.max(ref.referrals - pipeline.filter((p) => p.referrer === ref.client).length, 1)) * 100)}%</span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${(ref.converted / ref.referrals) * 100}%`, background: ref.color, borderRadius: 2 }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "program settings" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Current Program Rules</div>
            {Object.entries(referralProgram).map(([key, val]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.border}`, alignItems: "flex-start", gap: 20 }}>
                <span style={{ fontSize: 12, color: C.muted, textTransform: "capitalize", flexShrink: 0 }}>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text, textAlign: "right" }}>{String(val)}</span>
              </div>
            ))}
            <button style={{ marginTop: 20, background: C.lime, color: C.bg, border: "none", padding: "10px 20px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Edit Program Rules</button>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pending Rewards</div>
            {referrals
              .filter((r) => r.rewardStatus === "pending")
              .map((r) => (
                <div key={r.id} style={{ padding: 14, background: C.bg, borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{r.referrer}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", color: C.purple, fontWeight: 700 }}>{r.reward}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Referred {r.referee} - {r.stage}</div>
                  <button style={{ background: C.purple, color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Apply Credit</button>
                </div>
              ))}
            {referrals.filter((r) => r.rewardStatus === "pending").length === 0 && <div style={{ fontSize: 12, color: C.muted }}>No pending rewards</div>}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Referral Funnel</div>
            {[
              { stage: "Total Referrals", count: referrals.length, color: C.blue },
              { stage: "In Pipeline", count: pipeline.length, color: C.amber },
              { stage: "Converted", count: converted.length, color: C.lime },
              { stage: "Lost", count: referrals.filter((r) => r.status === "lost").length, color: C.red },
            ].map((f) => (
              <div key={f.stage} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 12, flex: 1 }}>{f.stage}</span>
                <div style={{ width: 120, height: 10, background: C.border, borderRadius: 5 }}>
                  <div style={{ height: "100%", width: `${(f.count / referrals.length) * 100}%`, background: f.color, borderRadius: 5 }} />
                </div>
                <span style={{ fontFamily: "DM Mono, monospace", color: f.color, fontWeight: 800, width: 20 }}>{f.count}</span>
              </div>
            ))}
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.lime}22`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: C.lime, textTransform: "uppercase" }}>Referral Program ROI</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 40, fontWeight: 800, color: C.lime }}>R{(totalRevenue / 1000).toFixed(0)}k</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>MRR generated via referrals</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
              <span style={{ color: C.muted }}>Rewards paid out</span>
              <span style={{ color: C.purple, fontFamily: "DM Mono, monospace", fontWeight: 700 }}>R{(totalRewards / 1000).toFixed(1)}k</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: C.muted }}>Net revenue per R1 reward</span>
              <span style={{ color: C.lime, fontFamily: "DM Mono, monospace", fontWeight: 700 }}>R{(totalRevenue / Math.max(totalRewards, 1)).toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
