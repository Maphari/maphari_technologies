"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  color: string;
};

type NoteTag =
  | "preferences"
  | "contact"
  | "strategy"
  | "sensitive"
  | "finance"
  | "process"
  | "timeline"
  | "personal"
  | "growth";

type NoteRow = {
  id: number;
  clientId: number;
  title: string;
  body: string;
  tags: NoteTag[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "#a78bfa" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "#f5c518" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00" },
  { id: 0, name: "Internal", avatar: "IN", color: "#a0a0b0" }
];

const initialNotes: NoteRow[] = [
  {
    id: 1,
    clientId: 1,
    title: "Lena's communication preferences",
    body: "Lena prefers visual references over text explanations. Always have something on screen before the call. She responds fastest between 10am-12pm. Avoid Mondays - back-to-back meetings.\n\nDo NOT cc Tobias (CEO) without her asking. She finds it undermines her authority with the board.",
    tags: ["preferences", "contact"],
    pinned: true,
    createdAt: "Jan 9",
    updatedAt: "Feb 18"
  },
  {
    id: 2,
    clientId: 1,
    title: "Brand direction notes - internal",
    body: "The Concept A direction was rejected but Lena didn't say why clearly. I think it's because it was too similar to a competitor (Fable Studio) - don't mention this. Concept B is winning because of the warmer tones, not the wordmark.\n\nIf she asks about Concept A again, redirect to the amber palette rationale.",
    tags: ["strategy", "sensitive"],
    pinned: false,
    createdAt: "Feb 10",
    updatedAt: "Feb 10"
  },
  {
    id: 3,
    clientId: 2,
    title: "Marcus Rehn - personality notes",
    body: "Marcus is data-first. Never lead with creative - always anchor on metrics first. He's insecure about the AP department chaos and won't admit it directly.\n\nBest approach: give him an out by framing delays as 'normal for this stage' rather than pushing him. He responds well to being called competent.",
    tags: ["contact", "strategy"],
    pinned: true,
    createdAt: "Jan 22",
    updatedAt: "Feb 3"
  },
  {
    id: 4,
    clientId: 2,
    title: "Kestrel billing sensitivity",
    body: "Marcus mentioned in passing that the CFO is under pressure this quarter. The R21,000 monthly retainer is being scrutinised internally. Do NOT raise rates at renewal time - wait for them to initiate.\n\nInvoice timing matters: send on the 1st, never later.",
    tags: ["finance", "sensitive"],
    pinned: false,
    createdAt: "Feb 1",
    updatedAt: "Feb 1"
  },
  {
    id: 5,
    clientId: 3,
    title: "Clinical review process - what I've learned",
    body: "Clinical copy review at Mira is done by Dr. Priya (not Amara). She's notoriously slow - 7+ days is the norm even when 5 is quoted. Build at least 10 days into any timeline that involves patient-facing copy.\n\nAmara doesn't know how slow Priya is - don't tell her directly. Just build buffer and under-promise.",
    tags: ["process", "timeline"],
    pinned: false,
    createdAt: "Feb 15",
    updatedAt: "Feb 20"
  },
  {
    id: 6,
    clientId: 4,
    title: "Kofi's silence pattern",
    body: "Kofi goes silent for 5-10 days regularly. It happened in November too. He came back without explanation and approved everything. This is probably his working style - not a relationship problem.\n\nDon't panic. Don't escalate before day 10. Send max 2 follow-ups and then wait.",
    tags: ["contact", "process"],
    pinned: true,
    createdAt: "Feb 14",
    updatedAt: "Feb 22"
  },
  {
    id: 7,
    clientId: 5,
    title: "Chidi's preferences",
    body: "Chidi loves detailed progress emails - more detail than you'd normally give. He forwards them to his board so they need to sound polished.\n\nHe pays early because his assistant processes invoices on Mondays. Send invoices on Fridays to catch the Monday batch.",
    tags: ["preferences", "finance"],
    pinned: false,
    createdAt: "Jan 15",
    updatedAt: "Feb 19"
  },
  {
    id: 8,
    clientId: 0,
    title: "Things I want to improve",
    body: "Response time is still too slow on Fridays - I lose track of messages.\n\nI need to stop agreeing to changes verbally without documenting them. Three times now I've been caught without a paper trail.\n\nStart every week by reviewing the smart suggestions before opening email.",
    tags: ["personal", "growth"],
    pinned: false,
    createdAt: "Feb 1",
    updatedAt: "Feb 22"
  }
];

const tagColors: Record<NoteTag, string> = {
  preferences: "#60a5fa",
  contact: "#a78bfa",
  strategy: "#f5c518",
  sensitive: "#ff4444",
  finance: "var(--accent)",
  process: "#ff8c00",
  timeline: "#a0a0b0",
  personal: "#60a5fa",
  growth: "var(--accent)"
};

export function PrivateNotesPage({ isActive }: { isActive: boolean }) {
  const [notes, setNotes] = useState<NoteRow[]>(initialNotes);
  const [selected, setSelected] = useState<NoteRow | null>(initialNotes[0] ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<NoteRow | null>(null);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<"all" | NoteTag>("all");
  const [adding, setAdding] = useState(false);
  const [newNote, setNewNote] = useState({
    clientId: "0",
    title: "",
    body: "",
    tags: ""
  });

  const allTags = useMemo(
    () => [...new Set(notes.flatMap((note) => note.tags))] as NoteTag[],
    [notes]
  );

  const filtered = useMemo(() => {
    return notes
      .filter((note) => clientFilter === "all" || note.clientId === Number(clientFilter))
      .filter((note) => tagFilter === "all" || note.tags.includes(tagFilter))
      .filter((note) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return note.title.toLowerCase().includes(q) || note.body.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.id - a.id;
      });
  }, [clientFilter, notes, search, tagFilter]);

  const startEdit = () => {
    if (!selected) return;
    setDraft({ ...selected });
    setEditing(true);
  };

  const saveEdit = () => {
    if (!selected || !draft) return;
    const updated: NoteRow = { ...draft, updatedAt: "Today" };
    setNotes((previous) => previous.map((note) => (note.id === selected.id ? updated : note)));
    setSelected(updated);
    setEditing(false);
    setDraft(null);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
  };

  const togglePin = (id: number) => {
    setNotes((previous) =>
      previous.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note))
    );
    setSelected((previous) =>
      previous && previous.id === id ? { ...previous, pinned: !previous.pinned } : previous
    );
  };

  const deleteNote = (id: number) => {
    setNotes((previous) => previous.filter((note) => note.id !== id));
    setSelected((previous) => {
      if (!previous || previous.id !== id) return previous;
      return notes.find((note) => note.id !== id) ?? null;
    });
  };

  const addNote = () => {
    const tags = newNote.tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag): tag is NoteTag => Boolean(tag) && Object.hasOwn(tagColors, tag));

    const created: NoteRow = {
      id: Date.now(),
      clientId: Number(newNote.clientId),
      title: newNote.title.trim(),
      body: newNote.body.trim(),
      tags,
      pinned: false,
      createdAt: "Today",
      updatedAt: "Today"
    };
    setNotes((previous) => [created, ...previous]);
    setSelected(created);
    setAdding(false);
    setNewNote({ clientId: "0", title: "", body: "", tags: "" });
  };

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-private-notes">
      <style>{`
        input, textarea, select { outline: none; font-family: 'DM Mono', monospace; }
        input:focus, textarea:focus { border-color: color-mix(in srgb, var(--accent) 25%, transparent) !important; }
        textarea { resize: none; }
        .pn-note-row { transition: all 0.12s ease; cursor: pointer; }
        .pn-note-row:hover { background: color-mix(in srgb, var(--accent) 2%, transparent) !important; border-color: color-mix(in srgb, var(--accent) 15%, transparent) !important; }
        .pn-note-row:hover .pn-pin-btn { opacity: 1 !important; }
        .pn-pin-btn { transition: all 0.12s ease; cursor: pointer; background: none; border: none; }
        .pn-filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .pn-filter-btn:hover { opacity: 0.8; }
        .pn-action-btn { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .pn-action-btn:hover { opacity: 0.75; }
        .pn-save-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .pn-save-btn:hover:not(:disabled) { background: #a8d420 !important; }
        .pn-save-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100%" }}>
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "24px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Staff Dashboard</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>Private Notes</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 2 }}>
                <span style={{ fontSize: 8, color: "#ff4444" }}>◉</span>
                <span style={{ fontSize: 9, color: "#ff4444", letterSpacing: "0.08em" }}>PRIVATE</span>
              </div>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes..."
              style={{ width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "var(--text)", fontSize: 11, marginBottom: 10 }}
            />

            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <button className="pn-filter-btn" onClick={() => setClientFilter("all")} style={{ padding: "3px 8px", fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 2, background: clientFilter === "all" ? "var(--accent)" : "rgba(255,255,255,0.04)", color: clientFilter === "all" ? "#050508" : "var(--muted2)", border: "none" }}>
                All
              </button>
              {clients
                .filter((client) => notes.some((note) => note.clientId === client.id))
                .map((client) => (
                  <button key={client.id} className="pn-filter-btn" onClick={() => setClientFilter(clientFilter === String(client.id) ? "all" : String(client.id))} style={{ padding: "3px 8px", fontSize: 9, borderRadius: 2, background: clientFilter === String(client.id) ? `${client.color}20` : "rgba(255,255,255,0.03)", color: clientFilter === String(client.id) ? client.color : "var(--muted2)", border: "none" }}>
                    {client.avatar}
                  </button>
                ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
            <button
              onClick={() => {
                setAdding(true);
                setEditing(false);
                setSelected(null);
              }}
              style={{ width: "100%", padding: "8px 10px", marginBottom: 8, background: "transparent", border: "1px dashed color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 3, color: "var(--accent)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textAlign: "center" }}
            >
              + New note
            </button>

            {filtered.length === 0 ? <div style={{ padding: "20px 8px", fontSize: 11, color: "var(--muted2)", textAlign: "center" }}>No notes found.</div> : null}

            {filtered.map((note) => {
              const client = clients.find((entry) => entry.id === note.clientId);
              const isSelected = selected?.id === note.id;
              return (
                <div
                  key={note.id}
                  className="pn-note-row"
                  onClick={() => {
                    setSelected(note);
                    setEditing(false);
                    setAdding(false);
                  }}
                  style={{ padding: "11px 10px", borderRadius: 3, marginBottom: 4, border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "rgba(255,255,255,0.04)"}`, background: isSelected ? "color-mix(in srgb, var(--accent) 4%, transparent)" : "transparent", position: "relative" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {note.pinned ? <span style={{ fontSize: 9, color: "#f5c518" }}>◈</span> : null}
                        <span style={{ fontSize: 12, color: isSelected ? "#fff" : "#a0a0b0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.title}</span>
                      </div>
                      <span style={{ fontSize: 10, color: client?.color, display: "block", marginTop: 2 }}>{client?.name}</span>
                    </div>
                    <button className="pn-pin-btn" style={{ fontSize: 12, color: note.pinned ? "#f5c518" : "#333344", opacity: note.pinned ? 1 : 0, flexShrink: 0 }} onClick={(event) => { event.stopPropagation(); togglePin(note.id); }}>
                      {note.pinned ? "◈" : "◇"}
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted2)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.5, marginBottom: 5 }}>
                    {note.body}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {note.tags.slice(0, 2).map((tag) => (
                      <span key={tag} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 2, background: `${tagColors[tag]}15`, color: tagColors[tag], letterSpacing: "0.06em" }}>{tag}</span>
                    ))}
                    <span style={{ fontSize: 9, color: "#333344", marginLeft: "auto" }}>{note.updatedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Filter by tag</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <button className="pn-filter-btn" onClick={() => setTagFilter("all")} style={{ padding: "2px 7px", fontSize: 9, borderRadius: 2, background: tagFilter === "all" ? "rgba(255,255,255,0.08)" : "transparent", color: tagFilter === "all" ? "var(--text)" : "var(--muted2)", border: "none" }}>
                all
              </button>
              {allTags.map((tag) => (
                <button key={tag} className="pn-filter-btn" onClick={() => setTagFilter(tagFilter === tag ? "all" : tag)} style={{ padding: "2px 7px", fontSize: 9, borderRadius: 2, background: tagFilter === tag ? `${tagColors[tag]}18` : "transparent", color: tagFilter === tag ? tagColors[tag] : "var(--muted2)", border: "none" }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {adding ? (
            <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>New Private Note</div>

              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Client</label>
                <select value={newNote.clientId} onChange={(event) => setNewNote((previous) => ({ ...previous, clientId: event.target.value }))} style={{ padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, width: 240 }}>
                  {clients.map((client) => (
                    <option key={client.id} value={String(client.id)}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Title</label>
                <input value={newNote.title} onChange={(event) => setNewNote((previous) => ({ ...previous, title: event.target.value }))} placeholder="Note title..." style={{ width: "100%", maxWidth: 520, padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 13 }} />
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Note</label>
                <textarea value={newNote.body} onChange={(event) => setNewNote((previous) => ({ ...previous, body: event.target.value }))} placeholder="Write your private note here..." style={{ width: "100%", maxWidth: 620, minHeight: 180, padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 13, lineHeight: 1.8 }} />
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Tags (comma separated)</label>
                <input value={newNote.tags} onChange={(event) => setNewNote((previous) => ({ ...previous, tags: event.target.value }))} placeholder="e.g. preferences, contact, sensitive" style={{ width: "100%", maxWidth: 380, padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="pn-save-btn" disabled={!newNote.title.trim() || !newNote.body.trim()} onClick={addNote} style={{ padding: "11px 24px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Save note
                </button>
                <button onClick={() => setAdding(false)} style={{ padding: "11px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--muted2)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {!adding && selected ? (
            <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {!editing ? (
                <>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: clients.find((client) => client.id === selected.clientId)?.color }}>{clients.find((client) => client.id === selected.clientId)?.name}</span>
                        <span style={{ fontSize: 10, color: "var(--muted2)" }}>Updated {selected.updatedAt}</span>
                        {selected.pinned ? <span style={{ fontSize: 11, color: "#f5c518" }}>◈ Pinned</span> : null}
                      </div>
                      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2, maxWidth: 560 }}>{selected.title}</h2>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button className="pn-action-btn" onClick={() => togglePin(selected.id)} style={{ padding: "7px 12px", fontSize: 11, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: selected.pinned ? "#f5c518" : "var(--muted2)", cursor: "pointer" }}>
                        {selected.pinned ? "◈ Unpin" : "◇ Pin"}
                      </button>
                      <button className="pn-action-btn" onClick={startEdit} style={{ padding: "7px 14px", fontSize: 11, background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 3, color: "var(--accent)", cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        Edit
                      </button>
                      <button className="pn-action-btn" onClick={() => deleteNote(selected.id)} style={{ padding: "7px 10px", fontSize: 13, background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, color: "var(--muted2)", cursor: "pointer" }}>
                        ×
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
                    {selected.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: `${tagColors[tag]}15`, color: tagColors[tag], letterSpacing: "0.06em" }}>{tag}</span>
                    ))}
                  </div>

                  <div style={{ fontSize: 14, color: "#a0a0b0", lineHeight: 1.9, whiteSpace: "pre-wrap", maxWidth: 640 }}>{selected.body}</div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 640 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>Editing note</div>
                  <input
                    value={draft?.title ?? ""}
                    onChange={(event) =>
                      setDraft((previous) =>
                        previous ? { ...previous, title: event.target.value } : previous
                      )
                    }
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, color: "#fff", fontSize: 15, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
                  />
                  <textarea
                    value={draft?.body ?? ""}
                    onChange={(event) =>
                      setDraft((previous) =>
                        previous ? { ...previous, body: event.target.value } : previous
                      )
                    }
                    style={{ width: "100%", minHeight: 280, padding: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "#a0a0b0", fontSize: 14, lineHeight: 1.9 }}
                  />
                  <div>
                    <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Tags</label>
                    <input
                      value={draft?.tags.join(", ") ?? ""}
                      onChange={(event) =>
                        setDraft((previous) => {
                          if (!previous) return previous;
                          const nextTags = event.target.value
                            .split(",")
                            .map((tag) => tag.trim().toLowerCase())
                            .filter((tag): tag is NoteTag => Boolean(tag) && Object.hasOwn(tagColors, tag));
                          return { ...previous, tags: nextTags };
                        })
                      }
                      style={{ width: "100%", maxWidth: 340, padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="pn-save-btn" onClick={saveEdit} style={{ padding: "11px 24px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Save changes
                    </button>
                    <button onClick={cancelEdit} style={{ padding: "11px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--muted2)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {!adding && !selected ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--muted2)" }}>
              <div style={{ fontSize: 28 }}>◌</div>
              <div style={{ fontSize: 13 }}>Select a note or create one</div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
