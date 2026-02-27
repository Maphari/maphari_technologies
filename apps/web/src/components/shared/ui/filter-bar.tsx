/**
 * Generic filter bar wrapper for dashboard pages.
 *
 * Renders children in a horizontal flex layout with configurable
 * background and border colors for dashboard-specific theming.
 * Generalized from the admin-only AdminFilterBar component.
 */
import type { ReactNode } from "react";

export function DashboardFilterBar({
  children,
  panelColor,
  borderColor
}: {
  /** Filter controls to render inside the bar */
  children: ReactNode;
  /** Background color */
  panelColor: string;
  /** Border color */
  borderColor: string;
}) {
  return (
    <div style={{ background: panelColor, border: `1px solid ${borderColor}`, padding: 12, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        {children}
      </div>
    </div>
  );
}
