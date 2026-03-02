"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
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
  { id: 1, name: "Volta Studios", avatar: "VS" },
  { id: 2, name: "Kestrel Capital", avatar: "KC" },
  { id: 3, name: "Mira Health", avatar: "MH" },
  { id: 4, name: "Dune Collective", avatar: "DC" },
  { id: 5, name: "Okafor & Sons", avatar: "OS" },
  { id: 0, name: "Internal", avatar: "IN" }
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
  preferences: "var(--blue)",
  contact: "var(--purple)",
  strategy: "var(--amber)",
  sensitive: "var(--red)",
  finance: "var(--accent)",
  process: "var(--amber)",
  timeline: "var(--muted)",
  personal: "var(--blue)",
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

  const allTags = useMemo(() => [...new Set(notes.flatMap((note) => note.tags))] as NoteTag[], [notes]);

  const filtered = useMemo(() => {
    return notes
      .filter((note) => clientFilter === "all" || note.clientId === Number(clientFilter))
      .filter((note) => tagFilter === "all" || note.tags.includes(tagFilter))
      .filter((note) => {
        if (!search.trim()) return true;
        const query = search.toLowerCase();
        return note.title.toLowerCase().includes(query) || note.body.toLowerCase().includes(query);
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
    setNotes((previous) => previous.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note)));
    setSelected((previous) => (previous && previous.id === id ? { ...previous, pinned: !previous.pinned } : previous));
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

  const selectedClient = selected ? clients.find((client) => client.id === selected.clientId) : null;

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
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes..."
              className={cx("inputBase", "wFull", "text11", "mb10", "pnSearchInput")}
            />

            <div className={cx("filterRow")}>
              <select
                className={cx("filterSelect")}
                aria-label="Filter notes by client"
                value={clientFilter}
                onChange={(event) => setClientFilter(event.target.value)}
              >
                <option value="all">All clients</option>
                {clients
                  .filter((client) => notes.some((note) => note.clientId === client.id))
                  .map((client) => (
                    <option key={client.id} value={String(client.id)}>
                      {client.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className={cx("flex1", "overflowAuto", "pnListPane")}>
            <button
              type="button"
              onClick={() => {
                setAdding(true);
                setEditing(false);
                setSelected(null);
              }}
              className={cx("pnNewNoteBtn", "pnNewNoteBtnSm")}
            >
              + New note
            </button>

            {filtered.length === 0 ? <div className={cx("text11", "colorMuted2", "textCenter", "pnEmptyList")}>No notes found.</div> : null}

            {filtered.map((note) => {
              const client = clients.find((entry) => entry.id === note.clientId);
              const isSelected = selected?.id === note.id;

              return (
                <div
                  key={note.id}
                  className={cx("pnNoteCard", "pnNoteCardShell", isSelected && "pnNoteCardSelected")}
                  onClick={() => {
                    setSelected(note);
                    setEditing(false);
                    setAdding(false);
                  }}
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
                      onClick={(event) => {
                        event.stopPropagation();
                        togglePin(note.id);
                      }}
                    >
                      {note.pinned ? "◈" : "◇"}
                    </button>
                  </div>

                  <div className={cx("text10", "colorMuted2", "mb4", "pnBodyClamp")}>{note.body}</div>

                  <div className={cx("flexRow", "gap4", "flexWrap")}>
                    {note.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className={cx("pnTagChip", "pnTagChipSm")} data-tag={tag}>
                        {tag}
                      </span>
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
                onChange={(event) => setTagFilter(event.target.value as "all" | NoteTag)}
              >
                <option value="all">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
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
                  onChange={(event) => setNewNote((previous) => ({ ...previous, clientId: event.target.value }))}
                  className={cx("selectBase", "text12", "pnClientSelect")}
                  title="Client"
                >
                  {clients.map((client) => (
                    <option key={client.id} value={String(client.id)}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={cx("labelUpper")}>Title</label>
                <input
                  value={newNote.title}
                  onChange={(event) => setNewNote((previous) => ({ ...previous, title: event.target.value }))}
                  placeholder="Note title..."
                  className={cx("inputBase", "wFull", "text13", "pnTitleInput")}
                />
              </div>

              <div>
                <label className={cx("labelUpper")}>Note</label>
                <textarea
                  value={newNote.body}
                  onChange={(event) => setNewNote((previous) => ({ ...previous, body: event.target.value }))}
                  placeholder="Write your private note here..."
                  className={cx("inputBase", "wFull", "text13", "pnComposeBody")}
                />
              </div>

              <div>
                <label className={cx("labelUpper")}>Tags (comma separated)</label>
                <input
                  value={newNote.tags}
                  onChange={(event) => setNewNote((previous) => ({ ...previous, tags: event.target.value }))}
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
                      <span key={tag} className={cx("pnTagChip", "pnTagChipMd")} data-tag={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className={cx("text14", "colorMuted", "pnDetailBody")}>{selected.body}</div>
                </>
              ) : (
                <div className={cx("flexCol", "gap20", "pnEditPane")}>
                  <div className={cx("pnSidebarTitle")}>Editing note</div>

                  <input
                    value={draft?.title ?? ""}
                    onChange={(event) => setDraft((previous) => (previous ? { ...previous, title: event.target.value } : previous))}
                    placeholder="Note title"
                    className={cx("inputBase", "wFull", "fontDisplay", "fw700", "colorText", "pnEditTitleInput")}
                  />

                  <textarea
                    value={draft?.body ?? ""}
                    onChange={(event) => setDraft((previous) => (previous ? { ...previous, body: event.target.value } : previous))}
                    placeholder="Note body"
                    className={cx("inputBase", "wFull", "text14", "colorMuted", "pnEditBodyInput")}
                  />

                  <div>
                    <label className={cx("labelUpper")}>Tags</label>
                    <input
                      placeholder="e.g. preferences, contact"
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
