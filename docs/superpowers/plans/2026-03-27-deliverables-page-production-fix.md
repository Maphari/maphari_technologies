# Deliverables Page Production Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 missing CSS classes that break visual rendering, update 3 handler prop types to `Promise<void>`, and add per-operation loading states + attachment success feedback to the Deliverables page.

**Architecture:** Two files change. CSS additions go into `pages-h.module.css` at two precise insertion points. Component changes add two local state variables and replace three `onClick` / `onChange` handlers with async equivalents that track loading by `"<op>-<id>"` key — no structural changes to JSX nesting.

**Tech Stack:** Next.js 16 (React), TypeScript, CSS Modules, `cx()` helper from `createCx(styles)` (resolves CSS module class names by string key)

---

## File Map

| File | What changes |
|------|-------------|
| `apps/web/src/app/style/staff/pages-h.module.css` | Add 7 missing CSS classes at lines 2559 and 2672 |
| `apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx` | Update 3 prop types; add 2 state vars; wire async handlers |

No other files change. The hook (`use-staff-deliverables.ts`) already declares all three handlers as `async` and its return type already uses `Promise<void>` — only the page component's prop interface is wrong.

---

## Task 1: Add missing CSS classes

> This task is pure CSS additions. Nothing is removed or modified — only appended at exact insertion points.

**Files:**
- Modify: `apps/web/src/app/style/staff/pages-h.module.css:2559` (status chip tones, after `.dlStatusChip` block)
- Modify: `apps/web/src/app/style/staff/pages-h.module.css:2672` (layout + feedback classes, after `.dlTitleMuted`)

- [ ] **Step 1: Add status chip tone classes after line 2559**

The `.dlStatusChip` block ends at line 2559 with `}`. Insert the three tone classes immediately after it, before `.dlHandoffChip` at line 2561:

```css
.dlStatusPending    { color: var(--amber); }
.dlStatusInProgress { color: var(--accent); }
.dlStatusCompleted  { color: var(--green); }
```

After editing, lines 2560–2562 should read:
```
.dlStatusPending    { color: var(--amber); }
.dlStatusInProgress { color: var(--accent); }
.dlStatusCompleted  { color: var(--green); }
```

- [ ] **Step 2: Add layout and feedback classes after line 2672**

The `.dlTitleMuted` rule is at line 2671. Insert the following block immediately after it — before the `/* ══ SENTIMENT FLAGS ══ */` comment that starts at line 2673:

```css
/* ── Deliverable action rows + feedback ── */
.dlActionRow {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.dlSubmitRow {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

/* Layout wrapper div around the "Create Deliverable" button */
.dlComposerSubmit {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

/* Attachment success feedback — block element, stacks below the select */
.dlAttachFeedback {
  display: block;
  font-size: 11px;
  color: var(--green);
  margin-top: 4px;
}
```

- [ ] **Step 3: Verify in dev server**

Start the dev server if not running:
```bash
cd apps/web && pnpm dev
```

Navigate to Staff → Project Management → Deliverables.

Check visually:
- Status chips on deliverable items show colour (amber/accent/green) instead of unstyled text
- The action row (Reopen / Start / Complete buttons) is laid out as a flex row
- The "Create Deliverable" button row is right-aligned

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/style/staff/pages-h.module.css
git commit -m "fix(staff): add 7 missing deliverables CSS classes"
```

---

## Task 2: Update prop types from `void` to `Promise<void>`

> The hook already returns Promises — only the page component's prop interface is wrong. This task fixes the type gap so that `await` in subsequent tasks actually waits for the operation.

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx:36-49`

- [ ] **Step 1: Update the three handler prop types in `DeliverablesPageProps`**

Current (lines 36, 37–41, 49):
```ts
onMilestoneAttachment: (projectId: string, milestoneId: string, fileId: string | null) => void;
onMilestoneStatusUpdate: (
  projectId: string,
  milestoneId: string,
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
) => void;
onEstimateChangeRequest: (changeRequestId: string) => void;
```

Replace with:
```ts
onMilestoneAttachment: (projectId: string, milestoneId: string, fileId: string | null) => Promise<void>;
onMilestoneStatusUpdate: (
  projectId: string,
  milestoneId: string,
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
) => Promise<void>;
onEstimateChangeRequest: (changeRequestId: string) => Promise<void>;
```

- [ ] **Step 2: TypeScript check — zero errors expected**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

Expected: no output (zero errors). If errors appear, they will be in `deliverables-page.tsx` — fix before proceeding.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx
git commit -m "fix(staff): update deliverables handler prop types to Promise<void>"
```

---

## Task 3: Add state + wire status update buttons

> Adds `loadingOp` and `attachFeedback` state variables, then wires `loadingOp` to the three status action buttons (Reopen / Start / Complete) on each deliverable item.

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx`

- [ ] **Step 1: Add the two new state declarations**

Find the existing `useState` calls near the top of the component function body (around line 97 in the component, after the destructured props). Add two new declarations immediately after the last existing `useState`:

```ts
const [loadingOp, setLoadingOp]           = useState<string | null>(null);
const [attachFeedback, setAttachFeedback] = useState<{ id: string; fileName: string } | null>(null);
```

`useState` is already imported at line 3 — no import change needed.

- [ ] **Step 2: Replace the three status action buttons (lines ~441–466)**

The current buttons are inside `<div className={cx("dlActionRow")}>` (line 439). They call `onMilestoneStatusUpdate` synchronously without any loading state.

Replace the contents of the `dlActionRow` div with:

```tsx
{item.milestoneStatus !== "PENDING" ? (
  <button
    type="button"
    className={cx("btnXxs", "buttonGhost")}
    disabled={loadingOp === `status-${item.milestoneId}`}
    onClick={async () => {
      setLoadingOp(`status-${item.milestoneId}`);
      await onMilestoneStatusUpdate(item.projectId!, item.milestoneId!, "PENDING");
      setLoadingOp(null);
    }}
  >
    {loadingOp === `status-${item.milestoneId}` ? "…" : "Reopen"}
  </button>
) : null}
{item.milestoneStatus === "PENDING" ? (
  <button
    type="button"
    className={cx("btnXxs", "buttonGhost")}
    disabled={loadingOp === `status-${item.milestoneId}`}
    onClick={async () => {
      setLoadingOp(`status-${item.milestoneId}`);
      await onMilestoneStatusUpdate(item.projectId!, item.milestoneId!, "IN_PROGRESS");
      setLoadingOp(null);
    }}
  >
    {loadingOp === `status-${item.milestoneId}` ? "…" : "Start"}
  </button>
) : null}
{item.milestoneStatus !== "COMPLETED" ? (
  <button
    type="button"
    className={cx("btnXxs", "buttonBlue")}
    disabled={loadingOp === `status-${item.milestoneId}`}
    onClick={async () => {
      setLoadingOp(`status-${item.milestoneId}`);
      await onMilestoneStatusUpdate(item.projectId!, item.milestoneId!, "COMPLETED");
      setLoadingOp(null);
    }}
  >
    {loadingOp === `status-${item.milestoneId}` ? "…" : "Complete"}
  </button>
) : null}
```

Note: `item.milestoneId` is guaranteed non-null here — the entire `dlActionRow` div only renders inside the guard `{item.projectId && item.milestoneId ? (...) : null}` at line 438. The `!` non-null assertions are safe.

- [ ] **Step 3: Verify loading state in browser**

In the dev server, click "Start" on a PENDING deliverable. The button should:
1. Immediately show "…" and become disabled
2. Return to "Complete" / other buttons after the API call resolves

- [ ] **Step 4: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx
git commit -m "fix(staff): add loading state to deliverable status update buttons"
```

---

## Task 4: Wire loading state + success feedback to attachment select

> The attachment `<select>` currently fires `onMilestoneAttachment` synchronously with no feedback. This task adds `disabled` during the call and shows a 3-second "Attached: filename" confirmation below the select.

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx:424-437`

- [ ] **Step 1: Replace the `<select>` at lines 424–437**

The current select is:
```tsx
<select
  className={cx("fieldInput", "dlAttachSelect")}
  aria-label="Attach file to deliverable"
  value={item.fileId ?? ""}
  onChange={(event) =>
    onMilestoneAttachment(item.projectId ?? "", item.milestoneId ?? "", event.target.value || null)
  }
  disabled={!item.projectId || !item.milestoneId}
>
  <option value="">— attach a file —</option>
  {availableFiles.map((file) => (
    <option key={file.id} value={file.id}>{file.fileName}</option>
  ))}
</select>
```

Replace with:
```tsx
<select
  className={cx("fieldInput", "dlAttachSelect")}
  aria-label="Attach file to deliverable"
  value={item.fileId ?? ""}
  disabled={!item.projectId || !item.milestoneId || loadingOp === `attach-${item.milestoneId}`}
  onChange={async (event) => {
    const fileId = event.target.value || null;
    const fileName = availableFiles.find((f) => f.id === fileId)?.fileName ?? null;
    setLoadingOp(`attach-${item.milestoneId}`);
    await onMilestoneAttachment(item.projectId ?? "", item.milestoneId ?? "", fileId);
    setLoadingOp(null);
    if (fileId && fileName && item.milestoneId) {
      setAttachFeedback({ id: item.milestoneId, fileName });
      setTimeout(() => setAttachFeedback(null), 3000);
    }
  }}
>
  <option value="">— attach a file —</option>
  {availableFiles.map((file) => (
    <option key={file.id} value={file.id}>{file.fileName}</option>
  ))}
</select>
{attachFeedback?.id === item.milestoneId && (
  <span className={cx("dlAttachFeedback")}>Attached: {attachFeedback.fileName}</span>
)}
```

**Placement note:** The `{attachFeedback...}` span is inserted immediately after the closing `</select>` tag, as a sibling of `.dlAttachRow` (both are direct children of `<div className={cx("flex1")}>`). This makes it stack below the select as a block element. Do NOT nest it inside `.dlAttachRow`.

- [ ] **Step 2: Verify in browser**

Select a file from the attachment dropdown on a deliverable. Confirm:
- Select disables momentarily during the API call
- "Attached: [filename]" text appears below the select in green
- Text disappears after ~3 seconds

- [ ] **Step 3: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx
git commit -m "fix(staff): add loading state and success feedback to deliverable attachment select"
```

---

## Task 5: Wire loading state to estimate submit button

> The Submit Estimate button currently has no loading state. This task adds disabled + label change during the API call.

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx:526-535`

- [ ] **Step 1: Replace the `dlSubmitRow` div contents at lines 526–535**

Current:
```tsx
<div className={cx("dlSubmitRow")}>
  <button
    type="button"
    className={cx("button", "buttonBlue", "dlSubmitBtn")}
    onClick={() => onEstimateChangeRequest(request.id)}
  >
    <span className={cx("dlBtnIco")}><IcoSend /></span>
    Submit Estimate
  </button>
</div>
```

Replace with:
```tsx
<div className={cx("dlSubmitRow")}>
  <button
    type="button"
    className={cx("button", "buttonBlue", "dlSubmitBtn")}
    disabled={loadingOp === `estimate-${request.id}`}
    onClick={async () => {
      setLoadingOp(`estimate-${request.id}`);
      await onEstimateChangeRequest(request.id);
      setLoadingOp(null);
    }}
  >
    <span className={cx("dlBtnIco")}><IcoSend /></span>
    {loadingOp === `estimate-${request.id}` ? "Submitting…" : "Submit Estimate"}
  </button>
</div>
```

- [ ] **Step 2: Final TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

Expected: no output.

- [ ] **Step 3: Final visual check in browser**

Fill in hours, cost, and assessment for a pending change request. Click Submit Estimate. Confirm:
- Button shows "Submitting…" and disables during the API call
- Returns to "Submit Estimate" after completion

- [ ] **Step 4: Final commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx
git commit -m "fix(staff): add loading state to estimate submit button"
```
