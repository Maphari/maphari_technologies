"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";

type ServiceTab = "Services" | "Add-ons" | "Portfolio" | "Retainer Plans" | "Referral Programme";

interface ServiceItem {
  icon: string;
  name: string;
  desc: string;
  tags: string[];
  from: string;
  tone: string;
  featured: boolean;
}

interface AddonItem {
  icon: string;
  name: string;
  desc: string;
  price: string;
  recommended: boolean;
}

interface PortfolioItem {
  thumb: string;
  bg: string;
  name: string;
  desc: string;
  tag: string;
  meta: string;
}

interface RetainerTier {
  name: string;
  price: string;
  desc: string;
  features: string[];
  current: boolean;
}

interface InquiryTarget {
  name: string;
  from?: string;
}

interface ToastState {
  title: string;
  subtitle: string;
}

const SERVICES: ServiceItem[] = [
  {
    icon: "🎨",
    name: "Brand Identity System",
    desc: "Full brand strategy, logo suite, typography system, color palette, and complete guidelines.",
    tags: ["Branding", "Strategy"],
    from: "R 18,000",
    tone: "purple",
    featured: false,
  },
  {
    icon: "💻",
    name: "Web Design & Development",
    desc: "Custom-built websites and web apps, mobile-first and performance-optimized.",
    tags: ["Design", "Development"],
    from: "R 35,000",
    tone: "accent",
    featured: true,
  },
  {
    icon: "📱",
    name: "Mobile App Design",
    desc: "Native and cross-platform UX with complete handoff for implementation.",
    tags: ["Mobile", "UX"],
    from: "R 28,000",
    tone: "blue",
    featured: false,
  },
  {
    icon: "📊",
    name: "Dashboard & Data Visualisation",
    desc: "Interactive reporting, real-time dashboards, and tailored analytics views.",
    tags: ["Data", "Design"],
    from: "R 22,000",
    tone: "green",
    featured: false,
  },
  {
    icon: "🤖",
    name: "AI Integration",
    desc: "Chatbots, workflow automation, content generation, and smart platform features.",
    tags: ["AI", "Development"],
    from: "R 15,000",
    tone: "amber",
    featured: false,
  },
  {
    icon: "📈",
    name: "Growth Marketing",
    desc: "SEO, content, paid ads, analytics, and growth strategy execution.",
    tags: ["Marketing", "Growth"],
    from: "R 12,000/mo",
    tone: "red",
    featured: false,
  },
];

const ADDONS: AddonItem[] = [
  { icon: "🔒", name: "Security Audit", desc: "Full security review with a remediation plan.", price: "R 8,500", recommended: true },
  { icon: "🌐", name: "Zulu Language Translation", desc: "Full Zulu translation for website or app.", price: "R 5,500", recommended: true },
  { icon: "🎬", name: "Explainer Video", desc: "60–90 second animated explainer video.", price: "R 14,000", recommended: false },
  { icon: "📧", name: "Email Marketing Setup", desc: "Template + automation setup in Mailchimp/Klaviyo.", price: "R 6,800", recommended: false },
  { icon: "🔍", name: "SEO Optimisation", desc: "Technical and on-page optimization for 20 pages.", price: "R 9,200", recommended: false },
  { icon: "📲", name: "Push Notification System", desc: "In-app and push notification architecture.", price: "R 7,400", recommended: false },
];

const PORTFOLIO: PortfolioItem[] = [
  {
    thumb: "🏦",
    bg: "rgba(200,241,53,.08)",
    name: "Veldt Finance Dashboard",
    desc: "Real-time investment tracking and portfolio management platform.",
    tag: "Current Project",
    meta: "Fintech · Web App · 2026",
  },
  {
    thumb: "🛒",
    bg: "rgba(139,111,255,.08)",
    name: "Kasi Market Platform",
    desc: "Marketplace platform for township entrepreneurs.",
    tag: "Case Study",
    meta: "E-commerce · Mobile · 2025",
  },
  {
    thumb: "🏥",
    bg: "rgba(61,217,214,.08)",
    name: "Umvelo Health Portal",
    desc: "Patient portal for a network of regional clinics.",
    tag: "Case Study",
    meta: "HealthTech · Web · 2025",
  },
  {
    thumb: "🎵",
    bg: "rgba(245,166,35,.08)",
    name: "Afro Sound Identity",
    desc: "Full brand system for a streaming startup.",
    tag: "Case Study",
    meta: "Music · Brand · 2024",
  },
  {
    thumb: "📚",
    bg: "rgba(77,222,143,.08)",
    name: "Lekholo EdTech App",
    desc: "Mobile-first learning experience for schools.",
    tag: "Case Study",
    meta: "EdTech · Mobile · 2024",
  },
  {
    thumb: "🏗",
    bg: "rgba(255,95,95,.08)",
    name: "Khanya Construction",
    desc: "Corporate rebrand and website rollout.",
    tag: "Case Study",
    meta: "Construction · Brand + Web · 2024",
  },
];

const RETAINER_TIERS: RetainerTier[] = [
  {
    name: "Essential",
    price: "R 8,500 / month",
    desc: "Support, small changes, and monthly strategic alignment.",
    features: ["8 hours/month", "Bug fixes & minor updates", "Monthly strategy call", "Priority email support"],
    current: false,
  },
  {
    name: "Growth",
    price: "R 18,000 / month",
    desc: "Active delivery with regular planning and execution.",
    features: ["20 hours/month", "Feature development", "Bi-weekly strategy call", "Dedicated Slack channel", "Monthly analytics report"],
    current: false,
  },
  {
    name: "Scale",
    price: "R 35,000 / month",
    desc: "Full-stack partnership across design, dev, and growth.",
    features: ["40 hours/month", "Design + development + marketing", "Weekly strategy sessions", "Priority support", "Quarterly planning workshop"],
    current: false,
  },
];

const TABS: ServiceTab[] = ["Services", "Add-ons", "Portfolio", "Retainer Plans", "Referral Programme"];

function toneClass(tone: string): string {
  if (tone === "accent") return styles.svcGrowToneAccent;
  if (tone === "purple") return styles.svcGrowTonePurple;
  if (tone === "blue") return styles.svcGrowToneBlue;
  if (tone === "green") return styles.svcGrowToneGreen;
  if (tone === "amber") return styles.svcGrowToneAmber;
  if (tone === "red") return styles.svcGrowToneRed;
  return styles.svcGrowToneMuted;
}

export function ServicesGrowthPage() {
  const [tab, setTab] = useState<ServiceTab>("Services");
  const [inquiryTarget, setInquiryTarget] = useState<InquiryTarget | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  return (
    <div className={styles.pageBody}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Maphari · Services</div>
          <h1 className={cx("pageTitle")}>Services &amp; Growth</h1>
          <p className={cx("pageSub")}>Explore services, add-ons, retainers, and referral opportunities.</p>
        </div>
        <div className={cx("pageActions")}>
          <button className={cx("btnSm", "btnGhost")} type="button" onClick={() => notify("Brochure downloaded", "Full services brochure saved as PDF")}>Brochure</button>
          <button className={cx("btnSm", "btnAccent")} type="button" onClick={() => setInquiryTarget({ name: "Custom Project" })}>Discuss a Project</button>
        </div>
      </div>

      <div className={styles.svcGrowLayout}>
        <aside className={styles.svcGrowSidebar}>
          <div className={styles.svcGrowSidebarSection}>Explore</div>
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              className={cx(styles.svcGrowSidebarItem, tab === item && styles.svcGrowSidebarItemActive)}
              onClick={() => setTab(item)}
            >
              <span className={cx(styles.svcGrowDot, item === "Services" ? styles.svcGrowToneAccent : item === "Add-ons" ? styles.svcGrowToneBlue : item === "Portfolio" ? styles.svcGrowTonePurple : item === "Retainer Plans" ? styles.svcGrowToneGreen : styles.svcGrowToneAmber)} />
              <span>{item}</span>
            </button>
          ))}

          <div className={styles.svcGrowSidebarDivider} />
          <div className={styles.svcGrowDiscountCard}>
            <div className={styles.svcGrowDiscountText}>
              Existing clients get a <strong>15% loyalty discount</strong> on new services and add-ons.
            </div>
            <button className={cx("btnSm", "btnAccent", styles.svcGrowFullBtn)} type="button" onClick={() => setInquiryTarget({ name: "Loyalty Enquiry" })}>Claim Discount</button>
          </div>
        </aside>

        <section className={styles.svcGrowMain}>
          <div className={styles.svcGrowTabs}>
            {TABS.map((item) => (
              <button key={item} type="button" className={cx(styles.svcGrowTab, tab === item && styles.svcGrowTabActive)} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
          </div>

          {tab === "Services" ? (
            <div className={styles.svcGrowBody}>
              <div className={styles.svcGrowSectionTitle}>Our Core Services</div>
              <div className={styles.svcGrowGrid3}>
                {SERVICES.map((service) => (
                  <div key={service.name} className={cx(styles.svcGrowServiceCard, service.featured && styles.svcGrowServiceFeatured)}>
                    <span className={cx(styles.svcGrowServiceTop, toneClass(service.tone))} />
                    <div className={styles.svcGrowServiceBody}>
                      {service.featured ? <span className={cx("badge", "badgeAccent")}>Most Popular</span> : null}
                      <div className={styles.svcGrowServiceIcon}>{service.icon}</div>
                      <div className={styles.svcGrowServiceName}>{service.name}</div>
                      <div className={styles.svcGrowServiceDesc}>{service.desc}</div>
                      <div className={styles.svcGrowTagRow}>
                        {service.tags.map((tag) => (
                          <span key={tag} className={cx("badge", "badgeMuted")}>{tag}</span>
                        ))}
                      </div>
                      <div className={styles.svcGrowServicePrice}>From <strong>{service.from}</strong></div>
                      <button className={cx("btnSm", service.featured ? "btnAccent" : "btnGhost", styles.svcGrowFullBtn)} type="button" onClick={() => setInquiryTarget({ name: service.name, from: service.from })}>
                        {service.featured ? "Get Started" : "Enquire"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.svcGrowBanner}>
                <div>
                  <div className={styles.svcGrowBannerTitle}>Need something custom?</div>
                  <div className={styles.svcGrowBannerSub}>Tell us your goals and constraints, and we will tailor a scoped proposal.</div>
                </div>
                <button className={cx("btnSm", "btnAccent")} type="button" onClick={() => setInquiryTarget({ name: "Custom Project" })}>Custom Quote</button>
              </div>
            </div>
          ) : null}

          {tab === "Add-ons" ? (
            <div className={styles.svcGrowBody}>
              <div className={styles.svcGrowNotice}>As an active client, your loyalty discount is applied to all add-ons.</div>

              <div>
                <div className={styles.svcGrowSectionTitle}>Recommended for You</div>
                {ADDONS.filter((item) => item.recommended).map((item) => (
                  <div key={item.name} className={cx(styles.svcGrowAddonRow, styles.svcGrowAddonRecommended)}>
                    <span className={styles.svcGrowAddonIcon}>{item.icon}</span>
                    <div className={styles.svcGrowGrow}>
                      <div className={styles.svcGrowAddonName}>{item.name}</div>
                      <div className={styles.svcGrowAddonDesc}>{item.desc}</div>
                    </div>
                    <div className={styles.svcGrowAddonPrice}>{item.price}</div>
                    <button className={cx("btnSm", "btnGhost")} type="button" onClick={() => notify("Interest noted", `We will send a proposal for ${item.name} within 24 hours`)}>Add</button>
                  </div>
                ))}
              </div>

              <div>
                <div className={styles.svcGrowSectionTitle}>All Add-ons</div>
                {ADDONS.filter((item) => !item.recommended).map((item) => (
                  <div key={item.name} className={styles.svcGrowAddonRow}>
                    <span className={styles.svcGrowAddonIcon}>{item.icon}</span>
                    <div className={styles.svcGrowGrow}>
                      <div className={styles.svcGrowAddonName}>{item.name}</div>
                      <div className={styles.svcGrowAddonDesc}>{item.desc}</div>
                    </div>
                    <div className={styles.svcGrowAddonPrice}>{item.price}</div>
                    <button className={cx("btnSm", "btnGhost")} type="button" onClick={() => notify("Interest noted", `We will send a proposal for ${item.name} within 24 hours`)}>Add</button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "Portfolio" ? (
            <div className={styles.svcGrowBody}>
              <div className={styles.svcGrowSectionTitle}>Our Work</div>
              <div className={styles.svcGrowGrid3}>
                {PORTFOLIO.map((item) => (
                  <div key={item.name} className={styles.svcGrowPortfolioCard}>
                    <div className={styles.svcGrowPortfolioThumb} style={{ '--bg-color': item.bg } as React.CSSProperties}>
                      <span>{item.thumb}</span>
                      <span className={styles.svcGrowPortfolioTag}>{item.tag}</span>
                    </div>
                    <div className={styles.svcGrowPortfolioBody}>
                      <div className={styles.svcGrowPortfolioName}>{item.name}</div>
                      <div className={styles.svcGrowPortfolioDesc}>{item.desc}</div>
                      <div className={styles.svcGrowPortfolioMeta}>{item.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "Retainer Plans" ? (
            <div className={styles.svcGrowBody}>
              <div className={styles.svcGrowSectionTitle}>Retainer Plans</div>
              <div className={styles.svcGrowRetainerHint}>Continue momentum after project delivery with a recurring engagement plan.</div>
              {RETAINER_TIERS.map((tier) => (
                <div key={tier.name} className={cx(styles.svcGrowRetainerCard, tier.current && styles.svcGrowRetainerCurrent)}>
                  <div className={styles.svcGrowRetainerHead}>
                    <div className={styles.svcGrowRetainerName}>{tier.name}</div>
                    <div className={styles.svcGrowRetainerPrice}>{tier.price}</div>
                  </div>
                  <div className={styles.svcGrowRetainerDesc}>{tier.desc}</div>
                  <div className={styles.svcGrowFeatureList}>
                    {tier.features.map((feature) => (
                      <div key={feature} className={styles.svcGrowFeatureItem}>{feature}</div>
                    ))}
                  </div>
                  <button className={cx("btnSm", "btnGhost", styles.svcGrowFullBtn)} type="button" onClick={() => notify(`${tier.name} plan enquiry sent`, "We will respond within 24 hours")}>{tier.current ? "Manage Plan" : "Enquire"}</button>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "Referral Programme" ? (
            <div className={styles.svcGrowBody}>
              <div className={styles.svcGrowReferralCard}>
                <div className={styles.svcGrowReferralEyebrow}>Referral Programme</div>
                <div className={styles.svcGrowReferralTitle}>Earn R 5,000 for every client you refer</div>
                <div className={styles.svcGrowReferralDesc}>Share your code with qualifying businesses. Once they sign, you receive payout or service credit.</div>
                <div className={styles.svcGrowCodeBox}>
                  <span className={styles.svcGrowCodeValue}>VELDT-2026</span>
                  <button
                    className={cx("btnSm", "btnAccent")}
                    type="button"
                    onClick={async () => {
                      const referralCode = "VELDT-2026";
                      try {
                        await navigator.clipboard.writeText(referralCode);
                        notify("Code copied", "VELDT-2026 copied to clipboard");
                      } catch {
                        notify("Error", "Clipboard unavailable — please copy manually.");
                      }
                    }}
                  >Copy Code</button>
                </div>
              </div>

              <div className={styles.svcGrowGrid2}>
                <div className={cx("card")}> 
                  <div className={cx("cardHeader")}>
                    <div>
                      <div className={cx("cardTitle")}>How It Works</div>
                    </div>
                  </div>
                  <div className={cx("cardBody", styles.svcGrowStack10)}>
                    {[
                      "Share your referral code.",
                      "Referral contacts Maphari and cites your code.",
                      "They sign a qualifying contract.",
                      "You receive payout or service credit.",
                    ].map((step, index) => (
                      <div key={step} className={styles.svcGrowStepRow}>
                        <span className={styles.svcGrowStepNum}>{index + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cx("card")}>
                  <div className={cx("cardHeader")}>
                    <div>
                      <div className={cx("cardTitle")}>Earnings Potential</div>
                    </div>
                  </div>
                  <div className={cx("cardBody", styles.svcGrowStack10)}>
                    {[
                      ["1 referral", "R 5,000"],
                      ["3 referrals", "R 15,000"],
                      ["5 referrals", "R 25,000"],
                      ["10 referrals", "R 50,000"],
                    ].map(([count, value]) => (
                      <div key={String(count)} className={styles.svcGrowEarningRow}>
                        <span>{count}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {inquiryTarget ? (
        <div className={styles.svcGrowModalBackdrop} onClick={() => setInquiryTarget(null)}>
          <div className={styles.svcGrowModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.svcGrowModalHeader}>
              <div className={styles.svcGrowModalTitle}>Enquire: {inquiryTarget.name}</div>
              <button type="button" className={styles.svcGrowModalClose} onClick={() => setInquiryTarget(null)}>✕</button>
            </div>
            <div className={styles.svcGrowModalBody}>
              <div className={styles.svcGrowInquiryCard}>
                <div className={styles.svcGrowInquiryLabel}>Service</div>
                <div className={styles.svcGrowInquiryName}>{inquiryTarget.name}</div>
                {inquiryTarget.from ? <div className={styles.svcGrowInquiryFrom}>From {inquiryTarget.from}</div> : null}
              </div>

              {[
                ["Project Summary", "Describe what you want to build..."],
                ["Timeline", "When do you need this delivered?"],
                ["Budget Range", "What budget range do you have in mind?"],
                ["Additional Context", "Any extra context or constraints?"],
              ].map(([label, placeholder], index) => (
                <div key={label} className={styles.svcGrowFieldBlock}>
                  <label className={styles.svcGrowFieldLabel}>{label}</label>
                  {index === 0 || index === 3 ? (
                    <textarea className={styles.svcGrowTextarea} placeholder={placeholder} />
                  ) : (
                    <input className={styles.svcGrowInput} placeholder={placeholder} />
                  )}
                </div>
              ))}
            </div>
            <div className={styles.svcGrowModalFooter}>
              <button className={cx("btnSm", "btnGhost")} type="button" onClick={() => setInquiryTarget(null)}>Cancel</button>
              <button
                className={cx("btnSm", "btnAccent")}
                type="button"
                onClick={() => {
                  setInquiryTarget(null);
                  notify("Enquiry sent", "We will respond with a proposal within 24 hours");
                }}
              >
                Send Enquiry
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
