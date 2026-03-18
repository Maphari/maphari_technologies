// ════════════════════════════════════════════════════════════════════════════
// pricing-section.tsx — Landing page Pricing section
// Contents : Tier cards · Trust row · Feature comparison table
// ════════════════════════════════════════════════════════════════════════════

import styles from "../../../app/style/landing-reference.module.css";
import { integrations } from "./data";

// ── Types ─────────────────────────────────────────────────────────────────────

type CellValue = "check" | "dash" | string;

interface CompareRow {
  feature: string;
  starter: CellValue;
  growth: CellValue;
  partner: CellValue;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const COMPARE_ROWS: CompareRow[] = [
  { feature: "Design + development",     starter: "check", growth: "check", partner: "check" },
  { feature: "Launch handover",          starter: "check", growth: "check", partner: "check" },
  { feature: "Project streams",          starter: "1",     growth: "Multi", partner: "Unlimited" },
  { feature: "Integrations & automation",starter: "dash",  growth: "check", partner: "check" },
  { feature: "Priority support",         starter: "dash",  growth: "check", partner: "check" },
  { feature: "Continuous roadmap",       starter: "dash",  growth: "dash",  partner: "check" },
  { feature: "Architecture guidance",    starter: "dash",  growth: "dash",  partner: "check" },
  { feature: "Monthly optimisation",     starter: "dash",  growth: "dash",  partner: "check" },
  { feature: "Dedicated team capacity",  starter: "dash",  growth: "dash",  partner: "check" },
  { feature: "SLA commitment",           starter: "dash",  growth: "dash",  partner: "check" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Cell({ value }: { value: CellValue }) {
  if (value === "check") return <span className={styles.compareCheck}>✓</span>;
  if (value === "dash")  return <span className={styles.compareDash}>—</span>;
  return <span className={styles.compareValue}>{value}</span>;
}

// ── Component ─────────────────────────────────────────────────────────────────

type PricingSectionProps = {
  onTierSelect?: (service: string) => void;
};

export function PricingSection({ onTierSelect }: PricingSectionProps) {
  function handleSelect(service: string) {
    onTierSelect?.(service);
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section id="pricing" className={styles.pricingSection}>
      {/* Header */}
      <div className={styles.reveal}>
        <p className={styles.sectionLabel}>Pricing + Trust</p>
        <h2 className={styles.sectionTitle}>
          Flexible engagement, <em>clear</em> risk reduction
        </h2>
        <p className={styles.sectionIntro}>Choose an engagement mode and scale from there.</p>
      </div>

      {/* Tier cards */}
      <div className={`${styles.pricingGrid} ${styles.reveal}`}>
        <article className={styles.pricingCard}>
          <p className={styles.pricingTier}>Tier 01</p>
          <h3 className={styles.pricingName}>Starter</h3>
          <p className={styles.pricingDesc}>
            Focused MVP and launch for teams that need to move fast and prove the concept.
          </p>
          <ul className={styles.pricingFeatures}>
            <li className={styles.pricingFeature}>One core build stream</li>
            <li className={styles.pricingFeature}>Design + development</li>
            <li className={styles.pricingFeature}>Launch handover</li>
          </ul>
          <button type="button" className={`${styles.btnPricing} ${styles.btnPricingOutline}`} onClick={() => handleSelect("Web Application")}>
            Choose Starter
          </button>
        </article>

        <article className={`${styles.pricingCard} ${styles.featured}`}>
          <p className={styles.pricingTier}>Tier 02 — Popular</p>
          <h3 className={styles.pricingName}>Growth</h3>
          <p className={styles.pricingDesc}>
            Scale product and operations with multi-stream delivery and deep integrations.
          </p>
          <ul className={styles.pricingFeatures}>
            <li className={styles.pricingFeature}>Multi-stream delivery</li>
            <li className={styles.pricingFeature}>Integrations + automation</li>
            <li className={styles.pricingFeature}>Priority support</li>
          </ul>
          <button type="button" className={`${styles.btnPricing} ${styles.btnPricingDark}`} onClick={() => handleSelect("Process Automation")}>
            Choose Growth
          </button>
        </article>

        <article className={styles.pricingCard}>
          <p className={styles.pricingTier}>Tier 03</p>
          <h3 className={styles.pricingName}>Partner</h3>
          <p className={styles.pricingDesc}>
            Long-term product execution for businesses that need a dedicated technical team.
          </p>
          <ul className={styles.pricingFeatures}>
            <li className={styles.pricingFeature}>Continuous roadmap</li>
            <li className={styles.pricingFeature}>Architecture guidance</li>
            <li className={styles.pricingFeature}>Monthly optimization</li>
          </ul>
          <button type="button" className={`${styles.btnPricing} ${styles.btnPricingOutline}`} onClick={() => handleSelect("Ongoing Maintenance")}>
            Choose Partner
          </button>
        </article>
      </div>

      {/* Trust row */}
      <div className={`${styles.trustRow} ${styles.reveal}`}>
        <article className={styles.trustCard}>
          <p className={styles.sectionLabel}>Integrations</p>
          <h3 className={styles.trustTitle}>Works with your existing ecosystem</h3>
          <div className={styles.integrationsTags}>
            {integrations.map((item) => (
              <span key={item} className={styles.integrationTag}>{item}</span>
            ))}
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

      {/* Comparison table */}
      <div className={`${styles.reveal}`}>
        <div className={styles.compareWrap}>
          {/* Header row */}
          <div className={styles.compareHeaderRow}>
            <div className={styles.compareTierHead}>Features</div>
            <div className={styles.compareTierHead}>Starter</div>
            <div className={`${styles.compareTierHead} ${styles.compareTierHeadFeatured}`}>Growth</div>
            <div className={styles.compareTierHead}>Partner</div>
          </div>

          {/* Feature rows */}
          {COMPARE_ROWS.map((row) => (
            <div key={row.feature} className={styles.compareRow}>
              <div className={styles.compareCell}>
                <span className={styles.compareFeat}>{row.feature}</span>
              </div>
              <div className={styles.compareCell}><Cell value={row.starter} /></div>
              <div className={styles.compareCell}><Cell value={row.growth} /></div>
              <div className={styles.compareCell}><Cell value={row.partner} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
