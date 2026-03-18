"use client";

import { useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import type { TourStep } from "../../../shared/dashboard-tour";
import type { PageId } from "../config";

export const ADMIN_TOUR_STEPS: TourStep[] = [
  {
    eye: "Step 1 of 6 · Welcome",
    title: "You're the operational hub",
    description:
      "This tour walks you through the 5 areas you'll use daily: pipeline, clients, billing, team, and delivery. Each step takes you to the relevant section.",
    note: "This tour auto-navigates — just click Next and follow along."
  },
  {
    eye: "Step 2 of 6 · Overview",
    title: "Business Dev & Executive views",
    description:
      "Your BizDev dashboard tracks revenue pipeline and lead conversion. The Executive view shows margin, cashflow, and project profitability. Start here every morning to orient your day."
  },
  {
    eye: "Step 3 of 6 · Clients & Projects",
    title: "Approve requests, manage delivery",
    description:
      "New project requests from clients appear in the Request Inbox. Approve them here, assign a staff lead, and they move into the project pipeline. Use the Clients section to monitor each engagement's health score."
  },
  {
    eye: "Step 4 of 6 · Billing",
    title: "Invoices and cashflow at a glance",
    description:
      "Issue invoices, mark payments, and track overdue accounts from a single view. Overdue items surface automatically — act before they age past 30 days."
  },
  {
    eye: "Step 5 of 6 · Staff & Operations",
    title: "Manage your team",
    description:
      "Approve staff access requests, review onboarding progress, and monitor workload distribution. The Performance section shows who's at capacity and who can take more."
  },
  {
    eye: "Step 6 of 6 · Ready",
    title: "You're set — here's your first task",
    description:
      "Check the Request Inbox for pending client submissions, then review the BizDev pipeline. Use ⌘K to search anything instantly."
  }
];

const PAGE_FOR_STEP: PageId[] = [
  "dashboard",   // step 0 — Welcome, stay on current
  "executive",   // step 1 — Executive / BizDev
  "clients",     // step 2 — Clients & Projects
  "invoices",    // step 3 — Billing
  "staff",       // step 4 — Staff management
  "dashboard"    // step 5 — Finish, return to dashboard
];

export type UseAdminTourReturn = {
  adminTourOpen: boolean;
  setAdminTourOpen: React.Dispatch<React.SetStateAction<boolean>>;
  adminTourStep: number;
  setAdminTourStep: React.Dispatch<React.SetStateAction<number>>;
  completeAdminTour: () => void;
  handleAdminTourNext: () => void;
  handleAdminTourBack: () => void;
  resetAdminTour: () => void;
};

type Params = {
  session: AuthSession | null;
  onNavigate: (page: PageId) => void;
};

export function useAdminTour({ session, onNavigate }: Params): UseAdminTourReturn {
  const [adminTourOpen, setAdminTourOpen] = useState(false);
  const [adminTourStep, setAdminTourStep] = useState(0);

  // Init from localStorage: maphari:tour:admin:{email}
  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `maphari:tour:admin:${session.user.email}`;
    if (!window.localStorage.getItem(key)) {
      queueMicrotask(() => setAdminTourOpen(true));
    }
  }, [session?.user?.email]);

  function completeAdminTour(): void {
    if (session?.user?.email) {
      window.localStorage.setItem(`maphari:tour:admin:${session.user.email}`, "done");
    }
    setAdminTourOpen(false);
    setAdminTourStep(0);
  }

  function resetAdminTour(): void {
    if (session?.user?.email) {
      window.localStorage.removeItem(`maphari:tour:admin:${session.user.email}`);
    }
    setAdminTourStep(0);
    setAdminTourOpen(true);
    onNavigate(PAGE_FOR_STEP[0] ?? "dashboard");
  }

  function handleAdminTourNext(): void {
    const nextStep = adminTourStep + 1;
    if (nextStep < ADMIN_TOUR_STEPS.length) {
      setAdminTourStep(nextStep);
      const target = PAGE_FOR_STEP[nextStep];
      if (target) onNavigate(target);
    } else {
      completeAdminTour();
    }
  }

  function handleAdminTourBack(): void {
    const prevStep = Math.max(0, adminTourStep - 1);
    setAdminTourStep(prevStep);
    const target = PAGE_FOR_STEP[prevStep];
    if (target) onNavigate(target);
  }

  return {
    adminTourOpen,
    setAdminTourOpen,
    adminTourStep,
    setAdminTourStep,
    completeAdminTour,
    handleAdminTourNext,
    handleAdminTourBack,
    resetAdminTour
  };
}
