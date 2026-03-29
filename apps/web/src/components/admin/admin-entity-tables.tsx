import { useMemo, useState } from "react";
import type { AdminClient, AdminProject } from "../../lib/api/admin";
import styles from "../../app/style/admin.module.css";
import { formatStatus } from "../../lib/utils/format-status";

type SortDirection = "asc" | "desc";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

function sortRows<T>(
  rows: T[],
  selector: (row: T) => string,
  direction: SortDirection
): T[] {
  const sorted = [...rows].sort((first, second) => selector(first).localeCompare(selector(second)));
  return direction === "asc" ? sorted : sorted.reverse();
}

function statusClass(status: string): string {
  if (["ACTIVE", "COMPLETED", "WON", "PAID"].includes(status)) return styles.statusSuccess;
  if (["OVERDUE", "LOST", "FAILED", "BLOCKED"].includes(status)) return styles.statusDanger;
  if (["PLANNING", "PROPOSAL", "NEW", "CONTACTED", "QUALIFIED", "IN_PROGRESS", "ISSUED"].includes(status)) {
    return styles.statusWarning;
  }
  return "";
}

interface AdminEntityTablesProps {
  clients: AdminClient[];
  projects: AdminProject[];
}

export function AdminEntityTables({ clients, projects }: AdminEntityTablesProps) {
  const [clientSort, setClientSort] = useState<SortDirection>("asc");
  const [projectSort, setProjectSort] = useState<SortDirection>("asc");

  const sortedClients = useMemo(
    () => sortRows(clients, (item) => item.name.toLowerCase(), clientSort),
    [clientSort, clients]
  );
  const sortedProjects = useMemo(
    () => sortRows(projects, (item) => item.name.toLowerCase(), projectSort),
    [projectSort, projects]
  );

  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <h2>Clients & Projects</h2>
        <p>Sortable operational tables for delivery and account management.</p>
      </header>
      <div className={styles.tablesGrid}>
        <article className={styles.tableCard}>
          <div className={styles.tableHead}>
            <h3>Clients</h3>
            <button
              type="button"
              className={styles.sortButton}
              onClick={() => setClientSort((current) => (current === "asc" ? "desc" : "asc"))}
            >
              Sort: {clientSort.toUpperCase()}
            </button>
          </div>
          <div className={styles.table}>
            <div className={styles.tableRowHead}>
              <span>Name</span>
              <span>Status</span>
              <span>Client</span>
              <span>Updated</span>
            </div>
            {sortedClients.length === 0 ? <p className={styles.empty}>No clients found.</p> : null}
            {sortedClients.map((client) => (
              <div key={client.id} className={styles.tableRow}>
                <span>{client.name}</span>
                <span>
                  <i className={`${styles.statusBadge} ${statusClass(client.status)}`}>{formatStatus(client.status)}</i>
                </span>
                <span className={styles.mono}>{client.id.slice(0, 8)}</span>
                <span>{formatDate(client.updatedAt)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.tableCard}>
          <div className={styles.tableHead}>
            <h3>Projects</h3>
            <button
              type="button"
              className={styles.sortButton}
              onClick={() => setProjectSort((current) => (current === "asc" ? "desc" : "asc"))}
            >
              Sort: {projectSort.toUpperCase()}
            </button>
          </div>
          <div className={styles.table}>
            <div className={styles.tableRowHead}>
              <span>Name</span>
              <span>Status</span>
              <span>Client</span>
              <span>Updated</span>
            </div>
            {sortedProjects.length === 0 ? <p className={styles.empty}>No projects found.</p> : null}
            {sortedProjects.map((project) => (
              <div key={project.id} className={styles.tableRow}>
                <span>{project.name}</span>
                <span>
                  <i className={`${styles.statusBadge} ${statusClass(project.status)}`}>{formatStatus(project.status)}</i>
                </span>
                <span className={styles.mono}>{project.clientId.slice(0, 8)}</span>
                <span>{formatDate(project.updatedAt)}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
