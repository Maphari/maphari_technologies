// ════════════════════════════════════════════════════════════════════════════
// employment-records-page.tsx — Admin Employment Records
// Data     : loadAllStaffWithRefresh → GET /staff
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";
import { StatWidget, PipelineWidget, WidgetGrid } from "../widgets";
import { AdminTabs } from "./shared";
import type { AuthSession } from "../../../../lib/auth/session";
import { loadAllStaffWithRefresh, type AdminStaffProfile } from "../../../../lib/api/admin";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────
type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  color: string;
  contractType: string;
  startDate: string;
  salary: number;
  lastReview: string | null;
  nextReview: string | null;
  bankAccount: string;
  taxNumber: string;
  address: string;
  idNumber: string;
  emergencyContact: string;
  documents: string[];
  probation: string | null;
  leaveBalance: number;
  performanceScore: number | null;
  notes: string | null;
};

const reqDocs = ["Contract", "ID Copy", "Tax Certificate"] as const;
const tabs = ["all records", "record detail", "compliance", "org chart"] as const;
type Tab = (typeof tabs)[number];

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseMonthYear(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value} 1`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mapStaffToEmployee(s: AdminStaffProfile): Employee {
  const initials = s.avatarInitials ?? s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const color = s.avatarColor ?? "var(--accent)";
  const salary = s.grossSalaryCents !== null ? Math.round(s.grossSalaryCents / 100) : 0;
  const startDate = s.hireDate
    ? new Date(s.hireDate).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })
    : "—";
  return {
    id: s.id.slice(0, 8).toUpperCase(),
    name: s.name,
    role: s.role,
    department: s.department ?? "—",
    avatar: initials,
    color,
    contractType: s.contractType ?? "Permanent",
    startDate,
    salary,
    lastReview: null,
    nextReview: null,
    bankAccount: "—",
    taxNumber: "—",
    address: "—",
    idNumber: "—",
    emergencyContact: "—",
    documents: ["Contract"],
    probation: null,
    leaveBalance: 0,
    performanceScore: null,
    notes: null,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size === 24 ? "emprAvatar24" : size === 28 ? "emprAvatar28" : size === 30 ? "emprAvatar30" : size === 56 ? "emprAvatar56" : "emprAvatar40";
  const tc = colorClass(color).replace("color", "tone");
  return (
    <div className={cx(styles.emprAvatar, sizeClass, tc)}>
      {initials}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function EmploymentRecordsPage({ session }: { session: AuthSession | null }) {
  const [activeTab, setActiveTab] = useState<Tab>("all records");
  const [apiStaff, setApiStaff] = useState<AdminStaffProfile[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);

  useEffect(() => {
    if (!session) return;
    loadAllStaffWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        setApiStaff(r.data);
        if (r.data.length > 0) setSelected(mapStaffToEmployee(r.data[0]));
      }
    });
  }, [session]);

  const employees = useMemo<Employee[]>(() => apiStaff.map(mapStaffToEmployee), [apiStaff]);

  const overdueReviews = useMemo(() => {
    const cutoff = new Date("2026-03-01");
    return employees.filter((e) => {
      const next = parseMonthYear(e.nextReview);
      const last = parseMonthYear(e.lastReview);
      if (!next || next >= cutoff) return false;
      if (!last) return true;
      return last < new Date("2026-01-01");
    });
  }, [employees]);

  const missingDocs = useMemo(
    () => employees.filter((e) => !reqDocs.every((d) => e.documents.includes(d))),
    [employees]
  );
  const workPermits = useMemo(
    () => employees.filter((e) => e.documents.includes("Work Permit")),
    [employees]
  );

  return (
    <div className={cx(styles.pageBody, styles.emprRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>COMMUNICATION / EMPLOYMENT RECORDS</div>
          <h1 className={styles.pageTitle}>Employment Records</h1>
          <div className={styles.pageSub}>Contracts, personal details, performance, and documents</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Add Employee</button>
        </div>
      </div>

      <WidgetGrid>
        <StatWidget label="Total Employees"   value={employees.length}        sub="All active staff"               tone="accent" />
        <StatWidget label="Reviews Overdue"   value={overdueReviews.length}   sub="Annual reviews past due"        tone={overdueReviews.length > 0 ? "red" : "green"} />
        <StatWidget label="Missing Documents" value={missingDocs.length}      sub="Incomplete compliance files"    tone={missingDocs.length > 0 ? "amber" : "green"} />
        <StatWidget label="Work Permits"      value={workPermits.length}      sub="Foreign nationals on staff"     tone="accent" />
      </WidgetGrid>

      <WidgetGrid columns={1}>
        <PipelineWidget
          title="Contract Type Breakdown"
          stages={[
            { label: "Permanent",  count: employees.filter((e) => e.contractType === "Permanent").length,  total: employees.length || 1, color: "#34d98b" },
            { label: "Contract",   count: employees.filter((e) => e.contractType === "Contract").length,   total: employees.length || 1, color: "#8b6fff" },
            { label: "Part-time",  count: employees.filter((e) => e.contractType === "Part-time").length,  total: employees.length || 1, color: "#f5a623" },
            { label: "Other",      count: employees.filter((e) => !["Permanent","Contract","Part-time"].includes(e.contractType)).length, total: employees.length || 1, color: "#8b6fff" },
          ]}
        />
      </WidgetGrid>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor="var(--accent)"
        mutedColor="var(--muted)"
        panelColor="var(--surface)"
        borderColor="var(--border)"
      />

      <div className={cx("overflowAuto", "minH0")}>
        {activeTab === "all records" ? (
          <div className={styles.emprTableCard}>
            <div className={cx(styles.emprTableHead, "fontMono", "text10", "colorMuted", "uppercase")}>
              {"Employee|Role|Contract|Start Date|Salary|Next Review|Docs|".split("|").map((h, idx) => <span key={`${h}-${idx}`}>{h}</span>)}
            </div>
            {employees.length === 0 ? (
              <div className={cx("colorMuted", "text13", "py24", "textCenter")}>No staff records found.</div>
            ) : null}
            {employees.map((emp, i) => {
              const missingAny = !reqDocs.every((d) => emp.documents.includes(d));
              const reviewAlert = !emp.lastReview;
              return (
                <div key={emp.id} className={cx(styles.emprTableRow, i < employees.length - 1 && "borderB", reviewAlert && styles.emprReviewWarn)}>
                  <div className={styles.emprEmpCell}>
                    <Avatar initials={emp.avatar} color={emp.color} size={30} />
                    <div>
                      <div className={styles.emprEmpName}>{emp.name}</div>
                      <div className={styles.emprEmpId}>{emp.id}</div>
                    </div>
                  </div>
                  <span className={cx("text12", "colorMuted")}>{emp.role}</span>
                  <span className={styles.emprContract}>{emp.contractType}</span>
                  <span className={styles.emprMonoMuted}>{emp.startDate}</span>
                  <span className={styles.emprSalary}>{emp.salary > 0 ? `R${(emp.salary / 1000).toFixed(0)}k` : "—"}</span>
                  <span className={cx(styles.emprMono12, reviewAlert ? "colorRed" : "colorMuted")}>{emp.nextReview || "—"}</span>
                  <span className={cx(styles.emprDocStatus, missingAny ? "colorRed" : "colorAccent")}>{missingAny ? "!" : "OK"}</span>
                  <button type="button" onClick={() => { setSelected(emp); setActiveTab("record detail"); }} className={cx("btnSm", "btnAccent")}>View</button>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "record detail" && selected ? (
          <div className={styles.emprDetailSplit}>
            <div className={styles.emprSideList}>
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(emp)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(emp);
                    }
                  }}
                  className={cx(styles.emprSideItem, selected.id === emp.id && styles.emprSideItemActive, selected.id === emp.id && toneClass(emp.color))}
                >
                  <Avatar initials={emp.avatar} color={emp.color} size={28} />
                  <div>
                    <div className={cx(styles.emprSideName, selected.id === emp.id && styles.emprSideNameActive)}>{emp.name.split(" ")[0]}</div>
                    <div className={styles.emprSideRole}>{emp.role.split(" ").slice(0, 2).join(" ")}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={cx(styles.emprDetailCard, styles.emprDetailCardTone, toneClass(selected.color))}>
              <div className={styles.emprProfileHead}>
                <Avatar initials={selected.avatar} color={selected.color} size={56} />
                <div>
                  <div className={styles.emprProfileName}>{selected.name}</div>
                  <div className={cx(styles.emprProfileRole, colorClass(selected.color))}>{selected.role} - {selected.department}</div>
                  <div className={styles.emprProfileMeta}>{selected.id} - {selected.contractType} - Since {selected.startDate}</div>
                </div>
              </div>

              <div className={styles.emprFieldsGrid}>
                <div>
                  <div className={styles.emprSectionTitle}>Employment Details</div>
                  {[
                    { label: "Salary", value: selected.salary > 0 ? `R${selected.salary.toLocaleString()}/month` : "—", color: "var(--accent)" },
                    { label: "Bank Account", value: selected.bankAccount },
                    { label: "Tax Number", value: selected.taxNumber },
                    { label: "Last Review", value: selected.lastReview || "—", color: !selected.lastReview ? "var(--muted)" : "var(--text)" },
                    { label: "Next Review", value: selected.nextReview || "—", color: "var(--text)" },
                    { label: "Performance Score", value: selected.performanceScore ? `${selected.performanceScore}/5` : "Not yet rated", color: selected.performanceScore ? (selected.performanceScore >= 4 ? "var(--accent)" : selected.performanceScore >= 3 ? "var(--amber)" : "var(--red)") : "var(--muted)" }
                  ].map((f) => (
                    <div key={f.label} className={styles.emprFieldRow}>
                      <span className={styles.colorMuted}>{f.label}</span>
                      <span className={cx(styles.emprFieldValue, colorClass(f.color || "var(--text)"))}>{f.value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className={styles.emprSectionTitle}>Personal Details</div>
                  {[
                    { label: "ID Number", value: selected.idNumber },
                    { label: "Address", value: selected.address },
                    { label: "Emergency Contact", value: selected.emergencyContact },
                    { label: "Leave Balance", value: `${selected.leaveBalance} days AL remaining`, color: selected.leaveBalance <= 3 ? "var(--red)" : "var(--text)" }
                  ].map((f) => (
                    <div key={f.label} className={styles.emprFieldBlock}>
                      <div className={styles.emprBlockLabel}>{f.label}</div>
                      <div className={cx(styles.emprBlockValue, colorClass(f.color || "var(--text)"))}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.emprDocsSec}>
                <div className={styles.emprSectionTitle}>Documents on File</div>
                <div className={styles.emprDocChips}>
                  {selected.documents.map((doc) => (
                    <span key={doc} className={styles.emprDocOk}>OK {doc}</span>
                  ))}
                  {reqDocs.filter((d) => !selected.documents.includes(d)).map((doc) => (
                    <span key={doc} className={styles.emprDocMissing}>Missing {doc}</span>
                  ))}
                </div>
              </div>

              {selected.notes ? (
                <div className={styles.emprNotesBox}>
                  <div className={styles.emprNotesTitle}>Admin Notes</div>
                  <div className={styles.emprNotesText}>{selected.notes}</div>
                </div>
              ) : null}

              <div className={styles.emprBtnRow}>
                <button type="button" className={cx("btnSm", "btnAccent")}>Edit Record</button>
                <button type="button" className={cx("btnSm", "btnGhost")}>Upload Document</button>
                <button type="button" className={cx("btnSm", "btnGhost")}>Schedule Review</button>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "compliance" ? (
          <div className={styles.emprComplianceGrid}>
            <div className={styles.emprPanelCard}>
              <div className={styles.emprSectionTitle}>Document Compliance</div>
              {employees.map((emp) => {
                const hasAll = reqDocs.every((d) => emp.documents.includes(d));
                const missing = reqDocs.filter((d) => !emp.documents.includes(d));
                return (
                  <div key={emp.id} className={styles.emprComplianceRow}>
                    <div className={styles.emprComplianceLeft}>
                      <Avatar initials={emp.avatar} color={emp.color} size={24} />
                      <span className={styles.text13}>{emp.name.split(" ")[0]}</span>
                    </div>
                    {hasAll ? <span className={styles.emprCompliant}>Complete</span> : <span className={styles.emprNonCompliant}>Missing: {missing.join(", ")}</span>}
                  </div>
                );
              })}
            </div>

            <div className={styles.emprPanelCard}>
              <div className={styles.emprSectionTitle}>Review Schedule</div>
              {employees.map((emp) => (
                <div key={emp.id} className={styles.emprComplianceRow}>
                  <div className={styles.emprComplianceLeft}>
                    <Avatar initials={emp.avatar} color={emp.color} size={24} />
                    <span className={styles.text13}>{emp.name.split(" ")[0]}</span>
                  </div>
                  <div className={styles.emprReviewRight}>
                    <div className={cx(styles.emprMono12, !emp.lastReview ? "colorRed" : "colorMuted")}>Next: {emp.nextReview || "—"}</div>
                    {!emp.lastReview ? <div className={styles.emprNeverReviewed}>Never reviewed</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "org chart" ? (
          <div className={styles.emprOrgCard}>
            {employees.length === 0 ? (
              <div className={cx("colorMuted", "text13", "py24", "textCenter")}>No staff records found.</div>
            ) : (
              <div className={styles.emprOrgWrap}>
                <div className={styles.emprCeoCard}>
                  <div className={styles.emprMono10Accent}>{employees[0]?.id ?? "—"}</div>
                  <div className={styles.emprCeoName}>{employees[0]?.name ?? "—"}</div>
                  <div className={styles.emprCeoRole}>{employees[0]?.role ?? "—"}</div>
                </div>
                <div className={styles.emprOrgLine} />
                <div className={styles.emprLeadsRow}>
                  {employees.slice(1, 3).map((emp) => (
                    <div key={emp.id} className={styles.emprLeadCol}>
                      <div className={styles.emprMiniLine} />
                      <div className={cx(styles.emprLeadCard, styles.emprLeadCardTone, toneClass(emp.color))}>
                        <div className={cx(styles.emprLeadId, colorClass(emp.color))}>{emp.id}</div>
                        <div className={styles.emprLeadName}>{emp.name.split(" ")[0]}</div>
                        <div className={cx(styles.emprLeadRole, colorClass(emp.color))}>{emp.role}</div>
                      </div>
                      <div className={styles.emprMiniLine} />
                      <div className={styles.emprReportsRow}>
                        {employees.slice(3).filter((_, idx) => idx % 2 === (employees.indexOf(emp) % 2 === 1 ? 0 : 1)).map((report) => (
                          <div key={report.id} className={cx(styles.emprReportCard, styles.emprReportCardTone, toneClass(report.color))}>
                            <div className={styles.emprReportName}>{report.name.split(" ")[0]}</div>
                            <div className={cx(styles.emprReportRole, colorClass(report.color))}>{report.role.split(" ").slice(0, 2).join(" ")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
