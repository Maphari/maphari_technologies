// ════════════════════════════════════════════════════════════════════════════
// proposals-page.tsx — Admin Proposal Builder
// Data     : loadAdminProposalsWithRefresh + loadClientDirectoryWithRefresh
//            createAdminProposalWithRefresh | deleteAdminProposalWithRefresh
//            draftProposalWithAI
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAdminProposalsWithRefresh,
  createAdminProposalWithRefresh,
  deleteAdminProposalWithRefresh,
  type AdminProposalSummary,
  type AdminProposalItem,
} from "../../../../lib/api/admin/proposals";
import { loadClientDirectoryWithRefresh } from "../../../../lib/api/admin";
import type { AdminClient } from "../../../../lib/api/admin";
import { draftProposalWithAI } from "../../../../lib/api/admin/ai";

// ── Draft item type (local state) ────────────────────────────────────────────

interface DraftItem {
  key: string;
  description: string;
  icon: string;
  amountZar: string; // display as ZAR string, convert to cents on submit
  sortOrder: number;
}

function newDraftItem(sortOrder: number): DraftItem {
  return {
    key: `item-${Date.now()}-${sortOrder}`,
    description: "",
    icon: "star",
    amountZar: "",
    sortOrder,
  };
}

function zarToCents(zarStr: string): number {
  const val = parseFloat(zarStr);
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
}

function centsToZar(cents: number): string {
  return (cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function proposalTotal(items: DraftItem[]): number {
  return items.reduce((sum, it) => sum + zarToCents(it.amountZar), 0);
}

function statusLabel(status: string): string {
  switch (status) {
    case "DRAFT":    return "Draft";
    case "PENDING":  return "Pending";
    case "ACCEPTED": return "Accepted";
    case "DECLINED": return "Declined";
    case "EXPIRED":  return "Expired";
    default:         return status;
  }
}

function statusClass(status: string): string {
  switch (status) {
    case "DRAFT":    return styles.propStatusDraft    ?? "";
    case "PENDING":  return styles.propStatusPending  ?? "";
    case "ACCEPTED": return styles.propStatusAccepted ?? "";
    case "DECLINED": return styles.propStatusDeclined ?? "";
    case "EXPIRED":  return styles.propStatusExpired  ?? "";
    default:         return "";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProposalsPage({ session }: { session: AuthSession | null }) {
  // ── List state ─────────────────────────────────────────────────────────────
  const [proposals, setProposals] = useState<AdminProposalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Clients (for dropdown) ─────────────────────────────────────────────────
  const [clients, setClients] = useState<AdminClient[]>([]);

  // ── Create modal ───────────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createClientId, setCreateClientId] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createSummary, setCreateSummary] = useState("");
  const [createValidUntil, setCreateValidUntil] = useState("");
  const [createItems, setCreateItems] = useState<DraftItem[]>(() => [newDraftItem(0)]);

  // ── AI fill ────────────────────────────────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // ── Drag-to-reorder ────────────────────────────────────────────────────────
  const dragSrcIdx = useRef<number | null>(null);

  // ── Confirm send modal ─────────────────────────────────────────────────────
  const [confirmSend, setConfirmSend] = useState(false);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Load data on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    Promise.all([
      loadAdminProposalsWithRefresh(session),
      loadClientDirectoryWithRefresh(session),
    ]).then(([propRes, clientRes]) => {
      if (propRes.nextSession) saveSession(propRes.nextSession);
      if (clientRes.nextSession) saveSession(clientRes.nextSession);

      if (propRes.error) {
        setError(propRes.error.message);
      } else {
        setProposals(propRes.data ?? []);
      }

      setClients(clientRes.data?.items ?? []);
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load proposals.");
    }).finally(() => {
      setLoading(false);
    });
  }, [session]);

  // ── Reset create form ──────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setCreateClientId("");
    setCreateTitle("");
    setCreateSummary("");
    setCreateValidUntil("");
    setCreateItems([newDraftItem(0)]);
    setCreateError(null);
    setAiError(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setShowCreate(true);
  }, [resetForm]);

  const closeCreate = useCallback(() => {
    setShowCreate(false);
    setConfirmSend(false);
  }, []);

  // ── Draft item helpers ─────────────────────────────────────────────────────

  const updateItem = useCallback((idx: number, field: keyof DraftItem, value: string) => {
    setCreateItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }, []);

  const addItem = useCallback(() => {
    setCreateItems((prev) => [...prev, newDraftItem(prev.length)]);
  }, []);

  const removeItem = useCallback((idx: number) => {
    setCreateItems((prev) => {
      const next = prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sortOrder: i }));
      return next;
    });
  }, []);

  // ── Drag-to-reorder handlers ───────────────────────────────────────────────

  const handleDragStart = useCallback((idx: number) => {
    dragSrcIdx.current = idx;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((dropIdx: number) => {
    const srcIdx = dragSrcIdx.current;
    if (srcIdx === null || srcIdx === dropIdx) return;

    setCreateItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(srcIdx, 1);
      next.splice(dropIdx, 0, moved);
      return next.map((it, i) => ({ ...it, sortOrder: i }));
    });

    dragSrcIdx.current = null;
  }, []);

  const handleDragEnd = useCallback(() => {
    dragSrcIdx.current = null;
  }, []);

  // ── AI fill ────────────────────────────────────────────────────────────────

  const handleAiFill = useCallback(async () => {
    if (!session) return;
    if (!createClientId && !createTitle) {
      setAiError("Set a client or title first so AI has context.");
      return;
    }
    setAiLoading(true);
    setAiError(null);

    try {
      const result = await draftProposalWithAI(session, {
        clientId: createClientId || undefined,
        prompt: `Draft a project proposal for: ${createTitle}. Scope: ${createSummary || "not specified"}`,
      });

      if (result.nextSession) saveSession(result.nextSession);

      if (result.error) {
        setAiError(result.error.message);
        return;
      }

      const content = result.data?.response ?? "";

      // Set summary: first 500 chars of content
      const summaryText = content.slice(0, 500).trimEnd();
      setCreateSummary(summaryText);

      // Parse numbered list items: lines starting with "1.", "2.", etc.
      const lines = content.split("\n");
      const parsed: string[] = [];
      for (const line of lines) {
        const match = /^\d+\.\s+(.+)/.exec(line.trim());
        if (match && match[1]) {
          parsed.push(match[1].trim());
        }
      }

      if (parsed.length > 0) {
        setCreateItems((prev) => {
          const base = [...prev];
          const offset = base.length;
          const newItems: DraftItem[] = parsed.map((desc, i) => ({
            key: `ai-${Date.now()}-${i}`,
            description: desc,
            icon: "star",
            amountZar: "",
            sortOrder: offset + i,
          }));
          return [...base, ...newItems].map((it, i) => ({ ...it, sortOrder: i }));
        });
      }
    } catch (err: unknown) {
      setAiError((err as Error)?.message ?? "AI fill failed.");
    } finally {
      setAiLoading(false);
    }
  }, [session, createClientId, createTitle, createSummary]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (status: "DRAFT" | "PENDING") => {
    if (!session) return;
    if (!createClientId) { setCreateError("Select a client."); return; }
    if (!createTitle.trim()) { setCreateError("Enter a title."); return; }

    setCreateBusy(true);
    setCreateError(null);

    try {
      const totalCents = proposalTotal(createItems);
      const items: AdminProposalItem[] = createItems.map((it) => ({
        description: it.description,
        icon: it.icon || "star",
        amountCents: zarToCents(it.amountZar),
        sortOrder: it.sortOrder,
      }));

      const result = await createAdminProposalWithRefresh(session, {
        clientId: createClientId,
        title: createTitle.trim(),
        summary: createSummary.trim() || undefined,
        status,
        currency: "ZAR",
        validUntil: createValidUntil || undefined,
        items,
      });

      if (result.nextSession) saveSession(result.nextSession);

      if (result.error) {
        setCreateError(result.error.message);
        setCreateBusy(false);
        return;
      }

      if (result.data) {
        // Patch amountCents from items since backend may compute it
        const proposal: AdminProposalSummary = {
          ...result.data,
          amountCents: result.data.amountCents || totalCents,
        };
        setProposals((prev) => [proposal, ...prev]);
      }

      closeCreate();
    } catch (err: unknown) {
      setCreateError((err as Error)?.message ?? "Failed to create proposal.");
    } finally {
      setCreateBusy(false);
    }
  }, [session, createClientId, createTitle, createSummary, createValidUntil, createItems, closeCreate]);

  const handleSendToClient = useCallback(() => {
    setConfirmSend(true);
  }, []);

  const handleConfirmSend = useCallback(() => {
    setConfirmSend(false);
    void handleSubmit("PENDING");
  }, [handleSubmit]);

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: string) => {
    if (!session) return;
    setDeleteId(id);
    setDeleteBusy(true);
    setDeleteError(null);

    try {
      const result = await deleteAdminProposalWithRefresh(session, id);
      if (result.nextSession) saveSession(result.nextSession);

      if (result.error) {
        setDeleteError(result.error.message);
        return;
      }

      setProposals((prev) => prev.filter((p) => p.id !== id));
      setDeleteId(null);
    } catch (err: unknown) {
      setDeleteError((err as Error)?.message ?? "Failed to delete.");
    } finally {
      setDeleteBusy(false);
    }
  }, [session]);

  // ── Subtotal ───────────────────────────────────────────────────────────────
  const subtotalCents = proposalTotal(createItems);
  const subtotalDisplay = `R ${centsToZar(subtotalCents)}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={cx("propPage")}>

      {/* Header */}
      <div className={cx("propHeader")}>
        <span className={cx("propTitle")}>Proposals</span>
        <button
          className={cx("btnSm")}
          onClick={openCreate}
          type="button"
        >
          + New Proposal
        </button>
      </div>

      {/* Error */}
      {error ? <div className={cx("propError")}>{error}</div> : null}

      {/* Loading */}
      {loading ? (
        <div className={cx("propEmpty")}>Loading proposals...</div>
      ) : null}

      {/* Empty */}
      {!loading && !error && proposals.length === 0 ? (
        <div className={cx("propEmpty")}>No proposals yet. Create one to get started.</div>
      ) : null}

      {/* Proposal grid */}
      {!loading && proposals.length > 0 ? (
        <div className={cx("propGrid")}>
          {proposals.map((p) => {
            const client = clients.find((c) => c.id === p.clientId);
            const clientName = client?.name ?? p.clientId;
            const isDraft = p.status === "DRAFT" || p.status === "PENDING";

            return (
              <div key={p.id} className={cx("propCard")}>
                <div className={cx("propCardTitle")}>{p.title}</div>
                <div className={cx("propCardMeta")}>
                  {clientName}
                  {p.validUntil ? ` · Valid until ${new Date(p.validUntil).toLocaleDateString("en-ZA")}` : ""}
                  {` · ${new Date(p.createdAt).toLocaleDateString("en-ZA")}`}
                </div>
                <div className={cx("propCardAmount")}>R {centsToZar(p.amountCents)}</div>
                <div className={cx("propCardActions")}>
                  <span className={cx("propStatusChip", statusClass(p.status))}>
                    {statusLabel(p.status)}
                  </span>
                  {isDraft ? (
                    <button
                      className={cx("btnSm")}
                      type="button"
                      disabled={deleteBusy && deleteId === p.id}
                      onClick={() => void handleDelete(p.id)}
                    >
                      {deleteBusy && deleteId === p.id ? "Deleting..." : "Delete"}
                    </button>
                  ) : null}
                </div>
                {deleteError && deleteId === p.id ? (
                  <div className={cx("propDeleteError")}>{deleteError}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Create modal */}
      {showCreate ? (
        <div className={cx("modalOverlay")}>
          <div className={cx("modal")} style={undefined}>
            {/* Modal is wider for line items */}
            <div className={cx("modalHd")}>
              <span className={cx("modalTitle")}>New Proposal</span>
              <button className={cx("btnGhost")} type="button" onClick={closeCreate}>
                ✕
              </button>
            </div>

            <div className={cx("modalBody")}>

              {/* Client selector */}
              <div>
                <label className={cx("label")}>Client</label>
                <select
                  className={cx("select")}
                  value={createClientId}
                  onChange={(e) => setCreateClientId(e.target.value)}
                >
                  <option value="">Select client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className={cx("label")}>Title</label>
                <input
                  className={cx("input")}
                  type="text"
                  placeholder="e.g. Q2 Web Development Proposal"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                />
              </div>

              {/* AI Fill */}
              <div>
                <button
                  className={cx("propAiBtn")}
                  type="button"
                  disabled={aiLoading}
                  onClick={() => void handleAiFill()}
                >
                  {aiLoading ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      AI filling...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Fill
                    </>
                  )}
                </button>
                {aiError ? <div className={cx("propDeleteError")}>{aiError}</div> : null}
              </div>

              {/* Summary */}
              <div>
                <label className={cx("label")}>Summary (optional)</label>
                <textarea
                  className={cx("textarea")}
                  placeholder="Brief description of scope and deliverables..."
                  rows={4}
                  value={createSummary}
                  onChange={(e) => setCreateSummary(e.target.value)}
                />
              </div>

              {/* Valid Until */}
              <div>
                <label className={cx("label")}>Valid Until (optional)</label>
                <input
                  className={cx("input")}
                  type="date"
                  value={createValidUntil}
                  onChange={(e) => setCreateValidUntil(e.target.value)}
                />
              </div>

              {/* Line items */}
              <div className={cx("propItemsSection")}>
                <div className={cx("propItemsLabel")}>Line Items</div>
                <div className={cx("propItemHead")}>
                  <span>Description</span>
                  <span>Amount (ZAR)</span>
                  <span>Icon</span>
                  <span />
                </div>

                {createItems.map((item, idx) => (
                  <div
                    key={item.key}
                    className={cx("propItemRow")}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                    onDragEnd={handleDragEnd}
                  >
                    <input
                      className={cx("input")}
                      type="text"
                      placeholder="e.g. UI Design"
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                    />
                    <input
                      className={cx("input")}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={item.amountZar}
                      onChange={(e) => updateItem(idx, "amountZar", e.target.value)}
                    />
                    <input
                      className={cx("input")}
                      type="text"
                      placeholder="star"
                      value={item.icon}
                      onChange={(e) => updateItem(idx, "icon", e.target.value)}
                    />
                    {createItems.length > 1 ? (
                      <button
                        className={cx("btnGhost")}
                        type="button"
                        onClick={() => removeItem(idx)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}

                <div className={cx("propSubtotal")}>Subtotal: {subtotalDisplay}</div>

                <button
                  className={cx("btnSm")}
                  type="button"
                  onClick={addItem}
                >
                  + Add Line Item
                </button>
              </div>

              {/* Error */}
              {createError ? <div className={cx("propError")}>{createError}</div> : null}

              {/* Footer actions */}
              <div className={cx("propCardActions")}>
                <button
                  className={cx("btnGhost")}
                  type="button"
                  onClick={closeCreate}
                  disabled={createBusy}
                >
                  Cancel
                </button>
                <button
                  className={cx("btnSm")}
                  type="button"
                  disabled={createBusy}
                  onClick={() => void handleSubmit("DRAFT")}
                >
                  {createBusy ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  className={cx("btnSm")}
                  type="button"
                  disabled={createBusy}
                  onClick={handleSendToClient}
                >
                  Send to Client
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirm send modal */}
      {confirmSend ? (
        <div className={cx("propConfirmOverlay")}>
          <div className={cx("propConfirmBox")}>
            <div className={cx("propConfirmTitle")}>Send Proposal to Client?</div>
            <div className={cx("propConfirmBody")}>
              Are you sure you want to send this proposal to the client? They will be notified and can accept or decline it.
            </div>
            <div className={cx("propConfirmActions")}>
              <button
                className={cx("btnGhost")}
                type="button"
                onClick={() => setConfirmSend(false)}
                disabled={createBusy}
              >
                Cancel
              </button>
              <button
                className={cx("btnSm")}
                type="button"
                disabled={createBusy}
                onClick={handleConfirmSend}
              >
                {createBusy ? "Sending..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
