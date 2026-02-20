"use client";

import { AdminPageHeader, AdminSectionCard, AdminEmptyState } from "../../../components/admin/admin-primitives";
import { useAdminWorkspaceContext } from "../../../components/admin/admin-workspace-context";
import styles from "../../style/admin.module.css";

export default function AdminLeadsPage() {
  const { snapshot, loading, moveLead, transitioningLeadId } = useAdminWorkspaceContext();

  return (
    <section className={styles.dashboard}>
      <AdminPageHeader
        title="Leads"
        subtitle="Track and progress opportunities through your sales pipeline."
      />
      <AdminSectionCard title="Pipeline" subtitle="Move leads across stages.">
        {loading ? <AdminEmptyState message="Loading leads..." /> : null}
        {!loading && snapshot.leads.length === 0 ? <AdminEmptyState message="No leads found." /> : null}
        {!loading && snapshot.leads.length > 0 ? (
          <div className={styles.table}>
            <div className={styles.tableRowHead}>
              <span>Lead</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {snapshot.leads.map((lead) => (
              <div key={lead.id} className={styles.tableRow}>
                <span>{lead.title}</span>
                <span>{lead.status}</span>
                <span>
                  <button
                    type="button"
                    className={styles.sortButton}
                    disabled={transitioningLeadId === lead.id || lead.status === "WON"}
                    onClick={() => void moveLead(lead.id, lead.status === "NEW" ? "CONTACTED" : lead.status === "CONTACTED" ? "QUALIFIED" : lead.status === "QUALIFIED" ? "PROPOSAL" : "WON")}
                  >
                    {transitioningLeadId === lead.id ? "Saving..." : "Advance"}
                  </button>
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </AdminSectionCard>
    </section>
  );
}
