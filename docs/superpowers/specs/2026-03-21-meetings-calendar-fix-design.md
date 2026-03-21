# Meetings & Calendar Fix — Design Spec
**Date:** 2026-03-21
**Status:** Approved
**Scope:** Client portal — wire past meetings, fix action items stat, Add to Calendar, recording playback

---

## Problem

Both meeting pages have specific data gaps despite solid structural foundations:

1. `book-call-page.tsx` has a past meetings section rendering a hardcoded empty array — `PortalMeeting[]` is never loaded here
2. "Action Items" stat card always shows `"—"` — count is derivable from `actionItemStatus === "PENDING"` on loaded meetings
3. "Add to Calendar" button in the next-meeting hero card is not wired
4. `PortalMeeting.hasRecording` and `recordingFileId` exist in the type and DB but no UI exposes them

---

## Solution

Four targeted data wiring changes across two files. No new API endpoints, no new CSS classes, no new components.

---

## Changes

### 1. Wire Past Meetings in Book a Call

**File:** `apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx`

Load `PortalMeeting[]` in parallel with the existing `PortalAppointment[]` fetch:

```ts
const [apptRes, meetRes] = await Promise.all([
  loadPortalAppointmentsWithRefresh(session),
  loadPortalMeetingsWithRefresh(session),
]);
```

Save meetings to `useState<PortalMeeting[] | null>`. Replace the hardcoded `PAST_MEETINGS` constant with the loaded data, sorted descending by `meetingAt`. Each past meeting card renders:
- Title
- Date (`meetingAt` formatted as `"15 Jan 2026"`)
- Duration (`durationMins` → `"45 min"`)
- Attendee count
- `actionItemStatus` badge: `PENDING` → amber `"Action needed"`, `IN_PROGRESS` → purple `"In progress"`, else green `"Done"`

### 2. Fix Action Items Stat

**File:** `apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx`

Replace the hardcoded `"—"` in the Action Items stat card with:
```ts
const pendingActionItems = meetings?.filter(m => m.actionItemStatus === "PENDING").length ?? 0;
```
Display as `pendingActionItems.toString()` (shows `"0"` when none pending).

### 3. Wire "Add to Calendar"

**File:** `apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx`

The next-meeting hero has an "Add to Calendar" button. Wire it to open a Google Calendar new-event URL:

```ts
function buildGoogleCalendarUrl(appt: PortalAppointment): string {
  const start = new Date(appt.scheduledAt);
  const end = new Date(start.getTime() + appt.durationMins * 60_000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
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

Button: `onClick={() => window.open(buildGoogleCalendarUrl(nextAppt), "_blank", "noopener,noreferrer")}`.

Client-side only — no API call.

### 4. Recording Playback

**File:** `apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx`

In the Archive List tab, for each `PortalMeeting` row, add a "▶ Watch Recording" button when `meeting.hasRecording === true`:

- If `recordingFileId` is non-null: button is enabled. On click, call `getPortalFileDownloadUrlWithRefresh(session, recordingFileId)` → open `downloadUrl` in a new tab.
- If `recordingFileId` is null: button is rendered but disabled with `title="Recording being processed"`.
- Loading state per-row: `downloadingRecordingId: string | null` state, button shows `"Loading…"` while fetching.

Import `getPortalFileDownloadUrlWithRefresh` from `../../../../lib/api/portal/files`.

---

## Data Sources

All existing, no new endpoints:
- `loadPortalMeetingsWithRefresh(session)` → `PortalMeeting[]` — in `apps/web/src/lib/api/portal/meetings.ts`
- `loadPortalAppointmentsWithRefresh(session)` → `PortalAppointment[]` — in `apps/web/src/lib/api/portal/client-cx.ts`
- `getPortalFileDownloadUrlWithRefresh(session, fileId)` → `{ downloadUrl }` — in `apps/web/src/lib/api/portal/files.ts`

---

## Files

| File | Action |
|------|--------|
| `apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx` | Modify — wire meetings fetch, past meetings section, action items stat, Add to Calendar |
| `apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx` | Modify — add recording playback button to archive list |

---

## Success Criteria

1. Book a Call → past meetings section shows real `PortalMeeting[]` data (or empty state if none)
2. Book a Call → Action Items stat shows correct count of `PENDING` meetings (not `"—"`)
3. Book a Call → "Add to Calendar" on next meeting opens Google Calendar pre-filled with meeting details
4. Meeting Archive → archive list rows with `hasRecording: true` show "▶ Watch Recording" button; clicking fetches download URL and opens in new tab
5. Meeting Archive → rows with `hasRecording: true` but `recordingFileId: null` show disabled button with tooltip
6. `pnpm --filter @maphari/web exec tsc --noEmit` → 0 errors
