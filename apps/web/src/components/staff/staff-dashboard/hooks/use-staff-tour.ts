"use client";

import { useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import type { TourStep } from "../../../shared/dashboard-tour";
import type { PageId } from "../config";

export const STAFF_TOUR_STEPS: TourStep[] = [
  {
    eye: "Step 1 of 5 · Welcome",
    title: "You're the delivery engine",
    description:
      "This tour covers your 4 key areas: priorities, tasks, client threads, and time tracking. Each step navigates you there.",
    note: "This tour auto-navigates — just click Next and follow along."
  },
  {
    eye: "Step 2 of 5 · Dashboard",
    title: "Today's priorities at a glance",
    description:
      "Your dashboard shows open tasks, SLA health, and overdue deliverables. The red/amber indicators are your signal to act. Check it every morning."
  },
  {
    eye: "Step 3 of 5 · Tasks & Kanban",
    title: "Move work through your board",
    description:
      "Use Kanban to manage in-flight work by status. Blocked? Escalate directly from the card. ⌘K finds any task in seconds."
  },
  {
    eye: "Step 4 of 5 · Client Threads",
    title: "Own your client communication",
    description:
      "Each client thread holds all messages and files for that engagement. Keep conversations here — not email — so your whole team has context."
  },
  {
    eye: "Step 5 of 5 · Ready",
    title: "Log time as you work",
    description:
      "Time entries feed client billing and your performance metrics. First task: check your open items, then log your first time entry for today."
  }
];

const PAGE_FOR_STEP: PageId[] = [
  "dashboard",  // step 0 — Welcome
  "dashboard",  // step 1 — Priorities
  "kanban",     // step 2 — Kanban
  "comms",      // step 3 — Client threads
  "timelog"     // step 4 — Time logging
];

export type UseStaffTourReturn = {
  staffTourOpen: boolean;
  staffTourStep: number;
  handleStaffTourNext: () => void;
  handleStaffTourBack: () => void;
  completeStaffTour: () => void;
  resetStaffTour: () => void;
};

type Params = {
  session: AuthSession | null;
  onNavigate: (page: PageId) => void;
};

export function useStaffTour({ session, onNavigate }: Params): UseStaffTourReturn {
  const [staffTourOpen, setStaffTourOpen] = useState(false);
  const [staffTourStep, setStaffTourStep] = useState(0);

  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `maphari:tour:staff:${session.user.email}`;
    if (!window.localStorage.getItem(key)) {
      queueMicrotask(() => setStaffTourOpen(true));
    }
  }, [session?.user?.email]);

  function completeStaffTour(): void {
    if (session?.user?.email) {
      window.localStorage.setItem(`maphari:tour:staff:${session.user.email}`, "done");
    }
    setStaffTourOpen(false);
    setStaffTourStep(0);
  }

  function resetStaffTour(): void {
    if (session?.user?.email) {
      window.localStorage.removeItem(`maphari:tour:staff:${session.user.email}`);
    }
    setStaffTourStep(0);
    setStaffTourOpen(true);
    onNavigate(PAGE_FOR_STEP[0] ?? "dashboard");
  }

  function handleStaffTourNext(): void {
    const nextStep = staffTourStep + 1;
    if (nextStep < STAFF_TOUR_STEPS.length) {
      setStaffTourStep(nextStep);
      const target = PAGE_FOR_STEP[nextStep];
      if (target) onNavigate(target);
    } else {
      completeStaffTour();
    }
  }

  function handleStaffTourBack(): void {
    const prevStep = Math.max(0, staffTourStep - 1);
    setStaffTourStep(prevStep);
    const target = PAGE_FOR_STEP[prevStep];
    if (target) onNavigate(target);
  }

  return {
    staffTourOpen,
    staffTourStep,
    handleStaffTourNext,
    handleStaffTourBack,
    completeStaffTour,
    resetStaffTour
  };
}
