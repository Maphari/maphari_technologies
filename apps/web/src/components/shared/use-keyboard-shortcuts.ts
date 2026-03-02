"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const CHORD_TIMEOUT_MS = 500;

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Shared keyboard shortcuts hook usable by all dashboards.
 * Each dashboard provides its own chord map (G + key → page navigation).
 *
 * @example
 * const shortcuts = useKeyboardShortcuts({
 *   chordMap: { d: "dashboard", t: "tasks", k: "kanban", s: "settings" },
 *   onNavigate: setActivePage,
 *   onOpenSearch: commandSearch.open,
 *   isSearchOpen: commandSearch.isOpen,
 * });
 */
export function useKeyboardShortcuts<TPageId extends string>({
  chordMap,
  onNavigate,
  onOpenSearch,
  isSearchOpen,
}: {
  chordMap: Record<string, TPageId>;
  onNavigate: (page: TPageId) => void;
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

      // Cmd/Ctrl+K → open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      if (e.metaKey || e.ctrlKey) return;

      // Escape → close shortcuts panel
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

      if (isSearchOpen) return;

      const key = e.key.toLowerCase();

      // "G" starts a chord
      if (key === "g" && !gPressedRef.current) {
        gPressedRef.current = true;

        if (chordTimerRef.current) {
          clearTimeout(chordTimerRef.current);
        }

        chordTimerRef.current = setTimeout(() => {
          gPressedRef.current = false;
          chordTimerRef.current = null;
        }, CHORD_TIMEOUT_MS);

        return;
      }

      // If G was pressed, check for chord match
      if (gPressedRef.current) {
        gPressedRef.current = false;

        if (chordTimerRef.current) {
          clearTimeout(chordTimerRef.current);
          chordTimerRef.current = null;
        }

        const target = chordMap[key];
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
  }, [chordMap, onNavigate, onOpenSearch, isSearchOpen, shortcutsVisible]);

  return {
    shortcutsVisible,
    toggleShortcuts,
  };
}
