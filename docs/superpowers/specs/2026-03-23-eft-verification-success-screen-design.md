# EFT Deposit Verification & Success Screen Redesign

**Date:** 2026-03-23
**Status:** Approved
**Scope:** Client portal project request success screen + EFT proof-of-payment verification workflow

---

## 1. Overview

Two problems to solve together:

1. **Success screen layout** — the current screen is sparse, lacks EFT-specific context, shows a fake client-side reference code, and has a vertical cramped timeline.
2. **EFT deposit verification** — no mechanism exists to collect or verify proof of payment from clients who pay by EFT before project kickoff.

---

## 2. Architecture

```
Client Portal (success screen)
  └── generates referenceCode (PRJ-XXXXXX) before submit
  └── shows bank details + PDF upload section (EFT only)
  └── uploads PDF → files service → confirms upload
  └── calls PATCH /projects/requests/:id/eft-proof

Core Service
  └── ProjectRequest.referenceCode  (new field)
  └── ProjectRequest.proofFileId    (new field)
  └── EftVerification model         (new)
  └── PATCH /projects/requests/:id/eft-proof
  └── GET  /admin/eft-pending
  └── POST /admin/eft-pending/:id/verify

Admin Dashboard
  └── "EFT Deposit Verification" panel
  └── Admin expands row → views proof → approve/reject with optional note
  └── Client notified by email on verify/reject

Client Portal (project page)
  └── Shows EFT verification status: Pending → Verified / Rejected
```

---

## 3. Data Model Changes

### 3.1 `ProjectRequest` — new fields

```prisma
model ProjectRequest {
  // ... existing fields ...
  referenceCode  String?   // PRJ-XXXXXX — human-readable reference
  proofFileId    String?   // files service ID of uploaded proof PDF
  eftVerification EftVerification?
}
```

### 3.2 New model: `EftVerification`

```prisma
model EftVerification {
  id               String    @id @default(cuid())
  projectRequestId String    @unique
  clientId         String
  proofFileId      String
  status           EftVerificationStatus @default(PENDING)
  verifiedBy       String?   // admin userId
  verifiedAt       DateTime?
  rejectedAt       DateTime?
  notes            String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  projectRequest   ProjectRequest @relation(fields: [projectRequestId], references: [id])
}

enum EftVerificationStatus {
  PENDING
  VERIFIED
  REJECTED
}
```

---

## 4. Reference Code Generation

- Generated **client-side** before form submission: `PRJ-` + 6 random uppercase alphanumeric chars (e.g. `PRJ-K7M2R9`)
- Uses `crypto.getRandomValues` for browser-safe randomness
- Sent as `referenceCode` in the `POST /projects/requests` body
- Stored on `ProjectRequest.referenceCode`
- Returned in the API response and captured in component state
- Displayed on success screen and included in bank transfer reference

---

## 5. New API Routes (Core Service)

### `PATCH /projects/requests/:id/eft-proof`
- **Auth:** CLIENT (own requests only)
- **Body:** `{ proofFileId: string }`
- Validates the file exists in files service
- Creates or updates `EftVerification` record with `status: PENDING`
- Updates `ProjectRequest.proofFileId`
- Sends admin notification email: "New EFT proof uploaded for PRJ-XXXXXX"
- Invalidates relevant cache keys

### `GET /admin/eft-pending`
- **Auth:** ADMIN / STAFF
- **Query:** `?status=PENDING|VERIFIED|REJECTED` (default: all)
- Returns `EftVerification` joined with `ProjectRequest` (client name, services, deposit amount, reference code, proof file name, submitted date)
- Ordered by `createdAt desc`

### `POST /admin/eft-pending/:id/verify`
- **Auth:** ADMIN / STAFF
- **Body:** `{ action: "VERIFY" | "REJECT", notes?: string }`
- Updates `EftVerification.status`, sets `verifiedBy`, `verifiedAt` / `rejectedAt`
- Sends client notification email: "Your EFT deposit has been verified / rejected"
- If rejected: includes instructions to re-upload

---

## 6. Success Screen (Client Portal)

### Layout — EFT payment

```
┌─────────────────────────────────────────────┐
│  ✓ (lime ring icon)                         │
│  Request submitted!                         │
│  Upload your proof of payment below...      │
├─────────────────────────────────────────────┤
│  REFERENCE          PRJ-K7M2R9    [Copy]    │
├──────────────┬──────────────┬───────────────┤
│ QUOTE        │ DEPOSIT      │ METHOD        │
│ R 45,000     │ R 13,500     │ EFT           │
├──────────────┴──────────────┴───────────────┤
│ PROJECT STATUS                              │
│  ✓──────────2──────────3──────────4         │
│  Request    Deposit    Proposal   Project   │
│  submitted  verif.     review     kickoff   │
├─────────────────────────────────────────────┤
│ [EFT badge] Upload proof of payment         │
│ Transfer R 13,500 to:                       │
│  Bank: FNB   Account: Maphari Tech          │
│  Acc no: XXXX   Reference: PRJ-K7M2R9       │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│   ↑ Drag PDF here / browse · max 10 MB      │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│ [Upload proof of payment]                   │
│ I'll upload this later from my dashboard →  │
└─────────────────────────────────────────────┘

WHAT HAPPENS NEXT
1. Team reviews proof within 1 business day
2. Project lead reaches out for kickoff call
3. Track progress — reference PRJ-K7M2R9
```

### States

| State | EFT section content | Timeline step |
|---|---|---|
| Just submitted, no upload | Upload zone + bank details | Step 2 active |
| Proof uploaded | File card + "verified within 1 day" message | Step 3 active |

### PayFast / non-EFT payments
- EFT section is **hidden entirely**
- Success screen shows reference, summary row, timeline only
- "What happens next" section still shown

---

## 7. Admin EFT Panel

Located as a dedicated section in the admin dashboard (own panel, not embedded in project list).

### States

| State | Description |
|---|---|
| Pending list | Rows: client name, reference pill, deposit, service, proof filename, age badge |
| Row expanded | PDF link, request summary (quote/deposit/services/date), notes textarea, Verify / Reject buttons |
| After verify | Green "Verified" badge, "Deposit verified — client notified by email" banner with top margin, proof + summary shown read-only |
| All clear | Empty state with green checkmark |

### Behaviour
- Rows are expandable in place (no navigation away)
- Count badge updates live after verify/reject
- Age badge turns amber to indicate waiting time
- Filter pills: All / Pending / Verified / Rejected

---

## 8. Email Notifications

### To admin (on proof upload)
- **Subject:** `New EFT proof uploaded — PRJ-K7M2R9`
- **Body:** Client name, deposit amount, reference, link to admin EFT panel

### To client (on verify)
- **Subject:** `Your deposit has been verified — PRJ-K7M2R9`
- **Body:** Confirmation message, next steps (project lead will be in touch)

### To client (on reject)
- **Subject:** `Action required: re-upload proof of payment — PRJ-K7M2R9`
- **Body:** Rejection reason (from admin notes), instructions to re-upload from project dashboard

---

## 9. Client Portal — Project Page Status

On the client's project detail page, show EFT verification status as a status badge:

- `PENDING` → amber "Deposit: Awaiting verification"
- `VERIFIED` → green "Deposit: Verified"
- `REJECTED` → red "Deposit: Proof rejected — please re-upload"

---

## 10. File Upload Constraints

- Format: PDF only
- Max size: 10 MB
- Uses existing files service: `createPortalUploadUrl` → confirm upload → store `fileId`
- File stored under client's namespace in files service

---

## 11. Out of Scope

- PayFast refund flows
- Partial deposit handling
- Automatic bank statement parsing / reconciliation
- Client re-upload flow from project dashboard (deferred — client can contact support)
