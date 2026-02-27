"use client";

import { styles } from "../style";

export function AdminStubPage({
  title,
  eyebrow,
  subtitle
}: {
  title: string;
  eyebrow: string;
  subtitle: string;
}) {
  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>{eyebrow}</div>
          <div className={styles.projName}>{title}</div>
          <div className={styles.projMeta}>{subtitle}</div>
        </div>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>{title}</span></div>
        <div className={styles.cardInner}>
          <div className={styles.projMeta}>Section added to navigation. Next step is wiring live data/actions for this view.</div>
        </div>
      </article>
    </div>
  );
}
