"use client";
import { useTheme, type Theme } from "@/lib/hooks/use-theme";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; label: string; icon: string }[] = [
    { value: "light", label: "Light", icon: "☀️" },
    { value: "dark",  label: "Dark",  icon: "🌙" },
    { value: "system", label: "Auto", icon: "💻" },
  ];
  return (
    <div
      className={className}
      style={{
        display: "flex",
        gap: 4,
        background: "var(--s2)",
        borderRadius: "var(--r-sm)",
        padding: 3,
      }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setTheme(o.value)}
          title={o.label}
          style={{
            padding: "4px 8px",
            borderRadius: "var(--r-xs, 6px)",
            border: "none",
            cursor: "pointer",
            fontSize: "0.7rem",
            background: theme === o.value ? "var(--s4)" : "transparent",
            color: "var(--text-muted)",
            fontWeight: theme === o.value ? 700 : 400,
          }}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
