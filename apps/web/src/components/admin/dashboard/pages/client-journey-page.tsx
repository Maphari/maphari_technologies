"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { queueAutomationJobWithRefresh } from "../../../../lib/api/admin/automation";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

type JourneyTab = "journey map" | "handoff health" | "stage aging" | "moments";
type JourneyStage = "Acquisition" | "Onboarding" | "Adoption" | "Value" | "Renewal" | "Advocacy";

function daysFromNow(value?: string | null): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.ceil((ms - Date.now()) / 86400000);
}

function daysSince(value?: string | null): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.floor((Date.now() - ms) / 86400000));
}

function stageColor(stage: JourneyStage): string {
  if (stage === "Acquisition") return "var(--blue)";
  if (stage === "Onboarding") return "var(--amber)";
  if (stage === "Adoption") return "var(--blue)";
  if (stage === "Value") return "var(--accent)";
  if (stage === "Renewal") return "var(--amber)";
  return "var(--accent)";
}

function riskColor(level: "Low" | "Medium" | "High"): string {
  if (level === "High") return "var(--red)";
  if (level === "Medium") return "var(--amber)";
  return "var(--accent)";
}

function money(amountCents: number, currency?: string): string {
  const code = currency && currency !== "AUTO" ? currency : undefined;
  return formatMoneyCents(amountCents, { currency: code, maximumFractionDigits: 0 });
}

function stageForClient(input: {
  status: string;
  wonLeads: number;
  projectsCount: number;
  activeProjects: number;
  avgProgress: number;
  overdueInvoices: number;
  renewalDays: number | null;
}): JourneyStage {
  if (input.wonLeads === 0) return "Acquisition";
  if (input.status === "ONBOARDING") return "Onboarding";
  if (input.projectsCount === 0) return "Acquisition";
  if (input.activeProjects > 0 && input.avgProgress < 60) return "Adoption";
  if (input.activeProjects > 0 && input.avgProgress >= 60) return "Value";
  if (input.renewalDays !== null && input.renewalDays <= 60) return "Renewal";
  if (input.overdueInvoices === 0) return "Advocacy";
  return "Value";
}

function riskForClient(input: {
  overdueInvoices: number;
  blockedProjects: number;
  paused: boolean;
  renewalDays: number | null;
  staleDays: number;
}): "Low" | "Medium" | "High" {
  let score = 0;
  score += input.overdueInvoices * 2;
  score += input.blockedProjects * 2;
  if (input.paused) score += 2;
  if (input.renewalDays !== null && input.renewalDays <= 30) score += 1;
  if (input.staleDays >= 14) score += 1;
  if (score >= 5) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

// ── New helpers for redesign ──────────────────────────────────────

function riskStripCls(risk: "Low" | "Medium" | "High"): string {
  if (risk === "High")   return styles.cjStripRed;
  if (risk === "Medium") return styles.cjStripAmber;
  return styles.cjStripAccent;
}

function stageFillCls(color: string): string {
  if (color === "var(--blue)")  return styles.cjFillBlue;
  if (color === "var(--amber)") return styles.cjFillAmber;
  return styles.cjFillAccent;
}

function ageBarTone(days: number): string {
  if (days >= 45) return "toneRed";
  if (days >= 21) return "toneAmber";
  return "toneMuted";
}

function ageBarFillCls(days: number): string {
  if (days >= 45) return styles.cjFillRed;
  if (days >= 21) return styles.cjFillAmber;
  return styles.cjFillMuted;
}

export function ClientJourneyPage({
  snapshot,
  session,
  onNotify,
  currency
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  onNotify: (tone: "success" | "error", message: string) => void;
  currency: string;
}) {
  const [activeTab, setActiveTab] = useState<JourneyTab>("journey map");
  const [stageFilter, setStageFilter] = useState<"ALL" | JourneyStage>("ALL");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "Low" | "Medium" | "High">("ALL");
  const [ownerFilter, setOwnerFilter] = useState<string>("ALL");

  const rows = useMemo(() => {
    return snapshot.clients.map((client) => {
      const leads = snapshot.leads.filter((lead) => lead.clientId === client.id);
      const projects = snapshot.projects.filter((project) => project.clientId === client.id);
      const invoices = snapshot.invoices.filter((invoice) => invoice.clientId === client.id);

      const wonLeads = leads.filter((lead) => lead.status === "WON").length;
      const activeProjects = projects.filter((project) => ["IN_PROGRESS", "PLANNING", "REVIEW"].includes(project.status)).length;
      const blockedProjects = projects.filter((project) => ["BLOCKED", "DELAYED", "ON_HOLD"].includes(project.status)).length;
      const avgProgress = projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.progressPercent, 0) / projects.length) : 0;
      const overdueInvoices = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
      const renewalDays = daysFromNow(client.contractRenewalAt);
      const staleDays = daysSince(client.updatedAt);
      const owner = projects[0]?.ownerName ?? client.ownerName ?? "Unassigned";
      const stage = stageForClient({
        status: client.status,
        wonLeads,
        projectsCount: projects.length,
        activeProjects,
        avgProgress,
        overdueInvoices,
        renewalDays
      });
      const risk = riskForClient({
        overdueInvoices,
        blockedProjects,
        paused: client.status === "PAUSED",
        renewalDays,
        staleDays
      });

      const journeyAgeDays = (() => {
        if (stage === "Acquisition") {
          const latestLead = leads.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0];
          return daysSince(latestLead?.updatedAt ?? client.createdAt);
        }
        if (stage === "Onboarding") return daysSince(client.createdAt);
        const latestProject = projects.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0];
        return daysSince(latestProject?.updatedAt ?? client.updatedAt);
      })();

      const handoffGapDays = wonLeads > 0 && projects.length === 0
        ? daysSince(leads.find((lead) => lead.status === "WON")?.updatedAt ?? client.createdAt)
        : 0;

      const nextMilestone =
        stage === "Acquisition"
          ? "Lead to kickoff handoff"
          : stage === "Onboarding"
            ? "First value checkpoint"
            : stage === "Adoption"
              ? "Usage depth target"
              : stage === "Value"
                ? "Expansion trigger"
                : stage === "Renewal"
                  ? "Renewal close plan"
                  : "Advocacy motion";

      return {
        ...client,
        owner,
        stage,
        risk,
        staleDays,
        journeyAgeDays,
        handoffGapDays,
        wonLeads,
        projectsCount: projects.length,
        activeProjects,
        blockedProjects,
        avgProgress,
        overdueInvoices,
        renewalDays,
        outstandingCents: invoices
          .filter((invoice) => invoice.status !== "PAID" && invoice.status !== "VOID")
          .reduce((sum, invoice) => sum + invoice.amountCents, 0),
        nextMilestone
      };
    });
  }, [snapshot.clients, snapshot.invoices, snapshot.leads, snapshot.projects]);

  const owners = useMemo(
    () => ["ALL", ...Array.from(new Set(rows.map((row) => row.owner)))],
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (stageFilter !== "ALL" && row.stage !== stageFilter) return false;
      if (riskFilter !== "ALL" && row.risk !== riskFilter) return false;
      if (ownerFilter !== "ALL" && row.owner !== ownerFilter) return false;
      return true;
    });
  }, [rows, stageFilter, riskFilter, ownerFilter]);

  const handoffGaps = filtered.filter((row) => row.handoffGapDays > 0);
  const riskHigh = filtered.filter((row) => row.risk === "High").length;
  const renewalWindow = filtered.filter((row) => row.renewalDays !== null && row.renewalDays <= 60).length;
  const advocacyReady = filtered.filter((row) => row.stage === "Advocacy" && row.risk === "Low").length;

  const moments = useMemo(() => {
    const rowsFromRenewals = filtered
      .filter((row) => row.renewalDays !== null && row.renewalDays >= 0 && row.renewalDays <= 45)
      .map((row) => ({
        client: row.name,
        owner: row.owner,
        label: "Renewal window",
        when: row.renewalDays ?? 0,
        severity: row.risk === "High" ? "high" : "medium"
      }));

    const rowsFromHandoffs = filtered
      .filter((row) => row.handoffGapDays >= 3)
      .map((row) => ({
        client: row.name,
        owner: row.owner,
        label: "Lead-to-project handoff lag",
        when: row.handoffGapDays,
        severity: row.handoffGapDays >= 10 ? "high" : "medium"
      }));

    return [...rowsFromRenewals, ...rowsFromHandoffs]
      .sort((a, b) => a.when - b.when)
      .slice(0, 8);
  }, [filtered]);

  const canAct = session?.user.role === "ADMIN" || session?.user.role === "STAFF";

  const handleQueueIntervention = useCallback(async (clientId?: string) => {
    if (!session) return;
    const result = await queueAutomationJobWithRefresh(session, { type: "INTERVENTION_DIGEST", ...(clientId && { clientId }) });
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.error) {
      onNotify("success", "Intervention digest queued.");
    } else {
      onNotify("error", result.error.message ?? "Failed to queue job.");
    }
  }, [session, onNotify]);

  // Stage distribution (unfiltered counts)
  const total = rows.length || 1;
  const allStages: Array<{ label: JourneyStage; strip: string }> = [
    { label: "Acquisition", strip: styles.cjStripBlue   },
    { label: "Onboarding",  strip: styles.cjStripAmber  },
    { label: "Adoption",    strip: styles.cjStripBlue   },
    { label: "Value",       strip: styles.cjStripAccent },
    { label: "Renewal",     strip: styles.cjStripAmber  },
    { label: "Advocacy",    strip: styles.cjStripAccent },
  ];

  const lifecycleChecks = [
    {
      label: "Project to Billing",
      value: filtered.filter((row) => row.activeProjects === 0 && row.outstandingCents > 0).length,
      note: "Completed delivery with unresolved billing"
    },
    {
      label: "Billing to Retention",
      value: filtered.filter((row) => row.renewalDays !== null && row.renewalDays <= 60 && row.overdueInvoices > 0).length,
      note: "Renewal soon while invoice risk remains"
    },
    {
      label: "Onboarding to Adoption",
      value: filtered.filter((row) => row.stage === "Onboarding" && row.journeyAgeDays > 21).length,
      note: "Onboarding beyond 21 days"
    }
  ];

  const stageChartData = allStages.map(s => ({
    label: s.label,
    count: rows.filter(r => r.stage === s.label).length,
  }));

  const avgTouchpoints = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.wonLeads + r.projectsCount, 0) / rows.length)
    : 0;

  const tableRows = filtered.map(row => ({
    name: row.name,
    stage: row.stage,
    daysInStage: `${row.journeyAgeDays}d`,
    lastTouchpoint: row.staleDays > 0 ? `${row.staleDays}d ago` : "Today",
    healthScore: row.risk,
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>EXPERIENCE / JOURNEY</div>
          <h1 className={styles.pageTitle}>Client Journey</h1>
          <div className={styles.pageSub}>Journey stage overview · Touchpoints · Lifecycle health</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Journey</button>
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Total Clients Mapped" value={rows.length} sub="All accounts" tone="accent" />
        <StatWidget label="Active Journey Stages" value={filtered.length} sub="With filters applied" tone="default" />
        <StatWidget label="Avg Touchpoints" value={avgTouchpoints} sub="Per client" tone="default" />
        <StatWidget label="At-Risk Stage Count" value={riskHigh} sub="High risk" tone={riskHigh > 0 ? "red" : "default"} />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Clients by Journey Stage"
          data={stageChartData}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Journey Phases"
          stages={[
            { label: "Onboarding", count: rows.filter(r => r.stage === "Onboarding").length, total: Math.max(rows.length, 1), color: "#f5a623" },
            { label: "Active", count: rows.filter(r => r.stage === "Adoption" || r.stage === "Value").length, total: Math.max(rows.length, 1), color: "#8b6fff" },
            { label: "Expansion", count: rows.filter(r => r.stage === "Advocacy").length, total: Math.max(rows.length, 1), color: "#34d98b" },
            { label: "At-Risk", count: riskHigh, total: Math.max(rows.length, 1), color: "#ff5f5f" },
            { label: "Churned", count: 0, total: Math.max(rows.length, 1), color: "#888" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Client Journey Map"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "name", header: "Client" },
            { key: "stage", header: "Current Stage" },
            { key: "daysInStage", header: "Days in Stage", align: "right" },
            { key: "lastTouchpoint", header: "Last Touchpoint", align: "right" },
            { key: "healthScore", header: "Health", align: "right", render: (v) => {
              const val = v as string;
              const cls = val === "Low" ? cx("badge", "badgeGreen") : val === "High" ? cx("badge", "badgeRed") : cx("badge", "badgeAmber");
              return <span className={cls}>{val}</span>;
            }},
          ]}
          emptyMessage="No clients mapped"
        />
      </WidgetGrid>
    </div>
  );
}
