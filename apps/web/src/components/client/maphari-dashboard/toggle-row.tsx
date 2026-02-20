import { useState } from "react";
import { cx, styles } from "./style";

export function ToggleRow({
  title,
  desc,
  defaultOn = false,
  enabled,
  onToggle
}: {
  title: string;
  desc: string;
  defaultOn?: boolean;
  enabled?: boolean;
  onToggle?: (next: boolean) => void;
}) {
  const [localEnabled, setLocalEnabled] = useState(defaultOn);
  const isControlled = typeof enabled === "boolean";
  const isEnabled = isControlled ? Boolean(enabled) : localEnabled;
  return (
    <div className={styles.toggleRow}>
      <div>
        <div className={styles.toggleLabel}>{title}</div>
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
