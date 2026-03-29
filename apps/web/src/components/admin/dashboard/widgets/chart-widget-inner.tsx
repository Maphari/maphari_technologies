"use client";

import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_DEFAULTS } from "./chart-defaults";
import styles from "@/app/style/admin/widgets.module.css";

const { gradientId, gridStroke, tickStyle, tooltipStyle, colors } = CHART_DEFAULTS;

const DEFAULT_COLORS = [
  colors.accent,
  colors.green,
  colors.amber,
  colors.blue,
  colors.red,
];

// Module-level gradient component — must NOT be inside ChartWidgetInner body
// to avoid React unmounting the defs on every parent re-render (gradient flicker).
// Rendered as a direct JSX child of <AreaChart> — Recharts passes unknown children
// into the SVG, so <defs> placed here end up inside the chart's own <svg> element.
function AreaGradientDefs({ keys, colors }: { keys: string[]; colors: string[] }) {
  return (
    <defs>
      {keys.map((k, i) => (
        <linearGradient key={k} id={`${gradientId}_${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors[i]} stopOpacity={0.35} />
          <stop offset="100%" stopColor={colors[i]} stopOpacity={0.02} />
        </linearGradient>
      ))}
    </defs>
  );
}

export interface ChartWidgetInnerProps {
  label: string;
  currentValue?: string;
  data: Record<string, unknown>[];
  dataKey: string | string[];
  type: "area" | "bar" | "line";
  color?: string | string[];
  legend?: { key: string; label: string }[];
  height?: number;
  xKey?: string;
  className?: string;
}

function resolveColors(
  dataKey: string | string[],
  color?: string | string[],
): string[] {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];
  if (!color) return keys.map((_, i) => DEFAULT_COLORS[i % DEFAULT_COLORS.length]!);
  if (Array.isArray(color)) return keys.map((_, i) => color[i] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]!);
  return keys.map(() => color);
}

export function ChartWidgetInner({
  label,
  currentValue,
  data,
  dataKey,
  type,
  color,
  legend,
  height = 120,
  xKey = "label",
  className,
}: ChartWidgetInnerProps) {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];
  const resolvedColors = resolveColors(dataKey, color);

  const wrapClass = [styles.widget, styles.span2, className].filter(Boolean).join(" ");

  return (
    <div className={wrapClass}>
      <div className={styles.chartHeader}>
        <div>
          <div className={styles.widgetLabel}>{label}</div>
          {currentValue ? (
            <div className={styles.chartCurrentValue}>{currentValue}</div>
          ) : null}
        </div>
        {legend ? (
          <div className={styles.chartLegend}>
            {legend.map((item, i) => (
              <div key={item.key} className={styles.chartLegendItem}>
                <div
                  className={styles.chartLegendDot}
                  style={{ background: resolvedColors[i] ?? colors.accent }}
                />
                {item.label}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {type === "area" ? (
          <AreaChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <AreaGradientDefs keys={keys} colors={resolvedColors} />
            <CartesianGrid vertical={false} stroke={gridStroke} />
            <XAxis dataKey={xKey} tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(139,111,255,0.2)" }} />
            {keys.map((k, i) => (
              <Area
                key={k}
                type="monotone"
                dataKey={k}
                stroke={resolvedColors[i]}
                strokeWidth={CHART_DEFAULTS.strokeWidth}
                fill={`url(#${gradientId}_${i})`}
                dot={false}
                activeDot={{ r: CHART_DEFAULTS.dotRadius, fill: resolvedColors[i] }}
              />
            ))}
          </AreaChart>
        ) : type === "bar" ? (
          <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={gridStroke} />
            <XAxis dataKey={xKey} tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(139,111,255,0.08)" }} />
            {keys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={resolvedColors[i]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={gridStroke} />
            <XAxis dataKey={xKey} tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(139,111,255,0.2)" }} />
            {keys.map((k, i) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={resolvedColors[i]}
                strokeWidth={CHART_DEFAULTS.strokeWidth}
                dot={false}
                activeDot={{ r: CHART_DEFAULTS.dotRadius }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
