"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Theme = "light" | "dark";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStoredTheme(storageKey: string): Theme | null {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Ignore storage errors
  }
  return null;
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "dark";
  }
}

function applyTheme(theme: Theme): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

function persistTheme(storageKey: string, theme: Theme): void {
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // Ignore storage errors
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Shared theme hook usable by all dashboards.
 * Each dashboard passes its own `storageKey` so preferences are isolated.
 *
 * @example
 * const { theme, toggleTheme } = useTheme({ storageKey: "maphari_staff_theme" });
 */
export function useTheme({ storageKey = "maphari_theme" }: { storageKey?: string } = {}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return getStoredTheme(storageKey) ?? getSystemTheme();
  });

  // Apply on mount and sync with actual preference
  useEffect(() => {
    const resolved = getStoredTheme(storageKey) ?? getSystemTheme();
    setThemeState(resolved);
    applyTheme(resolved);
  }, [storageKey]);

  // Apply whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Cross-tab sync via storage events
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== storageKey) return;
      const newValue = e.newValue;
      if (newValue === "light" || newValue === "dark") {
        setThemeState(newValue);
        applyTheme(newValue);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  // System preference fallback
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    function handleChange() {
      if (getStoredTheme(storageKey) !== null) return;
      const sys = mql.matches ? "dark" : "light";
      setThemeState(sys);
      applyTheme(sys);
    }

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [storageKey]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      persistTheme(storageKey, next);
      applyTheme(next);
      return next;
    });
  }, [storageKey]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    persistTheme(storageKey, next);
    applyTheme(next);
  }, [storageKey]);

  return { theme, toggleTheme, setTheme };
}
