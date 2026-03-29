// ════════════════════════════════════════════════════════════════════════════
// contract-renewal-page.tsx — Admin contract renewal tracker
// Data   : loadAdminContractsWithRefresh → all contracts
// Layout : KPI strip / contract list sorted by expiresAt asc
// Traffic-light: GREEN >60d, AMBER 30-60d, RED <30d or expired
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useState } from "react";
import { loadAdminContractsWithRefresh, createRenewalProposalWithRefresh, type LegalContract } from "../../../../lib/api/admin/contracts";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { formatStatus } from "@/lib/utils/format-status";

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntilExpiry(expiresAt: string): number {
  const now  = Date.now();
  const exp  = new Date(expiresAt).getTime();
  return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
}

function formatExpiry(expiresAt: string): string {
  return new Date(expiresAt).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type TrafficLight = "green" | "amber" | "red";

function trafficLight(expiresAt: string | null): TrafficLight {
  if (!expiresAt) return "green"; // no expiry = no concern
  const days = daysUntilExpiry(expiresAt);
  if (days > 60)  return "green";
  if (days >= 30) return "amber";
  return "red";
}

function badgeClassForLight(light: TrafficLight): string {
  if (light === "green") return styles.lglStatusAccent;
  if (light === "amber") return styles.lglStatusAmber;
  return styles.lglStatusRed;
}

function badgeLabelForLight(light: TrafficLight, expiresAt: string | null): string {
  if (!expiresAt) return "No expiry";
  const days = daysUntilExpiry(expiresAt);
  if (days <= 0)  return `Expired ${Math.abs(days)}d ago`;
  return `${days}d remaining`;
}

// ── Sorting: soonest-expiring first (nulls last) ──────────────────────────────

function sortByExpiry(contracts: LegalContract[]): LegalContract[] {
  return [...contracts].sort((a, b) => {
    if (!a.expiresAt && !b.expiresAt) return 0;
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
  });
}

// ── KPI computations ──────────────────────────────────────────────────────────

function kpisFromContracts(contracts: LegalContract[]) {
  const now  = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();

  let expiringThisMonth = 0;
  let criticalOrExpired = 0;
  let activeHealthy     = 0;

  for (const c of contracts) {
    if (!c.expiresAt) {
      activeHealthy++;
      continue;
    }
    const days = daysUntilExpiry(c.expiresAt);
    const expMs = new Date(c.expiresAt).getTime();
    if (days <= 0) {
      criticalOrExpired++;
    } else if (expMs <= endOfMonth) {
      expiringThisMonth++;
    } else if (days <= 30) {
      criticalOrExpired++;
    } else if (days > 60) {
      activeHealthy++;
    }
  }

  return { expiringThisMonth, criticalOrExpired, activeHealthy, total: contracts.length };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContractRenewalPage() {
  const { session } = useAdminWorkspaceContext();

  const [contracts, setContracts] = useState<LegalContract[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [sentIds,   setSentIds]   = useState<Set<string>>(new Set());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadContracts = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await loadAdminContractsWithRefresh(session);
      if (result.data)  setContracts(result.data);
      else if (result.error) setError(result.error.message ?? "Unable to load contracts.");
    } catch (err) {
      setError((err as Error)?.message ?? "Unable to load contracts.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  async function handleSendProposal(contract: LegalContract) {
    if (!session) return;
    try {
      const result = await createRenewalProposalWithRefresh(session, contract.id);
      if (result.error) {
        setError(result.error.message ?? "Failed to send renewal proposal.");
        return;
      }
      setSentIds((prev) => new Set([...prev, contract.id]));
      setSuccessMsg(`Renewal proposal sent for: ${contract.title}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to send renewal proposal.");
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const sorted = sortByExpiry(contracts);
  const kpis   = kpisFromContracts(contracts);

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

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={cx(styles.pageBody, styles.lglRoot)}>
      {successMsg ? <div className={cx(styles.card, "colorAccent", "text13")} style={{ padding: "8px 12px", marginBottom: 8 }}>{successMsg}</div> : null}
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / CONTRACT RENEWAL TRACKER</div>
          <h1 className={styles.pageTitle}>Contract Renewal Tracker</h1>
          <div className={styles.pageSub}>
            Traffic-light expiry status · Renewal proposals · Sorted by earliest expiry
          </div>
        </div>
        <div className={styles.lglHeadActions}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void loadContracts()}>
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb28")}>
        <div className={cx(styles.statCard, kpis.expiringThisMonth > 0 ? styles.lglStatAlertAmber : "")}>
          <div className={styles.statLabel}>Expiring This Month</div>
          <div className={cx(styles.statValue, kpis.expiringThisMonth > 0 ? "colorAmber" : "colorAccent")}>
            {kpis.expiringThisMonth}
          </div>
          <div className={cx("text11", "colorMuted")}>Action required soon</div>
        </div>

        <div className={cx(styles.statCard, kpis.criticalOrExpired > 0 ? styles.lglStatAlertRed : "")}>
          <div className={styles.statLabel}>Expired / Critical</div>
          <div className={cx(styles.statValue, kpis.criticalOrExpired > 0 ? "colorRed" : "colorAccent")}>
            {kpis.criticalOrExpired}
          </div>
          <div className={cx("text11", "colorMuted")}>
            {kpis.criticalOrExpired > 0 ? "Renew immediately" : "No critical contracts"}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active &amp; Healthy</div>
          <div className={cx(styles.statValue, "colorAccent")}>{kpis.activeHealthy}</div>
          <div className={cx("text11", "colorMuted")}>&gt;60 days or no expiry</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Contracts</div>
          <div className={cx(styles.statValue, "colorText")}>{kpis.total}</div>
          <div className={cx("text11", "colorMuted")}>All clients</div>
        </div>
      </div>

      {/* ── Contract list ─────────────────────────────────────────────────── */}
      <div className={styles.lglTableCard}>
        <div className={styles.lglTableMin980}>
          {/* Header row */}
          <div className={cx(styles.crtHead, "fontMono", "text10", "colorMuted", "uppercase")}>
            <span>Client ID</span>
            <span>Title</span>
            <span>Type</span>
            <span>Expiry Date</span>
            <span>Days Remaining</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {sorted.length === 0 && (
            <div className={cx("text12", "colorMuted", "p16")}>
              No contracts found. Add contracts via the Legal Control Center.
            </div>
          )}

          {sorted.map((contract, i) => {
            const light     = trafficLight(contract.expiresAt);
            const badgeCls  = badgeClassForLight(light);
            const badgeLbl  = badgeLabelForLight(light, contract.expiresAt);
            const alreadySent = sentIds.has(contract.id);

            const rowAlertCls =
              light === "red"   ? styles.lglContractRowExpired :
              light === "amber" ? styles.lglContractRowSoon    : "";

            return (
              <div
                key={contract.id}
                className={cx(
                  styles.crtRow,
                  i < sorted.length - 1 && "borderB",
                  rowAlertCls
                )}
              >
                <span className={styles.lglMonoMuted}>{contract.clientId.slice(0, 8)}&hellip;</span>
                <span className={styles.lglCellStrong}>{contract.title}</span>
                <span className={styles.lglCellMuted}>{contract.type}</span>
                <span className={styles.lglMonoMuted}>
                  {contract.expiresAt ? formatExpiry(contract.expiresAt) : "—"}
                </span>
                <span className={cx(styles.lglStatusBadge, badgeCls)}>{badgeLbl}</span>
                <span className={cx(styles.lglStatusBadge, light === "green" ? styles.lglStatusAccent : light === "amber" ? styles.lglStatusAmber : styles.lglStatusRed)}>
                  {formatStatus(contract.status)}
                </span>
                <div className={styles.lglActionRow}>
                  <button
                    type="button"
                    className={cx("btnSm", alreadySent ? "btnGhost" : "btnAccent")}
                    onClick={() => { void handleSendProposal(contract); }}
                    disabled={alreadySent}
                  >
                    {alreadySent ? "Sent" : "Send Renewal Proposal"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
