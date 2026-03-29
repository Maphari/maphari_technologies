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
import { EmptyState, colorClass as toneClass, formatDate, formatDateTime } from "./admin-page-utils";
import { cx, styles } from "../style";
import { StatWidget, PipelineWidget, WidgetGrid } from "../widgets";

function formatMoney(cents: number, currency: string): string {
  return formatMoneyCents(cents, { currency: currency === "AUTO" ? null : currency });
}

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
    <div className={cx(styles.pageBody, styles.reportsRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / REPORTS</div>
          <h1 className={styles.pageTitle}>Reports</h1>
          <div className={styles.pageSub}>Operational export center for handoff packs and audited CSV extracts.</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" onClick={() => void generateHandoffExport("markdown")} disabled={exportingHandoff} className={cx("btnSm", "btnGhost", exportingHandoff && "opacity70")}>
            {exportingHandoff ? "Generating..." : "Export Handoff MD"}
          </button>
          <button type="button" onClick={() => void generateHandoffExport("json")} disabled={exportingHandoff} className={cx("btnSm", "btnAccent", exportingHandoff && "opacity70")}>
            {exportingHandoff ? "Generating..." : "Export Handoff JSON"}
          </button>
        </div>
      </div>

      <WidgetGrid>
        <StatWidget label="Invoice Rows"     value={financeRows.length}  sub="Finance export coverage"   tone="accent" />
        <StatWidget label="Project Rows"     value={projectRows.length}  sub="Delivery export coverage"  tone="accent" />
        <StatWidget label="Handoff Exports"  value={handoffExports.length} sub="Generated package history" tone="amber" />
        <StatWidget label="Export Readiness" value={financeRows.length > 0 || projectRows.length > 0 ? "Ready" : "Limited"} sub="Based on live data" tone={financeRows.length > 0 || projectRows.length > 0 ? "green" : "red"} />
      </WidgetGrid>

      <WidgetGrid columns={2}>
        <PipelineWidget
          title="Pack Types Available"
          stages={[
            { label: "Finance",    count: reportPacks.filter((p) => p.type === "finance").length,    total: reportPacks.length || 1, color: "#8b6fff" },
            { label: "Delivery",   count: reportPacks.filter((p) => p.type === "delivery").length,   total: reportPacks.length || 1, color: "#34d98b" },
            { label: "Operations", count: reportPacks.filter((p) => p.type === "operations").length, total: reportPacks.length || 1, color: "#f5a623" },
          ]}
        />
        <PipelineWidget
          title="Data Availability"
          stages={[
            { label: "Invoices",  count: snapshot.invoices.length,  total: Math.max(snapshot.invoices.length, snapshot.projects.length) || 1, color: "#8b6fff" },
            { label: "Projects",  count: snapshot.projects.length,  total: Math.max(snapshot.invoices.length, snapshot.projects.length) || 1, color: "#34d98b" },
            { label: "Handoffs",  count: handoffExports.length,     total: Math.max(snapshot.invoices.length, snapshot.projects.length) || 1, color: "#f5a623" },
          ]}
        />
      </WidgetGrid>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(activeTab === "export center" || activeTab === "report packs") ? (
          <>
            <select title="Pack type filter" value={packFilter} onChange={(e) => setPackFilter(e.target.value as typeof packFilter)} className={styles.filterSelect}>
              <option value="all">Pack type: All</option>
              <option value="finance">Pack type: Finance</option>
              <option value="delivery">Pack type: Delivery</option>
              <option value="operations">Pack type: Operations</option>
            </select>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search report pack" className={cx(styles.formInput, styles.reportsSearchInput)} />
          </>
        ) : null}
      </div>

      <div className={cx("overflowAuto", "minH0")}>
        {activeTab === "export center" ? (
          <div className={cx("grid2", "gap16")}>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12", "uppercase", "tracking")}>Fast Exports</div>
              <div className={cx("flexRow", "gap8", "flexWrap", "mb10")}>
                <button type="button" onClick={() => exportCsv("maphari-finance-report.csv", [["Invoice", "Client", "Status", "Amount", "Due"], ...financeRows])} className={cx("btnSm", "btnGhost")}>Finance CSV ({financeRows.length})</button>
                <button type="button" onClick={() => exportCsv("maphari-delivery-report.csv", [["Project", "Client", "Status", "Progress", "Owner"], ...projectRows])} className={cx("btnSm", "btnGhost")}>Delivery CSV ({projectRows.length})</button>
                <button type="button" onClick={() => void generateHandoffExport("markdown")} disabled={exportingHandoff} className={cx("btnSm", "btnGhost", exportingHandoff && "opacity70")}>{exportingHandoff ? "Generating..." : "Handoff MD"}</button>
                <button type="button" onClick={() => void generateHandoffExport("json")} disabled={exportingHandoff} className={cx("btnSm", "btnAccent", exportingHandoff && "opacity70")}>{exportingHandoff ? "Generating..." : "Handoff JSON"}</button>
              </div>
              <div className={cx("text11", "colorMuted", styles.reportsLine17)}>Use this page to generate delivery artifacts. Avoid placing exploratory charts here to keep report operations fast and clear.</div>
            </div>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12", "uppercase", "tracking")}>Export Health Snapshot</div>
              {[
                { label: "Invoices available", value: `${snapshot.invoices.length}`, tone: "var(--blue)" },
                { label: "Projects available", value: `${snapshot.projects.length}`, tone: "var(--accent)" },
                { label: "Handoff history records", value: `${handoffExports.length}`, tone: "var(--amber)" },
                { label: "Latest handoff", value: handoffExports[0] ? formatDateTime(handoffExports[0].generatedAt) : "None yet", tone: "var(--muted)" }
              ].map((row) => (
                <div key={row.label} className={cx("flexBetween", "py10", "borderB", "text12")}>
                  <span className={cx("colorMuted")}>{row.label}</span>
                  <span className={cx("fontMono", "fw700", toneClass(row.tone))}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "handoff history" ? (
          <div className={cx("card", "overflowHidden", "p0")}>
            <div className={cx("reportsHandoffGrid", styles.reportsHandoffHead, "text10", "colorMuted", "uppercase", "tracking", "fontMono", "gap12")}>
              {["File", "Format", "Generated", "Summary", "Action"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {handoffExports.length > 0 ? (
              handoffExports.slice(0, 20).map((entry, idx) => (
                <div key={entry.id} className={cx("reportsHandoffGrid", styles.reportsHandoffRow, idx === Math.min(handoffExports.length, 20) - 1 && styles.reportsHandoffRowLast, "gap12")}>
                  <span className={cx("text12", "fw600")}>{entry.fileName}</span>
                  <span className={cx("badge", "badgePurple", "fontMono", "wFit")}>{entry.format.toUpperCase()}</span>
                  <span className={cx("text11", "colorMuted")}>{formatDate(entry.generatedAt)}</span>
                  <span className={cx("text11", "colorMuted")}>{entry.docs} docs · {entry.decisions} decisions · {entry.blockers} blockers</span>
                  <button type="button" onClick={() => void downloadHandoffExport(entry.id)} className={cx("btnSm", "btnGhost", "wFit")}>Download</button>
                </div>
              ))
            ) : (
              <div className={cx("p20")}><EmptyState title="No handoff exports yet" subtitle="Generate a handoff export from the export center." compact /></div>
            )}
          </div>
        ) : null}

        {activeTab === "report packs" ? (
          <div className={cx("grid2", "gap16")}>
            {filteredPacks.map((pack) => (
              <div key={pack.id} className={cx("card", "p20")}>
                <div className={cx("flexBetween", "mb8")}>
                  <span className={cx("text13", "fw700")}>{pack.name}</span>
                  <span className={cx("badge", pack.type === "finance" ? "badgeBlue" : pack.type === "delivery" ? "badgePurple" : "badgeAmber", "fontMono", "uppercase")}>{pack.type}</span>
                </div>
                <div className={cx("text12", "colorMuted", "mb10", styles.reportsLine17)}>{pack.description}</div>
                <div className={cx("text11", "colorMuted", "mb10")}>Rows/records: {pack.count}</div>
                <button type="button" onClick={pack.action} disabled={exportingHandoff && pack.type === "operations"} className={cx("btnSm", pack.type === "operations" ? "btnAccent" : "btnGhost")}>Generate</button>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "delivery settings" ? (
          <div className={cx("grid2", "gap16")}>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12", "uppercase", "tracking")}>Distribution Baseline</div>
              {[
                { label: "Finance report cadence", value: "Weekly (Monday 08:00)" },
                { label: "Delivery report cadence", value: "Weekly (Friday 15:00)" },
                { label: "Handoff format default", value: "JSON + Markdown" },
                { label: "Retention policy", value: "Last 25 exports retained" }
              ].map((setting) => (
                <div key={setting.label} className={cx("flexBetween", "py10", "borderB", "text12")}>
                  <span className={cx("colorMuted")}>{setting.label}</span>
                  <span className={cx("fw600")}>{setting.value}</span>
                </div>
              ))}
              <div className={cx("mt12", "text11", "colorMuted")}>Delivery scheduling is informational here; automation execution belongs in Workflows.</div>
            </div>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12", "uppercase", "tracking")}>Boundary Checklist</div>
              {["Reports: export packaging and shareable extracts", "Analytics: KPI exploration and performance visuals", "Workflows: automated orchestration and retries", "Integrations: credential lifecycle and provider connectivity"].map((item) => (
                <div key={item} className={cx("text12", "colorMuted", "mb10", styles.reportsLine17)}>{"\u2022"} {item}</div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
