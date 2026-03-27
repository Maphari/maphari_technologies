import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

// ─── Shared identity constants ───────────────────────────────────────────────
const CLIENT1_ID = "c1000000-0000-0000-0000-000000000001"; // TechStart Ltd
const CLIENT2_ID = "c1000000-0000-0000-0000-000000000002"; // GrowthCo Agency
const CLIENT3_ID = "c1000000-0000-0000-0000-000000000003"; // Enterprise Systems

const PROJECT1_ID = "d1000000-0000-0000-0000-000000000001"; // TechStart Website Redesign
const PROJECT2_ID = "d1000000-0000-0000-0000-000000000002"; // TechStart Mobile App
const PROJECT3_ID = "d1000000-0000-0000-0000-000000000003"; // GrowthCo Brand Overhaul
const PROJECT4_ID = "d1000000-0000-0000-0000-000000000004"; // GrowthCo SEO Campaign
const PROJECT5_ID = "d1000000-0000-0000-0000-000000000005"; // Enterprise ERP Integration

const MILESTONE_IDS = {
  m1p1: "e1000000-0000-0000-0000-000000000001", // project1 — Discovery
  m2p1: "e1000000-0000-0000-0000-000000000002", // project1 — Design Handoff (IN_REVIEW)
  m1p2: "e1000000-0000-0000-0000-000000000003", // project2 — MVP Spec
  m1p3: "e1000000-0000-0000-0000-000000000004", // project3 — Brand Style Guide (APPROVED)
  m2p3: "e1000000-0000-0000-0000-000000000005", // project3 — Logo Delivery (IN_REVIEW)
  m1p5: "e1000000-0000-0000-0000-000000000006", // project5 — Data Migration
  m2p5: "e1000000-0000-0000-0000-000000000007", // project5 — API Integration
};

const TASK_IDS = {
  t1p1: "f1000000-0000-0000-0000-000000000001", // project1 task 1
  t2p1: "f1000000-0000-0000-0000-000000000002", // project1 task 2
  t3p1: "f1000000-0000-0000-0000-000000000003", // project1 task 3
  t1p2: "f1000000-0000-0000-0000-000000000004", // project2 task 1
  t2p2: "f1000000-0000-0000-0000-000000000005", // project2 task 2
  t1p3: "f1000000-0000-0000-0000-000000000006", // project3 task 1
  t2p3: "f1000000-0000-0000-0000-000000000007", // project3 task 2
  t1p4: "f1000000-0000-0000-0000-000000000008", // project4 task 1
  t1p5: "f1000000-0000-0000-0000-000000000009", // project5 task 1
  t2p5: "f1000000-0000-0000-0000-000000000010", // project5 task 2
};

const LEAD_IDS = {
  l1: "b1000000-0000-0000-0000-000000000001", // NEW
  l2: "b1000000-0000-0000-0000-000000000002", // QUALIFIED
  l3: "b1000000-0000-0000-0000-000000000003", // PROPOSAL
  l4: "b1000000-0000-0000-0000-000000000004", // WON
  l5: "b1000000-0000-0000-0000-000000000005", // LOST
};

const now = new Date();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

const INTEGRATION_PROVIDERS = [
  { id: "f1000000-0000-0000-0000-000000000001", key: "gcal",       label: "Google Calendar", category: "calendar",           kind: "oauth",       availabilityStatus: "active",      isRequestEnabled: false, supportsDisconnect: true,  supportsReconnect: true,  supportsHealthChecks: true,  sortOrder: 1, iconKey: "gcal",       description: "Sync scheduled meetings and milestone due dates to your Google Calendar." },
  { id: "f1000000-0000-0000-0000-000000000002", key: "slack",      label: "Slack",           category: "communication",      kind: "oauth",       availabilityStatus: "beta",        isRequestEnabled: false, supportsDisconnect: true,  supportsReconnect: true,  supportsHealthChecks: true,  sortOrder: 2, iconKey: "slack",      description: "Receive project notifications, approvals, and alerts directly in your Slack workspace." },
  { id: "f1000000-0000-0000-0000-000000000003", key: "msteams",    label: "Microsoft Teams", category: "communication",      kind: "assisted",    availabilityStatus: "active",      isRequestEnabled: true,  supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 3, iconKey: "msteams",    description: "Route project notifications and updates to your Teams channels." },
  { id: "f1000000-0000-0000-0000-000000000004", key: "gdrive",     label: "Google Drive",    category: "files",              kind: "assisted",    availabilityStatus: "beta",        isRequestEnabled: true,  supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 4, iconKey: "gdrive",     description: "Export approved deliverables and project files into your Google Drive workspace." },
  { id: "f1000000-0000-0000-0000-000000000005", key: "dropbox",    label: "Dropbox",         category: "files",              kind: "assisted",    availabilityStatus: "active",      isRequestEnabled: true,  supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 5, iconKey: "dropbox",    description: "Automatically sync project file deliverables to your Dropbox folder." },
  { id: "f1000000-0000-0000-0000-000000000006", key: "quickbooks", label: "QuickBooks",      category: "finance",            kind: "assisted",    availabilityStatus: "beta",        isRequestEnabled: true,  supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 6, iconKey: "quickbooks", description: "Push approved invoices and finance records into QuickBooks." },
  { id: "f1000000-0000-0000-0000-000000000007", key: "xero",       label: "Xero",            category: "finance",            kind: "assisted",    availabilityStatus: "active",      isRequestEnabled: true,  supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 7, iconKey: "xero",       description: "Automatically push approved invoices to your Xero accounting platform." },
  { id: "f1000000-0000-0000-0000-000000000008", key: "zapier",     label: "Zapier",          category: "automation",         kind: "coming_soon", availabilityStatus: "coming_soon", isRequestEnabled: false, supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 8, iconKey: "zapier",     description: "Connect your project data to thousands of tools via automated Zapier workflows." },
  { id: "f1000000-0000-0000-0000-000000000009", key: "hubspot",    label: "HubSpot",         category: "crm",                kind: "coming_soon", availabilityStatus: "coming_soon", isRequestEnabled: false, supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 9, iconKey: "hubspot",    description: "View project health and delivery metrics inside your HubSpot CRM." },
  { id: "f1000000-0000-0000-0000-000000000010", key: "salesforce", label: "Salesforce",      category: "crm",                kind: "coming_soon", availabilityStatus: "coming_soon", isRequestEnabled: false, supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 10, iconKey: "salesforce", description: "Expose project health and delivery signals to your Salesforce workflows." },
  { id: "f1000000-0000-0000-0000-000000000011", key: "notion",     label: "Notion",          category: "documentation",      kind: "coming_soon", availabilityStatus: "coming_soon", isRequestEnabled: false, supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 11, iconKey: "notion",     description: "Export meeting notes and decision logs directly to a Notion workspace." },
  { id: "f1000000-0000-0000-0000-000000000012", key: "jira",       label: "Jira",            category: "project_management", kind: "coming_soon", availabilityStatus: "coming_soon", isRequestEnabled: false, supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 12, iconKey: "jira",       description: "Bridge project tasks, milestones, and delivery updates into Jira." },
  { id: "f1000000-0000-0000-0000-000000000013", key: "asana",      label: "Asana",           category: "project_management", kind: "coming_soon", availabilityStatus: "coming_soon", isRequestEnabled: false, supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 13, iconKey: "asana",      description: "Synchronize planning and delivery workflows with Asana." },
  { id: "f1000000-0000-0000-0000-000000000014", key: "clickup",    label: "ClickUp",         category: "project_management", kind: "coming_soon", availabilityStatus: "coming_soon", isRequestEnabled: false, supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 14, iconKey: "clickup",    description: "Keep work management aligned by syncing delivery updates to ClickUp." },
  { id: "f1000000-0000-0000-0000-000000000015", key: "docusign",   label: "DocuSign",        category: "approvals",          kind: "coming_soon", availabilityStatus: "coming_soon", isRequestEnabled: false, supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 15, iconKey: "docusign",   description: "Route agreements and approvals into DocuSign signature workflows." },
  { id: "f1000000-0000-0000-0000-000000000016", key: "pandadoc",   label: "PandaDoc",        category: "approvals",          kind: "coming_soon", availabilityStatus: "coming_soon", isRequestEnabled: false, supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 16, iconKey: "pandadoc",   description: "Send client approvals and commercial documents through PandaDoc." },
  { id: "f1000000-0000-0000-0000-000000000017", key: "sharepoint", label: "SharePoint",      category: "files",              kind: "assisted",    availabilityStatus: "beta",        isRequestEnabled: true,  supportsDisconnect: false, supportsReconnect: false, supportsHealthChecks: false, sortOrder: 17, iconKey: "sharepoint", description: "Sync approved deliverables to enterprise SharePoint libraries." },
] as const;

async function main() {
  console.log("🌱 Seeding core database…");

  for (const provider of INTEGRATION_PROVIDERS) {
    await prisma.integrationProvider.upsert({
      where: { key: provider.key },
      update: {
        label: provider.label,
        description: provider.description,
        category: provider.category,
        kind: provider.kind,
        availabilityStatus: provider.availabilityStatus,
        iconKey: provider.iconKey,
        isClientVisible: true,
        isRequestEnabled: provider.isRequestEnabled,
        supportsDisconnect: provider.supportsDisconnect,
        supportsReconnect: provider.supportsReconnect,
        supportsHealthChecks: provider.supportsHealthChecks,
        sortOrder: provider.sortOrder,
      },
      create: {
        id: provider.id,
        key: provider.key,
        label: provider.label,
        description: provider.description,
        category: provider.category,
        kind: provider.kind,
        availabilityStatus: provider.availabilityStatus,
        iconKey: provider.iconKey,
        isClientVisible: true,
        isRequestEnabled: provider.isRequestEnabled,
        supportsDisconnect: provider.supportsDisconnect,
        supportsReconnect: provider.supportsReconnect,
        supportsHealthChecks: provider.supportsHealthChecks,
        sortOrder: provider.sortOrder,
      },
    });
  }
  console.log(`  ✓ Integration providers (${INTEGRATION_PROVIDERS.length})`);

  // ── 1. Clients ───────────────────────────────────────────────────────────
  await prisma.client.upsert({
    where: { id: CLIENT1_ID },
    update: {},
    create: {
      id: CLIENT1_ID,
      name: "TechStart Ltd",
      status: "ACTIVE",
      priority: "HIGH",
      tier: "GROWTH",
      timezone: "Europe/London",
      billingEmail: "billing@techstart.io",
      ownerName: "Sarah Chen",
      contractStartAt: daysAgo(180),
      contractRenewalAt: daysFromNow(185),
      slaTier: "PRIORITY",
      slaResponseHours: 16,
      notes: "Fast-growing SaaS startup. Key account — handle with care.",
    },
  });

  await prisma.client.upsert({
    where: { id: CLIENT2_ID },
    update: {},
    create: {
      id: CLIENT2_ID,
      name: "GrowthCo Agency",
      status: "ACTIVE",
      priority: "MEDIUM",
      tier: "STARTER",
      timezone: "America/New_York",
      billingEmail: "accounts@growthco.io",
      ownerName: "Tom Okafor",
      contractStartAt: daysAgo(90),
      contractRenewalAt: daysFromNow(275),
      slaTier: "STANDARD",
      slaResponseHours: 24,
      notes: "Digital marketing agency. Monthly retainer.",
    },
  });

  await prisma.client.upsert({
    where: { id: CLIENT3_ID },
    update: {},
    create: {
      id: CLIENT3_ID,
      name: "Enterprise Systems",
      status: "AT_RISK",
      priority: "HIGH",
      tier: "ENTERPRISE",
      timezone: "America/Chicago",
      billingEmail: "finance@enterprise-sys.io",
      ownerName: "Sarah Chen",
      contractStartAt: daysAgo(365),
      contractRenewalAt: daysFromNow(14),
      slaTier: "ENTERPRISE",
      slaResponseHours: 8,
      notes: "Legacy ERP migration project facing blockers. Escalate any delays.",
    },
  });
  console.log("  ✓ Clients (3)");

  // ── 2. Client Contacts ───────────────────────────────────────────────────
  const contacts = [
    { clientId: CLIENT1_ID, name: "Alice Morgan", email: "alice@techstart.io", role: "CTO", isPrimary: true },
    { clientId: CLIENT1_ID, name: "James Parker", email: "james@techstart.io", role: "Product Manager", isPrimary: false },
    { clientId: CLIENT2_ID, name: "Bob Nduka", email: "bob@growthco.io", role: "CEO", isPrimary: true },
    { clientId: CLIENT2_ID, name: "Priya Sharma", email: "priya@growthco.io", role: "Marketing Lead", isPrimary: false },
    { clientId: CLIENT3_ID, name: "Carol Zhang", email: "carol@enterprise-sys.io", role: "IT Director", isPrimary: true },
    { clientId: CLIENT3_ID, name: "Derek Foster", email: "derek@enterprise-sys.io", role: "Project Sponsor", isPrimary: false },
  ];
  for (const c of contacts) {
    await prisma.clientContact.upsert({
      where: { id: `cc-${c.clientId}-${c.email}`.slice(0, 36) },
      update: {},
      create: {
        id: `cc${c.clientId.slice(2, 10)}-${Buffer.from(c.email).toString("hex").slice(0, 20)}`.slice(0, 36),
        clientId: c.clientId,
        name: c.name,
        email: c.email,
        role: c.role,
        isPrimary: c.isPrimary,
      },
    });
  }
  console.log("  ✓ Client contacts (6)");

  // ── 3. Client Activities ─────────────────────────────────────────────────
  const clientActivities = [
    { clientId: CLIENT1_ID, type: "CLIENT_CREATED", message: "TechStart Ltd onboarded as a Growth-tier client." },
    { clientId: CLIENT1_ID, type: "STATUS_CHANGED", message: "Contract renewed for another 12 months." },
    { clientId: CLIENT2_ID, type: "CLIENT_CREATED", message: "GrowthCo Agency onboarded as a Starter-tier client." },
    { clientId: CLIENT2_ID, type: "NOTE_ADDED", message: "Retainer scope confirmed for Q2 2026." },
    { clientId: CLIENT3_ID, type: "CLIENT_CREATED", message: "Enterprise Systems onboarded as an Enterprise-tier client." },
    { clientId: CLIENT3_ID, type: "STATUS_CHANGED", message: "Status changed to AT_RISK due to ERP migration blockers." },
  ];
  for (const [i, a] of clientActivities.entries()) {
    await prisma.clientActivity.create({ data: { clientId: a.clientId, type: a.type, message: a.message, actorRole: "ADMIN" } });
  }
  console.log("  ✓ Client activities (6)");

  // ── 4. Client Status History ─────────────────────────────────────────────
  await prisma.clientStatusHistory.create({
    data: {
      clientId: CLIENT3_ID,
      fromStatus: "ACTIVE",
      toStatus: "AT_RISK",
      reason: "ERP integration project is 3 weeks behind schedule with two CRITICAL blockers unresolved.",
      actorRole: "ADMIN",
      changedAt: daysAgo(7),
    },
  });
  console.log("  ✓ Client status history (1)");

  // ── 5. Projects ──────────────────────────────────────────────────────────
  await prisma.project.upsert({
    where: { id: PROJECT1_ID },
    update: {},
    create: {
      id: PROJECT1_ID,
      clientId: CLIENT1_ID,
      name: "Website Redesign",
      description: "Full redesign of the TechStart public site and product marketing pages.",
      status: "IN_PROGRESS",
      ownerName: "Sarah Chen",
      priority: "HIGH",
      riskLevel: "MEDIUM",
      startAt: daysAgo(60),
      dueAt: daysFromNow(30),
      budgetCents: BigInt(1250000),
      progressPercent: 65,
      slaDueAt: daysFromNow(28),
    },
  });

  await prisma.project.upsert({
    where: { id: PROJECT2_ID },
    update: {},
    create: {
      id: PROJECT2_ID,
      clientId: CLIENT1_ID,
      name: "Mobile App MVP",
      description: "React Native MVP for iOS and Android with core product features.",
      status: "PLANNING",
      ownerName: "Tom Okafor",
      priority: "MEDIUM",
      riskLevel: "LOW",
      startAt: daysFromNow(7),
      dueAt: daysFromNow(90),
      budgetCents: BigInt(3200000),
      progressPercent: 10,
    },
  });

  await prisma.project.upsert({
    where: { id: PROJECT3_ID },
    update: {},
    create: {
      id: PROJECT3_ID,
      clientId: CLIENT2_ID,
      name: "Brand Overhaul",
      description: "Complete brand refresh including logo, typography, and style guide.",
      status: "IN_PROGRESS",
      ownerName: "Tom Okafor",
      priority: "MEDIUM",
      riskLevel: "LOW",
      startAt: daysAgo(45),
      dueAt: daysFromNow(14),
      budgetCents: BigInt(480000),
      progressPercent: 80,
      slaDueAt: daysFromNow(12),
    },
  });

  await prisma.project.upsert({
    where: { id: PROJECT4_ID },
    update: {},
    create: {
      id: PROJECT4_ID,
      clientId: CLIENT2_ID,
      name: "SEO Campaign",
      description: "6-month organic SEO campaign targeting high-intent B2B keywords.",
      status: "COMPLETED",
      ownerName: "Tom Okafor",
      priority: "LOW",
      riskLevel: "LOW",
      startAt: daysAgo(180),
      dueAt: daysAgo(2),
      completedAt: daysAgo(2),
      budgetCents: BigInt(240000),
      progressPercent: 100,
    },
  });

  await prisma.project.upsert({
    where: { id: PROJECT5_ID },
    update: {},
    create: {
      id: PROJECT5_ID,
      clientId: CLIENT3_ID,
      name: "ERP Integration",
      description: "Legacy ERP system migration to cloud-based platform with custom API bridge.",
      status: "BLOCKED",
      ownerName: "Sarah Chen",
      priority: "HIGH",
      riskLevel: "HIGH",
      startAt: daysAgo(120),
      dueAt: daysFromNow(21),
      budgetCents: BigInt(8500000),
      progressPercent: 40,
      slaDueAt: daysFromNow(18),
    },
  });
  console.log("  ✓ Projects (5)");

  // ── 6. Project Milestones ────────────────────────────────────────────────
  const milestones = [
    { id: MILESTONE_IDS.m1p1, projectId: PROJECT1_ID, title: "Discovery & Audit", status: "APPROVED", dueAt: daysAgo(30) },
    { id: MILESTONE_IDS.m2p1, projectId: PROJECT1_ID, title: "Design Handoff", status: "IN_REVIEW", dueAt: daysFromNow(10) },
    { id: MILESTONE_IDS.m1p2, projectId: PROJECT2_ID, title: "MVP Specification", status: "PENDING", dueAt: daysFromNow(14) },
    { id: MILESTONE_IDS.m1p3, projectId: PROJECT3_ID, title: "Brand Style Guide", status: "APPROVED", dueAt: daysAgo(7) },
    { id: MILESTONE_IDS.m2p3, projectId: PROJECT3_ID, title: "Logo & Assets Delivery", status: "IN_REVIEW", dueAt: daysFromNow(5) },
    { id: MILESTONE_IDS.m1p5, projectId: PROJECT5_ID, title: "Data Migration Plan", status: "PENDING", dueAt: daysFromNow(30) },
    { id: MILESTONE_IDS.m2p5, projectId: PROJECT5_ID, title: "API Integration Layer", status: "PENDING", dueAt: daysFromNow(50) },
  ];
  for (const m of milestones) {
    await prisma.projectMilestone.upsert({
      where: { id: m.id },
      update: {},
      create: { id: m.id, projectId: m.projectId, title: m.title, status: m.status, dueAt: m.dueAt },
    });
  }
  console.log("  ✓ Project milestones (7)");

  // ── 7. Milestone Approvals ───────────────────────────────────────────────
  // One for each IN_REVIEW milestone
  await prisma.milestoneApproval.upsert({
    where: { milestoneId: MILESTONE_IDS.m2p1 },
    update: {},
    create: {
      id: "ea000000-0000-0000-0000-000000000001",
      milestoneId: MILESTONE_IDS.m2p1,
      projectId: PROJECT1_ID,
      clientId: CLIENT1_ID,
      status: "PENDING",
    },
  });
  await prisma.milestoneApproval.upsert({
    where: { milestoneId: MILESTONE_IDS.m2p3 },
    update: {},
    create: {
      id: "ea000000-0000-0000-0000-000000000002",
      milestoneId: MILESTONE_IDS.m2p3,
      projectId: PROJECT3_ID,
      clientId: CLIENT2_ID,
      status: "PENDING",
    },
  });
  // One already approved
  await prisma.milestoneApproval.upsert({
    where: { milestoneId: MILESTONE_IDS.m1p3 },
    update: {},
    create: {
      id: "ea000000-0000-0000-0000-000000000003",
      milestoneId: MILESTONE_IDS.m1p3,
      projectId: PROJECT3_ID,
      clientId: CLIENT2_ID,
      status: "APPROVED",
      comment: "Looks great — approved as submitted.",
      decidedAt: daysAgo(7),
    },
  });
  console.log("  ✓ Milestone approvals (3)");

  // ── 8. Project Tasks ─────────────────────────────────────────────────────
  const tasks = [
    { id: TASK_IDS.t1p1, projectId: PROJECT1_ID, title: "Wireframe home page", status: "DONE", assigneeName: "Sarah Chen", dueAt: daysAgo(20) },
    { id: TASK_IDS.t2p1, projectId: PROJECT1_ID, title: "Build responsive navigation", status: "IN_PROGRESS", assigneeName: "Tom Okafor", dueAt: daysFromNow(5) },
    { id: TASK_IDS.t3p1, projectId: PROJECT1_ID, title: "SEO meta-tag audit", status: "TODO", assigneeName: null, dueAt: daysFromNow(15) },
    { id: TASK_IDS.t1p2, projectId: PROJECT2_ID, title: "Define onboarding flow", status: "IN_PROGRESS", assigneeName: "Sarah Chen", dueAt: daysFromNow(10) },
    { id: TASK_IDS.t2p2, projectId: PROJECT2_ID, title: "Auth screen prototypes", status: "TODO", assigneeName: null, dueAt: daysFromNow(20) },
    { id: TASK_IDS.t1p3, projectId: PROJECT3_ID, title: "Finalise colour palette", status: "DONE", assigneeName: "Tom Okafor", dueAt: daysAgo(10) },
    { id: TASK_IDS.t2p3, projectId: PROJECT3_ID, title: "Deliver social media kit", status: "IN_PROGRESS", assigneeName: "Tom Okafor", dueAt: daysFromNow(7) },
    { id: TASK_IDS.t1p4, projectId: PROJECT4_ID, title: "Keyword gap analysis", status: "DONE", assigneeName: "Tom Okafor", dueAt: daysAgo(15) },
    { id: TASK_IDS.t1p5, projectId: PROJECT5_ID, title: "Assess legacy data schema", status: "BLOCKED", assigneeName: "Sarah Chen", dueAt: daysFromNow(3) },
    { id: TASK_IDS.t2p5, projectId: PROJECT5_ID, title: "Configure cloud environment", status: "TODO", assigneeName: null, dueAt: daysFromNow(14) },
  ];
  for (const t of tasks) {
    await prisma.projectTask.upsert({
      where: { id: t.id },
      update: {},
      create: { id: t.id, projectId: t.projectId, title: t.title, status: t.status, assigneeName: t.assigneeName, dueAt: t.dueAt },
    });
  }
  console.log("  ✓ Project tasks (10)");

  // ── 9. Project Task Collaborators ────────────────────────────────────────
  const collabs = [
    { id: "fc000001-0000-0000-0000-000000000001", projectId: PROJECT1_ID, taskId: TASK_IDS.t2p1, clientId: CLIENT1_ID, staffName: "Tom Okafor", role: "LEAD", allocationPercent: 80 },
    { id: "fc000001-0000-0000-0000-000000000002", projectId: PROJECT1_ID, taskId: TASK_IDS.t2p1, clientId: CLIENT1_ID, staffName: "Sarah Chen", role: "REVIEWER", allocationPercent: 20 },
    { id: "fc000001-0000-0000-0000-000000000003", projectId: PROJECT3_ID, taskId: TASK_IDS.t2p3, clientId: CLIENT2_ID, staffName: "Tom Okafor", role: "LEAD", allocationPercent: 100 },
    { id: "fc000001-0000-0000-0000-000000000004", projectId: PROJECT5_ID, taskId: TASK_IDS.t1p5, clientId: CLIENT3_ID, staffName: "Sarah Chen", role: "LEAD", allocationPercent: 60 },
    { id: "fc000001-0000-0000-0000-000000000005", projectId: PROJECT5_ID, taskId: TASK_IDS.t1p5, clientId: CLIENT3_ID, staffName: "Tom Okafor", role: "CONTRIBUTOR", allocationPercent: 40 },
  ];
  for (const c of collabs) {
    await prisma.projectTaskCollaborator.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }
  console.log("  ✓ Task collaborators (5)");

  // ── 10. Project Activities ───────────────────────────────────────────────
  const projectActivities = [
    { projectId: PROJECT1_ID, clientId: CLIENT1_ID, type: "PROJECT_CREATED", details: "Website Redesign project created." },
    { projectId: PROJECT1_ID, clientId: CLIENT1_ID, type: "MILESTONE_COMPLETED", details: "Discovery & Audit milestone approved by client." },
    { projectId: PROJECT2_ID, clientId: CLIENT1_ID, type: "PROJECT_CREATED", details: "Mobile App MVP project created." },
    { projectId: PROJECT2_ID, clientId: CLIENT1_ID, type: "STATUS_CHANGED", details: "Project status set to PLANNING." },
    { projectId: PROJECT3_ID, clientId: CLIENT2_ID, type: "PROJECT_CREATED", details: "Brand Overhaul project created." },
    { projectId: PROJECT3_ID, clientId: CLIENT2_ID, type: "MILESTONE_COMPLETED", details: "Brand Style Guide milestone approved." },
    { projectId: PROJECT4_ID, clientId: CLIENT2_ID, type: "PROJECT_CREATED", details: "SEO Campaign project created." },
    { projectId: PROJECT4_ID, clientId: CLIENT2_ID, type: "PROJECT_COMPLETED", details: "SEO Campaign completed successfully." },
    { projectId: PROJECT5_ID, clientId: CLIENT3_ID, type: "PROJECT_CREATED", details: "ERP Integration project created." },
    { projectId: PROJECT5_ID, clientId: CLIENT3_ID, type: "BLOCKER_ADDED", details: "CRITICAL blocker added: Vendor API credentials unavailable." },
  ];
  for (const a of projectActivities) {
    await prisma.projectActivity.create({ data: a });
  }
  console.log("  ✓ Project activities (10)");

  // ── 11. Project Blockers ─────────────────────────────────────────────────
  await prisma.projectBlocker.create({
    data: {
      id: "g1000000-0000-0000-0000-000000000001",
      projectId: PROJECT5_ID,
      clientId: CLIENT3_ID,
      title: "Vendor API credentials unavailable",
      description: "Legacy ERP vendor has not provided API keys. Integration cannot proceed.",
      severity: "CRITICAL",
      status: "OPEN",
      ownerName: "Sarah Chen",
      ownerRole: "STAFF",
      etaAt: daysFromNow(5),
    },
  });
  await prisma.projectBlocker.create({
    data: {
      id: "g1000000-0000-0000-0000-000000000002",
      projectId: PROJECT5_ID,
      clientId: CLIENT3_ID,
      title: "Cloud environment provisioning delayed",
      description: "AWS account provisioning request pending client sign-off.",
      severity: "HIGH",
      status: "IN_PROGRESS",
      ownerName: "Tom Okafor",
      ownerRole: "STAFF",
      etaAt: daysFromNow(3),
    },
  });
  await prisma.projectBlocker.create({
    data: {
      id: "g1000000-0000-0000-0000-000000000003",
      projectId: PROJECT1_ID,
      clientId: CLIENT1_ID,
      title: "Brand asset approval pending",
      description: "Client has not approved updated logo variants. Blocking design handoff.",
      severity: "MEDIUM",
      status: "OPEN",
      ownerName: "Tom Okafor",
      ownerRole: "STAFF",
      etaAt: daysFromNow(7),
    },
  });
  console.log("  ✓ Project blockers (3)");

  // ── 12. Project Change Requests ──────────────────────────────────────────
  await prisma.projectChangeRequest.create({
    data: {
      id: "h1000000-0000-0000-0000-000000000001",
      projectId: PROJECT3_ID,
      clientId: CLIENT2_ID,
      title: "Add brand motion guidelines",
      description: "Client requests animated logo guidelines and motion principles doc.",
      reason: "Social media campaigns require motion assets.",
      status: "SUBMITTED",
      requestedByRole: "CLIENT",
      requestedByName: "Bob Nduka",
    },
  });
  await prisma.projectChangeRequest.create({
    data: {
      id: "h1000000-0000-0000-0000-000000000002",
      projectId: PROJECT5_ID,
      clientId: CLIENT3_ID,
      title: "Add legacy data archival module",
      description: "Scope expanded to include a data archival pipeline for decommissioned records.",
      reason: "Regulatory compliance requires 7-year retention of legacy records.",
      status: "APPROVED",
      requestedByRole: "CLIENT",
      requestedByName: "Carol Zhang",
      estimatedHours: 40,
      estimatedCostCents: BigInt(640000),
      staffAssessment: "Feasible within current sprint. Adds ~40h to scope.",
      estimatedAt: daysAgo(5),
      estimatedByRole: "STAFF",
      estimatedByName: "Sarah Chen",
      adminDecisionNote: "Approved — cost increase accepted by client.",
      adminDecidedAt: daysAgo(3),
      adminDecidedByRole: "ADMIN",
      adminDecidedByName: "Admin",
      clientDecisionNote: "Confirmed, proceed.",
      clientDecidedAt: daysAgo(2),
      clientDecidedByRole: "CLIENT",
      clientDecidedByName: "Carol Zhang",
    },
  });
  console.log("  ✓ Change requests (2)");

  // ── 13. Project Time Entries ─────────────────────────────────────────────
  const timeEntries = [
    { projectId: PROJECT1_ID, clientId: CLIENT1_ID, staffName: "Sarah Chen", taskLabel: "Wireframing and UX review", minutes: 240, startedAt: daysAgo(5) },
    { projectId: PROJECT1_ID, clientId: CLIENT1_ID, staffName: "Tom Okafor", taskLabel: "Responsive layout development", minutes: 180, startedAt: daysAgo(3) },
    { projectId: PROJECT1_ID, clientId: CLIENT1_ID, staffName: "Sarah Chen", taskLabel: "Client feedback incorporation", minutes: 90, startedAt: daysAgo(1) },
    { projectId: PROJECT3_ID, clientId: CLIENT2_ID, staffName: "Tom Okafor", taskLabel: "Logo concept exploration", minutes: 300, startedAt: daysAgo(10) },
    { projectId: PROJECT3_ID, clientId: CLIENT2_ID, staffName: "Tom Okafor", taskLabel: "Style guide document", minutes: 210, startedAt: daysAgo(4) },
  ];
  for (const te of timeEntries) {
    await prisma.projectTimeEntry.create({ data: te });
  }
  console.log("  ✓ Time entries (5)");

  // ── 14. Project Work Session ─────────────────────────────────────────────
  await prisma.projectWorkSession.create({
    data: {
      id: "ws000000-0000-0000-0000-000000000001",
      projectId: PROJECT1_ID,
      clientId: CLIENT1_ID,
      taskId: TASK_IDS.t2p1,
      memberName: "Sarah Chen",
      memberRole: "STAFF",
      workstream: "Frontend development",
      status: "ACTIVE",
      startedAt: new Date(now.getTime() - 45 * 60 * 1000), // started 45 min ago
    },
  });
  console.log("  ✓ Work session (1 active)");

  // ── 15. Project Collaboration Notes ─────────────────────────────────────
  const collabNotes = [
    { projectId: PROJECT1_ID, clientId: CLIENT1_ID, authorRole: "STAFF", authorName: "Sarah Chen", visibility: "INTERNAL", workstream: "Design", message: "Client approved wireframes. Proceeding to high-fidelity mockups." },
    { projectId: PROJECT3_ID, clientId: CLIENT2_ID, authorRole: "STAFF", authorName: "Tom Okafor", visibility: "EXTERNAL", workstream: "Brand", message: "Logo shortlist ready for review. Please confirm preferred direction by Friday." },
    { projectId: PROJECT5_ID, clientId: CLIENT3_ID, authorRole: "STAFF", authorName: "Sarah Chen", visibility: "INTERNAL", workstream: "Integration", message: "Vendor credentials still outstanding. Escalated to Carol Zhang — awaiting executive sign-off." },
  ];
  for (const n of collabNotes) {
    await prisma.projectCollaborationNote.create({ data: n });
  }
  console.log("  ✓ Collaboration notes (3)");

  // ── 16. Conversation Notes & Escalations (for project5) ─────────────────
  const CONV5_ID = "a1000000-0000-0000-0000-000000000004"; // matches chat seed
  await prisma.conversationNote.create({
    data: {
      conversationId: CONV5_ID,
      authorRole: "STAFF",
      content: "Client is frustrated with vendor delays. Handle with empathy. Loop in admin before responding.",
    },
  });
  await prisma.conversationEscalation.create({
    data: {
      conversationId: CONV5_ID,
      severity: "HIGH",
      status: "OPEN",
      reason: "Client has raised delivery concerns three times in the past week. Risk of churn.",
      ownerAdminId: "a0000000-0000-0000-0000-000000000001",
    },
  });
  console.log("  ✓ Conversation note + escalation (1 each)");

  // ── 17. Leads ────────────────────────────────────────────────────────────
  const leads = [
    {
      id: LEAD_IDS.l1,
      clientId: CLIENT1_ID,
      title: "Inbound — E-commerce Platform Inquiry",
      source: "WEBSITE",
      status: "NEW",
      contactName: "Marcus Lee",
      contactEmail: "marcus@shopgrow.io",
      company: "ShopGrow",
      notes: "Submitted inquiry form for a custom e-commerce build.",
    },
    {
      id: LEAD_IDS.l2,
      clientId: CLIENT1_ID,
      title: "Referral — Mobile Banking App",
      source: "REFERRAL",
      status: "QUALIFIED",
      contactName: "Nina Osei",
      contactEmail: "nina@finedge.io",
      company: "FinEdge",
      ownerName: "Sarah Chen",
      nextFollowUpAt: daysFromNow(3),
      notes: "Strong fit. Referred by Alice Morgan. Needs custom fintech UI.",
    },
    {
      id: LEAD_IDS.l3,
      clientId: CLIENT2_ID,
      title: "Outbound — Brand Identity Package",
      source: "OUTBOUND",
      status: "PROPOSAL",
      contactName: "Kwame Asante",
      contactEmail: "kwame@mktcore.io",
      contactPhone: "+44 7700 900123",
      company: "MktCore Ltd",
      ownerName: "Tom Okafor",
      nextFollowUpAt: daysFromNow(7),
      notes: "Proposal sent last week. Follow up on pricing.",
    },
    {
      id: LEAD_IDS.l4,
      clientId: CLIENT1_ID,
      title: "Partnership — Data Dashboard",
      source: "PARTNERSHIP",
      status: "WON",
      contactName: "Yuki Tanaka",
      contactEmail: "yuki@datasync.io",
      company: "DataSync",
      ownerName: "Sarah Chen",
      notes: "Converted to client. See TechStart project portfolio.",
    },
    {
      id: LEAD_IDS.l5,
      clientId: CLIENT2_ID,
      title: "Inbound — Website Refresh",
      source: "WEBSITE",
      status: "LOST",
      contactName: "Fatima Al-Rashid",
      contactEmail: "fatima@quicksites.io",
      company: "QuickSites",
      lostReason: "Chose a lower-cost competitor. Budget was primary constraint.",
      notes: "Price-sensitive. Worth revisiting in 6 months.",
    },
  ];
  for (const l of leads) {
    await prisma.lead.upsert({
      where: { id: l.id },
      update: {},
      create: l,
    });
  }
  console.log("  ✓ Leads (5)");

  // ── 18. Lead Activities ──────────────────────────────────────────────────
  const leadActivities = [
    { leadId: LEAD_IDS.l1, clientId: CLIENT1_ID, type: "LEAD_CREATED", details: "New inbound lead from website form." },
    { leadId: LEAD_IDS.l2, clientId: CLIENT1_ID, type: "LEAD_CREATED", details: "Referral received from Alice Morgan." },
    { leadId: LEAD_IDS.l2, clientId: CLIENT1_ID, type: "STATUS_CHANGED", details: "Advanced to QUALIFIED after discovery call." },
    { leadId: LEAD_IDS.l3, clientId: CLIENT2_ID, type: "LEAD_CREATED", details: "Outbound prospect identified." },
    { leadId: LEAD_IDS.l3, clientId: CLIENT2_ID, type: "STATUS_CHANGED", details: "Proposal sent — total value £18,000." },
    { leadId: LEAD_IDS.l4, clientId: CLIENT1_ID, type: "STATUS_CHANGED", details: "Lead converted to client project." },
    { leadId: LEAD_IDS.l5, clientId: CLIENT2_ID, type: "STATUS_CHANGED", details: "Marked LOST — budget mismatch." },
  ];
  for (const la of leadActivities) {
    await prisma.leadActivity.create({ data: la });
  }
  console.log("  ✓ Lead activities (7)");

  // ── 19. User Preferences ─────────────────────────────────────────────────
  const STAFF_SARAH_ID = "a0000000-0000-0000-0000-000000000002";
  const STAFF_TOM_ID   = "a0000000-0000-0000-0000-000000000003";
  const prefs = [
    { userId: STAFF_SARAH_ID, key: "kanbanView", value: "board" },
    { userId: STAFF_SARAH_ID, key: "notificationSound", value: "enabled" },
    { userId: STAFF_TOM_ID,   key: "kanbanView", value: "list" },
    { userId: STAFF_TOM_ID,   key: "notificationSound", value: "disabled" },
  ];
  for (const p of prefs) {
    await prisma.userPreference.upsert({
      where: { userId_key: { userId: p.userId, key: p.key } },
      update: {},
      create: p,
    });
  }
  console.log("  ✓ User preferences (4)");

  console.log("\n✅ Core seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
