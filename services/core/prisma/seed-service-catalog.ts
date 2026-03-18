// ════════════════════════════════════════════════════════════════════════════
// seed-service-catalog.ts — Populate service catalog from the MAT Price Guide
//
// Run:  npx ts-node --esm prisma/seed-service-catalog.ts
//       (from services/core directory)
//
// Source: MAT Price.pdf — packages, retainers, add-ons
// Prices in ZAR → stored as cents (×100) for precision
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────
const r = (rands: number) => Math.round(rands * 100);

async function main() {
  console.log("Seeding service catalog…");

  // ── 1. SERVICE PACKAGES ────────────────────────────────────────────────────

  await prisma.servicePackage.deleteMany();

  await prisma.servicePackage.createMany({
    data: [
      {
        name:          "Starter Launch",
        slug:          "starter-launch",
        tagline:       "Get your digital presence up and running fast.",
        priceMinCents: r(4500),
        priceMaxCents: r(7500),
        isCustomQuote: false,
        deliveryDays:  "5–7 business days",
        paymentTerms:  "50% upfront · 50% on completion",
        idealFor:      ["Startups", "Freelancers", "Side Projects"],
        features: [
          { label: "Up to 5-page responsive website",           included: true },
          { label: "Basic branding (logo + colour palette)",    included: true },
          { label: "Mobile-first design",                       included: true },
          { label: "Contact form + WhatsApp integration",       included: true },
          { label: "Google Analytics setup",                    included: true },
          { label: "Basic SEO (meta tags + sitemap)",           included: true },
          { label: "1 round of revisions",                      included: true },
          { label: "Hosting & domain guidance",                 included: true },
          { label: "3 months post-launch email support",        included: true },
          { label: "Social media setup (2 platforms)",          included: "Basic" },
        ],
        billingType: "ONCE_OFF",
        sortOrder:   1,
        isActive:    true,
      },
      {
        name:          "Business Growth",
        slug:          "business-growth",
        tagline:       "Scale your online presence with a complete digital foundation.",
        priceMinCents: r(10000),
        priceMaxCents: r(18000),
        isCustomQuote: false,
        deliveryDays:  "10–14 business days",
        paymentTerms:  "50% upfront · 50% on completion",
        idealFor:      ["SMEs", "Growing Businesses", "Service Providers"],
        features: [
          { label: "Up to 10-page responsive website",          included: true },
          { label: "Full brand identity (logo, fonts, colours)",included: true },
          { label: "Custom UI/UX design",                       included: true },
          { label: "Blog / content management system",          included: true },
          { label: "Email marketing integration",               included: true },
          { label: "Social media setup (4 platforms)",          included: true },
          { label: "Advanced SEO (on-page + schema markup)",    included: true },
          { label: "Google Ads / Meta Ads basic setup",         included: true },
          { label: "2 rounds of revisions",                     included: true },
          { label: "6 months post-launch support",              included: true },
          { label: "Basic CRM integration",                     included: "Basic" },
          { label: "E-commerce (up to 20 products)",            included: "Basic" },
        ],
        billingType: "ONCE_OFF",
        sortOrder:   2,
        isActive:    true,
      },
      {
        name:          "Smart Automation",
        slug:          "smart-automation",
        tagline:       "Automate your workflows and deliver a smarter client experience.",
        priceMinCents: r(22000),
        priceMaxCents: r(35000),
        isCustomQuote: false,
        deliveryDays:  "3–5 weeks",
        paymentTerms:  "50% upfront · 25% at midpoint · 25% on completion",
        idealFor:      ["Agencies", "E-commerce Brands", "SaaS Products"],
        features: [
          { label: "Full custom web application",               included: true },
          { label: "Complete brand identity system",            included: true },
          { label: "Marketing automation (email + SMS)",        included: true },
          { label: "CRM integration (HubSpot / Salesforce)",   included: true },
          { label: "Booking / scheduling system",               included: true },
          { label: "Payment gateway integration",               included: true },
          { label: "Advanced SEO + local SEO",                  included: true },
          { label: "Social media management (3 months)",        included: true },
          { label: "Google Ads + Meta Ads campaign setup",      included: true },
          { label: "3 rounds of revisions",                     included: true },
          { label: "AI chatbot / lead capture",                 included: "Basic" },
          { label: "Client portal (view-only)",                 included: "Basic" },
          { label: "Analytics dashboard",                       included: "Basic" },
        ],
        billingType: "ONCE_OFF",
        sortOrder:   3,
        isActive:    true,
      },
      {
        name:          "Full Digital Transformation",
        slug:          "full-digital-transformation",
        tagline:       "End-to-end transformation of your digital operations.",
        priceMinCents: r(45000),
        priceMaxCents: r(80000),
        isCustomQuote: true,
        deliveryDays:  "6–12 weeks",
        paymentTerms:  "40% upfront · 30% at midpoint · 30% on completion",
        idealFor:      ["Enterprises", "Scale-ups", "Multi-location Businesses"],
        features: [
          { label: "Enterprise web application / platform",     included: true },
          { label: "Full brand system + style guide",           included: true },
          { label: "Custom AI automation workflows",            included: true },
          { label: "Multi-channel marketing automation",        included: true },
          { label: "Full CRM + ERP integration",               included: true },
          { label: "E-commerce (unlimited products + logistics",included: true },
          { label: "Payment + subscription billing",            included: true },
          { label: "Advanced analytics + BI dashboard",         included: true },
          { label: "Dedicated account manager",                 included: true },
          { label: "Priority support (SLA)",                   included: true },
          { label: "Staff training (up to 5 users)",            included: true },
          { label: "Unlimited revisions during project",        included: true },
        ],
        billingType: "ONCE_OFF",
        sortOrder:   4,
        isActive:    true,
      },
      {
        name:          "Mobile Application Development",
        slug:          "mobile-app-development",
        tagline:       "Native iOS & Android apps that extend your platform to mobile.",
        priceMinCents: r(15000),
        priceMaxCents: r(35000),
        isCustomQuote: false,
        deliveryDays:  "4–8 weeks",
        paymentTerms:  "50% upfront · 25% at midpoint · 25% on completion",
        idealFor:      ["Startups needing a mobile app", "Businesses extending web platform to mobile"],
        features: [
          { label: "React Native (iOS + Android)",                 included: true },
          { label: "Push notifications",                           included: true },
          { label: "Offline mode + local caching",                 included: true },
          { label: "REST / GraphQL API integration",               included: true },
          { label: "App Store + Play Store submission guidance",   included: true },
          { label: "Deep linking & in-app navigation",             included: true },
          { label: "Biometric authentication (FaceID / fingerprint)", included: true },
          { label: "Analytics & crash reporting setup",            included: true },
          { label: "2 rounds of revisions",                        included: true },
          { label: "6-week post-launch bug-fix window",            included: true },
        ],
        billingType: "ONCE_OFF",
        sortOrder:   5,
        isActive:    true,
      },
    ],
  });

  console.log("✓ Service packages seeded (5)");

  // ── 2. RETAINER PLANS ─────────────────────────────────────────────────────

  await prisma.retainerPlan.deleteMany();

  await prisma.retainerPlan.createMany({
    data: [
      {
        name:          "Basic Care",
        description:   "Essential maintenance for small sites that need to stay live and secure.",
        priceMinCents: r(800),
        priceMaxCents: r(1200),
        features: [
          "Monthly software & plugin updates",
          "Security monitoring (weekly scans)",
          "Up to 1 hour of content updates / month",
          "Monthly uptime report",
          "Email support (48-hour response)",
        ],
        sortOrder: 1,
        isActive:  true,
      },
      {
        name:          "Standard Maintenance",
        description:   "Consistent maintenance and light improvements for growing businesses.",
        priceMinCents: r(1500),
        priceMaxCents: r(2500),
        features: [
          "Everything in Basic Care",
          "Up to 3 hours of content & design updates / month",
          "Performance optimisation (quarterly)",
          "Google Analytics reporting (monthly)",
          "Priority email support (24-hour response)",
          "1 blog post or social graphic / month",
        ],
        sortOrder: 2,
        isActive:  true,
      },
      {
        name:          "Business Support",
        description:   "Active management and marketing support for scaling businesses.",
        priceMinCents: r(2500),
        priceMaxCents: r(4500),
        features: [
          "Everything in Standard Maintenance",
          "Up to 6 hours of updates & new features / month",
          "SEO monitoring + keyword tracking",
          "Social media management (2 platforms, 8 posts/month)",
          "Monthly strategy call (30 min)",
          "Priority phone + email support",
          "Quarterly landing page refresh",
        ],
        sortOrder: 3,
        isActive:  true,
      },
      {
        name:          "Full Managed Service",
        description:   "Your dedicated digital team — everything handled end-to-end.",
        priceMinCents: r(5000),
        priceMaxCents: r(8000),
        features: [
          "Everything in Business Support",
          "Up to 12 hours of updates, features & campaigns / month",
          "Full social media management (4 platforms, 20 posts/month)",
          "Paid ad management (Google + Meta, up to R5,000 ad spend)",
          "Monthly performance review + strategy session (1 hour)",
          "Dedicated account manager",
          "24-hour emergency response",
          "Quarterly full site audit",
        ],
        sortOrder: 4,
        isActive:  true,
      },
    ],
  });

  console.log("✓ Retainer plans seeded (4)");

  // ── 3. SERVICE ADD-ONS ────────────────────────────────────────────────────

  await prisma.serviceAddon.deleteMany();

  const addons = [
    // ── Hosting & Domain ──
    { category: "Hosting & Domain", name: "Domain registration (.co.za)",      priceMinCents: r(200),  priceMaxCents: r(350),  priceLabel: "/ year",  billingType: "ANNUAL",  sortOrder: 1 },
    { category: "Hosting & Domain", name: "Domain registration (.com)",         priceMinCents: r(300),  priceMaxCents: r(500),  priceLabel: "/ year",  billingType: "ANNUAL",  sortOrder: 2 },
    { category: "Hosting & Domain", name: "Shared hosting setup",               priceMinCents: r(150),  priceMaxCents: r(300),  priceLabel: "/ month", billingType: "MONTHLY", sortOrder: 3 },
    { category: "Hosting & Domain", name: "VPS hosting (managed)",              priceMinCents: r(800),  priceMaxCents: r(1500), priceLabel: "/ month", billingType: "MONTHLY", sortOrder: 4 },
    { category: "Hosting & Domain", name: "Business email setup (G Suite / M365)",priceMinCents: r(500),priceMaxCents: r(1000), priceLabel: "",        billingType: "ONCE_OFF",sortOrder: 5 },
    { category: "Hosting & Domain", name: "SSL certificate installation",       priceMinCents: r(300),  priceMaxCents: r(600),  priceLabel: "",        billingType: "ONCE_OFF",sortOrder: 6 },
    { category: "Hosting & Domain", name: "CDN setup (Cloudflare)",             priceMinCents: r(400),  priceMaxCents: r(800),  priceLabel: "",        billingType: "ONCE_OFF",sortOrder: 7 },

    // ── Website Extras ──
    { category: "Website Extras", name: "Additional page design",               priceMinCents: r(800),  priceMaxCents: r(1500), priceLabel: "per page", billingType: "ONCE_OFF", sortOrder: 1 },
    { category: "Website Extras", name: "E-commerce store (additional products)",priceMinCents: r(2000),priceMaxCents: r(5000), priceLabel: "",         billingType: "ONCE_OFF", sortOrder: 2 },
    { category: "Website Extras", name: "Multilingual support (per language)",  priceMinCents: r(1500), priceMaxCents: r(3000), priceLabel: "per lang", billingType: "ONCE_OFF", sortOrder: 3 },
    { category: "Website Extras", name: "Booking / appointment system",         priceMinCents: r(2500), priceMaxCents: r(5000), priceLabel: "",         billingType: "ONCE_OFF", sortOrder: 4 },
    { category: "Website Extras", name: "Membership / subscription portal",     priceMinCents: r(4000), priceMaxCents: r(8000), priceLabel: "",         billingType: "ONCE_OFF", sortOrder: 5 },
    { category: "Website Extras", name: "Live chat integration",                priceMinCents: r(500),  priceMaxCents: r(1000), priceLabel: "",         billingType: "ONCE_OFF", sortOrder: 6 },
    { category: "Website Extras", name: "Newsletter subscription setup",        priceMinCents: r(600),  priceMaxCents: r(1200), priceLabel: "",         billingType: "ONCE_OFF", sortOrder: 7 },
    { category: "Website Extras", name: "Speed / performance optimisation",     priceMinCents: r(800),  priceMaxCents: r(1500), priceLabel: "",         billingType: "ONCE_OFF", sortOrder: 8 },

    // ── Branding & Design ──
    { category: "Branding & Design", name: "Logo design (new)",                 priceMinCents: r(1500), priceMaxCents: r(4000), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 1 },
    { category: "Branding & Design", name: "Logo redesign / refresh",           priceMinCents: r(800),  priceMaxCents: r(2000), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 2 },
    { category: "Branding & Design", name: "Full brand identity kit",           priceMinCents: r(4000), priceMaxCents: r(9000), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 3 },
    { category: "Branding & Design", name: "Social media graphic templates (10)",priceMinCents: r(1200),priceMaxCents: r(2500), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 4 },
    { category: "Branding & Design", name: "Business card + letterhead design", priceMinCents: r(600),  priceMaxCents: r(1200), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 5 },
    { category: "Branding & Design", name: "Pitch deck / presentation design",  priceMinCents: r(2000), priceMaxCents: r(5000), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 6 },

    // ── Automation & CRM Extras ──
    { category: "Automation & CRM", name: "CRM setup (HubSpot / Pipedrive)",   priceMinCents: r(2000), priceMaxCents: r(5000), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 1 },
    { category: "Automation & CRM", name: "Email automation sequences (5 flows)",priceMinCents: r(1500),priceMaxCents: r(3500), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 2 },
    { category: "Automation & CRM", name: "WhatsApp Business automation",       priceMinCents: r(1200), priceMaxCents: r(3000), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 3 },
    { category: "Automation & CRM", name: "Lead capture + scoring automation",  priceMinCents: r(2000), priceMaxCents: r(4500), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 4 },
    { category: "Automation & CRM", name: "AI chatbot (custom trained)",        priceMinCents: r(3500), priceMaxCents: r(8000), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 5 },
    { category: "Automation & CRM", name: "Zapier / Make workflow setup",       priceMinCents: r(800),  priceMaxCents: r(2000), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 6 },
    { category: "Automation & CRM", name: "SMS marketing integration",          priceMinCents: r(1000), priceMaxCents: r(2500), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 7 },
    { category: "Automation & CRM", name: "Reporting dashboard (custom)",       priceMinCents: r(2500), priceMaxCents: r(6000), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 8 },

    // ── Content & SEO ──
    { category: "Content & SEO", name: "SEO audit + strategy report",           priceMinCents: r(1500), priceMaxCents: r(3000), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 1 },
    { category: "Content & SEO", name: "Monthly SEO management",                priceMinCents: r(1500), priceMaxCents: r(3500), priceLabel: "/ month", billingType: "MONTHLY", sortOrder: 2 },
    { category: "Content & SEO", name: "Blog content (per article)",            priceMinCents: r(500),  priceMaxCents: r(1200), priceLabel: "per article", billingType: "ONCE_OFF", sortOrder: 3 },
    { category: "Content & SEO", name: "Google Ads campaign management",        priceMinCents: r(1500), priceMaxCents: r(3000), priceLabel: "/ month", billingType: "MONTHLY", sortOrder: 4 },
    { category: "Content & SEO", name: "Meta Ads campaign management",          priceMinCents: r(1500), priceMaxCents: r(3000), priceLabel: "/ month", billingType: "MONTHLY", sortOrder: 5 },
    { category: "Content & SEO", name: "Video production (30-sec promo)",       priceMinCents: r(3000), priceMaxCents: r(8000), priceLabel: "", billingType: "ONCE_OFF", sortOrder: 6 },
  ];

  await prisma.serviceAddon.createMany({ data: addons });

  console.log(`✓ Service add-ons seeded (${addons.length})`);

  // ── 4. BUNDLES ────────────────────────────────────────────────────────────

  await prisma.serviceBundle.deleteMany();

  const starterPkg  = await prisma.servicePackage.findUnique({ where: { slug: "starter-launch" } });
  const growthPkg   = await prisma.servicePackage.findUnique({ where: { slug: "business-growth" } });
  const autoPkg     = await prisma.servicePackage.findUnique({ where: { slug: "smart-automation" } });

  if (starterPkg && growthPkg && autoPkg) {
    const launchBundle = await prisma.serviceBundle.create({
      data: {
        name:        "Launch & Grow Bundle",
        description: "Start with Starter Launch then scale to Business Growth — save 10%.",
        discountPct: 10,
        sortOrder:   1,
        isActive:    true,
      },
    });

    await prisma.serviceBundlePackage.createMany({
      data: [
        { bundleId: launchBundle.id, packageId: starterPkg.id },
        { bundleId: launchBundle.id, packageId: growthPkg.id },
      ],
    });

    const scaleBundle = await prisma.serviceBundle.create({
      data: {
        name:        "Scale & Automate Bundle",
        description: "Business Growth + Smart Automation for end-to-end digital scale — save 12%.",
        discountPct: 12,
        sortOrder:   2,
        isActive:    true,
      },
    });

    await prisma.serviceBundlePackage.createMany({
      data: [
        { bundleId: scaleBundle.id, packageId: growthPkg.id },
        { bundleId: scaleBundle.id, packageId: autoPkg.id },
      ],
    });

    console.log("✓ Service bundles seeded (2)");
  }

  console.log("Service catalog seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
