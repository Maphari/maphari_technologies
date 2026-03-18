import Link from "next/link";
import styles from "../../../app/style/landing-reference.module.css";

const SERVICES = [
  "Web Applications",
  "Mobile Systems",
  "Process Automation",
  "Platform Redesign",
  "Ongoing Maintenance",
];

const COMPANY = [
  { label: "About", href: "#hero" },
  { label: "Process", href: "#process" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export function PageFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        {/* Brand */}
        <div>
          <p className={styles.footerLogo}>Maphari Technologies</p>
          <p className={styles.footerTagline}>
            Operational outcomes, not vanity builds.
          </p>
          <p className={styles.footerOrigin}>Based in South Africa 🇿🇦</p>
        </div>

        {/* Services */}
        <div>
          <p className={styles.footerColTitle}>Services</p>
          <ul className={styles.footerColLinks}>
            {SERVICES.map((s) => (
              <li key={s}>
                <a href="#contact">{s}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <p className={styles.footerColTitle}>Company</p>
          <ul className={styles.footerColLinks}>
            {COMPANY.map((c) => (
              <li key={c.label}>
                <a href={c.href}>{c.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Connect */}
        <div>
          <p className={styles.footerColTitle}>Connect</p>
          <ul className={styles.footerColLinks}>
            <li>
              <a href="mailto:hello@maphari.co.za" className={styles.footerEmailLink}>
                hello@maphari.co.za
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/company/maphari-technologies"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn ↗
              </a>
            </li>
            <li>
              <a
                href="https://github.com/maphari"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub ↗
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.footerBar}>
        <p className={styles.footerCopy}>© 2026 Maphari Technologies</p>
        <ul className={styles.footerBarLinks}>
          <li><Link href="/privacy">Privacy</Link></li>
          <li><Link href="/terms">Terms</Link></li>
        </ul>
      </div>
    </footer>
  );
}
