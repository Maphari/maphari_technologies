import styles from "../../../app/style/landing-reference.module.css";
import { services } from "./data";

export function ServicesSection() {
  return (
    <section id="services" className={styles.servicesSection}>
      <div className={`${styles.servicesHeader} ${styles.reveal}`}>
        <div>
          <p className={styles.sectionLabel}>Services</p>
          <h2 className={styles.sectionTitle}>What we <em>build</em> for you</h2>
        </div>
        <p className={styles.servicesDesc}>
          Every engagement is scoped around outcomes, not hours. We match your stage, then build the system that gets you there.
        </p>
      </div>

      <div className={`${styles.servicesGrid} ${styles.reveal}`}>
        {services.map((service) => (
          <article key={service.title} className={styles.serviceCard}>
            <p className={styles.serviceNum}>{service.num}</p>
            <h3 className={styles.serviceName}>{service.title}</h3>
            <p className={styles.serviceDesc}>{service.desc}</p>
          </article>
        ))}
        <article className={`${styles.serviceCard} ${styles.serviceCardAccent}`}>
          <p className={`${styles.serviceNum} ${styles.serviceNumAccent}`}>Start here</p>
          <h3 className={styles.serviceName}>Strategy Call</h3>
          <p className={styles.serviceDesc}>30 minutes. Walk away with a scope, timeline estimate, and a clear path to delivery.</p>
        </article>
      </div>
    </section>
  );
}
