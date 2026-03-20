// ════════════════════════════════════════════════════════════════════════════
// staff-handovers-page.tsx — Staff Handovers
// Data     : loadStaffHandoversWithRefresh  → GET /handovers
//            updateStaffHandoverWithRefresh → PATCH /handovers/:id
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useCallback } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadStaffHandoversWithRefresh,
  updateStaffHandoverWithRefresh,
  type StaffHandover,
} from "../../../../lib/api/staff";

// ── Types ─────────────────────────────────────────────────────────────────────
type HandoverTab = "all" | "pending" | "complete";

type MappedStatus = "pending" | "active" | "complete";

// ── Helpers ───────────────────────────────────────────────────────────────────
function mapStatus(raw: string): MappedStatus {
  const s = raw.toUpperCase();
  if (s === "COMPLETE" || s === "COMPLETED") return "complete";
  if (s === "PENDING")                       return "pending";
  return "active";
}

function statusBadgeClass(status: MappedStatus): string {
  if (status === "complete") return "shBadgeStatusComplete";
  if (status === "pending")  return "shBadgeStatusDraft";
  return "shBadgeStatusActive";
}

function statusLabel(status: MappedStatus): string {
  if (status === "complete") return "Complete";
  if (status === "pending")  return "Pending";
  return "Active";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function handoverTitle(h: StaffHandover): string {
  const firstLine = h.notes?.split("\n")[0]?.trim();
  if (firstLine) return firstLine;
  return `Handover — ${formatDate(h.transferDate ?? h.createdAt)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function StaffHandoversPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [handovers,    setHandovers]    = useState<StaffHandover[]>([]);
  const [selected,     setSelected]     = useState<StaffHandover | null>(null);
  const [view,         setView]         = useState<HandoverTab>("all");
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [loading,      setLoading]      = useState(true);
  const [acking,       setAcking]       = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void loadStaffHandoversWithRefresh(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        setHandovers(r.data);
        if (r.data.length > 0) setSelected(r.data[0] ?? null);
      }
    }).catch((err) => {
      const msg = (err as Error)?.message ?? "Failed to load";
      setError(msg);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken]);

  // ── Acknowledge handler (persists via PATCH) ──────────────────────────────
  const handleAcknowledge = useCallback(async (h: StaffHandover) => {
    if (!session || acking) return;
    setAcking(h.id);
    const r = await updateStaffHandoverWithRefresh(session, h.id, { status: "COMPLETED" });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) {
      setAcknowledged((prev) => new Set([...prev, h.id]));
      setHandovers((prev) => prev.map((x) => (x.id === h.id ? { ...x, status: r.data!.status } : x)));
      if (selected?.id === h.id) setSelected({ ...h, status: r.data.status });
    }
    setAcking(null);
  }, [session, acking, selected]);

  const pending  = handovers.filter((h) => mapStatus(h.status) === "pending").length;
  const complete = handovers.filter((h) => mapStatus(h.status) === "complete").length;

  const filtered = handovers.filter((h) => {
    const s = mapStatus(h.status);
    if (view === "pending")  return s === "pending";
    if (view === "complete") return s === "complete";
    return true;
  });

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
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <section
      className={cx("page", "pageBody", isActive && "pageActive")}
      id="page-staff-handovers"
      style={isActive ? { height: "100%", display: "flex", flexDirection: "column", padding: 0 } : undefined}
    >
      {/* ── Header ── */}
      <div className={cx("pageHeaderBar", "borderB", "pb0", "noShrink")}>
        <div className={cx("flexBetween", "mb20")}>
          <div>
            <div className={cx("pageEyebrow")}>Staff Dashboard / Workflow</div>
            <h1 className={cx("pageTitle")}>Staff Handovers</h1>
          </div>
          <div className={cx("flexRow", "gap20")}>
            {[
              { label: "Total",    value: handovers.length, valueClass: "shToneMuted"  },
              { label: "Pending",  value: pending,          valueClass: pending  > 0 ? "shToneAmber"  : "shToneMuted" },
              { label: "Complete", value: complete,         valueClass: complete > 0 ? "shToneAccent" : "shToneMuted2" },
            ].map((stat) => (
              <div key={stat.label} className={cx("textRight")}>
                <div className={cx("shStatLabel")}>{stat.label}</div>
                <div className={cx("fontDisplay", "fw800", stat.valueClass)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("flexRow")}>
          {([
            { key: "all",      label: "All handovers"                                         },
            { key: "pending",  label: `Pending${pending  > 0 ? ` (${pending})`  : ""}`        },
            { key: "complete", label: "Complete"                                               },
          ] as { key: HandoverTab; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={cx("shTabBtn", view === tab.key && "shTabBtnActive")}
              onClick={() => setView(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main two-column grid ── */}
      <div className={cx("shMainGrid")}>
        {/* Sidebar list */}
        <div className={cx("shSidebar")}>
          {filtered.map((h) => {
            const s          = mapStatus(h.status);
            const isSelected = selected?.id === h.id;
            const isNew      = s === "pending" && !acknowledged.has(h.id);
            return (
              <div
                key={h.id}
                className={cx("shHandoverCard", isSelected && "shHandoverCardActive")}
                onClick={() => setSelected(h)}
              >
                <div className={cx("flexRow", "gap8", "mb6", "flexWrap")}>
                  <span className={cx("shBadge", statusBadgeClass(s))}>{statusLabel(s)}</span>
                  {isNew ? <span className={cx("shNewBadge")}>NEW</span> : null}
                </div>
                <div className={cx("text12", "mb6", "shTitleClamp", isSelected ? "colorText" : "colorMuted")}>
                  {handoverTitle(h)}
                </div>
                <div className={cx("flexRow", "gap8")}>
                  <span className={cx("text10", "colorMuted2")}>
                    {h.fromStaffName ?? "—"} &rarr; {h.toStaffName ?? "—"}
                  </span>
                </div>
                <div className={cx("text10", "colorMuted2", "mt4")}>
                  Transfer: {formatDate(h.transferDate)} · Created {formatDate(h.createdAt)}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="arrow-right-circle" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No handovers</div>
              <div className={cx("emptyStateSub")}>Handover records for this view will appear here.</div>
            </div>
          ) : null}
        </div>

        {/* Detail pane */}
        <div className={cx("overflowAuto")}>
          {selected ? (
            (() => {
              const s     = mapStatus(selected.status);
              const isAck = acknowledged.has(selected.id);
              const fromInitial = (selected.fromStaffName ?? "?").charAt(0).toUpperCase();
              const toInitial   = (selected.toStaffName   ?? "?").charAt(0).toUpperCase();
              return (
                <div className={cx("shDetailPane")}>
                  {/* Title + status */}
                  <div className={cx("flexBetween")}>
                    <div>
                      <div className={cx("flexRow", "gap8", "mb10", "flexWrap")}>
                        <span className={cx("shDetailBadge", statusBadgeClass(s))}>{statusLabel(s)}</span>
                      </div>
                      <div className={cx("fontDisplay", "fw800", "colorText", "shDetailTitle")}>
                        {handoverTitle(selected)}
                      </div>
                    </div>
                  </div>

                  {/* From → To */}
                  <div className={cx("shStaffRow")}>
                    <span className={cx("flexRow", "gap6")}>
                      <div className={cx("shPersonAvatar", "shSurfaceAccent", "shToneAccent")}>
                        {fromInitial}
                      </div>
                      <div>
                        <div className={cx("text11", "colorText")}>{selected.fromStaffName ?? "Unknown"}</div>
                        <div className={cx("shPersonRole")}>Handing over from</div>
                      </div>
                    </span>
                    <span className={cx("text14", "colorMuted2")}>&rarr;</span>
                    <span className={cx("flexRow", "gap6")}>
                      <div className={cx("shPersonAvatar", "shSurfacePurple", "shTonePurple")}>
                        {toInitial}
                      </div>
                      <div>
                        <div className={cx("text11", "colorText")}>{selected.toStaffName ?? "Unknown"}</div>
                        <div className={cx("shPersonRole")}>Handing over to</div>
                      </div>
                    </span>
                    <div className={cx("shDueMeta")}>
                      <div className={cx("text10", "colorMuted2")}>Transfer: {formatDate(selected.transferDate)}</div>
                      <div className={cx("text10", "colorMuted2")}>Created: {formatDate(selected.createdAt)}</div>
                    </div>
                  </div>

                  {/* Notes / context */}
                  {selected.notes ? (
                    <div className={cx("shContextCard")}>
                      <div className={cx("shContextLabel")}>Notes &amp; Context</div>
                      <div className={cx("text13", "colorMuted", "shContextText")}>{selected.notes}</div>
                    </div>
                  ) : null}

                  {/* Project / client metadata */}
                  {(selected.projectId || selected.clientId) ? (
                    <div className={cx("grid2", "gap12")}>
                      {selected.projectId ? (
                        <div className={cx("shInfoCard")}>
                          <div className={cx("shInfoCardLabel")}>Project</div>
                          <div className={cx("text12", "colorMuted", "shLine16")}>{selected.projectId}</div>
                        </div>
                      ) : null}
                      {selected.clientId ? (
                        <div className={cx("shInfoCard")}>
                          <div className={cx("shInfoCardLabel")}>Client</div>
                          <div className={cx("text12", "colorMuted", "shLine16")}>{selected.clientId}</div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Acknowledge button (persisted via API) */}
                  {s === "pending" && !isAck ? (
                    <button
                      type="button"
                      className={cx("shAckBtn")}
                      disabled={acking === selected.id}
                      onClick={() => void handleAcknowledge(selected)}
                    >
                      {acking === selected.id ? "Saving…" : "\u2713 Acknowledge handover"}
                    </button>
                  ) : null}
                  {s === "pending" && isAck ? (
                    <div className={cx("shAckedBanner")}>&#10003; You acknowledged this handover</div>
                  ) : null}
                </div>
              );
            })()
          ) : (
            <div className={cx("shEmptyDetail")}>
              <div className={cx("shEmptyIcon")}>&cir;</div>
              <div className={cx("text13")}>Select a handover to view details</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
