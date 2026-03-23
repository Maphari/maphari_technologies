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
  └── submits POST /projects/requests
  └── captures reqRes.data.id (real Project UUID) + reqRes.data.referenceCode into state
  └── replaces fake PRJ-${Date.now()} with real referenceCode from DB response
  └── shows bank details + PDF upload section (EFT only)
  └── uploads PDF → files service → confirms upload
  └── calls PATCH /projects/:id/eft-proof  (using real project id from state)

Core Service
  └── Project.referenceCode   (new field — @unique, generated server-side)
  └── EftVerification model   (new — single source of truth for proof + status)
  └── PATCH /projects/:id/eft-proof
  └── GET  /clients/:clientId/projects/:id/eft-status  (client-facing)
  └── GET  /admin/eft-pending
  └── POST /admin/eft-pending/:id/verify

Admin Dashboard
  └── "EFT Deposit Verification" panel
  └── Admin expands row → views proof → approve/reject with optional note
  └── Client notified by email on verify/reject

Client Portal (project page)
  └── Fetches GET /clients/:clientId/projects/:id/eft-status on load
  └── Shows: Pending → Verified / Rejected badge
```

---

## 3. Data Model Changes

> **Important:** There is no separate `ProjectRequest` model. The `POST /projects/requests`
> handler creates a **`Project`** record directly via `prisma.project.create()` and returns
> `toProjectDto(project)`. All new fields go on the `Project` model.

### 3.1 `Project` — new field

```prisma
model Project {
  // ... existing fields ...
  referenceCode   String?  @unique  // PRJ-XXXXXX — unique, generated server-side
  eftVerification EftVerification?
}
```

`referenceCode` is generated **server-side** inside the `POST /projects/requests` handler.
The server generates `PRJ-` + 6 random uppercase alphanumeric chars, checks for collision,
regenerates once if needed, and falls back to a CUID suffix to guarantee uniqueness.
`@unique` is enforced at the DB level. The field is returned in the response via
`toProjectDto(project)` and captured in frontend state as `submittedProject.referenceCode`.

`proofFileId` lives **only** on `EftVerification` (not on `Project`).

### 3.2 New model: `EftVerification`

```prisma
model EftVerification {
  id               String                @id @default(cuid())
  projectId        String                @unique  // FK to Project.id
  clientId         String                         // denormalized copy for query scoping
  proofFileId      String                // authoritative file reference
  proofFileName    String                // stored at upload time (no runtime lookup needed)
  status           EftVerificationStatus @default(PENDING)
  verifiedBy       String?               // admin userId
  verifiedAt       DateTime?
  rejectedAt       DateTime?
  rejectionReason  String?               // populated on REJECT, shown to client
  notes            String?               // internal admin note, not shown to client
  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt

  project          Project @relation(fields: [projectId], references: [id])
}

enum EftVerificationStatus {
  PENDING
  VERIFIED
  REJECTED
}
```

`rejectionReason` is the client-visible message (populated when `action = REJECT`).
`notes` is an internal admin annotation, never exposed to the client.

---

## 4. Reference Code Generation & Frontend State

### Server-side generation
- Generated inside `POST /projects/requests` handler: `PRJ-` + 6 random uppercase alphanumeric chars (e.g. `PRJ-K7M2R9`)
- Collision check: if the generated code already exists in DB, regenerate once; if still collides, use a CUID suffix to guarantee uniqueness
- `@unique` constraint enforced at DB level
- Included in the `Project` record and returned via `toProjectDto(project)` in the 201 response

### Frontend state change
The current `submitted: boolean` state is replaced with a richer object that captures the DB response:

```ts
// Replace:
const [submitted, setSubmitted] = useState(false);

// With:
const [submittedProject, setSubmittedProject] = useState<{
  id: string;           // real Project UUID — used for PATCH /projects/:id/eft-proof
  referenceCode: string; // PRJ-XXXXXX — displayed on success screen + bank reference
} | null>(null);

// At submission success (line ~1221), replace setSubmitted(true) with:
if (reqRes.data) {
  setSubmittedProject({ id: reqRes.data.id, referenceCode: reqRes.data.referenceCode });
}

// Success screen guard:
if (submittedProject) { ... }

// Reference display (replaces fake PRJ-${Date.now()}):
const refCode = submittedProject.referenceCode;

// EFT proof upload URL:
PATCH /projects/${submittedProject.id}/eft-proof
```

The `depositCents` and `quoteCents` values needed for the success screen summary are already
available in component state (`depositCents`, `quoteCents`) when the success screen renders —
no need to store them from the response.

---

## 5. New API Routes (Core Service)

### `PATCH /projects/:id/eft-proof`
- **Auth:** CLIENT (scoped to own project — `project.clientId` must match `scope.clientId`)
- **Body:** `{ proofFileId: string, proofFileName: string }`
- **File validation:** calls `GET /files/:proofFileId/meta` on the files service; if the file is not found or not owned by the client, returns `400 { code: "INVALID_PROOF_FILE", message: "..." }`. MIME type must be `application/pdf`; size must be ≤ 10 MB — validated via files service metadata. If files service is unreachable, return `502`.
- Creates `EftVerification` if none exists; updates `proofFileId`, `proofFileName`, resets `status` to `PENDING`, clears `rejectedAt` / `rejectionReason` (supports re-upload after rejection)
- Updates `ProjectRequest.proofFileId` is **not** done — `EftVerification` is the single source of truth
- Sends admin notification email (see Section 8)
- **Response:** `201` on create, `200` on update — `{ success: true, data: { status: "PENDING" } }`

### `GET /clients/:clientId/projects/:id/eft-status`
- **Auth:** CLIENT (must match own `clientId`), STAFF, ADMIN
- Returns current `EftVerification` status for the given project request
- **Response:**
  ```ts
  {
    success: true,
    data: {
      status: "PENDING" | "VERIFIED" | "REJECTED" | null,  // null = no proof uploaded yet
      rejectionReason: string | null,  // populated only on REJECTED
      verifiedAt: string | null,
      rejectedAt: string | null
    }
  }
  ```

### `GET /admin/eft-pending`
- **Auth:** ADMIN, STAFF (read-only for both)
- **Query:** `?status=PENDING|VERIFIED|REJECTED` (default: all, sorted by `createdAt desc`)
- **Response shape:**
  ```ts
  {
    success: true,
    data: Array<{
      id: string;                  // EftVerification.id
      projectId: string;
      referenceCode: string | null; // ProjectRequest.referenceCode — null for pre-migration requests (display as "—")
      clientId: string;
      clientName: string;          // joined from Client
      depositCents: number;        // from ProjectRequest
      services: string[];          // from ProjectRequest.selectedServices
      proofFileId: string;
      proofFileName: string;       // stored at upload time — no runtime files service call
      status: EftVerificationStatus;
      createdAt: string;           // ISO timestamp
      verifiedBy: string | null;
      verifiedAt: string | null;
      rejectedAt: string | null;
      rejectionReason: string | null;
    }>
  }
  ```

### `POST /admin/eft-pending/:id/verify`
- **Auth:** ADMIN only (STAFF may view but not approve/reject — financial accountability)
- **Body:** `{ action: "VERIFY" | "REJECT", rejectionReason?: string }`
- `REJECT` requires `rejectionReason` (non-empty); returns `400` if missing
- Updates `EftVerification`: sets `status`, `verifiedBy` (from `scope.userId`), `verifiedAt` or `rejectedAt`
- Sends client notification email (see Section 8)
- **Response:** `200 { success: true, data: { status: "VERIFIED" | "REJECTED" } }`

---

## 6. Success Screen (Client Portal)

The success screen is an **in-memory state** rendered after form submission. It is not a separate route — if the user navigates away the state is gone. The project dashboard page is the persistent view for ongoing status (see Section 9).

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

### Success screen states

| State | EFT section content | Timeline step active |
|---|---|---|
| Submitted, no proof uploaded | Upload zone + bank details | Step 2 |
| Proof uploaded (success) | File card + "We'll notify you within 1 business day" | Step 3 |

The success screen does **not** reflect VERIFIED/REJECTED states — those are only visible on the project dashboard page (see Section 9), since the client will have navigated away before admin acts.

### PayFast / non-EFT payments
- EFT section is **hidden entirely**
- Timeline has 3 steps (no deposit verification step): Submitted → Proposal review → Project kickoff
- "What happens next" adjusted accordingly

---

## 7. Admin EFT Panel

Located as a dedicated section in the admin dashboard.

### States

| State | Description |
|---|---|
| Pending list | Rows: client name, reference pill, deposit, service, proof filename, age badge |
| Row expanded | PDF link ("View proof document"), request summary (quote / deposit / services / submitted date), optional internal notes textarea, **Verify deposit** / **Reject — request new proof** buttons |
| After verify | Green "Verified" badge on row, "Deposit verified — client notified by email" banner (with `margin-top: 16px`), proof + summary shown read-only, no action buttons |
| After reject | Red "Rejected" badge, rejection reason shown, proof read-only |
| All clear | Empty state with green checkmark |

### Behaviour
- Rows expand in place — no navigation
- Count badge updates after verify/reject
- Age badge turns amber to surface waiting time
- Filter pills: All / Pending / Verified / Rejected
- STAFF role: can see all rows and expand but **Verify / Reject buttons are disabled**
- ADMIN role: full access including verify/reject

---

## 8. Email Notifications

### To admin (on proof upload)
- **Recipient:** All users with `role = ADMIN` — queried from the User table at send time
- **Subject:** `New EFT proof uploaded — PRJ-K7M2R9`
- **Body:** Client name, deposit amount (formatted as `R X,XXX`), reference code, direct link to admin EFT panel

### To client (on VERIFY)
- **Subject:** `Your deposit has been verified — PRJ-K7M2R9`
- **Body:** Confirmation that deposit of `R X,XXX` has been verified; next step — project lead will be in touch within 1 business day

### To client (on REJECT)
- **Subject:** `Action required: re-upload proof of payment — PRJ-K7M2R9`
- **Body:** Admin's `rejectionReason`, instructions to log in and re-upload from the project dashboard

---

## 9. Client Portal — Project Page Status

The project detail page fetches `GET /clients/:clientId/projects/:id/eft-status` on load.

Status badge display:

| `status` | Badge |
|---|---|
| `null` (no upload) | Amber — "Deposit: Proof not yet uploaded" |
| `PENDING` | Amber — "Deposit: Awaiting verification" |
| `VERIFIED` | Green — "Deposit: Verified ✓" |
| `REJECTED` | Red — "Deposit: Proof rejected — please re-upload" + rejection reason shown inline |

Re-upload from the project page is **in scope**: a "Re-upload" button appears on the REJECTED badge, opens a file picker, and calls `PATCH /projects/:id/eft-proof`.

---

## 10. File Upload Constraints

- Format: PDF only (`application/pdf`) — enforced client-side and re-validated server-side via files service metadata
- Max size: 10 MB — enforced client-side and re-validated server-side
- Upload flow: `createPortalUploadUrl` → client uploads directly → `confirmPortalUpload` → `proofFileId` returned → passed to `PATCH /projects/:id/eft-proof`
- `proofFileName` captured from the local `File` object at upload time and sent alongside `proofFileId`

---

## 11. Out of Scope

- PayFast refund flows
- Partial deposit handling
- Automatic bank statement parsing / reconciliation
