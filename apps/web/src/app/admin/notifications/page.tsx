"use client";

import { AdminPageHeader, AdminSectionCard } from "../../../components/admin/admin-primitives";
import styles from "../../style/admin.module.css";

export default function AdminNotificationsPage() {
  return (
    <section className={styles.dashboard}>
      <AdminPageHeader title="Notifications" subtitle="Manage outbound jobs and provider delivery flow." />
      <AdminSectionCard
        title="Notification Queue"
        subtitle="Next phase: connect notifications job endpoints and callbacks."
      >
        <p className={styles.empty}>Notifications management page scaffolded.</p>
      </AdminSectionCard>
    </section>
  );
}
