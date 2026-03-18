import styles from "../../../app/style/landing-reference.module.css";

export function HeroSection() {
  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.heroGridLines} />
      <div className={styles.heroOrb} />
      <div className={styles.heroOrb2} />

      <div className={`${styles.heroFloatingIcon} ${styles.heroIconCode}`} aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" /></svg>
      </div>
      <div className={`${styles.heroFloatingIcon} ${styles.heroIconRobot}`} aria-hidden="true">
        <svg viewBox="0 0 24 24"><rect x="5" y="7" width="14" height="11" rx="3" /><circle cx="9.5" cy="12" r="1" /><circle cx="14.5" cy="12" r="1" /><path d="M12 4v3M9 15h6" /></svg>
      </div>
      <div className={`${styles.heroFloatingIcon} ${styles.heroIconDatabase}`} aria-hidden="true">
        <svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="6" ry="2.5" /><path d="M6 5v8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5" /></svg>
      </div>
      <div className={`${styles.heroFloatingIcon} ${styles.heroIconKeyboard}`} aria-hidden="true">
        <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M7 11h1M10 11h1M13 11h1M16 11h1M7 14h10" /></svg>
      </div>

      <div className={styles.heroTerminal} aria-hidden="true">
        <div className={styles.terminalHead}>
          <span className={styles.terminalDot} />
          <span className={styles.terminalDot} />
          <span className={styles.terminalDot} />
          <span className={styles.terminalTitle}>maphari-terminal</span>
        </div>
        <div className={styles.terminalBody}>
          <div className={styles.terminalLine}><span className={styles.cmd}>$</span> deploy --target web-platform</div>
          <div className={styles.terminalLine}><span className={styles.dim}>✔ Build completed in 42s</span></div>
          <div className={styles.terminalLine}><span className={styles.cmd}>$</span> automate leads --sync crm</div>
          <div className={styles.terminalLine}><span className={styles.dim}>✔ Workflow active: lead_to_sales_pipeline</span></div>
          <div className={styles.terminalLine}><span className={styles.cmd}>$</span> monitor --env production</div>
          <div className={styles.terminalLine}><span className={styles.dim}>✓ Uptime 99.98% | latency stable</span></div>
        </div>
      </div>

      <p className={styles.heroEyebrow}>Web Development • Mobile Apps • Mobile Design • Web Design • Automation</p>
      <h1 className={styles.heroTitle}>Websites, mobile apps, and automation <em>built for growth</em>.</h1>
      <h2 className={styles.heroSubtitle}>Designed to convert better, operate faster, and scale reliably.</h2>
      <div className={styles.heroBottom}>
        <p className={styles.heroSub}>
          I design and build high-performance websites, mobile apps, and automation workflows that improve lead conversion,
          reduce manual work, and help your business deliver faster.
        </p>
        <div className={styles.heroActions}>
          <a href="#contact" className={styles.btnPrimary}>Get Your Roadmap</a>
          <a href="#proof" className={styles.btnGhost}>View Outcomes</a>
        </div>
        <p className={styles.heroTrustStrip}>
          40+ Projects <span className={styles.heroTrustSep}>·</span> 98% Retention <span className={styles.heroTrustSep}>·</span> 10wk Avg Launch
        </p>
      </div>
    </section>
  );
}
