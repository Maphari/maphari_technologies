import { FormEvent } from "react";
import styles from "../../../app/style/landing-reference.module.css";

type ContactSectionProps = {
  sent: boolean;
  loading: boolean;
  error: string | null;
  startedAtIso: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ContactSection({ sent, loading, error, startedAtIso, onSubmit }: ContactSectionProps) {
  return (
    <section id="contact" className={styles.contactSection}>
      <div className={styles.contactLayout}>
        <div className={styles.reveal}>
          <p className={styles.sectionLabel}>Contact</p>
          <h2 className={styles.sectionTitle}>Get a practical roadmap for your <em>next build</em></h2>
          <p className={styles.contactLead}>Tell us what you need and we will return with scope, timeline, and next steps.</p>
          <div className={styles.contactPerks}>
            <div className={styles.contactPerk}><span className={styles.perkDot} />Service-fit call</div>
            <div className={styles.contactPerk}><span className={styles.perkDot} />Scope + timeline recommendation</div>
            <div className={styles.contactPerk}><span className={styles.perkDot} />Execution roadmap</div>
          </div>
        </div>

        <form className={`${styles.contactForm} ${styles.reveal}`} onSubmit={onSubmit}>
          <input type="hidden" name="startedAt" value={startedAtIso} />
          <input type="text" name="company" tabIndex={-1} autoComplete="off" className={styles.honeypot} aria-hidden="true" />
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="name">Name</label>
              <input id="name" name="name" type="text" className={styles.formInput} placeholder="Your name" required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className={styles.formInput} placeholder="you@company.com" required />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="service">Service required</label>
            <select id="service" name="service" className={styles.formSelect} defaultValue="" required>
              <option value="" disabled>Select service</option>
              <option>Web Application</option>
              <option>Mobile System</option>
              <option>Process Automation</option>
              <option>Platform Redesign</option>
              <option>Ongoing Maintenance</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="details">Project details</label>
            <textarea id="details" name="message" className={styles.formTextarea} placeholder="Describe what you're building and where you're stuck..." required />
          </div>
          <button type="submit" className={styles.btnSubmit} disabled={loading}>{loading ? "Sending..." : "Send Request ->"}</button>
          {sent ? <p className={styles.formSent}>Thanks. Your request has been captured.</p> : null}
          {error ? <p className={styles.formError}>{error}</p> : null}
        </form>
      </div>
    </section>
  );
}
