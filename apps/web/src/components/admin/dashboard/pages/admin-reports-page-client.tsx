"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { useCurrencyConverter } from "../../../../lib/i18n/exchange-rates";
import { formatMoneyCents } from "../../../../lib/i18n/currency";
import {
  createProjectHandoffExportWithRefresh,
  downloadProjectHandoffExportWithRefresh,
  loadProjectHandoffExportsWithRefresh,
  type ProjectHandoffExportRecord
} from "../../../../lib/api/admin";
import type { DashboardToast } from "../../../shared/dashboard-core";
import { EmptyState, formatDate, formatDateTime } from "./admin-page-utils";

function formatMoney(cents: number, currency: string): string {
  return formatMoneyCents(cents, { currency: currency === "AUTO" ? null : currency });
}

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

export function AdminReportsPageClient({
  onNotify,
  currency
}: {
  onNotify: (tone: DashboardToast["tone"], message: string) => void;
  currency: string;
}) {
  const { snapshot, session } = useAdminWorkspaceContext();
  const { convert: convertMoney } = useCurrencyConverter(currency);

  const tabs = ["export center", "handoff history", "report packs", "delivery settings"] as const;
  type Tab = (typeof tabs)[number];

  const [handoffExports, setHandoffExports] = useState<ProjectHandoffExportRecord[]>([]);
  const [exportingHandoff, setExportingHandoff] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("export center");
  const [packFilter, setPackFilter] = useState<"all" | "finance" | "delivery" | "operations">("all");
  const [query, setQuery] = useState("");

  function exportCsv(filename: string, rows: string[][]): void {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = rows.map((row) => row.map((cell) => escape(cell)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  const financeRows = snapshot.invoices.map((invoice) => {
    const clientName = snapshot.clients.find((c) => c.id === invoice.clientId)?.name ?? "Unknown";
    return [
      invoice.number,
      clientName,
      invoice.status,
      formatMoney(convertMoney(invoice.amountCents, invoice.currency), currency),
      invoice.dueAt ? formatDate(invoice.dueAt) : "N/A"
    ];
  });

  const projectRows = snapshot.projects.map((project) => {
    const clientName = snapshot.clients.find((c) => c.id === project.clientId)?.name ?? "Unknown";
    return [project.name, clientName, project.status, `${project.progressPercent}%`, project.ownerName ?? "Unassigned"];
  });

  const reportPacks = useMemo(
    () => [
      {
        id: "finance-pack",
        name: "Finance Pack",
        type: "finance" as const,
        description: "Invoice status, payable totals, and due-date visibility for finance handoff.",
        count: financeRows.length,
        action: () => exportCsv("maphari-finance-report.csv", [["Invoice", "Client", "Status", "Amount", "Due"], ...financeRows])
      },
      {
        id: "delivery-pack",
        name: "Delivery Pack",
        type: "delivery" as const,
        description: "Project status, progress, and owner allocation for delivery operations.",
        count: projectRows.length,
        action: () => exportCsv("maphari-delivery-report.csv", [["Project", "Client", "Status", "Progress", "Owner"], ...projectRows])
      },
      {
        id: "handoff-markdown",
        name: "Handoff Pack (Markdown)",
        type: "operations" as const,
        description: "Structured handoff summary for onboarding/support transitions.",
        count: handoffExports.length,
        action: () => void generateHandoffExport("markdown")
      },
      {
        id: "handoff-json",
        name: "Handoff Pack (JSON)",
        type: "operations" as const,
        description: "Machine-readable export for integrations and automation pipelines.",
        count: handoffExports.length,
        action: () => void generateHandoffExport("json")
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [financeRows.length, handoffExports.length, projectRows.length]
  );

  const filteredPacks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reportPacks.filter((pack) => {
      if (packFilter !== "all" && pack.type !== packFilter) return false;
      if (!q) return true;
      return pack.name.toLowerCase().includes(q) || pack.description.toLowerCase().includes(q);
    });
  }, [packFilter, query, reportPacks]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const result = await loadProjectHandoffExportsWithRefresh(session);
      if (cancelled) return;
      if (result.data) setHandoffExports(result.data);
    })();
    return () => { cancelled = true; };
  }, [session]);

  async function generateHandoffExport(format: "json" | "markdown"): Promise<void> {
    if (!session || exportingHandoff) return;
    setExportingHandoff(true);
    const result = await createProjectHandoffExportWithRefresh(session, { format });
    setExportingHandoff(false);
    if (!result.data) {
      onNotify("error", result.error?.message ?? "Unable to generate handoff export.");
      return;
    }
    const download = await downloadProjectHandoffExportWithRefresh(session, result.data.record.id);
    if (download.data?.downloadUrl) {
      const anchor = document.createElement("a");
      anchor.href = download.data.downloadUrl;
      anchor.download = download.data.fileName;
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
    setHandoffExports((prev) => [result.data!.record, ...prev.filter((e) => e.id !== result.data!.record.id)].slice(0, 25));
    onNotify("success", `Handoff export ready: ${result.data.record.fileName}`);
  }

  async function downloadHandoffExport(exportId: string): Promise<void> {
    if (!session) return;
    const result = await downloadProjectHandoffExportWithRefresh(session, exportId);
    if (!result.data) {
      onNotify("error", result.error?.message ?? "Unable to download handoff export.");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = result.data.downloadUrl;
    anchor.download = result.data.fileName;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  return (
    <div style={{ background: C.bg, height: "100%", color: C.text, fontFamily: "Syne, sans-serif", padding: 0, overflow: "hidden", display: "grid", gridTemplateRows: "auto auto auto 1fr", minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>GOVERNANCE / REPORTING</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Reports</h1>
          <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>Operational export center for handoff packs and audited CSV extracts.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => void generateHandoffExport("markdown")} disabled={exportingHandoff} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: exportingHandoff ? "not-allowed" : "pointer", opacity: exportingHandoff ? 0.7 : 1 }}>
            {exportingHandoff ? "Generating..." : "Export Handoff MD"}
          </button>
          <button type="button" onClick={() => void generateHandoffExport("json")} disabled={exportingHandoff} style={{ background: C.primary, border: "none", color: C.bg, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: exportingHandoff ? "not-allowed" : "pointer", opacity: exportingHandoff ? 0.7 : 1 }}>
            {exportingHandoff ? "Generating..." : "Export Handoff JSON"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Invoice Rows", value: `${financeRows.length}`, color: C.blue, sub: "Finance export coverage" },
          { label: "Project Rows", value: `${projectRows.length}`, color: C.primary, sub: "Delivery export coverage" },
          { label: "Handoff Exports", value: `${handoffExports.length}`, color: C.amber, sub: "Generated package history" },
          { label: "Export Readiness", value: financeRows.length > 0 || projectRows.length > 0 ? "Ready" : "Limited", color: financeRows.length > 0 || projectRows.length > 0 ? C.primary : C.red, sub: "Based on live data availability" }
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
          <div style={{ fontSize: 11, color: C.muted }}>
            Analytics visual exploration remains in <span style={{ color: C.primary }}>Analytics</span>; this page is export and distribution focused.
          </div>
        </div>
      </div>

      <div style={{ overflow: "auto", minHeight: 0 }}>
        {(activeTab === "export center" || activeTab === "report packs") ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select value={packFilter} onChange={(e) => setPackFilter(e.target.value as typeof packFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                <option value="all">Pack type: All</option>
                <option value="finance">Pack type: Finance</option>
                <option value="delivery">Pack type: Delivery</option>
                <option value="operations">Pack type: Operations</option>
              </select>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search report pack" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, minWidth: 220 }} />
              {(packFilter !== "all" || query.trim()) ? (
                <button onClick={() => { setPackFilter("all"); setQuery(""); }} style={{ background: C.border, border: "none", color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Clear</button>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "export center" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fast Exports</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <button type="button" onClick={() => exportCsv("maphari-finance-report.csv", [["Invoice", "Client", "Status", "Amount", "Due"], ...financeRows])} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>Finance CSV ({financeRows.length})</button>
                <button type="button" onClick={() => exportCsv("maphari-delivery-report.csv", [["Project", "Client", "Status", "Progress", "Owner"], ...projectRows])} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>Delivery CSV ({projectRows.length})</button>
                <button type="button" onClick={() => void generateHandoffExport("markdown")} disabled={exportingHandoff} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: exportingHandoff ? "not-allowed" : "pointer", opacity: exportingHandoff ? 0.7 : 1 }}>{exportingHandoff ? "Generating..." : "Handoff MD"}</button>
                <button type="button" onClick={() => void generateHandoffExport("json")} disabled={exportingHandoff} style={{ background: C.primary, border: "none", color: C.bg, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: exportingHandoff ? "not-allowed" : "pointer", opacity: exportingHandoff ? 0.7 : 1 }}>{exportingHandoff ? "Generating..." : "Handoff JSON"}</button>
              </div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>Use this page to generate delivery artifacts. Avoid placing exploratory charts here to keep report operations fast and clear.</div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Export Health Snapshot</div>
              {[
                { label: "Invoices available", value: `${snapshot.invoices.length}`, tone: C.blue },
                { label: "Projects available", value: `${snapshot.projects.length}`, tone: C.primary },
                { label: "Handoff history records", value: `${handoffExports.length}`, tone: C.amber },
                { label: "Latest handoff", value: handoffExports[0] ? formatDateTime(handoffExports[0].generatedAt) : "None yet", tone: C.muted }
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                  <span style={{ color: C.muted }}>{row.label}</span>
                  <span style={{ color: row.tone, fontFamily: "DM Mono, monospace", fontWeight: 700 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "handoff history" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 120px 150px 1fr 100px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "DM Mono, monospace", gap: 12 }}>
              {["File", "Format", "Generated", "Summary", "Action"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {handoffExports.length > 0 ? (
              handoffExports.slice(0, 20).map((entry, idx) => (
                <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 120px 150px 1fr 100px", padding: "13px 20px", borderBottom: idx < Math.min(handoffExports.length, 20) - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{entry.fileName}</span>
                  <span style={{ fontSize: 10, color: C.primary, background: `${C.primary}15`, padding: "3px 8px", fontFamily: "DM Mono, monospace", width: "fit-content" }}>{entry.format.toUpperCase()}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{formatDate(entry.generatedAt)}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{entry.docs} docs · {entry.decisions} decisions · {entry.blockers} blockers</span>
                  <button type="button" onClick={() => void downloadHandoffExport(entry.id)} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer", width: "fit-content" }}>Download</button>
                </div>
              ))
            ) : (
              <div style={{ padding: 20 }}><EmptyState title="No handoff exports yet" subtitle="Generate a handoff export from the export center." compact /></div>
            )}
          </div>
        ) : null}

        {activeTab === "report packs" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {filteredPacks.map((pack) => (
              <div key={pack.id} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{pack.name}</span>
                  <span style={{ fontSize: 10, color: pack.type === "finance" ? C.blue : pack.type === "delivery" ? C.primary : C.amber, background: `${pack.type === "finance" ? C.blue : pack.type === "delivery" ? C.primary : C.amber}15`, padding: "3px 8px", fontFamily: "DM Mono, monospace", textTransform: "uppercase" }}>{pack.type}</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 10 }}>{pack.description}</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Rows/records: {pack.count}</div>
                <button type="button" onClick={pack.action} disabled={exportingHandoff && pack.type === "operations"} style={{ background: pack.type === "operations" ? C.primary : C.surface, border: pack.type === "operations" ? "none" : `1px solid ${C.border}`, color: pack.type === "operations" ? C.bg : C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer", fontWeight: pack.type === "operations" ? 700 : 500 }}>Generate</button>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "delivery settings" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Distribution Baseline</div>
              {[
                { label: "Finance report cadence", value: "Weekly (Monday 08:00)" },
                { label: "Delivery report cadence", value: "Weekly (Friday 15:00)" },
                { label: "Handoff format default", value: "JSON + Markdown" },
                { label: "Retention policy", value: "Last 25 exports retained" }
              ].map((setting) => (
                <div key={setting.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                  <span style={{ color: C.muted }}>{setting.label}</span>
                  <span style={{ color: C.text, fontWeight: 600 }}>{setting.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, fontSize: 11, color: C.muted }}>Delivery scheduling is informational here; automation execution belongs in Workflows.</div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Boundary Checklist</div>
              {["Reports: export packaging and shareable extracts", "Analytics: KPI exploration and performance visuals", "Workflows: automated orchestration and retries", "Integrations: credential lifecycle and provider connectivity"].map((item) => (
                <div key={item} style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.7 }}>• {item}</div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
