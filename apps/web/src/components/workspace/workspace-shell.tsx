"use client";

import Link from "next/link";
import type { Role } from "@maphari/contracts";
import { hasRequiredRole } from "../../lib/auth/roles";
import { useAuthWorkspace } from "../../lib/auth/use-auth-workspace";
import { SignInPanel } from "../auth/sign-in-panel";
import { SummaryCards } from "./summary-cards";
import { DataPanels } from "./data-panels";
import styles from "../../app/style/workspace.module.css";

interface WorkspaceShellProps {
  sectionTitle: string;
  sectionDescription: string;
  allowedRoles: Role[];
}

export function WorkspaceShell({ sectionTitle, sectionDescription, allowedRoles }: WorkspaceShellProps) {
  const { session, snapshot, loading, error, signIn, signOut } = useAuthWorkspace();
  const role = session?.user.role;
  const authorized = role ? hasRequiredRole(role, allowedRoles) : false;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>{sectionTitle}</h1>
            <p className={styles.subtle}>{sectionDescription}</p>
          </div>
          <nav className={styles.nav}>
            <Link href="/">Marketing</Link>
            <Link href="/portal">Portal</Link>
            <Link href="/admin">Admin</Link>
          </nav>
          {session ? (
            <button type="button" onClick={signOut} className={styles.ghostButton}>
              Sign out
            </button>
          ) : null}
        </header>

        {!session ? (
          <SignInPanel loading={loading} onSignIn={signIn} />
        ) : !authorized ? (
          <section className={styles.authCard}>
            <h2>Access restricted</h2>
            <p>
              Your role is <strong>{session.user.role}</strong>. This section requires:{" "}
              <strong>{allowedRoles.join(", ")}</strong>.
            </p>
          </section>
        ) : (
          <>
            <SummaryCards
              clients={snapshot.clients.length}
              projects={snapshot.projects.length}
              leads={snapshot.leads.length}
            />
            <DataPanels snapshot={snapshot} />
          </>
        )}

        {error ? <p className={styles.error}>{error}</p> : null}
      </main>
    </div>
  );
}
