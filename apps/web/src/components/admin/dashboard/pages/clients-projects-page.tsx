"use client";

import { useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  primary: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

type ViewMode = "list" | "portfolio";

function formatDate(value?: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-ZA", { month: "short", day: "2-digit" }).format(date);
}

function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

function money(amountCents: number, currency?: string): string {
  const amount = amountCents / 100;
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: currency ?? "ZAR", maximumFractionDigits: 0 }).format(amount);
}

function healthScore(input: {
  projectInProgress: number;
  projectOverdue: number;
  overdueInvoices: number;
  wonLeads: number;
  lostLeads: number;
}): number {
  const projectScore = Math.max(0, 35 - input.projectOverdue * 9) + Math.min(20, input.projectInProgress * 4);
  const billingScore = Math.max(0, 30 - input.overdueInvoices * 12);
  const growthScore = Math.max(0, Math.min(35, 15 + (input.wonLeads - input.lostLeads) * 6));
  return Math.max(0, Math.min(100, Math.round(projectScore + billingScore + growthScore)));
}

function healthColor(score: number): string {
  if (score >= 80) return C.primary;
  if (score >= 60) return C.amber;
  return C.red;
}

export function ClientsAndProjectsPage({
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
  void onRefreshSnapshot;
  void onNotify;
  void clock;

  const [view, setView] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED">("ALL");
  const [tierFilter, setTierFilter] = useState<"ALL" | "STARTER" | "GROWTH" | "ENTERPRISE">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(snapshot.clients[0]?.id ?? null);

  const clients = useMemo(() => {
    return snapshot.clients.map((client) => {
      const projects = snapshot.projects.filter((project) => project.clientId === client.id);
      const invoices = snapshot.invoices.filter((invoice) => invoice.clientId === client.id);
      const payments = snapshot.payments.filter((payment) => payment.clientId === client.id);
      const leads = snapshot.leads.filter((lead) => lead.clientId === client.id);

      const inProgress = projects.filter((project) => project.status === "IN_PROGRESS").length;
      const overdueProjects = projects.filter((project) => project.status !== "COMPLETED" && project.dueAt && new Date(project.dueAt).getTime() < Date.now()).length;
      const overdueInvoices = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
      const wonLeads = leads.filter((lead) => lead.status === "WON").length;
      const lostLeads = leads.filter((lead) => lead.status === "LOST").length;

      const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
      const paidInvoiced = invoices.filter((invoice) => invoice.status === "PAID").reduce((sum, invoice) => sum + invoice.amountCents, 0);
      const outstandingInvoiced = invoices.filter((invoice) => invoice.status !== "PAID" && invoice.status !== "VOID").reduce((sum, invoice) => sum + invoice.amountCents, 0);

      return {
        ...client,
        health: healthScore({
          projectInProgress: inProgress,
          projectOverdue: overdueProjects,
          overdueInvoices,
          wonLeads,
          lostLeads
        }),
        inProgress,
        overdueProjects,
        overdueInvoices,
        wonLeads,
        lostLeads,
        totalInvoiced,
        paidInvoiced,
        outstandingInvoiced,
        paymentsCount: payments.length,
        renewalDays: daysUntil(client.contractRenewalAt),
        projectsCount: projects.length,
        invoicesCount: invoices.length,
        leadsCount: leads.length
      };
    });
  }, [snapshot.clients, snapshot.invoices, snapshot.leads, snapshot.payments, snapshot.projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((client) => {
      if (statusFilter !== "ALL" && client.status !== statusFilter) return false;
      if (tierFilter !== "ALL" && client.tier !== tierFilter) return false;
      if (!q) return true;
      return (
        client.name.toLowerCase().includes(q) ||
        (client.ownerName ?? "").toLowerCase().includes(q) ||
        (client.billingEmail ?? "").toLowerCase().includes(q)
      );
    });
  }, [clients, query, statusFilter, tierFilter]);

  const selected = filtered.find((client) => client.id === selectedId) ?? clients.find((client) => client.id === selectedId) ?? null;

  const avgHealth = filtered.length > 0 ? Math.round(filtered.reduce((sum, client) => sum + client.health, 0) / filtered.length) : 0;
  const atRisk = filtered.filter((client) => client.health < 60).length;
  const renewals30d = filtered.filter((client) => client.renewalDays !== null && client.renewalDays <= 30).length;
  const totalOutstanding = filtered.reduce((sum, client) => sum + client.outstandingInvoiced, 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Syne, sans-serif", padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / OPERATIONS</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Client Management</h1>
          <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>Account health · Renewal readiness · Billing exposure</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, border: "none", padding: "8px 16px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Client</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Accounts", value: filtered.length.toString(), sub: `${filtered.filter((c) => c.status === "ACTIVE").length} active`, color: C.primary },
          { label: "Avg Health", value: `${avgHealth}`, sub: `${atRisk} at risk (<60)`, color: healthColor(avgHealth) },
          { label: "Renewals (30d)", value: renewals30d.toString(), sub: "Needs retention plan", color: renewals30d > 0 ? C.amber : C.primary },
          { label: "Outstanding", value: money(totalOutstanding, "ZAR"), sub: "Open invoice exposure", color: totalOutstanding > 0 ? C.red : C.primary }
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 26, fontWeight: 800, color: kpi.color, marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search client, owner, billing email" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", minWidth: 280, fontFamily: "DM Mono, monospace", fontSize: 12 }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            <option value="ALL">All status</option>
            <option value="ONBOARDING">Onboarding</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CHURNED">Churned</option>
          </select>
          <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            <option value="ALL">All tiers</option>
            <option value="STARTER">Starter</option>
            <option value="GROWTH">Growth</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <button onClick={() => { setQuery(""); setStatusFilter("ALL"); setTierFilter("ALL"); }} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>Reset</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={() => setView("list")} style={{ background: view === "list" ? C.primary : C.bg, color: view === "list" ? C.bg : C.muted, border: `1px solid ${view === "list" ? C.primary : C.border}`, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>List</button>
            <button onClick={() => setView("portfolio")} style={{ background: view === "portfolio" ? C.primary : C.bg, color: view === "portfolio" ? C.bg : C.muted, border: `1px solid ${view === "portfolio" ? C.primary : C.border}`, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>Portfolio</button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <div>
          {view === "list" ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 90px 80px 90px 90px 120px 90px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {["Client", "Tier", "Health", "Projects", "Invoices", "Renewal", "Open"].map((h) => <span key={h}>{h}</span>)}
              </div>
              {filtered.length > 0 ? filtered.map((client, i) => (
                <div key={client.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 90px 80px 90px 90px 120px 90px", padding: "14px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", background: client.id === selectedId ? `${C.primary}12` : "transparent" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{client.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{client.ownerName ?? "Unassigned"}</div>
                  </div>
                  <span style={{ fontSize: 11, color: C.muted }}>{client.tier}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: healthColor(client.health), fontWeight: 700 }}>{client.health}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{client.projectsCount}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: client.overdueInvoices > 0 ? C.red : C.muted }}>{client.invoicesCount}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: client.renewalDays !== null && client.renewalDays <= 30 ? C.amber : C.muted }}>{client.renewalDays === null ? "Not set" : `${client.renewalDays}d`}</span>
                  <button onClick={() => setSelectedId(client.id)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Open</button>
                </div>
              )) : <div style={{ padding: 20, color: C.muted, fontSize: 12 }}>No clients match current filters.</div>}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {filtered.map((client) => (
                <div key={client.id} style={{ background: C.surface, border: `1px solid ${client.id === selectedId ? `${C.primary}66` : C.border}`, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{client.name}</div>
                    <span style={{ fontFamily: "DM Mono, monospace", color: healthColor(client.health), fontWeight: 700 }}>{client.health}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>{client.tier} · {client.status} · {client.ownerName ?? "Unassigned"}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 8 }}>
                      <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Projects</div>
                      <div style={{ fontFamily: "DM Mono, monospace", color: C.text }}>{client.projectsCount}</div>
                    </div>
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 8 }}>
                      <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Overdue Invoices</div>
                      <div style={{ fontFamily: "DM Mono, monospace", color: client.overdueInvoices > 0 ? C.red : C.primary }}>{client.overdueInvoices}</div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(client.id)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Open Account</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Account Detail</div>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{selected?.id.slice(0, 8) ?? "No account"}</span>
          </div>
          {selected ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{selected.tier} · {selected.status} · Owner: {selected.ownerName ?? "Unassigned"}</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Health", value: String(selected.health), color: healthColor(selected.health) },
                  { label: "Renewal", value: selected.renewalDays === null ? "Not set" : `${selected.renewalDays}d`, color: selected.renewalDays !== null && selected.renewalDays <= 30 ? C.amber : C.muted },
                  { label: "Outstanding", value: money(selected.outstandingInvoiced, "ZAR"), color: selected.outstandingInvoiced > 0 ? C.red : C.primary },
                  { label: "Paid", value: money(selected.paidInvoiced, "ZAR"), color: C.primary }
                ].map((m) => (
                  <div key={m.label} style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 10 }}>
                    <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Billing Contact</div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 10, marginBottom: 10, fontSize: 12 }}>{selected.billingEmail ?? "Not set"}</div>

              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Contract Renewal Date</div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 10, marginBottom: 10, fontSize: 12 }}>{formatDate(selected.contractRenewalAt)}</div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={{ background: C.primary, color: C.bg, border: "none", padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Open Full Account</button>
                <button style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Log Health Intervention</button>
                <button style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Send Renewal Reminder</button>
              </div>
            </>
          ) : (
            <div style={{ color: C.muted, fontSize: 12 }}>Select a client to view account details.</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, background: C.surface, border: `1px solid ${C.border}` }}>
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700 }}>Renewal Queue (next 45 days)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 100px 100px 120px 1fr", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {[
            "Client", "Health", "Renewal", "Outstanding", "Next Action"
          ].map((h) => <span key={h}>{h}</span>)}
        </div>
        {filtered
          .filter((client) => client.renewalDays !== null && client.renewalDays <= 45)
          .sort((a, b) => (a.renewalDays ?? 999) - (b.renewalDays ?? 999))
          .map((client, i, arr) => (
            <div key={client.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 100px 100px 120px 1fr", padding: "12px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{client.name}</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: healthColor(client.health) }}>{client.health}</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: (client.renewalDays ?? 999) <= 14 ? C.red : C.amber }}>{client.renewalDays}d</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: client.outstandingInvoiced > 0 ? C.red : C.primary }}>{money(client.outstandingInvoiced, "ZAR")}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{client.health < 60 ? "Exec check-in + rescue plan" : "Send renewal pack + confirm scope"}</span>
            </div>
          ))}
      </div>

      <div style={{ marginTop: 14, fontSize: 10, color: C.muted, fontFamily: "DM Mono, monospace" }}>
        Signed in as {session?.user.email ?? "Unknown"}
      </div>
    </div>
  );
}
