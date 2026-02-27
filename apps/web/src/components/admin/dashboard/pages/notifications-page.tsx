"use client";

import { useMemo, useState } from "react";
import { createNotificationJobWithRefresh, type NotificationJob } from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";

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
  if (status === "SENT") return C.primary;
  if (status === "FAILED") return C.red;
  if (status === "QUEUED") return C.amber;
  return C.muted;
}

function channelColor(channel: string): string {
  if (channel === "EMAIL") return C.blue;
  if (channel === "SMS") return C.amber;
  return C.primary;
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
    <div
      style={{
        background: C.bg,
        height: "100%",
        color: C.text,
        fontFamily: "Syne, sans-serif",
        padding: 0,
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "auto auto auto 1fr",
        minHeight: 0
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / COMMUNICATION</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Notifications</h1>
          <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>Queue triage · Delivery status · Channel health</div>
        </div>
        <button onClick={() => void onProcess()} disabled={processing} style={{ background: C.primary, color: C.bg, border: "none", padding: "8px 16px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: processing ? 0.7 : 1 }}>
          {processing ? "Processing..." : "Process Queue"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Queued", value: queued.toString(), sub: "Pending dispatch", color: queued > 0 ? C.amber : C.primary },
          { label: "Failed", value: failed.toString(), sub: "Requires retry", color: failed > 0 ? C.red : C.primary },
          { label: "Sent", value: sent.toString(), sub: "Delivered notifications", color: C.blue },
          { label: "Success Rate", value: `${successRate}%`, sub: `${jobs.length} total jobs`, color: successRate >= 85 ? C.primary : C.amber }
        ].map((k) => (
          <div key={k.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 24, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            <option value="ALL">All status</option>
            <option value="QUEUED">Queued</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            <option value="ALL">All channels</option>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
            <option value="PUSH">Push</option>
          </select>
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            <option value="ALL">All clients</option>
            {snapshot.clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <button onClick={() => { setStatusFilter("ALL"); setChannelFilter("ALL"); setClientFilter("ALL"); }} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>
            Reset
          </button>

          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {(["queue", "composer", "delivery"] as Tab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: "none", border: "none", borderBottom: activeTab === tab ? `2px solid ${C.primary}` : "none", color: activeTab === tab ? C.primary : C.muted, padding: "8px 12px", fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 600, textTransform: "capitalize", letterSpacing: "0.06em", cursor: "pointer" }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "queue" ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden", minHeight: 0, display: "grid", gridTemplateRows: "auto 1fr" }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 120px 1.2fr 100px 90px 150px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {["Channel", "Client", "Recipient", "Status", "Attempts", "Updated"].map((h) => <span key={h}>{h}</span>)}
          </div>
          <div style={{ overflow: "auto", minHeight: 0 }}>
            {filtered.length > 0 ? (
              filtered.map((job, i) => (
                <div key={job.id} style={{ display: "grid", gridTemplateColumns: "90px 120px 1.2fr 100px 90px 150px", padding: "12px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                  <span style={{ fontFamily: "DM Mono, monospace", color: channelColor(job.channel) }}>{job.channel}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{job.clientId ? (byId.get(job.clientId) ?? "Unknown") : "-"}</span>
                  <span style={{ fontSize: 12, color: C.text }}>{job.recipient}</span>
                  <span style={{ fontSize: 10, color: statusColor(job.status), background: `${statusColor(job.status)}15`, padding: "3px 8px", fontFamily: "DM Mono, monospace", width: "fit-content" }}>{job.status}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{job.attempts}/{job.maxAttempts}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{fmt(job.updatedAt)}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, color: C.muted, fontSize: 12 }}>No notification jobs match current filters.</div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "composer" ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20, overflow: "auto", minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, marginBottom: 10 }}>
            <select value={createClientId} onChange={(e) => setCreateClientId(e.target.value)} disabled={!canEdit} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
              <option value="">No client context</option>
              {snapshot.clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <select value={createChannel} onChange={(e) => setCreateChannel(e.target.value as typeof createChannel)} disabled={!canEdit} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push</option>
            </select>
            <input value={createRecipient} onChange={(e) => setCreateRecipient(e.target.value)} placeholder="Recipient" disabled={!canEdit} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }} />
            <input value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} placeholder="Subject (optional)" disabled={!canEdit} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }} />
          </div>
          <textarea value={createMessage} onChange={(e) => setCreateMessage(e.target.value)} placeholder="Notification message" disabled={!canEdit} rows={8} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "10px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, marginBottom: 10 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.muted }}>{canEdit ? "Queue to notification gateway" : "Read-only mode"}</span>
            <button onClick={() => void handleQueue()} disabled={!canEdit} style={{ background: C.primary, color: C.bg, border: "none", padding: "8px 14px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: canEdit ? 1 : 0.6 }}>
              Queue Notification
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === "delivery" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, minHeight: 0 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20, overflow: "auto", minHeight: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14 }}>Delivery by Channel</div>
            {deliveryStats.map((row) => (
              <div key={row.channel} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: channelColor(row.channel) }}>{row.channel}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: row.pct >= 85 ? C.primary : C.amber }}>{row.pct}%</span>
                </div>
                <div style={{ height: 6, background: C.border }}>
                  <div style={{ height: "100%", width: `${row.pct}%`, background: channelColor(row.channel) }} />
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{row.ok} sent · {row.fail} failed · {row.total} total</div>
              </div>
            ))}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20, overflow: "auto", minHeight: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14 }}>Failure Focus</div>
            {jobs.filter((job) => job.status === "FAILED").slice(0, 12).map((job, i, arr) => (
              <div key={job.id} style={{ padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: C.text }}>{job.recipient}</span>
                  <span style={{ fontSize: 10, color: C.red, fontFamily: "DM Mono, monospace" }}>{job.channel}</span>
                </div>
                <div style={{ fontSize: 10, color: C.muted }}>{fmt(job.updatedAt)} · attempts {job.attempts}/{job.maxAttempts}</div>
              </div>
            ))}
            {jobs.filter((job) => job.status === "FAILED").length === 0 ? (
              <div style={{ fontSize: 12, color: C.muted }}>No failed jobs in current data.</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
