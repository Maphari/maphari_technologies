"use client";

/**
 * Reusable toggle-row component for settings pages.
 *
 * Accepts a `styles` prop so each dashboard passes its own CSS module.
 * Expected class names: toggleRow, toggleLabel, toggleDesc, toggle,
 * toggleOn, toggleOff, toggleKnob.
 */
import { useState } from "react";
import { createCx, type CssModuleStyles } from "@/lib/utils/cx";

export function ToggleRow({
  label,
  desc,
  defaultOn = false,
  enabled,
  onToggle,
  styles
}: {
  /** Display label for the toggle */
  label: string;
  /** Description text below the label */
  desc: string;
  /** Initial state when uncontrolled */
  defaultOn?: boolean;
  /** Controlled state — overrides defaultOn when provided */
  enabled?: boolean;
  /** Callback fired when the toggle value changes */
  onToggle?: (next: boolean) => void;
  /** CSS module styles object */
  styles: CssModuleStyles;
}) {
  const cx = createCx(styles);
  const [localEnabled, setLocalEnabled] = useState(defaultOn);
  const isControlled = typeof enabled === "boolean";
  const isEnabled = isControlled ? Boolean(enabled) : localEnabled;
  return (
    <div className={styles.toggleRow}>
      <div>
        <div className={styles.toggleLabel}>{label}</div>
        <div className={styles.toggleDesc}>{desc}</div>
      </div>
      <button
        className={cx("toggle", isEnabled ? "toggleOn" : "toggleOff")}
        type="button"
        onClick={() => {
          const next = !isEnabled;
          if (isControlled) {
            onToggle?.(next);
            return;
          }
          setLocalEnabled(next);
          onToggle?.(next);
        }}
      >
        <span className={styles.toggleKnob} />
      </button>
    </div>
  );
}
