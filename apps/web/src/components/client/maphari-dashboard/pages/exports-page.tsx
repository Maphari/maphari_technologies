"use client";

import { useState } from "react";
import { cx, styles } from "../style";

/* ── Types ──────────────────────────────────────────────────────────────── */

type ExportFormat = "PDF" | "CSV" | "XLSX";

type ExportHistoryItem = {
  id: string;
  name: string;
  type: string;
  format: ExportFormat;
  generatedAt: string;
  size: string;
};

type ExportsTab = "Reports" | "Invoices" | "Summaries";

/* ── Seed data ──────────────────────────────────────────────────────────── */

const EXPORT_HISTORY: ExportHistoryItem[] = [
  {
    id: "exp-1",
    name: "Financial Report Q4 2025",
    type: "Financial",
    format: "PDF",
    generatedAt: "Feb 18, 2026",
    size: "2.4 MB",
  },
  {
    id: "exp-2",
    name: "Client Portal v2 Summary",
    type: "Project",
    format: "PDF",
    generatedAt: "Feb 15, 2026",
    size: "1.8 MB",
  },
  {
    id: "exp-3",
    name: "Activity Log Jan 2026",
    type: "Activity",
    format: "CSV",
    generatedAt: "Feb 10, 2026",
    size: "456 KB",
  },
  {
    id: "exp-4",
    name: "Invoice Bundle — Jan 2026",
    type: "Invoice",
    format: "PDF",
    generatedAt: "Feb 05, 2026",
    size: "3.2 MB",
  },
  {
    id: "exp-5",
    name: "Lead Pipeline Metrics",
    type: "Project",
    format: "XLSX",
    generatedAt: "Jan 28, 2026",
    size: "892 KB",
  },
  {
    id: "exp-6",
    name: "Automation Suite Summary",
    type: "Project",
    format: "PDF",
    generatedAt: "Jan 22, 2026",
    size: "1.1 MB",
  },
  {
    id: "exp-7",
    name: "Financial Report Q3 2025",
    type: "Financial",
    format: "XLSX",
    generatedAt: "Jan 15, 2026",
    size: "1.6 MB",
  },
  {
    id: "exp-8",
    name: "Activity Log Dec 2025",
    type: "Activity",
    format: "CSV",
    generatedAt: "Jan 05, 2026",
    size: "380 KB",
  },
];

const PROJECTS = [
  "Client Portal v2",
  "Lead Pipeline Rebuild",
  "Automation Suite",
] as const;

const FORMAT_BADGE_CLASS: Record<ExportFormat, string> = {
  PDF: "formatBadgePDF",
  CSV: "formatBadgeCSV",
  XLSX: "formatBadgeXLSX",
};

/* ── Component ──────────────────────────────────────────────────────────── */

export function ClientExportsPage({ active }: { active: boolean }) {
  const [activeTab, setActiveTab] = useState<ExportsTab>("Reports");
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);

  /* Reports tab state */
  const [financialFrom, setFinancialFrom] = useState("2025-10-01");
  const [financialTo, setFinancialTo] = useState("2025-12-31");
  const [financialFormat, setFinancialFormat] = useState<ExportFormat>("PDF");
  const [projectSummaryProject, setProjectSummaryProject] = useState<string>(PROJECTS[0]);
  const [projectSummaryFormat, setProjectSummaryFormat] = useState<ExportFormat>("PDF");
  const [activityFrom, setActivityFrom] = useState("2026-01-01");
  const [activityTo, setActivityTo] = useState("2026-01-31");
  const [activityFormat, setActivityFormat] = useState<ExportFormat>("CSV");

  /* Invoices tab state */
  const [invoiceFrom, setInvoiceFrom] = useState("2026-01-01");
  const [invoiceTo, setInvoiceTo] = useState("2026-02-27");
  const [invoiceFormat, setInvoiceFormat] = useState<ExportFormat>("PDF");
  const [history] = useState<ExportHistoryItem[]>(EXPORT_HISTORY);

  /* Summaries tab state */
  const [summaryProject, setSummaryProject] = useState<string>(PROJECTS[0]);
  const [summaryFormat, setSummaryFormat] = useState<ExportFormat>("PDF");

  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3200);
  };

  const tabs: ExportsTab[] = ["Reports", "Invoices", "Summaries"];

  const formatChips = (
    selected: ExportFormat,
    onSelect: (f: ExportFormat) => void
  ) => (
    <div className={styles.formChipGrid3}>
      {(["PDF", "CSV", "XLSX"] as ExportFormat[]).map((f) => (
        <button
          key={f}
          type="button"
          className={cx("formChipBtn", selected === f && "formChipBtnSelected")}
          onClick={() => onSelect(f)}
        >
          {f}
        </button>
      ))}
    </div>
  );

  return (
    <section className={cx("page", active && "pageActive")} id="page-exports">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Account</div>
          <div className={styles.pageTitle}>Export Center</div>
          <div className={styles.pageSub}>
            Download reports, invoice bundles, and project summaries in your preferred format.
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={cx("badge", "badgeMuted")}>
            {history.length} exports generated
          </span>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className={styles.filterBar} style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={cx("filterTab", activeTab === tab && "filterTabActive")}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Reports tab ──────────────────────────────────────── */}
      {activeTab === "Reports" ? (
        <div className={styles.pageBody}>
          {/* Financial Report */}
          <div
            className={styles.exportOptionCard}
            style={{ "--i": 0 } as React.CSSProperties}
          >
            <div className={styles.exportOptionTitle}>Financial Report</div>
            <div className={styles.exportOptionDesc}>
              Generate a comprehensive financial overview including invoices, payments, and outstanding balances for a selected date range.
            </div>
            <div className={styles.exportFormRow}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>From</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={financialFrom}
                  onChange={(e) => setFinancialFrom(e.target.value)}
                />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>To</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={financialTo}
                  onChange={(e) => setFinancialTo(e.target.value)}
                />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>Format</label>
                {formatChips(financialFormat, setFinancialFormat)}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className={cx("button", "buttonAccent")}
                onClick={() => showToast("Report generated", `Financial Report (${financialFormat}) is ready for download`)}
              >
                Generate Report
              </button>
            </div>
          </div>

          {/* Project Summary */}
          <div
            className={styles.exportOptionCard}
            style={{ "--i": 1 } as React.CSSProperties}
          >
            <div className={styles.exportOptionTitle}>Project Summary</div>
            <div className={styles.exportOptionDesc}>
              Export a detailed summary of a specific project including milestones, deliverables, and timeline progress.
            </div>
            <div className={styles.exportFormRow}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>Project</label>
                <select
                  className={styles.formSelect}
                  value={projectSummaryProject}
                  onChange={(e) => setProjectSummaryProject(e.target.value)}
                >
                  {PROJECTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>Format</label>
                {formatChips(projectSummaryFormat, setProjectSummaryFormat)}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className={cx("button", "buttonAccent")}
                onClick={() => showToast("Report generated", `${projectSummaryProject} summary (${projectSummaryFormat}) is ready`)}
              >
                Generate Summary
              </button>
            </div>
          </div>

          {/* Activity Report */}
          <div
            className={styles.exportOptionCard}
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <div className={styles.exportOptionTitle}>Activity Report</div>
            <div className={styles.exportOptionDesc}>
              Download a log of all project activity, messages, and milestone updates within a specific period.
            </div>
            <div className={styles.exportFormRow}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>From</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={activityFrom}
                  onChange={(e) => setActivityFrom(e.target.value)}
                />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>To</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={activityTo}
                  onChange={(e) => setActivityTo(e.target.value)}
                />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>Format</label>
                {formatChips(activityFormat, setActivityFormat)}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className={cx("button", "buttonAccent")}
                onClick={() => showToast("Report generated", `Activity Report (${activityFormat}) is ready for download`)}
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Invoices tab ─────────────────────────────────────── */}
      {activeTab === "Invoices" ? (
        <div className={styles.pageBody}>
          {/* Filters */}
          <div className={styles.card} style={{ marginBottom: 20, padding: "20px 24px" }}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Invoice Export</div>
                <div className={styles.cardSub}>
                  Select a date range and format to download all invoices for the period.
                </div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.exportFormRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>From</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={invoiceFrom}
                    onChange={(e) => setInvoiceFrom(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>To</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={invoiceTo}
                    onChange={(e) => setInvoiceTo(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Format</label>
                  {formatChips(invoiceFormat, setInvoiceFormat)}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button"
                  className={cx("button", "buttonAccent")}
                  onClick={() => showToast("Download started", `Invoice bundle (${invoiceFormat}) is being prepared`)}
                >
                  Download All Invoices
                </button>
              </div>
            </div>
          </div>

          {/* Download history */}
          <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>
            Download History
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Format</th>
                  <th>Generated</th>
                  <th>Size</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.tableName}>{item.name}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>
                        {item.type}
                      </span>
                    </td>
                    <td>
                      <span className={cx("formatBadge", FORMAT_BADGE_CLASS[item.format])}>
                        {item.format}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontFamily: "var(--font-dm-mono)" }}>
                        {item.generatedAt}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontFamily: "var(--font-dm-mono)" }}>
                        {item.size}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.downloadLink}
                        onClick={() => showToast("Downloading", `${item.name} (${item.size})`)}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* ── Summaries tab ────────────────────────────────────── */}
      {activeTab === "Summaries" ? (
        <div className={styles.pageBody}>
          {/* Project selector */}
          <div className={styles.card} style={{ marginBottom: 20, padding: "20px 24px" }}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Project Summary Generator</div>
                <div className={styles.cardSub}>
                  Select a project to preview key metrics and generate a downloadable summary report.
                </div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Project</label>
                <select
                  className={styles.formSelect}
                  value={summaryProject}
                  onChange={(e) => setSummaryProject(e.target.value)}
                >
                  {PROJECTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preview card */}
          <div
            className={styles.exportOptionCard}
            style={{ "--i": 0 } as React.CSSProperties}
          >
            <div className={styles.exportOptionTitle}>Summary Preview</div>
            <div className={styles.exportOptionDesc}>
              Review the key details before generating the full report.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              {[
                { label: "Project", value: summaryProject },
                { label: "Period", value: "Jan 2026 \u2013 Feb 2026" },
                {
                  label: "Milestones",
                  value:
                    summaryProject === "Client Portal v2"
                      ? "8 / 12 completed"
                      : summaryProject === "Lead Pipeline Rebuild"
                      ? "5 / 9 completed"
                      : "3 / 6 completed",
                },
                {
                  label: "Progress",
                  value:
                    summaryProject === "Client Portal v2"
                      ? "72%"
                      : summaryProject === "Lead Pipeline Rebuild"
                      ? "58%"
                      : "45%",
                },
                {
                  label: "Budget Used",
                  value:
                    summaryProject === "Client Portal v2"
                      ? "R 186,000 / R 250,000"
                      : summaryProject === "Lead Pipeline Rebuild"
                      ? "R 92,000 / R 140,000"
                      : "R 48,000 / R 95,000",
                },
                {
                  label: "Team Size",
                  value:
                    summaryProject === "Client Portal v2"
                      ? "6 members"
                      : summaryProject === "Lead Pipeline Rebuild"
                      ? "4 members"
                      : "3 members",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "12px 14px",
                    background: "var(--s2)",
                    border: "1px solid var(--b1)",
                    borderRadius: "var(--r-sm)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.58rem",
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 4,
                      fontFamily: "var(--font-dm-mono)",
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>Export Format</label>
                {formatChips(summaryFormat, setSummaryFormat)}
              </div>
              <button
                type="button"
                className={cx("button", "buttonAccent")}
                onClick={() =>
                  showToast(
                    "Summary generated",
                    `${summaryProject} summary (${summaryFormat}) is ready for download`
                  )
                }
              >
                Generate Summary
              </button>
            </div>
          </div>

          {/* Recent summaries */}
          <div className={styles.sectionTitle} style={{ marginTop: 24, marginBottom: 14 }}>
            Recent Summaries
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history
              .filter((h) => h.type === "Project")
              .map((item, i) => (
                <div
                  key={item.id}
                  className={styles.downloadHistoryRow}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "var(--muted)", fontFamily: "var(--font-dm-mono)" }}>
                      {item.generatedAt}
                    </div>
                  </div>
                  <span className={cx("formatBadge", FORMAT_BADGE_CLASS[item.format])}>
                    {item.format}
                  </span>
                  <span style={{ fontSize: "0.64rem", color: "var(--muted)", fontFamily: "var(--font-dm-mono)", minWidth: 60, textAlign: "right" }}>
                    {item.size}
                  </span>
                  <button
                    type="button"
                    className={styles.downloadLink}
                    onClick={() => showToast("Downloading", `${item.name} (${item.size})`)}
                  >
                    Download
                  </button>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      {/* ── Toast ────────────────────────────────────────────── */}
      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            background: "var(--surface)",
            border: "1px solid var(--accent)",
            padding: "14px 20px",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "slideUp var(--dur-normal, 250ms) var(--ease-out, cubic-bezier(0.23,1,0.32,1))",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              background: "var(--accent)",
              color: "var(--on-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 700,
              flexShrink: 0,
              borderRadius: "50%",
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
