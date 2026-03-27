"use client";
import { useState } from "react";
import { Ic } from "../../ui";
import styles from "@/app/style/client/call-ui.module.css";

interface NotesPanelProps {
  open: boolean;
  onClose: () => void;
  onSave: (notes: string) => Promise<void>;
}

export function NotesPanel({ open, onClose, onSave }: NotesPanelProps) {
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  async function handleSave() {
    if (!noteText.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(noteText);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`${styles.callPanel} ${open ? styles.callPanelOpen : ""}`}>
      <div className={styles.callPanelHeader}>
        <span className={styles.callPanelTitle}>Notes</span>
        <button type="button" className={styles.callPanelClose} onClick={onClose}>
          <Ic n="x" sz={14} c="currentColor" />
        </button>
      </div>

      <div className={styles.callPanelBody}>
        <textarea
          className={styles.notesTextarea}
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Write your meeting notes here..."
        />
      </div>

      <div className={styles.callPanelInput} style={{ flexDirection: "column", gap: 0 }}>
        <div className={styles.notesFooter}>
          <span className={styles.notesCharCount}>{noteText.length} characters</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {savedFeedback && (
              <span className={styles.notesSavedFeedback}>Saved ✓</span>
            )}
            <button
              type="button"
              className={styles.notesSaveBtn}
              onClick={() => void handleSave()}
              disabled={saving || !noteText.trim()}
            >
              {saving ? "Saving..." : "Save to thread"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
