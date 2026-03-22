"use client";

import { useMemo, useState } from "react";
import { createNotificationJobWithRefresh, type NotificationJob } from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

type Tab = "queue" | "composer" | "delivery";

function fmt(value?: string | null): string {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

function statusColor(status: string): string {
  if (status === "SENT")   return "var(--accent)";
  if (status === "FAILED") return "var(--red)";
  if (status === "QUEUED") return "var(--amber)";
  return "var(--muted)";
}

function channelColor(channel: string): string {
  if (channel === "EMAIL") return "var(--blue)";
  if (channel === "SMS")   return "var(--amber)";
  return "var(--accent)";
}

/* Returns the notifStrip* class for the row ::before left-border */
function statusStripCls(status: string, s: typeof styles): string {
  if (status === "FAILED") return s.notifStripRed;
  if (status === "QUEUED") return s.notifStripAmber;
  if (status === "SENT")   return s.notifStripAccent;
  return s.notifStripMuted;
}

/* Keep for the existing notifProgress compound selectors (progress bar fills) */
function channelToneClass(channel: string): string {
  if (channel === "EMAIL") return styles.notifToneBlue;
  if (channel === "SMS")   return styles.notifToneAmber;
  return styles.notifToneAccent;
}

export function NotificationsPage({
  snapshot,
  session,
  jobs,
  processing,
  onProcess,
  onRefreshSnapshot,
  onNotify,
  onMarkAllRead
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  jobs: NotificationJob[];
  processing: boolean;
  onProcess: () => Promise<void>;
  onRefreshSnapshot: (sessionOverride?: AuthSession) => Promise<void>;
  onNotify: (tone: "success" | "error", message: string) => void;
  onMarkAllRead?: () => Promise<void>;
}) {
  const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";

  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "QUEUED" | "SENT" | "FAILED">("ALL");
  const [channelFilter, setChannelFilter] = useState<"ALL" | "EMAIL" | "SMS" | "PUSH">("ALL");
  const [clientFilter, setClientFilter] = useState<string>("ALL");

  const [createClientId, setCreateClientId] = useState(snapshot.clients[0]?.id ?? "");
  const [createChannel, setCreateChannel] = useState<"EMAIL" | "SMS" | "PUSH">("EMAIL");
  const [createRecipient, setCreateRecipient] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createMessage, setCreateMessage] = useState("");

  const byId = useMemo(() => new Map(snapshot.clients.map((c) => [c.id, c.name])), [snapshot.clients]);

  const filtered = useMemo(() => {
    return jobs
      .filter((job) => (statusFilter === "ALL" ? true : job.status === statusFilter))
      .filter((job) => (channelFilter === "ALL" ? true : job.channel === channelFilter))
      .filter((job) => (clientFilter === "ALL" ? true : job.clientId === clientFilter))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [jobs, statusFilter, channelFilter, clientFilter]);

  const queued = jobs.filter((j) => j.status === "QUEUED").length;
  const failed = jobs.filter((j) => j.status === "FAILED").length;
  const sent = jobs.filter((j) => j.status === "SENT").length;
  const successRate = jobs.length > 0 ? Math.round((sent / jobs.length) * 100) : 0;

  const deliveryStats = useMemo(() => {
    const channels: Array<"EMAIL" | "SMS" | "PUSH"> = ["EMAIL", "SMS", "PUSH"];
    return channels.map((channel) => {
      const rows = jobs.filter((j) => j.channel === channel);
      const ok = rows.filter((j) => j.status === "SENT").length;
      const fail = rows.filter((j) => j.status === "FAILED").length;
      const pct = rows.length > 0 ? Math.round((ok / rows.length) * 100) : 0;
      return { channel, total: rows.length, ok, fail, pct };
    });
  }, [jobs]);

  async function handleQueue(): Promise<void> {
    if (!session || !canEdit) return;
    if (!createRecipient.trim() || !createMessage.trim()) {
      onNotify("error", "Recipient and message are required.");
      return;
    }
    const created = await createNotificationJobWithRefresh(session, {
      clientId: createClientId || undefined,
      channel: createChannel,
      recipient: createRecipient.trim(),
      subject: createSubject.trim() || undefined,
      message: createMessage.trim()
    });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to queue notification.");
      return;
    }
    setCreateRecipient("");
    setCreateSubject("");
    setCreateMessage("");
    onNotify("success", "Notification queued.");
    await onRefreshSnapshot(created.nextSession);
  }

  const failedJobs = jobs.filter((job) => job.status === "FAILED");

  return (
    <div className={cx(styles.pageBody, styles.notifRoot)}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / COMMUNICATION</div>
          <div className={styles.pageTitle}>Notifications</div>
          <div className={styles.pageSub}>Queue triage · Delivery status · Channel health</div>
        </div>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={cx("btnSm", "btnAccent", processing && "opacity70")}
            onClick={() => void onProcess()}
            disabled={processing}
          >
            {processing ? "Processing..." : "Process Queue"}
          </button>
        </div>
      </div>

      {/* ── KPI grid ── */}
      <div className={styles.notifKpiGrid}>
        {[
          { label: "Queued",       value: queued.toString(),        sub: "Pending dispatch",        color: queued > 0       ? "var(--amber)"  : "var(--accent)" },
          { label: "Failed",       value: failed.toString(),        sub: "Requires retry",          color: failed > 0       ? "var(--red)"    : "var(--accent)" },
          { label: "Sent",         value: sent.toString(),          sub: "Delivered notifications", color: "var(--blue)" },
          { label: "Success Rate", value: `${successRate}%`,        sub: `${jobs.length} total jobs`, color: successRate >= 85 ? "var(--accent)" : "var(--amber)" }
        ].map((k) => (
          <div key={k.label} className={cx(styles.notifKpiCard, toneClass(k.color))}>
            <div className={styles.notifKpiLabel}>{k.label}</div>
            <div className={cx(styles.notifKpiValue, toneClass(k.color))}>{k.value}</div>
            <div className={styles.notifKpiMeta}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filters + tab selector ── */}
      <div className={styles.notifFilters}>
        <span className={styles.notifFiltersLabel}>Filters</span>
        <select title="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={styles.filterSelect}>
          <option value="ALL">All status</option>
          <option value="QUEUED">Queued</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
        </select>
        <select title="Filter by channel" value={channelFilter} onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)} className={styles.filterSelect}>
          <option value="ALL">All channels</option>
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
          <option value="PUSH">Push</option>
        </select>
        <select title="Filter by client" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className={styles.filterSelect}>
          <option value="ALL">All clients</option>
          {snapshot.clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
        <div className={styles.notifFiltersDivider} />
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {(["queue", "composer", "delivery"] as Tab[]).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* ── Queue tab ── */}
      {activeTab === "queue" ? (
        <div className={styles.notifSection}>
          <div className={styles.notifSectionHeader}>
            <span className={styles.notifSectionTitle}>Notification Queue</span>
            <span className={styles.notifSectionMeta}>{filtered.length} JOBS</span>
            {onMarkAllRead && (
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => void onMarkAllRead()}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className={styles.notifQueueHead}>
            {["Channel", "Client", "Recipient", "Status", "Attempts", "Updated"].map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {filtered.length > 0 ? (
            filtered.map((job) => (
              <div key={job.id} className={`${styles.notifQueueRow} ${statusStripCls(job.status, styles)}`}>
                <span className={cx(styles.notifChannelTag, toneClass(channelColor(job.channel)))}>{job.channel}</span>
                <span className={cx("text11", "colorMuted")}>{job.clientId ? (byId.get(job.clientId) ?? "Unknown") : "—"}</span>
                <span className={cx("fontMono", "text11")}>{job.recipient}</span>
                <span className={cx(styles.notifStatusTag, toneClass(statusColor(job.status)))}>{job.status}</span>
                <span className={cx("fontMono", "colorMuted", "text11")}>{job.attempts}/{job.maxAttempts}</span>
                <span className={cx("fontMono", "colorMuted", "text11")}>{fmt(job.updatedAt)}</span>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptySub}>No notification jobs match current filters.</div>
            </div>
          )}
        </div>
      ) : null}

      {/* ── Composer tab ── */}
      {activeTab === "composer" ? (
        <div className={styles.notifComposerCard}>
          <div className={styles.notifSectionHeader}>
            <span className={styles.notifSectionTitle}>Queue Notification</span>
            <span className={styles.notifSectionMeta}>{canEdit ? "COMPOSE MODE" : "READ ONLY"}</span>
          </div>
          <div className={styles.notifComposerForm}>
            <select title="Client context" value={createClientId} onChange={(e) => setCreateClientId(e.target.value)} disabled={!canEdit} className={cx("formInput", "fontMono", "text12")}>
              <option value="">No client context</option>
              {snapshot.clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <select title="Notification channel" value={createChannel} onChange={(e) => setCreateChannel(e.target.value as typeof createChannel)} disabled={!canEdit} className={cx("formInput", "fontMono", "text12")}>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push</option>
            </select>
            <input value={createRecipient} onChange={(e) => setCreateRecipient(e.target.value)} placeholder="Recipient" disabled={!canEdit} className={cx("formInput", "fontMono", "text12")} />
            <input value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} placeholder="Subject (optional)" disabled={!canEdit} className={cx("formInput", "fontMono", "text12")} />
          </div>
          <div className={styles.notifComposerBody}>
            <textarea value={createMessage} onChange={(e) => setCreateMessage(e.target.value)} placeholder="Notification message" disabled={!canEdit} rows={7} className={cx("formTextarea", styles.notifComposerTextarea)} />
          </div>
          <div className={styles.notifComposerActions}>
            <span className={cx("text11", "colorMuted")}>{canEdit ? "Queue to notification gateway" : "Read-only mode"}</span>
            <button type="button" className={cx("btnSm", "btnAccent", !canEdit && "opacity60")} onClick={() => void handleQueue()} disabled={!canEdit}>
              Queue Notification
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Delivery tab ── */}
      {activeTab === "delivery" ? (
        <div className={styles.notifDeliverySplit}>
          <div className={styles.notifDeliveryCard}>
            <div className={styles.notifSectionHeader}>
              <span className={styles.notifSectionTitle}>Delivery by Channel</span>
              <span className={styles.notifSectionMeta}>{jobs.length} TOTAL</span>
            </div>
            {deliveryStats.map((row) => (
              <div key={row.channel} className={styles.notifDeliveryChannel}>
                <div className={styles.notifDeliveryHead}>
                  <span className={cx(styles.notifDeliveryChLabel, toneClass(channelColor(row.channel)))}>{row.channel}</span>
                  <span className={cx(styles.notifDeliveryPct, row.pct >= 85 ? styles.notifToneAccent : styles.notifToneAmber)}>{row.pct}%</span>
                </div>
                <progress className={cx(styles.notifProgress, channelToneClass(row.channel))} max={100} value={row.pct} aria-label={`${row.channel} delivery ${row.pct}%`} />
                <div className={cx("fontMono", "text10", "colorMuted", "mt4")}>{row.ok} sent · {row.fail} failed · {row.total} total</div>
              </div>
            ))}
          </div>

          <div className={styles.notifDeliveryCard}>
            <div className={styles.notifSectionHeader}>
              <span className={styles.notifSectionTitle}>Failure Focus</span>
              <span className={cx(styles.notifSectionMeta, failedJobs.length > 0 ? styles.notifToneRed : "")}>
                {failedJobs.length} FAILED
              </span>
            </div>
            {failedJobs.length > 0 ? (
              failedJobs.slice(0, 12).map((job) => (
                <div key={job.id} className={styles.notifFailRow}>
                  <div>
                    <div className={cx("text12", "fw600", "mb3")}>{job.recipient}</div>
                    <div className={cx("fontMono", "text10", "colorMuted")}>{fmt(job.updatedAt)} · {job.attempts}/{job.maxAttempts} attempts</div>
                  </div>
                  <span className={cx(styles.notifChannelTag, toneClass(channelColor(job.channel)))}>{job.channel}</span>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptySub}>No failed jobs in current data.</div>
              </div>
            )}
          </div>
        </div>
      ) : null}

    </div>
  );
}
