"use client";
import type { ReactElement } from "react";
import { createCx } from "@/lib/utils/cx";
import styles from "@/app/style/shared/utilities.module.css";
import { useTheme, type Theme } from "@/lib/hooks/use-theme";
const cx = createCx(styles);

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8" cy="8" r="3"/>
    <line x1="8" y1="1" x2="8" y2="3"/>
    <line x1="8" y1="13" x2="8" y2="15"/>
    <line x1="1" y1="8" x2="3" y2="8"/>
    <line x1="13" y1="8" x2="15" y2="8"/>
    <line x1="3" y1="3" x2="4.5" y2="4.5"/>
    <line x1="11.5" y1="11.5" x2="13" y2="13"/>
    <line x1="13" y1="3" x2="11.5" y2="4.5"/>
    <line x1="4.5" y1="11.5" x2="3" y2="13"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M6 2a6 6 0 1 0 8 8 5 5 0 0 1-8-8z"/>
  </svg>
);

const SystemIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="1" y="2" width="14" height="10" rx="2"/>
    <line x1="5" y1="15" x2="11" y2="15"/>
    <line x1="8" y1="12" x2="8" y2="15"/>
  </svg>
);

type OptionConfig = { value: Theme; label: string; Icon: () => ReactElement };
const OPTIONS: OptionConfig[] = [
  { value: "light",  label: "Light mode",  Icon: SunIcon    },
  { value: "dark",   label: "Dark mode",   Icon: MoonIcon   },
  { value: "system", label: "System mode", Icon: SystemIcon },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      className={[cx("ttPill"), className].filter(Boolean).join(" ")}
      role="group"
      aria-label="Theme selector"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          className={cx("ttBtn", theme === value ? "ttBtnActive" : "")}
          onClick={() => setTheme(value)}
          aria-label={label}
          aria-pressed={theme === value}
          title={label}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
