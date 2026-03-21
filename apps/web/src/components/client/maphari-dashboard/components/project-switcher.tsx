// ════════════════════════════════════════════════════════════════════════════
// project-switcher.tsx — Topbar project dropdown for multi-project clients
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";

type ProjectOption = {
  id: string;
  name: string;
  status: string;
};

type ProjectSwitcherProps = {
  projects: ProjectOption[];
  selectedProjectId: string | null;
  onSelect: (id: string) => void;
  onViewAll: () => void;
};

type ProjectStatus = "SETUP" | "ONBOARDING" | "ACTIVE" | "COMPLETE" | "ARCHIVED";

function statusBadgeClass(status: string): string {
  const s = status as ProjectStatus;
  if (s === "ACTIVE")                        return "badgeGreen";
  if (s === "SETUP" || s === "ONBOARDING")   return "badgeAmber";
  if (s === "COMPLETE" || s === "ARCHIVED")  return "badgeMuted";
  return "badgeMuted";
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

export function ProjectSwitcher({ projects, selectedProjectId, onSelect, onViewAll }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const selected = projects.find((p) => p.id === selectedProjectId) ?? projects[0];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!selected) return null;

  // Single project: render non-interactive label
  if (projects.length === 1) {
    return (
      <div className={cx("projectSwitcherLabel")}>
        <span className={cx("projectSwitcherName")}>{truncate(selected.name, 28)}</span>
        <span className={cx("badge", statusBadgeClass(selected.status))}>{selected.status}</span>
      </div>
    );
  }

  return (
    <div className={cx("projectSwitcherWrap")} ref={ref}>
      <button
        type="button"
        className={cx("projectSwitcherBtn")}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={cx("projectSwitcherName")}>{truncate(selected.name, 28)}</span>
        <span className={cx("badge", statusBadgeClass(selected.status))}>{selected.status}</span>
        <Ic n="chevronDown" sz={12} c="var(--muted2)" />
      </button>

      {open && (
        <div className={cx("projectSwitcherDropdown")} role="listbox">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={p.id === selectedProjectId}
              className={cx("projectSwitcherRow", p.id === selectedProjectId && "projectSwitcherRowActive")}
              onClick={() => { onSelect(p.id); setOpen(false); }}
            >
              <span className={cx("projectSwitcherRowDot", p.id === selectedProjectId && "projectSwitcherRowDotActive")} />
              <span className={cx("projectSwitcherRowName")}>{truncate(p.name, 28)}</span>
              <span className={cx("badge", statusBadgeClass(p.status))}>{p.status}</span>
            </button>
          ))}
          <div className={cx("projectSwitcherDivider")} />
          <button
            type="button"
            className={cx("projectSwitcherViewAll")}
            onClick={() => { onViewAll(); setOpen(false); }}
          >
            View all projects <Ic n="arrowRight" sz={11} c="var(--muted)" />
          </button>
        </div>
      )}
    </div>
  );
}
