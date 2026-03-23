"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPageHeader, AdminSectionCard, AdminEmptyState } from "../../admin-primitives";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import styles from "@/app/style/admin.module.css";
import { cx } from "../style";
import { styles as dashboardStyles } from "../style";
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
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const accessToken = session?.accessToken as string | undefined;

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTriggered(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const load = useCallback(async () => {
    if (!triggered || !accessToken) return;
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:4000"}/clients/${clientId}/churn-risk`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!r.ok) return;
      const body = await r.json() as { success: boolean; data?: ChurnRiskData };
      if (body.success && body.data) setData(body.data);
    } catch { /* non-fatal */ }
  }, [triggered, clientId, accessToken]);

  useEffect(() => { void load(); }, [load]);

  const cls = data?.level === "HIGH" ? "churnBadgeHigh" : data?.level === "MEDIUM" ? "churnBadgeMedium" : data?.level === "LOW" ? "churnBadgeLow" : "churnBadgeLoading";
  const label = data?.level ?? "…";

  return <span ref={ref} className={cx(cls)} title={data?.signals?.join("; ") ?? "Loading…"}>{label}</span>;
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
