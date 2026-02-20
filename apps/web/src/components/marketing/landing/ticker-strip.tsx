import styles from "../../../app/style/landing-reference.module.css";

type TickerStripProps = {
  items: string[];
};

export function TickerStrip({ items }: TickerStripProps) {
  return (
    <div className={styles.tickerWrap}>
      <div className={styles.ticker}>
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className={styles.tickerItem}><span className={styles.tickerDot}>✦</span>{item}</span>
        ))}
      </div>
    </div>
  );
}
