"use client";

import { useState, useCallback } from "react";
import ab from "@/app/style/components/automation-banner.module.css";

export type AutomationBannerVariant = "warning" | "error" | "info" | "success";

export interface AutomationBannerProps {
  /** Whether to render the banner at all */
  show: boolean;
  variant?: AutomationBannerVariant;
  /** Optional icon node (SVG, emoji, etc.) rendered in the circle */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Primary action button label */
  actionLabel: string;
  /** Called when primary action button is clicked; may return a Promise */
  onAction: () => Promise<void> | void;
  /** Optional localStorage key — banner stays dismissed across page reloads */
  dismissKey?: string;
  onDismiss?: () => void;
  /** Optional secondary ghost button */
  secondaryLabel?: string;
  onSecondary?: () => void;
}

const VARIANT_BANNER: Record<AutomationBannerVariant, string> = {
  warning: ab.variantWarning,
  error:   ab.variantError,
  info:    ab.variantInfo,
  success: ab.variantSuccess,
};

const VARIANT_ICON: Record<AutomationBannerVariant, string> = {
  warning: ab.iconWarning,
  error:   ab.iconError,
  info:    ab.iconInfo,
  success: ab.iconSuccess,
};

const VARIANT_BTN: Record<AutomationBannerVariant, string> = {
  warning: ab.btnWarning,
  error:   ab.btnError,
  info:    ab.btnInfo,
  success: ab.btnSuccess,
};

export function AutomationBanner({
  show,
  variant = "warning",
  icon,
  title,
  description,
  actionLabel,
  onAction,
  dismissKey,
  onDismiss,
  secondaryLabel,
  onSecondary,
}: AutomationBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (!dismissKey) return false;
    try { return localStorage.getItem(dismissKey) === "1"; } catch { return false; }
  });
  const [running, setRunning] = useState(false);

  const handleAction = useCallback(async () => {
    setRunning(true);
    try { await onAction(); } finally { setRunning(false); }
  }, [onAction]);

  const handleDismiss = useCallback(() => {
    if (dismissKey) {
      try { localStorage.setItem(dismissKey, "1"); } catch { /* ignore */ }
    }
    setDismissed(true);
    onDismiss?.();
  }, [dismissKey, onDismiss]);

  if (!show || dismissed) return null;

  return (
    <div
      className={`${ab.automationBanner} ${VARIANT_BANNER[variant]}`}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div className={`${ab.icon} ${VARIANT_ICON[variant]}`} aria-hidden="true">
          {icon}
        </div>
      )}

      <div className={ab.body}>
        <div className={ab.title}>{title}</div>
        {description && <div className={ab.desc}>{description}</div>}
      </div>

      <div className={ab.actions}>
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            className={`${ab.btn} ${ab.btnGhost}`}
            onClick={onSecondary}
            disabled={running}
          >
            {secondaryLabel}
          </button>
        )}

        <button
          type="button"
          className={`${ab.btn} ${VARIANT_BTN[variant]}`}
          onClick={handleAction}
          disabled={running}
        >
          {running && <span className={ab.spin} aria-hidden="true" />}
          {running ? "Running…" : actionLabel}
        </button>

        <button
          type="button"
          className={`${ab.btn} ${ab.btnGhost}`}
          onClick={handleDismiss}
          disabled={running}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
