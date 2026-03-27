"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { StaffEmptyState, EmptyIcons } from "../empty-state";
import type { AuthSession } from "../../../../lib/auth/session";
import { getStaffAllComms } from "../../../../lib/api/staff/clients";

// ── SVG icons ─────────────────────────────────────────────────────
function IcoMessage() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
function IcoMilestone() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 2v12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M3 3h8l-2 3.5L11 10H3" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
function IcoInvoice() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IcoCall() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5.5 2H3.5A1 1 0 0 0 2.5 3c0 6.075 4.925 11 11 11a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1l-2.5-.5a1 1 0 0 0-1 .4l-.8 1C7.9 9.6 6.4 8.1 5.6 6.8l1-.8a1 1 0 0 0 .4-1L6.5 3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
function IcoFile() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M9 1v5h5" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────
type ViewMode  = "client" | "date";
type EventType = "message" | "milestone" | "invoice" | "call" | "file";
type SortBy    = "recent" | "oldest" | "client";

type TimelineEvent = {
  id:         string;
  clientId:   string;
  clientName: string;
  type:       EventType;
  direction:  string; // kept as raw string — only used for direction chip logic
  title:      string;
  excerpt:    string;
  occurredAt: string;
  dateLabel:  string;
  timeLabel:  string;
};

// ── Config ─────────────────────────────────────────────────────────
const TYPE_ICONS: Record<EventType, React.ReactNode> = {
  message:   <IcoMessage />,
  milestone: <IcoMilestone />,
  invoice:   <IcoInvoice />,
  call:      <IcoCall />,
  file:      <IcoFile />,
};

const typeConfig: Record<EventType, { label: string; iconClass: string; chipClass: string }> = {
  message:   { label: "Message",   iconClass: "commsTypeMessage",   chipClass: "staffChipAccent" },
  milestone: { label: "Milestone", iconClass: "commsTypeMilestone", chipClass: "staffChipGreen" },
  invoice:   { label: "Invoice",   iconClass: "commsTypeInvoice",   chipClass: "staffChipAmber" },
  call:      { label: "Call",      iconClass: "commsTypeCall",      chipClass: "staffChipPurple" },
  file:      { label: "File",      iconClass: "commsTypeFile",      chipClass: "staffChip" },
};

const TYPE_PILLS: { key: EventType | "all"; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "message",   label: "Messages" },
  { key: "call",      label: "Calls" },
  { key: "milestone", label: "Milestones" },
  { key: "invoice",   label: "Invoices" },
  { key: "file",      label: "Files" },
];

const SORT_LABELS: Record<SortBy, string> = {
  recent: "Recent ↓",
  oldest: "Oldest ↑",
  client: "Client A–Z",
};

const AVATAR_TONES = [
  "clientAvatarToneAccent",
  "clientAvatarToneAmber",
  "clientAvatarTonePurple",
  "clientAvatarToneGreen",
] as const;

// ── Helpers ────────────────────────────────────────────────────────
function normalizeType(value: string): EventType {
  if (
    value === "message" || value === "milestone" || value === "invoice" ||
    value === "call"    || value === "file"
  ) return value;
  return "message";
}

function normalizeDirection(value: string): string {
  if (value === "inbound" || value === "outbound" || value === "both") return value;
  return "outbound";
}

function laneAvatarTone(clientId: string): string {
  let h = 0;
  for (let i = 0; i < clientId.length; i++) h = (h * 31 + clientId.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

function clientInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function directionChipClass(direction: string): string | null {
  if (direction === "inbound") return "staffChipGreen";
  if (direction === "both")    return "staffChipPurple";
  return null; // outbound: no chip
}

// ── Component ──────────────────────────────────────────────────────
export function CommunicationHistoryPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [allEvents, setAllEvents]           = useState<TimelineEvent[]>([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [viewMode, setViewMode]             = useState<ViewMode>("client");
  const [activeType, setActiveType]         = useState<EventType | "all">("all");
  const [search, setSearch]                 = useState("");
  const [sortBy, setSortBy]                 = useState<SortBy>("recent");
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId]         = useState<string | null>(null);

  const loadComms = useCallback(async (background: boolean) => {
    if (!session) { setLoading(false); return; }
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const r = await getStaffAllComms(session);
      if (r.error) {
        setError(r.error.message ?? "Failed to load communication history.");
        setAllEvents([]);
        return;
      }
      const mapped = (r.data ?? []).map((log): TimelineEvent => {
        const type      = normalizeType(log.type);
        const direction = normalizeDirection(log.direction);
        const dt        = new Date(log.occurredAt);
        const fallbackExcerpt = `${direction === "inbound" ? "Received" : direction === "both" ? "Joint" : "Sent"} ${typeConfig[type].label.toLowerCase()}${log.fromName ? ` from ${log.fromName}` : ""}`;
        return {
          id:         log.id,
          clientId:   log.clientId,
          clientName: log.clientName,
          type,
          direction,
          title:      (log.subject ?? "").trim()      || `${typeConfig[type].label} event`,
          excerpt:    (log.actionLabel ?? "").trim()   || fallbackExcerpt,
          occurredAt: dt.toISOString(),
          dateLabel:  dt.toLocaleDateString(undefined, { year: "numeric", day: "numeric", month: "short" }),
          timeLabel:  dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        };
      });
      setAllEvents(mapped);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load communication history.");
      setAllEvents([]);
    } finally {
      if (background) setRefreshing(false);
      else setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!isActive) return;
    void loadComms(false);
  }, [isActive, loadComms]);

  // ── Derived data ──────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    return allEvents
      .filter((e) => activeType === "all" || e.type === activeType)
      .filter((e) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.excerpt.toLowerCase().includes(q) ||
          e.clientName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "client") return a.clientName.localeCompare(b.clientName);
        const delta = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
        return sortBy === "recent" ? -delta : delta;
      });
  }, [allEvents, activeType, search, sortBy]);

  const clientGroups = useMemo(() => {
    const groups = new Map<string, { clientName: string; maxOccurredAt: number; events: TimelineEvent[] }>();
    filteredEvents.forEach((e) => {
      const existing = groups.get(e.clientId);
      const ts = new Date(e.occurredAt).getTime();
      if (existing) {
        existing.events.push(e);
        if (ts > existing.maxOccurredAt) existing.maxOccurredAt = ts;
      } else {
        groups.set(e.clientId, { clientName: e.clientName, maxOccurredAt: ts, events: [e] });
      }
    });
    return Array.from(groups.entries())
      .sort(([, a], [, b]) => b.maxOccurredAt - a.maxOccurredAt)
      .map(([clientId, { clientName, events }]) => ({ clientId, clientName, events }));
  }, [filteredEvents]);

  const dateGroups = useMemo(() => {
    const groups = new Map<string, { maxOccurredAt: number; events: TimelineEvent[] }>();
    filteredEvents.forEach((e) => {
      const ts = new Date(e.occurredAt).getTime();
      const existing = groups.get(e.dateLabel);
      if (existing) {
        existing.events.push(e);
        if (ts > existing.maxOccurredAt) existing.maxOccurredAt = ts;
      } else {
        groups.set(e.dateLabel, { maxOccurredAt: ts, events: [e] });
      }
    });
    // Always newest date group first, regardless of sortBy
    return Array.from(groups.entries())
      .sort(([, a], [, b]) => b.maxOccurredAt - a.maxOccurredAt)
      .map(([dateLabel, { events }]) => ({ dateLabel, events }));
  }, [filteredEvents]);

  // Handlers
  function toggleCollapse(clientId: string) {
    setCollapsedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleTypeClick(key: EventType | "all") {
    setActiveType((prev) => (prev === key && key !== "all" ? "all" : key));
  }

  function cycleSortBy() {
    setSortBy((prev) =>
      prev === "recent" ? "oldest" : prev === "oldest" ? "client" : "recent"
    );
  }

  // ── Render will be added in Task 5 ────────────────────────────────
  return null as unknown as React.ReactElement;
}
