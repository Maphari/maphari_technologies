"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasRequiredRole } from "../../lib/auth/roles";
import { useAdminWorkspaceContext } from "./admin-workspace-context";
import styles from "../../app/style/admin.module.css";

type IconName =
  | "overview"
  | "leads"
  | "clients"
  | "projects"
  | "billing"
  | "automation"
  | "reports"
  | "settings"
  | "home"
  | "portal"
  | "logout";

const navItems: Array<{ href: string; icon: IconName; label: string }> = [
  { href: "/admin", icon: "overview", label: "Overview" },
  { href: "/admin/leads", icon: "leads", label: "Leads" },
  { href: "/admin/clients", icon: "clients", label: "Clients" },
  { href: "/admin/projects", icon: "projects", label: "Projects" },
  { href: "/admin/billing", icon: "billing", label: "Billing" },
  { href: "/admin/automation", icon: "automation", label: "Automation" },
  { href: "/admin/reports", icon: "reports", label: "Reports" },
  { href: "/admin/settings", icon: "settings", label: "Settings" }
];

function Icon({ name }: { name: IconName }) {
  if (name === "overview") {
    return (
      <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (name === "leads") {
    return (
      <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
        <circle cx="8" cy="8" r="3" />
        <path d="M3.5 19c.9-3 2.7-4.5 4.5-4.5S11.6 16 12.5 19" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M15.5 19c.5-1.9 1.9-3.1 3.5-3.1s2.9 1.2 3.4 3.1" />
      </svg>
    );
  }
  if (name === "clients") {
    return (
      <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
        <circle cx="8" cy="9" r="2.6" />
        <circle cx="16.2" cy="9.6" r="2.1" />
        <path d="M4 19c.8-2.6 2.3-3.9 4-3.9s3.2 1.3 4 3.9" />
        <path d="M13.3 19c.5-1.8 1.7-3 3-3 1.2 0 2.3 1 2.8 3" />
      </svg>
    );
  }
  if (name === "projects") {
    return (
      <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
        <path d="M3.5 7.5h17v12h-17z" />
        <path d="M3.5 7.5 7 4.5h5l1.5 3" />
      </svg>
    );
  }
  if (name === "billing") {
    return (
      <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
        <path d="M3.5 10h17" />
        <path d="M8 14.6h3.5" />
      </svg>
    );
  }
  if (name === "automation") {
    return (
      <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
        <path d="M12 4.2v4" />
        <path d="M12 15.8v4" />
        <path d="m5.7 7.1 2.8 2.8" />
        <path d="m15.5 16.9 2.8 2.8" />
        <path d="m18.3 7.1-2.8 2.8" />
        <path d="m8.5 16.9-2.8 2.8" />
        <circle cx="12" cy="12" r="3.3" />
      </svg>
    );
  }
  if (name === "reports") {
    return (
      <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
        <path d="M4 19.5h16" />
        <rect x="6" y="11.2" width="2.8" height="6.3" rx="0.7" />
        <rect x="10.6" y="8.5" width="2.8" height="9" rx="0.7" />
        <rect x="15.2" y="6" width="2.8" height="11.5" rx="0.7" />
      </svg>
    );
  }
  if (name === "settings") {
    return (
      <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
        <circle cx="12" cy="12" r="2.8" />
        <path d="m19.1 15.2 1.3.8-1.6 2.8-1.5-.6a6.9 6.9 0 0 1-1.7 1l-.2 1.6h-3.2l-.2-1.6a6.9 6.9 0 0 1-1.7-1l-1.5.6-1.6-2.8 1.3-.8a7 7 0 0 1 0-2.4L4.7 12l1.6-2.8 1.5.6a6.9 6.9 0 0 1 1.7-1l.2-1.6h3.2l.2 1.6a6.9 6.9 0 0 1 1.7 1l1.5-.6 1.6 2.8-1.3.8a7 7 0 0 1 0 2.4Z" />
      </svg>
    );
  }
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
        <path d="m3.5 11 8.5-6.6 8.5 6.6" />
        <path d="M6 10.7v8.8h12v-8.8" />
      </svg>
    );
  }
  if (name === "portal") {
    return (
      <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
        <path d="M8 7h11" />
        <path d="m16 3 4 4-4 4" />
        <path d="M16 17H5" />
        <path d="m8 13-4 4 4 4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="M9 5.5h11v13H9" />
      <path d="m13 9-4 3 4 3" />
    </svg>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface AdminAppShellProps {
  children: React.ReactNode;
}

export function AdminAppShell({ children }: AdminAppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading, error, signOut } = useAdminWorkspaceContext();
  const role = session?.user.role;
  const authorized = role ? hasRequiredRole(role, ["STAFF", "ADMIN"]) : false;

  useEffect(() => {
    if (session || loading) return;
    router.replace("/login?next=/admin");
  }, [loading, router, session]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <nav className={styles.adminNav} aria-label="Admin sections">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                data-tooltip={item.label}
                className={`${styles.adminNavLink} ${isActive(pathname, item.href) ? styles.adminNavLinkActive : ""}`}
              >
                <span className={styles.adminNavGlyph}><Icon name={item.icon} /></span>
              </Link>
            ))}
          </nav>
          <div className={styles.sideStackBottom}>
            <Link href="/" aria-label="Landing page" data-tooltip="Landing page" className={styles.sideItem}><Icon name="home" /></Link>
            <Link href="/portal" aria-label="Client portal" data-tooltip="Client portal" className={styles.sideItem}><Icon name="portal" /></Link>
            <button type="button" onClick={signOut} aria-label="Sign out" data-tooltip="Sign out" className={styles.sideItem}><Icon name="logout" /></button>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.topBar}>
            <div className={styles.topIdentityStack}>
              <div className={styles.topBarTitle}>
                <strong className={styles.brandLikeTitle}>Admin Workspace</strong>
                <small>{session?.user.email ?? "admin@mapharitechnologies.com"}</small>
              </div>
            </div>
            <div className={styles.topActions}>
              <Link href="/portal" aria-label="Open client portal" data-tooltip="Open client portal" className={styles.iconButton}>◌</Link>
              <Link href="/" aria-label="Open website" data-tooltip="Open website" className={styles.iconButton}>⌂</Link>
              <span className={styles.userBubble}>{role?.slice(0, 1) ?? "A"}</span>
            </div>
          </header>

          {!session ? (
            <section className={styles.authCard}>
              <h2>Session required</h2>
              <p>You are being redirected to login. If needed, continue manually.</p>
              <Link href="/logout?next=%2Flogin%3Fnext%3D%2Fadmin">Force logout</Link>
            </section>
          ) : !authorized ? (
            <section className={styles.authCard}>
              <h2>Access restricted</h2>
              <p>This route requires STAFF or ADMIN permissions.</p>
            </section>
          ) : (
            <>
              {error ? <p className={styles.error}>{error}</p> : null}
              {children}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
