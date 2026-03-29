"use client";

import { AdminPageHeader, AdminSectionCard, AdminEmptyState } from "../../admin-primitives";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import styles from "@/app/style/admin.module.css";
import { styles as dashboardStyles } from "../style";
import { formatMoneyCents } from "@/lib/i18n/currency";
import { formatStatus } from "@/lib/utils/format-status";

export function AdminBillingPageClient() {
  const { snapshot, loading } = useAdminWorkspaceContext();

  return (
    <div className={dashboardStyles.pageBody}>
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
                    <span>{formatStatus(invoice.status)}</span>
                    <span>{formatMoneyCents(invoice.amountCents, { currency: invoice.currency, maximumFractionDigits: 0 })}</span>
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
                    <span>{formatStatus(payment.status)}</span>
                    <span>{formatMoneyCents(payment.amountCents, { maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </AdminSectionCard>
        </div>
      </section>
    </div>
  );
}
