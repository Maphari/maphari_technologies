"use client";

import { useMemo, useState } from "react";
import { cx, styles } from "../style";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────────── */

type ReferralStatus = "pending" | "signed_up" | "converted" | "rewarded";

type Referral = {
  id: string;
  name: string;
  email: string;
  status: ReferralStatus;
  reward: number;
  referredAt: string;
};

type RewardsSummary = {
  creditsEarned: number;
  creditsUsed: number;
  balance: number;
};

type HowItWorksStep = {
  step: number;
  title: string;
  description: string;
  icon: string;
};

type RewardHistoryEntry = {
  id: string;
  date: string;
  action: "credit_earned" | "credit_used";
  amount: number;
  referralName: string;
};

type RefTab = "Referrals" | "Rewards" | "How It Works";

/* ─────────────────────────────────────────────────────────────────────────────
   Seed data
   ───────────────────────────────────────────────────────────────────────────── */

const REFERRALS: Referral[] = [
  { id: "REF-001", name: "Thandi Mokoena",  email: "thandi.mokoena@veldt.co.za",    status: "converted", reward: 1500, referredAt: "2025-11-12" },
  { id: "REF-002", name: "Sipho Ndaba",     email: "sipho.ndaba@ngozi.co.za",       status: "rewarded",  reward: 1500, referredAt: "2025-10-05" },
  { id: "REF-003", name: "Lerato Dlamini",  email: "lerato.d@khumalo.com",          status: "converted", reward: 1500, referredAt: "2026-01-08" },
  { id: "REF-004", name: "James Olivier",   email: "james.olivier@capemedia.co.za", status: "signed_up", reward: 0,    referredAt: "2026-01-22" },
  { id: "REF-005", name: "Nomsa Zulu",      email: "nomsa.z@brightedge.io",         status: "pending",   reward: 0,    referredAt: "2026-02-10" },
  { id: "REF-006", name: "David Pretorius", email: "david.p@innovatelab.co.za",     status: "pending",   reward: 0,    referredAt: "2026-02-18" },
];

const REWARDS_SUMMARY: RewardsSummary = {
  creditsEarned: 4500,
  creditsUsed: 1500,
  balance: 3000,
};

const REWARD_HISTORY: RewardHistoryEntry[] = [
  { id: "RH-001", date: "2025-10-20", action: "credit_earned", amount: 1500, referralName: "Sipho Ndaba" },
  { id: "RH-002", date: "2025-11-28", action: "credit_earned", amount: 1500, referralName: "Thandi Mokoena" },
  { id: "RH-003", date: "2025-12-15", action: "credit_used",   amount: 1500, referralName: "Invoice INV-2026-008" },
  { id: "RH-004", date: "2026-01-20", action: "credit_earned", amount: 1500, referralName: "Lerato Dlamini" },
];

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: 1,
    title: "Share Your Link",
    description: "Copy your unique referral link and share it with colleagues, partners, or anyone who could benefit from Maphari's services. You can share via email, WhatsApp, LinkedIn, or any channel you prefer.",
    icon: "🔗",
  },
  {
    step: 2,
    title: "Friend Signs Up",
    description: "When someone clicks your link and signs up for a Maphari project, they are automatically tagged as your referral. They get a 10% discount on their first invoice — so both sides win.",
    icon: "👋",
  },
  {
    step: 3,
    title: "Earn Rewards",
    description: "Once your referral converts into a paying client, you earn R 1,500 in account credits. Credits can be applied to your own invoices, reducing your next bill automatically.",
    icon: "🎁",
  },
];

const REFERRAL_LINK = "https://maphari.co/ref/CLIENT-2026";

/* ─────────────────────────────────────────────────────────────────────────────
   Badge lookup
   ───────────────────────────────────────────────────────────────────────────── */

const STATUS_BADGE: Record<ReferralStatus, string> = {
  pending:   styles.badgeAmber,
  signed_up: styles.badgePurple,
  converted: styles.badgeAccent,
  rewarded:  styles.badgeGreen,
};

const STATUS_LABEL: Record<ReferralStatus, string> = {
  pending:   "Pending",
  signed_up: "Signed Up",
  converted: "Converted",
  rewarded:  "Rewarded",
};

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function truncateEmail(email: string, maxLen = 24): string {
  if (email.length <= maxLen) return email;
  const [local, domain] = email.split("@");
  const truncatedLocal = local.slice(0, Math.max(4, maxLen - domain.length - 4));
  return `${truncatedLocal}…@${domain}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────────────── */

export function ClientReferralsPage({ active }: { active: boolean }) {
  const [activeTab, setActiveTab] = useState<RefTab>("Referrals");
  const [linkCopied, setLinkCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);

  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(REFERRAL_LINK).then(() => {
      setLinkCopied(true);
      showToast("Link copied!", "Your referral link is ready to share");
      window.setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => {
      showToast("Copy failed", "Please copy the link manually");
    });
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    showToast("Invite sent", `Referral invitation sent to ${inviteEmail}`);
    setInviteEmail("");
  };

  const sortedReferrals = useMemo(
    () => [...REFERRALS].sort((a, b) => new Date(b.referredAt).getTime() - new Date(a.referredAt).getTime()),
    [],
  );

  const stats = useMemo(() => {
    const totalReferred = REFERRALS.length;
    const converted = REFERRALS.filter((r) => r.status === "converted" || r.status === "rewarded").length;
    const creditsEarned = REWARDS_SUMMARY.creditsEarned;
    return { totalReferred, converted, creditsEarned };
  }, []);

  const tabs: RefTab[] = ["Referrals", "Rewards", "How It Works"];

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-referrals">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Account</div>
          <div className={styles.pageTitle}>Referrals</div>
          <div className={styles.pageSub}>
            Refer clients to Maphari and earn account credits. Share your link, track sign-ups, and redeem rewards.
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            className={cx(styles.button, styles.buttonAccent)}
            onClick={handleCopyLink}
          >
            {linkCopied ? "Copied!" : "Copy Referral Link"}
          </button>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────── */}
      <div className={styles.statGrid}>
        {[
          { lbl: "Total Referred", val: String(stats.totalReferred), sub: "All-time referrals",  bar: styles.statBarAccent },
          { lbl: "Converted",      val: String(stats.converted),     sub: "Became paying clients", bar: styles.statBarGreen  },
          { lbl: "Credits Earned",  val: `R ${stats.creditsEarned.toLocaleString()}`, sub: "Lifetime earnings", bar: styles.statBarPurple },
        ].map((s, i) => (
          <div key={s.lbl} className={styles.statCard} style={{ "--i": i } as React.CSSProperties}>
            <div className={cx(styles.statBar, s.bar)} />
            <div className={styles.statLabel}>{s.lbl}</div>
            <div className={styles.statValue}>{s.val}</div>
            <div className={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        {tabs.map((tab) => (
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

      {/* ── Scrollable body ─────────────────────────────────────── */}
      <div className={styles.pageBody}>

        {/* ════════════════════════════════════════════════════════
           TAB: Referrals
           ════════════════════════════════════════════════════════ */}
        {activeTab === "Referrals" ? (
          <>
            {/* Referral link display */}
            <div className={styles.referralLink}>
              <div className={styles.referralLinkUrl}>{REFERRAL_LINK}</div>
              <button
                type="button"
                className={styles.referralCopy}
                onClick={handleCopyLink}
              >
                {linkCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            {/* Referrals table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Reward</th>
                    <th>Referred</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReferrals.map((ref) => (
                    <tr key={ref.id}>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: "0.78rem" }}>{ref.name}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontFamily: "var(--font-dm-mono)" }}>
                          {truncateEmail(ref.email)}
                        </span>
                      </td>
                      <td>
                        <span className={cx(styles.badge, STATUS_BADGE[ref.status])}>
                          {STATUS_LABEL[ref.status]}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: "0.76rem", fontFamily: "var(--font-syne)" }}>
                          {ref.reward > 0 ? `R ${ref.reward.toLocaleString()}` : "—"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.66rem", color: "var(--muted)" }}>
                          {formatDate(ref.referredAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invite via email */}
            <div className={styles.inviteRow}>
              <input
                className={styles.formInput}
                type="email"
                placeholder="friend@company.co.za"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className={cx(styles.button, styles.buttonAccent)}
                onClick={handleInvite}
              >
                Invite via Email
              </button>
            </div>

            {/* Referral info card */}
            <div style={{ padding: "0 32px 24px" }}>
              <div className={styles.card} style={{ padding: "18px 22px" }}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>How Referrals Work</div>
                    <div className={styles.cardSub}>Quick summary of the referral process</div>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { icon: "🔗", text: "Share your unique referral link with anyone" },
                      { icon: "📧", text: "Or invite directly by entering their email above" },
                      { icon: "🎉", text: "Earn R 1,500 in credits for every converted referral" },
                      { icon: "💳", text: "Credits are automatically applied to your next invoice" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: "1rem", flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.5 }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* ════════════════════════════════════════════════════════
           TAB: Rewards
           ════════════════════════════════════════════════════════ */}
        {activeTab === "Rewards" ? (
          <>
            {/* Rewards stat cards */}
            <div className={styles.statGrid} style={{ paddingTop: 4 }}>
              {[
                { lbl: "Credits Earned",  val: `R ${REWARDS_SUMMARY.creditsEarned.toLocaleString()}`,  sub: "From converted referrals", bar: styles.statBarGreen  },
                { lbl: "Credits Used",    val: `R ${REWARDS_SUMMARY.creditsUsed.toLocaleString()}`,    sub: "Applied to invoices",       bar: styles.statBarAmber  },
                { lbl: "Balance",         val: `R ${REWARDS_SUMMARY.balance.toLocaleString()}`,        sub: "Available to redeem",       bar: styles.statBarAccent },
              ].map((s, i) => (
                <div key={s.lbl} className={styles.statCard} style={{ "--i": i } as React.CSSProperties}>
                  <div className={cx(styles.statBar, s.bar)} />
                  <div className={styles.statLabel}>{s.lbl}</div>
                  <div className={styles.statValue}>{s.val}</div>
                  <div className={styles.statSub}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Rewards history */}
            <div style={{ padding: "0 32px" }}>
              <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>Rewards History</div>
              {REWARD_HISTORY.map((entry, i) => (
                <div
                  key={entry.id}
                  className={styles.rewardCard}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div className={styles.rewardAction}>
                      {entry.action === "credit_earned" ? "Credit Earned" : "Credit Used"}
                    </div>
                    <div className={styles.rewardMeta}>
                      {formatDate(entry.date)} · {entry.referralName}
                    </div>
                  </div>
                  <div
                    className={styles.rewardAmount}
                    style={{
                      color: entry.action === "credit_earned" ? "var(--green)" : "var(--amber)",
                    }}
                  >
                    {entry.action === "credit_earned" ? "+" : "−"} R {entry.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Balance summary bar */}
            <div style={{ padding: "20px 32px 8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Usage</span>
                <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>
                  {Math.round((REWARDS_SUMMARY.creditsUsed / REWARDS_SUMMARY.creditsEarned) * 100)}% used
                </span>
              </div>
              <div style={{ height: 6, background: "var(--b1)", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.round((REWARDS_SUMMARY.creditsUsed / REWARDS_SUMMARY.creditsEarned) * 100)}%`,
                    background: "var(--accent)",
                    borderRadius: 3,
                    transition: "width 0.8s cubic-bezier(.23,1,.32,1)",
                  }}
                />
              </div>
            </div>

            {/* How to redeem info card */}
            <div style={{ padding: "16px 32px 24px" }}>
              <div className={styles.card} style={{ padding: "18px 22px" }}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>How to Redeem</div>
                    <div className={styles.cardSub}>Use your earned credits towards upcoming invoices</div>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", background: "var(--lime-d)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.72rem", fontWeight: 800, color: "var(--accent)", flexShrink: 0,
                        fontFamily: "var(--font-syne)",
                      }}>1</div>
                      <div>
                        <div style={{ fontSize: "0.76rem", fontWeight: 700, marginBottom: 2 }}>Automatic Application</div>
                        <div style={{ fontSize: "0.66rem", color: "var(--muted)", lineHeight: 1.55 }}>
                          Credits are automatically applied to your next invoice when available. No action needed.
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", background: "var(--lime-d)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.72rem", fontWeight: 800, color: "var(--accent)", flexShrink: 0,
                        fontFamily: "var(--font-syne)",
                      }}>2</div>
                      <div>
                        <div style={{ fontSize: "0.76rem", fontWeight: 700, marginBottom: 2 }}>Manual Selection</div>
                        <div style={{ fontSize: "0.66rem", color: "var(--muted)", lineHeight: 1.55 }}>
                          Alternatively, go to the Invoices page and toggle "Apply Credits" on any outstanding invoice.
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", background: "var(--lime-d)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.72rem", fontWeight: 800, color: "var(--accent)", flexShrink: 0,
                        fontFamily: "var(--font-syne)",
                      }}>3</div>
                      <div>
                        <div style={{ fontSize: "0.76rem", fontWeight: 700, marginBottom: 2 }}>No Expiry</div>
                        <div style={{ fontSize: "0.66rem", color: "var(--muted)", lineHeight: 1.55 }}>
                          Your credits never expire. Accumulate them over time and use whenever convenient.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* ════════════════════════════════════════════════════════
           TAB: How It Works
           ════════════════════════════════════════════════════════ */}
        {activeTab === "How It Works" ? (
          <>
            {/* Step cards grid */}
            <div className={styles.stepGrid}>
              {HOW_IT_WORKS_STEPS.map((step, i) => (
                <div
                  key={step.step}
                  className={styles.stepCard}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <div className={styles.stepNumber}>{step.step}</div>
                  <div className={styles.stepIcon}>{step.icon}</div>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepDesc}>{step.description}</div>
                </div>
              ))}
            </div>

            {/* Detailed breakdown */}
            <div style={{ padding: "0 32px 24px" }}>
              <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>Programme Details</div>

              <div className={styles.card} style={{ padding: "20px 24px", marginBottom: 14 }}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>Reward Structure</div>
                    <div className={styles.cardSub}>What you earn for each successful referral</div>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Milestone</th>
                          <th>Your Reward</th>
                          <th>Referral Benefit</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <span style={{ fontWeight: 600, fontSize: "0.74rem" }}>Sign-up</span>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Tracking starts</span>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Welcome email</span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span style={{ fontWeight: 600, fontSize: "0.74rem" }}>First Project</span>
                          </td>
                          <td>
                            <span className={cx(styles.badge, styles.badgeAccent)}>R 1,500 credit</span>
                          </td>
                          <td>
                            <span className={cx(styles.badge, styles.badgeGreen)}>10% off first invoice</span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span style={{ fontWeight: 600, fontSize: "0.74rem" }}>Repeat Client</span>
                          </td>
                          <td>
                            <span className={cx(styles.badge, styles.badgePurple)}>R 750 bonus</span>
                          </td>
                          <td>
                            <span className={cx(styles.badge, styles.badgeGreen)}>5% loyalty discount</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className={styles.card} style={{ padding: "20px 24px", marginBottom: 14 }}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>Terms & Conditions</div>
                    <div className={styles.cardSub}>Important information about the referral programme</div>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      "Credits are awarded once the referred client signs their first project agreement.",
                      "There is no limit to the number of clients you can refer.",
                      "Credits never expire and can be applied to any invoice.",
                      "Self-referrals are not eligible for the programme.",
                      "Maphari reserves the right to modify the programme terms with 30 days notice.",
                      "Credits are non-transferable and cannot be exchanged for cash.",
                    ].map((term, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{
                          fontSize: "0.56rem", color: "var(--accent)", fontWeight: 800,
                          marginTop: 3, flexShrink: 0,
                        }}>●</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--muted)", lineHeight: 1.55 }}>{term}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className={styles.card} style={{ padding: "20px 24px" }}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>Frequently Asked Questions</div>
                    <div className={styles.cardSub}>Common questions about the referral programme</div>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      {
                        q: "When do I receive my credits?",
                        a: "Credits are issued as soon as your referral signs their first project agreement with Maphari. You will receive an email confirmation.",
                      },
                      {
                        q: "Can I refer someone who already knows about Maphari?",
                        a: "Yes, as long as they have not previously been a Maphari client and sign up through your unique referral link.",
                      },
                      {
                        q: "Is there a maximum number of referrals?",
                        a: "No. You can refer as many clients as you like. There is no cap on the credits you can earn.",
                      },
                      {
                        q: "What happens if my referral cancels their project?",
                        a: "If the referral cancels within the first 14 days, the credit may be reversed. After that, all credits are permanent.",
                      },
                    ].map((faq, i) => (
                      <div key={i}>
                        <div style={{ fontSize: "0.76rem", fontWeight: 700, marginBottom: 4 }}>{faq.q}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--muted)", lineHeight: 1.55 }}>{faq.a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* ── Toast ───────────────────────────────────────────────── */}
      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            background: "var(--s1)",
            border: "1px solid var(--accent)",
            padding: "14px 20px",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderRadius: "var(--r-md)",
            animation: "slideUp var(--dur-normal, 250ms) var(--ease-out, cubic-bezier(0.23,1,0.32,1))",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              background: "var(--accent)",
              color: "var(--on-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 700,
              flexShrink: 0,
              borderRadius: "50%",
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
