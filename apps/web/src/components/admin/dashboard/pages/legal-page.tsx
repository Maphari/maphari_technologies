"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchContracts, type LegalContract } from "../../../../lib/api/admin/contracts";
import {
  loadAdminComplianceWithRefresh,
  loadAdminDataRetentionWithRefresh,
  type ComplianceRecord,
  type DataRetentionPolicy,
} from "../../../../lib/api/admin/governance";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import { AdminTabs } from "./shared";
import { colorClass } from "./admin-page-utils";

// ── Display helpers ────────────────────────────────────────────────────────────

/** Map DB status (PENDING | SIGNED | VOID) to display status */
function contractDisplayStatus(c: LegalContract): string {
  if (c.status === "SIGNED" || c.signed) return "active";
  if (c.status === "VOID") return "expired";
  return "pending";
}

function contractSignedDate(c: LegalContract): string {
  if (!c.signedAt) return "—";
  return new Date(c.signedAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}

// ── Compliance mappers ─────────────────────────────────────────────────────────

interface ComplianceRow {
  id:         string;
  area:       string;
  status:     string;
  lastReview: string;
  risk:       "low" | "medium" | "high";
  nextReview: string;
}

function formatAuditDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}

function mapComplianceStatus(status: string): string {
  if (status === "COMPLIANT")     return "compliant";
  if (status === "AT_RISK")       return "attention";
  if (status === "NON_COMPLIANT") return "attention";
  return "attention";
}

function mapRiskLevel(level: string): "low" | "medium" | "high" {
  if (level === "HIGH")   return "high";
  if (level === "MEDIUM") return "medium";
  return "low";
}

function mapComplianceRow(c: ComplianceRecord): ComplianceRow {
  const now         = Date.now();
  const nextAuditMs = new Date(c.nextAudit).getTime();
  const nextReview  = nextAuditMs < now ? "Overdue" : formatAuditDate(c.nextAudit);
  return {
    id:         c.id,
    area:       c.area,
    status:     mapComplianceStatus(c.status),
    lastReview: formatAuditDate(c.lastAudit),
    risk:       mapRiskLevel(c.riskLevel),
    nextReview,
  };
}

// ── Data retention mappers ─────────────────────────────────────────────────────

interface DataRetentionRow {
  id:             string;
  category:       string;
  retentionYears: number;
  status:         string;
  lastAudit:      string;
}

function mapDataRetentionRow(d: DataRetentionPolicy): DataRetentionRow {
  return {
    id:             d.id,
    category:       d.dataType,
    retentionYears: d.retainYears,
    status:         d.status,
    lastAudit:      d.lastPurge ? formatAuditDate(d.lastPurge) : "—",
  };
}

// ── Status/Risk badges ─────────────────────────────────────────────────────────

function statusBadgeClass(status: string): string {
  if (status === "active" || status === "compliant" || status === "resolved" || status === "CURRENT") return styles.lglStatusAccent;
  if (status === "expiring-soon" || status === "attention" || status === "open" || status === "pending" || status === "DUE") return styles.lglStatusAmber;
  if (status === "expired" || status === "OVERDUE") return styles.lglStatusRed;
  return styles.lglStatusMuted;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cx(styles.lglStatusBadge, statusBadgeClass(status))}>
      {status.replace(/-/g, " ")}
    </span>
  );
}

function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  return (
    <span className={cx(styles.lglRiskBadge, risk === "high" ? "colorRed" : risk === "medium" ? "colorAmber" : "colorAccent")}>
      {risk === "high" ? "!" : risk === "medium" ? "△" : "✓"} {risk.toUpperCase()}
    </span>
  );
}

const tabs = ["contracts", "compliance", "data retention", "legal incidents"] as const;

export function LegalPage() {
  const { session } = useAdminWorkspaceContext();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("contracts");

  // ── Contracts state ─────────────────────────────────────────────────────────
  const [contracts, setContracts] = useState<LegalContract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Compliance state ────────────────────────────────────────────────────────
  const [complianceRows, setComplianceRows] = useState<ComplianceRow[]>([]);
  const [loadingCompliance, setLoadingCompliance] = useState(true);
  const [complianceError, setComplianceError] = useState<string | null>(null);

  // ── Data retention state ────────────────────────────────────────────────────
  const [dataRetentionRows, setDataRetentionRows] = useState<DataRetentionRow[]>([]);
  const [loadingDataRetention, setLoadingDataRetention] = useState(true);
  const [dataRetentionError, setDataRetentionError] = useState<string | null>(null);

  const loadContracts = useCallback(async () => {
    if (!session) { setLoadingContracts(false); return; }
    setLoadingContracts(true);
    setError(null);
    try {
      const result = await fetchContracts(session);
      if (result.data) setContracts(result.data);
    } catch (err) {
      const msg = (err as Error)?.message ?? "Failed to load legal data";
      setError(msg);
    } finally {
      setLoadingContracts(false);
    }
  }, [session]);

  const loadCompliance = useCallback(async () => {
    if (!session) { setLoadingCompliance(false); return; }
    setLoadingCompliance(true);
    setComplianceError(null);
    try {
      const result = await loadAdminComplianceWithRefresh(session);
      if (result.data) setComplianceRows(result.data.map(mapComplianceRow));
      else if (result.error) setComplianceError(result.error.message ?? "Failed to load compliance data");
    } catch (err) {
      setComplianceError((err as Error)?.message ?? "Failed to load compliance data");
    } finally {
      setLoadingCompliance(false);
    }
  }, [session]);

  const loadDataRetention = useCallback(async () => {
    if (!session) { setLoadingDataRetention(false); return; }
    setLoadingDataRetention(true);
    setDataRetentionError(null);
    try {
      const result = await loadAdminDataRetentionWithRefresh(session);
      if (result.data) setDataRetentionRows(result.data.map(mapDataRetentionRow));
      else if (result.error) setDataRetentionError(result.error.message ?? "Failed to load data retention policies");
    } catch (err) {
      setDataRetentionError((err as Error)?.message ?? "Failed to load data retention policies");
    } finally {
      setLoadingDataRetention(false);
    }
  }, [session]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  useEffect(() => {
    void loadCompliance();
  }, [loadCompliance]);

  useEffect(() => {
    void loadDataRetention();
  }, [loadDataRetention]);

  // ── Derived counts ─────────────────────────────────────────────────────────
  const expiringCount = contracts.filter((c) => contractDisplayStatus(c) === "expiring-soon").length;
  const expiredCount  = contracts.filter((c) => contractDisplayStatus(c) === "expired").length;
  const activeCount   = contracts.filter((c) => contractDisplayStatus(c) === "active").length;
  const highRisk      = complianceRows.filter((c) => c.risk === "high").length;

  if (loadingContracts) {
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
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  // Build chart data: contracts by type
  const contractTypeCounts: Record<string, number> = {};
  for (const c of contracts) {
    const t = c.type ?? "Other";
    contractTypeCounts[t] = (contractTypeCounts[t] ?? 0) + 1;
  }
  const contractsByType = Object.entries(contractTypeCounts).map(([type, count]) => ({ type, count }));

  return (
    <div className={cx(styles.pageBody, styles.lglRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / LEGAL CONTROL CENTER</div>
          <h1 className={styles.pageTitle}>Legal Control Center</h1>
          <div className={styles.pageSub}>Contracts · Compliance · Data retention · Legal incidents</div>
        </div>
        <div className={styles.lglHeadActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Generate Report</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ New Contract</button>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <WidgetGrid columns={4}>
        <StatWidget label="Active Contracts" value={String(activeCount)} tone="accent" sub="Total active" />
        <StatWidget label="Expiring Soon" value={String(expiringCount)} tone={expiringCount > 0 ? "amber" : "accent"} sub="< 60 days" subTone={expiringCount > 0 ? "amber" : undefined} />
        <StatWidget label="NDAs" value={String(contracts.filter((c) => c.type === "NDA").length)} />
        <StatWidget label="Disputes" value={String(highRisk)} tone={highRisk > 0 ? "red" : "accent"} sub={highRisk > 0 ? "High-risk compliance" : "All clear"} subTone={highRisk > 0 ? "red" : undefined} />
      </WidgetGrid>

      {/* ── Charts & Pipeline ───────────────────────────────────────────── */}
      <WidgetGrid columns={2}>
        <ChartWidget
          label="Contracts by Type"
          data={contractsByType}
          dataKey="count"
          xKey="type"
          type="bar"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Contract Status"
          stages={[
            { label: "Active", count: activeCount, total: Math.max(contracts.length, 1), color: "#34d98b" },
            { label: "Expiring Soon", count: expiringCount, total: Math.max(contracts.length, 1), color: "#f5a623" },
            { label: "Expired", count: expiredCount, total: Math.max(contracts.length, 1), color: "#ff5f5f" },
            { label: "Pending", count: contracts.filter((c) => contractDisplayStatus(c) === "pending").length, total: Math.max(contracts.length, 1), color: "#8b6fff" },
          ]}
        />
      </WidgetGrid>

      {/* ── Contracts Table ──────────────────────────────────────────────── */}
      <TableWidget
        label="Contracts"
        rows={contracts}
        rowKey="id"
        emptyMessage="No contracts found."
        columns={[
          { key: "name", header: "Name / Type", render: (_, row) => (
            <span><span style={{ fontWeight: 600 }}>{row.title}</span> <span style={{ opacity: 0.6, fontSize: "11px" }}>{row.type}</span></span>
          )},
          { key: "party", header: "Client / Party", render: (_, row) => row.clientId.slice(0, 8) + "…" },
          { key: "value", header: "Value", render: () => "—" },
          { key: "expiry", header: "Signed", render: (_, row) => contractSignedDate(row) },
          { key: "status", header: "Status", render: (_, row) => (
            <StatusBadge status={contractDisplayStatus(row)} />
          )},
        ]}
      />

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor={"var(--accent)"}
        mutedColor={"var(--muted)"}
        panelColor={"var(--surface)"}
        borderColor={"var(--border)"}
      />

      {/* ── Contracts Tab ───────────────────────────────────────────────────── */}
      {activeTab === "contracts" ? (
        <div>
          <div className={styles.lglExpiryCard}>
            <div className={styles.lglSectionAmber}>Expiry Calendar - Next 12 Months</div>
            <div className={styles.lglTimelineWrap}>
              <div className={styles.lglTimelineLine} />
              {["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m) => (
                <div key={m} className={styles.lglTimelineCol}>
                  <div className={styles.lglTimelineMonth}>{m}</div>
                  <div className={styles.lglTimelineDot} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.lglTableCard}>
            <div className={styles.lglTableMin980}>
              <div className={cx(styles.lglContractHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                {["ID", "Title", "Type", "Signed", "Client", "Status", "Notes", ""].map((h) => <span key={h}>{h}</span>)}
              </div>

              {loadingContracts && (
                <div className={cx("text12", "colorMuted", "p16")}>Loading contracts…</div>
              )}

              {!loadingContracts && contracts.length === 0 && (
                <div className={cx("text12", "colorMuted", "p16")}>No contracts found.</div>
              )}

              {!loadingContracts && contracts.map((c, i) => {
                const displayStatus = contractDisplayStatus(c);
                return (
                  <div
                    key={c.id}
                    className={cx(
                      styles.lglContractRow,
                      i < contracts.length - 1 && "borderB",
                      displayStatus === "expired" && styles.lglContractRowExpired,
                      displayStatus === "expiring-soon" && styles.lglContractRowSoon
                    )}
                  >
                    <span className={styles.lglMonoMuted}>{c.id.slice(0, 8)}</span>
                    <span className={styles.lglCellStrong}>{c.title}</span>
                    <span className={styles.lglCellMuted}>{c.type}</span>
                    <span className={styles.lglMonoMuted}>{contractSignedDate(c)}</span>
                    <span className={styles.lglCellMuted}>{c.clientId.slice(0, 8)}…</span>
                    <StatusBadge status={displayStatus} />
                    <span className={styles.lglCellMuted}>{c.notes ?? "—"}</span>
                    <div className={styles.lglActionRow}>
                      <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
                      {displayStatus === "expired" ? (
                        <button type="button" className={cx(styles.lglRenewBtn, "colorRed")}>Renew</button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Compliance Tab ──────────────────────────────────────────────────── */}
      {activeTab === "compliance" ? (
        <div className={styles.lglComplianceSplit}>
          <div className={styles.lglTableCard}>
            <div className={cx(styles.lglComplianceHead, "fontMono", "text10", "colorMuted", "uppercase")}>
              {["Area", "Status", "Last Review", "Risk", "Next Review"].map((h) => <span key={h}>{h}</span>)}
            </div>

            {loadingCompliance && (
              <div className={cx("text12", "colorMuted", "p16")}>Loading compliance data…</div>
            )}

            {!loadingCompliance && complianceError && (
              <div className={cx("text12", "colorMuted", "p16")}>{complianceError}</div>
            )}

            {!loadingCompliance && !complianceError && complianceRows.length === 0 && (
              <div className={cx("text12", "colorMuted", "p16")}>No compliance records found.</div>
            )}

            {!loadingCompliance && !complianceError && complianceRows.map((c, i) => (
              <div key={c.id} className={cx(styles.lglComplianceRow, i < complianceRows.length - 1 && "borderB", c.status === "attention" && styles.lglWarnRow)}>
                <span className={styles.lglCellStrong}>{c.area}</span>
                <StatusBadge status={c.status} />
                <span className={styles.lglMonoMuted}>{c.lastReview}</span>
                <RiskBadge risk={c.risk} />
                <span className={cx(styles.lglMono12, c.nextReview === "Overdue" ? "colorRed" : "colorMuted")}>{c.nextReview}</span>
              </div>
            ))}
          </div>
          <div className={cx("flexCol", "gap16")}>
            <div className={styles.lglAlertCard}>
              <div className={styles.lglAlertTitle}>Requires Action</div>
              <div className={styles.lglActionList}>
                {complianceRows.filter((c) => c.status === "attention").map((c) => (
                  <div key={c.id} className={styles.lglActionItem}>
                    <div className={styles.lglCellStrong}>{c.area}</div>
                    <div className={styles.lglCellMuted}>Review overdue · {c.risk} risk</div>
                    <button type="button" className={styles.lglScheduleBtn}>Schedule Review</button>
                  </div>
                ))}
                {!loadingCompliance && complianceRows.filter((c) => c.status === "attention").length === 0 && (
                  <div className={cx("text12", "colorMuted")}>No items require action.</div>
                )}
              </div>
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.lglSectionTitle}>Overall Compliance Score</div>
              <div className={styles.lglScore}>
                {complianceRows.length === 0
                  ? "—"
                  : `${Math.round((complianceRows.filter((c) => c.status === "compliant").length / complianceRows.length) * 100)}/100`}
              </div>
              <div className={styles.progressBar}>
                <div className={cx(styles.barFill, styles.lglScoreFill)} />
              </div>
              <div className={cx("text12", "colorMuted", "mt8")}>
                {complianceRows.filter((c) => c.status === "attention").length} item{complianceRows.filter((c) => c.status === "attention").length !== 1 ? "s" : ""} require attention
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Data Retention Tab ──────────────────────────────────────────────── */}
      {activeTab === "data retention" ? (
        <div className={cx("flexCol", "gap16")}>
          <div className={styles.lglInfoCard}>
            <div className={styles.lglInfoTitle}>POPIA Data Retention Policy</div>
            <div className={styles.lglInfoText}>All personal data must only be retained for as long as necessary for the original purpose of collection, as required by POPIA §14. Scheduled deletions run automatically on the 1st of each month.</div>
          </div>
          <div className={styles.lglTableCard}>
            <div className={styles.lglTableMin900}>
              <div className={cx(styles.lglDataHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                {["Data Category", "Retain (yrs)", "Status", "Last Purge", "Action"].map((h) => <span key={h}>{h}</span>)}
              </div>

              {loadingDataRetention && (
                <div className={cx("text12", "colorMuted", "p16")}>Loading data retention policies…</div>
              )}

              {!loadingDataRetention && dataRetentionError && (
                <div className={cx("text12", "colorMuted", "p16")}>{dataRetentionError}</div>
              )}

              {!loadingDataRetention && !dataRetentionError && dataRetentionRows.length === 0 && (
                <div className={cx("text12", "colorMuted", "p16")}>No data retention policies found.</div>
              )}

              {!loadingDataRetention && !dataRetentionError && dataRetentionRows.map((d, i) => (
                <div key={d.id} className={cx(styles.lglDataRow, i < dataRetentionRows.length - 1 && "borderB")}>
                  <span className={styles.lglCellStrong}>{d.category}</span>
                  <span className={styles.lglRetain}>{d.retentionYears}y</span>
                  <StatusBadge status={d.status} />
                  <span className={styles.lglMonoMuted}>{d.lastAudit}</span>
                  <button type="button" className={cx("btnSm", "btnGhost")}>Audit Now</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Legal Incidents Tab ─────────────────────────────────────────────── */}
      {activeTab === "legal incidents" ? (
        <div className={cx("flexCol", "gap12")}>
          <div className={styles.lglIncidentHead}>
            <button type="button" className={styles.lglLogBtn}>+ Log New Incident</button>
          </div>
          <div className={cx(styles.card, styles.cardInner, "textCenter")}>
            <div className={cx("text13", "mb4")}>No legal incidents recorded</div>
            <div className={cx("text12", "colorMuted")}>All systems compliant. Log incidents above when they occur.</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
