"use client";

import { AdminPageHeader, AdminSectionCard } from "../../../components/admin/admin-primitives";
import styles from "../../style/admin.module.css";

export default function AdminSecurityPage() {
  return (
    <section className={styles.dashboard}>
      <AdminPageHeader title="Security" subtitle="Track security events, lockouts, and suspicious access activity." />
      <AdminSectionCard
        title="Security Events"
        subtitle="Next phase: add auth incidents and access logs from security automation feeds."
      >
        <p className={styles.empty}>Security monitoring page scaffolded.</p>
      </AdminSectionCard>
    </section>
  );
}
