"use client";

import { AdminPageHeader, AdminSectionCard, AdminEmptyState } from "../../admin-primitives";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import styles from "@/app/style/admin.module.css";

export function AdminClientsPageClient() {
  const { snapshot, loading } = useAdminWorkspaceContext();

  return (
    <section className={styles.dashboard}>
      <AdminPageHeader title="Clients" subtitle="Manage client accounts and account health." />
      <AdminSectionCard title="Client Directory" subtitle="All client records from core service.">
        {loading ? <AdminEmptyState message="Loading clients..." /> : null}
        {!loading && snapshot.clients.length === 0 ? <AdminEmptyState message="No clients found." /> : null}
        {!loading && snapshot.clients.length > 0 ? (
          <div className={styles.table}>
            <div className={styles.tableRowHead}>
              <span>Name</span>
              <span>Status</span>
              <span>Client ID</span>
            </div>
            {snapshot.clients.map((client) => (
              <div key={client.id} className={styles.tableRow}>
                <span>{client.name}</span>
                <span>{client.status}</span>
                <span className={styles.mono}>{client.id.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </AdminSectionCard>
    </section>
  );
}
