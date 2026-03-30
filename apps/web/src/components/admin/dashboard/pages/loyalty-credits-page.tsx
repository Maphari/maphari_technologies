// ════════════════════════════════════════════════════════════════════════════
// loyalty-credits-page.tsx — Admin Loyalty & Credits
// Data     : loadLoyaltyAccountsWithRefresh → GET /loyalty
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { loadLoyaltyAccountsWithRefresh, type AdminLoyaltyAccount } from "../../../../lib/api/admin";
import { saveSession } from "../../../../lib/auth/session";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

// ── Types & helpers ────────────────────────────────────────────────────────────
type Tab = "members" | "credit log" | "rules" | "redemptions";
const tabs: Tab[] = ["members", "credit log", "rules", "redemptions"];

function tierBadge(tier: string) {
  const t = tier.toUpperCase();
  if (t === "GOLD")     return "badgeAmber";
  if (t === "SILVER")   return "badgeBlue";
  if (t === "PLATINUM") return "badgePurple";
  return "badgeMuted";
}

function fmtLastActivity(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function LoyaltyCreditsPage({ session }: { session: AuthSession | null }) {
  const [apiAccounts, setApiAccounts] = useState<AdminLoyaltyAccount[]>([]);
  const [activeTab,   setActiveTab]   = useState<Tab>("members");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadLoyaltyAccountsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) setError(r.error.message ?? "Failed to load.");
      else if (r.data) setApiAccounts(r.data);
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      setLoading(false);
    });
  }, [session]);

  const members = useMemo(() => apiAccounts.map((a) => ({
    id:           a.id,
    clientId:     a.clientId,
    client:       `Client ${a.clientId.slice(0, 6).toUpperCase()}`,
    tier:         a.tier.charAt(0).toUpperCase() + a.tier.slice(1).toLowerCase(),
    balance:      a.balancePoints,
    earned:       a.totalEarned,
    lastActivity: fmtLastActivity(a.lastActivityAt),
    transactions: a.transactions,
  })), [apiAccounts]);

  const totalIssued   = members.reduce((s, m) => s + m.earned, 0);
  const activeMembers = members.length;
  const totalRedeemed = members.reduce((s, m) => s + (m.earned - m.balance), 0);
  const pendingCount  = members.filter((m) => m.transactions.some((t) => t.type === "PENDING")).length;

  // Recent transactions across all accounts for "credit log" tab
  const creditLog = useMemo(() => {
    const all = members.flatMap((m) => m.transactions.map((t) => ({ ...t, clientLabel: m.client })));
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return all.slice(0, 30);
  }, [members]);

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

  const creditsByMonth = [
    { label: "Jan", count: 0 },
    { label: "Feb", count: 0 },
    { label: "Mar", count: totalIssued },
  ];

  const tableRows = members.map((m) => ({
    client:      m.client,
    tier:        m.tier,
    balance:     `${m.balance.toLocaleString()} pts`,
    earned:      `${m.earned.toLocaleString()} pts`,
    lastActivity: m.lastActivity,
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>EXPERIENCE / LOYALTY</div>
          <h1 className={styles.pageTitle}>Loyalty Credits</h1>
          <div className={styles.pageSub}>Credits issued · Redemption rate · Program health</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>Issue Credits</button>
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Total Credits Issued" value={`${(totalIssued / 1000).toFixed(0)}k pts`} sub="All time" tone="accent" />
        <StatWidget label="Redeemed" value={`${(totalRedeemed / 1000).toFixed(1)}k pts`} sub="Applied to accounts" subTone="up" tone="green" />
        <StatWidget label="Pending" value={pendingCount} sub="Credit requests" tone={pendingCount > 0 ? "amber" : "default"} />
        <StatWidget label="Program Participants" value={activeMembers} sub="With credit balance" tone="default" />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Credits Issued by Month"
          data={creditsByMonth}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Credit Status"
          stages={[
            { label: "Issued",   count: totalIssued,   total: Math.max(totalIssued, 1),   color: "#8b6fff" },
            { label: "Pending",  count: pendingCount,  total: Math.max(totalIssued, 1),   color: "#f5a623" },
            { label: "Redeemed", count: totalRedeemed, total: Math.max(totalIssued, 1),   color: "#34d98b" },
            { label: "Expired",  count: 0,             total: Math.max(totalIssued, 1),   color: "#888"    },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Loyalty Members"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "client",      header: "Client" },
            { key: "tier",        header: "Tier", render: (v) => {
              const val = v as string;
              const cls = tierBadge(val);
              return <span className={cx("badge", cls)}>{val}</span>;
            }},
            { key: "balance",     header: "Balance",    align: "right" },
            { key: "earned",      header: "Earned",     align: "right" },
            { key: "lastActivity", header: "Last Activity", align: "right" },
          ]}
          emptyMessage="No loyalty members yet"
        />
      </WidgetGrid>
    </div>
  );
}
