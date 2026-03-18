"use client";

import { useState, useEffect, useCallback } from "react";
import type { TourStep } from "../../../shared/dashboard-tour";

export const CLIENT_TOUR_STEPS: TourStep[] = [
  {
    eye: "Step 1 of 6 · Welcome",
    title: "Welcome to your Maphari portal",
    description:
      "Everything you need to track progress, approve work, and communicate with your team is here. This tour takes 60 seconds.",
    note: "Your team can see everything you do here — comments, approvals, and file uploads are shared instantly."
  },
  {
    eye: "Step 2 of 6 · Dashboard",
    title: "Your engagement health at a glance",
    description:
      "The dashboard shows project health indicators, upcoming deadlines, and outstanding actions. Green means on track. Amber or red means something needs your attention."
  },
  {
    eye: "Step 3 of 6 · Approvals",
    title: "Sign off deliverables here",
    description:
      "When your team completes work, it appears in Projects for your approval. Don't let approvals sit — delays hold up your timeline and theirs."
  },
  {
    eye: "Step 4 of 6 · Messages & Files",
    title: "One place for all communication",
    description:
      "All messages and project files live in one thread. You'll never search your email for a brief again. Attach files or feedback directly in the thread."
  },
  {
    eye: "Step 5 of 6 · Billing",
    title: "Invoices and contracts, always accessible",
    description:
      "Your invoices, payment history, and signed contracts are here. Download PDFs, track payment status, and view your billing timeline without emailing us."
  },
  {
    eye: "Step 6 of 6 · Ready",
    title: "You're all set",
    description:
      "Use ⌘K to search anything across your portal — projects, files, messages. Your team is ready. Raise questions via the Messages section."
  }
];

const STORAGE_KEY = "maphari_client_tour_completed";

export function useClientTour() {
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const totalSteps = CLIENT_TOUR_STEPS.length;

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "true") {
        setTourActive(true);
      }
    } catch {
      // localStorage unavailable — don't show tour
    }
  }, []);

  const nextStep = useCallback(() => {
    setTourStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setTourStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const completeTour = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setTourActive(false);
    setTourStep(0);
  }, []);

  const skipTour = completeTour;

  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setTourStep(0);
    setTourActive(true);
  }, []);

  return {
    tourActive,
    tourStep,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour
  };
}
