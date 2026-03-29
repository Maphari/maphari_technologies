"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { EmptyState, colorClass as toneClass, formatDateTime } from "./admin-page-utils";
import { cx, styles } from "../style";
import { loadAuditEventsWithRefresh, type AdminAuditEvent } from "../../../../lib/api/admin/governance";
import { saveSession } from "../../../../lib/auth/session";

type AuditDomain = "Client" | "Project" | "Lead" | "Invoice" | "Payment";
type TimeFilter = "all" | "24h" | "7d" | "30d";

type AuditEntry = {
  id: string;
  when: string;
  domain: AuditDomain;
  action: string;
  subject: string;
  detail: string;
  tone: string;
};

function mapApiEventToEntry(event: AdminAuditEvent): AuditEntry {
  const resourceType = event.resourceType ?? "System";
  // Map resourceType to AuditDomain
  const domainMap: Record<string, AuditDomain> = {
    Client: "Client",
    Project: "Project",
    Lead: "Lead",
    Invoice: "Invoice",
    Payment: "Payment",
  };
  const domain = (domainMap[resourceType] ?? "Client") as AuditDomain;

  // Determine tone from action keyword
  const action = event.action ?? "";
  let tone = "var(--blue)";
  if (action.toLowerCase().includes("delet") || action.toLowerCase().includes("fail") || action.toLowerCase().includes("error")) tone = "var(--red)";
  else if (action.toLowerCase().includes("creat") || action.toLowerCase().includes("complet") || action.toLowerCase().includes("paid")) tone = "var(--accent)";
  else if (action.toLowerCase().includes("updat") || action.toLowerCase().includes("modif")) tone = "var(--amber)";

  return {
    id: `api:${event.id}`,
    when: event.createdAt,
    domain,
    action: event.action,
    subject: event.resourceId ? `${resourceType} #${event.resourceId.slice(0, 8)}` : resourceType,
    detail: [event.actorName, event.details].filter(Boolean).join(" · ") || "System event",
    tone,
  };
}

export function AdminAuditPageClient() {
  const { snapshot, loading, session } = useAdminWorkspaceContext();
  const [domainFilter, setDomainFilter] = useState<"all" | AuditDomain>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");
  const [query, setQuery] = useState("");
  const [apiEvents, setApiEvents] = useState<AdminAuditEvent[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setApiLoading(true);
    loadAuditEventsWithRefresh(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (!result.error && result.data) {
        setApiEvents(result.data);
      }
      setApiLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  const entries = useMemo<AuditEntry[]>(() => {
    const clientsById = new Map(snapshot.clients.map((client) => [client.id, client.name]));

    const clients: AuditEntry[] = snapshot.clients.map((client) => ({
      id: `client:${client.id}`,
      when: client.updatedAt,
      domain: "Client",
      action: `Status ${client.status.replaceAll("_", " ")}`,
      subject: client.name,
      detail: `${client.tier} · ${client.ownerName ?? "Unassigned owner"}`,
      tone: ["CHURNED", "PAUSED"].includes(client.status) ? "var(--red)" : "var(--accent)"
    }));

    const projects: AuditEntry[] = snapshot.projects.map((project) => ({
      id: `project:${project.id}`,
      when: project.updatedAt,
      domain: "Project",
      action: `Status ${project.status.replaceAll("_", " ")}`,
      subject: project.name,
      detail: `${clientsById.get(project.clientId) ?? "Unknown client"} · ${project.progressPercent}% progress`,
      tone: project.riskLevel === "HIGH" ? "var(--red)" : project.riskLevel === "MEDIUM" ? "var(--amber)" : "var(--blue)"
    }));

    const leads: AuditEntry[] = snapshot.leads.map((lead) => ({
      id: `lead:${lead.id}`,
      when: lead.updatedAt,
      domain: "Lead",
      action: `Stage ${lead.status.replaceAll("_", " ")}`,
      subject: lead.title,
      detail: `${lead.company ?? "Unknown company"} · ${lead.ownerName ?? "Unassigned owner"}`,
      tone: lead.status === "LOST" ? "var(--red)" : lead.status === "WON" ? "var(--accent)" : "var(--amber)"
    }));

    const invoices: AuditEntry[] = snapshot.invoices.map((invoice) => ({
      id: `invoice:${invoice.id}`,
      when: invoice.updatedAt,
      domain: "Invoice",
      action: `Status ${invoice.status.replaceAll("_", " ")}`,
      subject: invoice.number,
      detail: `${clientsById.get(invoice.clientId) ?? "Unknown client"} · ${formatMoneyCents(invoice.amountCents, { currency: invoice.currency, maximumFractionDigits: 0 })}`,
      tone: invoice.status === "OVERDUE" ? "var(--red)" : invoice.status === "PAID" ? "var(--accent)" : "var(--amber)"
    }));

    const payments: AuditEntry[] = snapshot.payments.map((payment) => ({
      id: `payment:${payment.id}`,
      when: payment.updatedAt,
      domain: "Payment",
      action: `Status ${payment.status.replaceAll("_", " ")}`,
      subject: payment.transactionRef ?? payment.id.slice(0, 8).toUpperCase(),
      detail: `${clientsById.get(payment.clientId) ?? "Unknown client"} · ${formatMoneyCents(payment.amountCents, { maximumFractionDigits: 0 })}`,
      tone: payment.status === "FAILED" ? "var(--red)" : payment.status === "PENDING" ? "var(--amber)" : "var(--blue)"
    }));

    const apiEntries = apiEvents.map(mapApiEventToEntry);
    const combined = [...clients, ...projects, ...leads, ...invoices, ...payments, ...apiEntries];

    // Deduplicate by id (API events don't collide with snapshot since prefixed with "api:")
    const seen = new Set<string>();
    const deduped = combined.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    return deduped
      .sort((a, b) => Date.parse(b.when) - Date.parse(a.when))
      .slice(0, 200);
  }, [snapshot.clients, snapshot.invoices, snapshot.leads, snapshot.payments, snapshot.projects, apiEvents]);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const now = Date.now();
    const cutoff = timeFilter === "all"
      ? 0
      : now - (timeFilter === "24h" ? 24 : timeFilter === "7d" ? 7 * 24 : 30 * 24) * 60 * 60 * 1000;

    return entries.filter((entry) => {
      if (domainFilter !== "all" && entry.domain !== domainFilter) return false;
      if (timeFilter !== "all") {
        const timestamp = Date.parse(entry.when);
        if (Number.isNaN(timestamp) || timestamp < cutoff) return false;
      }
      if (!normalized) return true;
      return (
        entry.subject.toLowerCase().includes(normalized) ||
        entry.action.toLowerCase().includes(normalized) ||
        entry.domain.toLowerCase().includes(normalized) ||
        entry.detail.toLowerCase().includes(normalized)
      );
    });
  }, [domainFilter, entries, query, timeFilter]);

  const stats = useMemo(() => {
    const last24h = entries.filter((entry) => Date.now() - Date.parse(entry.when) <= 24 * 60 * 60 * 1000).length;
    const highPriority = entries.filter((entry) => entry.tone === "var(--red)").length;
    const domainsActive = new Set(entries.map((entry) => entry.domain)).size;
    return { total: entries.length, last24h, highPriority, domainsActive };
  }, [entries]);

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / AUDIT LOG</div>
          <h1 className={styles.pageTitle}>Audit Log</h1>
          <div className={styles.pageSub}>Cross-domain operational events from clients, projects, leads, invoices, and payments.</div>
        </div>
        <button
          type="button"
          className={cx("btnSm", "btnGhost")}
          onClick={() => {
            const rows = [["When", "Domain", "Action", "Subject", "Detail"], ...filteredEntries.map((entry) => [formatDateTime(entry.when), entry.domain, entry.action, entry.subject, entry.detail])];
            const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, "\"\"")}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "admin-audit-log.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
        >
          Export CSV
        </button>
      </div>

      <div className={cx("topCardsStack")}>
        {[
          { label: "Total Events", value: stats.total.toString(), sub: "Tracked domains", color: "var(--accent)" },
          { label: "Last 24 Hours", value: stats.last24h.toString(), sub: "Recent updates", color: "var(--blue)" },
          { label: "High Priority", value: stats.highPriority.toString(), sub: "Needs review", color: stats.highPriority > 0 ? "var(--red)" : "var(--accent)" },
          { label: "Domains Active", value: stats.domainsActive.toString(), sub: "Cross-domain coverage", color: "var(--purple)" }
        ].map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={cx(styles.statValue, toneClass(stat.color))}>{stat.value}</div>
            <div className={cx("text11", "colorMuted")}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Filter by domain" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value as "all" | AuditDomain)} className={styles.filterSelect}>
          <option value="all">All domains</option>
          <option value="Client">Client</option>
          <option value="Project">Project</option>
          <option value="Lead">Lead</option>
          <option value="Invoice">Invoice</option>
          <option value="Payment">Payment</option>
        </select>
        <select title="Filter by time" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as TimeFilter)} className={styles.filterSelect}>
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7d</option>
          <option value="30d">Last 30d</option>
          <option value="all">All time</option>
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search action, subject, domain"
          className={cx("formInput", "wFull")}
        />
      </div>

      <div className={cx("card", "overflowHidden")}>
        <div className={styles.accessAuditHead}>
          <span>When</span>
          <span>Domain</span>
          <span>Action</span>
          <span>Subject</span>
          <span>Detail</span>
        </div>

        {(loading || apiLoading) ? (
          <div className={cx("p20")}>
            <EmptyState title="Loading activity..." subtitle="Fetching latest audit events." compact />
          </div>
        ) : null}

        {!loading && !apiLoading && filteredEntries.length === 0 ? (
          <div className={cx("p20")}>
            <EmptyState title="No audit events found" subtitle="Try widening your filters or clearing search." compact />
          </div>
        ) : null}

        {!loading && !apiLoading && filteredEntries.length > 0 ? (
          <>
            {filteredEntries.map((entry, index) => (
              <div key={entry.id} className={cx(styles.accessAuditRow, index === filteredEntries.length - 1 && styles.accessAuditRowLast)}>
                <span className={cx("text11", "fontMono", "colorMuted")}>{formatDateTime(entry.when)}</span>
                <span className={cx("text11", "fontMono", "colorMuted")}>{entry.domain}</span>
                <span className={styles.accessAuditType} style={{ "--_tone": entry.tone } as CSSProperties}>
                  {entry.action}
                </span>
                <span className={cx("text12", "fw600")}>{entry.subject}</span>
                <span className={cx("text11", "colorMuted")}>{entry.detail}</span>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
