"use client";

import { useMemo, useState } from "react";
import { createNotificationJobWithRefresh, type NotificationJob } from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";

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

function statusToneClass(status: string): string {
  if (status === "SENT") return styles.notifToneAccent;
  if (status === "FAILED") return styles.notifToneRed;
  if (status === "QUEUED") return styles.notifToneAmber;
  return styles.notifToneMuted;
}

function channelToneClass(channel: string): string {
  if (channel === "EMAIL") return styles.notifToneBlue;
  if (channel === "SMS") return styles.notifToneAmber;
  return styles.notifToneAccent;
}

export function NotificationsPage({
  snapshot,
  session,
  jobs,
  processing,
  onProcess,
  onRefreshSnapshot,
  onNotify
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  jobs: NotificationJob[];
  processing: boolean;
  onProcess: () => Promise<void>;
  onRefreshSnapshot: (sessionOverride?: AuthSession) => Promise<void>;
  onNotify: (tone: "success" | "error", message: string) => void;
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

  return (
    <div className={cx(styles.pageBody, styles.notifRoot)}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / COMMUNICATION</div>
          <div className={styles.pageTitle}>Notifications</div>
          <div className={styles.pageSub}>Queue triage · Delivery status · Channel health</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent", processing && "opacity70")} onClick={() => void onProcess()} disabled={processing}>
            {processing ? "Processing..." : "Process Queue"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Queued", value: queued.toString(), sub: "Pending dispatch", toneClass: queued > 0 ? styles.notifToneAmber : styles.notifToneAccent },
          { label: "Failed", value: failed.toString(), sub: "Requires retry", toneClass: failed > 0 ? styles.notifToneRed : styles.notifToneAccent },
          { label: "Sent", value: sent.toString(), sub: "Delivered notifications", toneClass: styles.notifToneBlue },
          { label: "Success Rate", value: `${successRate}%`, sub: `${jobs.length} total jobs`, toneClass: successRate >= 85 ? styles.notifToneAccent : styles.notifToneAmber }
        ].map((k) => (
          <div key={k.label} className={styles.statCard}>
            <div className={styles.statLabel}>{k.label}</div>
            <div className={cx(styles.statValue, k.toneClass)}>{k.value}</div>
            <div className={cx("text10", "colorMuted")}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters + Tabs */}
      <div className={cx("card", "p16", "mb12")}>
        <div className={cx("flexRow", "gap10", "flexWrap")}>
          <select title="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={styles.formInput}>
            <option value="ALL">All status</option>
            <option value="QUEUED">Queued</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
          <select title="Filter by channel" value={channelFilter} onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)} className={styles.formInput}>
            <option value="ALL">All channels</option>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
            <option value="PUSH">Push</option>
          </select>
          <select title="Filter by client" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className={styles.formInput}>
            <option value="ALL">All clients</option>
            {snapshot.clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>

          <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={cx(styles.filterSelect, "mlAuto")}>
            {(["queue", "composer", "delivery"] as Tab[]).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Queue tab */}
      {activeTab === "queue" ? (
        <div className={cx("card", "notifGridSplit")}>
          <div className={cx("notifTableHead", "fontMono", "textXs", "colorMuted", "uppercase")}>
            {["Channel", "Client", "Recipient", "Status", "Attempts", "Updated"].map((h) => <span key={h}>{h}</span>)}
          </div>
          <div className={cx("overflowAuto", "minH0")}>
            {filtered.length > 0 ? (
              filtered.map((job) => (
                <div key={job.id} className={cx("notifTableRow", "text12")}>
                  <span className={cx(styles.fontMono, channelToneClass(job.channel))}>{job.channel}</span>
                  <span className={cx("text11", "colorMuted")}>{job.clientId ? (byId.get(job.clientId) ?? "Unknown") : "-"}</span>
                  <span>{job.recipient}</span>
                  <span className={cx("fontMono", "text10", "wFit", statusToneClass(job.status))}>{job.status}</span>
                  <span className={cx("fontMono", "colorMuted")}>{job.attempts}/{job.maxAttempts}</span>
                  <span className={cx("fontMono", "colorMuted")}>{fmt(job.updatedAt)}</span>
                </div>
              ))
            ) : (
              <div className={cx("p20", "colorMuted", "text12")}>No notification jobs match current filters.</div>
            )}
          </div>
        </div>
      ) : null}

      {/* Composer tab */}
      {activeTab === "composer" ? (
        <div className={cx("card", "p20", "overflowAuto", "minH0")}>
          <div className={cx("grid2", "gap10", "mb10")}>
            <select title="Client context" value={createClientId} onChange={(e) => setCreateClientId(e.target.value)} disabled={!canEdit} className={styles.formInput}>
              <option value="">No client context</option>
              {snapshot.clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <select title="Notification channel" value={createChannel} onChange={(e) => setCreateChannel(e.target.value as typeof createChannel)} disabled={!canEdit} className={styles.formInput}>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push</option>
            </select>
            <input value={createRecipient} onChange={(e) => setCreateRecipient(e.target.value)} placeholder="Recipient" disabled={!canEdit} className={styles.formInput} />
            <input value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} placeholder="Subject (optional)" disabled={!canEdit} className={styles.formInput} />
          </div>
          <textarea value={createMessage} onChange={(e) => setCreateMessage(e.target.value)} placeholder="Notification message" disabled={!canEdit} rows={8} className={cx("formTextarea", "mb10")} />
          <div className={styles.flexBetween}>
            <span className={cx("text11", "colorMuted")}>{canEdit ? "Queue to notification gateway" : "Read-only mode"}</span>
            <button type="button" className={cx("btnSm", "btnAccent", !canEdit && "opacity60")} onClick={() => void handleQueue()} disabled={!canEdit}>
              Queue Notification
            </button>
          </div>
        </div>
      ) : null}

      {/* Delivery tab */}
      {activeTab === "delivery" ? (
        <div className={cx("grid2", "minH0")}>
          <div className={cx("card", "p20", "overflowAuto", "minH0")}>
            <div className={cx("text12", "fw700", "mb14")}>Delivery by Channel</div>
            {deliveryStats.map((row) => (
              <div key={row.channel} className={styles.mb12}>
                <div className={cx("flexBetween", "mb4")}>
                  <span className={cx(styles.text12, channelToneClass(row.channel))}>{row.channel}</span>
                  <span className={cx(styles.fontMono, row.pct >= 85 ? styles.notifToneAccent : styles.notifToneAmber)}>{row.pct}%</span>
                </div>
                <progress className={cx(styles.notifProgress, channelToneClass(row.channel))} max={100} value={row.pct} aria-label={`${row.channel} delivery ${row.pct}%`} />
                <div className={cx("text10", "colorMuted", "mt4")}>{row.ok} sent · {row.fail} failed · {row.total} total</div>
              </div>
            ))}
          </div>

          <div className={cx("card", "p20", "overflowAuto", "minH0")}>
            <div className={cx("text12", "fw700", "mb14")}>Failure Focus</div>
            {jobs.filter((job) => job.status === "FAILED").slice(0, 12).map((job, i, arr) => (
              <div key={job.id} className={cx("py10", i < arr.length - 1 && "borderB")}>
                <div className={cx("flexBetween", "mb3")}>
                  <span className={styles.text12}>{job.recipient}</span>
                  <span className={cx("text10", "fontMono", "colorRed")}>{job.channel}</span>
                </div>
                <div className={cx("text10", "colorMuted")}>{fmt(job.updatedAt)} · attempts {job.attempts}/{job.maxAttempts}</div>
              </div>
            ))}
            {jobs.filter((job) => job.status === "FAILED").length === 0 ? (
              <div className={cx("text12", "colorMuted")}>No failed jobs in current data.</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
