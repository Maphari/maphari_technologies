"use client";

import { cx, styles } from "../style";
import type { TeamMember } from "./types";

type ClientTeamPageProps = {
  active: boolean;
  teamMembers: TeamMember[];
  onOpenMessages: () => void;
};

export function ClientTeamPage({ active, teamMembers, onOpenMessages }: ClientTeamPageProps) {
  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-team">
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Account</div>
          <div className={styles.pageTitle}>Your Team</div>
          <p className={styles.pageSub}>
            The Maphari team members assigned to your projects. Message anyone directly.
          </p>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            className={cx(styles.button, styles.buttonAccent, styles.buttonSm)}
            onClick={onOpenMessages}
          >
            ✉ Message Team
          </button>
        </div>
      </div>

      {/* Page body */}
      <div className={styles.pageBody}>
        {teamMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👥</div>
            <div className={styles.emptyTitle}>No team members yet</div>
            <p className={styles.emptyDesc}>
              Once your project is underway, your assigned team will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Stats strip */}
            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <div className={cx(styles.statBar, styles.statBarAccent)} />
                <div className={styles.statLabel}>Team Size</div>
                <div className={styles.statValue}>{teamMembers.length}</div>
                <div className={styles.statDelta}>Across all projects</div>
              </div>
              <div className={styles.statCard}>
                <div className={cx(styles.statBar, styles.statBarGreen)} />
                <div className={styles.statLabel}>Admins</div>
                <div className={styles.statValue}>
                  {teamMembers.filter((m) => m.role === "ADMIN").length}
                </div>
                <div className={styles.statDelta}>Project leads</div>
              </div>
              <div className={styles.statCard}>
                <div className={cx(styles.statBar, styles.statBarPurple)} />
                <div className={styles.statLabel}>Specialists</div>
                <div className={styles.statValue}>
                  {teamMembers.filter((m) => m.role === "STAFF").length}
                </div>
                <div className={styles.statDelta}>Developers & designers</div>
              </div>
              <div className={styles.statCard}>
                <div className={cx(styles.statBar, styles.statBarAmber)} />
                <div className={styles.statLabel}>Projects Covered</div>
                <div className={styles.statValue}>
                  {new Set(teamMembers.flatMap((m) => m.projectIds)).size}
                </div>
                <div className={styles.statDelta}>Active engagements</div>
              </div>
            </div>

            {/* Team grid */}
            <div>
              <div className={styles.sectionTitle}>Team Members</div>
              <div className={styles.teamGrid} style={{ marginTop: 16 }}>
                {teamMembers.map((member) => (
                  <div key={member.id} className={styles.teamCard}>
                    {/* Avatar */}
                    <div
                      className={styles.teamAvatar}
                      style={{ background: member.avatarBg, color: "var(--on-accent)" }}
                    >
                      {member.initials}
                    </div>

                    {/* Name + role */}
                    <div className={styles.teamName}>{member.name}</div>
                    <div className={styles.teamRole}>{formatRole(member.role)}</div>

                    {/* Project count badge */}
                    {member.projectIds.length > 0 ? (
                      <span className={cx(styles.badge, styles.badgeMuted)}>
                        {member.projectIds.length} project{member.projectIds.length > 1 ? "s" : ""}
                      </span>
                    ) : null}

                    {/* Specialties */}
                    <div className={styles.teamSpecialties}>
                      {member.specialties.map((specialty) => (
                        <span key={specialty} className={styles.teamSpecialty}>
                          {specialty}
                        </span>
                      ))}
                    </div>

                    {/* Message CTA */}
                    <button
                      type="button"
                      className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={onOpenMessages}
                    >
                      ✉ Message
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* How the team works */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>How we collaborate</div>
                  <div className={styles.cardSub}>Your team's working rhythm</div>
                </div>
              </div>
              <div className={styles.itemList}>
                {[
                  { icon: "📅", title: "Weekly status updates", detail: "Every Monday you receive an automated digest with milestone progress." },
                  { icon: "💬", title: "Messages response SLA", detail: "Replies within 1 business day for standard queries, 4 hours for urgent." },
                  { icon: "✅", title: "Milestone sign-off", detail: "You approve or reject milestones directly from the Milestones page." },
                  { icon: "📄", title: "Document sharing", detail: "All project files are shared via the Documents page in real time." },
                  { icon: "🔄", title: "Change requests", detail: "Submit scope changes from the Projects page — the team reviews within 48 hours." },
                ].map((item) => (
                  <div key={item.title} className={styles.itemRow}>
                    <span style={{ fontSize: "1rem", flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div className={styles.itemTitle}>{item.title}</div>
                      <div className={styles.itemMeta} style={{ whiteSpace: "normal", marginTop: 2 }}>
                        {item.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function formatRole(role: string): string {
  if (role === "ADMIN") return "Project Lead / Admin";
  if (role === "STAFF") return "Developer / Specialist";
  if (role === "CLIENT") return "Client Collaborator";
  return role;
}
