"use client";

import styles from "@/app/style/admin/widgets.module.css";

type Tone = "default" | "accent" | "green" | "amber" | "red";

interface StatWidgetProps {
  label: string;
  value: string | number;
  sub?: string;
  subTone?: "up" | "down" | "warn" | "neutral";
  tone?: Tone;
  /** 8 numbers 0–100 for the sparkline bars */
  sparkData?: number[];
  /** 0–100 for the progress bar; ignored if sparkData is provided */
  progressValue?: number;
  className?: string;
}

const toneValueClass: Record<Tone, string> = {
  default: "",
  accent:  styles.widgetValueAccent,
  green:   styles.widgetValueGreen,
  amber:   styles.widgetValueAmber,
  red:     styles.widgetValueRed,
};

const toneWrapClass: Record<Tone, string> = {
  default: "",
  accent:  styles.widgetAccent,
  green:   styles.widgetGreen,
  amber:   styles.widgetAmber,
  red:     styles.widgetRed,
};

const subToneClass = {
  up:      styles.widgetSubUp,
  down:    styles.widgetSubDown,
  warn:    styles.widgetSubWarn,
  neutral: "",
};

const sparkHiClass: Record<Tone, string> = {
  default: styles.sparkBarHi,
  accent:  styles.sparkBarHi,
  green:   styles.sparkBarGreenHi,
  amber:   styles.sparkBarAmberHi,
  red:     styles.sparkBarHi,
};

const sparkBaseClass: Record<Tone, string> = {
  default: styles.sparkBar,
  accent:  styles.sparkBar,
  green:   styles.sparkBarGreen,
  amber:   styles.sparkBarAmber,
  red:     styles.sparkBar,
};

const progFillClass: Record<Tone, string> = {
  default: styles.progFill,
  accent:  styles.progFill,
  green:   styles.progFillGreen,
  amber:   styles.progFillAmber,
  red:     styles.progFillRed,
};

export function StatWidget({
  label,
  value,
  sub,
  subTone = "neutral",
  tone = "default",
  sparkData,
  progressValue,
  className,
}: StatWidgetProps) {
  const wrapClass = [styles.widget, toneWrapClass[tone], className].filter(Boolean).join(" ");
  const maxSpark = sparkData ? Math.max(...sparkData, 1) : 1;

  return (
    <div className={wrapClass}>
      <div className={styles.widgetLabel}>{label}</div>
      <div className={[styles.widgetValue, toneValueClass[tone]].filter(Boolean).join(" ")}>
        {value}
      </div>
      {sub ? (
        <div className={[styles.widgetSub, subToneClass[subTone]].filter(Boolean).join(" ")}>
          {sub}
        </div>
      ) : null}
      {sparkData && sparkData.length > 0 ? (
        <div className={styles.sparkWrap}>
          {sparkData.map((v, i) => {
            const isHi = i === sparkData.length - 1;
            return (
              <div
                key={i}
                className={isHi ? sparkHiClass[tone] : sparkBaseClass[tone]}
                style={{ height: `${Math.max(8, (v / maxSpark) * 100)}%` }}
              />
            );
          })}
        </div>
      ) : progressValue !== undefined ? (
        <div className={styles.progWrap}>
          <div
            className={progFillClass[tone]}
            style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
