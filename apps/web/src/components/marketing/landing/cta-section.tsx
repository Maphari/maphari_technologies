import styles from "../../../app/style/landing-reference.module.css";

export function CtaSection() {
  return (
    <section id="cta" className={styles.cta}>
      <div className={`${styles.ctaInner} ${styles.reveal}`}>
        <div>
          <p className={styles.ctaLabel}>Next Step</p>
          <h2 className={styles.ctaTitle}>Ready to move from <em>idea</em> to delivery?</h2>
        </div>
        <div className={styles.ctaActions}>
          <a href="#contact" className={styles.btnCtaDark}>Book Consultation</a>
          <a href="#proof" className={styles.btnCtaGhost}>Review Outcomes</a>
        </div>
      </div>
    </section>
  );
}
