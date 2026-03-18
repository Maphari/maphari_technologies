"use client";
// ════════════════════════════════════════════════════════════════════════════
// proof-section.tsx — Landing page Proof section
// Contents : Impact stats strip · Case studies · Client testimonials
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import styles from "../../../app/style/landing-reference.module.css";

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "40", suffix: "+", label: "Projects delivered" },
  { value: "98", suffix: "%", label: "Client retention rate" },
  { value: "10", suffix: "wk", label: "Avg. time to launch" },
  { value: "0", suffix: "", label: "Security incidents" },
];

const TESTIMONIALS = [
  {
    quote:
      "Maphari rebuilt our lead pipeline from scratch in 8 weeks. The handoff automation alone saved us 12 hours a week in manual follow-up.",
    name: "Tebogo Dlamini",
    role: "CEO",
    company: "Velocity Brands",
    initials: "TD",
  },
  {
    quote:
      "We had a legacy platform costing us client renewals. Maphari modernised it without a single hour of downtime. Execution was surgical.",
    name: "Amara Osei",
    role: "CTO",
    company: "Nexbridge Financial",
    initials: "AO",
  },
  {
    quote:
      "From scope call to launch in 6 weeks. The client portal they built cut our support tickets by 40% — clients can actually self-serve now.",
    name: "Siya Khumalo",
    role: "Head of Operations",
    company: "Strata Consulting",
    initials: "SK",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseTarget(value: string): number {
  return parseInt(value, 10) || 0;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1800, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active || target === 0) { setCount(target); return; }
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return count;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatItem({ target, suffix, label, active }: { target: number; suffix: string; label: string; active: boolean }) {
  const count = useCountUp(target, 1600, active);
  return (
    <div className={styles.statItem}>
      <p className={styles.statValue}>
        {count}
        <span className={styles.statSuffix}>{suffix}</span>
      </p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProofSection() {
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="proof" className={styles.proofSection}>
      {/* Header */}
      <div className={styles.reveal}>
        <p className={styles.sectionLabel}>Proof</p>
        <h2 className={styles.sectionTitle}>
          Operational outcomes, <em>not</em> vanity claims
        </h2>
        <p className={styles.sectionIntro}>
          Real changes in delivery speed, support burden, and execution reliability.
        </p>
      </div>

      {/* Stats strip */}
      <div ref={statsRef} className={`${styles.statsStrip} ${styles.reveal}`}>
        {STATS.map((s) => {
          const target = parseTarget(s.value);
          return (
            <StatItem key={s.label} target={target} suffix={s.suffix} label={s.label} active={statsVisible} />
          );
        })}
      </div>

      {/* Case studies */}
      <div className={`${styles.proofGrid} ${styles.reveal}`}>
        <article className={styles.proofCard}>
          <span className={styles.proofTag}>Case Study 01</span>
          <h3 className={styles.proofTitle}>Lead Pipeline Rebuild</h3>
          <div className={styles.proofComparison}>
            <div className={styles.proofBefore}>
              <span className={styles.proofLabel}>Before</span>
              Strong traffic, weak handoff from website to sales.
            </div>
            <div className={styles.proofAfter}>
              <span className={styles.proofLabel}>After</span>
              Redesigned funnel + automation improved qualification and follow-up speed significantly.
            </div>
          </div>
        </article>
        <article className={styles.proofCard}>
          <span className={styles.proofTag}>Case Study 02</span>
          <h3 className={styles.proofTitle}>Client Portal Modernization</h3>
          <div className={styles.proofComparison}>
            <div className={styles.proofBefore}>
              <span className={styles.proofLabel}>Before</span>
              Legacy UX caused repeated support escalations and client confusion.
            </div>
            <div className={styles.proofAfter}>
              <span className={styles.proofLabel}>After</span>
              Clearer workflows improved adoption and reduced support load measurably.
            </div>
          </div>
        </article>
      </div>

      {/* Testimonials */}
      <div className={`${styles.testimonialsGrid} ${styles.reveal}`}>
        {TESTIMONIALS.map((t) => (
          <article key={t.name} className={styles.testimonialCard}>
            <p className={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.testimonialAvatar}>{t.initials}</div>
              <div>
                <p className={styles.testimonialName}>{t.name}</p>
                <p className={styles.testimonialRole}>
                  {t.role} &middot; {t.company}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
