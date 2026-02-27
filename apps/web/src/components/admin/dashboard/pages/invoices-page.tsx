"use client";

import { useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  lime: "#a78bfa",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

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
  scheduled: C.blue,
  "pending-approval": C.amber,
  pending: C.amber,
  overdue: C.red,
  sent: C.muted,
  paid: C.lime,
  active: C.lime,
  approved: C.lime,
  "due-soon": C.amber,
  upcoming: C.blue
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
    <span
      style={{
        fontSize: 10,
        fontFamily: "DM Mono, monospace",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: statusColors[status] || C.muted,
        background: `${statusColors[status] || C.muted}18`,
        padding: "3px 8px",
        borderRadius: 4
      }}
    >
      {label}
    </span>
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
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>
            ADMIN / FINANCIAL GOVERNANCE
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Financial Control</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Bank accounts · Payouts · Tax · Invoice approval</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>
            Export CSV
          </button>
          <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>
            + New Payout
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total ZAR Balance", value: `R${(totalBalance / 1000).toFixed(1)}k`, color: C.lime, sub: "Across 3 accounts" },
          { label: "Scheduled Payouts", value: "R191.7k", color: C.amber, sub: "Next 7 days" },
          { label: "Overdue Invoices", value: "R21,000", color: C.red, sub: "1 invoice · 9 days" },
          { label: "Pending Approvals", value: "1", color: C.orange, sub: "Studio Outpost payout" }
        ].map((summary) => (
          <div key={summary.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{summary.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: summary.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{summary.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{summary.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === tab ? C.lime : C.muted,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: `2px solid ${activeTab === tab ? C.lime : "transparent"}`,
              marginBottom: -1,
              transition: "all 0.2s",
              whiteSpace: "nowrap"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "bank accounts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {accounts.map((a) => (
            <div key={a.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", alignItems: "center", gap: 24 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{a.bank} · {a.type}</div>
              </div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: C.muted }}>{a.number}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.lime, fontFamily: "DM Mono, monospace" }}>
                  {a.currency === "USD" ? "$" : "R"}
                  {a.balance.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{a.currency}</div>
              </div>
              <StatusBadge status={a.status} />
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>View</button>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Transfer</button>
              </div>
            </div>
          ))}
          <button style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10, padding: 20, color: C.muted, fontSize: 13, cursor: "pointer", textAlign: "center" }}>
            + Link New Account
          </button>
        </div>
      )}

      {activeTab === "payouts" && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflowX: "auto" }}>
          <div style={{ minWidth: 900 }}>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 120px 120px 110px 120px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {["ID", "Recipient", "Type", "Amount", "Date", "Status", "Action"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {payouts.map((p, i) => (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 120px 120px 110px 120px", padding: "16px 24px", borderBottom: i < payouts.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", background: p.status === "pending-approval" ? `${C.amber}12` : "transparent" }}>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{p.id}</span>
                <span style={{ fontWeight: 600 }}>{p.recipient}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{p.type}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{p.amount.toLocaleString()}</span>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "DM Mono, monospace" }}>{p.date}</span>
                <StatusBadge status={approving === p.id ? "approved" : p.status} />
                {p.status === "pending-approval" && approving !== p.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => approvePayout(p.id)} style={{ background: C.lime, color: C.bg, border: "none", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Approve</button>
                    <button style={{ background: `${C.red}15`, color: C.red, border: "none", padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Reject</button>
                  </div>
                ) : (
                  <button style={{ background: C.border, border: "none", color: C.muted, padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>View</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflowX: "auto" }}>
          <div style={{ minWidth: 900 }}>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 100px 120px 120px 110px 120px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {["Inv #", "Client", "Amount", "Issued", "Due", "Status", "Action"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {invoices.map((inv, i) => (
              <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "100px 1fr 100px 120px 120px 110px 120px", padding: "16px 24px", borderBottom: i < invoices.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", background: inv.status === "overdue" ? C.surface : "transparent" }}>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{inv.id}</span>
                <span style={{ fontWeight: 600 }}>{inv.client}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{(inv.amount / 1000).toFixed(1)}k</span>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: "DM Mono, monospace" }}>{inv.issued}</span>
                <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: inv.status === "overdue" ? C.red : C.muted }}>
                  {inv.due}
                  {inv.status === "overdue" && <div style={{ fontSize: 10, color: C.red }}>{Math.abs(inv.daysLeft)}d overdue</div>}
                </span>
                <StatusBadge status={inv.status} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ background: C.border, border: "none", color: C.text, padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>View</button>
                  {inv.status === "overdue" && <button style={{ background: C.surface, color: C.red, border: "none", padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Chase</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "tax config" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tax Identifiers</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {taxItems.map((t) => (
                <div key={t.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700 }}>{t.value}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>VAT Configuration</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "VAT Rate", value: "15%" },
                  { label: "VAT Period", value: "Monthly" },
                  { label: "Submission Method", value: "e-Filing" },
                  { label: "Next Due Date", value: "28 Feb 2026" }
                ].map((v) => (
                  <div key={v.label}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{v.label}</div>
                    <div style={{ fontWeight: 700, fontFamily: "DM Mono, monospace" }}>{v.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.lime}22`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: C.lime }}>Feb 2026 VAT Due</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.lime, fontFamily: "DM Mono, monospace", marginBottom: 8 }}>R52,400</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Output VAT: R61,920 · Input VAT: R9,520</div>
              <button style={{ background: C.lime, color: C.bg, border: "none", padding: "10px 20px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Submit via e-Filing →
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "write-offs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.red}33`, borderRadius: 10, padding: 20, display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ fontSize: 24 }}>⚠️</div>
            <div>
              <div style={{ fontWeight: 700, color: C.amber, marginBottom: 4 }}>Write-Off Policy</div>
              <div style={{ fontSize: 12, color: C.muted }}>Write-offs must be approved by admin. All write-offs are logged for audit and tax purposes. Ensure SARS documentation is retained for 5 years.</div>
            </div>
          </div>
          {writeOffs.map((w) => (
            <div key={w.client} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", alignItems: "center", gap: 20 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{w.client}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{w.date}</div>
              </div>
              <div style={{ fontFamily: "DM Mono, monospace", color: C.red, fontWeight: 700, fontSize: 18 }}>–R{w.amount.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{w.reason}</div>
              <StatusBadge status={w.status} />
              <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>View Docs</button>
            </div>
          ))}
          <button style={{ background: C.surface, border: `1px dashed ${C.red}55`, borderRadius: 10, padding: 20, color: C.red, fontSize: 13, cursor: "pointer", textAlign: "center" }}>
            + Request New Write-Off
          </button>
        </div>
      )}
    </div>
  );
}
