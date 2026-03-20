// ════════════════════════════════════════════════════════════════════════════
// peer-requests-page.tsx — Staff Peer Requests
// Data : getMyProfile → "You" identity
//        getStaffClients → client dropdown
// Note : Peer collaboration requests are managed in local session state;
//        no backend exists for this entity type yet.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getMyProfile } from "../../../../lib/api/staff/profile";
import { getStaffClients, type StaffClient } from "../../../../lib/api/staff/clients";
import { loadMyPeerReviewsWithRefresh, submitPeerReviewWithRefresh, type StaffPeerReview } from "../../../../lib/api/staff/hr";

// ── Types ─────────────────────────────────────────────────────────────────────

type StaffMember = {
  id: string;
  name: string;
  avatar: string;
  toneClass: string;
  surfaceClass: string;
  role: string;
};

type ClientRow = {
  id: string;
  name: string;
  avatar: string;
  toneClass: string;
  surfaceClass: string;
  bannerClass: string;
};

type CollabType    = "review" | "feedback" | "pairing" | "cover" | "input";
type Urgency       = "high" | "medium" | "low";
type RequestStatus = "pending" | "accepted" | "completed" | "declined";

type ThreadMessage = {
  authorId: string;
  text: string;
  time: string;
};

type PeerRequest = {
  id: string;
  fromId: string;
  toId: string;
  clientId: string;
  type: CollabType;
  title: string;
  description: string;
  dueBy: string;
  estimatedTime: string;
  urgency: Urgency;
  status: RequestStatus;
  createdAt: string;
  attachments: string[];
  thread: ThreadMessage[];
};

type Draft = {
  toId: string;
  clientId: string;
  type: CollabType;
  title: string;
  description: string;
  dueBy: string;
  estimatedTime: string;
  urgency: Urgency;
};

// ── Static config ─────────────────────────────────────────────────────────────

const collabTypes: Record<CollabType, { label: string; icon: string; badgeClass: string; sideClass: string }> = {
  review:   { label: "Peer Review",  icon: "◎", badgeClass: "prTypeReview",   sideClass: "prCardReview"   },
  feedback: { label: "Feedback",     icon: "◌", badgeClass: "prTypeFeedback", sideClass: "prCardFeedback" },
  pairing:  { label: "Pair Session", icon: "◉", badgeClass: "prTypePairing",  sideClass: "prCardPairing"  },
  cover:    { label: "Coverage",     icon: "⊡", badgeClass: "prTypeCover",    sideClass: "prCardCover"    },
  input:    { label: "Expert Input", icon: "◈", badgeClass: "prTypeInput",    sideClass: "prCardInput"    },
};

const urgencyClasses: Record<Urgency, string> = {
  high:   "prToneOrange",
  medium: "prToneAmber",
  low:    "prToneMuted2",
};

const statusConfig: Record<RequestStatus, { label: string; badgeClass: string }> = {
  pending:   { label: "Pending",   badgeClass: "prStatusPending"   },
  accepted:  { label: "Accepted",  badgeClass: "prStatusAccepted"  },
  completed: { label: "Completed", badgeClass: "prStatusCompleted" },
  declined:  { label: "Declined",  badgeClass: "prStatusDeclined"  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const CLIENT_TONE_CYCLE: Array<{ toneClass: string; surfaceClass: string; bannerClass: string }> = [
  { toneClass: "prToneAccent",  surfaceClass: "prSurfaceAccent",  bannerClass: "prClientBannerAccent"  },
  { toneClass: "prToneBlue",    surfaceClass: "prSurfaceBlue",    bannerClass: "prClientBannerBlue"    },
  { toneClass: "prTonePurple",  surfaceClass: "prSurfacePurple",  bannerClass: "prClientBannerPurple"  },
  { toneClass: "prToneAmber",   surfaceClass: "prSurfaceAmber",   bannerClass: "prClientBannerAmber"   },
  { toneClass: "prToneOrange",  surfaceClass: "prSurfaceOrange",  bannerClass: "prClientBannerOrange"  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function PeerRequestsPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  // ── Identity & client data ─────────────────────────────────────────────────
  const [myId,    setMyId]    = useState<string>("me");
  const [staff,   setStaff]   = useState<StaffMember[]>([
    { id: "me", name: "You", avatar: "YU", toneClass: "prToneAccent", surfaceClass: "prSurfaceAccent", role: "Staff Member" },
  ]);
  const [clients, setClients] = useState<ClientRow[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [peerReviews, setPeerReviews] = useState<StaffPeerReview[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    // Load profile, clients, and peer reviews in parallel
    void Promise.all([
      getMyProfile(session),
      getStaffClients(session),
      loadMyPeerReviewsWithRefresh(session),
    ]).then(([profileRes, clientsRes, peerRes]) => {
      // Profile → update "You" entry
      if (profileRes.nextSession) saveSession(profileRes.nextSession);
      if (!profileRes.error && profileRes.data) {
        const p = profileRes.data;
        const name = `${p.firstName} ${p.lastName}`.trim();
        setMyId(p.id);
        setStaff([{
          id:           p.id,
          name:         name || "You",
          avatar:       buildInitials(name || "YU"),
          toneClass:    "prToneAccent",
          surfaceClass: "prSurfaceAccent",
          role:         p.role,
        }]);
        // Also update existing requests' fromId placeholder
        setRequests((prev) => prev.map((r) => ({
          ...r,
          fromId: r.fromId === "me" ? p.id : r.fromId,
          toId:   r.toId   === "me" ? p.id : r.toId,
        })));
        setDraft((prev) => ({ ...prev, toId: prev.toId === "me" ? p.id : prev.toId }));
      }

      // Clients → populate dropdown
      if (clientsRes.nextSession) saveSession(clientsRes.nextSession);
      if (!clientsRes.error && clientsRes.data) {
        const rows: ClientRow[] = clientsRes.data.map((c: StaffClient, i: number) => ({
          id:           c.id,
          name:         c.name,
          avatar:       buildInitials(c.name),
          ...(CLIENT_TONE_CYCLE[i % CLIENT_TONE_CYCLE.length] ?? CLIENT_TONE_CYCLE[0]),
        }));
        setClients(rows);
        if (rows.length > 0 && !draft.clientId) {
          setDraft((prev) => ({ ...prev, clientId: rows[0]?.id ?? "" }));
        }
      }

      // Peer reviews → store for display
      if (peerRes.nextSession) saveSession(peerRes.nextSession);
      if (!peerRes.error && peerRes.data) {
        setPeerReviews(peerRes.data);
        // Map peer reviews into requests for the UI
        const profileId = profileRes.data?.id ?? "me";
        const mapped: PeerRequest[] = peerRes.data.map((pr) => ({
          id:            pr.id,
          fromId:        pr.revieweeId,
          toId:          pr.reviewerId,
          clientId:      "",
          type:          "review" as CollabType,
          title:         `Peer Review${pr.projectId ? ` — Project ${pr.projectId.slice(0, 6).toUpperCase()}` : ""}`,
          description:   pr.feedback ?? "Review requested — please provide feedback and a score.",
          dueBy:         pr.dueAt ? new Date(pr.dueAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }) : "TBD",
          estimatedTime: "15 min",
          urgency:       (pr.status === "PENDING" ? "medium" : "low") as Urgency,
          status:        pr.status === "SUBMITTED" ? "completed" as RequestStatus
                       : pr.status === "PENDING"   ? "pending" as RequestStatus
                       : "accepted" as RequestStatus,
          createdAt:     new Date(pr.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
          attachments:   [],
          thread:        pr.feedback ? [{ authorId: pr.reviewerId === profileId ? profileId : pr.reviewerId, text: pr.feedback, time: pr.submittedAt ? new Date(pr.submittedAt).toLocaleDateString("en-ZA") : "—" }] : [],
        }));
        setRequests((prev) => [...mapped, ...prev]);
      }
      setError(null);
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load data.");
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  // ── Request state ──────────────────────────────────────────────────────────
  const [requests, setRequests] = useState<PeerRequest[]>([]);
  const [selected, setSelected] = useState<PeerRequest | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft,    setDraft]    = useState<Draft>({
    toId: "me", clientId: "", type: "review", title: "",
    description: "", dueBy: "", estimatedTime: "", urgency: "medium",
  });
  const [view,  setView]  = useState<"all" | "incoming" | "outgoing">("all");
  const [reply, setReply] = useState("");

  const incoming        = requests.filter((r) => r.toId === myId);
  const outgoing        = requests.filter((r) => r.fromId === myId);
  const pendingIncoming = incoming.filter((r) => r.status === "pending").length;
  const filtered        = view === "incoming" ? incoming : view === "outgoing" ? outgoing : requests;

  const updateStatus = (id: string, status: RequestStatus) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    if (selected?.id === id) setSelected((prev) => (prev ? { ...prev, status } : prev));
  };

  const sendReply = (id: string) => {
    if (!reply.trim()) return;
    const message: ThreadMessage = { authorId: myId, text: reply, time: "Just now" };
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, thread: [...r.thread, message] } : r))
    );
    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, thread: [...prev.thread, message] } : prev));
    }
    setReply("");
  };

  const saveRequest = () => {
    const next: PeerRequest = {
      id:            String(Date.now()),
      fromId:        myId,
      toId:          draft.toId,
      clientId:      draft.clientId,
      type:          draft.type,
      title:         draft.title,
      description:   draft.description,
      dueBy:         draft.dueBy,
      estimatedTime: draft.estimatedTime,
      urgency:       draft.urgency,
      status:        "pending",
      createdAt:     "Just now",
      attachments:   [],
      thread:        [],
    };
    setRequests((prev) => [next, ...prev]);
    setSelected(next);
    setCreating(false);
    setDraft((prev) => ({ ...prev, title: "", description: "", dueBy: "", estimatedTime: "" }));
  };

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-peer-requests">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-peer-requests">
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-peer-requests">
      <div className={cx("pageHeaderBar", "borderB", "pb0")}>
        <div className={cx("flexBetween", "mb20")}>
          <div>
            <div className={cx("pageEyebrow")}>Staff Dashboard / Collaboration</div>
            <h1 className={cx("pageTitle")}>Peer Requests</h1>
          </div>
          <div className={cx("flexRow", "gap20")}>
            {[
              { label: "Incoming",    value: incoming.length,        toneClass: "prToneMuted"  },
              { label: "Needs reply", value: pendingIncoming,        toneClass: pendingIncoming > 0 ? "prToneAmber" : "prToneMuted2" },
              { label: "Outgoing",   value: outgoing.length,         toneClass: "prToneMuted"  },
            ].map((stat) => (
              <div key={stat.label} className={cx("textRight")}>
                <div className={cx("prStatLabel")}>{stat.label}</div>
                <div className={cx("fontDisplay", "fw800", stat.toneClass)}>{stat.value}</div>
              </div>
            ))}
            <button
              type="button"
              className={cx("prNewBtn")}
              onClick={() => { setCreating(true); setSelected(null); }}
            >
              + New request
            </button>
          </div>
        </div>

        <div className={cx("flexRow")}>
          {[
            { key: "all",      label: "All" },
            { key: "incoming", label: `Incoming${pendingIncoming > 0 ? ` (${pendingIncoming})` : ""}` },
            { key: "outgoing", label: "Outgoing" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={cx("prTabBtn", view === tab.key && "prTabBtnActive")}
              onClick={() => setView(tab.key as "all" | "incoming" | "outgoing")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cx("prMainGrid")}>
        {/* ── Request list ── */}
        <div className={cx("prSidebar")}>
          {filtered.map((request) => {
            const ct         = collabTypes[request.type];
            const from       = staff.find((s) => s.id === request.fromId);
            const to         = staff.find((s) => s.id === request.toId);
            const sc         = statusConfig[request.status];
            const isSelected = selected?.id === request.id;
            const isIncoming = request.toId === myId;
            return (
              <div
                key={request.id}
                className={cx(
                  "prRequestCard", ct.sideClass,
                  isSelected && "prRequestCardActive",
                  request.status === "completed" && "prRequestCardCompleted"
                )}
                onClick={() => { setSelected(request); setCreating(false); }}
              >
                <div className={cx("flexRow", "gap6", "mb6", "flexWrap")}>
                  <span className={cx("prTypeBadge", ct.badgeClass)}>{ct.icon} {ct.label}</span>
                  <span className={cx("prTypeBadge", sc.badgeClass)}>{sc.label}</span>
                </div>
                <div className={cx("text12", "mb6", "prRequestTitle", isSelected ? "prToneText" : "prToneMuted")}>
                  {request.title}
                </div>
                <div className={cx("flexBetween")}>
                  <span className={cx("text10", "colorMuted2")}>
                    {isIncoming ? `from ${from?.name ?? "…"}` : `to ${to?.name ?? "…"}`}
                  </span>
                  <span className={cx("prUrgencyDot", urgencyClasses[request.urgency])}>•</span>
                </div>
                <div className={cx("text10", "colorMuted2", "mt4")}>{request.estimatedTime} - Due {request.dueBy}</div>
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="users" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No requests yet</div>
              <div className={cx("emptyStateSub")}>
                {view === "all"
                  ? "Peer collaboration requests will appear here once created."
                  : `No ${view} requests found.`}
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Detail / Create pane ── */}
        <div className={cx("overflowAuto")}>
          {/* New request form */}
          {creating ? (
            <div className={cx("prDetailPane")}>
              <div className={cx("fontDisplay", "fw800", "colorText", "prFormTitle")}>New Collaboration Request</div>

              <div className={cx("formGrid2")}>
                <div>
                  <label className={cx("prFormLabel")}>Send to</label>
                  <select
                    aria-label="Request recipient"
                    value={draft.toId}
                    onChange={(e) => setDraft((p) => ({ ...p, toId: e.target.value }))}
                    className={cx("prFormSelect")}
                  >
                    {staff.filter((s) => s.id !== myId).map((s) => (
                      <option key={s.id} value={s.id}>{s.name} - {s.role}</option>
                    ))}
                    {staff.filter((s) => s.id !== myId).length === 0 ? (
                      <option value="" disabled>No other staff available</option>
                    ) : null}
                  </select>
                </div>
                <div>
                  <label className={cx("prFormLabel")}>Client</label>
                  <select
                    aria-label="Request client"
                    value={draft.clientId}
                    onChange={(e) => setDraft((p) => ({ ...p, clientId: e.target.value }))}
                    className={cx("prFormSelect")}
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    {clients.length === 0 ? (
                      <option value="" disabled>Loading clients…</option>
                    ) : null}
                  </select>
                </div>
              </div>

              <div className={cx("prFormGrid3")}>
                <div>
                  <label className={cx("prFormLabel")}>Type</label>
                  <select
                    aria-label="Request type"
                    value={draft.type}
                    onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value as CollabType }))}
                    className={cx("prFormSelect")}
                  >
                    {Object.entries(collabTypes).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cx("prFormLabel")}>Urgency</label>
                  <select
                    aria-label="Request urgency"
                    value={draft.urgency}
                    onChange={(e) => setDraft((p) => ({ ...p, urgency: e.target.value as Urgency }))}
                    className={cx("prFormSelect")}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className={cx("prFormLabel")}>Due by</label>
                  <input
                    value={draft.dueBy}
                    onChange={(e) => setDraft((p) => ({ ...p, dueBy: e.target.value }))}
                    placeholder="e.g. Feb 25"
                    className={cx("prFormInput")}
                  />
                </div>
              </div>

              <div>
                <label className={cx("prFormLabel")}>Title</label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                  placeholder="What are you asking for?"
                  className={cx("prFormInput")}
                />
              </div>

              <div>
                <label className={cx("prFormLabel")}>Description</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Context, what you need from them, and what a good outcome looks like."
                  className={cx("prFormTextarea")}
                />
              </div>

              <div>
                <label className={cx("prFormLabel")}>Estimated time needed</label>
                <input
                  value={draft.estimatedTime}
                  onChange={(e) => setDraft((p) => ({ ...p, estimatedTime: e.target.value }))}
                  placeholder="e.g. 30 min, 1 hour"
                  className={cx("prFormInputShort")}
                />
              </div>

              <div className={cx("flexRow", "gap10")}>
                <button
                  type="button"
                  className={cx("prSaveBtn")}
                  disabled={!draft.title.trim() || !draft.description.trim() || staff.filter((s) => s.id !== myId).length === 0}
                  onClick={saveRequest}
                >
                  Send request
                </button>
                <button type="button" className={cx("prCancelBtn")} onClick={() => setCreating(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {/* Request detail */}
          {selected && !creating ? (() => {
            const ct         = collabTypes[selected.type];
            const from       = staff.find((s) => s.id === selected.fromId);
            const to         = staff.find((s) => s.id === selected.toId);
            const cl         = clients.find((c) => c.id === selected.clientId);
            const sc         = statusConfig[selected.status];
            const isIncoming = selected.toId === myId;
            return (
              <div className={cx("prDetailPane")}>
                <div className={cx("flexRow", "gap8", "flexWrap", "mb4")}>
                  <span className={cx("prDetailBadge", ct.badgeClass)}>{ct.icon} {ct.label}</span>
                  <span className={cx("prDetailBadge", sc.badgeClass, "prDetailBadgeStatus")}>{sc.label}</span>
                  <span className={cx("prDetailBadge", "prDetailBadgeNeutral", urgencyClasses[selected.urgency])}>
                    {selected.urgency} priority
                  </span>
                </div>
                <div className={cx("fontDisplay", "fw800", "colorText", "prDetailTitle")}>{selected.title}</div>

                <div className={cx("flexRow", "gap16", "flexWrap")}>
                  {[from, to].map((member, idx) => (
                    <div key={idx} className={cx("flexRow", "gap6")}>
                      {idx === 1 ? <span className={cx("text12", "colorMuted2")}>→</span> : null}
                      <div className={cx("prPersonAvatar", member?.surfaceClass ?? "prSurfaceMuted", member?.toneClass ?? "prToneMuted")}>
                        {member?.avatar ?? "??"}
                      </div>
                      <div>
                        <div className={cx("text11", member?.id === myId ? "prToneAccent" : "colorText")}>
                          {member?.name ?? "Unknown"}
                        </div>
                        <div className={cx("prPersonRole")}>{member?.role ?? "Unknown role"}</div>
                      </div>
                    </div>
                  ))}
                  <div className={cx("prDueMeta")}>
                    <div><div className={cx("prDueMetaLabel")}>DUE</div><div className={cx("text11", "colorMuted")}>{selected.dueBy}</div></div>
                    <div><div className={cx("prDueMetaLabel")}>TIME NEEDED</div><div className={cx("text11", "colorMuted")}>{selected.estimatedTime}</div></div>
                  </div>
                </div>

                {cl ? (
                  <div className={cx("prClientBanner", cl.bannerClass)}>
                    <div className={cx("prClientBannerAvatar", cl.surfaceClass, cl.toneClass)}>{cl.avatar}</div>
                    <span className={cx("text11", cl.toneClass)}>{cl.name}</span>
                  </div>
                ) : null}

                <div className={cx("prDescriptionCard")}>
                  <div className={cx("prDescriptionLabel")}>Request details</div>
                  <div className={cx("text13", "colorMuted", "prDescriptionText")}>{selected.description}</div>
                </div>

                {selected.attachments.length > 0 ? (
                  <div>
                    <div className={cx("prDescriptionLabel")}>Attachments</div>
                    <div className={cx("flexRow", "gap8", "flexWrap")}>
                      {selected.attachments.map((a) => (
                        <div key={a} className={cx("prAttachment")}>
                          <span className={cx("colorBlue")}>▪</span>{a}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selected.thread.length > 0 ? (
                  <div>
                    <div className={cx("prDescriptionLabel", "mb10")}>Thread</div>
                    {selected.thread.map((msg, idx) => {
                      const author = staff.find((s) => s.id === msg.authorId);
                      const isMe   = msg.authorId === myId;
                      return (
                        <div key={idx} className={cx("prThreadRow", isMe ? "prThreadRowMe" : "prThreadRowOther")}>
                          <div className={cx("prThreadAvatar", author?.surfaceClass ?? "prSurfaceMuted", author?.toneClass ?? "prToneMuted")}>
                            {author?.avatar ?? "??"}
                          </div>
                          <div className={cx(isMe ? "prThreadBubbleMe" : "prThreadBubbleOther")}>
                            <div className={cx("text12", "colorMuted", "prThreadText")}>{msg.text}</div>
                            <div className={cx("prThreadTime")}>{msg.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {isIncoming && selected.status === "pending" ? (
                  <div className={cx("flexRow", "gap10")}>
                    <button type="button" className={cx("prAcceptBtn")} onClick={() => updateStatus(selected.id, "accepted")}>
                      ✓ Accept
                    </button>
                    <button type="button" className={cx("prDeclineBtn")} onClick={() => updateStatus(selected.id, "declined")}>
                      Decline
                    </button>
                  </div>
                ) : null}

                {selected.status === "accepted" ? (
                  <div className={cx("prCompleteWrap")}>
                    <button
                      type="button"
                      className={cx("prCompleteBtn")}
                      disabled={submitting}
                      onClick={async () => {
                        // If this is a real peer review from the API, submit via backend
                        const matchingPeer = peerReviews.find((pr) => pr.id === selected.id);
                        if (matchingPeer && session) {
                          setSubmitting(true);
                          const res = await submitPeerReviewWithRefresh(session, selected.id, {
                            score: 80,
                            feedback: selected.thread.length > 0 ? selected.thread[selected.thread.length - 1].text : "Completed",
                          });
                          if (res.nextSession) saveSession(res.nextSession);
                          if (!res.error) {
                            updateStatus(selected.id, "completed");
                          }
                          setSubmitting(false);
                        } else {
                          updateStatus(selected.id, "completed");
                        }
                      }}
                    >
                      {submitting ? "Submitting…" : "Mark as completed →"}
                    </button>
                  </div>
                ) : null}

                <div className={cx("prReplyRow")}>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply to this request..."
                    className={cx("prReplyInput")}
                  />
                  <button type="button" className={cx("prSendBtn")} disabled={!reply.trim()} title={!reply.trim() ? "Type a reply first" : undefined} onClick={() => sendReply(selected.id)}>
                    Send
                  </button>
                </div>
              </div>
            );
          })() : null}
        </div>
      </div>
    </section>
  );
}
