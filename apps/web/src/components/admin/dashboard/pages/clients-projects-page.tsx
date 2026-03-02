"use client";

import { useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

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
  if (score >= 80) return "var(--accent)";
  if (score >= 60) return "var(--amber)";
  return "var(--red)";
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
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / OPERATIONS</div>
          <h1 className={styles.pageTitle}>Client Management</h1>
          <div className={styles.pageSub}>Account health &middot; Renewal readiness &middot; Billing exposure</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ Add Client</button>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Accounts", value: filtered.length.toString(), sub: `${filtered.filter((c) => c.status === "ACTIVE").length} active`, color: "var(--accent)" },
          { label: "Avg Health", value: `${avgHealth}`, sub: `${atRisk} at risk (<60)`, color: healthColor(avgHealth) },
          { label: "Renewals (30d)", value: renewals30d.toString(), sub: "Needs retention plan", color: renewals30d > 0 ? "var(--amber)" : "var(--accent)" },
          { label: "Outstanding", value: money(totalOutstanding, "ZAR"), sub: "Open invoice exposure", color: totalOutstanding > 0 ? "var(--red)" : "var(--accent)" }
        ].map((kpi) => (
          <div key={kpi.label} className={styles.statCard}>
            <div className={styles.statLabel}>{kpi.label}</div>
            <div className={cx(styles.statValue, "mb4", styles.clientsToneText, toneClass(kpi.color))}>{kpi.value}</div>
            <div className={cx("text11", "colorMuted")}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search client, owner, billing email" className={cx("formInput", styles.clientsSearchInput)} />
        <select title="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={styles.filterSelect}>
          <option value="ALL">All status</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="CHURNED">Churned</option>
        </select>
        <select title="Filter by tier" value={tierFilter} onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)} className={styles.filterSelect}>
          <option value="ALL">All tiers</option>
          <option value="STARTER">Starter</option>
          <option value="GROWTH">Growth</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
        <select title="Select view mode" value={view} onChange={e => setView(e.target.value as ViewMode)} className={cx(styles.filterSelect, "mlAuto")}>
          <option value="list">List</option>
          <option value="portfolio">Portfolio</option>
        </select>
      </div>

      <div className={styles.clientDetailSplit}>
        <div>
          {view === "list" ? (
            <div className={cx("card", "overflowHidden")}>
              <div className={styles.clientListHead}>
                {["Client", "Tier", "Health", "Projects", "Invoices", "Renewal", "Open"].map((h) => <span key={h}>{h}</span>)}
              </div>
              {filtered.length > 0 ? filtered.map((client) => (
                <div key={client.id} className={cx(styles.clientListRow, styles.clientsListRowPad, client.id === selectedId && styles.clientsRowSelected)}>
                  <div>
                    <div className={cx("text13", "fw700")}>{client.name}</div>
                    <div className={cx("text11", "colorMuted")}>{client.ownerName ?? "Unassigned"}</div>
                  </div>
                  <span className={cx("text11", "colorMuted")}>{client.tier}</span>
                  <span className={cx("fontMono", "fw700", styles.clientsToneText, toneClass(healthColor(client.health)))}>{client.health}</span>
                  <span className={cx("fontMono", "colorMuted")}>{client.projectsCount}</span>
                  <span className={cx("fontMono", styles.clientsToneText, toneClass(client.overdueInvoices > 0 ? "var(--red)" : "var(--muted)"))}>{client.invoicesCount}</span>
                  <span className={cx("fontMono", styles.clientsToneText, toneClass(client.renewalDays !== null && client.renewalDays <= 30 ? "var(--amber)" : "var(--muted)"))}>{client.renewalDays === null ? "Not set" : `${client.renewalDays}d`}</span>
                  <button type="button" onClick={() => setSelectedId(client.id)} className={cx("btnSm", "btnGhost")}>Open</button>
                </div>
              )) : <div className={cx("p20", "colorMuted", "text12")}>No clients match current filters.</div>}
            </div>
          ) : (
            <div className={cx("grid2", "gap12")}>
              {filtered.map((client) => (
                <div key={client.id} className={cx(styles.card, styles.clientsPortfolioCard, client.id === selectedId && styles.clientsPortfolioCardSelected)}>
                  <div className={cx("flexBetween", "mb6")}>
                    <div className={cx("text14", "fw700")}>{client.name}</div>
                    <span className={cx("fontMono", "fw700", styles.clientsToneText, toneClass(healthColor(client.health)))}>{client.health}</span>
                  </div>
                  <div className={cx("text11", "colorMuted", "mb10")}>{client.tier} &middot; {client.status} &middot; {client.ownerName ?? "Unassigned"}</div>
                  <div className={cx("grid2", "gap8", "mb10")}>
                    <div className={cx("bgBg", "borderDefault", styles.clientsMiniCard)}>
                      <div className={cx("textXs", "colorMuted", "uppercase", "mb3")}>Projects</div>
                      <div className={cx("fontMono")}>{client.projectsCount}</div>
                    </div>
                    <div className={cx("bgBg", "borderDefault", styles.clientsMiniCard)}>
                      <div className={cx("textXs", "colorMuted", "uppercase", "mb3")}>Overdue Invoices</div>
                      <div className={cx("fontMono", styles.clientsToneText, toneClass(client.overdueInvoices > 0 ? "var(--red)" : "var(--accent)"))}>{client.overdueInvoices}</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelectedId(client.id)} className={cx("btnSm", "btnGhost")}>Open Account</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cx("card", "p16")}>
          <div className={cx("flexBetween", "mb12")}>
            <div className={cx("text12", "fw700")}>Account Detail</div>
            <span className={cx("fontMono", "text10", "colorMuted")}>{selected?.id.slice(0, 8) ?? "No account"}</span>
          </div>
          {selected ? (
            <>
              <div className={cx("fw800", "mb4", styles.clientsDetailTitle)}>{selected.name}</div>
              <div className={cx("text12", "colorMuted", "mb12")}>{selected.tier} &middot; {selected.status} &middot; Owner: {selected.ownerName ?? "Unassigned"}</div>

              <div className={cx("grid2", "gap8", "mb12")}>
                {[
                  { label: "Health", value: String(selected.health), color: healthColor(selected.health) },
                  { label: "Renewal", value: selected.renewalDays === null ? "Not set" : `${selected.renewalDays}d`, color: selected.renewalDays !== null && selected.renewalDays <= 30 ? "var(--amber)" : "var(--muted)" },
                  { label: "Outstanding", value: money(selected.outstandingInvoiced, "ZAR"), color: selected.outstandingInvoiced > 0 ? "var(--red)" : "var(--accent)" },
                  { label: "Paid", value: money(selected.paidInvoiced, "ZAR"), color: "var(--accent)" }
                ].map((m) => (
                  <div key={m.label} className={cx("bgBg", "borderDefault", styles.clientsMetricCard)}>
                    <div className={cx("textXs", "colorMuted", "uppercase", "mb4")}>{m.label}</div>
                    <div className={cx("fontMono", "fw700", styles.clientsToneText, toneClass(m.color))}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div className={cx("text11", "colorMuted", "mb4")}>Billing Contact</div>
              <div className={cx("bgBg", "borderDefault", "text12", "mb10", styles.clientsInfoBlock)}>{selected.billingEmail ?? "Not set"}</div>

              <div className={cx("text11", "colorMuted", "mb4")}>Contract Renewal Date</div>
              <div className={cx("bgBg", "borderDefault", "text12", "mb10", styles.clientsInfoBlock)}>{formatDate(selected.contractRenewalAt)}</div>

              <div className={cx("flexRow", "gap8", "flexWrap")}>
                <button type="button" className={cx("btnSm", "btnAccent")}>Open Full Account</button>
                <button type="button" className={cx("btnSm", "btnGhost")}>Log Health Intervention</button>
                <button type="button" className={cx("btnSm", "btnGhost")}>Send Renewal Reminder</button>
              </div>
            </>
          ) : (
            <div className={cx("colorMuted", "text12")}>Select a client to view account details.</div>
          )}
        </div>
      </div>

      <div className={cx("card", "mt16")}>
        <div className={cx("borderB", "fw700", "text12", styles.clientsRenewalTitle)}>Renewal Queue (next 45 days)</div>
        <div className={styles.renewalHead}>
          {[
            "Client", "Health", "Renewal", "Outstanding", "Next Action"
          ].map((h) => <span key={h}>{h}</span>)}
        </div>
        {filtered
          .filter((client) => client.renewalDays !== null && client.renewalDays <= 45)
          .sort((a, b) => (a.renewalDays ?? 999) - (b.renewalDays ?? 999))
          .map((client) => (
            <div key={client.id} className={styles.renewalRow}>
              <span className={cx("text12", "fw700")}>{client.name}</span>
              <span className={cx("fontMono", styles.clientsToneText, toneClass(healthColor(client.health)))}>{client.health}</span>
              <span className={cx("fontMono", styles.clientsToneText, toneClass((client.renewalDays ?? 999) <= 14 ? "var(--red)" : "var(--amber)"))}>{client.renewalDays}d</span>
              <span className={cx("fontMono", styles.clientsToneText, toneClass(client.outstandingInvoiced > 0 ? "var(--red)" : "var(--accent)"))}>{money(client.outstandingInvoiced, "ZAR")}</span>
              <span className={cx("text11", "colorMuted")}>{client.health < 60 ? "Exec check-in + rescue plan" : "Send renewal pack + confirm scope"}</span>
            </div>
          ))}
      </div>

      <div className={cx("mt16", "text10", "colorMuted", "fontMono")}>
        Signed in as {session?.user.email ?? "Unknown"}
      </div>
    </div>
  );
}
