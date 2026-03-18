// ════════════════════════════════════════════════════════════════════════════
// document-vault-page.tsx — Admin Document Vault
// Data: GET /admin/documents (files service → VaultDocument[])
// Upload: POST /files/inline → POST /admin/documents
// Export: GET /admin/documents/export-index (CSV download)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import {
  loadDocumentsWithRefresh,
  createDocumentWithRefresh,
  archiveDocumentWithRefresh,
  type VaultDocument,
  type DocCategory,
} from "../../../../lib/api/admin/documents";

// ── Types ─────────────────────────────────────────────────────────────────────

type DocCategoryFilter = "All" | "Contract" | "Brief" | "Deliverable" | "Invoice" | "Asset" | "Template" | "Misc";
type Tab = "all documents" | "by client" | "contracts" | "analytics";

const tabs: Tab[] = ["all documents", "by client", "contracts", "analytics"];
const categories: DocCategoryFilter[] = ["All", "Contract", "Brief", "Deliverable", "Invoice", "Asset", "Template", "Misc"];

// Maps each doc.category value to a CSS module class for coloring the badge text
const CATEGORY_CLASS_MAP: Record<string, string> = {
  CONTRACT:    "dvtCatBlue",
  BRIEF:       "dvtCatPurple",
  DELIVERABLE: "dvtCatAccent",
  INVOICE:     "dvtCatAmber",
  ASSET:       "dvtCatCyan",
  TEMPLATE:    "dvtCatGreen",
  MISC:        "dvtCatMuted",
};

function fmtBytes(n: number): string {
  if (n < 1024)          return `${n} B`;
  if (n < 1024 * 1024)   return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({
  session,
  onClose,
  onUploaded,
  onError,
}: {
  session: AuthSession;
  onClose: () => void;
  onUploaded: (doc: VaultDocument) => void;
  onError: (msg: string) => void;
}) {
  const [title,    setTitle]    = useState("");
  const [category, setCategory] = useState<DocCategory>("MISC");
  const [desc,     setDesc]     = useState("");
  const [file,     setFile]     = useState<File | null>(null);
  const [busy,     setBusy]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !file) return;
    setBusy(true);

    try {
      // Read file as base64 for inline upload
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      // 1. Upload file content via /files/inline
      const base = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:4000/api/v1";
      const uploadRes = await fetch(`${base}/files/inline`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          fileName:      file.name,
          mimeType:      file.type || "application/octet-stream",
          contentBase64: base64,
        }),
      });
      const uploadPayload = await uploadRes.json() as { success: boolean; data?: { storageKey: string } };
      if (!uploadPayload.success || !uploadPayload.data?.storageKey) {
        onError("File upload failed — could not store the file.");
        return;
      }

      // 2. Create vault document record
      const result = await createDocumentWithRefresh(session, {
        title:       title.trim(),
        category,
        description: desc.trim() || undefined,
        fileName:    file.name,
        mimeType:    file.type || "application/octet-stream",
        sizeBytes:   file.size,
        storageKey:  uploadPayload.data.storageKey,
      });

      if (result.error || !result.data) {
        onError(result.error?.message ?? "Failed to create document record.");
        return;
      }

      onUploaded(result.data);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className={styles.dvtUploadOverlay}
      />
      <div className={styles.dvtUploadCenter}>
        <div className={styles.dvtUploadBox}>
          <div className={cx("flexBetween", "mb20")}>
            <span className={cx("fw700", "text14")}>Upload Document</span>
            <button type="button" onClick={onClose} className={styles.dvtUploadCloseBtn}>×</button>
          </div>

          <div className={cx("flexCol", "gap14")}>
            {/* Title */}
            <div>
              <label className={cx("text11", "colorMuted", "block", "mb6")}>Document Title *</label>
              <input
                className={cx("filterInput", "wFull")}
                placeholder="e.g. NDA — Acme Corp"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Category */}
            <div>
              <label className={cx("text11", "colorMuted", "block", "mb6")}>Category</label>
              <select
                title="Document category"
                className={cx("filterSelect", "wFull")}
                value={category}
                onChange={(e) => setCategory(e.target.value as DocCategory)}
              >
                {(["CONTRACT", "BRIEF", "DELIVERABLE", "INVOICE", "ASSET", "TEMPLATE", "MISC"] as DocCategory[]).map((c) => (
                  <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className={cx("text11", "colorMuted", "block", "mb6")}>Description (optional)</label>
              <textarea
                className={cx("filterInput", styles.dvtTextarea)}
                placeholder="Brief description of this document"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            {/* File picker */}
            <div>
              <label className={cx("text11", "colorMuted", "block", "mb6")}>File *</label>
              <input
                ref={fileRef}
                type="file"
                className={cx("hidden")}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                className={cx("btnSm", "btnGhost", "wFull")}
                onClick={() => fileRef.current?.click()}
              >
                {file ? `${file.name} (${fmtBytes(file.size)})` : "Choose file…"}
              </button>
            </div>
          </div>

          <div className={cx("flexRow", "gap10", "mt20")}>
            <button type="button" className={cx("btnSm", "btnGhost", "flex1")} onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className={cx("btnSm", "btnAccent", "flex1")}
              onClick={handleSubmit}
              disabled={busy || !title.trim() || !file}
            >
              {busy ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DocumentVaultPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "info" | "warning", message: string) => void;
}) {
  const [activeTab,    setActiveTab]    = useState<Tab>("all documents");
  const [filterCat,    setFilterCat]    = useState<DocCategoryFilter>("All");
  const [documents,    setDocuments]    = useState<VaultDocument[]>([]);
  const [stats,        setStats]        = useState<{ byCategory: Record<string, number>; byStatus: Record<string, number> }>({ byCategory: {}, byStatus: {} });
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [showUpload,   setShowUpload]   = useState(false);
  const [archivingId,  setArchivingId]  = useState<string | null>(null);

  const isConnected = session !== null;

  // ── Load documents ────────────────────────────────────────────────────────
  const loadDocs = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const catFilter = filterCat === "All" ? undefined : filterCat.toUpperCase();
      const result = await loadDocumentsWithRefresh(session, { category: catFilter, status: "ALL" });
      if (result.data) {
        setDocuments(result.data.documents);
        setStats(result.data.stats);
        setTotal(result.data.total);
      } else if (result.error) {
        onNotify("error", result.error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [session, filterCat, onNotify]);

  useEffect(() => { void loadDocs(); }, [loadDocs]);

  // ── Filtered documents (for current tab) ─────────────────────────────────
  const visibleDocs = documents.filter((d) => {
    if (activeTab === "contracts")    return d.category === "CONTRACT";
    if (activeTab === "by client")    return d.clientId !== null;
    return true; // "all documents"
  });

  // ── Export index ──────────────────────────────────────────────────────────
  const handleExportIndex = useCallback(() => {
    if (!session || documents.length === 0) return;

    const header = "ID,Title,Category,Status,File Name,Size (bytes),Uploaded By,Created At";
    const rows = documents.map((d) =>
      [
        d.id,
        `"${d.title.replace(/"/g, '""')}"`,
        d.category,
        d.status,
        `"${d.fileName.replace(/"/g, '""')}"`,
        d.sizeBytes,
        d.uploadedBy,
        d.createdAt,
      ].join(",")
    );
    const csv  = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `maphari-document-vault-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify("success", "Document index exported as CSV.");
  }, [session, documents, onNotify]);

  // ── Archive document ──────────────────────────────────────────────────────
  const handleArchive = async (id: string) => {
    if (!session) return;
    setArchivingId(id);
    try {
      const result = await archiveDocumentWithRefresh(session, id);
      if (result.error) {
        onNotify("error", result.error.message);
      } else {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        onNotify("success", "Document archived.");
      }
    } finally {
      setArchivingId(null);
    }
  };

  // ── Stat cards ────────────────────────────────────────────────────────────
  const activeCount   = stats.byStatus["PUBLISHED"] ?? 0;
  const contractCount = stats.byCategory["CONTRACT"] ?? 0;
  const reviewCount   = stats.byStatus["DRAFT"] ?? 0;

  return (
    <div className={cx(styles.pageBody, styles.dvtRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 className={styles.pageTitle}>Document Vault</h1>
          <div className={styles.pageSub}>Contracts · Briefs · Deliverables · Assets · Version control</div>
        </div>
        <div className={styles.dvtHeadActions}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={handleExportIndex}
            disabled={documents.length === 0}
          >
            Export Index
          </button>
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            onClick={() => isConnected && setShowUpload(true)}
            disabled={!isConnected}
          >
            + Upload Document
          </button>
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Total Documents",   value: String(total),         color: "var(--accent)", sub: total === 1 ? "1 document" : `${total} documents` },
          { label: "Active Contracts",  value: String(contractCount), color: "var(--blue)",   sub: "All clients" },
          { label: "In Review / Draft", value: String(reviewCount),   color: "var(--amber)",  sub: "Pending publish" },
          { label: "Published",         value: String(activeCount),   color: isConnected ? "var(--accent)" : "var(--red)", sub: isConnected ? "Available" : "No session" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs + category filter ─────────────────────────────────────── */}
      <div className={styles.filterRow}>
        <select
          title="Filter by tab"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as Tab)}
          className={styles.filterSelect}
        >
          {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {activeTab === "all documents" && (
          <select
            title="Filter by category"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as DocCategoryFilter)}
            className={styles.filterSelect}
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {loading && (
          <span className={cx("text11", "colorMuted", "mlAuto")}>
            Loading…
          </span>
        )}
      </div>

      {/* ── Document list ─────────────────────────────────────────────── */}
      {activeTab !== "analytics" ? (
        visibleDocs.length === 0 ? (
          <div className={cx("card", "p32")}>
            <div className={cx("flexCol", "gap12", styles.dvtEmptyState)}>
              <div className={cx("text14", "fw700")}>
                {loading ? "Loading documents…" : "No Documents"}
              </div>
              {!loading && (
                <div className={cx("text13", "colorMuted")}>
                  {!isConnected
                    ? "Sign in to view documents."
                    : activeTab === "contracts"
                    ? "No contracts uploaded yet."
                    : activeTab === "by client"
                    ? "No client-linked documents yet."
                    : "Upload your first document using the button above."}
                </div>
              )}
              {!loading && isConnected && (
                <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowUpload(true)}>
                  + Upload Document
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={cx("card")}>
            {/* Table header */}
            <div className={styles.dvtTableHead}>
              {["Document", "Category", "Status", "Size", "Uploaded", ""].map((h) => (
                <span key={h} className={cx("text10", "colorMuted", "fw700", "uppercase")}>
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {visibleDocs.map((doc) => (
              <div
                key={doc.id}
                className={styles.dvtTableRow}
              >
                {/* Title + filename */}
                <div>
                  <div className={cx("fw600", "text12", "mb3")}>{doc.title}</div>
                  <div className={cx("text10", "colorMuted")}>{doc.fileName}</div>
                </div>

                {/* Category badge */}
                <span
                  className={cx("badge", "badgeMuted", styles.dvtCatBadge, CATEGORY_CLASS_MAP[doc.category] ?? "dvtCatMuted")}
                >
                  {doc.category}
                </span>

                {/* Status badge */}
                <span className={cx(
                  "badge",
                  doc.status === "PUBLISHED" ? "badgeGreen" :
                  doc.status === "DRAFT"     ? "badgeAmber" : "badgeMuted"
                )}>
                  {doc.status.charAt(0) + doc.status.slice(1).toLowerCase()}
                </span>

                {/* Size */}
                <span className={cx("fontMono", "text11", "colorMuted")}>{fmtBytes(doc.sizeBytes)}</span>

                {/* Date */}
                <span className={cx("text11", "colorMuted")}>{fmtDate(doc.createdAt)}</span>

                {/* Archive button */}
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost", archivingId === doc.id && styles.dvtArchiveBusy)}
                  disabled={archivingId === doc.id}
                  onClick={() => { void handleArchive(doc.id); }}
                >
                  {archivingId === doc.id ? "…" : "Archive"}
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── Analytics tab ──────────────────────────────────────── */
        <div className={styles.dvtAnalyticsSplit}>
          <div className={cx("card", "p24")}>
            <div className={styles.dvtSectionTitle}>Documents by Category</div>
            {(["CONTRACT", "BRIEF", "DELIVERABLE", "INVOICE", "ASSET", "TEMPLATE", "MISC"] as const).map((cat) => {
              const count = stats.byCategory[cat] ?? 0;
              const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cat} className={styles.dvtBarRow}>
                  <span className={styles.text12}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                  <div className={styles.dvtTrack120}>
                    <progress
                      className={cx(styles.dvtBarFillAccent, "uiProgress")}
                      max={100}
                      value={pct}
                      aria-label={`${cat} ${count} documents`}
                    />
                  </div>
                  <span className={cx(styles.dvtBarCount, "colorAccent")}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className={cx("card", "p24")}>
            <div className={styles.dvtSectionTitle}>Status Distribution</div>
            {Object.keys(stats.byStatus).length === 0 ? (
              <div className={cx("text13", "colorMuted")}>No documents to analyse yet.</div>
            ) : (
              Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className={styles.dvtStatusRow}>
                  <span className={cx("text12")}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                  <span className={cx("fw700", "text12", "colorAccent")}>{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Upload Modal ─────────────────────────────────────────────── */}
      {showUpload && session && (
        <UploadModal
          session={session}
          onClose={() => setShowUpload(false)}
          onUploaded={(doc) => {
            setDocuments((prev) => [doc, ...prev]);
            setTotal((prev) => prev + 1);
            setShowUpload(false);
            onNotify("success", `"${doc.title}" uploaded successfully.`);
          }}
          onError={(msg) => {
            onNotify("error", msg);
          }}
        />
      )}
    </div>
  );
}
