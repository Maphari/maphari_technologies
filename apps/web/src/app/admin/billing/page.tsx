"use client";

import { AdminPageHeader, AdminSectionCard, AdminEmptyState } from "../../../components/admin/admin-primitives";
import { useAdminWorkspaceContext } from "../../../components/admin/admin-workspace-context";
import styles from "../../style/admin.module.css";

function amountToCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(value / 100);
}

export default function AdminBillingPage() {
  const { snapshot, loading } = useAdminWorkspaceContext();

  return (
    <section className={styles.dashboard}>
      <AdminPageHeader title="Billing" subtitle="Track invoices, collections, and payment operations." />
      <div className={styles.tablesGrid}>
        <AdminSectionCard title="Invoices" subtitle="Issued and outstanding invoices.">
          {loading ? <AdminEmptyState message="Loading invoices..." /> : null}
          {!loading && snapshot.invoices.length === 0 ? <AdminEmptyState message="No invoices found." /> : null}
          {!loading && snapshot.invoices.length > 0 ? (
            <div className={styles.table}>
              <div className={styles.tableRowHead}>
                <span>Number</span>
                <span>Status</span>
                <span>Amount</span>
              </div>
              {snapshot.invoices.map((invoice) => (
                <div key={invoice.id} className={styles.tableRow}>
                  <span>{invoice.number}</span>
                  <span>{invoice.status}</span>
                  <span>{amountToCurrency(invoice.amountCents)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </AdminSectionCard>

        <AdminSectionCard title="Payments" subtitle="Recorded transactions and outcomes.">
          {loading ? <AdminEmptyState message="Loading payments..." /> : null}
          {!loading && snapshot.payments.length === 0 ? <AdminEmptyState message="No payments found." /> : null}
          {!loading && snapshot.payments.length > 0 ? (
            <div className={styles.table}>
              <div className={styles.tableRowHead}>
                <span>Payment ID</span>
                <span>Status</span>
                <span>Amount</span>
              </div>
              {snapshot.payments.map((payment) => (
                <div key={payment.id} className={styles.tableRow}>
                  <span className={styles.mono}>{payment.id.slice(0, 8)}</span>
                  <span>{payment.status}</span>
                  <span>{amountToCurrency(payment.amountCents)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </AdminSectionCard>
      </div>
    </section>
  );
}
