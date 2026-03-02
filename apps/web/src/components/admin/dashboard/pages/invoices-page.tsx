"use client";

import { useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";

const accounts = [
  { name: "Maphari Operations", bank: "FNB", number: "••••7823", balance: 892400, currency: "ZAR", type: "Current", status: "active" },
  { name: "Tax Reserve", bank: "Nedbank", number: "••••4421", balance: 214000, currency: "ZAR", type: "Savings", status: "active" },
  { name: "Client Deposits", bank: "Investec", number: "••••9901", balance: 156000, currency: "ZAR", type: "Holding", status: "active" },
  { name: "USD Account", bank: "Standard Bank", number: "••••3317", balance: 28500, currency: "USD", type: "Forex", status: "active" }
] as const;

const payouts = [
  { id: "PAY-001", recipient: "Nomsa Dlamini", type: "Salary", amount: 42000, date: "2026-02-25", status: "scheduled" },
  { id: "PAY-002", recipient: "Renzo Fabbri", type: "Salary", amount: 38500, date: "2026-02-25", status: "scheduled" },
  { id: "PAY-003", recipient: "Kira Bosman", type: "Salary", amount: 35000, date: "2026-02-25", status: "scheduled" },
  { id: "PAY-004", recipient: "Studio Outpost", type: "Contractor", amount: 18000, date: "2026-02-28", status: "pending-approval" },
  { id: "PAY-005", recipient: "SARS — VAT", type: "Tax", amount: 52400, date: "2026-02-28", status: "scheduled" },
  { id: "PAY-006", recipient: "Adobe CC (annual)", type: "Software", amount: 4800, date: "2026-03-01", status: "scheduled" }
] as const;

const invoices = [
  { id: "INV-0041", client: "Volta Studios", amount: 34800, issued: "2026-02-01", due: "2026-02-28", status: "pending", daysLeft: 5 },
  { id: "INV-0040", client: "Mira Health", amount: 21600, issued: "2026-02-01", due: "2026-02-28", status: "pending", daysLeft: 5 },
  { id: "INV-0038", client: "Kestrel Capital", amount: 21000, issued: "2026-01-15", due: "2026-02-14", status: "overdue", daysLeft: -9 },
  { id: "INV-0037", client: "Dune Collective", amount: 48000, issued: "2026-02-05", due: "2026-03-05", status: "sent", daysLeft: 10 },
  { id: "INV-0036", client: "Okafor & Sons", amount: 12000, issued: "2026-01-20", due: "2026-02-20", status: "paid", daysLeft: 0 }
] as const;

const statusColors: Record<string, string> = {
  scheduled: "var(--blue)",
  "pending-approval": "var(--amber)",
  pending: "var(--amber)",
  overdue: "var(--red)",
  sent: "var(--muted)",
  paid: "var(--accent)",
  active: "var(--accent)",
  approved: "var(--accent)",
  "due-soon": "var(--amber)",
  upcoming: "var(--blue)"
};

const taxItems = [
  { label: "VAT Registration", value: "4680123456", status: "active" },
  { label: "Income Tax Ref.", value: "9012/345/12/3", status: "active" },
  { label: "Next VAT Return", value: "28 Feb 2026", status: "due-soon" },
  { label: "Next Provisional Tax", value: "31 Aug 2026", status: "upcoming" },
  { label: "PAYE Reference", value: "7123456789", status: "active" },
  { label: "UIF Reference", value: "U312456", status: "active" }
] as const;

const writeOffs = [
  { client: "Helios Digital", amount: 8400, reason: "Client churned — bad debt", date: "Jan 2026", status: "approved" },
  { client: "Luma Events", amount: 3200, reason: "Scope dispute — settled", date: "Dec 2025", status: "approved" }
] as const;

const tabs = ["bank accounts", "payouts", "invoices", "tax config", "write-offs"] as const;

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/-/g, " ");
  return (
    <span className={cx(styles.invcStatusBadge, toneClass(statusColors[status] || "var(--muted)"))}>{label}</span>
  );
}

export function InvoicesPage({
  snapshot,
  session,
  onRefreshSnapshot,
  onNotify,
  clock
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  onRefreshSnapshot: (sessionOverride?: AuthSession) => Promise<void>;
  onNotify: (tone: "success" | "error", message: string) => void;
  clock: number;
}) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("bank accounts");
  const [approving, setApproving] = useState<string | null>(null);

  const totalBalance = accounts.filter((a) => a.currency === "ZAR").reduce((s, a) => s + a.balance, 0);

  const approvePayout = (id: string) => {
    setApproving(id);
    onNotify("success", `Payout ${id} approved.`);
  };

  void snapshot;
  void session;
  void onRefreshSnapshot;
  void clock;

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / FINANCIAL GOVERNANCE</div>
          <h1 className={styles.pageTitle}>Financial Control</h1>
          <div className={styles.pageSub}>Bank accounts · Payouts · Tax · Invoice approval</div>
        </div>
        <div className={cx("flexRow", "gap8")}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export CSV</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ New Payout</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          { label: "Total ZAR Balance", value: `R${(totalBalance / 1000).toFixed(1)}k`, color: "var(--accent)", sub: "Across 3 accounts" },
          { label: "Scheduled Payouts", value: "R191.7k", color: "var(--amber)", sub: "Next 7 days" },
          { label: "Overdue Invoices", value: "R21,000", color: "var(--red)", sub: "1 invoice · 9 days" },
          { label: "Pending Approvals", value: "1", color: "var(--amber)", sub: "Studio Outpost payout" }
        ].map((summary) => (
          <div key={summary.label} className={styles.statCard}>
            <div className={styles.statLabel}>{summary.label}</div>
            <div className={cx(styles.statValue, colorClass(summary.color))}>{summary.value}</div>
            <div className={cx("text11", "colorMuted")}>{summary.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Filter by tab" value={activeTab} onChange={e => setActiveTab(e.target.value as (typeof tabs)[number])} className={styles.filterSelect}>
          {tabs.map(tab => <option key={tab} value={tab}>{tab}</option>)}
        </select>
      </div>

      {activeTab === "bank accounts" && (
        <div className={cx("flexCol", "gap12")}>
          {accounts.map((a) => (
            <div key={a.name} className={styles.invcAcctRow}>
              <div>
                <div className={cx("fw700", "mb4")}>{a.name}</div>
                <div className={cx("text12", "colorMuted")}>{a.bank} · {a.type}</div>
              </div>
              <div className={cx("fontMono", "text13", "colorMuted")}>{a.number}</div>
              <div>
                <div className={styles.invcAmount22}>
                  {a.currency === "USD" ? "$" : "R"}
                  {a.balance.toLocaleString()}
                </div>
                <div className={cx("text11", "colorMuted")}>{a.currency}</div>
              </div>
              <StatusBadge status={a.status} />
              <div className={cx("flexRow", "gap8")}>
                <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
                <button type="button" className={cx("btnSm", "btnGhost")}>Transfer</button>
              </div>
            </div>
          ))}
          <button type="button" className={styles.invcDashedBtn}>+ Link New Account</button>
        </div>
      )}

      {activeTab === "payouts" && (
        <div className={cx("card", "overflowAuto", "p0")}>
          <div className={styles.invcMinW900}>
            <div className={cx("invcPayGrid", "px20", "borderB", "text10", "colorMuted", "uppercase", "tracking")}>
              {["ID", "Recipient", "Type", "Amount", "Date", "Status", "Action"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {payouts.map((p, i) => (
              <div key={p.id} className={cx("invcPayGrid", "px20", "invcRowPad16", "invcRowAlign", i < payouts.length - 1 && "borderB", p.status === "pending-approval" && styles.invcPendingBg)}>
                <span className={cx("fontMono", "text11", "colorMuted")}>{p.id}</span>
                <span className={cx("fw600")}>{p.recipient}</span>
                <span className={cx("text12", "colorMuted")}>{p.type}</span>
                <span className={cx("fontMono", "fw700", "colorAccent")}>R{p.amount.toLocaleString()}</span>
                <span className={cx("text12", "fontMono", "colorMuted")}>{p.date}</span>
                <StatusBadge status={approving === p.id ? "approved" : p.status} />
                {p.status === "pending-approval" && approving !== p.id ? (
                  <div className={cx("flexRow", "gap6")}>
                    <button type="button" onClick={() => approvePayout(p.id)} className={cx("btnSm", "btnAccent")}>Approve</button>
                    <button type="button" className={styles.invcRejectBtn}>Reject</button>
                  </div>
                ) : (
                  <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className={cx("card", "overflowAuto", "p0")}>
          <div className={styles.invcMinW900}>
            <div className={cx("invcInvGrid", "px20", "borderB", "text10", "colorMuted", "uppercase", "tracking")}>
              {["Inv #", "Client", "Amount", "Issued", "Due", "Status", "Action"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {invoices.map((inv, i) => (
              <div key={inv.id} className={cx("invcInvGrid", "px20", "invcRowPad16", "invcRowAlign", i < invoices.length - 1 && "borderB", inv.status === "overdue" && styles.invcOverdueRow)}>
                <span className={cx("fontMono", "text11", "colorMuted")}>{inv.id}</span>
                <span className={cx("fw600")}>{inv.client}</span>
                <span className={cx("fontMono", "fw700", "colorAccent")}>R{(inv.amount / 1000).toFixed(1)}k</span>
                <span className={cx("text11", "fontMono", "colorMuted")}>{inv.issued}</span>
                <span className={cx("text11", "fontMono", inv.status === "overdue" ? "colorRed" : "colorMuted")}>
                  {inv.due}
                  {inv.status === "overdue" && <div className={cx("text10", "colorRed")}>{Math.abs(inv.daysLeft)}d overdue</div>}
                </span>
                <StatusBadge status={inv.status} />
                <div className={cx("flexRow", "gap6")}>
                  <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
                  {inv.status === "overdue" && <button type="button" className={styles.invcChaseBtn}>Chase</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "tax config" && (
        <div className={styles.invcTaxSplit}>
          <div className={cx("card", "p24")}>
            <div className={styles.invcCardTitle}>Tax Identifiers</div>
            <div className={cx("flexCol", "gap16")}>
              {taxItems.map((t) => (
                <div key={t.label} className={styles.invcTaxRow}>
                  <div>
                    <div className={cx("text12", "colorMuted", "mb2")}>{t.label}</div>
                    <div className={cx("fontMono", "fw700")}>{t.value}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          </div>

          <div className={cx("flexCol", "gap16")}>
            <div className={cx("card", "p24")}>
              <div className={styles.invcCardTitle}>VAT Configuration</div>
              <div className={cx("grid2", "gap16")}>
                {[
                  { label: "VAT Rate", value: "15%" },
                  { label: "VAT Period", value: "Monthly" },
                  { label: "Submission Method", value: "e-Filing" },
                  { label: "Next Due Date", value: "28 Feb 2026" }
                ].map((v) => (
                  <div key={v.label}>
                    <div className={cx("text11", "colorMuted", "mb4")}>{v.label}</div>
                    <div className={cx("fontMono", "fw700")}>{v.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.invcVatDueCard}>
              <div className={cx("text13", "fw700", "mb12", "colorAccent")}>Feb 2026 VAT Due</div>
              <div className={styles.invcVatDueValue}>R52,400</div>
              <div className={cx("text12", "colorMuted", "mb16")}>Output VAT: R61,920 · Input VAT: R9,520</div>
              <button type="button" className={cx("btnSm", "btnAccent")}>Submit via e-Filing →</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "write-offs" && (
        <div className={cx("flexCol", "gap16")}>
          <div className={styles.invcWarnCard}>
            <div className={styles.invcWarnIcon}>⚠️</div>
            <div>
              <div className={cx("fw700", "colorAmber", "mb4")}>Write-Off Policy</div>
              <div className={cx("text12", "colorMuted")}>
                Write-offs must be approved by admin. All write-offs are logged for audit and tax purposes. Ensure SARS documentation is retained for 5 years.
              </div>
            </div>
          </div>
          {writeOffs.map((w) => (
            <div key={w.client} className={styles.invcWriteoffRow}>
              <div>
                <div className={cx("fw700")}>{w.client}</div>
                <div className={cx("text12", "colorMuted")}>{w.date}</div>
              </div>
              <div className={styles.invcWriteoffAmount}>–R{w.amount.toLocaleString()}</div>
              <div className={cx("text12", "colorMuted")}>{w.reason}</div>
              <StatusBadge status={w.status} />
              <button type="button" className={cx("btnSm", "btnGhost")}>View Docs</button>
            </div>
          ))}
          <button type="button" className={styles.invcWriteoffBtn}>+ Request New Write-Off</button>
        </div>
      )}
    </div>
  );
}
