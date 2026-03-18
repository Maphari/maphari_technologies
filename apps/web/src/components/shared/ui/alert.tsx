"use client";
import { createCx } from "@/lib/utils/cx";
import styles from "@/app/style/shared/utilities.module.css";
const cx = createCx(styles);

interface AlertProps {
  variant: "error" | "warn" | "info";
  message: string;
  onRetry?: () => void;
}

const ICONS = { error: "✕", warn: "!", info: "i" };

export function Alert({ variant, message, onRetry }: AlertProps) {
  const variantClass = variant === "error" ? "alertError" : variant === "warn" ? "alertWarn" : "alertInfo";
  return (
    <div className={cx("alertWrap", variantClass)} role="alert">
      <span className={cx("alertIcon")} aria-hidden="true">{ICONS[variant]}</span>
      <div>
        {message}
        {onRetry && <button className={cx("alertRetry")} onClick={onRetry}>Try again</button>}
      </div>
    </div>
  );
}
