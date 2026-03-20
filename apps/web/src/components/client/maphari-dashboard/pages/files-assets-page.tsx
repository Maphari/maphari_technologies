// ════════════════════════════════════════════════════════════════════════════
// files-assets-page.tsx — File & Asset management for client portal
// Data     : loadPortalFilesWithRefresh → GET /files
//            createPortalUploadUrlWithRefresh → POST /files/upload-url
//            confirmPortalUploadWithRefresh   → POST /files/confirm-upload
//            getPortalFileDownloadUrlWithRefresh → GET /files/:id/download-url
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
  type PortalFile
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

function toFType(mimeType: string): FType {
  if (mimeType.includes("figma") || mimeType.includes("sketch") || mimeType.startsWith("image/")) return "Design";
  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) return "Media";
  if (mimeType.startsWith("text/plain") || mimeType.includes("json") || mimeType.includes("javascript")) return "Development";
  return "Documents"; // PDF, docx, zip, etc.
}

// ── Derived display type ──────────────────────────────────────────────────────

interface FileRow {
  id: string;
  name: string;
  type: FType;
  size: string;
  date: string;
}

function toFileRow(f: PortalFile): FileRow {
  return {
    id:   f.id.slice(0, 8).toUpperCase(),
    name: f.fileName,
    type: toFType(f.mimeType),
    size: formatBytes(f.sizeBytes),
    date: formatDate(f.createdAt),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FilesAssetsPage() {
  const { session } = useProjectLayer();
  const notify = usePageToast();
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [files,      setFiles]      = useState<PortalFile[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [tab,        setTab]        = useState<FTab>("All");
  const [viewMode,   setViewMode]   = useState<"list" | "grid">("list");
  const [query,      setQuery]      = useState("");
  const [uploading,  setUploading]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);

  // ── Load files on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setError(null);
    loadPortalFilesWithRefresh(session).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) { setError(result.error?.message ?? "Failed to load files"); return; }
      if (result.data) setFiles([...result.data]);
    }).finally(() => setLoading(false));
  }, [session]);

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
  const handleDownload = useCallback(async (fileId: string, fileName: string) => {
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
      <div className={cx("topCardsStack")}>
        {[
          { label: "Total Files",   value: loading ? "…" : String(rows.length),          color: "statCardAccent"  },
          { label: "Design Files",  value: loading ? "…" : String(designCount),           color: "statCardPurple"  },
          { label: "Documents",     value: loading ? "…" : String(docCount),              color: "statCardBlue"    },
          { label: "Total Size",    value: loading ? "…" : formatBytes(totalSizeBytes),   color: "statCardAmber"   },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
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
                  </div>
                  <div className={cx("flexRow", "justifyEnd", "mtAuto")}>
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost", "py4_px", "px10_px")}
                      onClick={() => handleDownload(f.id, f.name)}
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
                </div>
                <div className={cx("flexRow", "gap8", "noShrink")}>
                  <span className={cx("faExtBadge", "dynColor", "dynBgColor", "dynBorderColor")} style={{ "--color": extColor, "--bg-color": `color-mix(in oklab, ${extColor} 10%, transparent)`, "--border-color": `color-mix(in oklab, ${extColor} 22%, transparent)` } as React.CSSProperties}>{ext}</span>
                  <span className={cx("badge", TYPE_BADGE[f.type])}>{f.type}</span>
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    onClick={() => handleDownload(f.id, f.name)}
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
