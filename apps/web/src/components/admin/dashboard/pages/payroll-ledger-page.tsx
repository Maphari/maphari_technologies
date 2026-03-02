"use client";

import { useMemo, useState } from "react";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { toneClass } from "./admin-page-utils";

type StaffMember = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  grossSalary: number;
  taxRate: number;
  uifRate: number;
  startDate: string;
  contractType: string;
  bankLast4: string;
};

const staff: StaffMember[] = [
  { id: "EMP-001", name: "Sipho Nkosi", role: "Founder & CEO", avatar: "SN", color: "var(--accent)", grossSalary: 60000, taxRate: 0.36, uifRate: 0.01, startDate: "Jan 2020", contractType: "Permanent", bankLast4: "7823" },
  { id: "EMP-002", name: "Leilani Fotu", role: "Head of Operations", avatar: "LF", color: "var(--blue)", grossSalary: 44000, taxRate: 0.3, uifRate: 0.01, startDate: "Mar 2022", contractType: "Permanent", bankLast4: "4412" },
  { id: "EMP-003", name: "Renzo Fabbri", role: "Creative Director", avatar: "RF", color: "var(--amber)", grossSalary: 52000, taxRate: 0.33, uifRate: 0.01, startDate: "Jun 2021", contractType: "Permanent", bankLast4: "9934" },
  { id: "EMP-004", name: "Nomsa Dlamini", role: "Account Manager", avatar: "ND", color: "var(--accent)", grossSalary: 38000, taxRate: 0.27, uifRate: 0.01, startDate: "Feb 2023", contractType: "Permanent", bankLast4: "2281" },
  { id: "EMP-005", name: "Kira Bosman", role: "UX Designer", avatar: "KB", color: "var(--amber)", grossSalary: 33500, taxRate: 0.25, uifRate: 0.01, startDate: "Aug 2023", contractType: "Permanent", bankLast4: "6670" },
  { id: "EMP-006", name: "Tapiwa Moyo", role: "Copywriter", avatar: "TM", color: "var(--blue)", grossSalary: 28000, taxRate: 0.22, uifRate: 0.01, startDate: "Jan 2024", contractType: "Permanent", bankLast4: "3345" }
];

const tabs = ["feb payroll", "payroll history", "payslips", "compliance"] as const;
type Tab = (typeof tabs)[number];

function calcPayslip(member: StaffMember) {
  const paye = Math.round(member.grossSalary * member.taxRate);
  const uif = Math.round(member.grossSalary * member.uifRate);
  const totalDeductions = paye + uif;
  const netPay = member.grossSalary - totalDeductions;
  return { paye, uif, totalDeductions, netPay };
}

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size <= 28 ? styles.payAvatar28 : styles.payAvatar36;
  return (
    <div
      className={cx("flexCenter", "fontMono", "fw700", "noShrink", styles.payAvatar, sizeClass, toneClass(color))}
    >
      {initials}
    </div>
  );
}

export function PayrollLedgerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("feb payroll");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const totals = useMemo(() => {
    const totalGross = staff.reduce((s, m) => s + m.grossSalary, 0);
    const totalNet = staff.reduce((s, m) => s + calcPayslip(m).netPay, 0);
    const totalPAYE = staff.reduce((s, m) => s + calcPayslip(m).paye, 0);
    const totalUIF = staff.reduce((s, m) => s + calcPayslip(m).uif, 0);
    return { totalGross, totalNet, totalPAYE, totalUIF };
  }, []);

  return (
    <div className={cx(styles.pageBody, styles.payRoot)}>
      <div className={cx("flexBetween", "mb28")}>
        <div>
          <div className={cx("pageEyebrow")}>ADMIN / FINANCIAL</div>
          <h1 className={cx("pageTitle")}>Payroll Ledger</h1>
          <div className={cx("pageSub")}>Monthly payroll, payslips, PAYE, UIF, and SARS compliance</div>
        </div>
        <div className={cx("flexRow", "gap8")}>
          <button type="button" className={cx("btnSm", "btnGhost", "fontMono")}>Export EMP201</button>
          <button type="button" className={cx("btnSm", "btnAccent", "fontMono")}>Run Payroll</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb16")}>
        {[
          { label: "Total Gross Payroll", value: `R${(totals.totalGross / 1000).toFixed(0)}k`, color: "var(--amber)", sub: "Feb 2026" },
          { label: "Total Net Pay", value: `R${(totals.totalNet / 1000).toFixed(0)}k`, color: "var(--accent)", sub: "After deductions" },
          { label: "PAYE to SARS", value: `R${(totals.totalPAYE / 1000).toFixed(1)}k`, color: "var(--red)", sub: "Due 7 Mar" },
          { label: "UIF Contributions", value: `R${(totals.totalUIF / 1000).toFixed(1)}k`, color: "var(--blue)", sub: "Employee + employer" }
        ].map((s) => (
          <div key={s.label} className={cx("statCard")}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue", styles.payToneText, toneClass(s.color))}>{s.value}</div>
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
        {activeTab === "feb payroll" ? (
          <div className={cx(styles.payMainSplit, selectedStaff ? styles.payMainSplitTwo : styles.payMainSplitOne)}>
            <div className={cx("card", "overflowHidden")}>
              <div className={cx("payTableHead", "text10", "colorMuted", "uppercase")}>
                {["Employee", "Role", "Gross", "PAYE", "UIF", "Net Pay", ""].map((h) => <span key={h}>{h}</span>)}
              </div>
              {staff.map((member) => {
                const { paye, uif, netPay } = calcPayslip(member);
                const isSel = selectedStaff?.id === member.id;
                return (
                  <div
                    key={member.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedStaff(isSel ? null : member)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedStaff(isSel ? null : member);
                      }
                    }}
                    className={cx("payTableRow", "pointerCursor", isSel && styles.payRowSelected)}
                  >
                    <div className={cx("flexRow", "gap10", styles.payAlignCenter)}>
                      <Avatar initials={member.avatar} color={member.color} size={28} />
                      <span className={cx("fw600", "text13")}>{member.name}</span>
                    </div>
                    <span className={cx("text12", "colorMuted")}>{member.role}</span>
                    <span className={cx("fontMono", "fw700", "colorAmber")}>R{member.grossSalary.toLocaleString()}</span>
                    <span className={cx("fontMono", "colorRed")}>R{paye.toLocaleString()}</span>
                    <span className={cx("fontMono", "colorBlue")}>R{uif.toLocaleString()}</span>
                    <span className={cx("fontMono", "fw700", "colorAccent")}>R{netPay.toLocaleString()}</span>
                    <button type="button" className={cx("btnSm", "btnGhost", "text10")}>Payslip</button>
                  </div>
                );
              })}
              <div className={styles.payTableFoot}>
                <span className={cx("fw700", "colorAccent")}>TOTAL</span>
                <span />
                <span className={cx("fontMono", "fw800", "colorAmber")}>R{totals.totalGross.toLocaleString()}</span>
                <span className={cx("fontMono", "fw700", "colorRed")}>R{totals.totalPAYE.toLocaleString()}</span>
                <span className={cx("fontMono", "fw700", "colorBlue")}>R{totals.totalUIF.toLocaleString()}</span>
                <span className={cx("fontMono", "fw800", "colorAccent")}>R{totals.totalNet.toLocaleString()}</span>
                <span />
              </div>
            </div>

            {selectedStaff ? (() => {
              const { paye, uif, totalDeductions, netPay } = calcPayslip(selectedStaff);
              return (
                <div className={cx("card", "p24", styles.payToneBorder, toneClass(selectedStaff.color))}>
                  <div className={cx("flexRow", "gap12", "mb24", styles.payAlignCenter)}>
                    <Avatar initials={selectedStaff.avatar} color={selectedStaff.color} />
                    <div>
                      <div className={cx("fw700", styles.payTitle16)}>{selectedStaff.name}</div>
                      <div className={cx("text12", "colorMuted")}>{selectedStaff.role}</div>
                    </div>
                  </div>
                  <div className={cx("text11", "fw700", "colorMuted", "uppercase", "mb12")}>February 2026 Payslip</div>
                  {[
                    { label: "Gross Salary", value: `R${selectedStaff.grossSalary.toLocaleString()}`, color: "var(--text)", bold: false, large: false },
                    { label: `PAYE (${Math.round(selectedStaff.taxRate * 100)}%)`, value: `-R${paye.toLocaleString()}`, color: "var(--red)", bold: false, large: false },
                    { label: "UIF (1%)", value: `-R${uif.toLocaleString()}`, color: "var(--red)", bold: false, large: false },
                    { label: "Total Deductions", value: `-R${totalDeductions.toLocaleString()}`, color: "var(--red)", bold: true, large: false },
                    { label: "NET PAY", value: `R${netPay.toLocaleString()}`, color: "var(--accent)", bold: true, large: true }
                  ].map((r) => (
                    <div key={r.label} className={cx("flexBetween", "borderB", "py10")}>
                      <span className={cx("colorMuted", r.bold ? styles.payLabelBold : styles.payLabelNorm)}>{r.label}</span>
                      <span className={cx("fontMono", r.bold ? styles.payValueBold : styles.payValueNorm, r.large && styles.payValueLg, styles.payToneText, toneClass(r.color))}>{r.value}</span>
                    </div>
                  ))}
                  <div className={cx("bgBg", "mt16", styles.payPad12)}>
                    {[
                      { label: "Bank Account", value: `****${selectedStaff.bankLast4}` },
                      { label: "Contract", value: selectedStaff.contractType },
                      { label: "Start Date", value: selectedStaff.startDate }
                    ].map((r) => (
                      <div key={r.label} className={cx("flexBetween", "text11", styles.payPy4)}>
                        <span className={cx("colorMuted")}>{r.label}</span>
                        <span className={cx("fontMono")}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className={cx("flexRow", "gap8", "mt16")}>
                    <button type="button" className={cx("btnSm", "btnAccent", "text12", "fw700", styles.payFlex1)}>Download PDF</button>
                    <button type="button" className={cx("btnSm", "btnGhost", "text12", styles.payFlex1)}>Email to Staff</button>
                  </div>
                </div>
              );
            })() : null}
          </div>
        ) : null}

        {activeTab === "payroll history" ? (
          <div className={cx("card", "overflowHidden")}>
            <div className={cx("payHistHead", "text10", "colorMuted", "uppercase")}>
              {["Month", "Gross", "PAYE", "UIF", "Net", "Status", ""].map((h) => <span key={h}>{h}</span>)}
            </div>
            {["Feb 2026", "Jan 2026", "Dec 2025", "Nov 2025"].map((month, i) => {
              const variation = [1, 0, 0, -0.02][i] as number;
              const gross = Math.round(totals.totalGross * (1 + variation));
              const paye = Math.round(totals.totalPAYE * (1 + variation));
              const uif = Math.round(totals.totalUIF * (1 + variation));
              const net = gross - paye - uif;
              return (
                <div key={month} className={styles.payHistRow}>
                  <span className={cx("fontMono", "fw600")}>{month}</span>
                  <span className={cx("fontMono", "colorAmber")}>R{gross.toLocaleString()}</span>
                  <span className={cx("fontMono", "colorRed")}>R{paye.toLocaleString()}</span>
                  <span className={cx("fontMono", "colorBlue")}>R{uif.toLocaleString()}</span>
                  <span className={cx("fontMono", "colorAccent")}>R{net.toLocaleString()}</span>
                  <span className={cx("text10", "fontMono", styles.payToneTag, i === 0 ? "toneAmber" : "toneAccent")}>{i === 0 ? "Pending" : "Processed"}</span>
                  <button type="button" className={cx("btnSm", "btnGhost", "text10")}>View</button>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "payslips" ? (
          <div className={cx("grid2", "gap12")}>
            {staff.map((member) => {
              const { netPay } = calcPayslip(member);
              return (
                <div key={member.id} className={cx("card", "p20", "flexBetween", styles.payAlignCenter)}>
                  <div className={cx("flexRow", "gap12", styles.payAlignCenter)}>
                    <Avatar initials={member.avatar} color={member.color} size={36} />
                    <div>
                      <div className={cx("fw600")}>{member.name}</div>
                      <div className={cx("text12", "colorMuted")}>{member.role}</div>
                      <div className={cx("fontMono", "colorAccent", "fw700", "mt4")}>R{netPay.toLocaleString()} net</div>
                    </div>
                  </div>
                  <div className={cx("flexRow", "gap8")}>
                    <button type="button" className={cx("btnSm", "btnAccent", "text11", "fw700")}>PDF</button>
                    <button type="button" className={cx("btnSm", "btnGhost", "text11")}>Email</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "compliance" ? (
          <div className={cx("grid2", "gap20")}>
            <div className={cx("card", "p24")}>
              <div className={cx("text13", "fw700", "mb20", "uppercase")}>SARS Submission Deadlines</div>
              {[
                { task: "EMP201 - PAYE monthly return", due: "7 Mar 2026", status: "upcoming", amount: `R${totals.totalPAYE.toLocaleString()}` },
                { task: "UIF monthly contribution", due: "7 Mar 2026", status: "upcoming", amount: `R${(totals.totalUIF * 2).toLocaleString()}` },
                { task: "IRP5 certificates (EMP501)", due: "31 May 2026", status: "future", amount: "Annual" },
                { task: "EMP501 half-year reconciliation", due: "31 Oct 2026", status: "future", amount: "Annual" }
              ].map((d) => (
                <div key={d.task} className={cx("flexBetween", "borderB", styles.payRuleRow)}>
                  <div>
                    <div className={cx("text13", "fw600")}>{d.task}</div>
                    <div className={cx("text11", styles.payToneText, d.status === "upcoming" ? "toneAmber" : "toneMuted")}>{d.due}</div>
                  </div>
                  <div className={cx("textRight")}>
                    <div className={cx("fontMono", "colorRed", "fw700")}>{d.amount}</div>
                    <span className={cx("text10", styles.payToneText, d.status === "upcoming" ? "toneAmber" : "toneMuted")}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={cx("card", "p24")}>
              <div className={cx("text13", "fw700", "mb20", "uppercase")}>Payroll Cost Summary</div>
              {[
                { label: "Gross payroll", value: totals.totalGross, color: "var(--amber)" },
                { label: "PAYE (employee)", value: totals.totalPAYE, color: "var(--red)" },
                { label: "UIF (employee 1%)", value: totals.totalUIF, color: "var(--blue)" },
                { label: "UIF (employer 1%)", value: totals.totalUIF, color: "var(--blue)" },
                { label: "SDL (1% of payroll)", value: Math.round(totals.totalGross * 0.01), color: "var(--accent)" }
              ].map((r) => (
                <div key={r.label} className={cx("flexBetween", "borderB", "text13", styles.payPy10)}>
                  <span className={cx("colorMuted")}>{r.label}</span>
                  <span className={cx("fontMono", "fw700", styles.payToneText, toneClass(r.color))}>R{r.value.toLocaleString()}</span>
                </div>
              ))}
              <div className={cx("flexBetween", "text14", styles.payPy12)}>
                <span className={cx("fw700")}>Total Employment Cost</span>
                <span className={cx("fontMono", "fw800", "colorAccent")}>
                  R{(totals.totalGross + totals.totalUIF + Math.round(totals.totalGross * 0.01)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
