# Communication History Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Communication History page from a five-dropdown date-only timeline into a client swimlane layout (collapsible, sorted by most recent activity) with a view toggle to the existing date-grouped layout.

**Architecture:** Two files change — `communication-history-page.tsx` (state + JSX rewrite) and `pages-b.module.css` (new `comms*` classes, 7 missing classes fixed, unused direction label classes removed). No API, gateway, or shared CSS changes. All data comes from the existing `getStaffAllComms` call.

**Tech Stack:** React 18, Next.js, CSS Modules, Vitest + @testing-library/react

---

## File Structure

| File | Change |
|------|--------|
| `apps/web/src/app/style/staff/pages-b.module.css` | Add filter bar, swimlane, and event row CSS classes (Tasks 1 & 2). Remove 4 unused direction label classes (Task 6). |
| `apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.tsx` | Full rewrite of state + JSX (Tasks 4 & 5). |
| `apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.test.tsx` | New test file covering new behaviour (Task 3). |

---

## Reference: Key patterns

**CSS class resolution:** `cx("className")` is called in every component. It resolves CSS module class names via the style utility at `apps/web/src/components/staff/staff-dashboard/style.ts` which spreads all staff CSS files. You do not need to import CSS modules directly — use `cx()` with string class names.

**API result type:** `AuthorizedResult<T>` is `{ data: T | null; error: GatewayError | null; nextSession: AuthSession | null }`. No `unauthorized` field — use `r.error` to detect failure.

**CSS tokens:** `--s1`/`--s2`/`--s3` = surfaces, `--b1`/`--b2`/`--b3` = borders, `--accent` = orange, `--text`/`--muted`/`--muted2` = text colours, `--r-xs` = 6px, `--r-sm` = 8px, `--r-md` = 12px, `--accent-d`/`--green-d`/`--amber-d`/`--purple-d` = tinted backgrounds.

**Avatar toning:** Four stable tone classes already defined in `pages-b.module.css`:
```
.clientAvatarToneAccent { background: var(--accent-d); color: var(--accent); }
.clientAvatarToneAmber  { background: var(--amber-d);  color: var(--amber); }
.clientAvatarTonePurple { background: var(--purple-d); color: var(--purple); }
.clientAvatarToneGreen  { background: var(--green-d);  color: var(--green); }
```
Derive a stable tone from `clientId` using a simple hash:
```typescript
const AVATAR_TONES = ["clientAvatarToneAccent","clientAvatarToneAmber","clientAvatarTonePurple","clientAvatarToneGreen"] as const;
function laneAvatarTone(clientId: string): string {
  let h = 0;
  for (let i = 0; i < clientId.length; i++) h = (h * 31 + clientId.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}
```

**Empty states:** Use the `<StaffEmptyState icon={EmptyIcons.notes} title="…" sub="…" />` component (already imported in the current file).

**Type chip colour mapping (existing retained classes, do not change):**
```
commsTypeMessage   → accent (orange)
commsTypeMilestone → green
commsTypeInvoice   → blue
commsTypeCall      → purple
commsTypeFile      → amber
```
Chip tone classes (for `staffChip`): message → `staffChipAccent`, milestone → `staffChipGreen`, invoice → `staffChipAmber`, call → `staffChipPurple`, file → `staffChip` (no extra tone).

---

## Task 1: CSS — filter bar, ghost button, event row missing classes

**Files:**
- Modify: `apps/web/src/app/style/staff/pages-b.module.css` (append after line ~2654, after `.commsDateBadge`)

- [ ] **Step 1: Append the following CSS block to pages-b.module.css** after the last existing `.comms*` rule (after `.commsDateBadge`):

```css
/* ── Communication History redesign: filter bar ──────────────────── */
.commsFilterBar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 0 12px;
}
.commsTypePill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid var(--b2);
  background: var(--s2);
  font-size: 10px;
  font-family: var(--font-dm-mono), monospace;
  color: var(--muted);
  cursor: pointer;
  user-select: none;
  transition: background 0.12s, color 0.12s;
}
.commsTypePill:hover { background: var(--s3); color: var(--text); }
.commsTypePillActive {
  background: var(--accent-d);
  color: var(--accent);
  border-color: var(--accent);
}
.commsViewToggle {
  display: flex;
  border: 1px solid var(--b2);
  border-radius: var(--r-xs);
  overflow: hidden;
  flex-shrink: 0;
}
.commsViewBtn {
  padding: 3px 10px;
  font-size: 10px;
  font-family: var(--font-dm-mono), monospace;
  color: var(--muted);
  background: var(--s2);
  cursor: pointer;
  user-select: none;
  border: none;
  transition: background 0.12s, color 0.12s;
}
.commsViewBtn:hover { background: var(--s3); }
.commsViewBtnActive {
  background: var(--accent);
  color: #000;
  font-weight: 700;
}
.commsGhostBtn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--r-xs);
  border: 1px solid var(--b2);
  background: transparent;
  color: var(--muted);
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s;
  flex-shrink: 0;
}
.commsGhostBtn:hover { border-color: var(--b3); color: var(--text); }
.commsGhostBtn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Event row missing classes (fix) ─────────────────────────────── */
.commsEventRow {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  cursor: pointer;
}
.commsEventHeadRow {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.commsEventMeta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.commsExpandedBody {
  padding: 8px 12px 10px 38px;
  border-top: 1px solid var(--b1);
}
.commsExpandedMeta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.commsRowLast { border-bottom: none !important; }
```

- [ ] **Step 2: Verify all key classes are present**

```bash
for cls in commsFilterBar commsTypePill commsTypePillActive commsViewToggle commsViewBtn commsViewBtnActive commsGhostBtn commsEventRow commsEventHeadRow commsEventMeta commsExpandedBody commsExpandedMeta commsRowLast; do
  grep -q "$cls" apps/web/src/app/style/staff/pages-b.module.css && echo "✓ $cls" || echo "✗ MISSING: $cls"
done
```
Expected: all lines show `✓`.

- [ ] **Step 3: TypeScript check (no CSS errors)**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -10
```
Expected: no output (clean).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/style/staff/pages-b.module.css
git commit -m "style(staff): add comms filter bar, ghost btn, event row css"
```

---

## Task 2: CSS — swimlane layout classes

**Files:**
- Modify: `apps/web/src/app/style/staff/pages-b.module.css` (append after Task 1 additions)

- [ ] **Step 1: Append the swimlane CSS block** immediately after the block added in Task 1:

```css
/* ── Communication History redesign: swimlane ───────────────────── */
.commsSwimGrid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.commsClientLane {
  border-radius: var(--r-md);
  border: 1px solid var(--b2);
  overflow: hidden;
}
.commsLaneHeader {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--s2);
  cursor: pointer;
  user-select: none;
  transition: background 0.12s;
}
.commsLaneHeader:hover { background: var(--s3); }
.commsLaneAvatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}
.commsLaneName {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.commsLaneMeta {
  font-size: 10px;
  color: var(--muted2);
  font-family: var(--font-dm-mono), monospace;
  white-space: nowrap;
}
.commsLaneBody {
  border-top: 1px solid var(--b1);
}
```

- [ ] **Step 2: Verify**

```bash
grep -c "commsSwimGrid\|commsClientLane\|commsLaneHeader\|commsLaneAvatar\|commsLaneName\|commsLaneMeta\|commsLaneBody" apps/web/src/app/style/staff/pages-b.module.css
```
Expected: `7` or more.

- [ ] **Step 3: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -10
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/style/staff/pages-b.module.css
git commit -m "style(staff): add comms swimlane layout css classes"
```

---

## Task 3: Write failing tests

**Files:**
- Create: `apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.test.tsx`

These tests describe the NEW behaviour. They will fail against the current component (which has no swimlane view and no type pills).

- [ ] **Step 1: Create the test file**

```typescript
// apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommunicationHistoryPage } from "./communication-history-page";
import { getStaffAllComms } from "../../../../lib/api/staff/clients";
import type { AuthSession } from "../../../../lib/auth/session";
import type { StaffCommLog } from "../../../../lib/api/staff/clients";

vi.mock("../../../../lib/api/staff/clients", () => ({
  getStaffAllComms: vi.fn(),
}));

const mockSession = {
  accessToken: "tok",
  user: { id: "u1", email: "staff@test.com", role: "STAFF" },
  nextSession: null,
} as unknown as AuthSession;

const mockLogs: StaffCommLog[] = [
  {
    id: "e1",
    clientId: "c1",
    clientName: "Acme Ltd",
    type: "message",
    subject: "Follow-up proposal",
    fromName: "Alice",
    direction: "outbound",
    actionLabel: "Sent follow-up",
    occurredAt: "2026-03-27T14:32:00.000Z",
  },
  {
    id: "e2",
    clientId: "c1",
    clientName: "Acme Ltd",
    type: "milestone",
    subject: "Sprint 3 done",
    fromName: null,
    direction: "both",
    actionLabel: "Sprint completed",
    occurredAt: "2026-03-25T09:15:00.000Z",
  },
  {
    id: "e3",
    clientId: "c2",
    clientName: "Beta Corp",
    type: "call",
    subject: "Weekly check-in",
    fromName: "Bob",
    direction: "inbound",
    actionLabel: "Received call",
    occurredAt: "2026-03-24T15:00:00.000Z",
  },
];

beforeEach(() => {
  vi.mocked(getStaffAllComms).mockResolvedValue({
    data: mockLogs,
    error: null,
    nextSession: null,
  });
});

afterEach(() => vi.clearAllMocks());

describe("CommunicationHistoryPage — page shell", () => {
  it("renders the page title", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Communication History")).toBeInTheDocument()
    );
  });

  it("shows error state when API fails", async () => {
    vi.mocked(getStaffAllComms).mockResolvedValue({
      data: null,
      error: { message: "Server error", code: "ERR" },
      nextSession: null,
    });
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Server error")).toBeInTheDocument()
    );
  });

  it("shows empty state when no events", async () => {
    vi.mocked(getStaffAllComms).mockResolvedValue({
      data: [],
      error: null,
      nextSession: null,
    });
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(
        screen.getByText(/no communication history/i)
      ).toBeInTheDocument()
    );
  });
});

describe("CommunicationHistoryPage — By Client view (default)", () => {
  it("renders client swimlane headers by default", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    expect(screen.getByText("Beta Corp")).toBeInTheDocument();
  });

  it("shows events inside each client lane", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Follow-up proposal")).toBeInTheDocument()
    );
    expect(screen.getByText("Sprint 3 done")).toBeInTheDocument();
    expect(screen.getByText("Weekly check-in")).toBeInTheDocument();
  });

  it("Acme Ltd lane appears before Beta Corp (most recent first)", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    const headers = screen.getAllByText(/Acme Ltd|Beta Corp/);
    expect(headers[0].textContent).toContain("Acme Ltd");
  });

  it("collapses a lane when its header is clicked", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    // Events visible before collapse
    expect(screen.getByText("Follow-up proposal")).toBeInTheDocument();
    // Click the lane header
    fireEvent.click(screen.getByText("Acme Ltd"));
    // Events should be hidden
    expect(screen.queryByText("Follow-up proposal")).not.toBeInTheDocument();
  });

  it("re-expands a collapsed lane when header is clicked again", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText("Acme Ltd")); // collapse
    fireEvent.click(screen.getByText("Acme Ltd")); // expand
    expect(screen.getByText("Follow-up proposal")).toBeInTheDocument();
  });
});

describe("CommunicationHistoryPage — filter bar", () => {
  it("renders type pills: All, Messages, Calls, Milestones, Invoices, Files", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /messages/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /calls/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /milestones/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /invoices/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /files/i })).toBeInTheDocument();
  });

  it("filters to calls only when Calls pill is clicked", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /calls/i }));
    // Only "Weekly check-in" (call) should be visible
    expect(screen.getByText("Weekly check-in")).toBeInTheDocument();
    expect(screen.queryByText("Follow-up proposal")).not.toBeInTheDocument();
    expect(screen.queryByText("Sprint 3 done")).not.toBeInTheDocument();
  });

  it("clicking active type pill again resets to All", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /calls/i }));
    fireEvent.click(screen.getByRole("button", { name: /calls/i }));
    expect(screen.getByText("Follow-up proposal")).toBeInTheDocument();
  });

  it("hides client lane entirely when filter leaves it with 0 events", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    // Filter to calls — only Beta Corp has a call
    fireEvent.click(screen.getByRole("button", { name: /calls/i }));
    expect(screen.queryByText("Acme Ltd")).not.toBeInTheDocument();
    expect(screen.getByText("Beta Corp")).toBeInTheDocument();
  });

  it("search filters events and hides empty lanes", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "sprint" } });
    expect(screen.getByText("Sprint 3 done")).toBeInTheDocument();
    expect(screen.queryByText("Follow-up proposal")).not.toBeInTheDocument();
    expect(screen.queryByText("Beta Corp")).not.toBeInTheDocument();
  });

  it("shows no-match empty state when search has no results", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "zzznomatch" } });
    expect(screen.getByText(/no events match/i)).toBeInTheDocument();
  });
});

describe("CommunicationHistoryPage — view toggle", () => {
  it("renders By Client and By Date toggle buttons", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /by client/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /by date/i })).toBeInTheDocument();
  });

  it("switches to By Date view showing date group headers", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /by date/i }));
    // Date groups should now be present (no swimlane client headers)
    // All events still visible
    expect(screen.getByText("Follow-up proposal")).toBeInTheDocument();
    expect(screen.getByText("Sprint 3 done")).toBeInTheDocument();
    expect(screen.getByText("Weekly check-in")).toBeInTheDocument();
    // Client swimlane headers should be gone
    expect(screen.queryByText("Acme Ltd")).not.toBeInTheDocument();
  });

  it("switching back to By Client view shows swimlane headers again", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /by date/i }));
    fireEvent.click(screen.getByRole("button", { name: /by client/i }));
    expect(screen.getByText("Acme Ltd")).toBeInTheDocument();
  });
});

describe("CommunicationHistoryPage — event expand", () => {
  it("expands an event row when clicked, showing excerpt", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Follow-up proposal")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText("Follow-up proposal"));
    expect(screen.getByText("Sent follow-up")).toBeInTheDocument();
  });

  it("collapses an expanded row when clicked again", async () => {
    render(<CommunicationHistoryPage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText("Follow-up proposal")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText("Follow-up proposal"));
    fireEvent.click(screen.getByText("Follow-up proposal"));
    expect(screen.queryByText("Sent follow-up")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/web && pnpm exec vitest run src/components/staff/staff-dashboard/pages/communication-history-page.test.tsx 2>&1 | tail -10
```
Expected: multiple failures (current component has no swimlane structure, no type pills, no view toggle).

- [ ] **Step 3: Commit the failing tests**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.test.tsx
git commit -m "test(staff): write failing tests for comms history redesign"
```

---

## Task 4: Component rewrite — state, types, helpers (no JSX yet)

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.tsx`

Replace the entire file contents. Retain the SVG icon components and `typeConfig`. Remove `Direction` type, `directionConfig`, `ClientRow` type. Add new state and `useMemo` derived values. Keep all API loading logic.

- [ ] **Step 1: Replace the file with the following**

```typescript
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { StaffEmptyState, EmptyIcons } from "../empty-state";
import type { AuthSession } from "../../../../lib/auth/session";
import { getStaffAllComms } from "../../../../lib/api/staff/clients";

// ── SVG icons ─────────────────────────────────────────────────────
function IcoMessage() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
function IcoMilestone() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 2v12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M3 3h8l-2 3.5L11 10H3" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
function IcoInvoice() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IcoCall() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5.5 2H3.5A1 1 0 0 0 2.5 3c0 6.075 4.925 11 11 11a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1l-2.5-.5a1 1 0 0 0-1 .4l-.8 1C7.9 9.6 6.4 8.1 5.6 6.8l1-.8a1 1 0 0 0 .4-1L6.5 3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
function IcoFile() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M9 1v5h5" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────
type ViewMode  = "client" | "date";
type EventType = "message" | "milestone" | "invoice" | "call" | "file";
type SortBy    = "recent" | "oldest" | "client";

type TimelineEvent = {
  id:         string;
  clientId:   string;
  clientName: string;
  type:       EventType;
  direction:  string; // kept as raw string — only used for direction chip logic
  title:      string;
  excerpt:    string;
  occurredAt: string;
  dateLabel:  string;
  timeLabel:  string;
};

// ── Config ─────────────────────────────────────────────────────────
const TYPE_ICONS: Record<EventType, React.ReactNode> = {
  message:   <IcoMessage />,
  milestone: <IcoMilestone />,
  invoice:   <IcoInvoice />,
  call:      <IcoCall />,
  file:      <IcoFile />,
};

const typeConfig: Record<EventType, { label: string; iconClass: string; chipClass: string }> = {
  message:   { label: "Message",   iconClass: "commsTypeMessage",   chipClass: "staffChipAccent" },
  milestone: { label: "Milestone", iconClass: "commsTypeMilestone", chipClass: "staffChipGreen" },
  invoice:   { label: "Invoice",   iconClass: "commsTypeInvoice",   chipClass: "staffChipAmber" },
  call:      { label: "Call",      iconClass: "commsTypeCall",      chipClass: "staffChipPurple" },
  file:      { label: "File",      iconClass: "commsTypeFile",      chipClass: "staffChip" },
};

const TYPE_PILLS: { key: EventType | "all"; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "message",   label: "Messages" },
  { key: "call",      label: "Calls" },
  { key: "milestone", label: "Milestones" },
  { key: "invoice",   label: "Invoices" },
  { key: "file",      label: "Files" },
];

const SORT_LABELS: Record<SortBy, string> = {
  recent: "Recent ↓",
  oldest: "Oldest ↑",
  client: "Client A–Z",
};

const AVATAR_TONES = [
  "clientAvatarToneAccent",
  "clientAvatarToneAmber",
  "clientAvatarTonePurple",
  "clientAvatarToneGreen",
] as const;

// ── Helpers ────────────────────────────────────────────────────────
function normalizeType(value: string): EventType {
  if (
    value === "message" || value === "milestone" || value === "invoice" ||
    value === "call"    || value === "file"
  ) return value;
  return "message";
}

function normalizeDirection(value: string): string {
  if (value === "inbound" || value === "outbound" || value === "both") return value;
  return "outbound";
}

function laneAvatarTone(clientId: string): string {
  let h = 0;
  for (let i = 0; i < clientId.length; i++) h = (h * 31 + clientId.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

function clientInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function directionChipClass(direction: string): string | null {
  if (direction === "inbound") return "staffChipGreen";
  if (direction === "both")    return "staffChipPurple";
  return null; // outbound: no chip
}

// ── Component ──────────────────────────────────────────────────────
export function CommunicationHistoryPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [allEvents, setAllEvents]           = useState<TimelineEvent[]>([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [viewMode, setViewMode]             = useState<ViewMode>("client");
  const [activeType, setActiveType]         = useState<EventType | "all">("all");
  const [search, setSearch]                 = useState("");
  const [sortBy, setSortBy]                 = useState<SortBy>("recent");
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId]         = useState<string | null>(null);

  const loadComms = useCallback(async (background: boolean) => {
    if (!session) { setLoading(false); return; }
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const r = await getStaffAllComms(session);
      if (r.error) {
        setError(r.error.message ?? "Failed to load communication history.");
        setAllEvents([]);
        return;
      }
      const mapped = (r.data ?? []).map((log): TimelineEvent => {
        const type      = normalizeType(log.type);
        const direction = normalizeDirection(log.direction);
        const dt        = new Date(log.occurredAt);
        const fallbackExcerpt = `${direction === "inbound" ? "Received" : direction === "both" ? "Joint" : "Sent"} ${typeConfig[type].label.toLowerCase()}${log.fromName ? ` from ${log.fromName}` : ""}`;
        return {
          id:         log.id,
          clientId:   log.clientId,
          clientName: log.clientName,
          type,
          direction,
          title:      (log.subject ?? "").trim()      || `${typeConfig[type].label} event`,
          excerpt:    (log.actionLabel ?? "").trim()   || fallbackExcerpt,
          occurredAt: dt.toISOString(),
          dateLabel:  dt.toLocaleDateString(undefined, { year: "numeric", day: "numeric", month: "short" }),
          timeLabel:  dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        };
      });
      setAllEvents(mapped);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load communication history.");
      setAllEvents([]);
    } finally {
      if (background) setRefreshing(false);
      else setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!isActive) return;
    void loadComms(false);
  }, [isActive, loadComms]);

  // ── Derived data ──────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    return allEvents
      .filter((e) => activeType === "all" || e.type === activeType)
      .filter((e) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.excerpt.toLowerCase().includes(q) ||
          e.clientName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "client") return a.clientName.localeCompare(b.clientName);
        const delta = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
        return sortBy === "recent" ? -delta : delta;
      });
  }, [allEvents, activeType, search, sortBy]);

  const clientGroups = useMemo(() => {
    const groups = new Map<string, { clientName: string; maxOccurredAt: number; events: TimelineEvent[] }>();
    filteredEvents.forEach((e) => {
      const existing = groups.get(e.clientId);
      const ts = new Date(e.occurredAt).getTime();
      if (existing) {
        existing.events.push(e);
        if (ts > existing.maxOccurredAt) existing.maxOccurredAt = ts;
      } else {
        groups.set(e.clientId, { clientName: e.clientName, maxOccurredAt: ts, events: [e] });
      }
    });
    return Array.from(groups.entries())
      .sort(([, a], [, b]) => b.maxOccurredAt - a.maxOccurredAt)
      .map(([clientId, { clientName, events }]) => ({ clientId, clientName, events }));
  }, [filteredEvents]);

  const dateGroups = useMemo(() => {
    const groups = new Map<string, { maxOccurredAt: number; events: TimelineEvent[] }>();
    filteredEvents.forEach((e) => {
      const ts = new Date(e.occurredAt).getTime();
      const existing = groups.get(e.dateLabel);
      if (existing) {
        existing.events.push(e);
        if (ts > existing.maxOccurredAt) existing.maxOccurredAt = ts;
      } else {
        groups.set(e.dateLabel, { maxOccurredAt: ts, events: [e] });
      }
    });
    // Always newest date group first, regardless of sortBy
    return Array.from(groups.entries())
      .sort(([, a], [, b]) => b.maxOccurredAt - a.maxOccurredAt)
      .map(([dateLabel, { events }]) => ({ dateLabel, events }));
  }, [filteredEvents]);

  // Handlers
  function toggleCollapse(clientId: string) {
    setCollapsedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleTypeClick(key: EventType | "all") {
    setActiveType((prev) => (prev === key && key !== "all" ? "all" : key));
  }

  function cycleSortBy() {
    setSortBy((prev) =>
      prev === "recent" ? "oldest" : prev === "oldest" ? "client" : "recent"
    );
  }

  // ── Render will be added in Task 5 ────────────────────────────────
  return null as unknown as React.ReactElement;
}
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -20
```
Expected: clean (or only errors about the `return null` placeholder — these will be fixed in Task 5).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.tsx
git commit -m "refactor(staff): rewrite comms history state, types, helpers"
```

---

## Task 5: Component JSX

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.tsx`

Replace the placeholder `return null` at the bottom of `CommunicationHistoryPage` with the full JSX. Do not modify anything above the `return` statement.

- [ ] **Step 1: Replace `return null as unknown as React.ReactElement;` with the full JSX**

Find the line:
```typescript
  // ── Render will be added in Task 5 ────────────────────────────────
  return null as unknown as React.ReactElement;
```

Replace with:

```typescript
  // ── Shared sub-renders ────────────────────────────────────────────
  function renderEventRow(event: TimelineEvent, isLast: boolean) {
    const cfg       = typeConfig[event.type];
    const isOpen    = expandedId === event.id;
    const dirChip   = directionChipClass(event.direction);

    return (
      <div
        key={event.id}
        className={cx("staffListRow", "commsEventRow", isLast && "commsRowLast")}
        onClick={() => toggleExpanded(event.id)}
      >
        <div className={cx("commsEventHeadRow")}>
          <div className={cx("commsTimelineIcon", cfg.iconClass)}>
            {TYPE_ICONS[event.type]}
          </div>
          <span className={cx("staffCommsTitle", "flex1")}>{event.title}</span>
          <div className={cx("commsEventMeta")}>
            <span className={cx("staffChip", cfg.chipClass)}>{cfg.label}</span>
            {dirChip ? (
              <span className={cx("staffChip", dirChip)}>
                {event.direction === "inbound" ? "Received" : "Joint"}
              </span>
            ) : null}
            <span className={cx("staffCommsTimeCol")}>{event.timeLabel}</span>
          </div>
        </div>
        {isOpen ? (
          <div className={cx("commsExpandedBody")}>
            <div className={cx("staffCommsExcerpt")}>{event.excerpt}</div>
            <div className={cx("commsExpandedMeta")}>
              <span className={cx("staffChip", cfg.chipClass)}>{cfg.label}</span>
              <span className={cx("staffRoleLabel")}>{event.dateLabel} · {event.timeLabel}</span>
              <button
                type="button"
                className={cx("commsGhostBtn")}
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(
                      `[${event.clientName}] ${event.title} · ${event.excerpt}`
                    );
                  } catch { /* noop */ }
                }}
              >
                Copy
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-communication-history">
        <div className={cx("pageHeaderBar", "borderB", "commsHeaderBar")}>
          <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
          <h1 className={cx("pageTitleText")}>Communication History</h1>
        </div>
        <div className={cx("commsContent", "mb20")}>
          <div className={cx("skeletonBlock")} style={{ height: 40, marginBottom: 8 }} />
          <div className={cx("skeletonBlock")} style={{ height: 52, marginBottom: 8 }} />
          <div className={cx("skeletonBlock")} style={{ height: 52, marginBottom: 8 }} />
          <div className={cx("skeletonBlock")} style={{ height: 52 }} />
        </div>
      </section>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-communication-history">
        <div className={cx("pageHeaderBar", "borderB", "commsHeaderBar")}>
          <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
          <h1 className={cx("pageTitleText")}>Communication History</h1>
        </div>
        <div className={cx("commsContent")}>
          <StaffEmptyState icon={EmptyIcons.notes} title="Failed to load" sub={error} />
        </div>
      </section>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-communication-history">
      {/* Header */}
      <div className={cx("pageHeaderBar", "borderB", "commsHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
        <h1 className={cx("pageTitleText")}>Communication History</h1>
        <p className={cx("pageSubtitleText", "mb16")}>Interaction timeline across all clients</p>

        {/* Filter bar */}
        <div className={cx("commsFilterBar")}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, clients…"
            className={cx("staffFilterInput")}
          />
          {TYPE_PILLS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={cx("commsTypePill", activeType === key && "commsTypePillActive")}
              onClick={() => handleTypeClick(key)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className={cx("commsTypePill", sortBy !== "recent" && "commsTypePillActive")}
            onClick={cycleSortBy}
          >
            {SORT_LABELS[sortBy]}
          </button>
          <div className={cx("commsViewToggle")}>
            <button
              type="button"
              className={cx("commsViewBtn", viewMode === "client" && "commsViewBtnActive")}
              onClick={() => setViewMode("client")}
            >
              By Client
            </button>
            <button
              type="button"
              className={cx("commsViewBtn", viewMode === "date" && "commsViewBtnActive")}
              onClick={() => setViewMode("date")}
            >
              By Date
            </button>
          </div>
          <button
            type="button"
            className={cx("commsGhostBtn")}
            onClick={() => void loadComms(true)}
            disabled={refreshing}
            aria-label="Refresh"
          >
            {refreshing ? "…" : "↻"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={cx("commsContent")}>

        {/* No events at all */}
        {allEvents.length === 0 ? (
          <StaffEmptyState
            icon={EmptyIcons.notes}
            title="No communication history yet"
            sub="Events will appear here once client interactions are recorded."
          />
        ) : filteredEvents.length === 0 ? (
          /* No match after filter/search */
          <StaffEmptyState
            icon={EmptyIcons.notes}
            title="No events match"
            sub={
              <span>
                No events match your current filters.{" "}
                <button
                  type="button"
                  className={cx("commsGhostBtn")}
                  onClick={() => { setActiveType("all"); setSearch(""); }}
                >
                  Clear filters
                </button>
              </span>
            }
          />
        ) : viewMode === "client" ? (
          /* ── By Client view ── */
          <div className={cx("commsSwimGrid")}>
            {clientGroups.map(({ clientId, clientName, events }) => {
              const isCollapsed = collapsedClients.has(clientId);
              const lastEvent   = events[0];
              return (
                <div key={clientId} className={cx("commsClientLane")}>
                  <div
                    className={cx("commsLaneHeader")}
                    onClick={() => toggleCollapse(clientId)}
                  >
                    <div className={cx("commsLaneAvatar", laneAvatarTone(clientId))}>
                      {clientInitials(clientName)}
                    </div>
                    <span className={cx("commsLaneName")}>{clientName}</span>
                    <span className={cx("commsLaneMeta")}>
                      {events.length} event{events.length !== 1 ? "s" : ""} · last {lastEvent?.dateLabel ?? ""}
                    </span>
                    <span style={{ color: "var(--muted2)", fontSize: 11 }}>
                      {isCollapsed ? "▼" : "▲"}
                    </span>
                  </div>
                  {!isCollapsed ? (
                    <div className={cx("commsLaneBody")}>
                      {events.map((event, i) =>
                        renderEventRow(event, i === events.length - 1)
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── By Date view ── */
          <>
            {dateGroups.map(({ dateLabel, events }) => (
              <div key={dateLabel} className={cx("mb20")}>
                <div className={cx("staffCommsDateHd")}>
                  <span className={cx("staffCommsDateLabel")}>{dateLabel}</span>
                  <div className={cx("staffCommsDateLine")} />
                </div>
                <div className={cx("staffCard")}>
                  {events.map((event, i) =>
                    renderEventRow(event, i === events.length - 1)
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
```

- [ ] **Step 2: Run tests**

```bash
cd apps/web && pnpm exec vitest run src/components/staff/staff-dashboard/pages/communication-history-page.test.tsx 2>&1 | tail -15
```
Expected: all tests pass.

- [ ] **Step 3: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -20
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.tsx
git commit -m "feat(staff): rewrite communication history page JSX (swimlane + date views)"
```

---

## Task 6: CSS cleanup and final verification

**Files:**
- Modify: `apps/web/src/app/style/staff/pages-b.module.css` — remove unused direction label classes

- [ ] **Step 1: Remove the four unused direction label CSS classes from pages-b.module.css**

Find and delete these 4 rules (lines ~2635–2638):
```css
.commsDirectionLabel { font-size: 10px; font-family: var(--font-dm-mono), monospace; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.commsDirectionOutbound { color: var(--accent); }
.commsDirectionInbound  { color: var(--blue); }
.commsDirectionBoth     { color: var(--purple); }
```

- [ ] **Step 2: Verify none of the removed classes are referenced anywhere**

```bash
grep -r "commsDirectionLabel\|commsDirectionOutbound\|commsDirectionInbound\|commsDirectionBoth" apps/web/src/
```
Expected: no output.

- [ ] **Step 3: Verify no references to removed JSX classes remain in the component**

```bash
grep "commsFiltersWrap\|commsClientFilterBtn\|staffCommsRowLast\|directionConfig\|filterDir\|filterClient\|selectedClient\|range.*7d\|range.*30d" apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.tsx
```
Expected: no output.

- [ ] **Step 4: Run full test suite**

```bash
cd apps/web && pnpm exec vitest run src/components/staff/staff-dashboard/pages/communication-history-page.test.tsx 2>&1 | tail -10
```
Expected: all tests pass.

- [ ] **Step 5: Final TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -10
```
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/style/staff/pages-b.module.css
git commit -m "style(staff): remove unused comms direction label css classes"
```
