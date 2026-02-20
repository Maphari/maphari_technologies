import { useMemo } from "react";
import type { AdminSnapshot } from "../../lib/api/admin";
import styles from "../../app/style/admin.module.css";

interface AuditEntry {
  id: string;
  happenedAt: string;
  domain: string;
  action: string;
  subject: string;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function byDateDesc(first: AuditEntry, second: AuditEntry): number {
  return new Date(second.happenedAt).getTime() - new Date(first.happenedAt).getTime();
}

interface AdminAuditLogProps {
  snapshot: AdminSnapshot;
}

export function AdminAuditLog({ snapshot }: AdminAuditLogProps) {
  const entries = useMemo<AuditEntry[]>(() => {
    const clientEntries = snapshot.clients.map((client) => ({
      id: `client:${client.id}`,
      happenedAt: client.updatedAt,
      domain: "Client",
      action: "Profile updated",
      subject: client.name
    }));
    const projectEntries = snapshot.projects.map((project) => ({
      id: `project:${project.id}`,
      happenedAt: project.updatedAt,
      domain: "Project",
      action: `Status ${project.status}`,
      subject: project.name
    }));
    const leadEntries = snapshot.leads.map((lead) => ({
      id: `lead:${lead.id}`,
      happenedAt: lead.updatedAt,
      domain: "Lead",
      action: `Stage ${lead.status}`,
      subject: lead.title
    }));
    const invoiceEntries = snapshot.invoices.map((invoice) => ({
      id: `invoice:${invoice.id}`,
      happenedAt: invoice.updatedAt,
      domain: "Billing",
      action: `Invoice ${invoice.status}`,
      subject: invoice.number
    }));

    return [...clientEntries, ...projectEntries, ...leadEntries, ...invoiceEntries].sort(byDateDesc).slice(0, 24);
  }, [snapshot]);

  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <h2>Audit Log</h2>
        <p>Cross-domain activity feed generated from gateway resource timestamps.</p>
      </header>
      <div className={styles.table}>
        <div className={styles.tableRowHead}>
          <span>When</span>
          <span>Domain</span>
          <span>Action</span>
          <span>Subject</span>
        </div>
        {entries.length === 0 ? <p className={styles.empty}>No activity found.</p> : null}
        {entries.map((entry) => (
          <div key={entry.id} className={styles.tableRow}>
            <span>{formatDateTime(entry.happenedAt)}</span>
            <span>{entry.domain}</span>
            <span>{entry.action}</span>
            <span>{entry.subject}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
