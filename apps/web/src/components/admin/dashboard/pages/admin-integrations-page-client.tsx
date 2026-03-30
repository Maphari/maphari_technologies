"use client";

import { useMemo, useState } from "react";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { createPublicApiKeyWithRefresh, type PartnerApiKey } from "../../../../lib/api/admin";
import type { DashboardToast } from "../../../shared/dashboard-core";
import type { AuthSession } from "../../../../lib/auth/session";
import { EmptyState, formatDate, toneClass } from "./admin-page-utils";
import { cx, styles } from "../style";
import { StatWidget, PipelineWidget, WidgetGrid } from "../widgets";

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

  const nowMs = Date.parse("2026-02-28T00:00:00.000Z");

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
    <div className={cx(styles.pageBody, styles.reportsRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>AUTOMATION / INTEGRATIONS</div>
          <h1 className={styles.pageTitle}>Integrations</h1>
          <div className={styles.pageSub}>API key lifecycle, provider posture, and integration readiness boundaries.</div>
        </div>
        <button type="button" onClick={() => void onRefreshKeys()} className={cx("btnSm", "btnGhost")}>Refresh Keys</button>
      </div>

      <WidgetGrid>
        <StatWidget label="Total Keys"          value={enrichedKeys.length}               sub="Active integration keys"         tone="accent" />
        <StatWidget label="High Rotation Risk"  value={highRiskKeys}                       sub="Older than 180 days"             tone={highRiskKeys > 0 ? "red" : "green"} />
        <StatWidget label="Client-Bound Keys"   value={clientBoundKeys}                    sub={`${globalKeys} global keys`}     tone="accent" />
        <StatWidget label="Last Key Issued"     value={newestKeyAt ? formatDate(newestKeyAt) : "N/A"} sub="Most recent credential event" tone="amber" />
      </WidgetGrid>

      <WidgetGrid columns={2}>
        <PipelineWidget
          label="Key Risk Distribution"
          stages={[
            { label: "Low Risk",    count: enrichedKeys.filter((k) => k.risk === "low").length,    total: enrichedKeys.length || 1, color: "#34d98b" },
            { label: "Medium Risk", count: enrichedKeys.filter((k) => k.risk === "medium").length, total: enrichedKeys.length || 1, color: "#f5a623" },
            { label: "High Risk",   count: enrichedKeys.filter((k) => k.risk === "high").length,   total: enrichedKeys.length || 1, color: "#ff5f5f" },
          ]}
        />
        <PipelineWidget
          label="Key Scope Breakdown"
          stages={[
            { label: "Client-Bound", count: clientBoundKeys, total: enrichedKeys.length || 1, color: "#8b6fff" },
            { label: "Global",       count: globalKeys,      total: enrichedKeys.length || 1, color: "#f5a623" },
          ]}
        />
      </WidgetGrid>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className={cx("overflowAuto", "minH0")}>
        {(activeTab === "keys inventory" || activeTab === "security posture") ? (
          <div className={cx("card", "p12", "mb12")}>
            <div className={cx("flexRow", "gap8", "flexWrap")}>
              <select title="Filter by client" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className={styles.formInput}>
                <option value="ALL">Client: All</option>
                {snapshot.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
              <input placeholder="Search label, client, key id" value={query} onChange={(e) => setQuery(e.target.value)} className={cx("formInput", styles.integrationsSearchInput)} />
            </div>
          </div>
        ) : null}

        {activeTab === "keys inventory" ? (
          <div className={cx("card", "overflowHidden")}>
            <div
              className={cx("fontMono", "text10", "colorMuted", "uppercase", "gap12", styles.integrationsKeyHead)}
            >
              {["Label", "Client", "Key ID", "Scope", "Age", "Risk"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {filteredKeys.length > 0 ? filteredKeys.map((key, idx) => (
              <div
                key={key.id}
                className={cx(styles.integrationsKeyRow, idx < filteredKeys.length - 1 && "borderB", key.risk === "high" && styles.integrationsRiskHighRow)}
              >
                <div>
                  <div className={cx("text12", "fw600")}>{key.label}</div>
                  <div className={cx("text10", "colorMuted")}>Created {formatDate(key.createdAt)}</div>
                </div>
                <span className={cx("text11")}>{snapshot.clients.find((c) => c.id === key.clientId)?.name ?? "Global"}</span>
                <span className={cx("fontMono", "text11", "colorMuted")}>{key.keyId.slice(0, 16)}...</span>
                <span
                  className={cx("fontMono", "text10", "uppercase", "wFit", styles.integrationsToneTag, toneClass(key.scope === "client-bound" ? "var(--blue)" : "var(--amber)"))}
                >
                  {key.scope === "client-bound" ? "Client" : "Global"}
                </span>
                <span className={cx("fontMono", "text11", "colorMuted")}>{key.ageDays}d</span>
                <span
                  className={cx("fontMono", "text10", "uppercase", "wFit", styles.integrationsToneTag, toneClass(key.risk === "high" ? "var(--red)" : key.risk === "medium" ? "var(--amber)" : "var(--accent)"))}
                >
                  {key.risk}
                </span>
              </div>
            )) : (
              <div className={cx("p20")}><EmptyState title="No API keys match current filters" subtitle="Broaden filters or issue a new key to populate this inventory." compact variant="security" /></div>
            )}
          </div>
        ) : null}

        {activeTab === "issue key" ? (
          <div className={cx("grid2", "gap16")}>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb14", "uppercase", "tracking")}>Issue API Key</div>
              <div className={cx("flexCol", "gap10")}>
                <select title="Select client for key" value={createClientId} onChange={(e) => setCreateClientId(e.target.value)} disabled={!canEdit} className={styles.formInput}>
                  <option value="">Select client (optional)</option>
                  {snapshot.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
                <input placeholder="Key label (e.g. Zapier Production)" value={createLabel} onChange={(e) => setCreateLabel(e.target.value)} disabled={!canEdit} className={styles.formInput} />
                {canEdit ? (
                  <button type="button" onClick={() => void handleIssueKey()} className={cx("btnSm", "btnAccent", "wFit")}>Issue Key</button>
                ) : (
                  <div className={cx("text12", "colorMuted")}>Read-only mode for this role.</div>
                )}
              </div>
            </div>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb10", "uppercase", "tracking")}>Issuance Guardrails</div>
              {["Scope keys to specific client integrations where possible.", "Rotate keys routinely and remove stale credentials.", "Do not expose secrets in query parameters or client bundles.", "Monitor unusual key usage and isolate by integration."].map((rule) => (
                <div key={rule} className={cx("text12", "colorMuted", "mb10", styles.integrationsLine17)}>{"\u2022"} {rule}</div>
              ))}
              <div className={cx("mt8", "bgBg", "borderDefault", "p12", "text11", "colorMuted", styles.integrationsLine16)}>Secrets are only shown at issuance time by providers in most flows. Store them in a secure vault and avoid sharing over chat/email.</div>
            </div>
          </div>
        ) : null}

        {activeTab === "security posture" ? (
          <div className={cx("grid2", "gap16")}>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12", "uppercase", "tracking")}>Rotation Watchlist</div>
              {filteredKeys.length > 0 ? filteredKeys.slice().sort((a, b) => b.ageDays - a.ageDays).slice(0, 8).map((key) => (
                <div key={key.id} className={cx("py10", "borderB")}>
                  <div className={cx("flexBetween", "mb3")}>
                    <span className={cx("text12")}>{key.label}</span>
                    <span className={cx("fontMono", "text10", styles.integrationsToneText, toneClass(key.risk === "high" ? "var(--red)" : key.risk === "medium" ? "var(--amber)" : "var(--accent)"))}>{key.ageDays}d</span>
                  </div>
                  <div className={cx("text10", "colorMuted")}>{snapshot.clients.find((c) => c.id === key.clientId)?.name ?? "Global"} · {key.risk.toUpperCase()} risk</div>
                </div>
              )) : <EmptyState title="No keys in scope" subtitle="Issue a key or clear filters to populate rotation watchlist." compact variant="security" />}
            </div>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12", "uppercase", "tracking")}>Posture Checks</div>
              {[
                { label: "Inventory tracked", value: `${enrichedKeys.length} keys`, color: "var(--accent)" },
                { label: "Keys older than 180 days", value: `${highRiskKeys}`, color: highRiskKeys > 0 ? "var(--red)" : "var(--accent)" },
                { label: "Client-bound key ratio", value: enrichedKeys.length > 0 ? `${Math.round((clientBoundKeys / enrichedKeys.length) * 100)}%` : "0%", color: "var(--blue)" },
                { label: "Global key ratio", value: enrichedKeys.length > 0 ? `${Math.round((globalKeys / enrichedKeys.length) * 100)}%` : "0%", color: "var(--amber)" }
              ].map((row) => (
                <div key={row.label} className={cx("flexBetween", "py10", "borderB", "text12")}>
                  <span className={cx("colorMuted")}>{row.label}</span>
                  <span className={cx("fontMono", "fw700", styles.integrationsToneText, toneClass(row.color))}>{row.value}</span>
                </div>
              ))}
              <div className={cx("mt12", "text11", "colorMuted", styles.integrationsLine17)}>Permission grants and role policies are handled in Access Control. This page tracks integration credential hygiene only.</div>
            </div>
          </div>
        ) : null}

        {activeTab === "provider map" ? (
          <div className={cx("grid2", "gap16")}>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12", "uppercase", "tracking")}>Provider Readiness</div>
              {[
                { provider: "Webhook Gateway", state: enrichedKeys.length > 0 ? "connected" : "idle", color: enrichedKeys.length > 0 ? "var(--accent)" : "var(--muted)", detail: `${enrichedKeys.length} credentials available` },
                { provider: "Partner API", state: enrichedKeys.length > 0 ? "connected" : "idle", color: enrichedKeys.length > 0 ? "var(--blue)" : "var(--muted)", detail: `${enrichedKeys.length} keys issued` },
                { provider: "Billing Sync", state: snapshot.invoices.length > 0 ? "connected" : "idle", color: snapshot.invoices.length > 0 ? "var(--accent)" : "var(--muted)", detail: `${snapshot.invoices.length} invoices in data` },
                { provider: "Lead Intake Hooks", state: snapshot.leads.length > 0 ? "connected" : "idle", color: snapshot.leads.length > 0 ? "var(--amber)" : "var(--muted)", detail: `${snapshot.leads.length} leads in stream` }
              ].map((p) => (
                <div key={p.provider} className={cx("flexBetween", "py10", "borderB")}>
                  <div>
                    <div className={cx("text12", "fw600")}>{p.provider}</div>
                    <div className={cx("text10", "colorMuted")}>{p.detail}</div>
                  </div>
                  <span
                    className={cx("fontMono", "text10", "uppercase", styles.integrationsToneTag, toneClass(p.color))}
                  >
                    {p.state}
                  </span>
                </div>
              ))}
            </div>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12", "uppercase", "tracking")}>Ownership Boundaries</div>
              {["Integrations: credential lifecycle and provider readiness.", "Workflows: orchestration triggers and simulation behavior.", "Notifications: queue processing, delivery, and retries.", "Access Control: role permissions and admin delegation."].map((line) => (
                <div key={line} className={cx("text12", "colorMuted", "mb10", styles.integrationsLine17)}>{"\u2022"} {line}</div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
