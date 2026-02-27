"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "maphari-client-theme";

function getSystemPreference(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function subscribeToSystemTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

/**
 * Theme management hook for the client dashboard.
 *
 * Returns the user's theme preference, the resolved (actual) theme,
 * and controls to change/toggle the theme.
 *
 * Persists to localStorage. When preference is "system", follows
 * the OS preference and reacts to changes in real time.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(getStoredPreference);

  /* Subscribe to OS-level dark mode changes */
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemPreference,
    () => "dark" as ResolvedTheme // SSR default
  );

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* quota exceeded — non-critical */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  /* Sync if localStorage changes in another tab */
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) {
        const v = e.newValue as ThemePreference;
        if (v === "light" || v === "dark" || v === "system") {
          setThemeState(v);
        }
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return { theme, resolvedTheme, setTheme, toggleTheme } as const;
}
