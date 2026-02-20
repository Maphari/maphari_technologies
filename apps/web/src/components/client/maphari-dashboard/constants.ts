import type { PageId } from "./types";

export const pageTitles: Record<PageId, [string, string]> = {
  dashboard: ["Overview", "Dashboard"],
  projects: ["My Engagements", "Projects"],
  create: ["Project Intake", "Create Request"],
  docs: ["Documents", "Document Library"],
  invoices: ["Finance", "Invoices"],
  messages: ["Communication", "Messages"],
  automations: ["Operations", "Automations"],
  settings: ["Account", "Settings"]
};
