// ════════════════════════════════════════════════════════════════════════════
// ftue-welcome-modal.tsx — One-time welcome overlay shown on first login
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";

type FtueWelcomeModalProps = {
  onDismiss: () => void;
};

const TILES = [
  { icon: "users",     label: "Clients",  sub: "Manage accounts & health"   },
  { icon: "briefcase", label: "Projects", sub: "Portfolio & operations"      },
  { icon: "dollar",    label: "Revenue",  sub: "Invoices & cash flow"        },
  { icon: "activity",  label: "Team",     sub: "Staff access & performance" },
] as const;

export function FtueWelcomeModal({ onDismiss }: FtueWelcomeModalProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div className={cx("welcomeModalOverlay")} onClick={onDismiss}>
      <div
        className={cx("welcomeModal")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ftue-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cx("welcomeModalHeader")}>
          <div className={cx("welcomeModalLogo")}>
            <Ic n="sparkle" sz={18} c="var(--accent)" />
          </div>
          <h2 id="ftue-modal-title" className={cx("welcomeModalTitle")}>
            Welcome to your Admin Console
          </h2>
          <p className={cx("welcomeModalSub")}>
            Your full-picture operations hub.
          </p>
        </div>

        <div className={cx("welcomeModalGrid")}>
          {TILES.map((t) => (
            <div key={t.label} className={cx("welcomeModalTile")}>
              <div className={cx("welcomeModalTileIcon")}>
                <Ic n={t.icon} sz={16} c="var(--accent)" />
              </div>
              <div className={cx("fw600", "text13")}>{t.label}</div>
              <div className={cx("text11", "colorMuted")}>{t.sub}</div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={cx("btnAccent", "welcomeModalCta")}
          onClick={onDismiss}
        >
          Got it, let&apos;s go <Ic n="arrowRight" sz={13} c="var(--bg)" />
        </button>
      </div>
    </div>
  );
}
