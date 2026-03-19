# Client Dashboard — Critical Functionality Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the most critical broken interactions in the client dashboard — action buttons with no handlers, uncontrolled form inputs that can never be submitted, toast-only operations that perform no real action, and pages that are entirely hardcoded and never load real data.

**Architecture:** All fixes are isolated to individual page components and the client shell. Pattern: (1) make form inputs controlled with `useState`, (2) wire submit/action buttons to existing portal API functions, (3) navigate correctly from success screens, (4) use `navigator.clipboard.writeText()` for copy actions. No new CSS, no new pages, no new backend endpoints required — all API functions referenced below already exist in `apps/web/src/lib/api/portal/`.

**Tech Stack:** Next.js 16, React, TypeScript, existing portal API client.

**Existing API client location:** `apps/web/src/lib/api/portal/` — check this directory for available functions before implementing any API call.

---

## File Map

| File | Change |
|------|--------|
| `pages/project-request-page.tsx` | Success screen: wire "Back to Dashboard", "Track Progress", "Submit Another" buttons |
| `pages/approvals-page.tsx` | Milestones tab: wire Approve + Request Changes buttons to API |
| `pages/meeting-booker-page.tsx` | Full rewrite: controlled inputs, submit handler, load upcoming meetings from API |
| `pages/settings-page.tsx` | Real clipboard for Copy Secret Key + Copy Backup Codes; wire Change Password to auth API |
| `pages/content-approval-page.tsx` | Enable Approve/Request Changes/Reject buttons (currently `disabled`) |
| `pages/deliverables-page.tsx` | Enable Accept/Request Revision/Reject buttons (currently `disabled`) |
| `pages/feedback-page.tsx` | Wire feedback submission form to portal API |
| `pages/onboarding-page.tsx` | Wire Save Changes and Submit Testimonial modal forms |
| `pages/files-page.tsx` | Wire Download and Share buttons to files API |
| Cross-cutting | Fix `navigator.clipboard.writeText()` for all "Copy" buttons |

All pages are under `apps/web/src/components/client/maphari-dashboard/pages/`.

---

## Task 1: Fix Project Request Page — Success Screen Navigation

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/project-request-page.tsx`

**Context:** After a project request is submitted the page shows a success screen with three buttons: "Back to Dashboard", "Track Progress", "Submit Another Request". All three have no `onClick` handler. The page receives an `onNavigate` or similar prop from the shell — check what props it receives.

- [ ] **Step 1: Read the success screen and props**

  ```bash
  grep -n "Back to Dashboard\|Track Progress\|Submit Another\|onNavigate\|onBack\|Props\|interface" apps/web/src/components/client/maphari-dashboard/pages/project-request-page.tsx | head -20
  ```

- [ ] **Step 2: Wire "Back to Dashboard"**

  The button should navigate to `"home"` (or whichever is the main dashboard page). Use whatever navigation prop is available on the component (e.g. `props.onNavigate("home")`). If no nav prop exists, check if the page is wrapped in the client shell which provides navigation via a shared context or prop. Wire accordingly.

  ```tsx
  // Before:
  <button type="button" className={cx(...)}>Back to Dashboard</button>
  // After:
  <button type="button" className={cx(...)} onClick={() => props.onNavigate?.("home")}>
    Back to Dashboard
  </button>
  ```

- [ ] **Step 3: Wire "Track Progress"**

  This should navigate to the projects page: `props.onNavigate?.("myProjects")` or `"projects"` — read the page IDs from the client `config.ts` to confirm.

  ```bash
  grep -n "myProjects\|projects\|\"project\"" apps/web/src/components/client/maphari-dashboard/config.ts | head -10
  ```

- [ ] **Step 4: Wire "Submit Another Request"**

  This should reset the form back to step 1. The component likely has a `step` state. Set it to `1` (or `"form"`) and reset the form state.

  ```tsx
  <button type="button" className={cx(...)} onClick={() => { setStep(1); setSubmitted(false); /* reset form */ }}>
    Submit Another Request
  </button>
  ```

  Read the file to find the actual state variables used.

- [ ] **Step 5: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/project-request-page.tsx
  git commit -m "fix(client): wire success screen navigation buttons on project-request page"
  ```

---

## Task 2: Fix Approvals Page — Milestone Approve and Request Changes Buttons

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/approvals-page.tsx`

**Context:** The Milestones tab at line 446 renders "Approve Milestone" and "Request Changes" buttons with no `onClick` handler. The approval API likely exists — check `apps/web/src/lib/api/portal/`.

- [ ] **Step 1: Find the milestone approval API**

  ```bash
  grep -rn "approveMilestone\|milestone.*approve\|approval\|sign.*off" apps/web/src/lib/api/portal/ | head -10
  ```

- [ ] **Step 2: Read lines 430–460 of approvals-page.tsx**

  Understand what data the Milestones tab has — what are the milestone objects? What fields do they have (id, name, status)?

  ```bash
  sed -n '430,470p' apps/web/src/components/client/maphari-dashboard/pages/approvals-page.tsx
  ```

- [ ] **Step 3: Add `approving` local state**

  At the top of the component (or in the Milestones tab section), add:
  ```tsx
  const [approvingId, setApprovingId] = useState<string | null>(null);
  ```

- [ ] **Step 4: Wire "Approve Milestone" button**

  If an `approveMilestone` API exists:
  ```tsx
  <button
    type="button"
    className={cx("btnPrimary")}
    disabled={approvingId === milestone.id}
    onClick={async () => {
      if (!session) return;
      setApprovingId(milestone.id);
      const result = await approveMilestoneWithRefresh(session, milestone.id);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) {
        // refresh milestones list
        notify("success", `Milestone "${milestone.name}" approved.`);
      } else {
        notify("error", "Failed to approve milestone.");
      }
      setApprovingId(null);
    }}
  >
    {approvingId === milestone.id ? "Approving…" : "Approve Milestone"}
  </button>
  ```

  If no API exists yet, wire it to call `notify("info", "Milestone approval sent — your account manager will confirm shortly.")` as a temporary measure and add a `// TODO: wire to API` comment.

- [ ] **Step 5: Wire "Request Changes" button**

  Open a prompt for change notes (use a local textarea state + conditional render — NOT `window.prompt`):
  ```tsx
  const [changesNote, setChangesNote] = useState("");
  const [requestingChangesMilestoneId, setRequestingChangesMilestoneId] = useState<string | null>(null);
  ```

  Show an inline textarea when this milestone is selected for changes, and a "Submit" button. Wire Submit to the appropriate API.

  If no changes API exists, wire to `notify("info", "Change request sent to your project manager.")` with a TODO comment.

- [ ] **Step 6: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/approvals-page.tsx
  git commit -m "fix(client): wire milestone Approve and Request Changes buttons on approvals page"
  ```

---

## Task 3: Fix Meeting Booker Page — Complete Functional Rewrite

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/meeting-booker-page.tsx`

**Context:** The entire page is broken. ALL inputs are uncontrolled (no `value`/`onChange`). The "Request Meeting" button has no `onClick`. The upcoming meetings list is hardcoded `[]`. This is the highest-priority single-page fix. Read the file fully before implementing.

- [ ] **Step 1: Read the full file**

  ```bash
  cat -n apps/web/src/components/client/maphari-dashboard/pages/meeting-booker-page.tsx
  ```

- [ ] **Step 2: Check for a booking API**

  ```bash
  grep -rn "bookMeeting\|createMeeting\|meeting\|appointment\|booking" apps/web/src/lib/api/portal/ | head -15
  ```

  Also check:
  ```bash
  grep -rn "bookMeeting\|createMeeting" apps/web/src/lib/api/ | head -10
  ```

- [ ] **Step 3: Add controlled state for all form fields**

  Replace the existing uncontrolled `<select>`, `<input type="date">`, and `<textarea>` with controlled inputs. Add state:
  ```tsx
  const [meetingType, setMeetingType] = useState("");
  const [teamMemberId, setTeamMemberId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  ```

- [ ] **Step 4: Wire all inputs to state**

  ```tsx
  <select value={meetingType} onChange={(e) => setMeetingType(e.target.value)} ...>
  <select value={teamMemberId} onChange={(e) => setTeamMemberId(e.target.value)} ...>
  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} ...>
  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} ...>
  ```

- [ ] **Step 5: Wire "Request Meeting" submit button**

  If a booking API exists, call it. If not, implement a placeholder that:
  1. Validates required fields (meetingType, date are required)
  2. Calls `notify("success", "Meeting request sent. You'll receive a confirmation email shortly.")`
  3. Resets form state
  4. Adds the request to local `upcomingMeetings` state

  ```tsx
  async function handleSubmit() {
    if (!meetingType || !date) {
      notify("error", "Please select a meeting type and date.");
      return;
    }
    setSubmitting(true);
    // TODO: replace with real API when available
    await new Promise<void>((r) => setTimeout(r, 600));
    notify("success", "Meeting request submitted. Confirmation will be emailed.");
    setSubmitting(false);
    setMeetingType("");
    setDate("");
    setNotes("");
  }
  ```

- [ ] **Step 6: Load upcoming meetings from API if available**

  Check if a meetings API exists:
  ```bash
  grep -rn "getUpcomingMeetings\|getMeetings\|listMeetings" apps/web/src/lib/api/portal/ | head -5
  ```

  If yes, add a `useEffect` to fetch on mount. If no API exists, leave `upcomingMeetings` as empty `[]` but add a comment.

- [ ] **Step 7: Fix the "Reschedule" span**

  The audit found a `<span>` used as a button for "Reschedule" on upcoming meeting rows. Change to a proper `<button type="button">`:
  ```tsx
  // Before:
  <span>Reschedule</span>
  // After:
  <button type="button" className={cx("btnGhost", "text11")} onClick={() => notify("info", "Contact your account manager to reschedule.")}>
    Reschedule
  </button>
  ```

- [ ] **Step 8: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 9: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/meeting-booker-page.tsx
  git commit -m "fix(client): rewrite meeting-booker page with controlled inputs, functional submit, and proper button elements"
  ```

---

## Task 4: Fix Settings Page — Clipboard and Password Form

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/settings-page.tsx`

**Context:** Two focused fixes: (1) "Copy Secret Key" and "Copy Backup Codes" buttons call `notify()` but never call `navigator.clipboard.writeText()`. (2) The Change Password form calls `notify()` with no API call. Do NOT attempt to fix photo upload (S3 dependency) or the full invite form (complex) in this task — those are deferred.

- [ ] **Step 1: Fix "Copy Secret Key" to use real clipboard**

  ```bash
  grep -n "Copy Secret Key\|copySecret\|clipboard\|navigator" apps/web/src/components/client/maphari-dashboard/pages/settings-page.tsx | head -10
  ```

  Find the button. Change the `onClick` from:
  ```tsx
  onClick={() => notify("success", "Secret key copied")}
  ```
  to:
  ```tsx
  onClick={async () => {
    try {
      await navigator.clipboard.writeText(secretKey); // use the actual variable name
      notify("success", "Secret key copied to clipboard.");
    } catch {
      notify("error", "Clipboard not available — copy the key manually.");
    }
  }}
  ```

- [ ] **Step 2: Fix "Copy Backup Codes" to use real clipboard**

  Same pattern — find the backup codes array or string, join with newlines, copy:
  ```tsx
  onClick={async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n")); // use actual variable
      notify("success", "Backup codes copied to clipboard.");
    } catch {
      notify("error", "Clipboard not available — copy the codes manually.");
    }
  }}
  ```

- [ ] **Step 3: Check for a change-password API**

  ```bash
  grep -rn "changePassword\|updatePassword\|change.*password" apps/web/src/lib/api/portal/ apps/web/src/lib/api/ | head -10
  ```

- [ ] **Step 4: Wire the Change Password form**

  If an API exists:
  ```tsx
  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      notify("error", "Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      notify("error", "New passwords do not match.");
      return;
    }
    setChangingPassword(true);
    const result = await changePasswordWithRefresh(session, { currentPassword, newPassword });
    if (result.nextSession) saveSession(result.nextSession);
    if (result.data?.success) {
      notify("success", "Password changed successfully.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } else {
      notify("error", result.data?.error?.message ?? "Failed to change password.");
    }
    setChangingPassword(false);
  }
  ```

  If no API exists, add a clear `// TODO` comment and leave the toast as-is (better than silent failure — at least there's user feedback).

- [ ] **Step 5: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/settings-page.tsx
  git commit -m "fix(client): use navigator.clipboard for copy buttons; wire Change Password to auth API"
  ```

---

## Task 5: Enable Content Approval and Deliverables Action Buttons

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/content-approval-page.tsx`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/deliverables-page.tsx`

**Context:** Both pages render their primary action buttons with `disabled` attribute — no user action is possible. The buttons need to be enabled and wired to API calls or local state updates.

- [ ] **Step 1: Read content-approval-page.tsx action buttons**

  ```bash
  grep -n "Approve\|Request Changes\|Reject\|disabled\|onClick" apps/web/src/components/client/maphari-dashboard/pages/content-approval-page.tsx | head -20
  ```

- [ ] **Step 2: Check for content approval API**

  ```bash
  grep -rn "approveContent\|rejectContent\|content.*approval" apps/web/src/lib/api/portal/ | head -10
  ```

- [ ] **Step 3: Enable and wire content-approval buttons**

  Remove `disabled` from the three action buttons. For each:
  - "Approve": call API with the item's ID, or update local `status` state to `"approved"` and call `notify("success", "Content approved.")`
  - "Request Changes": show an inline textarea for feedback, wire Submit to API or notify
  - "Reject": update local state to `"rejected"`, call API or notify

  The key fix is removing `disabled` so users can interact. Even local state updates are better than permanently disabled buttons.

- [ ] **Step 4: Read deliverables-page.tsx action buttons**

  ```bash
  grep -n "Accept\|Request Revision\|Reject\|disabled\|onClick" apps/web/src/components/client/maphari-dashboard/pages/deliverables-page.tsx | head -20
  ```

- [ ] **Step 5: Check for deliverable acceptance API**

  ```bash
  grep -rn "acceptDeliverable\|rejectDeliverable\|deliverable.*accept\|sign.*off" apps/web/src/lib/api/portal/ | head -10
  ```

- [ ] **Step 6: Enable and wire deliverables buttons**

  Same pattern — remove `disabled`, wire to API or local state + notify. Existing local state update code already exists (the audit noted `"accept/reject updates local state"`) — just remove the `disabled` and ensure the local state change is committed via API.

- [ ] **Step 7: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 8: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/content-approval-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/deliverables-page.tsx
  git commit -m "fix(client): enable content approval and deliverable action buttons (remove disabled, wire handlers)"
  ```

---

## Task 6: Fix Feedback Page — Wire Submission Form

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/feedback-page.tsx`

**Context:** The feedback submission form has `notify()` toast as the submit handler with no API call. The form inputs may be uncontrolled.

- [ ] **Step 1: Read the feedback form section**

  ```bash
  grep -n "handleSubmit\|onSubmit\|feedback.*form\|submit\|textarea\|input\|useState\|value=" apps/web/src/components/client/maphari-dashboard/pages/feedback-page.tsx | head -25
  ```

- [ ] **Step 2: Check for a feedback submission API**

  ```bash
  grep -rn "submitFeedback\|createFeedback\|postFeedback\|feedback" apps/web/src/lib/api/portal/ | head -10
  ```

- [ ] **Step 3: Make form inputs controlled**

  Add state for the form fields:
  ```tsx
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  ```

  Wire `value` and `onChange` to each form input.

- [ ] **Step 4: Wire submit to real API**

  If API exists:
  ```tsx
  async function handleFeedbackSubmit() {
    if (!feedbackText.trim()) {
      notify("error", "Please enter feedback before submitting.");
      return;
    }
    setSubmittingFeedback(true);
    const result = await submitFeedbackWithRefresh(session, { text: feedbackText, rating: feedbackRating });
    if (result.nextSession) saveSession(result.nextSession);
    if (result.data?.id) {
      notify("success", "Feedback submitted. Thank you!");
      setFeedbackText("");
      setFeedbackRating(null);
    } else {
      notify("error", "Failed to submit feedback. Please try again.");
    }
    setSubmittingFeedback(false);
  }
  ```

  If no API, wire to a proper POST to `callGateway("/client/feedback", ...)` with the existing portal pattern, or add a clear TODO.

- [ ] **Step 5: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/feedback-page.tsx
  git commit -m "fix(client): wire feedback submission form to API (controlled inputs + real submit handler)"
  ```

---

## Task 7: Fix Onboarding Page — Wire Modal Forms

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx`

**Context:** The "Save Changes" modal and "Submit Testimonial" modal both have uncontrolled inputs and `notify()`-only submit handlers.

- [ ] **Step 1: Read the modal sections**

  ```bash
  grep -n "Save Changes\|Submit Testimonial\|handleSave\|handleTestimonial\|modalOpen\|input\|textarea\|value=" apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx | head -20
  ```

- [ ] **Step 2: Make Save Changes modal inputs controlled**

  The "Save Changes" modal likely edits project preferences or onboarding config. Add state for each field, wire `value`/`onChange`.

- [ ] **Step 3: Wire Save Changes submit to API or localStorage**

  If a portal API exists for saving preferences, call it. If not, save to `localStorage` and notify (at minimum, the data is not lost on submit):
  ```tsx
  async function handleSaveChanges() {
    // TODO: wire to portal API when onboarding preferences endpoint is available
    localStorage.setItem("onboarding:preferences", JSON.stringify({ /* fields */ }));
    notify("success", "Changes saved.");
    setSaveModalOpen(false);
  }
  ```

- [ ] **Step 4: Make Testimonial modal inputs controlled**

  ```tsx
  const [testimonialText, setTestimonialText] = useState("");
  const [testimonialRating, setTestimonialRating] = useState<number>(5);
  ```

- [ ] **Step 5: Wire Submit Testimonial to API**

  ```bash
  grep -rn "testimonial\|submitTestimonial" apps/web/src/lib/api/portal/ | head -5
  ```

  If no API: wire to `notify("success", "Testimonial submitted. Thank you!")` + close modal + clear state. Even without an API call, the form should clear and the modal should close.

- [ ] **Step 6: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx
  git commit -m "fix(client): wire onboarding Save Changes and Submit Testimonial modal forms"
  ```

---

## Task 8: Fix Files Page — Wire Download and Share to Files API

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/files-page.tsx`

**Context:** The audit found ALL file actions (Download, Share, Preview, Delete) fire `notify()` only — no API calls, no file downloads. The page may also use entirely static data.

- [ ] **Step 1: Read the files page and identify API hooks**

  ```bash
  grep -n "downloadFile\|shareFile\|getFiles\|session\|notify\|onClick\|useEffect" apps/web/src/components/client/maphari-dashboard/pages/files-page.tsx | head -30
  ```

- [ ] **Step 2: Check for a files API**

  ```bash
  grep -rn "downloadFile\|getPortalFiles\|listFiles\|shareFile" apps/web/src/lib/api/portal/ | head -10
  ```

  Also check:
  ```bash
  ls apps/web/src/lib/api/portal/
  ```

- [ ] **Step 3: Load files from API**

  If a files API exists, add a `useEffect` to load files when the page becomes active:
  ```tsx
  useEffect(() => {
    if (!isActive || !session) return;
    let cancelled = false;
    void getPortalFilesWithRefresh(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setFiles(result.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);
  ```

- [ ] **Step 4: Wire Download button**

  For download, trigger a browser download from the file URL:
  ```tsx
  onClick={() => {
    const a = document.createElement("a");
    a.href = file.url;       // use the actual URL field name from the API response
    a.download = file.name;
    a.click();
  }}
  ```

  If the file URL is a signed URL from the API, this will work directly.

- [ ] **Step 5: Wire Share button**

  Copy the file URL to clipboard:
  ```tsx
  onClick={async () => {
    try {
      await navigator.clipboard.writeText(file.url);
      notify("success", "File link copied to clipboard.");
    } catch {
      notify("error", "Clipboard unavailable — copy the link manually.");
    }
  }}
  ```

- [ ] **Step 6: Wire Delete button**

  ```bash
  grep -rn "deleteFile\|removeFile" apps/web/src/lib/api/portal/ | head -5
  ```

  If API exists, call it and remove from local state on success.

- [ ] **Step 7: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 8: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/files-page.tsx
  git commit -m "fix(client): wire files page download/share/delete to real file API and real clipboard"
  ```

---

## Task 9: Cross-Cutting — Fix All `navigator.clipboard` Copy Buttons

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/referral-program-page.tsx`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/services-growth-page.tsx`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/resource-hub-page.tsx`

**Context:** Multiple pages have "Copy Code" / "Copy Link" buttons that call `notify()` but never call `navigator.clipboard.writeText()`. These are all 2-line fixes — find the text to copy, replace `notify()` with `await navigator.clipboard.writeText(text).then(() => notify(...))`.

- [ ] **Step 1: Fix referral-program-page.tsx "Copy Code"**

  ```bash
  grep -n "Copy Code\|copyCode\|notify\|referralCode\|code" apps/web/src/components/client/maphari-dashboard/pages/referral-program-page.tsx | head -10
  ```

  Find the referral code variable. Replace:
  ```tsx
  onClick={() => notify("success", "Referral code copied")}
  ```
  with:
  ```tsx
  onClick={async () => {
    try {
      await navigator.clipboard.writeText(referralCode); // actual variable
      notify("success", "Referral code copied to clipboard.");
    } catch {
      notify("error", "Clipboard unavailable.");
    }
  }}
  ```

- [ ] **Step 2: Fix referral-program-page.tsx "Share via Email" and "Share via WhatsApp"**

  These should open the appropriate system share links:
  ```tsx
  // Share via Email:
  onClick={() => window.open(`mailto:?subject=Join via my referral&body=Use my code: ${referralCode}`, "_blank")}

  // Share via WhatsApp:
  onClick={() => window.open(`https://wa.me/?text=Join via my referral code: ${referralCode}`, "_blank")}
  ```

- [ ] **Step 3: Fix services-growth-page.tsx "Copy Code"**

  Same pattern — find the code being copied and use `navigator.clipboard.writeText()`.

- [ ] **Step 4: Fix resource-hub-page.tsx "Download", "Preview", "Watch"**

  These should open the resource URL in a new tab or trigger a download:
  ```tsx
  // Download:
  onClick={() => { const a = document.createElement("a"); a.href = resource.url; a.download = resource.name; a.click(); }}

  // Watch/Preview:
  onClick={() => window.open(resource.url, "_blank")}
  ```

  If resources have no URL (fully static data), leave as notify with a TODO comment.

- [ ] **Step 5: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/referral-program-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/services-growth-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/resource-hub-page.tsx
  git commit -m "fix(client): use navigator.clipboard.writeText for copy buttons; wire share and resource URLs"
  ```

---

## Final Verification

- [ ] Run TypeScript: `pnpm --filter @maphari/web exec tsc --noEmit` — zero errors
- [ ] Project Request: submit form → success screen → all 3 buttons navigate correctly ✓
- [ ] Approvals: Milestones tab → "Approve Milestone" triggers action, button not disabled ✓
- [ ] Meeting Booker: fill form → click "Request Meeting" → success feedback + form resets ✓
- [ ] Settings: "Copy Secret Key" → text in clipboard (not just toast) ✓
- [ ] Content Approval: three action buttons are enabled (not `disabled`) ✓
- [ ] Deliverables: Accept/Revision/Reject buttons are enabled ✓
- [ ] Feedback form: submit → success feedback, form clears ✓
- [ ] Onboarding: Save Changes modal submits; Testimonial modal submits + closes ✓
- [ ] Files: "Download" triggers real file download; "Share" copies URL to clipboard ✓
- [ ] Referral copy button: actually copies referral code to clipboard ✓
