/**
 * Generic tab bar component for dashboard pages.
 *
 * Accepts color configuration via props for dashboard-specific theming.
 * Generalized from the admin-only AdminTabs component.
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
  return (
    <div style={{ background: panelColor, border: `1px solid ${borderColor}`, padding: 14, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                background: "none",
                border: "none",
                color: activeTab === tab ? primaryColor : mutedColor,
                padding: "8px 16px",
                cursor: "pointer",
                fontFamily: "Syne, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                borderBottom: activeTab === tab ? `2px solid ${primaryColor}` : "none"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        {rightSlot ?? null}
      </div>
    </div>
  );
}
