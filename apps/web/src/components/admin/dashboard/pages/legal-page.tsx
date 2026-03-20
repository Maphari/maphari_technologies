"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchContracts, type LegalContract } from "../../../../lib/api/admin/contracts";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { colorClass } from "./admin-page-utils";

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

// ── Status/Risk badges ─────────────────────────────────────────────────────────

function statusBadgeClass(status: string): string {
  if (status === "active" || status === "compliant" || status === "resolved") return styles.lglStatusAccent;
  if (status === "expiring-soon" || status === "attention" || status === "open" || status === "pending") return styles.lglStatusAmber;
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
  const { session } = useAdminWorkspaceContext();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("contracts");
  const [contracts, setContracts] = useState<LegalContract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);

  const loadContracts = useCallback(async () => {
    if (!session) { setLoadingContracts(false); return; }
    setLoadingContracts(true);
    try {
      const result = await fetchContracts(session);
      if (result.data) setContracts(result.data);
    } finally {
      setLoadingContracts(false);
    }
  }, [session]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  // ── Derived counts ─────────────────────────────────────────────────────────
  const expiringCount = contracts.filter((c) => contractDisplayStatus(c) === "expiring-soon").length;
  const expiredCount  = contracts.filter((c) => contractDisplayStatus(c) === "expired").length;
  const activeCount   = contracts.filter((c) => contractDisplayStatus(c) === "active").length;
  const highRisk      = compliance.filter((c) => c.risk === "high").length;

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
          { label: "Active Contracts", value: String(activeCount), color: "var(--accent)", sub: "Total active contracts", alert: false },
          { label: "Expiring < 60 days", value: String(expiringCount), color: "var(--amber)", sub: "Renew immediately", alert: expiringCount > 0 },
          { label: "Expired (no renewal)", value: String(expiredCount), color: "var(--red)", sub: "Action required", alert: expiredCount > 0 },
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
