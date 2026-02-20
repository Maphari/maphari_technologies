"use client";

import { AdminPageHeader, AdminSectionCard } from "../../../components/admin/admin-primitives";
import styles from "../../style/admin.module.css";

export default function AdminAutomationPage() {
  return (
    <section className={styles.dashboard}>
      <AdminPageHeader title="Automation" subtitle="Monitor trigger health, retries, and workflow outcomes." />
      <AdminSectionCard
        title="Workflow Operations"
        subtitle="Next phase: wire automation service job history and failure retries into this view."
      >
        <p className={styles.empty}>Automation dashboards are scaffolded and ready for endpoint wiring.</p>
      </AdminSectionCard>
    </section>
  );
}
