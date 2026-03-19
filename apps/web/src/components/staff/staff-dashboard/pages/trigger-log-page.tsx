// ════════════════════════════════════════════════════════════════════════════
// trigger-log-page.tsx — Staff Dashboard: Trigger Log
// Displays automation job audit log from the automation service.
// Data: GET /automation/jobs (via getAutomationJobs)
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffClients } from "../../../../lib/api/staff/clients";
import { getAutomationJobs, type AutomationJob } from "../../../../lib/api/staff/automation";
import { cx } from "../style";

type Integration = {
  id: "zapier" | "make" | "webhook" | "n8n" | "internal";
  name: string;
  icon: string;
};

type Trigger = {
  id: string;
  label: string;
  integration: Integration["id"];
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
  { id: "zapier", name: "Zapier", icon: "⚡" },
  { id: "make", name: "Make", icon: "◎" },
  { id: "webhook", name: "Webhook", icon: "◈" },
  { id: "n8n", name: "n8n", icon: "◉" },
  { id: "internal", name: "Internal", icon: "⊡" }
];

const triggers: Trigger[] = [
  { id: "milestone_approved", label: "Milestone approved", integration: "zapier" },
  { id: "invoice_sent", label: "Invoice sent", integration: "zapier" },
  { id: "invoice_paid", label: "Invoice paid", integration: "make" },
  { id: "client_message", label: "Client message received", integration: "webhook" },
  { id: "portal_login", label: "Client portal login", integration: "internal" },
  { id: "standup_submitted", label: "Standup submitted", integration: "zapier" },
  { id: "retainer_exceeded", label: "Retainer exceeded", integration: "make" },
  { id: "new_file_uploaded", label: "File uploaded to Drive", integration: "webhook" },
  { id: "task_completed", label: "Task marked complete", integration: "n8n" },
  { id: "score_dropped", label: "Satisfaction score drop", integration: "internal" }
];

const clients: { id: number; name: string; avatar: string }[] = [];

const initialLogs: LogItem[] = [];

const statusLabel: Record<LogStatus, string> = {
  success: "Success",
  failed: "Failed",
  pending: "Pending"
};

function integrationTone(id: Integration["id"]) {
  return `tlTone${id[0].toUpperCase()}${id.slice(1)}`;
}

function statusTone(status: LogStatus) {
  if (status === "failed") return "tlStatusFailed";
  if (status === "pending") return "tlStatusPending";
  return "tlStatusSuccess";
}

function clientTone(clientId: number) {
  if (clientId === 1) return "tlClientOne";
  if (clientId === 2) return "tlClientTwo";
  if (clientId === 3) return "tlClientThree";
  if (clientId === 4) return "tlClientFour";
  if (clientId === 5) return "tlClientFive";
  return "colorMuted2";
}

function mapJobToLog(job: AutomationJob, index: number): LogItem {
  const topicParts = job.topic.split(".");
  const triggerKey = topicParts[topicParts.length - 1] ?? job.topic;
  const matchedTrigger = triggers.find((t) => job.topic.includes(t.id)) ?? triggers.find((t) => job.workflow.includes(t.id));

  let status: LogStatus = "pending";
  if (job.status === "succeeded") status = "success";
  else if (job.status === "failed" || job.status === "dead-lettered") status = "failed";
  else if (job.status === "received" || job.status === "processing" || job.status === "skipped-duplicate") status = "pending";

  const intId = (() => {
    if (job.workflow.includes("booking") || job.workflow.includes("lead") || job.workflow.includes("proposal")) return "zapier" as const;
    if (job.workflow.includes("billing") || job.workflow.includes("invoice")) return "make" as const;
    if (job.workflow.includes("communication") || job.workflow.includes("file")) return "webhook" as const;
    if (job.workflow.includes("ai") || job.workflow.includes("reporting")) return "n8n" as const;
    return "internal" as const;
  })();

  const clientNum = job.clientId ? Math.abs(job.clientId.charCodeAt(0) % 6) : 0;

  return {
    id: index + 1,
    triggerId: matchedTrigger?.id ?? triggerKey,
    clientId: clientNum,
    integration: intId,
    action: job.workflow,
    status,
    duration: job.attempts > 0 ? job.attempts * 150 : null,
    time: new Date(job.updatedAt).toLocaleString(),
    payload: { topic: job.topic, eventId: job.eventId, attempts: job.attempts, workflow: job.workflow },
    error: job.lastError ?? undefined
  };
}

export function TriggerLogPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);
  const [selected, setSelected] = useState<LogItem | null>(null);
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all");
  const [intFilter, setIntFilter] = useState<"all" | Integration["id"]>("all");
  const [tab, setTab] = useState<"log" | "triggers" | "integrations">("log");
  const [apiClients, setApiClients] = useState<Array<{ id: string; name: string; avatar: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    void getStaffClients(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data && r.data.length > 0) {
        setApiClients(r.data.map((c) => ({
          id: c.id,
          name: c.name,
          avatar: c.name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase()
        })));
      }
    });
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    void getAutomationJobs(session, 50).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) {
        setError(r.error?.message ?? "Failed to load data. Please try again.");
        setLoading(false);
        return;
      }
      if (r.data.length > 0) {
        const mapped = r.data.map((job, i) => mapJobToLog(job, i));
        setLogs(mapped);
        setSelected(mapped[0] ?? null);
      }
      setError(null);
      setLoading(false);
    });
  }, [session?.accessToken]);

  const clientsToUse = apiClients.length > 0 ? apiClients : clients.map((c) => ({ id: String(c.id), name: c.name, avatar: c.avatar }));

  const retry = (id: number) => {
    setLogs((previous) => previous.map((row) => (row.id === id ? { ...row, status: "success", duration: 340, error: undefined } : row)));
    if (selected?.id === id) {
      setSelected((previous) => (previous ? { ...previous, status: "success", duration: 340, error: undefined } : previous));
    }
  };

  const filtered = useMemo(
    () => logs.filter((row) => (filter === "all" ? true : row.status === filter)).filter((row) => (intFilter === "all" ? true : row.integration === intFilter)),
    [filter, intFilter, logs]
  );

  const successCount = logs.filter((row) => row.status === "success").length;
  const failCount = logs.filter((row) => row.status === "failed").length;
  const withDuration = logs.filter((row) => row.duration !== null);
  const avgDuration = withDuration.length > 0 ? Math.round(withDuration.reduce((sum, row) => sum + (row.duration ?? 0), 0) / withDuration.length) : 0;

  const triggerStats = useMemo(
    () =>
      triggers
        .map((trigger) => ({
          ...trigger,
          count: logs.filter((row) => row.triggerId === trigger.id).length,
          fails: logs.filter((row) => row.triggerId === trigger.id && row.status === "failed").length
        }))
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count),
    [logs]
  );

  const maxTriggerCount = triggerStats[0]?.count ?? 1;

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

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-trigger-log">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("flexBetween", "mb20")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Automations</div>
            <h1 className={cx("pageTitleText")}>Trigger Log</h1>
          </div>
          <div className={cx("flexRow", "gap24")}>
            {[
              { label: "Total runs", value: String(logs.length), className: "colorMuted" },
              { label: "Success rate", value: `${Math.round((successCount / logs.length) * 100)}%`, className: "colorAccent" },
              { label: "Failures", value: String(failCount), className: failCount > 0 ? "colorRed" : "colorMuted2" },
              { label: "Avg latency", value: `${avgDuration}ms`, className: "colorMuted" }
            ].map((stat) => (
              <div key={stat.label} className={cx("textRight")}>
                <div className={cx("statLabelNew")}>{stat.label}</div>
                <div className={cx("statValueNew", stat.className)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("flexBetween", "gap12")}> 
          <div className={cx("flexRow")}> 
            {[{ key: "log", label: "Event log" }, { key: "triggers", label: "Trigger stats" }, { key: "integrations", label: "Integrations" }].map((row) => (
              <button type="button"
                key={row.key}
                className={cx("tlTabBtn", "tlTabPill", tab === row.key ? "tlTabPillActive" : "tlTabPillIdle")}
                onClick={() => setTab(row.key as "log" | "triggers" | "integrations")}
              >
                {row.label}
              </button>
            ))}
          </div>

          <div className={cx("filterRow", "pb10")}>
            <select
              className={cx("filterSelect")}
              aria-label="Filter trigger status"
              value={filter}
              onChange={(event) => setFilter(event.target.value as "all" | "success" | "failed")}
            >
              <option value="all">All status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            <select
              className={cx("filterSelect")}
              aria-label="Filter integration"
              value={intFilter}
              onChange={(event) => setIntFilter(event.target.value as "all" | Integration["id"])}
            >
              <option value="all">All integrations</option>
              {integrations.map((integration) => (
                <option key={integration.id} value={integration.id}>
                  {integration.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {tab === "log" ? (
        <div className={cx("tlLayout")}>
          <div className={cx("tlListPane")}> 
            <div className={cx("tlLogGrid", "tlHeadRow")}>
              {""}
              <div>Trigger / Action</div>
              <div>Integration</div>
              <div>Client</div>
              <div>Status</div>
              <div>ms</div>
            </div>

            {filtered.map((log) => {
              const integration = integrations.find((row) => row.id === log.integration);
              const trigger = triggers.find((row) => row.id === log.triggerId);
              const client = clientsToUse.find((row) => row.id === String(log.clientId));
              const isSelected = selected?.id === log.id;
              return (
                <button
                  key={log.id}
                  type="button"
                  className={cx("tlLogGrid", "tlLogRow", "tlRowCard", isSelected && "tlRowCardSelected", log.status === "failed" && "tlRowCardFailed")}
                  onClick={() => setSelected(log)}
                >
                  <span className={cx("tlDot", statusTone(log.status), log.status === "failed" && "tlPulse")} />
                  <div className={cx("minW0")}> 
                    <div className={cx("text11", "colorText", "truncate")}>{trigger?.label}</div>
                    <div className={cx("text10", "colorMuted2", "truncate")}>{log.action}</div>
                  </div>
                  <div className={cx("flexRow", "gap6")}> 
                    <span className={cx("text10", integration && integrationTone(integration.id))}>{integration?.icon}</span>
                    <span className={cx("text10", "colorMuted2")}>{integration?.name}</span>
                  </div>
                  <div className={cx("text10", clientTone(log.clientId))}>{client?.name?.split(" ")[0] ?? "-"}</div>
                  <span className={cx("tlStatusPill", statusTone(log.status))}>{statusLabel[log.status]}</span>
                  <div className={cx("text10", log.duration ? "colorMuted" : "colorRed")}>{log.duration ? String(log.duration) : "-"}</div>
                </button>
              );
            })}
          </div>

          {selected ? (
            <div className={cx("tlDetailPane")}>
              {(() => {
                const integration = integrations.find((row) => row.id === selected.integration);
                const trigger = triggers.find((row) => row.id === selected.triggerId);
                const client = clientsToUse.find((row) => row.id === String(selected.clientId));

                return (
                  <>
                    <div className={cx("flexRow", "gap8", "mb12", "flexWrap")}>
                      <span className={cx("tlBadge", integration ? integrationTone(integration.id) : "tlFilterAll")}>{integration ? `${integration.icon} ${integration.name}` : "Integration"}</span>
                      <span className={cx("tlBadge", statusTone(selected.status))}>{statusLabel[selected.status]}</span>
                      {selected.duration ? <span className={cx("tlBadge", "tlBadgeMuted")}>{selected.duration}ms</span> : null}
                    </div>

                    <div className={cx("dlPanelTitle", "mb4")}>{trigger?.label}</div>
                    <div className={cx("text12", "colorMuted2", "mb16")}>→ {selected.action}</div>

                    {client ? (
                      <div className={cx("tlClientCard", clientTone(selected.clientId), "mb16")}>
                        <div className={cx("tlClientAvatar")}>{client.avatar}</div>
                        <span className={cx("text11")}>{client.name}</span>
                      </div>
                    ) : null}

                    <div className={cx("text10", "colorMuted2", "mb6")}>{selected.time}</div>

                    <div className={cx("mt16")}>
                      <div className={cx("sectionLabel", "mb8")}>Payload</div>
                      <div className={cx("tlPayloadBox")}>
                        {Object.entries(selected.payload).map(([key, value]) => (
                          <div key={key} className={cx("tlPayloadRow")}>
                            <span className={cx("tlPayloadKey")}>{key}</span>
                            <span className={cx("tlPayloadVal")}>&quot;{String(value)}&quot;</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selected.error ? (
                      <div className={cx("mt16")}>
                        <div className={cx("tlErrorLabel", "mb8")}>Error</div>
                        <div className={cx("tlErrorBox")}>{selected.error}</div>
                        <button type="button" className={cx("button", "buttonGhost", "tlRetryBtn", "mt10")} onClick={() => retry(selected.id)}>
                          ↺ Retry trigger
                        </button>
                      </div>
                    ) : null}
                  </>
                );
              })()}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "triggers" ? (
        <div className={cx("tlStatsPane")}> 
          <div className={cx("text12", "colorMuted2", "mb20")}>Event frequency and reliability by trigger type</div>
          {triggerStats.map((row) => {
            const integration = integrations.find((item) => item.id === row.integration);
            return (
              <div key={row.id} className={cx("tlTriggerCard", row.fails > 0 && "tlTriggerCardWarn")}>
                <div className={cx("flexBetween", "mb8")}>
                  <div className={cx("flexRow", "gap10")}>
                    <span className={cx("text10", integration && integrationTone(integration.id))}>{integration?.icon}</span>
                    <span className={cx("text12", "colorText")}>{row.label}</span>
                    {row.fails > 0 ? <span className={cx("tlFailMini")}>{row.fails} failed</span> : null}
                  </div>
                  <span className={cx("text12", "colorMuted")}>{row.count} runs</span>
                </div>
                <progress className={cx("progressMeter", row.fails > 0 ? "progressMeterAmber" : "progressMeterAccent")} max={maxTriggerCount} value={row.count} />
                {row.fails > 0 ? <div className={cx("text10", "colorRed", "mt6")}>{Math.round((row.fails / row.count) * 100)}% failure rate - investigate connection</div> : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "integrations" ? (
        <div className={cx("mt24")}>
          <div className={cx("tlIntGrid")}>
            {integrations.map((integration) => {
              const runs = logs.filter((row) => row.integration === integration.id).length;
              const fails = logs.filter((row) => row.integration === integration.id && row.status === "failed").length;
              const rate = runs > 0 ? Math.round(((runs - fails) / runs) * 100) : 100;
              return (
                <div key={integration.id} className={cx("tlIntCard", integrationTone(integration.id))}>
                  <div className={cx("flexRow", "gap10", "mb14")}>
                    <div className={cx("tlIntIcon", integrationTone(integration.id))}>{integration.icon}</div>
                    <div>
                      <div className={cx("fontDisplay", "fw700", "text14", "colorText")}>{integration.name}</div>
                      <div className={cx("flexRow", "gap6", "mt4")}>
                        <div className={cx("tlDot", runs > 0 ? "tlStatusSuccess" : "tlDotMuted")} />
                        <span className={cx("text10", runs > 0 ? "colorAccent" : "colorMuted2", "uppercase")}>{runs > 0 ? "Connected" : "No activity"}</span>
                      </div>
                    </div>
                  </div>

                  <div className={cx("tlIntStatsGrid")}>
                    {[
                      { label: "Runs", value: String(runs), className: "colorMuted" },
                      { label: "Fails", value: String(fails), className: fails > 0 ? "colorRed" : "colorMuted2" },
                      { label: "Uptime", value: `${rate}%`, className: rate >= 90 ? "colorAccent" : "colorAmber" }
                    ].map((stat) => (
                      <div key={stat.label} className={cx("tlIntStatCard")}>
                        <div className={cx("text10", "colorMuted2", "uppercase", "mb4")}>{stat.label}</div>
                        <div className={cx("fontDisplay", "fw700", "text14", stat.className)}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {fails > 0 ? <div className={cx("tlFailBanner")}>⚑ {fails} failed event{fails > 1 ? "s" : ""} - check connection</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
