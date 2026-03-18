import styles from "../../../app/style/landing-reference.module.css";

const ICP_PROFILES = [
  {
    tag: "Profile 01",
    profile: "Growth-stage startup",
    pain: "Scaling faster than your tech stack can handle. Manual ops, no internal dev team, and every new client creates more chaos.",
    solutionLabel: "What we build",
    solution: "Scalable platforms and automation workflows purpose-built for rapid, repeatable growth.",
  },
  {
    tag: "Profile 02",
    profile: "Established SME",
    pain: "Legacy systems costing you clients. Outdated UX, client confusion, and internal tools that were built for a business half the size.",
    solutionLabel: "What we build",
    solution: "Modern rebuilds and platform redesigns that eliminate technical debt without downtime.",
  },
  {
    tag: "Profile 03",
    profile: "Ops-heavy service business",
    pain: "Too much admin, not enough delivery. Manual handoffs, disconnected reporting, and time lost to tasks a system should handle.",
    solutionLabel: "What we build",
    solution: "Automation workflows and client portals that cut operational overhead and surface the right data.",
  },
];

export function IcpSection() {
  return (
    <section className={`${styles.icpSection} ${styles.reveal}`}>
      <div className={`${styles.icpHeader} ${styles.reveal}`}>
        <p className={styles.sectionLabel}>Who we work with</p>
        <h2 className={styles.sectionTitle}>
          Built for businesses <em>running out of runway</em> on manual processes
        </h2>
      </div>

      <div className={`${styles.icpGrid} ${styles.reveal}`}>
        {ICP_PROFILES.map((item) => (
          <article key={item.tag} className={styles.icpCard}>
            <p className={styles.icpCardTag}>{item.tag}</p>
            <h3 className={styles.icpCardProfile}>{item.profile}</h3>
            <p className={styles.icpCardPain}>{item.pain}</p>
            <p className={styles.icpCardSolutionLabel}>{item.solutionLabel}</p>
            <p className={styles.icpCardSolution}>{item.solution}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
