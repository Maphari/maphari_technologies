# Deliverables Page — Production Fix & Polish

**Date:** 2026-03-27
**Status:** Approved for implementation

---

## Context

The staff dashboard's Deliverables page (`deliverables-page.tsx`) has two categories of production issues:

1. **Missing CSS classes** — seven class names referenced in JSX do not exist in `pages-h.module.css`, causing status badge chips and layout containers to render with no styling
2. **No loading/feedback states** — status update buttons, the attachment select, and the estimate submit button give no visual feedback during the request; attachment selection success is completely silent

The data contract is correct — `useStaffDeliverables` uses admin API endpoints that return the right field names. The create deliverable button already uses `creatingDeliverable` prop for loading state. The export buttons already use `generatingHandoffExport`. No backend changes are required.

**Goal:** Fix all missing CSS, update three prop types to `Promise<void>`, add per-operation loading states for the three operations that lack them (status update, attachment, estimate submit), and surface attachment success feedback.

---

## Scope

- Add 7 missing CSS classes to `pages-h.module.css`
- Update 3 prop types in `DeliverablesPageProps` from `=> void` to `=> Promise<void>`
- Add `loadingOp: string | null` state to `deliverables-page.tsx`
- Add `attachFeedback: { id: string; fileName: string } | null` state
- Wire both states into: status update buttons, attachment select, estimate submit button
- No backend changes

---

## Files to Change

| File | Change |
|------|--------|
| `apps/web/src/app/style/staff/pages-h.module.css` | Add 7 missing CSS classes |
| `apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx` | Update 3 prop types; add loading + feedback states, wire to handlers |

---

## Implementation Steps

### Step 1 — Add missing CSS classes

**File:** `apps/web/src/app/style/staff/pages-h.module.css`

Append after the existing `.dlStatusChip` base class:

```css
/* ── Status chip tones ── */
.dlStatusPending    { color: var(--amber); }
.dlStatusInProgress { color: var(--accent); }
.dlStatusCompleted  { color: var(--green); }
```

Append immediately before the `.sfLayout` block at line 2677:

```css
/* ── Action + submit rows ── */
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

/* dlComposerSubmit is a layout wrapper div around the "Create Deliverable" button */
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

### Step 2 — Update prop types from `void` to `Promise<void>`

**File:** `deliverables-page.tsx` — `DeliverablesPageProps` (lines 36, 37–41, 49)

Three handler props must return `Promise<void>` so that `await` in the onClick handlers actually waits for the operation to complete before clearing the loading state:

```ts
onMilestoneAttachment:   (projectId: string, milestoneId: string, fileId: string | null) => Promise<void>;
onMilestoneStatusUpdate: (projectId: string, milestoneId: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED") => Promise<void>;
onEstimateChangeRequest: (changeRequestId: string) => Promise<void>;
```

Also update the corresponding handler signatures in `use-staff-deliverables.ts` to ensure the functions are declared `async` (or return a `Promise`). If they already use `async` internally, only the return type annotation needs updating.

### Step 3 — Add `loadingOp` and `attachFeedback` states

**File:** `deliverables-page.tsx`

Add two new state declarations after the existing `useState` calls:

```ts
const [loadingOp, setLoadingOp]           = useState<string | null>(null);
const [attachFeedback, setAttachFeedback] = useState<{ id: string; fileName: string } | null>(null);
```

### Step 4 — Wire loading state to status update buttons

Replace the three status action buttons at lines ~441–466 with async onClick handlers:

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

### Step 5 — Wire loading state + success feedback to attachment select

Replace the `<select>` at line ~424 with an async onChange handler. The `dlAttachFeedback` span is placed as a **sibling of `.dlAttachRow`** (not inside it), so it stacks below rather than appearing inline within the flex row:

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
{/* Sibling of dlAttachRow, not inside it — stacks below */}
{attachFeedback?.id === item.milestoneId && (
  <span className={cx("dlAttachFeedback")}>Attached: {attachFeedback.fileName}</span>
)}
```

Note: `setTimeout` with `setState` on an unmounted component is a no-op in React 18 (no warning, no error). No cleanup ref needed.

### Step 6 — Wire loading state to estimate submit button

Replace the Submit Estimate button at line ~527:

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

---

## What is NOT changing

- **Create Deliverable button** — already uses `creatingDeliverable` prop and shows "Creating…". No changes needed.
- **Export buttons** — already use `generatingHandoffExport` prop and show "Generating…". No changes needed.
- **Backend** — no changes to `services/core`.

---

## Verification

1. Dev server: `pnpm dev` in `apps/web`
2. Login as staff → Project Management → Deliverables
3. Status chips render with colour: Pending = amber, In Progress = accent colour, Completed = green
4. Composer submit div and action rows are properly laid out (flex, right-aligned)
5. Click "Reopen", "Start", or "Complete" → button shows "…" and disables while the API call is in flight, re-enables after
6. Change attachment select → select disables during the call; "Attached: filename" confirmation spans below the select for 3 s then disappears
7. Fill in an estimate and click "Submit Estimate" → button shows "Submitting…" while in flight
8. TypeScript check: `pnpm --filter @maphari/web exec tsc --noEmit`
