// Chart-wide defaults for all Recharts components in the admin dashboard.
// Import this in chart-widget-inner.tsx — do not duplicate these values.

export const CHART_DEFAULTS = {
  gradientId: "adminGradient",
  stroke: "#8b6fff",
  strokeWidth: 2,
  dotRadius: 3.5,
  gridStroke: "rgba(255,255,255,0.04)",
  tickStyle: {
    fill: "rgba(240,237,232,0.25)",
    fontSize: 10,
    fontFamily: "var(--font-dm-mono), monospace",
  } as const,
  tooltipStyle: {
    background: "rgba(4,4,10,0.95)",
    border: "1px solid rgba(139,111,255,0.25)",
    borderRadius: "8px",
    fontSize: "0.65rem",
    fontFamily: "var(--font-dm-mono), monospace",
    color: "#f0ede8",
  } as const,
  colors: {
    accent: "#8b6fff",
    green:  "#34d98b",
    amber:  "#f5a623",
    red:    "#ff5f5f",
    blue:   "#60a5fa",
  } as const,
} as const;
