// ════════════════════════════════════════════════════════════════════════════
// sla-escalation-page.tsx — Client SLA & Support Tickets
// Data     : loadPortalSupportTicketsWithRefresh → GET /support-tickets
//            createPortalSupportTicketWithRefresh → POST /support-tickets
// Mobile   : Grid collapses to 1-col; form stacks
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalSupportTicketsWithRefresh,
  createPortalSupportTicketWithRefresh,
  type PortalSupportTicket
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────
type TicketPriority = "High" | "Medium" | "Low";
type TicketStatus = "Open" | "In Progress" | "Resolved";

interface Ticket {
  id: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  opened: string;
  assignedAv: string;
  assignedName: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toPriority(raw: string): TicketPriority {
  const upper = raw.toUpperCase();
  if (upper === "HIGH") return "High";
  if (upper === "LOW") return "Low";
  return "Medium";
}

function toStatus(raw: string): TicketStatus {
  if (raw === "RESOLVED") return "Resolved";
  if (raw === "IN_PROGRESS") return "In Progress";
  return "Open";
}

function toInitials(name: string | null | undefined): string {
  if (!name) return "—";
  return name.split(" ").map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function mapTicket(t: PortalSupportTicket): Ticket {
  return {
    id: `TKT-${t.id.slice(-3).toUpperCase()}`,
    subject: t.title,
    priority: toPriority(t.priority),
    status: toStatus(t.status),
    opened: timeAgo(t.createdAt),
    assignedAv: toInitials(t.assignedTo),
    assignedName: t.assignedTo ?? "Unassigned"
  };
}

// ── Static config ─────────────────────────────────────────────────────────────
const PRIORITY_BADGE: Record<TicketPriority, string> = { High: "badgeRed", Medium: "badgeAmber", Low: "badgeMuted" };
const PRIORITY_COLOR: Record<TicketPriority, string> = { High: "var(--red)", Medium: "var(--amber)", Low: "var(--green)" };
const PRIORITY_ICON: Record<TicketPriority, string> = { High: "alert", Medium: "flag", Low: "info" };

const SLA_FEATURES = [
  { label: "Response time", value: "2 hours (business hours)", icon: "clock", accent: false },
  { label: "Resolution time", value: "24 hours", icon: "check", accent: false },
  { label: "Dedicated PM", value: "Your Account Manager", icon: "users", accent: false },
  { label: "Priority support", value: "Yes", icon: "zap", accent: true },
  { label: "Emergency line", value: "Via High-priority ticket", icon: "phone", accent: "amber" },
  { label: "Uptime guarantee", value: "99.5%", icon: "shield", accent: true },
];

const ESCALATION_LEVELS = [
  { level: 1, label: "Support Team", responseTime: "2 hours", icon: "message", description: "First line of support. All tickets are routed here initially.", color: "var(--lime)" },
  { level: 2, label: "Project Manager", responseTime: "4 hours", icon: "users", description: "Escalated if unresolved. Your account manager takes direct ownership.", color: "var(--amber)" },
  { level: 3, label: "Director", responseTime: "8 hours", icon: "flag", description: "Critical escalations only. Director-level resolution and accountability.", color: "var(--red)" },
];

const TICKET_TYPES = ["Bug / Error", "Performance Issue", "Feature Request", "Access & Permissions", "Billing Query", "Other"];

// ── Component ─────────────────────────────────────────────────────────────────
export function SlaEscalationPage() {
  const { session } = useProjectLayer();
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [ticketType, setTicketType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await loadPortalSupportTicketsWithRefresh(session);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setError(result.error.message ?? "Failed to load.");
        setTickets([]);
        return;
      }
      setTickets((result.data ?? []).map(mapTicket));
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // ── Fetch tickets ─────────────────────────────────────────────────────────
  useEffect(() => {
    queueMicrotask(() => {
      void loadTickets();
    });
  }, [loadTickets]);

  const openTickets = tickets.filter((t) => t.status !== "Resolved");
  const highPriorityOpen = openTickets.filter((t) => t.priority === "High").length;
  const resolvedTickets = tickets.filter((t) => t.status === "Resolved").length;
  const assignedCoverage = useMemo(() => {
    if (openTickets.length === 0) return "No active queue";
    const assigned = openTickets.filter((t) => t.assignedName !== "Unassigned").length;
    return assigned + "/" + openTickets.length + " assigned";
  }, [openTickets]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !session) return;
    setSubmitting(true);

    const result = await createPortalSupportTicketWithRefresh(session, {
      clientId: session.user.clientId ?? "",
      title: subject.trim(),
      description: description.trim() || undefined,
      category: ticketType || undefined,
      priority: priority.toUpperCase()
    });

    if (result.nextSession) saveSession(result.nextSession);
    setSubmitting(false);

    if (result.data) {
      setTickets((prev) => [mapTicket(result.data!), ...prev]);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSubject("");
        setDescription("");
        setTicketType("");
        setPriority("Medium");
      }, 3000);
    }
  }

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="alert" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>Unable to load support SLA data</div>
          <div className={cx("emptyStateSub")}>{error}</div>
          <div className={cx("mt12")}>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void loadTickets()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Support · SLA</div>
          <h1 className={cx("pageTitle")}>SLA &amp; Escalation</h1>
          <p className={cx("pageSub")}>Your service level agreement, response times, and escalation process.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void loadTickets()}>
            Refresh
          </button>
          <a href="#raise-ticket" className={cx("btnSm", "btnAccent")}>
            <Ic n="plus" sz={13} c="var(--bg)" /> Raise a Ticket
          </a>
        </div>
      </div>

      <div className={cx("grid2", "mb16")}>
        <div className={cx("cardS1v2", "p20")}>
          <div className={cx("flexBetween", "gap12", "mb16", "flexWrap")}>
            <div>
              <div className={cx("text10", "uppercase", "tracking", "colorMuted", "mb4")}>Professional Tier</div>
              <div className={cx("text16", "fw800", "mb4")}>Client Support Coverage</div>
              <div className={cx("text12", "colorMuted", "lineH165")}>
                Your account is covered by the standard response window, directed escalation, and tracked ticket ownership.
              </div>
            </div>
            <div className={cx("badge", "badgeAccent", "selfStart")}>Live SLA</div>
          </div>
          <div className={cx("grid2Cols12Gap", "mb16")}>
            <div className={cx("statCard", "statCardAccent")}>
              <div className={cx("statLabel")}>Active Queue</div>
              <div className={cx("statValue")}>{openTickets.length}</div>
              <div className={cx("flexRow", "flexCenter", "gap5", "mt6")}>
                <Ic n="clock" sz={11} c="var(--lime)" />
                <span className={cx("fs065", "colorAccent", "fw600")}>{openTickets.length === 0 ? "No open tickets" : "Awaiting response"}</span>
              </div>
            </div>
            <div className={cx("statCard", "statCardGreen")}>
              <div className={cx("statLabel")}>Resolved Tickets</div>
              <div className={cx("statValue")}>{resolvedTickets}</div>
              <div className={cx("flexRow", "flexCenter", "gap5", "mt6")}>
                <Ic n="check" sz={11} c="var(--green)" />
                <span className={cx("fs065", "colorGreen", "fw600")}>Closed successfully</span>
              </div>
            </div>
            <div className={cx("statCard", "statCardGreen")}>
              <div className={cx("statLabel")}>Assigned Coverage</div>
              <div className={cx("statValue")}>{assignedCoverage}</div>
              <div className={cx("flexRow", "flexCenter", "gap5", "mt6")}>
                <Ic n="users" sz={11} c="var(--green)" />
                <span className={cx("fs065", "colorGreen", "fw600")}>Current ownership</span>
              </div>
            </div>
            <div className={cx("statCard", "statCardAmber")}>
              <div className={cx("statLabel")}>High Priority</div>
              <div className={cx("statValue")}>{highPriorityOpen}</div>
              <div className={cx("flexRow", "flexCenter", "gap5", "mt6")}>
                <Ic n="alert" sz={11} c="var(--amber)" />
                <span className={cx("fs065", "colorAmber", "fw600")}>{highPriorityOpen === 0 ? "No urgent escalations" : "Needs close attention"}</span>
              </div>
            </div>
          </div>
          <div className={cx("listGroup")}>
            {SLA_FEATURES.map((f) => {
              const accentColor = f.accent === "amber" ? "var(--amber)" : f.accent ? "var(--lime)" : null;
              return (
                <div key={f.label} className={cx("listRow", "flexBetween")}>
                  <div className={cx("flexRow", "gap8")}>
                    <div
                      className={cx("slaIconBox28", "dynBgColor", "dynBorderColor")}
                      style={{ "--bg-color": accentColor ? `color-mix(in oklab, ${accentColor} 10%, var(--s3))` : "var(--s3)", "--border-color": accentColor ? `color-mix(in oklab, ${accentColor} 25%, var(--b2))` : "var(--b2)" } as React.CSSProperties}
                    >
                      <Ic n={f.icon} sz={13} c={accentColor ?? "var(--muted)"} />
                    </div>
                    <span className={cx("text12", "colorMuted")}>{f.label}</span>
                  </div>
                  <span className={cx("text12", "fw600", "dynColor")} style={{ "--color": accentColor ?? "inherit" } as React.CSSProperties}>{f.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cx("card", "p0", "overflowHidden")}>
          <div className={cx("cardHd")}>
            <span className={cx("cardHdTitle")}>Live Support Queue</span>
            <span className={cx("badge", openTickets.length > 0 ? "badgeAmber" : "badgeGreen")}>
              {openTickets.length} Open
            </span>
          </div>
          <div className={cx("listGroup")}>
            {openTickets.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="check" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No active support tickets</div>
                <div className={cx("emptyStateSub")}>Your queue is clear. Raise a ticket below if you need help from the team.</div>
              </div>
            ) : (
              openTickets.map((t) => {
                const pColor = PRIORITY_COLOR[t.priority];
                return (
                  <div key={t.id} className={cx("listRow", "slaTicketRow", "dynBorderLeft3")} style={{ "--color": pColor } as React.CSSProperties}>
                    <div className={cx("flexBetweenStart", "gap8")}>
                      <div className={cx("flex1", "minW0")}>
                        <div className={cx("flexRow", "flexCenter", "gap8", "mb4", "flexWrap")}>
                          <span className={cx("text10", "colorMuted", "fw600")}>{t.id}</span>
                          <span className={cx("badge", PRIORITY_BADGE[t.priority])}>{t.priority}</span>
                          <span className={cx("badge", t.status === "In Progress" ? "badgeAccent" : "badgeAmber")}>{t.status}</span>
                        </div>
                        <div className={cx("text12", "fw600", "mb6")}>{t.subject}</div>
                        <div className={cx("flexRow", "gap12", "flexWrap")}>
                          <div className={cx("flexRow", "gap4")}>
                            <Ic n="clock" sz={11} c="var(--muted2)" />
                            <span className={cx("text10", "colorMuted")}>Opened {t.opened}</span>
                          </div>
                          <div className={cx("flexRow", "gap5")}>
                            <div
                              className={cx("slaAvatarSmall", "dynBgColor", "dynBorderColor", "dynColor")}
                              style={{ "--bg-color": `color-mix(in oklab, ${pColor} 15%, var(--s3))`, "--border-color": `color-mix(in oklab, ${pColor} 25%, var(--b2))`, "--color": pColor } as React.CSSProperties}
                            >
                              {t.assignedAv}
                            </div>
                            <span className={cx("text10", "colorMuted")}>{t.assignedName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={cx("flexRow", "gap6")}>
                      <button type="button" className={cx("btnSm", "btnGhost")}>
                        <Ic n="eye" sz={12} c="var(--muted)" /> View
                      </button>
                      <button type="button" className={cx("btnSm", "btnGhost")} disabled={t.priority !== "High"}>
                        <Ic n="alert" sz={12} c={t.priority === "High" ? "var(--amber)" : "var(--muted2)"} /> Escalate
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Escalation path ── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>Escalation Path</span>
          <span className={cx("text11", "colorMuted")}>Auto-escalates if SLA is breached</span>
        </div>
        <div className={cx("cardBodyPad", "pt20")}>
          <div className={cx("grid3Cols", "relative")}>
            <div className={cx("slaGradientBar")} />
            {ESCALATION_LEVELS.map((lvl) => (
              <div key={lvl.level} className={cx("slaLvlCol")}>
                <div
                  className={cx("slaLvlCircle", "dynBgColor", "dynBorderColor")}
                  style={{ "--bg-color": `color-mix(in oklab, ${lvl.color} 12%, var(--s2))`, "--border-color": `color-mix(in oklab, ${lvl.color} 40%, transparent)` } as React.CSSProperties}
                >
                  <Ic n={lvl.icon} sz={20} c={lvl.color} />
                </div>
                <div className={cx("text10", "colorMuted", "uppercase", "tracking", "mb2")}>Level {lvl.level}</div>
                <div className={cx("fw700", "text13", "mb8")}>{lvl.label}</div>
                <div
                  className={cx("slaRespBadge", "dynBgColor", "dynBorderColor")}
                  style={{ "--bg-color": `color-mix(in oklab, ${lvl.color} 8%, var(--s3))`, "--border-color": `color-mix(in oklab, ${lvl.color} 20%, var(--b2))` } as React.CSSProperties}
                >
                  <span className={cx("text10", "fw600", "dynColor")} style={{ "--color": lvl.color } as React.CSSProperties}>Response: {lvl.responseTime}</span>
                </div>
                <p className={cx("text11", "colorMuted", "lineH16")}>{lvl.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Raise a ticket ── */}
      <div className={cx("card")} id="raise-ticket">
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>Raise a Ticket</span>
          <span className={cx("text11", "colorMuted")}>We respond within 2 business hours</span>
        </div>
        <div className={cx("cardBodyPad", "pt16")}>
          {submitted ? (
            <div className={cx("slaSuccessState")}>
              <div className={cx("slaSuccessIcon")}>
                <Ic n="check" sz={22} c="var(--lime)" />
              </div>
              <div className={cx("fw700", "text13")}>Ticket submitted successfully</div>
              <div className={cx("text12", "colorMuted")}>Your ticket has been raised. You will receive a response within 2 hours.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={cx("flexCol", "gap16")}>
              <div className={cx("grid2Cols12Gap")}>
                <div>
                  <label className={cx("text11", "colorMuted", "dBlock", "mb6")}>Ticket type</label>
                  <select className={cx("input")} value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
                    <option value="">Select a type...</option>
                    {TICKET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cx("text11", "colorMuted", "dBlock", "mb6")}>Subject</label>
                  <input className={cx("input")} placeholder="Brief description of the issue..." value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className={cx("text11", "colorMuted", "dBlock", "mb6")}>Description</label>
                <textarea
                  className={cx("input", "resizeV", "minH100")}
                  placeholder="Provide as much detail as possible — steps to reproduce, screenshots, affected users, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <label className={cx("text11", "colorMuted", "dBlock", "mb8")}>Priority</label>
                <div className={cx("grid3Cols8Gap")}>
                  {(["Low", "Medium", "High"] as TicketPriority[]).map((p) => {
                    const active = priority === p;
                    const c = PRIORITY_COLOR[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={cx("slaPriorityBtn", "dynBgColor", "dynBorderColor")}
                      style={{ "--bg-color": active ? `color-mix(in oklab, ${c} 8%, var(--s2))` : "var(--s2)", "--border-color": active ? `color-mix(in oklab, ${c} 35%, transparent)` : "var(--b1)" } as React.CSSProperties}
                      >
                        <div
                          className={cx("slaIconBox28", "dynBgColor", "dynBorderColor")}
                          style={{ "--bg-color": active ? `color-mix(in oklab, ${c} 15%, transparent)` : "var(--s3)", "--border-color": active ? `color-mix(in oklab, ${c} 30%, transparent)` : "var(--b2)" } as React.CSSProperties}
                        >
                          <Ic n={PRIORITY_ICON[p]} sz={13} c={active ? c : "var(--muted)"} />
                        </div>
                        <div>
                          <div className={cx("fw600", "text12", "dynColor")} style={{ "--color": active ? c : "inherit" } as React.CSSProperties}>{p}</div>
                          <div className={cx("text10", "colorMuted")}>
                            {p === "High" ? "Urgent — SLA critical" : p === "Medium" ? "Standard response" : "When convenient"}
                          </div>
                        </div>
                        {active && (
                          <div className={cx("mlAuto", "noShrink")}>
                            <Ic n="check" sz={13} c={c} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={cx("pt4")}>
                <button type="submit" className={cx("btnSm", "btnAccent")} disabled={submitting}>
                  <Ic n="send" sz={13} c="var(--bg)" /> {submitting ? "Submitting…" : "Submit Ticket"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
