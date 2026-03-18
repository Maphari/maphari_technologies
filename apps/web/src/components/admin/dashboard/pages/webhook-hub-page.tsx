// ════════════════════════════════════════════════════════════════════════════
// webhook-hub-page.tsx — Admin Webhook & Integration Hub
// Data sources:
//   Webhooks — GET /admin/webhooks (core in-memory JSON store)
//   CRUD     — POST / PATCH / DELETE /admin/webhooks
//   Test     — POST /admin/webhooks/:id/test
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadWebhooksWithRefresh,
  createWebhookWithRefresh,
  updateWebhookWithRefresh,
  deleteWebhookWithRefresh,
  testWebhookWithRefresh,
  type WebhookConfig,
  type WebhookTestResult,
} from "../../../../lib/api/admin/webhooks";
import { cx, styles } from "../style";

// ── Event topic grouping ───────────────────────────────────────────────────
// Topic string values mirror packages/platform/src/events/topics.ts exactly.

interface EventGroup {
  label: string;
  topics: Array<{ key: string; value: string }>;
}

const EVENT_GROUPS: EventGroup[] = [
  {
    label: "Billing",
    topics: [
      { key: "invoiceIssued",  value: "billing.invoice.issued"  },
      { key: "invoicePaid",    value: "billing.invoice.paid"    },
      { key: "invoiceOverdue", value: "billing.invoice.overdue" },
    ],
  },
  {
    label: "Projects",
    topics: [
      { key: "projectCreated",       value: "core.project.created"        },
      { key: "projectStatusUpdated", value: "core.project.status-updated" },
      { key: "projectCompleted",     value: "core.project.completed"      },
    ],
  },
  {
    label: "Leads & Clients",
    topics: [
      { key: "leadCreated",         value: "core.lead.created"           },
      { key: "leadStatusUpdated",   value: "core.lead.status-updated"    },
      { key: "leadFollowUpDue",     value: "core.lead.follow-up-due"     },
      { key: "clientCreated",       value: "core.client.created"         },
      { key: "clientStatusUpdated", value: "core.client.status-updated"  },
      { key: "clientRenewalDue",    value: "core.client.renewal-due"     },
    ],
  },
  {
    label: "Auth",
    topics: [
      { key: "userLoggedIn",   value: "auth.user.logged-in"   },
      { key: "tokenRefreshed", value: "auth.token.refreshed"  },
    ],
  },
  {
    label: "AI",
    topics: [
      { key: "aiLeadQualified",     value: "ai.lead.qualified"     },
      { key: "aiProposalDrafted",   value: "ai.proposal.drafted"   },
      { key: "aiEstimateGenerated", value: "ai.estimate.generated" },
    ],
  },
  {
    label: "Operations",
    topics: [
      { key: "proposalSigned",            value: "core.proposal.signed"              },
      { key: "bookingCreated",            value: "core.booking.created"              },
      { key: "onboardingSubmitted",       value: "core.onboarding.submitted"         },
      { key: "taskAssigned",              value: "core.task.assigned"                },
      { key: "appointmentCreated",        value: "core.appointment.created"          },
      { key: "fileUploaded",              value: "files.file.uploaded"               },
      { key: "reportGenerated",           value: "reporting.report.generated"        },
      { key: "testimonialReceived",       value: "growth.testimonial.received"       },
      { key: "clientReengagementDue",     value: "growth.client.reengagement-due"    },
      { key: "maintenanceCheckCompleted", value: "ops.maintenance.check-completed"   },
      { key: "securityIncidentDetected",  value: "security.incident.detected"        },
    ],
  },
];

const ALL_TOPIC_VALUES = EVENT_GROUPS.flatMap((g) => g.topics.map((t) => t.value));

// ── Modal form state ──────────────────────────────────────────────────────

interface ModalState {
  mode: "add" | "edit";
  id: string | null;
  name: string;
  url: string;
  selectedEvents: string[];
  secret: string;
  active: boolean;
}

function emptyModal(): ModalState {
  return { mode: "add", id: null, name: "", url: "", selectedEvents: [], secret: "", active: true };
}

function modalFromWebhook(wh: WebhookConfig): ModalState {
  return {
    mode: "edit",
    id: wh.id,
    name: wh.name,
    url: wh.url,
    selectedEvents: wh.events,
    secret: wh.secret ?? "",
    active: wh.active,
  };
}

// ── Main component ────────────────────────────────────────────────────────

export function WebhookHubPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "info" | "warning", message: string) => void;
}) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(emptyModal());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, WebhookTestResult>>({});

  // ── Load webhooks ─────────────────────────────────────────────────────────
  const loadHooks = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const r = await loadWebhooksWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setWebhooks(r.data);
      else if (r.error) onNotify("error", r.error.message);
    } finally {
      setLoading(false);
    }
  }, [session, onNotify]);

  useEffect(() => { void loadHooks(); }, [loadHooks]);

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!session || saving) return;
    if (!modal.name.trim() || !modal.url.trim() || modal.selectedEvents.length === 0) {
      onNotify("warning", "Name, URL, and at least one event are required.");
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === "add") {
        const r = await createWebhookWithRefresh(session, {
          name: modal.name.trim(),
          url: modal.url.trim(),
          events: modal.selectedEvents,
          secret: modal.secret.trim() || undefined,
          active: modal.active,
        });
        if (r.nextSession) saveSession(r.nextSession);
        if (r.data) {
          setWebhooks((prev) => [...prev, r.data!]);
          onNotify("success", `Webhook "${r.data.name}" created.`);
          setModalOpen(false);
        } else if (r.error) {
          onNotify("error", r.error.message);
        }
      } else if (modal.id) {
        const r = await updateWebhookWithRefresh(session, modal.id, {
          name: modal.name.trim(),
          url: modal.url.trim(),
          events: modal.selectedEvents,
          secret: modal.secret.trim() || null,
          active: modal.active,
        });
        if (r.nextSession) saveSession(r.nextSession);
        if (r.data) {
          setWebhooks((prev) => prev.map((w) => (w.id === modal.id ? r.data! : w)));
          onNotify("success", `Webhook "${r.data.name}" updated.`);
          setModalOpen(false);
        } else if (r.error) {
          onNotify("error", r.error.message);
        }
      }
    } finally {
      setSaving(false);
    }
  }, [session, saving, modal, onNotify]);

  // ── Toggle active ─────────────────────────────────────────────────────────
  const handleToggleActive = useCallback(async (wh: WebhookConfig) => {
    if (!session) return;
    const r = await updateWebhookWithRefresh(session, wh.id, { active: !wh.active });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) {
      setWebhooks((prev) => prev.map((w) => (w.id === wh.id ? r.data! : w)));
    } else if (r.error) {
      onNotify("error", r.error.message);
    }
  }, [session, onNotify]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    if (!session || deletingId) return;
    setDeletingId(id);
    try {
      const r = await deleteWebhookWithRefresh(session, id);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
        onNotify("success", "Webhook deleted.");
      } else if (r.error) {
        onNotify("error", r.error.message);
      }
    } finally {
      setDeletingId(null);
    }
  }, [session, deletingId, onNotify]);

  // ── Test ──────────────────────────────────────────────────────────────────
  const handleTest = useCallback(async (id: string) => {
    if (!session || testingId) return;
    setTestingId(id);
    try {
      const r = await testWebhookWithRefresh(session, id);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setTestResults((prev) => ({ ...prev, [id]: r.data! }));
        onNotify(r.data.ok ? "success" : "warning", `Test delivery: ${r.data.statusCode} (${r.data.latencyMs}ms)`);
      } else if (r.error) {
        onNotify("error", r.error.message);
      }
    } finally {
      setTestingId(null);
    }
  }, [session, testingId, onNotify]);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function toggleModalEvent(topic: string) {
    setModal((prev) => ({
      ...prev,
      selectedEvents: prev.selectedEvents.includes(topic)
        ? prev.selectedEvents.filter((e) => e !== topic)
        : [...prev.selectedEvents, topic],
    }));
  }

  function toggleAllEvents() {
    setModal((prev) => ({
      ...prev,
      selectedEvents: prev.selectedEvents.length === ALL_TOPIC_VALUES.length ? [] : [...ALL_TOPIC_VALUES],
    }));
  }

  // ── Derived: which event topics have at least one subscriber ──────────────
  const subscribedTopics = new Set(webhooks.flatMap((w) => w.events));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={cx(styles.pageBody)}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / AUTOMATION</div>
          <h1 className={styles.pageTitle}>Webhook &amp; Integration Hub</h1>
          <div className={styles.pageSub}>Send real-time events to Zapier, Make, or your own systems</div>
        </div>
        <button
          type="button"
          className={cx("btnSm", "btnAccent")}
          onClick={() => { setModal(emptyModal()); setModalOpen(true); }}
        >
          + Add Webhook
        </button>
      </div>

      {/* Zapier/Make hint */}
      <div className={cx(styles.infoCard, "mb20")} style={{ fontSize: "0.8rem" }}>
        <strong>Quick start:</strong> In Zapier, choose <em>Webhooks by Zapier</em> → <em>Catch Hook</em>, copy the URL, and paste it here. For Make, use an <em>HTTP → Webhook</em> module. Subscribe to any events below and we will POST signed JSON payloads to your URL.
      </div>

      {/* Two-column layout */}
      <div className={styles.whLayout}>

        {/* Left — event categories panel */}
        <aside className={styles.whEventPanel}>
          <div className={cx(styles.whEventGroupTitle, "mb12")}>Event Topics</div>
          {EVENT_GROUPS.map((group) => (
            <div key={group.label} className={styles.whEventGroup}>
              <div className={styles.whEventGroupTitle}>{group.label}</div>
              {group.topics.map((t) => {
                const count = webhooks.filter((w) => w.events.includes(t.value)).length;
                return (
                  <div key={t.key} className={styles.whEventRow}>
                    <span style={{ fontFamily: "var(--font-dm-mono, monospace)", fontSize: "0.72rem" }}>
                      {t.value}
                    </span>
                    {count > 0 && (
                      <span style={{
                        background: "color-mix(in srgb, var(--accent, #8b6fff) 15%, transparent)",
                        color: "var(--accent, #8b6fff)",
                        fontSize: "0.62rem",
                        padding: "1px 5px",
                        borderRadius: "6px",
                        fontWeight: 700,
                      }}>
                        {count}
                      </span>
                    )}
                    {!subscribedTopics.has(t.value) && (
                      <span style={{ fontSize: "0.62rem", color: "var(--text-muted, #666)" }}>—</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Right — webhook cards */}
        <div>
          {loading && (
            <div className={cx("text12", "colorMuted", "py20")}>Loading webhooks…</div>
          )}

          {!loading && webhooks.length === 0 && (
            <div className={cx(styles.emptyState)}>
              <div className={cx(styles.emptyStateTitle)}>No webhooks configured</div>
              <div className={cx(styles.emptyStateSub)}>
                Connect Zapier, Make, or your own systems by adding your first webhook above.
              </div>
            </div>
          )}

          {webhooks.map((wh) => {
            const testResult = testResults[wh.id];
            return (
              <div key={wh.id} className={styles.whCard}>
                <div className={styles.whCardHeader}>
                  {/* Active toggle */}
                  <label className={styles.whToggle} title={wh.active ? "Active — click to disable" : "Inactive — click to enable"}>
                    <input
                      type="checkbox"
                      className={styles.whToggleInput}
                      checked={wh.active}
                      onChange={() => void handleToggleActive(wh)}
                    />
                    <span className={styles.whToggleSlider} />
                  </label>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 2 }}>{wh.name}</div>
                    <div className={styles.whCardUrl}>{wh.url}</div>
                  </div>

                  {wh.failCount > 0 && (
                    <span className={styles.whFailBadge} title="Failed deliveries">
                      {wh.failCount} fail{wh.failCount !== 1 ? "s" : ""}
                    </span>
                  )}

                  {/* Actions */}
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    disabled={testingId === wh.id}
                    onClick={() => void handleTest(wh.id)}
                    title="Send a test payload"
                  >
                    {testingId === wh.id ? "…" : "Test"}
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={() => { setModal(modalFromWebhook(wh)); setModalOpen(true); }}
                    title="Edit webhook"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    disabled={deletingId === wh.id}
                    onClick={() => void handleDelete(wh.id)}
                    title="Delete webhook"
                    style={{ color: "var(--red, #f87171)" }}
                  >
                    {deletingId === wh.id ? "…" : "Delete"}
                  </button>
                </div>

                {/* Event badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: wh.lastFiredAt ? 8 : 0 }}>
                  {wh.events.map((ev) => (
                    <span
                      key={ev}
                      style={{
                        background: "var(--s2)",
                        border: "1px solid var(--b2)",
                        borderRadius: "var(--r-xs, 6px)",
                        fontSize: "0.68rem",
                        padding: "2px 7px",
                        fontFamily: "var(--font-dm-mono, monospace)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {ev}
                    </span>
                  ))}
                </div>

                {/* Meta row */}
                {wh.lastFiredAt && (
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 6 }}>
                    Last fired: {new Date(wh.lastFiredAt).toLocaleString()}
                  </div>
                )}

                {/* Test result */}
                {testResult && (
                  <div
                    className={styles.whTestResult}
                    style={{ color: testResult.ok ? "var(--accent, #8b6fff)" : "var(--red, #f87171)" }}
                  >
                    {testResult.ok ? "OK" : "FAIL"} — HTTP {testResult.statusCode} — {testResult.latencyMs}ms
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Add / Edit modal ────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={modal.mode === "add" ? "Add webhook" : "Edit webhook"}
        >
          <div
            className={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560, width: "100%" }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                {modal.mode === "add" ? "Add Webhook" : "Edit Webhook"}
              </div>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Name */}
              <div>
                <label className={cx(styles.filterLabel, "mb4")} htmlFor="wh-name">Name</label>
                <input
                  id="wh-name"
                  className={cx(styles.filterInput)}
                  type="text"
                  placeholder="e.g. Zapier Invoice Trigger"
                  value={modal.name}
                  onChange={(e) => setModal((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              {/* URL */}
              <div>
                <label className={cx(styles.filterLabel, "mb4")} htmlFor="wh-url">Endpoint URL</label>
                <input
                  id="wh-url"
                  className={cx(styles.filterInput)}
                  type="url"
                  placeholder="https://hooks.zapier.com/…"
                  value={modal.url}
                  onChange={(e) => setModal((p) => ({ ...p, url: e.target.value }))}
                />
              </div>

              {/* Secret */}
              <div>
                <label className={cx(styles.filterLabel, "mb4")} htmlFor="wh-secret">
                  Signing Secret <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
                </label>
                <input
                  id="wh-secret"
                  className={cx(styles.filterInput)}
                  type="password"
                  placeholder="Used for X-Maphari-Signature HMAC header"
                  value={modal.secret}
                  onChange={(e) => setModal((p) => ({ ...p, secret: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>

              {/* Active toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label className={styles.whToggle} htmlFor="wh-active" title="Active">
                  <input
                    id="wh-active"
                    type="checkbox"
                    className={styles.whToggleInput}
                    checked={modal.active}
                    onChange={(e) => setModal((p) => ({ ...p, active: e.target.checked }))}
                  />
                  <span className={styles.whToggleSlider} />
                </label>
                <span style={{ fontSize: "0.82rem" }}>
                  {modal.active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Events multi-select */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label className={styles.filterLabel}>Events</label>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={toggleAllEvents}
                    style={{ fontSize: "0.7rem" }}
                  >
                    {modal.selectedEvents.length === ALL_TOPIC_VALUES.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div style={{
                  maxHeight: 260,
                  overflowY: "auto",
                  border: "1px solid var(--b2)",
                  borderRadius: "var(--r-sm)",
                  padding: "10px 12px",
                  background: "var(--s1)",
                }}>
                  {EVENT_GROUPS.map((group) => (
                    <div key={group.label} style={{ marginBottom: 12 }}>
                      <div className={styles.whEventGroupTitle}>{group.label}</div>
                      {group.topics.map((t) => (
                        <label
                          key={t.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "3px 0",
                            cursor: "pointer",
                            fontSize: "0.78rem",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={modal.selectedEvents.includes(t.value)}
                            onChange={() => toggleModalEvent(t.value)}
                            style={{ accentColor: "var(--accent, #8b6fff)" }}
                          />
                          <span style={{ fontFamily: "var(--font-dm-mono, monospace)", fontSize: "0.72rem" }}>
                            {t.value}
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
                {modal.selectedEvents.length > 0 && (
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                    {modal.selectedEvents.length} event{modal.selectedEvents.length !== 1 ? "s" : ""} selected
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost")}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  {saving ? "Saving…" : modal.mode === "add" ? "Create Webhook" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
