"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";

type ClientTourStep = {
  title: string;
  detail: string;
  mustComplete?: boolean;
  targetId?: string;
};

type TourLayout = {
  spotlight: { top: number; left: number; width: number; height: number } | null;
  tooltip: { top?: number; left?: number; right?: number; bottom?: number; transform?: string };
};

type Params = {
  session: AuthSession | null;
};

export function useClientTour({ session }: Params) {
  const [clientTourOpen, setClientTourOpen] = useState(false);
  const [clientTourStep, setClientTourStep] = useState(0);
  const [clientTourLayout, setClientTourLayout] = useState<TourLayout>({
    spotlight: null,
    tooltip: { top: 0, left: 0 }
  });

  useEffect(() => {
    if (!session?.user?.email) return;
    const tourKey = `maphari:tour:client:${session.user.email}`;
    if (!window.localStorage.getItem(tourKey)) {
      queueMicrotask(() => setClientTourOpen(true));
    }
  }, [session?.user?.email]);

  const clientTourSteps = useMemo<ClientTourStep[]>(
    () => [
      {
        title: "Welcome to Maphari",
        detail:
          "This is your client portal — your central hub for managing every project with us. Let's take 60 seconds to show you around.",
        mustComplete: true
      },
      {
        targetId: "nav-dashboard",
        title: "Your Dashboard",
        detail:
          "Start here every time. See all active projects, upcoming milestones, recent messages, and outstanding invoices at a glance."
      },
      {
        targetId: "nav-projects",
        title: "My Projects",
        detail: "View detailed progress on every project, including milestones, team members, deadlines, and budgets."
      },
      {
        targetId: "nav-request",
        title: "New Project Request",
        detail:
          "Click here to start a new project. Our system will guide you through selecting a service, describing your needs, and getting an instant price estimate."
      },
      {
        targetId: "nav-invoices",
        title: "Invoices & Payments",
        detail: "View all invoices, pay outstanding balances via Paystack, and download receipts. Your 3-part payment schedule lives here."
      },
      {
        targetId: "nav-docs",
        title: "Documents Library",
        detail:
          "All contracts, signed agreements, quotes, and handover documents are stored here. You can also download template documents like our NDA. That's the tour — let's get started!"
      }
    ],
    []
  );

  const activeTourStep = clientTourSteps[clientTourStep] ?? clientTourSteps[0];

  useEffect(() => {
    if (!clientTourOpen) return;
    const updateTourLayout = () => {
      if (!activeTourStep?.targetId) {
        setClientTourLayout({
          spotlight: null,
          tooltip: { top: window.innerHeight / 2, left: window.innerWidth / 2, transform: "translate(-50%, -50%)" }
        });
        return;
      }

      const target = document.getElementById(activeTourStep.targetId);
      if (!target) {
        setClientTourLayout({
          spotlight: null,
          tooltip: { top: 120, left: 260, transform: "none" }
        });
        return;
      }

      const rect = target.getBoundingClientRect();
      const pad = 6;
      setClientTourLayout({
        spotlight: {
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2
        },
        tooltip: {
          top: Math.max(14, rect.top - pad),
          left: Math.min(window.innerWidth - 328, rect.right + pad + 20),
          transform: "none"
        }
      });
    };

    updateTourLayout();
    window.addEventListener("resize", updateTourLayout);
    window.addEventListener("scroll", updateTourLayout, true);
    return () => {
      window.removeEventListener("resize", updateTourLayout);
      window.removeEventListener("scroll", updateTourLayout, true);
    };
  }, [activeTourStep, clientTourOpen]);

  return {
    clientTourOpen,
    clientTourStep,
    clientTourLayout,
    clientTourSteps,
    activeTourStep,
    setClientTourOpen,
    setClientTourStep
  };
}
