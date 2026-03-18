"use client";

// ════════════════════════════════════════════════════════════════════════════
// integrations-page.tsx — Client Portal Integrations Hub
// Connected state is persisted via settingsApiAccess preference key.
// Connecting opens an OAuth popup (placeholder client IDs).
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { saveSession } from "../../../../lib/auth/session";
import {
  getPortalPreferenceWithRefresh,
  setPortalPreferenceWithRefresh,
  createPortalSupportTicketWithRefresh,
} from "../../../../lib/api/portal";

// ── OAuth is not yet configured — connections are requested via support ticket ──
// When OAuth client IDs are set up in env, replace this with real OAuth flows.

// ── Static integration catalogue ─────────────────────────────────────────────

type IntegrationStatus = "Available" | "Coming Soon";

interface Integration {
  id:          string;
  name:        string;
  description: string;
  category:    string;
  status:      IntegrationStatus;
  icon:        string;
  iconColor:   string;
}

const INTEGRATIONS: Integration[] = [
  { id: "slack",     name: "Slack",           description: "Receive project notifications, approvals, and alerts directly in your Slack workspace.",  category: "Communication",  status: "Available",    icon: "S", iconColor: "var(--purple)" },
  { id: "gcal",      name: "Google Calendar", description: "Sync scheduled meetings and milestone due dates to your Google Calendar.",                 category: "Calendar",       status: "Available",    icon: "G", iconColor: "var(--lime)"   },
  { id: "xero",      name: "Xero",            description: "Automatically push approved invoices to your Xero accounting platform.",                    category: "Finance",        status: "Available",    icon: "X", iconColor: "#13B5EA"       },
  { id: "msteams",   name: "Microsoft Teams", description: "Route project notifications and updates to your Teams channels.",                           category: "Communication",  status: "Available",    icon: "T", iconColor: "var(--purple)" },
  { id: "dropbox",   name: "Dropbox",         description: "Automatically sync project file deliverables to your Dropbox folder.",                      category: "Files",          status: "Available",    icon: "D", iconColor: "#0061FF"       },
  { id: "notion",    name: "Notion",          description: "Export meeting notes and decision logs directly to a Notion workspace.",                     category: "Documentation",  status: "Coming Soon",  icon: "N", iconColor: "var(--muted2)" },
  { id: "zapier",    name: "Zapier",          description: "Connect your project data to 3,000+ tools via automated Zapier workflows.",                 category: "Automation",     status: "Coming Soon",  icon: "Z", iconColor: "var(--amber)"  },
  { id: "hubspot",   name: "HubSpot",         description: "View project health and delivery metrics in your HubSpot CRM.",                             category: "CRM",            status: "Coming Soon",  icon: "H", iconColor: "var(--red)"    },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const { session } = useProjectLayer();
  const notify      = usePageToast();

  const [connected,    setConnected]    = useState<Record<string, boolean>>({});
  const [requested,    setRequested]    = useState<Record<string, boolean>>({});
  const [loading,      setLoading]      = useState(true);
  const [requesting,   setRequesting]   = useState<string | null>(null);

  // Load connected state from preferences
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    void getPortalPreferenceWithRefresh(session, "settingsApiAccess").then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data?.value) {
        try { setConnected(JSON.parse(r.data.value) as Record<string, boolean>); } catch { /**/ }
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  function persistConnected(next: Record<string, boolean>): void {
    if (session) {
      void setPortalPreferenceWithRefresh(session, { key: "settingsApiAccess", value: JSON.stringify(next) })
        .then((r) => { if (r.nextSession) saveSession(r.nextSession); });
    }
  }

  async function handleRequestConnection(integration: Integration): Promise<void> {
    if (!session || requesting === integration.id) return;
    setRequesting(integration.id);
    try {
      const r = await createPortalSupportTicketWithRefresh(session, {
        clientId:    session.user.clientId ?? "",
        title:       `Integration Setup Request: ${integration.name}`,
        description: `The client has requested to connect their portal to ${integration.name}.\n\nIntegration: ${integration.name}\nCategory: ${integration.category}\nDescription: ${integration.description}\n\nPlease set up this integration and notify the client when it's ready.`,
        category:    "GENERAL",
        priority:    "MEDIUM",
      });
      if (r.nextSession) saveSession(r.nextSession);
      setRequested((prev) => ({ ...prev, [integration.id]: true }));
      notify("success", "Request sent", `We'll set up your ${integration.name} connection and notify you when it's ready.`);
    } catch {
      notify("error", "Request failed", "Please try again or contact support.");
    } finally {
      setRequesting(null);
    }
  }

  function handleDisconnect(integration: Integration): void {
    setConnected((prev) => {
      const next = { ...prev, [integration.id]: false };
      persistConnected(next);
      return next;
    });
    notify("info", `${integration.name} disconnected`, "Integration has been removed.");
  }

  const connectedCount = useMemo(() => Object.values(connected).filter(Boolean).length, [connected]);
  const availableCount = INTEGRATIONS.filter((i) => i.status === "Available").length;
  const comingSoonCount = INTEGRATIONS.filter((i) => i.status === "Coming Soon").length;

  return (
    <div className={cx("pageBody")}>

      {/* ── Header ── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Account · Integrations</div>
          <h1 className={cx("pageTitle")}>Integrations</h1>
          <p className={cx("pageSub")}>
            Connect your portal to the tools you already use. Sync notifications, invoices, files, and meetings automatically.
          </p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Total Available",      value: String(INTEGRATIONS.length), color: "statCardAccent" },
          { label: "Available to Connect", value: String(availableCount),      color: "statCardBlue"   },
          { label: "Coming Soon",          value: String(comingSoonCount),     color: "statCardAmber"  },
          { label: "Connected",            value: String(connectedCount),      color: connectedCount > 0 ? "statCardGreen" : "statCard" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue", "fontMono")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Info banner ── */}
      <div className={cx("intInfoBanner")}>
        <Ic n="info" sz={14} c="var(--lime)" />
        <span className={cx("text12", "colorMuted")}>
          Clicking <strong>Connect</strong> opens an OAuth authorization window. Integration credentials are handled securely — we never store passwords.
        </span>
      </div>

      {/* ── Integration grid ── */}
      {loading ? (
        <div className={cx("grid2Cols12Gap")}>
          {[1,2,3,4].map((n) => (
            <div key={n} className={cx("skeletonBlock", "skeleH140")} />
          ))}
        </div>
      ) : (
        <div className={cx("grid2Cols12Gap")}>
          {INTEGRATIONS.map((integration) => {
            const isComingSoon  = integration.status === "Coming Soon";
            const isConnected   = !isComingSoon && (connected[integration.id] === true);
            const borderColor   = isConnected ? "var(--lime)" : isComingSoon ? "var(--b2)" : "var(--b2)";

            return (
              <div
                key={integration.id}
                className={cx("card", "borderLeft3")} style={{ "--border-color": borderColor } as React.CSSProperties}
              >
                <div className={cx("cardBodyPad", "pt16")}>
                  <div className={cx("flexRow", "gap12", "mb10")}>
                    {/* Brand-tinted icon box */}
                    <div className={cx("intIconBox", "dynBgColor", "dynBorderColor", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${integration.iconColor} 15%, transparent)`, "--border-color": `color-mix(in oklab, ${integration.iconColor} 30%, transparent)`, "--color": integration.iconColor } as React.CSSProperties}>
                      {integration.icon}
                    </div>

                    <div className={cx("flex1")}>
                      <div className={cx("fw700", "text12")}>{integration.name}</div>
                      <span className={cx("text10", "colorMuted")}>{integration.category}</span>
                    </div>

                    {/* Status badge */}
                    {isConnected ? (
                      <span className={cx("badge", "badgeGreen", "noShrink", "alignSelfStart")}>Connected</span>
                    ) : isComingSoon ? (
                      <span className={cx("badge", "badgeAmber", "noShrink", "alignSelfStart")}>Coming Soon</span>
                    ) : (
                      <div className={cx("dot8", "dotBgB3", "noShrink", "alignSelfCenter")} />
                    )}
                  </div>

                  <div className={cx("text11", "colorMuted", "mb12")}>
                    {integration.description}
                  </div>

                  <div className={cx("flexRow", "gap8")}>
                    {isComingSoon ? (
                      <button type="button" className={cx("btnSm", "btnGhost", "opacity50")} disabled>
                        Notify Me
                      </button>
                    ) : isConnected ? (
                      <>
                        <span className={cx("text11", "colorGreen", "flexRow", "alignCenter", "gap4", "mr4")}>
                          <Ic n="check" sz={11} c="var(--green)" /> Active
                        </span>
                        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => handleDisconnect(integration)}>
                          Disconnect
                        </button>
                      </>
                    ) : requested[integration.id] ? (
                      <span className={cx("badge", "badgeGreen")}>Requested ✓</span>
                    ) : (
                      <button
                        type="button"
                        className={cx("btnSm", "btnAccent")}
                        disabled={requesting === integration.id}
                        onClick={() => void handleRequestConnection(integration)}
                      >
                        {requesting === integration.id ? "Requesting…" : "Request Connection"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
