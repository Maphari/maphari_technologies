# Frontend Design Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate all 21 new dashboard pages from functional-first to production-grade UI — fixing inline styles, missing loading/error/empty states, hover interactions, micro-animations, confirmation dialogs, and accessibility gaps identified in the audit.

**Architecture:** Three-pass approach: (1) build shared primitive components used everywhere, (2) fix pages in parallel batches grouped by dashboard, (3) cross-cutting polish (animations, hover states, aria). Each task is independently deployable with zero regressions.

**Tech Stack:** Next.js 16, CSS Modules, TypeScript, React 18 hooks, existing design token system (`--s1`–`--s4`, `--b1`–`--b3`, `--lime`/`--accent`/`--green`/`--amber`/`--red`), `cx()` helper via `createCx(styles)`.

**TypeScript check:** `pnpm --filter @maphari/web exec tsc --noEmit` — must pass after every task.

---

## File Map

### Created
- `apps/web/src/components/shared/ui/alert.tsx` — error/warning/info alert banner
- `apps/web/src/components/shared/ui/confirm-dialog.tsx` — "Are you sure?" modal
- `apps/web/src/components/shared/ui/tooltip.tsx` — hover tooltip wrapper
- `apps/web/src/components/shared/ui/page-skeleton.tsx` — reusable skeleton blocks

### Modified (CSS)
- `apps/web/src/app/style/shared/utilities.module.css` — skeleton, alert, tooltip, confirm classes
- `apps/web/src/app/style/admin.module.css` — row hover, focus, transition utilities
- `apps/web/src/app/style/admin/pages-misc.module.css` — webhook hub CSS classes (replacing inline styles)
- `apps/web/src/app/style/admin/pages-a.module.css` — pipeline, capacity, profitability CSS polish
- `apps/web/src/app/style/staff/maphari-staff-dashboard.module.css` — staff page polish CSS
- `apps/web/src/app/style/client/pages-misc.module.css` — client page polish CSS
- `apps/web/src/app/style/client/pages-a.module.css` — approvals, activity feed polish

### Modified (Components)
- `apps/web/src/components/shared/ui/theme-toggle.tsx` — replace emoji with SVG, add aria-labels, CSS classes
- `apps/web/src/components/shared/ui/signature-pad.tsx` — theme-aware stroke color, undo, canvas bg
- `apps/web/src/components/shared/ui/comment-thread.tsx` — avatar colors, send disabled state, scroll UX
- `apps/web/src/components/admin/dashboard/pages/webhook-hub-page.tsx` — remove 200+ inline style objects
- `apps/web/src/components/admin/dashboard/pages/pipeline-analytics-page.tsx` — skeleton, tooltips, inline → CSS
- `apps/web/src/components/admin/dashboard/pages/capacity-forecast-page.tsx` — skeleton, inline → CSS
- `apps/web/src/components/admin/dashboard/pages/invoice-chasing-page.tsx` — row hover, focus, responsive
- `apps/web/src/components/admin/dashboard/pages/staff-utilisation-page.tsx` — row hover, avatar CSS, tooltip
- `apps/web/src/components/admin/dashboard/pages/profitability-per-client-page.tsx` — inline → CSS, tab animation
- `apps/web/src/components/admin/dashboard/pages/profitability-per-project-page.tsx` — chevron, drill-down skeleton
- `apps/web/src/components/staff/staff-dashboard/pages/workload-heatmap-page.tsx` — cell tooltips, responsive
- `apps/web/src/components/staff/staff-dashboard/pages/sprint-burndown-page.tsx` — chart skeleton, legend, animation
- `apps/web/src/components/staff/staff-dashboard/pages/my-reports-page.tsx` — modal polish, confirm on delete
- `apps/web/src/components/staff/staff-dashboard/pages/auto-draft-updates-page.tsx` — selection CSS, char limit
- `apps/web/src/components/staff/staff-dashboard/pages/private-notes-page.tsx` — confirm delete, hover, CSS
- `apps/web/src/components/client/maphari-dashboard/pages/activity-feed-page.tsx` — live relative time, CSS dots
- `apps/web/src/components/client/maphari-dashboard/pages/project-roadmap-page.tsx` — bounds check, skeleton
- `apps/web/src/components/client/maphari-dashboard/pages/approvals-page.tsx` — remove emoji, tab animation, chevrons
- `apps/web/src/components/client/maphari-dashboard/pages/satisfaction-survey-page.tsx` — star color CSS, confirm

---

## Task 1: Shared Primitive Components

**Files:**
- Create: `apps/web/src/components/shared/ui/alert.tsx`
- Create: `apps/web/src/components/shared/ui/confirm-dialog.tsx`
- Create: `apps/web/src/components/shared/ui/tooltip.tsx`
- Create: `apps/web/src/components/shared/ui/page-skeleton.tsx`
- Modify: `apps/web/src/app/style/shared/utilities.module.css`

- [ ] **Step 1: Add CSS classes to utilities.module.css**

Append at end of `apps/web/src/app/style/shared/utilities.module.css`:

```css
/* ── Alert ───────────────────────────────────────────────────── */
.alertWrap { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: var(--r-sm); border: 1px solid; margin-bottom: 16px; font-size: 0.82rem; line-height: 1.5; }
.alertError { background: color-mix(in srgb, var(--red, #ef4444) 10%, transparent); border-color: color-mix(in srgb, var(--red, #ef4444) 30%, transparent); color: var(--text); }
.alertWarn  { background: color-mix(in srgb, var(--amber, #f59e0b) 10%, transparent); border-color: color-mix(in srgb, var(--amber, #f59e0b) 30%, transparent); color: var(--text); }
.alertInfo  { background: color-mix(in srgb, var(--accent, #8b6fff) 10%, transparent); border-color: color-mix(in srgb, var(--accent, #8b6fff) 30%, transparent); color: var(--text); }
.alertIcon  { font-size: 0.9rem; flex-shrink: 0; margin-top: 1px; }
.alertRetry { margin-top: 6px; font-size: 0.75rem; text-decoration: underline; cursor: pointer; color: var(--text-muted); background: none; border: none; padding: 0; }

/* ── Confirm Dialog ──────────────────────────────────────────── */
.confirmOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.12s ease; }
.confirmBox { background: var(--s1); border: 1px solid var(--b2); border-radius: var(--r-lg); padding: 28px; max-width: 400px; width: 100%; box-shadow: var(--shadow-modal); }
.confirmTitle { font-size: 1rem; font-weight: 700; margin-bottom: 8px; }
.confirmBody  { font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 24px; }
.confirmActions { display: flex; gap: 8px; justify-content: flex-end; }

/* ── Tooltip ─────────────────────────────────────────────────── */
.tipWrap { position: relative; display: inline-flex; align-items: center; }
.tipBox { position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: var(--s4); color: var(--text); font-size: 0.72rem; padding: 5px 9px; border-radius: var(--r-xs, 6px); white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s; z-index: 9999; box-shadow: var(--shadow-card); border: 1px solid var(--b2); max-width: 220px; white-space: normal; text-align: center; }
.tipWrap:hover .tipBox { opacity: 1; }

/* ── Page Skeletons ──────────────────────────────────────────── */
.skelLine { background: var(--s3); border-radius: 4px; animation: skelPulse 1.6s ease-in-out infinite; }
.skelCircle { background: var(--s3); border-radius: 50%; animation: skelPulse 1.6s ease-in-out infinite; }
.skelCard { background: var(--s2); border: 1px solid var(--b1); border-radius: var(--r-md); padding: 20px; animation: skelPulse 1.6s ease-in-out infinite; }
.skelRow { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--b1); }
@keyframes skelPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* ── Row interactions ────────────────────────────────────────── */
.rowHover { transition: background 0.12s ease; cursor: default; }
.rowHover:hover { background: var(--s2); }
.rowClickable { cursor: pointer; }
.rowClickable:hover { background: var(--s2); }

/* ── Tab content animation ───────────────────────────────────── */
.tabContent { animation: tabFadeIn 0.15s ease; }
@keyframes tabFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

/* ── Chevron toggle ──────────────────────────────────────────── */
.chevron { transition: transform 0.2s ease; display: inline-block; font-size: 0.75rem; color: var(--text-muted); }
.chevronOpen { transform: rotate(90deg); }
```

- [ ] **Step 2: Create alert.tsx**

```tsx
// apps/web/src/components/shared/ui/alert.tsx
"use client";
import { createCx } from "@/lib/utils/cx";
import styles from "@/app/style/shared/utilities.module.css";
const cx = createCx(styles);

interface AlertProps {
  variant: "error" | "warn" | "info";
  message: string;
  onRetry?: () => void;
}

const ICONS = { error: "✕", warn: "!", info: "i" };

export function Alert({ variant, message, onRetry }: AlertProps) {
  const variantClass = variant === "error" ? "alertError" : variant === "warn" ? "alertWarn" : "alertInfo";
  return (
    <div className={cx("alertWrap", variantClass)} role="alert">
      <span className={cx("alertIcon")} aria-hidden="true">{ICONS[variant]}</span>
      <div>
        {message}
        {onRetry && <button className={cx("alertRetry")} onClick={onRetry}>Try again</button>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create confirm-dialog.tsx**

```tsx
// apps/web/src/components/shared/ui/confirm-dialog.tsx
"use client";
import { useEffect } from "react";
import { createCx } from "@/lib/utils/cx";
import styles from "@/app/style/shared/utilities.module.css";
const cx = createCx(styles);

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", danger, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className={cx("confirmOverlay")} onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className={cx("confirmBox")} onClick={e => e.stopPropagation()}>
        <div className={cx("confirmTitle")} id="confirm-title">{title}</div>
        {body && <div className={cx("confirmBody")}>{body}</div>}
        <div className={cx("confirmActions")}>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: "var(--r-sm)", border: "1px solid var(--b2)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.82rem" }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} style={{ padding: "8px 16px", borderRadius: "var(--r-sm)", border: "none", background: danger ? "var(--red, #ef4444)" : "var(--accent, #8b6fff)", color: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create tooltip.tsx**

```tsx
// apps/web/src/components/shared/ui/tooltip.tsx
import { createCx } from "@/lib/utils/cx";
import styles from "@/app/style/shared/utilities.module.css";
const cx = createCx(styles);

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className={cx("tipWrap")}>
      {children}
      <span className={cx("tipBox")} role="tooltip">{label}</span>
    </span>
  );
}
```

- [ ] **Step 5: Create page-skeleton.tsx**

```tsx
// apps/web/src/components/shared/ui/page-skeleton.tsx
import { createCx } from "@/lib/utils/cx";
import styles from "@/app/style/shared/utilities.module.css";
const cx = createCx(styles);

export function SkeletonLine({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return <div className={cx("skelLine")} style={{ width, height, marginBottom: 8 }} />;
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className={cx("skelCard")}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? "40%" : i % 2 === 0 ? "70%" : "55%"} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={cx("skelRow")}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} width={c === 0 ? "160px" : "80px"} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Run tsc and verify**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: no output (zero errors).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/style/shared/utilities.module.css \
  apps/web/src/components/shared/ui/alert.tsx \
  apps/web/src/components/shared/ui/confirm-dialog.tsx \
  apps/web/src/components/shared/ui/tooltip.tsx \
  apps/web/src/components/shared/ui/page-skeleton.tsx
git commit -m "feat(ui): add shared Alert, ConfirmDialog, Tooltip, Skeleton primitives"
```

---

## Task 2: Fix Shared Components (ThemeToggle, SignaturePad, CommentThread)

**Files:**
- Modify: `apps/web/src/components/shared/ui/theme-toggle.tsx`
- Modify: `apps/web/src/components/shared/ui/signature-pad.tsx`
- Modify: `apps/web/src/components/shared/ui/comment-thread.tsx`
- Modify: `apps/web/src/app/style/shared/utilities.module.css` (add theme-toggle CSS)

- [ ] **Step 1: Add CSS classes for ThemeToggle + CommentThread to utilities.module.css**

Append:
```css
/* ── Theme Toggle ────────────────────────────────────────────── */
.ttPill { display: flex; gap: 3px; background: var(--s2); border-radius: var(--r-sm); padding: 3px; border: 1px solid var(--b1); }
.ttBtn { display: flex; align-items: center; justify-content: center; width: 28px; height: 24px; border-radius: var(--r-xs, 6px); border: none; cursor: pointer; background: transparent; color: var(--text-muted); transition: background 0.12s, color 0.12s; }
.ttBtn:hover { background: var(--s3); color: var(--text); }
.ttBtnActive { background: var(--s4); color: var(--text); }
.ttBtn svg { width: 14px; height: 14px; }

/* ── Comment Thread avatar colours ──────────────────────────── */
.ctAvatarA { background: color-mix(in srgb, var(--accent, #8b6fff) 20%, transparent); color: var(--accent, #8b6fff); }
.ctAvatarB { background: color-mix(in srgb, var(--green, #24b8a8) 20%, transparent); color: var(--green, #24b8a8); }
.ctAvatarC { background: color-mix(in srgb, var(--amber, #f59e0b) 20%, transparent); color: var(--amber, #f59e0b); }
.ctAvatarD { background: color-mix(in srgb, var(--red, #ef4444) 20%, transparent); color: var(--red, #ef4444); }
```

- [ ] **Step 2: Rewrite theme-toggle.tsx — replace inline styles + emoji with SVG icons + aria**

Replace entire file content with:
```tsx
"use client";
import { createCx } from "@/lib/utils/cx";
import styles from "@/app/style/shared/utilities.module.css";
import { useTheme, type Theme } from "@/lib/hooks/use-theme";
const cx = createCx(styles);

const SunIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/>
    <line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/>
    <line x1="3" y1="3" x2="4.5" y2="4.5"/><line x1="11.5" y1="11.5" x2="13" y2="13"/>
    <line x1="13" y1="3" x2="11.5" y2="4.5"/><line x1="4.5" y1="11.5" x2="3" y2="13"/>
  </svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M6 2a6 6 0 1 0 8 8 5 5 0 0 1-8-8z"/></svg>
);
const SystemIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="1" y="2" width="14" height="10" rx="2"/><line x1="5" y1="15" x2="11" y2="15"/><line x1="8" y1="12" x2="8" y2="15"/>
  </svg>
);

const OPTIONS: { value: Theme; label: string; Icon: React.FC }[] = [
  { value: "light",  label: "Light mode",  Icon: SunIcon    },
  { value: "dark",   label: "Dark mode",   Icon: MoonIcon   },
  { value: "system", label: "System mode", Icon: SystemIcon },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className={[cx("ttPill"), className].filter(Boolean).join(" ")} role="group" aria-label="Theme selector">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button key={value} className={cx("ttBtn", theme === value ? "ttBtnActive" : "")}
          onClick={() => setTheme(value)} aria-label={label} aria-pressed={theme === value} title={label}>
          <Icon />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Fix signature-pad.tsx — theme-aware stroke, canvas bg, undo support**

Read `apps/web/src/components/shared/ui/signature-pad.tsx`. Add these improvements:
1. Change `ctx.strokeStyle = "#0d0d0f"` → `ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#0d0d0f"`
2. Add `ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--s1").trim() || "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height)` in the setup effect to give canvas a background
3. Add undo stack: `const strokes = useRef<ImageData[]>([])`. Before each `beginPath`, save canvas state: `strokes.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))`. Add undo button that pops the stack and restores.

- [ ] **Step 4: Fix comment-thread.tsx — avatar color variety, disabled send, scroll UX**

Read `apps/web/src/components/shared/ui/comment-thread.tsx`. Make these changes:
1. Avatar color: pick class based on `authorName.charCodeAt(0) % 4` → `ctAvatarA/B/C/D`
2. Send button: add `disabled={sending || !draft.trim()}` and opacity/cursor CSS when disabled
3. After posting, scroll the list div to bottom: `listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })`

- [ ] **Step 5: Run tsc**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/style/shared/utilities.module.css \
  apps/web/src/components/shared/ui/theme-toggle.tsx \
  apps/web/src/components/shared/ui/signature-pad.tsx \
  apps/web/src/components/shared/ui/comment-thread.tsx
git commit -m "fix(ui): polish ThemeToggle, SignaturePad, CommentThread shared components"
```

---

## Task 3: Admin Pages — Webhook Hub (Biggest inline style offender)

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/webhook-hub-page.tsx`
- Modify: `apps/web/src/app/style/admin/pages-misc.module.css`

- [ ] **Step 1: Audit webhook-hub-page.tsx inline styles**

Read the file. Identify every `style={{...}}` block. Group them into:
- Layout wrappers → add to `pages-misc.module.css` as `.whXxx` classes
- Button styles → use existing `btnSm`/`btnGhost`/`btnDanger` from admin CSS
- Form inputs → use existing admin form input classes or add `.whInput`, `.whSelect`
- Badge/chip styles → use `badgeMuted`, `badgeAmber`, `badgeRed`, `badgeGreen`

- [ ] **Step 2: Add missing CSS classes to pages-misc.module.css**

Append to the Webhook Hub block:
```css
.whInput { width: 100%; padding: 9px 12px; background: var(--s2); border: 1px solid var(--b2); border-radius: var(--r-sm); color: var(--text); font-size: 0.83rem; transition: border-color 0.15s; box-sizing: border-box; }
.whInput:focus { border-color: var(--b3); outline: none; }
.whSelect { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23888' d='M6 8L0 0h12z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px; }
.whEventBadge { font-size: 0.65rem; padding: 2px 7px; border-radius: 10px; background: var(--s3); color: var(--text-muted); margin: 2px; display: inline-block; }
.whTestOk  { color: var(--green, #24b8a8); font-weight: 600; }
.whTestErr { color: var(--red, #ef4444); font-weight: 600; }
.whModalOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.whModalBox { background: var(--s1); border: 1px solid var(--b2); border-radius: var(--r-lg); padding: 28px; max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-modal); }
.whEventCheckGroup { display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; padding: 8px; background: var(--s2); border-radius: var(--r-sm); border: 1px solid var(--b1); }
.whCheckRow { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; padding: 3px 0; cursor: pointer; }
.whCheckRow:hover { color: var(--text); }
.whCardActions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.whSecretHint { font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; }
```

- [ ] **Step 3: Replace all `style={{...}}` in webhook-hub-page.tsx with CSS classes**

For each inline style block:
- Container divs with `display: flex, gap: X` → use existing `row`, `gap-X` utils or create `.whRow`
- Button with red color → `cx("btnSm", "btnDanger")` or `cx("btnGhost")`
- Event subscriptions count `style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}` → `cx("textMuted", "textXs")`
- Form field wrappers → `cx("whInput")`
- Modal overlay → `cx("whModalOverlay")`
- Add `<ConfirmDialog>` for webhook delete action
- Add `<Alert variant="error">` for API load failures instead of just `onNotify`

- [ ] **Step 4: Run tsc**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/style/admin/pages-misc.module.css" \
  "apps/web/src/components/admin/dashboard/pages/webhook-hub-page.tsx"
git commit -m "fix(admin): replace inline styles in webhook-hub-page with CSS classes"
```

---

## Task 4: Admin Pages — Analytics & Finance Polish

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/staff-utilisation-page.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/capacity-forecast-page.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/pipeline-analytics-page.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/invoice-chasing-page.tsx`
- Modify: `apps/web/src/app/style/admin.module.css` (add rowHover to admin)

- [ ] **Step 1: Add row hover + focus + animation utilities to admin.module.css**

Append:
```css
/* Row interactions */
.tableRow { transition: background 0.12s; }
.tableRow:hover { background: var(--s2); }
.tableRowClickable { cursor: pointer; }
.tableRowClickable:hover { background: var(--s2); }

/* Expandable chevron */
.expandChevron { display: inline-flex; align-items: center; transition: transform 0.2s ease; color: var(--text-muted); margin-right: 6px; }
.expandChevronOpen { transform: rotate(90deg); }

/* Tab animation */
.tabPane { animation: tabFadeIn 0.15s ease; }
@keyframes tabFadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }

/* Inline bar colours (replace inline styles) */
.barGreen { background: var(--green, #24b8a8); }
.barAmber { background: var(--amber, #f59e0b); }
.barRed   { background: var(--red, #ef4444); }
.barAccent { background: var(--accent, #8b6fff); }
```

- [ ] **Step 2: Fix staff-utilisation-page.tsx**

Read the file. Make these targeted changes:
1. Replace `style={{ width: X, height: Y, borderRadius: Z, background: row.avatarColor }}` on avatar cells with `cx("sutAvatar")` — add `.sutAvatar { width: 28px; height: 28px; border-radius: 8px; }` to admin.module.css
2. Add `<SkeletonTable rows={5} cols={6} />` from page-skeleton.tsx instead of current skeleton
3. Add `<Tooltip label="Percentage points above/below 75% target">` around the `vs Target` column header
4. Add `cx("tableRow")` class to each `<tr>` in the utilisation table for hover state
5. Wrap period selector in a proper form-row div using CSS class, not inline flex

- [ ] **Step 3: Fix capacity-forecast-page.tsx**

1. Replace all `style={{ width: barPct + "%" }}` mini-bars with `style={{ "--bar-w": barPct + "%" } as React.CSSProperties}` + CSS class `.cfMiniBarFill { width: var(--bar-w); }` — cleaner CSS custom property approach
2. Replace `style={{ color: ... }}` surplus labels with `cx("cfSurplusPos")` / `cx("cfSurplusNeg")`
3. Add `<SkeletonTable rows={4} cols={5} />` while loading staff table
4. Add `cx("tableRow")` to staff forecast rows

- [ ] **Step 4: Fix pipeline-analytics-page.tsx**

1. Replace `style={{ flexBasis: stage.widthPct + "%" }}` with CSS custom property approach
2. Add `<Tooltip label="Conversion rate from previous stage">` around each funnel stage rate
3. Replace `style={{ height: wonH }}` on trend bars with CSS custom property
4. Add `<SkeletonCard rows={3} />` while loading funnel
5. Replace `color: kpi.color` inline with `cx(kpi.color === "green" ? "textGreen" : kpi.color === "red" ? "textRed" : "textAmber")` — add `.textGreen { color: var(--green); }` etc. to utilities.module.css

- [ ] **Step 5: Fix invoice-chasing-page.tsx**

1. Add `cx("tableRow")` to table rows for hover
2. Add `tabIndex={0}` and `:focus-visible` CSS to "Send Now" / "Pause" / "Resume" buttons
3. Fix the chase sequence track: replace inline `style={{ display: "flex", alignItems: "center" }}` with `cx("icSequenceTrack")`
4. Add `<ConfirmDialog>` for "Send Now" confirmation: "Send reminder email to client now?"
5. Add `<Tooltip label="Click to send an overdue reminder email">` around Send Now button

- [ ] **Step 6: Run tsc**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/style/admin.module.css \
  "apps/web/src/components/admin/dashboard/pages/staff-utilisation-page.tsx" \
  "apps/web/src/components/admin/dashboard/pages/capacity-forecast-page.tsx" \
  "apps/web/src/components/admin/dashboard/pages/pipeline-analytics-page.tsx" \
  "apps/web/src/components/admin/dashboard/pages/invoice-chasing-page.tsx"
git commit -m "fix(admin): row hover, skeletons, tooltips, inline style removal on analytics pages"
```

---

## Task 5: Admin Pages — Profitability P&L Polish

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/profitability-per-client-page.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/profitability-per-project-page.tsx`
- Modify: `apps/web/src/app/style/admin/pages-a.module.css`

- [ ] **Step 1: Add CSS to pages-a.module.css**

Append:
```css
/* Profitability polish */
.ppcDrillRow { background: var(--s2); animation: tabFadeIn 0.15s ease; }
.ppcDrillRow:not(:last-child) { border-bottom: 1px solid var(--b1); }
.ppcRowExpanded { background: color-mix(in srgb, var(--accent, #8b6fff) 5%, transparent); }
.pppProgressLabel { font-size: 0.68rem; color: var(--text-muted); margin-top: 2px; }
.pppVarianceOver { color: var(--red, #ef4444); font-size: 0.75rem; font-weight: 600; }
.pppVarianceOk   { color: var(--green, #24b8a8); font-size: 0.75rem; }
```

- [ ] **Step 2: Fix profitability-per-client-page.tsx**

1. Replace inline `style={{ width: X + "%" }}` on margin bars with CSS custom property `--bar-w` + class
2. Add `cx("tableRow", "tableRowClickable")` to client rows
3. Replace tab content div with `cx("tabPane")` for fade animation
4. Add `<Alert variant="error" message="..." onRetry={load}>` for API load failure
5. Fix LTV cards: replace hardcoded `"R${x}k"` format with `new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", notation: "compact" }).format(x)`

- [ ] **Step 3: Fix profitability-per-project-page.tsx**

1. Add expand chevron `▶` in the toggle cell, wrapped in `cx("expandChevron", expanded ? "expandChevronOpen" : "")`
2. Add `cx("ppcDrillRow")` animation class to the drill-down row
3. Add `<SkeletonCard rows={2} />` inside collapsed drill-down until data loads
4. Add `cx("tableRow", "tableRowClickable")` to project rows
5. Add `<ConfirmDialog>` before any "Reset" or destructive action on a project budget

- [ ] **Step 4: Run tsc**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/style/admin/pages-a.module.css" \
  "apps/web/src/components/admin/dashboard/pages/profitability-per-client-page.tsx" \
  "apps/web/src/components/admin/dashboard/pages/profitability-per-project-page.tsx"
git commit -m "fix(admin): expand chevrons, drill-down animation, tab fade, currency formatting on P&L pages"
```

---

## Task 6: Staff Pages — Workload Heatmap + Sprint Burndown Polish

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/workload-heatmap-page.tsx`
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/sprint-burndown-page.tsx`
- Modify: `apps/web/src/app/style/staff/maphari-staff-dashboard.module.css`

- [ ] **Step 1: Add CSS to staff CSS file**

Append to staff CSS:
```css
/* Workload heatmap polish */
.wlhCellTip { font-size: 0.68rem; color: var(--text-muted); display: block; margin-top: 2px; }
.wlhTableWrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

/* Sprint burndown polish */
.sbdLegend { display: flex; align-items: center; gap: 16px; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 8px; }
.sbdLegendDot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 4px; }
.sbdLegendIdeal { background: var(--b3); }
.sbdLegendActual { background: var(--accent, #c8f135); }
.sbdLegendRisk { background: var(--amber, #f59e0b); opacity: 0.6; }
.sbdChartWrap { position: relative; }
.sbdNoData { display: flex; align-items: center; justify-content: center; height: 220px; color: var(--text-muted); font-size: 0.82rem; }

/* Staff page row hover */
.staffTableRow { transition: background 0.12s; }
.staffTableRow:hover { background: var(--s2); }
```

- [ ] **Step 2: Fix workload-heatmap-page.tsx**

1. Wrap table in `<div className={cx("wlhTableWrap")}>` for horizontal scroll on mobile
2. Replace cell content with:
   ```tsx
   <td className={cx("wlhCell", toneClass)}>
     <span className={cx("wlhHours")}>{cell.allocatedHours}h / {cell.availableHours}h</span>
     <span className={cx("wlhCellTip")}>{cell.pct}% utilised</span>
   </td>
   ```
3. Add `<Tooltip label={`${cell.allocatedHours}h allocated of ${cell.availableHours}h available`}>` around the cell content (or use the title attribute as a simpler approach)
4. Fix skeleton: use `<SkeletonTable rows={5} cols={5} />` instead of custom opacity div

- [ ] **Step 3: Fix sprint-burndown-page.tsx**

1. Add legend above the SVG chart:
   ```tsx
   <div className={cx("sbdLegend")}>
     <span><span className={cx("sbdLegendDot", "sbdLegendIdeal")} />Ideal</span>
     <span><span className={cx("sbdLegendDot", "sbdLegendActual")} />Actual</span>
     <span><span className={cx("sbdLegendDot", "sbdLegendRisk")} />At Risk</span>
   </div>
   ```
2. Add `<SkeletonCard rows={4} />` loading state instead of "Loading sprint data…" text
3. Change SVG hardcoded `stroke="rgba(255,255,255,0.04)"` → `stroke="var(--b1)"` for theme compatibility
4. Add health icon to health chip: map `"On Track"` → `"✓"`, `"At Risk"` → `"⚠"`, `"Behind"` → `"✕"` as aria-hidden spans before the label text

- [ ] **Step 4: Run tsc**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/style/staff/maphari-staff-dashboard.module.css" \
  "apps/web/src/components/staff/staff-dashboard/pages/workload-heatmap-page.tsx" \
  "apps/web/src/components/staff/staff-dashboard/pages/sprint-burndown-page.tsx"
git commit -m "fix(staff): heatmap responsive scroll, burndown legend, skeletons, theme-safe SVG colors"
```

---

## Task 7: Staff Pages — Reports, Auto-Draft, Private Notes Polish

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/my-reports-page.tsx`
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/auto-draft-updates-page.tsx`
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/private-notes-page.tsx`

- [ ] **Step 1: Fix my-reports-page.tsx**

1. Add `<ConfirmDialog>` for deleting scheduled reports — replace immediate delete with confirm flow
2. Wrap generated report markdown in `<pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>` for better wrapping in modal
3. Replace inline `style={{ "--bg-color": X }}` on stat cards — CSS custom properties in React `style` prop are valid, but add a corresponding `var(--bg-color)` rule in the CSS class so it works. Or just map to semantic class names.
4. Fix modal backdrop: add `cursor: pointer` and `aria-label="Close"` to the overlay div

- [ ] **Step 2: Fix auto-draft-updates-page.tsx**

1. Replace inline selection state styles with proper CSS class `.aduSelected { background: color-mix(in srgb, var(--accent) 10%, transparent); border-color: var(--accent); }` — add to staff CSS
2. Add character count below draft textarea: `<span className={cx("textXs", "textMuted")}>{draft.length} chars</span>`
3. Add `disabled={generating}` to the Generate button + `opacity: 0.6; cursor: not-allowed;` when disabled via CSS class

- [ ] **Step 3: Fix private-notes-page.tsx**

1. Replace inline `style={{ color: categoryTone(note.category), borderColor: categoryTone(note.category) }}` on chips with class mapping: create `.pnCatPreference`, `.pnCatRisk`, `.pnCatOpportunity`, `.pnCatGeneral` CSS classes with the same colour semantics
2. Add `<ConfirmDialog>` before deleting notes
3. Add `className={cx("staffTableRow")}` to note cards for hover state
4. Replace inline search input width styles with CSS class `.pnSearchInput { min-width: 180px; flex: 1; max-width: 280px; }` — add to staff CSS

- [ ] **Step 4: Run tsc**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/components/staff/staff-dashboard/pages/my-reports-page.tsx" \
  "apps/web/src/components/staff/staff-dashboard/pages/auto-draft-updates-page.tsx" \
  "apps/web/src/components/staff/staff-dashboard/pages/private-notes-page.tsx" \
  "apps/web/src/app/style/staff/maphari-staff-dashboard.module.css"
git commit -m "fix(staff): confirm dialogs, inline style removal, char count on reports/drafts/notes pages"
```

---

## Task 8: Client Pages — Activity Feed + Project Roadmap Polish

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/activity-feed-page.tsx`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/project-roadmap-page.tsx`
- Modify: `apps/web/src/app/style/client/pages-misc.module.css`

- [ ] **Step 1: Add client CSS**

Append to pages-misc.module.css:
```css
/* Activity feed live time */
.afTimeStale { color: var(--text-faint); font-size: 0.7rem; }

/* Roadmap polish */
.rdmEmptyState { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; color: var(--text-muted); text-align: center; gap: 8px; }
.rdmEmptyIcon { font-size: 2rem; opacity: 0.4; }
.rdmMilestoneCompleted .rdmMilestoneDot { background: var(--lime, #c8f135); border-color: var(--lime, #c8f135); }
.rdmMilestoneInProgress .rdmMilestoneDot { background: var(--amber, #f59e0b); border-color: var(--amber, #f59e0b); }
.rdmProjectWrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
```

- [ ] **Step 2: Fix activity-feed-page.tsx — live relative time**

Replace static relative time calculation with a live-updating one:
```tsx
// Add to component:
const [now, setNow] = useState(Date.now());
useEffect(() => {
  const t = setInterval(() => setNow(Date.now()), 30_000); // refresh every 30s
  return () => clearInterval(t);
}, []);

// Replace the static timeAgo call:
function timeAgo(iso: string, nowMs: number) {
  const diff = nowMs - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
```

Replace `DOT_COLOR` JS object with CSS class mapping:
```tsx
const dotClassMap: Record<string, string> = {
  milestone: "dotLime", invoice: "dotAmber", payment: "dotGreen",
  message: "dotMuted", project: "dotAccent", task: "dotPurple",
};
// Add to pages-misc.module.css:
// .dotLime { background: var(--lime, #c8f135); }
// .dotAmber { background: var(--amber, #f59e0b); }
// .dotGreen { background: var(--green, #24b8a8); }
// .dotMuted { background: var(--b3); }
// .dotAccent { background: var(--accent, #8b6fff); }
// .dotPurple { background: var(--accent, #8b6fff); }
```

- [ ] **Step 3: Fix project-roadmap-page.tsx — bounds checking + skeleton**

1. Clamp today marker position: `const todayLeft = Math.min(100, Math.max(0, todayPct));`
2. Clamp milestone positions: `const left = Math.min(96, Math.max(2, milestonePct));` to keep dots visible
3. Replace "Loading roadmap…" text with `<SkeletonCard rows={4} />` × 2
4. Add `<div className={cx("rdmProjectWrap")}>` around the timeline for mobile scroll
5. Use milestone status to apply CSS class on the dot wrapper for colour: `cx("rdmMilestone", m.status === "COMPLETED" ? "rdmMilestoneCompleted" : m.status === "IN_PROGRESS" ? "rdmMilestoneInProgress" : "")`

- [ ] **Step 4: Run tsc**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/style/client/pages-misc.module.css" \
  "apps/web/src/components/client/maphari-dashboard/pages/activity-feed-page.tsx" \
  "apps/web/src/components/client/maphari-dashboard/pages/project-roadmap-page.tsx"
git commit -m "fix(client): live relative time in activity feed, roadmap bounds checking + milestone colours"
```

---

## Task 9: Client Pages — Approvals + NPS Survey Polish

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/approvals-page.tsx`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/satisfaction-survey-page.tsx`
- Modify: `apps/web/src/app/style/client/pages-a.module.css`

- [ ] **Step 1: Add CSS to pages-a.module.css**

Append:
```css
/* Approvals polish */
.apvTabContent { animation: tabFadeIn 0.15s ease; }
@keyframes tabFadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
.apvChevron { display: inline-flex; transition: transform 0.2s; color: var(--text-muted); margin-right: 6px; }
.apvChevronOpen { transform: rotate(90deg); }
.apvDueBadge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 600; }
.apvDueAmber { background: color-mix(in srgb, var(--amber, #f59e0b) 15%, transparent); color: var(--amber, #f59e0b); }
.apvDueRed   { background: color-mix(in srgb, var(--red, #ef4444) 15%, transparent); color: var(--red, #ef4444); }

/* NPS star colour classes */
.starFilled { color: var(--lime, #c8f135); }
.starEmpty  { color: var(--b3); }
```

- [ ] **Step 2: Fix approvals-page.tsx**

1. Replace emoji deadline badge `⚠ Due in 2 days` with:
   ```tsx
   <span className={cx("apvDueBadge", daysLeft <= 0 ? "apvDueRed" : "apvDueAmber")}>
     <svg aria-hidden="true" width="10" height="10" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="8" y1="4" x2="8" y2="9" stroke="currentColor" strokeWidth="2"/></svg>
     {daysLeft <= 0 ? "Overdue" : `Due in ${daysLeft}d`}
   </span>
   ```
2. Add `cx("apvTabContent")` to the tab content wrapper div (the one that changes when tab changes) for fade animation
3. Add expand chevron `<span className={cx("apvChevron", isOpen ? "apvChevronOpen" : "")}>▶</span>` to expandable row toggles
4. Add `<ConfirmDialog>` before "Approve" action: "Approve this deliverable? This cannot be undone."

- [ ] **Step 3: Fix satisfaction-survey-page.tsx (NPS section)**

1. Replace `fill={n <= display ? starColor(display) : "var(--b2)"}` with CSS class:
   ```tsx
   <span className={cx(n <= selected ? "starFilled" : "starEmpty")} aria-hidden="true">★</span>
   ```
2. Verify `npsScoreGreen/Amber/Red` classes exist in `pages-a.module.css` (they should from previous work — if not, add them)
3. Add `aria-label={`Rate ${n} out of 10`}` to each NPS score button

- [ ] **Step 4: Run tsc**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/style/client/pages-a.module.css" \
  "apps/web/src/components/client/maphari-dashboard/pages/approvals-page.tsx" \
  "apps/web/src/components/client/maphari-dashboard/pages/satisfaction-survey-page.tsx"
git commit -m "fix(client): tab fade animation, deadline badges, chevrons, NPS accessibility on approvals/survey"
```

---

## Task 10: Final Polish — Error States, Text Utilities, Accessibility Pass

**Files:**
- Modify: All pages (add `<Alert>` for API load errors)
- Modify: `apps/web/src/app/style/shared/utilities.module.css` (text colour utilities)

- [ ] **Step 1: Add text colour utilities**

Append to utilities.module.css:
```css
/* Semantic text colours */
.textGreen  { color: var(--green, #24b8a8); }
.textAmber  { color: var(--amber, #f59e0b); }
.textRed    { color: var(--red, #ef4444); }
.textAccent { color: var(--accent, #8b6fff); }
.textMuted  { color: var(--text-muted); }
.textFaint  { color: var(--text-faint); }
.textXs     { font-size: 0.7rem; }
.textSm     { font-size: 0.78rem; }
.textMono   { font-family: var(--font-dm-mono, monospace); font-variant-numeric: tabular-nums; }
```

- [ ] **Step 2: Add error state to every page that doesn't have one**

For each page listed below, add:
```tsx
const [loadError, setLoadError] = useState<string | null>(null);
// In the load function catch block:
} catch (e) { setLoadError("Failed to load data. Please try again."); }
// In JSX, before the main content:
{loadError && <Alert variant="error" message={loadError} onRetry={loadData} />}
```

Pages that need this (check each for missing error state):
- `capacity-forecast-page.tsx`
- `pipeline-analytics-page.tsx`
- `invoice-chasing-page.tsx`
- `workload-heatmap-page.tsx`
- `sprint-burndown-page.tsx`
- `activity-feed-page.tsx`
- `project-roadmap-page.tsx`

- [ ] **Step 3: Add aria-labels to icon-only buttons across all pages**

Grep for `<button` elements that contain only an SVG or an icon and no text label. Add `aria-label="..."` to each. Key examples:
- Delete buttons: `aria-label="Delete webhook"`
- Toggle buttons: `aria-label="Pause invoice chasing"`
- Close buttons on modals: `aria-label="Close"`

```bash
# Find icon-only buttons (no text content):
grep -r "button.*onClick" apps/web/src/components/*/dashboard/pages/*.tsx | grep -v "aria-label" | head -30
```

Review results and add missing aria-labels.

- [ ] **Step 4: Run final tsc**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "fix(a11y): error states, text colour utilities, aria-labels across all new dashboard pages"
```

---

## Verification Checklist

After all 10 tasks complete:

- [ ] `pnpm --filter @maphari/web exec tsc --noEmit` → zero errors
- [ ] All new pages show `<SkeletonTable>` or `<SkeletonCard>` while loading (not "Loading…" text)
- [ ] All new pages show `<Alert variant="error">` on API failure with retry button
- [ ] All destructive actions (delete, approve, chase) go through `<ConfirmDialog>` first
- [ ] No `style={{...}}` inline style objects remain in new page components (only CSS custom property overrides)
- [ ] `ThemeToggle` uses SVG icons, not emoji, with `aria-label` on each button
- [ ] Tab/panel switching has `tabFadeIn` CSS animation
- [ ] All expandable rows show a `▶` chevron that rotates `90deg` when open
- [ ] Dark mode: switch to dark, verify all new pages look correct (no white backgrounds, no invisible text)
