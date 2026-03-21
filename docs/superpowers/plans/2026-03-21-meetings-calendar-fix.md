# Meetings & Calendar Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire four data gaps in the client meeting pages — real past meetings list, correct Action Items stat, Add to Calendar button, and recording playback.

**Architecture:** Two targeted file modifications only. No new files, no new API endpoints, no new CSS classes. All data already exists in the backend; this plan connects UI to real data.

**Tech Stack:** React 18, TypeScript, Next.js 16 (Turbopack), CSS Modules via `cx()` helper, portal API pattern (`loadPortalXxxWithRefresh(session)` → `AuthorizedResult<T>`)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx` | Modify | Wire meetings fetch, populate past meetings, fix Action Items stat, wire Add to Calendar buttons |
| `apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx` | Modify | Add Recordings section below the tab panel using `portalMeetings.filter(m => m.hasRecording)` |

---

## Task 1: Wire `book-call-page.tsx`

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx`

### Context

Current file structure (key lines):
- **Line 14–17**: Imports from `../../../../lib/api/portal` — currently imports `loadPortalAppointmentsWithRefresh`, `createPortalAppointmentWithRefresh`, `type PortalAppointment`. Need to add `loadPortalMeetingsWithRefresh`, `type PortalMeeting`.
- **Line 107**: `const PAST_MEETINGS: {...}[] = [];` — hardcoded empty array (never removed; references in JSX at line 860 and 866 stay but now read from state)
- **Lines 154–163**: API state — add `meetings` state and `bookedAppt` state here
- **Lines 167–186**: `useEffect` that calls only `loadPortalAppointmentsWithRefresh`. Wrap in `Promise.all` with `loadPortalMeetingsWithRefresh`.
- **Lines 188–200**: `statsData` useMemo — add `pendingActionItems` derived value
- **Line 421**: `{ label: "Action Items", value: "—", color: "statCardAmber" }` — replace `"—"` with the count
- **Lines 237–248**: `handleConfirmBooking` success path — add `setBookedAppt(r.data)` after `setBookedVideoUrl`
- **Line 545–547**: Hero "Add to Calendar" button — wire `onClick`
- **Line 839–841**: Done-state "Add to Calendar" button — wire `onClick`
- **Line 860**: `{PAST_MEETINGS.length === 0 ?` — replace `PAST_MEETINGS` with sorted `meetings ?? []`
- **Line 866**: `PAST_MEETINGS.map(m =>` — same replacement. Past meeting cards render `id`, `title`, `meetingAt`, `durationMins`, `attendeeCount`, `actionItemStatus` from `PortalMeeting`

### PortalMeeting type fields (from `../../../../lib/api/portal`)

```ts
type PortalMeeting = {
  id: string;
  title: string;
  meetingAt: string;         // ISO date
  durationMins: number;
  attendeeCount: number;
  hasRecording: boolean;
  recordingFileId: string | null;
  actionItemStatus: "PENDING" | "IN_PROGRESS" | string;
  clientMoodRating: number | null;
  notes: string | null;
};
```

### Implementation Steps

- [ ] **Step 1: Add imports and state**

In the import block at the top of the file, extend the portal import to include meetings:

```ts
import {
  loadPortalAppointmentsWithRefresh,
  createPortalAppointmentWithRefresh,
  loadPortalMeetingsWithRefresh,
  type PortalAppointment,
  type PortalMeeting,
} from "../../../../lib/api/portal";
```

Inside `BookCallPage()` component, after the existing state declarations (around line 163), add:

```ts
const [meetings,    setMeetings]    = useState<PortalMeeting[] | null>(null);
const [bookedAppt,  setBookedAppt]  = useState<PortalAppointment | null>(null);
```

- [ ] **Step 2: Wrap fetch in Promise.all**

Replace the `useEffect` block (lines 167–186) with a `Promise.all` that loads both resources in parallel:

```ts
useEffect(() => {
  if (!session) { setLoading(false); return; }
  setLoading(true);
  setError(null);
  Promise.all([
    loadPortalAppointmentsWithRefresh(session),
    loadPortalMeetingsWithRefresh(session),
  ]).then(([apptRes, meetRes]) => {
    if (apptRes.nextSession) saveSession(apptRes.nextSession);
    if (meetRes.nextSession) saveSession(meetRes.nextSession);
    if (apptRes.error) { setError(apptRes.error.message ?? "Failed to load."); setLoading(false); return; }
    if (apptRes.data) {
      setAllAppts(apptRes.data);
      const now = Date.now();
      const upcoming = apptRes.data
        .filter((a) => new Date(a.scheduledAt).getTime() + a.durationMins * 60_000 > now)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 6)
        .map(mapApptToStrip);
      setUpcomingStrip(upcoming);
    }
    if (meetRes.data) {
      setMeetings(
        [...meetRes.data].sort((a, b) => new Date(b.meetingAt).getTime() - new Date(a.meetingAt).getTime())
      );
    }
    setLoading(false);
  });
}, [session]);
```

- [ ] **Step 3: Derive pendingActionItems and nextApptRaw**

Add two derived values inside `BookCallPage()` after the `statsData` useMemo:

```ts
const pendingActionItems = useMemo(
  () => meetings?.filter((m) => m.actionItemStatus === "PENDING").length ?? 0,
  [meetings]
);

const nextApptRaw = useMemo(
  () => allAppts
    .filter((a) => new Date(a.scheduledAt).getTime() + a.durationMins * 60_000 > Date.now())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ?? null,
  [allAppts]
);
```

- [ ] **Step 4: Add buildGoogleCalendarUrl helper**

Add this helper function near the top of the file (after the existing helper functions, before `BookCallPage`):

```ts
function buildGoogleCalendarUrl(appt: PortalAppointment): string {
  const start = new Date(appt.scheduledAt);
  const end   = new Date(start.getTime() + appt.durationMins * 60_000);
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    text:    `Meeting with ${appt.ownerName ?? "Maphari"}`,
    dates:   `${fmt(start)}/${fmt(end)}`,
    details: appt.notes ?? "",
    sf:      "true",
    output:  "xml",
  });
  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
}
```

- [ ] **Step 5: Fix Action Items stat card**

Replace the hardcoded `"—"` on line 421:

Old:
```tsx
{ label: "Action Items", value: "—", color: "statCardAmber" },
```

New:
```tsx
{ label: "Action Items", value: String(pendingActionItems), color: "statCardAmber" },
```

- [ ] **Step 6: Wire hero "Add to Calendar" button**

Replace the unwired button at lines 545–547:

Old:
```tsx
<button type="button" className={cx("btnSm", "btnGhost", "noWrap")}>
  <Ic n="calendar" sz={12} c="var(--muted)" /> Add to Calendar
</button>
```

New:
```tsx
<button
  type="button"
  className={cx("btnSm", "btnGhost", "noWrap")}
  disabled={!nextApptRaw}
  onClick={() => nextApptRaw && window.open(buildGoogleCalendarUrl(nextApptRaw), "_blank", "noopener,noreferrer")}
>
  <Ic n="calendar" sz={12} c="var(--muted)" /> Add to Calendar
</button>
```

- [ ] **Step 7: Capture booked appointment in handleConfirmBooking**

In `handleConfirmBooking`, after `setBookedVideoUrl(r.data.videoRoomUrl ?? null)`, add:

```ts
setBookedAppt(r.data);
```

- [ ] **Step 8: Wire done-state "Add to Calendar" button**

Replace the unwired button at line 839–841:

Old:
```tsx
<button type="button" className={cx("btnSm", "btnGhost")}>
  <Ic n="calendar" sz={12} c="var(--muted)" /> Add to Calendar
</button>
```

New:
```tsx
<button
  type="button"
  className={cx("btnSm", "btnGhost")}
  disabled={!bookedAppt}
  onClick={() => bookedAppt && window.open(buildGoogleCalendarUrl(bookedAppt), "_blank", "noopener,noreferrer")}
>
  <Ic n="calendar" sz={12} c="var(--muted)" /> Add to Calendar
</button>
```

- [ ] **Step 9: Replace Past Meetings section with real data**

The Past Meetings section currently uses `PAST_MEETINGS` (the hardcoded empty array). Replace all three references with real `PortalMeeting[]` data from the `meetings` state.

The section uses `m.title`, `m.type`, `m.color`, `m.icon`, `m.hostAv`, `m.host`, `m.date`, `m.duration`, `m.notes` from the old shape. The new `PortalMeeting` shape has different fields. Rewrite the Past Meetings section JSX to match `PortalMeeting`:

Find the section starting at line 852 (`{/* ── Past Meetings ── */}`). Replace from `{PAST_MEETINGS.length === 0 ?` through `PAST_MEETINGS.map((m) => (` and its interior card body:

```tsx
{/* ── Past Meetings ─────────────────────────────────────────────────── */}
<div className={cx("card", "p0", "overflowHidden")}>
  <div className={cx("cardHd", "pl18")}>
    <div className={cx("flexRow", "flexCenter", "gap7")}>
      <Ic n="clock" sz={13} c="var(--muted)" />
      <span className={cx("cardHdTitle")}>Past Meetings</span>
    </div>
  </div>
  {(!meetings || meetings.length === 0) ? (
    <div className={cx("emptyState")}>
      <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
      <div className={cx("emptyStateTitle")}>No past meetings yet</div>
      <div className={cx("emptyStateSub")}>Your meeting history will appear here once you&apos;ve had calls with your team.</div>
    </div>
  ) : meetings.map((m) => {
    const actionBadge =
      m.actionItemStatus === "PENDING"     ? "badgeAmber"  :
      m.actionItemStatus === "IN_PROGRESS" ? "badgePurple" : "badgeGreen";
    const actionLabel =
      m.actionItemStatus === "PENDING"     ? "Action needed" :
      m.actionItemStatus === "IN_PROGRESS" ? "In progress"   : "Done";
    const dateLabel = new Date(m.meetingAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
    const durLabel  = `${m.durationMins} min`;
    return (
      <div key={m.id} className={cx("borderTopDivider")}>
        <button
          type="button"
          className={cx("listRowBtn")}
          onClick={() => setExpandedPast(expandedPast === m.id ? null : m.id)}
        >
          <div className={cx("iconBox34")}>
            <Ic n="calendar" sz={14} c="var(--muted2)" />
          </div>
          <div className={cx("flex1", "minW0")}>
            <div className={cx("flexRow", "gap7", "mb3", "flexWrap")}>
              <span className={cx("fw600", "text12")}>{m.title}</span>
              <span className={cx("badge", actionBadge)}>{actionLabel}</span>
            </div>
            <div className={cx("text10", "colorMuted")}>
              {dateLabel} · {durLabel} · {m.attendeeCount} attendee{m.attendeeCount !== 1 ? "s" : ""}
            </div>
          </div>
          <Ic n={expandedPast === m.id ? "chevronDown" : "chevronRight"} sz={14} c="var(--muted2)" />
        </button>
        {expandedPast === m.id && m.notes && (
          <div className={cx("p0x18x14x64")}>
            <div className={cx("pastMeetingNotes")}>
              <div className={cx("fw700", "text11", "flexRow", "flexCenter", "gap5", "mb8")}>
                <Ic n="zap" sz={11} c="var(--lime)" /> Meeting Notes
              </div>
              <div className={cx("text12", "colorMuted", "lineH165")}>{m.notes}</div>
            </div>
          </div>
        )}
      </div>
    );
  })}
</div>
```

Note: The `PAST_MEETINGS` constant and `PAST_TYPE_BADGE` map at lines 107–113 can be left in place (they're harmless empty constants). If you prefer to clean them up, remove them — TypeScript will error if they're still referenced.

- [ ] **Step 10: TypeScript check**

Run:
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors. If there are errors, fix them before committing.

- [ ] **Step 11: Commit**

```bash
git add apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx
git commit -m "feat(client): wire meetings API, action items stat, add-to-calendar, past meetings"
```

---

## Task 2: Add Recordings section to `meeting-archive-page.tsx`

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx`

### Context

Current file structure (key lines):
- **Lines 7–14**: Imports from `../../../../lib/api/portal` — `loadPortalMeetingsWithRefresh` and `type PortalMeeting` are already imported.
- **Line 140**: `const [portalMeetings, setPortalMeetings] = useState<PortalMeeting[]>([]);` — already loaded from API, already populated in the fetch effect.
- **Line 154**: `const [loading, setLoading] = useState(true);` — existing loading state
- **Lines 590–721**: Archive List Tab renders `archiveMeetings` (appointments-derived). Do NOT touch this.
- **Lines 721–724**: End of component — the Recordings section goes here, inside the outer `<div className={cx("pageBody")}>` wrapper, after `)}` (closing the tab panel conditional) and before the final `</div>` that closes `pageBody`.

The file ends at line 724 (`}`). The last few lines are:
```tsx
        </div>        // closes tab panel
      )}              // closes tab conditional
    </div>            // closes pageBody
  );
}
```

### What to add

Add a `downloadingRecordingId` state and a `handleWatchRecording` handler, then render the Recordings section.

The `getPortalFileDownloadUrlWithRefresh` function is exported from the portal barrel (`../../../../lib/api/portal`).

### Implementation Steps

- [ ] **Step 1: Add state and handler**

Inside `MeetingArchivePage()`, after the existing state declarations, add:

```ts
const [downloadingRecordingId, setDownloadingRecordingId] = useState<string | null>(null);
```

Add this handler function inside the component (after other handlers, before the `if (loading)` check):

```ts
async function handleWatchRecording(meetingId: string, fileId: string) {
  if (!session) return;
  setDownloadingRecordingId(meetingId);
  try {
    const r = await getPortalFileDownloadUrlWithRefresh(session, fileId);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data?.downloadUrl) {
      window.open(r.data.downloadUrl, "_blank", "noopener,noreferrer");
    }
  } finally {
    setDownloadingRecordingId(null);
  }
}
```

- [ ] **Step 2: Add import for getPortalFileDownloadUrlWithRefresh**

Extend the portal import block (lines 7–14) to add `getPortalFileDownloadUrlWithRefresh`:

```ts
import {
  loadPortalAppointmentsWithRefresh,
  loadPortalMeetingsWithRefresh,
  ratePortalMeetingWithRefresh,
  createPortalSupportTicketWithRefresh,
  getPortalFileDownloadUrlWithRefresh,
  type PortalAppointment,
  type PortalMeeting,
} from "../../../../lib/api/portal";
```

- [ ] **Step 3: Add Recordings section**

Insert the Recordings section BEFORE the final closing `</div>` of the component's return (the `pageBody` wrapper). This goes after the tab panel closing `)}`:

```tsx
{/* ── Recordings ───────────────────────────────────────────────────── */}
{portalMeetings.filter((m) => m.hasRecording).length > 0 && (
  <div>
    <p className={cx("pageEyebrow")}>Recordings</p>
    <div className={cx("card", "p0", "overflowHidden")}>
    {portalMeetings
      .filter((m) => m.hasRecording)
      .map((m) => {
        const dateLabel = new Date(m.meetingAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
        const durLabel  = `${m.durationMins} min`;
        const isDownloading = downloadingRecordingId === m.id;
        return (
          <div key={m.id} className={cx("borderTopDivider")}>
            <div className={cx("listRowBtn")}>
              <div className={cx("iconBox34")}>
                <Ic n="video" sz={14} c="var(--muted2)" />
              </div>
              <div className={cx("flex1", "minW0")}>
                <div className={cx("fw600", "text12", "mb2")}>{m.title}</div>
                <div className={cx("text10", "colorMuted")}>{dateLabel} · {durLabel}</div>
              </div>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                disabled={!m.recordingFileId || isDownloading}
                title={!m.recordingFileId ? "Recording being processed" : undefined}
                onClick={() => m.recordingFileId && void handleWatchRecording(m.id, m.recordingFileId)}
              >
                {isDownloading ? "…" : "▶ Watch Recording"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
```

- [ ] **Step 4: TypeScript check**

Run:
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors. Fix any errors before committing.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx
git commit -m "feat(client): add recordings section to meeting archive with watch recording button"
```

---

## Final Verification

After both tasks are committed:

- [ ] TypeScript check passes: `pnpm --filter @maphari/web exec tsc --noEmit` → 0 errors
- [ ] Book a Call → past meetings section shows real `PortalMeeting[]` data (or empty state if none)
- [ ] Book a Call → Action Items stat shows a number (not `"—"`)
- [ ] Book a Call → "Add to Calendar" on next meeting hero is clickable when `nextApptRaw` exists
- [ ] Book a Call → "Add to Calendar" in done state is clickable after successful booking
- [ ] Meeting Archive → Recordings section appears only when `portalMeetings.filter(m => m.hasRecording).length > 0`
- [ ] Meeting Archive → Rows with `recordingFileId: null` show disabled button with `title="Recording being processed"`
