"use client";

import { useMemo } from "react";
import { AdminPageHeader, AdminSectionCard, AdminEmptyState } from "../../../components/admin/admin-primitives";
import { useAdminWorkspaceContext } from "../../../components/admin/admin-workspace-context";
import styles from "../../style/admin.module.css";

export default function AdminAuditPage() {
  const { snapshot, loading } = useAdminWorkspaceContext();

  const entries = useMemo(() => {
    const clients = snapshot.clients.map((client) => ({
      id: `client:${client.id}`,
      when: client.updatedAt,
      domain: "Client",
      action: client.status,
      subject: client.name
    }));

    const projects = snapshot.projects.map((project) => ({
      id: `project:${project.id}`,
      when: project.updatedAt,
      domain: "Project",
      action: project.status,
      subject: project.name
    }));

    const leads = snapshot.leads.map((lead) => ({
      id: `lead:${lead.id}`,
      when: lead.updatedAt,
      domain: "Lead",
      action: lead.status,
      subject: lead.title
    }));

    return [...clients, ...projects, ...leads]
      .sort((a, b) => Date.parse(b.when) - Date.parse(a.when))
      .slice(0, 30);
  }, [snapshot.clients, snapshot.leads, snapshot.projects]);

  return (
    <section className={styles.dashboard}>
      <AdminPageHeader title="Audit Log" subtitle="Recent cross-domain activity for operational review." />
      <AdminSectionCard title="Activity Feed" subtitle="Latest updates in clients, projects, and leads.">
        {loading ? <AdminEmptyState message="Loading activity..." /> : null}
        {!loading && entries.length === 0 ? <AdminEmptyState message="No activity found." /> : null}
        {!loading && entries.length > 0 ? (
          <div className={styles.table}>
            <div className={styles.tableRowHead}>
              <span>When</span>
              <span>Domain</span>
              <span>Action</span>
              <span>Subject</span>
            </div>
            {entries.map((entry) => (
              <div key={entry.id} className={styles.tableRow}>
                <span>{new Date(entry.when).toLocaleString()}</span>
                <span>{entry.domain}</span>
                <span>{entry.action}</span>
                <span>{entry.subject}</span>
              </div>
            ))}
          </div>
        ) : null}
      </AdminSectionCard>
    </section>
  );
}
