"use client";

import Link from "next/link";
import { AdminPageHeader, AdminSectionCard } from "../../../components/admin/admin-primitives";
import styles from "../../style/admin.module.css";

const systemSections = [
  { href: "/admin/notifications", title: "Notifications", description: "Provider routing, retries, and delivery jobs." },
  { href: "/admin/integrations", title: "Integrations", description: "Connected tools, API keys, and sync health." },
  { href: "/admin/security", title: "Security", description: "Access controls, policies, and incident monitoring." },
  { href: "/admin/audit", title: "Audit Log", description: "Trace admin actions and operational events." }
];

export default function AdminSettingsPage() {
  return (
    <section className={styles.dashboard}>
      <AdminPageHeader title="Settings" subtitle="Configure admin workspace defaults and operational preferences." />
      <AdminSectionCard
        title="System Settings"
        subtitle="Manage secondary admin areas from one place."
      >
        <div className={styles.settingsGrid}>
          {systemSections.map((section) => (
            <Link key={section.href} href={section.href} className={styles.settingsLinkCard}>
              <strong>{section.title}</strong>
              <p>{section.description}</p>
            </Link>
          ))}
        </div>
      </AdminSectionCard>
    </section>
  );
}
