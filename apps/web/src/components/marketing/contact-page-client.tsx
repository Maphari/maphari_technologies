"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { submitPublicContactRequest } from "../../lib/api/public-contact";
import { MainLogo } from "../shared/main-logo";
import styles from "@/app/style/components/contact-page.module.css";

export function ContactPageClient() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedAtIso] = useState(() => new Date().toISOString());

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);
    setSent(false);
    setError(null);

    const response = await submitPublicContactRequest({
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      service: String(formData.get("service") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
      company: String(formData.get("company") ?? "").trim(),
      startedAt: String(formData.get("startedAt") ?? "").trim(),
      pagePath: "/contact"
    });

    setSubmitting(false);
    if (!response.success) {
      setError(response.error?.message ?? "Unable to submit request right now. Please try again.");
      return;
    }

    setSent(true);
    form.reset();
  };

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <MainLogo />
        </Link>
        <div className={styles.navActions}>
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href="/login" className={styles.navCta}>Login</Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Contact • Strategy • Delivery</p>
          <h1>Let&apos;s scope your next digital build.</h1>
          <p>
            Share your goals, timelines, and constraints. We&apos;ll respond with a practical roadmap covering scope,
            sequence, and recommended delivery model.
          </p>

          <div className={styles.grid}>
            <aside className={styles.infoCard}>
              <h2 className={styles.cardTitle}>What you&apos;ll get</h2>
              <ul className={styles.list}>
                <li>Service-fit assessment for web, mobile, design, and automation</li>
                <li>Execution scope and timeline recommendation</li>
                <li>Delivery plan with milestones and ownership model</li>
                <li>Suggested next step within 1 business day</li>
              </ul>
            </aside>

            <section className={styles.formCard}>
              <h2 className={styles.cardTitle}>Project inquiry</h2>
              <form className={styles.form} onSubmit={onSubmit}>
                <input type="hidden" name="startedAt" value={startedAtIso} />
                <input type="text" name="company" tabIndex={-1} autoComplete="off" className={styles.honeypot} aria-hidden="true" />
                <div className={styles.row}>
                  <div className={styles.group}>
                    <label htmlFor="name" className={styles.label}>Name</label>
                    <input id="name" name="name" className={styles.input} placeholder="Your name" required />
                  </div>
                  <div className={styles.group}>
                    <label htmlFor="email" className={styles.label}>Email</label>
                    <input id="email" name="email" type="email" className={styles.input} placeholder="you@company.com" required />
                  </div>
                </div>

                <div className={styles.group}>
                  <label htmlFor="service" className={styles.label}>Service required</label>
                  <select id="service" name="service" className={styles.select} defaultValue="" required>
                    <option value="" disabled>Select service</option>
                    <option>Web Development</option>
                    <option>Mobile App Development</option>
                    <option>Web Design</option>
                    <option>Automation</option>
                    <option>Maintenance</option>
                  </select>
                </div>

                <div className={styles.group}>
                  <label htmlFor="details" className={styles.label}>Project details</label>
                  <textarea
                    id="details"
                    name="message"
                    className={styles.textarea}
                    placeholder="What are you building, what is not working, and what outcome do you want?"
                    required
                  />
                </div>

                <button type="submit" className={styles.submit} disabled={submitting}>
                  {submitting ? "Sending..." : "Send Request"}
                </button>
                {sent ? <p className={styles.success}>Thanks. We received your request.</p> : null}
                {error ? <p className={styles.error}>{error}</p> : null}
                <p className={styles.note}>By submitting this form, you agree to be contacted about your inquiry.</p>
              </form>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
