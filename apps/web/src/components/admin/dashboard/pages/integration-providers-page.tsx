// ════════════════════════════════════════════════════════════════════════════
// integration-providers-page.tsx — Admin Integration Provider Management
// Data     : loadIntegrationProvidersWithRefresh   → GET  /admin/integrations/providers
//            updateIntegrationProviderWithRefresh  → PATCH /admin/integrations/providers/:id
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadIntegrationProvidersWithRefresh,
  updateIntegrationProviderWithRefresh,
  type AdminIntegrationProvider,
} from "../../../../lib/api/admin/integrations";

// ── Helpers ───────────────────────────────────────────────────────────────────
function kindBadgeClass(k: string): string {
  if (k === "oauth") return "badgePurple";
  if (k === "assisted") return "badgeAmber";
  if (k === "coming_soon") return "badgeMuted";
  return "badge";
}

function kindLabel(k: string): string {
  if (k === "oauth") return "OAuth";
  if (k === "assisted") return "Assisted";
  if (k === "coming_soon") return "Coming Soon";
  return k;
}

function availabilityLabel(s: string): string {
  const m: Record<string, string> = {
    active: "Active",
    beta: "Beta",
    hidden: "Hidden",
    coming_soon: "Coming Soon",
    deprecated: "Deprecated",
  };
  return m[s] ?? s;
}

type AvailabilityStatus = "active" | "beta" | "hidden" | "coming_soon" | "deprecated";

const AVAILABILITY_SECTIONS: { key: AvailabilityStatus; label: string }[] = [
  { key: "active",      label: "Active Providers" },
  { key: "beta",        label: "Beta Providers" },
  { key: "coming_soon", label: "Coming Soon" },
  { key: "hidden",      label: "Hidden / Deprecated" },
];

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({
  provider,
  onSave,
  onClose,
}: {
  provider: AdminIntegrationProvider;
  onSave: (id: string, data: Partial<AdminIntegrationProvider>) => Promise<void>;
  onClose: () => void;
}) {
  const [label, setLabel]         = useState(provider.label);
  const [description, setDesc]    = useState(provider.description);
  const [category, setCategory]   = useState(provider.category);
  const [availability, setAvail]  = useState<AvailabilityStatus>(provider.availabilityStatus as AvailabilityStatus);
  const [isRequestEnabled, setIsRequestEnabled] = useState(provider.isRequestEnabled);
  const [isClientVisible, setIsClientVisible]   = useState(provider.isClientVisible);
  const [sortOrder, setSortOrder] = useState(provider.sortOrder);
  const [saving, setSaving]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(provider.id, {
      label: label.trim(),
      description: description.trim(),
      category: category.trim(),
      availabilityStatus: availability,
      isRequestEnabled,
      isClientVisible,
      sortOrder,
    });
    setSaving(false);
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={cx("ipEditModal")} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHd}>
          <span className={styles.modalTitle}>Edit Provider — {provider.key}</span>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <label className={styles.fieldLabel}>Label *</label>
          <input
            className={styles.fieldInput}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Provider display label…"
            required
          />

          <label className={styles.fieldLabel}>Description</label>
          <textarea
            className={cx("ipModalTextarea")}
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Short description of this integration…"
            rows={3}
          />

          <label className={styles.fieldLabel}>Category</label>
          <input
            className={styles.fieldInput}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Productivity, CRM, Finance…"
          />

          <label className={styles.fieldLabel}>Availability Status</label>
          <select
            className={styles.fieldInput}
            value={availability}
            onChange={(e) => setAvail(e.target.value as AvailabilityStatus)}
          >
            <option value="active">Active</option>
            <option value="beta">Beta</option>
            <option value="hidden">Hidden</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="deprecated">Deprecated</option>
          </select>

          <label className={styles.fieldLabel}>Sort Order</label>
          <input
            className={styles.fieldInput}
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            min={0}
            step={1}
          />

          <div className={cx("ipToggleRow")}>
            <div className={cx("ipToggleItem")}>
              <span className={cx("text13")}>Requestable by clients</span>
              <button
                type="button"
                className={cx("ipTogglePill", isRequestEnabled ? "ipTogglePillOn" : "ipTogglePillOff")}
                onClick={() => setIsRequestEnabled(!isRequestEnabled)}
              >
                {isRequestEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>
            <div className={cx("ipToggleItem")}>
              <span className={cx("text13")}>Visible to clients</span>
              <button
                type="button"
                className={cx("ipTogglePill", isClientVisible ? "ipTogglePillOn" : "ipTogglePillOff")}
                onClick={() => setIsClientVisible(!isClientVisible)}
              >
                {isClientVisible ? "Visible" : "Hidden"}
              </button>
            </div>
          </div>

          <div className={cx("flexEnd", "gap8", "mt8")}>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={onClose}>Cancel</button>
            <button type="submit" className={cx("btnSm", "btnAccent")} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Provider card ─────────────────────────────────────────────────────────────
function ProviderCard({
  provider,
  onEdit,
}: {
  provider: AdminIntegrationProvider;
  onEdit: (p: AdminIntegrationProvider) => void;
}) {
  return (
    <div className={cx("ipCard")}>
      <div className={cx("ipCardTop")}>
        <div className={cx("ipCardInfo")}>
          <span className={cx("ipCardLabel", "fw600")}>{provider.label}</span>
          <span className={cx("ipCardCategory", "text12", "colorMuted")}>{provider.category}</span>
        </div>
        <span className={cx("badge", kindBadgeClass(provider.kind))}>{kindLabel(provider.kind)}</span>
      </div>

      {provider.description && (
        <p className={cx("ipCardDesc")}>{provider.description}</p>
      )}

      <div className={cx("ipCardMeta")}>
        <span className={cx("ipTogglePill", provider.isRequestEnabled ? "ipTogglePillOn" : "ipTogglePillOff")}>
          {provider.isRequestEnabled ? "Requestable" : "Not requestable"}
        </span>
        <span className={cx("ipTogglePill", provider.isClientVisible ? "ipTogglePillOn" : "ipTogglePillOff")}>
          {provider.isClientVisible ? "Client visible" : "Hidden from clients"}
        </span>
        <span className={cx("ipSortOrder", "text11", "colorMuted")}>#{provider.sortOrder}</span>
      </div>

      <div className={cx("ipCardFooter")}>
        <span className={cx("text11", "colorMuted", "fontMono")}>{provider.key}</span>
        <button
          type="button"
          className={cx("btnXs", "btnGhost")}
          onClick={() => onEdit(provider)}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function IntegrationProvidersPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}) {
  const [providers, setProviders]       = useState<AdminIntegrationProvider[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [editingProvider, setEditing]   = useState<AdminIntegrationProvider | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadIntegrationProvidersWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message ?? "Failed to load."); }
      else if (r.data) setProviders(r.data);
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      setLoading(false);
    });
  }, [session]);

  async function handleSave(id: string, data: Partial<AdminIntegrationProvider>) {
    if (!session) return;
    const r = await updateIntegrationProviderWithRefresh(session, id, data);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      onNotify("error", r.error.message);
      return;
    }
    if (r.data) {
      setProviders((prev) => prev.map((p) => p.id === id ? { ...p, ...r.data } : p));
      onNotify("success", "Provider updated.");
      setEditing(null);
    }
  }

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

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  // Group providers by availability
  const grouped = Object.fromEntries(
    AVAILABILITY_SECTIONS.map(({ key }) => [
      key,
      providers
        .filter((p) => {
          if (key === "hidden") return p.availabilityStatus === "hidden" || p.availabilityStatus === "deprecated";
          return p.availabilityStatus === key;
        })
        .sort((a, b) => a.sortOrder - b.sortOrder),
    ])
  ) as Record<string, AdminIntegrationProvider[]>;

  // Build chart data: connections per provider
  const providerChartData = providers.map((p) => ({
    name: p.label,
    connections: p.sortOrder,
  }));

  const enabledCount = providers.filter((p) => p.availabilityStatus === "active" || p.availabilityStatus === "beta").length;
  const disabledCount = providers.filter((p) => p.availabilityStatus === "hidden" || p.availabilityStatus === "deprecated" || p.availabilityStatus === "coming_soon").length;

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>AUTOMATION / INTEGRATIONS</div>
          <h1 className={styles.pageTitle}>Provider Management</h1>
          <div className={styles.pageSub}>Configure integration providers, visibility, and request availability</div>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────── */}
      <WidgetGrid columns={4}>
        <StatWidget label="Total Providers" value={String(providers.length)} tone="accent" />
        <StatWidget label="Active" value={String((grouped["active"] ?? []).length)} tone="green" />
        <StatWidget label="Enabled" value={String(enabledCount)} sub="Active + Beta" />
        <StatWidget label="Disabled" value={String(disabledCount)} tone="red" sub="Hidden / Deprecated" subTone={disabledCount > 0 ? "red" : undefined} />
      </WidgetGrid>

      {/* ── Charts & Pipeline ───────────────────────────────────────────── */}
      <WidgetGrid columns={2}>
        <ChartWidget
          label="Connections per Provider"
          data={providerChartData}
          dataKey="connections"
          xKey="name"
          type="bar"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Provider Status"
          stages={[
            { label: "Active", count: (grouped["active"] ?? []).length, total: Math.max(providers.length, 1), color: "#34d98b" },
            { label: "Beta", count: (grouped["beta"] ?? []).length, total: Math.max(providers.length, 1), color: "#f5a623" },
            { label: "Coming Soon", count: (grouped["coming_soon"] ?? []).length, total: Math.max(providers.length, 1), color: "#8b6fff" },
            { label: "Hidden / Deprecated", count: (grouped["hidden"] ?? []).length, total: Math.max(providers.length, 1), color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* ── Providers Table ─────────────────────────────────────────────── */}
      <TableWidget
        label="Integration Providers"
        rows={providers}
        rowKey="id"
        emptyMessage="Integration providers will appear here once configured."
        columns={[
          { key: "name", header: "Name", render: (_, row) => row.label },
          { key: "category", header: "Category", render: (_, row) => row.category },
          { key: "status", header: "Status", render: (_, row) => (
            <span className={cx("badge", row.availabilityStatus === "active" ? "badgeGreen" : row.availabilityStatus === "beta" ? "badgeAmber" : "badgeMuted")}>
              {availabilityLabel(row.availabilityStatus)}
            </span>
          )},
          { key: "connections", header: "Connections", align: "right", render: (_, row) => String(row.sortOrder) },
          { key: "updated", header: "Last Updated", render: (_, row) => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—" },
          { key: "actions", header: "", render: (_, row) => (
            <button type="button" className={cx("btnXs", "btnGhost")} onClick={() => setEditing(row)}>Edit</button>
          )},
        ]}
      />

      {/* ── Edit modal ──────────────────────────────────────────────────── */}
      {editingProvider && (
        <EditModal
          provider={editingProvider}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
