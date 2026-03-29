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

        // Batch-load contacts for all clients in parallel
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

  return (
    <div className={styles.pageBody}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>LIFECYCLE / STAKEHOLDER DIRECTORY</div>
          <h1 className={styles.pageTitle}>Stakeholder Directory</h1>
          <div className={styles.pageSub}>Client-side contacts, roles, and decision authority</div>
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

      {/* ── Stats ── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Clients",         value: String(groups.length)   },
          { label: "Total Contacts",  value: String(totalContacts)   },
          { label: "Primary Contacts",value: String(groups.reduce((s, g) => s + g.contacts.filter((c) => c.isPrimary).length, 0)) },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, "colorAccent")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div className={cx("colorMuted", "text12", "textCenter", "py32")}>
          {search ? `No contacts match "${search}".` : "No clients or contacts found."}
        </div>
      ) : (
        filtered.map((group) => (
          <article key={group.client.id} className={cx(styles.card, "mb16")}>
            <div className={styles.cardHd}>
              <span className={styles.cardHdTitle}>{group.client.name}</span>
              <div className={cx("flexRow", "gap6")}>
                <span className={cx("badge", "badgeMuted")}>{group.client.tier}</span>
                <span className={cx("badge", group.client.status === "ACTIVE" ? "badgeGreen" : "badgeAmber")}>
                  {formatStatus(group.client.status)}
                </span>
              </div>
            </div>
            <div className={styles.cardInner}>
              {group.contacts.length === 0 ? (
                <div className={cx("colorMuted", "text12")}>No contacts on record for this client.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Role</th>
                      <th scope="col">Email</th>
                      <th scope="col">Authority</th>
                      <th scope="col">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.contacts.map((c) => (
                      <tr key={c.id}>
                        <td className={cx("fw600")}>{c.name}</td>
                        <td className={cx("colorMuted")}>{c.role ?? "—"}</td>
                        <td className={cx("fontMono", "text12", "colorMuted")}>{c.email}</td>
                        <td>
                          <span className={cx("badge", c.isPrimary ? "badgeRed" : "badge")}>
                            {c.isPrimary ? "Final" : "Supporting"}
                          </span>
                        </td>
                        <td>
                          <span className={cx("badge", c.isPrimary ? "badgeAccent" : "badgeMuted")}>
                            {c.isPrimary ? "Primary" : "Secondary"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
