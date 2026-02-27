import { capitalize } from "./utils";
import { cx, styles } from "./style";
import type { NavItem, PageId } from "./types";
import { NavIcon } from "./nav-icon";
import type { ResolvedTheme } from "./hooks/use-theme";

type SidebarProps = {
  navSections: Array<[string, NavItem[]]>;
  activePage: PageId;
  onChangePage: (page: PageId) => void;
  projects: Array<{ id: string; name: string }>;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  userInitials: string;
  userGreetingName: string;
  clientBadge: string;
  resolvedTheme: ResolvedTheme;
  onToggleTheme: () => void;
};

export function ClientSidebar({
  navSections,
  activePage,
  onChangePage,
  projects,
  selectedProjectId,
  onSelectProject,
  userInitials,
  userGreetingName,
  clientBadge,
  resolvedTheme,
  onToggleTheme,
}: SidebarProps) {
  const navDomId: Partial<Record<PageId, string>> = {
    dashboard:   "nav-dashboard",
    reports:     "nav-reports",
    ai:          "nav-ai",
    onboarding:  "nav-onboarding",
    projects:    "nav-projects",
    milestones:  "nav-milestones",
    create:      "nav-request",
    invoices:    "nav-invoices",
    messages:    "nav-messages",
    docs:        "nav-docs",
    automations: "nav-automations",
    team:        "nav-team",
    support:     "nav-support",
    settings:    "nav-settings",
    notifications: "nav-notifications",
    reviews:       "nav-reviews",
    calendar:      "nav-calendar",
    brand:         "nav-brand",
    payments:      "nav-payments",
    contracts:     "nav-contracts",
    analytics:     "nav-analytics",
    feedback:      "nav-feedback",
    exports:       "nav-exports",
    resources:     "nav-resources",
    referrals:     "nav-referrals",
    integrations:  "nav-integrations",
  };

  return (
    <aside className={styles.sidebar}>

      {/* ── Logo + Theme Toggle ────────────────────────────────── */}
      <div className={styles.sidebarLogo}>
        <div className={styles.logoMark}>M</div>
        <div className={styles.logoTextBlock}>
          <div className={styles.logoText}>
            Maph<span>a</span>ri
          </div>
          <div className={styles.clientChip}>Client</div>
        </div>
        {/* Theme toggle button */}
        <button
          className={styles.themeToggle}
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        >
          {resolvedTheme === "dark" ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/* ── CTA — New Request ───────────────────────────────────── */}
      <button
        className={styles.sidebarCta}
        type="button"
        onClick={() => onChangePage("create")}
        title="Submit a new project request"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        New Request
      </button>

      {/* ── Navigation ────────────────────────────────────────── */}
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
                  <span
                    className={cx(
                      "navBadge",
                      item.badge.tone && `navBadge${capitalize(item.badge.tone)}`,
                    )}
                  >
                    {item.badge.value}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* ── User footer ───────────────────────────────────────── */}
      <div className={styles.sidebarFooter}>
        {/* Project switcher (compact) */}
        {projects.length > 1 ? (
          <div className={cx("projSwitcher", "projSwitcherCompact")}>
            <div className={styles.projSwitcherLabel}>Active Project</div>
            <select
              className={styles.projSelect}
              aria-label="Switch active project"
              value={selectedProjectId ?? ""}
              onChange={(event) => onSelectProject(event.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className={styles.userRow}>
          {/* Avatar with online dot */}
          <div className={styles.userAvatarWrap}>
            <div className={styles.userAvatar}>{userInitials}</div>
            <div className={styles.onlineDot} aria-hidden />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.userName}>{userGreetingName}</div>
            <div className={styles.userCompany}>{clientBadge}</div>
          </div>

          {/* Settings shortcut */}
          <button
            className={styles.userSettingsBtn}
            type="button"
            aria-label="Open settings"
            title="Settings"
            onClick={() => onChangePage("settings")}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M2 4.5h12M2 8h12M2 11.5h12"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <circle cx="5" cy="4.5" r="1.5" fill="var(--surface, #0d0d14)" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="10" cy="8" r="1.5" fill="var(--surface, #0d0d14)" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="6" cy="11.5" r="1.5" fill="var(--surface, #0d0d14)" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
