import styles from "../../../app/style/landing-reference.module.css";

const PRINCIPLES = [
  {
    title: "Outcome-first scoping",
    desc: "Every project starts with a problem statement, not a feature list. We scope around what changes, not what gets built.",
  },
  {
    title: "Transparent delivery",
    desc: "Live access to progress, timelines, and decisions at every stage. No status meetings required.",
  },
  {
    title: "Built to last",
    desc: "No black-box code. Every system is documented, tested, and fully owned by you on handover.",
  },
];

export function IdentitySection() {
  return (
    <section className={styles.identitySection}>
      <div className={`${styles.identityLayout} ${styles.reveal}`}>
        <div className={styles.identityQuoteWrap}>
          <p className={styles.identityLabel}>How we work</p>
          <p className={styles.identityQuote}>
            "We don't measure success in deliverables. We measure it in the{" "}
            <em>problems you stop having</em>."
          </p>
        </div>

        <div className={styles.identityPrinciples}>
          {PRINCIPLES.map((p) => (
            <div key={p.title} className={styles.principleCard}>
              <p className={styles.principleTitle}>{p.title}</p>
              <p className={styles.principleDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
