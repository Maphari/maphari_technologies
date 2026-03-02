"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";

type ActivityType =
  | "viewed_milestone"
  | "approved_milestone"
  | "viewed_invoice"
  | "downloaded_file"
  | "uploaded_file"
  | "logged_in"
  | "sent_message";

type ActivityEvent = {
  id: number;
  clientId: number;
  client: string;
  type: ActivityType;
  label: string;
  detail: string;
  time: string;
  ts: number;
  read: boolean;
  priority: boolean;
};

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
};

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS" },
  { id: 2, name: "Kestrel Capital", avatar: "KC" },
  { id: 3, name: "Mira Health", avatar: "MH" },
  { id: 4, name: "Dune Collective", avatar: "DC" },
  { id: 5, name: "Okafor & Sons", avatar: "OS" }
];

const initialFeed: ActivityEvent[] = [
  { id: 1, clientId: 1, client: "Volta Studios", type: "viewed_milestone", label: "Viewed milestone", detail: "Logo & Visual Direction", time: "2 min ago", ts: 1, read: false, priority: true },
  { id: 2, clientId: 3, client: "Mira Health", type: "downloaded_file", label: "Downloaded file", detail: "Mobile wireframes v2.pdf", time: "14 min ago", ts: 2, read: false, priority: false },
  { id: 3, clientId: 1, client: "Volta Studios", type: "viewed_invoice", label: "Viewed invoice", detail: "INV-0041 · R8,750", time: "1h ago", ts: 3, read: true, priority: false },
  { id: 4, clientId: 2, client: "Kestrel Capital", type: "logged_in", label: "Logged in", detail: "First login in 6 days", time: "2h ago", ts: 4, read: false, priority: true },
  { id: 5, clientId: 5, client: "Okafor & Sons", type: "approved_milestone", label: "Approved milestone", detail: "Data Visualisation Suite", time: "3h ago", ts: 5, read: true, priority: false },
  { id: 6, clientId: 3, client: "Mira Health", type: "viewed_milestone", label: "Viewed milestone", detail: "Mobile Wireframes — In Revision", time: "4h ago", ts: 6, read: true, priority: false },
  { id: 7, clientId: 4, client: "Dune Collective", type: "logged_in", label: "Logged in", detail: "Last login 8 days ago", time: "Yesterday 4:55 PM", ts: 7, read: false, priority: true },
  { id: 8, clientId: 2, client: "Kestrel Capital", type: "viewed_milestone", label: "Viewed milestone", detail: "Campaign Strategy Deck", time: "Yesterday 3:30 PM", ts: 8, read: true, priority: false },
  { id: 9, clientId: 4, client: "Dune Collective", type: "viewed_milestone", label: "Viewed milestone", detail: "Type & Grid System", time: "Yesterday 4:57 PM", ts: 9, read: false, priority: false },
  { id: 10, clientId: 1, client: "Volta Studios", type: "uploaded_file", label: "Uploaded file", detail: "Brand reference — additional assets.zip", time: "Feb 21", ts: 10, read: true, priority: false },
  { id: 11, clientId: 5, client: "Okafor & Sons", type: "viewed_invoice", label: "Viewed invoice", detail: "INV-0039 · R2,900", time: "Feb 20", ts: 11, read: true, priority: false },
  { id: 12, clientId: 3, client: "Mira Health", type: "sent_message", label: "Sent message", detail: "Re: booking flow revision feedback", time: "Feb 19", ts: 12, read: true, priority: false }
];

const typeConfig: Record<ActivityType, { icon: string; label: string; iconClass: string; toneClass: string }> = {
  viewed_milestone: { icon: "◎", label: "Milestone view", iconClass: "paTypeViewedMilestone", toneClass: "paToneViewedMilestone" },
  approved_milestone: { icon: "✓", label: "Approved", iconClass: "paTypeApprovedMilestone", toneClass: "paToneApprovedMilestone" },
  viewed_invoice: { icon: "₹", label: "Invoice view", iconClass: "paTypeViewedInvoice", toneClass: "paToneViewedInvoice" },
  downloaded_file: { icon: "↓", label: "Download", iconClass: "paTypeDownloadedFile", toneClass: "paToneDownloadedFile" },
  uploaded_file: { icon: "↑", label: "Upload", iconClass: "paTypeUploadedFile", toneClass: "paToneUploadedFile" },
  logged_in: { icon: "◉", label: "Login", iconClass: "paTypeLoggedIn", toneClass: "paToneLoggedIn" },
  sent_message: { icon: "✉", label: "Message", iconClass: "paTypeSentMessage", toneClass: "paToneSentMessage" }
};

const clientToneClass: Record<number, string> = {
  1: "paClientTone1",
  2: "paClientTone2",
  3: "paClientTone3",
  4: "paClientTone4",
  5: "paClientTone5"
};

const portalStats: Record<
  number,
  { sessions: number; lastLogin: string; avgSessionMin: number; topAction: string; activeDays: number }
> = {
  1: { sessions: 12, lastLogin: "Today 8:52 AM", avgSessionMin: 6, topAction: "Viewed milestones", activeDays: 5 },
  2: { sessions: 3, lastLogin: "Today 2:10 AM", avgSessionMin: 2, topAction: "Viewed invoices", activeDays: 1 },
  3: { sessions: 8, lastLogin: "Yesterday", avgSessionMin: 9, topAction: "Downloaded files", activeDays: 4 },
  4: { sessions: 2, lastLogin: "Yesterday 4:55 PM", avgSessionMin: 4, topAction: "Viewed milestones", activeDays: 2 },
  5: { sessions: 11, lastLogin: "Feb 20", avgSessionMin: 5, topAction: "Approved milestones", activeDays: 6 }
};

type GroupKey = "Today" | "Yesterday" | "Earlier";

function heatLevelClass(activity: number): string {
  if (activity <= 0) return "paHeatLevel0";
  if (activity === 1) return "paHeatLevel1";
  if (activity === 2) return "paHeatLevel2";
  if (activity === 3) return "paHeatLevel3";
  if (activity === 4) return "paHeatLevel4";
  return "paHeatLevel5";
}

export function PortalActivityPage({ isActive }: { isActive: boolean }) {
  const [feed, setFeed] = useState(initialFeed);
  const [clientFilter, setClientFilter] = useState<"all" | number>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ActivityType>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [liveIndicator, setLiveIndicator] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => setLiveIndicator((value) => !value), 1200);
    return () => window.clearInterval(interval);
  }, []);

  const markAllRead = () => setFeed((previous) => previous.map((event) => ({ ...event, read: true })));
  const markRead = (id: number) =>
    setFeed((previous) =>
      previous.map((event) => (event.id === id ? { ...event, read: true } : event))
    );

  const filtered = useMemo(() => {
    return feed
      .filter((event) => (clientFilter === "all" ? true : event.clientId === clientFilter))
      .filter((event) => (typeFilter === "all" ? true : event.type === typeFilter))
      .filter((event) => (showUnreadOnly ? !event.read : true));
  }, [clientFilter, feed, showUnreadOnly, typeFilter]);

  const unreadCount = feed.filter((event) => !event.read).length;
  const priorityCount = feed.filter((event) => event.priority && !event.read).length;

  const groupedByTime = useMemo(() => {
    return filtered.reduce<Record<GroupKey, ActivityEvent[]>>(
      (accumulator, event) => {
        const group: GroupKey = event.time.includes("ago") || event.time.includes("h ago")
          ? "Today"
          : event.time.startsWith("Yesterday")
            ? "Yesterday"
            : "Earlier";
        accumulator[group].push(event);
        return accumulator;
      },
      { Today: [], Yesterday: [], Earlier: [] }
    );
  }, [filtered]);

  const stats = selectedClient ? portalStats[selectedClient] : null;
  const selClient = selectedClient ? clients.find((client) => client.id === selectedClient) : null;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-portal-activity">
      <div className={cx("pageHeaderBar", "borderB", "paHeaderBar")}>
        <div className={cx("flexBetween", "mb20", "paHeaderTop")}>
          <div>
            <div className={cx("pageEyebrow")}>Staff Dashboard / Client Intelligence</div>
            <div className={cx("flexRow", "gap12", "paHeaderTitleRow")}>
              <h1 className={cx("pageTitle")}>Portal Activity</h1>
              <div className={cx("paLiveIndicator")}>
                <div className={cx("paLiveDot", liveIndicator ? "paLiveDotOn" : "paLiveDotDim")} />
                <span className={cx("text10", "colorAccent", "paLiveLabel")}>LIVE</span>
              </div>
            </div>
          </div>
          <div className={cx("flexRow", "gap24", "paTopStats")}>
            {[
              { label: "Unread", value: unreadCount, toneClass: unreadCount > 0 ? "paToneRed" : "paToneMuted" },
              { label: "Priority", value: priorityCount, toneClass: priorityCount > 0 ? "paToneOrange" : "paToneMuted" },
              { label: "Today", value: feed.filter((event) => event.time.includes("ago") || event.time.includes("h ago")).length, toneClass: "paToneSoft" }
            ].map((stat) => (
              <div key={stat.label} className={cx("textRight")}>
                <div className={cx("text11", "colorMuted2", "uppercase", "mb4", "paStatLabel")}>{stat.label}</div>
                <div className={cx("fontDisplay", "fw800", "paStatValue", stat.toneClass)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("filterRow", "mb14")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter client activity"
            value={clientFilter === "all" ? "all" : String(clientFilter)}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "all") {
                setClientFilter("all");
                setSelectedClient(null);
                return;
              }
              const clientId = Number.parseInt(value, 10);
              setClientFilter(clientId);
              setSelectedClient(clientId);
            }}
          >
            <option value="all">All clients</option>
            {clients.map((client) => {
              const clientUnread = feed.filter((event) => event.clientId === client.id && !event.read).length;
              return (
                <option key={client.id} value={String(client.id)}>
                  {client.name}{clientUnread > 0 ? ` (${clientUnread} unread)` : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div className={cx("flexRow", "gap8", "flexWrap", "paToolbar")}> 
          <select
            className={cx("filterSelect")}
            aria-label="Filter activity type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as "all" | ActivityType)}
          >
            <option value="all">All activity</option>
            <option value="viewed_milestone">Viewed milestone</option>
            <option value="approved_milestone">Approved milestone</option>
            <option value="viewed_invoice">Viewed invoice</option>
            <option value="downloaded_file">Downloaded file</option>
            <option value="logged_in">Logged in</option>
          </select>
          <div className={cx("flexRow", "gap10", "paToolbarRight")}>
            <select
              className={cx("filterSelect")}
              aria-label="Unread activity filter"
              value={showUnreadOnly ? "unread" : "all"}
              onChange={(event) => setShowUnreadOnly(event.target.value === "unread")}
            >
              <option value="all">All activity</option>
              <option value="unread">Unread only</option>
            </select>
            {unreadCount > 0 ? (
              <button
                type="button"
                className={cx("paMarkBtn", "uppercase", "paMarkBtnGhost")}
                onClick={markAllRead}
              >
                Mark all read
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className={cx(selectedClient ? "paLayoutWithPanel" : "paLayout")}> 
        <div className={cx("paFeedPane", selectedClient !== null && "paFeedPaneWithPanel")}>
          {filtered.length === 0 ? <div className={cx("textCenter", "text12", "paEmptyState")}>No activity matches your filters.</div> : null}
          {(["Today", "Yesterday", "Earlier"] as GroupKey[]).map((group) => {
            const events = groupedByTime[group];
            if (!events?.length) return null;
            return (
              <div key={group} className={cx("mb24")}> 
                <div className={cx("flexRow", "gap12", "mb12")}> 
                  <span className={cx("text10", "colorMuted2", "uppercase", "paGroupLabel")}>{group}</span>
                  <div className={cx("flex1", "paGroupLine")} />
                </div>
                <div className={cx("flexCol", "gap6")}> 
                  {events.map((event) => {
                    const tCfg = typeConfig[event.type];
                    return (
                      <div
                        key={event.id}
                        className={cx("paEventRow", "flexRow", "gap14", event.read ? "paEventRead" : "paEventUnread")}
                        onClick={() => markRead(event.id)}
                      >
                        <div
                          className={cx(
                            "paUnreadDot",
                            event.read ? "paUnreadDotRead" : event.priority ? "paUnreadDotPriority" : "paUnreadDotActive"
                          )}
                        />
                        <div className={cx("paTypeIcon", tCfg.iconClass)}>{tCfg.icon}</div>
                        <div className={cx("flex1", "minW0")}>
                          <div className={cx("flexRow", "gap8", "paEventHead")}> 
                            <span className={cx("text11", "fw600", clientToneClass[event.clientId])}>{event.client}</span>
                            <span className={cx("text11", "colorMuted2")}>{event.label}</span>
                            {event.priority && !event.read ? <span className={cx("paNotableBadge")}>Notable</span> : null}
                          </div>
                          <div className={cx("text12", "colorMuted", "truncate")}>{event.detail}</div>
                        </div>
                        <span className={cx("text10", "noShrink", "colorMuted2")}>{event.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {selectedClient && stats ? (
          <div className={cx("p20", "paPanel", clientToneClass[selectedClient])}>
            <div className={cx("mb20")}> 
              <div className={cx("flexRow", "gap10", "mb6")}>
                <div className={cx("paClientAvatar")}>{selClient?.avatar}</div>
                <div>
                  <div className={cx("fontDisplay", "fw800", "paPanelTitle")}>{selClient?.name}</div>
                  <div className={cx("text10", "colorMuted2")}>Portal stats · last 30 days</div>
                </div>
              </div>
            </div>

            <div className={cx("formGrid2", "mb20", "paStatsGrid")}>
              {[
                { label: "Sessions", value: stats.sessions, toneClass: "paCurrentTone" },
                { label: "Active days", value: stats.activeDays, toneClass: "paCurrentTone" },
                { label: "Avg session", value: `${stats.avgSessionMin}m`, toneClass: "paToneSoft" },
                { label: "Last login", value: stats.lastLogin, toneClass: "paToneSoft" }
              ].map((stat) => (
                <div key={stat.label} className={cx("paStatCard")}>
                  <div className={cx("text10", "colorMuted2", "uppercase", "mb4", "paMiniLabel")}>{stat.label}</div>
                  <div className={cx("text14", "fw600", stat.toneClass)}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div className={cx("paStatCard", "mb20")}>
              <div className={cx("uppercase", "mb4", "paMiniLabel")}>Most common action</div>
              <div className={cx("text13", "paCurrentTone")}>{stats.topAction}</div>
            </div>

            <div className={cx("mb20")}>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb10", "paSectionLabel")}>Activity · last 7 days</div>
              <div className={cx("flexRow", "gap4")}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
                  const activity = [3, 0, 5, 2, 4, 0, 1][index];
                  return (
                    <div key={day} className={cx("flex1", "flexCol", "flexCenter", "gap4")}>
                      <div className={cx("wFull", "flexCenter", "paHeatCell", heatLevelClass(activity))}>
                        {activity > 0 ? <span className={cx("text10", "paCurrentTone")}>{activity}</span> : null}
                      </div>
                      <span className={cx("paDayLabel")}>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb10", "paSectionLabel")}>Recent events</div>
              {feed
                .filter((event) => event.clientId === selectedClient)
                .slice(0, 4)
                .map((event, index, rows) => {
                  const tCfg = typeConfig[event.type];
                  const isLast = index === rows.length - 1;
                  return (
                    <div key={event.id} className={cx("flexRow", "gap10", "paRecentRow", isLast && "paRecentRowLast")}>
                      <span className={cx("text12", "noShrink", tCfg.toneClass)}>{tCfg.icon}</span>
                      <div className={cx("flex1", "minW0")}>
                        <div className={cx("text11", "colorMuted", "truncate")}>{event.detail}</div>
                        <div className={cx("mt4", "paRecentTime")}>{event.time}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
