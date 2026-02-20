export type NavItem = { label: string; href: string; id: string };

export const navItems: NavItem[] = [
  { label: "Services", href: "#services", id: "services" },
  { label: "Process", href: "#process", id: "process" },
  { label: "Proof", href: "#proof", id: "proof" },
  { label: "Pricing", href: "#pricing", id: "pricing" },
  { label: "Contact", href: "#contact", id: "contact" }
];

export const tickerItems = [
  "Web Applications",
  "Mobile Systems",
  "Process Automation",
  "Product Strategy",
  "Platform Maintenance",
  "System Integrations"
];

export const services = [
  {
    num: "01 / 05",
    title: "Web Applications",
    desc: "Full-stack platforms designed to convert traffic into qualified leads and deliver your service at scale."
  },
  {
    num: "02 / 05",
    title: "Mobile Systems",
    desc: "Native and cross-platform apps that extend your service delivery to every screen your clients use."
  },
  {
    num: "03 / 05",
    title: "Process Automation",
    desc: "Eliminate manual bottlenecks. We automate handoffs, follow-ups, and reporting across your stack."
  },
  {
    num: "04 / 05",
    title: "Platform Redesign",
    desc: "Transform legacy systems into modern, reliable platforms without disrupting live operations."
  },
  {
    num: "05 / 05",
    title: "Ongoing Maintenance",
    desc: "Continuous monitoring, updates, and improvements so performance grows after launch, not before."
  }
];

export const processSteps = [
  {
    num: "01",
    title: "Scope & Strategy",
    desc: "Define what needs to be built, why it matters, and how we'll measure success before writing a single line of code."
  },
  {
    num: "02",
    title: "Design & Architecture",
    desc: "Wireframes, system design, and data models locked in before development. No surprises mid-sprint."
  },
  {
    num: "03",
    title: "Deliver",
    desc: "Ship production-ready increments with testing, integration checks, and clear ownership at every stage."
  },
  {
    num: "04",
    title: "Develop Further",
    desc: "Maintain and improve continuously so performance grows after launch, not before. Monthly roadmap reviews included."
  }
];

export const faqs = [
  {
    q: "How long does a typical project take?",
    a: "Most projects run between 4 and 10 weeks depending on scope and integration depth. We'll give you a precise estimate during the strategy call."
  },
  {
    q: "Do you redesign existing platforms?",
    a: "Yes. We specialise in modernising legacy systems without disrupting live operations. We audit first, then propose a migration path that keeps your business running throughout."
  },
  {
    q: "Do you support systems after launch?",
    a: "Absolutely. Our Growth and Partner tiers include ongoing support, monitoring, and continuous improvement. Even Starter clients can add a maintenance retainer post-launch."
  },
  {
    q: "What makes Maphari different from a typical agency?",
    a: "We measure success by operational outcomes: revenue, speed, and support reduction. Every engagement starts with a scope call and ends with a system you can run."
  }
];

export const integrations = ["HubSpot", "Salesforce", "Stripe", "Xero", "Slack", "Google Workspace", "Notion", "Zapier"];
