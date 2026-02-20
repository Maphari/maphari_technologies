import styles from "../../../app/style/landing-reference.module.css";
import { faqs } from "./data";

type FaqSectionProps = {
  openFaq: number;
  setOpenFaq: (value: number) => void;
};

export function FaqSection({ openFaq, setOpenFaq }: FaqSectionProps) {
  return (
    <section id="faq" className={styles.faqSection}>
      <div className={styles.faqLayout}>
        <div className={`${styles.faqSticky} ${styles.reveal}`}>
          <p className={styles.sectionLabel}>FAQ</p>
          <h2 className={styles.sectionTitle}>Common <em>decision-stage</em> questions</h2>
          <p className={styles.faqLead}>Quick answers before booking a consultation.</p>
        </div>

        <div className={`${styles.faqList} ${styles.reveal}`}>
          {faqs.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <article key={item.q} className={`${styles.faqItem} ${isOpen ? styles.open : ""}`}>
                <button className={styles.faqQ} onClick={() => setOpenFaq(isOpen ? -1 : index)}>
                  {item.q}
                  <span className={styles.faqIcon}>+</span>
                </button>
                <div className={styles.faqA}>
                  <div className={styles.faqAInner}>{item.a}</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
