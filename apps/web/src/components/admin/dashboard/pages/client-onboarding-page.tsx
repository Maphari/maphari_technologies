"use client";
// ════════════════════════════════════════════════════════════════════════════
// client-onboarding-page.tsx — Admin Client Onboarding (real API)
// GET /clients/:id/onboarding  |  PATCH /clients/:id/onboarding/:rid
// ════════════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import { cx, styles } from "../style";
import { colorClass, formatDate } from "./admin-page-utils";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import { AutomationBanner } from "../../../shared/automation-banner";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAdminSnapshotWithRefresh, loadClientOnboardingWithRefresh, patchClientOnboardingRecordWithRefresh, updateClientStatusWithRefresh } from "../../../../lib/api/admin";
import type { AdminClient, ClientOnboardingRecord } from "../../../../lib/api/admin";

type ClientOnboardingPageProps = { session: AuthSession | null; onNotify: (tone: "success" | "error" | "info", message: string) => void };
type OnboardingStatus = "in-progress" | "overdue" | "complete" | "not-started";
const categories = ["Admin", "Setup", "Discovery", "Kick-off"] as const;
type Category = (typeof categories)[number];
type Tab = "active onboardings" | "template" | "analytics";
type ChecklistTask = { id: string; clientId: string; category: Category; task: string; done: boolean; doneDate?: string; owner: string; blocker?: string };
type Onboarding = { id: string; client: string; clientColor: string; avatar: string; am: string; tier: string; startedDate: string; targetDate: string; daysElapsed: number; targetDays: number; status: OnboardingStatus; contactName: string; contactEmail: string; mrr: number; checklist: ChecklistTask[] };

const categoryColors: Record<Category, string> = { Admin: "var(--accent)", Setup: "var(--blue)", Discovery: "var(--purple)", "Kick-off": "var(--amber)" };
const statusConfig: Record<OnboardingStatus, { color: string; label: string }> = {
  "in-progress": { color: "var(--blue)", label: "In Progress" },
  overdue: { color: "var(--red)", label: "Overdue" },
  complete: { color: "var(--accent)", label: "Complete" },
  "not-started": { color: "var(--muted)", label: "Not Started" }
};
const TABS: Tab[] = ["active onboardings", "template", "analytics"];
const COLORS = ["var(--accent)", "var(--blue)", "var(--purple)", "var(--amber)", "var(--red)"];

function avatarColor(i: number) { return COLORS[i % COLORS.length]; }
function initials(name: string) { return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase(); }
function toneVarClass(v: string) {
  if (v === "var(--red)") return styles.onboardToneRed;
  if (v === "var(--blue)") return styles.onboardToneBlue;
  if (v === "var(--amber)") return styles.onboardToneAmber;
  if (v === "var(--purple)") return styles.onboardTonePurple;
  if (v === "var(--muted)") return styles.onboardToneMuted;
  if (v === "var(--border)") return styles.onboardToneVarBorder;
  return styles.onboardToneAccent;
}
function fillClass(v: string) {
  if (v === "var(--red)") return styles.conbFillRed; if (v === "var(--blue)") return styles.conbFillBlue;
  if (v === "var(--amber)") return styles.conbFillAmber; if (v === "var(--purple)") return styles.conbFillPurple;
  if (v === "var(--muted)") return styles.conbFillMuted; return styles.conbFillAccent;
}
function statusClass(v: string) {
  if (v === "var(--red)") return styles.conbStatusRed; if (v === "var(--blue)") return styles.conbStatusBlue;
  if (v === "var(--amber)") return styles.conbStatusAmber; if (v === "var(--purple)") return styles.conbStatusPurple;
  if (v === "var(--muted)") return styles.conbStatusMuted; return styles.conbStatusAccent;
}
function catCardClass(v: string) {
  if (v === "var(--red)") return styles.conbCategoryCardRed; if (v === "var(--blue)") return styles.conbCategoryCardBlue;
  if (v === "var(--amber)") return styles.conbCategoryCardAmber; if (v === "var(--purple)") return styles.conbCategoryCardPurple;
  if (v === "var(--muted)") return styles.conbCategoryCardMuted; return styles.conbCategoryCardAccent;
}

function Avatar({ initials: init, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return <div className={cx(styles.onboardAvatar, toneVarClass(color), size === 28 ? "onboardAvatar28" : "onboardAvatar36", "flexCenter", "fontMono", "fw700", "noShrink")}>{init}</div>;
}

function deriveStatus(records: ClientOnboardingRecord[], createdAt: string): OnboardingStatus {
  if (!records.length) return "not-started";
  if (records.every((r) => r.status === "complete")) return "complete";
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  return days > 14 ? "overdue" : "in-progress";
}

function buildOnboarding(client: AdminClient, records: ClientOnboardingRecord[], idx: number): Onboarding {
  const checklist: ChecklistTask[] = records.map((r) => ({
    id: r.id, clientId: client.id,
    category: (categories as readonly string[]).includes(r.category) ? (r.category as Category) : "Admin",
    task: r.task, done: r.status === "complete" && r.completedAt !== null,
    doneDate: r.completedAt ? formatDate(r.completedAt) : undefined,
    owner: r.owner ?? "—",
    blocker: r.status === "blocked" ? (r.notes ?? "Blocked") : undefined
  }));
  const daysElapsed = Math.max(0, Math.floor((Date.now() - new Date(client.createdAt).getTime()) / 86400000));
  return {
    id: client.id, client: client.name, clientColor: avatarColor(idx), avatar: initials(client.name),
    am: client.ownerName ?? "—", tier: client.tier,
    startedDate: formatDate(client.createdAt),
    targetDate: formatDate(new Date(new Date(client.createdAt).getTime() + 14 * 86400000).toISOString()),
    daysElapsed, targetDays: 14, status: deriveStatus(records, client.createdAt),
    contactName: "—", contactEmail: "—", mrr: 0, checklist
  };
}

type ModalForm = { clientId: string; onboardingType: string; notes: string };

export function ClientOnboardingPage({ session, onNotify }: ClientOnboardingPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("active onboardings");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  // ── Start Onboarding modal ──────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [allClients, setAllClients] = useState<AdminClient[]>([]);
  const [modalForm, setModalForm] = useState<ModalForm>({ clientId: "", onboardingType: "standard", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const allClientsRef = useRef<AdminClient[]>([]);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const snap = await loadAdminSnapshotWithRefresh(session!);
        if (cancelled) return;
        if (snap.error || !snap.data) { onNotify("error", snap.error?.message ?? "Failed to load clients."); return; }
        const clients = snap.data.clients.filter((c) => c.status === "ONBOARDING");
        if (!clients.length) { setOnboardings([]); return; }
        const results = await Promise.all(clients.map((c) => loadClientOnboardingWithRefresh(session!, c.id)));
        if (cancelled) return;
        const built = clients.map((c, i) => buildOnboarding(c, results[i].data ?? [], i));
        setOnboardings(built);
        if (built.length) setExpanded(built[0].id);
      } catch (err: unknown) {
        if (!cancelled) onNotify("error", (err as Error)?.message ?? "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load all clients once for the modal selector
  useEffect(() => {
    if (!session || allClientsRef.current.length > 0) return;
    let cancelled = false;
    async function loadClients() {
      const snap = await loadAdminSnapshotWithRefresh(session!);
      if (cancelled || snap.error || !snap.data) return;
      allClientsRef.current = snap.data.clients;
      setAllClients(snap.data.clients);
    }
    loadClients();
    return () => { cancelled = true; };
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  function openModal() {
    setModalForm({ clientId: "", onboardingType: "standard", notes: "" });
    setShowModal(true);
  }

  async function handleStartOnboarding() {
    if (!session || !modalForm.clientId) return;
    const client = allClients.find((c) => c.id === modalForm.clientId);
    if (!client) return;
    setSubmitting(true);
    const res = await updateClientStatusWithRefresh(session, modalForm.clientId, "ONBOARDING");
    if (res.error) {
      onNotify("error", res.error.message ?? "Failed to start onboarding.");
      setSubmitting(false);
      return;
    }
    // Persist refreshed session if withAuthorizedSession obtained a new token
    if (res.nextSession) saveSession(res.nextSession);
    onNotify("success", `Onboarding started for ${client.name}.`);
    setShowModal(false);
    setSubmitting(false);
    // Reload onboarding list to reflect the newly onboarding client
    setLoading(true);
    const activeSession = res.nextSession ?? session;
    const snap = await loadAdminSnapshotWithRefresh(activeSession);
    if (!snap.error && snap.data) {
      const clients = snap.data.clients.filter((c) => c.status === "ONBOARDING");
      if (!clients.length) { setOnboardings([]); setLoading(false); return; }
      const results = await Promise.all(clients.map((c) => loadClientOnboardingWithRefresh(activeSession, c.id)));
      const built = clients.map((c, i) => buildOnboarding(c, results[i].data ?? [], i));
      setOnboardings(built);
      if (built.length) setExpanded(built[0].id);
    }
    setLoading(false);
  }

  async function handleMarkComplete(onb: Onboarding) {
    if (!session) return;
    const pending = onb.checklist.filter((t) => !t.done);
    if (!pending.length) return;
    setMarking(onb.id);
    const now = new Date().toISOString();
    const res = await Promise.all(pending.map((t) => patchClientOnboardingRecordWithRefresh(session, onb.id, t.id, { status: "complete", completedAt: now })));
    const err = res.find((r) => r.error);
    if (err) { onNotify("error", err.error?.message ?? "Failed to mark complete."); }
    else {
      onNotify("success", `${onb.client} onboarding marked complete.`);
      setOnboardings((prev) => prev.map((o) => o.id !== onb.id ? o : { ...o, status: "complete" as OnboardingStatus, checklist: o.checklist.map((t) => ({ ...t, done: true, doneDate: formatDate(now) })) }));
    }
    setMarking(null);
  }

  const active = onboardings.filter((o) => o.status !== "complete");
  const complete = onboardings.filter((o) => o.status === "complete");
  const overdue = onboardings.filter((o) => o.status === "overdue");
  const avgDays = Math.round(complete.reduce((s, o) => s + o.daysElapsed, 0) / (complete.length || 1));
  const templateSource = onboardings[0]?.checklist ?? [];

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  const onboardingChartData = [
    { label: "Kickoff", count: onboardings.filter(o => o.checklist.some(t => t.category === "Kick-off" && t.done)).length },
    { label: "Setup", count: onboardings.filter(o => o.checklist.some(t => t.category === "Setup" && t.done)).length },
    { label: "Discovery", count: onboardings.filter(o => o.checklist.some(t => t.category === "Discovery" && t.done)).length },
    { label: "Admin", count: onboardings.filter(o => o.checklist.some(t => t.category === "Admin" && t.done)).length },
  ];

  const totalTasks = onboardings.reduce((s, o) => s + o.checklist.length, 0);
  const doneTasks = onboardings.reduce((s, o) => s + o.checklist.filter(t => t.done).length, 0);
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const tableRows = onboardings.map(o => ({
    client: o.client,
    stage: o.status === "complete" ? "Live" : o.status === "overdue" ? "Overdue" : "In Progress",
    progress: `${Math.round((o.checklist.filter(t => t.done).length / Math.max(o.checklist.length, 1)) * 100)}%`,
    started: o.startedDate,
    status: o.status,
  }));

  return (
    <div className={cx(styles.pageBody, styles.onboardRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>EXPERIENCE / ONBOARDING</div>
          <h1 className={styles.pageTitle}>Client Onboarding</h1>
          <div className={styles.pageSub}>Onboarding pipeline · Time to live · Checklist completion</div>
        </div>
        <div className={styles.pageActions}><button type="button" className={cx("btnSm", "btnAccent")} onClick={openModal}>+ Start Onboarding</button></div>
      </div>

      {/* ── Automation: overdue onboardings escalation ───────────────── */}
      <AutomationBanner
        show={overdue.length > 0}
        variant="error"
        icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2v8M8 12.5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M3 14h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        }
        title={`${overdue.length} onboarding${overdue.length > 1 ? "s" : ""} past target date`}
        description="Clients stuck in onboarding churn faster. Escalation emails will be sent to account managers and flagged in the delivery queue."
        actionLabel="Escalate all"
        onAction={() => {
          onNotify("info", "Escalation requests sent to overdue onboarding clients. Account managers will be notified.");
        }}
        dismissKey={`admin:onb-escalate-banner:${overdue.map((o) => o.id).sort().join(",")}`}
        secondaryLabel="View overdue"
        onSecondary={() => {/* parent handles tab navigation */}}
      />

      {/* Row 1 — Stat widgets */}
      <WidgetGrid>
        <StatWidget label="Active Onboardings" value={active.length} sub={`${overdue.length} overdue`} subTone={overdue.length > 0 ? "warn" : "neutral"} tone="accent" />
        <StatWidget label="Completed This Month" value={complete.length} sub={`Avg ${avgDays} days`} subTone="up" tone="green" />
        <StatWidget label="Avg Days to Complete" value={avgDays} sub="Target: 14 days" tone={avgDays > 14 ? "amber" : "default"} />
        <StatWidget label="Stuck / Blocked" value={overdue.length} sub="Past target date" tone={overdue.length > 0 ? "red" : "default"} />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Onboardings by Stage"
          data={onboardingChartData}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Onboarding Pipeline"
          stages={[
            { label: "Kickoff", count: onboardings.filter(o => o.status !== "not-started").length, total: Math.max(onboardings.length, 1), color: "#8b6fff" },
            { label: "Setup", count: onboardings.filter(o => o.checklist.some(t => t.category === "Setup" && t.done)).length, total: Math.max(onboardings.length, 1), color: "#34d98b" },
            { label: "Training", count: onboardings.filter(o => o.checklist.some(t => t.category === "Discovery" && t.done)).length, total: Math.max(onboardings.length, 1), color: "#f5a623" },
            { label: "Live", count: complete.length, total: Math.max(onboardings.length, 1), color: "#34d98b" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Active Onboardings"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "client", header: "Client" },
            { key: "stage", header: "Stage" },
            { key: "progress", header: "Progress", align: "right" },
            { key: "started", header: "Started", align: "right" },
            { key: "status", header: "Status", align: "right", render: (v) => {
              const val = v as string;
              const cls = val === "complete" ? cx("badge", "badgeGreen") : val === "overdue" ? cx("badge", "badgeRed") : cx("badge", "badgeAmber");
              const label = val === "complete" ? "Complete" : val === "overdue" ? "Overdue" : "In Progress";
              return <span className={cls}>{label}</span>;
            }},
          ]}
          emptyMessage="No onboardings found"
        />
      </WidgetGrid>

      {/* ── Start Onboarding Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) setShowModal(false); }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHd}>
              <span className={styles.modalTitle}>Start Onboarding</span>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                aria-label="Close"
                disabled={submitting}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Client selector */}
              <div>
                <label className={cx("text11", "colorMuted", "mb4")} style={{ display: "block", marginBottom: 6 }}>
                  Client <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <select
                  title="Select client"
                  className="inputSm"
                  value={modalForm.clientId}
                  disabled={submitting}
                  onChange={(e) => setModalForm((f) => ({ ...f, clientId: e.target.value }))}
                >
                  <option value="">— Select a client —</option>
                  {allClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.status === "ONBOARDING" ? " (already onboarding)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Onboarding type */}
              <div>
                <label className={cx("text11", "colorMuted", "mb4")} style={{ display: "block", marginBottom: 6 }}>
                  Onboarding Type
                </label>
                <select
                  title="Onboarding type"
                  className="inputSm"
                  value={modalForm.onboardingType}
                  disabled={submitting}
                  onChange={(e) => setModalForm((f) => ({ ...f, onboardingType: e.target.value }))}
                >
                  <option value="standard">Standard (14-day checklist)</option>
                  <option value="enterprise">Enterprise (custom timeline)</option>
                  <option value="rapid">Rapid (7-day accelerated)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className={cx("text11", "colorMuted", "mb4")} style={{ display: "block", marginBottom: 6 }}>
                  Notes <span className={cx("text10", "colorMuted")}>(optional)</span>
                </label>
                <textarea
                  className="inputSm"
                  rows={3}
                  placeholder="Any specific context or instructions for this onboarding..."
                  value={modalForm.notes}
                  disabled={submitting}
                  onChange={(e) => setModalForm((f) => ({ ...f, notes: e.target.value }))}
                  style={{ resize: "vertical", width: "100%", fontFamily: "inherit" }}
                />
              </div>

              {/* Actions */}
              <div className={cx("flexRow", "gap8", "flexEnd")} style={{ marginTop: 4 }}>
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost")}
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  disabled={submitting || !modalForm.clientId}
                  onClick={() => void handleStartOnboarding()}
                >
                  {submitting ? "Starting…" : "Start Onboarding"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
