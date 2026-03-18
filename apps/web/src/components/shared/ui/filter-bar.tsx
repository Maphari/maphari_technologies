/**
 * Generic filter bar wrapper for dashboard pages.
 *
 * Renders children in the standardized Business Development filter layout
 * used across admin dashboard pages.
 * Generalized from the admin-only AdminFilterBar component.
 */
import { Children, cloneElement, isValidElement, type CSSProperties, type ReactNode } from "react";

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
  const contentChildren = Children.toArray(children);
  // Kept for API compatibility with existing page calls.
  void panelColor;
  void borderColor;
  const selectStyle = {
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
  } as const;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
        flexWrap: "nowrap",
        padding: 8,
        margin: "0 0 12px",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "transparent",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {contentChildren.map((child, index) => {
        const childKey = typeof child === "object" && child !== null && "key" in child && child.key != null
          ? String(child.key)
          : `filter-item-${index}`;
        const renderedChild =
          isValidElement<{ style?: CSSProperties }>(child) && child.type === "select"
            ? cloneElement(child, {
                style: {
                  ...selectStyle,
                  ...child.props.style,
                },
              })
            : child;
        return (
          <div key={childKey} style={{ flex: "0 0 auto" }}>
            {renderedChild as ReactNode}
          </div>
        );
      })}
    </div>
  );
}
