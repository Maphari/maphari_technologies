"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import type { TeamMember, SupportTicket } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClientHelpTeamPageProps = {
  active: boolean;
  teamMembers: TeamMember[];
  onOpenMessages: () => void;
  openTickets: SupportTicket[];
  onSubmitTicket: (subject: string, category: string, priority: string, message: string) => void;
};

type HelpTab = "Your Team" | "FAQ" | "Submit Ticket";

// ─── Constants ────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "How do I approve or reject a milestone?",
    answer:
      "Go to the Milestones page. Each milestone with a pending approval will show Accept and Reject buttons. Click the relevant action — the team is notified immediately.",
  },
  {
    question: "Can I request changes to the project scope?",
    answer:
      "Yes. Navigate to the Projects page, open the Change Requests panel, fill in the title and description, and submit. The team will respond within 48 hours.",
  },
  {
    question: "How do I pay an outstanding invoice?",
    answer:
      "Go to the Invoices page, find the invoice with an Outstanding or Overdue badge, and click the Pay button. You will be directed to the payment gateway.",
  },
  {
    question: "Where can I find shared project files?",
    answer:
      "All documents shared by the team are available on the Documents page, organised by project. You can also upload files from there.",
  },
  {
    question: "What is the typical response time for messages?",
    answer:
      "Standard queries are answered within 1 business day. For anything urgent, mark the subject with [URGENT] and the team targets a 4-hour response.",
  },
] as const;

const TICKET_STATUS_BADGE: Record<SupportTicket["status"], { label: string; className: string }> = {
  open:        { label: "Open",        className: "badgeAmber"  },
  in_progress: { label: "In Progress", className: "badgePurple" },
  resolved:    { label: "Resolved",    className: "badgeGreen"  },
};

const PRIORITY_BADGE: Record<SupportTicket["priority"], { label: string; className: string }> = {
  low:    { label: "Low",    className: "badgeMuted" },
  medium: { label: "Medium", className: "badgeAmber" },
  high:   { label: "High",   className: "badgeRed"   },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientSupportPage({
  active,
  teamMembers,
  onOpenMessages,
  openTickets,
  onSubmitTicket,
}: ClientHelpTeamPageProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<HelpTab>("Your Team");

  // Ticket form state
  const [subject, setSubject]     = useState("");
  const [category, setCategory]   = useState("general");
  const [priority, setPriority]   = useState("medium");
  const [message, setMessage]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = () => {
    if (subject.trim().length < 3 || message.trim().length < 10) return;
    setSubmitting(true);
    window.setTimeout(() => {
      onSubmitTicket(subject.trim(), category, priority, message.trim());
      setSubject("");
      setCategory("general");
      setPriority("medium");
      setMessage("");
      setSubmitting(false);
    }, 600);
  };

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-support">
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Account</div>
          <div className={styles.pageTitle}>Help & Team</div>
          <div className={styles.pageSub}>
            Your project team, quick answers, and support tickets — all in one place.
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            className={cx(styles.button, styles.buttonAccent, styles.buttonSm)}
            onClick={onOpenMessages}
          >
            Message Team
          </button>
          <span className={cx(styles.badge, openTickets.length > 0 ? styles.badgeAmber : styles.badgeMuted)}>
            {openTickets.length} open ticket{openTickets.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className={styles.filterBar}>
        {(["Your Team", "FAQ", "Submit Ticket"] as HelpTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={cx(styles.filterTab, activeTab === tab && styles.filterTabActive)}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Page body */}
      <div className={styles.pageBody}>

        {/* ── Your Team tab ──────────────────────────────────────────────── */}
        {activeTab === "Your Team" && (
          <>
            {teamMembers.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>👥</div>
                <div className={styles.emptyTitle}>No team members yet</div>
                <p className={styles.emptyDesc}>
                  Once your project is underway, your assigned team will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Stats strip */}
                <div className={styles.statGrid}>
                  <div className={styles.statCard}>
                    <div className={cx(styles.statBar, styles.statBarAccent)} />
                    <div className={styles.statLabel}>Team Size</div>
                    <div className={styles.statValue}>{teamMembers.length}</div>
                    <div className={styles.statDelta}>Across all projects</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={cx(styles.statBar, styles.statBarGreen)} />
                    <div className={styles.statLabel}>Admins</div>
                    <div className={styles.statValue}>
                      {teamMembers.filter((m) => m.role === "ADMIN").length}
                    </div>
                    <div className={styles.statDelta}>Project leads</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={cx(styles.statBar, styles.statBarPurple)} />
                    <div className={styles.statLabel}>Specialists</div>
                    <div className={styles.statValue}>
                      {teamMembers.filter((m) => m.role === "STAFF").length}
                    </div>
                    <div className={styles.statDelta}>Developers & designers</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={cx(styles.statBar, styles.statBarAmber)} />
                    <div className={styles.statLabel}>Projects Covered</div>
                    <div className={styles.statValue}>
                      {new Set(teamMembers.flatMap((m) => m.projectIds)).size}
                    </div>
                    <div className={styles.statDelta}>Active engagements</div>
                  </div>
                </div>

                {/* Team grid */}
                <div>
                  <div className={styles.sectionTitle}>Team Members</div>
                  <div className={cx(styles.teamGrid, styles.teamGridMt)}>
                    {teamMembers.map((member) => (
                      <div key={member.id} className={styles.teamCard}>
                        {/* Avatar */}
                        <div
                          className={styles.teamAvatar}
                          style={{ background: member.avatarBg, color: "var(--on-accent)" }}
                        >
                          {member.initials}
                        </div>

                        {/* Name + role */}
                        <div className={styles.teamName}>{member.name}</div>
                        <div className={styles.teamRole}>{formatRole(member.role)}</div>

                        {/* Project count badge */}
                        {member.projectIds.length > 0 ? (
                          <span className={cx(styles.badge, styles.badgeMuted)}>
                            {member.projectIds.length} project{member.projectIds.length > 1 ? "s" : ""}
                          </span>
                        ) : null}

                        {/* Specialties */}
                        <div className={styles.teamSpecialties}>
                          {member.specialties.map((specialty) => (
                            <span key={specialty} className={styles.teamSpecialty}>
                              {specialty}
                            </span>
                          ))}
                        </div>

                        {/* Message CTA */}
                        <button
                          type="button"
                          className={cx(styles.button, styles.buttonGhost, styles.buttonSm, styles.teamCardMsgBtn)}
                          onClick={onOpenMessages}
                        >
                          Message
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How we collaborate */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardTitle}>How we collaborate</div>
                      <div className={styles.cardSub}>Your team's working rhythm</div>
                    </div>
                  </div>
                  <div className={styles.itemList}>
                    {[
                      { icon: "📅", title: "Weekly status updates",  detail: "Every Monday you receive an automated digest with milestone progress." },
                      { icon: "💬", title: "Messages response SLA",  detail: "Replies within 1 business day for standard queries, 4 hours for urgent." },
                      { icon: "✅", title: "Milestone sign-off",      detail: "You approve or reject milestones directly from the Milestones page." },
                      { icon: "📄", title: "Document sharing",        detail: "All project files are shared via the Documents page in real time." },
                      { icon: "🔄", title: "Change requests",         detail: "Submit scope changes from the Projects page — the team reviews within 48 hours." },
                    ].map((item) => (
                      <div key={item.title} className={styles.itemRow}>
                        <span className={styles.itemRowIcon}>{item.icon}</span>
                        <div className={styles.itemRowBody}>
                          <div className={styles.itemTitle}>{item.title}</div>
                          <div className={cx(styles.itemMeta, styles.itemMetaWrap)}>
                            {item.detail}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── FAQ tab ────────────────────────────────────────────────────── */}
        {activeTab === "FAQ" && (
          <div>
            <div className={styles.sectionTitle}>Frequently Asked Questions</div>
            <div className={cx(styles.faqList, styles.faqListMt)}>
              {FAQ_ITEMS.map((item, idx) => (
                <div key={item.question} className={styles.faqItem}>
                  <button
                    type="button"
                    className={styles.faqQuestion}
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  >
                    <span>{item.question}</span>
                    <span className={styles.faqToggleIcon}>
                      {openFaq === idx ? "−" : "+"}
                    </span>
                  </button>
                  {openFaq === idx ? (
                    <div className={styles.faqAnswer}>{item.answer}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Submit Ticket tab ──────────────────────────────────────────── */}
        {activeTab === "Submit Ticket" && (
          <div className={styles.cols2Main}>

            {/* LEFT — ticket form */}
            <div>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>Submit a Support Ticket</div>
                    <div className={styles.cardSub}>We respond within 1 business day</div>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Subject *</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Brief description of your issue"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>

                    <div className={styles.formGrid2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Category</label>
                        <select
                          title="category"
                          className={styles.formSelect}
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="general">General Inquiry</option>
                          <option value="billing">Billing & Invoices</option>
                          <option value="project">Project Delivery</option>
                          <option value="technical">Technical Issue</option>
                          <option value="milestone">Milestone Approval</option>
                          <option value="change_request">Change Request</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Priority</label>
                        <select
                          title="priority"
                          className={styles.formSelect}
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                        >
                          <option value="low">Low — Informational</option>
                          <option value="medium">Medium — Needs attention</option>
                          <option value="high">High — Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Message *</label>
                      <textarea
                        className={styles.formTextarea}
                        rows={5}
                        placeholder="Describe your issue in detail so we can help quickly..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>

                    <div className={styles.formSubmitRow}>
                      <button
                        type="button"
                        className={cx(styles.button, styles.buttonAccent)}
                        disabled={submitting || subject.trim().length < 3 || message.trim().length < 10}
                        onClick={handleSubmit}
                      >
                        {submitting ? "Submitting..." : "Submit Ticket"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — open tickets + contact channels + SLAs */}
            <div className={styles.colStack}>
              {/* Open tickets list */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>Your Open Tickets</div>
                    <div className={styles.cardSub}>Active & in-progress items</div>
                  </div>
                </div>

                {openTickets.length === 0 ? (
                  <div className={cx(styles.emptyState, styles.emptyStateCompact)}>
                    <div className={styles.emptyIcon}>🎉</div>
                    <div className={styles.emptyTitle}>No open tickets</div>
                    <p className={cx(styles.emptyDesc, styles.emptyDescSm)}>
                      Everything is clear. Submit a ticket above if you need help.
                    </p>
                  </div>
                ) : (
                  <div>
                    {openTickets.map((ticket) => {
                      const statusBadge   = TICKET_STATUS_BADGE[ticket.status];
                      const priorityBadge = PRIORITY_BADGE[ticket.priority];
                      return (
                        <div key={ticket.id} className={styles.ticketRow}>
                          <div className={styles.ticketBody}>
                            <div className={styles.ticketSubject}>{ticket.subject}</div>
                            <div className={styles.ticketBadges}>
                              <span
                                className={cx(
                                  styles.badge,
                                  styles[statusBadge.className as keyof typeof styles]
                                )}
                              >
                                {statusBadge.label}
                              </span>
                              <span
                                className={cx(
                                  styles.badge,
                                  styles[priorityBadge.className as keyof typeof styles]
                                )}
                              >
                                {priorityBadge.label}
                              </span>
                            </div>
                          </div>
                          <div className={styles.itemMeta}>
                            {formatDate(ticket.createdAt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Contact channels */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Other Ways to Reach Us</div>
                </div>
                <div className={styles.itemList}>
                  {[
                    { icon: "💬", label: "Live Chat", detail: "Use the Messages page for real-time conversation" },
                    { icon: "📧", label: "Email",     detail: "support@maphari.co.za" },
                    { icon: "📞", label: "Phone",     detail: "+27 (0) 11 000 0000 — Weekdays 09:00–17:00 SAST" },
                  ].map((ch) => (
                    <div key={ch.label} className={styles.itemRow}>
                      <span className={styles.itemRowIconLg}>{ch.icon}</span>
                      <div>
                        <div className={styles.itemTitle}>{ch.label}</div>
                        <div className={cx(styles.itemMeta, styles.itemMetaWrap)}>
                          {ch.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SLA card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Response SLAs</div>
                </div>
                <div className={styles.cardBody}>
                  {[
                    { label: "Standard tickets", sla: "1 business day", color: styles.badgeGreen },
                    { label: "High priority",    sla: "4 hours",        color: styles.badgeAmber },
                    { label: "Critical / urgent", sla: "1–2 hours",     color: styles.badgeRed   },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className={cx(styles.toggleRow, styles.toggleRowSla)}
                    >
                      <div className={cx(styles.toggleLabel, styles.toggleLabelSm)}>
                        {row.label}
                      </div>
                      <span className={cx(styles.badge, row.color)}>{row.sla}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRole(role: string): string {
  if (role === "ADMIN")  return "Project Lead / Admin";
  if (role === "STAFF")  return "Developer / Specialist";
  if (role === "CLIENT") return "Client Collaborator";
  return role;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}
