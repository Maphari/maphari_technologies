"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { toneClass } from "./admin-page-utils";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
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
  const [error, setError]             = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<Tab>("referral log");

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const [refRes, snapRes] = await Promise.all([
          loadAllReferralsWithRefresh(session),
          loadAdminSnapshotWithRefresh(session),
        ]);
        if (cancelled) return;
        if (refRes.nextSession)       saveSession(refRes.nextSession);
        else if (snapRes.nextSession) saveSession(snapRes.nextSession);
        if (refRes.error) { setError(refRes.error.message ?? "Failed to load."); return; }
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
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
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

  const monthlyData = [
    { label: "Jan", count: 0 }, { label: "Feb", count: 0 }, { label: "Mar", count: referrals.length },
  ];

  const tableRows = referrals.map(r => ({
    referredBy: r.referrer,
    company: r.referee,
    status: r.status,
    value: r.actualMRR ? `R${(r.actualMRR / 1000).toFixed(0)}k` : "—",
    date: r.referralDate,
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>EXPERIENCE / REFERRALS</div>
          <h1 className={styles.pageTitle}>Referral Tracking</h1>
          <div className={styles.pageSub}>Referral pipeline · Conversion rate · Program health</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent", "fontMono")}>+ Log Referral</button>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Total Referrals" value={referrals.length} sub={`${pipeline.length} in pipeline`} tone="accent" />
        <StatWidget label="Converted" value={converted.length} sub={`${conversionRate}% conversion`} subTone="up" tone="green" />
        <StatWidget label="Pending" value={pipeline.length} sub="In progress" tone="amber" />
        <StatWidget label="Referral Revenue" value={`R${(totalRevenue / 1000).toFixed(0)}k`} sub="Cumulative MRR" tone="default" />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Referrals by Month"
          data={monthlyData}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Referral Pipeline"
          stages={[
            { label: "Referred", count: referrals.length, total: Math.max(referrals.length, 1), color: "#8b6fff" },
            { label: "Contacted", count: pipeline.length, total: Math.max(referrals.length, 1), color: "#f5a623" },
            { label: "Trial", count: Math.max(0, pipeline.length - 1), total: Math.max(referrals.length, 1), color: "#34d98b" },
            { label: "Converted", count: converted.length, total: Math.max(referrals.length, 1), color: "#34d98b" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Referrals"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "referredBy", header: "Referred By" },
            { key: "company", header: "Company" },
            { key: "status", header: "Status", render: (v) => {
              const val = v as string;
              const sc = statusConfig[val as keyof typeof statusConfig];
              const cls = val === "converted" ? cx("badge", "badgeGreen") : val === "lost" ? cx("badge", "badgeRed") : cx("badge", "badgeAmber");
              return <span className={cls}>{sc?.label ?? val}</span>;
            }},
            { key: "value", header: "Value", align: "right" },
            { key: "date", header: "Date", align: "right" },
          ]}
          emptyMessage="No referrals yet"
        />
      </WidgetGrid>
    </div>
  );
}
