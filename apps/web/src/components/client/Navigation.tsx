import { memo } from "react";

type NavItem = {
  id: string;
  label: string;
  badge?: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  { label: "Overview", items: [{ id: "dashboard", label: "Dashboard" }] },
  {
    label: "Projects",
    items: [{ id: "projects", label: "All Projects" }]
  },
  { label: "Finance", items: [{ id: "invoices", label: "Invoices" }] },
  { label: "Communication", items: [{ id: "messages", label: "Messages", badge: "3" }] },
  { label: "", items: [{ id: "settings", label: "Settings" }] }
];

type Props = {
  activePage: string;
  onChange: (pageId: string) => void;
};

function NavIcon({ type }: { type: string }) {
  switch (type) {
    case "dashboard":
      return (
        <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "projects":
      return (
        <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "invoices":
      return (
        <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="1" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 5h6M5 8h4M5 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "messages":
      return (
        <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
          <path d="M2 2h12v9H9l-3 3v-3H2V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "settings":
      return (
        <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.41 1.41M3.05 12.95l1.42-1.41M11.54 4.46l1.41-1.41"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return <span className="nav-icon" />;
  }
}

export const ClientNav = memo(function ClientNav({ activePage, onChange }: Props) {
  return (
    <nav className="sidebar-nav">
      {navSections.map((section) => (
        <div key={`${section.label}-${section.items.map((item) => item.id).join(",")}`}>
          {section.label ? <div className="nav-section-label">{section.label}</div> : null}
          {section.items.map((item) => {
            const isActive = activePage === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item${isActive ? " active" : ""}`}
                onClick={() => onChange(item.id)}
              >
                <NavIcon type={item.id} />
                {item.label}
                {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
});
