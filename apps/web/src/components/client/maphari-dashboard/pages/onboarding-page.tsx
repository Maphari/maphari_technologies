"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";

type OnboardTab =
  | "Welcome"
  | "Onboarding Checklist"
  | "How We Work"
  | "Project Brief"
  | "Offboarding"
  | "Testimonial";

type ChecklistItem = {
  title: string;
  desc: string;
  done: boolean;
  meta: string;
};

type Mood = "😄" | "😊" | "😐" | "😟" | "😡";

type StepState = "done" | "active" | "pending";

type WrapState = "done" | "pending";

type WrapItem = {
  icon: string;
  name: string;
  meta: string;
  status: WrapState;
};

const CHECKLIST_SEED: ChecklistItem[] = [
  { title: "Welcome email & portal access sent", desc: "You received login credentials and a welcome email on Jan 8, 2026.", done: true, meta: "Completed Jan 8" },
  { title: "Kickoff meeting scheduled & held", desc: "Introduction call with the full team to align on goals, timeline, and communication preferences.", done: true, meta: "Completed Jan 10" },
  { title: "Contract signed & countersigned", desc: "Service agreement signed by both parties. Copy available in Documents.", done: true, meta: "Completed Jan 9" },
  { title: "Project brief submitted", desc: "You submitted your project brief including goals, target audience, and design references.", done: true, meta: "Completed Jan 11" },
  { title: "Brand discovery session", desc: "Deep-dive workshop to extract brand values, tone, and visual direction.", done: true, meta: "Completed Jan 14" },
  { title: "Portal walkthrough tutorial", desc: "Guided tour of all dashboard features — notifications, files, invoices, and project tracking.", done: true, meta: "Completed Jan 12" },
  { title: "Team introductions", desc: "Meet your project lead, designer, and developer — all accessible via the portal.", done: true, meta: "Completed Jan 10" },
  { title: "Communication preferences set", desc: "Agreed on weekly digest emails, Slack for quick queries, portal for formal approvals.", done: true, meta: "Completed Jan 12" },
];

const PROCESS_STEPS: Array<{ title: string; desc: string; state: StepState }> = [
  { title: "Discovery & Kickoff", desc: "Understanding your business, goals, and project requirements. Building the foundation.", state: "done" },
  { title: "Strategy & Planning", desc: "Defining the project roadmap, milestones, and success criteria together.", state: "done" },
  { title: "Design & Development", desc: "The core build phase. You review and approve deliverables at each stage.", state: "active" },
  { title: "Review & Testing", desc: "Quality assurance, client feedback, and refinement before launch.", state: "pending" },
  { title: "Launch & Handover", desc: "Going live, knowledge transfer, and ensuring your team is fully equipped.", state: "pending" },
  { title: "Post-Launch Support", desc: "30-day support window for any issues or tweaks after launch.", state: "pending" },
];

const WRAP_ITEMS: WrapItem[] = [
  { icon: "📊", name: "Final Project Report", meta: "Auto-generated on project close · PDF", status: "pending" },
  { icon: "📁", name: "Asset Handover Pack", meta: "All files, source files, and credentials", status: "pending" },
  { icon: "📚", name: "Knowledge Base & How-To Guide", meta: "How to manage and update your new platform", status: "pending" },
  { icon: "✍️", name: "Testimonial Request", meta: "Share your experience (optional)", status: "pending" },
  { icon: "🔄", name: "Re-engagement Offer", meta: "Next phase or retainer proposal", status: "pending" },
  { icon: "🎓", name: "Offboarding Survey", meta: "Help us improve for future clients", status: "pending" },
];

const TABS: OnboardTab[] = [
  "Welcome",
  "Onboarding Checklist",
  "How We Work",
  "Project Brief",
  "Offboarding",
  "Testimonial",
];

export function OnboardingPage() {
  const [tab, setTab] = useState<OnboardTab>("Welcome");
  const [checks, setChecks] = useState<ChecklistItem[]>(CHECKLIST_SEED);
  const [briefModal, setBriefModal] = useState(false);
  const [testimonialModal, setTestimonialModal] = useState(false);
  const [stars, setStars] = useState(0);
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  // Save Changes modal controlled fields
  const [briefBusinessOverview, setBriefBusinessOverview] = useState("");
  const [briefProjectGoals, setBriefProjectGoals] = useState("");
  const [briefTargetAudience, setBriefTargetAudience] = useState("");
  const [briefDesignReferences, setBriefDesignReferences] = useState("");

  // Testimonial modal controlled fields
  const [testimonialText, setTestimonialText] = useState("");
  const [testimonialConsent, setTestimonialConsent] = useState("Yes — with my name and company");

  const [moods, setMoods] = useState<Record<string, Mood>>({
    "This week": "😊",
    "Last week": "😐",
    "Week of Feb 7": "😊",
  });

  const donePct = useMemo(() => {
    const total = checks.length || 1;
    const done = checks.filter((item) => item.done).length;
    return Math.round((done / total) * 100);
  }, [checks]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  function handleSaveChanges(): void {
    // TODO: wire to portal API when onboarding preferences endpoint is available
    notify("Brief updated", "The team has been notified");
    setBriefModal(false);
  }

  function handleSubmitTestimonial(): void {
    if (!testimonialText.trim()) {
      notify("Missing testimonial", "Please write your testimonial before submitting.");
      return;
    }
    // TODO: wire to testimonial API when available
    notify("Thank you", "Your testimonial has been submitted");
    setTestimonialText("");
    setTestimonialConsent("Yes — with my name and company");
    setTestimonialModal(false);
  }

  return (
    <div className={cx("pageBody", styles.onboardFlowRoot, "rdStudioPage")}>
      <section className={styles.onboardFlowMain}>
          <div className={cx("pageHeader", "mb0")}>
            <div>
              <div className={cx("pageEyebrow")}>Your Company · Getting Started</div>
              <h1 className={cx("pageTitle")}>Onboarding &amp; Offboarding</h1>
              <p className={cx("pageSub")}>Everything to get started now, and a smooth handover at project close.</p>
            </div>
            <div className={cx("pageActions")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Guide downloaded", "Welcome guide saved as PDF")}>Download Guide</button>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setBriefModal(true)}>Update Brief</button>
            </div>
          </div>

          <div className={styles.onboardFlowTabs}>
            {TABS.map((item) => (
              <button key={item} type="button" className={cx(styles.onboardFlowTab, tab === item && styles.onboardFlowTabActive)} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
          </div>

          {tab === "Welcome" ? (
            <div className={styles.onboardFlowContent}>
              <div className={styles.onboardFlowWelcomeCard}>
                <div className={styles.onboardFlowWelcomeEyebrow}>Welcome to Maphari</div>
                <div className={styles.onboardFlowWelcomeTitle}>Hello, Client. Let&apos;s build something great.</div>
                {/* TODO: Replace with real project data once portal data API is wired */}
                <div className={styles.onboardFlowWelcomeBody}>
                  We are excited to work with you. This portal is your source of truth — project progress, approvals, files, and next actions all in one place.
                  <br /><br />
                  Your project kicked off on January 10, 2026. You are currently 54% through with 35 days to launch.
                </div>
                <div className={styles.onboardFlowTeamRow}>
                  {/* TODO: Replace with real team member data once portal data API is wired */}
                  {[
                    { name: "Project Lead", role: "Project Lead", color: "#c8f135", initials: "PL" },
                    { name: "Designer", role: "Designer", color: "#8b6fff", initials: "DG" },
                    { name: "Developer", role: "Developer", color: "#3dd9d6", initials: "DV" },
                    { name: "Strategist", role: "Strategist", color: "#f5a623", initials: "ST" },
                  ].map((member) => (
                    <div key={member.name} className={styles.onboardFlowTeamCard}>
                      <div className={styles.onboardFlowAvatar} style={{ '--bg-color': member.color } as React.CSSProperties}>{member.initials}</div>
                      <div>
                        <div className={styles.onboardFlowTeamName}>{member.name}</div>
                        <div className={styles.onboardFlowTeamRole}>{member.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.onboardFlowGrid2}>
                <div>
                  <div className={styles.onboardFlowSectionTitle}>Quick Start</div>
                  <div className={cx("card")}>
                    {[
                      { icon: "📊", title: "Check your project status", desc: "See done, in progress, and next milestones." },
                      { icon: "✅", title: "Review pending approvals", desc: "You currently have 3 items waiting for response." },
                      { icon: "📁", title: "Access your files", desc: "All documents and deliverables in one place." },
                      { icon: "💬", title: "Ask the AI assistant", desc: "Get instant project answers 24/7." },
                    ].map((item) => (
                      <div key={item.title} className={styles.onboardFlowQuickRow}>
                        <span className={styles.onboardFlowQuickIcon}>{item.icon}</span>
                        <div className={styles.onboardFlowGrow}>
                          <div className={styles.onboardFlowQuickTitle}>{item.title}</div>
                          <div className={styles.onboardFlowQuickDesc}>{item.desc}</div>
                        </div>
                        <span className={styles.onboardFlowQuickArrow}>→</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className={styles.onboardFlowSectionTitle}>Project at a Glance</div>
                  <div className={cx("card")}>
                    {/* TODO: Replace with real project data once portal data API is wired */}
                    {[
                      ["Project", "Your Project"],
                      ["Start date", "January 10, 2026"],
                      ["Launch date", "March 28, 2026"],
                      ["Budget", "—"],
                      ["Project Lead", "Project Lead"],
                      ["Contract", "Fixed Price · 12 weeks"],
                      ["Phase", "UI/UX Design (Phase 3)"],
                      ["Portal access", "Since Jan 8, 2026"],
                    ].map(([key, value]) => (
                      <div key={key} className={styles.onboardFlowMetaRow}>
                        <span>{key}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Onboarding Checklist" ? (
            <div className={styles.onboardFlowContent}>
              <div>
                <div className={cx(styles.onboardFlowHeadInline, "rdStudioSection")}>
                  <div className={styles.onboardFlowHeadLineWrap}>
                    <span className={styles.onboardFlowSectionTitlePlain}>Onboarding Checklist</span>
                    <div className={styles.onboardFlowHeadLine} />
                  </div>
                  <span className={cx("badge", "badgeGreen", "rdStudioMetricPos")}>{donePct}% complete</span>
                </div>

                <div className={cx("card", styles.onboardFlowCheckCard, "rdStudioCard")}>
                  {checks.map((item, index) => (
                    <div key={`${item.title}-${index}`} className={styles.onboardFlowCheckRow}>
                      <button
                        type="button"
                        className={cx(styles.onboardFlowCheckBox, item.done && styles.onboardFlowCheckDone)}
                        onClick={() => {
                          setChecks((prev) => prev.map((entry, i) => (i === index ? { ...entry, done: !entry.done } : entry)));
                        }}
                        aria-label={item.done ? "Mark incomplete" : "Mark complete"}
                      >
                        {item.done ? "✓" : ""}
                      </button>

                      <div className={styles.onboardFlowGrow}>
                        <div className={cx(styles.onboardFlowCheckTitle, item.done && styles.onboardFlowStrike)}>{item.title}</div>
                        <div className={styles.onboardFlowCheckDesc}>{item.desc}</div>
                        {item.done ? <div className={styles.onboardFlowCheckMeta}>{item.meta}</div> : null}
                      </div>

                      {item.done ? <span className={cx("badge", "badgeGreen")}>Done</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "How We Work" ? (
            <div className={styles.onboardFlowContent}>
              <div>
                <div className={styles.onboardFlowSectionTitle}>Our Process</div>
                <div className={cx("card", styles.onboardFlowStepCard, "rdStudioCard")}>
                  {PROCESS_STEPS.map((item, index) => (
                    <div key={item.title} className={styles.onboardFlowStepRow}>
                      <div className={cx(
                        styles.onboardFlowStepNum,
                        item.state === "done"
                          ? styles.onboardFlowStepDone
                          : item.state === "active"
                            ? styles.onboardFlowStepActive
                            : styles.onboardFlowStepPending,
                      )}>
                        {item.state === "done" ? "✓" : item.state === "active" ? "●" : String(index + 1)}
                      </div>
                      <div className={styles.onboardFlowGrow}>
                        <div className={styles.onboardFlowStepTitleRow}>
                          <div className={cx(styles.onboardFlowStepTitle, "rdStudioLabel")}>{item.title}</div>
                          <span className={cx("badge", item.state === "done" ? "badgeGreen" : item.state === "active" ? "badgeAccent" : "badgeMuted")}>
                            {item.state === "done" ? "Complete" : item.state === "active" ? "Current" : "Upcoming"}
                          </span>
                        </div>
                        <div className={styles.onboardFlowStepDesc}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className={styles.onboardFlowSectionTitle}>Communication Norms</div>
                <div className={styles.onboardFlowGrid2}>
                  {[
                    { icon: "📧", title: "Weekly Digest", desc: "Every Monday at 07:00 with summary + next steps." },
                    { icon: "💬", title: "Slack for Quick Queries", desc: "Fast questions answered during business hours." },
                    { icon: "📋", title: "Portal for Approvals", desc: "Formal sign-off and scope decisions happen here." },
                    { icon: "📞", title: "Fortnightly Check-ins", desc: "30-minute call every two weeks." },
                  ].map((item) => (
                    <div key={item.title} className={cx("card", styles.onboardFlowCommsCard)}>
                      <div className={styles.onboardFlowCommsIcon}>{item.icon}</div>
                      <div className={styles.onboardFlowCommsTitle}>{item.title}</div>
                      <div className={styles.onboardFlowCommsDesc}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Project Brief" ? (
            <div className={styles.onboardFlowContent}>
              <div>
                <div className={styles.onboardFlowSectionTitle}>Your Project Brief</div>
                <div className={cx("card")}>
                  <div className={cx("cardHeader")}>
                    <div>
                      <div className={cx("cardTitle")}>Submitted Brief</div>
                      <div className={cx("cardMeta")}>Last updated Jan 11, 2026</div>
                    </div>
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setBriefModal(true)}>Edit Brief</button>
                  </div>

                  {/* TODO: Replace with real project brief data once portal data API is wired */}
                  {[
                    ["Business Overview", "—"],
                    ["Project Goals", "—"],
                    ["Target Audience", "—"],
                    ["Design References", "—"],
                    ["Success Metrics", "—"],
                    ["Key Constraints", "—"],
                  ].map(([key, value]) => (
                    <div key={String(key)} className={styles.onboardFlowBriefRow}>
                      <div className={styles.onboardFlowBriefLabel}>{key}</div>
                      <div className={styles.onboardFlowBriefValue}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Offboarding" ? (
            <div className={styles.onboardFlowContent}>
              <div className={styles.onboardFlowOffboardingNotice}>
                <div className={styles.onboardFlowOffboardingEyebrow}>Project Status: In Progress</div>
                {/* TODO: Replace with real project data once portal data API is wired */}
                <div className={styles.onboardFlowOffboardingText}>Offboarding steps unlock near final phase. Estimated completion: March 28, 2026.</div>
              </div>

              <div>
                <div className={styles.onboardFlowSectionTitle}>Project Wrap Checklist</div>
                <div className={cx("card", styles.onboardFlowWrapCard)}>
                  {WRAP_ITEMS.map((item) => (
                    <div key={item.name} className={styles.onboardFlowWrapRow}>
                      <span className={styles.onboardFlowWrapIcon}>{item.icon}</span>
                      <div className={styles.onboardFlowGrow}>
                        <div className={styles.onboardFlowWrapName}>{item.name}</div>
                        <div className={styles.onboardFlowWrapMeta}>{item.meta}</div>
                      </div>
                      {item.status === "done" ? (
                        <span className={cx("badge", "badgeGreen")}>Done</span>
                      ) : (
                        <button type="button" className={cx("btnSm", "btnGhost", styles.onboardFlowPendingBtn)} onClick={() => notify("Not yet available", "This unlocks at project completion")}>Pending</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Testimonial" ? (
            <div className={styles.onboardFlowContent}>
              <div>
                <div className={styles.onboardFlowSectionTitle}>Share Your Experience</div>
                <div className={cx("card", styles.onboardFlowTestimonialPrompt)}>
                  <div className={styles.onboardFlowPromptIcon}>⭐</div>
                  <div className={styles.onboardFlowPromptTitle}>How has working with Maphari been so far?</div>
                  <div className={styles.onboardFlowPromptBody}>
                    Honest feedback helps us improve and helps other businesses decide if we are the right fit.
                  </div>
                  <div className={styles.onboardFlowStarRow}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button key={value} type="button" className={styles.onboardFlowStarBtn} style={{ '--filter': stars >= value ? "none" : "grayscale(1) opacity(.42)", '--transform': stars >= value ? "scale(1.13)" : "scale(1)" } as React.CSSProperties} onClick={() => setStars(value)}>⭐</button>
                    ))}
                  </div>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setTestimonialModal(true)}>Write a Testimonial</button>
                </div>
              </div>

              <div>
                <div className={styles.onboardFlowSectionTitle}>What Others Say</div>
                <div className={styles.onboardFlowGrid2}>
                  {[
                    {
                      stars: "⭐⭐⭐⭐⭐",
                      text: "Maphari transformed how we think about our product. The portal kept us informed and in control throughout.",
                      from: "Thandi M. · Founder, Umvelo Media",
                    },
                    {
                      stars: "⭐⭐⭐⭐⭐",
                      text: "The transparency stands out. I always knew where we were, what was next, and what I needed to do.",
                      from: "Kabelo R. · COO, Kasi Digital",
                    },
                  ].map((item) => (
                    <div key={item.from} className={styles.onboardFlowTestiCard}>
                      <div className={styles.onboardFlowTestiStars}>{item.stars}</div>
                      <div className={styles.onboardFlowTestiText}>“{item.text}”</div>
                      <div className={styles.onboardFlowTestiFrom}>— {item.from}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>

      {briefModal ? (
        <div className={styles.onboardFlowModalBackdrop} onClick={() => setBriefModal(false)}>
          <div className={styles.onboardFlowModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.onboardFlowModalHeader}>
              <span className={styles.onboardFlowModalTitle}>Update Project Brief</span>
              <button type="button" className={styles.onboardFlowModalClose} onClick={() => setBriefModal(false)}>✕</button>
            </div>
            <div className={styles.onboardFlowModalBody}>
              <div className={styles.onboardFlowFieldBlock}>
                <label className={styles.onboardFlowFieldLabel}>Business overview</label>
                <textarea
                  className={styles.onboardFlowFieldArea}
                  placeholder="Describe your business and what you do..."
                  value={briefBusinessOverview}
                  onChange={(e) => setBriefBusinessOverview(e.target.value)}
                />
              </div>
              <div className={styles.onboardFlowFieldBlock}>
                <label className={styles.onboardFlowFieldLabel}>Project goals</label>
                <textarea
                  className={styles.onboardFlowFieldArea}
                  placeholder="What does success look like?"
                  value={briefProjectGoals}
                  onChange={(e) => setBriefProjectGoals(e.target.value)}
                />
              </div>
              <div className={styles.onboardFlowFieldBlock}>
                <label className={styles.onboardFlowFieldLabel}>Target audience</label>
                <input
                  className={styles.onboardFlowFieldInput}
                  placeholder="Who are your users?"
                  value={briefTargetAudience}
                  onChange={(e) => setBriefTargetAudience(e.target.value)}
                />
              </div>
              <div className={styles.onboardFlowFieldBlock}>
                <label className={styles.onboardFlowFieldLabel}>Design references</label>
                <input
                  className={styles.onboardFlowFieldInput}
                  placeholder="Link or describe what you like..."
                  value={briefDesignReferences}
                  onChange={(e) => setBriefDesignReferences(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.onboardFlowModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setBriefModal(false)}>Cancel</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={handleSaveChanges}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {testimonialModal ? (
        <div className={styles.onboardFlowModalBackdrop} onClick={() => setTestimonialModal(false)}>
          <div className={styles.onboardFlowModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.onboardFlowModalHeader}>
              <span className={styles.onboardFlowModalTitle}>Write a Testimonial</span>
              <button type="button" className={styles.onboardFlowModalClose} onClick={() => setTestimonialModal(false)}>✕</button>
            </div>
            <div className={styles.onboardFlowModalBody}>
              <div className={styles.onboardFlowFieldBlock}>
                <label className={styles.onboardFlowFieldLabel}>Your experience</label>
                <textarea
                  className={styles.onboardFlowFieldAreaLg}
                  placeholder="Tell us about working with Maphari..."
                  value={testimonialText}
                  onChange={(e) => setTestimonialText(e.target.value)}
                />
              </div>
              <div className={styles.onboardFlowFieldBlock}>
                <label className={styles.onboardFlowFieldLabel}>Can we use this on our website?</label>
                <select
                  className={styles.onboardFlowFieldSelect}
                  value={testimonialConsent}
                  onChange={(e) => setTestimonialConsent(e.target.value)}
                >
                  <option>Yes — with my name and company</option>
                  <option>Yes — anonymously</option>
                  <option>No — internal use only</option>
                </select>
              </div>
            </div>
            <div className={styles.onboardFlowModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setTestimonialModal(false)}>Cancel</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={handleSubmitTestimonial}
              >
                Submit Testimonial
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={cx("toastStack")}>
          <div className={cx("toast", "toastSuccess")}>
            <strong>{toast.title}</strong>
            <div>{toast.subtitle}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
