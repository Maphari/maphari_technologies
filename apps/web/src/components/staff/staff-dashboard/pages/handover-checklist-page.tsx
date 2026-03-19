// ════════════════════════════════════════════════════════════════════════════
// handover-checklist-page.tsx — Staff Handover Checklist
// Data : GET /staff/clients → StaffClient[]  (checklist template is static)
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { getStaffClients } from "../../../../lib/api/staff/clients";
import { loadStaffHandoversWithRefresh, updateStaffHandoverWithRefresh } from "../../../../lib/api/staff/governance";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────

type ClientRow = {
  id:          string;
  name:        string;
  avatar:      string;
  project:     string;
  toneClass:   string;
  activeClass: string;
  avatarClass: string;
  meterClass:  string;
};

type ChecklistItem    = { id: string; label: string; note: string | null };
type ChecklistSection = { section: string; icon: string; toneClass: string; meterClass: string; items: ChecklistItem[] };

// ── Tone configs ──────────────────────────────────────────────────────────────

const TONES = [
  { toneClass: "hoToneAccent",  activeClass: "hoClientActiveAccent",  avatarClass: "hoAvatarAccent",  meterClass: "hoMeterAccent"  },
  { toneClass: "hoToneBlue",    activeClass: "hoClientActiveBlue",    avatarClass: "hoAvatarBlue",    meterClass: "hoMeterBlue"    },
  { toneClass: "hoTonePurple",  activeClass: "hoClientActivePurple",  avatarClass: "hoAvatarPurple",  meterClass: "hoMeterPurple"  },
  { toneClass: "hoToneAmber",   activeClass: "hoClientActiveAmber",   avatarClass: "hoAvatarAmber",   meterClass: "hoMeterAmber"   },
  { toneClass: "hoToneOrange",  activeClass: "hoClientActiveOrange",  avatarClass: "hoAvatarOrange",  meterClass: "hoMeterOrange"  },
] as const;

// ── Checklist template (static business process) ──────────────────────────────

const CHECKLIST: ChecklistSection[] = [
  {
    section: "Files & Assets", icon: "⊡", toneClass: "hoToneBlue", meterClass: "hoMeterBlue",
    items: [
      { id: "f1", label: "All final files exported in agreed formats", note: "RGB + CMYK where applicable" },
      { id: "f2", label: "File naming convention applied throughout", note: "Client_Project_Deliverable_v1" },
      { id: "f3", label: "Source files included (editable formats)", note: "AI, Figma, INDD as applicable" },
      { id: "f4", label: "Assets organised in final Drive folder structure", note: null },
      { id: "f5", label: "Fonts packaged or linked correctly", note: null },
      { id: "f6", label: "Image licences documented", note: "Include licence numbers or links" },
    ],
  },
  {
    section: "Documentation", icon: "◎", toneClass: "hoTonePurple", meterClass: "hoMeterPurple",
    items: [
      { id: "d1", label: "Brand guidelines / usage document complete", note: "If applicable to project" },
      { id: "d2", label: "Handover notes written — what was built and why", note: null },
      { id: "d3", label: "Known limitations or constraints documented", note: null },
      { id: "d4", label: "Decision log exported and filed", note: null },
      { id: "d5", label: "Revision history summarised", note: null },
    ],
  },
  {
    section: "Client Comms", icon: "✉", toneClass: "hoToneAmber", meterClass: "hoMeterAmber",
    items: [
      { id: "c1", label: "Final delivery email sent with asset summary", note: null },
      { id: "c2", label: "Client walked through deliverables on call", note: "Or async video if preferred" },
      { id: "c3", label: "Outstanding questions answered before close", note: null },
      { id: "c4", label: "Next steps / maintenance guidance shared", note: null },
      { id: "c5", label: "Feedback / testimonial requested", note: "Use the testimonial template" },
    ],
  },
  {
    section: "Finance", icon: "₹", toneClass: "hoToneAccent", meterClass: "hoMeterAccent",
    items: [
      { id: "fin1", label: "Final invoice raised and sent", note: null },
      { id: "fin2", label: "All retainer hours reconciled", note: "Overage or underuse noted" },
      { id: "fin3", label: "Payment confirmed received", note: "Before Drive access revoked" },
      { id: "fin4", label: "Project profitability reviewed internally", note: null },
    ],
  },
  {
    section: "Access & Offboarding", icon: "◌", toneClass: "hoToneOrange", meterClass: "hoMeterOrange",
    items: [
      { id: "a1", label: "Client portal access revoked", note: "Within 24h of close confirmation" },
      { id: "a2", label: "Shared Drive folder archived (not deleted)", note: null },
      { id: "a3", label: "Figma / design tool access removed", note: null },
      { id: "a4", label: "Any shared credentials rotated", note: null },
      { id: "a5", label: "Client removed from internal Slack / tools", note: "If applicable" },
    ],
  },
  {
    section: "Internal Close", icon: "◈", toneClass: "hoToneMuted", meterClass: "hoMeterMuted",
    items: [
      { id: "i1", label: "Hours logged and finalised for all tasks", note: null },
      { id: "i2", label: "Project retrospective notes written", note: "What went well, what to improve" },
      { id: "i3", label: "Project marked closed in dashboard", note: null },
      { id: "i4", label: "Any reusable templates or assets saved to library", note: null },
      { id: "i5", label: "Team debriefed (if multi-person project)", note: null },
    ],
  },
];

const TOTAL_ITEMS = CHECKLIST.reduce((s, sec) => s + sec.items.length, 0);

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return p[0].slice(0, 2).toUpperCase();
}

function buildState(clientId: string): Record<string, boolean> {
  const s: Record<string, boolean> = {};
  CHECKLIST.forEach((sec) => sec.items.forEach((item) => { s[`${clientId}_${item.id}`] = false; }));
  return s;
}

function overallToneClass(pct: number): string {
  if (pct === 100) return "hoToneAccent";
  if (pct > 50) return "hoToneAmber";
  return "hoToneMuted";
}

// ── Section sub-component ─────────────────────────────────────────────────────

function Section({
  section, isChecked, toggle, markSectionDone, sectionProgress, notes, setNotes, clientId
}: {
  section: ChecklistSection;
  isChecked: (id: string) => boolean;
  toggle: (id: string) => void;
  markSectionDone: (section: ChecklistSection) => void;
  sectionProgress: (section: ChecklistSection) => { done: number; total: number; pct: number };
  notes: Record<string, string>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  clientId: string;
}) {
  const progress = sectionProgress(section);
  const done     = progress.done === progress.total;
  const noteKey  = `${clientId}_note_${section.section}`;
  const [showNote, setShowNote] = useState(false);

  return (
    <div className={cx("mb28")}>
      <div className={cx("flexRow", "gap10", "mb12", "hoSectionHead")}>
        <span className={cx("text14", section.toneClass)}>{section.icon}</span>
        <span className={cx("fontDisplay", "text14", "fw700", done ? "hoToneAccent" : "colorText")}>{section.section}</span>
        <progress className={cx("hoSectionMeter", done ? "hoMeterAccent" : section.meterClass)} max={progress.total} value={progress.done} />
        <span className={cx("text10", "noShrink", done ? "hoToneAccent" : "colorMuted2")}>{progress.done}/{progress.total}</span>
        {!done && (
          <button type="button" className={cx("hoMarkBtn", "uppercase")} onClick={() => markSectionDone(section)}>All done</button>
        )}
      </div>

      <div className={cx("flexCol", "gap4")}>
        {section.items.map((item) => {
          const checked = isChecked(item.id);
          return (
            <div key={item.id} className={cx("hoCheckRow", "hoCheckItem", checked && "hoCheckItemChecked")} onClick={() => toggle(item.id)}>
              <div className={cx("flexCenter", "noShrink", "hoCheckBox", checked && "hoCheckBoxChecked")}>
                {checked && <span className={cx("hoCheckAnim")}>✓</span>}
              </div>
              <div className={cx("flex1")}>
                <div className={cx("text12", "hoItemLabel", checked && "hoItemLabelChecked")}>{item.label}</div>
                {item.note && <div className={cx("text10", "mt4", "hoItemNote")}>{item.note}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className={cx("mt8")}>
        <button type="button" onClick={() => setShowNote((v) => !v)} className={cx("hoNoteToggle")}>
          {showNote ? "− Hide note" : `+ ${notes[noteKey] ? "Edit" : "Add"} section note`}
        </button>
        {showNote && (
          <textarea
            className={cx("hoTextarea", "hoNoteInput")}
            value={notes[noteKey] ?? ""}
            onChange={(e) => setNotes((prev) => ({ ...prev, [noteKey]: e.target.value }))}
            placeholder={`Notes for ${section.section}…`}
          />
        )}
      </div>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function HandoverChecklistPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [clients, setClients]   = useState<ClientRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [checked, setChecked]   = useState<Record<string, boolean>>({});
  const [notes, setNotes]       = useState<Record<string, string>>({});
  const [filter, setFilter]     = useState<"all" | "incomplete">("all");

  const [saving, setSaving] = useState(false);
  const [handoverIds, setHandoverIds] = useState<Record<string, string>>({});

  // ── localStorage helpers ──────────────────────────────────────────────────
  const LS_KEY = "maphari:handover:checked";

  function loadCheckedFromStorage(): Record<string, boolean> {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }

  function saveCheckedToStorage(state: Record<string, boolean>) {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;
    setLoading(true);

    void Promise.all([
      getStaffClients(session),
      loadStaffHandoversWithRefresh(session),
    ]).then(([clientResult, handoverResult]) => {
      if (cancelled) return;
      if (clientResult.nextSession) saveSession(clientResult.nextSession);
      if (handoverResult.nextSession) saveSession(handoverResult.nextSession);

      if (clientResult.data) {
        const rows: ClientRow[] = clientResult.data.map((c, i) => ({
          id:    c.id,
          name:  c.name,
          avatar: initials(c.name),
          project: c.industry ?? "Active Project",
          ...TONES[i % TONES.length],
        }));
        setClients(rows);
        if (rows.length > 0) setSelectedClient(rows[0]);
        // Build default state then merge with persisted localStorage state
        const init: Record<string, boolean> = {};
        rows.forEach((r) => Object.assign(init, buildState(r.id)));
        const persisted = loadCheckedFromStorage();
        setChecked({ ...init, ...persisted });
      }

      // Map handover records by clientId for status persistence
      if (handoverResult.data) {
        const idMap: Record<string, string> = {};
        for (const h of handoverResult.data) {
          if (h.clientId) idMap[h.clientId] = h.id;
        }
        setHandoverIds(idMap);
      }

      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  const toggle = (id: string) => {
    if (!selectedClient) return;
    const key = `${selectedClient.id}_${id}`;
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveCheckedToStorage(next);
      return next;
    });
  };

  const isChecked = (id: string) => !!(selectedClient && checked[`${selectedClient.id}_${id}`]);

  const doneCount = CHECKLIST.reduce((s, sec) => s + sec.items.filter((item) => isChecked(item.id)).length, 0);
  const pct       = TOTAL_ITEMS > 0 ? Math.round((doneCount / TOTAL_ITEMS) * 100) : 0;

  const sectionProgress = (sec: ChecklistSection) => {
    const done = sec.items.filter((item) => isChecked(item.id)).length;
    return { done, total: sec.items.length, pct: Math.round((done / sec.items.length) * 100) };
  };

  const clientProgress = (client: ClientRow) => {
    const done = CHECKLIST.reduce((s, sec) => s + sec.items.filter((item) => checked[`${client.id}_${item.id}`]).length, 0);
    return TOTAL_ITEMS > 0 ? Math.round((done / TOTAL_ITEMS) * 100) : 0;
  };

  const markSectionDone = (sec: ChecklistSection) => {
    if (!selectedClient) return;
    setChecked((prev) => {
      const next = { ...prev };
      sec.items.forEach((item) => { next[`${selectedClient.id}_${item.id}`] = true; });
      saveCheckedToStorage(next);
      return next;
    });
  };

  const visibleSections = filter === "incomplete"
    ? CHECKLIST.filter((sec) => sec.items.some((item) => !isChecked(item.id)))
    : CHECKLIST;

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

  if (clients.length === 0) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-handover-checklist">
        <div className={cx("pageHeaderBar", "borderB", "hoHeaderBar")}>
          <div className={cx("pageEyebrow", "mb8")}>Staff Dashboard / Workflow</div>
          <h1 className={cx("pageTitle")}>Handover Checklist</h1>
        </div>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="file-text" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No clients assigned</div>
          <div className={cx("emptyStateSub")}>Clients will appear here once you are assigned to active projects.</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-handover-checklist">
      <div className={cx("pageHeaderBar", "borderB", "hoHeaderBar")}>
        <div className={cx("flexBetween", "mb20", "hoHeaderTop")}>
          <div>
            <div className={cx("pageEyebrow", "mb8")}>Staff Dashboard / Workflow</div>
            <h1 className={cx("pageTitle")}>Handover Checklist</h1>
          </div>
          <div className={cx("flexRow", "gap24")}>
            <div className={cx("textRight")}>
              <div className={cx("pageEyebrow", "mb4", "hoStatLabel")}>Progress</div>
              <div className={cx("fontDisplay", "fw800", "hoStatValue", overallToneClass(pct))}>{pct}%</div>
            </div>
            <div className={cx("textRight")}>
              <div className={cx("pageEyebrow", "mb4", "hoStatLabel")}>Remaining</div>
              <div className={cx("fontDisplay", "fw800", "hoStatValue", "hoToneMuted")}>{TOTAL_ITEMS - doneCount}</div>
            </div>
          </div>
        </div>

        {/* Client tabs */}
        <div className={cx("flexRow", "gap10", "mb16")}>
          {clients.map((client) => {
            const cp        = clientProgress(client);
            const isAct     = selectedClient?.id === client.id;
            return (
              <div
                key={client.id}
                className={cx("hoClientBtn", "hoClientCard", "flex1", isAct ? client.activeClass : "hoClientCardIdle")}
                onClick={() => setSelectedClient(client)}
              >
                <div className={cx("flexRow", "gap8", "mb8", "hoClientHead")}>
                  <div className={cx("flexCenter", "hoClientAvatar", client.avatarClass)}>{client.avatar}</div>
                  <span className={cx("text11", isAct ? "colorText" : "colorMuted")}>{client.name}</span>
                  <span className={cx("text12", "fw700", "hoClientPct", client.toneClass)}>{cp}%</span>
                </div>
                <progress className={cx("hoClientMeter", cp === 100 ? "hoMeterAccent" : client.meterClass)} max={100} value={cp} />
                <div className={cx("text10", "colorMuted2", "mt4", "hoClientProject")}>{client.project}</div>
              </div>
            );
          })}
        </div>

        <div className={cx("filterRow")}>
          <select className={cx("filterSelect")} aria-label="Filter checklist" value={filter} onChange={(e) => setFilter(e.target.value as "all" | "incomplete")}>
            <option value="all">All items</option>
            <option value="incomplete">Incomplete only</option>
          </select>
        </div>
      </div>

      <div className={cx("hoLayout")}>
        <div className={cx("hoCol", "hoColLeft")}>
          {visibleSections.slice(0, 3).map((sec) => (
            <Section key={sec.section} section={sec} isChecked={isChecked} toggle={toggle} markSectionDone={markSectionDone} sectionProgress={sectionProgress} notes={notes} setNotes={setNotes} clientId={selectedClient?.id ?? ""} />
          ))}
        </div>

        <div className={cx("hoCol")}>
          {visibleSections.slice(3).map((sec) => (
            <Section key={sec.section} section={sec} isChecked={isChecked} toggle={toggle} markSectionDone={markSectionDone} sectionProgress={sectionProgress} notes={notes} setNotes={setNotes} clientId={selectedClient?.id ?? ""} />
          ))}

          {selectedClient && pct === 100 && (
            <div className={cx("mt20", "textCenter", "hoCompleteCard")}>
              <div className={cx("fontDisplay", "fw800", "colorAccent", "mb6", "hoCompleteTitle")}>✓ Handover complete</div>
              <div className={cx("text12", "colorMuted2")}>{selectedClient.name} · {selectedClient.project}</div>
              {handoverIds[selectedClient.id] && session ? (
                <button
                  type="button"
                  className={cx("hoMarkBtn", "uppercase", "mt8")}
                  disabled={saving}
                  onClick={async () => {
                    if (!session) return;
                    setSaving(true);
                    const res = await updateStaffHandoverWithRefresh(session, handoverIds[selectedClient.id], { status: "COMPLETED", notes: `Checklist completed for ${selectedClient.name}` });
                    if (res.nextSession) saveSession(res.nextSession);
                    setSaving(false);
                  }}
                >
                  {saving ? "Saving…" : "Mark handover complete →"}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
