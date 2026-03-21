// ════════════════════════════════════════════════════════════════════════════
// my-integrations-page.tsx — Staff: personal tool integrations hub
// Data     : getMyProfile(session) for identity; no integrations API exists
// Note     : OAuth backends are not yet implemented. "Connect" buttons fire
//            an `onNotify` toast so they are interactive, not dead UI.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState, type ReactElement } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getMyProfile, type StaffProfile } from "../../../../lib/api/staff/profile";
import { cx } from "../style";

// ── Types ─────────────────────────────────────────────────────────────────────

type PageProps = {
  isActive: boolean;
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
};

type IntegrationCategory = "Productivity" | "Communication" | "Design" | "Development";

interface Integration {
  id:          string;
  name:        string;
  category:    IntegrationCategory;
  description: string;
  scopes:      string[];
  icon:        ReactElement;
}

// ── Provider catalog (static — wired to OAuth when backend ships) ─────────────

const INTEGRATIONS: Integration[] = [
  {
    id:          "google-calendar",
    name:        "Google Calendar",
    category:    "Productivity",
    description: "Sync your schedule, see upcoming meetings, and block focus time directly from the dashboard.",
    scopes:      ["Read calendar events", "Create events", "See availability"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 2v4M8 2v4M3 9h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="8" y="13" width="3" height="3" rx="0.5" fill="currentColor"/>
        <rect x="13" y="13" width="3" height="3" rx="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id:          "slack",
    name:        "Slack",
    category:    "Communication",
    description: "Get task notifications, milestone updates, and client alerts directly in your Slack channels.",
    scopes:      ["Post messages", "Read channel list", "Send DMs"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 3a2 2 0 1 0 0 4h2V3a2 2 0 0 0-2 0z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M15 3a2 2 0 1 0 0 4h2a2 2 0 0 0-2-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M3 9a2 2 0 1 0 4 0V7H3a2 2 0 0 0 0 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M3 15a2 2 0 1 0 4 0v-2H3a2 2 0 0 0 0 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M21 15a2 2 0 1 0-4 0v2a2 2 0 0 0 4-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M21 9a2 2 0 1 0-4 0v2h2a2 2 0 0 0 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M15 21a2 2 0 1 0 0-4h-2v2a2 2 0 0 0 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M9 21a2 2 0 1 0 0-4H7a2 2 0 0 0 2 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id:          "figma",
    name:        "Figma",
    category:    "Design",
    description: "Link design files to projects, track design progress, and surface handoff-ready components.",
    scopes:      ["Read files & projects", "Access comments", "View team library"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 3h4a4 4 0 0 1 0 8H8V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M8 11h4a4 4 0 0 1 0 8H8v-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M8 3a4 4 0 0 0 0 8 4 4 0 0 0 0-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="16" cy="15" r="4" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id:          "github",
    name:        "GitHub",
    category:    "Development",
    description: "Connect repos to projects, track PR status, and link commits to tasks and milestones.",
    scopes:      ["Read repositories", "Read pull requests", "Read commit history"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id:          "notion",
    name:        "Notion",
    category:    "Productivity",
    description: "Pull wiki pages and project docs into the dashboard, and push task updates to Notion databases.",
    scopes:      ["Read pages", "Read databases", "Create page entries"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 8h6M7 12h8M7 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id:          "linear",
    name:        "Linear",
    category:    "Development",
    description: "Bi-directional sync between dashboard tasks and Linear issues. Never duplicate work again.",
    scopes:      ["Read issues", "Create issues", "Read team info"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 12L12 3l9 9-9 9-9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 12l5-5 5 5-5 5-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id:          "harvest",
    name:        "Harvest",
    category:    "Productivity",
    description: "Import time entries from Harvest to keep your dashboard hours and billing in sync automatically.",
    scopes:      ["Read time entries", "Read projects", "Read clients"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id:          "jira",
    name:        "Jira",
    category:    "Development",
    description: "Link Jira tickets to dashboard tasks and surface sprint progress without switching tabs.",
    scopes:      ["Read issues", "Read sprints", "Read project boards"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3L3 12l4.5 4.5L12 12l4.5 4.5L21 12 12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7.5 16.5L12 12l4.5 4.5L12 21l-4.5-4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const CATEGORY_TONES: Record<IntegrationCategory, string> = {
  Productivity:  "itgCatProductivity",
  Communication: "itgCatCommunication",
  Design:        "itgCatDesign",
  Development:   "itgCatDevelopment",
};

// ── IntegrationCard sub-component ─────────────────────────────────────────────

function IntegrationCard({
  integration,
  requested,
  onConnect,
}: {
  integration: Integration;
  requested:   boolean;
  onConnect:   (id: string, name: string) => void;
}) {
  const { id, name, category, description, scopes, icon } = integration;
  return (
    <div className={cx("itgCard")}>
      <div className={cx("itgCardHeader")}>
        <div className={cx("itgCardIcon")}>{icon}</div>
        <div className={cx("itgCardMeta")}>
          <div className={cx("itgCardName")}>{name}</div>
          <span className={cx("itgCardCategory", CATEGORY_TONES[category])}>{category}</span>
        </div>
      </div>

      <div className={cx("itgCardDesc")}>{description}</div>

      <div className={cx("itgCardScopes")}>
        {scopes.map((s) => (
          <span key={s} className={cx("itgCardScopeTag")}>{s}</span>
        ))}
      </div>

      <div className={cx("itgCardFooter")}>
        <button
          type="button"
          className={cx("itgConnectBtn", requested && "itgConnectBtnDone")}
          onClick={() => { if (!requested) onConnect(id, name); }}
          aria-label={requested ? `${name} — interest registered` : `Request early access to ${name}`}
        >
          {requested ? "Interest registered ✓" : "Get early access"}
        </button>
      </div>
    </div>
  );
}

// ── Page component ─────────────────────────────────────────────────────────────

export function MyIntegrationsPage({ isActive, session, onNotify }: PageProps) {
  const [profile, setProfile]           = useState<StaffProfile | null>(null);
  const [loading, setLoading]           = useState(true);
  const [activeCategory, setActiveCategory] = useState<"all" | IntegrationCategory>("all");
  const [requested, setRequested]       = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isActive) return;
    if (!session) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    setLoading(true);
    void getMyProfile(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      // Profile is optional — if it fails we still render the catalog
      if (!result.error && result.data) {
        setProfile(result.data);
      }
    }).catch(() => {
      // Profile load failure is non-fatal — catalog renders without it
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isActive, session?.accessToken]);

  const firstName = profile?.firstName ?? session?.user.email?.split("@")[0] ?? "there";

  const filtered = activeCategory === "all"
    ? INTEGRATIONS
    : INTEGRATIONS.filter((i) => i.category === activeCategory);

  function handleConnect(id: string, name: string) {
    setRequested((prev) => new Set(prev).add(id));
    onNotify?.("info", `Got it — we'll notify you when ${name} is ready to connect.`);
  }

  const CATEGORIES: ("all" | IntegrationCategory)[] = [
    "all", "Productivity", "Communication", "Design", "Development",
  ];

  if (!isActive) return null;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-integrations">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section
      className={cx("page", "pageBody", isActive && "pageActive")}
      id="page-my-integrations"
    >
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Settings</div>
        <h1 className={cx("pageTitleText")}>My Integrations</h1>
        <p className={cx("pageSubtitleText", "mb20")}>
          {`Manage your tool connections, ${firstName}`}
        </p>
      </div>

      {/* ── Category filters ──────────────────────────────────────────── */}
      <div className={cx("itgFilterRow")}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={cx("itgFilterBtn", activeCategory === cat && "itgFilterBtnActive")}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === "all" ? "All" : cat}
            {cat !== "all" && (
              <span className={cx("itgFilterCount")}>
                {INTEGRATIONS.filter((i) => i.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Provider grid ─────────────────────────────────────────────── */}
      <div className={cx("itgGrid")}>
        {filtered.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            requested={requested.has(integration.id)}
            onConnect={handleConnect}
          />
        ))}
      </div>

      {/* ── Footer note ───────────────────────────────────────────────── */}
      <div className={cx("itgFooterNote")}>
        <span className={cx("itgFooterDot")} />
        <span className={cx("itgFooterText")}>
          OAuth integrations are in development. Registering interest helps us prioritise which ones ship first.
        </span>
      </div>
    </section>
  );
}
