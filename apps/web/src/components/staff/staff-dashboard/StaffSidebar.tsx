"use client";

import { NavIcon } from "./ui";
import { cx, styles } from "./style";
import type { NavItem, PageId } from "./types";
import { capitalize } from "./utils";

type StaffSidebarProps = {
  navSections: Array<[string, NavItem[]]>;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  staffInitials: string;
  staffName: string;
  staffRole: string;
};

export function StaffSidebar({ navSections, activePage, onNavigate, staffInitials, staffName, staffRole }: StaffSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <div className={styles.logoMark}>M</div>
        <div className={styles.logoTextBlock}>
          <div className={styles.logoText}>
            Maph<span>a</span>ri
          </div>
          <div className={styles.staffChip}>Staff</div>
        </div>
      </div>

      <div className={styles.statusBar}>
        <div className={styles.statusDot} />
        <div className={styles.statusText}>Available</div>
        <select className={styles.statusSelect} defaultValue="Available">
          <option>Available</option>
          <option>In a meeting</option>
          <option>Focused</option>
          <option>Away</option>
        </select>
      </div>

      <nav className={styles.sidebarNav}>
        {navSections.map(([section, items]) => (
          <div key={section}>
            <div className={styles.navSection}>{section}</div>
            {items.map((item) => (
              <div
                key={item.id}
                className={cx("navItem", activePage === item.id && "navItemActive")}
                onClick={() => onNavigate(item.id)}
              >
                <NavIcon id={item.id} className={styles.navIcon} />
                {item.label}
                {item.badge ? (
                  <span className={cx("navBadge", `navBadge${capitalize(item.badge.tone)}`)}>
                    {item.badge.value}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.userRow}>
          <div className={styles.userAvatar}>{staffInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.userName}>{staffName}</div>
            <div className={styles.userRole}>{staffRole}</div>
          </div>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ color: "var(--muted2)", flexShrink: 0 }}>
            <path d="M5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </aside>
  );
}
