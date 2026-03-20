"use client";
import React from "react";
import { cx } from "./style";

interface NavIconProps {
  sectionId: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  hasNotification: boolean;
  onClick: () => void;
}

export function NavIcon({
  sectionId,
  icon,
  label,
  isActive,
  hasNotification,
  onClick,
}: NavIconProps) {
  return (
    <button
      className={cx("railIconBtn", isActive && "railIconBtnActive")}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      data-section={sectionId}
    >
      {icon}
      {hasNotification && <span className={cx("railNotifDot")} aria-hidden />}
    </button>
  );
}
