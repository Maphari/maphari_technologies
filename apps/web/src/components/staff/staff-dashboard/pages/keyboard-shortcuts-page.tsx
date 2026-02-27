"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type Shortcut = { keys: string[]; desc: string };
type Section = {
  id: "nav" | "tasks" | "clients" | "comms" | "focus" | "search";
  label: string;
  icon: string;
  color: string;
  shortcuts: Shortcut[];
};

const sections: Section[] = [
  {
    id: "nav",
    label: "Navigation",
    icon: "◈",
    color: "var(--accent)",
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
    color: "#a78bfa",
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
    color: "#60a5fa",
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
    color: "#f5c518",
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
    color: "#ff8c00",
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
    color: "#a0a0b0",
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
    <kbd
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: isModifier || isArrow ? 22 : 20,
        height: 20,
        padding: "0 5px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderBottom: "2px solid rgba(255,255,255,0.18)",
        borderRadius: 3,
        fontSize: isModifier ? 11 : 10,
        color: "var(--text)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        letterSpacing: 0,
        lineHeight: 1
      }}
    >
      {k}
    </kbd>
  );
}

function ShortcutRow({ keys, desc, highlight }: { keys: string[]; desc: string; highlight?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "8px 12px",
        borderRadius: 3,
        background: highlight ? "color-mix(in srgb, var(--accent) 4%, transparent)" : "transparent",
        border: highlight ? "1px solid color-mix(in srgb, var(--accent) 10%, transparent)" : "1px solid transparent",
        transition: "background 0.12s ease"
      }}
    >
      <div style={{ display: "flex", gap: 3, alignItems: "center", flexShrink: 0 }}>
        {keys.map((k, i) => (
          <span key={`${k}-${String(i)}`} style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {i > 0 ? <span style={{ fontSize: 9, color: "var(--muted2)", margin: "0 1px" }}>+</span> : null}
            <Key k={k} />
          </span>
        ))}
      </div>
      <span style={{ fontSize: 12, color: "#a0a0b0", flex: 1 }}>{desc}</span>
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
          sectionColor: section.color
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
    <section className={cx("page", isActive && "pageActive")} id="page-keyboard-shortcuts">
      <style>{`
        input { outline: none; font-family: 'DM Mono', monospace; }
        input:focus { border-color: color-mix(in srgb, var(--accent) 30%, transparent) !important; }
        .ks-section-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; text-align: left; }
        .ks-section-btn:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "32px 32px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Help
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Keyboard Shortcuts
            </h1>
            <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 6 }}>
              {allShortcuts.length} shortcuts across {sections.length} categories
            </div>
          </div>
          <div style={{ padding: "8px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: "var(--muted2)" }}>Press</span>
            <Key k="?" />
            <span style={{ fontSize: 10, color: "var(--muted2)" }}>to open this panel</span>
          </div>
        </div>

        <div style={{ position: "relative", maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--muted2)" }}>⊡</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search shortcuts..."
            style={{ width: "100%", padding: "9px 12px 9px 32px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted2)", fontSize: 14, cursor: "pointer" }}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 175px)" }}>
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", padding: "16px 12px" }}>
          <button
            className="ks-section-btn"
            onClick={() => setActiveSection("all")}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 3, marginBottom: 4, background: activeSection === "all" ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent", color: activeSection === "all" ? "var(--accent)" : "var(--muted2)", fontSize: 11, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span>All shortcuts</span>
            <span style={{ fontSize: 10, color: "var(--muted2)" }}>{allShortcuts.length}</span>
          </button>

          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />

          {sections.map((section) => (
            <button
              key={section.id}
              className="ks-section-btn"
              onClick={() => setActiveSection(section.id)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 3, marginBottom: 3, background: activeSection === section.id ? `${section.color}12` : "transparent", fontSize: 11, display: "flex", alignItems: "center", gap: 8, color: activeSection === section.id ? section.color : "var(--muted2)" }}
            >
              <span style={{ fontSize: 12 }}>{section.icon}</span>
              <span style={{ flex: 1, textAlign: "left" }}>{section.label}</span>
              <span style={{ fontSize: 10, color: "#333344" }}>{section.shortcuts.length}</span>
            </button>
          ))}

          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.05)", margin: "12px 0 8px" }} />

          <button
            className="ks-section-btn"
            onClick={() => setActiveSection("recent")}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 3, background: activeSection === "recent" ? "rgba(245,197,24,0.08)" : "transparent", color: activeSection === "recent" ? "#f5c518" : "var(--muted2)", fontSize: 11, display: "flex", alignItems: "center", gap: 8 }}
          >
            <span style={{ fontSize: 12 }}>↻</span>
            <span>Recently used</span>
          </button>
        </div>

        <div style={{ padding: "20px 32px", overflowY: "auto" }}>
          {search ? (
            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{search}"
              </div>
              {searchResults.length === 0 ? (
                <div style={{ color: "var(--muted2)", fontSize: 12, padding: "20px 0" }}>No shortcuts match your search.</div>
              ) : null}
              {searchResults.map((shortcut, i) => (
                <div key={`${shortcut.desc}-${String(i)}`}>
                  <div style={{ fontSize: 9, color: shortcut.sectionColor, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, paddingLeft: 12 }}>
                    {shortcut.sectionLabel}
                  </div>
                  <ShortcutRow keys={shortcut.keys} desc={shortcut.desc} highlight />
                </div>
              ))}
            </div>
          ) : null}

          {!search && activeSection === "recent" ? (
            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                Recently used
              </div>
              {recentlyUsed.map((shortcut, i) => (
                <div key={`${shortcut.desc}-${String(i)}`} style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.08em", paddingLeft: 12, marginBottom: 2 }}>
                    {shortcut.section}
                  </div>
                  <ShortcutRow keys={[...shortcut.keys]} desc={shortcut.desc} />
                </div>
              ))}
            </div>
          ) : null}

          {!search && activeSection !== "recent" ? (
            <div style={{ display: "grid", gridTemplateColumns: activeSection === "all" ? "1fr 1fr" : "1fr", gap: 32 }}>
              {visibleSections.map((section) => (
                <div key={section.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 14, color: section.color }}>{section.icon}</span>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>{section.label}</span>
                    <div style={{ flex: 1, height: 1, background: `${section.color}20`, marginLeft: 4 }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {section.shortcuts.map((shortcut, i) => (
                      <ShortcutRow key={`${shortcut.desc}-${String(i)}`} keys={shortcut.keys} desc={shortcut.desc} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!search ? (
            <div style={{ marginTop: 36, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 4, background: "rgba(255,255,255,0.01)", display: "flex", gap: 32 }}>
              {[
                { label: "Quick tip", text: "Press G then a letter to jump to any screen instantly." },
                { label: "Mac vs Windows", text: "⌘ = Cmd on Mac · Ctrl on Windows · ⇧ = Shift everywhere." },
                { label: "Command palette", text: "Press ⌘K for fuzzy search across all actions and screens." }
              ].map((tip) => (
                <div key={tip.label} style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 }}>{tip.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted2)", lineHeight: 1.6 }}>{tip.text}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
