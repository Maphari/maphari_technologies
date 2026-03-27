// ════════════════════════════════════════════════════════════════════════════
// files-assets-page.tsx — File & Asset management for client portal
// Data     : loadPortalFilesWithRefresh → GET /files
//            createPortalUploadUrlWithRefresh → POST /files/upload-url
//            confirmPortalUploadWithRefresh   → POST /files/confirm-upload
//            getPortalFileDownloadUrlWithRefresh → GET /files/:id/download-url
//            updatePortalFileApprovalWithRefresh → PATCH /files/:id/approval
//            loadPortalFileVersionsWithRefresh   → GET /files/:id/versions
// ════════════════════════════════════════════════════════════════════════════
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalFilesWithRefresh,
  createPortalUploadUrlWithRefresh,
  confirmPortalUploadWithRefresh,
  getPortalFileDownloadUrlWithRefresh,
  updatePortalFileApprovalWithRefresh,
  loadPortalFileVersionsWithRefresh,
  type PortalFile,
  type FileApprovalStatus
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";
import { usePageToast } from "../hooks/use-page-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type FTab  = "All" | "Design" | "Documents" | "Development" | "Media";
type FType = "Design" | "Documents" | "Development" | "Media";

// ── Static maps ───────────────────────────────────────────────────────────────

const TABS: FTab[] = ["All", "Design", "Documents", "Development", "Media"];

const TYPE_COLOR: Record<FType, string> = {
  Design:      "var(--purple)",
  Documents:   "var(--blue)",
  Development: "var(--lime)",
  Media:       "var(--amber)",
};

const TAB_COLOR: Record<FTab, string> = {
  All:         "var(--muted)",
  Design:      "var(--purple)",
  Documents:   "var(--blue)",
  Development: "var(--lime)",
  Media:       "var(--amber)",
};

const TYPE_BADGE: Record<FType, string> = {
  Design:      "badgePurple",
  Documents:   "badgeMuted",
  Development: "badgeAccent",
  Media:       "badgeAmber",
};

const TYPE_ICON: Record<FType, string> = {
  Design:      "layers",
  Documents:   "file",
  Development: "code",
  Media:       "video",
};

const EXT_COLOR: Record<string, string> = {
  ZIP:  "var(--lime)",
  FIG:  "var(--purple)",
  PDF:  "var(--red)",
  MP4:  "var(--amber)",
  PNG:  "var(--blue)",
  SVG:  "var(--green)",
  DOCX: "var(--accent)",
  MOV:  "var(--amber)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getExt(name: string): string {
  return name.split(".").pop()?.toUpperCase() ?? "";
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatDate(raw: string): string {
  return new Date(raw).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function exportFilesCsv(files: PortalFile[]): void {
  const header = ["File name", "Type", "Size bytes", "Approval", "Created", "Version note"];
  const lines = files.map((file) => [
    file.fileName,
    toFType(file.mimeType),
    String(file.sizeBytes),
    file.approvalStatus ?? "PENDING_REVIEW",
    file.createdAt,
    file.versionNote ?? "",
  ]);
  const escape = (value: string) => `"${value.replace(/"/g, "\"\"")}"`;
  const csv = [header, ...lines].map((line) => line.map((cell) => escape(String(cell))).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "files-and-assets.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function toFType(mimeType: string): FType {
  if (mimeType.includes("figma") || mimeType.includes("sketch") || mimeType.startsWith("image/")) return "Design";
  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) return "Media";
  if (mimeType.startsWith("text/plain") || mimeType.includes("json") || mimeType.includes("javascript")) return "Development";
  return "Documents"; // PDF, docx, zip, etc.
}

// ── Approval status helpers ───────────────────────────────────────────────────

function approvalBadgeClass(status: string): string {
  if (status === "APPROVED") return "badgeGreen";
  if (status === "CHANGES_REQUESTED") return "badgeRed";
  return "badgeAmber"; // PENDING_REVIEW
}

function approvalBadgeLabel(status: string): string {
  if (status === "APPROVED") return "Approved";
  if (status === "CHANGES_REQUESTED") return "Changes Requested";
  return "Awaiting Review";
}

// ── Derived display type ──────────────────────────────────────────────────────

interface FileRow {
  id: string;
  rawId: string;
  name: string;
  type: FType;
  size: string;
  date: string;
  approvalStatus: string;
}

function toFileRow(f: PortalFile): FileRow {
  return {
    id:             f.id.slice(0, 8).toUpperCase(),
    rawId:          f.id,
    name:           f.fileName,
    type:           toFType(f.mimeType),
    size:           formatBytes(f.sizeBytes),
    date:           formatDate(f.createdAt),
    approvalStatus: f.approvalStatus ?? "PENDING_REVIEW",
  };
}

// ── Version Panel ─────────────────────────────────────────────────────────────

interface VersionPanelProps {
  fileName: string;
  versions: PortalFile[];
  onClose: () => void;
}

function VersionPanel({ fileName, versions, onClose }: VersionPanelProps) {
  return (
    <>
      <div className={cx("faVersionPanelOverlay")} onClick={onClose} />
      <aside className={cx("faVersionPanel")}>
        <div className={cx("faVersionPanelHeader")}>
          <div className={cx("faVersionPanelTitle")}>Version History</div>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={onClose}>
            <Ic n="x" sz={14} c="var(--muted)" />
          </button>
        </div>
        <div className={cx("faVersionPanelBody")}>
          <div className={cx("text11", "colorMuted", "mb4")}>{fileName}</div>
          {versions.length <= 1 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="git-branch" sz={20} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No previous versions</div>
              <div className={cx("emptyStateSub")}>This is the only version of this file.</div>
            </div>
          ) : (
            versions.map((v, idx) => (
              <div
                key={v.id}
                className={cx("faVersionRow", idx === versions.length - 1 && "faVersionRowCurrent")}
              >
                {idx === versions.length - 1 && (
                  <div className={cx("faVersionRowLabel")}>Current</div>
                )}
                <div className={cx("fw600", "text12")}>{v.fileName}</div>
                <div className={cx("text10", "colorMuted")}>{formatDate(v.createdAt)}</div>
                {v.versionNote && (
                  <div className={cx("faVersionNote")}>{v.versionNote}</div>
                )}
                <div className={cx("flexRow", "gap5", "mt6")}>
                  <span className={cx("badge", approvalBadgeClass(v.approvalStatus ?? "PENDING_REVIEW"))}>
                    {approvalBadgeLabel(v.approvalStatus ?? "PENDING_REVIEW")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FilesAssetsPage() {
  const { session } = useProjectLayer();
  const notify = usePageToast();
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [files,           setFiles]           = useState<PortalFile[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [tab,             setTab]             = useState<FTab>("All");
  const [viewMode,        setViewMode]        = useState<"list" | "grid">("list");
  const [query,           setQuery]           = useState("");
  const [uploading,       setUploading]       = useState(false);
  const [uploadPct,       setUploadPct]       = useState(0);

  // Approval inline state: fileId → pending note input
  const [pendingNoteId,   setPendingNoteId]   = useState<string | null>(null);
  const [pendingNote,     setPendingNote]      = useState("");
  const [approving,       setApproving]       = useState<string | null>(null);

  // Versions panel state
  const [versionsFileId,  setVersionsFileId]  = useState<string | null>(null);
  const [versions,        setVersions]        = useState<PortalFile[]>([]);
  const [versionsName,    setVersionsName]    = useState("");

  // ── Load files on mount ───────────────────────────────────────────────────
  const loadFiles = useCallback(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    loadPortalFilesWithRefresh(session).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) { setError(result.error?.message ?? "Failed to load files"); return; }
      if (result.data) setFiles([...result.data]);
    }).finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  // ── Map to display rows ───────────────────────────────────────────────────
  const rows = useMemo(() => files.map(toFileRow), [files]);

  const filtered = useMemo(() => {
    let list = tab === "All" ? [...rows] : rows.filter((f) => f.type === tab);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [rows, tab, query]);

  // ── Upload handler (presigned PUT → confirm) ──────────────────────────────
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session) return;
    event.target.value = ""; // reset input

    setUploading(true);
    setUploadPct(0);

    try {
      // 1. Get presigned upload URL
      const urlResult = await createPortalUploadUrlWithRefresh(session, {
        fileName:  file.name,
        mimeType:  file.type || "application/octet-stream",
        sizeBytes: file.size,
        clientId:  session.user.clientId ?? undefined,
      });
      if (urlResult.nextSession) saveSession(urlResult.nextSession);
      if (!urlResult.data) {
        notify("error", "Upload failed", urlResult.error?.message ?? "Could not get upload URL");
        return;
      }

      // 2. PUT file directly to S3 presigned URL (bypasses gateway)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", urlResult.data!.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 error ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(file);
      });

      // 3. Confirm upload
      const confirmResult = await confirmPortalUploadWithRefresh(session, urlResult.data.fileId);
      if (confirmResult.nextSession) saveSession(confirmResult.nextSession);
      if (!confirmResult.data) {
        notify("error", "Upload incomplete", "File uploaded but confirmation failed");
        return;
      }

      // 4. Prepend new file to list
      const confirmed = confirmResult.data;
      if (confirmed) setFiles((prev) => [confirmed, ...prev]);
      notify("success", "File uploaded", file.name);
    } catch (err) {
      notify("error", "Upload failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  }, [session, notify]);

  // ── Download handler (presigned GET → window.open) ────────────────────────
  const handleDownload = useCallback(async (fileId: string) => {
    if (!session) return;
    // Find the original PortalFile by matching display id prefix
    const original = files.find((f) => f.id.slice(0, 8).toUpperCase() === fileId || f.id === fileId);
    if (!original) return;

    const result = await getPortalFileDownloadUrlWithRefresh(session, original.id);
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.data) {
      notify("error", "Download failed", "Could not get download link");
      return;
    }
    window.open(result.data.downloadUrl, "_blank", "noopener,noreferrer");
  }, [session, files, notify]);

  // ── Approval handler ──────────────────────────────────────────────────────
  const handleApprove = useCallback(async (rawId: string, status: FileApprovalStatus, note?: string) => {
    if (!session) return;
    setApproving(rawId);
    try {
      const result = await updatePortalFileApprovalWithRefresh(session, rawId, { status, note });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        notify("error", "Approval failed", result.error.message);
        return;
      }
      if (result.data) {
        setFiles((prev) => prev.map((f) => f.id === rawId ? { ...f, approvalStatus: result.data!.approvalStatus } : f));
      }
      notify("success", status === "APPROVED" ? "File approved" : "Changes requested", "");
      setPendingNoteId(null);
      setPendingNote("");
    } finally {
      setApproving(null);
    }
  }, [session, notify]);

  // ── Version panel handler ─────────────────────────────────────────────────
  const handleOpenVersions = useCallback(async (rawId: string, fileName: string) => {
    if (!session) return;
    setVersionsName(fileName);
    setVersionsFileId(rawId);
    setVersions([]);
    const result = await loadPortalFileVersionsWithRefresh(session, rawId);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error) {
      notify("error", "Version history unavailable", result.error.message ?? "Could not load version history.");
      setVersionsFileId(null);
      return;
    }
    if (result.data) setVersions(result.data);
  }, [session, notify]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalSizeBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
  const designCount    = rows.filter((f) => f.type === "Design").length;
  const docCount       = rows.filter((f) => f.type === "Documents").length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={cx("pageBody")}>

      {/* Hidden file input for upload */}
      <input
        ref={uploadInputRef}
        type="file"
        className={cx("dNone")}
        onChange={handleFileSelect}
      />

      {/* ── Version panel ───────────────────────────────────────────────── */}
      {versionsFileId && (
        <VersionPanel
          fileName={versionsName}
          versions={versions}
          onClose={() => { setVersionsFileId(null); setVersions([]); }}
        />
      )}

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Files · Assets</div>
          <h1 className={cx("pageTitle")}>Files & Assets</h1>
          <p className={cx("pageSub")}>All project files, deliverables, and assets in one place. Download anytime.</p>
        </div>
        <div className={cx("pageActions")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            disabled={loading || uploading}
            onClick={loadFiles}
          >
            Refresh
          </button>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            disabled={files.length === 0}
            onClick={() => exportFilesCsv(files)}
          >
            Export CSV
          </button>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            disabled={uploading}
            onClick={() => uploadInputRef.current?.click()}
          >
            <Ic n="upload" sz={13} c="var(--muted)" />
            {uploading ? `Uploading… ${uploadPct}%` : "Upload"}
          </button>
          {/* View toggle */}
          <div className={cx("faViewToggleWrap")}>
            <button
              type="button"
              className={cx("btnSm", viewMode === "list" ? "btnAccent" : "btnGhost", "faViewToggleBtnL")}
              onClick={() => setViewMode("list")}
            >
              <Ic n="list" sz={13} c={viewMode === "list" ? "var(--bg)" : "var(--muted)"} />
            </button>
            <button
              type="button"
              className={cx("btnSm", viewMode === "grid" ? "btnAccent" : "btnGhost", "faViewToggleBtnR")}
              onClick={() => setViewMode("grid")}
            >
              <Ic n="grid" sz={13} c={viewMode === "grid" ? "var(--bg)" : "var(--muted)"} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className={cx("grid4", "gap12", "mb20")}>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Total files</div>
          <div className={cx("text22", "fw800", "colorAccent")}>{loading ? "…" : String(rows.length)}</div>
          <div className={cx("text12", "colorMuted")}>Files currently available in your portal</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Design files</div>
          <div className={cx("text22", "fw800", "colorPurple")}>{loading ? "…" : String(designCount)}</div>
          <div className={cx("text12", "colorMuted")}>Images, design source files, and prototypes</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Documents</div>
          <div className={cx("text22", "fw800", "colorBlue")}>{loading ? "…" : String(docCount)}</div>
          <div className={cx("text12", "colorMuted")}>Documents, briefs, PDFs, and delivery notes</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Total size</div>
          <div className={cx("text22", "fw800", "colorAmber")}>{loading ? "…" : formatBytes(totalSizeBytes)}</div>
          <div className={cx("text12", "colorMuted")}>Combined size of the current file library</div>
        </div>
      </div>

      {error && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
          <button type="button" className={cx("btn", "btnPrimary", "mt12")} onClick={loadFiles}>
            Retry
          </button>
        </div>
      )}

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className={cx("relative")}>
        <span className={cx("searchIconWrap")}>
          <Ic n="filter" sz={13} c="var(--muted2)" />
        </span>
        <input
          className={cx("input", "pl36")}
          placeholder={`Search ${rows.length} file${rows.length !== 1 ? "s" : ""}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* ── Category tabs ───────────────────────────────────────────────── */}
      <div className={cx("pillTabs")}>
        {TABS.map((t) => (
          <button key={t} type="button" className={cx("pillTab", tab === t && "pillTabActive")} onClick={() => setTab(t)}>
            {t !== "All" && (
              <span className={cx("dot6", "inlineBlock", "mr5", "noShrink")} style={{ "--bg-color": TAB_COLOR[t] } as React.CSSProperties} />
            )}
            {t}
          </button>
        ))}
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading ? (
        <div className={cx("skeletonBlock", "h200")} />
      ) : filtered.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="file" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>{files.length === 0 ? "No files yet" : "No files match your search"}</div>
          <div className={cx("emptyStateSub")}>{files.length === 0 ? "Files and deliverables shared with you will appear here." : "Try a different search term or category."}</div>
        </div>
      ) : viewMode === "grid" ? (

        /* ── Grid view ──────────────────────────────────────────────────── */
        <div className={cx("faGridWrap")}>
          {filtered.map((f) => {
            const color    = TYPE_COLOR[f.type];
            const ext      = getExt(f.name);
            const extColor = EXT_COLOR[ext] ?? "var(--muted2)";
            const isLoading = approving === f.rawId;
            return (
              <div key={f.id} className={cx("card", "p0", "overflowHidden", "flexCol")}>
                <div className={cx("h3", "dynBgColor", "noShrink")} style={{ "--bg-color": color } as React.CSSProperties} />
                <div className={cx("p16x14x14", "flexCol", "flex1")}>
                  <div className={cx("flexBetween", "mb12")}>
                    <div className={cx("faFileIconBox", "dynBgColor", "dynBorderColor")} style={{ "--bg-color": `color-mix(in oklab, ${color} 12%, var(--s2))`, "--border-color": `color-mix(in oklab, ${color} 25%, transparent)` } as React.CSSProperties}>
                      <Ic n={TYPE_ICON[f.type]} sz={18} c={color} />
                    </div>
                    <span className={cx("faExtBadge", "dynColor", "dynBgColor", "dynBorderColor")} style={{ "--color": extColor, "--bg-color": `color-mix(in oklab, ${extColor} 10%, transparent)`, "--border-color": `color-mix(in oklab, ${extColor} 22%, transparent)` } as React.CSSProperties}>{ext}</span>
                  </div>
                  <div className={cx("fw600", "text11", "faFileName")}>{f.name}</div>
                  <div className={cx("text10", "colorMuted", "mb10")}>{f.size} · {f.date}</div>
                  <div className={cx("flexRow", "gap5", "flexWrap", "mb12")}>
                    <span className={cx("badge", TYPE_BADGE[f.type])}>{f.type}</span>
                    <span className={cx("badge", approvalBadgeClass(f.approvalStatus))}>{approvalBadgeLabel(f.approvalStatus)}</span>
                  </div>
                  {/* Approval actions for PENDING_REVIEW */}
                  {f.approvalStatus === "PENDING_REVIEW" && (
                    <div className={cx("faApprovalActions", "mb8")}>
                      <button
                        type="button"
                        className={cx("btnSm", "btnAccent")}
                        disabled={isLoading}
                        onClick={() => handleApprove(f.rawId, "APPROVED")}
                      >
                        Approve
                      </button>
                      {pendingNoteId === f.rawId ? (
                        <div className={cx("faNoteInputWrap")}>
                          <input
                            className={cx("input", "faNoteInput")}
                            placeholder="Note (optional)"
                            value={pendingNote}
                            onChange={(e) => setPendingNote(e.target.value)}
                          />
                          <button
                            type="button"
                            className={cx("btnSm", "btnGhost")}
                            disabled={isLoading}
                            onClick={() => handleApprove(f.rawId, "CHANGES_REQUESTED", pendingNote || undefined)}
                          >
                            Send
                          </button>
                          <button
                            type="button"
                            className={cx("btnSm", "btnGhost")}
                            onClick={() => { setPendingNoteId(null); setPendingNote(""); }}
                          >
                            <Ic n="x" sz={11} c="var(--muted)" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={cx("btnSm", "btnGhost")}
                          onClick={() => { setPendingNoteId(f.rawId); setPendingNote(""); }}
                        >
                          Request Changes
                        </button>
                      )}
                    </div>
                  )}
                  <div className={cx("flexRow", "justifyEnd", "mtAuto", "gap5")}>
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost", "py4_px", "px10_px")}
                      title="Version history"
                      onClick={() => handleOpenVersions(f.rawId, f.name)}
                    >
                      <Ic n="git-branch" sz={12} c="var(--muted)" />
                    </button>
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost", "py4_px", "px10_px")}
                      onClick={() => handleDownload(f.id)}
                    >
                      <Ic n="download" sz={12} c="var(--muted)" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* ── List view ──────────────────────────────────────────────────── */
        <div className={cx("card", "p0", "overflowHidden")}>
          {filtered.map((f, idx) => {
            const color    = TYPE_COLOR[f.type];
            const ext      = getExt(f.name);
            const extColor = EXT_COLOR[ext] ?? "var(--muted2)";
            const isLoading = approving === f.rawId;
            return (
              <div
                key={f.id}
                className={cx("faListRow", "dynBorderColor", idx === 0 && "faListRowFirst")}
                style={{ "--border-color": color } as React.CSSProperties}
              >
                <div className={cx("faFileIconBoxSm", "dynBgColor", "dynBorderColor")} style={{ "--bg-color": `color-mix(in oklab, ${color} 12%, var(--s2))`, "--border-color": `color-mix(in oklab, ${color} 25%, transparent)` } as React.CSSProperties}>
                  <Ic n={TYPE_ICON[f.type]} sz={16} c={color} />
                </div>
                <div className={cx("flex1", "minW0")}>
                  <div className={cx("flexRow", "gap7", "mb4", "flexWrap")}>
                    <span className={cx("badge", "badgeMuted")}>{f.id}</span>
                    <span className={cx("fw600", "text12", "truncate")}>{f.name}</span>
                  </div>
                  <span className={cx("text10", "colorMuted")}>{f.size} · {f.date}</span>
                  {/* Approval inline note input (CHANGES_REQUESTED flow) */}
                  {pendingNoteId === f.rawId && (
                    <div className={cx("faNoteInputWrap", "mt6")}>
                      <input
                        className={cx("input", "faNoteInput")}
                        placeholder="Note (optional)"
                        value={pendingNote}
                        onChange={(e) => setPendingNote(e.target.value)}
                      />
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        disabled={isLoading}
                        onClick={() => handleApprove(f.rawId, "CHANGES_REQUESTED", pendingNote || undefined)}
                      >
                        Send
                      </button>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        onClick={() => { setPendingNoteId(null); setPendingNote(""); }}
                      >
                        <Ic n="x" sz={11} c="var(--muted)" />
                      </button>
                    </div>
                  )}
                </div>
                <div className={cx("flexRow", "gap8", "noShrink", "flexWrap")}>
                  <span className={cx("faExtBadge", "dynColor", "dynBgColor", "dynBorderColor")} style={{ "--color": extColor, "--bg-color": `color-mix(in oklab, ${extColor} 10%, transparent)`, "--border-color": `color-mix(in oklab, ${extColor} 22%, transparent)` } as React.CSSProperties}>{ext}</span>
                  <span className={cx("badge", TYPE_BADGE[f.type])}>{f.type}</span>
                  <span className={cx("badge", approvalBadgeClass(f.approvalStatus))}>{approvalBadgeLabel(f.approvalStatus)}</span>
                  {/* Approve / Request Changes (PENDING_REVIEW only) */}
                  {f.approvalStatus === "PENDING_REVIEW" && pendingNoteId !== f.rawId && (
                    <>
                      <button
                        type="button"
                        className={cx("btnSm", "btnAccent")}
                        disabled={isLoading}
                        onClick={() => handleApprove(f.rawId, "APPROVED")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        onClick={() => { setPendingNoteId(f.rawId); setPendingNote(""); }}
                      >
                        Request Changes
                      </button>
                    </>
                  )}
                  {/* History button */}
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    title="Version history"
                    onClick={() => handleOpenVersions(f.rawId, f.name)}
                  >
                    <Ic n="git-branch" sz={13} c="var(--muted)" />
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    onClick={() => handleDownload(f.id)}
                  >
                    <Ic n="download" sz={13} c="var(--bg)" /> Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
