import styles from "../../app/style/workspace.module.css";

interface SummaryCardsProps {
  clients: number;
  projects: number;
  leads: number;
}

export function SummaryCards({ clients, projects, leads }: SummaryCardsProps) {
  const summary = [
    { title: "Clients", value: clients, detail: "Tenant records in your authorized scope." },
    { title: "Projects", value: projects, detail: "Delivery workstreams currently tracked." },
    { title: "Leads", value: leads, detail: "Pipeline opportunities in CRM." }
  ];

  return (
    <section className={styles.grid}>
      {summary.map((item) => (
        <article key={item.title} className={styles.card}>
          <h2>{item.title}</h2>
          <strong>{item.value}</strong>
          <p>{item.detail}</p>
        </article>
      ))}
    </section>
  );
}
