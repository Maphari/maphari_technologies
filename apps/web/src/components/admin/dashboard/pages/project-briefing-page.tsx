// ════════════════════════════════════════════════════════════════════════════
// project-briefing-page.tsx — Admin Project Briefing
// Data : loadProjectDirectoryWithRefresh → GET /projects/directory
//        loadClientDirectoryWithRefresh  → GET /clients/directory
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import { cx, styles } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadProjectDirectoryWithRefresh } from "../../../../lib/api/admin/projects";
import { loadClientDirectoryWithRefresh } from "../../../../lib/api/admin/clients";
import type { AdminProject } from "../../../../lib/api/admin/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhase(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatBudget(cents: number): string {
  return formatMoneyCents(cents, { maximumFractionDigits: 0 });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "2-digit" });
  } catch { return "—"; }
}

function riskLabel(level: string): string {
  if (level === "HIGH")   return "High — escalation needed";
  if (level === "MEDIUM") return "Moderate risk";
  return "Low risk";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectBriefingPage({ session }: { session: AuthSession | null }) {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void Promise.all([
      loadProjectDirectoryWithRefresh(session, { pageSize: 50 }),
      loadClientDirectoryWithRefresh(session, { pageSize: 100 }),
    ]).then(([projRes, clientRes]) => {
      if (cancelled) return;
      if (projRes.nextSession) saveSession(projRes.nextSession);
      if (clientRes.nextSession) saveSession(clientRes.nextSession);
      if (projRes.error) { setError(projRes.error.message ?? "Failed to load."); return; }
      if (projRes.data?.items) setProjects(projRes.data.items);
      if (!clientRes.error && clientRes.data?.items) {
        const map: Record<string, string> = {};
        for (const c of clientRes.data.items) map[c.id] = c.name;
        setClientNames(map);
      }
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

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

  // Build chart data: briefs by status
  const statusCounts: Record<string, number> = {};
  for (const p of projects) {
    const s = formatPhase(p.status);
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }
  const briefsByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  const draftCount = projects.filter((p) => p.status === "PLANNING" || p.status === "DRAFT").length;
  const approvedCount = projects.filter((p) => p.status === "ACTIVE" || p.status === "IN_PROGRESS").length;
  const pendingSignOff = projects.filter((p) => p.status === "REVIEW").length;

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / PROJECT BRIEFING</div>
          <h1 className={styles.pageTitle}>Project Briefing</h1>
          <div className={styles.pageSub}>One-page context view per project for quick executive review</div>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <WidgetGrid columns={4}>
        <StatWidget label="Total Briefs" value={String(projects.length)} sub="All projects" />
        <StatWidget label="Draft" value={String(draftCount)} tone="amber" sub="In planning" />
        <StatWidget label="Approved" value={String(approvedCount)} tone="green" sub="Active projects" />
        <StatWidget label="Pending Client Sign-off" value={String(pendingSignOff)} tone={pendingSignOff > 0 ? "amber" : "accent"} />
      </WidgetGrid>

      {/* ── Charts & Pipeline ───────────────────────────────────────────── */}
      <WidgetGrid columns={2}>
        <ChartWidget
          label="Briefs by Status"
          data={briefsByStatus}
          dataKey="count"
          xKey="status"
          type="bar"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Brief Stages"
          stages={[
            { label: "Draft", count: draftCount, total: Math.max(projects.length, 1), color: "#f5a623" },
            { label: "Internal Review", count: projects.filter((p) => p.status === "REVIEW").length, total: Math.max(projects.length, 1), color: "#8b6fff" },
            { label: "Client Review", count: pendingSignOff, total: Math.max(projects.length, 1), color: "#f5a623" },
            { label: "Approved", count: approvedCount, total: Math.max(projects.length, 1), color: "#34d98b" },
          ]}
        />
      </WidgetGrid>

      {/* ── Briefs Table ─────────────────────────────────────────────────── */}
      <TableWidget
        label="Project Briefs"
        rows={projects}
        rowKey="id"
        emptyMessage="No active projects found."
        columns={[
          { key: "project", header: "Project", render: (_, row) => row.name },
          { key: "client", header: "Client", render: (_, row) => clientNames[row.clientId] ?? "Unknown client" },
          { key: "status", header: "Status", render: (_, row) => (
            <span className={cx("badge", row.status === "ACTIVE" || row.status === "IN_PROGRESS" ? "badgeGreen" : row.status === "REVIEW" ? "badgeAmber" : "badgeMuted")}>
              {formatPhase(row.status)}
            </span>
          )},
          { key: "version", header: "Progress", align: "right", render: (_, row) => `${row.progressPercent}%` },
          { key: "updated", header: "Due Date", render: (_, row) => formatDate(row.dueAt) },
        ]}
      />
    </div>
  );
}
