"use client";
import { useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("maphari:theme") as Theme) ?? "system";
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("maphari:theme", t);
    applyTheme(t);
  }, []);

  return { theme, setTheme };
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = t === "dark" || (t === "system" && prefersDark);
  const resolved = isDark ? "dark" : "light";
  root.setAttribute("data-theme", resolved);
  document.cookie = `maphari:theme-r=${resolved};path=/;max-age=31536000;SameSite=Lax`;
}
