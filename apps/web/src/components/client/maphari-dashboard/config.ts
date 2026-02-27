export type PageId =
  | "dashboard" | "reports" | "ai" | "onboarding" | "projects" | "milestones"
  | "create" | "docs" | "invoices" | "messages" | "automations" | "settings"
  | "notifications" | "team" | "support"
  | "reviews" | "calendar" | "analytics" | "payments" | "brand"
  | "contracts" | "feedback" | "exports" | "resources" | "referrals" | "integrations";

export type NavItem = {
  id: PageId;
  label: string;
  section: string;
  badge?: { value: string; tone?: "amber" | "red" };
};
