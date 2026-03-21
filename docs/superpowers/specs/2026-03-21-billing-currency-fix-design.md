# Billing Currency Fix — Design Spec
**Date:** 2026-03-21
**Status:** Approved
**Scope:** Client portal — currency threading, native invoice formatting, converted summaries, Pay Now wiring, payments page stubs

---

## Problem

The three billing pages (`InvoicesPage`, `PaymentsPage`, `BudgetTrackerPage`) all format money using a hardcoded `CURRENCY_SYMBOL` env var (default `"R"`) regardless of the invoice's actual currency or the user's preference. The `currency` state in the dashboard parent is loaded and saved correctly but never passed to these pages. The "Pay Now" modal is a UI stub that never calls PayFast. Three sections of the Payments page (monthly chart, upcoming schedule, saved methods) are empty stubs.

---

## Solution

Four targeted changes across four files. No new backend endpoints. No new CSS. No new components.

---

## Currency Rules

| Context | Rule |
|---------|------|
| Per-invoice amounts | Use `inv.currency` (native) — `formatMoneyCents(inv.amountCents, { currency: inv.currency })` |
| Per-payment amounts | ZAR — `formatMoneyCents(pay.amountCents, { currency: "ZAR" })` (PayFast is ZAR-only) |
| Summary/aggregate stat cards | User's `currency` preference via `useCurrencyConverter`; show `~` prefix and "converted" label when currency differs from source |
| Budget tracker | ZAR throughout — `formatMoneyCents(cents, { currency: "ZAR" })` |
| Pay Now modal | Always native invoice amount (ZAR) — no conversion |

---

## Changes

### 1. Thread `currency` to billing pages

**File:** `apps/web/src/components/client/maphari-client-dashboard.tsx`

The `currency` state is already loaded from `getPortalPreferenceWithRefresh(session, "settingsCurrency")` and saved via `setPortalPreferenceWithRefresh`. It is currently only passed to `<SettingsPage>`.

Add `currency={currency}` prop to:
- `<InvoicesPage invoices={snapshot?.invoices} currency={currency} />`
- `<PaymentsPage payments={snapshot?.payments} invoices={snapshot?.invoices} currency={currency} />`
- `<BudgetTrackerPage invoices={snapshot?.invoices} currency={currency} />`

---

### 2. Invoices page

**File:** `apps/web/src/components/client/maphari-dashboard/pages/invoices-page.tsx`

#### 2a. Component signature
Add `currency: string` prop (default `"ZAR"`).

#### 2b. Remove module-level hardcoded formatter
Delete:
```ts
const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? "R";
const LOCALE          = process.env.NEXT_PUBLIC_LOCALE ?? "en-ZA";
const fmtDec = (n: number) => `${CURRENCY_SYMBOL} ${n.toLocaleString(LOCALE, ...)}`
```

#### 2c. Per-invoice amounts
Use `formatMoneyCents` from `../../../../lib/i18n/currency`:
```ts
import { formatMoneyCents } from "../../../../lib/i18n/currency";
// per invoice:
formatMoneyCents(inv.amountCents, { currency: inv.currency })
```

#### 2d. Summary stat cards
Use `useCurrencyConverter` from `../../../../lib/i18n/exchange-rates`:
```ts
const { convert } = useCurrencyConverter(currency);
```
Sum all invoice amounts by converting each to the user's `currency`:
```ts
const totalOutstanding = invoices
  .filter(i => i.status !== "PAID")
  .reduce((sum, i) => sum + convert(i.amountCents, i.currency), 0);
```
Format the total:
```ts
const allSameCurrency = invoices.every(i => i.currency === invoices[0]?.currency);
const prefix = allSameCurrency ? "" : "~";
`${prefix}${formatMoneyCents(totalOutstanding, { currency })}`
```
Add a subtitle under converted totals: `"Converted from original currencies"` (only when `!allSameCurrency`).

#### 2e. Wire Pay Now modal
Replace the stub pay modal with a real flow:

**State:**
```ts
const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
const [payError, setPayError] = useState<string | null>(null);
const [payLoading, setPayLoading] = useState(false);
```

**Session:** `invoices-page.tsx` is a props-driven page with no current session access. Add `useProjectLayer()` to obtain session and `saveSession`:
```ts
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
// inside component:
const { session } = useProjectLayer();
```

**Handler:**
```ts
async function handlePayNow(invoiceId: string) {
  if (!session) return;
  setPayLoading(true);
  setPayError(null);
  const r = await initiatePortalPayfastWithRefresh(session, {
    invoiceId,
    returnUrl: window.location.href,
    cancelUrl:  window.location.href,
  });
  if (r.nextSession) saveSession(r.nextSession);
  if (r.error || !r.data?.redirectUrl) {
    setPayError(r.error?.message ?? "Failed to initiate payment.");
    setPayLoading(false);
    return;
  }
  window.location.href = r.data.redirectUrl;
}
```

**Modal content:**
- Show invoice title + `formatMoneyCents(inv.amountCents, { currency: inv.currency })`
- Note: *"You will be redirected to PayFast to complete payment."*
- "Pay Now" button: calls `handlePayNow(payingInvoiceId)`, shows spinner while `payLoading`
- Error state: red text below button showing `payError`
- "Cancel" button: `setPayingInvoiceId(null)`

Import `initiatePortalPayfastWithRefresh` from `../../../../lib/api/portal/projects`.

---

### 3. Payments page

**File:** `apps/web/src/components/client/maphari-dashboard/pages/payments-page.tsx`

#### 3a. Component signature
Add `currency: string` prop (default `"ZAR"`). Payments page already receives `payments?: PortalPayment[]` and `invoices?: PortalInvoice[]`.

#### 3b. Remove hardcoded formatter
Delete `CURRENCY_SYMBOL` / `LOCALE` / `fmtDec` module-level constants. Use `formatMoneyCents(pay.amountCents, { currency: "ZAR" })` for per-payment amounts.

#### 3c. Monthly activity chart — derive from loaded data
Replace the hardcoded empty `ACTIVITY` array with a client-side computation from `payments`:

```ts
const monthlyActivity = useMemo(() => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString("en-ZA", { month: "short" });
    const total = (payments ?? [])
      .filter(p => {
        const pd = new Date(p.createdAt);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      })
      .reduce((s, p) => s + p.amountCents, 0);
    return { label, amountCents: total };
  });
}, [payments]);
```

Bar heights: `(bar.amountCents / Math.max(...monthlyActivity.map(b => b.amountCents), 1)) * 100` as a percentage. If all months are zero, show empty state inside the chart area.

#### 3d. Upcoming payment schedule — load from portal
`payments-page.tsx` is a props-driven page with no current session access. It renders inside `ProjectLayerCtx` (provided by `maphari-client-dashboard.tsx`), so `useProjectLayer()` is available. Add:
```ts
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
// inside component:
const { session, projectId } = useProjectLayer();
const [milestones, setMilestones] = useState<PortalProjectPaymentMilestone[] | null>(null);
```

```ts
useEffect(() => {
  if (!session || !projectId) return;
  loadPortalProjectPaymentMilestonesWithRefresh(session, projectId).then(r => {
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) setMilestones(r.data);
  });
}, [session, projectId]);
```

Render unpaid milestones (`m.paid === false`) as the upcoming schedule rows:
- Stage label: `MILESTONE_30` → `"Milestone Payment (30%)"`, `FINAL_20` → `"Final Payment (20%)"`
- Amount: `formatMoneyCents(m.amountCents, { currency: "ZAR" })`
- Status: `m.paid ? "Paid" : "Upcoming"`
- Empty state if `milestones?.length === 0`: *"No upcoming payments scheduled."*
- Loading state: skeleton rows while `milestones === null`

Import `loadPortalProjectPaymentMilestonesWithRefresh` and `type PortalProjectPaymentMilestone` from `../../../../lib/api/portal`.

#### 3e. Remove Saved Payment Methods section
Delete the "Saved Payment Methods" section and its associated state. PayFast is a redirect flow with no stored-card support.

---

### 4. Budget Tracker page

**File:** `apps/web/src/components/client/maphari-dashboard/pages/budget-tracker-page.tsx`

#### 4a. Component signature
Add `currency: string` prop (default `"ZAR"`). No conversion needed — keep everything in ZAR.

#### 4b. Replace hardcoded formatters
Delete:
```ts
const fmt  = (v: number) => "R " + Math.round(v).toLocaleString("en-ZA");
const fmtk = (v: number) => "R " + (v / 1000).toFixed(0) + "k";
```

Replace with:
```ts
import { formatMoneyCents } from "../../../../lib/i18n/currency";
const fmt  = (cents: number) => formatMoneyCents(cents, { currency: "ZAR" });
const fmtk = (cents: number) => {
  if (cents >= 100_000_00) return formatMoneyCents(cents, { currency: "ZAR", maximumFractionDigits: 0 }); // large values
  return formatMoneyCents(cents, { currency: "ZAR", maximumFractionDigits: 0 });
};
```

Note: existing callers pass raw currency units (not cents) in some places — check each call site and ensure values are in cents before passing to `formatMoneyCents`.

#### 4c. HOURLY_RATE_ZAR
If `HOURLY_RATE_ZAR` is used to synthesize phase costs, keep it but add a `// estimated` comment. Do not surface it as a real value in the UI without a visible "estimated" label.

---

## Data Sources

All existing, no new endpoints:
- `loadPortalProjectPaymentMilestonesWithRefresh(session, projectId)` → `PortalProjectPaymentMilestone[]`
- `initiatePortalPayfastWithRefresh(session, { invoiceId, returnUrl, cancelUrl })` → `{ redirectUrl }`
- `useCurrencyConverter(displayCurrency)` → `{ convert(amountCents, sourceCurrency) }`
- `formatMoneyCents(amountCents, { currency })` → formatted string
- `PortalPayment.createdAt` — used for monthly chart grouping (verify field exists in type)

---

## Files

| File | Action |
|------|--------|
| `apps/web/src/components/client/maphari-client-dashboard.tsx` | Modify — pass `currency` prop to 3 billing pages |
| `apps/web/src/components/client/maphari-dashboard/pages/invoices-page.tsx` | Modify — native currency per invoice, converted summaries, wire Pay Now |
| `apps/web/src/components/client/maphari-dashboard/pages/payments-page.tsx` | Modify — ZAR formatting, monthly chart derivation, milestones, remove saved methods |
| `apps/web/src/components/client/maphari-dashboard/pages/budget-tracker-page.tsx` | Modify — replace hardcoded formatters with `formatMoneyCents` |

---

## Success Criteria

1. `pnpm --filter @maphari/web exec tsc --noEmit` → 0 errors
2. Invoices page: each invoice amount displays in its own currency (`inv.currency`)
3. Invoices page: summary stat cards show user's preferred currency with `~` prefix when invoices are in mixed currencies
4. Invoices page: "Pay Now" button opens modal → clicking "Pay Now" calls `initiatePortalPayfastWithRefresh` → redirects to PayFast on success, shows error on failure
5. Payments page: per-payment amounts display in ZAR
6. Payments page: monthly chart shows last 6 months derived from `PortalPayment[]` (bars at 0 for empty months)
7. Payments page: upcoming schedule shows unpaid `PortalProjectPaymentMilestone[]` rows (or empty state)
8. Payments page: "Saved Payment Methods" section is gone
9. Budget tracker: all amounts display via `formatMoneyCents` with ZAR — no hardcoded `"R "` prefix
