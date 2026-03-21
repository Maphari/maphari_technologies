// ════════════════════════════════════════════════════════════════════════════
// onboarding-banner.tsx — Slim setup banner for SETUP/ONBOARDING projects
// Fetches onboarding records internally. Non-dismissible below 50%.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { PageId } from "../config";
import type { AuthSession } from "@/lib/auth/session";
import { loadPortalOnboardingWithRefresh } from "@/lib/api/portal/client-cx";
import { getPortalPreferenceWithRefresh, setPortalPreferenceWithRefresh } from "@/lib/api/portal/settings";
import { saveSession } from "@/lib/auth/session";

type OnboardingBannerProps = {
  session: AuthSession | null;
  navigateTo: (page: PageId) => void;
};

export function OnboardingBanner({ session, navigateTo }: OnboardingBannerProps) {
  const [completionPct, setCompletionPct] = useState(0);
  const [totalSteps, setTotalSteps]       = useState(0);
  const [doneSteps, setDoneSteps]         = useState(0);
  const [dismissed, setDismissed]         = useState(false);
  const [ready, setReady]                 = useState(false);

  useEffect(() => {
    if (!session) return;

    const clientId = session.user.clientId ?? "";
    if (!clientId) return;

    // Load onboarding records and dismiss preference in parallel
    Promise.all([
      loadPortalOnboardingWithRefresh(session, clientId),
      getPortalPreferenceWithRefresh(session, "onboarding_banner_dismissed"),
    ]).then(([onbRes, prefRes]) => {
      if (onbRes.nextSession) saveSession(onbRes.nextSession);
      if (prefRes.nextSession) saveSession(prefRes.nextSession);

      const records = onbRes.data ?? [];
      const total   = records.length;
      const done    = records.filter((r) => r.status === "COMPLETED").length;
      const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

      setTotalSteps(total);
      setDoneSteps(done);
      setCompletionPct(pct);

      // Respect dismiss only if completion is ≥50%
      const isDismissed = prefRes.data?.value === "true" && pct >= 50;
      setDismissed(isDismissed);
      setReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  if (!ready || dismissed) return null;

  function handleDismiss() {
    if (!session || completionPct < 50) return;
    setDismissed(true);
    void setPortalPreferenceWithRefresh(session, {
      key: "onboarding_banner_dismissed",
      value: "true",
    }).then((r) => { if (r.nextSession) saveSession(r.nextSession); });
  }

  return (
    <div className={cx("onboardingBanner")}>
      <div className={cx("onboardingBannerDot")} />
      <div className={cx("onboardingBannerBody")}>
        <div className={cx("flex", "gap6", "flexCenter")}>
          <span className={cx("fw600", "text13")}>Your project setup is underway</span>
          {totalSteps > 0 && (
            <span className={cx("text11", "colorMuted")}>
              — {doneSteps} of {totalSteps} steps complete
            </span>
          )}
        </div>
        {totalSteps > 0 && (
          <div className={cx("onboardingBannerTrack")}>
            <div
              className={cx("onboardingBannerFill")}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        )}
      </div>
      <button
        type="button"
        className={cx("btnSm", "btnAccent")}
        onClick={() => navigateTo("onboarding")}
      >
        Continue Setup <Ic n="arrowRight" sz={11} c="var(--bg)" />
      </button>
      {completionPct >= 50 && (
        <button
          type="button"
          className={cx("onboardingBannerDismiss")}
          onClick={handleDismiss}
          aria-label="Dismiss banner"
        >
          <Ic n="x" sz={13} c="currentColor" />
        </button>
      )}
    </div>
  );
}
