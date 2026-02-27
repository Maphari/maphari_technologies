import { useMemo, useState } from "react";
import type { PortalFile } from "../../../../lib/api/portal";
import { cx, styles } from "../style";

type ClientDocumentsPageProps = {
  active: boolean;
  files: PortalFile[];
  activeProjectName: string;
  onDownloadAgreementTemplate: () => void;
};

type Category = "All Files" | "Contracts" | "Design" | "Technical" | "Invoices" | "Reports" | "Credentials" | "Gallery";
type ViewMode  = "grid" | "list";

type FileTag = { tone: "accent" | "purple" | "amber" | "red" | "muted"; label: string };
type VersionItem = { num: string; name: string; by: string; date: string; current: boolean };
type FileItem = {
  id: number;
  icon: string;
  iconBg: string;
  iconColor: string;
  name: string;
  project: string;
  date: string;
  size: string;
  version: string;
  category: string;
  tags: FileTag[];
  versions: VersionItem[];
};

/* ─── Tag tone → badge class ───────────────────────────────────────────── */
const TAG_CLASS: Record<FileTag["tone"], string> = {
  accent: styles.badgeAccent,
  purple: styles.badgePurple,
  amber:  styles.badgeAmber,
  red:    styles.badgeRed,
  muted:  styles.badgeMuted,
};

/* ─── Seed data ─────────────────────────────────────────────────────────── */

const FILES: FileItem[] = [
  {
    id: 1, icon: "📄", iconBg: "rgba(255,95,95,0.1)", iconColor: "var(--red)",
    name: "Contract-ClientPortal-v2-Signed.pdf", project: "Client Portal v2",
    date: "Jan 08, 2026", size: "2.4 MB", version: "v1", category: "contracts",
    tags: [{ tone: "red", label: "contract" }, { tone: "accent", label: "signed" }],
    versions: [{ num: "v1", name: "Final signed copy", by: "Naledi D.", date: "Jan 08", current: true }]
  },
  {
    id: 2, icon: "🎨", iconBg: "var(--purple-d)", iconColor: "var(--purple)",
    name: "Design-System-Screens-v3.fig", project: "Client Portal v2",
    date: "Feb 09, 2026", size: "18.6 MB", version: "v3", category: "design",
    tags: [{ tone: "purple", label: "design" }, { tone: "amber", label: "in review" }],
    versions: [
      { num: "v3", name: "Latest — in review",     by: "Lerato M.", date: "Feb 09", current: true  },
      { num: "v2", name: "Post-feedback revision",  by: "Lerato M.", date: "Feb 03", current: false },
      { num: "v1", name: "Initial delivery",        by: "Lerato M.", date: "Jan 28", current: false },
    ]
  },
  {
    id: 3, icon: "📋", iconBg: "rgba(245,166,35,0.1)", iconColor: "var(--amber)",
    name: "SOW-LeadPipeline-2026.pdf", project: "Lead Pipeline",
    date: "Jan 14, 2026", size: "1.1 MB", version: "v1", category: "contracts",
    tags: [{ tone: "amber", label: "sow" }, { tone: "accent", label: "signed" }],
    versions: [{ num: "v1", name: "Signed SOW", by: "Sipho N.", date: "Jan 14", current: true }]
  },
  {
    id: 4, icon: "🔧", iconBg: "var(--accent-d)", iconColor: "var(--accent)",
    name: "API-Documentation-v2.pdf", project: "Lead Pipeline",
    date: "Feb 16, 2026", size: "892 KB", version: "v2", category: "technical",
    tags: [{ tone: "accent", label: "api" }, { tone: "accent", label: "staging" }],
    versions: [
      { num: "v2", name: "Updated endpoints", by: "Thabo K.", date: "Feb 16", current: true  },
      { num: "v1", name: "Initial spec",       by: "Thabo K.", date: "Feb 10", current: false },
    ]
  },
  {
    id: 5, icon: "🧾", iconBg: "rgba(255,95,95,0.1)", iconColor: "var(--red)",
    name: "INV-2026-008-Receipt.pdf", project: "Veldt Finance",
    date: "Feb 15, 2026", size: "156 KB", version: "v1", category: "invoices",
    tags: [{ tone: "accent", label: "paid" }, { tone: "red", label: "invoice" }],
    versions: [{ num: "v1", name: "Payment receipt", by: "System", date: "Feb 15", current: true }]
  },
  {
    id: 6, icon: "📊", iconBg: "var(--purple-d)", iconColor: "var(--purple)",
    name: "QA-Report-Sprint4.pdf", project: "Client Portal v2",
    date: "Feb 17, 2026", size: "440 KB", version: "v1", category: "reports",
    tags: [{ tone: "purple", label: "qa" }, { tone: "accent", label: "passed" }],
    versions: [{ num: "v1", name: "Sprint 4 QA report", by: "Nomsa D.", date: "Feb 17", current: true }]
  },
  {
    id: 7, icon: "📝", iconBg: "var(--accent-d)", iconColor: "var(--accent)",
    name: "Meeting-Notes-Q1-Kickoff.md", project: "All Projects",
    date: "Feb 12, 2026", size: "28 KB", version: "v1", category: "documents",
    tags: [{ tone: "muted", label: "notes" }],
    versions: [{ num: "v1", name: "Kickoff notes", by: "Aisha P.", date: "Feb 12", current: true }]
  },
  {
    id: 8, icon: "🔑", iconBg: "rgba(245,166,35,0.1)", iconColor: "var(--amber)",
    name: "Credentials-StagingEnv.enc", project: "Client Portal v2",
    date: "Feb 14, 2026", size: "4 KB", version: "v1", category: "credentials",
    tags: [{ tone: "amber", label: "secure" }, { tone: "amber", label: "encrypted" }],
    versions: [{ num: "v1", name: "Staging credentials", by: "James M.", date: "Feb 14", current: true }]
  },
];

const CATEGORIES: Category[] = ["All Files", "Contracts", "Design", "Technical", "Invoices", "Reports", "Credentials", "Gallery"];

function mapPortalFiles(files: PortalFile[], activeProjectName: string): FileItem[] {
  if (files.length === 0) return FILES;
  return files.slice(0, 12).map((file, idx) => {
    const lower = file.fileName.toLowerCase();
    const category =
      lower.includes("contract") || lower.includes("agreement") ? "contracts"
      : lower.includes("fig") || lower.includes("design")        ? "design"
      : lower.includes("invoice") || lower.includes("receipt")   ? "invoices"
      : lower.includes("report")                                  ? "reports"
      : lower.includes("cred") || lower.includes("secret") || lower.includes("key") ? "credentials"
      : "technical";
    const icon      = category === "contracts" ? "📄" : category === "design" ? "🎨" : category === "invoices" ? "🧾" : category === "reports" ? "📊" : category === "credentials" ? "🔑" : "🔧";
    const iconBg    = category === "design" ? "var(--purple-d)" : category === "invoices" || category === "contracts" ? "rgba(255,95,95,0.1)" : category === "reports" ? "rgba(52,217,139,0.1)" : category === "credentials" ? "rgba(245,166,35,0.1)" : "var(--accent-d)";
    const iconColor = category === "design" ? "var(--purple)" : category === "invoices" || category === "contracts" ? "var(--red)" : category === "reports" ? "var(--green)" : category === "credentials" ? "var(--amber)" : "var(--accent)";
    return {
      id: idx + 1, icon, iconBg, iconColor,
      name: file.fileName, project: activeProjectName,
      date: new Date(file.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      size: file.sizeBytes > 1024 * 1024 ? `${(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(file.sizeBytes / 1024))} KB`,
      version: "v1", category,
      tags: [{ tone: "muted" as const, label: category }],
      versions: [{ num: "v1", name: "Latest upload", by: "Portal", date: "Now", current: true }]
    };
  });
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function ClientDocumentsPage({ active, files, activeProjectName }: ClientDocumentsPageProps) {
  const [viewMode, setViewMode]       = useState<ViewMode>("grid");
  const [activeTab, setActiveTab]     = useState<Category>("All Files");
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState<Set<number>>(new Set());
  const [versionFile, setVersionFile] = useState<FileItem | null>(null);
  const [dragging, setDragging]       = useState(false);
  const [toast, setToast]             = useState<{ text: string; sub: string } | null>(null);
  /* F8 — Gallery / Lightbox */
  const [lightbox, setLightbox]       = useState<FileItem | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  /* File request modal */
  const [fileRequestModal, setFileRequestModal] = useState(false);
  const [fileRequestDesc, setFileRequestDesc]   = useState("");

  const items = useMemo(() => mapPortalFiles(files, activeProjectName), [files, activeProjectName]);

  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3200);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelect = () => setSelected(new Set());

  const filtered = useMemo(() => {
    return items.filter((file) => {
      const cat         = activeTab.toLowerCase().replace(" files", "");
      const matchCat    = activeTab === "All Files" || activeTab === "Gallery" || file.category === cat;
      const q           = search.toLowerCase();
      const matchSearch = file.name.toLowerCase().includes(q) || file.project.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeTab, items, search]);

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-docs">

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Work</div>
          <div className={styles.pageTitle}>Files & Documents</div>
          <p className={styles.pageSub}>Preview, version-compare, and share all project assets securely.</p>
        </div>
        <div className={styles.headerRight}>
          <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={() => setFileRequestModal(true)}>
            Request File
          </button>
          <button type="button" className={cx(styles.button, styles.buttonGhost)} onClick={() => showToast("Share link created", "Link expires in 7 days")}>
            🔗 Expiring Link
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        style={{
          margin: "0 28px", flexShrink: 0,
          border: `1px dashed ${dragging ? "var(--accent)" : "var(--border2)"}`,
          background: dragging ? "var(--accent-d)" : "transparent",
          padding: "20px 28px", display: "flex", alignItems: "center", gap: 16, transition: "all 0.2s"
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); showToast("File uploaded", "Processing and indexing your file"); }}
      >
        <span style={{ fontSize: "1.6rem" }}>📂</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 3 }}>Drop files here to upload</div>
          <div style={{ fontSize: "0.62rem", color: "var(--muted)" }}>PDF, Figma, DOCX, PNG — max 50 MB · auto-tagged by project</div>
        </div>
        <button type="button" className={cx(styles.button, styles.buttonGhost)} onClick={() => showToast("File picker opened", "Choose files from your device")}>
          Browse
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 28px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", flexShrink: 0 }}>
        <div className={styles.filterBar} style={{ border: "none", padding: 0, background: "transparent", flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => (
            <button key={cat} type="button" className={cx(styles.filterTab, activeTab === cat && styles.filterTabActive)} onClick={() => setActiveTab(cat)}>
              {cat}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg)", border: "1px solid var(--border)", padding: "7px 12px" }}>
            <span style={{ color: "var(--muted2)" }}>⌕</span>
            <input
              style={{ background: "none", border: "none", color: "var(--text)", fontSize: "0.7rem", width: 180, outline: "none" }}
              placeholder="Search files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", border: "1px solid var(--border)" }}>
            {(["grid", "list"] as const).map((mode) => (
              <button
                key={mode} type="button"
                style={{
                  width: 32, height: 32, background: viewMode === mode ? "var(--accent-d)" : "transparent",
                  border: "none", color: viewMode === mode ? "var(--accent)" : "var(--muted)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", transition: "all 0.15s"
                }}
                onClick={() => setViewMode(mode)}
              >
                {mode === "grid" ? "⊞" : "☰"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content + version panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: activeTab === "Gallery" ? 0 : "20px 28px 40px" }}>
          {/* F8 — Gallery view */}
          {activeTab === "Gallery" ? (
            <div className={styles.galleryGrid}>
              {filtered.map((file, idx) => (
                <div
                  key={file.id}
                  className={styles.galleryCard}
                  onClick={() => { setLightbox(file); setLightboxIdx(idx); }}
                >
                  <div className={styles.galleryPreview} style={{ background: file.iconBg }}>
                    <span style={{ fontSize: "2.4rem" }}>{file.icon}</span>
                  </div>
                  <div className={styles.galleryMeta}>
                    <div className={styles.galleryName}>{file.name}</div>
                    <div className={styles.galleryProject}>{file.project} · {file.date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "6px 12px 12px" }}>
                    {file.tags.map((t) => (
                      <span key={t.label} className={cx(styles.badge, TAG_CLASS[t.tone])}>{t.label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === "grid" ? (
            <div className={styles.fileGrid}>
              {filtered.map((file) => (
                <div
                  key={file.id}
                  className={styles.fileCard}
                  style={{
                    border: `1px solid ${selected.has(file.id) ? "var(--accent)" : "var(--border)"}`,
                    background: selected.has(file.id) ? "var(--accent-d)" : "var(--surface)",
                    position: "relative"
                  }}
                >
                  <div
                    style={{
                      position: "absolute", top: 10, left: 10, width: 18, height: 18,
                      border: `1px solid ${selected.has(file.id) ? "var(--accent)" : "var(--border2)"}`,
                      background: selected.has(file.id) ? "var(--accent)" : "var(--bg)",
                      borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                    }}
                    onClick={() => toggleSelect(file.id)}
                  >
                    {selected.has(file.id) ? <span style={{ fontSize: "0.5rem", color: "var(--on-accent)", fontWeight: 700 }}>✓</span> : null}
                  </div>
                  {file.version !== "v1" ? (
                    <div style={{ position: "absolute", top: 10, right: 10, fontSize: "0.52rem", fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: "var(--purple-d)", color: "var(--purple)" }}>
                      {file.version}
                    </div>
                  ) : null}
                  <div className={styles.fileIcon} style={{ background: file.iconBg, color: file.iconColor, fontSize: "1.1rem" }}>
                    {file.icon}
                  </div>
                  <div className={styles.fileName} title={file.name}>{file.name}</div>
                  <div className={styles.fileMeta}>{file.project} · {file.size}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                    {file.tags.map((tag, i) => (
                      <span key={`${file.id}-${i}`} className={cx(styles.badge, TAG_CLASS[tag.tone])}>{tag.label}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" className={cx(styles.button, styles.buttonAccent, styles.buttonSm)} style={{ flex: 1 }} onClick={() => showToast("Previewing", file.name)}>Preview</button>
                    <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)} onClick={() => showToast("Downloading", file.name)}>↓</button>
                    {file.versions.length > 1 ? (
                      <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)} onClick={() => setVersionFile(file)}>v{file.versions.length}</button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "grid", gridTemplateColumns: "32px 40px 1fr 120px 100px 80px 140px", padding: "4px 14px", marginBottom: 4 }}>
                {["", "", "Name", "Project", "Date", "Size", "Actions"].map((h, i) => (
                  <span key={`hdr-${i}`} style={{ fontSize: "0.54rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted2)" }}>{h}</span>
                ))}
              </div>
              {filtered.map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: "grid", gridTemplateColumns: "32px 40px 1fr 120px 100px 80px 140px",
                    alignItems: "center", padding: "10px 14px",
                    background: "var(--surface)",
                    border: `1px solid ${selected.has(file.id) ? "var(--accent)" : "var(--border)"}`,
                    transition: "all 0.15s"
                  }}
                >
                  <div
                    style={{
                      width: 18, height: 18, border: `1px solid ${selected.has(file.id) ? "var(--accent)" : "var(--border2)"}`,
                      background: selected.has(file.id) ? "var(--accent)" : "var(--bg)",
                      borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                    }}
                    onClick={() => toggleSelect(file.id)}
                  >
                    {selected.has(file.id) ? <span style={{ fontSize: "0.5rem", color: "var(--on-accent)", fontWeight: 700 }}>✓</span> : null}
                  </div>
                  <div style={{ fontSize: "0.9rem" }}>{file.icon}</div>
                  <div>
                    <div style={{ fontSize: "0.76rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 12 }}>{file.name}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 3 }}>
                      {file.tags.slice(0, 2).map((tag, i) => (
                        <span key={`${file.id}-lt-${i}`} className={cx(styles.badge, TAG_CLASS[tag.tone])}>{tag.label}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>{file.project}</div>
                  <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>{file.date}</div>
                  <div style={{ fontSize: "0.6rem", color: "var(--muted2)" }}>{file.size}</div>
                  <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                    <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)} onClick={() => showToast("Previewing", file.name)}>View</button>
                    <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)} onClick={() => showToast("Downloading", file.name)}>↓</button>
                    {file.versions.length > 1 ? (
                      <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)} onClick={() => setVersionFile(file)}>{file.version}</button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Version history side panel */}
        {versionFile ? (
          <div style={{ width: 280, flexShrink: 0, background: "var(--surface)", borderLeft: "1px solid var(--border)", padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, marginBottom: 4 }}>Version History</div>
              <div style={{ fontSize: "0.6rem", color: "var(--muted)", wordBreak: "break-all" }}>{versionFile.name}</div>
            </div>
            <div style={{ height: 1, background: "var(--border)" }} />
            {versionFile.versions.map((v) => (
              <div key={`${versionFile.id}-${v.num}`} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--accent)", width: 28, flexShrink: 0 }}>{v.num}</div>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, marginBottom: 2 }}>{v.name}</div>
                  <div style={{ fontSize: "0.56rem", color: "var(--muted)" }}>{v.by} · {v.date}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                    <button type="button" className={cx(styles.button, styles.buttonSm, v.current ? styles.buttonAccent : styles.buttonGhost)}>
                      {v.current ? "Current" : "Restore"}
                    </button>
                    <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)} onClick={() => showToast("Downloading", `${versionFile.name} ${v.num}`)}>
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: "var(--border)" }} />
            <button type="button" className={cx(styles.button, styles.buttonGhost)} style={{ width: "100%", fontSize: "0.62rem" }} onClick={() => setVersionFile(null)}>
              Close Panel
            </button>
          </div>
        ) : null}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 ? (
        <div style={{ position: "sticky", bottom: 0, background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "12px 28px", display: "flex", alignItems: "center", gap: 12, zIndex: 5 }}>
          <span style={{ fontSize: "0.64rem", color: "var(--accent)", fontWeight: 700 }}>
            {selected.size} file{selected.size > 1 ? "s" : ""} selected
          </span>
          <div style={{ flex: 1 }} />
          {[
            { label: "Share",        fn: () => showToast("Share link created", "Expires in 7 days") },
            { label: "Download ZIP", fn: () => showToast("Downloading", "ZIP archive generating…") },
            { label: "Archive",      fn: () => showToast("Moved to archive", "Files archived successfully") },
          ].map((a) => (
            <button key={a.label} type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)} onClick={a.fn}>{a.label}</button>
          ))}
          <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)} onClick={clearSelect}>✕ Deselect</button>
        </div>
      ) : null}

      {/* File request modal */}
      {fileRequestModal ? (
        <div className={styles.overlay} onClick={() => setFileRequestModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Request a File</span>
              <button className={styles.modalClose} type="button" onClick={() => setFileRequestModal(false)}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: "0.68rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                Describe the file you need from your project team. They will be notified and can upload it directly to your document library.
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  rows={4}
                  placeholder="Describe the file you need, including format, content, and any deadline..."
                  value={fileRequestDesc}
                  onChange={(e) => setFileRequestDesc(e.target.value)}
                />
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={() => setFileRequestModal(false)}>
                Cancel
              </button>
              <button
                className={cx(styles.button, styles.buttonAccent)}
                type="button"
                onClick={() => {
                  setFileRequestModal(false);
                  setFileRequestDesc("");
                  showToast("File request submitted", "Your team has been notified");
                }}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* F8 — Lightbox modal */}
      {lightbox ? (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <div className={styles.lightboxCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.lightboxPreview} style={{ background: lightbox.iconBg }}>
              <span style={{ fontSize: "5rem" }}>{lightbox.icon}</span>
            </div>
            <div className={styles.lightboxBody}>
              <div className={styles.lightboxName}>{lightbox.name}</div>
              <div className={styles.lightboxMeta}>{lightbox.project} · {lightbox.size} · {lightbox.version}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {lightbox.tags.map((t) => (
                  <span key={t.label} className={cx(styles.badge, TAG_CLASS[t.tone])}>{t.label}</span>
                ))}
              </div>
              <div style={{ marginTop: 14, fontSize: ".72rem", color: "var(--muted)" }}>
                {lightbox.versions.length} version{lightbox.versions.length !== 1 ? "s" : ""} available
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button className={cx(styles.button, styles.buttonAccent)} type="button"
                  onClick={() => showToast("Download started", lightbox.name)}>
                  ↓ Download
                </button>
                <button className={cx(styles.button, styles.buttonGhost)} type="button"
                  onClick={() => setLightbox(null)}>
                  Close
                </button>
              </div>
            </div>
            {lightboxIdx > 0 ? (
              <button className={styles.lightboxPrev} type="button"
                onClick={() => {
                  const p = lightboxIdx - 1;
                  setLightbox(filtered[p]);
                  setLightboxIdx(p);
                }}>‹</button>
            ) : null}
            {lightboxIdx < filtered.length - 1 ? (
              <button className={styles.lightboxNext} type="button"
                onClick={() => {
                  const n = lightboxIdx + 1;
                  setLightbox(filtered[n]);
                  setLightboxIdx(n);
                }}>›</button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Local toast */}
      {toast ? (
        <div style={{
          position: "fixed", bottom: 70, right: 28, background: "var(--surface)",
          border: "1px solid var(--accent)", padding: "14px 20px", zIndex: 200,
          display: "flex", alignItems: "center", gap: 12, animation: "fadeUp 0.3s ease"
        }}>
          <div style={{ width: 24, height: 24, background: "var(--accent)", color: "var(--on-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0, borderRadius: "50%" }}>✓</div>
          <div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
