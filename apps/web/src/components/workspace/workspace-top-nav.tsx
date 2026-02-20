"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MainLogo } from "../shared/main-logo";
import styles from "../../app/style/workspace-top-nav.module.css";

interface WorkspaceNavItem {
  href: string;
  label: string;
}

interface WorkspaceTopNavProps {
  items: WorkspaceNavItem[];
  actionLabel: string;
  onAction: () => void;
}

function isActivePath(currentPathname: string, href: string): boolean {
  if (href === "/") return currentPathname === "/";
  return currentPathname === href || currentPathname.startsWith(`${href}/`);
}

export function WorkspaceTopNav({ items, actionLabel, onAction }: WorkspaceTopNavProps) {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoGroup} aria-label="Maphari Home">
        <span className={styles.logoMark}>M</span>
        <span className={styles.logoText}>
          <MainLogo />
        </span>
      </Link>

      <nav className={styles.nav} aria-label="Workspace navigation">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${isActivePath(pathname, item.href) ? styles.navLinkActive : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button type="button" className={styles.action} onClick={onAction}>
        {actionLabel}
      </button>
    </header>
  );
}
