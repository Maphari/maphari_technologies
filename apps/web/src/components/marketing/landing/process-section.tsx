import styles from "../../../app/style/landing-reference.module.css";
import { processSteps } from "./data";

export function ProcessSection() {
  return (
    <section id="process" className={styles.processSection}>
      <div className={styles.processLayout}>
        <div className={styles.processSticky}>
          <div className={styles.reveal}>
            <p className={styles.sectionLabel}>Process</p>
            <h2 className={styles.sectionTitle}>Clear rhythm from <em>scope</em> to production</h2>
            <p className={styles.processSub}>Each phase is built to reduce risk, improve clarity, and keep decision-making fast.</p>
            <a href="#contact" className={styles.btnPrimary}>Start With Strategy Call</a>
          </div>
        </div>

        <div className={`${styles.processSteps} ${styles.reveal}`}>
          {processSteps.map((step) => (
            <article key={step.num} className={styles.processStep}>
              <span className={styles.stepNum}>{step.num}</span>
              <div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
