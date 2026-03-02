"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type Shortcut = { keys: string[]; desc: string };
type Section = {
  id: "nav" | "tasks" | "clients" | "comms" | "focus" | "search";
  label: string;
  icon: string;
  toneClass: string;
  surfaceClass: string;
  lineClass: string;
  shortcuts: Shortcut[];
};

const sections: Section[] = [
  {
    id: "nav",
    label: "Navigation",
    icon: "◈",
    toneClass: "ksToneAccent",
    surfaceClass: "ksSurfaceAccent",
    lineClass: "ksLineAccent",
    shortcuts: [
      { keys: ["G", "H"], desc: "Go to Home / Dashboard" },
      { keys: ["G", "T"], desc: "Go to Today's tasks" },
      { keys: ["G", "C"], desc: "Go to Client health scores" },
      { keys: ["G", "M"], desc: "Go to Milestones" },
      { keys: ["G", "S"], desc: "Go to Smart suggestions" },
      { keys: ["G", "F"], desc: "Go to Focus mode" },
      { keys: ["G", "W"], desc: "Go to Wiki / SOPs" },
      { keys: ["G", "P"], desc: "Go to Performance dashboard" },
      { keys: ["G", "R"], desc: "Go to Recurring tasks" },
      { keys: ["G", "L"], desc: "Go to Decision log" },
      { keys: ["⌘", "K"], desc: "Open command palette" },
      { keys: ["?"], desc: "Open keyboard shortcut panel" }
    ]
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: "◎",
    toneClass: "ksTonePurple",
    surfaceClass: "ksSurfacePurple",
    lineClass: "ksLinePurple",
    shortcuts: [
      { keys: ["N"], desc: "New task" },
      { keys: ["⌘", "Enter"], desc: "Save task / confirm action" },
      { keys: ["E"], desc: "Edit selected task" },
      { keys: ["D"], desc: "Mark task done" },
      { keys: ["P"], desc: "Pin / unpin task" },
      { keys: ["⌫"], desc: "Delete selected task" },
      { keys: ["↑", "↓"], desc: "Navigate task list" },
      { keys: ["Space"], desc: "Toggle task status" },
      { keys: ["Tab"], desc: "Assign day / move to next field" },
      { keys: ["Esc"], desc: "Cancel / close panel" }
    ]
  },
  {
    id: "clients",
    label: "Clients",
    icon: "◉",
    toneClass: "ksToneBlue",
    surfaceClass: "ksSurfaceBlue",
    lineClass: "ksLineBlue",
    shortcuts: [
      { keys: ["1"], desc: "Switch to client 1 (Volta Studios)" },
      { keys: ["2"], desc: "Switch to client 2 (Kestrel Capital)" },
      { keys: ["3"], desc: "Switch to client 3 (Mira Health)" },
      { keys: ["4"], desc: "Switch to client 4 (Dune Collective)" },
      { keys: ["5"], desc: "Switch to client 5 (Okafor & Sons)" },
      { keys: ["0"], desc: "Clear client filter / show all" },
      { keys: ["⌘", "⇧", "U"], desc: "Send client update (auto-draft)" },
      { keys: ["⌘", "⇧", "M"], desc: "Open meeting prep for next call" }
    ]
  },
  {
    id: "comms",
    label: "Communication",
    icon: "✉",
    toneClass: "ksToneAmber",
    surfaceClass: "ksSurfaceAmber",
    lineClass: "ksLineAmber",
    shortcuts: [
      { keys: ["⌘", "⇧", "N"], desc: "New message to selected client" },
      { keys: ["R"], desc: "Reply to selected message" },
      { keys: ["⌘", "⇧", "A"], desc: "Auto-draft update for selected client" },
      { keys: ["⌘", "⇧", "C"], desc: "Copy last message to clipboard" },
      { keys: ["M"], desc: "Mark thread as read" },
      { keys: ["⌘", "⇧", "F"], desc: "Flag message for follow-up" }
    ]
  },
  {
    id: "focus",
    label: "Focus & Time",
    icon: "◌",
    toneClass: "ksToneOrange",
    surfaceClass: "ksSurfaceOrange",
    lineClass: "ksLineOrange",
    shortcuts: [
      { keys: ["F"], desc: "Start focus session (25 min default)" },
      { keys: ["⌘", "⇧", "P"], desc: "Pause / resume active focus session" },
      { keys: ["⌘", "⇧", "S"], desc: "Submit daily standup" },
      { keys: ["⌘", "⇧", "W"], desc: "Open end-of-day wrap" },
      { keys: ["L"], desc: "Log hours (quick entry)" },
      { keys: ["⌘", "⇧", "L"], desc: "Open full time log" }
    ]
  },
  {
    id: "search",
    label: "Search & Filter",
    icon: "⊡",
    toneClass: "ksToneMuted",
    surfaceClass: "ksSurfaceMuted",
    lineClass: "ksLineMuted",
    shortcuts: [
      { keys: ["/"], desc: "Focus search field" },
      { keys: ["Esc"], desc: "Clear search / close results" },
      { keys: ["⌘", "F"], desc: "Find in current view" },
      { keys: ["⌘", "⇧", "K"], desc: "Search across all clients" },
      { keys: ["⌘", "⇧", "D"], desc: "Search decision log" },
      { keys: ["⌘", "⇧", "N"], desc: "Search private notes" }
    ]
  }
];

const recentlyUsed = [
  { keys: ["⌘", "K"], desc: "Command palette", section: "Navigation" },
  { keys: ["D"], desc: "Mark task done", section: "Tasks" },
  { keys: ["G", "S"], desc: "Smart suggestions", section: "Navigation" },
  { keys: ["F"], desc: "Start focus session", section: "Focus & Time" },
  { keys: ["N"], desc: "New task", section: "Tasks" }
] as const;

function Key({ k }: { k: string }) {
  const isModifier = ["⌘", "⇧", "⌃", "⌥"].includes(k);
  const isArrow = ["↑", "↓", "←", "→"].includes(k);
  return (
    <kbd className={cx("ksKey", (isModifier || isArrow) && "ksKeyWide", isModifier && "ksKeyModifier")}>
      {k}
    </kbd>
  );
}

function ShortcutRow({ keys, desc, highlight }: { keys: string[]; desc: string; highlight?: boolean }) {
  return (
    <div
      className={cx("flexRow", "gap14", "ksShortcutRow", highlight && "ksShortcutRowHighlight")}
    >
      <div className={cx("flexRow", "noShrink", "ksKeySequence")}>
        {keys.map((k, i) => (
          <span key={`${k}-${String(i)}`} className={cx("flexRow", "ksKeyPiece")}>
            {i > 0 ? <span className={cx("textXs", "colorMuted2", "ksKeyJoin")}>+</span> : null}
            <Key k={k} />
          </span>
        ))}
      </div>
      <span className={cx("text12", "colorMuted", "flex1")}>{desc}</span>
    </div>
  );
}

export function KeyboardShortcutsPage({ isActive }: { isActive: boolean }) {
  const [activeSection, setActiveSection] = useState<"all" | "recent" | Section["id"]>("all");
  const [search, setSearch] = useState("");

  const allShortcuts = useMemo(
    () =>
      sections.flatMap((section) =>
        section.shortcuts.map((shortcut) => ({
          ...shortcut,
          sectionId: section.id,
          sectionLabel: section.label,
          sectionToneClass: section.toneClass
        }))
      ),
    []
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allShortcuts.filter(
      (shortcut) =>
        shortcut.desc.toLowerCase().includes(q) ||
        shortcut.keys.join(" ").toLowerCase().includes(q)
    );
  }, [allShortcuts, search]);

  const visibleSections = activeSection === "all" ? sections : sections.filter((section) => section.id === activeSection);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-keyboard-shortcuts">
      <div className={cx("pageHeaderBar", "borderB", "ksHeaderWrap")}>
        <div className={cx("flexBetween", "mb20", "itemsStart")}>
          <div>
            <div className={cx("pageEyebrow", "mb8")}>
              Staff Dashboard / Help
            </div>
            <h1 className={cx("pageTitle")}>
              Keyboard Shortcuts
            </h1>
            <div className={cx("text12", "colorMuted2", "mt6")}>
              {allShortcuts.length} shortcuts across {sections.length} categories
            </div>
          </div>
          <div className={cx("flexRow", "gap8", "ksPressHint")}>
            <span className={cx("text10", "colorMuted2")}>Press</span>
            <Key k="?" />
            <span className={cx("text10", "colorMuted2")}>to open this panel</span>
          </div>
        </div>

        <div className={cx("ksSearchWrap")}>
          <span className={cx("text12", "colorMuted2", "ksSearchIcon")}>⊡</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search shortcuts..."
            className={cx("ksSearchInput", "ksSearchInputInner")}
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className={cx("ksSearchClear")}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div className={cx("ksMainGrid")}>
        <div className={cx("ksSideCol")}>
          <button
            type="button"
            className={cx("ksSectionBtn", "wFull", "flexBetween", "mb4", "ksSideRowBtn", activeSection === "all" ? "ksSectionAllActive" : "ksSectionIdle")}
            onClick={() => setActiveSection("all")}
          >
            <span>All shortcuts</span>
            <span className={cx("text10", "colorMuted2")}>{allShortcuts.length}</span>
          </button>

          <div className={cx("wFull", "ksDivider", "ksDividerSm")} />

          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={cx(
                "ksSectionBtn",
                "wFull",
                "flexRow",
                "gap8",
                "ksSideRowBtn",
                activeSection === section.id ? "ksSectionToneActive" : "ksSectionIdle",
                activeSection === section.id && section.surfaceClass,
                activeSection === section.id && section.toneClass
              )}
              onClick={() => setActiveSection(section.id)}
            >
              <span className={cx("text12")}>{section.icon}</span>
              <span className={cx("flex1", "textLeft")}>{section.label}</span>
              <span className={cx("text10", "colorMuted2")}>{section.shortcuts.length}</span>
            </button>
          ))}

          <div className={cx("wFull", "ksDivider", "ksDividerLg")} />

          <button
            type="button"
            className={cx("ksSectionBtn", "wFull", "flexRow", "gap8", "ksSideRowBtn", activeSection === "recent" ? "ksSectionRecentActive" : "ksSectionIdle")}
            onClick={() => setActiveSection("recent")}
          >
            <span className={cx("text12")}>↻</span>
            <span>Recently used</span>
          </button>
        </div>

        <div className={cx("ksContentCol")}>
          {search ? (
            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb14", "trackingWide12")}>
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &quot;{search}&quot;
              </div>
              {searchResults.length === 0 ? (
                <div className={cx("colorMuted2", "text12", "ksEmptySearch")}>No shortcuts match your search.</div>
              ) : null}
              {searchResults.map((shortcut, i) => (
                <div key={`${shortcut.desc}-${String(i)}`}>
                  <div className={cx("textXs", "uppercase", "mb4", "trackingWide10", "pl12", shortcut.sectionToneClass)}>
                    {shortcut.sectionLabel}
                  </div>
                  <ShortcutRow keys={shortcut.keys} desc={shortcut.desc} highlight />
                </div>
              ))}
            </div>
          ) : null}

          {!search && activeSection === "recent" ? (
            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb14", "trackingWide12")}>
                Recently used
              </div>
              {recentlyUsed.map((shortcut, i) => (
                <div key={`${shortcut.desc}-${String(i)}`} className={cx("mb4")}>
                  <div className={cx("textXs", "colorMuted2", "trackingWide8", "pl12", "mb2")}>
                    {shortcut.section}
                  </div>
                  <ShortcutRow keys={[...shortcut.keys]} desc={shortcut.desc} />
                </div>
              ))}
            </div>
          ) : null}

          {!search && activeSection !== "recent" ? (
            <div className={cx("ksSectionsGrid", activeSection === "all" ? "ksSectionsGridAll" : "ksSectionsGridSingle")}>
              {visibleSections.map((section) => (
                <div key={section.id}>
                  <div className={cx("flexRow", "gap8", "mb14")}>
                    <span className={cx("text14", section.toneClass)}>{section.icon}</span>
                    <span className={cx("fontDisplay", "text14", "fw700", "colorText")}>{section.label}</span>
                    <div className={cx("flex1", "ksSectionLine", section.lineClass)} />
                  </div>
                  <div className={cx("flexCol", "gap2")}>
                    {section.shortcuts.map((shortcut, i) => (
                      <ShortcutRow key={`${shortcut.desc}-${String(i)}`} keys={shortcut.keys} desc={shortcut.desc} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!search ? (
            <div className={cx("flexRow", "gap24", "ksTipsCard")}>
              {[
                { label: "Quick tip", text: "Press G then a letter to jump to any screen instantly." },
                { label: "Mac vs Windows", text: "⌘ = Cmd on Mac · Ctrl on Windows · ⇧ = Shift everywhere." },
                { label: "Command palette", text: "Press ⌘K for fuzzy search across all actions and screens." }
              ].map((tip) => (
                <div key={tip.label} className={cx("flex1")}>
                  <div className={cx("textXs", "colorAccent", "uppercase", "mb5", "trackingWide12")}>{tip.label}</div>
                  <div className={cx("text11", "colorMuted2", "lh16")}>{tip.text}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
