// ════════════════════════════════════════════════════════════════════════════
// private-notes-page.tsx — Staff Private CRM Notes
// Storage  : Backend via /staff/client-notes (STAFF/ADMIN only)
//            Notes are CommunicationLog records with type PRIVATE_NOTE and
//            direction INTERNAL — never visible to CLIENT-role requests.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadClientNotesWithRefresh,
  addClientNoteWithRefresh,
  deleteClientNoteWithRefresh,
  type ClientNote,
  type ClientNoteCategory,
} from "../../../../lib/api/staff/client-notes";
import { getStaffClients, type StaffClient } from "../../../../lib/api/staff/clients";
import { ConfirmDialog } from "@/components/shared/ui/confirm-dialog";

// ── Category meta ─────────────────────────────────────────────────────────────
const CATEGORIES: { value: ClientNoteCategory; label: string }[] = [
  { value: "preference",  label: "Preference"  },
  { value: "risk",        label: "Risk"        },
  { value: "opportunity", label: "Opportunity" },
  { value: "general",     label: "General"     },
];

function catClass(category: ClientNoteCategory): string {
  if (category === "preference")  return "pnCatPreference";
  if (category === "risk")        return "pnCatRisk";
  if (category === "opportunity") return "pnCatOpportunity";
  return "pnCatGeneral";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PrivateNotesPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [clients, setClients]             = useState<StaffClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [notes, setNotes]                 = useState<ClientNote[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<"all" | ClientNoteCategory>("all");
  const [search, setSearch]               = useState("");
  const [loading, setLoading]             = useState(true);
  const [composing, setComposing]         = useState(false);
  const [newNote, setNewNote]             = useState("" );
  const [newCategory, setNewCategory]     = useState<ClientNoteCategory>("general");
  const [saving, setSaving]               = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [noteDeleteTarget, setNoteDeleteTarget] = useState<string | null>(null);

  // Load client list once
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    getStaffClients(session).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data && result.data.length > 0) {
        setClients(result.data);
        setSelectedClientId(result.data[0].id);
      }
    });
  }, [session?.accessToken]);

  // Load notes when client selection changes
  const loadNotes = useCallback(async (clientId: string) => {
    if (!session || !clientId) return;
    setLoading(true);
    const result = await loadClientNotesWithRefresh(session, clientId);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.data) setNotes(result.data);
    setLoading(false);
  }, [session?.accessToken]);

  useEffect(() => {
    if (!selectedClientId) return;
    void loadNotes(selectedClientId);
  }, [selectedClientId, loadNotes]);

  const filtered = useMemo(() => {
    return notes
      .filter((n) => categoryFilter === "all" || n.category === categoryFilter)
      .filter((n) => {
        if (!search.trim()) return true;
        return n.note.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notes, categoryFilter, search]);

  async function handleAdd() {
    if (!session || !selectedClientId || !newNote.trim()) return;
    setSaving(true);
    const result = await addClientNoteWithRefresh(session, selectedClientId, newNote.trim(), newCategory);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.data) {
      setNotes((prev) => [result.data!, ...prev]);
      setNewNote("");
      setNewCategory("general");
      setComposing(false);
    }
    setSaving(false);
  }

  async function handleDelete(noteId: string) {
    if (!session) return;
    setDeletingId(noteId);
    const result = await deleteClientNoteWithRefresh(session, noteId);
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.error) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
    setDeletingId(null);
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId);

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

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-private-notes">
      {/* Private banner */}
      <div className={cx("pnBanner")}>
        <Ic n="lock" sz={13} c="var(--amber, #f59e0b)" />
        <span>Private — these notes are never visible to clients. Staff and Admin only.</span>
      </div>

      {/* Header */}
      <div className={cx("pageHeader", "mb20")}>
        <div>
          <div className={cx("pageEyebrow")}>CRM · Staff</div>
          <h1 className={cx("pageTitle")}>Private CRM Notes</h1>
        </div>
      </div>

      {/* Controls */}
      <div className={cx("flexRow", "gap12", "mb20", "flexWrap")}>
        {/* Client selector */}
        <select
          className={cx("filterSelect")}
          aria-label="Select client"
          value={selectedClientId}
          onChange={(e) => { setSelectedClientId(e.target.value); setSearch(""); setCategoryFilter("all"); }}
          disabled={clients.length === 0}
        >
          {clients.length === 0 ? (
            <option value="">Loading clients…</option>
          ) : (
            clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))
          )}
        </select>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes…"
          className={cx("inputBase", "text11", "pnSearchInput")}
        />

        {/* Compose button */}
        <button
          type="button"
          className={cx("accentBtnBase", "btnSm")}
          onClick={() => setComposing((v) => !v)}
          disabled={!selectedClientId}
        >
          <Ic n="plus" sz={12} c="var(--bg)" />
          Add Note
        </button>
      </div>

      {/* Category filter tabs */}
      <div className={cx("filterRow", "mb20")}>
        {(["all", ...CATEGORIES.map((c) => c.value)] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            className={cx("filterTab", categoryFilter === cat && "filterTabActive")}
            onClick={() => setCategoryFilter(cat as "all" | ClientNoteCategory)}
          >
            {cat === "all" ? "All" : CATEGORIES.find((c) => c.value === cat)?.label ?? cat}
          </button>
        ))}
      </div>

      {/* Composer */}
      {composing && (
        <div className={cx("pnNoteCard", "mb20")}>
          <div className={cx("text11", "colorMuted", "mb10")}>
            Adding note for <strong>{selectedClient?.name ?? "client"}</strong>
          </div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write your private CRM note…"
            className={cx("inputBase", "wFull", "resizeV", "mb12")}
            rows={4}
            autoFocus
          />
          <div className={cx("flexRow", "gap12", "flexWrap")}>
            <select
              className={cx("filterSelect")}
              aria-label="Note category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as ClientNoteCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button
              type="button"
              className={cx("accentBtnBase", "btnSm")}
              disabled={!newNote.trim() || saving}
              onClick={handleAdd}
            >
              {saving ? "Saving…" : "Save Note"}
            </button>
            <button
              type="button"
              className={cx("cancelBtnBase", "btnSm")}
              onClick={() => { setComposing(false); setNewNote(""); setNewCategory("general"); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {filtered.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="file-text" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No notes found</div>
          <div className={cx("emptyStateSub")}>
            {!selectedClientId
              ? "Select a client to view notes."
              : "No private notes yet for this client."}
          </div>
        </div>
      ) : (
        <div className={cx("flexCol", "gap8")}>
          {filtered.map((note) => (
            <div key={note.id} className={cx("pnNoteCard", "staffTableRow")}>
              <div className={cx("flexBetween", "mb8")}>
                <div className={cx("flexRow", "gap8", "alignCenter")}>
                  <span className={cx("pnCategoryChip", catClass(note.category))}>
                    {CATEGORIES.find((c) => c.value === note.category)?.label ?? note.category}
                  </span>
                  {note.authorName && (
                    <span className={cx("text10", "colorMuted2")}>{note.authorName}</span>
                  )}
                </div>
                <div className={cx("flexRow", "gap10", "alignCenter")}>
                  <span className={cx("text10", "colorMuted2")}>{formatDate(note.createdAt)}</span>
                  <button
                    type="button"
                    className={cx("iconBtnBase")}
                    aria-label="Delete note"
                    onClick={() => setNoteDeleteTarget(note.id)}
                    disabled={deletingId === note.id}
                  >
                    <Ic n="trash-2" sz={13} c="var(--red, #ef4444)" />
                  </button>
                </div>
              </div>
              <p className={cx("text13", "colorMuted", "pnNoteText")}>
                {note.note}
              </p>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={noteDeleteTarget !== null}
        title="Delete note?"
        body="This will permanently remove the private note. This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (noteDeleteTarget) void handleDelete(noteDeleteTarget); setNoteDeleteTarget(null); }}
        onCancel={() => setNoteDeleteTarget(null)}
      />
    </section>
  );
}
