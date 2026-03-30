"use client";

import type { ReactNode } from "react";
import styles from "@/app/style/admin/widgets.module.css";

interface WidgetGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function WidgetGrid({ children, columns = 4, className }: WidgetGridProps) {
  const gridClass = {
    2: styles.widgetGrid2,
    3: styles.widgetGrid3,
    4: "",
  }[columns];
  const wrapClass = [styles.widgetGrid, gridClass, className].filter(Boolean).join(" ");
  return <div className={wrapClass}>{children}</div>;
}
