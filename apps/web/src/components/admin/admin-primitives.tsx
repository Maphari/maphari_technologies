import styles from "../../app/style/admin.module.css";

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className={styles.pageHeaderActions}>{actions}</div> : null}
    </header>
  );
}

interface AdminSectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AdminSectionCard({ title, subtitle, children }: AdminSectionCardProps) {
  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

interface AdminEmptyStateProps {
  message: string;
}

export function AdminEmptyState({ message }: AdminEmptyStateProps) {
  return <p className={styles.empty}>{message}</p>;
}
