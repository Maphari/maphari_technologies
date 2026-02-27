"use client";

import { useMemo, useState } from "react";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { createPublicApiKeyWithRefresh, type PartnerApiKey } from "../../../../lib/api/admin";
import type { DashboardToast } from "../../../shared/dashboard-core";
import type { AuthSession } from "../../../../lib/auth/session";
import { EmptyState, formatDate } from "./admin-page-utils";

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

export function AdminIntegrationsPageClient({
  keys,
  onRefreshKeys,
  onNotify
}: {
  keys: PartnerApiKey[];
  onRefreshKeys: (sessionOverride?: AuthSession) => Promise<void>;
  onNotify: (tone: DashboardToast["tone"], message: string) => void;
}) {
  const { snapshot, session } = useAdminWorkspaceContext();

  const tabs = ["keys inventory", "issue key", "security posture", "provider map"] as const;
  type Tab = (typeof tabs)[number];

  const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
  const [activeTab, setActiveTab] = useState<Tab>("keys inventory");
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("ALL");
  const [createClientId, setCreateClientId] = useState(snapshot.clients[0]?.id ?? "");
  const [createLabel, setCreateLabel] = useState("");

  const nowMs = Date.now();

  const enrichedKeys = useMemo(() => {
    return keys.map((key) => {
      const createdMs = new Date(key.createdAt).getTime();
      const ageDays = Number.isFinite(createdMs)
        ? Math.max(0, Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24)))
        : 0;
      const risk = ageDays >= 180 ? "high" : ageDays >= 90 ? "medium" : "low";
      const scope = key.clientId ? "client-bound" : "global";
      return { ...key, ageDays, risk, scope };
    });
  }, [keys, nowMs]);

  const filteredKeys = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enrichedKeys
      .filter((key) => {
        if (clientFilter !== "ALL" && key.clientId !== clientFilter) return false;
        if (!q) return true;
        const clientName = snapshot.clients.find((c) => c.id === key.clientId)?.name ?? "";
        return key.label.toLowerCase().includes(q) || key.keyId.toLowerCase().includes(q) || clientName.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clientFilter, enrichedKeys, query, snapshot.clients]);

  const highRiskKeys = enrichedKeys.filter((k) => k.risk === "high").length;
  const clientBoundKeys = enrichedKeys.filter((k) => k.scope === "client-bound").length;
  const globalKeys = enrichedKeys.filter((k) => k.scope === "global").length;
  const newestKeyAt = enrichedKeys.length
    ? enrichedKeys.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
    : null;

  async function handleIssueKey(): Promise<void> {
    if (!session || !canEdit) return;
    if (!createLabel.trim()) { onNotify("error", "Key label is required."); return; }
    const issued = await createPublicApiKeyWithRefresh(session, { clientId: createClientId || undefined, label: createLabel.trim() });
    if (!issued.nextSession || !issued.data) { onNotify("error", issued.error?.message ?? "Unable to issue API key."); return; }
    setCreateLabel("");
    onNotify("success", "Public API key issued.");
    await onRefreshKeys(issued.nextSession);
  }

  return (
    <div style={{ background: C.bg, height: "100%", color: C.text, fontFamily: "Syne, sans-serif", padding: 0, overflow: "hidden", display: "grid", gridTemplateRows: "auto auto auto 1fr", minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>AUTOMATION / INTEGRATIONS</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Integrations</h1>
          <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>API key lifecycle, provider posture, and integration readiness boundaries.</div>
        </div>
        <button type="button" onClick={() => void onRefreshKeys()} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Refresh Keys</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Total Keys", value: `${enrichedKeys.length}`, color: C.primary, sub: "Active integration keys" },
          { label: "High Rotation Risk", value: `${highRiskKeys}`, color: highRiskKeys > 0 ? C.red : C.primary, sub: "Older than 180 days" },
          { label: "Client-Bound Keys", value: `${clientBoundKeys}`, color: C.blue, sub: `${globalKeys} global keys` },
          { label: "Last Key Issued", value: newestKeyAt ? formatDate(newestKeyAt) : "N/A", color: C.amber, sub: "Most recent credential event" }
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 24, fontWeight: 800, color: kpi.color, marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{kpi.sub}</div>
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
          <div style={{ fontSize: 11, color: C.muted }}>Access control and permission policy remain in the <span style={{ color: C.primary }}>Access Control</span> page.</div>
        </div>
      </div>

      <div style={{ overflow: "auto", minHeight: 0 }}>
        {(activeTab === "keys inventory" || activeTab === "security posture") ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                <option value="ALL">Client: All</option>
                {snapshot.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
              <input placeholder="Search label, client, key id" value={query} onChange={(e) => setQuery(e.target.value)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, minWidth: 280 }} />
              {(clientFilter !== "ALL" || query.trim()) ? (
                <button onClick={() => { setClientFilter("ALL"); setQuery(""); }} style={{ background: C.border, border: "none", color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Clear</button>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "keys inventory" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 110px 110px 110px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "DM Mono, monospace", gap: 12 }}>
              {["Label", "Client", "Key ID", "Scope", "Age", "Risk"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {filteredKeys.length > 0 ? filteredKeys.map((key, idx) => (
              <div key={key.id} style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 110px 110px 110px", padding: "13px 20px", borderBottom: idx < filteredKeys.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 12, background: key.risk === "high" ? "#1a0a0a" : "transparent" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{key.label}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Created {formatDate(key.createdAt)}</div>
                </div>
                <span style={{ fontSize: 11, color: C.text }}>{snapshot.clients.find((c) => c.id === key.clientId)?.name ?? "Global"}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{key.keyId.slice(0, 16)}...</span>
                <span style={{ fontSize: 10, color: key.scope === "client-bound" ? C.blue : C.amber, background: `${key.scope === "client-bound" ? C.blue : C.amber}15`, padding: "3px 8px", fontFamily: "DM Mono, monospace", textTransform: "uppercase", width: "fit-content" }}>{key.scope === "client-bound" ? "Client" : "Global"}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{key.ageDays}d</span>
                <span style={{ fontSize: 10, color: key.risk === "high" ? C.red : key.risk === "medium" ? C.amber : C.primary, background: `${key.risk === "high" ? C.red : key.risk === "medium" ? C.amber : C.primary}15`, padding: "3px 8px", fontFamily: "DM Mono, monospace", textTransform: "uppercase", width: "fit-content" }}>{key.risk}</span>
              </div>
            )) : (
              <div style={{ padding: 20 }}><EmptyState title="No API keys match current filters" subtitle="Broaden filters or issue a new key to populate this inventory." compact variant="security" /></div>
            )}
          </div>
        ) : null}

        {activeTab === "issue key" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Issue API Key</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                <select value={createClientId} onChange={(e) => setCreateClientId(e.target.value)} disabled={!canEdit} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                  <option value="">Select client (optional)</option>
                  {snapshot.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
                <input placeholder="Key label (e.g. Zapier Production)" value={createLabel} onChange={(e) => setCreateLabel(e.target.value)} disabled={!canEdit} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }} />
                {canEdit ? (
                  <button type="button" onClick={() => void handleIssueKey()} style={{ background: C.primary, border: "none", color: C.bg, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: "pointer", width: "fit-content" }}>Issue Key</button>
                ) : (
                  <div style={{ fontSize: 12, color: C.muted }}>Read-only mode for this role.</div>
                )}
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Issuance Guardrails</div>
              {["Scope keys to specific client integrations where possible.", "Rotate keys routinely and remove stale credentials.", "Do not expose secrets in query parameters or client bundles.", "Monitor unusual key usage and isolate by integration."].map((rule) => (
                <div key={rule} style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.7 }}>• {rule}</div>
              ))}
              <div style={{ marginTop: 8, padding: 12, background: C.bg, border: `1px solid ${C.border}`, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>Secrets are only shown at issuance time by providers in most flows. Store them in a secure vault and avoid sharing over chat/email.</div>
            </div>
          </div>
        ) : null}

        {activeTab === "security posture" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rotation Watchlist</div>
              {filteredKeys.length > 0 ? filteredKeys.slice().sort((a, b) => b.ageDays - a.ageDays).slice(0, 8).map((key) => (
                <div key={key.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12 }}>{key.label}</span>
                    <span style={{ fontSize: 10, color: key.risk === "high" ? C.red : key.risk === "medium" ? C.amber : C.primary, fontFamily: "DM Mono, monospace" }}>{key.ageDays}d</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.muted }}>{snapshot.clients.find((c) => c.id === key.clientId)?.name ?? "Global"} · {key.risk.toUpperCase()} risk</div>
                </div>
              )) : <EmptyState title="No keys in scope" subtitle="Issue a key or clear filters to populate rotation watchlist." compact variant="security" />}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Posture Checks</div>
              {[
                { label: "Inventory tracked", value: `${enrichedKeys.length} keys`, color: C.primary },
                { label: "Keys older than 180 days", value: `${highRiskKeys}`, color: highRiskKeys > 0 ? C.red : C.primary },
                { label: "Client-bound key ratio", value: enrichedKeys.length > 0 ? `${Math.round((clientBoundKeys / enrichedKeys.length) * 100)}%` : "0%", color: C.blue },
                { label: "Global key ratio", value: enrichedKeys.length > 0 ? `${Math.round((globalKeys / enrichedKeys.length) * 100)}%` : "0%", color: C.amber }
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                  <span style={{ color: C.muted }}>{row.label}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: row.color, fontWeight: 700 }}>{row.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, fontSize: 11, color: C.muted, lineHeight: 1.7 }}>Permission grants and role policies are handled in Access Control. This page tracks integration credential hygiene only.</div>
            </div>
          </div>
        ) : null}

        {activeTab === "provider map" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Provider Readiness</div>
              {[
                { provider: "Webhook Gateway", state: enrichedKeys.length > 0 ? "connected" : "idle", color: enrichedKeys.length > 0 ? C.primary : C.muted, detail: `${enrichedKeys.length} credentials available` },
                { provider: "Partner API", state: enrichedKeys.length > 0 ? "connected" : "idle", color: enrichedKeys.length > 0 ? C.blue : C.muted, detail: `${enrichedKeys.length} keys issued` },
                { provider: "Billing Sync", state: snapshot.invoices.length > 0 ? "connected" : "idle", color: snapshot.invoices.length > 0 ? C.primary : C.muted, detail: `${snapshot.invoices.length} invoices in data` },
                { provider: "Lead Intake Hooks", state: snapshot.leads.length > 0 ? "connected" : "idle", color: snapshot.leads.length > 0 ? C.amber : C.muted, detail: `${snapshot.leads.length} leads in stream` }
              ].map((p) => (
                <div key={p.provider} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.provider}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{p.detail}</div>
                  </div>
                  <span style={{ fontSize: 10, color: p.color, background: `${p.color}15`, padding: "3px 8px", fontFamily: "DM Mono, monospace", textTransform: "uppercase" }}>{p.state}</span>
                </div>
              ))}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ownership Boundaries</div>
              {["Integrations: credential lifecycle and provider readiness.", "Workflows: orchestration triggers and simulation behavior.", "Notifications: queue processing, delivery, and retries.", "Access Control: role permissions and admin delegation."].map((line) => (
                <div key={line} style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.7 }}>• {line}</div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
