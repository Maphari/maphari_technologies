"use client";

import { useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";

export type UseAdminTourReturn = {
  adminTourOpen: boolean;
  setAdminTourOpen: React.Dispatch<React.SetStateAction<boolean>>;
  adminTourStep: number;
  setAdminTourStep: React.Dispatch<React.SetStateAction<number>>;
  completeAdminTour: () => void;
  handleAdminTourNext: (totalSteps: number) => void;
};

type Params = {
  session: AuthSession | null;
};

export function useAdminTour({ session }: Params): UseAdminTourReturn {
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
  }

  function handleAdminTourNext(totalSteps: number): void {
    if (adminTourStep < totalSteps - 1) {
      setAdminTourStep((value) => value + 1);
      return;
    }
    completeAdminTour();
  }

  return {
    adminTourOpen,
    setAdminTourOpen,
    adminTourStep,
    setAdminTourStep,
    completeAdminTour,
    handleAdminTourNext
  };
}
