"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

type Theme = "light" | "dark";
const STORAGE_KEY = "maphari_client_theme";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // SSR-safe: default to dark, will be corrected on mount
    if (typeof window === "undefined") return "dark";
    return getStoredTheme() ?? getSystemTheme();
  });

  // ── Apply on mount and sync with actual preference ───────────────────────

  useEffect(() => {
    const resolved = getStoredTheme() ?? getSystemTheme();
    setThemeState(resolved);
    applyTheme(resolved);
  }, []);

  // ── Apply whenever theme changes ─────────────────────────────────────────

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // ── Listen for storage events (cross-tab sync) ──────────────────────────

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      const newValue = e.newValue;
      if (newValue === "light" || newValue === "dark") {
        setThemeState(newValue);
        applyTheme(newValue);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ── Listen for system preference changes ─────────────────────────────────

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    function handleChange() {
      // Only follow system preference if no explicit user choice
      if (getStoredTheme() !== null) return;
      const sys = mql.matches ? "dark" : "light";
      setThemeState(sys);
      applyTheme(sys);
    }

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  // ── Toggle ───────────────────────────────────────────────────────────────

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      persistTheme(next);
      applyTheme(next);
      return next;
    });
  }, []);

  // ── Set ──────────────────────────────────────────────────────────────────

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    persistTheme(next);
    applyTheme(next);
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme,
  };
}
