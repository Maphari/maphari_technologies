"use client";

import { useState, useMemo } from "react";
import { cx, styles } from "../style";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────────── */

type IntegrationStatus = "connected" | "disconnected" | "error";
type IntegrationCategory = "communication" | "storage" | "calendar" | "development";

type IntegrationItem = {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: IntegrationStatus;
  category: IntegrationCategory;
  connectedAt?: string;
};

type WebhookItem = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered: string | null;
  createdAt: string;
};

type IntTab = "Connected" | "Available" | "Webhooks";

/* ─────────────────────────────────────────────────────────────────────────────
   Status badge map
   ───────────────────────────────────────────────────────────────────────────── */

const STATUS_BADGE: Record<IntegrationStatus, string> = {
  connected: styles.badgeGreen,
  disconnected: styles.badgeMuted,
  error: styles.badgeRed,
};

/* ─────────────────────────────────────────────────────────────────────────────
   Seed data — Integrations
   ───────────────────────────────────────────────────────────────────────────── */

const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    description: "Get real-time project notifications and milestone alerts delivered to your Slack channels.",
    status: "connected",
    category: "communication",
    connectedAt: "Jan 12, 2026",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    icon: "📁",
    description: "Sync project files, deliverables, and shared documents directly from your Drive.",
    status: "connected",
    category: "storage",
    connectedAt: "Jan 18, 2026",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    icon: "📅",
    description: "Automatically sync project milestones, meetings, and deadlines to your calendar.",
    status: "connected",
    category: "calendar",
    connectedAt: "Feb 02, 2026",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: "📦",
    description: "Upload and access project files from your Dropbox storage seamlessly.",
    status: "disconnected",
    category: "storage",
  },
  {
    id: "ms-teams",
    name: "Microsoft Teams",
    icon: "🟣",
    description: "Receive updates and collaborate via Teams channels and group chats.",
    status: "disconnected",
    category: "communication",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "🐙",
    description: "Link repositories, track commits, and sync development progress automatically.",
    status: "disconnected",
    category: "development",
  },
  {
    id: "figma",
    name: "Figma",
    icon: "🎨",
    description: "Embed Figma files, track design iterations, and share prototypes with your team.",
    status: "disconnected",
    category: "development",
  },
  {
    id: "zapier",
    name: "Zapier",
    icon: "⚡",
    description: "Automate workflows between Maphari and 5,000+ apps with Zapier triggers and actions.",
    status: "error",
    category: "communication",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Seed data — Webhooks
   ───────────────────────────────────────────────────────────────────────────── */

const INITIAL_WEBHOOKS: WebhookItem[] = [
  {
    id: "wh-1",
    url: "https://hooks.example.com/maphari/invoices",
    events: ["invoice.paid"],
    active: true,
    lastTriggered: "Feb 22, 2026",
    createdAt: "Jan 10, 2026",
  },
  {
    id: "wh-2",
    url: "https://hooks.example.com/maphari/milestones",
    events: ["milestone.completed"],
    active: true,
    lastTriggered: "Feb 18, 2026",
    createdAt: "Jan 14, 2026",
  },
  {
    id: "wh-3",
    url: "https://hooks.example.com/maphari/projects",
    events: ["project.updated"],
    active: false,
    lastTriggered: null,
    createdAt: "Feb 05, 2026",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Available webhook events
   ───────────────────────────────────────────────────────────────────────────── */

const WEBHOOK_EVENTS = [
  "invoice.paid",
  "invoice.overdue",
  "milestone.completed",
  "milestone.approved",
  "project.created",
  "project.updated",
  "message.received",
] as const;

/* ─────────────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────────────── */

export function ClientIntegrationsPage({ active }: { active: boolean }) {
  /* ── Tab state ── */
  const [activeTab, setActiveTab] = useState<IntTab>("Connected");

  /* ── Integration state ── */
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INITIAL_INTEGRATIONS);

  /* ── Webhook state ── */
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(INITIAL_WEBHOOKS);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  /* ── Toast ── */
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);

  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3200);
  };

  /* ── Derived data ── */
  const connectedIntegrations = useMemo(
    () => integrations.filter((i) => i.status === "connected"),
    [integrations]
  );

  const availableIntegrations = useMemo(
    () => integrations.filter((i) => i.status === "disconnected" || i.status === "error"),
    [integrations]
  );

  const stats = useMemo(() => ({
    connected: integrations.filter((i) => i.status === "connected").length,
    available: integrations.filter((i) => i.status !== "connected").length,
    webhooks: webhooks.length,
  }), [integrations, webhooks]);

  /* ── Handlers ── */

  const handleDisconnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: "disconnected" as IntegrationStatus, connectedAt: undefined }
          : i
      )
    );
    const name = integrations.find((i) => i.id === id)?.name ?? "Integration";
    showToast(`${name} disconnected`, "You can reconnect at any time from the Available tab.");
  };

  const handleConnect = (id: string) => {
    const today = new Date();
    const connectedAt = today.toLocaleDateString("en-ZA", { month: "short", day: "2-digit", year: "numeric" });
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: "connected" as IntegrationStatus, connectedAt }
          : i
      )
    );
    const name = integrations.find((i) => i.id === id)?.name ?? "Integration";
    showToast(`${name} connected`, "The integration is now active and syncing.");
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    );
    const wh = webhooks.find((w) => w.id === id);
    showToast(
      wh?.active ? "Webhook paused" : "Webhook activated",
      wh?.active ? "This webhook will stop receiving events." : "This webhook is now live."
    );
  };

  const handleTestWebhook = (id: string) => {
    const wh = webhooks.find((w) => w.id === id);
    showToast("Webhook test sent", `A test payload was sent to ${wh?.url ?? "the endpoint"}.`);
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    showToast("Webhook deleted", "The webhook endpoint has been removed.");
  };

  const handleToggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleAddWebhook = () => {
    if (!newWebhookUrl.trim()) {
      showToast("URL required", "Please enter a valid webhook URL.");
      return;
    }
    if (selectedEvents.length === 0) {
      showToast("Events required", "Select at least one event to subscribe to.");
      return;
    }

    const today = new Date();
    const createdAt = today.toLocaleDateString("en-ZA", { month: "short", day: "2-digit", year: "numeric" });
    const newWh: WebhookItem = {
      id: `wh-${Date.now()}`,
      url: newWebhookUrl.trim(),
      events: [...selectedEvents],
      active: true,
      lastTriggered: null,
      createdAt,
    };
    setWebhooks((prev) => [...prev, newWh]);
    setNewWebhookUrl("");
    setSelectedEvents([]);
    showToast("Webhook added", `Listening for ${newWh.events.length} event(s) at the specified URL.`);
  };

  /* ── Tabs ── */
  const tabs: IntTab[] = ["Connected", "Available", "Webhooks"];

  return (
    <section className={cx("page", active && "pageActive")} id="page-integrations">
      <div style={{ display: "flex", flex: 1, position: "relative", zIndex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
            {/* ── Page header ──────────────────────────────────────── */}
            <div className={styles.pageHeader}>
              <div>
                <div className={styles.eyebrow}>Account</div>
                <div className={styles.pageTitle}>Integrations</div>
                <div className={styles.pageSub}>
                  Connect external services, manage API webhooks, and extend your workspace with third-party tools.
                </div>
              </div>
            </div>

            {/* ── Stats row ────────────────────────────────────────── */}
            <div className={styles.statGrid}>
              {[
                { lbl: "Connected", val: String(stats.connected), sub: "Active integrations", bar: "var(--green)" },
                { lbl: "Available", val: String(stats.available), sub: "Ready to connect", bar: "var(--amber)" },
                { lbl: "Webhooks", val: String(stats.webhooks), sub: "Configured endpoints", bar: "var(--accent)" },
              ].map((s, i) => (
                <div key={s.lbl} className={styles.statCard} style={{ "--i": i } as React.CSSProperties}>
                  <div className={styles.statBar} style={{ background: s.bar }} />
                  <div className={styles.statLabel}>{s.lbl}</div>
                  <div className={styles.statValue}>{s.val}</div>
                  <div className={styles.statSub}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Filter bar ───────────────────────────────────────── */}
            <div
              className={styles.filterBar}
              style={{ padding: "0 32px", flexShrink: 0, borderBottom: "1px solid var(--border)" }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={cx("filterTab", activeTab === tab && "filterTabActive")}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                >
                  {tab}
                  {tab === "Connected" && stats.connected > 0 ? (
                    <span style={{ marginLeft: 6, fontSize: ".58rem", color: "var(--green)" }}>
                      {stats.connected}
                    </span>
                  ) : null}
                  {tab === "Available" && stats.available > 0 ? (
                    <span style={{ marginLeft: 6, fontSize: ".58rem", color: "var(--amber)" }}>
                      {stats.available}
                    </span>
                  ) : null}
                  {tab === "Webhooks" ? (
                    <span style={{ marginLeft: 6, fontSize: ".58rem", color: "var(--muted)" }}>
                      {stats.webhooks}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* ── Connected tab ─────────────────────────────────────── */}
            {activeTab === "Connected" ? (
              <div style={{ padding: "20px 0 0" }}>
                {connectedIntegrations.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 32px", color: "var(--muted2)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: 12 }}>🔌</div>
                    <div style={{ fontSize: ".82rem", fontWeight: 700, marginBottom: 4 }}>
                      No connected integrations
                    </div>
                    <div style={{ fontSize: ".66rem", color: "var(--muted)" }}>
                      Head to the Available tab to connect your first integration.
                    </div>
                  </div>
                ) : (
                  <div className={styles.integrationGrid}>
                    {connectedIntegrations.map((item, i) => (
                      <div
                        key={item.id}
                        className={styles.integrationCard}
                        style={{ "--i": i } as React.CSSProperties}
                      >
                        {/* Header */}
                        <div className={styles.integrationCardHeader}>
                          <div className={styles.integrationIcon}>{item.icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.integrationName}>{item.name}</div>
                            <div className={styles.integrationStatus}>
                              <span className={cx("badge", STATUS_BADGE[item.status])}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className={styles.integrationDesc}>{item.description}</div>

                        {/* Footer */}
                        <div className={styles.integrationFooter}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {item.connectedAt ? (
                              <div className={styles.integrationConnected}>
                                Connected since {item.connectedAt}
                              </div>
                            ) : null}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                              className={cx("button", "buttonGhost", "buttonSm")}
                              type="button"
                              onClick={() => showToast(`Configuring ${item.name}`, "Opening integration settings...")}
                            >
                              Configure
                            </button>
                            <button
                              className={cx("toggle", "toggleOn")}
                              type="button"
                              onClick={() => handleDisconnect(item.id)}
                              title="Disconnect"
                            >
                              <div className={styles.toggleKnob} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* ── Available tab ─────────────────────────────────────── */}
            {activeTab === "Available" ? (
              <div style={{ padding: "20px 0 0" }}>
                {availableIntegrations.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 32px", color: "var(--muted2)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: 12 }}>✅</div>
                    <div style={{ fontSize: ".82rem", fontWeight: 700, marginBottom: 4 }}>
                      All integrations connected
                    </div>
                    <div style={{ fontSize: ".66rem", color: "var(--muted)" }}>
                      Every available integration is already active. Nice work!
                    </div>
                  </div>
                ) : (
                  <div className={styles.integrationGrid}>
                    {availableIntegrations.map((item, i) => (
                      <div
                        key={item.id}
                        className={styles.integrationCard}
                        style={{ "--i": i } as React.CSSProperties}
                      >
                        {/* Header */}
                        <div className={styles.integrationCardHeader}>
                          <div className={styles.integrationIcon}>{item.icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.integrationName}>{item.name}</div>
                            <div className={styles.integrationStatus}>
                              <span className={cx("badge", STATUS_BADGE[item.status])}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className={styles.integrationDesc}>{item.description}</div>

                        {/* Footer */}
                        <div className={styles.integrationFooter}>
                          <div className={styles.integrationConnected}>
                            {item.status === "error" ? "Auth token expired — reconnect" : "Not connected"}
                          </div>
                          <button
                            className={cx("button", "buttonAccent")}
                            type="button"
                            onClick={() => handleConnect(item.id)}
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* ── Webhooks tab ──────────────────────────────────────── */}
            {activeTab === "Webhooks" ? (
              <div className={styles.webhookSection} style={{ paddingTop: 20 }}>
                {/* ── Add webhook form ── */}
                <div className={styles.webhookForm}>
                  <div className={styles.webhookFormTitle}>Add New Webhook</div>

                  <div className={styles.formGrid}>
                    <div>
                      <label className={styles.formLabel}>Endpoint URL</label>
                      <input
                        className={styles.formInput}
                        type="url"
                        placeholder="https://example.com/webhook"
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <label className={styles.formLabel} style={{ marginTop: 14, display: "block" }}>
                    Events to Subscribe
                  </label>

                  <div className={styles.eventCheckboxGrid}>
                    {WEBHOOK_EVENTS.map((event) => (
                      <label key={event} className={styles.eventCheckbox}>
                        <input
                          type="checkbox"
                          className={styles.eventCheckboxInput}
                          checked={selectedEvents.includes(event)}
                          onChange={() => handleToggleEvent(event)}
                        />
                        <span style={{ fontFamily: "var(--font-dm-mono)" }}>{event}</span>
                      </label>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      className={cx("button", "buttonAccent")}
                      type="button"
                      onClick={handleAddWebhook}
                    >
                      Add Webhook
                    </button>
                    {selectedEvents.length > 0 ? (
                      <span style={{ fontSize: ".6rem", color: "var(--muted)" }}>
                        {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""} selected
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* ── Webhook list ── */}
                <div style={{ background: "var(--s1)", border: "1px solid var(--b1)", borderRadius: "var(--r-md)", padding: "16px 20px" }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 700, marginBottom: 12 }}>
                    Active Webhooks
                    <span style={{ marginLeft: 8, fontSize: ".6rem", color: "var(--muted)", fontWeight: 400 }}>
                      {webhooks.length} endpoint{webhooks.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Header row */}
                  <div
                    className={styles.webhookRow}
                    style={{ borderBottom: "1px solid var(--b2)", paddingBottom: 8 }}
                  >
                    <span style={{ flex: 1, fontSize: ".54rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)" }}>
                      URL
                    </span>
                    <span style={{ width: 180, fontSize: ".54rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)" }}>
                      Events
                    </span>
                    <span style={{ width: 50, fontSize: ".54rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", textAlign: "center" }}>
                      Active
                    </span>
                    <span style={{ width: 100, fontSize: ".54rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)" }}>
                      Last Triggered
                    </span>
                    <span style={{ width: 120, fontSize: ".54rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", textAlign: "right" }}>
                      Actions
                    </span>
                  </div>

                  {webhooks.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted2)" }}>
                      <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>🪝</div>
                      <div style={{ fontSize: ".72rem", fontWeight: 600 }}>No webhooks configured</div>
                      <div style={{ fontSize: ".6rem", color: "var(--muted)", marginTop: 4 }}>
                        Use the form above to create your first webhook endpoint.
                      </div>
                    </div>
                  ) : (
                    webhooks.map((wh) => (
                      <div key={wh.id} className={styles.webhookRow}>
                        {/* URL */}
                        <div className={styles.webhookUrl} title={wh.url}>
                          {wh.url}
                        </div>

                        {/* Events */}
                        <div className={styles.webhookEvents} style={{ width: 180, flexShrink: 0 }}>
                          {wh.events.map((ev) => (
                            <span key={ev} className={cx("badge", "badgeAccent")} style={{ fontSize: ".52rem" }}>
                              {ev}
                            </span>
                          ))}
                        </div>

                        {/* Active toggle */}
                        <div style={{ width: 50, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                          <button
                            className={cx("toggle", wh.active && "toggleOn")}
                            type="button"
                            onClick={() => handleToggleWebhook(wh.id)}
                          >
                            <div className={styles.toggleKnob} />
                          </button>
                        </div>

                        {/* Last triggered */}
                        <div className={styles.webhookMeta} style={{ width: 100, flexShrink: 0 }}>
                          {wh.lastTriggered ?? "Never"}
                        </div>

                        {/* Actions */}
                        <div style={{ width: 120, display: "flex", justifyContent: "flex-end", gap: 6, flexShrink: 0 }}>
                          <button
                            className={cx("button", "buttonGhost", "buttonSm")}
                            type="button"
                            onClick={() => handleTestWebhook(wh.id)}
                          >
                            Test
                          </button>
                          <button
                            className={cx("button", "buttonGhost", "buttonSm")}
                            type="button"
                            onClick={() => handleDeleteWebhook(wh.id)}
                            style={{ color: "var(--red)" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ── Webhook info ── */}
                <div style={{ marginTop: 20, background: "var(--s1)", border: "1px solid var(--b1)", borderRadius: "var(--r-md)", padding: "16px 20px" }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 700, marginBottom: 8 }}>
                    Webhook Delivery Info
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Retry Policy", value: "3 retries with exponential backoff" },
                      { label: "Timeout", value: "30 seconds per delivery attempt" },
                      { label: "Payload Format", value: "JSON (application/json)" },
                      { label: "Signature Header", value: "X-Maphari-Signature (HMAC-SHA256)" },
                    ].map((info) => (
                      <div key={info.label}>
                        <div style={{ fontSize: ".58rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 4 }}>
                          {info.label}
                        </div>
                        <div style={{ fontSize: ".7rem", fontFamily: "var(--font-dm-mono)", color: "var(--muted)" }}>
                          {info.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Recent deliveries ── */}
                <div style={{ marginTop: 20, background: "var(--s1)", border: "1px solid var(--b1)", borderRadius: "var(--r-md)", padding: "16px 20px" }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 700, marginBottom: 12 }}>
                    Recent Deliveries
                  </div>
                  {[
                    { event: "invoice.paid", url: "hooks.example.com/maphari/invoices", status: "200 OK", time: "Feb 22, 2026 14:32", tone: "green" as const },
                    { event: "milestone.completed", url: "hooks.example.com/maphari/milestones", status: "200 OK", time: "Feb 18, 2026 09:15", tone: "green" as const },
                    { event: "project.updated", url: "hooks.example.com/maphari/projects", status: "Skipped (inactive)", time: "Feb 16, 2026 11:44", tone: "muted" as const },
                    { event: "invoice.paid", url: "hooks.example.com/maphari/invoices", status: "200 OK", time: "Feb 10, 2026 16:08", tone: "green" as const },
                    { event: "milestone.completed", url: "hooks.example.com/maphari/milestones", status: "408 Timeout", time: "Feb 06, 2026 08:50", tone: "red" as const },
                  ].map((delivery, i) => (
                    <div
                      key={`${delivery.event}-${i}`}
                      className={styles.webhookRow}
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <span className={cx("badge", "badgeAccent")} style={{ fontSize: ".52rem", flexShrink: 0 }}>
                        {delivery.event}
                      </span>
                      <div className={styles.webhookUrl} style={{ flex: 1 }}>
                        {delivery.url}
                      </div>
                      <span
                        className={cx(
                          "badge",
                          delivery.tone === "green"
                            ? "badgeGreen"
                            : delivery.tone === "red"
                            ? "badgeRed"
                            : "badgeMuted"
                        )}
                        style={{ fontSize: ".52rem", flexShrink: 0 }}
                      >
                        {delivery.status}
                      </span>
                      <div className={styles.webhookMeta}>{delivery.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────── */}
      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            right: 28,
            background: "var(--surface)",
            border: "1px solid var(--accent)",
            padding: "14px 20px",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              background: "var(--accent)",
              color: "var(--on-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: ".7rem",
              fontWeight: 700,
              borderRadius: "50%",
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontSize: ".76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: ".6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
