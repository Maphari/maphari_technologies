# Admin Portal Phased Roadmap

This document stitches together the missing admin/portal functionality, organizes it into buildable phases, and highlights the bridge ideas that keep staff partnering closely with clients.

## Phase 1 · Onboarding & Client Experience Bridge (current work)
- **Goal:** Give staff a single view of every client’s journey stage (Discovery → Planning → Delivery → Billing → Retention) and a lightweight “portal bridge” composer so those insights can be shared with clients in seconds.
- **Deliverables**
  - New `Client Experience` nav entry in the admin shell with KPI tiles, a journey table, and stage-level descriptions + next actions.
  - Portal bridge composer that queues a notification job (`createNotificationJobWithRefresh`) so every update flows through the gateway to the portal/email surface; the new `ExperiencePage` handles this signal.
  - Stage-aware templates and preview so staff understand what each client is hearing before publishing.
- **Bridge idea:** Each stage card auto-populates an update and lets staff queue it directly to the `notifications/jobs` workflow; the portal (or staff email) can consume the same notification stream so clients see consistent messaging.

## Phase 2 · Support & SLA Workbench
- **Status:** Delivered 2026-02-19 with the new admin Experience page.
- **Goal:** Build a service-issue queue in the admin shell that records escalations, SLAs, owners, and outcomes while surfacing those stats to clients (e.g., portal tickets + SLA banners).
- **Deliverables**
  - Dedicated “Support Queue” grid tied to clients/projects, with SLA countdowns and ownership.
  - Automation that surfaces SLA breaches as portal notifications and adds portal-ready updates using the notification job stream.
  - Templates that couple internal incident notes with pre-approved portal copy for client transparency.
- **Bridge idea:** Link each ticket to a notification job, so the portal queue feed and digest emails reuse the same notice content staff see internally.

## Phase 3 · Client Win/Loss Intelligence & Feedback Loop
- **Status:** Delivered 2026-02-19 alongside Phase 2 with the expanded Experience view.
- **Goal:** Surface momentum (nods, wins, value reports) plus client voice back into the admin shell so internal teams can track health signals and trigger next-phase actions.
- **Deliverables**
  - Feedback capture UI within `/admin` that feeds the Client Experience view and queues portal-friendly notification jobs.
  - Automated updates (via notification metadata) that inform the portal about renewals, retrospectives, and customer sentiment.
  - Summary dashboards showing risk/renewal stats and shareable portal-ready summaries derived from aggregated feedback.
- **Bridge idea:** Publish value reports and feedback notes through the same notification pipeline so the portal surface mirrors the admin context without duplicated messaging.

## Bridge Ideas (summary)
- **Notification-First updates:** Anything staff sees (stage change, SLA breach, milestone update) is also queued as a notification job so the portal or email surface can render it, ensuring staff-to-client comms stay in sync.
- **Template library per stage:** Stage metadata includes the next action and templated text; the `ExperiencePage` preview shows staff what the portal will read before they hit publish.
- **Shared portal preview:** Keep a lightweight “Portal Preview” inside the admin surface so staff confirm the wording before the notifications flow through to clients.
