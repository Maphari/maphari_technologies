"use client";

import { useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";
import { AdminTabs } from "./shared";

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

const employees: Employee[] = [
  {
    id: "EMP-001", name: "Sipho Nkosi", role: "Founder & CEO", department: "Leadership",
    avatar: "SN", color: "var(--accent)", contractType: "Director", startDate: "Jan 2020",
    salary: 60000, lastReview: "Aug 2025", nextReview: "Aug 2026",
    bankAccount: "FNB ****7823", taxNumber: "TRF-****-8821",
    address: "14 Jacaranda Ave, Pretoria, 0001", idNumber: "82****4083",
    emergencyContact: "Thandi Nkosi - +27 83 400 1122",
    documents: ["Contract", "ID Copy", "Tax Certificate", "Equity Certificate"],
    probation: null, leaveBalance: 13, performanceScore: null,
    notes: "Founding member. CCMA representative. Company shareholder."
  },
  {
    id: "EMP-002", name: "Leilani Fotu", role: "Head of Operations", department: "Operations",
    avatar: "LF", color: "var(--blue)", contractType: "Permanent", startDate: "Mar 2022",
    salary: 44000, lastReview: "Sep 2025", nextReview: "Sep 2026",
    bankAccount: "Standard Bank ****4412", taxNumber: "TRF-****-3314",
    address: "8 Baobab St, Centurion, 0157", idNumber: "91****7021",
    emergencyContact: "Pita Fotu - +27 72 908 3301",
    documents: ["Contract", "ID Copy", "Tax Certificate", "Qualifications"],
    probation: null, leaveBalance: 2, performanceScore: 4.2,
    notes: null
  },
  {
    id: "EMP-003", name: "Renzo Fabbri", role: "Creative Director", department: "Creative",
    avatar: "RF", color: "var(--amber)", contractType: "Permanent", startDate: "Jun 2021",
    salary: 52000, lastReview: "Oct 2025", nextReview: "Oct 2026",
    bankAccount: "Nedbank ****9934", taxNumber: "TRF-****-7741",
    address: "22 Via Roma, Hatfield, 0083", idNumber: "88****5519",
    emergencyContact: "Sofia Fabbri - +27 74 217 8890",
    documents: ["Contract", "ID Copy", "Work Permit", "Tax Certificate"],
    probation: null, leaveBalance: 3, performanceScore: 4.6,
    notes: "Italian passport. Work permit valid until Dec 2027."
  },
  {
    id: "EMP-004", name: "Nomsa Dlamini", role: "Account Manager", department: "Client Services",
    avatar: "ND", color: "var(--accent)", contractType: "Permanent", startDate: "Feb 2023",
    salary: 38000, lastReview: "Feb 2026", nextReview: "Feb 2027",
    bankAccount: "Capitec ****2281", taxNumber: "TRF-****-9912",
    address: "5 Msasa Rd, Sunnyside, 0132", idNumber: "94****0887",
    emergencyContact: "Bongi Dlamini - +27 81 553 4421",
    documents: ["Contract", "ID Copy", "Tax Certificate"],
    probation: null, leaveBalance: 12, performanceScore: 3.9,
    notes: "Last review Jan 2026 - flagged communication improvement areas."
  },
  {
    id: "EMP-005", name: "Kira Bosman", role: "UX Designer", department: "Creative",
    avatar: "KB", color: "var(--amber)", contractType: "Permanent", startDate: "Aug 2023",
    salary: 33500, lastReview: "Aug 2025", nextReview: "Aug 2026",
    bankAccount: "FNB ****6670", taxNumber: "TRF-****-4423",
    address: "31 Korhaan St, Brooklyn, 0181", idNumber: "97****2214",
    emergencyContact: "Johan Bosman - +27 83 112 3344",
    documents: ["Contract", "ID Copy", "Tax Certificate", "Qualifications"],
    probation: null, leaveBalance: 11, performanceScore: 4.4,
    notes: null
  },
  {
    id: "EMP-006", name: "Tapiwa Moyo", role: "Copywriter", department: "Creative",
    avatar: "TM", color: "var(--blue)", contractType: "Permanent", startDate: "Jan 2024",
    salary: 28000, lastReview: null, nextReview: "Jan 2026",
    bankAccount: "Absa ****3345", taxNumber: "TRF-****-8812",
    address: "12 Flame Lily Close, Lynnwood, 0081", idNumber: "99****1132",
    emergencyContact: "Grace Moyo - +27 72 881 4409",
    documents: ["Contract", "ID Copy"],
    probation: "Completed Jan 2025", leaveBalance: 14, performanceScore: 3.7,
    notes: "First review overdue - schedule ASAP."
  }
];

const reqDocs = ["Contract", "ID Copy", "Tax Certificate"] as const;
const tabs = ["all records", "record detail", "compliance", "org chart"] as const;
type Tab = (typeof tabs)[number];

function parseMonthYear(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value} 1`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size === 24 ? "emprAvatar24" : size === 28 ? "emprAvatar28" : size === 30 ? "emprAvatar30" : size === 56 ? "emprAvatar56" : "emprAvatar40";
  const toneClass = colorClass(color).replace("color", "tone");
  return (
    <div className={cx(styles.emprAvatar, sizeClass, toneClass)}>
      {initials}
    </div>
  );
}

export function EmploymentRecordsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all records");
  const [selected, setSelected] = useState<Employee>(employees[0]);

  const overdueReviews = useMemo(() => {
    const cutoff = new Date("2026-03-01");
    return employees.filter((e) => {
      const next = parseMonthYear(e.nextReview);
      const last = parseMonthYear(e.lastReview);
      if (!next || next >= cutoff) return false;
      if (!last) return true;
      return last < new Date("2026-01-01");
    });
  }, []);

  const missingDocs = useMemo(
    () => employees.filter((e) => !reqDocs.every((d) => e.documents.includes(d))),
    []
  );
  const workPermits = useMemo(
    () => employees.filter((e) => e.documents.includes("Work Permit")),
    []
  );

  return (
    <div className={cx(styles.pageBody, styles.emprRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / STAFF</div>
          <h1 className={styles.pageTitle}>Employment Records</h1>
          <div className={styles.pageSub}>Contracts, personal details, performance, and documents</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Add Employee</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Employees", value: employees.length.toString(), color: "var(--accent)", sub: "All permanent staff" },
          { label: "Reviews Overdue", value: overdueReviews.length.toString(), color: overdueReviews.length > 0 ? "var(--red)" : "var(--accent)", sub: "Annual reviews past due" },
          { label: "Missing Documents", value: missingDocs.length.toString(), color: missingDocs.length > 0 ? "var(--amber)" : "var(--accent)", sub: "Incomplete compliance files" },
          { label: "Work Permits", value: workPermits.length.toString(), color: "var(--blue)", sub: "Foreign nationals on staff" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
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
                  <span className={styles.emprSalary}>R{(emp.salary / 1000).toFixed(0)}k</span>
                  <span className={cx(styles.emprMono12, reviewAlert ? "colorRed" : "colorMuted")}>{emp.nextReview || "Overdue"}</span>
                  <span className={cx(styles.emprDocStatus, missingAny ? "colorRed" : "colorAccent")}>{missingAny ? "!" : "OK"}</span>
                  <button type="button" onClick={() => { setSelected(emp); setActiveTab("record detail"); }} className={cx("btnSm", "btnAccent")}>View</button>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "record detail" ? (
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
                    { label: "Salary", value: `R${selected.salary.toLocaleString()}/month`, color: "var(--accent)" },
                    { label: "Bank Account", value: selected.bankAccount },
                    { label: "Tax Number", value: selected.taxNumber },
                    { label: "Last Review", value: selected.lastReview || "Never", color: !selected.lastReview ? "var(--red)" : "var(--text)" },
                    { label: "Next Review", value: selected.nextReview || "Overdue", color: !selected.lastReview ? "var(--red)" : "var(--text)" },
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
                    <div className={cx(styles.emprMono12, !emp.lastReview ? "colorRed" : "colorMuted")}>Next: {emp.nextReview || "OVERDUE"}</div>
                    {!emp.lastReview ? <div className={styles.emprNeverReviewed}>Never reviewed</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "org chart" ? (
          <div className={styles.emprOrgCard}>
            <div className={styles.emprOrgWrap}>
              <div className={styles.emprCeoCard}>
                <div className={styles.emprMono10Accent}>EMP-001</div>
                <div className={styles.emprCeoName}>Sipho Nkosi</div>
                <div className={styles.emprCeoRole}>Founder &amp; CEO</div>
              </div>
              <div className={styles.emprOrgLine} />

              <div className={styles.emprLeadsRow}>
                {[employees[1], employees[2]].map((emp) => (
                  <div key={emp.id} className={styles.emprLeadCol}>
                    <div className={styles.emprMiniLine} />
                    <div className={cx(styles.emprLeadCard, styles.emprLeadCardTone, toneClass(emp.color))}>
                      <div className={cx(styles.emprLeadId, colorClass(emp.color))}>{emp.id}</div>
                      <div className={styles.emprLeadName}>{emp.name.split(" ")[0]}</div>
                      <div className={cx(styles.emprLeadRole, colorClass(emp.color))}>{emp.role}</div>
                    </div>
                    <div className={styles.emprMiniLine} />
                    <div className={styles.emprReportsRow}>
                      {employees
                        .filter((e) => {
                          if (emp.name === "Leilani Fotu") return e.id === "EMP-006";
                          if (emp.name === "Renzo Fabbri") return ["EMP-004", "EMP-005"].includes(e.id);
                          return false;
                        })
                        .map((report) => (
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
