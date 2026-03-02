"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// ─── Tour steps ──────────────────────────────────────────────────────────────

const TOUR_STEPS = [
  {
    title: "Welcome to your portal",
    description:
      "This is your command center for tracking projects, invoices, and communications.",
  },
  {
    title: "Dashboard",
    description:
      "Get a high-level view of your engagement health, deadlines, and outstanding actions.",
  },
  {
    title: "Projects & Approvals",
    description:
      "Track active projects, review milestones, and approve deliverables.",
  },
  {
    title: "Messages & Files",
    description:
      "Communicate with your team and access all project files in one place.",
  },
  {
    title: "Billing & Contracts",
    description:
      "View invoices, track payments, and manage contract documents.",
  },
  {
    title: "You're all set!",
    description:
      "Explore your portal. Use \u2318K to search anything, and G+letter shortcuts for quick navigation.",
  },
] as const;

const STORAGE_KEY = "maphari_client_tour_completed";

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useClientTour() {
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const totalSteps = TOUR_STEPS.length;

  // ── Check localStorage on mount ──────────────────────────────────────────

  useEffect(() => {
    try {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (completed !== "true") {
        setTourActive(true);
      }
    } catch {
      // localStorage unavailable — don't show tour
    }
  }, []);

  // ── Current step data ────────────────────────────────────────────────────

  const currentStepData = useMemo(
    () => ({
      title: TOUR_STEPS[tourStep]?.title ?? "",
      description: TOUR_STEPS[tourStep]?.description ?? "",
    }),
    [tourStep],
  );

  // ── Navigation ───────────────────────────────────────────────────────────

  const nextStep = useCallback(() => {
    setTourStep((prev) => {
      if (prev < totalSteps - 1) return prev + 1;
      return prev;
    });
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setTourStep((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  // ── Complete / Skip ──────────────────────────────────────────────────────

  const completeTour = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
    setTourActive(false);
    setTourStep(0);
  }, []);

  const skipTour = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
    setTourActive(false);
    setTourStep(0);
  }, []);

  return {
    tourActive,
    tourStep,
    totalSteps,
    currentStepData,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  };
}
