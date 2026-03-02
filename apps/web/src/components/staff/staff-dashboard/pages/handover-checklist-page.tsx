"use client";

import { useState } from "react";
import { cx } from "../style";

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  project: string;
  toneClass: string;
  activeClass: string;
  avatarClass: string;
  meterClass: string;
};

type ChecklistItem = {
  id: string;
  label: string;
  note: string | null;
};

type ChecklistSection = {
  section: string;
  icon: string;
  toneClass: string;
  meterClass: string;
  items: ChecklistItem[];
};

const clients: ClientRow[] = [
  {
    id: 1,
    name: "Volta Studios",
    avatar: "VS",
    project: "Brand Identity System",
    toneClass: "hoToneAccent",
    activeClass: "hoClientActiveAccent",
    avatarClass: "hoAvatarAccent",
    meterClass: "hoMeterAccent"
  },
  {
    id: 3,
    name: "Mira Health",
    avatar: "MH",
    project: "Website Redesign",
    toneClass: "hoToneBlue",
    activeClass: "hoClientActiveBlue",
    avatarClass: "hoAvatarBlue",
    meterClass: "hoMeterBlue"
  },
  {
    id: 5,
    name: "Okafor & Sons",
    avatar: "OS",
    project: "Annual Report 2025",
    toneClass: "hoToneOrange",
    activeClass: "hoClientActiveOrange",
    avatarClass: "hoAvatarOrange",
    meterClass: "hoMeterOrange"
  }
];

const checklistTemplate: ChecklistSection[] = [
  {
    section: "Files & Assets",
    icon: "⊡",
    toneClass: "hoToneBlue",
    meterClass: "hoMeterBlue",
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
    toneClass: "hoTonePurple",
    meterClass: "hoMeterPurple",
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
    toneClass: "hoToneAmber",
    meterClass: "hoMeterAmber",
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
    toneClass: "hoToneAccent",
    meterClass: "hoMeterAccent",
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
    toneClass: "hoToneOrange",
    meterClass: "hoMeterOrange",
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
    toneClass: "hoToneMuted",
    meterClass: "hoMeterMuted",
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

function overallToneClass(pct: number): string {
  if (pct === 100) return "hoToneAccent";
  if (pct > 50) return "hoToneAmber";
  return "hoToneMuted";
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
              <div className={cx("fontDisplay", "fw800", "hoStatValue", "hoToneMuted")}>{totalItems - doneCount}</div>
            </div>
          </div>
        </div>

        <div className={cx("flexRow", "gap10", "mb16")}> 
          {clients.map((client) => {
            const cp = clientProgress(client);
            const isActiveClient = selectedClient.id === client.id;
            return (
              <div
                key={client.id}
                className={cx("hoClientBtn", "hoClientCard", "flex1", isActiveClient ? client.activeClass : "hoClientCardIdle")}
                onClick={() => setSelectedClient(client)}
              >
                <div className={cx("flexRow", "gap8", "mb8", "hoClientHead")}> 
                  <div className={cx("flexCenter", "hoClientAvatar", client.avatarClass)}>{client.avatar}</div>
                  <span className={cx("text11", isActiveClient ? "colorText" : "colorMuted")}>{client.name}</span>
                  <span className={cx("text12", "fw700", "hoClientPct", client.toneClass)}>{cp}%</span>
                </div>
                <progress className={cx("hoClientMeter", cp === 100 ? "hoMeterAccent" : client.meterClass)} max={100} value={cp} />
                <div className={cx("text10", "colorMuted2", "mt4", "hoClientProject")}>{client.project}</div>
              </div>
            );
          })}
        </div>

        <div className={cx("filterRow")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter checklist items"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | "incomplete")}
          >
            <option value="all">All items</option>
            <option value="incomplete">Incomplete only</option>
          </select>
        </div>
      </div>

      <div className={cx("hoLayout")}> 
        <div className={cx("hoCol", "hoColLeft")}>
          {visibleSections.slice(0, 3).map((section) => (
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

        <div className={cx("hoCol")}> 
          {visibleSections.slice(3).map((section) => (
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
            <div className={cx("mt20", "textCenter", "hoCompleteCard")}>
              <div className={cx("fontDisplay", "fw800", "colorAccent", "mb6", "hoCompleteTitle")}>✓ Handover complete</div>
              <div className={cx("text12", "colorMuted2")}>{selectedClient.name} · {selectedClient.project}</div>
              <div className={cx("text11", "colorMuted2", "mt6")}>Ready to generate close-out report →</div>
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
    <div className={cx("mb28")}>
      <div className={cx("flexRow", "gap10", "mb12", "hoSectionHead")}>
        <span className={cx("text14", section.toneClass)}>{section.icon}</span>
        <span className={cx("fontDisplay", "text14", "fw700", done ? "hoToneAccent" : "colorText")}>{section.section}</span>
        <progress
          className={cx("hoSectionMeter", done ? "hoMeterAccent" : section.meterClass)}
          max={progress.total}
          value={progress.done}
        />
        <span className={cx("text10", "noShrink", done ? "hoToneAccent" : "colorMuted2")}>{progress.done}/{progress.total}</span>
        {!done ? (
          <button
            type="button"
            className={cx("hoMarkBtn", "uppercase")}
            onClick={() => markSectionDone(section)}
          >
            All done
          </button>
        ) : null}
      </div>

      <div className={cx("flexCol", "gap4")}>
        {section.items.map((item) => {
          const checked = isChecked(item.id);
          return (
            <div
              key={item.id}
              className={cx("hoCheckRow", "hoCheckItem", checked && "hoCheckItemChecked")}
              onClick={() => toggle(item.id)}
            >
              <div className={cx("flexCenter", "noShrink", "hoCheckBox", checked && "hoCheckBoxChecked")}>
                {checked ? <span className={cx("hoCheckAnim")}>✓</span> : null}
              </div>
              <div className={cx("flex1")}>
                <div className={cx("text12", "hoItemLabel", checked && "hoItemLabelChecked")}>{item.label}</div>
                {item.note ? <div className={cx("text10", "mt4", "hoItemNote")}>{item.note}</div> : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className={cx("mt8")}>
        <button
          type="button"
          onClick={() => setShowNote((value) => !value)}
          className={cx("hoNoteToggle")}
        >
          {showNote ? "− Hide note" : `+ ${notes[noteKey] ? "Edit" : "Add"} section note`}
        </button>
        {showNote ? (
          <textarea
            className={cx("hoTextarea", "hoNoteInput")}
            value={notes[noteKey] ?? ""}
            onChange={(event) => setNotes((previous) => ({ ...previous, [noteKey]: event.target.value }))}
            placeholder={`Notes for ${section.section}…`}
          />
        ) : null}
      </div>
    </div>
  );
}
