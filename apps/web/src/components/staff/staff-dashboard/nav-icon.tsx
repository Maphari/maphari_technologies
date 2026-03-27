"use client";
import React from "react";
import { cx } from "./style";

interface NavIconProps {
  sectionId: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  hasCurrent: boolean;
  hasNotification: boolean;
  onClick: () => void;
}

export function NavIcon({
  sectionId,
  icon,
  label,
  isActive,
  hasCurrent,
  hasNotification,
  onClick,
}: NavIconProps) {
  return (
    <button
      className={cx("railIconBtn", isActive && "railIconBtnActive", !isActive && hasCurrent && "railIconBtnCurrent")}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      aria-current={hasCurrent ? "page" : undefined}
      data-section={sectionId}
    >
      {icon}
      {hasNotification && <span className={cx("railNotifDot")} aria-hidden />}
    </button>
  );
}
