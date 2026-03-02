"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PageId } from "../config";

// ─── Chord map: G + <letter> → PageId ────────────────────────────────────────

const CHORD_MAP: Record<string, PageId> = {
  d: "dashboard",
  p: "projects",
  m: "messages",
  n: "notifications",
  b: "billing",
  s: "settings",
  r: "reports",
  i: "automation",
  v: "services",
  a: "approvals",
  f: "files",
  t: "team",
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
      // Don't capture when typing in inputs
      if (isInputFocused()) return;

      // Don't interfere with modifier keys (except for Cmd+K)
      if (e.altKey) return;

      // Cmd/Ctrl+K → open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      // Don't process other shortcuts if modifiers are held
      if (e.metaKey || e.ctrlKey) return;

      // Escape → close shortcuts panel or close search
      if (e.key === "Escape") {
        if (shortcutsVisible) {
          setShortcutsVisible(false);
        }
        return;
      }

      // ? → toggle shortcuts panel
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsVisible((prev) => !prev);
        return;
      }

      // Don't process navigation shortcuts when search is open
      if (isSearchOpen) return;

      const key = e.key.toLowerCase();

      // "G" starts a chord
      if (key === "g" && !gPressedRef.current) {
        gPressedRef.current = true;

        // Clear any existing timer
        if (chordTimerRef.current) {
          clearTimeout(chordTimerRef.current);
        }

        // Reset after timeout
        chordTimerRef.current = setTimeout(() => {
          gPressedRef.current = false;
          chordTimerRef.current = null;
        }, CHORD_TIMEOUT_MS);

        return;
      }

      // If G was pressed, check for a chord match
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
      if (chordTimerRef.current) {
        clearTimeout(chordTimerRef.current);
      }
    };
  }, [onNavigate, onOpenSearch, isSearchOpen, shortcutsVisible]);

  return {
    shortcutsVisible,
    toggleShortcuts,
  };
}
