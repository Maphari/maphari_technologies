// ════════════════════════════════════════════════════════════════════════════
// quality-assurance-page.tsx — Admin QA wired to real deliverables API
// Data  : loadAllProjectDeliverablesWithRefresh → GET /projects/:id/deliverables
//         approveDeliverableWithRefresh → POST /projects/:id/deliverables/:id/approve
//         requestDeliverableChangesWithRefresh → POST /projects/:id/deliverables/:id/request-changes
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { ProjectDeliverableWithContext } from "../../../../lib/api/admin/project-layer";
import {
  loadAllProjectDeliverablesWithRefresh,
  approveDeliverableWithRefresh,
  requestDeliverableChangesWithRefresh
} from "../../../../lib/api/admin/project-layer";

// ── UI types ──────────────────────────────────────────────────────────────────

type DeliverableStatus = "in-review" | "approved" | "changes-requested" | "rejected";
type Tab = "all deliverables" | "pending review" | "approved" | "revision history" | "qa metrics";
type FilterStatus = "All" | DeliverableStatus;

type Deliverable = {
  id: string;
  projectId: string;
  project: string;
  client: string;
  clientColor: string;
  name: string;
  type: string;
  assignee: string;
  reviewer: string;
  submittedDate: string;
  reviewDue: string;
  status: DeliverableStatus;
  round: number;
  revisions: Array<{ date: string; note: string; requestedBy: string }>;
  score: number | null;
  checklist: Array<{ item: string; done: boolean }>;
};

// ── Mapper ────────────────────────────────────────────────────────────────────

const CLIENT_COLORS = [
  "var(--accent)", "var(--purple)", "var(--blue)", "var(--amber)", "var(--red)"
];

function mapApiStatus(apiStatus: string): DeliverableStatus {
  switch (apiStatus) {
    case "ACCEPTED": return "approved";
    case "CHANGES_REQUESTED": return "changes-requested";
    default: return "in-review";
  }
}

function mapApiDeliverable(d: ProjectDeliverableWithContext, index: number): Deliverable {
  return {
    id: d.id,
    projectId: d.projectId,
    project: d.projectName,
    client: d.clientId,
    clientColor: CLIENT_COLORS[index % CLIENT_COLORS.length],
    name: d.name,
    type: "Deliverable",
    assignee: d.ownerName ?? "Unassigned",
    reviewer: "Admin",
    submittedDate: d.deliveredAt
      ? new Date(d.deliveredAt).toISOString().split("T")[0]
      : new Date(d.createdAt).toISOString().split("T")[0],
    reviewDue: d.dueAt
      ? new Date(d.dueAt).toISOString().split("T")[0]
      : "—",
    status: mapApiStatus(d.status),
    round: 1,
    revisions: [],
    score: null,
    checklist: [
      { item: "Delivery confirmed", done: d.status !== "NOT_STARTED" && d.status !== "IN_PROGRESS" },
      { item: "Review complete", done: d.status === "ACCEPTED" || d.status === "CHANGES_REQUESTED" }
    ]
  };
}

// ── Config ────────────────────────────────────────────────────────────────────

const statusConfig: Record<DeliverableStatus, { color: string; label: string; bg: string }> = {
  "in-review": { color: "var(--blue)", label: "In Review", bg: "color-mix(in srgb, var(--blue) 8%, transparent)" },
  approved: { color: "var(--accent)", label: "Approved", bg: "color-mix(in srgb, var(--accent) 8%, transparent)" },
  "changes-requested": { color: "var(--amber)", label: "Changes Requested", bg: "color-mix(in srgb, var(--amber) 8%, transparent)" },
  rejected: { color: "var(--red)", label: "Rejected", bg: "color-mix(in srgb, var(--red) 8%, transparent)" },
};

const typeColors: Record<string, string> = {
  Design: "var(--purple)",
  UX: "var(--blue)",
  Strategy: "var(--accent)",
  Copy: "var(--amber)",
  "Copy + Design": "var(--amber)",
};

const tabs: Tab[] = ["all deliverables", "pending review", "approved", "revision history", "qa metrics"];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QualityAssurancePage({ session, onNotify }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("all deliverables");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningDeliverableId, setActioningDeliverableId] = useState<string | null>(null);
  const [requestingChangesId, setRequestingChangesId] = useState<string | null>(null);
  const [changesNote, setChangesNote] = useState("");

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setError(null);
    try {
      const r = await loadAllProjectDeliverablesWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        setError(r.error.message ?? "Failed to load deliverables.");
      } else {
        setDeliverables((r.data ?? []).map((d, i) => mapApiDeliverable(d, i)));
      }
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load deliverables.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [load]);

  const pending = deliverables.filter((d) => d.status === "in-review" || d.status === "changes-requested");
  const approved = deliverables.filter((d) => d.status === "approved");
  const avgRounds = deliverables.length > 0 ? (deliverables.reduce((s, d) => s + d.round, 0) / deliverables.length).toFixed(1) : "0.0";
  const approvalRate = deliverables.length > 0 ? Math.round((approved.length / deliverables.length) * 100) : 0;

  const filtered =
    activeTab === "pending review"
      ? pending
      : activeTab === "approved"
        ? approved
        : filterStatus === "All"
          ? deliverables
          : deliverables.filter((d) => d.status === filterStatus);

  if (loading) {
    return (
      <div className={styles.pageBody}>
        <div className={cx("flexCenter", "p40")}>
          <div className={cx("text13", "colorMuted")}>Loading deliverables…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageBody}>
        <div className={cx("card", "p24")}>
          <div className={cx("colorRed", "fw700", "mb8")}>Failed to load deliverables</div>
          <div className={cx("text12", "colorMuted")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnAccent", "mt12")} onClick={() => { setLoading(true); void load(); }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Widget data ────────────────────────────────────────────────────────────
  const rejected = deliverables.filter((d) => d.status === "rejected");
  const resolvedThisWeek = approved.length;
  const qaScore = approvalRate;

  // Line chart: QA score trend approximated from status distribution over deliverables
  const qaTrendData = deliverables.slice(-8).map((d, i) => ({
    label: `D${i + 1}`,
    score: d.status === "approved" ? 100 : d.status === "changes-requested" ? 60 : d.status === "rejected" ? 20 : 80,
  }));

  const tableRows = deliverables.map((d) => ({
    id: d.id,
    name: d.name.length > 30 ? d.name.slice(0, 30) + "…" : d.name,
    project: d.project,
    severity: d.type,
    status: statusConfig[d.status].label,
    _statusRaw: d.status,
    assignee: d.assignee.split(" ")[0],
    due: d.reviewDue,
  }));

  return (
    <div className={styles.pageBody}>
      <div className={cx("flexBetween", "mb32")}>
        <div>
          <div className={styles.pageEyebrow}>OPERATIONS / QA</div>
          <h1 className={styles.pageTitle}>Quality Assurance</h1>
          <div className={styles.pageSub}>QA score · Issue tracking · Resolution velocity</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent", "fontMono")}>+ Log Deliverable</button>
      </div>

      {/* Row 1 — 4 stat widgets */}
      <WidgetGrid>
        <StatWidget
          label="QA Score"
          value={`${qaScore}%`}
          sub="Approval rate"
          tone={qaScore >= 60 ? "accent" : "amber"}
          progressValue={qaScore}
        />
        <StatWidget
          label="Open Issues"
          value={pending.length}
          sub="Pending review"
          tone={pending.length > 0 ? "amber" : "default"}
        />
        <StatWidget
          label="Critical Issues"
          value={rejected.length}
          sub="Rejected / blocked"
          tone={rejected.length > 0 ? "red" : "default"}
        />
        <StatWidget
          label="Resolved This Week"
          value={resolvedThisWeek}
          sub="Approved deliverables"
          tone={resolvedThisWeek > 0 ? "green" : "default"}
        />
      </WidgetGrid>

      {/* Row 2 — line chart + pipeline by severity */}
      <WidgetGrid>
        <ChartWidget
          label="QA Score Trend"
          data={qaTrendData.length > 0 ? qaTrendData : [{ label: "—", score: 0 }]}
          dataKey="score"
          type="line"
          color="#8b6fff"
          xKey="label"
        />
        <PipelineWidget
          label="Issues by Severity"
          stages={[
            { label: "Approved", count: approved.length || 0, total: deliverables.length || 1, color: "#34d98b" },
            { label: "In Review", count: deliverables.filter((d) => d.status === "in-review").length || 0, total: deliverables.length || 1, color: "#60a5fa" },
            { label: "Changes Req.", count: deliverables.filter((d) => d.status === "changes-requested").length || 0, total: deliverables.length || 1, color: "#f5a623" },
            { label: "Rejected", count: rejected.length || 0, total: deliverables.length || 1, color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — issues / deliverables table */}
      <WidgetGrid>
        <TableWidget
          label="Deliverables"
          rows={tableRows as Record<string, unknown>[]}
          rowKey="id"
          emptyMessage="No deliverables found."
          columns={[
            { key: "name", header: "Deliverable", align: "left" },
            { key: "project", header: "Project", align: "left" },
            { key: "severity", header: "Type", align: "left" },
            {
              key: "status",
              header: "Status",
              align: "left",
              render: (_v, row) => {
                const raw = (row as { _statusRaw: string })._statusRaw;
                const badgeCls =
                  raw === "approved" ? cx("badgeGreen")
                  : raw === "rejected" ? cx("badgeRed")
                  : raw === "changes-requested" ? cx("badgeAmber")
                  : cx("badgeMuted");
                return <span className={badgeCls}>{String(_v)}</span>;
              },
            },
            { key: "assignee", header: "Assignee", align: "right" },
            { key: "due", header: "Due", align: "right" },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}
