import styles from "../../../app/style/landing-reference.module.css";

export function ProofSection() {
  return (
    <section id="proof" className={styles.proofSection}>
      <div className={styles.reveal}>
        <p className={styles.sectionLabel}>Proof</p>
        <h2 className={styles.sectionTitle}>Operational outcomes, <em>not</em> vanity claims</h2>
        <p className={styles.sectionIntro}>Real changes in delivery speed, support burden, and execution reliability.</p>
      </div>

      <div className={`${styles.proofGrid} ${styles.reveal}`}>
        <article className={styles.proofCard}>
          <span className={styles.proofTag}>Case Study 01</span>
          <h3 className={styles.proofTitle}>Lead Pipeline Rebuild</h3>
          <div className={styles.proofComparison}>
            <div className={styles.proofBefore}><span className={styles.proofLabel}>Before</span>Strong traffic, weak handoff from website to sales.</div>
            <div className={styles.proofAfter}><span className={styles.proofLabel}>After</span>Redesigned funnel + automation improved qualification and follow-up speed significantly.</div>
          </div>
        </article>
        <article className={styles.proofCard}>
          <span className={styles.proofTag}>Case Study 02</span>
          <h3 className={styles.proofTitle}>Client Portal Modernization</h3>
          <div className={styles.proofComparison}>
            <div className={styles.proofBefore}><span className={styles.proofLabel}>Before</span>Legacy UX caused repeated support escalations and client confusion.</div>
            <div className={styles.proofAfter}><span className={styles.proofLabel}>After</span>Clearer workflows improved adoption and reduced support load measurably.</div>
          </div>
        </article>
      </div>
    </section>
  );
}
