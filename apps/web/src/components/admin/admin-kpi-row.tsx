import type { AdminSnapshot } from "../../lib/api/admin";
import { formatMoneyCents, resolveCurrency } from "../../lib/i18n/currency";
import styles from "../../app/style/admin.module.css";

function sumAmount(items: Array<{ amountCents: number }>): number {
  return items.reduce((total, item) => total + item.amountCents, 0);
}

function toCurrency(amountCents: number): string {
  return formatMoneyCents(amountCents, { currency: resolveCurrency(), maximumFractionDigits: 0 });
}

interface AdminKpiRowProps {
  snapshot: AdminSnapshot;
  isAdmin: boolean;
}

export function AdminKpiRow({ snapshot, isAdmin }: AdminKpiRowProps) {
  const wonLeads = snapshot.leads.filter((lead) => lead.status === "WON").length;
  const openProjects = snapshot.projects.filter((project) => project.status !== "COMPLETED").length;
  const overdueInvoices = snapshot.invoices.filter((invoice) => invoice.status === "OVERDUE").length;
  const totalInvoiceValue = sumAmount(snapshot.invoices);

  const cards = [
    { label: "Clients", value: String(snapshot.clients.length), tone: "teal" },
    { label: "Open Projects", value: String(openProjects), tone: "slate" },
    { label: "Won Leads", value: String(wonLeads), tone: "gold" },
    { label: "Overdue Invoices", value: String(overdueInvoices), tone: "danger" },
    ...(isAdmin ? [{ label: "Invoice Value", value: toCurrency(totalInvoiceValue), tone: "teal" as const }] : [])
  ];

  return (
    <section className={styles.kpiGrid}>
      {cards.map((card) => (
        <article key={card.label} className={`${styles.kpiCard} ${styles[`kpi${card.tone}`]}`}>
          <p>{card.label}</p>
          <strong>{card.value}</strong>
        </article>
      ))}
    </section>
  );
}
