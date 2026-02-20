import Link from "next/link";
import styles from "../../../app/style/landing-reference.module.css";
import { MainLogo } from "../../shared/main-logo";
import { NavItem } from "./data";

type NavBarProps = {
  items: NavItem[];
  activeId: string;
};

export function NavBar({ items, activeId }: NavBarProps) {
  return (
    <nav className={styles.navbar}>
      <Link href="#hero" className={styles.logo}>
        <MainLogo />
      </Link>
      <ul className={styles.navLinks}>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={activeId === item.id ? styles.active : ""}
              aria-current={activeId === item.id ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className={styles.navActions}>
        <Link href="/login" className={styles.navCta}>
          Client Login
        </Link>
      </div>
    </nav>
  );
}
