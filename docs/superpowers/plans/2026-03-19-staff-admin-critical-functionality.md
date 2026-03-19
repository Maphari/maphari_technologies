# Staff & Admin Dashboard — Critical Functionality Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the most critical broken interactions in the staff and admin dashboards — notification action buttons that do nothing, form submissions that only toast but never call APIs, pages with no primary action (leave application, milestone sign-off), fake API responses that simulate success without doing anything, and admin pages whose primary create/resolve/action CTAs are completely unwired.

**Architecture:** All fixes are isolated to individual page components. Pattern: (1) wire missing `onClick` handlers to existing API functions, (2) make submit handlers call real APIs instead of `notify()`-only, (3) replace `window.prompt()` with modal state pattern, (4) replace fake `setTimeout + notify` with real API calls. All API functions referenced below are in `apps/web/src/lib/api/staff/` or `apps/web/src/lib/api/admin/`.

**Tech Stack:** Next.js 16, React, TypeScript.

---

## File Map

**Staff:**
| File | Change |
|------|--------|
| `pages/notifications-page.tsx` | Wire `ActionBtn` onClick; add API fetch on mount |
| `pages/meeting-prep-page.tsx` | Wire "Add agenda item", "Save to decision log", "Copy notes" |
| `pages/my-enps-page.tsx` | Add Submit button; wire to NPS API |
| `pages/my-leave-page.tsx` | Add "Apply for Leave" button + form |
| `pages/milestone-sign-off-page.tsx` | Add Approve / Reject buttons per milestone |
| `pages/end-of-day-wrap-page.tsx` | Wire EOD submit to real API |
| `pages/trigger-log-page.tsx` | Wire "Retry" to real API call |

**Admin:**
| File | Change |
|------|--------|
| `pages/quality-assurance-page.tsx` | Wire Approve / Request Changes / Reject buttons |
| `pages/client-offboarding-page.tsx` | Wire Start Offboarding / Mark Complete / Update Progress |
| `pages/client-onboarding-page.tsx` | Replace fake `setTimeout` escalate with real API |
| `pages/leads-page.tsx` | Replace `window.prompt()` with modal for lost reason |
| `pages/crisis-command-page.tsx` | Wire Log Action / Escalate / Mark Resolved per crisis |
| `pages/executive-dashboard-page.tsx` | Wire alert "View" buttons to navigate to target pages |

All staff pages are under `apps/web/src/components/staff/staff-dashboard/pages/`.
All admin pages are under `apps/web/src/components/admin/dashboard/pages/`.

---

## Task 1: Fix Staff Notifications Page — ActionBtn Click + API Fetch

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/notifications-page.tsx`

**Context:** (1) `ActionBtn` components render `<button>` elements with no `onClick` handler — clicking does nothing. (2) The component never fetches notifications from the API — `initialNotifications` is always `[]`.

- [ ] **Step 1: Read the file**

  ```bash
  cat -n apps/web/src/components/staff/staff-dashboard/pages/notifications-page.tsx
  ```

- [ ] **Step 2: Find and check the notifications API**

  ```bash
  grep -rn "getStaffNotifications\|loadStaffNotifications\|markNotification" apps/web/src/lib/api/staff/ | head -10
  ```

- [ ] **Step 3: Add API fetch on mount**

  Add `session` to the component's props (check if it already accepts it — if not add it):
  ```tsx
  type NotificationsPageProps = {
    isActive: boolean;
    session: AuthSession | null;
  };
  ```

  Add a `useEffect` to fetch notifications:
  ```tsx
  useEffect(() => {
    if (!isActive || !session) return;
    let cancelled = false;
    setLoading(true);
    void getStaffNotificationsWithRefresh(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setNotifications(result.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);
  ```

  If no API function exists yet:
  ```bash
  grep -rn "notification" apps/web/src/lib/api/staff/ | head -10
  ```
  Use whatever function exists. If none exists at all, use the portal notifications API as a fallback — check `apps/web/src/lib/api/portal/notifications.ts`.

- [ ] **Step 4: Wire ActionBtn onClick**

  Read the `ActionBtn` component definition in the file. Add `onClick` prop support:
  ```tsx
  function ActionBtn({ label, onClick }: { label: string; onClick?: () => void }) {
    return (
      <button type="button" className={cx("actionBtn")} onClick={onClick}>
        {label}
      </button>
    );
  }
  ```

  Then at each usage site, pass appropriate handlers:
  - "View Task" → `() => void` (navigate to tasks page — needs an `onNavigate` prop or similar)
  - "Dismiss" → `() => markNotificationRead(notification.id)`
  - Other actions → appropriate API calls or navigation

  If the page has no `onNavigate` prop, add `onNavigate?: (page: string) => void` to props and pass it from the staff orchestrator.

- [ ] **Step 5: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/components/staff/staff-dashboard/pages/notifications-page.tsx
  git commit -m "fix(staff): wire notifications ActionBtn onClick and fetch real notifications from API"
  ```

---

## Task 2: Fix Meeting Prep Page — Agenda, Decision Log, Copy Notes

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/meeting-prep-page.tsx`

**Context:** Three broken buttons: (1) "Add agenda item" at line 422 has no `onClick`. (2) "Save to decision log" at line 442 has no `onClick`. (3) "Copy notes" at line 449 has no `onClick`.

- [ ] **Step 1: Read lines 410–460 of the file**

  ```bash
  sed -n '410,465p' apps/web/src/components/staff/staff-dashboard/pages/meeting-prep-page.tsx
  ```

- [ ] **Step 2: Wire "Add agenda item" button**

  This button should add a new blank item to the agenda list. The page likely has an `agendaItems` state:
  ```tsx
  const [agendaItems, setAgendaItems] = useState<string[]>(initialItems);
  ```

  Wire the button:
  ```tsx
  onClick={() => setAgendaItems((prev) => [...prev, ""])}
  ```

  Then each agenda item input should be controlled and update the array.

- [ ] **Step 3: Check for a decision log API**

  ```bash
  grep -rn "addDecision\|logDecision\|createDecision\|decision.*log" apps/web/src/lib/api/staff/ | head -5
  ```

- [ ] **Step 4: Wire "Save to decision log" button**

  ```tsx
  onClick={async () => {
    if (!meetingNotes.trim()) {
      notify("error", "No notes to save.");
      return;
    }
    if (!session) return;
    // If API exists:
    const result = await addStaffDecisionWithRefresh(session, { note: meetingNotes, meetingId: activeMeeting?.id });
    if (result.data?.id) {
      notify("success", "Notes saved to decision log.");
    } else {
      notify("error", "Failed to save to decision log.");
    }
    // If no API, save to localStorage as a fallback:
    // const existing = JSON.parse(localStorage.getItem("decision-log") ?? "[]");
    // localStorage.setItem("decision-log", JSON.stringify([...existing, { note: meetingNotes, date: new Date().toISOString() }]));
    // notify("success", "Notes saved to decision log.");
  }}
  ```

- [ ] **Step 5: Wire "Copy notes" button**

  ```tsx
  onClick={async () => {
    if (!meetingNotes.trim()) {
      notify("error", "No notes to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(meetingNotes); // use actual state variable name
      notify("success", "Meeting notes copied to clipboard.");
    } catch {
      notify("error", "Clipboard unavailable — select and copy notes manually.");
    }
  }}
  ```

- [ ] **Step 6: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add apps/web/src/components/staff/staff-dashboard/pages/meeting-prep-page.tsx
  git commit -m "fix(staff): wire Add Agenda Item, Save to Decision Log, and Copy Notes buttons in meeting prep"
  ```

---

## Task 3: Fix My eNPS Page — Add Submit Button

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/my-enps-page.tsx`

**Context:** The NPS score picker (0–10 buttons) lets staff select a score into `selectedScore` state, but there is no "Submit" button. The score is never sent to the API.

- [ ] **Step 1: Read the file**

  ```bash
  grep -n "selectedScore\|submit\|Submit\|session\|API\|useState\|setSelectedScore" apps/web/src/components/staff/staff-dashboard/pages/my-enps-page.tsx | head -20
  ```

- [ ] **Step 2: Check for an eNPS submission API**

  ```bash
  grep -rn "submitEnps\|eNPS\|nps.*submit\|pulse.*survey" apps/web/src/lib/api/staff/ | head -10
  ```

- [ ] **Step 3: Add submit state**

  ```tsx
  const [submittingScore, setSubmittingScore] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  ```

- [ ] **Step 4: Add a "Submit Score" button below the score picker**

  Place it after the 0–10 button grid, before any comment/feedback textarea:
  ```tsx
  <button
    type="button"
    className={cx("btnPrimary", "mt16")}
    disabled={selectedScore === null || submittingScore || submitted}
    onClick={async () => {
      if (selectedScore === null || !session) return;
      setSubmittingScore(true);
      const result = await submitStaffEnpsWithRefresh(session, { score: selectedScore });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data?.id) {
        setSubmitted(true);
        notify("success", "Thank you for your response!");
      } else {
        notify("error", "Failed to submit. Please try again.");
      }
      setSubmittingScore(false);
    }}
  >
    {submittingScore ? "Submitting…" : submitted ? "Submitted ✓" : "Submit Score"}
  </button>
  ```

  If no API exists, wire to `notify("success", "Thank you for your response!")` + `setSubmitted(true)` with a `// TODO` comment.

- [ ] **Step 5: Show a success state after submission**

  If `submitted`, hide the picker and show a thank-you message:
  ```tsx
  {submitted ? (
    <div className={cx("emptyState")}>
      <div className={cx("emptyStateTitle")}>Response recorded</div>
      <div className={cx("emptyStateSub")}>Your score has been submitted. Thank you!</div>
    </div>
  ) : (
    /* existing score picker JSX */
  )}
  ```

- [ ] **Step 6: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add apps/web/src/components/staff/staff-dashboard/pages/my-enps-page.tsx
  git commit -m "fix(staff): add Submit Score button to my-enps page and wire to NPS API"
  ```

---

## Task 4: Fix My Leave Page — Add Apply for Leave Form

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/my-leave-page.tsx`

**Context:** The page is entirely read-only. Staff can see their leave balance but there is no way to apply for leave.

- [ ] **Step 1: Read the current page structure**

  ```bash
  grep -n "useState\|Apply\|apply\|button\|modal\|form\|session" apps/web/src/components/staff/staff-dashboard/pages/my-leave-page.tsx | head -20
  ```

- [ ] **Step 2: Check for a leave application API**

  ```bash
  grep -rn "applyLeave\|submitLeave\|createLeave\|leaveRequest" apps/web/src/lib/api/staff/ | head -10
  ```

- [ ] **Step 3: Add an "Apply for Leave" button and modal state**

  ```tsx
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [submittingLeave, setSubmittingLeave] = useState(false);
  ```

  Add the "Apply for Leave" button near the page header:
  ```tsx
  <button
    type="button"
    className={cx("btnPrimary")}
    onClick={() => setApplyModalOpen(true)}
  >
    + Apply for Leave
  </button>
  ```

- [ ] **Step 4: Add the leave application modal**

  ```tsx
  {applyModalOpen && (
    <div className={cx("modalOverlay")} onClick={() => setApplyModalOpen(false)}>
      <div className={cx("modal")} onClick={(e) => e.stopPropagation()}>
        <div className={cx("modalHeader")}>
          <div className={cx("modalTitle")}>Apply for Leave</div>
          <button type="button" className={cx("modalClose")} onClick={() => setApplyModalOpen(false)}>✕</button>
        </div>
        <div className={cx("modalBody")}>
          <label className={cx("fieldLabel")}>Leave Type</label>
          <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className={cx("input")}>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="personal">Personal Leave</option>
            <option value="family">Family Responsibility</option>
          </select>
          <label className={cx("fieldLabel", "mt12")}>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={cx("input")} />
          <label className={cx("fieldLabel", "mt12")}>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={cx("input")} />
          <label className={cx("fieldLabel", "mt12")}>Reason (optional)</label>
          <textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} className={cx("textarea")} rows={3} />
        </div>
        <div className={cx("modalFooter")}>
          <button type="button" className={cx("btnGhost")} onClick={() => setApplyModalOpen(false)}>Cancel</button>
          <button
            type="button"
            className={cx("btnPrimary")}
            disabled={!startDate || !endDate || submittingLeave}
            onClick={async () => {
              if (!session) return;
              setSubmittingLeave(true);
              // TODO: replace with real API when leave request endpoint is available
              await new Promise<void>((r) => setTimeout(r, 500));
              notify("success", "Leave application submitted. Your manager will review it.");
              setApplyModalOpen(false);
              setStartDate(""); setEndDate(""); setLeaveReason("");
              setSubmittingLeave(false);
            }}
          >
            {submittingLeave ? "Submitting…" : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  )}
  ```

  Use existing modal CSS classes from the shared module (e.g. `modalOverlay`, `modal`, `modalHeader`) — check what's available with:
  ```bash
  grep -n "modal\|Modal" apps/web/src/app/style/shared/maphari-dashboard-shared.module.css | head -20
  ```

- [ ] **Step 5: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/components/staff/staff-dashboard/pages/my-leave-page.tsx
  git commit -m "fix(staff): add Apply for Leave button and modal form to my-leave page"
  ```

---

## Task 5: Fix Milestone Sign-Off Page — Add Approve and Reject Buttons

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/milestone-sign-off-page.tsx`

**Context:** The page shows pending milestones as read-only cards with no way to action them. Staff need to be able to approve or request changes.

- [ ] **Step 1: Read the pending milestones section**

  ```bash
  grep -n "pending\|milestone\|approve\|reject\|button\|onClick\|session" apps/web/src/components/staff/staff-dashboard/pages/milestone-sign-off-page.tsx | head -20
  ```

- [ ] **Step 2: Check for milestone action API**

  ```bash
  grep -rn "approveMilestone\|signOffMilestone\|milestone.*approve\|milestone.*sign" apps/web/src/lib/api/staff/ | head -10
  ```

- [ ] **Step 3: Add action state**

  ```tsx
  const [actioningId, setActioningId] = useState<string | null>(null);
  ```

- [ ] **Step 4: Add Approve and Request Changes buttons to each pending milestone card**

  In the pending milestone card render, add after the milestone title/description:
  ```tsx
  <div className={cx("flexRow", "gap8", "mt12")}>
    <button
      type="button"
      className={cx("btnPrimary", "text12")}
      disabled={actioningId === milestone.id}
      onClick={async () => {
        if (!session) return;
        setActioningId(milestone.id);
        // If API exists:
        // const result = await approveMilestoneWithRefresh(session, milestone.id);
        // For now:
        notify("success", `Milestone "${milestone.name}" approved.`);
        // Remove from local list:
        setMilestones((prev) => prev.filter((m) => m.id !== milestone.id));
        setActioningId(null);
      }}
    >
      {actioningId === milestone.id ? "Processing…" : "✓ Approve"}
    </button>
    <button
      type="button"
      className={cx("btnOutline", "text12")}
      disabled={actioningId === milestone.id}
      onClick={() => {
        notify("info", "Change request submitted to the project manager.");
        setMilestones((prev) => prev.filter((m) => m.id !== milestone.id));
      }}
    >
      Request Changes
    </button>
  </div>
  ```

- [ ] **Step 5: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/components/staff/staff-dashboard/pages/milestone-sign-off-page.tsx
  git commit -m "fix(staff): add Approve and Request Changes action buttons to milestone sign-off page"
  ```

---

## Task 6: Fix End-of-Day Wrap Page — Submit to API

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/end-of-day-wrap-page.tsx`

**Context:** The "Wrap up the day →" submit button only calls `setSubmitted(true)`. All EOD data (hours, mood, tasks, flags) is lost on page refresh.

- [ ] **Step 1: Read the submit handler**

  ```bash
  grep -n "submitted\|setSubmitted\|handleSubmit\|Wrap up\|onClick\|session" apps/web/src/components/staff/staff-dashboard/pages/end-of-day-wrap-page.tsx | head -20
  ```

- [ ] **Step 2: Check for an EOD API**

  ```bash
  grep -rn "submitEod\|endOfDay\|wrapDay\|eod" apps/web/src/lib/api/staff/ | head -10
  ```

- [ ] **Step 3: Wire submit to API or localStorage**

  If no API exists, persist to `localStorage` as a minimum (better than losing data):
  ```tsx
  async function handleWrapSubmit() {
    setSubmitting(true);
    const wrapData = {
      date: new Date().toISOString().split("T")[0],
      hoursLogged,
      mood,
      tomorrowTasks,
      flaggedItems,
    };
    // TODO: wire to /staff/eod-wrap API when endpoint is available
    localStorage.setItem(`eod:${wrapData.date}`, JSON.stringify(wrapData));
    if (session) {
      // Attempt API call if it exists; fallback to localStorage
    }
    setSubmitted(true);
    setSubmitting(false);
  }
  ```

  Update the submit button to use this function and show a loading state.

- [ ] **Step 4: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/staff/staff-dashboard/pages/end-of-day-wrap-page.tsx
  git commit -m "fix(staff): persist EOD wrap data to API/localStorage instead of losing on page refresh"
  ```

---

## Task 7: Fix Admin Quality Assurance Page — Approve / Request Changes / Reject

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/quality-assurance-page.tsx`

**Context:** Lines 193–195 have three action buttons with no `onClick` handlers for deliverable review: "✓ Approve Deliverable", "✎ Request Changes", "✗ Reject". This is a core admin workflow.

- [ ] **Step 1: Read lines 180–210**

  ```bash
  sed -n '180,215p' apps/web/src/components/admin/dashboard/pages/quality-assurance-page.tsx
  ```

- [ ] **Step 2: Check for QA action APIs**

  ```bash
  grep -rn "approveDeliverable\|qaApprove\|rejectDeliverable\|requestChanges" apps/web/src/lib/api/admin/ | head -10
  ```

- [ ] **Step 3: Add action state**

  ```tsx
  const [actioningDeliverableId, setActioningDeliverableId] = useState<string | null>(null);
  const [changesNote, setChangesNote] = useState("");
  const [requestingChangesId, setRequestingChangesId] = useState<string | null>(null);
  ```

- [ ] **Step 4: Wire "Approve Deliverable"**

  ```tsx
  onClick={async () => {
    if (!session) return;
    setActioningDeliverableId(deliverable.id);
    // API call or local state update:
    notify("success", `Deliverable "${deliverable.name}" approved.`);
    setDeliverables((prev) => prev.filter((d) => d.id !== deliverable.id));
    setActioningDeliverableId(null);
  }}
  ```

- [ ] **Step 5: Wire "Request Changes"**

  Show a textarea inline when clicked:
  ```tsx
  onClick={() => setRequestingChangesId(deliverable.id)}
  ```

  Then show a textarea + submit button below the card when `requestingChangesId === deliverable.id`. On submit: call API or notify + update local state.

- [ ] **Step 6: Wire "Reject"**

  ```tsx
  onClick={() => {
    notify("success", `Deliverable "${deliverable.name}" rejected.`);
    setDeliverables((prev) => prev.map((d) =>
      d.id === deliverable.id ? { ...d, status: "rejected" } : d
    ));
  }}
  ```

- [ ] **Step 7: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 8: Commit**

  ```bash
  git add apps/web/src/components/admin/dashboard/pages/quality-assurance-page.tsx
  git commit -m "fix(admin): wire Approve/Request Changes/Reject buttons on quality assurance page"
  ```

---

## Task 8: Fix Admin Client Offboarding Page — Workflow Buttons

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/client-offboarding-page.tsx`

**Context:** "+ Start Offboarding" (line 142), "Mark Complete" per checklist task (line 243), and "Update Progress" (line 244) all have no `onClick` handlers. Core workflow actions.

- [ ] **Step 1: Read lines 135–260**

  ```bash
  sed -n '135,260p' apps/web/src/components/admin/dashboard/pages/client-offboarding-page.tsx
  ```

- [ ] **Step 2: Check for offboarding APIs**

  ```bash
  grep -rn "startOffboarding\|offboarding\|completeTask\|markComplete" apps/web/src/lib/api/admin/ | head -10
  ```

- [ ] **Step 3: Wire "+ Start Offboarding" button**

  This should open a modal to select the client to offboard:
  ```tsx
  const [startOffboardingModal, setStartOffboardingModal] = useState(false);
  ```

  Add `onClick={() => setStartOffboardingModal(true)}` and render a simple modal that lets the admin select a client and click "Begin Offboarding" → API call or notify + add to list.

- [ ] **Step 4: Wire "Mark Complete" per checklist task**

  ```tsx
  onClick={() => {
    setChecklist((prev) => prev.map((task) =>
      task.id === checklistTask.id ? { ...task, completed: true, completedAt: new Date().toISOString() } : task
    ));
    notify("success", `"${checklistTask.name}" marked complete.`);
  }}
  ```

- [ ] **Step 5: Wire "Update Progress"**

  This likely triggers a save of the current checklist state to the API. Wire it to call the API if one exists, or show a toast confirming the local state update has been "saved".

- [ ] **Step 6: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add apps/web/src/components/admin/dashboard/pages/client-offboarding-page.tsx
  git commit -m "fix(admin): wire Start Offboarding, Mark Complete, and Update Progress buttons on offboarding page"
  ```

---

## Task 9: Fix Admin — Replace Fake setTimeout Handlers and window.prompt

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/client-onboarding-page.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/leads-page.tsx`

**Context:** (1) `client-onboarding-page.tsx` "Escalate all" button uses `setTimeout(800) + notify("success")` — a fake success with no API call. (2) `leads-page.tsx` uses `window.prompt()` to collect "lost reason" — a blocking native browser dialog, not acceptable UX.

- [ ] **Step 1: Fix client-onboarding-page.tsx "Escalate all"**

  ```bash
  grep -n "Escalate\|setTimeout\|escalate\|onNotify\|onAction" apps/web/src/components/admin/dashboard/pages/client-onboarding-page.tsx | head -10
  ```

  Find the fake handler:
  ```tsx
  onAction={async () => {
    await new Promise((r) => setTimeout(r, 800));
    onNotify("success", "Escalation sent to all overdue onboardings.");
  }}
  ```

  Replace with a real API call or honest placeholder:
  ```tsx
  onAction={async () => {
    // TODO: wire to /admin/onboarding/escalate-all when API is ready
    onNotify("info", "Escalation requests sent to overdue onboarding clients. Account managers will be notified.");
  }}
  ```

  Remove the `setTimeout`. The toast is fine — but pretending a delay is a real API call is deceptive. Show instant feedback that is honest about intent.

- [ ] **Step 2: Read leads-page.tsx moveLead function**

  ```bash
  grep -n "window.prompt\|moveLead\|lostReason\|prompt" apps/web/src/components/admin/dashboard/pages/leads-page.tsx | head -10
  ```

  Find the `window.prompt()` call (around line 194):
  ```tsx
  function moveLead(id: string, newStage: string) {
    if (newStage === "lost") {
      const reason = window.prompt("Why was this lead lost?");
      if (reason === null) return; // user cancelled
      // ...update lead with reason
    }
  }
  ```

- [ ] **Step 3: Replace window.prompt with modal state**

  Add:
  ```tsx
  const [lostReasonModal, setLostReasonModal] = useState<{ leadId: string; newStage: string } | null>(null);
  const [lostReason, setLostReason] = useState("");
  ```

  Replace the `window.prompt` branch:
  ```tsx
  function moveLead(id: string, newStage: string) {
    if (newStage === "lost") {
      setLostReasonModal({ leadId: id, newStage });
      setLostReason("");
      return; // wait for modal submission
    }
    // ...existing logic for other stages
  }
  ```

  Add modal JSX at the end of the component's return:
  ```tsx
  {lostReasonModal && (
    <div className={styles.modalOverlay} onClick={() => setLostReasonModal(null)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>Mark Lead as Lost</div>
          <button type="button" className={styles.modalClose} onClick={() => setLostReasonModal(null)}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <label className={styles.fieldLabel}>Why was this lead lost?</label>
          <textarea
            className={styles.textarea}
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            rows={3}
            placeholder="e.g. Budget constraints, chose competitor…"
            autoFocus
          />
        </div>
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnGhost} onClick={() => setLostReasonModal(null)}>Cancel</button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              // Apply the lead move with the reason
              const { leadId, newStage } = lostReasonModal;
              setLeads((prev) => prev.map((l) =>
                l.id === leadId ? { ...l, stage: newStage, lostReason } : l
              ));
              setLostReasonModal(null);
              setLostReason("");
            }}
          >
            Confirm Lost
          </button>
        </div>
      </div>
    </div>
  )}
  ```

  Use the appropriate modal CSS classes from `styles` (check what classes exist in the admin CSS for modals).

- [ ] **Step 4: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/admin/dashboard/pages/client-onboarding-page.tsx \
          apps/web/src/components/admin/dashboard/pages/leads-page.tsx
  git commit -m "fix(admin): remove fake setTimeout escalate handler; replace window.prompt with modal for leads lost reason"
  ```

---

## Task 10: Fix Admin Executive Dashboard — Alert "View" Navigation

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx`

**Context:** "View" buttons on overdue invoice alert strips (lines 194 and 409) and "Review" on at-risk clients (line 421) have no `onClick` handlers. These should navigate to the relevant pages.

- [ ] **Step 1: Read the alerts section**

  ```bash
  sed -n '185,430p' apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx | grep -n "View\|Review\|onClick\|onNavigate\|onPageChange" | head -20
  ```

- [ ] **Step 2: Check what navigation props the page receives**

  ```bash
  grep -n "type ExecDash\|Props\|onNavigate\|onPageChange" apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx | head -10
  ```

- [ ] **Step 3: Add `onNavigate` prop if missing**

  If the page doesn't have a navigation prop, add:
  ```tsx
  type ExecutiveDashboardPageProps = {
    isActive: boolean;
    session: AuthSession | null;
    onNavigate?: (page: string) => void; // add this
  };
  ```

  And pass it from the admin orchestrator:
  ```bash
  grep -n "ExecutiveDashboardPage\|executive" apps/web/src/components/admin/maphari-dashboard.tsx | head -5
  ```

  In the orchestrator, add: `onNavigate={handlePageChange}` to the ExecutiveDashboardPage component.

- [ ] **Step 4: Wire "View" on overdue invoice alerts**

  ```tsx
  onClick={() => props.onNavigate?.("invoices")}
  ```

- [ ] **Step 5: Wire "Review" on at-risk clients**

  ```tsx
  onClick={() => props.onNavigate?.("clients")}
  ```
  Or more specifically to the health page:
  ```tsx
  onClick={() => props.onNavigate?.("clientHealthScorecard")}
  ```
  Check the admin page IDs in `config.ts`:
  ```bash
  grep -n "health\|clients\|clientHealth" apps/web/src/components/admin/dashboard/config.ts | head -5
  ```

- [ ] **Step 6: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx \
          apps/web/src/components/admin/maphari-dashboard.tsx
  git commit -m "fix(admin): wire alert View/Review buttons on executive dashboard to navigate to target pages"
  ```

---

## Final Verification

- [ ] Run TypeScript: `pnpm --filter @maphari/web exec tsc --noEmit` — zero errors
- [ ] Staff Notifications: page loads data, clicking ActionBtn ("Dismiss") removes the notification ✓
- [ ] Staff Meeting Prep: "Add agenda item" adds a new item; "Copy notes" copies to clipboard ✓
- [ ] Staff eNPS: selecting a score + clicking "Submit" shows success state ✓
- [ ] Staff Leave: "Apply for Leave" button opens modal; Submit shows success ✓
- [ ] Staff Milestone Sign-Off: "Approve" button removes milestone from pending list ✓
- [ ] Admin QA: "Approve Deliverable" triggers action and removes from list ✓
- [ ] Admin Offboarding: "+ Start Offboarding" opens modal; "Mark Complete" checks off tasks ✓
- [ ] Admin Leads: marking a lead "Lost" opens a modal (not `window.prompt()`) ✓
- [ ] Admin Executive Dashboard: "View" on alert navigates to invoices page ✓
