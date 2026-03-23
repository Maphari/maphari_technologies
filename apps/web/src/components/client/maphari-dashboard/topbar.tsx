"use client";

import { useEffect, useRef, useState } from "react";
import { cx, styles } from "./style";
import { DashboardUtilityIcon } from "@/components/shared/dashboard-utility-icon";
import { Ic } from "./ui";
import { ProjectSwitcher } from "./components/project-switcher";

type ClientTopbarProps = {
  eyebrow: string;
  title: string;
  onOpenApps: () => void;
  onOpenNotifications: () => void;
  onNewMessage: () => void;
  onOpenHelp: () => void;
  unreadCount: number;
  onLogout: () => void;
  clientInitials: string;
  clientEmail: string;
  isLoggingOut?: boolean;
  onOpenSearch?: () => void;
  onNavigateSettings?: () => void;
  onNavigateTeam?: () => void;
  onMenuToggle?: () => void;
  /** White-label: if set, shown in the profile dropdown instead of email-derived name */
  brandCompanyName?: string | null;
  /** White-label: if set, shown as logo image instead of wordmark text */
  brandLogoUrl?: string | null;
  /** Plan tier label from profile (e.g. "Retainer Pro") */
  planLabel?: string | null;
  /** List of projects for the switcher (shown if length > 1) */
  projects?: Array<{ id: string; name: string; status: string }>;
  /** Currently selected project id */
  selectedProjectId?: string | null;
  /** Called when user selects a different project */
  onProjectSelect?: (id: string) => void;
  /** Called when user clicks "View all projects" in switcher */
  onViewAllProjects?: () => void;
  /**
   * Real-time connection state from usePortalRealtime.
   * undefined = hook not yet mounted (hide pill)
   * false     = polling in flight / not yet seeded (show "Syncing…")
   * true      = at least one successful poll completed (show "Live")
   */
  isRealtimeConnected?: boolean;
};

const PROFILE_LINKS = [
  { icon: "settings",   label: "Account Settings" },
  { icon: "users",      label: "Team & Access"     },
  { icon: "headphones", label: "Help Center"       },
] as const;

export function ClientTopbar({
  eyebrow,
  title,
  onOpenApps,
  onOpenNotifications,
  onNewMessage,
  onOpenHelp,
  unreadCount,
  onLogout,
  clientInitials,
  clientEmail,
  isLoggingOut = false,
  onOpenSearch,
  onNavigateSettings,
  onNavigateTeam,
  onMenuToggle,
  brandCompanyName,
  brandLogoUrl,
  planLabel,
  projects,
  selectedProjectId,
  onProjectSelect,
  onViewAllProjects,
  isRealtimeConnected,
}: ClientTopbarProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent): void {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocumentClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Derive company name from email (e.g. "acme" from "user@acme.com")
  const clientCompany = clientEmail.includes("@")
    ? clientEmail.split("@")[1]?.split(".")[0] ?? "Company"
    : "Company";
  const clientName = brandCompanyName
    ? brandCompanyName
    : clientCompany.charAt(0).toUpperCase() + clientCompany.slice(1) + " Portal";

  function handleProfileLink(label: string): void {
    setProfileMenuOpen(false);
    if (label === "Account Settings") { onNavigateSettings?.(); return; }
    if (label === "Team & Access")    { onNavigateTeam?.();     return; }
    if (label === "Help Center")      { onOpenHelp();           return; }
  }

  return (
    <header className={styles.topbar}>
      {/* ── Mobile hamburger ─────────────────────────────────────────── */}
      {onMenuToggle ? (
        <button
          type="button"
          className={styles.topbarHamburger}
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <svg width="26" height="26" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="1" y="4"    width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="1" y="8.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="1" y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
        </button>
      ) : null}

      {/* ── Left: breadcrumb ─────────────────────────────────────────── */}
      <div className={styles.topbarTitle}>
        <span className={styles.topbarLabelEyebrow}>{eyebrow}</span>
        <span className={styles.topbarLabelSep}>/</span>
        <span className={styles.topbarLabelPage}>{title}</span>
      </div>

      {/* ── Project switcher (multi-project clients) ─────────────────── */}
      {projects && projects.length > 0 && onProjectSelect && onViewAllProjects ? (
        <ProjectSwitcher
          projects={projects}
          selectedProjectId={selectedProjectId ?? null}
          onSelect={onProjectSelect}
          onViewAll={onViewAllProjects}
        />
      ) : null}

      {/* ── Right: action strip ──────────────────────────────────────── */}
      <div className={styles.topbarActions}>
        {/* Realtime sync pill */}
        {isRealtimeConnected !== undefined ? (
          <span
            className={`${styles.realtimePill}${isRealtimeConnected ? "" : ` ${styles.realtimePillSyncing}`}`}
            aria-label={isRealtimeConnected ? "Live data" : "Syncing data"}
          >
            <span className={styles.realtimePillDot} aria-hidden="true" />
            {isRealtimeConnected ? "Live" : "Syncing…"}
          </span>
        ) : null}

        {/* Search */}
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.topbarSearch}`}
          onClick={onOpenSearch}
          aria-label="Search (⌘K)"
        >
          <Ic n="search" sz={16} c="var(--muted)" />
        </button>

        {/* Notifications with count badge */}
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenNotifications}
          aria-label="Open notifications"
        >
          <DashboardUtilityIcon kind="notifications" className={styles.topbarIcon} />
          {unreadCount > 0 ? (
            <span className={styles.topbarNotifBadge}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>

        {/* Messages */}
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.topbarMsg}`}
          onClick={onNewMessage}
          aria-label="Open messages"
        >
          <DashboardUtilityIcon kind="messages" className={styles.topbarIcon} />
        </button>

        {/* All Pages */}
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.topbarApps}`}
          onClick={onOpenApps}
          aria-label="All pages"
        >
          <Ic n="grid" sz={15} c="var(--muted)" />
        </button>

        {/* Separator */}
        <div className={styles.topbarSep} />

        {/* Profile menu */}
        <div className={styles.topbarUserMenu} ref={profileMenuRef}>
          <button
            type="button"
            className={styles.topbarUserBtn}
            onClick={() => setProfileMenuOpen((v) => !v)}
            aria-expanded={profileMenuOpen}
            aria-label="Open account menu"
          >
            <span className={styles.topbarUserAvatar}>{clientInitials}</span>
            <span className={styles.topbarUserLabel}>Client</span>
          </button>

          {profileMenuOpen ? (
            <div className={styles.topbarUserDropdown}>
              {/* Identity block */}
              <div className={styles.topbarDropdownId}>
                <div className={styles.topbarDropdownAvatarRow}>
                  <div className={styles.topbarDropdownAvatarLg}>
                    {clientInitials}
                  </div>
                  <div className={styles.topbarDropdownNameGroup}>
                    <div className={styles.topbarDropdownNameText}>
                      {clientName}
                    </div>
                    <div className={styles.topbarDropdownEmailText}>
                      {clientEmail}
                    </div>
                  </div>
                </div>
                <div className={styles.topbarDropdownBadgeRow}>
                  {planLabel ? (
                    <span className={cx("badge", "badgeAccent")}>{planLabel}</span>
                  ) : null}
                  <span className={cx("badge", "badgeGreen")}>Active</span>
                </div>
              </div>

              {/* Navigation links */}
              <div className={styles.topbarDropdownSection}>
                {PROFILE_LINKS.map(({ icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    className={styles.topbarUserItem}
                    onClick={() => handleProfileLink(label)}
                  >
                    <span className={styles.topbarDropdownIconWrap}>
                      <Ic n={icon} sz={12} c="var(--muted)" />
                    </span>
                    {label}
                  </button>
                ))}
              </div>

              {/* Sign out */}
              <div className={styles.topbarDropdownFooter}>
                <button
                  type="button"
                  className={`${styles.topbarUserItem} ${styles.topbarDropdownSignOut}`}
                  onClick={() => { setProfileMenuOpen(false); onLogout(); }}
                  disabled={isLoggingOut}
                >
                  <span className={styles.topbarDropdownIconWrap}>
                    <Ic n="x" sz={12} c="currentColor" />
                  </span>
                  {isLoggingOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
