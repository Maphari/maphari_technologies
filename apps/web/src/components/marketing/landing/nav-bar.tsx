"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../../../app/style/landing-reference.module.css";
import { MainLogo } from "../../shared/main-logo";
import { NavItem } from "./data";

type NavBarProps = {
  items: NavItem[];
  activeId: string;
};

export function NavBar({ items, activeId }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
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

        {/* Mobile hamburger toggle */}
        <button
          type="button"
          className={styles.navHamburger}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen
            ? <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            : <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="1" y="4"    width="16" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="1" y="8.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="1" y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
              </svg>
          }
        </button>
      </nav>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className={styles.navMobileMenu}>
          <ul className={styles.navMobileLinks}>
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`${styles.navMobileLink}${activeId === item.id ? ` ${styles.navMobileLinkActive}` : ""}`}
                  aria-current={activeId === item.id ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className={styles.navMobileCta}
            onClick={() => setMobileOpen(false)}
          >
            Client Login
          </Link>
        </div>
      )}
    </>
  );
}
