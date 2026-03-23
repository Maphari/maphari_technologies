"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader, AdminSectionCard, AdminEmptyState } from "../../admin-primitives";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import styles from "@/app/style/admin.module.css";
import { cx } from "../style";
import { styles as dashboardStyles } from "../style";
import { callGateway } from "../../../../lib/api/admin/_shared";
import type { AuthSession } from "../../../../lib/auth/session";

// ── Churn risk response shape ─────────────────────────────────────────────

type ChurnRiskData = {
  clientId: string;
  churnRisk: number;
  level: "HIGH" | "MEDIUM" | "LOW";
  signals: string[];
  healthScore: number;
  avgNps: number | null;
};

// ── ChurnRiskBadge component ──────────────────────────────────────────────

function ChurnRiskBadge({ clientId, session }: { clientId: string; session: AuthSession | null }) {
  const [data, setData] = useState<ChurnRiskData | null>(null);
  const [loading, setLoading] = useState(true);

  // Capture accessToken as stable primitive dep to avoid object-reference churn
  const accessToken = session?.accessToken ?? null;

  const fetchRisk = useCallback(async () => {
    if (!accessToken) { setLoading(false); return; }
    try {
      const res = await callGateway<ChurnRiskData>(
        `/clients/${clientId}/churn-risk`,
        accessToken,
      );
      if (res.payload.success && res.payload.data) {
        setData(res.payload.data);
      }
    } catch {
      // non-fatal — badge stays hidden on error
    } finally {
      setLoading(false);
    }
  }, [clientId, accessToken]);

  useEffect(() => {
    void fetchRisk();
  }, [fetchRisk]);

  if (loading) {
    return (
      <span className={cx("churnBadge", "churnBadgeLoading")}>
        …
      </span>
    );
  }

  if (!data) return null;

  const levelKey =
    data.level === "HIGH"
      ? "churnBadgeHigh"
      : data.level === "MEDIUM"
        ? "churnBadgeMedium"
        : "churnBadgeLow";

  return (
    <span
      className={cx("churnBadge", levelKey)}
      title={data.signals.length > 0 ? data.signals.join(" · ") : "No risk signals detected"}
    >
      {data.level}
    </span>
  );
}

// ── Page component ────────────────────────────────────────────────────────

export function AdminClientsPageClient() {
  const { snapshot, loading, session } = useAdminWorkspaceContext();

  return (
    <div className={dashboardStyles.pageBody}>
      <section className={styles.dashboard}>
        <AdminPageHeader title="Clients" subtitle="Manage client accounts and account health." />
        <AdminSectionCard title="Client Directory" subtitle="All client records from core service.">
          {loading ? <AdminEmptyState message="Loading clients..." /> : null}
          {!loading && snapshot.clients.length === 0 ? <AdminEmptyState message="No clients found." /> : null}
          {!loading && snapshot.clients.length > 0 ? (
            <div className={styles.table}>
              <div className={styles.tableRowHead}>
                <span>Name</span>
                <span>Status</span>
                <span>Churn Risk</span>
                <span>Client ID</span>
              </div>
              {snapshot.clients.map((client) => (
                <div key={client.id} className={styles.tableRow}>
                  <span>{client.name}</span>
                  <span>{client.status}</span>
                  <span>
                    <ChurnRiskBadge clientId={client.id} session={session} />
                  </span>
                  <span className={styles.mono}>{client.id.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </AdminSectionCard>
      </section>
    </div>
  );
}
