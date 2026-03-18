"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PageId } from "../config";

// ─── Chord map: G + <letter> → PageId ────────────────────────────────────────

const CHORD_MAP: Record<string, PageId> = {
  h: "home",
  n: "notifications",
  p: "myProjects",
  m: "messages",
  b: "payments",
  s: "settings",
  f: "filesAssets",
  r: "projectReports",
  k: "knowledgeBase",
  i: "invoices",
  c: "changeRequests",
  a: "milestones",
  d: "designReview",
  t: "teamAccess",
};

const CHORD_TIMEOUT_MS = 500;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useKeyboardShortcuts({
  onNavigate,
  onOpenSearch,
  isSearchOpen,
}: {
  onNavigate: (page: PageId) => void;
  onOpenSearch: () => void;
  isSearchOpen: boolean;
}) {
  const [shortcutsVisible, setShortcutsVisible] = useState(false);
  const gPressedRef = useRef(false);
  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleShortcuts = useCallback(() => {
    setShortcutsVisible((prev) => !prev);
  }, []);

  useEffect(() => {
    function isInputFocused(): boolean {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      if (document.activeElement?.getAttribute("contenteditable") === "true") return true;
      return false;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (isInputFocused()) return;
      if (e.altKey) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      if (e.metaKey || e.ctrlKey) return;

      if (e.key === "Escape") {
        if (shortcutsVisible) setShortcutsVisible(false);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsVisible((prev) => !prev);
        return;
      }

      if (isSearchOpen) return;

      const key = e.key.toLowerCase();

      if (key === "g" && !gPressedRef.current) {
        gPressedRef.current = true;
        if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
        chordTimerRef.current = setTimeout(() => {
          gPressedRef.current = false;
          chordTimerRef.current = null;
        }, CHORD_TIMEOUT_MS);
        return;
      }

      if (gPressedRef.current) {
        gPressedRef.current = false;
        if (chordTimerRef.current) {
          clearTimeout(chordTimerRef.current);
          chordTimerRef.current = null;
        }
        const target = CHORD_MAP[key];
        if (target) {
          e.preventDefault();
          onNavigate(target);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
    };
  }, [onNavigate, onOpenSearch, isSearchOpen, shortcutsVisible]);

  return { shortcutsVisible, toggleShortcuts };
}
