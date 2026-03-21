# Billing Currency Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the user's currency preference to all billing pages, replace hardcoded ZAR formatters with `formatMoneyCents`, replace the fake credit-card Pay Now modal with a real PayFast redirect, and populate the payments page stubs from real data.

**Architecture:** Four targeted file modifications. No new API endpoints. Currency is threaded as a prop from the dashboard parent. Per-invoice amounts use `inv.currency` (native). Summary totals use `useCurrencyConverter` with the user's preference. PayFast flow replaces the fake card-entry modal entirely.

**Tech Stack:** React 18, TypeScript, Next.js 16, `Intl.NumberFormat` via `formatMoneyCents` (`apps/web/src/lib/i18n/currency.ts`), `useCurrencyConverter` (`apps/web/src/lib/i18n/exchange-rates.ts`), `initiatePortalPayfastWithRefresh` + `loadPortalProjectPaymentMilestonesWithRefresh` (`apps/web/src/lib/api/portal`)

---

## File Map

| File | Action |
|------|--------|
| `apps/web/src/components/client/maphari-client-dashboard.tsx` | Thread `currency` prop to 3 billing pages |
| `apps/web/src/components/client/maphari-dashboard/pages/invoices-page.tsx` | Native currency per invoice, converted summaries, real Pay Now |
| `apps/web/src/components/client/maphari-dashboard/pages/payments-page.tsx` | ZAR formatting, monthly chart, milestones, remove saved methods |
| `apps/web/src/components/client/maphari-dashboard/pages/budget-tracker-page.tsx` | Replace hardcoded `"R "` formatters with `formatMoneyCents` |

---

## Task 1: Thread `currency` to billing pages

**Files:**
- Modify: `apps/web/src/components/client/maphari-client-dashboard.tsx` lines 571–573

### Current render calls (lines 571–573):
```tsx
{nav.activePage === "payments"      && <PaymentsPage payments={snapshot.payments} invoices={snapshot.invoices} />}
{nav.activePage === "invoices"      && <InvoicesPage invoices={snapshot.invoices} />}
{nav.activePage === "budgetTracker" && <BudgetTrackerPage invoices={snapshot.invoices} />}
```

- [ ] **Step 1: Add `currency` prop to all three billing page render calls**

Replace those three lines with:
```tsx
{nav.activePage === "payments"      && <PaymentsPage payments={snapshot.payments} invoices={snapshot.invoices} currency={currency} />}
{nav.activePage === "invoices"      && <InvoicesPage invoices={snapshot.invoices} currency={currency} />}
{nav.activePage === "budgetTracker" && <BudgetTrackerPage invoices={snapshot.invoices} currency={currency} />}
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: errors on `InvoicesPage`, `PaymentsPage`, `BudgetTrackerPage` — `currency` prop not yet in their signatures. That's fine — these will be fixed in Tasks 2–4. If there are unexpected errors elsewhere, fix them now.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/client/maphari-client-dashboard.tsx
git commit -m "feat(client): thread currency prop to billing pages"
```

---

## Task 2: Fix `invoices-page.tsx`

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/invoices-page.tsx`

### Key locations in current file:
- **Lines 40–47**: Hardcoded `CURRENCY_SYMBOL`, `LOCALE`, `fmt`, `fmtDec` — DELETE these
- **Line 90–251**: `InvPayModal` component — entire fake card-entry modal — DELETE and REPLACE
- **Line 410**: `export function InvoicesPage({ invoices: apiInvoices = [] }` — add `currency` prop
- **Line 422–449**: `invoiceData` useMemo — the `amount` field uses `fmtDec(inv.amountCents / 100)` — fix to use native currency
- **Line 431**: `const fmtMoney = (cents: number) => fmtDec(cents / 100)` — replace with `formatMoneyCents`
- **Line 416**: `const [payModal, setPayModal] = useState<{ amount: number; desc: string } | null>(null)` — change type

### Context:
- `PortalInvoice.currency: string` exists on the type (confirmed)
- `formatMoneyCents(amountCents, { currency })` is in `../../../../lib/i18n/currency`
- `useCurrencyConverter(displayCurrency)` is in `../../../../lib/i18n/exchange-rates`
- `initiatePortalPayfastWithRefresh` is in `../../../../lib/api/portal` (re-exported from barrel)
- `useProjectLayer()` provides `session` — import from `../hooks/use-project-layer`
- `saveSession` is in `../../../../lib/auth/session`

- [ ] **Step 1: Add imports**

At the top of the file, add:
```ts
import { formatMoneyCents } from "../../../../lib/i18n/currency";
import { useCurrencyConverter } from "../../../../lib/i18n/exchange-rates";
import { initiatePortalPayfastWithRefresh } from "../../../../lib/api/portal";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
```

- [ ] **Step 2: Delete hardcoded formatters**

Delete lines 40–47:
```ts
// DELETE these:
const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? "R";
const LOCALE          = process.env.NEXT_PUBLIC_LOCALE ?? "en-ZA";
const fmt    = (n: number) => `${CURRENCY_SYMBOL} ${n.toLocaleString(LOCALE)}`;
const fmtDec = (n: number) => `${CURRENCY_SYMBOL} ${n.toLocaleString(LOCALE, { ... })}`;
```

- [ ] **Step 3: Delete `InvPayModal` and replace with `PayfastModal`**

Delete the entire `InvPayModal` function (lines 90–251 — the fake card-entry modal with `cardNum`, `expiry`, `cvv`, `splitPay` states and fake timer).

Also add `width: 14px; height: 14px;` to the existing `.inv-spinner` rule inside `PAGE_STYLES` (around line 71 of the original file) so the spinner has correct dimensions without inline styles.

Replace with this leaner component:
```tsx
function PayfastModal({
  invoiceId,
  amountCents,
  currency,
  desc,
  onClose,
}: {
  invoiceId: string;
  amountCents: number;
  currency: string;
  desc: string;
  onClose: () => void;
}) {
  const { session } = useProjectLayer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, onClose]);

  async function handlePay() {
    if (!session) return;
    setLoading(true);
    setError(null);
    const r = await initiatePortalPayfastWithRefresh(session, {
      invoiceId,
      returnUrl: window.location.href,
      cancelUrl: window.location.href,
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error || !r.data?.redirectUrl) {
      setError(r.error?.message ?? "Failed to initiate payment. Please try again.");
      setLoading(false);
      return;
    }
    window.location.href = r.data.redirectUrl;
  }

  return (
    <>
      <div
        className={cx("modalOverlay")}
        onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      >
        <div className={`inv-modal-in ${cx("pmModalInner")}`}>
          <div className={cx("pmModalHd")}>
            <div className={cx("flexRow", "gap8")}>
              <Ic n="shieldCheck" sz={15} c="var(--lime)" />
              <span className={cx("fontMono", "text10", "uppercase", "tracking", "colorAccent")}>
                Secure Payment · PayFast
              </span>
            </div>
            {!loading && (
              <button type="button" onClick={onClose} className={cx("iconBtn")}>
                <Ic n="x" sz={16} />
              </button>
            )}
          </div>

          <div className={cx("p024x20", "flexCol", "gap16")}>
            <div className={cx("flexCol", "gap4")}>
              <div className={cx("text12", "colorMuted")}>{desc}</div>
              <div className={cx("fw700", "text20", "tabularNums")}>
                {formatMoneyCents(amountCents, { currency })}
              </div>
            </div>
            <div className={cx("text11", "colorMuted", "lineH165")}>
              You will be redirected to PayFast to complete your payment securely.
            </div>
            {error && (
              <div className={cx("text11", "colorRed")}>{error}</div>
            )}
            <div className={cx("flexCol", "gap8")}>
              <button
                type="button"
                className={cx("btnAccent", "wFull", "flexRow", "flexCenter", "gap6")}
                onClick={() => void handlePay()}
                disabled={loading || !session}
              >
                {loading
                  ? <><div className="inv-spinner" /> Processing…</>
                  : <><Ic n="lock" sz={14} /> Pay Now</>
                }
              </button>
              {!loading && (
                <button type="button" className={cx("btnGhost", "wFull")} onClick={onClose}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Update `InvoicesPage` signature and add session/converter**

Change the component signature and add hooks inside the component:
```tsx
export function InvoicesPage({
  invoices: apiInvoices = [],
  currency = "ZAR",
}: {
  invoices?: PortalInvoice[];
  currency?: string;
}) {
  const { convert } = useCurrencyConverter(currency);
  // ... existing state ...
```

Change `payModal` state type to track the invoiceId:
```ts
const [payModal, setPayModal] = useState<{
  invoiceId: string;
  amountCents: number;
  currency: string;
  desc: string;
} | null>(null);
```

- [ ] **Step 5: Fix `invoiceData` useMemo — native currency per invoice**

Inside the `invoiceData` useMemo (around line 422), the mapper currently does:
```ts
const fmtMoney = (cents: number) => fmtDec(cents / 100);  // DELETE THIS
```

Replace with:
```ts
const fmtMoney = (cents: number) => formatMoneyCents(cents, { currency: inv.currency });
```

Also store `inv.currency` on the internal `Invoice` type. Add `currency: string` to the `Invoice` interface (line 16):
```ts
interface Invoice {
  id: string; ref: string; date: string; due: string; paidDate?: string;
  amount: string; amountRaw: number; status: IStatus; items: InvItem[];
  issuedMs: number; category: ICategory; project: string;
  contact: string; contactInitials: string; notes?: string;
  currency: string;   // ADD THIS
  amountCents: number; // ADD THIS — needed for Pay Now modal
}
```

Add to the mapper return:
```ts
currency: inv.currency ?? "ZAR",
amountCents: inv.amountCents,
```

- [ ] **Step 6: Fix summary stat cards — converted totals**

The stat cards show totals across all invoices. Replace the raw sum with a currency-converted sum:

```ts
const totalOutstanding = invoiceData
  .filter(i => i.status !== "Paid")
  .reduce((s, i) => s + convert(i.amountCents, i.currency), 0);
const totalPaid = invoiceData
  .filter(i => i.status === "Paid")
  .reduce((s, i) => s + convert(i.amountCents, i.currency), 0);
const allSameCurrency = invoiceData.length === 0 ||
  invoiceData.every(i => i.currency === invoiceData[0].currency);
const approxPrefix = allSameCurrency ? "" : "~";
```

Format the stat values:
```ts
`${approxPrefix}${formatMoneyCents(totalOutstanding, { currency })}`
`${approxPrefix}${formatMoneyCents(totalPaid, { currency })}`
```

Add subtitle text under stat cards when `!allSameCurrency`: `"Converted from original currencies"` (a small muted line below the stat value).

- [ ] **Step 7: Wire Pay Now button to open `PayfastModal`**

Find where `setPayModal(...)` is called when the user clicks "Pay Now" on an invoice. Change it to:
```ts
setPayModal({
  invoiceId: inv.id,      // now passing inv.id not a numeric amount
  amountCents: inv.amountCents,
  currency: inv.currency ?? "ZAR",
  desc: inv.ref,
})
```

Where `PayfastModal` is rendered (was `InvPayModal`), replace with:
```tsx
{payModal && (
  <PayfastModal
    invoiceId={payModal.invoiceId}
    amountCents={payModal.amountCents}
    currency={payModal.currency}
    desc={payModal.desc}
    onClose={() => setPayModal(null)}
  />
)}
```

- [ ] **Step 8: Fix any remaining `fmtDec` / `fmt` references**

Search the file for any remaining `fmtDec(` or `fmt(` calls (there may be some in the invoice preview panel or line items). Replace with `formatMoneyCents(cents, { currency: inv.currency ?? currency })`.

- [ ] **Step 9: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors. Fix any type errors before committing.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/components/client/maphari-dashboard/pages/invoices-page.tsx
git commit -m "feat(client): native currency per invoice, converted summaries, real PayFast Pay Now"
```

---

## Task 3: Fix `payments-page.tsx`

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/payments-page.tsx`

### Key locations in current file:
- **Lines 42–55**: Stub constants `ACTIVITY`, `UPCOMING`, `SAVED_METHODS` — DELETE
- **Lines 57–60**: Hardcoded `CURRENCY_SYMBOL`, `LOCALE`, `fmt`, `fmtDec` — DELETE
- **Lines 94–135**: `detectNetwork`, `luhnCheck`, `formatCardNumber`, `formatExpiry`, `isExpiryValid` helpers — DELETE (card-entry helpers, no longer needed)
- **Line 900**: Component signature — add `currency` prop
- **Lines 906, 908–913**: `selectedMethod`, `showPaymentModal`, `localMethods`, `handleMethodSaved` state — DELETE (all for the card-saving modal)
- **Lines 955–957**: `totalPaid`, `totalPending`, `totalOverdue` — these use `amountRaw` (raw ZAR) — fix to use `amountCents` from `apiPayments`

### Context:
- `PortalPayment` fields: `id`, `invoiceId`, `amountCents`, `paidAt`, `createdAt`, `status`, `provider`, `transactionRef`
- `loadPortalProjectPaymentMilestonesWithRefresh(session, projectId)` → `PortalProjectPaymentMilestone[]`
- `PortalProjectPaymentMilestone` fields: `stage ("MILESTONE_30" | "FINAL_20")`, `paid: boolean`, `amountCents`, `invoiceId`, `paymentId`, `markedAt`, `note`
- `useProjectLayer()` available — this page renders inside `ProjectLayerCtx`
- `formatMoneyCents` from `../../../../lib/i18n/currency`

- [ ] **Step 1: Add imports**

```ts
import { formatMoneyCents } from "../../../../lib/i18n/currency";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalProjectPaymentMilestonesWithRefresh,
  type PortalProjectPaymentMilestone,
} from "../../../../lib/api/portal";
```

- [ ] **Step 2: Delete stub constants and hardcoded formatters**

Delete:
- `ACTIVITY`, `CHART_MAX` (the module-level one), `UPCOMING`, `SAVED_METHODS` constants (lines 42–55)
- `CURRENCY_SYMBOL`, `LOCALE`, `fmt`, `fmtDec` (lines 57–60)
- Card helpers: `detectNetwork`, `luhnCheck`, `formatCardNumber`, `formatExpiry`, `isExpiryValid` (lines 94–135)
- The `CardNetwork` type alias and `SavedMethodRecord` type (if present)
- Any `AddMethodModal` or card-saving modal component that references these helpers

- [ ] **Step 3: Update component signature, add session + milestones state**

```tsx
export function PaymentsPage({
  payments: apiPayments = [],
  invoices: apiInvoices = [],
  currency = "ZAR",
}: {
  payments?: PortalPayment[];
  invoices?: PortalInvoice[];
  currency?: string;
}) {
  const { session, projectId } = useProjectLayer();
  const [milestones, setMilestones] = useState<PortalProjectPaymentMilestone[] | null>(null);
  // ... remove: selectedMethod, showPaymentModal, localMethods, handleMethodSaved
```

- [ ] **Step 4: Remove payment method state and handlers**

Delete from the component body:
```ts
// DELETE:
const [selectedMethod, setSelectedMethod] = useState<PayMethod>(SAVED_METHODS[0]?.id ?? "visa");
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [localMethods, setLocalMethods] = useState<SavedMethodRecord[]>([]);
const handleMethodSaved = useCallback(...);
```

- [ ] **Step 5: Add milestone fetch effect**

```ts
useEffect(() => {
  if (!session || !projectId) return;
  loadPortalProjectPaymentMilestonesWithRefresh(session, projectId).then((r) => {
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) setMilestones(r.data);
  });
}, [session, projectId]);
```

- [ ] **Step 6: Derive monthly activity chart from loaded payments**

Replace the empty `ACTIVITY` constant with a `useMemo`:
```ts
const CHART_H = 104;
const monthlyActivity = useMemo(() => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString("en-ZA", { month: "short" });
    const amountCents = apiPayments
      .filter((p) => {
        const pd = new Date(p.createdAt);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      })
      .reduce((s, p) => s + p.amountCents, 0);
    return { label, amountCents };
  });
}, [apiPayments]);

const chartMax = Math.max(...monthlyActivity.map((m) => m.amountCents), 1);
```

In the chart JSX, replace `ACTIVITY` references with `monthlyActivity`. Replace `CHART_MAX` with `chartMax`. Bar height: `(bar.amountCents / chartMax) * CHART_H`. Bar label: `formatMoneyCents(bar.amountCents, { currency: "ZAR", maximumFractionDigits: 0 })`. If all bars are zero, show an empty-state message inside the chart area: `"No payment activity yet"`.

- [ ] **Step 7: Fix stat card totals to use cents**

Replace the raw `amountRaw`-based totals:
```ts
// Replace:
const totalPaid    = paymentData.filter(p => p.status === "Paid").reduce((s,p) => s + p.amountRaw, 0);
const totalPending = paymentData.filter(p => p.status === "Pending").reduce((s,p) => s + p.amountRaw, 0);
const totalOverdue = paymentData.filter(p => p.status === "Overdue").reduce((s,p) => s + p.amountRaw, 0);

// With:
const totalPaidCents    = apiPayments.filter(p => p.status === "COMPLETED" || p.status === "REFUNDED").reduce((s,p) => s + p.amountCents, 0);
const totalPendingCents = apiPayments.filter(p => p.status === "PENDING").reduce((s,p) => s + p.amountCents, 0);
const totalOverdueCents = apiPayments.filter(p => p.status === "FAILED").reduce((s,p) => s + p.amountCents, 0);
```

Format with: `formatMoneyCents(totalPaidCents, { currency: "ZAR" })`.

- [ ] **Step 8: Replace Upcoming Schedule stub with milestones**

Find the section rendering `UPCOMING` (the empty stub array). Replace with:
```tsx
{/* ── Upcoming Schedule ── */}
{milestones === null ? (
  // Loading: show 2 skeleton rows
  <>
    <div className={cx("skeletonBlock", "skeleH68")} />
    <div className={cx("skeletonBlock", "skeleH68")} />
  </>
) : milestones.filter(m => !m.paid).length === 0 ? (
  <div className={cx("emptyState")}>
    <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={20} c="var(--muted2)" /></div>
    <div className={cx("emptyStateTitle")}>No upcoming payments</div>
    <div className={cx("emptyStateSub")}>All scheduled payments are up to date.</div>
  </div>
) : milestones.filter(m => !m.paid).map((m) => {
  const stageLabel = m.stage === "MILESTONE_30" ? "Milestone Payment (30%)" : "Final Payment (20%)";
  return (
    <div key={m.stage} className={cx("listRow")}>
      <div className={cx("flex1", "minW0")}>
        <div className={cx("fw600", "text12")}>{stageLabel}</div>
        {m.note && <div className={cx("text10", "colorMuted")}>{m.note}</div>}
      </div>
      <div className={cx("fontMono", "fw700", "text12", "tabularNums")}>
        {formatMoneyCents(m.amountCents, { currency: "ZAR" })}
      </div>
      <span className={cx("badge", "badgeAmber")}>Upcoming</span>
    </div>
  );
})}
```

- [ ] **Step 9: Remove Saved Payment Methods section**

Find the JSX section rendering `SAVED_METHODS` (the card grid with visa/mc/bank cards). Delete the entire section. Also delete any `AddMethodModal` component or state that was only for saving payment methods.

- [ ] **Step 10: Fix remaining `fmtDec` / `fmt` references**

Search for any remaining `fmtDec(` or `fmt(` in the file. Replace with `formatMoneyCents(amountCents, { currency: "ZAR" })`. For `amountRaw`-based calls, multiply by 100: `formatMoneyCents(amountRaw * 100, { currency: "ZAR" })`.

- [ ] **Step 11: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 12: Commit**

```bash
git add apps/web/src/components/client/maphari-dashboard/pages/payments-page.tsx
git commit -m "feat(client): ZAR formatting, derived monthly chart, milestone schedule, remove saved methods"
```

---

## Task 4: Fix `budget-tracker-page.tsx`

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/budget-tracker-page.tsx`

### Key locations in current file:
- **Line 29**: `const fmt = (v: number) => "R " + Math.round(v).toLocaleString("en-ZA");`
- **Line 30**: `const fmtk = (v: number) => "R " + (v / 1000).toFixed(0) + "k";`
- **Line 34**: `const HOURLY_RATE_ZAR = 1000;` — keep but note it's an estimate
- **Lines 38–48**: `apiToPhaseRow` — `budget` and `spent` are in **raw ZAR** (not cents): `p.budgetedHours * HOURLY_RATE_ZAR`
- **Lines 53–59**: `crToRow` — `cost` is in **raw ZAR**: `costCents / 100`

### Important: `fmt` and `fmtk` receive raw ZAR values (not cents).
All call sites pass values already divided by 100. So pass `v * 100` as cents to `formatMoneyCents`.

- [ ] **Step 1: Add `formatMoneyCents` import**

The file already imports from `../../../../lib/api/portal`. Add:
```ts
import { formatMoneyCents } from "../../../../lib/i18n/currency";
```

- [ ] **Step 2: Add `currency` prop to component signature**

```tsx
export function BudgetTrackerPage({
  invoices: apiInvoices = [],
  currency = "ZAR",
}: {
  invoices?: PortalInvoice[];
  currency?: string;
}) {
```

- [ ] **Step 3: Replace `fmt` and `fmtk`**

```ts
// DELETE:
const fmt  = (v: number) => "R " + Math.round(v).toLocaleString("en-ZA");
const fmtk = (v: number) => "R " + (v / 1000).toFixed(0) + "k";

// REPLACE WITH (raw ZAR → multiply by 100 for cents):
const fmt  = (v: number) => formatMoneyCents(Math.round(v) * 100, { currency: "ZAR", maximumFractionDigits: 0 });
const fmtk = (v: number) => formatMoneyCents(Math.round(v) * 100, { currency: "ZAR", maximumFractionDigits: 0 });
```

Both `fmt` and `fmtk` now behave identically — full `Intl.NumberFormat` output. All call sites pass raw ZAR values (not cents), so `v * 100` is correct at every call site.

- [ ] **Step 4: Add `// estimated` comment to `HOURLY_RATE_ZAR`**

```ts
const HOURLY_RATE_ZAR = 1000; // R 1 000 / hr — estimated; actual costs from invoices
```

No UI change needed — this is already an internal constant.

- [ ] **Step 5: Verify no remaining hardcoded `"R "` strings**

Search the file:
```bash
grep -n '"R "' apps/web/src/components/client/maphari-dashboard/pages/budget-tracker-page.tsx
```

Expected: 0 matches.

- [ ] **Step 6: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/client/maphari-dashboard/pages/budget-tracker-page.tsx
git commit -m "feat(client): replace hardcoded ZAR formatters with formatMoneyCents in budget tracker"
```

---

## Final Verification

After all 4 tasks are committed:

- [ ] `pnpm --filter @maphari/web exec tsc --noEmit` → 0 errors
- [ ] `currency` prop reaches all 3 billing pages from parent
- [ ] Invoices page: per-invoice amounts use `inv.currency` (e.g. ZAR invoice shows ZAR, USD invoice shows USD)
- [ ] Invoices page: summary stat cards use `~` prefix when invoices are in mixed currencies
- [ ] Invoices page: "Pay Now" opens `PayfastModal` (not the old card-entry modal)
- [ ] Invoices page: `PayfastModal` calls `initiatePortalPayfastWithRefresh` and redirects on success
- [ ] Payments page: per-payment amounts show ZAR via `formatMoneyCents`
- [ ] Payments page: monthly chart shows 6 months derived from `apiPayments`
- [ ] Payments page: upcoming schedule shows unpaid `PortalProjectPaymentMilestone` rows
- [ ] Payments page: no "Saved Payment Methods" section
- [ ] Budget tracker: no `"R "` hardcoded strings anywhere
