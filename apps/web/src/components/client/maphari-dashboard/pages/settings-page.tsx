import { cx, styles } from "../style";
import { ToggleRow } from "../toggle-row";

type SettingsPageProps = {
  active: boolean;
  userInitials: string;
  userGreetingName: string;
  userEmail: string;
  profile: {
    fullName: string;
    email: string;
    company: string;
    phone: string;
    currency: string;
  };
  onProfileChange: (key: "fullName" | "email" | "company" | "phone" | "currency", value: string) => void;
  onSaveProfile: () => void;
  notifications: {
    projectUpdates: boolean;
    invoiceReminders: boolean;
    newMessages: boolean;
    weeklyDigest: boolean;
    marketingEmails: boolean;
  };
  onNotificationChange: (
    key: "projectUpdates" | "invoiceReminders" | "newMessages" | "weeklyDigest" | "marketingEmails",
    value: boolean
  ) => void;
  onSaveNotifications: () => void;
};

export function ClientSettingsPage({
  active,
  userInitials,
  userGreetingName,
  userEmail,
  profile,
  onProfileChange,
  onSaveProfile,
  notifications,
  onNotificationChange,
  onSaveNotifications
}: SettingsPageProps) {
  return (
    <section className={cx("page", active && "pageActive")} id="page-settings">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>Account</div>
          <div className={styles.pageTitle}>Settings</div>
          <div className={styles.pageSub}>Manage your profile and notification preferences.</div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div>
          <div className={styles.card} style={{ marginBottom: 16 }}>
            <div className={styles.cardHeader}><span className={styles.cardHeaderTitle}>Profile</span></div>
            <div className={styles.cardBody}>
              <div className={styles.profileRow}>
                <div className={styles.profileAvatar}>{userInitials}</div>
                <div>
                  <div className={styles.profileName}>{userGreetingName}</div>
                  <div className={styles.profileEmail}>{userEmail}</div>
                  <button className={cx("button", "buttonGhost")} type="button" style={{ padding: "5px 12px", fontSize: "0.62rem" }}>Change Avatar</button>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Full Name</label>
                <input className={styles.fieldInput} value={profile.fullName} onChange={(event) => onProfileChange("fullName", event.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Email Address</label>
                <input className={styles.fieldInput} value={profile.email} onChange={(event) => onProfileChange("email", event.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Company</label>
                <input className={styles.fieldInput} value={profile.company} onChange={(event) => onProfileChange("company", event.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Phone</label>
                <input className={styles.fieldInput} placeholder="+27 …" value={profile.phone} onChange={(event) => onProfileChange("phone", event.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Display Currency</label>
                <select className={styles.fieldInput} value={profile.currency} onChange={(event) => onProfileChange("currency", event.target.value)}>
                  <option value="AUTO">Auto</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="ZAR">ZAR</option>
                  <option value="NGN">NGN</option>
                  <option value="KES">KES</option>
                </select>
              </div>
              <button className={cx("button", "buttonAccent")} type="button" style={{ marginTop: 8 }} onClick={onSaveProfile}>Save Changes</button>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.card} style={{ marginBottom: 16 }}>
            <div className={styles.cardHeader}><span className={styles.cardHeaderTitle}>Notifications</span></div>
            <div className={styles.cardBody} style={{ paddingTop: 6, paddingBottom: 6 }}>
              <ToggleRow title="Project updates" desc="Status changes, milestone completions" enabled={notifications.projectUpdates} onToggle={(next) => onNotificationChange("projectUpdates", next)} />
              <ToggleRow title="Invoice reminders" desc="Due dates and overdue alerts" enabled={notifications.invoiceReminders} onToggle={(next) => onNotificationChange("invoiceReminders", next)} />
              <ToggleRow title="New messages" desc="Notifications when team messages you" enabled={notifications.newMessages} onToggle={(next) => onNotificationChange("newMessages", next)} />
              <ToggleRow title="Weekly digest" desc="Summary of all project activity" enabled={notifications.weeklyDigest} onToggle={(next) => onNotificationChange("weeklyDigest", next)} />
              <ToggleRow title="Marketing emails" desc="News and updates from Maphari" enabled={notifications.marketingEmails} onToggle={(next) => onNotificationChange("marketingEmails", next)} />
              <button className={cx("button", "buttonGhost")} type="button" style={{ marginTop: 8 }} onClick={onSaveNotifications}>Save Notifications</button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><span className={styles.cardHeaderTitle}>Danger Zone</span></div>
            <div className={styles.cardBody}>
              <div className={styles.dangerText}>Permanently delete your account and all associated data. This action cannot be undone.</div>
              <button className={styles.dangerButton} type="button">Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
