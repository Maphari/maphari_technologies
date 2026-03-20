"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { getStaffClients } from "../../../../lib/api/staff/clients";
import { getStaffProjects, type StaffProject } from "../../../../lib/api/staff/projects";
import { saveSession } from "../../../../lib/auth/session";
import type { AuthSession } from "../../../../lib/auth/session";

// ── Types ────────────────────────────────────────────────────────────────────

type ActivityType =
  | "project_updated"
  | "project_started"
  | "project_completed"
  | "project_overdue";

type ActivityRow = {
  id:         string;
  clientId:   string;
  clientName: string;
  type:       ActivityType;
  label:      string;
  detail:     string;
  date:       string;
  isoDate:    string;
};

type ClientPill = { id: string; name: string; avatar: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

function activityIcon(type: ActivityType): string {
  switch (type) {
    case "project_started":   return "◉";
    case "project_completed": return "✓";
    case "project_updated":   return "↻";
    case "project_overdue":   return "⚠";
    default:                  return "•";
  }
}

function activityIconClass(type: ActivityType): string {
  switch (type) {
    case "project_completed": return "paIconGreen";
    case "project_overdue":   return "paIconAmber";
    default:                  return "paIconMuted";
  }
}

function deriveActivities(projects: StaffProject[], clientMap: Map<string, string>): ActivityRow[] {
  const rows: ActivityRow[] = [];
  const now = Date.now();

  for (const p of projects) {
    const clientName = clientMap.get(p.clientId) ?? "Unknown Client";

    if (p.updatedAt) {
      rows.push({ id: `upd-${p.id}`, clientId: p.clientId, clientName, type: "project_updated",
        label: "Project updated", detail: p.name, date: formatDate(p.updatedAt), isoDate: p.updatedAt });
    }
    if (p.startAt) {
      rows.push({ id: `start-${p.id}`, clientId: p.clientId, clientName, type: "project_started",
        label: "Project started", detail: p.name, date: formatDate(p.startAt), isoDate: p.startAt });
    }
    if (p.status === "COMPLETED" || p.status === "DONE") {
      rows.push({ id: `done-${p.id}`, clientId: p.clientId, clientName, type: "project_completed",
        label: "Project completed", detail: p.name, date: formatDate(p.updatedAt), isoDate: p.updatedAt });
    }
    if (p.dueAt && new Date(p.dueAt).getTime() < now && p.status !== "COMPLETED" && p.status !== "DONE") {
      rows.push({ id: `overdue-${p.id}`, clientId: p.clientId, clientName, type: "project_overdue",
        label: "Project overdue", detail: `${p.name} — due ${formatDate(p.dueAt)}`,
        date: formatDate(p.dueAt), isoDate: p.dueAt });
    }
  }

  rows.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());
  return rows;
}

const FILTER_OPTS: Array<{ value: ActivityType | "all"; label: string; icon: string | null }> = [
  { value: "all",               label: "All",       icon: null },
  { value: "project_updated",   label: "Updated",   icon: "↻"  },
  { value: "project_started",   label: "Started",   icon: "◉"  },
  { value: "project_completed", label: "Completed", icon: "✓"  },
  { value: "project_overdue",   label: "Overdue",   icon: "⚠"  },
];

// ── Page component ────────────────────────────────────────────────────────────

export function PortalActivityPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [clientPills, setClientPills]       = useState<ClientPill[]>([]);
  const [activities,  setActivities]        = useState<ActivityRow[]>([]);
  const [loading,     setLoading]           = useState(true);
  const [error,       setError]             = useState<string | null>(null);
  const [liveIndicator, setLiveIndicator]   = useState(true);
  const [selectedClient, setSelectedClient] = useState<"all" | string>("all");
  const [filterType, setFilterType]         = useState<ActivityType | "all">("all");

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void Promise.all([getStaffClients(session), getStaffProjects(session)]).then(([clientsRes, projectsRes]) => {
      if (cancelled) return;
      if (clientsRes.nextSession) saveSession(clientsRes.nextSession);
      if (projectsRes.nextSession) saveSession(projectsRes.nextSession);
      const clientMap = new Map<string, string>();
      const pills: ClientPill[] = [];
      if (!clientsRes.error && clientsRes.data) {
        for (const c of clientsRes.data) {
          pills.push({ id: c.id, name: c.name, avatar: buildInitials(c.name) });
          clientMap.set(c.id, c.name);
        }
        setClientPills(pills);
      }
      if (!projectsRes.error && projectsRes.data) {
        setActivities(deriveActivities(projectsRes.data, clientMap));
      }
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load data.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  useEffect(() => {
    const interval = window.setInterval(() => setLiveIndicator((v) => !v), 1200);
    return () => window.clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return activities
      .filter((a) => selectedClient === "all" || a.clientId === selectedClient)
      .filter((a) => filterType     === "all" || a.type      === filterType);
  }, [activities, selectedClient, filterType]);

  const overdueCount   = activities.filter((a) => a.type === "project_overdue").length;
  const completedCount = activities.filter((a) => a.type === "project_completed").length;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-portal-activity">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-portal-activity">
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-portal-activity">
      <div className={cx("pageHeaderBar", "borderB", "paHeaderBar")}>
        <div className={cx("flexBetween", "mb20", "paHeaderTop")}>
          <div>
            <div className={cx("pageEyebrow")}>Staff Dashboard / Client Intelligence</div>
            <div className={cx("flexRow", "gap12", "paHeaderTitleRow")}>
              <h1 className={cx("pageTitle")}>Portal Activity</h1>
              <div className={cx("paLiveIndicator")}>
                <div className={cx("paLiveDot", liveIndicator ? "paLiveDotOn" : "paLiveDotDim")} />
                <span className={cx("text10", "colorAccent", "paLiveLabel")}>LIVE</span>
              </div>
            </div>
          </div>
          <div className={cx("flexRow", "gap24", "paTopStats")}>
            {[
              { label: "Clients",   value: clientPills.length,  toneClass: "paToneSoft"                               },
              { label: "Overdue",   value: overdueCount,         toneClass: overdueCount   > 0 ? "paToneAmber" : "paToneMuted" },
              { label: "Completed", value: completedCount,       toneClass: completedCount > 0 ? "paToneGreen" : "paToneMuted" },
            ].map((stat) => (
              <div key={stat.label} className={cx("textRight")}>
                <div className={cx("text11", "colorMuted2", "uppercase", "mb4", "paStatLabel")}>{stat.label}</div>
                <div className={cx("fontDisplay", "fw800", "paStatValue", stat.toneClass)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Client filter pills */}
        <div className={cx("paClientPills")}>
          <button
            type="button"
            className={cx("paClientPill", selectedClient === "all" && "paClientPillActive")}
            onClick={() => setSelectedClient("all")}
          >
            All clients
            <span className={cx("paClientPillUnread")}>{clientPills.length}</span>
          </button>
          {clientPills.map((client) => (
            <button
              key={client.id}
              type="button"
              className={cx("paClientPill", selectedClient === client.id && "paClientPillActive")}
              onClick={() => setSelectedClient(client.id)}
            >
              <span className={cx("paClientPillAvatar")}>{client.avatar}</span>
              {client.name}
            </button>
          ))}
        </div>

        {/* Type filter row */}
        <div className={cx("paFilterRow", "paToolbar")}>
          {FILTER_OPTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cx("paFilterBtn", filterType === opt.value && "paFilterBtnActive")}
              onClick={() => setFilterType(opt.value)}
            >
              {opt.icon ? <span className={cx("opacity75")}>{opt.icon}</span> : null}
              {opt.label}
            </button>
          ))}
          <div className={cx("paFilterDivider")} />
          <span className={cx("text11", "colorMuted2")}>
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className={cx("paLayout")}>
        <div className={cx("paFeedPane")}>
          {filtered.length === 0 ? (
            <div className={cx("textCenter", "text12", "paEmptyState")}>
              No activity events match your filters.
            </div>
          ) : (
            <div className={cx("paFeedList")}>
              {filtered.map((row) => (
                <div key={row.id} className={cx("paFeedItem")}>
                  <div className={cx("paFeedIcon", activityIconClass(row.type))}>
                    {activityIcon(row.type)}
                  </div>
                  <div className={cx("paFeedBody")}>
                    <div className={cx("paFeedLabel")}>{row.label}</div>
                    <div className={cx("paFeedDetail")}>{row.detail}</div>
                    <div className={cx("paFeedMeta")}>
                      <span className={cx("paFeedClient")}>{row.clientName}</span>
                      <span className={cx("paFeedDate")}>{row.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
