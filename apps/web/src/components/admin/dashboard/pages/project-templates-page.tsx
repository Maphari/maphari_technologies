"use client";

import { useState, useEffect, useRef } from "react";
import { cx, styles } from "../style";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAdminProjectTemplatesWithRefresh,
  createAdminProjectTemplateWithRefresh,
  deleteAdminProjectTemplateWithRefresh,
  applyAdminProjectTemplateWithRefresh,
  type ProjectTemplateSummary,
  type ProjectTemplatePhase,
} from "../../../../lib/api/admin/project-templates";
import type { AdminProject } from "../../../../lib/api/admin/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────

type ProjectTemplatesPageProps = {
  projects: AdminProject[];
};

export function ProjectTemplatesPage({ projects }: ProjectTemplatesPageProps) {
  const { session } = useAdminWorkspaceContext();

  const [templates, setTemplates] = useState<ProjectTemplateSummary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Create modal state
  const [createOpen, setCreateOpen]         = useState(false);
  const [createName, setCreateName]         = useState("");
  const [createDesc, setCreateDesc]         = useState("");
  const [createPhases, setCreatePhases]     = useState<ProjectTemplatePhase[]>([]);
  const [createSrcId, setCreateSrcId]       = useState("");
  const [createBusy, setCreateBusy]         = useState(false);
  const [createError, setCreateError]       = useState("");

  // Apply modal state
  const [applyTemplateId, setApplyTemplateId]   = useState<string | null>(null);
  const [applyProjectId, setApplyProjectId]     = useState("");
  const [applyBusy, setApplyBusy]               = useState(false);
  const [applyError, setApplyError]             = useState("");
  const [applyResult, setApplyResult]           = useState<{ phasesCreated: number; milestonesCreated: number; tasksCreated: number } | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loaded = useRef(false);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (loaded.current || !session) { setLoading(false); return; }
    loaded.current = true;
    void (async () => {
      try {
        const result = await loadAdminProjectTemplatesWithRefresh(session);
        if (result.nextSession) saveSession(result.nextSession);
        if (result.data) {
          setTemplates(result.data);
        } else if (result.error) {
          setError(result.error.message ?? "Failed to load templates.");
        }
      } catch (err: unknown) {
        setError((err as Error)?.message ?? "Failed to load templates.");
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  // ── Create ────────────────────────────────────────────────────────────────

  function resetCreateForm() {
    setCreateName("");
    setCreateDesc("");
    setCreatePhases([]);
    setCreateSrcId("");
    setCreateError("");
  }

  async function handleCreate() {
    if (!session || !createName.trim()) return;
    setCreateBusy(true);
    setCreateError("");
    try {
      const payload: { name: string; description?: string; phases: ProjectTemplatePhase[]; sourceProjectId?: string } = {
        name: createName.trim(),
        description: createDesc.trim() || undefined,
        phases: createSrcId ? [] : createPhases,
        ...(createSrcId ? { sourceProjectId: createSrcId } : {}),
      };
      const res = await createAdminProjectTemplateWithRefresh(session, payload);
      if (res.nextSession) saveSession(res.nextSession);
      if (res.data) {
        setTemplates((prev) => [res.data!, ...prev]);
        setCreateOpen(false);
        resetCreateForm();
      } else if (res.error) {
        setCreateError(res.error.message ?? "Failed to create template.");
      }
    } catch (err: unknown) {
      setCreateError((err as Error)?.message ?? "Failed to create template.");
    } finally {
      setCreateBusy(false);
    }
  }

  // ── Phase builder ─────────────────────────────────────────────────────────

  function addPhase() {
    setCreatePhases((prev) => [...prev, { name: "", milestones: [], tasks: [] }]);
  }

  function updatePhaseName(idx: number, name: string) {
    setCreatePhases((prev) => prev.map((ph, i) => i === idx ? { ...ph, name } : ph));
  }

  function removePhase(idx: number) {
    setCreatePhases((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── Apply ─────────────────────────────────────────────────────────────────

  async function handleApply() {
    if (!session || !applyTemplateId || !applyProjectId) return;
    setApplyBusy(true);
    setApplyError("");
    setApplyResult(null);
    try {
      const res = await applyAdminProjectTemplateWithRefresh(session, applyTemplateId, applyProjectId);
      if (res.nextSession) saveSession(res.nextSession);
      if (res.data) {
        setApplyResult(res.data);
      } else if (res.error) {
        setApplyError(res.error.message ?? "Failed to apply template.");
      }
    } catch (err: unknown) {
      setApplyError((err as Error)?.message ?? "Failed to apply template.");
    } finally {
      setApplyBusy(false);
    }
  }

  function closeApplyModal() {
    setApplyTemplateId(null);
    setApplyProjectId("");
    setApplyBusy(false);
    setApplyError("");
    setApplyResult(null);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!session || !deleteId) return;
    setDeleteBusy(true);
    try {
      const res = await deleteAdminProjectTemplateWithRefresh(session, deleteId);
      if (res.nextSession) saveSession(res.nextSession);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteId));
      setDeleteId(null);
    } catch {
      // silently close
      setDeleteId(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / OPERATIONS</div>
          <h1 className={styles.pageTitle}>Project Templates</h1>
          <div className={styles.pageSub}>Define reusable phase structures and apply them to new projects</div>
        </div>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            onClick={() => { resetCreateForm(); setCreateOpen(true); }}
          >
            + New Template
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={cx("colorRed", "text12", "mb12")}>{error}</div>
      )}

      {/* Templates table */}
      <div className={styles.pricTableCard}>
        <div className={styles.pricTableInner}>
          <div className={cx(styles.pricTableHead, "fontMono", "text10", "colorMuted", "uppercase")}>
            {"Name|Phases|Tasks|Created|Actions|".split("|").map((h, i) => <span key={`${h}-${i}`}>{h}</span>)}
          </div>

          {templates.map((tmpl, i) => (
            <div key={tmpl.id} className={cx(styles.pricTableRow, i < templates.length - 1 ? "borderB" : "")}>
              <span>
                <div className={cx("fw600")}>{tmpl.name}</div>
                {tmpl.description && <div className={cx("text11", "colorMuted")}>{tmpl.description}</div>}
              </span>
              <span className={cx("fontMono", "colorMuted", "text12")}>
                {tmpl.phaseCount} {tmpl.phaseCount === 1 ? "phase" : "phases"}
              </span>
              <span className={cx("fontMono", "colorMuted", "text12")}>
                {tmpl.taskCount} {tmpl.taskCount === 1 ? "task" : "tasks"}
              </span>
              <span className={cx("text11", "colorMuted")}>{fmtDate(tmpl.createdAt)}</span>
              <div className={cx("flexRow", "gap6")}>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  onClick={() => { setApplyTemplateId(tmpl.id); setApplyProjectId(""); }}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost", "colorRed")}
                  onClick={() => setDeleteId(tmpl.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className={styles.emptyTitle}>No templates yet</div>
              <div className={styles.emptySub}>Create your first project template to define reusable phase structures for new projects.</div>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => { resetCreateForm(); setCreateOpen(true); }}
              >
                + New Template
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Create modal ────────────────────────────────────────────────────── */}
      {createOpen && (
        <div
          className={styles.pricModalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) { setCreateOpen(false); resetCreateForm(); } }}
        >
          <div className={styles.pricModalBox}>
            <div className={cx("fw700", "text16", "mb20")}>New Project Template</div>

            <div className={cx("flexCol", "gap14")}>
              <div>
                <label className={styles.pricModalLabel}>Name *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Standard Agency Project"
                />
              </div>

              <div>
                <label className={styles.pricModalLabel}>Description</label>
                <textarea
                  className={styles.formInput}
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              {/* Save from project */}
              <div>
                <label className={styles.pricModalLabel}>Save from existing project (optional)</label>
                <select
                  title="Source project"
                  className={styles.formInput}
                  value={createSrcId}
                  onChange={(e) => setCreateSrcId(e.target.value)}
                >
                  <option value="">— Manual phase builder —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {createSrcId && (
                  <div className={cx("text11", "colorMuted", "mt4")}>
                    Phases will be imported automatically from the selected project.
                  </div>
                )}
              </div>

              {/* Phase builder — only shown when no source project selected */}
              {!createSrcId && (
                <div>
                  <div className={cx("flexRow", "gap8", "mb8")}>
                    <span className={styles.pricModalLabel}>Phases</span>
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={addPhase}>
                      + Add Phase
                    </button>
                  </div>
                  {createPhases.length === 0 && (
                    <div className={cx("text11", "colorMuted")}>No phases defined. Add at least one phase.</div>
                  )}
                  <div className={cx("flexCol", "gap8")}>
                    {createPhases.map((ph, idx) => (
                      <div key={idx} className={cx("flexRow", "gap8")}>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={ph.name}
                          onChange={(e) => updatePhaseName(idx, e.target.value)}
                          placeholder={`Phase ${idx + 1} name`}
                        />
                        <button
                          type="button"
                          className={cx("btnSm", "btnGhost", "colorRed")}
                          onClick={() => removePhase(idx)}
                          aria-label="Remove phase"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {createError && (
              <div className={cx("colorRed", "text12", "mt12")}>{createError}</div>
            )}

            <div className={cx("flexRow", "gap8", "flexEnd", "mt20")}>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => { setCreateOpen(false); resetCreateForm(); }}
                disabled={createBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                disabled={createBusy || !createName.trim() || (!createSrcId && createPhases.length === 0)}
                onClick={() => void handleCreate()}
              >
                {createBusy ? "Saving…" : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Apply modal ─────────────────────────────────────────────────────── */}
      {applyTemplateId && (
        <div
          className={styles.pricModalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) closeApplyModal(); }}
        >
          <div className={styles.pricModalBox}>
            <div className={cx("fw700", "text16", "mb20")}>Apply Template to Project</div>

            {applyResult ? (
              <div className={cx("flexCol", "gap12")}>
                <div className={cx("colorAccent", "fw600")}>Template applied successfully</div>
                <div className={cx("text12", "colorMuted")}>
                  {applyResult.phasesCreated} {applyResult.phasesCreated === 1 ? "phase" : "phases"} created,{" "}
                  {applyResult.milestonesCreated} {applyResult.milestonesCreated === 1 ? "milestone" : "milestones"} created,{" "}
                  {applyResult.tasksCreated} {applyResult.tasksCreated === 1 ? "task" : "tasks"} created
                </div>
                <div className={cx("flexRow", "gap8", "flexEnd", "mt8")}>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={closeApplyModal}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className={cx("flexCol", "gap14")}>
                <div>
                  <label className={styles.pricModalLabel}>Select project *</label>
                  <select
                    title="Target project"
                    className={styles.formInput}
                    value={applyProjectId}
                    onChange={(e) => setApplyProjectId(e.target.value)}
                  >
                    <option value="">— Choose a project —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {applyError && (
                  <div className={cx("colorRed", "text12")}>{applyError}</div>
                )}

                <div className={cx("flexRow", "gap8", "flexEnd", "mt8")}>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={closeApplyModal}
                    disabled={applyBusy}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    disabled={applyBusy || !applyProjectId}
                    onClick={() => void handleApply()}
                  >
                    {applyBusy ? "Applying…" : "Apply Template"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete confirm ───────────────────────────────────────────────────── */}
      {deleteId && (
        <div
          className={styles.pricModalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}
        >
          <div className={styles.pricModalBox}>
            <div className={cx("fw700", "text16", "mb12")}>Delete Template</div>
            <div className={cx("text13", "colorMuted", "mb20")}>
              Are you sure you want to delete this template? This cannot be undone.
            </div>
            <div className={cx("flexRow", "gap8", "flexEnd")}>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => setDeleteId(null)}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cx("btnSm", "btnGhost", "colorRed")}
                disabled={deleteBusy}
                onClick={() => void handleDelete()}
              >
                {deleteBusy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
