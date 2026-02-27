"use client";

import { useState, useMemo } from "react";
import { cx, styles } from "../style";

// ─── Types ────────────────────────────────────────────────────────────────────

type ArticleItem = {
  id: string;
  title: string;
  category: string;
  categoryTone: "accent" | "purple" | "amber" | "green";
  readTime: string;
  excerpt: string;
};

type VideoItem = {
  id: string;
  title: string;
  duration: string;
  category: string;
  categoryTone: "accent" | "purple" | "amber";
  thumbnailEmoji: string;
  thumbnailBg: string;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type ResourceTab = "Guides" | "Videos" | "FAQ";

// ─── Seed Data ────────────────────────────────────────────────────────────────

const ARTICLES: ArticleItem[] = [
  {
    id: "art-1",
    title: "How to Provide Effective Feedback",
    category: "Collaboration",
    categoryTone: "accent",
    readTime: "4 min",
    excerpt:
      "Learn how to give clear, actionable feedback that helps your project team deliver exactly what you envision. We cover structured formats, timing, and common pitfalls to avoid.",
  },
  {
    id: "art-2",
    title: "Understanding Your Invoice",
    category: "Finance",
    categoryTone: "amber",
    readTime: "3 min",
    excerpt:
      "A line-by-line breakdown of every section on your Maphari invoice, including tax calculations, milestone-based billing, and payment terms explained simply.",
  },
  {
    id: "art-3",
    title: "What to Expect During QA",
    category: "Delivery",
    categoryTone: "purple",
    readTime: "5 min",
    excerpt:
      "Quality assurance is a critical milestone. This guide walks you through our testing process, how bugs are categorised, and your role in the sign-off workflow.",
  },
  {
    id: "art-4",
    title: "Navigating the Client Portal",
    category: "Getting Started",
    categoryTone: "green",
    readTime: "3 min",
    excerpt:
      "A quick-start guide to the portal layout: sidebar navigation, project switching, notifications, and where to find key actions like approvals and file uploads.",
  },
  {
    id: "art-5",
    title: "Working with Milestones",
    category: "Delivery",
    categoryTone: "purple",
    readTime: "4 min",
    excerpt:
      "Milestones define the rhythm of your project. Understand how they are created, how to approve or reject them, and what happens after each sign-off.",
  },
  {
    id: "art-6",
    title: "Brand Guidelines Best Practices",
    category: "Collaboration",
    categoryTone: "accent",
    readTime: "6 min",
    excerpt:
      "Providing clear brand assets up front saves weeks of revision. Learn the ideal formats, file types, and documentation to share with your creative team.",
  },
  {
    id: "art-7",
    title: "Managing Change Requests",
    category: "Delivery",
    categoryTone: "purple",
    readTime: "3 min",
    excerpt:
      "Scope changes happen. This article explains how to submit a change request, what impact assessment looks like, and how the team handles timeline adjustments.",
  },
  {
    id: "art-8",
    title: "Getting the Most from Automation",
    category: "Intelligence",
    categoryTone: "green",
    readTime: "5 min",
    excerpt:
      "The portal offers automated scheduling, reminders, and status updates. Discover how to configure these tools to reduce manual follow-ups and stay informed.",
  },
];

const VIDEOS: VideoItem[] = [
  {
    id: "vid-1",
    title: "Portal Overview Tour",
    duration: "3:42",
    category: "Getting Started",
    categoryTone: "accent",
    thumbnailEmoji: "🖥",
    thumbnailBg: "var(--lime-d)",
  },
  {
    id: "vid-2",
    title: "Submitting a New Request",
    duration: "2:18",
    category: "Projects",
    categoryTone: "purple",
    thumbnailEmoji: "📝",
    thumbnailBg: "var(--purple-d)",
  },
  {
    id: "vid-3",
    title: "Reviewing Deliverables",
    duration: "4:05",
    category: "Delivery",
    categoryTone: "amber",
    thumbnailEmoji: "✅",
    thumbnailBg: "var(--amber-d)",
  },
  {
    id: "vid-4",
    title: "Understanding Reports",
    duration: "3:30",
    category: "Intelligence",
    categoryTone: "accent",
    thumbnailEmoji: "📊",
    thumbnailBg: "var(--lime-d)",
  },
  {
    id: "vid-5",
    title: "Using the Calendar",
    duration: "2:55",
    category: "Projects",
    categoryTone: "purple",
    thumbnailEmoji: "📅",
    thumbnailBg: "var(--purple-d)",
  },
  {
    id: "vid-6",
    title: "Managing Documents",
    duration: "3:12",
    category: "Delivery",
    categoryTone: "amber",
    thumbnailEmoji: "📁",
    thumbnailBg: "var(--amber-d)",
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    question: "What is the typical turnaround time for a project?",
    answer:
      "Turnaround depends on scope and complexity. A small website typically takes 4-6 weeks, while a full platform build may span 3-6 months. Your project manager will provide a detailed timeline during onboarding, and you can track progress on the Milestones page.",
  },
  {
    id: "faq-2",
    question: "How many revisions are included in my project?",
    answer:
      "Each milestone includes up to two rounds of revisions at no additional cost. Additional revision rounds can be requested via a change request and will be quoted separately. We recommend consolidating feedback to make the most of each round.",
  },
  {
    id: "faq-3",
    question: "What payment methods do you accept?",
    answer:
      "We accept EFT/bank transfer, credit card payments via our secure portal, and PayPal for international clients. All invoices include detailed payment instructions. You can manage your payment preferences on the Invoices page.",
  },
  {
    id: "faq-4",
    question: "What file formats will I receive for deliverables?",
    answer:
      "Deliverable formats depend on the project type. Design work is typically delivered as Figma files, PDFs, and PNGs. Development projects include source code repositories and deployment packages. All files are available on the Documents page.",
  },
  {
    id: "faq-5",
    question: "Can I change the project scope after work has started?",
    answer:
      "Yes. Navigate to the Projects page, open the Change Requests panel, and submit your request with a clear description. The team will assess the impact on timeline and budget within 48 hours and provide an updated proposal.",
  },
  {
    id: "faq-6",
    question: "What communication channels are available?",
    answer:
      "You can reach your team via the Messages page for real-time chat, email at support@maphari.co.za, or by phone during business hours (09:00-17:00 SAST). For non-urgent queries, the Messages page is the fastest route.",
  },
  {
    id: "faq-7",
    question: "How do I schedule a meeting with my project team?",
    answer:
      "Use the Calendar page to view available slots and book directly. You can also request a meeting through the Messages page. We typically hold weekly check-ins, but ad-hoc meetings can be scheduled as needed.",
  },
  {
    id: "faq-8",
    question: "How does the deliverable approval process work?",
    answer:
      "When a deliverable is ready, you will receive a notification. Visit the Deliverable Review page to preview the work, leave annotations, and either approve or request changes. Approved milestones trigger the next phase automatically.",
  },
  {
    id: "faq-9",
    question: "What happens if I miss a milestone approval deadline?",
    answer:
      "If a milestone is not reviewed within 5 business days, the system sends a reminder. After 10 days, the milestone is auto-approved to keep the project moving. You can always request a retroactive review through your project manager.",
  },
  {
    id: "faq-10",
    question: "How is my data protected on the portal?",
    answer:
      "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We follow SOC 2 practices, run regular security audits, and never share client data with third parties. You can review our full privacy policy in the Settings page.",
  },
  {
    id: "faq-11",
    question: "Can I add team members to my portal account?",
    answer:
      "Yes. Go to Settings, then the Account tab, and use the invite feature to add colleagues. Each invitee receives their own login and can be assigned specific project access permissions.",
  },
  {
    id: "faq-12",
    question: "What is included in the weekly status digest?",
    answer:
      "The digest arrives every Monday and includes milestone progress, upcoming deadlines, recent file uploads, invoice status, and any messages requiring your attention. You can customise digest preferences in Notification settings.",
  },
  {
    id: "faq-13",
    question: "How do I export project data or reports?",
    answer:
      "Visit the Export Center from the sidebar to download reports, invoices, and project data in CSV, PDF, or Excel formats. Automated exports can also be scheduled on a weekly or monthly basis.",
  },
  {
    id: "faq-14",
    question: "What if I need to pause or cancel my project?",
    answer:
      "Contact your project manager via the Messages page to discuss a pause or cancellation. Work completed up to the pause date will be invoiced, and all deliverables produced remain yours. Reactivation can be arranged at any time.",
  },
  {
    id: "faq-15",
    question: "How do I refer someone to Maphari?",
    answer:
      "Use the Referrals page in the sidebar to generate a unique referral link. When someone signs up using your link and completes their first project, you receive a credit on your next invoice. There is no limit to the number of referrals.",
  },
];

const BADGE_CLASS: Record<string, string> = {
  accent: "badgeAccent",
  purple: "badgePurple",
  amber: "badgeAmber",
  green: "badgeGreen",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientResourcesPage({ active }: { active: boolean }) {
  const [activeTab, setActiveTab] = useState<ResourceTab>("Guides");
  const [search, setSearch] = useState("");
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // ── Filtered lists ───────────────────────────────────────────
  const filteredArticles = useMemo(() => {
    if (!search.trim()) return ARTICLES;
    const q = search.toLowerCase();
    return ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredFaqs = useMemo(() => {
    if (!search.trim()) return FAQ_ITEMS;
    const q = search.toLowerCase();
    return FAQ_ITEMS.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
  }, [search]);

  // ── Handlers ─────────────────────────────────────────────────
  const toggleFaq = (id: string) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const playVideo = (title: string) => {
    setToast(`Playing: ${title}`);
    window.setTimeout(() => setToast(null), 3200);
  };

  const tabs: ResourceTab[] = ["Guides", "Videos", "FAQ"];

  return (
    <section
      className={cx(styles.page, active && styles.pageActive)}
      id="page-resources"
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Account</div>
          <div className={styles.pageTitle}>Resources</div>
          <div className={styles.pageSub}>
            Guides, tutorials, and help articles to get the most from your
            portal.
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={cx(styles.badge, styles.badgeAccent)}>
            {ARTICLES.length + VIDEOS.length + FAQ_ITEMS.length} resources
          </span>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={cx(
              styles.filterTab,
              activeTab === tab && styles.filterTabActive
            )}
            onClick={() => {
              setActiveTab(tab);
              setSearch("");
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className={styles.pageBody}>
        {/* Stats row */}
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={cx(styles.statBar, styles.statBarAccent)} />
            <div className={styles.statLabel}>Articles</div>
            <div className={styles.statValue}>{ARTICLES.length}</div>
            <div className={styles.statDelta}>Step-by-step guides</div>
          </div>
          <div className={styles.statCard}>
            <div className={cx(styles.statBar, styles.statBarPurple)} />
            <div className={styles.statLabel}>Videos</div>
            <div className={styles.statValue}>{VIDEOS.length}</div>
            <div className={styles.statDelta}>Visual walkthroughs</div>
          </div>
          <div className={styles.statCard}>
            <div className={cx(styles.statBar, styles.statBarAmber)} />
            <div className={styles.statLabel}>FAQ Items</div>
            <div className={styles.statValue}>{FAQ_ITEMS.length}</div>
            <div className={styles.statDelta}>Frequently asked questions</div>
          </div>
        </div>

        {/* ── Guides Tab ──────────────────────────────────────── */}
        {activeTab === "Guides" && (
          <>
            {/* Search */}
            <div style={{ padding: "0 32px" }}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Search articles by title, category, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 480 }}
              />
            </div>

            {filteredArticles.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📄</div>
                <div className={styles.emptyTitle}>No articles found</div>
                <p className={styles.emptyDesc}>
                  Try a different search term or clear the filter.
                </p>
              </div>
            ) : (
              <div className={styles.articleGrid}>
                {filteredArticles.map((article, i) => (
                  <div
                    key={article.id}
                    className={styles.articleCard}
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <span
                      className={cx(
                        styles.badge,
                        styles[
                          BADGE_CLASS[
                            article.categoryTone
                          ] as keyof typeof styles
                        ]
                      )}
                    >
                      {article.category}
                    </span>
                    <div className={styles.articleCardTitle}>
                      {article.title}
                    </div>
                    <div className={styles.articleCardExcerpt}>
                      {article.excerpt}
                    </div>
                    <div className={styles.articleCardMeta}>
                      <span className={styles.articleReadTime}>
                        {article.readTime} read
                      </span>
                      <button
                        type="button"
                        className={cx(
                          styles.button,
                          styles.buttonGhost,
                          styles.buttonSm
                        )}
                      >
                        Read
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Videos Tab ──────────────────────────────────────── */}
        {activeTab === "Videos" && (
          <div className={styles.videoGrid}>
            {VIDEOS.map((video, i) => (
              <div
                key={video.id}
                className={styles.videoCard}
                style={{ "--i": i } as React.CSSProperties}
                onClick={() => playVideo(video.title)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    playVideo(video.title);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {/* Thumbnail */}
                <div
                  className={styles.videoThumb}
                  style={{ background: video.thumbnailBg }}
                >
                  {video.thumbnailEmoji}
                  <div className={styles.videoOverlay}>
                    <div className={styles.videoPlayBtn}>&#9654;</div>
                  </div>
                  <span className={styles.videoDuration}>{video.duration}</span>
                </div>

                {/* Body */}
                <div className={styles.videoCardBody}>
                  <div className={styles.videoCardTitle}>{video.title}</div>
                  <span
                    className={cx(
                      styles.badge,
                      styles[
                        BADGE_CLASS[
                          video.categoryTone
                        ] as keyof typeof styles
                      ]
                    )}
                  >
                    {video.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FAQ Tab ─────────────────────────────────────────── */}
        {activeTab === "FAQ" && (
          <>
            {/* Search */}
            <div style={{ padding: "0 32px" }}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Search frequently asked questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 480 }}
              />
            </div>

            {filteredFaqs.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>❓</div>
                <div className={styles.emptyTitle}>No matching questions</div>
                <p className={styles.emptyDesc}>
                  Try a different search term or browse all FAQ items.
                </p>
              </div>
            ) : (
              <div style={{ padding: "0 32px" }}>
                <div className={styles.faqList}>
                  {filteredFaqs.map((faq) => {
                    const isOpen = openFaqs.has(faq.id);
                    return (
                      <div key={faq.id} className={styles.faqItem}>
                        <button
                          type="button"
                          className={styles.faqQuestion}
                          onClick={() => toggleFaq(faq.id)}
                        >
                          <span>{faq.question}</span>
                          <span className={styles.faqToggleIcon}>
                            {isOpen ? "\u2212" : "+"}
                          </span>
                        </button>
                        {isOpen ? (
                          <div className={styles.faqAnswer}>{faq.answer}</div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Toast ───────────────────────────────────────────────── */}
      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            right: 28,
            background: "var(--s1)",
            border: "1px solid var(--accent)",
            padding: "14px 20px",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderRadius: "var(--r-sm)",
            boxShadow: "var(--shadow-modal)",
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
              borderRadius: "50%",
            }}
          >
            &#9654;
          </div>
          <div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{toast}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>
              Video playback placeholder
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
