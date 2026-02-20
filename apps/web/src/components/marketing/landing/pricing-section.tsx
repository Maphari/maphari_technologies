import styles from "../../../app/style/landing-reference.module.css";
import { integrations } from "./data";

export function PricingSection() {
  return (
    <section id="pricing" className={styles.pricingSection}>
      <div className={styles.reveal}>
        <p className={styles.sectionLabel}>Pricing + Trust</p>
        <h2 className={styles.sectionTitle}>Flexible engagement, <em>clear</em> risk reduction</h2>
        <p className={styles.sectionIntro}>Choose an engagement mode and scale from there.</p>
      </div>

      <div className={`${styles.pricingGrid} ${styles.reveal}`}>
        <article className={styles.pricingCard}>
          <p className={styles.pricingTier}>Tier 01</p>
          <h3 className={styles.pricingName}>Starter</h3>
          <p className={styles.pricingDesc}>Focused MVP and launch for teams that need to move fast and prove the concept.</p>
          <ul className={styles.pricingFeatures}>
            <li className={styles.pricingFeature}>One core build stream</li>
            <li className={styles.pricingFeature}>Design + development</li>
            <li className={styles.pricingFeature}>Launch handover</li>
          </ul>
          <a href="#contact" className={`${styles.btnPricing} ${styles.btnPricingOutline}`}>Choose Starter</a>
        </article>
        <article className={`${styles.pricingCard} ${styles.featured}`}>
          <p className={styles.pricingTier}>Tier 02 - Popular</p>
          <h3 className={styles.pricingName}>Growth</h3>
          <p className={styles.pricingDesc}>Scale product and operations with multi-stream delivery and deep integrations.</p>
          <ul className={styles.pricingFeatures}>
            <li className={styles.pricingFeature}>Multi-stream delivery</li>
            <li className={styles.pricingFeature}>Integrations + automation</li>
            <li className={styles.pricingFeature}>Priority support</li>
          </ul>
          <a href="#contact" className={`${styles.btnPricing} ${styles.btnPricingDark}`}>Choose Growth</a>
        </article>
        <article className={styles.pricingCard}>
          <p className={styles.pricingTier}>Tier 03</p>
          <h3 className={styles.pricingName}>Partner</h3>
          <p className={styles.pricingDesc}>Long-term product execution for businesses that need a dedicated technical team.</p>
          <ul className={styles.pricingFeatures}>
            <li className={styles.pricingFeature}>Continuous roadmap</li>
            <li className={styles.pricingFeature}>Architecture guidance</li>
            <li className={styles.pricingFeature}>Monthly optimization</li>
          </ul>
          <a href="#contact" className={`${styles.btnPricing} ${styles.btnPricingOutline}`}>Choose Partner</a>
        </article>
      </div>

      <div className={`${styles.trustRow} ${styles.reveal}`}>
        <article className={styles.trustCard}>
          <p className={styles.sectionLabel}>Integrations</p>
          <h3 className={styles.trustTitle}>Works with your existing ecosystem</h3>
          <div className={styles.integrationsTags}>
            {integrations.map((item) => <span key={item} className={styles.integrationTag}>{item}</span>)}
          </div>
        </article>
        <article className={`${styles.trustCard} ${styles.trustCardAccent}`}>
          <p className={`${styles.sectionLabel} ${styles.sectionLabelDark}`}>Security + Reliability</p>
          <h3 className={styles.trustTitleDark}>Built to enterprise standards</h3>
          <ul className={styles.securityList}>
            <li className={styles.securityItemDark}>Role-aware auth and access patterns</li>
            <li className={styles.securityItemDark}>Release process with QA checkpoints</li>
            <li className={styles.securityItemDark}>Performance and stability monitoring</li>
            <li className={styles.securityItemDark}>Defined post-launch maintenance workflows</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
