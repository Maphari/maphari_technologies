import type { ReactNode } from "react";

type PageShellProps = {
  active: boolean;
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  cx: (...names: Array<string | false | null | undefined>) => string;
  styles: Record<string, string>;
};

/**
 * Shared page wrapper with editorial header.
 *
 * Provides consistent page structure:
 * - Header with eyebrow, title (Instrument Serif via CSS), subtitle, and action buttons
 * - Scrollable body area
 */
export function PageShell({
  active,
  id,
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  cx,
  styles,
}: PageShellProps) {
  return (
    <section className={cx("page", active && "pageActive")} id={id}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>{eyebrow}</div>
          <div className={styles.pageTitle}>{title}</div>
          {subtitle ? <div className={styles.pageSub}>{subtitle}</div> : null}
        </div>
        {actions ? <div className={styles.headerRight}>{actions}</div> : null}
      </div>
      <div className={styles.pageBody}>
        {children}
      </div>
    </section>
  );
}
