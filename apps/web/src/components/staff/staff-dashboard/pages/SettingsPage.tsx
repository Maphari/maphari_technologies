"use client";

import { useRef } from "react";
import Image from "next/image";
import { ToggleRow } from "../ui";
import { cx, styles } from "../style";

type ProjectOption = {
  id: string;
  name: string;
};

type SettingsPageProps = {
  isActive: boolean;
  staffInitials: string;
  staffName: string;
  staffEmail: string;
  staffRole: string;
  profileName: string;
  profileEmail: string;
  profileAvatarUrl: string;
  weeklyTargetHours: number;
  onProfileNameChange: (value: string) => void;
  onProfileEmailChange: (value: string) => void;
  onProfileAvatarChange: (file: File) => void;
  onWeeklyTargetHoursChange: (value: number) => void;
  onSaveProfile: () => void;
  onResetProfile: () => void;
  hasProfileChanges: boolean;
  notifications: {
    taskAssignments: boolean;
    clientMessages: boolean;
    deliverableReminders: boolean;
    standupReminders: boolean;
    weeklyTimeSummary: boolean;
  };
  onNotificationChange: (
    key: "taskAssignments" | "clientMessages" | "deliverableReminders" | "standupReminders" | "weeklyTimeSummary",
    value: boolean
  ) => void;
  onSaveNotifications: () => void;
  onResetNotifications: () => void;
  hasNotificationsChanges: boolean;
  workspace: {
    timezone: string;
    workStart: string;
    workEnd: string;
    defaultStatus: "Available" | "Focused" | "In a meeting";
  };
  timezoneOptions: string[];
  onWorkspaceChange: (
    key: "timezone" | "workStart" | "workEnd" | "defaultStatus",
    value: string
  ) => void;
  onSaveWorkspace: () => void;
  onResetWorkspace: () => void;
  onUseLocalTimezone: () => void;
  hasWorkspaceChanges: boolean;
  projects: ProjectOption[];
  highPriorityClients: string[];
};

export function SettingsPage({
  isActive,
  staffInitials,
  staffName,
  staffEmail,
  staffRole,
  profileName,
  profileEmail,
  profileAvatarUrl,
  weeklyTargetHours,
  onProfileNameChange,
  onProfileEmailChange,
  onProfileAvatarChange,
  onWeeklyTargetHoursChange,
  onSaveProfile,
  onResetProfile,
  hasProfileChanges,
  notifications,
  onNotificationChange,
  onSaveNotifications,
  onResetNotifications,
  hasNotificationsChanges,
  workspace,
  timezoneOptions,
  onWorkspaceChange,
  onSaveWorkspace,
  onResetWorkspace,
  onUseLocalTimezone,
  hasWorkspaceChanges,
  projects,
  highPriorityClients
}: SettingsPageProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const displayName = profileName.trim() || staffName;
  const displayEmail = profileEmail.trim() || staffEmail;
  const displayInitials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || staffInitials;

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-settings">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>Account</div>
          <div className={styles.pageTitle}>Settings</div>
          <div className={styles.pageSub}>Your staff profile, skills, and preferences.</div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div>
          <div className={styles.card} style={{ marginBottom: 14 }}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTitle}>Staff Profile</span>
              {hasProfileChanges ? <span className={cx("badge", "badgeAmber")}>Unsaved</span> : null}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.profileRow}>
                <div className={styles.profileAvatarWrap}>
                  <div className={styles.profileAvatar}>
                    {profileAvatarUrl ? (
                      <Image
                        src={profileAvatarUrl}
                        alt={`${displayName} avatar`}
                        width={54}
                        height={54}
                        unoptimized
                        className={styles.profileAvatarImage}
                      />
                    ) : (
                      <span className={styles.profileAvatarInitials}>{displayInitials}</span>
                    )}
                  </div>
                </div>
                <div className={styles.profileMeta}>
                  <div className={styles.profileName}>{displayName}</div>
                  <div className={styles.profileEmail}>{displayEmail} · {staffRole}</div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      onProfileAvatarChange(file);
                      event.target.value = "";
                    }}
                  />
                  <button
                    className={cx("button", "buttonGhost", "profilePhotoButton")}
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    Change Photo
                  </button>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Full Name</label>
                <input className={styles.fieldInput} value={profileName} onChange={(event) => onProfileNameChange(event.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Email</label>
                <input className={styles.fieldInput} value={profileEmail} onChange={(event) => onProfileEmailChange(event.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Role</label>
                <input className={styles.fieldInput} value={staffRole} readOnly style={{ color: "var(--muted)" }} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Weekly Hour Target</label>
                <input className={styles.fieldInput} value={String(weeklyTargetHours)} onChange={(event) => onWeeklyTargetHoursChange(Math.max(1, Number(event.target.value) || 0))} type="number" min={1} />
              </div>
              <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className={cx("button", "buttonGhost")} type="button" onClick={onResetProfile} disabled={!hasProfileChanges}>Reset</button>
                <button className={cx("button", "buttonBlue")} type="button" onClick={onSaveProfile} disabled={!hasProfileChanges}>Save Changes</button>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><span className={styles.cardHeaderTitle}>Focus Areas</span></div>
            <div className={styles.cardBody}>
              <div className={styles.skillLabel}>Active projects</div>
              <div className={styles.skillTags} style={{ marginBottom: 14 }}>
                {projects.length === 0 ? (
                  <span className={styles.emptyState}>No active projects yet.</span>
                ) : (
                  projects.slice(0, 5).map((project) => (
                    <span key={project.id} className={styles.skillTag}>{project.name}</span>
                  ))
                )}
              </div>
              <div className={styles.skillLabel}>High-priority clients</div>
              <div className={styles.skillTags}>
                {highPriorityClients.length === 0 ? (
                  <span className={styles.emptyState}>No high-priority clients yet.</span>
                ) : (
                  highPriorityClients.slice(0, 4).map((client) => (
                    <span key={client} className={cx("skillTag", "skillTagNeutral")}>{client}</span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.card} style={{ marginBottom: 14 }}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTitle}>Notifications</span>
              {hasNotificationsChanges ? <span className={cx("badge", "badgeAmber")}>Unsaved</span> : null}
            </div>
            <div className={styles.cardBody} style={{ paddingTop: 6, paddingBottom: 6 }}>
              <ToggleRow label="Task assignments" desc="When a new task is assigned to you" enabled={notifications.taskAssignments} onToggle={(next) => onNotificationChange("taskAssignments", next)} />
              <ToggleRow label="Client messages" desc="New messages from clients on your projects" enabled={notifications.clientMessages} onToggle={(next) => onNotificationChange("clientMessages", next)} />
              <ToggleRow label="Deliverable reminders" desc="24h before a deliverable is due" enabled={notifications.deliverableReminders} onToggle={(next) => onNotificationChange("deliverableReminders", next)} />
              <ToggleRow label="Standup reminders" desc="Daily 9am check-in prompt" enabled={notifications.standupReminders} onToggle={(next) => onNotificationChange("standupReminders", next)} />
              <ToggleRow label="Weekly time summary" desc="Friday PM digest of logged hours" enabled={notifications.weeklyTimeSummary} onToggle={(next) => onNotificationChange("weeklyTimeSummary", next)} />
              <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className={cx("button", "buttonGhost")} type="button" onClick={onResetNotifications} disabled={!hasNotificationsChanges}>Reset</button>
                <button className={cx("button", "buttonGhost")} type="button" onClick={onSaveNotifications} disabled={!hasNotificationsChanges}>Save Notifications</button>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTitle}>Work Preferences</span>
              {hasWorkspaceChanges ? <span className={cx("badge", "badgeAmber")}>Unsaved</span> : null}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Timezone</label>
                <select className={cx("fieldInput", "fieldSelect")} value={workspace.timezone} onChange={(event) => onWorkspaceChange("timezone", event.target.value)}>
                  {timezoneOptions.slice(0, 200).map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <div style={{ marginTop: 6 }}>
                  <button className={cx("button", "buttonGhost")} type="button" onClick={onUseLocalTimezone}>
                    Use Local Timezone
                  </button>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Working Hours</label>
                <div className={styles.fieldRow}>
                  <input className={styles.fieldInput} value={workspace.workStart} type="time" onChange={(event) => onWorkspaceChange("workStart", event.target.value)} />
                  <input className={styles.fieldInput} value={workspace.workEnd} type="time" onChange={(event) => onWorkspaceChange("workEnd", event.target.value)} />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Default Status on Login</label>
                <select className={cx("fieldInput", "fieldSelect")} value={workspace.defaultStatus} onChange={(event) => onWorkspaceChange("defaultStatus", event.target.value)}>
                  <option value="Available">Available</option>
                  <option value="Focused">Focused</option>
                  <option value="In a meeting">In a meeting</option>
                </select>
              </div>
              <div style={{ marginTop: 4, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className={cx("button", "buttonGhost")} type="button" onClick={onResetWorkspace} disabled={!hasWorkspaceChanges}>Reset</button>
                <button className={cx("button", "buttonGhost")} type="button" onClick={onSaveWorkspace} disabled={!hasWorkspaceChanges}>Save Preferences</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
