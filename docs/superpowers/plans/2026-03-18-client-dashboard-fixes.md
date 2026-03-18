# Client Dashboard Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 9 visual/functional bugs in the client dashboard — centering issues, hardcoded data, wrong CSS classes, missing padding, non-functional button, and dynamic currency.

**Architecture:** All fixes are isolated to individual page components and CSS split-files. No shared state or cross-cutting concerns. Each task is independently testable by navigating to the relevant page.

**Tech Stack:** Next.js 16 (App Router), CSS Modules (split-file spread pattern), TypeScript, React

---

## File Map

| File | Change |
|------|--------|
| `apps/web/src/app/style/client/pages-misc.module.css` | Add `invLineCard`, `cardBodyPad`, `pt16`, `gridColSpanAll` CSS classes |
| `apps/web/src/app/style/client/pages-d.module.css` | Increase `fbCollabReactionBtn`/`fbCollabReactionBtnCenter` padding; add border-radius |
| `apps/web/src/components/client/maphari-dashboard/pages/performance-dashboard-page.tsx` | Empty state: add `gridColSpanAll` class |
| `apps/web/src/components/client/maphari-dashboard/pages/data-privacy-page.tsx` | Remove `flexCenter` from all icon+heading rows |
| `apps/web/src/components/client/maphari-dashboard/pages/integrations-page.tsx` | Verify/fix card body padding class |
| `apps/web/src/components/client/maphari-dashboard/pages/payments-page.tsx` | Fix Add Payment Method button (CSS + onClick handler) + make currency dynamic |
| `apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx` | Remove inner `<aside>` nav; remove hardcoded client-specific strings |
| `apps/web/src/components/client/maphari-dashboard/pages/feedback-page.tsx` | Remove inner `<aside>` nav |
| `apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx` | Fix any incorrect `flexCenter` centering in detail panel rows |

---

### Task 1: Add Missing CSS Utility Classes

**Files:**
- Modify: `apps/web/src/app/style/client/pages-misc.module.css`

- [ ] **Step 1: Add `invLineCard` class**

  Open `apps/web/src/app/style/client/pages-misc.module.css`. Find `.dynBorderLeft3` (search for `dynBorderLeft3`). Add `invLineCard` immediately after it:

  ```css
  .invLineCard {
    padding: 14px 16px;
    border-radius: var(--r-sm);
    background: var(--s1);
  }
  ```

- [ ] **Step 2: Add `cardBodyPad`, `pt16`, and `gridColSpanAll` utility classes**

  In the same file, add near the existing padding utilities (search for `.p16x20` around line 2032):

  ```css
  .cardBodyPad    { padding: 16px 20px; }
  .pt16           { padding-top: 16px; }
  .gridColSpanAll { grid-column: 1 / -1; }
  ```

- [ ] **Step 3: Verify TypeScript**

  Run: `pnpm --filter @maphari/web exec tsc --noEmit`
  Expected: no output (clean)

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/app/style/client/pages-misc.module.css
  git commit -m "fix(client-css): add invLineCard, cardBodyPad, pt16, gridColSpanAll utility classes"
  ```

---

### Task 2: Verify Invoices Payment Composition (Depends on Task 1)

**Files:**
- Read-only: `apps/web/src/components/client/maphari-dashboard/pages/invoices-page.tsx`

> ⚠️ **Prerequisite:** Task 1 must be committed before this task can be visually verified.

Context: `invLineCard` (added in Task 1) provides `padding: 14px 16px`, creating breathing room around the `border-left: 3px solid` from `.dynBorderLeft3`. No component changes needed.

- [ ] **Step 1: Visually verify**

  Navigate to client dashboard → Invoices page → scroll to "Payment Composition" section.
  Expected: Paid / Outstanding / Overdue items each show space between the coloured left border and the label/amount text.

  If items still appear flush, check that `invLineCard` is correctly defined by running:
  ```bash
  grep -n "invLineCard" apps/web/src/app/style/client/pages-misc.module.css
  ```

---

### Task 3: Fix Performance Dashboard Empty State Centering

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/performance-dashboard-page.tsx`

> ⚠️ **Prerequisite:** `gridColSpanAll` must be added (Task 1) before this step.

- [ ] **Step 1: Find the empty state element**

  ```bash
  grep -n "emptyState\|topCardsStack" apps/web/src/components/client/maphari-dashboard/pages/performance-dashboard-page.tsx
  ```

  Expected: A `<div className={cx("emptyState", "wFull")}>` inside the `topCardsStack` grid.

- [ ] **Step 2: Apply span class to empty state**

  Change:
  ```tsx
  <div className={cx("emptyState", "wFull")}>
  ```
  to:
  ```tsx
  <div className={cx("emptyState", "wFull", "gridColSpanAll")}>
  ```

- [ ] **Step 3: Verify TypeScript**

  Run: `pnpm --filter @maphari/web exec tsc --noEmit`
  Expected: no output

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/performance-dashboard-page.tsx
  git commit -m "fix(client): center performance dashboard empty state across full grid width"
  ```

---

### Task 4: Fix Data & Privacy — Left-Align Icon+Heading Rows

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/data-privacy-page.tsx`

Root cause: `flexCenter` = `display: flex; align-items: center; justify-content: center;` — the `justify-content: center` pushes icon and label to the middle of the cell. `flexRow` already provides `display: flex; align-items: center;` and is the correct class.

- [ ] **Step 1: Find all `flexCenter` usages in the file**

  ```bash
  grep -n "flexCenter" apps/web/src/components/client/maphari-dashboard/pages/data-privacy-page.tsx
  ```

  Note all line numbers. There may be multiple occurrences with different gap/margin combinations.

- [ ] **Step 2: Remove `flexCenter` from each icon+heading row**

  For every occurrence that represents a horizontal label row (icon next to text — not a centred hero or spinner), remove the `"flexCenter"` argument from `cx(...)`. Leave all other arguments unchanged.

  Example — if line 193 has:
  ```tsx
  cx("flexRow", "flexCenter", "gap6", "mb3")
  ```
  change to:
  ```tsx
  cx("flexRow", "gap6", "mb3")
  ```

  Do NOT remove `flexCenter` from elements that intentionally centre their content (e.g. loading spinners, empty state icons). Use judgement based on context.

- [ ] **Step 3: Verify TypeScript**

  Run: `pnpm --filter @maphari/web exec tsc --noEmit`
  Expected: no output

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/data-privacy-page.tsx
  git commit -m "fix(client): left-align icon+heading rows in data-privacy page (remove flexCenter)"
  ```

---

### Task 5: Fix Integrations Page Card Body Padding

**Files:**
- Modify (if needed): `apps/web/src/components/client/maphari-dashboard/pages/integrations-page.tsx`

> ⚠️ **Prerequisite:** Task 1 must be committed first (adds `cardBodyPad` and `pt16`).

- [ ] **Step 1: Check that the TSX references the padding classes**

  ```bash
  grep -n "cardBodyPad\|pt16\|p16x20" apps/web/src/components/client/maphari-dashboard/pages/integrations-page.tsx
  ```

  **If lines are found** with `cardBodyPad`/`pt16` → Task 1's CSS addition is sufficient. Skip to Step 3.

  **If no lines are found** → the classes are not used; proceed to Step 2.

- [ ] **Step 2: (Conditional) Add padding class to integration card body**

  If Step 1 found no usage, find the integration card body wrapper element (likely a `<div>` wrapping each provider's details below the header row). Replace whatever class is currently on it with `cx("p16x20")` (already defined in pages-misc.module.css):

  ```tsx
  // Before (example — check actual line):
  <div className={cx("someClass")}>

  // After:
  <div className={cx("p16x20")}>
  ```

- [ ] **Step 3: Verify TypeScript**

  Run: `pnpm --filter @maphari/web exec tsc --noEmit`
  Expected: no output

- [ ] **Step 4: Commit (only if component was changed)**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/integrations-page.tsx
  git commit -m "fix(client): add padding to integration card bodies"
  ```

---

### Task 6: Fix Feedback Page — Remove Inner Aside Nav & Increase Reaction Padding

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/feedback-page.tsx`
- Modify: `apps/web/src/app/style/client/pages-d.module.css`

The feedback page has BOTH an inner `<aside className={styles.fbCollabSidebar}>` AND top horizontal tabs — duplicate navigation. The aside must be removed.

- [ ] **Step 1: Read current layout structure**

  ```bash
  grep -n "fbCollabLayout\|fbCollabSidebar\|aside\|fbCollabRoot" apps/web/src/components/client/maphari-dashboard/pages/feedback-page.tsx | head -20
  ```

- [ ] **Step 2: Remove the inner `<aside>` element and layout wrapper**

  In `feedback-page.tsx`, find:
  ```tsx
  <div className={styles.fbCollabLayout}>
    <aside className={styles.fbCollabSidebar}>
      ...sidebar nav items...
    </aside>
    <section ...>
      ...content...
    </section>
  </div>
  ```

  Remove the `<aside>` block entirely. Remove the `fbCollabLayout` wrapper div. The `<section>` (content area) becomes the direct child of `fbCollabRoot`. Result:
  ```tsx
  <div className={cx("pageBody", styles.fbCollabRoot)}>
    <section ...>
      ...top tabs + content panels...
    </section>
  </div>
  ```

- [ ] **Step 3: Increase reaction button padding in pages-d.module.css**

  Find lines 3128–3139 (the combined `.fbCollabReactionBtn, .fbCollabReactionBtnCenter` rule):

  ```css
  .fbCollabReactionBtn,
  .fbCollabReactionBtnCenter {
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    padding: 8px 12px;        /* ← change this */
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
  }
  ```

  Change `padding: 8px 12px;` to `padding: 10px 16px;` and add `border-radius: var(--r-sm);` on the next line:

  ```css
  .fbCollabReactionBtn,
  .fbCollabReactionBtnCenter {
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    padding: 10px 16px;
    border-radius: var(--r-sm);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
  }
  ```

  Do NOT split the combined selector — both button variants should share these values.

- [ ] **Step 4: Verify TypeScript**

  Run: `pnpm --filter @maphari/web exec tsc --noEmit`
  Expected: no output

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/feedback-page.tsx \
          apps/web/src/app/style/client/pages-d.module.css
  git commit -m "fix(client): remove duplicate aside nav on feedback page; increase reaction button padding and add border-radius"
  ```

---

### Task 7: Fix Onboarding Hub — Remove Inner Aside Nav & Hardcoded Client-Specific Strings

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx`

The page has a `<aside className={styles.onboardFlowSidebar}>` with duplicate nav (also present as top tabs). The aside must be removed. The page also contains client-specific hardcoded strings ("Veldt Finance", "Naledi", team member names, "R 80,000") that should be replaced.

> ⚠️ **Note on session data:** `AuthUser` only has `id`, `email`, `role`, `clientId` — no `name` or `companyName`. Do NOT attempt to read name/company from `session.user`. Instead, replace hardcoded strings with generic context-appropriate placeholders or derive from `session.user.email` where natural.

- [ ] **Step 1: Read lines 100–170 to understand layout**

  Read `apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx` offset 100, limit 70.

- [ ] **Step 2: Remove inner `<aside>` sidebar and its layout wrapper**

  Find:
  ```tsx
  <div className={styles.onboardFlowLayout}>
    <aside className={styles.onboardFlowSidebar}>
      ...nav items...
    </aside>
    ...content...
  </div>
  ```

  Remove the `<aside>` block entirely. Remove the `onboardFlowLayout` wrapper. The content section (tabs + panels) becomes the direct child of `onboardFlowRoot`.

- [ ] **Step 3: Find and replace hardcoded client-specific strings**

  ```bash
  grep -n "Veldt Finance\|Naledi\|Sipho\|Lerato\|Mahlangu\|Thabo\|80,000\|R 80" apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx
  ```

  For each hardcoded name/company/budget:
  - Company name (e.g. "Veldt Finance") → replace with `"Your Company"`
  - Client first name (e.g. "Naledi") → replace with `"Client"`
  - Team member names (Sipho, Lerato, James, Thabo) → these are "Your Team" members, replace with generic role labels: `"Project Lead"`, `"Designer"`, `"Developer"`, `"Strategist"` or remove the names and keep only the roles
  - Budget (e.g. `"R 80,000"`) → replace with `"—"` (data not available in session)

  Add a comment above replaced blocks:
  ```tsx
  {/* TODO: Replace with real project data once portal data API is wired */}
  ```

  Note: `CHECKLIST_SEED`, `PROCESS_STEPS`, and `WRAP_ITEMS` are process-scaffolding (generic UX steps), not client-specific data — leave them unchanged.

- [ ] **Step 4: Verify TypeScript**

  Run: `pnpm --filter @maphari/web exec tsc --noEmit`
  Expected: no output

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx
  git commit -m "fix(client): remove duplicate aside nav in onboarding hub; replace hardcoded client data with generic placeholders"
  ```

---

### Task 8: Fix Payments — Currency Dynamic + Add Payment Method Button

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/payments-page.tsx`

Two bugs:
1. Currency is hardcoded `R` / `en-ZA` instead of using env vars (unlike invoices-page.tsx which already uses env vars correctly)
2. "Add Payment Method" button uses `uploadDropZone` (dashed upload-zone styling) and has no `onClick` handler

- [ ] **Step 1: Fix currency constants at top of file**

  Find (around lines 55–56):
  ```tsx
  const fmt    = (n: number) => `R ${n.toLocaleString("en-ZA")}`;
  const fmtDec = (n: number) => `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  ```

  Replace with:
  ```tsx
  const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? "R";
  const LOCALE          = process.env.NEXT_PUBLIC_LOCALE          ?? "en-ZA";
  const fmt    = (n: number) => `${CURRENCY_SYMBOL} ${n.toLocaleString(LOCALE)}`;
  const fmtDec = (n: number) => `${CURRENCY_SYMBOL} ${n.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  ```

- [ ] **Step 2: Fix the `fmtMoney` inline function**

  Search for any other hardcoded `"R"` or `"en-ZA"` in the file:
  ```bash
  grep -n '"R "\|"en-ZA"' apps/web/src/components/client/maphari-dashboard/pages/payments-page.tsx
  ```

  For each occurrence, replace with `CURRENCY_SYMBOL` and `LOCALE` variables (defined in Step 1).

- [ ] **Step 3: Fix the Add Payment Method button**

  Find:
  ```tsx
  <button type="button" className={cx("btnGhost", "uploadDropZone")}>
    <Ic n="plus" sz={18} c="var(--muted2)" />
    <span className={cx("text10", "colorMuted")}>Add Payment Method</span>
  </button>
  ```

  Replace with:
  ```tsx
  <button
    type="button"
    className={cx("btnOutline", "gap6", "text11", "fw500")}
    onClick={() => {
      // TODO: wire to payment method modal/flow when implemented
      window.alert("Add Payment Method flow coming soon.");
    }}
  >
    <Ic n="plus" sz={14} c="currentColor" />
    Add Payment Method
  </button>
  ```

- [ ] **Step 4: Verify TypeScript**

  Run: `pnpm --filter @maphari/web exec tsc --noEmit`
  Expected: no output

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/payments-page.tsx
  git commit -m "fix(client): dynamic currency on payments page; fix Add Payment Method button styling and add placeholder handler"
  ```

---

### Task 9: Meeting Intelligence Hub — Fix Incorrect Row Centering

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx`

The page may have `cx("flexRow", "flexCenter", ...)` usages in detail panel rows that should be left-aligned (not horizontally centred). `flexCenter` adds `justify-content: center` — wrong for label/icon rows.

- [ ] **Step 1: Find all `flexCenter` usages**

  ```bash
  grep -n "flexCenter" apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx
  ```

  If no results → skip to Step 4 (no changes needed, do NOT create an empty commit).

- [ ] **Step 2: Audit each occurrence**

  Read the surrounding context for each line. For rows that are icon+label combos (should be left-aligned), remove `"flexCenter"`. Leave `flexCenter` on genuinely centred elements (spinners, empty state icons).

- [ ] **Step 3: Verify TypeScript (only if changes were made)**

  Run: `pnpm --filter @maphari/web exec tsc --noEmit`
  Expected: no output

- [ ] **Step 4: Commit (only if changes were made in Step 2)**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx
  git commit -m "fix(client): remove incorrect horizontal centering in meeting-archive detail panel rows"
  ```

---

### Task 10: Final Verification Pass

- [ ] **Step 1: Run TypeScript check one final time**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no output

- [ ] **Step 2: Manually verify all fixes**

  Navigate to each page and confirm:
  - [ ] Invoices → Payment Composition: space between left border and text ✓
  - [ ] Performance Dashboard → KPI section: empty state spans full width and is centred ✓
  - [ ] Data & Privacy → "Data We Hold About You": icon+heading is left-aligned ✓
  - [ ] Integrations: card bodies have padding (not flush against card border) ✓
  - [ ] Feedback: no aside sidebar visible; reaction buttons have comfortable padding and border-radius ✓
  - [ ] Onboarding Hub: no aside sidebar visible; no hardcoded "Veldt Finance"/"Naledi" text ✓
  - [ ] Payments: "Add Payment Method" button is styled as a normal button, shows feedback on click ✓
  - [ ] Payments: currency uses `NEXT_PUBLIC_CURRENCY_SYMBOL` env var ✓
  - [ ] Meeting Archive: icon+label rows in detail panel are left-aligned ✓
