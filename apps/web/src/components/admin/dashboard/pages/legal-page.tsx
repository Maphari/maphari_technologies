"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { colorClass } from "./admin-page-utils";

const contracts = [
  { id: "CTR-001", client: "Volta Studios", type: "Retainer Agreement", signed: "2024-09-01", expires: "2026-09-01", status: "active", value: "R336,000", monthsLeft: 7 },
  { id: "CTR-002", client: "Kestrel Capital", type: "Project Contract", signed: "2025-11-15", expires: "2026-04-15", status: "expiring-soon", value: "R84,000", monthsLeft: 2 },
  { id: "CTR-003", client: "Mira Health", type: "Retainer Agreement", signed: "2025-07-01", expires: "2026-07-01", status: "active", value: "R258,000", monthsLeft: 5 },
  { id: "CTR-004", client: "Dune Collective", type: "Project Contract", signed: "2025-12-01", expires: "2026-06-01", status: "active", value: "R192,000", monthsLeft: 4 },
  { id: "CTR-005", client: "Okafor & Sons", type: "NDA + Retainer", signed: "2024-06-01", expires: "2026-03-01", status: "expiring-soon", value: "R144,000", monthsLeft: 1 },
  { id: "CTR-006", client: "Studio Outpost", type: "Contractor Agreement", signed: "2025-01-15", expires: "2026-01-15", status: "expired", value: "N/A", monthsLeft: 0 }
] as const;

const compliance = [
  { area: "POPIA Compliance", status: "compliant", lastReview: "Jan 2026", nextReview: "Jan 2027", risk: "low" },
  { area: "BBBEE Certification", status: "compliant", lastReview: "Oct 2025", nextReview: "Oct 2026", risk: "low" },
  { area: "CIPC Registration", status: "compliant", lastReview: "Mar 2025", nextReview: "Mar 2026", risk: "medium" },
  { area: "Employment Contracts", status: "attention", lastReview: "Aug 2025", nextReview: "Overdue", risk: "high" },
  { area: "Terms of Service", status: "compliant", lastReview: "Dec 2025", nextReview: "Dec 2026", risk: "low" },
  { area: "Privacy Policy", status: "attention", lastReview: "Sep 2025", nextReview: "Overdue", risk: "medium" }
] as const;

const dataRetention = [
  { category: "Client Contracts", retentionYears: 7, policy: "POPIA §14", records: 24, lastAudit: "Jan 2026" },
  { category: "Financial Records", retentionYears: 5, policy: "SARS Requirement", records: 412, lastAudit: "Jan 2026" },
  { category: "Employee Records", retentionYears: 10, policy: "Employment Act", records: 18, lastAudit: "Oct 2025" },
  { category: "Client Communications", retentionYears: 3, policy: "Internal Policy", records: 2840, lastAudit: "Nov 2025" },
  { category: "Project Files", retentionYears: 5, policy: "Client Agreements", records: 156, lastAudit: "Jan 2026" }
] as const;

const incidents = [
  { id: "INC-001", type: "Data Query", description: "Mira Health requested client data export", date: "2026-02-10", status: "resolved", severity: "low" },
  { id: "INC-002", type: "Contract Dispute", description: "Luma Events - payment dispute, settled at 80%", date: "2026-01-22", status: "resolved", severity: "medium" },
  { id: "INC-003", type: "IP Concern", description: "Usage rights query on Volta Studios deliverables", date: "2026-02-18", status: "open", severity: "medium" }
] as const;

function statusBadgeClass(status: string): string {
  if (status === "active" || status === "compliant" || status === "resolved") return styles.lglStatusAccent;
  if (status === "expiring-soon" || status === "attention" || status === "open") return styles.lglStatusAmber;
  if (status === "expired") return styles.lglStatusRed;
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
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("contracts");

  const expiringCount = contracts.filter((c) => c.status === "expiring-soon").length;
  const expiredCount = contracts.filter((c) => c.status === "expired").length;
  const highRisk = compliance.filter((c) => c.risk === "high").length;

  return (
    <div className={cx(styles.pageBody, styles.lglRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / COMPLIANCE & LEGAL</div>
          <h1 className={styles.pageTitle}>Legal Control Center</h1>
          <div className={styles.pageSub}>Contracts · Compliance · Data retention · Legal incidents</div>
        </div>
        <div className={styles.lglHeadActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Generate Report</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ New Contract</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Active Contracts", value: "5", color: "var(--accent)", sub: "Total value R1.01M", alert: false },
          { label: "Expiring < 60 days", value: String(expiringCount), color: "var(--amber)", sub: "Renew immediately", alert: true },
          { label: "Expired (no renewal)", value: String(expiredCount), color: "var(--red)", sub: "Action required", alert: true },
          { label: "Compliance Issues", value: String(highRisk), color: highRisk > 0 ? "var(--red)" : "var(--accent)", sub: highRisk > 0 ? "High-risk items" : "All clear", alert: highRisk > 0 }
        ].map((s) => (
          <div key={s.label} className={cx(styles.statCard, s.alert && (s.color === "var(--red)" ? styles.lglStatAlertRed : styles.lglStatAlertAmber))}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor={"var(--accent)"}
        mutedColor={"var(--muted)"}
        panelColor={"var(--surface)"}
        borderColor={"var(--border)"}
      />

      {activeTab === "contracts" ? (
        <div>
          <div className={styles.lglExpiryCard}>
            <div className={styles.lglSectionAmber}>Expiry Calendar - Next 12 Months</div>
            <div className={styles.lglTimelineWrap}>
              <div className={styles.lglTimelineLine} />
              {["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m, i) => {
                const contractsThisMonth = contracts.filter((c) => {
                  const month = new Date(c.expires).getMonth();
                  return month === i + 2;
                });
                return (
                  <div key={m} className={styles.lglTimelineCol}>
                    <div className={styles.lglTimelineMonth}>{m}</div>
                    <div className={cx(styles.lglTimelineDot, contractsThisMonth.length > 0 && styles.lglTimelineDotActive)} />
                    {contractsThisMonth.map((c) => (
                      <div key={c.id} className={styles.lglTimelineChip}>{c.client}</div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.lglTableCard}>
            <div className={styles.lglTableMin980}>
              <div className={cx(styles.lglContractHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                {["ID", "Client", "Type", "Signed", "Expires", "Value", "Status", ""].map((h) => <span key={h}>{h}</span>)}
              </div>
              {contracts.map((c, i) => (
                <div
                  key={c.id}
                  className={cx(
                    styles.lglContractRow,
                    i < contracts.length - 1 && "borderB",
                    c.status === "expired" && styles.lglContractRowExpired,
                    c.status === "expiring-soon" && styles.lglContractRowSoon
                  )}
                >
                  <span className={styles.lglMonoMuted}>{c.id}</span>
                  <span className={styles.lglCellStrong}>{c.client}</span>
                  <span className={styles.lglCellMuted}>{c.type}</span>
                  <span className={styles.lglMonoMuted}>{c.signed}</span>
                  <div>
                    <div className={cx(styles.lglMono12, c.monthsLeft <= 2 ? "colorRed" : "colorMuted")}>{c.expires}</div>
                    {c.monthsLeft > 0 ? <div className={styles.lglCellMuted}>{c.monthsLeft}mo left</div> : null}
                  </div>
                  <span className={styles.lglValue}>{c.value}</span>
                  <StatusBadge status={c.status} />
                  <div className={styles.lglActionRow}>
                    <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
                    {c.status !== "active" ? (
                      <button type="button" className={cx(styles.lglRenewBtn, c.status === "expired" ? "colorRed" : "colorAmber")}>
                        Renew
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "compliance" ? (
        <div className={styles.lglComplianceSplit}>
          <div className={styles.lglTableCard}>
            <div className={cx(styles.lglComplianceHead, "fontMono", "text10", "colorMuted", "uppercase")}>
              {["Area", "Status", "Last Review", "Risk", "Next Review"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {compliance.map((c, i) => (
              <div key={c.area} className={cx(styles.lglComplianceRow, i < compliance.length - 1 && "borderB", c.status === "attention" && styles.lglWarnRow)}>
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
                {compliance.filter((c) => c.status === "attention").map((c) => (
                  <div key={c.area} className={styles.lglActionItem}>
                    <div className={styles.lglCellStrong}>{c.area}</div>
                    <div className={styles.lglCellMuted}>Review overdue · {c.risk} risk</div>
                    <button type="button" className={styles.lglScheduleBtn}>Schedule Review</button>
                  </div>
                ))}
              </div>
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.lglSectionTitle}>Overall Compliance Score</div>
              <div className={styles.lglScore}>78/100</div>
              <div className={styles.progressBar}>
                <div className={cx(styles.barFill, styles.lglScoreFill)} />
              </div>
              <div className={cx("text12", "colorMuted", "mt8")}>2 items require attention to reach 90+ score</div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "data retention" ? (
        <div className={cx("flexCol", "gap16")}>
          <div className={styles.lglInfoCard}>
            <div className={styles.lglInfoTitle}>POPIA Data Retention Policy</div>
            <div className={styles.lglInfoText}>All personal data must only be retained for as long as necessary for the original purpose of collection, as required by POPIA §14. Scheduled deletions run automatically on the 1st of each month.</div>
          </div>
          <div className={styles.lglTableCard}>
            <div className={styles.lglTableMin900}>
              <div className={cx(styles.lglDataHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                {["Data Category", "Retain (yrs)", "Policy Basis", "Records", "Last Audit", "Action"].map((h) => <span key={h}>{h}</span>)}
              </div>
              {dataRetention.map((d, i) => (
                <div key={d.category} className={cx(styles.lglDataRow, i < dataRetention.length - 1 && "borderB")}>
                  <span className={styles.lglCellStrong}>{d.category}</span>
                  <span className={styles.lglRetain}>{d.retentionYears}y</span>
                  <span className={styles.lglCellMuted}>{d.policy}</span>
                  <span className={styles.lglRecords}>{d.records}</span>
                  <span className={styles.lglMonoMuted}>{d.lastAudit}</span>
                  <button type="button" className={cx("btnSm", "btnGhost")}>Audit Now</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "legal incidents" ? (
        <div className={cx("flexCol", "gap12")}>
          <div className={styles.lglIncidentHead}>
            <button type="button" className={styles.lglLogBtn}>+ Log New Incident</button>
          </div>
          {incidents.map((inc) => (
            <div key={inc.id} className={cx(styles.lglIncidentCard, inc.status === "open" && styles.lglIncidentOpen)}>
              <div className={styles.lglIncidentGrid}>
                <span className={styles.lglMonoMuted}>{inc.id}</span>
                <div>
                  <div className={styles.lglLabel}>Type</div>
                  <div className={styles.lglCellStrong}>{inc.type}</div>
                </div>
                <div>
                  <div className={styles.lglLabel}>Description</div>
                  <div className={styles.text13}>{inc.description}</div>
                </div>
                <div>
                  <div className={styles.lglLabel}>Date</div>
                  <div className={styles.lglMono12}>{inc.date}</div>
                </div>
                <StatusBadge status={inc.status} />
                <div className={styles.lglActionRow}>
                  <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
                  {inc.status === "open" ? <button type="button" className={styles.lglResolveBtn}>Resolve</button> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
