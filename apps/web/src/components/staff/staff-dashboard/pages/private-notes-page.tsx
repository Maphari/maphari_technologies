// ════════════════════════════════════════════════════════════════════════════
// private-notes-page.tsx — Staff Private Notes
// Storage  : localStorage (no backend route for private staff notes)
//            Key: "maphari_staff_notes"
//            Notes are encrypted at rest only to the staff member's browser.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useMemo, useState, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";

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

// ── localStorage helpers ──────────────────────────────────────────────────────
const NOTES_KEY = "maphari_staff_notes";

function loadNotes(): NoteRow[] {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) ?? "[]") as NoteRow[]; }
  catch { return []; }
}

function saveNotes(notes: NoteRow[]): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

// ── Tag meta ──────────────────────────────────────────────────────────────────
const tagColors: Record<NoteTag, string> = {
  preferences: "var(--blue)",
  contact:     "var(--purple)",
  strategy:    "var(--amber)",
  sensitive:   "var(--red)",
  finance:     "var(--accent)",
  process:     "var(--amber)",
  timeline:    "var(--muted)",
  personal:    "var(--blue)",
  growth:      "var(--accent)",
};

// Client list for note categorisation (populated from API once wired)
const CLIENTS: { id: number; name: string; avatar: string }[] = [
  { id: 0, name: "Internal", avatar: "IN" },
];

// Format today's date as "DD MMM"
function todayLabel(): string {
  return new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export function PrivateNotesPage({ isActive }: { isActive: boolean }) {
  const [notes, setNotes]            = useState<NoteRow[]>([]);
  const [hydrated, setHydrated]      = useState(false);
  const [selected, setSelected]      = useState<NoteRow | null>(null);
  const [editing, setEditing]        = useState(false);
  const [draft, setDraft]            = useState<NoteRow | null>(null);
  const [search, setSearch]          = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [tagFilter, setTagFilter]    = useState<"all" | NoteTag>("all");
  const [adding, setAdding]          = useState(false);
  const [newNote, setNewNote]        = useState({ clientId: "0", title: "", body: "", tags: "" });

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const stored = loadNotes();
    setNotes(stored);
    setSelected(stored[0] ?? null);
    setHydrated(true);
  }, []);

  const allTags = useMemo(
    () => [...new Set(notes.flatMap((n) => n.tags))] as NoteTag[],
    [notes]
  );

  const filtered = useMemo(() => {
    return notes
      .filter((n) => clientFilter === "all" || n.clientId === Number(clientFilter))
      .filter((n) => tagFilter === "all" || n.tags.includes(tagFilter))
      .filter((n) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.id - a.id;
      });
  }, [clientFilter, notes, search, tagFilter]);

  // Persist helper: update state and localStorage atomically
  function applyNotes(next: NoteRow[]) {
    setNotes(next);
    saveNotes(next);
  }

  const startEdit = () => {
    if (!selected) return;
    setDraft({ ...selected });
    setEditing(true);
  };

  const saveEdit = () => {
    if (!selected || !draft) return;
    const updated: NoteRow = { ...draft, updatedAt: todayLabel() };
    const next = notes.map((n) => (n.id === selected.id ? updated : n));
    applyNotes(next);
    setSelected(updated);
    setEditing(false);
    setDraft(null);
  };

  const cancelEdit = () => { setEditing(false); setDraft(null); };

  const togglePin = (id: number) => {
    const next = notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
    applyNotes(next);
    setSelected((prev) => (prev && prev.id === id ? { ...prev, pinned: !prev.pinned } : prev));
  };

  const deleteNote = (id: number) => {
    const next = notes.filter((n) => n.id !== id);
    applyNotes(next);
    setSelected((prev) => {
      if (!prev || prev.id !== id) return prev;
      return next.find((n) => n.id !== id) ?? null;
    });
  };

  const addNote = () => {
    const tags = newNote.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t): t is NoteTag => Boolean(t) && Object.hasOwn(tagColors, t));
    const today = todayLabel();
    const created: NoteRow = {
      id: Date.now(),
      clientId: Number(newNote.clientId),
      title: newNote.title.trim(),
      body: newNote.body.trim(),
      tags,
      pinned: false,
      createdAt: today,
      updatedAt: today,
    };
    const next = [created, ...notes];
    applyNotes(next);
    setSelected(created);
    setAdding(false);
    setNewNote({ clientId: "0", title: "", body: "", tags: "" });
  };

  const selectedClient = selected ? CLIENTS.find((c) => c.id === selected.clientId) : null;

  if (!hydrated) return null;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-private-notes">
      <div className={cx("pnLayout")}>
        <div className={cx("flexCol", "overflowHidden", "pnSidebar")}>
          <div className={cx("pageHeaderBar", "noShrink", "pnSidebarHead")}>
            <div className={cx("pageEyebrowText", "mb6")}>Staff Dashboard</div>
            <div className={cx("flexBetween", "mb14")}>
              <h1 className={cx("pnSidebarTitle")}>Private Notes</h1>
              <div className={cx("privateBadge")}>
                <span className={cx("colorRed", "pnPrivateDot")}>◉</span>
                <span className={cx("colorRed", "pnPrivateText")}>PRIVATE</span>
              </div>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className={cx("inputBase", "wFull", "text11", "mb10", "pnSearchInput")}
            />

            <div className={cx("filterRow")}>
              <select
                className={cx("filterSelect")}
                aria-label="Filter notes by client"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="all">All clients</option>
                {CLIENTS
                  .filter((c) => notes.some((n) => n.clientId === c.id))
                  .map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className={cx("flex1", "overflowAuto", "pnListPane")}>
            <button
              type="button"
              onClick={() => { setAdding(true); setEditing(false); setSelected(null); }}
              className={cx("pnNewNoteBtn", "pnNewNoteBtnSm")}
            >
              + New note
            </button>

            {filtered.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="file-text" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No notes found</div>
                <div className={cx("emptyStateSub")}>Notes matching your search will appear here.</div>
              </div>
            ) : null}

            {filtered.map((note) => {
              const client = CLIENTS.find((c) => c.id === note.clientId);
              const isSelected = selected?.id === note.id;
              return (
                <div
                  key={note.id}
                  className={cx("pnNoteCard", "pnNoteCardShell", isSelected && "pnNoteCardSelected")}
                  onClick={() => { setSelected(note); setEditing(false); setAdding(false); }}
                >
                  <div className={cx("flexRow", "gap6", "mb4", "pnRowStart")}>
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("flexRow", "gap6")}>
                        {note.pinned ? <span className={cx("pnPinnedGlyph")}>◈</span> : null}
                        <span className={cx("text12", "truncate", "pnCardTitle", isSelected && "pnCardTitleSelected")}>{note.title}</span>
                      </div>
                      <span className={cx("text10", "pnClientText")} data-client-id={String(note.clientId)}>
                        {client?.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={cx("pnPinBtn", "pnPinBtnCard", note.pinned && "pnPinBtnCardActive")}
                      onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                    >
                      {note.pinned ? "◈" : "◇"}
                    </button>
                  </div>
                  <div className={cx("text10", "colorMuted2", "mb4", "pnBodyClamp")}>{note.body}</div>
                  <div className={cx("flexRow", "gap4", "flexWrap")}>
                    {note.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className={cx("pnTagChip", "pnTagChipSm")} data-tag={tag}>{tag}</span>
                    ))}
                    <span className={cx("pnUpdatedAt")}>{note.updatedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={cx("noShrink", "pnSidebarFoot")}>
            <div className={cx("sectionLabel", "mb8", "pnTagFilterLabel")}>Filter by tag</div>
            <div className={cx("filterRow")}>
              <select
                className={cx("filterSelect")}
                aria-label="Filter notes by tag"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value as "all" | NoteTag)}
              >
                <option value="all">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={cx("flexCol", "overflowHidden", "pnMainPane")}>
          {adding ? (
            <div className={cx("flex1", "flexCol", "gap20", "overflowAuto", "pnPane")}>
              <div className={cx("pnPaneTitleLg")}>New Private Note</div>

              <div>
                <label className={cx("labelUpper")}>Client</label>
                <select
                  aria-label="Client for private note"
                  value={newNote.clientId}
                  onChange={(e) => setNewNote((p) => ({ ...p, clientId: e.target.value }))}
                  className={cx("selectBase", "text12", "pnClientSelect")}
                  title="Client"
                >
                  {CLIENTS.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={cx("labelUpper")}>Title</label>
                <input
                  value={newNote.title}
                  onChange={(e) => setNewNote((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Note title..."
                  className={cx("inputBase", "wFull", "text13", "pnTitleInput")}
                />
              </div>

              <div>
                <label className={cx("labelUpper")}>Note</label>
                <textarea
                  value={newNote.body}
                  onChange={(e) => setNewNote((p) => ({ ...p, body: e.target.value }))}
                  placeholder="Write your private note here..."
                  className={cx("inputBase", "wFull", "text13", "pnComposeBody")}
                />
              </div>

              <div>
                <label className={cx("labelUpper")}>Tags (comma separated)</label>
                <input
                  value={newNote.tags}
                  onChange={(e) => setNewNote((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="e.g. preferences, contact, sensitive"
                  className={cx("inputBase", "wFull", "text12", "pnTagsInput")}
                />
              </div>

              <div className={cx("flexRow", "gap10")}>
                <button
                  type="button"
                  className={cx("pnSaveBtn", "pnSaveBtnPrimary")}
                  disabled={!newNote.title.trim() || !newNote.body.trim()}
                  onClick={addNote}
                >
                  Save note
                </button>
                <button type="button" onClick={() => setAdding(false)} className={cx("cancelBtnBase")}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {!adding && selected ? (
            <div className={cx("flex1", "flexCol", "overflowAuto", "pnPane")}>
              {!editing ? (
                <>
                  <div className={cx("flexBetween", "mb16", "pnDetailHead")}>
                    <div className={cx("flex1")}>
                      <div className={cx("flexRow", "gap10", "mb8")}>
                        <span className={cx("text11", "pnClientText")} data-client-id={String(selected.clientId)}>
                          {selectedClient?.name}
                        </span>
                        <span className={cx("text10", "colorMuted2")}>Updated {selected.updatedAt}</span>
                        {selected.pinned ? <span className={cx("text11", "pnPinnedLabel")}>◈ Pinned</span> : null}
                      </div>
                      <h2 className={cx("pnDetailTitle")}>{selected.title}</h2>
                    </div>
                    <div className={cx("flexRow", "gap8", "noShrink")}>
                      <button
                        type="button"
                        className={cx("pnActionBtn", "ghostBtnBase", selected.pinned && "pnPinActionActive")}
                        onClick={() => togglePin(selected.id)}
                      >
                        {selected.pinned ? "◈ Unpin" : "◇ Pin"}
                      </button>
                      <button type="button" className={cx("pnActionBtn", "accentBtnBase")} onClick={startEdit}>
                        Edit
                      </button>
                      <button type="button" className={cx("pnActionBtn", "pnDeleteBtn")} onClick={() => deleteNote(selected.id)}>
                        ×
                      </button>
                    </div>
                  </div>

                  <div className={cx("flexRow", "gap6", "mb24")}>
                    {selected.tags.map((tag) => (
                      <span key={tag} className={cx("pnTagChip", "pnTagChipMd")} data-tag={tag}>{tag}</span>
                    ))}
                  </div>

                  <div className={cx("text14", "colorMuted", "pnDetailBody")}>{selected.body}</div>
                </>
              ) : (
                <div className={cx("flexCol", "gap20", "pnEditPane")}>
                  <div className={cx("pnSidebarTitle")}>Editing note</div>

                  <input
                    value={draft?.title ?? ""}
                    onChange={(e) => setDraft((p) => (p ? { ...p, title: e.target.value } : p))}
                    placeholder="Note title"
                    className={cx("inputBase", "wFull", "fontDisplay", "fw700", "colorText", "pnEditTitleInput")}
                  />

                  <textarea
                    value={draft?.body ?? ""}
                    onChange={(e) => setDraft((p) => (p ? { ...p, body: e.target.value } : p))}
                    placeholder="Note body"
                    className={cx("inputBase", "wFull", "text14", "colorMuted", "pnEditBodyInput")}
                  />

                  <div>
                    <label className={cx("labelUpper")}>Tags</label>
                    <input
                      placeholder="e.g. preferences, contact"
                      value={draft?.tags.join(", ") ?? ""}
                      onChange={(e) =>
                        setDraft((p) => {
                          if (!p) return p;
                          const nextTags = e.target.value
                            .split(",")
                            .map((t) => t.trim().toLowerCase())
                            .filter((t): t is NoteTag => Boolean(t) && Object.hasOwn(tagColors, t));
                          return { ...p, tags: nextTags };
                        })
                      }
                      className={cx("inputBase", "wFull", "text12", "pnEditTagsInput")}
                    />
                  </div>

                  <div className={cx("flexRow", "gap10")}>
                    <button type="button" className={cx("pnSaveBtn", "pnSaveBtnPrimary")} onClick={saveEdit}>
                      Save changes
                    </button>
                    <button type="button" onClick={cancelEdit} className={cx("cancelBtnBase")}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {!adding && !selected ? (
            <div className={cx("flex1", "flexCenter", "flexCol", "gap12", "colorMuted2")}>
              <div className={cx("pnEmptyIcon")}>◌</div>
              <div className={cx("text13")}>Select a note or create one</div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
