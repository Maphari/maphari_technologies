import Link from "next/link";
import styles from "../../../app/style/landing-reference.module.css";

export function PageFooter() {
  return (
    <footer className={styles.footer}>
      <p className={styles.footerCopy}>© 2026 Maphari Technologies</p>
      <ul className={styles.footerLinks}>
        <li><Link href="#">Privacy</Link></li>
        <li><Link href="#">Terms</Link></li>
        <li><Link href="/contact">Contact</Link></li>
      </ul>
    </footer>
  );
}
