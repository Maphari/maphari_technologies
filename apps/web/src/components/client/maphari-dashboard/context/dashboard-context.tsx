"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PageId } from "../config";
import type { ResolvedTheme } from "../hooks/use-theme";

/**
 * Shared dashboard context to eliminate prop drilling.
 *
 * Provides navigation, theme, and feedback controls to all child pages.
 * Data-heavy fields (projects, invoices, etc.) remain as props to each page
 * to avoid unnecessary re-renders — this context is for lightweight shared state.
 */
type DashboardContextValue = {
  /* Navigation */
  activePage: PageId;
  setActivePage: (page: PageId) => void;

  /* Theme */
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;

  /* Feedback */
  setFeedback: (feedback: { tone: "success" | "error"; message: string }) => void;

  /* Filters */
  projectScopeId: string | null;
  dateRange: "7d" | "30d" | "90d" | "all";
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

type ProviderProps = {
  value: DashboardContextValue;
  children: ReactNode;
};

export function DashboardProvider({ value, children }: ProviderProps) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return ctx;
}
