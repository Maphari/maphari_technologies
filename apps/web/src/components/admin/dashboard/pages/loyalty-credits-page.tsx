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

  return (
    <div className={cx(styles.pageBody)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>FINANCE / LOYALTY & CREDITS</div>
          <h1 className={styles.pageTitle}>Loyalty & Credits</h1>
          <div className={styles.pageSub}>Manage client credit balances, tiers, and redemptions</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>Issue Credits</button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className={styles.cjKpiGrid}>
        {[
          { label: "Credits Issued",       value: `${(totalIssued / 1000).toFixed(0)}k pts`,   sub: "All time",              color: "var(--red)"   },
          { label: "Active Members",        value: String(activeMembers),                         sub: "With credit balance",   color: "var(--accent)"},
          { label: "Redeemed",             value: `${(totalRedeemed / 1000).toFixed(1)}k pts`,  sub: "Applied to accounts",   color: "var(--amber)" },
          { label: "Pending Approval",     value: String(pendingCount),                           sub: "Credit requests",       color: "var(--blue)"  },
        ].map((k) => (
          <div key={k.label} className={cx(styles.cjKpiCard, toneClass(k.color))}>
            <div className={styles.cjKpiLabel}>{k.label}</div>
            <div className={cx(styles.cjKpiValue, toneClass(k.color))}>{k.value}</div>
            <div className={styles.cjKpiMeta}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className={styles.teamFilters}>
        {tabs.map((t) => (
          <button key={t} type="button" className={cx("btnSm", activeTab === t ? "btnAccent" : "btnGhost")} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Members table ── */}
      {activeTab === "members" ? (
        <div className={styles.teamSection}>
          <div className={styles.teamSectionHeader}>
            <span className={styles.teamSectionTitle}>Client Members</span>
            <span className={styles.teamSectionMeta}>{members.length} CLIENTS</span>
          </div>
          <div className={styles.loyHead}>
            {["Client", "Tier", "Balance", "Earned (All-time)", "Last Activity", "Actions"].map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {members.length === 0 ? (
            <div className={cx("colorMuted", "text12", "textCenter", "py24")}>No loyalty members yet.</div>
          ) : null}
          {members.map((m) => (
            <div key={m.id} className={styles.loyRow}>
              <span className={cx("fw600", "text13")}>{m.client}</span>
              <span className={cx("badge", tierBadge(m.tier))}>{m.tier}</span>
              <span className={cx("fontMono", "fw700", "colorAccent")}>{m.balance.toLocaleString()} pts</span>
              <span className={cx("fontMono", "text12", "colorMuted")}>{m.earned.toLocaleString()} pts</span>
              <span className={cx("text12", "colorMuted")}>{m.lastActivity}</span>
              <div className={cx("flexRow", "gap6")}>
                <button type="button" className={cx("btnSm", "btnGhost")}>View History</button>
                <button type="button" className={cx("btnSm", "btnGhost")}>Adjust</button>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "credit log" ? (
        <div className={styles.teamSection}>
          <div className={styles.teamSectionHeader}>
            <span className={styles.teamSectionTitle}>Credit Log</span>
            <span className={styles.teamSectionMeta}>{creditLog.length} ITEMS</span>
          </div>
          {creditLog.length === 0 ? (
            <div className={cx("colorMuted", "text12", "textCenter", "py24")}>No transactions yet.</div>
          ) : creditLog.map((t) => (
            <div key={t.id} className={cx(styles.loyRow)}>
              <span className={cx("fw600", "text13")}>{t.clientLabel}</span>
              <span className={cx("badge", t.type === "EARNED" ? "badgeGreen" : t.type === "REDEEMED" ? "badgeAmber" : "badge")}>{t.type}</span>
              <span className={cx("fontMono", "fw700", t.type === "REDEEMED" ? "colorAmber" : "colorAccent")}>{t.type === "REDEEMED" ? "-" : "+"}{t.points.toLocaleString()} pts</span>
              <span className={cx("text12", "colorMuted")}>{t.description ?? "—"}</span>
              <span className={cx("text12", "colorMuted")}>{new Date(t.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.teamSection}>
          <div className={styles.teamSectionHeader}>
            <span className={styles.teamSectionTitle}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            <span className={styles.teamSectionMeta}>0 ITEMS</span>
          </div>
          <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No data available for this view yet.</div>
        </div>
      )}
    </div>
  );
}
