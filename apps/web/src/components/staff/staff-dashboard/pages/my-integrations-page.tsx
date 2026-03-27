"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getMyProfile, type StaffProfile } from "../../../../lib/api/staff/profile";
import {
  loadAdminIntegrationProvidersWithRefresh,
  loadAdminIntegrationRequestsWithRefresh,
  updateAdminIntegrationRequestWithRefresh,
  type AdminIntegrationProvider,
  type AdminIntegrationRequestItem,
} from "../../../../lib/api/admin/integrations";
import { cx } from "../style";

type PageProps = {
  isActive: boolean;
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
};

type QueueFilter = "open" | "all";

const OPEN_REQUEST_STATUSES = new Set(["REQUESTED", "IN_PROGRESS"]);

const CATEGORY_TONES: Record<string, string> = {
  Productivity: "itgCatProductivity",
  Communication: "itgCatCommunication",
  Design: "itgCatDesign",
  Development: "itgCatDevelopment",
};

function formatDateShort(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function ProviderIcon({ provider }: { provider: AdminIntegrationProvider }) {
  const key = provider.key.toLowerCase();
  if (key === "jira") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3L3 12l4.5 4.5L12 12l4.5 4.5L21 12 12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7.5 16.5L12 12l4.5 4.5L12 21l-4.5-4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (key === "clickup") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 18l5-6 5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 9l6-4 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (key === "asana") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="7.5" cy="15.5" r="2.2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16.5" cy="15.5" r="2.2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="8.5" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (key === "slack") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 3a2 2 0 1 0 0 4h2V3a2 2 0 0 0-2 0z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M15 3a2 2 0 1 0 0 4h2a2 2 0 0 0-2-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M3 9a2 2 0 1 0 4 0V7H3a2 2 0 0 0 0 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M21 15a2 2 0 1 0-4 0v2a2 2 0 0 0 4-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M15 21a2 2 0 1 0 0-4h-2v2a2 2 0 0 0 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 21a2 2 0 1 0 0-4H7a2 2 0 0 0 2 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (key === "gcal") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 2v4M8 2v4M3 9h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function statusBadgeClass(status: AdminIntegrationRequestItem["status"]): string {
  if (status === "IN_PROGRESS") return "badgeAccent";
  if (status === "COMPLETED") return "badgeGreen";
  if (status === "REJECTED" || status === "CANCELLED") return "badgeRed";
  return "badgePurple";
}

function statusLabel(status: AdminIntegrationRequestItem["status"]): string {
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "COMPLETED") return "Completed";
  if (status === "REJECTED") return "Rejected";
  if (status === "CANCELLED") return "Cancelled";
  return "Requested";
}

function ProviderCard({
  provider,
  openCount,
  latestCompletedAt,
  onOpenQueue,
}: {
  provider: AdminIntegrationProvider;
  openCount: number;
  latestCompletedAt: string | null;
  onOpenQueue: () => void;
}) {
  const isComingSoon = provider.kind === "coming_soon" || provider.availabilityStatus === "coming_soon";
  const isOAuth = provider.kind === "oauth";
  const completedLabel = formatDateShort(latestCompletedAt);
  const toneClass = CATEGORY_TONES[provider.category] ?? "";

  return (
    <article className={cx("itgCard")}>
      <div className={cx("itgCardHeader")}>
        <div className={cx("itgCardIcon")}><ProviderIcon provider={provider} /></div>
        <div className={cx("itgCardMeta")}>
          <div className={cx("itgCardName")}>{provider.label}</div>
          <span className={cx("itgCardCategory", toneClass)}>{provider.category}</span>
        </div>
      </div>

      <div className={cx("itgCardDesc")}>{provider.description}</div>

      <div className={cx("itgProviderMeta")}>
        {isComingSoon ? (
          <span className={cx("badge", "badgeAmber")}>Coming Soon</span>
        ) : isOAuth ? (
          <span className={cx("badge", "badgeMuted")}>OAuth Self-Serve</span>
        ) : (
          <span className={cx("badge", "badgePurple")}>Assisted Setup</span>
        )}
        {openCount > 0 ? (
          <span className={cx("badge", "badgeAccent")}>{`${openCount} Open`}</span>
        ) : null}
      </div>

      <div className={cx("itgCardFooter")}>
        {openCount > 0 ? (
          <button type="button" className={cx("itgConnectBtn")} onClick={onOpenQueue}>
            View Active Requests
          </button>
        ) : (
          <div className={cx("itgCardFootText")}>
            {completedLabel ? `Last completed ${completedLabel}` : "No active setup requests."}
          </div>
        )}
      </div>
    </article>
  );
}

function RequestQueueItem({
  item,
  busy,
  onUpdateStatus,
}: {
  item: AdminIntegrationRequestItem;
  busy: boolean;
  onUpdateStatus: (requestId: string, status: AdminIntegrationRequestItem["status"]) => void;
}) {
  const requestedLabel = formatDateShort(item.requestedAt) ?? "Unknown date";
  const canStart = item.status === "REQUESTED";
  const canComplete = item.status === "IN_PROGRESS";
  const canReject = item.status === "REQUESTED" || item.status === "IN_PROGRESS";

  return (
    <article className={cx("itgQueueItem")}>
      <div className={cx("itgQueueItemTop")}>
        <div className={cx("itgQueueTitleWrap")}>
          <div className={cx("itgQueueTitle")}>{item.providerLabel}</div>
          <div className={cx("itgQueueSub")}>
            {`${item.clientName} · Requested ${requestedLabel}`}
          </div>
        </div>
        <span className={cx("badge", statusBadgeClass(item.status))}>{statusLabel(item.status)}</span>
      </div>

      {(item.notes ?? "").trim().length > 0 ? (
        <div className={cx("itgQueueNotes")}>{item.notes}</div>
      ) : null}

      {item.rejectedReason ? (
        <div className={cx("itgQueueNotes")}>{`Reason: ${item.rejectedReason}`}</div>
      ) : null}

      <div className={cx("itgQueueActions")}>
        {canStart ? (
          <button
            type="button"
            className={cx("itgQueueBtn", "itgQueueBtnPrimary")}
            disabled={busy}
            onClick={() => onUpdateStatus(item.id, "IN_PROGRESS")}
          >
            {busy ? "Updating..." : "Start Setup"}
          </button>
        ) : null}
        {canComplete ? (
          <button
            type="button"
            className={cx("itgQueueBtn", "itgQueueBtnPrimary")}
            disabled={busy}
            onClick={() => onUpdateStatus(item.id, "COMPLETED")}
          >
            {busy ? "Updating..." : "Mark Complete"}
          </button>
        ) : null}
        {canReject ? (
          <button
            type="button"
            className={cx("itgQueueBtn", "itgQueueBtnGhost")}
            disabled={busy}
            onClick={() => onUpdateStatus(item.id, "REJECTED")}
          >
            {busy ? "Updating..." : "Reject"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function MyIntegrationsPage({ isActive, session, onNotify }: PageProps) {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [providers, setProviders] = useState<AdminIntegrationProvider[]>([]);
  const [requests, setRequests] = useState<AdminIntegrationRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("open");

  const loadData = useCallback(async (showRefreshing = false) => {
    if (!session) {
      setLoading(false);
      return;
    }

    if (showRefreshing) setRefreshing(true);
    const [profileResult, providerResult, requestsResult] = await Promise.all([
      getMyProfile(session),
      loadAdminIntegrationProvidersWithRefresh(session, { isClientVisible: "true" }),
      loadAdminIntegrationRequestsWithRefresh(session),
    ]);

    if (profileResult.nextSession) saveSession(profileResult.nextSession);
    if (providerResult.nextSession) saveSession(providerResult.nextSession);
    if (requestsResult.nextSession) saveSession(requestsResult.nextSession);

    if (profileResult.data) setProfile(profileResult.data);
    if (providerResult.unauthorized || requestsResult.unauthorized) {
      onNotify?.("error", "Your session expired. Please sign in again.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (providerResult.error) {
      onNotify?.("error", providerResult.error.message ?? "Unable to load providers.");
    } else {
      setProviders(providerResult.data ?? []);
    }

    if (requestsResult.error) {
      onNotify?.("error", requestsResult.error.message ?? "Unable to load integration requests.");
    } else {
      const sorted = [...(requestsResult.data ?? [])].sort((a, b) => (
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      ));
      setRequests(sorted);
    }

    setLoading(false);
    setRefreshing(false);
  }, [onNotify, session]);

  useEffect(() => {
    if (!isActive) return;
    const timerId = window.setTimeout(() => {
      void loadData(false);
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [isActive, loadData]);

  const firstName = profile?.firstName ?? session?.user.email?.split("@")[0] ?? "there";
  const categories = useMemo(() => {
    const values = Array.from(new Set(providers.map((provider) => provider.category))).sort();
    return ["all", ...values];
  }, [providers]);

  const requestsByProvider = useMemo(() => {
    const map = new Map<string, AdminIntegrationRequestItem[]>();
    requests.forEach((request) => {
      const current = map.get(request.providerKey) ?? [];
      current.push(request);
      map.set(request.providerKey, current);
    });
    return map;
  }, [requests]);

  const filteredProviders = useMemo(() => {
    if (activeCategory === "all") return providers;
    return providers.filter((provider) => provider.category === activeCategory);
  }, [activeCategory, providers]);

  const openRequests = useMemo(
    () => requests.filter((item) => OPEN_REQUEST_STATUSES.has(item.status)),
    [requests]
  );
  const inProgressCount = useMemo(
    () => requests.filter((item) => item.status === "IN_PROGRESS").length,
    [requests]
  );
  const completedCount = useMemo(
    () => requests.filter((item) => item.status === "COMPLETED").length,
    [requests]
  );

  const queueItems = queueFilter === "open" ? openRequests : requests;

  const handleUpdateStatus = useCallback(async (
    requestId: string,
    nextStatus: AdminIntegrationRequestItem["status"]
  ) => {
    if (!session || busyRequestId) return;
    setBusyRequestId(requestId);
    const result = await updateAdminIntegrationRequestWithRefresh(session, requestId, { status: nextStatus });
    if (result.nextSession) saveSession(result.nextSession);
    if (result.unauthorized) {
      onNotify?.("error", "Your session expired. Please sign in again.");
      setBusyRequestId(null);
      return;
    }
    if (result.error) {
      onNotify?.("error", result.error.message ?? "Unable to update integration request.");
      setBusyRequestId(null);
      return;
    }
    onNotify?.("success", `Request moved to ${statusLabel(nextStatus)}.`);
    setBusyRequestId(null);
    void loadData(true);
  }, [busyRequestId, loadData, onNotify, session]);

  const handleOpenQueue = useCallback(() => {
    setQueueFilter("open");
    const node = document.getElementById("staff-integration-queue");
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-integrations">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Integrations</div>
        <h1 className={cx("pageTitleText")}>My Integrations</h1>
        <p className={cx("pageSubtitleText", "mb12")}>
          {`Operational control for provider catalog and setup queue, ${firstName}.`}
        </p>

        <div className={cx("itgHeaderActions")}>
          <button type="button" className={cx("itgHeaderBtn")} onClick={() => void loadData(true)} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className={cx("itgStatsGrid")}>
        <div className={cx("itgStatCard")}>
          <div className={cx("itgStatLabel")}>Providers</div>
          <div className={cx("itgStatValue")}>{providers.length}</div>
        </div>
        <div className={cx("itgStatCard")}>
          <div className={cx("itgStatLabel")}>Open Requests</div>
          <div className={cx("itgStatValue", openRequests.length > 0 && "itgStatToneAccent")}>{openRequests.length}</div>
        </div>
        <div className={cx("itgStatCard")}>
          <div className={cx("itgStatLabel")}>In Progress</div>
          <div className={cx("itgStatValue", inProgressCount > 0 && "itgStatToneBlue")}>{inProgressCount}</div>
        </div>
        <div className={cx("itgStatCard")}>
          <div className={cx("itgStatLabel")}>Completed</div>
          <div className={cx("itgStatValue", completedCount > 0 && "itgStatToneGreen")}>{completedCount}</div>
        </div>
      </div>

      <div className={cx("itgFilterRow")}>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={cx("itgFilterBtn", activeCategory === category && "itgFilterBtnActive")}
            onClick={() => setActiveCategory(category)}
          >
            {category === "all" ? "All" : category}
            {category !== "all" ? (
              <span className={cx("itgFilterCount")}>{providers.filter((provider) => provider.category === category).length}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className={cx("itgGrid")}>
        {filteredProviders.map((provider) => {
          const providerRequests = requestsByProvider.get(provider.key) ?? [];
          const openCount = providerRequests.filter((request) => OPEN_REQUEST_STATUSES.has(request.status)).length;
          const latestCompleted = providerRequests.find((request) => request.status === "COMPLETED");
          return (
            <ProviderCard
              key={provider.id}
              provider={provider}
              openCount={openCount}
              latestCompletedAt={latestCompleted?.completedAt ?? latestCompleted?.requestedAt ?? null}
              onOpenQueue={handleOpenQueue}
            />
          );
        })}
      </div>

      <section className={cx("itgQueueSection")} id="staff-integration-queue">
        <div className={cx("itgQueueHeader")}>
          <h2 className={cx("itgQueueHeading")}>Integration Request Queue</h2>
          <div className={cx("itgQueueFilterRow")}>
            <button
              type="button"
              className={cx("itgFilterBtn", queueFilter === "open" && "itgFilterBtnActive")}
              onClick={() => setQueueFilter("open")}
            >
              Open
            </button>
            <button
              type="button"
              className={cx("itgFilterBtn", queueFilter === "all" && "itgFilterBtnActive")}
              onClick={() => setQueueFilter("all")}
            >
              All
            </button>
          </div>
        </div>

        {queueItems.length === 0 ? (
          <div className={cx("itgQueueEmpty")}>
            {queueFilter === "open" ? "No open integration requests right now." : "No integration request history yet."}
          </div>
        ) : (
          <div className={cx("itgQueueList")}>
            {queueItems.map((item) => (
              <RequestQueueItem
                key={item.id}
                item={item}
                busy={busyRequestId === item.id}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
