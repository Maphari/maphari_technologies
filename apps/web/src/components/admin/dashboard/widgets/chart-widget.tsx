"use client";

import dynamic from "next/dynamic";
import styles from "@/app/style/admin/widgets.module.css";
import type { ChartWidgetInnerProps } from "./chart-widget-inner";

// Recharts bundle is isolated from SSR via this boundary.
// Callers import ChartWidget normally — no dynamic() at callsites.
const ChartWidgetInner = dynamic(
  () => import("./chart-widget-inner").then((m) => ({ default: m.ChartWidgetInner })),
  {
    ssr: false,
    loading: () => (
      <div className={[styles.widget, styles.span2].join(" ")} style={{ minHeight: 140 }}>
        <div className={styles.chartLoading}>Loading chart…</div>
      </div>
    ),
  },
);

export type { ChartWidgetInnerProps as ChartWidgetProps };
export function ChartWidget(props: ChartWidgetInnerProps) {
  return <ChartWidgetInner {...props} />;
}
