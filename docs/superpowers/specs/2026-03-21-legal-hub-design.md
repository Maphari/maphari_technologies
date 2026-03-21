# Legal Hub — Design Spec
**Date:** 2026-03-21
**Status:** Approved
**Scope:** Client portal — unified Quote → Contract → Sign lifecycle page

---

## Problem

The client portal currently splits the legal lifecycle across three disconnected places:
1. `quoteAcceptance` — proposals only (fully wired)
2. `contractsProposals` — project/invoice proxies (no real contracts)
3. `contracts-page.tsx` — full contract signing, canvas signature pad, template viewer — **orphaned, not mounted anywhere**

Clients have no way to see where they are in the legal journey, and the contract signing flow is entirely inaccessible.

---

## Solution

Replace all three with a single **Legal Hub** page (`legalHub` PageId) that shows a stage pipeline at the top and the relevant proposal/contract actions below.

---

## Pipeline Stages

Four stages derived from live data:

| Stage | Label | Condition |
|-------|-------|-----------|
| 1 | Proposal Sent | always reached |
| 2 | Quote Accepted | `proposals.some(p => p.status === "ACCEPTED")` |
| 3 | Contract Sent | `contracts.length > 0` |
| 4 | Agreement Signed | `contracts.length > 0 && contracts.every(c => c.signed)` |

Stages are linear — current position = highest stage reached. Visual: horizontal connected nodes, lime for done, lime accent glow for active, muted for pending.

---

## Data Sources

All fetched in parallel on mount:
- `loadPortalProposalsWithRefresh(session)` → `PortalProposal[]`
- `loadPortalContractsWithRefresh(session)` → `PortalContract[]`

On-demand (when viewing/signing a contract):
- `loadContractTemplateWithRefresh(session, templateId, variables)` → rendered HTML
- `signContractWithSignatureWithRefresh(session, contractId, signerName, signatureDataUrl)` → sign
- `getPortalContractFileIdWithRefresh(session, contractId)` → download fileId
- `getPortalFileDownloadUrlWithRefresh(session, fileId)` → download URL

On-demand (proposal actions):
- `acceptPortalProposalWithRefresh(session, proposalId)` → accept
- `declinePortalProposalWithRefresh(session, proposalId, reason?)` → decline

Session/projectId from `useProjectLayer()`. `saveSession` called on every response with `nextSession`.

---

## Page Sections

### 1. Pipeline header
Horizontal stage row above content. Each node: numbered circle (✓ when done) + label below. Connected by a line that fills lime as stages are reached.

### 2. Proposals section
Shown if `proposals.length > 0`.

KPI row (3 cards): Proposals Count / Pending Value / Accepted Value.

Each proposal renders as a `ctCard`-style card with:
- Title, amount (large), status badge, valid-until, prepared-by
- Summary text if present
- Expandable line items list (collapsible via local state)
- If PENDING: "Accept" (lime) + "Decline" (ghost) buttons with confirm flow
- If ACCEPTED: green accepted banner with date
- If DECLINED: muted declined banner with reason
- If EXPIRED: red expired banner

Accept confirm: inline confirm box (reuse `qaConfirmBox` + `qaDeclBox` pattern from existing CSS).

### 3. Legal Documents section
Shown if `contracts.length > 0`.

Each contract renders as a row (`ctCard` style): icon (by type) + title + ref + status badge + "View & Sign" button (if not signed) or signed checkmark + "Download" button (if `fileId` exists).

"View & Sign" opens the `ContractViewer` modal inline (same component from `contracts-page.tsx`, absorbed into this file).

### 4. Empty state
If no proposals AND no contracts: single empty-state card — "Nothing here yet. Your team will send a proposal shortly."

---

## ContractViewer (absorbed from `contracts-page.tsx`)

A full-screen overlay modal with:
- Scroll-progress bar at top (lime fill)
- Header: doc icon + title + close button
- Scrollable contract body (rendered HTML via `loadContractTemplateWithRefresh`, fallback static HTML)
- After scrolling ≥95%: signature section unlocks
  - Name input
  - Canvas signature pad (`SignaturePad` component from `../../../shared/ui/signature-pad`)
  - Agree checkbox
  - "Sign Document" button (lime, disabled until name + signature + agree)
- After signing: "Signed Successfully" confirmation view
- Escape key closes

---

## CSS

**New classes** added to `apps/web/src/app/style/client/pages-misc.module.css`:

```css
.legalPipeline        /* flex row, gap, padding */
.legalPipelineStage   /* flex col, align center, relative, flex: 1 */
.legalPipelineNode    /* circle 36px, border, bg, centered number */
.legalPipelineNodeDone    /* lime bg, white checkmark */
.legalPipelineNodeActive  /* lime border + glow, lime number */
.legalPipelineConnector   /* absolute horizontal line between nodes */
.legalPipelineConnectorDone /* lime fill */
.legalPipelineLabel   /* text below node, muted, 0.62rem */
.legalPipelineLabelActive /* text color: var(--text), fw600 */
```

**Reused classes** (already in style spread):
- Proposals: `qa*` classes from `pages-misc.module.css`
- Contracts: `ct*` classes from `pages-a.module.css`
- Shared: `card`, `cardHd`, `cardHdTitle`, `badge`, `badge*`, `btnSm`, `btnAccent`, `btnGhost`, `topCardsStack`, `statCard`, `statLabel`, `statValue`, `pageBody`, `pageHeader`, `pageTitle`, `pageEyebrow`, `pageSub`, `skeletonBlock`, `skeleH68`, `skeleH80`, `emptyState`, `emptyStateIcon`, `emptyStateTitle`, `emptyStateSub`

---

## Navigation Changes

### config.ts — PageId union
- **Add:** `"legalHub"`
- **Remove:** `"contractsProposals"`, `"quoteAcceptance"`

### config.ts — navSections (Finance section)
- **Remove:** `{ id: "contractsProposals", label: "Contracts & Proposals" }` and `{ id: "quoteAcceptance", label: "Quote Acceptance" }`
- **Add:** `{ id: "legalHub", label: "Legal & Agreements" }` in their place

### maphari-client-dashboard.tsx
- **Add:** `{nav.activePage === "legalHub" && <LegalHubPage />}`
- **Remove:** `contractsProposals` and `quoteAcceptance` render cases + imports
- **Import:** `LegalHubPage` from `"./maphari-dashboard/pages/legal-hub-page"`

### ftue-holding-page.tsx
- Change `navigateTo("quoteAcceptance")` → `navigateTo("legalHub")` (1 occurrence)

---

## Files

| File | Action |
|------|--------|
| `apps/web/src/components/client/maphari-dashboard/pages/legal-hub-page.tsx` | **Create** — unified hub |
| `apps/web/src/app/style/client/pages-misc.module.css` | **Modify** — add `legalPipeline*` classes |
| `apps/web/src/components/client/maphari-dashboard/config.ts` | **Modify** — nav changes |
| `apps/web/src/components/client/maphari-client-dashboard.tsx` | **Modify** — render switch |
| `apps/web/src/components/client/maphari-dashboard/pages/ftue-holding-page.tsx` | **Modify** — fix navigateTo |
| `apps/web/src/components/client/maphari-dashboard/pages/contracts-page.tsx` | **Delete** — absorbed |
| `apps/web/src/components/client/maphari-dashboard/pages/contracts-proposals-page.tsx` | **Delete** — replaced |
| `apps/web/src/components/client/maphari-dashboard/pages/quote-acceptance-page.tsx` | **Delete** — absorbed |

---

## Success Criteria

1. Navigate to "Legal & Agreements" → pipeline renders with correct current stage based on data
2. No proposals + no contracts → empty state card shown
3. PENDING proposal → Accept/Decline buttons visible; accept updates proposal status in UI optimistically
4. Contracts list → "View & Sign" opens ContractViewer overlay; scrolling ≥95% unlocks signature section
5. After signing → contract status updates to SIGNED in the list; pipeline advances to stage 4
6. `pnpm --filter @maphari/web exec tsc --noEmit` → 0 errors
7. `quoteAcceptance` and `contractsProposals` nav items gone from Finance section
8. FtueHoldingPage "Review Proposal →" link navigates to `legalHub`
