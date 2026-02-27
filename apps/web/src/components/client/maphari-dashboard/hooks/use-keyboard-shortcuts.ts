"use client";

import { useEffect, useState, useCallback } from "react";
import type { PageId } from "../config";

type UseKeyboardShortcutsParams = {
  onNavigate: (page: PageId) => void;
  onOpenSearch: () => void;
};

export function useKeyboardShortcuts({
  onNavigate,
  onOpenSearch,
}: UseKeyboardShortcutsParams) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    let gPressed = false;
    let gTimeout: ReturnType<typeof setTimeout> | null = null;

    const handler = (e: KeyboardEvent) => {
      /* Don't trigger when typing in inputs */
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      )
        return;

      /* ? = toggle shortcuts panel */
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      /* Escape = close shortcuts panel */
      if (e.key === "Escape") {
        setShortcutsOpen(false);
        return;
      }

      /* Cmd/Ctrl+K = open search */
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      /* G+letter navigation (G must be pressed first, then letter within 500ms) */
      if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        gPressed = true;
        if (gTimeout) clearTimeout(gTimeout);
        gTimeout = setTimeout(() => {
          gPressed = false;
        }, 500);
        return;
      }

      if (gPressed) {
        gPressed = false;
        if (gTimeout) clearTimeout(gTimeout);
        const navMap: Record<string, PageId> = {
          d: "dashboard",
          p: "projects",
          m: "messages",
          i: "invoices",
          r: "reports",
          s: "settings",
          c: "calendar",
          n: "notifications",
          a: "analytics",
          e: "exports",
        };
        const page = navMap[e.key];
        if (page) {
          e.preventDefault();
          onNavigate(page);
        }
        return;
      }

      /* N = new request */
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        onNavigate("create");
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (gTimeout) clearTimeout(gTimeout);
    };
  }, [onNavigate, onOpenSearch]);

  return { shortcutsOpen, setShortcutsOpen };
}

export const SHORTCUTS = [
  { key: "?", description: "Toggle shortcuts panel" },
  { key: "\u2318 K", description: "Open search" },
  { key: "G \u2192 D", description: "Go to Dashboard" },
  { key: "G \u2192 P", description: "Go to Projects" },
  { key: "G \u2192 M", description: "Go to Messages" },
  { key: "G \u2192 I", description: "Go to Invoices" },
  { key: "G \u2192 R", description: "Go to Reports" },
  { key: "G \u2192 S", description: "Go to Settings" },
  { key: "G \u2192 C", description: "Go to Calendar" },
  { key: "G \u2192 N", description: "Go to Notifications" },
  { key: "G \u2192 A", description: "Go to Analytics" },
  { key: "G \u2192 E", description: "Go to Exports" },
  { key: "N", description: "New Request" },
  { key: "Esc", description: "Close panel / modal" },
];
