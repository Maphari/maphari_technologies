// ════════════════════════════════════════════════════════════════════════════
// stakeholder-directory-page.tsx — Admin Stakeholder Directory
// Data : loadAdminSnapshotWithRefresh (clients) +
//        loadClientContactsWithRefresh (contacts per client)
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { formatStatus } from "@/lib/utils/format-status";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAdminSnapshotWithRefresh,
  loadClientContactsWithRefresh,
} from "../../../../lib/api/admin";
import type { AdminClient, ClientContact } from "../../../../lib/api/admin/types";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

// ── Types ─────────────────────────────────────────────────────────────────────

type ClientGroup = {
  client:   AdminClient;
  contacts: ClientContact[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export function StakeholderDirectoryPage({ session }: { session: AuthSession | null }) {
  const [groups,  setGroups]  = useState<ClientGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const snap = await loadAdminSnapshotWithRefresh(session);
        if (cancelled) return;
        if (snap.nextSession) saveSession(snap.nextSession);
        if (snap.error || !snap.data) { setError(snap.error?.message ?? "Failed to load."); return; }

        const clients = snap.data.clients;
        const contactResults = await Promise.all(
          clients.map((c) => loadClientContactsWithRefresh(session, c.id))
        );
        if (cancelled) return;

        const built: ClientGroup[] = clients.map((c, i) => ({
          client:   c,
          contacts: contactResults[i]?.data ?? [],
        }));

        setGroups(built);
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  // ── Filter ────────────────────────────────────────────────────────────────

  const q = search.trim().toLowerCase();
  const filtered = q
    ? groups
        .map((g) => ({
          ...g,
          contacts: g.contacts.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              (c.email ?? "").toLowerCase().includes(q) ||
              (c.role ?? "").toLowerCase().includes(q) ||
              g.client.name.toLowerCase().includes(q)
          ),
        }))
        .filter((g) => g.contacts.length > 0 || g.client.name.toLowerCase().includes(q))
    : groups;

  const totalContacts = groups.reduce((s, g) => s + g.contacts.length, 0);
  const primaryContacts = groups.reduce((s, g) => s + g.contacts.filter((c) => c.isPrimary).length, 0);
  const unengaged = groups.filter((g) => g.contacts.length === 0).length;
  const avgEngagement = groups.length > 0
    ? Math.round((groups.filter((g) => g.contacts.length > 0).length / groups.length) * 100)
    : 0;

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

  // ── Chart data ─────────────────────────────────────────────────────────────
  const clientContactData = groups
    .filter((g) => g.contacts.length > 0)
    .slice(0, 8)
    .map((g) => ({ name: g.client.name.slice(0, 12), value: g.contacts.length }));

  // ── Flat contact table rows ────────────────────────────────────────────────
  const allContacts = filtered.flatMap((g) =>
    g.contacts.map((c) => ({
      id: c.id,
      name: c.name,
      company: g.client.name,
      role: c.role ?? "—",
      email: c.email ?? "—",
      isPrimary: c.isPrimary,
    }))
  ) as unknown as Record<string, unknown>[];

  return (
    <div className={styles.pageBody}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>LIFECYCLE / STAKEHOLDERS</div>
          <h1 className={styles.pageTitle}>Stakeholder Directory</h1>
          <div className={styles.pageSub}>Key contacts · Engagement health · Relationship map</div>
        </div>
        <div className={cx("flexRow", "gap8")}>
          <input
            type="text"
            className={cx("input", "w200", "h34")}
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Total Stakeholders" value={totalContacts} tone="accent" sparkData={[8, 10, 12, 14, 15, 16, 18, totalContacts]} />
        <StatWidget label="Active" value={totalContacts - unengaged} tone="green" progressValue={totalContacts > 0 ? Math.round(((totalContacts - unengaged) / totalContacts) * 100) : 0} />
        <StatWidget label="Unengaged" value={unengaged} tone={unengaged > 0 ? "amber" : "default"} sub="no contacts" />
        <StatWidget label="Avg Engagement Score" value={`${avgEngagement}%`} sub="clients with contacts" />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Stakeholders by Client"
          type="bar"
          data={clientContactData.length > 0 ? clientContactData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Engagement Levels"
          stages={[
            { label: "Primary Contacts", count: primaryContacts, total: totalContacts, color: "#8b6fff" },
            { label: "Secondary", count: totalContacts - primaryContacts, total: totalContacts, color: "#34d98b" },
            { label: "Unengaged Clients", count: unengaged, total: groups.length, color: "#f5a623" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="All Stakeholders"
          rows={allContacts}
          rowKey="id"
          emptyMessage={search ? `No contacts match "${search}".` : "No clients or contacts found."}
          columns={[
            { key: "name", header: "Name", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.name ?? "")}</span> },
            { key: "company", header: "Company / Client", render: (_v, row) => <span className={cx("colorMuted")}>{String(row.company ?? "")}</span> },
            { key: "role", header: "Role", render: (_v, row) => <span className={cx("text12")}>{String(row.role ?? "—")}</span> },
            { key: "email", header: "Email", align: "right", render: (_v, row) => <span className={cx("fontMono", "text12", "colorMuted")}>{String(row.email ?? "—")}</span> },
            { key: "isPrimary", header: "Type", align: "right", render: (_v, row) => <span className={cx("badge", row.isPrimary ? "badgeAccent" : "badgeMuted")}>{row.isPrimary ? "Primary" : "Secondary"}</span> },
          ]}
        />
      </WidgetGrid>

      {/* ── Client group detail (preserved below for context) ── */}
      {filtered.length > 0 && filtered.some((g) => g.contacts.length > 0) && (
        <div className={cx("mt16")}>
          {filtered.map((group) => (
            group.contacts.length > 0 && (
              <article key={group.client.id} className={cx(styles.card, "mb8")}>
                <div className={styles.cardHd}>
                  <span className={styles.cardHdTitle}>{group.client.name}</span>
                  <div className={cx("flexRow", "gap6")}>
                    <span className={cx("badge", "badgeMuted")}>{group.client.tier}</span>
                    <span className={cx("badge", group.client.status === "ACTIVE" ? "badgeGreen" : "badgeAmber")}>
                      {formatStatus(group.client.status)}
                    </span>
                  </div>
                </div>
              </article>
            )
          ))}
        </div>
      )}
    </div>
  );
}
