/**
 * Generic tab selector for dashboard pages.
 *
 * Standardized to the same single-row select pattern used in
 * Business Development filters.
 */
import type { ReactNode } from "react";

export function DashboardTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  primaryColor,
  mutedColor,
  panelColor,
  borderColor,
  rightSlot
}: {
  /** Ordered list of tab identifiers */
  tabs: readonly T[];
  /** Currently selected tab */
  activeTab: T;
  /** Callback when a tab is clicked */
  onTabChange: (tab: T) => void;
  /** Accent color for the active tab */
  primaryColor: string;
  /** Color for inactive tab labels */
  mutedColor: string;
  /** Background color for the tab bar container */
  panelColor: string;
  /** Border color for the tab bar container */
  borderColor: string;
  /** Optional slot rendered to the right of the tabs */
  rightSlot?: ReactNode;
}) {
  // Kept for API compatibility with existing page calls.
  void primaryColor;
  void mutedColor;
  void panelColor;
  void borderColor;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
        padding: 8,
        margin: "0 0 12px",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "transparent",
        flexWrap: "nowrap",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      <select
        title="Select tab"
        value={activeTab}
        onChange={(event) => onTabChange(event.target.value as T)}
        style={{
          WebkitAppearance: "none",
          appearance: "none",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)",
          background:
            "var(--surface) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(240,237,232,0.45)' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") no-repeat right 12px center",
          color: "var(--text)",
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "9px 32px 9px 14px",
          minWidth: 140,
          cursor: "pointer",
          flex: "0 0 auto",
        }}
      >
        {tabs.map((tab) => (
          <option key={tab} value={tab}>
            {tab}
          </option>
        ))}
      </select>
      {rightSlot ? <div style={{ flex: "0 0 auto" }}>{rightSlot}</div> : null}
    </div>
  );
}
