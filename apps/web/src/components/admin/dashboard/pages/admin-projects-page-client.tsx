"use client";

import { AdminPageHeader, AdminSectionCard, AdminEmptyState } from "../../admin-primitives";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import styles from "@/app/style/admin.module.css";
import { styles as dashboardStyles } from "../style";
import { formatStatus } from "@/lib/utils/format-status";

export function AdminProjectsPageClient() {
  const { snapshot, loading } = useAdminWorkspaceContext();

  return (
    <div className={dashboardStyles.pageBody}>
      <section className={styles.dashboard}>
        <AdminPageHeader title="Projects" subtitle="Monitor delivery status and execution risk." />
        <AdminSectionCard title="Project List" subtitle="Cross-client delivery portfolio.">
          {loading ? <AdminEmptyState message="Loading projects..." /> : null}
          {!loading && snapshot.projects.length === 0 ? <AdminEmptyState message="No projects found." /> : null}
          {!loading && snapshot.projects.length > 0 ? (
            <div className={styles.table}>
              <div className={styles.tableRowHead}>
                <span>Project</span>
                <span>Status</span>
                <span>Client ID</span>
              </div>
              {snapshot.projects.map((project) => (
                <div key={project.id} className={styles.tableRow}>
                  <span>{project.name}</span>
                  <span>{formatStatus(project.status)}</span>
                  <span className={styles.mono}>{project.clientId.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </AdminSectionCard>
      </section>
    </div>
  );
}
