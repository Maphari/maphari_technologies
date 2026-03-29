"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { formatStatus } from "@/lib/utils/format-status";
import type { AuthSession } from "../../../../lib/auth/session";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

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

  const cls = data?.level === "HIGH" ? cx("badgeRed") : data?.level === "MEDIUM" ? cx("badgeAmber") : data?.level === "LOW" ? cx("badgeGreen") : cx("badgeMuted");
  const label = data?.level ?? "…";

  return <span ref={ref} className={cls} title={data?.signals?.join("; ") ?? "Loading…"}>{label}</span>;
}

// ── Page component ────────────────────────────────────────────────────────

export function AdminClientsPageClient() {
  const { snapshot, loading, session } = useAdminWorkspaceContext();
  const clients = snapshot.clients;

  const total = clients.length;
  const activeClients = clients.filter((c) => c.status === "ACTIVE").length;
  const atRisk = clients.filter((c) => c.status === "AT_RISK").length;
  const churned = clients.filter((c) => c.status === "CHURNED").length;

  // Tier distribution for pipeline widget
  const enterprise = clients.filter((c) => c.tier === "ENTERPRISE").length;
  const growth = clients.filter((c) => c.tier === "GROWTH").length;
  const starter = clients.filter((c) => c.tier === "STARTER").length;

  // Health over time — approximate from status (area chart needs time-series; use tier counts as proxy)
  const healthChartData = [
    { label: "Starter", count: starter },
    { label: "Growth", count: growth },
    { label: "Enterprise", count: enterprise },
  ];

  const tableRows = clients.map((client) => ({
    id: client.id,
    name: client.name,
    tier: client.tier,
    status: formatStatus(client.status),
    _statusRaw: client.status,
    joined: client.contractStartAt ? client.contractStartAt.slice(0, 10) : "—",
  }));

  if (loading) {
    return (
      <div className={styles.pageBody}>
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
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>OPERATIONS / CLIENTS</div>
          <h1 className={styles.pageTitle}>Clients</h1>
          <div className={styles.pageSub}>Client portfolio · Health overview · Tier distribution</div>
        </div>
      </div>

      {/* Row 1 — 4 stat widgets */}
      <WidgetGrid>
        <StatWidget
          label="Total Clients"
          value={total}
          sub={`${activeClients} active`}
          tone="accent"
        />
        <StatWidget
          label="Active"
          value={activeClients}
          sub="Currently engaged"
          tone={activeClients > 0 ? "green" : "default"}
        />
        <StatWidget
          label="At Risk"
          value={atRisk}
          sub="Needs attention"
          tone={atRisk > 0 ? "amber" : "default"}
        />
        <StatWidget
          label="Churned"
          value={churned}
          sub="No longer active"
          tone={churned > 0 ? "red" : "default"}
        />
      </WidgetGrid>

      {/* Row 2 — area chart + pipeline by tier */}
      <WidgetGrid>
        <ChartWidget
          label="Clients by Tier"
          data={healthChartData}
          dataKey="count"
          type="area"
          color="#8b6fff"
          xKey="label"
        />
        <PipelineWidget
          label="Clients by Tier"
          stages={[
            { label: "Enterprise", count: enterprise || 0, total: total || 1, color: "#8b6fff" },
            { label: "Growth", count: growth || 0, total: total || 1, color: "#34d98b" },
            { label: "Starter", count: starter || 0, total: total || 1, color: "#f5a623" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — clients table */}
      <WidgetGrid>
        <TableWidget
          label="Client Directory"
          rows={tableRows as Record<string, unknown>[]}
          rowKey="id"
          emptyMessage="No clients found."
          columns={[
            { key: "name", header: "Name", align: "left" },
            { key: "tier", header: "Tier", align: "left" },
            {
              key: "status",
              header: "Status",
              align: "left",
              render: (_v, row) => {
                const raw = (row as { _statusRaw: string })._statusRaw;
                const badgeCls =
                  raw === "ACTIVE" ? cx("badgeGreen")
                  : raw === "AT_RISK" ? cx("badgeAmber")
                  : raw === "CHURNED" ? cx("badgeRed")
                  : cx("badgeMuted");
                return <span className={badgeCls}>{String(_v)}</span>;
              },
            },
            {
              key: "id",
              header: "Churn Risk",
              align: "right",
              render: (val) => (
                <ChurnRiskBadge clientId={String(val)} session={session} />
              ),
            },
            { key: "joined", header: "Joined", align: "right" },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}
