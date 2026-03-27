"use client";

// ════════════════════════════════════════════════════════════════════════════
// project-request-page.tsx — Request a New Project (revamped)
// ════════════════════════════════════════════════════════════════════════════

import { useState, useRef, useMemo } from "react";
import { saveSession } from "../../../../lib/auth/session";
import { useProjectLayer } from "../hooks/use-project-layer";
import { buildProjectRequestAgreementPdf } from "@/lib/pdf/project-request-agreement";
import { getPortalFileDownloadUrlWithRefresh } from "../../../../lib/api/portal/files";
import {
  createPortalProjectRequestWithRefresh,
  createPortalInlineFileWithRefresh,
  createPortalInvoiceWithRefresh,
  createPortalPaymentWithRefresh,
  initiatePortalPayfastWithRefresh,
  uploadPortalFileWithRefresh,
  submitPortalEftProofWithRefresh,
} from "../../../../lib/api/portal/projects";
import type { PortalProjectRequestServiceOption } from "../../../../lib/api/portal/types";
import type { PageId } from "../config";
import { cx } from "../style";
import { Ic } from "../ui";

// ── Service catalogue ─────────────────────────────────────────────────────

const SERVICES = [
  // ── Small Business Essentials ────────────────────────────────────────────
  { id: "bizWebsite",   icon: "globe",      color: "var(--lime)",   label: "Business Website",         desc: "Professional 5–10 page site — mobile-first, fast & SEO-ready. Own your online presence today.",      from: "From R 8,000",   popular: false, tag: "Small Biz", weeks: [2,  6]  as [number,number] },
  { id: "landingPage",  icon: "trending",   color: "var(--green)",  label: "Landing Page & Funnel",    desc: "High-converting single page with lead capture, contact forms & Google Analytics built in.",           from: "From R 4,500",   popular: false, tag: "Quick Win", weeks: [1,  3]  as [number,number] },
  { id: "seoMarketing", icon: "zap",        color: "var(--amber)",  label: "SEO & Digital Marketing",  desc: "Keyword strategy, on-page SEO, Google Business Profile & monthly ranking reports.",                   from: "R 3,500/mo",     popular: false, tag: "Monthly",   weeks: [2,  4]  as [number,number] },
  { id: "socialMedia",  icon: "message",    color: "var(--accent)", label: "Social Media Pack",        desc: "Content calendar, post designs, copy & scheduling across 3 platforms — fully done-for-you.",         from: "R 4,500/mo",     popular: false, tag: "Monthly",   weeks: [1,  1]  as [number,number] },
  { id: "crmSystems",   icon: "users",      color: "var(--purple)", label: "CRM & Business Systems",   desc: "HubSpot, Pipedrive or custom CRM — pipelines, automations & client management configured.",          from: "From R 12,000",  popular: false, tag: null,        weeks: [3,  8]  as [number,number] },
  // ── Build & Scale ────────────────────────────────────────────────────────
  { id: "startupMvp",   icon: "rocket",     color: "var(--lime)",   label: "Startup MVP Package",      desc: "Strategy, brand, design, build & launch. Fastest path from idea to live product in market.",         from: "From R 85,000",  popular: true,  tag: null,        weeks: [12, 20] as [number,number] },
  { id: "webApp",       icon: "code",       color: "var(--lime)",   label: "Full-Stack Web App",       desc: "Next.js, REST/GraphQL APIs, auth, databases & CI/CD deployment. Built to scale from day one.",       from: "From R 55,000",  popular: false, tag: null,        weeks: [8,  16] as [number,number] },
  { id: "mobileApp",    icon: "layers",     color: "var(--purple)", label: "Mobile App",               desc: "React Native for iOS & Android. One codebase, two platforms, zero compromise on quality.",           from: "From R 75,000",  popular: false, tag: null,        weeks: [10, 18] as [number,number] },
  { id: "ecommerce",    icon: "creditCard", color: "var(--green)",  label: "E-Commerce Store",         desc: "Shopify, WooCommerce or custom storefront — payments, inventory & sales analytics included.",        from: "From R 35,000",  popular: false, tag: null,        weeks: [6,  12] as [number,number] },
  // ── Enhance & Grow ───────────────────────────────────────────────────────
  { id: "designBrand",  icon: "edit",       color: "var(--amber)",  label: "UI/UX & Brand Identity",   desc: "Wireframes, prototypes, design system, logo & full brand guidelines — bundled into one.",             from: "From R 18,000",  popular: false, tag: "Bundle",    weeks: [3,  8]  as [number,number] },
  { id: "aiAutomation", icon: "zap",        color: "var(--accent)", label: "AI & Automation",          desc: "AI chatbots, OpenAI integrations, n8n & Zapier workflows. Automate the repetitive and grow.",        from: "From R 22,000",  popular: false, tag: null,        weeks: [4,  10] as [number,number] },
  { id: "analytics",    icon: "chart",      color: "var(--purple)", label: "Analytics & Dashboards",   desc: "Custom reporting, live data visualisation, KPI dashboards & BI tool integrations.",                   from: "From R 28,000",  popular: false, tag: null,        weeks: [4,  8]  as [number,number] },
  { id: "retainer",     icon: "shield",     color: "var(--muted2)", label: "Retainer & Support",       desc: "Dedicated dev hours, bug fixes, feature updates & SLA-backed monitoring every month.",                from: "R 8,000/mo",     popular: false, tag: "Monthly",   weeks: [1,  1]  as [number,number] },
] as const;

type ServiceId = (typeof SERVICES)[number]["id"];

// ── Maps local service IDs to the contract enum values ────────────────────
const SERVICE_TO_CONTRACT: Record<ServiceId, PortalProjectRequestServiceOption> = {
  bizWebsite:   "WEB_DEVELOPMENT",
  landingPage:  "WEB_DEVELOPMENT",
  seoMarketing: "SEO_TECHNICAL",
  socialMedia:  "CONTENT_MIGRATION",
  crmSystems:   "THIRD_PARTY_INTEGRATIONS",
  startupMvp:   "DISCOVERY_CONSULTING",
  webApp:       "CUSTOM_WEB_APP_DEVELOPMENT",
  mobileApp:    "MOBILE_APP_CROSS_PLATFORM",
  ecommerce:    "ECOMMERCE_DEVELOPMENT",
  designBrand:  "UI_UX_DESIGN",
  aiAutomation: "AI_LLM_AUTOMATIONS",
  analytics:    "ANALYTICS_TRACKING",
  retainer:     "MAINTENANCE_SUPPORT",
};

// ── Service groups (for visual grouping in step 1) ────────────────────────

const SERVICE_GROUPS: { label: string; sub: string; color: string; ids: ServiceId[] }[] = [
  { label: "Small Business Essentials", sub: "Affordable packages to get your business online",  color: "var(--amber)",  ids: ["bizWebsite", "landingPage", "seoMarketing", "socialMedia", "crmSystems"] },
  { label: "Build & Scale",             sub: "Full-stack products, apps & digital platforms",    color: "var(--lime)",   ids: ["startupMvp", "webApp", "mobileApp", "ecommerce"] },
  { label: "Enhance & Grow",            sub: "Level up what you already have",                   color: "var(--purple)", ids: ["designBrand", "aiAutomation", "analytics", "retainer"] },
];

// ── Combo packages ────────────────────────────────────────────────────────

interface ComboItem {
  id: string; badge: string; badgeCls: string; icon: string; color: string;
  label: string; sub: string; services: ServiceId[];
  highlights: string[]; from: string; saving: string; weeks: [number, number];
}

const COMBOS: ComboItem[] = [
  {
    id: "smeLaunch", badge: "Small Business", badgeCls: "badgeAmber",
    icon: "globe",    color: "var(--amber)",
    label: "SME Launch Bundle",
    sub: "Everything a new business needs to go live fast",
    services: ["bizWebsite", "designBrand"],
    highlights: ["5-page responsive website", "Full logo & brand identity kit", "Mobile-first & SEO-ready from day 1", "1 month post-launch support"],
    from: "From R 22,000", saving: "Save R 4,000", weeks: [4, 8],
  },
  {
    id: "digitalPro", badge: "Best Value", badgeCls: "badgeAccent",
    icon: "trending", color: "var(--lime)",
    label: "Digital Presence Pro",
    sub: "Get found online, look great and convert visitors",
    services: ["bizWebsite", "seoMarketing", "landingPage"],
    highlights: ["Business website + landing page", "3 months SEO foundation", "Google Business Profile setup", "Lead capture forms & analytics"],
    from: "From R 17,000", saving: "Save R 5,000", weeks: [3, 8],
  },
  {
    id: "growthAccel", badge: "Growth", badgeCls: "badgeGreen",
    icon: "chart",    color: "var(--green)",
    label: "Growth Accelerator",
    sub: "Sell online, rank higher and track everything",
    services: ["ecommerce", "seoMarketing", "analytics"],
    highlights: ["Full e-commerce store (Shopify/WooCommerce)", "SEO & Google Shopping setup", "Custom sales analytics dashboard", "Automated weekly performance reports"],
    from: "From R 40,000", saving: "Save R 8,000", weeks: [8, 14],
  },
  {
    id: "techScale", badge: "Scale Up", badgeCls: "badgePurple",
    icon: "zap",      color: "var(--purple)",
    label: "Tech Scale Stack",
    sub: "Build, automate and measure — the complete package",
    services: ["webApp", "aiAutomation", "analytics"],
    highlights: ["Full-stack web application", "AI chatbot & workflow automation (n8n / OpenAI)", "Custom KPI dashboards & BI reports", "3 months retainer support included"],
    from: "From R 95,000", saving: "Save R 12,000", weeks: [10, 18],
  },
  {
    id: "brandBoost", badge: "Starter", badgeCls: "badgeMuted",
    icon: "edit",     color: "var(--accent)",
    label: "Brand & Visibility Kit",
    sub: "Look professional and get discovered from day one",
    services: ["designBrand", "landingPage", "socialMedia"],
    highlights: ["Brand identity & logo design", "High-converting landing page", "Social media starter kit (3 platforms)", "30-day content plan included"],
    from: "From R 27,000", saving: "Save R 4,500", weeks: [4, 9],
  },
  {
    id: "automateAll", badge: "Efficiency", badgeCls: "badgeAmber",
    icon: "users",    color: "var(--amber)",
    label: "Automate & Manage",
    sub: "Cut admin time and manage clients like a pro",
    services: ["crmSystems", "aiAutomation", "retainer"],
    highlights: ["CRM setup (HubSpot / Pipedrive)", "AI-powered workflows & chatbots", "Monthly retainer for ongoing improvements", "Team training session included"],
    from: "From R 35,000", saving: "Save R 7,000", weeks: [5, 12],
  },
];

// ── Business size picker ──────────────────────────────────────────────────

const BUSINESS_SIZES = [
  { id: "starter",    label: "Just Starting",   sub: "Pre-launch or idea stage",     icon: "rocket",   color: "var(--lime)",   range: "Budgets from R 5k"  },
  { id: "smallbiz",   label: "Small Business",  sub: "Established · 1–20 staff",     icon: "users",    color: "var(--amber)",  range: "Budgets from R 15k" },
  { id: "growing",    label: "Growing Fast",    sub: "Scaling up, need more",        icon: "trending", color: "var(--purple)", range: "Budgets from R 50k" },
  { id: "enterprise", label: "Enterprise",      sub: "Large org · complex needs",    icon: "shield",   color: "var(--accent)", range: "Custom budgets"     },
] as const;
type BizSize = (typeof BUSINESS_SIZES)[number]["id"];

// ── Goals ─────────────────────────────────────────────────────────────────

const GOALS = [
  { id: "launch",   icon: "globe",    color: "var(--amber)",  label: "Launch online",        sub: "Website, brand & first customers",    recs: ["bizWebsite", "designBrand", "landingPage"] as ServiceId[] },
  { id: "build",    icon: "rocket",   color: "var(--lime)",   label: "Build a product",      sub: "App, platform or SaaS from scratch",  recs: ["startupMvp", "webApp", "mobileApp"] as ServiceId[] },
  { id: "grow",     icon: "trending", color: "var(--green)",  label: "Grow & sell more",     sub: "E-commerce, SEO & revenue tools",     recs: ["ecommerce", "seoMarketing", "analytics"] as ServiceId[] },
  { id: "automate", icon: "zap",      color: "var(--accent)", label: "Automate & save time", sub: "AI, CRM & workflow integrations",     recs: ["aiAutomation", "crmSystems", "retainer"] as ServiceId[] },
  { id: "refresh",  icon: "edit",     color: "var(--purple)", label: "Rebrand & redesign",   sub: "New look, better UX, stronger brand", recs: ["designBrand", "bizWebsite", "landingPage"] as ServiceId[] },
  { id: "market",   icon: "message",  color: "var(--amber)",  label: "Market my business",   sub: "SEO, social media & content",         recs: ["seoMarketing", "socialMedia", "analytics"] as ServiceId[] },
] as const;
type GoalId = (typeof GOALS)[number]["id"];

// ── Add-ons (14 total) ────────────────────────────────────────────────────

const ADDONS = [
  { id: "hosting",   icon: "globe",    color: "var(--accent)", label: "Managed Hosting & DevOps",     desc: "VPS setup, auto-deployments, uptime monitoring & SSL certificates managed for you.",           price: "+R 2,500/mo" },
  { id: "priority",  icon: "shield",   color: "var(--lime)",   label: "Priority Support SLA",          desc: "4-hour response guarantee, dedicated support hotline & formal escalation policy.",              price: "+R 3,500/mo" },
  { id: "training",  icon: "users",    color: "var(--amber)",  label: "Staff Training (2 Sessions)",   desc: "Hands-on workshops covering your platform, CMS & core business workflows.",                     price: "+R 5,000" },
  { id: "reporting", icon: "chart",    color: "var(--purple)", label: "Analytics & Reporting Setup",   desc: "GA4 configuration, custom KPI dashboards & automated weekly email performance reports.",        price: "+R 8,000" },
  { id: "seoBoost",  icon: "zap",      color: "var(--amber)",  label: "SEO Foundation Package",        desc: "Keyword research, meta tag optimisation, XML sitemap & Google Search Console setup.",          price: "+R 4,500" },
  { id: "copywrite", icon: "edit",     color: "var(--green)",  label: "Copywriting (5 Pages)",         desc: "Professional web copy — compelling headlines, body text & CTAs written by our team.",           price: "+R 6,000" },
  { id: "emailMkt",  icon: "message",  color: "var(--lime)",   label: "Email Marketing Setup",         desc: "Mailchimp or Klaviyo — list setup, welcome automation flow, templates & CRM integration.",      price: "+R 4,000" },
  { id: "crmSetup",  icon: "users",    color: "var(--purple)", label: "CRM Configuration",             desc: "Custom pipeline setup, fields, automation rules, notifications & team onboarding session.",    price: "+R 5,500" },
  { id: "socialKit", icon: "trending", color: "var(--green)",  label: "Social Media Starter Kit",      desc: "Profile setup, 10 branded post templates, 30-day content calendar & hashtag strategy.",        price: "+R 3,500" },
  { id: "perfAudit", icon: "zap",      color: "var(--amber)",  label: "Performance & Speed Audit",     desc: "Lighthouse test, image compression, Core Web Vitals fixes & a full written report.",           price: "+R 3,000" },
  { id: "security",  icon: "shield",   color: "var(--red)",    label: "Security Hardening",            desc: "Penetration test, WAF config, OWASP checklist review & monthly vulnerability scans.",          price: "+R 5,000" },
  { id: "multiLang", icon: "globe",    color: "var(--purple)", label: "Multi-language Support",        desc: "i18n implementation for English + 1 additional language with a full translation pipeline.",     price: "+R 7,500" },
  { id: "liveChat",  icon: "message",  color: "var(--lime)",   label: "Live Chat Integration",         desc: "Intercom, Crisp or Tawk.to installed, branded & fully wired into your platform or app.",       price: "+R 2,500" },
  { id: "backup",    icon: "shield",   color: "var(--muted2)", label: "Automated Daily Backups",       desc: "Daily backups with 30-day retention, off-site storage & a one-click restore system.",          price: "+R 1,500/mo" },
] as const;
type AddonId = (typeof ADDONS)[number]["id"];

// ── Price / week / tech lookups ────────────────────────────────────────────

const PRICE_MAP: Record<ServiceId, [number, number]> = {
  bizWebsite:   [8000,   18000], landingPage:  [4500,   12000],
  seoMarketing: [3500,   12000], socialMedia:  [4500,   12000],
  crmSystems:   [12000,  35000], startupMvp:   [85000, 200000],
  webApp:       [55000, 150000], mobileApp:    [75000, 180000],
  ecommerce:    [35000, 100000], designBrand:  [18000,  55000],
  aiAutomation: [22000,  80000], analytics:    [28000,  70000],
  retainer:     [8000,   25000],
};
const WEEKS_MAP: Record<ServiceId, [number, number]> = {
  bizWebsite:   [2,  6],  landingPage:  [1,  3],  seoMarketing: [2,  4],  socialMedia:  [1, 1],
  crmSystems:   [3,  8],  startupMvp:   [12, 20], webApp:       [8, 16],  mobileApp:    [10, 18],
  ecommerce:    [6,  12], designBrand:  [3,  8],  aiAutomation: [4, 10],  analytics:    [4,  8],
  retainer:     [1,  1],
};
const INCLUDES_MAP: Record<ServiceId, string[]> = {
  bizWebsite:   ["5 Pages", "CMS", "SEO", "Mobile", "SSL"],
  landingPage:  ["Analytics", "Forms", "A/B Ready", "Fast"],
  seoMarketing: ["Keywords", "On-Page", "GMB", "Reports"],
  socialMedia:  ["3 Platforms", "Content", "Scheduling", "Reports"],
  crmSystems:   ["HubSpot", "Pipelines", "Automations", "Reports"],
  startupMvp:   ["Next.js", "Figma", "Stripe", "Vercel", "Auth"],
  webApp:       ["Next.js", "API", "Auth", "DB", "CI/CD"],
  mobileApp:    ["React Native", "iOS", "Android", "OTA"],
  ecommerce:    ["Shopify", "WooCommerce", "Payments", "Analytics"],
  designBrand:  ["Figma", "Design System", "Brand Kit", "Prototype"],
  aiAutomation: ["OpenAI", "n8n", "Zapier", "Webhooks"],
  analytics:    ["Dashboards", "SQL", "BI", "Live Data"],
  retainer:     ["SLA", "Monitoring", "Updates", "Support"],
};

// ── Misc constants ─────────────────────────────────────────────────────────

const BUDGET_OPTIONS   = ["Under R 15k", "R 15k–R 50k", "R 50k–R 150k", "R 150k–R 500k", "R 500k+"];
const TIMELINE_OPTIONS = ["ASAP (< 1 month)", "1–3 months", "3–6 months", "6+ months"];
const STEP_LABELS      = ["Service", "Brief", "Quote", "Sign", "Pay"] as const;

const TRUST = [
  { icon: "check",    text: "3-step process"        },
  { icon: "clock",    text: "24h response"           },
  { icon: "shield",   text: "No lock-in contracts"   },
  { icon: "users",    text: "Dedicated PM assigned"  },
  { icon: "trending", text: "13 services available"  },
  { icon: "zap",      text: "SME-friendly pricing"   },
] as const;

const NEXT_STEPS = [
  { n: "01", title: "We review your brief",       sub: "Within 24 hours of submission",      icon: "file"   },
  { n: "02", title: "We send a custom proposal",  sub: "Tailored pricing, scope & timeline", icon: "send"   },
  { n: "03", title: "You approve & we kick off",  sub: "Contract signing + onboarding call", icon: "rocket" },
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtR(n: number): string {
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `R ${Math.round(n / 1_000)}k`;
  return `R ${n}`;
}

function FormSection({ label, note }: { label: string; note?: string }) {
  return (
    <div className={cx("flexRow", "gap8", "pb10", "borderB", "mb16", "mt8")}>
      <span className={cx("text10", "fw700", "colorMuted", "uppercase", "ls008")}>{label}</span>
      {note && <span className={cx("text10", "colorMuted")}>{note}</span>}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export interface ProjectRequestPageProps {
  onNavigate?: (page: PageId) => void;
}

export function ProjectRequestPage(props: ProjectRequestPageProps) {
  const { session } = useProjectLayer();
  const clientId = session?.user.clientId ?? null;

  const [step,          setStep]          = useState(1);
  const [intakeMode,    setIntakeMode]    = useState<"guided" | "custom" | null>("guided");
  const [bizSize,       setBizSize]       = useState<BizSize | null>(null);
  const [goal,          setGoal]          = useState<GoalId | null>(null);
  const [selected,      setSelected]      = useState<Set<ServiceId>>(new Set());
  const [addons,        setAddons]        = useState<Set<AddonId>>(new Set());
  const [submittedProject, setSubmittedProject] = useState<{
    id: string;
    referenceCode: string;
    agreementFileId: string | null;
  } | null>(null);
  const [proofUploaded,    setProofUploaded]    = useState(false);
  const [proofUploading,   setProofUploading]   = useState(false);
  const [proofUploadError, setProofUploadError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAllBundles, setShowAllBundles] = useState(false);
  const [showServiceCatalog, setShowServiceCatalog] = useState(false);
  const [showAddons, setShowAddons] = useState(false);
  const [agreedToTerms,   setAgreedToTerms]   = useState(false);
  const [signatureText,   setSignatureText]   = useState("");
  const [scrolledToEnd,   setScrolledToEnd]   = useState(false);
  const [payMethod,       setPayMethod]       = useState<"EFT" | "PAYFAST" | null>(null);
  const [submitting,      setSubmitting]      = useState(false);
  const [submitError,     setSubmitError]     = useState<string | null>(null);
  const [agreementOpening, setAgreementOpening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Brief fields
  const [name,           setName]           = useState("");
  const [overview,       setOverview]       = useState("");
  const [goals,          setGoals]          = useState("");
  const [audience,       setAudience]       = useState("");
  const [budget,         setBudget]         = useState("");
  const [timeline,       setTimeline]       = useState("");
  const [references,     setReferences]     = useState("");
  const [requirements,   setRequirements]   = useState("");
  const [mobilePlatform, setMobilePlatform] = useState("");
  const [ecPlatform,     setEcPlatform]     = useState("");
  const [hasBrandAssets, setHasBrandAssets] = useState("");

  // Stable EFT reference suffix — generated once per component mount so it
  // doesn't change on every re-render (Date.now() called inline would change
  // on every state update).
  const eftSuffix = useMemo(() => Date.now().toString().slice(-6), []);

  const resetWizard = () => {
    setStep(1);
    setIntakeMode("guided");
    setBizSize(null);
    setGoal(null);
    setSelected(new Set());
    setAddons(new Set());
    setSubmittedProject(null);
    setProofUploaded(false);
    setProofUploading(false);
    setProofUploadError(null);
    setShowBreakdown(false);
    setShowAllBundles(false);
    setShowServiceCatalog(false);
    setShowAddons(false);
    setAgreedToTerms(false);
    setSignatureText("");
    setScrolledToEnd(false);
    setPayMethod(null);
    setSubmitting(false);
    setSubmitError(null);
    setName("");
    setOverview("");
    setGoals("");
    setAudience("");
    setBudget("");
    setTimeline("");
    setReferences("");
    setRequirements("");
    setMobilePlatform("");
    setEcPlatform("");
    setHasBrandAssets("");
  };

  // Derived
  const goalObj        = goal ? GOALS.find(g => g.id === goal) : null;
  const recommendedIds = new Set<ServiceId>(goalObj?.recs ?? []);
  const featuredCombos = COMBOS.slice(0, 3);
  const selArr         = [...selected];
  const estMin         = selArr.reduce((s, id) => s + PRICE_MAP[id][0], 0);
  const estMax         = selArr.reduce((s, id) => s + PRICE_MAP[id][1], 0);
  const wksMin         = selArr.reduce((mx, id) => Math.max(mx, WEEKS_MAP[id][0]), 0);
  const wksMax         = selArr.reduce((mx, id) => Math.max(mx, WEEKS_MAP[id][1]), 0);
  const isOngoing      = selArr.length === 1 && selArr[0] === "retainer";
  const step2Valid     = !!(name.trim() && overview.trim() && goals.trim());

  // Quote amounts (prices are in Rands; convert to cents for API)
  const quoteCents     = estMin * 100;  // conservative quote = estMin
  const depositCents   = Math.round(quoteCents * 0.5);
  const milestoneCents = Math.round(quoteCents * 0.3);
  const finalCents     = quoteCents - depositCents - milestoneCents;

  const toggleService = (id: ServiceId) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAddon = (id: AddonId) =>
    setAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const isComboActive = (c: ComboItem) => c.services.every(s => selected.has(s));
  const selectCombo   = (c: ComboItem) => setSelected(prev => {
    const next = new Set(prev);
    if (isComboActive(c)) c.services.forEach((s) => next.delete(s));
    else c.services.forEach((s) => next.add(s));
    return next;
  });
  const applyRecommendedServices = () => {
    if (!goalObj) return;
    setSelected(new Set(goalObj.recs));
    setShowServiceCatalog(false);
  };

  // ── Stepper ────────────────────────────────────────────────────────────────

  const Stepper = () => (
    <div className={cx("prqStepper")}>
      {STEP_LABELS.map((label, idx) => {
        const n = idx + 1; const done = step > n; const active = step === n;
        return (
          <div key={label} className={cx("dContents")}>
            <div className={cx("prqStepItem")}>
              <div className={cx("prqStepCircle", done ? "prqStepCircleDone" : "", active ? "prqStepCircleActive" : "")}>
                {done ? <Ic n="check" sz={11} c="var(--lime)" /> : <span>{n}</span>}
              </div>
              <span className={cx("prqStepLabel", active ? "prqStepLabelActive" : "")}>{label}</span>
            </div>
            {idx < STEP_LABELS.length - 1 && <div className={cx("prqStepLine", step > n ? "prqStepLineDone" : "")} />}
          </div>
        );
      })}
    </div>
  );

  // ── Estimate strip ─────────────────────────────────────────────────────────

  const EstStrip = () =>
    selected.size === 0 ? null : (
      <div className={cx("mb16")}>
        <div className={cx("prqEstStrip")}>
          <div className={cx("prqEstItem")}>
            <span className={cx("prqEstVal")}>{isOngoing ? `${fmtR(estMin)}/mo` : `${fmtR(estMin)} – ${fmtR(estMax)}`}</span>
            <span className={cx("prqEstLbl")}>Estimate</span>
          </div>
          <div className={cx("prqEstDivider")} />
          <div className={cx("prqEstItem")}>
            <span className={cx("prqEstVal")}>{isOngoing ? "Ongoing" : wksMin === wksMax ? `${wksMin}w` : `${wksMin}–${wksMax}w`}</span>
            <span className={cx("prqEstLbl")}>Timeline</span>
          </div>
          <div className={cx("prqEstDivider")} />
          <div className={cx("prqEstItem")}>
            <span className={cx("prqEstVal")}>{selected.size}</span>
            <span className={cx("prqEstLbl")}>Service{selected.size > 1 ? "s" : ""}</span>
          </div>
          <div className={cx("mlAuto", "flexRow", "flexCenter", "gap10")}>
            <span className={cx("text10", "colorMuted")}>Indicative — exact pricing in proposal</span>
            <button type="button" onClick={() => setShowBreakdown(b => !b)}
              className={cx("textBtn")}>
              {showBreakdown ? "Hide" : "Breakdown"} <Ic n={showBreakdown ? "chevronDown" : "chevronRight"} sz={10} c="var(--muted2)" />
            </button>
          </div>
        </div>
        {showBreakdown && (
          <div className={cx("prqBreakdownPanel")}>
            {selArr.map(id => {
              const svc = SERVICES.find(x => x.id === id)!;
              return (
                <div key={id} className={cx("flexRow", "flexCenter", "gap10", "mb8")}>
                  <div className={cx("prqBizIco", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${svc.color} 12%, transparent)` } as React.CSSProperties}>
                    <Ic n={svc.icon} sz={12} c={svc.color} />
                  </div>
                  <span className={cx("fw600", "text12", "flex1")}>{svc.label}</span>
                  <span className={cx("text11", "colorMuted", "mr12")}>
                    {svc.tag === "Monthly" ? "Ongoing" : `${WEEKS_MAP[id][0]}–${WEEKS_MAP[id][1]}w`}
                  </span>
                  <span className={cx("fw600", "text11", "colorAccent", "minW120", "textRight")}>
                    {fmtR(PRICE_MAP[id][0])} – {fmtR(PRICE_MAP[id][1])}
                  </span>
                </div>
              );
            })}
            {selected.size > 1 && (
              <div className={cx("flexBetween", "pt8", "borderT")}>
                <span className={cx("fw700", "text12")}>Combined Estimate</span>
                <span className={cx("fw700", "text12", "colorAccent")}>{fmtR(estMin)} – {fmtR(estMax)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );

  // ── Selection summary bar (step 2 header) ─────────────────────────────────

  const SelectionBar = () => (
    <div className={cx("tagWrapRow", "mb16")}>
      <span className={cx("text11", "colorMuted", "fw600")}>Selected:</span>
      {selArr.map(id => {
        const svc = SERVICES.find(x => x.id === id)!;
        return (
          <span key={id} className={cx("prqSelBarTag", "dynBgColor", "dynBorderLeft3")} style={{ "--bg-color": `color-mix(in oklab, ${svc.color} 10%, transparent)`, "--color": `color-mix(in oklab, ${svc.color} 25%, transparent)` } as React.CSSProperties}>
            <Ic n={svc.icon} sz={10} c={svc.color} />
            <span className={cx("text11", "fw600", "dynColor")} style={{ "--color": svc.color } as React.CSSProperties}>{svc.label}</span>
          </span>
        );
      })}
      <span className={cx("text11", "colorMuted", "mlAuto")}>
        Estimate: <strong className={cx("colorAccent")}>{isOngoing ? `${fmtR(estMin)}/mo` : `${fmtR(estMin)} – ${fmtR(estMax)}`}</strong>
      </span>
    </div>
  );

  // ── Success screen ─────────────────────────────────────────────────────────

  if (submittedProject) {
    const refCode   = submittedProject.referenceCode;
    const projectId = submittedProject.id;
    const isEft     = payMethod === "EFT";
    const canOpenAgreement = !!submittedProject.agreementFileId;

    return (
      <div className={cx("prqSuccessShell")}>
        {/* Main card */}
        <div className={cx("prqCard")}>
          {/* Header */}
          <div className={cx("prqHeader")}>
            <div className={cx("prqCheckRing")}>
              <Ic n="check" sz={24} c="var(--lime)" />
            </div>
            <div className={cx("prqTitle")}>Request submitted!</div>
            <p className={cx("prqSub")}>
              {isEft
                ? "Your project request is in. Upload your proof of payment below to move it to the top of the queue."
                : "Your project request has been submitted. Your dedicated PM will reach out within 24 hours."}
            </p>
          </div>

          {/* Reference strip */}
          <div className={cx("prqRefStrip")}>
            <div>
              <div className={cx("prqRefLabel")}>Reference</div>
              <div className={cx("prqRefCode")}>{refCode}</div>
            </div>
            <button className={cx("prqCopyBtn")} onClick={() => navigator.clipboard.writeText(refCode)}>Copy</button>
          </div>

          {/* Summary row */}
          <div className={cx("prqSummaryRow")}>
            <div className={cx("prqSummaryItem")}>
              <span className={cx("prqSummaryLabel")}>Quote</span>
              <span className={cx("prqSummaryValue")}>{fmtR(Math.round(quoteCents / 100))}</span>
            </div>
            <div className={cx("prqSummaryItem")}>
              <span className={cx("prqSummaryLabel")}>Deposit</span>
              <span className={cx("prqSummaryValueAccent")}>{fmtR(Math.round(depositCents / 100))}</span>
            </div>
            <div className={cx("prqSummaryItem")}>
              <span className={cx("prqSummaryLabel")}>Method</span>
              <span className={cx("prqSummaryValue")}>{payMethod}</span>
            </div>
          </div>

          <div className={cx("flexRow", "gap8", "mb16", "flexWrap")}>
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
              disabled={!canOpenAgreement || agreementOpening}
              onClick={async () => {
                if (!session || !submittedProject.agreementFileId) return;
                setAgreementOpening(true);
                try {
                  const result = await getPortalFileDownloadUrlWithRefresh(session, submittedProject.agreementFileId);
                  if (result.nextSession) saveSession(result.nextSession);
                  if (!result.data?.downloadUrl) return;
                  window.open(result.data.downloadUrl, "_blank", "noopener,noreferrer");
                } finally {
                  setAgreementOpening(false);
                }
              }}
            >
              <Ic n="file" sz={12} c="currentColor" /> {agreementOpening ? "Opening..." : "View agreement"}
            </button>
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
              disabled={!canOpenAgreement || agreementOpening}
              onClick={async () => {
                if (!session || !submittedProject.agreementFileId) return;
                setAgreementOpening(true);
                try {
                  const result = await getPortalFileDownloadUrlWithRefresh(session, submittedProject.agreementFileId);
                  if (result.nextSession) saveSession(result.nextSession);
                  if (!result.data?.downloadUrl) return;
                  const link = document.createElement("a");
                  link.href = result.data.downloadUrl;
                  link.download = refCode + "-engagement-agreement.pdf";
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } finally {
                  setAgreementOpening(false);
                }
              }}
            >
              <Ic n="download" sz={12} c="currentColor" /> Download agreement
            </button>
          </div>

          {/* Timeline */}
          <div className={cx("prqTimelineLabel")}>Project status</div>
          <div className={cx("prqTimeline")}>
            {(isEft
              ? ["Request submitted", "Deposit verification", "Proposal review", "Project kickoff"]
              : ["Request submitted", "Proposal review", "Project kickoff"]
            ).map((label, i) => {
              const stepNum = i + 1;
              const activeStep = isEft ? (proofUploaded ? 3 : 2) : 2;
              const isDone = stepNum < activeStep;
              const isActive = stepNum === activeStep;
              return (
                <div key={label} className={cx("prqStep", isDone ? "prqStepDone" : "")}>
                  <div className={cx("prqDot", isDone ? "prqDotDone" : isActive ? "prqDotActive" : "prqDotPending")}>
                    {isDone ? <Ic n="check" sz={12} c="var(--lime)" /> : stepNum}
                  </div>
                  <div className={cx("prqStepText", isDone ? "prqStepTextDone" : isActive ? "prqStepTextActive" : "")}>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* EFT section — only for EFT payments */}
          {isEft && (
            <div className={cx("prqEftSection")}>
              <div className={cx("prqEftHeader")}>
                <span className={cx(proofUploaded ? "prqEftBadgeDone" : "prqEftBadge")}>
                  {proofUploaded ? "✓ Uploaded" : "EFT"}
                </span>
                <span className={cx("prqEftTitle")}>
                  {proofUploaded ? "Proof of payment received" : "Upload proof of payment"}
                </span>
              </div>
              <div className={cx("prqEftBody")}>
                {proofUploaded ? (
                  <p className={cx("prqEftInfo")}>
                    We&apos;ve received your proof of payment and notified our team. You&apos;ll get an email confirmation once it&apos;s verified — usually within 1 business day.
                  </p>
                ) : (
                  <>
                    <p className={cx("prqEftInfo")}>
                      Transfer your deposit of <strong>{fmtR(Math.round(depositCents / 100))}</strong> to the account below, then upload your bank confirmation PDF.
                    </p>
                    <div className={cx("prqBankGrid")}>
                      <div><div className={cx("prqBankLabel")}>Bank</div><div className={cx("prqBankVal")}>FNB</div></div>
                      <div><div className={cx("prqBankLabel")}>Account name</div><div className={cx("prqBankVal")}>Maphari Technologies</div></div>
                      <div><div className={cx("prqBankLabel")}>Account no.</div><div className={cx("prqBankVal")}>6271 004 8341</div></div>
                      <div><div className={cx("prqBankLabel")}>Reference</div><div className={cx("prqBankVal")}>{refCode}</div></div>
                    </div>
                    <label className={cx("prqUploadZone")}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        style={{ display: "none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.type !== "application/pdf") { setProofUploadError("Only PDF files are accepted."); return; }
                          if (file.size > 10 * 1024 * 1024) { setProofUploadError("File must be 10 MB or smaller."); return; }
                          setProofUploading(true);
                          setProofUploadError(null);
                          try {
                            const uploaded = await uploadPortalFileWithRefresh(session!, file);
                            if (uploaded.nextSession) saveSession(uploaded.nextSession);
                            if (!uploaded.data) { setProofUploadError(uploaded.error?.message ?? "Upload failed."); return; }
                            const submitRes = await submitPortalEftProofWithRefresh(session!, projectId, {
                              proofFileId: uploaded.data.id,
                              proofFileName: file.name
                            });
                            if (submitRes.nextSession) saveSession(submitRes.nextSession);
                            if (submitRes.error) { setProofUploadError(submitRes.error.message); return; }
                            setProofUploaded(true);
                          } finally {
                            setProofUploading(false);
                          }
                        }}
                      />
                      <div className={cx("prqUploadIcon")}><Ic n="upload" sz={18} c="var(--muted)" /></div>
                      <div>Drag your PDF here</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>or <span style={{ color: "var(--lime)" }}>browse to upload</span> · PDF only · max 10 MB</div>
                    </label>
                    {proofUploadError && <p style={{ fontSize: 12, color: "#f87171", marginTop: 8 }}>{proofUploadError}</p>}
                    <button
                      className={cx("prqUploadBtn", proofUploading ? "prqUploadBtnLoading" : "")}
                      disabled={proofUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {proofUploading ? "Uploading…" : "Upload proof of payment"}
                    </button>
                    <a className={cx("prqSkipLink")} onClick={() => props.onNavigate?.("myProjects")}>
                      I&apos;ll upload this later from my dashboard →
                    </a>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* What happens next */}
        <div className={cx("prqNextCard")}>
          <div className={cx("prqNextTitle")}>What happens next</div>
          <div className={cx("prqNextList")}>
            {(isEft
              ? [
                  "Our team reviews your proof of payment within 1 business day",
                  "Once confirmed, your dedicated project lead will schedule a kickoff call",
                  `Track your project in your dashboard — reference ${refCode}`
                ]
              : [
                  "Your dedicated PM will reach out within 24 hours with a tailored proposal",
                  "Once approved, your project kickoff is scheduled",
                  `Track your project in your dashboard — reference ${refCode}`
                ]
            ).map((text, i) => (
              <div key={i} className={cx("prqNextItem")}>
                <div className={cx("prqNextNum")}>{i + 1}</div>
                <div className={cx("prqNextText")}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · New Request</div>
          <h1 className={cx("pageTitle")}>Start a New Project</h1>
          <p className={cx("pageSub")}>Tell us what you need and we&apos;ll put together a tailored proposal within 24 hours.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => props.onNavigate?.("myProjects")}>My Projects</button>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={resetWizard}>Restart</button>
        </div>
      </div>

      {!session || !clientId ? (
        <div className={cx("emptyState", "mt32")}>
          <div className={cx("emptyStateIcon")}><Ic n="folder" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>Sign in to request a project</div>
          <div className={cx("emptyStateSub")}>We need your client session before we can prepare a quote, create a deposit invoice, and submit the request.</div>
        </div>
      ) : (
        <>

      {/* Trust strip */}
      <div className={cx("prqTrustStrip")}>
        {TRUST.map((t, i) => (
          <div key={t.text} className={cx("dContents")}>
            <div className={cx("prqTrustItem")}><Ic n={t.icon} sz={12} c="var(--lime)" />{t.text}</div>
            {i < TRUST.length - 1 && <div className={cx("prqTrustSep")} />}
          </div>
        ))}
      </div>

      <Stepper />

      {/* ══ STEP 1 ════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <>
          <div className={cx("mb12")}>
            <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb8")}>
              How would you like to start?
            </div>
            <div className={cx("text12", "colorMuted", "mb12")}>
              Most clients do better with the guided path first. You can still open the full catalog whenever you want.
            </div>
          </div>

          <div className={cx("grid2Cols", "gap10", "mb20")}>
            <button
              type="button"
              className={cx("prqGoalCard", intakeMode === "guided" ? "prqGoalCardActive" : "")}
              onClick={() => setIntakeMode("guided")}
            >
              <div className={cx("prqGoalIco", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, var(--lime) 12%, transparent)" } as React.CSSProperties}>
                <Ic n="sparkles" sz={14} c={intakeMode === "guided" ? "var(--lime)" : "var(--muted2)"} />
              </div>
              <div className={cx("prqGoalLabel")}>Guided Request</div>
              <div className={cx("prqGoalSub")}>Tell us your goal first. We&apos;ll suggest the right service stack and keep the intake lighter.</div>
            </button>
            <button
              type="button"
              className={cx("prqGoalCard", intakeMode === "custom" ? "prqGoalCardActive" : "")}
              onClick={() => {
                setIntakeMode("custom");
                setShowServiceCatalog(true);
                setShowAllBundles(true);
                setShowAddons(true);
              }}
            >
              <div className={cx("prqGoalIco", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, var(--accent) 12%, transparent)" } as React.CSSProperties}>
                <Ic n="sliders" sz={14} c={intakeMode === "custom" ? "var(--accent)" : "var(--muted2)"} />
              </div>
              <div className={cx("prqGoalLabel")}>Custom Build</div>
              <div className={cx("prqGoalSub")}>Choose bundles, individual services, and add-ons yourself if you already know the exact mix.</div>
            </button>
          </div>

          {intakeMode === "guided" && !goalObj && (
            <div className={cx("card", "mb20")}>
              <div className={cx("cardBodyPad")}>
                <div className={cx("fw700", "text12", "mb6")}>Recommended flow</div>
                <div className={cx("text12", "colorMuted")}>
                  Pick your business stage, choose your main goal, then we&apos;ll suggest the leanest service mix for the proposal. You do not need to browse every package first.
                </div>
              </div>
            </div>
          )}

          {/* ── Business size ───────────────────────────────────────────────── */}
          <div className={cx("mb24")}>
            <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb10")}>
              What stage is your business at? <span className={cx("textNone", "lsNormal", "fw400")}>— we&apos;ll tailor our suggestions</span>
            </div>
            <div className={cx("grid4Cols", "gap8")}>
              {BUSINESS_SIZES.map(s => {
                const active = bizSize === s.id;
                return (
                  <button key={s.id} type="button" onClick={() => setBizSize(active ? null : s.id as BizSize)}
                    className={cx("prqBizCard", "dynBgColor", "dynBorderLeft3")} style={{ "--bg-color": active ? `color-mix(in oklab, ${s.color} 8%, transparent)` : "var(--s2)", "--color": active ? s.color : "var(--b2)" } as React.CSSProperties}>
                    <div className={cx("prqBizIco", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${s.color} 15%, transparent)` } as React.CSSProperties}>
                      <Ic n={s.icon} sz={13} c={active ? s.color : "var(--muted2)"} />
                    </div>
                    <div className={cx("fs08", "fw700", "colorText", "mt4")}>{s.label}</div>
                    <div className={cx("fs065", "colorMuted", "lineH14")}>{s.sub}</div>
                    <div className={cx("fs065", "mt2", "dynColor")} style={{ "--color": active ? s.color : "var(--muted)" } as React.CSSProperties}>{s.range}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Goal picker ─────────────────────────────────────────────────── */}
          <div className={cx("mb24")}>
            <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb10")}>
              What are you trying to achieve?
            </div>
            <div className={cx("grid3Cols8Gap")}>
              {GOALS.map(g => {
                const active = goal === g.id;
                return (
                  <button key={g.id} type="button" className={cx("prqGoalCard", active ? "prqGoalCardActive" : "")}
                    onClick={() => setGoal(active ? null : g.id as GoalId)}>
                    <div className={cx("prqGoalIco", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${g.color} 12%, transparent)` } as React.CSSProperties}>
                      <Ic n={g.icon} sz={14} c={active ? g.color : "var(--muted2)"} />
                    </div>
                    <div className={cx("prqGoalLabel")}>{g.label}</div>
                    <div className={cx("prqGoalSub")}>{g.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {intakeMode === "guided" && goalObj && (
            <div className={cx("card", "mb20")}>
              <div className={cx("cardHd")}>
                <Ic n="sparkles" sz={14} c="var(--lime)" />
                <span className={cx("cardHdTitle", "ml8")}>Recommended starting setup</span>
                <span className={cx("badge", "badgeAccent", "mlAuto")}>{goalObj.recs.length} services</span>
              </div>
              <div className={cx("cardBodyPad")}>
                <div className={cx("text12", "colorMuted", "mb12")}>
                  Based on your goal, this is the leanest stack we&apos;d use to scope the proposal.
                </div>
                <div className={cx("tagWrapRow", "mb12")}>
                  {goalObj.recs.map((id) => {
                    const svc = SERVICES.find((service) => service.id === id);
                    if (!svc) return null;
                    return (
                      <span key={id} className={cx("prqSelBarTag", "dynBgColor", "dynBorderLeft3")} style={{ "--bg-color": "color-mix(in oklab, " + svc.color + " 10%, transparent)", "--color": "color-mix(in oklab, " + svc.color + " 25%, transparent)" } as React.CSSProperties}>
                        <Ic n={svc.icon} sz={10} c={svc.color} />
                        <span className={cx("text11", "fw600", "dynColor")} style={{ "--color": svc.color } as React.CSSProperties}>{svc.label}</span>
                      </span>
                    );
                  })}
                </div>
                <div className={cx("flexRow", "gap8", "flexWrap")}>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={applyRecommendedServices}>
                    Use recommended setup
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={() => {
                      setIntakeMode("custom");
                      setShowServiceCatalog(true);
                    }}
                  >
                    Customise services
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Bundle deals ────────────────────────────────────────────────── */}
          <div className={cx("mb28")}>
            <div className={cx("flexRow", "flexCenter", "gap10", "mb14")}>
              <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted")}>Bundle Deals</div>
              <span className={cx("text10", "colorMuted")}>— combine services & save more</span>
              <div className={cx("flexDivider")} />
              <span className={cx("badge", "badgeAccent")}>{showAllBundles || intakeMode === "custom" ? COMBOS.length : featuredCombos.length} shown</span>
            </div>
            <div className={cx("grid2Cols", "gap10")}>
              {(showAllBundles || intakeMode === "custom" ? COMBOS : featuredCombos).map(combo => {
                const active = isComboActive(combo);
                return (
                  <div key={combo.id}
                    className={cx("prqComboCard", "dynBgColor", "dynBorderLeft3")} style={{ "--bg-color": active ? `color-mix(in oklab, ${combo.color} 5%, var(--s1))` : "var(--s1)", "--color": active ? combo.color : "var(--b2)" } as React.CSSProperties}>
                    {/* Colour bar */}
                    <div className={cx("h3", "dynBgColor")} style={{ "--bg-color": combo.color } as React.CSSProperties} />
                    <div className={cx("p14x16x16")}>
                      {/* Header */}
                      <div className={cx("flexAlignStart", "justifyBetween", "mb10")}>
                        <div className={cx("flexRow", "gap8")}>
                          <div className={cx("prqComboIco", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${combo.color} 15%, transparent)` } as React.CSSProperties}>
                            <Ic n={combo.icon} sz={16} c={combo.color} />
                          </div>
                          <div>
                            <div className={cx("fs08", "fw700", "colorText", "lineH12")}>{combo.label}</div>
                            <div className={cx("fs06", "colorMuted2", "mt2")}>{combo.sub}</div>
                          </div>
                        </div>
                        <span className={cx("badge", combo.badgeCls, "noShrink", "ml8")}>{combo.badge}</span>
                      </div>
                      {/* Highlights */}
                      <div className={cx("flexCol", "gap5", "mb12")}>
                        {combo.highlights.map(h => (
                          <div key={h} className={cx("flexRow", "flexAlignStart", "gap7")}>
                            <div className={cx("dot5", "noShrink", "mt4")} style={{ "--bg-color": combo.color } as React.CSSProperties} />
                            <span className={cx("fs065", "colorText", "lineH15", "opacity85")}>{h}</span>
                          </div>
                        ))}
                      </div>
                      {/* Footer */}
                      <div className={cx("flexBetween", "flexAlignStart", "gap8", "pt10", "borderT")}>
                        <div>
                          <div className={cx("prqComboPrice", "dynColor")} style={{ "--color": combo.color } as React.CSSProperties}>{combo.from}</div>
                          <div className={cx("fs055", "colorMuted2", "mt2")}>{combo.weeks[0]}–{combo.weeks[1]} weeks</div>
                        </div>
                        <div className={cx("flexCol", "gap6", "flexAlignEnd")}>
                          <span className={cx("prqComboSavingBadge", "dynBgColor", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${combo.color} 15%, transparent)`, "--color": combo.color } as React.CSSProperties}>
                            {combo.saving}
                          </span>
                          <button type="button" onClick={() => selectCombo(combo)}
                            className={cx("comboPill", "dynBgColor", "dynColor")} style={{ "--bg-color": active ? combo.color : "transparent", "--color": active ? "var(--bg)" : "var(--text)", "--border-color": active ? combo.color : "var(--b2)" } as React.CSSProperties}>
                            {active ? "✓ Selected" : "Select Package"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!showAllBundles && intakeMode !== "custom" && COMBOS.length > featuredCombos.length && (
              <div className={cx("mt12", "flexRow", "justifyEnd")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowAllBundles(true)}>
                  Show all packages
                </button>
              </div>
            )}
          </div>

          {/* ── Individual services label ────────────────────────────────────── */}
          <div className={cx("flexRow", "flexCenter", "gap10", "mb6", "flexWrap")}>
            <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted")}>Individual Services</div>
            <span className={cx("text10", "colorMuted")}>— mix & match, multi-select supported</span>
            {goal && <span className={cx("ml4", "colorAmber", "fs10", "fw500")}>· Recommended highlighted</span>}
            <div className={cx("flexDivider")} />
            <button type="button" className={cx("btnSm", "btnGhost", "mlAuto")} onClick={() => setShowServiceCatalog((value) => !value)}>
              {showServiceCatalog ? "Hide catalog" : "Open catalog"}
            </button>
          </div>

          {!showServiceCatalog && (
            <div className={cx("text11", "colorMuted", "mb14")}>
              Open the full catalog only if you want to fine-tune the request yourself. The guided recommendation is enough for us to scope the proposal.
            </div>
          )}

          <EstStrip />

          {/* ── Service grid — grouped ────────────────────────────────────────── */}
          {showServiceCatalog && SERVICE_GROUPS.map(group => (
            <div key={group.label} className={cx("mb22")}>
              <div className={cx("flexRow", "flexCenter", "gap8", "mb10")}>
                <div className={cx("wh6", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": group.color } as React.CSSProperties} />
                <span className={cx("fs07", "fw700", "colorText")}>{group.label}</span>
                <span className={cx("fs06", "colorMuted2")}>{group.sub}</span>
                <div className={cx("flexDivider")} />
              </div>
              <div className={cx("prqSvcGrid")}>
                {SERVICES.filter(svc => (group.ids as readonly string[]).includes(svc.id)).map(svc => {
                  const isActive = selected.has(svc.id);
                  const isReco   = recommendedIds.has(svc.id) && !isActive;
                  return (
                    <button key={svc.id} type="button"
                      className={cx("prqSvcCard", isActive ? "prqSvcCardActive" : "", isReco ? "prqSvcCardReco" : "")}
                      style={{ "--svc-color": svc.color } as React.CSSProperties}
                      onClick={() => toggleService(svc.id)}>
                      {svc.popular && <span className={cx("prqSvcPopular")}>Most Popular</span>}
                      {isReco && <span className={cx("prqSvcReco")}><span className={cx("prqSvcRecoDot")} />Recommended</span>}
                      <div className={cx("prqSvcHead")}>
                        <div className={cx("prqSvcIco")}><Ic n={svc.icon} sz={16} c={isActive ? svc.color : "var(--muted2)"} /></div>
                        <div className={cx("prqSvcMeta")}>
                          <div className={cx("prqSvcName")}>{svc.label}</div>
                          <div className={cx("prqSvcPrice")}>{svc.from}</div>
                          <div className={cx("flexRow", "gap4", "flexWrap", "mt3")}>
                            {svc.tag && (
                              <span className={cx("prqSvcTag", "dynBgColor", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${svc.color} 15%, transparent)`, "--color": svc.color } as React.CSSProperties}>{svc.tag}</span>
                            )}
                            <span className={cx("prqSvcTag", "prqSvcTagMuted")}>
                              {svc.tag === "Monthly" ? "Ongoing" : `${svc.weeks[0]}–${svc.weeks[1]}w`}
                            </span>
                          </div>
                        </div>
                        {isActive && <div className={cx("prqSvcCheck")}><Ic n="check" sz={11} c="var(--bg)" /></div>}
                      </div>
                      <div className={cx("prqSvcDesc")}>{svc.desc}</div>
                      <div className={cx("prqIncPills")}>
                        {INCLUDES_MAP[svc.id].map(t => <span key={t} className={cx("prqIncPill")}>{t}</span>)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ── Add-ons ──────────────────────────────────────────────────────── */}
          <div className={cx("mt24", "mb20")}>
            <div className={cx("flexRow", "flexCenter", "gap10", "mb14")}>
              <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted")}>Optional Add-ons</div>
              <span className={cx("text10", "colorMuted")}>— bolt on to any service</span>
              <div className={cx("flexDivider")} />
              <span className={cx("badge", "badgeMuted")}>{ADDONS.length} available</span>
              <button type="button" className={cx("btnSm", "btnGhost", "mlAuto")} onClick={() => setShowAddons((value) => !value)}>
                {showAddons ? "Hide add-ons" : "Show add-ons"}
              </button>
            </div>
            {showAddons && (
              <div className={cx("prqAddonGrid")}>
                {ADDONS.map(a => {
                  const on = addons.has(a.id);
                  return (
                    <button key={a.id} type="button" onClick={() => toggleAddon(a.id)}
                      className={cx("prqAddonCard", "dynBgColor", "dynBorderLeft3")} style={{ "--bg-color": on ? `color-mix(in oklab, ${a.color} 8%, var(--s2))` : "var(--s2)", "--color": on ? a.color : "var(--b2)" } as React.CSSProperties}>
                      <div className={cx("flexBetween")}>
                        <div className={cx("prqAddonIco", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${a.color} 16%, transparent)` } as React.CSSProperties}>
                          <Ic n={a.icon} sz={15} c={on ? a.color : "var(--muted2)"} />
                        </div>
                        <span className={cx("prqAddonPrice", "dynBgColor", "dynColor")} style={{ "--bg-color": on ? `color-mix(in oklab, ${a.color} 18%, transparent)` : "var(--s3)", "--color": on ? a.color : "var(--muted2)" } as React.CSSProperties}>
                          {a.price}
                        </span>
                      </div>
                      <div className={cx("fs08", "fw700", "colorText", "lineH13")} style={{ marginTop: 2 }}>{a.label}</div>
                      <div className={cx("text11", "colorMuted", "lineH16")} style={{ flex: 1 }}>{a.desc}</div>
                      {on && (
                        <div className={cx("prqAddonAddedRow", "dynBorderLeft3")} style={{ "--color": `color-mix(in oklab, ${a.color} 20%, transparent)` } as React.CSSProperties}>
                          <div className={cx("iconDot14", "noShrink", "dynBgColor")} style={{ "--bg-color": a.color } as React.CSSProperties}>
                            <Ic n="check" sz={8} c="var(--bg)" />
                          </div>
                          <span className={cx("prqAddonAddedLabel", "dynColor")} style={{ "--color": a.color } as React.CSSProperties}>Added to project</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom action row */}
          <div className={cx("prqSelRow", "flexWrap", "gap8")}>
            {selected.size === 0 ? (
              <span className={cx("text11", "colorMuted")}>
                Choose a goal and accept the recommended setup, or open the catalog to build your own service mix.
              </span>
            ) : (
              <span className={cx("text11", "colorMuted")}>
                You can still adjust services later in this request before anything is submitted.
              </span>
            )}
            {selected.size > 0 && <span className={cx("badge", "badgeAccent")}>{selected.size} service{selected.size > 1 ? "s" : ""} selected</span>}
            {addons.size > 0 && <span className={cx("badge", "badgeMuted")}>{addons.size} add-on{addons.size > 1 ? "s" : ""}</span>}
            {selected.size === 0 && intakeMode === "guided" && goalObj && (
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={applyRecommendedServices}>
                Use recommended setup
              </button>
            )}
            <button type="button" className={cx("btnSm", "btnAccent", selected.size === 0 && "opacity45")} disabled={selected.size === 0} onClick={() => setStep(2)}>
              Next — Project Brief <Ic n="chevronRight" sz={12} c="var(--bg)" />
            </button>
          </div>
        </>
      )}

      {/* ══ STEP 2 — Brief ════════════════════════════════════════════════════ */}
      {step === 2 && (
        <>
          <SelectionBar />
          <div className={cx("card")}>
            <div className={cx("cardHd")}>
              <Ic n="file" sz={14} c="var(--accent)" />
              <span className={cx("cardHdTitle", "ml8")}>Project Brief</span>
              <span className={cx("badge", "badgeMuted", "mlAuto")}>Fields marked * are required</span>
            </div>
            <div className={cx("cardBodyPad")}>
              <div className={cx("prqFormBody")}>

                <FormSection label="About the Project" />

                <div className={cx("prqFormField")}>
                  <label className={cx("prqFormLabel")}>Project Name <span className={cx("prqRequired")}>*</span></label>
                  <input className={cx("input")} placeholder="e.g. Veldt Finance Web App Redesign" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className={cx("prqFormField")}>
                  <label className={cx("prqFormLabel")}>Business Overview <span className={cx("prqRequired")}>*</span></label>
                  <textarea className={cx("input", "resizeV")} rows={3} placeholder="What does your business do? Who are your customers?" value={overview} onChange={e => setOverview(e.target.value)}  />
                </div>
                <div className={cx("prqFormField")}>
                  <label className={cx("prqFormLabel")}>Project Goals <span className={cx("prqRequired")}>*</span></label>
                  <textarea className={cx("input", "resizeV")} rows={3} placeholder="What are you trying to achieve? What does success look like?" value={goals} onChange={e => setGoals(e.target.value)}  />
                </div>

                <FormSection label="Scope & Constraints" />

                <div className={cx("grid2")}>
                  <div className={cx("prqFormField")}>
                    <label className={cx("prqFormLabel")}>Target Audience</label>
                    <input className={cx("input")} placeholder="Who will use this?" value={audience} onChange={e => setAudience(e.target.value)} />
                  </div>
                  <div className={cx("prqFormField")}>
                    <label className={cx("prqFormLabel")}>Budget Range</label>
                    <select className={cx("input")} value={budget} onChange={e => setBudget(e.target.value)}>
                      <option value="">Select budget...</option>
                      {BUDGET_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className={cx("prqFormField")}>
                  <label className={cx("prqFormLabel")}>Preferred Timeline</label>
                  <select className={cx("input")} value={timeline} onChange={e => setTimeline(e.target.value)}>
                    <option value="">Select timeline...</option>
                    {TIMELINE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                {(selected.has("mobileApp") || selected.has("ecommerce") || selected.has("designBrand") || selected.has("bizWebsite")) && (
                  <FormSection label="Service-Specific Details" />
                )}
                {selected.has("mobileApp") && (
                  <div className={cx("prqFormField")}>
                    <div className={cx("prqExtraCard")}>
                      <div className={cx("prqExtraHd")}><Ic n="layers" sz={11} c="var(--purple)" /> Which platforms do you need?</div>
                      <div className={cx("prqRadioRow")}>
                        {["iOS only", "Android only", "Both platforms"].map(opt => (
                          <button key={opt} type="button" className={cx("prqRadioOpt", mobilePlatform === opt ? "prqRadioOptActive" : "")} onClick={() => setMobilePlatform(opt)}>
                            <span className={cx("prqRadioOptDot")} />{opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {selected.has("ecommerce") && (
                  <div className={cx("prqFormField")}>
                    <div className={cx("prqExtraCard")}>
                      <div className={cx("prqExtraHd")}><Ic n="creditCard" sz={11} c="var(--green)" /> Which e-commerce platform?</div>
                      <div className={cx("prqRadioRow")}>
                        {["Shopify", "WooCommerce", "Custom build", "Not sure yet"].map(opt => (
                          <button key={opt} type="button" className={cx("prqRadioOpt", ecPlatform === opt ? "prqRadioOptActive" : "")} onClick={() => setEcPlatform(opt)}>
                            <span className={cx("prqRadioOptDot")} />{opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {(selected.has("designBrand") || selected.has("bizWebsite")) && (
                  <div className={cx("prqFormField")}>
                    <div className={cx("prqExtraCard")}>
                      <div className={cx("prqExtraHd")}><Ic n="edit" sz={11} c="var(--amber)" /> Do you have existing brand assets?</div>
                      <div className={cx("prqRadioRow")}>
                        {["Yes, full brand kit", "Some assets exist", "Starting from scratch"].map(opt => (
                          <button key={opt} type="button" className={cx("prqRadioOpt", hasBrandAssets === opt ? "prqRadioOptActive" : "")} onClick={() => setHasBrandAssets(opt)}>
                            <span className={cx("prqRadioOptDot")} />{opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <FormSection label="References & Notes" note="(optional)" />

                <div className={cx("prqFormField")}>
                  <label className={cx("prqFormLabel")}>Design References <span className={cx("prqOptional")}>(optional)</span></label>
                  <textarea className={cx("input", "resizeV")} rows={2} placeholder="Links, screenshots, or brands you admire..." value={references} onChange={e => setReferences(e.target.value)}  />
                </div>
                <div className={cx("prqFormField")}>
                  <label className={cx("prqFormLabel")}>Special Requirements <span className={cx("prqOptional")}>(optional)</span></label>
                  <textarea className={cx("input", "resizeV")} rows={2} placeholder="Integrations, compliance, languages, accessibility..." value={requirements} onChange={e => setRequirements(e.target.value)}  />
                </div>

              </div>
            </div>
          </div>
          <div className={cx("prqActionRow", "prqActionRowSpread")}>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setStep(1)}>← Back</button>
            <button type="button" className={cx("btnSm", "btnAccent", !step2Valid && "opacity45")} disabled={!step2Valid} onClick={() => setStep(3)}>
              Next — Review <Ic n="chevronRight" sz={12} c="var(--bg)" />
            </button>
          </div>
        </>
      )}

      {/* ══ STEP 3 — Confirm ══════════════════════════════════════════════════ */}
      {step === 3 && (
        <>
          <div className={cx("card", "mb14")}>
            <div className={cx("cardHd")}>
              <Ic n="check" sz={14} c="var(--lime)" />
              <span className={cx("cardHdTitle", "ml8")}>Review Your Request</span>
              <button type="button" className={cx("btnSm", "btnGhost", "mlAuto")} onClick={() => setStep(1)}>
                <Ic n="edit" sz={11} c="var(--muted2)" /> Edit Services
              </button>
            </div>
            <div className={cx("cardBodyPad")}>
              <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb8")}>Services selected</div>
              <div className={cx("prqReviewSvcs")}>
                {[...selected].map(id => {
                  const svc = SERVICES.find(x => x.id === id)!;
                  return (
                    <span key={id} className={cx("badge", "badgeAccent", "inlineFlex", "gap4")}>
                      <Ic n={svc.icon} sz={10} c="var(--lime)" />{svc.label}
                    </span>
                  );
                })}
              </div>
              {addons.size > 0 && (
                <>
                  <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb8", "mt12")}>Add-ons</div>
                  <div className={cx("flexRow", "gap6", "flexWrap")}>
                    {[...addons].map(id => {
                      const a = ADDONS.find(x => x.id === id)!;
                      return (
                        <span key={id} className={cx("badge", "badgeMuted", "inlineFlex", "gap4")}>
                          <Ic n={a.icon} sz={9} c="var(--muted2)" />{a.label} · {a.price}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
              <div className={cx("mt14")}><EstStrip /></div>
              <div className={cx("pt12", "borderT")}>
                <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb10")}>Project Brief</div>
                <div className={cx("prqReviewGrid", "mb12")}>
                  {([["Project Name", name], ["Budget Range", budget || "Not specified"], ["Timeline", timeline || "Not specified"], ["Target Audience", audience || "Not specified"]] as [string, string][]).map(([label, value]) => (
                    <div key={label} className={cx("prqReviewItem")}>
                      <div className={cx("prqReviewLbl")}>{label}</div>
                      <div className={cx("prqReviewVal")}>{value}</div>
                    </div>
                  ))}
                </div>
                {overview && <div className={cx("prqReviewSection")}><div className={cx("prqReviewLbl", "mb6")}>Business Overview</div><div className={cx("prqReviewText")}>{overview.length > 300 ? `${overview.slice(0, 300)}…` : overview}</div></div>}
                {goals && <div className={cx("prqReviewSection", "mt10")}><div className={cx("prqReviewLbl", "mb6")}>Project Goals</div><div className={cx("prqReviewText")}>{goals.length > 300 ? `${goals.slice(0, 300)}…` : goals}</div></div>}
                <div className={cx("mt14", "flexRow", "justifyEnd")}>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setStep(2)}><Ic n="edit" sz={11} c="var(--muted2)" /> Edit Brief</button>
                </div>
              </div>
            </div>
          </div>

          <div className={cx("card", "mb20")}>
            <div className={cx("cardHd")}>
              <Ic n="trending" sz={14} c="var(--accent)" />
              <span className={cx("cardHdTitle", "ml8")}>What Happens Next</span>
            </div>
            <div className={cx("cardBodyPad")}>
              {NEXT_STEPS.map((ns, i) => (
                <div key={ns.n} className={cx("flexRow", "gap14", "relative", i < NEXT_STEPS.length - 1 && "pb18")}>
                  {i < NEXT_STEPS.length - 1 && <div className={cx("stageConnector")} />}
                  <div className={cx("stageCircleLime")}>
                    <Ic n={ns.icon} sz={15} c="var(--lime)" />
                  </div>
                  <div className={cx("pt7")}>
                    <div className={cx("fw600", "text12")}>{ns.title}</div>
                    <div className={cx("text11", "colorMuted")}>{ns.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!isOngoing && (
            <div className={cx("card", "mb14")}>
              <div className={cx("cardHd")}>
                <Ic n="creditCard" sz={14} c="var(--accent)" />
                <span className={cx("cardHdTitle", "ml8")}>Payment Schedule</span>
              </div>
              <div className={cx("cardBodyPad")}>
                {[
                  { label: "50% Deposit",   amount: depositCents,   note: "Due on submission" },
                  { label: "30% Milestone", amount: milestoneCents, note: "On admin approval" },
                  { label: "20% Final",     amount: finalCents,     note: "On project delivery" },
                ].map(({ label, amount, note }, i) => (
                  <div key={label} className={cx("flexRow", "gap12", i < 2 ? "borderB" : "", "py10")}>
                    <div className={cx("fw600", "text12")} style={{ minWidth: 120 }}>{label}</div>
                    <div className={cx("fontMono", "fw700", "colorAccent")}>{fmtR(Math.round(amount / 100))}</div>
                    <div className={cx("colorMuted", "text11", "mlAuto")}>{note}</div>
                  </div>
                ))}
                <div className={cx("pt10", "text11", "colorMuted")}>
                  Total estimate based on selected services (R {estMin.toLocaleString()} min — R {estMax.toLocaleString()} max)
                </div>
              </div>
            </div>
          )}

          <div className={cx("prqActionRow", "prqActionRowSpread")}>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setStep(2)}>← Edit Brief</button>
            <button type="button" className={cx("btnSm", "btnAccent", "minW200")} onClick={() => setStep(4)}>
              Continue to Sign <Ic n="check" sz={12} c="var(--bg)" />
            </button>
          </div>
        </>
      )}

      {/* ══ STEP 4 — Sign Agreement ══════════════════════════════════════════ */}
      {step === 4 && (
        <>
          <div className={cx("card", "mb14")}>
            <div className={cx("cardHd")}>
              <Ic n="shield" sz={14} c="var(--accent)" />
              <span className={cx("cardHdTitle", "ml8")}>Digital Acceptance</span>
              <span className={cx("colorMuted", "text11", "mlAuto")}>Scroll to review the terms before accepting</span>
            </div>
              <div className={cx("cardBodyPad")}>
                <div className={cx("text11", "colorMuted", "mb12")}>
                Your typed name is recorded with this request and attached to a generated agreement PDF saved to your legal records.
              </div>
              <div
                onScroll={(e) => {
                  const el = e.currentTarget;
                  if (el.scrollHeight - el.scrollTop <= el.clientHeight + 40) setScrolledToEnd(true);
                }}
                style={{ maxHeight: 320, overflowY: "auto", padding: "12px 0", lineHeight: 1.7 }}
                className={cx("text12", "colorMuted")}
              >
                <p className={cx("fw700", "colorText", "mb8")}>ENGAGEMENT AGREEMENT — MAPHARI TECHNOLOGIES (PTY) LTD</p>
                <p className={cx("mb10")}>This Engagement Agreement (&ldquo;Agreement&rdquo;) is entered into between Maphari Technologies (Pty) Ltd (&ldquo;Service Provider&rdquo;) and the client submitting this project request (&ldquo;Client&rdquo;).</p>
                <p className={cx("fw600", "mb6")}>1. Scope of Work</p>
                <p className={cx("mb10")}>The Service Provider agrees to deliver the services selected in this project request brief, as further defined in a Statement of Work (SOW) issued upon project approval. Any changes to scope must be agreed in writing via a Change Order.</p>
                <p className={cx("fw600", "mb6")}>2. Payment Terms</p>
                <p className={cx("mb10")}>The Client agrees to the 50% / 30% / 20% payment schedule: a 50% deposit is due upon request submission, 30% upon milestone completion, and 20% final payment upon project delivery. All amounts are in South African Rand (ZAR). Late payments attract 2% per month interest.</p>
                <p className={cx("fw600", "mb6")}>3. Intellectual Property</p>
                <p className={cx("mb10")}>All deliverables become the property of the Client upon receipt of final payment. The Service Provider retains the right to showcase completed work in portfolios unless otherwise agreed in writing.</p>
                <p className={cx("fw600", "mb6")}>4. Confidentiality</p>
                <p className={cx("mb10")}>Both parties agree to keep all confidential information disclosed during the engagement strictly confidential. This includes business processes, technical specifications, financial data, and client lists.</p>
                <p className={cx("fw600", "mb6")}>5. Termination</p>
                <p className={cx("mb10")}>Either party may terminate this Agreement with 14 days written notice. Work completed up to the termination date will be invoiced at the applicable pro-rata rate. The 50% deposit is non-refundable once work has commenced.</p>
                <p className={cx("fw600", "mb6")}>6. Governing Law</p>
                <p className={cx("mb10")}>This Agreement is governed by the laws of the Republic of South Africa. Any disputes shall be resolved through mediation before litigation.</p>
                <p className={cx("mb6")}>By signing below, the Client confirms they have read, understood, and agreed to the terms of this Engagement Agreement.</p>
              </div>
              {!scrolledToEnd && (
                <div className={cx("text11", "colorMuted", "mt8")} style={{ textAlign: "center" }}>
                  ↓ Scroll to the bottom to enable signing
                </div>
              )}
              {scrolledToEnd && (
                <div className={cx("mt14")}>
                  <label className={cx("flexRow", "gap8", "mb12")} style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={e => setAgreedToTerms(e.target.checked)}
                      style={{ accentColor: "var(--lime)", width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
                    />
                    <span className={cx("text12")}>I have read and agree to the Engagement Agreement</span>
                  </label>
                  <div className={cx("mb6")}>
                    <label className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb6")} style={{ display: "block" }}>
                      Digital Signature — Type your full name
                    </label>
                    <input
                      type="text"
                      className={cx("inputSm")}
                      placeholder="Your full name…"
                      value={signatureText}
                      onChange={e => setSignatureText(e.target.value)}
                      disabled={!agreedToTerms}
                      style={{ width: "100%", fontStyle: signatureText ? "italic" : "normal" }}
                    />
                    {signatureText && (
                      <div className={cx("text11", "colorMuted", "mt6")}>
                        Signed: <em>{signatureText}</em> — {new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={cx("prqActionRow", "prqActionRowSpread")}>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setStep(3)}>← Back to Quote</button>
            <button
              type="button"
              className={cx("btnSm", "btnAccent", "minW200")}
              disabled={!agreedToTerms || !signatureText.trim()}
              onClick={() => setStep(5)}
            >
              Continue to Payment <Ic n="check" sz={12} c="var(--bg)" />
            </button>
          </div>
        </>
      )}

      {/* ══ STEP 5 — Pay Deposit ════════════════════════════════════════════ */}
      {step === 5 && (
        <>
          <div className={cx("card", "mb14")}>
            <div className={cx("cardHd")}>
              <Ic n="creditCard" sz={14} c="var(--accent)" />
              <span className={cx("cardHdTitle", "ml8")}>Pay 50% Deposit</span>
              <span className={cx("fontMono", "fw700", "colorAccent", "mlAuto")}>{fmtR(Math.round(depositCents / 100))}</span>
            </div>
            <div className={cx("cardBodyPad")}>
              <div className={cx("text12", "colorMuted", "mb16")}>
                Your deposit secures your project slot. Work begins after our team reviews and approves your request.
              </div>

              {/* EFT option */}
              <button
                type="button"
                className={cx("card", "mb10")}
                style={{
                  display: "block", width: "100%", textAlign: "left", cursor: "pointer",
                  border: payMethod === "EFT" ? "1.5px solid var(--lime)" : undefined,
                }}
                onClick={() => setPayMethod("EFT")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                  <Ic n="layers" sz={16} c={payMethod === "EFT" ? "var(--lime)" : "var(--muted2)"} />
                  <div>
                    <div className={cx("fw600", "text12", "colorText")}>EFT / Bank Transfer</div>
                    <div className={cx("colorMuted", "text11")}>Transfer to our account. We&apos;ll confirm receipt within 24h.</div>
                  </div>
                  {payMethod === "EFT" && <span style={{ marginLeft: "auto" }}><Ic n="check" sz={14} c="var(--lime)" /></span>}
                </div>
              </button>

              {/* PayFast option */}
              <button
                type="button"
                className={cx("card", "mb14")}
                style={{
                  display: "block", width: "100%", textAlign: "left", cursor: "pointer",
                  border: payMethod === "PAYFAST" ? "1.5px solid var(--lime)" : undefined,
                }}
                onClick={() => setPayMethod("PAYFAST")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                  <Ic n="zap" sz={16} c={payMethod === "PAYFAST" ? "var(--lime)" : "var(--muted2)"} />
                  <div>
                    <div className={cx("fw600", "text12", "colorText")}>PayFast — Instant Online Payment</div>
                    <div className={cx("colorMuted", "text11")}>Credit/debit card, EFT, or SnapScan via PayFast.</div>
                  </div>
                  {payMethod === "PAYFAST" && <span style={{ marginLeft: "auto" }}><Ic n="check" sz={14} c="var(--lime)" /></span>}
                </div>
              </button>

              {/* EFT bank details */}
              {payMethod === "EFT" && (
                <div className={cx("card", "mb14")} style={{ background: "var(--lime-g)" }}>
                  <div className={cx("cardBodyPad")}>
                    <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb10")} style={{ marginTop: 4 }}>Bank Details</div>
                    {([
                      ["Bank", process.env.NEXT_PUBLIC_BANK_NAME ?? "Nedbank"],
                      ["Account Name", process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "Maphari Technologies (Pty) Ltd"],
                      ["Account Number", process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "—"],
                      ["Branch Code", process.env.NEXT_PUBLIC_BANK_BRANCH_CODE ?? "198765"],
                      ["Reference", `DEP-${(name || "PROJECT").toUpperCase().replace(/\s+/g, "-").slice(0, 12)}-${eftSuffix}`],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label} className={cx("flexRow", "gap12", "mb6")}>
                        <span className={cx("colorMuted", "text11")} style={{ minWidth: 120 }}>{label}</span>
                        <span className={cx("fontMono", "text12", "fw600", "colorText")}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {submitError && (
                <div className={cx("text12")} style={{ color: "var(--red)", marginBottom: 12 }}>{submitError}</div>
              )}
            </div>
          </div>

          <div className={cx("prqActionRow", "prqActionRowSpread")}>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setStep(4)} disabled={submitting}>← Back</button>
            <button
              type="button"
              className={cx("btnSm", "btnAccent", "minW200")}
              disabled={!payMethod || submitting}
              onClick={async () => {
                if (!session || !clientId || !payMethod) return;
                setSubmitting(true);
                setSubmitError(null);
                try {
                  const agreementAcceptedAt = new Date().toISOString();
                  const serviceLabels = [...selected].map((id) => SERVICES.find((service) => service.id === id)?.label ?? id);
                  const agreementPdf = await buildProjectRequestAgreementPdf({
                    projectName: name || "Project request",
                    services: serviceLabels,
                    estimateLabel: isOngoing ? fmtR(estMin) + "/mo" : fmtR(estMin) + " – " + fmtR(estMax),
                    overview,
                    goals,
                    budget: budget || "Budget to be confirmed during proposal review",
                    timeline: timeline || "Timeline to be confirmed during proposal review",
                    signerName: signatureText.trim(),
                    acceptedAtIso: agreementAcceptedAt,
                  });
                  const agreementFile = await createPortalInlineFileWithRefresh(session, {
                    fileName: agreementPdf.fileName,
                    mimeType: "application/pdf",
                    contentBase64: agreementPdf.contentBase64,
                  });
                  if (agreementFile.nextSession) saveSession(agreementFile.nextSession);
                  if (agreementFile.error || !agreementFile.data) {
                    setSubmitError(agreementFile.error?.message ?? "Unable to generate agreement record.");
                    return;
                  }

                  // 1. Create deposit invoice
                  const invoiceRef = `DEP-${Date.now()}`;
                  const invRes = await createPortalInvoiceWithRefresh(session, {
                    number: invoiceRef,
                    amountCents: depositCents,
                    status: "ISSUED",
                  });
                  if (invRes.nextSession) saveSession(invRes.nextSession);
                  if (invRes.error || !invRes.data) {
                    setSubmitError(invRes.error?.message ?? "Unable to create deposit invoice.");
                    return;
                  }
                  const invoiceId = invRes.data.id;

                  // 2. Create pending payment
                  const payRes = await createPortalPaymentWithRefresh(session, {
                    invoiceId,
                    amountCents: depositCents,
                    status: "PENDING",
                    provider: payMethod,
                    transactionRef: `${payMethod}-${Date.now()}`,
                  });
                  if (payRes.nextSession) saveSession(payRes.nextSession);
                  if (payRes.error || !payRes.data) {
                    setSubmitError(payRes.error?.message ?? "Unable to record deposit.");
                    return;
                  }
                  const paymentId = payRes.data.id;

                  // 3. Submit project request
                  const selectedServices = [...new Set(
                    SERVICES.filter(s => selected.has(s.id)).map(s => SERVICE_TO_CONTRACT[s.id])
                  )];
                  const acceptanceNote =
                    "Digital acceptance recorded by " +
                    signatureText.trim() +
                    " on " +
                    new Date(agreementAcceptedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
                  const reqRes = await createPortalProjectRequestWithRefresh(session, {
                    name: name || [...selected].map(id => SERVICES.find(s => s.id === id)?.label ?? id).join(" + "),
                    description: overview || undefined,
                    estimatedBudgetCents: quoteCents,
                    priority: "MEDIUM",
                    scopePrompt: [overview, goals, audience, requirements, acceptanceNote].filter(Boolean).join("\n"),
                    selectedServices,
                    signedAgreementSignerName: signatureText.trim(),
                    signedAgreementAcceptedAt: agreementAcceptedAt,
                    signedAgreementFileId: agreementFile.data.id,
                    estimatedQuoteCents: quoteCents,
                    depositInvoiceId: invoiceId,
                    depositPaymentId: paymentId,
                  });
                  if (reqRes.nextSession) saveSession(reqRes.nextSession);
                  if (reqRes.error) {
                    setSubmitError(reqRes.error.message ?? "Unable to submit project request.");
                    return;
                  }

                  // 4. For PayFast: redirect to payment page
                  if (payMethod === "PAYFAST") {
                    const pfRes = await initiatePortalPayfastWithRefresh(session, {
                      invoiceId,
                      returnUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/client/dashboard?page=my-projects&pf=success`,
                      cancelUrl: `${typeof window !== "undefined" ? window.location.href : ""}`,
                    });
                    if (pfRes.nextSession) saveSession(pfRes.nextSession);
                    if (pfRes.data?.url && pfRes.data.fields && typeof window !== "undefined") {
                      const form = document.createElement("form");
                      form.method = "POST";
                      form.action = pfRes.data.url;
                      form.style.display = "none";

                      Object.entries(pfRes.data.fields).forEach(([key, value]) => {
                        const input = document.createElement("input");
                        input.type = "hidden";
                        input.name = key;
                        input.value = value;
                        form.appendChild(input);
                      });

                      document.body.appendChild(form);
                      form.submit();
                      return;
                    }
                  }

                  if (reqRes.data) {
                    if (!reqRes.data.referenceCode) {
                      setSubmitError("Request submitted but reference code was missing. Please contact support.");
                      return;
                    }
                    setSubmittedProject({
                      id: reqRes.data.id,
                      referenceCode: reqRes.data.referenceCode,
                      agreementFileId: agreementFile.data.id,
                    });
                  }
                } catch {
                  setSubmitError("An unexpected error occurred. Please try again.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "Processing…" : payMethod === "PAYFAST" ? "Pay via PayFast →" : "Submit & Confirm EFT →"}
            </button>
          </div>
        </>
      )}

        </>
      )}
    </div>
  );
}
