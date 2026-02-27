export type PageId = "dashboard" | "notifications" | "tasks" | "kanban" | "clients" | "autodraft" | "meetingprep" | "comms" | "onboarding" | "health" | "response" | "sentiment" | "lasttouched" | "portal" | "smartsuggestions" | "sprintplanning" | "taskdependencies" | "recurringtasks" | "focusmode" | "peerrequests" | "triggerlog" | "privatenotes" | "keyboardshortcuts" | "estimatesactuals" | "satisfactionscores" | "knowledge" | "decisionlog" | "handoverchecklist" | "closeoutreport" | "staffhandovers" | "context" | "signoff" | "standup" | "retainer" | "performance" | "eodwrap" | "deliverables" | "timelog" | "automations" | "settings";

export type NavItem = {
  id: PageId;
  label: string;
  section: string;
  badge?: { value: string; tone: "blue" | "green" | "amber" | "red" };
};
