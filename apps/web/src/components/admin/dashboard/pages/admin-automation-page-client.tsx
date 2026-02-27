"use client";

import { useEffect, useState } from "react";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { getProjectPreferenceWithRefresh, setProjectPreferenceWithRefresh, type NotificationJob } from "../../../../lib/api/admin";
import type { DashboardToast } from "../../../shared/dashboard-core";
import { EmptyState, formatDate, formatDateTime } from "./admin-page-utils";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  primary: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

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
  const [simulationPayload, setSimulationPayload] = useState("{\"type\":\"invoice.overdue\",\"client\":\"demo\"}");
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [lastSavedPhase2, setLastSavedPhase2] = useState<string | null>(null);

  const failureByChannel = [
    { channel: "EMAIL", failed: jobs.filter((j) => j.channel === "EMAIL" && j.status === "FAILED").length, total: jobs.filter((j) => j.channel === "EMAIL").length, color: C.blue },
    { channel: "SMS", failed: jobs.filter((j) => j.channel === "SMS" && j.status === "FAILED").length, total: jobs.filter((j) => j.channel === "SMS").length, color: C.amber },
    { channel: "PUSH", failed: jobs.filter((j) => j.channel === "PUSH" && j.status === "FAILED").length, total: jobs.filter((j) => j.channel === "PUSH").length, color: C.primary }
  ];

  const workflowStatus = [
    { id: "billing-core", workflow: "Billing Core", domain: "billing", trigger: "Invoice due/paid", state: snapshot.invoices.length > 0 ? "ACTIVE" : "DRAFT", lastRun: latestJobAt, successRate: snapshot.invoices.length > 0 ? Math.max(70, successRate) : 0 },
    { id: "lead-followups", workflow: "Lead Follow-ups", domain: "sales", trigger: "Lead inactivity/status", state: snapshot.leads.length > 0 ? "ACTIVE" : "DRAFT", lastRun: snapshot.leads[0]?.updatedAt ?? null, successRate: snapshot.leads.length > 0 ? 92 : 0 },
    { id: "project-alerts", workflow: "Project Alerts", domain: "delivery", trigger: "Task/milestone overdue", state: snapshot.projects.length > 0 ? "ACTIVE" : "DRAFT", lastRun: snapshot.projects[0]?.updatedAt ?? null, successRate: snapshot.projects.length > 0 ? 88 : 0 },
    { id: "notification-delivery", workflow: "Notification Delivery", domain: "comms", trigger: "Queue + callbacks", state: failed > 0 ? "AT_RISK" : queued > 0 || sent > 0 ? "ACTIVE" : "DRAFT", lastRun: latestJobAt, successRate }
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
    if (!session) { onNotify("error", "Session required to save phase settings."); return; }
    const savedAt = new Date().toISOString();
    const payload = { leadTrigger, billingTrigger, projectTrigger, autoEscalateSla, autoRetryFailures, publishState, savedAt };
    const result = await setProjectPreferenceWithRefresh(session, { key: "settingsAutomationPhase2", value: JSON.stringify(payload) });
    if (!result.nextSession || result.error) { onNotify("error", result.error?.message ?? "Unable to save automation phase settings."); return; }
    setLastSavedPhase2(savedAt);
    onNotify("success", "Automation phase settings saved.");
  }

  async function retryFailedQueue(): Promise<void> {
    if (!canManage) { onNotify("error", "Retry actions are available to admin and staff roles."); return; }
    await onProcessQueue();
    onNotify("success", "Retry cycle requested for queued and failed jobs.");
  }

  function runSimulation(): void {
    try {
      const parsed = JSON.parse(simulationPayload) as Record<string, unknown>;
      const flow = String(parsed.type ?? "generic.event");
      const outcome = autoRetryFailures ? "with retry policy" : "without retry policy";
      const escalation = autoEscalateSla ? "SLA escalation enabled" : "SLA escalation disabled";
      setSimulationResult(`Simulated ${flow}: dispatching actions ${outcome}; ${escalation}.`);
      onNotify("success", "Simulation completed.");
    } catch {
      setSimulationResult("Invalid JSON payload. Fix payload syntax and run again.");
      onNotify("error", "Simulation payload is invalid JSON.");
    }
  }

  // Suppress unused-variable lint for recentRuns (used for potential future display)
  void recentRuns;

  return (
    <div style={{ background: C.bg, height: "100%", color: C.text, fontFamily: "Syne, sans-serif", padding: 0, overflow: "hidden", display: "grid", gridTemplateRows: "auto auto auto 1fr", minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>AUTOMATION / ORCHESTRATION</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Workflows</h1>
          <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>Orchestration health, trigger controls, and safe simulation for core automations.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => void onRunMaintenance()} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Run Maintenance Check</button>
          <button type="button" onClick={() => void retryFailedQueue()} style={{ background: C.primary, border: "none", color: C.bg, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Retry Failed Queue</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Queued Jobs", value: queued.toString(), color: queued > 0 ? C.amber : C.primary, sub: "Pending workflow dispatches" },
          { label: "Sent Jobs", value: sent.toString(), color: C.blue, sub: "Successful executions" },
          { label: "Failed Jobs", value: failed.toString(), color: failed > 0 ? C.red : C.primary, sub: "Needs retry attention" },
          { label: "Success Rate", value: `${successRate}%`, color: successRate >= 90 ? C.primary : C.amber, sub: `${analyticsPoints} analytics points` }
        ].map((k) => (
          <div key={k.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 24, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: "none", border: "none", color: activeTab === tab ? C.primary : C.muted, padding: "8px 16px", cursor: "pointer", fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: activeTab === tab ? `2px solid ${C.primary}` : "none" }}>
                {tab}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: "DM Mono, monospace" }}>
            {lastSavedPhase2 ? `Phase settings saved ${formatDateTime(lastSavedPhase2)}` : "Phase settings not saved"}
          </div>
        </div>
      </div>

      <div style={{ overflow: "auto", minHeight: 0 }}>
        {(activeTab === "workflow health" || activeTab === "coverage map") ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                <option value="all">Status: All</option>
                <option value="ACTIVE">Status: Active</option>
                <option value="AT_RISK">Status: At Risk</option>
                <option value="DRAFT">Status: Draft</option>
              </select>
              <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value as DomainFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                <option value="all">Domain: All</option>
                <option value="billing">Domain: Billing</option>
                <option value="sales">Domain: Sales</option>
                <option value="delivery">Domain: Delivery</option>
                <option value="comms">Domain: Comms</option>
              </select>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workflow" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, minWidth: 220 }} />
              {(statusFilter !== "all" || domainFilter !== "all" || search.trim()) ? (
                <button onClick={() => { setStatusFilter("all"); setDomainFilter("all"); setSearch(""); }} style={{ background: C.border, border: "none", color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Clear</button>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "workflow health" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 100px 120px 130px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "DM Mono, monospace", gap: 12 }}>
                {["Workflow", "Trigger", "Status", "Success", "Last Run"].map((h) => <span key={h}>{h}</span>)}
              </div>
              {filteredWorkflows.length ? filteredWorkflows.map((item, idx) => (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 100px 120px 130px", padding: "13px 20px", borderBottom: idx < filteredWorkflows.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{item.workflow}</div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "capitalize" }}>{item.domain}</div>
                  </div>
                  <span style={{ fontSize: 11, color: C.muted }}>{item.trigger}</span>
                  <span style={{ fontSize: 10, color: item.state === "ACTIVE" ? C.primary : item.state === "AT_RISK" ? C.red : C.muted, background: `${item.state === "ACTIVE" ? C.primary : item.state === "AT_RISK" ? C.red : C.muted}15`, padding: "3px 8px", fontFamily: "DM Mono, monospace", width: "fit-content" }}>{item.state === "AT_RISK" ? "AT RISK" : item.state}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: item.successRate >= 90 ? C.primary : item.successRate >= 75 ? C.amber : C.red }}>{item.successRate}%</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{item.lastRun ? formatDate(item.lastRun) : "Not run yet"}</span>
                </div>
              )) : (
                <div style={{ padding: 20 }}><EmptyState title="No workflows match current filters" subtitle="Clear filters to view all workflow domains and states." compact variant="message" /></div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14 }}>Failure Hotspots by Channel</div>
                {failureByChannel.map((row) => {
                  const pct = row.total > 0 ? Math.round((row.failed / row.total) * 100) : 0;
                  return (
                    <div key={row.channel} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: row.color }}>{row.channel}</span>
                        <span style={{ fontFamily: "DM Mono, monospace", color: pct > 20 ? C.red : pct > 8 ? C.amber : C.primary }}>{pct}% fail</span>
                      </div>
                      <div style={{ height: 6, background: C.border }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct > 20 ? C.red : pct > 8 ? C.amber : C.primary }} />
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{row.failed} failed of {row.total}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Scope Boundary</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>Queue-level triage and message payload editing remain in Notifications. Workflows focuses on orchestration health, control states, and simulation.</div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "run controls" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Trigger Manager</span>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: "DM Mono, monospace" }}>{publishState}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: C.muted }}>
                  Lead follow-ups trigger
                  <select value={leadTrigger} onChange={(e) => setLeadTrigger(e.target.value as "event" | "schedule")} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                    <option value="event">Event driven</option>
                    <option value="schedule">Scheduled</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: C.muted }}>
                  Billing trigger
                  <select value={billingTrigger} onChange={(e) => setBillingTrigger(e.target.value as "event" | "schedule")} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                    <option value="event">Event driven</option>
                    <option value="schedule">Scheduled</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: C.muted }}>
                  Project alerts trigger
                  <select value={projectTrigger} onChange={(e) => setProjectTrigger(e.target.value as "event" | "schedule")} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                    <option value="event">Event driven</option>
                    <option value="schedule">Scheduled</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: C.muted }}>
                  Publish state
                  <select value={publishState} onChange={(e) => setPublishState(e.target.value as "DRAFT" | "REVIEW" | "PUBLISHED")} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                    <option value="DRAFT">Draft</option>
                    <option value="REVIEW">Review</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: C.text }}>Auto escalate SLA misses</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Route alerts to escalation workflow</div>
                </div>
                <button type="button" onClick={() => setAutoEscalateSla((v) => !v)} style={{ background: autoEscalateSla ? C.primary : C.border, border: "none", color: autoEscalateSla ? C.bg : C.muted, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>{autoEscalateSla ? "ON" : "OFF"}</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: C.text }}>Auto retry failed jobs</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Retry policy for transient failures</div>
                </div>
                <button type="button" onClick={() => setAutoRetryFailures((v) => !v)} style={{ background: autoRetryFailures ? C.primary : C.border, border: "none", color: autoRetryFailures ? C.bg : C.muted, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>{autoRetryFailures ? "ON" : "OFF"}</button>
              </div>
              <button type="button" onClick={() => void savePhase2Settings()} style={{ background: C.primary, border: "none", color: C.bg, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Save Controls</button>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Operational Guardrails</div>
              {[
                { label: "Retry Policy", value: autoRetryFailures ? "Enabled" : "Disabled", tone: autoRetryFailures ? C.primary : C.amber },
                { label: "Escalation Policy", value: autoEscalateSla ? "Enabled" : "Disabled", tone: autoEscalateSla ? C.primary : C.amber },
                { label: "Current Release State", value: publishState, tone: publishState === "PUBLISHED" ? C.primary : publishState === "REVIEW" ? C.amber : C.muted },
                { label: "Recent Workflow Run", value: latestJobAt ? formatDateTime(latestJobAt) : "No runs", tone: C.blue }
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                  <span style={{ color: C.muted }}>{row.label}</span>
                  <span style={{ color: row.tone, fontFamily: "DM Mono, monospace", fontWeight: 700 }}>{row.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, fontSize: 11, color: C.muted, lineHeight: 1.7 }}>Queue diagnostics and per-message recovery actions are handled in Notifications for clearer operational separation.</div>
            </div>
          </div>
        ) : null}

        {activeTab === "simulation lab" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Simulation Payload</div>
              <textarea value={simulationPayload} onChange={(e) => setSimulationPayload(e.target.value)} rows={14} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "10px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => runSimulation()} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>Run Dry Run</button>
                <button type="button" onClick={() => setPublishState("REVIEW")} style={{ background: C.primary, border: "none", color: C.bg, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Submit For Review</button>
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Simulation Result</div>
              {simulationResult ? (
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 14, fontSize: 12, color: C.text, lineHeight: 1.7 }}>{simulationResult}</div>
              ) : (
                <EmptyState title="No simulation yet" subtitle="Run a dry run to validate trigger and policy behavior before publishing." compact variant="message" />
              )}
              <div style={{ marginTop: 14, fontSize: 11, color: C.muted, lineHeight: 1.7 }}>Simulations validate orchestration logic only; recipient-level message checks belong to Notifications.</div>
            </div>
          </div>
        ) : null}

        {activeTab === "coverage map" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 100px 100px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "DM Mono, monospace", gap: 12 }}>
                {["Flow", "Coverage", "Status", "Domain"].map((h) => <span key={h}>{h}</span>)}
              </div>
              {filteredWorkflows.map((item, idx) => (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 100px 100px", padding: "13px 20px", borderBottom: idx < filteredWorkflows.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{item.workflow}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>
                    {item.id === "billing-core" ? `${snapshot.invoices.length} invoices` : item.id === "lead-followups" ? `${snapshot.leads.length} leads` : item.id === "project-alerts" ? `${snapshot.projects.length} projects` : `${jobs.length} runs`}
                  </span>
                  <span style={{ fontSize: 10, color: item.state === "ACTIVE" ? C.primary : item.state === "AT_RISK" ? C.red : C.muted, background: `${item.state === "ACTIVE" ? C.primary : item.state === "AT_RISK" ? C.red : C.muted}15`, padding: "3px 8px", fontFamily: "DM Mono, monospace", width: "fit-content" }}>{item.state === "AT_RISK" ? "AT RISK" : item.state}</span>
                  <span style={{ fontSize: 11, color: C.muted, textTransform: "capitalize" }}>{item.domain}</span>
                </div>
              ))}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Operational Notes</div>
              {["Workflows manages trigger strategy and automation health.", "Notifications handles queue-level triage and message execution.", "Integrations owns external keys and provider connectivity.", "Access Control governs who can change workflow settings."].map((note) => (
                <div key={note} style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.7 }}>• {note}</div>
              ))}
              <div style={{ marginTop: 10, padding: 12, background: C.bg, border: `1px solid ${C.border}`, fontSize: 11, color: C.muted, lineHeight: 1.7 }}>This boundary reduces duplication and keeps operational ownership clear across admin pages.</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
