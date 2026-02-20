import type { Snapshot } from "../../lib/api/gateway";
import styles from "../../app/style/workspace.module.css";

interface DataPanelsProps {
  snapshot: Snapshot;
}

export function DataPanels({ snapshot }: DataPanelsProps) {
  return (
    <section className={styles.tables}>
      <div className={styles.tableCard}>
        <h3>Recent Projects</h3>
        {snapshot.projects.length === 0 ? <p>No projects found.</p> : null}
        {snapshot.projects.slice(0, 8).map((project) => (
          <div key={project.id} className={styles.row}>
            <span>{project.name}</span>
            <span>{project.status}</span>
          </div>
        ))}
      </div>
      <div className={styles.tableCard}>
        <h3>Recent Leads</h3>
        {snapshot.leads.length === 0 ? <p>No leads found.</p> : null}
        {snapshot.leads.slice(0, 8).map((lead) => (
          <div key={lead.id} className={styles.row}>
            <span>{lead.title}</span>
            <span>{lead.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
