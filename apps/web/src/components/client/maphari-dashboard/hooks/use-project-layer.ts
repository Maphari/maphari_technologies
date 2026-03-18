// ════════════════════════════════════════════════════════════════════════════
// use-project-layer.ts — Context + hook for project-layer data
// Provides session + active projectId to project-specific pages.
// Created at dashboard root; consumed by deliverables, risks, sprint, brief.
// ════════════════════════════════════════════════════════════════════════════

import { createContext, useContext } from "react";
import type { AuthSession } from "../../../../lib/auth/session";

// ── Context shape ─────────────────────────────────────────────────────────────

export interface ProjectLayerCtxValue {
  session:   AuthSession | null;
  projectId: string | null;
}

export const ProjectLayerCtx = createContext<ProjectLayerCtxValue>({
  session:   null,
  projectId: null,
});

/** Consume session + active project from parent dashboard shell. */
export function useProjectLayer(): ProjectLayerCtxValue {
  return useContext(ProjectLayerCtx);
}
