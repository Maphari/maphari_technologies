"use client";

import { AdminPageHeader, AdminSectionCard } from "../../../components/admin/admin-primitives";
import styles from "../../style/admin.module.css";

export default function AdminIntegrationsPage() {
  return (
    <section className={styles.dashboard}>
      <AdminPageHeader title="Integrations" subtitle="Administer partner API keys and external integration state." />
      <AdminSectionCard
        title="Public API Access"
        subtitle="Next phase: wire /public-api/keys and /public-api/projects to this UI."
      >
        <p className={styles.empty}>Integrations page scaffolded for partner key management.</p>
      </AdminSectionCard>
    </section>
  );
}
