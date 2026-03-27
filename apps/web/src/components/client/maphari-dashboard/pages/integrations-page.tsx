"use client";

// ════════════════════════════════════════════════════════════════════════════
// integrations-page.tsx — Client Portal Integrations Hub
// Google Calendar uses a real OAuth2 flow.
// Assisted integrations use explicit integration-request records.
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { saveSession } from "../../../../lib/auth/session";
import {
  createPortalIntegrationRequestWithRefresh,
  getGoogleCalendarAuthUrlWithRefresh,
  getGoogleCalendarStatusWithRefresh,
  disconnectGoogleCalendarWithRefresh,
  loadPortalIntegrationsWithRefresh,
  type GcalStatus,
  type PortalIntegration,
} from "../../../../lib/api/portal/integrations";

const PRESENTATION: Record<string, { icon: string; iconColor: string }> = {
  gcal: { icon: "G", iconColor: "var(--lime)" },
  slack: { icon: "S", iconColor: "var(--purple)" },
  xero: { icon: "X", iconColor: "#13B5EA" },
  msteams: { icon: "T", iconColor: "var(--purple)" },
  dropbox: { icon: "D", iconColor: "#0061FF" },
  notion: { icon: "N", iconColor: "var(--muted2)" },
  zapier: { icon: "Z", iconColor: "var(--amber)" },
  hubspot: { icon: "H", iconColor: "var(--red)" },
};

function formatShortDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const { session }  = useProjectLayer();
  const notify       = usePageToast();
  const searchParams = useSearchParams();

  const [integrations,   setIntegrations]   = useState<PortalIntegration[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [requesting,     setRequesting]     = useState<string | null>(null);

  // Google Calendar specific state
  const [gcalStatus,     setGcalStatus]     = useState<GcalStatus | null>(null);
  const [gcalConnecting, setGcalConnecting] = useState(false);
  const [gcalDisconn,    setGcalDisconn]    = useState(false);

  // Load real catalog state + Google Calendar status
  useEffect(() => {
    if (!session) { setLoading(false); return; }

    const integrationsPromise = loadPortalIntegrationsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      setIntegrations(r.data ?? []);
    });

    const gcalPromise = getGoogleCalendarStatusWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setGcalStatus(r.data);
    });

    void Promise.all([integrationsPromise, gcalPromise]).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  // Handle redirect-back from Google OAuth
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error     = searchParams.get("error");

    if (connected === "google-calendar") {
      notify("success", "Google Calendar connected", "Your calendar is now synced.");
      // Refresh status
      if (session) {
        void Promise.all([
          getGoogleCalendarStatusWithRefresh(session),
          loadPortalIntegrationsWithRefresh(session),
        ]).then(([statusResult, integrationsResult]) => {
          if (statusResult.nextSession) saveSession(statusResult.nextSession);
          if (integrationsResult.nextSession) saveSession(integrationsResult.nextSession);
          if (statusResult.data) setGcalStatus(statusResult.data);
          setIntegrations(integrationsResult.data ?? []);
        });
      }
    } else if (error === "oauth_failed") {
      notify("error", "Connection failed", "Unable to connect Google Calendar. Please try again.");
    } else if (error === "oauth_cancelled") {
      notify("info", "Cancelled", "Google Calendar connection was cancelled.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConnectGoogleCalendar(): Promise<void> {
    if (!session || gcalConnecting) return;
    setGcalConnecting(true);
    try {
      const r = await getGoogleCalendarAuthUrlWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data?.authUrl) {
        window.location.href = r.data.authUrl;
      } else {
        notify("error", "Connection failed", r.error?.message ?? "Unable to start Google Calendar OAuth.");
      }
    } catch {
      notify("error", "Connection failed", "Please try again.");
    } finally {
      setGcalConnecting(false);
    }
  }

  async function handleDisconnectGoogleCalendar(): Promise<void> {
    if (!session || gcalDisconn) return;
    setGcalDisconn(true);
    try {
      const r = await disconnectGoogleCalendarWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      setGcalStatus({ connected: false, email: null, expiresAt: null });
      notify("info", "Google Calendar disconnected", "Your calendar integration has been removed.");
    } catch {
      notify("error", "Disconnect failed", "Please try again.");
    } finally {
      setGcalDisconn(false);
    }
  }

  async function handleRequestConnection(integration: PortalIntegration): Promise<void> {
    if (!session || requesting === integration.provider) return;
    setRequesting(integration.provider);
    try {
      const r = await createPortalIntegrationRequestWithRefresh(session, {
        provider: integration.provider,
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.data) {
        notify("error", "Request failed", r.error?.message ?? "Please try again or contact support.");
        return;
      }
      const createdRequest = r.data;
      setIntegrations((current) => current.map((entry) => (
        entry.provider === integration.provider
          ? {
              ...entry,
              status: "requested",
              requestedAt: createdRequest.createdAt ?? entry.requestedAt,
              requestId: createdRequest.id,
              requestStatus: createdRequest.status as PortalIntegration["requestStatus"],
            }
          : entry
      )));
      notify("success", "Request sent", `We'll set up your ${integration.label} connection and notify you when it's ready.`);
    } catch {
      notify("error", "Request failed", "Please try again or contact support.");
    } finally {
      setRequesting(null);
    }
  }

  const gcalConnected  = gcalStatus?.connected === true;
  const requestedCount = useMemo(() => integrations.filter((item) => item.status === "requested").length, [integrations]);
  const connectedCount = useMemo(
    () => integrations.filter((item) => item.status === "connected").length || (gcalConnected ? 1 : 0),
    [integrations, gcalConnected]
  );
  const availableCount  = integrations.filter((i) => i.status === "available").length;
  const comingSoonCount = integrations.filter((i) => i.status === "coming_soon").length;

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
          { label: "Catalog Size",         value: String(integrations.length), color: "statCardAccent" },
          { label: "Available to Connect", value: String(availableCount),      color: "statCardBlue"   },
          { label: "Coming Soon",          value: String(comingSoonCount),     color: "statCardAmber"  },
          { label: "Live Connections",     value: String(connectedCount),      color: connectedCount > 0 ? "statCardGreen" : "statCard" },
          { label: "Setup Requests",       value: String(requestedCount),      color: requestedCount > 0 ? "statCardBlue" : "statCard" },
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
          The catalog and statuses on this page come from the backend. Google Calendar is self-serve; assisted integrations move through a real request workflow.
        </span>
      </div>

      {/* ── Google Calendar — real OAuth card ── */}
      <div className={cx("card", "mb16", "borderLeft3")} style={{ "--border-color": gcalConnected ? "var(--lime)" : "var(--b2)" } as React.CSSProperties}>
        <div className={cx("cardBodyPad", "pt16")}>
          <div className={cx("flexRow", "gap12", "mb10")}>
            <div className={cx("intIconBox", "dynBgColor", "dynBorderColor", "dynColor")} style={{ "--bg-color": "color-mix(in oklab, var(--lime) 15%, transparent)", "--border-color": "color-mix(in oklab, var(--lime) 30%, transparent)", "--color": "var(--lime)" } as React.CSSProperties}>
              G
            </div>
            <div className={cx("flex1")}>
              <div className={cx("fw700", "text12")}>Google Calendar</div>
              <span className={cx("text10", "colorMuted")}>Calendar · OAuth2</span>
            </div>
            {gcalConnected ? (
              <span className={cx("badge", "badgeGreen", "noShrink", "alignSelfStart")}>Connected</span>
            ) : (
              <div className={cx("dot8", "dotBgB3", "noShrink", "alignSelfCenter")} />
            )}
          </div>

          <div className={cx("text11", "colorMuted", "mb12")}>
            Sync scheduled meetings and milestone due dates to your Google Calendar automatically.
            {gcalConnected && gcalStatus?.email && (
              <span className={cx("colorGreen")}> Connected as <strong>{gcalStatus.email}</strong>.</span>
            )}
          </div>

          <div className={cx("flexRow", "gap8")}>
            {loading ? (
              <div className={cx("skeletonBlock")} style={{ width: 120, height: 28, borderRadius: 6 }} />
            ) : gcalConnected ? (
              <>
                <span className={cx("text11", "colorGreen", "flexRow", "alignCenter", "gap4", "mr4")}>
                  <Ic n="check" sz={11} c="var(--green)" /> Active
                </span>
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost")}
                  disabled={gcalDisconn}
                  onClick={() => void handleDisconnectGoogleCalendar()}
                >
                  {gcalDisconn ? "Disconnecting…" : "Disconnect"}
                </button>
              </>
            ) : (
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                disabled={gcalConnecting}
                onClick={() => void handleConnectGoogleCalendar()}
              >
                {gcalConnecting ? "Redirecting…" : "Connect Google Calendar"}
              </button>
            )}
          </div>
        </div>
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
          {integrations.filter((i) => i.provider !== "gcal").map((integration) => {
            const isComingSoon  = integration.status === "coming_soon";
            const isConnected   = integration.status === "connected";
            const isRequested   = integration.status === "requested";
            const isInSetup     = integration.requestStatus === "IN_PROGRESS";
            const visual = PRESENTATION[integration.provider] ?? { icon: integration.label.charAt(0).toUpperCase(), iconColor: "var(--muted2)" };
            const borderColor   = isConnected ? "var(--green)" : isRequested ? "var(--blue)" : "var(--b2)";
            const requestedLabel = isInSetup ? "In Setup" : "Requested";
            const requestedDate = formatShortDate(integration.requestedAt);
            const connectedDate = formatShortDate(integration.connectedAt);

            return (
              <div
                key={integration.provider}
                className={cx("card", "borderLeft3")} style={{ "--border-color": borderColor } as React.CSSProperties}
              >
                <div className={cx("cardBodyPad", "pt16")}>
                  <div className={cx("flexRow", "gap12", "mb10")}>
                    {/* Brand-tinted icon box */}
                    <div className={cx("intIconBox", "dynBgColor", "dynBorderColor", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${visual.iconColor} 15%, transparent)`, "--border-color": `color-mix(in oklab, ${visual.iconColor} 30%, transparent)`, "--color": visual.iconColor } as React.CSSProperties}>
                      {visual.icon}
                    </div>

                    <div className={cx("flex1")}>
                      <div className={cx("fw700", "text12")}>{integration.label}</div>
                      <span className={cx("text10", "colorMuted")}>{integration.category}</span>
                    </div>

                    {/* Status badge */}
                    {isConnected ? (
                      <span className={cx("badge", "badgeGreen", "noShrink", "alignSelfStart")}>Connected</span>
                    ) : isRequested ? (
                      <span className={cx("badge", isInSetup ? "badgeAccent" : "badgeBlue", "noShrink", "alignSelfStart")}>{requestedLabel}</span>
                    ) : isComingSoon ? (
                      <span className={cx("badge", "badgeAmber", "noShrink", "alignSelfStart")}>Coming Soon</span>
                    ) : (
                      <div className={cx("dot8", "dotBgB3", "noShrink", "alignSelfCenter")} />
                    )}
                  </div>

                  <div className={cx("text11", "colorMuted", "mb12")}>
                    {integration.description}
                  </div>

                  {(isConnected || isRequested) && (
                    <div className={cx("text10", "colorMuted", "mb12")}>
                      {isConnected && connectedDate ? `Live since ${connectedDate}.` : null}
                      {isRequested && requestedDate ? `${requestedLabel} on ${requestedDate}.` : null}
                      {isInSetup ? " Our delivery team is handling the configuration." : null}
                    </div>
                  )}

                  <div className={cx("flexRow", "gap8")}>
                    {isComingSoon ? (
                      <button type="button" className={cx("btnSm", "btnGhost", "opacity50")} disabled>
                        Notify Me
                      </button>
                    ) : isConnected ? (
                      <span className={cx("badge", "badgeGreen")}>Live</span>
                    ) : isRequested ? (
                      <span className={cx("badge", isInSetup ? "badgeAccent" : "badgeBlue")}>{requestedLabel}</span>
                    ) : (
                      <button
                        type="button"
                        className={cx("btnSm", "btnAccent")}
                        disabled={requesting === integration.provider}
                        onClick={() => void handleRequestConnection(integration)}
                      >
                        {requesting === integration.provider ? "Requesting…" : "Request Connection"}
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
