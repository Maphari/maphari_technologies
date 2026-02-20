import type { AdminLead, LeadPipelineStatus } from "../../lib/api/admin";
import styles from "../../app/style/admin.module.css";

const leadColumns: Array<{ status: LeadPipelineStatus; label: string }> = [
  { status: "NEW", label: "New" },
  { status: "CONTACTED", label: "Contacted" },
  { status: "QUALIFIED", label: "Qualified" },
  { status: "PROPOSAL", label: "Proposal" },
  { status: "WON", label: "Won" },
  { status: "LOST", label: "Lost" }
];

function nextStatuses(current: LeadPipelineStatus): LeadPipelineStatus[] {
  switch (current) {
    case "NEW":
      return ["CONTACTED", "QUALIFIED"];
    case "CONTACTED":
      return ["QUALIFIED", "LOST"];
    case "QUALIFIED":
      return ["PROPOSAL", "LOST"];
    case "PROPOSAL":
      return ["WON", "LOST"];
    case "WON":
      return [];
    case "LOST":
      return [];
    default:
      return [];
  }
}

interface AdminLeadsBoardProps {
  leads: AdminLead[];
  transitioningLeadId: string | null;
  onMoveLead: (leadId: string, nextStatus: LeadPipelineStatus) => Promise<void>;
}

export function AdminLeadsBoard({ leads, transitioningLeadId, onMoveLead }: AdminLeadsBoardProps) {
  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <h2>Leads Pipeline</h2>
        <p>Move leads between stages. Updates persist through gateway/core APIs.</p>
      </header>
      <div className={styles.pipelineGrid}>
        {leadColumns.map((column) => {
          const items = leads.filter((lead) => lead.status === column.status);

          return (
            <article key={column.status} className={styles.pipelineColumn}>
              <h3>
                {column.label}
                <span>{items.length}</span>
              </h3>
              {items.length === 0 ? <p className={styles.empty}>No leads in this stage.</p> : null}
              {items.map((lead) => (
                <div key={lead.id} className={styles.pipelineCard}>
                  <p>{lead.title}</p>
                  <small>{lead.source ?? "Unknown source"}</small>
                  <div className={styles.pipelineActions}>
                    {nextStatuses(lead.status).map((statusOption) => (
                      <button
                        key={statusOption}
                        type="button"
                        className={styles.pipelineMove}
                        disabled={transitioningLeadId === lead.id}
                        onClick={() => void onMoveLead(lead.id, statusOption)}
                      >
                        {transitioningLeadId === lead.id ? "Saving..." : `Move to ${statusOption}`}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </article>
          );
        })}
      </div>
    </section>
  );
}
