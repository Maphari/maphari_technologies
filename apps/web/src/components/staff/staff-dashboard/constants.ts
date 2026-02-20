import type { PageId } from "./types";

export const pageTitles: Record<PageId, [string, string]> = {
  dashboard: ["Workspace", "Dashboard"],
  tasks: ["Assignments", "My Tasks"],
  kanban: ["Sprint 4", "Kanban Board"],
  clients: ["Communication", "Client Threads"],
  deliverables: ["Output", "Deliverables"],
  timelog: ["Tracking", "Time Log"],
  automations: ["Operations", "Automations"],
  settings: ["Account", "Settings"]
};
