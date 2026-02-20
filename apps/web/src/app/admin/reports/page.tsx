"use client";

import { AdminPageHeader, AdminSectionCard } from "../../../components/admin/admin-primitives";
import styles from "../../style/admin.module.css";

export default function AdminReportsPage() {
  return (
    <section className={styles.dashboard}>
      <AdminPageHeader title="Reports" subtitle="Operational reports and performance summaries." />
      <AdminSectionCard
        title="Scheduled Reports"
        subtitle="Next phase: add weekly lead, monthly revenue, and retainer summary exports."
      >
        <p className={styles.empty}>Reports workspace scaffolded.</p>
      </AdminSectionCard>
    </section>
  );
}
