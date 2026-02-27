"use client";

import { useState } from "react";
import { cx } from "../style";

type Integration = {
  id: "zapier" | "make" | "webhook" | "n8n" | "internal";
  name: string;
  icon: string;
  color: string;
  bg: string;
};

type Trigger = {
  id: string;
  label: string;
  integration: Integration["id"];
  color: string;
};

type LogStatus = "success" | "failed" | "pending";

type LogItem = {
  id: number;
  triggerId: string;
  clientId: number;
  integration: Integration["id"];
  action: string;
  status: LogStatus;
  duration: number | null;
  time: string;
  payload: Record<string, string | number>;
  error?: string;
};

const integrations: Integration[] = [
  { id: "zapier", name: "Zapier", icon: "⚡", color: "#ff8c00", bg: "rgba(255,140,0,0.1)" },
  { id: "make", name: "Make", icon: "◎", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  { id: "webhook", name: "Webhook", icon: "◈", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  { id: "n8n", name: "n8n", icon: "◉", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 10%, transparent)" },
  { id: "internal", name: "Internal", icon: "⊡", color: "#a0a0b0", bg: "rgba(160,160,176,0.08)" }
];

const triggers: Trigger[] = [
  { id: "milestone_approved", label: "Milestone approved", integration: "zapier", color: "var(--accent)" },
  { id: "invoice_sent", label: "Invoice sent", integration: "zapier", color: "var(--accent)" },
  { id: "invoice_paid", label: "Invoice paid", integration: "make", color: "#a78bfa" },
  { id: "client_message", label: "Client message received", integration: "webhook", color: "#60a5fa" },
  { id: "portal_login", label: "Client portal login", integration: "internal", color: "#a0a0b0" },
  { id: "standup_submitted", label: "Standup submitted", integration: "zapier", color: "var(--accent)" },
  { id: "retainer_exceeded", label: "Retainer exceeded", integration: "make", color: "#a78bfa" },
  { id: "new_file_uploaded", label: "File uploaded to Drive", integration: "webhook", color: "#60a5fa" },
  { id: "task_completed", label: "Task marked complete", integration: "n8n", color: "var(--accent)" },
  { id: "score_dropped", label: "Satisfaction score drop", integration: "internal", color: "#a0a0b0" }
];

const clients = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "#a78bfa" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "#f5c518" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00" }
];

const initialLogs: LogItem[] = [
  { id: 1, triggerId: "milestone_approved", clientId: 5, integration: "zapier", action: "Send Slack message to #ops", status: "success", duration: 312, time: "Today 10:42 AM", payload: { milestone: "Layout & Typesetting", approvedBy: "Chidi Okafor", projectId: "OS-2025" } },
  { id: 2, triggerId: "invoice_sent", clientId: 5, integration: "zapier", action: "Create Notion task", status: "success", duration: 488, time: "Today 10:42 AM", payload: { invoice: "INV-0041", amount: "R28,000", dueDate: "Mar 10" } },
  { id: 3, triggerId: "client_message", clientId: 1, integration: "webhook", action: "Post to Google Chat", status: "success", duration: 201, time: "Today 9:18 AM", payload: { from: "Lena Muller", preview: "Love the amber palette shift...", channel: "porta-messages" } },
  { id: 4, triggerId: "portal_login", clientId: 3, integration: "internal", action: "Log to Google Sheet", status: "success", duration: 88, time: "Today 8:54 AM", payload: { user: "amara.nkosi@mirahealth.co", session: "14m 22s", pagesViewed: 4 } },
  { id: 5, triggerId: "retainer_exceeded", clientId: 4, integration: "make", action: "Send email via Gmail", status: "failed", duration: null, time: "Yesterday 6:01 PM", payload: { client: "Dune Collective", exceeded: "4.5h", cycle: "Feb 2026" }, error: "Authentication token expired. Re-authorise Make connection." },
  { id: 6, triggerId: "standup_submitted", clientId: 0, integration: "zapier", action: "Update Airtable row", status: "success", duration: 544, time: "Yesterday 5:30 PM", payload: { staffMember: "You", mood: 4, flagged: "false" } },
  { id: 7, triggerId: "score_dropped", clientId: 4, integration: "internal", action: "Send Slack message to #ops", status: "success", duration: 112, time: "Yesterday 4:15 PM", payload: { client: "Dune Collective", oldScore: 50, newScore: 43, drop: -7 } },
  { id: 8, triggerId: "invoice_paid", clientId: 5, integration: "make", action: "Update CRM contact", status: "success", duration: 390, time: "Feb 21 11:00 AM", payload: { invoice: "INV-0039", amount: "R28,000", paidOn: "Feb 21" } },
  { id: 9, triggerId: "milestone_approved", clientId: 1, integration: "zapier", action: "Send Slack message to #ops", status: "success", duration: 298, time: "Feb 20 3:44 PM", payload: { milestone: "Brand Colour System", approvedBy: "Lena Muller" } },
  { id: 10, triggerId: "new_file_uploaded", clientId: 3, integration: "webhook", action: "Create calendar event", status: "failed", duration: null, time: "Feb 20 10:00 AM", payload: { file: "Mira_MobileWireframes_v2.fig", uploadedBy: "James Osei" }, error: "Webhook endpoint returned 503. Retried 3x - all failed." },
  { id: 11, triggerId: "task_completed", clientId: 2, integration: "n8n", action: "Update Airtable row", status: "success", duration: 622, time: "Feb 19 2:30 PM", payload: { task: "LinkedIn Channel Brief", completedBy: "You" } },
  { id: 12, triggerId: "client_message", clientId: 2, integration: "webhook", action: "Post to Google Chat", status: "success", duration: 188, time: "Feb 18 9:05 AM", payload: { from: "Marcus Rehn", preview: "Can we reschedule Thursday's call?", channel: "porta-messages" } }
];

const statusConfig: Record<LogStatus, { label: string; color: string; bg: string; dot: string }> = {
  success: { label: "Success", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 8%, transparent)", dot: "var(--accent)" },
  failed: { label: "Failed", color: "#ff4444", bg: "rgba(255,68,68,0.08)", dot: "#ff4444" },
  pending: { label: "Pending", color: "#f5c518", bg: "rgba(245,197,24,0.08)", dot: "#f5c518" }
};

export function TriggerLogPage({ isActive }: { isActive: boolean }) {
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);
  const [selected, setSelected] = useState<LogItem | null>(initialLogs[0]);
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all");
  const [intFilter, setIntFilter] = useState<"all" | Integration["id"]>("all");
  const [tab, setTab] = useState<"log" | "triggers" | "integrations">("log");

  const retry = (id: number) => {
    setLogs((previous) => previous.map((row) => (row.id === id ? { ...row, status: "success", duration: 340, error: undefined } : row)));
    if (selected?.id === id) setSelected((previous) => (previous ? { ...previous, status: "success", duration: 340, error: undefined } : previous));
  };

  const filtered = logs
    .filter((row) => (filter === "all" ? true : row.status === filter))
    .filter((row) => (intFilter === "all" ? true : row.integration === intFilter));

  const successCount = logs.filter((row) => row.status === "success").length;
  const failCount = logs.filter((row) => row.status === "failed").length;
  const withDuration = logs.filter((row) => row.duration !== null);
  const avgDuration = withDuration.length > 0 ? Math.round(withDuration.reduce((sum, row) => sum + (row.duration ?? 0), 0) / withDuration.length) : 0;

  const triggerStats = triggers
    .map((trigger) => ({
      ...trigger,
      count: logs.filter((row) => row.triggerId === trigger.id).length,
      fails: logs.filter((row) => row.triggerId === trigger.id && row.status === "failed").length
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-trigger-log">
      <style>{`
        .log-row{transition:all 0.12s ease;cursor:pointer;}
        .log-row:hover{background:color-mix(in srgb, var(--accent) 2%, transparent)!important;border-color:color-mix(in srgb, var(--accent) 15%, transparent)!important;}
        .filter-btn{transition:all 0.12s ease;cursor:pointer;border:none;font-family:'DM Mono',monospace;}
        .tab-btn{transition:all 0.12s ease;cursor:pointer;border:none;font-family:'DM Mono',monospace;}
        .retry-btn{transition:all 0.15s ease;cursor:pointer;font-family:'DM Mono',monospace;}
        .retry-btn:hover{background:color-mix(in srgb, var(--accent) 15%, transparent)!important;color:var(--accent)!important;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Automations
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Trigger Log
            </h1>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Total runs", value: logs.length, color: "#a0a0b0" },
              { label: "Success rate", value: `${Math.round((successCount / logs.length) * 100)}%`, color: "var(--accent)" },
              { label: "Failures", value: failCount, color: failCount > 0 ? "#ff4444" : "var(--muted2)" },
              { label: "Avg latency", value: `${avgDuration}ms`, color: "#a0a0b0" }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>
            {[{ key: "log", label: "Event log" }, { key: "triggers", label: "Trigger stats" }, { key: "integrations", label: "Integrations" }].map((row) => (
              <button
                key={row.key}
                className="tab-btn"
                onClick={() => setTab(row.key as "log" | "triggers" | "integrations")}
                style={{ padding: "10px 20px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", background: "transparent", color: tab === row.key ? "var(--accent)" : "var(--muted2)", borderBottom: `2px solid ${tab === row.key ? "var(--accent)" : "transparent"}`, marginBottom: -1 }}
              >
                {row.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, paddingBottom: 10 }}>
            {(["all", "success", "failed"] as Array<"all" | "success" | "failed">).map((row) => (
              <button
                key={row}
                className="filter-btn"
                onClick={() => setFilter(row)}
                style={{ padding: "5px 12px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 2, background: filter === row ? (row === "failed" ? "rgba(255,68,68,0.1)" : row === "success" ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "rgba(255,255,255,0.08)") : "transparent", color: filter === row ? (row === "failed" ? "#ff4444" : row === "success" ? "var(--accent)" : "var(--text)") : "var(--muted2)" }}
              >
                {row}
              </button>
            ))}
            <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
            {(["all", ...integrations.map((row) => row.id)] as Array<"all" | Integration["id"]>).map((row) => {
              const integration = integrations.find((item) => item.id === row);
              return (
                <button
                  key={row}
                  className="filter-btn"
                  onClick={() => setIntFilter(row)}
                  style={{ padding: "5px 10px", fontSize: 10, borderRadius: 2, background: intFilter === row ? (integration ? integration.bg : "rgba(255,255,255,0.08)") : "transparent", color: intFilter === row ? (integration ? integration.color : "var(--text)") : "var(--muted2)" }}
                >
                  {integration ? `${integration.icon} ${integration.name}` : "All"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {tab === "log" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", minHeight: "calc(100vh - 190px)" }}>
          <div style={{ padding: "20px 0", borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "20px 1fr 110px 90px 80px 60px", gap: 12, padding: "0 12px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 8 }}>
              {["", "Trigger / Action", "Integration", "Client", "Status", "ms"].map((row) => (
                <div key={row} style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{row}</div>
              ))}
            </div>

            {filtered.map((log) => {
              const integration = integrations.find((row) => row.id === log.integration);
              const trigger = triggers.find((row) => row.id === log.triggerId);
              const client = clients.find((row) => row.id === log.clientId);
              const status = statusConfig[log.status];
              const isSelected = selected?.id === log.id;
              return (
                <div
                  key={log.id}
                  className="log-row"
                  onClick={() => setSelected(log)}
                  style={{ display: "grid", gridTemplateColumns: "20px 1fr 110px 90px 80px 60px", gap: 12, padding: "10px 12px", borderRadius: 3, marginBottom: 3, border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 20%, transparent)" : log.status === "failed" ? "rgba(255,68,68,0.08)" : "rgba(255,255,255,0.04)"}`, background: isSelected ? "color-mix(in srgb, var(--accent) 2%, transparent)" : log.status === "failed" ? "rgba(255,68,68,0.02)" : "transparent", alignItems: "center" }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: status.dot, animation: log.status === "failed" ? "pulse 2s infinite" : "none" }} />
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text)" }}>{trigger?.label}</div>
                    <div style={{ fontSize: 10, color: "var(--muted2)" }}>{log.action}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 10, color: integration?.color }}>{integration?.icon}</span>
                    <span style={{ fontSize: 10, color: "var(--muted2)" }}>{integration?.name}</span>
                  </div>
                  <div style={{ fontSize: 10, color: client?.color ?? "var(--muted2)" }}>{client?.name?.split(" ")[0] ?? "—"}</div>
                  <span style={{ fontSize: 9, padding: "2px 6px", background: status.bg, color: status.color, borderRadius: 2, letterSpacing: "0.06em", textTransform: "uppercase", display: "inline-block" }}>{status.label}</span>
                  <div style={{ fontSize: 10, color: log.duration ? "#a0a0b0" : "#ff4444" }}>{log.duration ? `${log.duration}` : "—"}</div>
                </div>
              );
            })}
          </div>

          {selected ? (
            (() => {
              const integration = integrations.find((row) => row.id === selected.integration);
              const trigger = triggers.find((row) => row.id === selected.triggerId);
              const client = clients.find((row) => row.id === selected.clientId);
              const status = statusConfig[selected.status];
              return (
                <div style={{ padding: "24px", overflowY: "auto" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, padding: "3px 9px", background: integration?.bg, color: integration?.color, borderRadius: 2, letterSpacing: "0.08em" }}>{integration?.icon} {integration?.name}</span>
                    <span style={{ fontSize: 10, padding: "3px 9px", background: status.bg, color: status.color, borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>{status.label}</span>
                    {selected.duration ? <span style={{ fontSize: 10, padding: "3px 9px", background: "rgba(255,255,255,0.04)", color: "#a0a0b0", borderRadius: 2 }}>{selected.duration}ms</span> : null}
                  </div>

                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{trigger?.label}</div>
                  <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 16 }}>→ {selected.action}</div>

                  {client ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: `${client.color}08`, border: `1px solid ${client.color}25`, borderRadius: 3, marginBottom: 16 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 2, background: `${client.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: client.color }}>{client.avatar}</div>
                      <span style={{ fontSize: 11, color: client.color }}>{client.name}</span>
                    </div>
                  ) : null}

                  <div style={{ fontSize: 10, color: "var(--muted2)", marginBottom: 6 }}>{selected.time}</div>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Payload</div>
                    <div style={{ padding: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, fontFamily: "'DM Mono', monospace" }}>
                      {Object.entries(selected.payload).map(([key, value]) => (
                        <div key={key} style={{ display: "flex", gap: 12, marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: "#a78bfa", minWidth: 120, flexShrink: 0 }}>{key}</span>
                          <span style={{ fontSize: 11, color: "var(--accent)" }}>"{String(value)}"</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selected.error ? (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 9, color: "#ff4444", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Error</div>
                      <div style={{ padding: "12px", background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 3, fontSize: 12, color: "#ff8888", lineHeight: 1.6 }}>
                        {selected.error}
                      </div>
                      <button className="retry-btn" onClick={() => retry(selected.id)} style={{ marginTop: 10, padding: "9px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, color: "var(--muted2)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        ↺ Retry trigger
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })()
          ) : null}
        </div>
      ) : null}

      {tab === "triggers" ? (
        <div style={{ padding: "28px 0", maxWidth: 680 }}>
          <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 20 }}>Event frequency and reliability by trigger type</div>
          {triggerStats.map((row) => {
            const integration = integrations.find((item) => item.id === row.integration);
            const maxCount = triggerStats[0]?.count ?? 1;
            return (
              <div key={row.id} style={{ marginBottom: 14, padding: "14px 16px", border: `1px solid ${row.fails > 0 ? "rgba(255,68,68,0.12)" : "rgba(255,255,255,0.05)"}`, borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 10, color: integration?.color }}>{integration?.icon}</span>
                    <span style={{ fontSize: 12, color: "var(--text)" }}>{row.label}</span>
                    {row.fails > 0 ? <span style={{ fontSize: 9, padding: "1px 5px", background: "rgba(255,68,68,0.1)", color: "#ff4444", borderRadius: 2 }}>{row.fails} failed</span> : null}
                  </div>
                  <span style={{ fontSize: 12, color: "#a0a0b0" }}>{row.count} runs</span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.04)", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${(row.count / maxCount) * 100}%`, background: row.fails > 0 ? "#ff8c00" : "var(--accent)", borderRadius: 3 }} />
                </div>
                {row.fails > 0 ? <div style={{ fontSize: 10, color: "#ff4444", marginTop: 5 }}>{Math.round((row.fails / row.count) * 100)}% failure rate - investigate connection</div> : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "integrations" ? (
        <div style={{ padding: "28px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, maxWidth: 800 }}>
            {integrations.map((integration) => {
              const runs = logs.filter((row) => row.integration === integration.id).length;
              const fails = logs.filter((row) => row.integration === integration.id && row.status === "failed").length;
              const rate = runs > 0 ? Math.round(((runs - fails) / runs) * 100) : 100;
              return (
                <div key={integration.id} style={{ padding: "18px", border: `1px solid ${integration.color}25`, borderRadius: 4, background: integration.bg }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 3, background: `${integration.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: integration.color }}>{integration.icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>{integration.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: runs > 0 ? "var(--accent)" : "var(--muted2)" }} />
                        <span style={{ fontSize: 9, color: runs > 0 ? "var(--accent)" : "var(--muted2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{runs > 0 ? "Connected" : "No activity"}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Runs", value: runs, color: "#a0a0b0" },
                      { label: "Fails", value: fails, color: fails > 0 ? "#ff4444" : "var(--muted2)" },
                      { label: "Uptime", value: `${rate}%`, color: rate >= 90 ? "var(--accent)" : "#f5c518" }
                    ].map((stat) => (
                      <div key={stat.label} style={{ padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: 2 }}>
                        <div style={{ fontSize: 8, color: "var(--muted2)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{stat.label}</div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  {fails > 0 ? <div style={{ marginTop: 10, fontSize: 10, color: "#ff4444", padding: "6px 8px", background: "rgba(255,68,68,0.08)", borderRadius: 2 }}>⚑ {fails} failed event{fails > 1 ? "s" : ""} - check connection</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
