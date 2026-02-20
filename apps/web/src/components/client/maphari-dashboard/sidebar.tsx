import { capitalize } from "./utils";
import { cx, styles } from "./style";
import type { NavItem, PageId } from "./types";
import { NavIcon } from "./nav-icon";

type SidebarProps = {
  navSections: Array<[string, NavItem[]]>;
  activePage: PageId;
  onChangePage: (page: PageId) => void;
  projects: Array<{ id: string; name: string }>;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  currentProjectName: string;
  userInitials: string;
  userGreetingName: string;
  clientBadge: string;
};

export function ClientSidebar({
  navSections,
  activePage,
  onChangePage,
  projects,
  selectedProjectId,
  onSelectProject,
  currentProjectName,
  userInitials,
  userGreetingName,
  clientBadge
}: SidebarProps) {
  const navDomId: Partial<Record<PageId, string>> = {
    dashboard: "nav-dashboard",
    projects: "nav-projects",
    create: "nav-request",
    invoices: "nav-invoices",
    messages: "nav-messages",
    docs: "nav-docs"
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <div className={styles.logoMark}>M</div>
        <div className={styles.logoTextBlock}>
          <div className={styles.logoText}>
            Maph<span>a</span>ri
          </div>
          <div className={styles.clientChip}>Client</div>
        </div>
      </div>

      <div className={styles.projSwitcher}>
        <div className={styles.projSwitcherLabel}>Active Project</div>
        {projects.length <= 1 ? (
          <div className={styles.projSwitcherName}>{currentProjectName}</div>
        ) : (
          <select
            className={styles.projSelect}
            value={selectedProjectId ?? ""}
            onChange={(event) => onSelectProject(event.target.value)}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <nav className={styles.sidebarNav}>
        {navSections.map(([section, items]) => (
          <div key={section}>
            <div className={styles.navSection}>{section}</div>
            {items.map((item) => (
              <button
                key={item.id}
                id={navDomId[item.id]}
                className={cx("navItem", activePage === item.id && "navItemActive")}
                type="button"
                aria-current={activePage === item.id ? "page" : undefined}
                onClick={() => onChangePage(item.id)}
              >
                <NavIcon id={item.id} className={styles.navIcon} />
                {item.label}
                {item.badge ? (
                  <span className={cx("navBadge", item.badge.tone && `navBadge${capitalize(item.badge.tone)}`)}>
                    {item.badge.value}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.userRow}>
          <div className={styles.userAvatar}>{userInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.userName}>{userGreetingName}</div>
            <div className={styles.userCompany}>{clientBadge}</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--muted2)", flexShrink: 0 }}>
            <path d="M5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </aside>
  );
}
