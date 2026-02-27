import { useMemo, useState } from "react";
import { cx, styles } from "../style";

type ClientOnboardingPageProps = {
  active: boolean;
};

type ChecklistItemAction = {
  label: string;
  cls: "" | "primary";
};

type ChecklistItem = {
  id: number;
  title: string;
  desc: string;
  req: boolean;
  done: boolean;
  actions: ChecklistItemAction[];
};

type ChecklistPhase = {
  num: number;
  title: string;
  items: ChecklistItem[];
};

type TeamMember = {
  av: string;
  bg: string;
  tc: string;
  name: string;
  role: string;
};

type AgendaItem = {
  text: string;
  dur: string;
};

type ReCard = {
  icon: string;
  title: string;
  desc: string;
};

type ToastState = {
  text: string;
  sub: string;
};

type ConfettiDot = {
  id: number;
  left: string;
  top: string;
  bg: string;
  delay: string;
};

type SignModalState = Pick<ChecklistItem, "id" | "title"> | null;

type TabName = "Onboarding" | "Kickoff Scheduler" | "Project Brief" | "Wrap Report" | "Testimonial" | "Re-engagement";
type PriorityName = "Low" | "Medium" | "High";

const PHASES: ChecklistPhase[] = [
  {
    num: 1,
    title: "Account & Access",
    items: [
      { id: 1, title: "Activate your portal account", desc: "Click the welcome email link to set your password and log in for the first time.", req: true, done: true, actions: [] },
      { id: 2, title: "Complete your profile", desc: "Add company name, billing contact, and profile photo so your team can reach you.", req: true, done: true, actions: [{ label: "Edit Profile", cls: "" }] },
      { id: 3, title: "Invite stakeholders", desc: "Add colleagues who need portal access — they'll receive a magic-link login email.", req: false, done: true, actions: [{ label: "Manage Users", cls: "" }] }
    ]
  },
  {
    num: 2,
    title: "Contracts & Agreements",
    items: [
      { id: 4, title: "Sign Master Service Agreement", desc: "Your MSA governs the entire engagement. Read carefully and e-sign below.", req: true, done: true, actions: [{ label: "View Signed Copy", cls: "" }] },
      { id: 5, title: "Sign Statement of Work — Client Portal v2", desc: "Project-specific SOW covering scope, timeline, milestones, and payment schedule.", req: true, done: false, actions: [{ label: "Sign Now", cls: "primary" }, { label: "Download PDF", cls: "" }] },
      { id: 6, title: "Data Processing Agreement (POPIA)", desc: "Required for POPIA compliance — covers data storage, processing, and protection.", req: true, done: false, actions: [{ label: "Review & Sign", cls: "primary" }] }
    ]
  },
  {
    num: 3,
    title: "Project Setup",
    items: [
      { id: 7, title: "Complete project brief intake", desc: "Share goals, brand guidelines, technical constraints, and success metrics.", req: true, done: true, actions: [{ label: "View Brief", cls: "" }] },
      { id: 8, title: "Schedule kickoff call", desc: "Book a 60-minute kickoff with your project lead. Shared agenda sent 24h before.", req: true, done: false, actions: [{ label: "Book Now", cls: "primary" }, { label: "Suggest Time", cls: "" }] },
      { id: 9, title: "Share brand assets", desc: "Upload logos, colour palettes, fonts, and existing design files.", req: false, done: true, actions: [{ label: "View Uploads", cls: "" }] }
    ]
  },
  {
    num: 4,
    title: "Optional Extras",
    items: [
      { id: 10, title: "Enable portal notifications", desc: "Choose how you receive milestone, invoice, and message updates — email or push.", req: false, done: false, actions: [{ label: "Set Preferences", cls: "primary" }] },
      { id: 11, title: "Watch the 3-minute portal tour", desc: "A quick walkthrough of milestones, invoices, files, and messaging features.", req: false, done: false, actions: [{ label: "Watch Tour", cls: "primary" }] }
    ]
  }
];

const TEAM: TeamMember[] = [
  { av: "SN", bg: "var(--accent-d)", tc: "var(--accent)", name: "Sipho Ndlovu", role: "Project Lead" },
  { av: "LM", bg: "var(--purple-d)", tc: "var(--purple)", name: "Lerato Mokoena", role: "UI/UX Design" },
  { av: "TK", bg: "var(--amber-d)", tc: "var(--amber)", name: "Thabo Khumalo", role: "Backend" }
];

const AGENDA_DEF: AgendaItem[] = [
  { text: "Welcome & introductions", dur: "5m" },
  { text: "Project scope & objectives", dur: "15m" },
  { text: "Team structure & communication norms", dur: "10m" },
  { text: "Milestone walkthrough & key dates", dur: "15m" },
  { text: "Q&A and open discussion", dur: "15m" }
];

const RE_CARDS: ReCard[] = [
  { icon: "🚀", title: "Phase 2 Expansion", desc: "Mobile app, API integrations, and advanced features" },
  { icon: "📊", title: "Analytics Suite", desc: "Custom dashboards, automated reporting, and BI tools" },
  { icon: "🤖", title: "AI Automation Pack", desc: "Invoice, onboarding, and CRM workflow automations" },
  { icon: "🛡", title: "Security & Compliance Audit", desc: "Penetration testing, POPIA compliance review" }
];

const SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30"] as const;
const BOOKED_SLOTS: string[] = ["10:00", "14:00"];

const TABS: TabName[] = ["Onboarding", "Kickoff Scheduler", "Project Brief", "Wrap Report", "Testimonial", "Re-engagement"];

export function ClientOnboardingPage({ active }: ClientOnboardingPageProps) {
  const [tab, setTab] = useState<TabName>("Onboarding");
  const [checks, setChecks] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    PHASES.forEach((phase) => phase.items.forEach((item) => {
      map[item.id] = item.done;
    }));
    return map;
  });
  const [agenda, setAgenda] = useState<AgendaItem[]>(AGENDA_DEF);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [stars, setStars] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [briefPriority, setBriefPriority] = useState<PriorityName>("Medium");
  const [signModal, setSignModal] = useState<SignModalState>(null);
  const [confetti, setConfetti] = useState<ConfettiDot[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3400);
  };

  const toggleCheck = (id: number) => setChecks((previous) => ({ ...previous, [id]: !previous[id] }));

  const allItems = useMemo(() => PHASES.flatMap((phase) => phase.items), []);
  const totalItems = allItems.length;
  const doneCount = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((doneCount / totalItems) * 100);
  const requiredLeft = allItems.filter((item) => item.req && !checks[item.id]).length;

  const phasePct = (phase: ChecklistPhase) => {
    const done = phase.items.filter((item) => checks[item.id]).length;
    return Math.round((done / phase.items.length) * 100);
  };

  const fireConfetti = () => {
    const dots: ConfettiDot[] = Array.from({ length: 28 }, (_, idx) => ({
      id: idx,
      left: `${20 + Math.random() * 60}%`,
      top: `${8 + Math.random() * 28}%`,
      bg: ["var(--accent)", "var(--purple)", "var(--green)", "var(--amber)"][idx % 4],
      delay: `${Math.random() * 0.4}s`
    }));
    setConfetti(dots);
    window.setTimeout(() => setConfetti([]), 2200);
  };

  const handleSign = () => {
    if (!signModal) return;
    setChecks((previous) => ({ ...previous, [signModal.id]: true }));
    setSignModal(null);
    fireConfetti();
    showToast("Document signed ✓", `${signModal.title} — e-signature recorded`);
  };

  const addAgenda = () => setAgenda((previous) => [...previous, { text: "", dur: "10m" }]);
  const deleteAgenda = (index: number) => setAgenda((previous) => previous.filter((_, idx) => idx !== index));
  const updateAgenda = (index: number, value: string) => setAgenda((previous) => previous.map((item, idx) => (idx === index ? { ...item, text: value } : item)));

  if (!active) return null;

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-onboarding">
      {confetti.length > 0 ? (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 300, overflow: "hidden" }}>
          {confetti.map((dot) => (
            <div
              key={dot.id}
              style={{
                position: "absolute", width: 7, height: 7, borderRadius: "50%",
                left: dot.left, top: dot.top, background: dot.bg, animationDelay: dot.delay,
                animation: "cfall 1.8s cubic-bezier(.23,1,.32,1) forwards"
              }}
            />
          ))}
        </div>
      ) : null}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflowX: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div className={styles.pageHeader}>
            <div>
              <div className={styles.eyebrow}>Client Journey · Setup</div>
              <div className={styles.pageTitle}>{tab}</div>
              <div className={styles.pageSub}>
                {tab === "Onboarding" && "Complete every step to unlock your full project experience."}
                {tab === "Kickoff Scheduler" && "Book your kickoff call and build the session agenda together."}
                {tab === "Project Brief" && "Tell us your goals, constraints, and definition of success."}
                {tab === "Wrap Report" && "Review your project summary and download all archived deliverables."}
                {tab === "Testimonial" && "Share your experience — your feedback directly improves how we work."}
                {tab === "Re-engagement" && "Explore what we can build together next."}
              </div>
            </div>
            {tab === "Onboarding" ? (
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="23" fill="none" stroke="var(--muted3)" strokeWidth="4" />
                  <circle cx="28" cy="28" r="23" fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray={`${(pct / 100) * 144.5} 144.5`} strokeDashoffset="36" strokeLinecap="round" style={{ transition: "stroke-dasharray .8s cubic-bezier(.23,1,.32,1)" }} />
                  <text x="28" y="33" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">{pct}%</text>
                </svg>
                <div style={{ fontSize: ".54rem", color: "var(--muted2)", marginTop: 3 }}>Complete</div>
              </div>
            ) : null}
          </div>

          <div className={styles.filterBar}>
            {TABS.map((nextTab) => (
              <button
                key={nextTab}
                className={cx(styles.filterTab, tab === nextTab && styles.filterTabActive)}
                type="button"
                onClick={() => setTab(nextTab)}
              >
                {nextTab}
              </button>
            ))}
          </div>

          {tab === "Onboarding" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, padding: "24px 28px 40px", alignItems: "start" }}>
              <div>
                {PHASES.map((phase) => (
                  <div key={phase.num} style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ fontSize: ".58rem", fontWeight: 700, color: "var(--accent)", width: 22, height: 22, border: "1px solid color-mix(in srgb,var(--accent) 30%,transparent)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{phase.num}</div>
                      <div style={{ fontSize: ".82rem", fontWeight: 800 }}>{phase.title}</div>
                      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                      <div style={{ fontSize: ".6rem", color: "var(--muted)" }}>{phasePct(phase)}%</div>
                    </div>
                    {phase.items.map((item, idx) => {
                      const firstPending = phase.items.find((candidate) => !checks[candidate.id]);
                      const isActive = firstPending?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 12,
                            padding: "13px 16px",
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            marginBottom: 8,
                            transition: "all .18s",
                            position: "relative",
                            opacity: checks[item.id] ? 0.6 : 1,
                            borderLeft: checks[item.id] ? "2px solid var(--green)" : !checks[item.id] && isActive ? "2px solid var(--accent)" : "1px solid var(--border)",
                            animationDelay: `${idx * 0.06}s`
                          }}
                        >
                          <div
                            style={{
                              width: 22, height: 22,
                              border: checks[item.id] ? "1.5px solid var(--green)" : "1.5px solid var(--border2)",
                              borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0, marginTop: 1, transition: "all .2s",
                              background: checks[item.id] ? "var(--green)" : "transparent",
                            }}
                            onClick={() => toggleCheck(item.id)}
                          >
                            {checks[item.id] ? <span style={{ fontSize: ".62rem", fontWeight: 800, color: "var(--on-accent)" }}>✓</span> : null}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: ".78rem", fontWeight: 700, marginBottom: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                              {item.title}
                              {item.req ? (
                                <span style={{ fontSize: ".52rem", color: "var(--red)", padding: "2px 6px", border: "1px solid rgba(255,95,95,.3)", borderRadius: 99, background: "var(--red-d)" }}>Required</span>
                              ) : (
                                <span style={{ fontSize: ".52rem", color: "var(--muted2)", padding: "2px 6px", border: "1px solid var(--border)", borderRadius: 99 }}>Optional</span>
                              )}
                            </div>
                            <div style={{ fontSize: ".7rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: 8 }}>{item.desc}</div>
                            {!checks[item.id] && item.actions.length > 0 ? (
                              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" as const }}>
                                {item.actions.map((action) => (
                                  <button
                                    key={action.label}
                                    className={action.cls === "primary" ? cx(styles.button, styles.buttonAccent, styles.buttonSm) : cx(styles.button, styles.buttonGhost, styles.buttonSm)}
                                    type="button"
                                    onClick={() => {
                                      if (action.label === "Sign Now" || action.label === "Review & Sign") {
                                        setSignModal({ id: item.id, title: item.title });
                                      } else if (action.label === "Book Now") {
                                        setTab("Kickoff Scheduler");
                                      } else {
                                        showToast(action.label, item.title);
                                      }
                                    }}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>Your Progress</div>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                    </div>
                    <div style={{ fontSize: ".6rem", color: "var(--muted2)", textAlign: "right", marginBottom: 10, marginTop: 4 }}>{doneCount} of {totalItems} steps</div>
                    {[
                      { lbl: "Required remaining", val: requiredLeft, col: requiredLeft > 0 ? "var(--red)" : "var(--green)" },
                      { lbl: "Optional remaining", val: totalItems - doneCount - requiredLeft, col: "var(--muted)" },
                      { lbl: "Completed", val: doneCount, col: "var(--green)" }
                    ].map((stat) => (
                      <div key={stat.lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontSize: ".6rem", color: "var(--muted)" }}>{stat.lbl}</span>
                        <span style={{ fontSize: ".68rem", fontWeight: 700, color: stat.col }}>{stat.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>Project Team</div>
                  </div>
                  <div className={styles.cardBody}>
                    {TEAM.map((member) => (
                      <div key={member.name} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".62rem", fontWeight: 800, flexShrink: 0, border: "1px solid var(--border)", background: member.bg, color: member.tc }}>{member.av}</div>
                        <div>
                          <div style={{ fontSize: ".72rem", fontWeight: 700 }}>{member.name}</div>
                          <div style={{ fontSize: ".56rem", color: "var(--muted)" }}>{member.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {pct === 100 ? (
                  <div className={styles.card} style={{ background: "var(--accent-g)", border: "1px solid color-mix(in srgb,var(--accent) 20%,transparent)" }}>
                    <div className={styles.cardBody}>
                      <div style={{ fontSize: ".78rem", fontWeight: 800, color: "var(--accent)", marginBottom: 6 }}>🎉 Fully Onboarded!</div>
                      <div style={{ fontSize: ".62rem", color: "var(--muted)", lineHeight: 1.6 }}>All steps complete. Your project is active and the team has what they need to start fast.</div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {tab === "Kickoff Scheduler" ? (
            <div className={styles.cols2} style={{ padding: "24px 28px 40px" }}>
              <div className={styles.card} style={{ padding: "20px 22px" }}>
                <div style={{ fontSize: ".82rem", fontWeight: 800, marginBottom: 14 }}>Schedule Your Kickoff</div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Preferred Date</label>
                  <input className={styles.formInput} type="date" defaultValue="2026-02-26" />
                </div>
                <div className={styles.formGroup} style={{ marginTop: 14 }}>
                  <label className={styles.formLabel}>Duration</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {(["30 min", "60 min", "90 min"] as const).map((duration) => (
                      <button
                        key={duration}
                        style={{
                          padding: "8px 4px", background: duration === "60 min" ? "var(--accent-d)" : "var(--bg)",
                          border: duration === "60 min" ? "1px solid var(--accent)" : "1px solid var(--border)",
                          fontSize: ".64rem", textAlign: "center" as const, transition: "all .15s",
                          color: duration === "60 min" ? "var(--accent)" : "var(--muted)"
                        }}
                        type="button"
                      >
                        {duration}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.formGroup} style={{ marginTop: 14 }}>
                  <label className={styles.formLabel}>Available Time Slots</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {SLOTS.map((slot) => (
                      <button
                        key={slot}
                        style={{
                          padding: "8px 4px",
                          background: selectedSlot === slot ? "var(--accent-d)" : "var(--bg)",
                          border: selectedSlot === slot ? "1px solid var(--accent)" : "1px solid var(--border)",
                          fontSize: ".64rem", textAlign: "center" as const, transition: "all .15s",
                          color: selectedSlot === slot ? "var(--accent)" : BOOKED_SLOTS.includes(slot) ? "var(--muted2)" : "var(--muted)",
                          opacity: BOOKED_SLOTS.includes(slot) ? 0.3 : 1,
                          pointerEvents: BOOKED_SLOTS.includes(slot) ? "none" : "auto"
                        }}
                        type="button"
                        onClick={() => !BOOKED_SLOTS.includes(slot) && setSelectedSlot(slot)}
                      >
                        {slot}{BOOKED_SLOTS.includes(slot) ? " ✗" : ""}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.formGroup} style={{ marginTop: 14 }}>
                  <label className={styles.formLabel}>Meeting Platform</label>
                  <select className={styles.formSelect}>
                    <option>Google Meet</option>
                    <option>Zoom</option>
                    <option>MS Teams</option>
                    <option>Phone Call</option>
                  </select>
                </div>
                <div className={styles.formGroup} style={{ marginTop: 14 }}>
                  <label className={styles.formLabel}>Notes for the team</label>
                  <textarea className={styles.formTextarea} placeholder="Specific topics, concerns, or preparation notes…" />
                </div>
                <button
                  className={cx(styles.button, styles.buttonAccent)}
                  style={{ width: "100%", marginTop: 16 }}
                  type="button"
                  onClick={() => { showToast("Kickoff booked!", `Confirmation sent · ${selectedSlot || "Time TBD"} · Feb 26`); setChecks((previous) => ({ ...previous, 8: true })); }}
                >
                  Confirm Kickoff →
                </button>
              </div>

              <div className={styles.card} style={{ padding: "20px 22px" }}>
                <div style={{ fontSize: ".82rem", fontWeight: 800, marginBottom: 10 }}>Session Agenda</div>
                <div style={{ fontSize: ".6rem", color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 }}>Edit items below. Agenda is emailed 24h before the call.</div>
                {agenda.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "var(--bg)", border: "1px solid var(--border)", marginBottom: 7 }}>
                    <div style={{ fontSize: ".58rem", color: "var(--muted2)", width: 18, textAlign: "center", flexShrink: 0 }}>{idx + 1}</div>
                    <input style={{ flex: 1, background: "none", border: "none", color: "var(--text)", fontSize: ".76rem", outline: "none" }} value={item.text} onChange={(event) => updateAgenda(idx, event.target.value)} placeholder="Agenda item…" />
                    <div style={{ fontSize: ".58rem", color: "var(--muted2)", flexShrink: 0 }}>{item.dur}</div>
                    <button style={{ background: "none", border: "none", color: "var(--muted2)", fontSize: ".75rem", flexShrink: 0 }} type="button" onClick={() => deleteAgenda(idx)}>×</button>
                  </div>
                ))}
                <button className={cx(styles.button, styles.buttonGhost)} style={{ width: "100%", marginTop: 4 }} type="button" onClick={addAgenda}>+ Add Item</button>
                <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: ".6rem", color: "var(--muted)" }}>
                  <span>Estimated duration</span>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>{agenda.length * 10}m</span>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Project Brief" ? (
            <div style={{ padding: "24px 28px 40px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
              <div className={styles.card} style={{ padding: "20px 22px" }}>
                <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>Company & Contact</div>
                <div className={styles.cols2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Company Name</label>
                    <input className={styles.formInput} defaultValue="Veldt Finance (Pty) Ltd" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Industry</label>
                    <input className={styles.formInput} defaultValue="Financial Services" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Primary Contact</label>
                    <input className={styles.formInput} defaultValue="Naledi Dlamini" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <input className={styles.formInput} defaultValue="naledi@veldtfinance.co.za" />
                  </div>
                </div>
              </div>

              <div className={styles.card} style={{ padding: "20px 22px" }}>
                <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>Project Goals</div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Problem we're solving</label>
                  <textarea className={styles.formTextarea} defaultValue="Our current client portal is outdated and hard to navigate. We need a modern replacement." />
                </div>
                <div className={styles.formGroup} style={{ marginTop: 12 }}>
                  <label className={styles.formLabel}>Definition of success (6 months)</label>
                  <textarea className={styles.formTextarea} defaultValue="All clients migrated. Support tickets down 40%. Satisfaction above 4.5/5." />
                </div>
                <div className={styles.formGroup} style={{ marginTop: 14 }}>
                  <label className={styles.formLabel}>Priority Level</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {(["Low", "Medium", "High"] as const).map((priority) => (
                      <button
                        key={priority}
                        style={{
                          padding: 9,
                          background: briefPriority === priority
                            ? priority === "Low" ? "var(--green-d)" : priority === "Medium" ? "var(--amber-d)" : "var(--red-d)"
                            : "var(--bg)",
                          border: briefPriority === priority
                            ? priority === "Low" ? "1px solid var(--green)" : priority === "Medium" ? "1px solid var(--amber)" : "1px solid var(--red)"
                            : "1px solid var(--border)",
                          fontSize: ".68rem", fontWeight: 700, transition: "all .15s",
                          color: briefPriority === priority
                            ? priority === "Low" ? "var(--green)" : priority === "Medium" ? "var(--amber)" : "var(--red)"
                            : "var(--muted)"
                        }}
                        type="button"
                        onClick={() => setBriefPriority(priority)}
                      >
                        {priority} Priority
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.card} style={{ padding: "20px 22px" }}>
                <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>Technical & Design Constraints</div>
                <div className={styles.cols2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tech Stack</label>
                    <select className={styles.formSelect}>
                      <option>React + Node.js</option>
                      <option>Next.js</option>
                      <option>Vue + Django</option>
                      <option>No preference</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Hosting</label>
                    <select className={styles.formSelect}>
                      <option>Vercel</option>
                      <option>AWS</option>
                      <option>Azure</option>
                      <option>Client-managed</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup} style={{ marginTop: 12 }}>
                  <label className={styles.formLabel}>Brand & Design Notes</label>
                  <textarea className={styles.formTextarea} defaultValue="Dark, premium aesthetic with the client primary accent." />
                </div>
                <div className={styles.formGroup} style={{ marginTop: 12 }}>
                  <label className={styles.formLabel}>Required Integrations</label>
                  <textarea className={styles.formTextarea} defaultValue="Stripe, Intercom, Supabase, Zapier, Notion" />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={() => showToast("Brief saved", "Draft stored — continue editing anytime")}>Save Draft</button>
                <button className={cx(styles.button, styles.buttonAccent)} style={{ flex: 1 }} type="button" onClick={() => { setChecks((previous) => ({ ...previous, 7: true })); showToast("Brief submitted", "Your project team has been notified"); }}>Submit Brief →</button>
              </div>
            </div>
          ) : null}

          {tab === "Wrap Report" ? (
            <div className={styles.cols2} style={{ padding: "24px 28px 40px", alignItems: "start" }}>
              <div className={styles.card} style={{ padding: "20px 22px" }}>
                <div style={{ fontSize: ".82rem", fontWeight: 800, marginBottom: 14 }}>Project Wrap Summary</div>
                {[
                  { lbl: "Project", val: "Client Portal v2" },
                  { lbl: "Duration", val: "Jan 08 — Mar 14, 2026" },
                  { lbl: "Total Billed", val: "R 90,000" },
                  { lbl: "Milestones Delivered", val: "6 of 6" },
                  { lbl: "Hours Logged", val: "342h across 5 team members" },
                  { lbl: "Final Status", val: "Delivered on schedule" }
                ].map((row) => (
                  <div key={row.lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: ".62rem", color: "var(--muted)" }}>{row.lbl}</span>
                    <span style={{ fontSize: ".66rem", fontWeight: 700 }}>{row.val}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button className={cx(styles.button, styles.buttonAccent)} style={{ flex: 1 }} type="button" onClick={() => showToast("Report downloaded", "PDF wrap report ready")}>Download PDF</button>
                  <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={() => showToast("Emailed", "Sent to naledi@veldtfinance.co.za")}>Email</button>
                </div>
              </div>

              <div className={styles.card} style={{ padding: "20px 22px" }}>
                <div style={{ fontSize: ".82rem", fontWeight: 800, marginBottom: 6 }}>Deliverable Archive</div>
                <div style={{ fontSize: ".6rem", color: "var(--muted)", marginBottom: 14 }}>All project files packaged and ready to download.</div>
                {[
                  { icon: "🎨", name: "Design System + Figma Files", size: "48 MB" },
                  { icon: "💻", name: "Frontend Source Code (GitHub)", size: "Link" },
                  { icon: "📄", name: "Signed Contracts & SOW", size: "3.2 MB" },
                  { icon: "📊", name: "QA Reports — Sprints 1–4", size: "1.8 MB" },
                  { icon: "📋", name: "Meeting Notes Archive", size: "420 KB" }
                ].map((file) => (
                  <div key={file.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg)", border: "1px solid var(--border)", marginBottom: 7 }}>
                    <span style={{ fontSize: ".85rem", flexShrink: 0 }}>{file.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: ".72rem", fontWeight: 700 }}>{file.name}</div>
                      <div style={{ fontSize: ".56rem", color: "var(--muted2)" }}>{file.size}</div>
                    </div>
                    <button className={cx(styles.button, styles.buttonGhost, styles.buttonSm)} type="button" onClick={() => showToast("Downloading", file.name)}>↓</button>
                  </div>
                ))}
                <button className={cx(styles.button, styles.buttonGhost)} style={{ width: "100%", marginTop: 4 }} type="button" onClick={() => showToast("ZIP downloaded", "All deliverables packaged")}>Download All as ZIP</button>
              </div>
            </div>
          ) : null}

          {tab === "Testimonial" ? (
            <div style={{ padding: "24px 28px 40px", maxWidth: 620 }}>
              <div className={styles.card} style={{ padding: "20px 22px" }}>
                <div style={{ fontSize: ".82rem", fontWeight: 800, marginBottom: 4 }}>Share Your Experience</div>
                <div style={{ fontSize: ".62rem", color: "var(--muted)", marginBottom: 18 }}>Your feedback helps us improve and gives future clients confidence.</div>
                <div style={{ fontSize: ".56rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 8 }}>Overall Rating</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      style={{ fontSize: "1.3rem", background: "none", border: "none", opacity: rating <= (hoverStar || stars) ? 1 : 0.25, transition: "all .15s" }}
                      type="button"
                      onMouseEnter={() => setHoverStar(rating)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() => setStars(rating)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {stars > 0 ? <div style={{ fontSize: ".6rem", color: "var(--muted)", marginBottom: 16 }}>{["", "Needs improvement", "Below expectations", "Met expectations", "Exceeded expectations", "Outstanding! 🎉"][stars]}</div> : null}
                <div style={{ fontSize: ".56rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 8, marginTop: 18 }}>Your Testimonial</div>
                <textarea className={styles.formTextarea} placeholder="Tell us what you loved, what surprised you, and what we could improve…" style={{ marginBottom: 14 }} />
                <div style={{ fontSize: ".56rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 8 }}>Permission to Publish</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {["Yes, with my name & company", "Yes, anonymously", "No — internal only"].map((permission) => (
                    <button
                      key={permission}
                      className={cx(styles.button, styles.buttonGhost)}
                      style={{ textAlign: "left", padding: "9px 12px", fontSize: ".66rem" }}
                      type="button"
                    >
                      {permission}
                    </button>
                  ))}
                </div>
                <button className={cx(styles.button, styles.buttonAccent)} style={{ width: "100%" }} type="button" onClick={() => showToast("Thank you!", "Your testimonial has been submitted")}>Submit Feedback →</button>
              </div>
            </div>
          ) : null}

          {tab === "Re-engagement" ? (
            <div style={{ padding: "24px 28px 40px", maxWidth: 720 }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "3px solid var(--accent)", padding: "16px 18px", marginBottom: 20 }}>
                <div style={{ fontSize: ".82rem", fontWeight: 800, marginBottom: 6 }}>What's next for Veldt Finance?</div>
                <div style={{ fontSize: ".64rem", color: "var(--muted)", lineHeight: 1.7 }}>Based on your project history and goals, here are natural next steps.</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                {RE_CARDS.map((card) => (
                  <div
                    key={card.title}
                    style={{ padding: "14px 16px", background: "var(--bg)", border: "1px solid var(--border)", transition: "all .15s" }}
                    onClick={() => showToast("Scoping request sent", `We'll follow up on ${card.title} within 2 business days`)}
                  >
                    <div style={{ fontSize: "1.1rem", marginBottom: 7 }}>{card.icon}</div>
                    <div style={{ fontSize: ".76rem", fontWeight: 800, marginBottom: 3 }}>{card.title}</div>
                    <div style={{ fontSize: ".58rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: 8 }}>{card.desc}</div>
                    <div style={{ fontSize: ".56rem", color: "var(--accent)" }}>Enquire →</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: ".62rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 10 }}>Or send a direct message</div>
              <textarea className={styles.formTextarea} style={{ marginBottom: 12 }} placeholder="Tell us what you have in mind — we'll respond within 1 business day." />
              <button className={cx(styles.button, styles.buttonAccent)} type="button" onClick={() => showToast("Message sent", "We'll be in touch within 1 business day")}>Send Message →</button>
            </div>
          ) : null}
        </div>
      </div>

      {signModal ? (
        <div className={styles.overlay} onClick={() => setSignModal(null)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>E-Sign Document</span>
              <button className={styles.modalClose} type="button" onClick={() => setSignModal(null)}>✕</button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: ".56rem", color: "var(--muted2)", marginBottom: 3 }}>Document</div>
                <div style={{ fontSize: ".8rem", fontWeight: 700 }}>{signModal.title}</div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Legal Name</label>
                <input className={styles.formInput} defaultValue="Naledi Dlamini" />
              </div>
              <div className={styles.formGroup} style={{ marginTop: 14 }}>
                <label className={styles.formLabel}>Company Name</label>
                <input className={styles.formInput} defaultValue="Veldt Finance (Pty) Ltd" />
              </div>
              <div className={styles.formGroup} style={{ marginTop: 14 }}>
                <label className={styles.formLabel}>Signature Preview</label>
                <div style={{ border: "1px dashed var(--border2)", height: 72, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", marginBottom: 14 }}>
                  <span style={{ fontFamily: "serif", fontSize: "1.5rem", fontStyle: "italic", color: "var(--text)", opacity: 0.65 }}>Naledi Dlamini</span>
                </div>
              </div>
              <div style={{ fontSize: ".58rem", color: "var(--muted2)", lineHeight: 1.65 }}>By clicking "Sign & Submit" you agree this constitutes a legally binding electronic signature.</div>
            </div>
            <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={() => setSignModal(null)}>Cancel</button>
              <button className={cx(styles.button, styles.buttonAccent)} type="button" onClick={handleSign}>Sign & Submit ✓</button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div style={{ position: "fixed", bottom: 28, right: 28, background: "var(--surface)", border: "1px solid var(--accent)", padding: "14px 20px", zIndex: 200, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 24, height: 24, background: "var(--accent)", color: "var(--on-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, flexShrink: 0, borderRadius: "50%" }}>✓</div>
          <div>
            <div style={{ fontSize: ".76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: ".6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
