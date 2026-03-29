"use client";

import { useEffect, useState } from "react";
import {
  getProjectPreferenceWithRefresh,
  setProjectPreferenceWithRefresh,
  simulateAutomationWithRefresh,
  loadWorkflowMetricsWithRefresh,
  type AutomationSimulateResult,
  type NotificationJob,
  type WorkflowMetric
} from "../../../../lib/api/admin";
import type { DashboardToast } from "../../../shared/dashboard-core";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { EmptyState, colorClass, formatDate, formatDateTime } from "./admin-page-utils";
import { formatStatus } from "@/lib/utils/format-status";
import { StatWidget, ChartWidget, PipelineWidget, WidgetGrid } from "../widgets";

function readJsonObject(value: string | null | undefined): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function fillClass(value: string): string {
  if (value === "var(--red)") return styles.autoFillRed;
  if (value === "var(--blue)") return styles.autoFillBlue;
  if (value === "var(--amber)") return styles.autoFillAmber;
  if (value === "var(--purple)") return styles.autoFillPurple;
  if (value === "var(--muted)") return styles.autoFillMuted;
  return styles.autoFillAccent;
}

function statusClass(state: "ACTIVE" | "AT_RISK" | "DRAFT"): string {
  if (state === "ACTIVE") return styles.autoStatusAccent;
  if (state === "AT_RISK") return styles.autoStatusRed;
  return styles.autoStatusMuted;
}

export function AdminAutomationPageClient({
  jobs,
  analyticsPoints,
  onRunMaintenance,
  onProcessQueue,
  onNotify
}: {
  jobs: NotificationJob[];
  analyticsPoints: number;
  onRunMaintenance: () => Promise<void>;
  onProcessQueue: () => Promise<void>;
  onNotify: (tone: DashboardToast["tone"], message: string) => void;
}) {
  const { snapshot, session } = useAdminWorkspaceContext();

  const tabs = ["workflow health", "run controls", "simulation lab", "coverage map"] as const;
  type Tab = (typeof tabs)[number];
  type StatusFilter = "all" | "ACTIVE" | "AT_RISK" | "DRAFT";
  type DomainFilter = "all" | "billing" | "sales" | "delivery" | "comms";

  const canManage = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
  const queued = jobs.filter((job) => job.status === "QUEUED").length;
  const sent = jobs.filter((job) => job.status === "SENT").length;
  const failed = jobs.filter((job) => job.status === "FAILED").length;
  const latestJobAt = jobs.length > 0
    ? jobs.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0].updatedAt
    : null;
  const recentRuns = jobs.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 12);
  const successRate = jobs.length > 0 ? Math.round((sent / jobs.length) * 100) : 0;

  const [activeTab, setActiveTab] = useState<Tab>("workflow health");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [search, setSearch] = useState("");
  const [leadTrigger, setLeadTrigger] = useState<"event" | "schedule">("event");
  const [billingTrigger, setBillingTrigger] = useState<"event" | "schedule">("schedule");
  const [projectTrigger, setProjectTrigger] = useState<"event" | "schedule">("event");
  const [autoEscalateSla, setAutoEscalateSla] = useState(true);
  const [autoRetryFailures, setAutoRetryFailures] = useState(true);
  const [publishState, setPublishState] = useState<"DRAFT" | "REVIEW" | "PUBLISHED">("DRAFT");
  const [simulationPayload, setSimulationPayload] = useState("{\"topic\":\"invoice.overdue\",\"payload\":{\"invoiceId\":\"demo\"}}");
  const [simulationResult, setSimulationResult] = useState<AutomationSimulateResult | null>(null);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [lastSavedPhase2, setLastSavedPhase2] = useState<string | null>(null);
  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetric[]>([]);

  useEffect(() => {
    if (!session) return;
    void loadWorkflowMetricsWithRefresh(session).then((result) => {
      if (result.data) setWorkflowMetrics(result.data);
    });
  }, [session]);

  function getWorkflowRate(id: string): number {
    return workflowMetrics.find((m) => m.workflowId === id)?.successRate ?? 0;
  }

  const failureByChannel = [
    { channel: "EMAIL", failed: jobs.filter((j) => j.channel === "EMAIL" && j.status === "FAILED").length, total: jobs.filter((j) => j.channel === "EMAIL").length, color: "var(--blue)" },
    { channel: "SMS", failed: jobs.filter((j) => j.channel === "SMS" && j.status === "FAILED").length, total: jobs.filter((j) => j.channel === "SMS").length, color: "var(--amber)" },
    { channel: "PUSH", failed: jobs.filter((j) => j.channel === "PUSH" && j.status === "FAILED").length, total: jobs.filter((j) => j.channel === "PUSH").length, color: "var(--accent)" }
  ];

  const workflowStatus = [
    { id: "billing-core", workflow: "Billing Core", domain: "billing", trigger: "Invoice due/paid", state: snapshot.invoices.length > 0 ? "ACTIVE" : "DRAFT", lastRun: latestJobAt, successRate: snapshot.invoices.length > 0 ? (getWorkflowRate("billing-core") || successRate) : 0 },
    { id: "lead-followups", workflow: "Lead Follow-ups", domain: "sales", trigger: "Lead inactivity/status", state: snapshot.leads.length > 0 ? "ACTIVE" : "DRAFT", lastRun: snapshot.leads[0]?.updatedAt ?? null, successRate: snapshot.leads.length > 0 ? getWorkflowRate("lead-followups") : 0 },
    { id: "project-alerts", workflow: "Project Alerts", domain: "delivery", trigger: "Task/milestone overdue", state: snapshot.projects.length > 0 ? "ACTIVE" : "DRAFT", lastRun: snapshot.projects[0]?.updatedAt ?? null, successRate: snapshot.projects.length > 0 ? getWorkflowRate("project-alerts") : 0 },
    { id: "notification-delivery", workflow: "Notification Delivery", domain: "comms", trigger: "Queue + callbacks", state: failed > 0 ? "AT_RISK" : queued > 0 || sent > 0 ? "ACTIVE" : "DRAFT", lastRun: latestJobAt, successRate: getWorkflowRate("notification-delivery") || successRate }
  ] as const;

  const filteredWorkflows = workflowStatus
    .filter((item) => (statusFilter === "all" ? true : item.state === statusFilter))
    .filter((item) => (domainFilter === "all" ? true : item.domain === domainFilter))
    .filter((item) => (search.trim() ? item.workflow.toLowerCase().includes(search.trim().toLowerCase()) : true));

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const pref = await getProjectPreferenceWithRefresh(session, "settingsAutomationPhase2");
      if (!pref.data?.value) return;
      const phase2 = readJsonObject(pref.data.value);
      if (!phase2) return;
      if (phase2.leadTrigger === "event" || phase2.leadTrigger === "schedule") setLeadTrigger(phase2.leadTrigger);
      if (phase2.billingTrigger === "event" || phase2.billingTrigger === "schedule") setBillingTrigger(phase2.billingTrigger);
      if (phase2.projectTrigger === "event" || phase2.projectTrigger === "schedule") setProjectTrigger(phase2.projectTrigger);
      if (typeof phase2.autoEscalateSla === "boolean") setAutoEscalateSla(phase2.autoEscalateSla);
      if (typeof phase2.autoRetryFailures === "boolean") setAutoRetryFailures(phase2.autoRetryFailures);
      if (phase2.publishState === "DRAFT" || phase2.publishState === "REVIEW" || phase2.publishState === "PUBLISHED") setPublishState(phase2.publishState);
      if (typeof phase2.savedAt === "string") setLastSavedPhase2(phase2.savedAt);
    })();
  }, [session]);

  async function savePhase2Settings(): Promise<void> {
    if (!session) {
      onNotify("error", "Session required to save phase settings.");
      return;
    }
    const savedAt = new Date().toISOString();
    const payload = { leadTrigger, billingTrigger, projectTrigger, autoEscalateSla, autoRetryFailures, publishState, savedAt };
    const result = await setProjectPreferenceWithRefresh(session, { key: "settingsAutomationPhase2", value: JSON.stringify(payload) });
    if (!result.nextSession || result.error) {
      onNotify("error", result.error?.message ?? "Unable to save automation phase settings.");
      return;
    }
    setLastSavedPhase2(savedAt);
    onNotify("success", "Automation phase settings saved.");
  }

  async function retryFailedQueue(): Promise<void> {
    if (!canManage) {
      onNotify("error", "Retry actions are available to admin and staff roles.");
      return;
    }
    await onProcessQueue();
    onNotify("success", "Retry cycle requested for queued and failed jobs.");
  }

  async function runSimulation(): Promise<void> {
    if (!session || simulationRunning) return;
    let parsed: { topic?: unknown; payload?: unknown };
    try {
      parsed = JSON.parse(simulationPayload) as { topic?: unknown; payload?: unknown };
    } catch {
      setSimulationError("Invalid JSON payload. Fix payload syntax and run again.");
      setSimulationResult(null);
      onNotify("error", "Simulation payload is invalid JSON.");
      return;
    }
    if (!parsed.topic || typeof parsed.topic !== "string") {
      setSimulationError("Payload must have a top-level \"topic\" string field.");
      setSimulationResult(null);
      onNotify("error", "Simulation requires a topic field.");
      return;
    }
    setSimulationRunning(true);
    setSimulationError(null);
    setSimulationResult(null);
    const result = await simulateAutomationWithRefresh(session, {
      topic: parsed.topic,
      payload: typeof parsed.payload === "object" && parsed.payload !== null
        ? parsed.payload as Record<string, unknown>
        : {}
    });
    setSimulationRunning(false);
    if (!result.data && !result.error) {
      setSimulationError("Session expired. Please log in again.");
      onNotify("error", "Session expired.");
      return;
    }
    if (result.error) {
      setSimulationError(result.error.message);
      onNotify("error", "Simulation failed.");
      return;
    }
    if (result.data) {
      setSimulationResult(result.data);
      onNotify("success", result.data.wouldTrigger ? "Simulation complete — workflow triggered." : "Simulation complete — no matching workflow.");
    }
  }

  void recentRuns;

  // ── Widget chart/pipeline data ────────────────────────────────────────────
  const triggerChartData = workflowStatus.map((w) => ({ name: w.workflow.split(" ")[0], value: w.successRate }));
  const activeWorkflows  = workflowStatus.filter((w) => w.state === "ACTIVE").length;
  const atRiskWorkflows  = workflowStatus.filter((w) => w.state === "AT_RISK").length;
  const draftWorkflows   = workflowStatus.filter((w) => w.state === "DRAFT").length;

  return (
    <div className={cx(styles.pageBody, styles.autoRoot)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>AI/ML / AUTOMATION</div>
          <h1 className={styles.pageTitle}>Automation</h1>
          <div className={styles.pageSub}>Active rules · Trigger health · Execution log</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" onClick={() => void onRunMaintenance()} className={cx("btnSm", "btnGhost")}>Run Maintenance Check</button>
          <button type="button" onClick={() => void retryFailedQueue()} className={cx("btnSm", "btnAccent")}>Retry Failed Queue</button>
        </div>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Active Automations" value={activeWorkflows} tone="accent" sparkData={[1, 2, 2, 3, 3, 4, 4, activeWorkflows]} />
        <StatWidget label="Triggered Today" value={sent} tone="green" progressValue={jobs.length > 0 ? Math.round((sent / jobs.length) * 100) : 0} />
        <StatWidget label="Failed" value={failed} tone={failed > 0 ? "red" : "default"} progressValue={jobs.length > 0 ? Math.round((failed / jobs.length) * 100) : 0} />
        <StatWidget label="Success Rate" value={`${successRate}%`} tone={successRate >= 90 ? "accent" : "amber"} progressValue={successRate} sub={analyticsPoints != null ? `${analyticsPoints} analytics pts` : undefined} />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Triggers by Rule"
          type="bar"
          data={triggerChartData.length > 0 ? triggerChartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Automation Status"
          stages={[
            { label: "Active", count: activeWorkflows, total: workflowStatus.length, color: "#34d98b" },
            { label: "At Risk", count: atRiskWorkflows, total: workflowStatus.length, color: "#ff5f5f" },
            { label: "Draft", count: draftWorkflows, total: workflowStatus.length, color: "#6b7280" },
          ]}
        />
      </WidgetGrid>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className={cx("overflowAuto", "minH0")}>
        {(activeTab === "workflow health" || activeTab === "coverage map") ? (
          <div className={cx("card", "p14", "mb12")}>
            <div className={styles.autoFiltersRow}>
              <select title="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={styles.formInput}>
                <option value="all">Status: All</option>
                <option value="ACTIVE">Status: Active</option>
                <option value="AT_RISK">Status: At Risk</option>
                <option value="DRAFT">Status: Draft</option>
              </select>
              <select title="Filter by domain" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value as DomainFilter)} className={styles.formInput}>
                <option value="all">Domain: All</option>
                <option value="billing">Domain: Billing</option>
                <option value="sales">Domain: Sales</option>
                <option value="delivery">Domain: Delivery</option>
                <option value="comms">Domain: Comms</option>
              </select>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workflow" className={cx("formInput", styles.autoSearch)} />
            </div>
          </div>
        ) : null}

        {activeTab === "workflow health" ? (
          <div className={styles.autoSplitHealth}>
            <div className={cx("card", "overflowHidden")}>
              <div className={cx(styles.autoFlowHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                {"Workflow|Trigger|Status|Success|Last Run".split("|").map((h) => <span key={h}>{h}</span>)}
              </div>
              {filteredWorkflows.length ? filteredWorkflows.map((item, idx) => (
                <div key={item.id} className={cx(styles.autoFlowRow, idx < filteredWorkflows.length - 1 && "borderB")}>
                  <div>
                    <div className={cx("text12", "fw600")}>{item.workflow}</div>
                    <div className={cx("text10", "colorMuted", "capitalize")}>{item.domain}</div>
                  </div>
                  <span className={cx("text11", "colorMuted")}>{item.trigger}</span>
                  <span className={cx(styles.autoStatusChip, statusClass(item.state))}>{formatStatus(item.state)}</span>
                  <span className={cx("fontMono", item.successRate >= 90 ? "colorAccent" : item.successRate >= 75 ? "colorAmber" : "colorRed")}>{item.successRate}%</span>
                  <span className={cx("text11", "colorMuted")}>{item.lastRun ? formatDate(item.lastRun) : "Not run yet"}</span>
                </div>
              )) : (
                <div className={cx("p20")}><EmptyState title="No workflows match current filters" subtitle="Clear filters to view all workflow domains and states." compact variant="message" /></div>
              )}
            </div>

            <div className={styles.autoStack16}>
              <div className={cx("card", "p20")}>
                <div className={cx("text12", "fw700", "mb14")}>Failure Hotspots by Channel</div>
                {failureByChannel.map((row) => {
                  const pct = row.total > 0 ? Math.round((row.failed / row.total) * 100) : 0;
                  return (
                    <div key={row.channel} className={cx("mb12")}>
                      <div className={cx("flexBetween", "mb4")}>
                        <span className={cx("text12", colorClass(row.color))}>{row.channel}</span>
                        <span className={cx("fontMono", pct > 20 ? "colorRed" : pct > 8 ? "colorAmber" : "colorAccent")}>{pct}% fail</span>
                      </div>
                      <progress className={cx(styles.autoFailTrack, pct > 20 ? styles.autoFillRed : pct > 8 ? styles.autoFillAmber : styles.autoFillAccent)} max={100} value={pct} aria-label={`${row.channel} failure ${pct}%`} />
                      <div className={cx("text10", "colorMuted", "mt4")}>{row.failed} failed of {row.total}</div>
                    </div>
                  );
                })}
              </div>

              <div className={cx("card", "p20")}>
                <div className={cx("text12", "fw700", "mb8")}>Scope Boundary</div>
                <div className={styles.autoBodyText}>Queue-level triage and message payload editing remain in Notifications. Workflows focuses on orchestration health, control states, and simulation.</div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "run controls" ? (
          <div className={cx("grid2", "gap16")}>
            <div className={cx("card", "p20")}>
              <div className={cx("flexBetween", "flexCenter", "mb14")}>
                <span className={cx("text12", "fw700", "uppercase")}>Trigger Manager</span>
                <span className={cx("text10", "colorMuted", "fontMono")}>{publishState}</span>
              </div>
              <div className={styles.autoControlGrid}>
                <label className={styles.autoControlLabel}>
                  Lead follow-ups trigger
                  <select title="Lead trigger mode" value={leadTrigger} onChange={(e) => setLeadTrigger(e.target.value as "event" | "schedule")} className={styles.formInput}>
                    <option value="event">Event driven</option>
                    <option value="schedule">Scheduled</option>
                  </select>
                </label>
                <label className={styles.autoControlLabel}>
                  Billing trigger
                  <select title="Billing trigger mode" value={billingTrigger} onChange={(e) => setBillingTrigger(e.target.value as "event" | "schedule")} className={styles.formInput}>
                    <option value="event">Event driven</option>
                    <option value="schedule">Scheduled</option>
                  </select>
                </label>
                <label className={styles.autoControlLabel}>
                  Project alerts trigger
                  <select title="Project alerts trigger mode" value={projectTrigger} onChange={(e) => setProjectTrigger(e.target.value as "event" | "schedule")} className={styles.formInput}>
                    <option value="event">Event driven</option>
                    <option value="schedule">Scheduled</option>
                  </select>
                </label>
                <label className={styles.autoControlLabel}>
                  Publish state
                  <select title="Workflow publish state" value={publishState} onChange={(e) => setPublishState(e.target.value as "DRAFT" | "REVIEW" | "PUBLISHED")} className={styles.formInput}>
                    <option value="DRAFT">Draft</option>
                    <option value="REVIEW">Review</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </label>
              </div>

              <div className={styles.autoToggleRow}>
                <div>
                  <div className={cx("text12", "colorText")}>Auto escalate SLA misses</div>
                  <div className={cx("text10", "colorMuted")}>Route alerts to escalation workflow</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoEscalateSla((v) => !v)}
                  className={cx("btnSm", autoEscalateSla ? "btnAccent" : "btnGhost")}
                >
                  {autoEscalateSla ? "ON" : "OFF"}
                </button>
              </div>

              <div className={cx(styles.autoToggleRow, "mb14")}>
                <div>
                  <div className={cx("text12", "colorText")}>Auto retry failed jobs</div>
                  <div className={cx("text10", "colorMuted")}>Retry policy for transient failures</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoRetryFailures((v) => !v)}
                  className={cx("btnSm", autoRetryFailures ? "btnAccent" : "btnGhost")}
                >
                  {autoRetryFailures ? "ON" : "OFF"}
                </button>
              </div>

              <button type="button" onClick={() => void savePhase2Settings()} className={cx("btnSm", "btnAccent")}>Save Controls</button>
            </div>

            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb14", "uppercase")}>Operational Guardrails</div>
              {[
                { label: "Retry Policy", value: autoRetryFailures ? "Enabled" : "Disabled", tone: autoRetryFailures ? "var(--accent)" : "var(--amber)" },
                { label: "Escalation Policy", value: autoEscalateSla ? "Enabled" : "Disabled", tone: autoEscalateSla ? "var(--accent)" : "var(--amber)" },
                { label: "Current Release State", value: publishState, tone: publishState === "PUBLISHED" ? "var(--accent)" : publishState === "REVIEW" ? "var(--amber)" : "var(--muted)" },
                { label: "Recent Workflow Run", value: latestJobAt ? formatDateTime(latestJobAt) : "No runs", tone: "var(--blue)" }
              ].map((row) => (
                <div key={row.label} className={styles.autoGuardRow}>
                  <span className={cx("colorMuted")}>{row.label}</span>
                  <span className={cx("fontMono", "fw700", colorClass(row.tone))}>{row.value}</span>
                </div>
              ))}
              <div className={cx("text11", "colorMuted", "mt12", styles.autoBodyText)}>Queue diagnostics and per-message recovery actions are handled in Notifications for clearer operational separation.</div>
            </div>
          </div>
        ) : null}

        {activeTab === "simulation lab" ? (
          <div className={cx("grid2", "gap16")}>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12")}>Simulation Payload</div>
              <textarea value={simulationPayload} onChange={(e) => setSimulationPayload(e.target.value)} rows={14} className={cx("formTextarea", "mb10")} />
              <div className={cx("flexRow", "gap8")}>
                <button type="button" onClick={() => void runSimulation()} disabled={simulationRunning} className={cx("btnSm", "btnGhost")}>
                  {simulationRunning ? "Running…" : "Run Dry Run"}
                </button>
                <button type="button" onClick={() => setPublishState("REVIEW")} className={cx("btnSm", "btnAccent")}>Submit For Review</button>
              </div>
            </div>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12")}>Simulation Result</div>
              {simulationError ? (
                <div className={cx(styles.autoResultBox, styles.autoResultError)}>{simulationError}</div>
              ) : simulationResult ? (
                <div className={styles.autoResultBox}>
                  <div className={cx("text11", "fw700", "mb8")}>
                    {simulationResult.wouldTrigger ? "✓ Workflow would trigger" : "✗ No matching workflow"}
                  </div>
                  <div className={cx("text11", "colorMuted", "mb4")}>
                    <span className="fw600">Topic:</span> {simulationResult.topic}
                  </div>
                  <div className={cx("text11", "colorMuted", "mb8")}>
                    <span className="fw600">Workflow:</span> {simulationResult.workflow}
                  </div>
                  {simulationResult.estimatedActions.length > 0 ? (
                    <div>
                      <div className={cx("text11", "fw600", "mb4")}>Estimated actions:</div>
                      {simulationResult.estimatedActions.map((action, i) => (
                        <div key={i} className={cx("text11", "colorMuted")}>→ {action}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <EmptyState title="No simulation yet" subtitle="Run a dry run to validate trigger and policy behavior before publishing." compact variant="message" />
              )}
              <div className={cx("text11", "colorMuted", "mt12", styles.autoBodyText)}>Simulations validate orchestration logic only; recipient-level message checks belong to Notifications.</div>
            </div>
          </div>
        ) : null}

        {activeTab === "coverage map" ? (
          <div className={cx("grid2", "gap16")}>
            <div className={cx("card", "overflowHidden")}>
              <div className={cx(styles.autoCoverageHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                {"Flow|Coverage|Status|Domain".split("|").map((h) => <span key={h}>{h}</span>)}
              </div>
              {filteredWorkflows.map((item, idx) => (
                <div key={item.id} className={cx(styles.autoCoverageRow, idx < filteredWorkflows.length - 1 && "borderB")}>
                  <span className={cx("text12", "fw600")}>{item.workflow}</span>
                  <span className={cx("text11", "colorMuted")}>
                    {item.id === "billing-core" ? `${snapshot.invoices.length} invoices` : item.id === "lead-followups" ? `${snapshot.leads.length} leads` : item.id === "project-alerts" ? `${snapshot.projects.length} projects` : `${jobs.length} runs`}
                  </span>
                  <span className={cx(styles.autoStatusChip, statusClass(item.state))}>{formatStatus(item.state)}</span>
                  <span className={cx("text11", "colorMuted", "capitalize")}>{item.domain}</span>
                </div>
              ))}
            </div>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12")}>Operational Notes</div>
              {[
                "Workflows manages trigger strategy and automation health.",
                "Notifications handles queue-level triage and message execution.",
                "Integrations owns external keys and provider connectivity.",
                "Access Control governs who can change workflow settings."
              ].map((note) => (
                <div key={note} className={styles.autoNoteRow}>- {note}</div>
              ))}
              <div className={styles.autoInsetNote}>This boundary reduces duplication and keeps operational ownership clear across admin pages.</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
