"use client";

import { useState } from "react";
import { cx } from "../style";

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  color: string;
  project: string;
};

type ChecklistItem = {
  id: string;
  label: string;
  note: string | null;
};

type ChecklistSection = {
  section: string;
  icon: string;
  color: string;
  items: ChecklistItem[];
};

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)", project: "Brand Identity System" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa", project: "Website Redesign" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00", project: "Annual Report 2025" }
];

const checklistTemplate: ChecklistSection[] = [
  {
    section: "Files & Assets",
    icon: "⊡",
    color: "#60a5fa",
    items: [
      { id: "f1", label: "All final files exported in agreed formats", note: "RGB + CMYK where applicable" },
      { id: "f2", label: "File naming convention applied throughout", note: "Client_Project_Deliverable_v1" },
      { id: "f3", label: "Source files included (editable formats)", note: "AI, Figma, INDD as applicable" },
      { id: "f4", label: "Assets organised in final Drive folder structure", note: null },
      { id: "f5", label: "Fonts packaged or linked correctly", note: null },
      { id: "f6", label: "Image licences documented", note: "Include licence numbers or links" }
    ]
  },
  {
    section: "Documentation",
    icon: "◎",
    color: "#a78bfa",
    items: [
      { id: "d1", label: "Brand guidelines / usage document complete", note: "If applicable to project" },
      { id: "d2", label: "Handover notes written - what was built and why", note: null },
      { id: "d3", label: "Known limitations or constraints documented", note: null },
      { id: "d4", label: "Decision log exported and filed", note: null },
      { id: "d5", label: "Revision history summarised", note: null }
    ]
  },
  {
    section: "Client Comms",
    icon: "✉",
    color: "#f5c518",
    items: [
      { id: "c1", label: "Final delivery email sent with asset summary", note: null },
      { id: "c2", label: "Client walked through deliverables on call", note: "Or async video if preferred" },
      { id: "c3", label: "Outstanding questions answered before close", note: null },
      { id: "c4", label: "Next steps / maintenance guidance shared", note: null },
      { id: "c5", label: "Feedback / testimonial requested", note: "Use the testimonial template" }
    ]
  },
  {
    section: "Finance",
    icon: "₹",
    color: "var(--accent)",
    items: [
      { id: "fin1", label: "Final invoice raised and sent", note: null },
      { id: "fin2", label: "All retainer hours reconciled", note: "Overage or underuse noted" },
      { id: "fin3", label: "Payment confirmed received", note: "Before Drive access revoked" },
      { id: "fin4", label: "Project profitability reviewed internally", note: null }
    ]
  },
  {
    section: "Access & Offboarding",
    icon: "◌",
    color: "#ff8c00",
    items: [
      { id: "a1", label: "Client portal access revoked", note: "Within 24h of close confirmation" },
      { id: "a2", label: "Shared Drive folder archived (not deleted)", note: null },
      { id: "a3", label: "Figma / design tool access removed", note: null },
      { id: "a4", label: "Any shared credentials rotated", note: null },
      { id: "a5", label: "Client removed from internal Slack / tools", note: "If applicable" }
    ]
  },
  {
    section: "Internal Close",
    icon: "◈",
    color: "#a0a0b0",
    items: [
      { id: "i1", label: "Hours logged and finalised for all tasks", note: null },
      { id: "i2", label: "Project retrospective notes written", note: "What went well, what to improve" },
      { id: "i3", label: "Project marked closed in dashboard", note: null },
      { id: "i4", label: "Any reusable templates or assets saved to library", note: null },
      { id: "i5", label: "Team debriefed (if multi-person project)", note: null }
    ]
  }
];

const totalItems = checklistTemplate.reduce((sum, section) => sum + section.items.length, 0);

function buildInitialState(clientId: number) {
  const state: Record<string, boolean> = {};
  checklistTemplate.forEach((section) => {
    section.items.forEach((item) => {
      state[`${String(clientId)}_${item.id}`] = false;
    });
  });
  return state;
}

export function HandoverChecklistPage({ isActive }: { isActive: boolean }) {
  const [selectedClient, setSelectedClient] = useState<ClientRow>(clients[0]);
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    clients.forEach((client) => Object.assign(init, buildInitialState(client.id)));
    ["f1", "f2", "f3", "f4", "d4", "d5", "c1", "c2", "c3", "fin1", "fin2", "fin3"].forEach((id) => {
      init[`5_${id}`] = true;
    });
    return init;
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "incomplete">("all");

  const toggle = (id: string) => {
    const key = `${String(selectedClient.id)}_${id}`;
    setChecked((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const isChecked = (id: string) => checked[`${String(selectedClient.id)}_${id}`] ?? false;

  const doneCount = checklistTemplate.reduce(
    (sum, section) => sum + section.items.filter((item) => isChecked(item.id)).length,
    0
  );
  const pct = Math.round((doneCount / totalItems) * 100);

  const sectionProgress = (section: ChecklistSection) => {
    const done = section.items.filter((item) => isChecked(item.id)).length;
    return { done, total: section.items.length, pct: Math.round((done / section.items.length) * 100) };
  };

  const clientProgress = (client: ClientRow) => {
    const done = checklistTemplate.reduce(
      (sum, section) => sum + section.items.filter((item) => checked[`${String(client.id)}_${item.id}`]).length,
      0
    );
    return Math.round((done / totalItems) * 100);
  };

  const markSectionDone = (section: ChecklistSection) => {
    setChecked((previous) => {
      const next = { ...previous };
      section.items.forEach((item) => {
        next[`${String(selectedClient.id)}_${item.id}`] = true;
      });
      return next;
    });
  };

  const visibleSections =
    filter === "incomplete"
      ? checklistTemplate.filter((section) => section.items.some((item) => !isChecked(item.id)))
      : checklistTemplate;

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-handover-checklist">
      <style>{`
        textarea { outline: none; font-family: 'DM Mono', monospace; resize: none; }
        textarea:focus { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; }
        .hc-client-btn { transition: all 0.12s ease; cursor: pointer; }
        .hc-client-btn:hover { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; }
        .hc-check-row { transition: background 0.1s ease; }
        .hc-check-row:hover { background: rgba(255,255,255,0.02) !important; }
        .hc-filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .hc-mark-btn { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .hc-mark-btn:hover { color: var(--accent) !important; border-color: color-mix(in srgb, var(--accent) 30%, transparent) !important; }
        @keyframes hcCheck { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Workflow
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Handover Checklist
            </h1>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                Progress
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: pct === 100 ? "var(--accent)" : pct > 50 ? "#f5c518" : "#a0a0b0" }}>
                {pct}%
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                Remaining
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#a0a0b0" }}>
                {totalItems - doneCount}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {clients.map((client) => {
            const cp = clientProgress(client);
            const isActiveClient = selectedClient.id === client.id;
            return (
              <div
                key={client.id}
                className="hc-client-btn"
                onClick={() => setSelectedClient(client)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 4,
                  flex: 1,
                  border: `1px solid ${isActiveClient ? `${client.color}40` : "rgba(255,255,255,0.06)"}`,
                  background: isActiveClient ? `${client.color}06` : "rgba(255,255,255,0.01)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 2, background: `${client.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: client.color }}>
                    {client.avatar}
                  </div>
                  <span style={{ fontSize: 11, color: isActiveClient ? "#fff" : "#a0a0b0" }}>{client.name}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: client.color, fontWeight: 700 }}>{cp}%</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${cp}%`, background: cp === 100 ? "var(--accent)" : client.color, borderRadius: 2, transition: "width 0.4s ease" }} />
                </div>
                <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 5 }}>{client.project}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {[
            { k: "all" as const, l: "All items" },
            { k: "incomplete" as const, l: "Incomplete only" }
          ].map((item) => (
            <button
              key={item.k}
              className="hc-filter-btn"
              onClick={() => setFilter(item.k)}
              style={{
                padding: "5px 12px",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                borderRadius: 2,
                background: filter === item.k ? "rgba(255,255,255,0.08)" : "transparent",
                color: filter === item.k ? "var(--text)" : "var(--muted2)"
              }}
            >
              {item.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "calc(100vh - 170px)" }}>
        <div style={{ padding: "24px 32px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          {visibleSections
            .slice(0, 3)
            .map((section) => (
              <Section
                key={section.section}
                section={section}
                isChecked={isChecked}
                toggle={toggle}
                markSectionDone={markSectionDone}
                sectionProgress={sectionProgress}
                notes={notes}
                setNotes={setNotes}
                clientId={selectedClient.id}
              />
            ))}
        </div>
        <div style={{ padding: "24px 32px" }}>
          {visibleSections
            .slice(3)
            .map((section) => (
              <Section
                key={section.section}
                section={section}
                isChecked={isChecked}
                toggle={toggle}
                markSectionDone={markSectionDone}
                sectionProgress={sectionProgress}
                notes={notes}
                setNotes={setNotes}
                clientId={selectedClient.id}
              />
            ))}

          {pct === 100 ? (
            <div style={{ marginTop: 20, padding: "20px", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)", borderRadius: 4, background: "color-mix(in srgb, var(--accent) 6%, transparent)", textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "var(--accent)", marginBottom: 6 }}>
                ✓ Handover complete
              </div>
              <div style={{ fontSize: 12, color: "var(--muted2)" }}>
                {selectedClient.name} · {selectedClient.project}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 6 }}>
                Ready to generate close-out report →
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Section({
  section,
  isChecked,
  toggle,
  markSectionDone,
  sectionProgress,
  notes,
  setNotes,
  clientId
}: {
  section: ChecklistSection;
  isChecked: (id: string) => boolean;
  toggle: (id: string) => void;
  markSectionDone: (section: ChecklistSection) => void;
  sectionProgress: (section: ChecklistSection) => { done: number; total: number; pct: number };
  notes: Record<string, string>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  clientId: number;
}) {
  const progress = sectionProgress(section);
  const done = progress.done === progress.total;
  const noteKey = `${String(clientId)}_note_${section.section}`;
  const [showNote, setShowNote] = useState(false);

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 14, color: section.color }}>{section.icon}</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: done ? "var(--accent)" : "#fff" }}>
          {section.section}
        </span>
        <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress.pct}%`, background: done ? "var(--accent)" : section.color, borderRadius: 2, transition: "width 0.3s ease" }} />
        </div>
        <span style={{ fontSize: 10, color: done ? "var(--accent)" : "var(--muted2)", flexShrink: 0 }}>
          {progress.done}/{progress.total}
        </span>
        {!done ? (
          <button
            className="hc-mark-btn"
            onClick={() => markSectionDone(section)}
            style={{ fontSize: 9, padding: "3px 8px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "var(--muted2)", letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            All done
          </button>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {section.items.map((item) => {
          const checked = isChecked(item.id);
          return (
            <div
              key={item.id}
              className="hc-check-row"
              onClick={() => toggle(item.id)}
              style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "9px 10px", borderRadius: 3, cursor: "pointer", background: checked ? "color-mix(in srgb, var(--accent) 3%, transparent)" : "transparent" }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  flexShrink: 0,
                  marginTop: 1,
                  border: `1.5px solid ${checked ? "var(--accent)" : "rgba(255,255,255,0.15)"}`,
                  background: checked ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "var(--accent)",
                  transition: "all 0.15s ease"
                }}
              >
                {checked ? <span style={{ animation: "hcCheck 0.15s ease" }}>✓</span> : null}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: checked ? "var(--muted2)" : "#a0a0b0", textDecoration: checked ? "line-through" : "none", lineHeight: 1.4 }}>
                  {item.label}
                </div>
                {item.note ? <div style={{ fontSize: 10, color: "#333344", marginTop: 2 }}>{item.note}</div> : null}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => setShowNote((value) => !value)}
          style={{ fontSize: 10, color: "var(--muted2)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em" }}
        >
          {showNote ? "− Hide note" : `+ ${notes[noteKey] ? "Edit" : "Add"} section note`}
        </button>
        {showNote ? (
          <textarea
            value={notes[noteKey] ?? ""}
            onChange={(event) =>
              setNotes((previous) => ({ ...previous, [noteKey]: event.target.value }))
            }
            placeholder={`Notes for ${section.section}…`}
            style={{ display: "block", width: "100%", marginTop: 6, minHeight: 56, padding: "8px 10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "#a0a0b0", fontSize: 11, lineHeight: 1.6 }}
          />
        ) : null}
      </div>
    </div>
  );
}
