import { useState } from "react";
import { cx, styles } from "../style";

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

type SettingsTab = "Profile" | "Appearance" | "Dashboard" | "Notifications" | "Language & Region" | "Account";

const ACCENT_COLORS = ["#12d6c5", "#8b6fff", "#ff5f5f", "#f5a623", "#4dde8f", "#38bdf8", "#f472b6", "#fb923c", "#a3e635", "#e879f9", "#67e8f9", "#fbbf24"];
const WIDGETS = [
  { icon: "📊", name: "Project Progress" },
  { icon: "💳", name: "Invoice Summary" },
  { icon: "📅", name: "Upcoming Events" },
  { icon: "🔔", name: "Notifications" },
  { icon: "📁", name: "Recent Files" },
  { icon: "💬", name: "Messages" },
  { icon: "⏱", name: "Time Logged" },
  { icon: "🎯", name: "Milestones" }
];
const NOTIF_PREFS = [
  { name: "Milestone Updates", channels: ["Email", "Push", "SMS"] as const },
  { name: "Invoice Reminders", channels: ["Email", "Push"] as const },
  { name: "New Messages", channels: ["Push", "SMS"] as const },
  { name: "File Uploads", channels: ["Email"] as const },
  { name: "System Alerts", channels: ["Email", "Push"] as const }
];
const LANGUAGES = ["English", "Zulu", "Xhosa", "Afrikaans", "Sotho", "Français", "Português", "العربية"];

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
  const [activeTab, setActiveTab] = useState<SettingsTab>("Profile");
  const [accentColor, setAccentColor] = useState("#12d6c5");
  const [activeWidgets, setActiveWidgets] = useState([0, 1, 2, 3]);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedLang, setSelectedLang] = useState("English");
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);

  const [toggles, setToggles] = useState({
    "Weekly Digest": true,
    "Sound Alerts": false,
    "Desktop Notifications": true,
    "Compact Mode": false,
    "Show Team Avatars": true
  });

  const [notifChannels, setNotifChannels] = useState<Record<string, string[]>>({
    "Milestone Updates": notifications.projectUpdates ? ["Email", "Push"] : [],
    "Invoice Reminders": notifications.invoiceReminders ? ["Email", "Push"] : [],
    "New Messages": notifications.newMessages ? ["Push"] : [],
    "File Uploads": notifications.marketingEmails ? ["Email"] : [],
    "System Alerts": notifications.weeklyDigest ? ["Email", "Push"] : []
  });

  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3200);
  };

  const markChanged = () => setHasChanges(true);

  const toggleWidget = (index: number) => {
    setActiveWidgets((prev) => (prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index]));
    markChanged();
  };

  const toggleChannel = (notif: string, channel: string) => {
    setNotifChannels((prev) => ({
      ...prev,
      [notif]: (prev[notif] ?? []).includes(channel)
        ? (prev[notif] ?? []).filter((item) => item !== channel)
        : [...(prev[notif] ?? []), channel]
    }));
    markChanged();
  };

  const handleSave = () => {
    onSaveProfile();
    onSaveNotifications();
    onNotificationChange("projectUpdates", (notifChannels["Milestone Updates"] ?? []).length > 0);
    onNotificationChange("invoiceReminders", (notifChannels["Invoice Reminders"] ?? []).length > 0);
    onNotificationChange("newMessages", (notifChannels["New Messages"] ?? []).length > 0);
    onNotificationChange("marketingEmails", (notifChannels["File Uploads"] ?? []).length > 0);
    onNotificationChange("weeklyDigest", (notifChannels["System Alerts"] ?? []).length > 0);
    setHasChanges(false);
    showToast("Settings saved", "All preferences updated successfully");
  };

  const tabs: SettingsTab[] = ["Profile", "Appearance", "Dashboard", "Notifications", "Language & Region", "Account"];

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-settings">
      <div style={{ display: "flex", flex: 1, position: "relative", zIndex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
            <div className={styles.pageHeader}>
              <div>
                <div className={styles.eyebrow}>Settings · Personalisation</div>
                <div className={styles.pageTitle}>{activeTab}</div>
                <div className={styles.pageSub}>Customise your portal experience, notifications, and branding preferences.</div>
              </div>
            </div>

            <div className={styles.settingsTabs}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={cx(styles.settingsTab, activeTab === tab && styles.settingsTabActive)}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, paddingLeft: 12 }}>
                {hasChanges ? <span style={{ fontSize: ".62rem", color: "var(--amber)" }}>● Unsaved changes</span> : null}
              </div>
            </div>

            {activeTab === "Profile" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, padding: "24px 32px", alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardTitle}>Personal Information</div>
                      <div className={styles.cardSub}>Update your name, contact, and company details</div>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Full Name</label>
                      <input className={styles.formInput} value={profile.fullName} onChange={(event) => { onProfileChange("fullName", event.target.value); markChanged(); }} />
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: 12 }}>
                      <label className={styles.formLabel}>Email Address</label>
                      <input className={styles.formInput} value={profile.email} onChange={(event) => { onProfileChange("email", event.target.value); markChanged(); }} />
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: 12 }}>
                      <label className={styles.formLabel}>Phone Number</label>
                      <input className={styles.formInput} value={profile.phone} onChange={(event) => { onProfileChange("phone", event.target.value); markChanged(); }} />
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: 12 }}>
                      <label className={styles.formLabel}>Company Name</label>
                      <input className={styles.formInput} value={profile.company} onChange={(event) => { onProfileChange("company", event.target.value); markChanged(); }} />
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: 12 }}>
                      <label className={styles.formLabel}>Role / Title</label>
                      <input className={styles.formInput} defaultValue="Chief Product Officer" onChange={markChanged} />
                    </div>
                  </div>
                </div>

                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardTitle}>Portal Preferences</div>
                      <div className={styles.cardSub}>Quick toggles for your portal experience</div>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    {Object.entries(toggles).map(([name, on]) => (
                      <div key={name} className={styles.toggleRow}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className={styles.toggleLabel}>{name}</div>
                          <div className={styles.toggleDesc}>
                            {name === "Weekly Digest"
                              ? "Receive a Monday summary of all project activity"
                              : name === "Sound Alerts"
                              ? "Play notification sounds for important events"
                              : name === "Desktop Notifications"
                              ? "Show browser push notifications"
                              : name === "Compact Mode"
                              ? "Reduce spacing for more information density"
                              : "Show team member avatars in project views"}
                          </div>
                        </div>
                        <button
                          className={cx(styles.toggle, on && styles.toggleOn)}
                          type="button"
                          onClick={() => { setToggles((prev) => ({ ...prev, [name]: !prev[name as keyof typeof prev] })); markChanged(); }}
                        >
                          <div className={styles.toggleKnob} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div><div className={styles.cardTitle}>Profile Photo</div></div>
                  </div>
                  <div className={styles.cardBody}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--accent-d)", border: "2px solid color-mix(in srgb,var(--accent) 30%,transparent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 800, color: "var(--accent)", marginBottom: 14 }}>{userInitials || "ND"}</div>
                    <div style={{ fontSize: ".82rem", fontWeight: 700, marginBottom: 2 }}>{userGreetingName}</div>
                    <div style={{ fontSize: ".6rem", color: "var(--muted)", marginBottom: 14 }}>{userEmail}</div>
                    <button className={cx(styles.button, styles.buttonGhost)} style={{ width: "100%", marginBottom: 8 }} type="button" onClick={() => showToast("Upload ready", "Choose a photo from your device")}>Upload Photo</button>
                    <button className={cx(styles.button, styles.buttonGhost)} style={{ width: "100%" }} type="button" onClick={() => showToast("Photo removed", "Initials will be shown instead")}>Remove</button>
                  </div>
                </div>

                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div><div className={styles.cardTitle}>Password & Security</div></div>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Current Password</label>
                      <input className={styles.formInput} type="password" defaultValue="••••••••••" />
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: 12 }}>
                      <label className={styles.formLabel}>New Password</label>
                      <input className={styles.formInput} type="password" placeholder="Enter new password" onChange={markChanged} />
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: 12 }}>
                      <label className={styles.formLabel}>Confirm Password</label>
                      <input className={styles.formInput} type="password" placeholder="Confirm new password" onChange={markChanged} />
                    </div>
                    <button className={cx(styles.button, styles.buttonAccent)} style={{ width: "100%", marginTop: 14 }} type="button" onClick={() => showToast("Password updated", "Your password has been changed successfully")}>Update Password</button>
                  </div>
                </div>
              </div>
            </div>
            ) : null}

            {activeTab === "Appearance" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, padding: "24px 32px", alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardTitle}>Accent Colour</div>
                      <div className={styles.cardSub}>Choose your portal highlight colour</div>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 4 }}>
                      {ACCENT_COLORS.map((color) => (
                        <button
                          key={color}
                          style={{
                            width: "100%", aspectRatio: "1", borderRadius: 4,
                            border: accentColor === color ? "2px solid white" : "2px solid transparent",
                            background: color, transition: "all .15s", position: "relative"
                          }}
                          type="button"
                          onClick={() => { setAccentColor(color); markChanged(); }}
                        />
                      ))}
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <label className={styles.formLabel}>Custom Hex</label>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 7 }}>
                      <div style={{ width: 36, height: 36, background: accentColor, border: "1px solid var(--border)", flexShrink: 0 }} />
                      <input className={styles.formInput} value={accentColor} onChange={(event) => { setAccentColor(event.target.value); markChanged(); }} />
                    </div>
                  </div>
                </div>

                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardTitle}>Theme Mode</div>
                      <div className={styles.cardSub}>Light or dark — your preference</div>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {["Dark", "Light"].map((mode) => (
                        <button
                          key={mode}
                          style={{
                            padding: "9px 12px", background: ((mode === "Dark" && darkMode) || (mode === "Light" && !darkMode)) ? "var(--accent-d)" : "var(--bg)",
                            border: ((mode === "Dark" && darkMode) || (mode === "Light" && !darkMode)) ? "1px solid var(--accent)" : "1px solid var(--border)",
                            color: ((mode === "Dark" && darkMode) || (mode === "Light" && !darkMode)) ? "var(--accent)" : "var(--muted)",
                            fontSize: ".72rem", fontWeight: 600, textAlign: "left" as const, transition: "all .15s"
                          }}
                          type="button"
                          onClick={() => { setDarkMode(mode === "Dark"); markChanged(); }}
                        >
                          {mode === "Dark" ? "🌙 Dark" : "☀️ Light"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div><div className={styles.cardTitle}>Live Preview</div></div>
                  </div>
                  <div className={styles.cardBody}>
                    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: 16 }}>
                      <div style={{ fontSize: ".54rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 12 }}>Preview</div>
                      <div style={{ height: 28, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 10px", gap: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: ".5rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: accentColor }}>Maphari</div>
                        <div style={{ flex: 1 }} />
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: accentColor }} />
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--muted2)" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ) : null}

            {activeTab === "Dashboard" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, padding: "24px 32px", alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardTitle}>Dashboard Widgets</div>
                      <div className={styles.cardSub}>Choose what appears on your home screen</div>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {WIDGETS.map((widget, index) => (
                        <button
                          key={widget.name}
                          style={{
                            padding: 12, background: activeWidgets.includes(index) ? "var(--accent-g)" : "var(--bg)",
                            border: activeWidgets.includes(index) ? "1px solid var(--accent)" : "1px solid var(--border)",
                            display: "flex", alignItems: "center", gap: 10, transition: "all .15s", textAlign: "left" as const
                          }}
                          type="button"
                          onClick={() => toggleWidget(index)}
                        >
                          <div style={{ width: 16, height: 16, border: activeWidgets.includes(index) ? "1px solid var(--accent)" : "1px solid var(--border2)", borderRadius: 3, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: activeWidgets.includes(index) ? "var(--accent)" : "transparent" }}>
                            {activeWidgets.includes(index) ? <span style={{ fontSize: ".5rem", color: "var(--on-accent)", fontWeight: 700 }}>✓</span> : null}
                          </div>
                          <span style={{ fontSize: ".85rem", flexShrink: 0 }}>{widget.icon}</span>
                          <span style={{ fontSize: ".72rem", fontWeight: 600 }}>{widget.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div><div className={styles.cardTitle}>Active Widgets Preview</div></div>
                  </div>
                  <div className={styles.cardBody}>
                    {activeWidgets.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted2)", fontSize: ".64rem", letterSpacing: ".1em" }}>No widgets selected</div>
                    ) : activeWidgets.map((index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--bg)", border: "1px solid var(--border)", marginBottom: 6 }}>
                        <span>{WIDGETS[index].icon}</span>
                        <span style={{ fontSize: ".76rem", fontWeight: 600 }}>{WIDGETS[index].name}</span>
                        <span style={{ marginLeft: "auto", fontSize: ".54rem", color: "var(--accent)" }}>Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            ) : null}

            {activeTab === "Notifications" ? (
            <div style={{ padding: "24px 32px" }}>
              <div className={styles.card} style={{ maxWidth: 720, padding: "20px 22px" }}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>Notification Preferences</div>
                    <div className={styles.cardSub}>Choose how you receive updates for each event type</div>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(3,80px)", gap: 0, paddingBottom: 8, borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                    <span style={{ fontSize: ".54rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)" }}>Event</span>
                    {(["Email", "Push", "SMS"] as const).map((channel) => <span key={channel} style={{ fontSize: ".54rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", textAlign: "center" }}>{channel}</span>)}
                  </div>
                  {NOTIF_PREFS.map((pref) => (
                    <div key={pref.name} style={{ display: "grid", gridTemplateColumns: "1fr repeat(3,80px)", gap: 0, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: ".76rem", fontWeight: 600, flex: 1 }}>{pref.name}</span>
                      {(["Email", "Push", "SMS"] as const).map((channel) => {
                        const on = (notifChannels[pref.name] ?? []).includes(channel);
                        return (
                          <div key={`${pref.name}-${channel}`} style={{ display: "flex", justifyContent: "center" }}>
                            <button
                              className={cx(styles.toggle, on && styles.toggleOn)}
                              style={{ width: 32, height: 18 }}
                              type="button"
                              onClick={() => toggleChannel(pref.name, channel)}
                            >
                              <div className={styles.toggleKnob} style={{ width: 12, height: 12, top: 2, left: 2, transform: on ? "translateX(14px)" : "translateX(0)" }} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            ) : null}

            {activeTab === "Language & Region" ? (
            <div style={{ padding: "24px 32px" }}>
              <div className={styles.card} style={{ maxWidth: 560, padding: "20px 22px" }}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>Language</div>
                    <div className={styles.cardSub}>Choose your preferred portal language</div>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {LANGUAGES.map((language) => (
                      <button
                        key={language}
                        style={{
                          padding: "9px 12px", background: selectedLang === language ? "var(--accent-d)" : "var(--bg)",
                          border: selectedLang === language ? "1px solid var(--accent)" : "1px solid var(--border)",
                          color: selectedLang === language ? "var(--accent)" : "var(--muted)",
                          fontSize: ".72rem", fontWeight: 600, textAlign: "left" as const, transition: "all .15s"
                        }}
                        type="button"
                        onClick={() => { setSelectedLang(language); markChanged(); }}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.card} style={{ maxWidth: 560, marginTop: 16, padding: "20px 22px" }}>
                <div className={styles.cardHeader}>
                  <div><div className={styles.cardTitle}>Region & Currency</div></div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Time Zone</label>
                    <select className={styles.formSelect} onChange={markChanged}>
                      <option>Africa/Johannesburg (UTC+2)</option>
                      <option>Africa/Lagos (UTC+1)</option>
                      <option>Europe/London (UTC+0)</option>
                      <option>America/New_York (UTC-5)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup} style={{ marginTop: 12 }}>
                    <label className={styles.formLabel}>Currency</label>
                    <select className={styles.formSelect} value={profile.currency} onChange={(event) => { onProfileChange("currency", event.target.value); markChanged(); }}>
                      <option value="ZAR">ZAR — South African Rand (R)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="EUR">EUR — Euro (€)</option>
                      <option value="GBP">GBP — British Pound (£)</option>
                      <option value="NGN">NGN — Nigerian Naira (₦)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            ) : null}

            {activeTab === "Account" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, padding: "24px 32px", alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardTitle}>Security & 2FA</div>
                      <div className={styles.cardSub}>Protect your account with stronger sign-in controls</div>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div style={{ fontSize: ".72rem", color: "var(--muted)", marginBottom: 14 }}>Two-factor authentication is currently disabled.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className={cx(styles.button, styles.buttonAccent)} type="button" onClick={() => showToast("2FA enabled", "Authenticator setup started")}>Enable 2FA</button>
                      <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={() => showToast("Recovery codes", "Recovery code pack generated")}>Get Recovery Codes</button>
                    </div>
                  </div>
                </div>

                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardTitle}>Connected Apps</div>
                      <div className={styles.cardSub}>Manage integrations linked to your workspace</div>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {["Google Drive", "Slack", "Zapier"].map((app) => (
                        <div key={app} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: "1px solid var(--border)", background: "var(--bg)" }}>
                          <span style={{ fontSize: ".74rem", fontWeight: 700 }}>{app}</span>
                          <span style={{ marginLeft: "auto", fontSize: ".6rem", color: "var(--green)" }}>Connected</span>
                          <button className={cx(styles.button, styles.buttonGhost, styles.buttonSm)} type="button" onClick={() => showToast("App disconnected", `${app} has been disconnected`)}>
                            Disconnect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardTitle}>Data & Privacy</div>
                      <div className={styles.cardSub}>Control your data access and exports</div>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button className={cx(styles.button, styles.buttonGhost)} style={{ width: "100%" }} type="button" onClick={() => showToast("Export started", "Your data export will be emailed shortly")}>Export My Data</button>
                      <button className={cx(styles.button, styles.buttonGhost)} style={{ width: "100%" }} type="button" onClick={() => showToast("Privacy request logged", "Your account privacy request was submitted")}>Request Account Deletion</button>
                    </div>
                  </div>
                </div>

                <div className={styles.card} style={{ padding: "20px 22px" }}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardTitle}>Billing Info</div>
                      <div className={styles.cardSub}>Payment methods, invoices, and billing contacts</div>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div style={{ fontSize: ".72rem", color: "var(--muted)", marginBottom: 12 }}>Primary card ending in 2419 · Next charge on the 1st.</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button className={cx(styles.button, styles.buttonGhost)} style={{ width: "100%" }} type="button" onClick={() => showToast("Billing portal", "Opening billing management tools")}>Manage Billing</button>
                      <button className={cx(styles.button, styles.buttonGhost)} style={{ width: "100%" }} type="button" onClick={() => showToast("Invoice history", "Opening your invoice archive")}>View Invoices</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ) : null}
          </div>

          <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 5, flexShrink: 0 }}>
            <span style={{ fontSize: ".64rem", color: hasChanges ? "var(--amber)" : "var(--muted)" }}>
              {hasChanges ? "● You have unsaved changes" : "All settings saved"}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={() => showToast("Settings reset", "All preferences restored to defaults")}>Reset to Defaults</button>
              <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={() => { setHasChanges(false); showToast("Changes discarded", "Settings restored to last saved state"); }}>Discard</button>
              <button className={cx(styles.button, styles.buttonAccent)} type="button" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      </div>

      {toast ? (
        <div style={{ position: "fixed", bottom: 80, right: 28, background: "var(--surface)", border: "1px solid var(--accent)", padding: "14px 20px", zIndex: 200, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 24, height: 24, background: "var(--accent)", color: "var(--on-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, borderRadius: "50%" }}>✓</div>
          <div>
            <div style={{ fontSize: ".76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: ".6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
