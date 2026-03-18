// ════════════════════════════════════════════════════════════════════════════
// sprint-visibility-page.tsx — Client Portal Sprint Visibility
// Data : loadPortalSprintsWithRefresh    → GET /projects/:id/sprints
//        loadPortalSprintTasksWithRefresh → GET /projects/:id/sprints/:sid/tasks
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalSprintsWithRefresh,
  loadPortalSprintTasksWithRefresh,
  type PortalSprint,
  type PortalSprintTask,
} from "../../../../lib/api/portal";

type TaskStatus = "Done" | "In Progress" | "In Review" | "Blocked" | "To Do";

const STATUS_META: Record<TaskStatus, { badge: string }> = {
  "Done":        { badge: "badgeGreen"  },
  "In Review":   { badge: "badgeAmber"  },
  "In Progress": { badge: "badgeAccent" },
  "Blocked":     { badge: "badgeRed"    },
  "To Do":       { badge: "badgeMuted"  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapTaskStatus(raw: string): TaskStatus {
  const s = raw.toUpperCase();
  if (s === "DONE" || s === "COMPLETE" || s === "COMPLETED") return "Done";
  if (s === "IN_REVIEW" || s === "REVIEW")                   return "In Review";
  if (s === "IN_PROGRESS" || s === "ACTIVE" || s === "WIP")  return "In Progress";
  if (s === "BLOCKED")                                        return "Blocked";
  return "To Do";
}

const AVATAR_COLORS = [
  "var(--lime)", "var(--purple)", "var(--amber)", "var(--red)",
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

type TeamMember = { name: string; color: string; inits: string; task: string; active: boolean };

function deriveTeam(tasks: PortalSprintTask[]): TeamMember[] {
  const map = new Map<string, TeamMember>();
  for (const t of tasks) {
    const name = t.assigneeName ?? "Unassigned";
    if (!map.has(name)) {
      map.set(name, { name, color: avatarColor(name), inits: initials(name), task: t.name, active: t.status.toUpperCase() === "IN_PROGRESS" });
    } else if (t.status.toUpperCase() === "IN_PROGRESS") {
      const m = map.get(name)!;
      m.active = true;
      m.task   = t.name;
    }
  }
  return [...map.values()];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SprintVisibilityPage() {
  const { session, projectId } = useProjectLayer();
  const [sprint,  setSprint]   = useState<PortalSprint | null>(null);
  const [tasks,   setTasks]    = useState<PortalSprintTask[]>([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    if (!session || !projectId) { setLoading(false); return; }
    setLoading(true);
    void loadPortalSprintsWithRefresh(session, projectId).then(async (r) => {
      if (r.nextSession) saveSession(r.nextSession);
      const list   = r.data ?? [];
      const active = list.find((s) => s.status.toUpperCase() === "ACTIVE") ?? list[0] ?? null;
      setSprint(active);
      if (!active) return;
      const tr = await loadPortalSprintTasksWithRefresh(session, projectId, active.id);
      if (tr.nextSession) saveSession(tr.nextSession);
      if (!tr.error && tr.data) setTasks(tr.data);
    }).finally(() => setLoading(false));
  }, [session, projectId]);

  const mapped  = useMemo(() => tasks.map((t) => ({ ...t, ds: mapTaskStatus(t.status) })), [tasks]);
  const team    = useMemo(() => deriveTeam(tasks), [tasks]);
  const done    = mapped.filter((t) => t.ds === "Done").length;
  const total   = mapped.length;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
  const blocked = mapped.filter((t) => t.ds === "Blocked").length;
  const inRev   = mapped.filter((t) => t.ds === "In Review").length;

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("pageHeader", "mb0")}>
          <div>
            <div className={cx("pageEyebrow")}>Projects · Sprint</div>
            <h1 className={cx("pageTitle")}>Sprint Visibility</h1>
          </div>
        </div>
        <div className={cx("skeletonBlock", "skeleH120", "mb18")} />
        <div className={cx("skeletonBlock", "skeleH80")} />
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!sprint) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("pageHeader", "mb0")}>
          <div>
            <div className={cx("pageEyebrow")}>Projects · Sprint</div>
            <h1 className={cx("pageTitle")}>Sprint Visibility</h1>
            <p className={cx("pageSub")}>Read-only view of the active sprint — see what&apos;s being built right now and who&apos;s working on it.</p>
          </div>
        </div>
        <div className={cx("card", "emptyPad40x20", "textCenter")}>
          <Ic n="layers" sz={24} c="var(--muted2)" />
          <div className={cx("fw700", "mt12", "mb6")}>No active sprint</div>
          <div className={cx("text12", "colorMuted")}>No sprint has been started for this project yet. Check back once development begins.</div>
        </div>
      </div>
    );
  }

  // ── Sprint view ────────────────────────────────────────────────────────────
  return (
    <div className={cx("pageBody")}>

      {/* Header */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Sprint</div>
          <h1 className={cx("pageTitle")}>Sprint Visibility</h1>
          <p className={cx("pageSub")}>Read-only view of the active sprint — see what&apos;s being built right now and who&apos;s working on it.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")}>
            <Ic n="download" sz={12} c="var(--muted2)" />
            Export
          </button>
        </div>
      </div>

      {/* Sprint goal hero */}
      <div className={cx("card", "borderLeftAccent", "mb18", "p20x24")}>
        <div className={cx("flexRow", "flexCenter", "gap8", "mb10")}>
          <span className={cx("badge", "badgeGreen")}>
            <Ic n="flag" sz={10} c="currentColor" />
            &nbsp;{sprint.name} · Active
          </span>
          <span className={cx("text10", "colorMuted")}>{fmtDate(sprint.startAt)} – {fmtDate(sprint.endAt)}</span>
        </div>
        <div className={cx("fw700", "fs1rem", "mb14", "lineH14")}>{sprint.name}</div>
        <div className={cx("trackH8", "mb8")}>
          <div className={cx("pctFillRInherit", "dynBgColor")} style={{ '--pct': `${pct}%`, "--bg-color": "var(--lime)" } as React.CSSProperties} />
        </div>
        <div className={cx("text11", "colorMuted")}>
          <span className={cx("colorAccent", "fw700")}>{done}</span> of {total} tasks complete ({pct}%)
          {sprint.overdueTasks > 0 && <>&nbsp;·&nbsp;<span className={cx("colorAmber", "fw700")}>{sprint.overdueTasks} overdue</span></>}
          {blocked > 0 && <>&nbsp;·&nbsp;<span className={cx("colorRed", "fw700")}>{blocked} blocked</span></>}
          &nbsp;·&nbsp;{inRev} in review
        </div>
      </div>

      {/* Stat cards */}
      <div className={cx("topCardsStack", "mb18")}>
        {[
          { label: "Sprint",     value: sprint.name,       color: "statCard"                              },
          { label: "Tasks Done", value: `${done} / ${total}`, color: "statCardGreen"                     },
          { label: "Progress",   value: `${pct}%`,            color: "statCardAccent"                    },
          { label: "Blocked",    value: String(blocked),    color: blocked > 0 ? "statCardRed" : "statCard" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Task list + Team side by side */}
      <div className={cx("svTaskTeamGrid")}>

        {/* Tasks */}
        <div className={cx("card", "p0", "overflowHidden")}>
          <div className={cx("cardHd", "py12_px", "px18_px")}>
            <Ic n="list" sz={14} c="var(--lime)" />
            <span className={cx("cardHdTitle", "ml8")}>Sprint Tasks</span>
            <span className={cx("text10", "colorMuted", "mlAuto")}>{total} tasks</span>
          </div>
          {mapped.length === 0 ? (
            <div className={cx("text12", "colorMuted", "textCenter", "p20")}>No tasks in this sprint yet.</div>
          ) : mapped.map((t) => {
            const meta  = STATUS_META[t.ds];
            const color = avatarColor(t.assigneeName ?? "");
            return (
              <div
                key={t.id}
                className={cx("svTaskRow", t.ds === "Blocked" && "svTaskRowBlocked")}
              >
                <div className={cx("avatar28", "dynBgColor")} style={{ "--bg-color": color } as React.CSSProperties}>
                  {initials(t.assigneeName)}
                </div>
                <div className={cx("flex1", "minW0")}>
                  <div className={cx("text12", "fw600", "truncate")}>{t.name}</div>
                  <div className={cx("text10", "colorMuted")}>{t.assigneeName ?? "Unassigned"}{t.dueAt ? ` · Due ${fmtDate(t.dueAt)}` : ""}</div>
                </div>
                <div className={cx("flexRow", "flexCenter", "gap6", "noShrink")}>
                  {t.priority && <span className={cx("badge", "badgeMuted", "fs9")}>{t.priority}</span>}
                  <span className={cx("badge", meta.badge, "fs9")}>{t.ds}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Team */}
        <div className={cx("card", "p0", "overflowHidden")}>
          <div className={cx("cardHd", "py12_px", "px16_px")}>
            <Ic n="users" sz={14} c="var(--lime)" />
            <span className={cx("cardHdTitle", "ml8")}>Team</span>
          </div>
          {team.length === 0 ? (
            <div className={cx("text12", "colorMuted", "textCenter", "p20")}>No team members assigned.</div>
          ) : team.map((m) => (
            <div key={m.name} className={cx("svTeamRow")}>
              <div className={cx("relative", "noShrink")}>
                <div className={cx("avatar36", "dynBgColor")} style={{ "--bg-color": m.color } as React.CSSProperties}>
                  {m.inits}
                </div>
                <div className={cx("onlineIndicator", "dynBgColor")} style={{ "--bg-color": m.active ? "var(--green)" : "var(--muted2)" } as React.CSSProperties} />
              </div>
              <div className={cx("flex1", "minW0")}>
                <div className={cx("fw600", "text12")}>{m.name}</div>
                <div className={cx("text10", "mt3", "colorMuted2", "truncate")}>{m.task}</div>
              </div>
              {m.active && <span className={cx("colorAccent", "noShrink", "fs9", "fw700")}>LIVE</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className={cx("card", "p12x18", "flexRow", "gap10")}>
        <Ic n="alert" sz={13} c="var(--amber)" />
        <div className={cx("text11", "colorMuted")}>
          This is a read-only view of the active sprint. To raise a blocker or request a priority shift — use the <span className={cx("colorAccent", "fw600")}>Change Requests</span> page.
        </div>
      </div>

    </div>
  );
}
