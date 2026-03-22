// ════════════════════════════════════════════════════════════════════════════
// search-history.ts — localStorage-backed command palette search history
// ════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "maphari:search-history";
const MAX_HISTORY = 5;

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addToSearchHistory(query: string): void {
  if (typeof window === "undefined") return;
  const trimmed = query.trim();
  if (!trimmed) return;
  const existing = getSearchHistory().filter((q) => q !== trimmed);
  const next = [trimmed, ...existing].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
