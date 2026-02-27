import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  link?: { label: string; onClick: () => void };
  children: ReactNode;
  styles: Record<string, string>;
};

/**
 * Reusable card shell with optional header (title + link).
 */
export function Card({ title, link, children, styles }: CardProps) {
  return (
    <div className={styles.card}>
      {title ? (
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>{title}</span>
          {link ? (
            <button
              type="button"
              className={styles.cardLink}
              onClick={link.onClick}
            >
              {link.label}
            </button>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
