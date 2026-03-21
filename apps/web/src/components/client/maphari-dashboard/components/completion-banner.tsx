// ════════════════════════════════════════════════════════════════════════════
// completion-banner.tsx — Slim banner for COMPLETE / ARCHIVED projects
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { PageId } from "../config";
import type { AuthSession } from "@/lib/auth/session";
import { getPortalPreferenceWithRefresh, setPortalPreferenceWithRefresh } from "@/lib/api/portal/settings";
import { saveSession } from "@/lib/auth/session";

type CompletionBannerProps = {
  projectId: string;
  session: AuthSession | null;
  navigateTo: (page: PageId) => void;
};

export function CompletionBanner({ projectId, session, navigateTo }: CompletionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady]         = useState(false);

  useEffect(() => {
    if (!session) return;
    void getPortalPreferenceWithRefresh(session, "completion_banner_dismissed").then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      try {
        const ids: string[] = r.data?.value ? JSON.parse(r.data.value) as string[] : [];
        setDismissed(ids.includes(projectId));
      } catch {
        setDismissed(false);
      }
      setReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, projectId]);

  if (!ready || dismissed) return null;

  function handleDismiss() {
    if (!session) return;
    setDismissed(true);
    // Read current list, append this projectId, save
    void getPortalPreferenceWithRefresh(session, "completion_banner_dismissed").then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      let ids: string[] = [];
      try { ids = r.data?.value ? JSON.parse(r.data.value) as string[] : []; } catch { ids = []; }
      if (!ids.includes(projectId)) ids.push(projectId);
      void setPortalPreferenceWithRefresh(session, {
        key: "completion_banner_dismissed",
        value: JSON.stringify(ids),
      }).then((s) => { if (s.nextSession) saveSession(s.nextSession); });
    });
  }

  return (
    <div className={cx("completionBanner")}>
      <div className={cx("completionBannerIcon")}>
        <Ic n="check" sz={15} c="var(--green)" />
      </div>
      <div className={cx("completionBannerBody")}>
        <span className={cx("fw600", "text13")}>This project is complete.</span>{" "}
        <span className={cx("text12", "colorMuted")}>Ready for your next engagement?</span>
      </div>
      <button
        type="button"
        className={cx("btnSm", "btnAccent")}
        onClick={() => navigateTo("serviceCatalog")}
      >
        Explore Services <Ic n="arrowRight" sz={11} c="var(--bg)" />
      </button>
      <button
        type="button"
        className={cx("onboardingBannerDismiss")}
        onClick={handleDismiss}
        aria-label="Dismiss banner"
      >
        <Ic n="x" sz={13} c="currentColor" />
      </button>
    </div>
  );
}
