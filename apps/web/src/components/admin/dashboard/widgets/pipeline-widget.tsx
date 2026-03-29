"use client";

import styles from "@/app/style/admin/widgets.module.css";
import { CHART_DEFAULTS } from "./chart-defaults";

const AUTO_COLORS = [
  CHART_DEFAULTS.colors.accent,
  CHART_DEFAULTS.colors.green,
  CHART_DEFAULTS.colors.amber,
  CHART_DEFAULTS.colors.red,
  CHART_DEFAULTS.colors.blue,
];

export interface PipelineStage {
  label: string;
  count: number;
  total: number;
  color?: string;
}

interface PipelineWidgetProps {
  label: string;
  stages: PipelineStage[];
  className?: string;
}

export function PipelineWidget({ label, stages, className }: PipelineWidgetProps) {
  const wrapClass = [styles.widget, className].filter(Boolean).join(" ");

  return (
    <div className={wrapClass}>
      <div className={styles.widgetLabel}>{label}</div>
      <div className={styles.pipelineList}>
        {stages.map((stage, i) => {
          const pct = stage.total > 0 ? Math.min(100, (stage.count / stage.total) * 100) : 0;
          const fillColor = stage.color ?? AUTO_COLORS[i % AUTO_COLORS.length];
          return (
            <div key={stage.label} className={styles.pipelineRow}>
              <span className={styles.pipelineLabel}>{stage.label}</span>
              <div className={styles.pipelineTrack}>
                <div
                  className={styles.pipelineFill}
                  style={{ width: `${pct}%`, background: fillColor }}
                />
              </div>
              <span className={styles.pipelineCount}>{stage.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
