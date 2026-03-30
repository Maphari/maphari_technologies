"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { hasRequiredRole } from "../../lib/auth/roles";
import { useAdminWorkspace } from "../../lib/auth/use-admin-workspace";
import type { AdminLead, AdminSnapshot } from "../../lib/api/admin";
import { formatMoneyCents, resolveCurrency } from "../../lib/i18n/currency";
import { MainLogo } from "../shared/main-logo";
import styles from "../../app/style/admin.module.css";

type MonthBar = {
  label: string;
  value: number;
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function currency(amountCents: number): string {
  return formatMoneyCents(amountCents, { currency: resolveCurrency() });
}

function shortCurrency(amountCents: number): string {
  return formatMoneyCents(amountCents, { currency: resolveCurrency() });
}

function totalInvoices(snapshot: AdminSnapshot): number {
  return snapshot.invoices.reduce((acc, invoice) => acc + invoice.amountCents, 0);
}

function totalPayments(snapshot: AdminSnapshot): number {
  return snapshot.payments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((acc, payment) => acc + payment.amountCents, 0);
}

function recentLeads(leads: AdminLead[]): AdminLead[] {
  return [...leads]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 4);
}

function leadStatusCount(leads: AdminLead[], status: AdminLead["status"]): number {
  return leads.filter((lead) => lead.status === status).length;
}

function monthlyInvoiceBars(snapshot: AdminSnapshot): MonthBar[] {
  const totals = Array.from({ length: 12 }, () => 0);
  snapshot.invoices.forEach((invoice) => {
    const iso = invoice.issuedAt ?? invoice.createdAt;
    const month = Number.isNaN(Date.parse(iso)) ? -1 : new Date(iso).getMonth();
    if (month >= 0 && month <= 11) totals[month] += invoice.amountCents;
  });

  return months.map((label, index) => ({
    label,
    value: totals[index]
  }));
}

export function AdminShell() {
  const router = useRouter();
  const { session, snapshot, loading, error, signOut } = useAdminWorkspace();
  const role = session?.user.role;
  const authorized = role ? hasRequiredRole(role, ["STAFF", "ADMIN"]) : false;
  const bars = useMemo(() => monthlyInvoiceBars(snapshot), [snapshot]);
  const maxBar = Math.max(...bars.map((bar) => bar.value), 1);
  const invoiceTotal = useMemo(() => totalInvoices(snapshot), [snapshot]);
  const paymentTotal = useMemo(() => totalPayments(snapshot), [snapshot]);
  const outstanding = Math.max(invoiceTotal - paymentTotal, 0);
  const openLeads = useMemo(
    () =>
      leadStatusCount(snapshot.leads, "NEW") +
      leadStatusCount(snapshot.leads, "CONTACTED") +
      leadStatusCount(snapshot.leads, "QUALIFIED") +
      leadStatusCount(snapshot.leads, "PROPOSAL"),
    [snapshot.leads]
  );
  const latestLeads = useMemo(() => recentLeads(snapshot.leads), [snapshot.leads]);

  useEffect(() => {
    if (session || loading) return;
    router.replace("/login?next=/admin");
  }, [loading, router, session]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}><MainLogo /></div>
          <nav className={styles.sideStack}>
            <a href="#dashboard" className={styles.sideItem}>◉</a>
            <a href="#analytics" className={styles.sideItem}>◫</a>
            <a href="#payments" className={styles.sideItem}>◌</a>
            <a href="#routes" className={styles.sideItem}>◎</a>
          </nav>
          <div className={styles.sideStackBottom}>
            <Link href="/" className={styles.sideItem}>⌂</Link>
            <Link href="/portal" className={styles.sideItem}>⇄</Link>
            <button type="button" onClick={signOut} className={styles.sideItem}>↩</button>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.topBar}>
            <nav className={styles.pillNav} id="routes">
              <a href="#dashboard" className={styles.pillActive}>Dashboard</a>
              <a href="#analytics">Analytics</a>
              <a href="#payments">Payments</a>
              <a href="#clients">Clients</a>
              <a href="#projects">Projects</a>
            </nav>
            <div className={styles.topActions}>
              <Link href="/portal" className={styles.iconButton}>⇄</Link>
              <Link href="/" className={styles.iconButton}>⌂</Link>
              <span className={styles.userBubble}>{role?.slice(0, 1) ?? "A"}</span>
            </div>
          </header>

          {!session ? (
            <section className={styles.authCard}>
              <h2>Session required</h2>
              <p>You are being redirected to login. If needed, continue manually.</p>
              <Link href="/logout?next=%2Flogin%3Fnext%3D%2Fadmin">Force logout</Link>
            </section>
          ) : !authorized ? (
            <section className={styles.authCard}>
              <h2>Access restricted</h2>
              <p>This route requires STAFF or ADMIN permissions.</p>
            </section>
          ) : (
            <section className={styles.dashboard} id="dashboard">
              <div className={styles.heroRow}>
                <div>
                  <h1>Good day, {session.user.email.split("@")[0]}</h1>
                  <p>Monitor revenue, delivery, and project execution in one operational view.</p>
                </div>
                <label className={styles.searchBox}>
                  <span>⌕</span>
                  <input type="text" placeholder="Search project, client, invoice..." />
                </label>
              </div>

              <div className={styles.grid}>
                <div className={styles.leftColumn}>
                  <div className={styles.summaryGrid}>
                    <article className={`${styles.card} ${styles.walletCard}`}>
                      <div className={styles.cardHead}>
                        <h3>Admin Wallet</h3>
                        <button type="button">Add New +</button>
                      </div>
                      <strong>{currency(invoiceTotal)}</strong>
                      <p>Total invoice value</p>
                      <div className={styles.walletTags}>
                        <span>Web</span>
                        <span>Mobile</span>
                        <span>Automation</span>
                      </div>
                    </article>

                    <article className={styles.card}>
                      <h3>Current Balance</h3>
                      <strong>{currency(paymentTotal)}</strong>
                      <p>+12.8% this month</p>
                    </article>
                    <article className={styles.card}>
                      <h3>Savings</h3>
                      <strong>{currency(outstanding)}</strong>
                      <p>Outstanding receivables</p>
                    </article>
                    <article className={styles.card} id="analytics">
                      <h3>Projects</h3>
                      <strong>{snapshot.projects.length}</strong>
                      <p>Active tracked projects</p>
                    </article>
                    <article className={styles.card} id="payments">
                      <h3>Payments</h3>
                      <strong>{snapshot.payments.length}</strong>
                      <p>Processed transactions</p>
                    </article>
                  </div>

                  <article className={`${styles.card} ${styles.chartCard}`}>
                    <div className={styles.chartHead}>
                      <div>
                        <h2>Cash Flow</h2>
                        <strong>{currency(paymentTotal)}</strong>
                      </div>
                      <span>Yearly</span>
                    </div>
                    <div className={styles.chartBars}>
                      {bars.map((bar) => {
                        const height = Math.max((bar.value / maxBar) * 190, 8);
                        return (
                          <div key={bar.label} className={styles.barWrap}>
                            <svg
                              className={`${styles.bar} ${bar.value === maxBar ? styles.barHighlight : ""}`}
                              viewBox="0 0 20 190"
                              preserveAspectRatio="none"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <title>{`${bar.label}: ${currency(bar.value)}`}</title>
                              <rect className={styles.barRect} x="0.5" y={190 - height} width="19" height={height} rx="2.4" ry="2.4" />
                            </svg>
                            <small>{bar.label}</small>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                </div>

                <aside className={styles.rightRail}>
                  <article className={styles.card}>
                    <h3>Quick team</h3>
                    <p>Assigned managers and delivery leads</p>
                    <div className={styles.avatarRow}>
                      {["AM", "PM", "UX", "BE", "QA", "OPS"].map((avatar) => (
                        <span key={avatar}>{avatar}</span>
                      ))}
                    </div>
                  </article>

                  <article className={`${styles.card} ${styles.creditCard}`}>
                    <p>Operational Budget</p>
                    <strong>{shortCurrency(outstanding)}</strong>
                    <small>Valid through 2026</small>
                  </article>

                  <div className={styles.ctaRow}>
                    <button type="button">Deposit</button>
                    <button type="button">Transfer</button>
                  </div>

                  <article className={styles.card}>
                    <h3>Quick Action</h3>
                    <div className={styles.actionGrid}>
                      <button type="button">Receive</button>
                      <button type="button">Request</button>
                      <button type="button">More</button>
                    </div>
                  </article>

                  <article className={`${styles.card} ${styles.planCard}`}>
                    <h3>Lead Pipeline</h3>
                    <p>{openLeads} open opportunities</p>
                    <ul className={styles.leadList}>
                      {latestLeads.map((lead) => (
                        <li key={lead.id}>
                          <span>{lead.title}</span>
                          <small>{lead.status}</small>
                        </li>
                      ))}
                    </ul>
                  </article>
                </aside>
              </div>

              <div className={styles.footerStats}>
                <article id="clients">
                  <p>Clients</p>
                  <strong>{snapshot.clients.length}</strong>
                </article>
                <article id="projects">
                  <p>Won Leads</p>
                  <strong>{leadStatusCount(snapshot.leads, "WON")}</strong>
                </article>
                <article>
                  <p>Lost Leads</p>
                  <strong>{leadStatusCount(snapshot.leads, "LOST")}</strong>
                </article>
              </div>
            </section>
          )}

          {error ? <p className={styles.error}>{error}</p> : null}
        </main>
      </div>
    </div>
  );
}
