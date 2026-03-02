"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";

type DocsTab = "Library" | "Version History" | "Upload Portal" | "Password Vault" | "Shared Links";
type ViewMode = "list" | "grid";

interface FileItem {
  icon: string;
  name: string;
  type: string;
  size: string;
  date: string;
  ver: string;
  cat: string;
  isNew: boolean;
}

interface VersionItem {
  version: string;
  title: string;
  meta: string;
  changes: string;
}

interface VaultItem {
  icon: string;
  name: string;
  meta: string;
}

interface SharedLinkItem {
  name: string;
  meta: string;
  expiry: string;
  tone: "ok" | "soon" | "expired";
}

interface ToastState {
  title: string;
  subtitle: string;
}

const FILES: FileItem[] = [
  { icon: "📄", name: "Client-Proposal-v3.pdf", type: "PDF", size: "2.4 MB", date: "Feb 21", ver: "v3", cat: "Proposals", isNew: true },
  { icon: "📊", name: "Q1-Financial-Report.xlsx", type: "Spreadsheet", size: "890 KB", date: "Feb 18", ver: "v1", cat: "Finance", isNew: false },
  { icon: "🖼", name: "Brand-Guidelines-2026.pdf", type: "PDF", size: "14.2 MB", date: "Feb 12", ver: "v2", cat: "Brand", isNew: false },
  { icon: "📝", name: "NDA-Veldt-Finance.pdf", type: "PDF", size: "340 KB", date: "Jan 15", ver: "v1", cat: "Legal", isNew: false },
  { icon: "🎨", name: "Homepage-Design-v2.fig", type: "Figma", size: "28.1 MB", date: "Feb 20", ver: "v2", cat: "Designs", isNew: true },
  { icon: "📋", name: "UAT-Checklist-Sprint4.xlsx", type: "Spreadsheet", size: "124 KB", date: "Feb 19", ver: "v1", cat: "QA", isNew: false },
  { icon: "📹", name: "Kickoff-Recording.mp4", type: "Video", size: "312 MB", date: "Jan 10", ver: "v1", cat: "Meetings", isNew: false },
  { icon: "📑", name: "Project-Brief-v1.docx", type: "Document", size: "1.1 MB", date: "Jan 8", ver: "v1", cat: "Strategy", isNew: false },
];

const CATEGORIES = ["All", "Proposals", "Finance", "Brand", "Legal", "Designs", "QA", "Meetings", "Strategy"];

const VERSION_HISTORY: VersionItem[] = [
  { version: "v3", title: "Client-Proposal-v3.pdf", meta: "Feb 21, 2026 · Updated by Sipho Ndlovu", changes: "Added Phase 3 timeline, updated budget breakdown, revised scope section" },
  { version: "v2", title: "Client-Proposal-v2.pdf", meta: "Feb 14, 2026 · Updated by Sipho Ndlovu", changes: "Added testimonials section, fixed pricing table" },
  { version: "v1", title: "Client-Proposal-v1.pdf", meta: "Jan 28, 2026 · Created by Sipho Ndlovu", changes: "Initial draft" },
];

const VAULT: VaultItem[] = [
  { icon: "🔑", name: "Staging Server Credentials", meta: "Added Jan 15 · Sipho Ndlovu" },
  { icon: "🔐", name: "Stripe API Keys (Test)", meta: "Added Jan 20 · James Mahlangu" },
  { icon: "📱", name: "Social Media Logins", meta: "Added Feb 1 · Lerato Mokoena" },
  { icon: "🌐", name: "Domain Registrar Access", meta: "Added Feb 10 · James Mahlangu" },
];

const SHARED_LINKS: SharedLinkItem[] = [
  { name: "Brand Guidelines (Final)", meta: "Shared Feb 12 · View only", expiry: "Expires Mar 12", tone: "ok" },
  { name: "Homepage Design Preview", meta: "Shared Feb 20 · View only", expiry: "Expires Feb 27", tone: "soon" },
  { name: "Project Proposal", meta: "Shared Jan 28 · Download allowed", expiry: "Expired Feb 7", tone: "expired" },
];

const DOC_TABS: DocsTab[] = ["Library", "Version History", "Upload Portal", "Password Vault", "Shared Links"];

export function FilesPage() {
  const [tab, setTab] = useState<DocsTab>("Library");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareTarget, setShareTarget] = useState<string | null>(null);
  const [uploadDrag, setUploadDrag] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const fileTypes = useMemo(() => {
    const types = Array.from(new Set(FILES.map((file) => file.type)));
    return ["All", ...types];
  }, []);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FILES.filter((file) => {
      const matchCategory = category === "All" || file.cat === category;
      const matchType = typeFilter === "All" || file.type === typeFilter;
      const matchSearch = !q || file.name.toLowerCase().includes(q);
      return matchCategory && matchType && matchSearch;
    });
  }, [category, search, typeFilter]);

  const notify = (title: string, subtitle: string): void => setToast({ title, subtitle });

  const categoryDot = (c: string): string => {
    if (c === "All") return styles.docsDotAccent;
    if (c === "Finance") return styles.docsDotGreen;
    if (c === "Legal") return styles.docsDotRed;
    if (c === "Brand") return styles.docsDotPurple;
    if (c === "Designs") return styles.docsDotBlue;
    return styles.docsDotMuted;
  };

  return (
    <div className={styles.pageBody}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Veldt Finance · Files</div>
          <h1 className={cx("pageTitle")}>Documents &amp; Files</h1>
          <p className={cx("pageSub")}>All project files, contracts, and deliverables in one secure place.</p>
        </div>
        <div className={cx("pageActions")}>
          <button className={cx("btnSm", "btnGhost")} type="button" onClick={() => notify("Downloading", "All files packaged as ZIP")}>Bulk Download</button>
          <button className={cx("btnSm", "btnAccent")} type="button" onClick={() => setTab("Upload Portal")}>Upload Files</button>
        </div>
      </div>

      <div className={styles.docsLayout}>
        <aside className={styles.docsSidebar}>
          <div className={styles.docsSidebarSection}>Categories</div>
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              className={cx(styles.docsSidebarItem, category === item && tab === "Library" && styles.docsSidebarItemActive)}
              onClick={() => {
                setCategory(item);
                setTab("Library");
              }}
            >
              <span className={cx(styles.docsDot, categoryDot(item))} />
              <span>{item}</span>
              <span className={styles.docsSidebarCount}>{item === "All" ? FILES.length : FILES.filter((file) => file.cat === item).length}</span>
            </button>
          ))}

          <div className={styles.docsSidebarDivider} />
          <div className={styles.docsSidebarSection}>Tools</div>
          {DOC_TABS.filter((item) => item !== "Library").map((item) => (
            <button
              key={item}
              type="button"
              className={cx(styles.docsSidebarItem, tab === item && styles.docsSidebarItemActive)}
              onClick={() => setTab(item)}
            >
              <span className={cx(styles.docsDot, item === "Password Vault" ? styles.docsDotRed : item === "Shared Links" ? styles.docsDotAmber : item === "Upload Portal" ? styles.docsDotBlue : styles.docsDotMuted)} />
              <span>{item}</span>
            </button>
          ))}

          <div className={styles.docsSidebarDivider} />
          <div className={styles.docsStorageCard}>
            <div className={styles.docsStorageTitle}>Storage</div>
            <div className={styles.docsStorageTrack}>
              <span className={styles.docsStorageFill} />
            </div>
            <div className={styles.docsStorageMeta}>
              <span>1.7 GB used</span>
              <strong>34%</strong>
            </div>
          </div>
        </aside>

        <section className={styles.docsMain}>
          {tab === "Library" && (
            <>
              <div className={styles.docsStatStrip}>
                {[
                  { label: "Total Files", value: String(FILES.length), sub: "Across all categories", tone: styles.docsDotAccent },
                  { label: "New This Week", value: String(FILES.filter((file) => file.isNew).length), sub: "Added in last 7 days", tone: styles.docsDotBlue },
                  { label: "Awaiting Review", value: "1", sub: "Dashboard UI Design", tone: styles.docsDotAmber },
                  { label: "Storage Used", value: "1.7 GB", sub: "of 5 GB included", tone: styles.docsDotPurple },
                ].map((item) => (
                  <div key={item.label} className={styles.docsStatCard}>
                    <span className={cx(styles.docsStatBar, item.tone)} />
                    <div className={styles.docsStatLabel}>{item.label}</div>
                    <div className={styles.docsStatValue}>{item.value}</div>
                    <div className={styles.docsStatSub}>{item.sub}</div>
                  </div>
                ))}
              </div>

              <div className={styles.docsToolbar}>
                <div className={styles.docsSearchWrap}>
                  <span className={styles.docsSearchIcon}>🔍</span>
                  <input
                    className={styles.docsSearchInput}
                    placeholder="Search files..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <div className={styles.docsSelectWrap}>
                  <span className={styles.docsSelectLabel}>Type</span>
                  <select className={styles.docsSelect} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                    {fileTypes.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.docsViewToggle}>
                  <button
                    type="button"
                    className={cx(styles.docsViewBtn, view === "list" && styles.docsViewBtnActive)}
                    onClick={() => setView("list")}
                    aria-label="List view"
                  >
                    ☰
                  </button>
                  <button
                    type="button"
                    className={cx(styles.docsViewBtn, view === "grid" && styles.docsViewBtnActive)}
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                  >
                    ⊞
                  </button>
                </div>
              </div>

              <div className={styles.docsContent}>
                {view === "list" ? (
                  <div className={styles.docsTableWrap}>
                    <div className={styles.docsTableHead}>
                      <span>File</span><span>Size</span><span>Category</span><span>Version</span><span>Updated</span><span>Actions</span>
                    </div>
                    {filteredFiles.map((file) => (
                      <div key={file.name} className={styles.docsTableRow}>
                        <div>
                          <div className={styles.docsFileName}>
                            <span>{file.icon}</span>
                            <span>{file.name}</span>
                            {file.isNew ? <span className={cx("badge", "badgeAccent")}>New</span> : null}
                          </div>
                          <div className={styles.docsFileType}>{file.type}</div>
                        </div>
                        <div className={styles.docsMono}>{file.size}</div>
                        <div><span className={cx("badge", "badgeMuted")}>{file.cat}</span></div>
                        <div className={styles.docsMonoAccent}>{file.ver}</div>
                        <div className={styles.docsMono}>{file.date}</div>
                        <div className={styles.docsActionRow}>
                          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setPreviewFile(file)}>Preview</button>
                          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Downloading", file.name)}>↓</button>
                        </div>
                      </div>
                    ))}
                    {filteredFiles.length === 0 ? (
                      <div className={styles.docsEmpty}>No files match your filters.</div>
                    ) : null}
                  </div>
                ) : (
                  <div className={styles.docsGrid}>
                    {filteredFiles.map((file) => (
                      <div key={file.name} className={styles.docsCard}>
                        {file.isNew ? <span className={styles.docsCardNew}>NEW</span> : null}
                        <div className={styles.docsCardIcon}>{file.icon}</div>
                        <div className={styles.docsCardName}>{file.name}</div>
                        <div className={styles.docsCardMeta}>{file.size} · {file.ver} · {file.date}</div>
                        <div className={styles.docsCardActions}>
                          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setPreviewFile(file)}>View</button>
                          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Downloading", file.name)}>↓</button>
                          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShareTarget(file.name)}>Share</button>
                        </div>
                      </div>
                    ))}
                    {filteredFiles.length === 0 ? (
                      <div className={styles.docsEmpty}>No files match your filters.</div>
                    ) : null}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "Version History" && (
            <div className={styles.docsContent}>
              <div className={styles.docsSectionTitle}>File Version History</div>
              <div className={styles.docsPanel}>
                {VERSION_HISTORY.map((item, index) => (
                  <div key={item.version} className={cx(styles.docsVersionRow, index < VERSION_HISTORY.length - 1 && styles.docsVersionRowBorder)}>
                    <div className={styles.docsVersionTag}>{item.version}</div>
                    <div className={styles.docsVersionBody}>
                      <div className={styles.docsVersionTitle}>{item.title}</div>
                      <div className={styles.docsVersionMeta}>{item.meta}</div>
                      <div className={styles.docsVersionChanges}>{item.changes}</div>
                    </div>
                    <div className={styles.docsVersionActions}>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Downloading", item.title)}>↓ Download</button>
                      {index === 0 ? <span className={cx("badge", "badgeAccent")}>Current</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Upload Portal" && (
            <div className={styles.docsContent}>
              <div className={styles.docsSectionTitle}>Upload Files</div>
              <div
                className={cx(styles.docsUploadZone, uploadDrag && styles.docsUploadZoneDrag)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setUploadDrag(true);
                }}
                onDragLeave={() => setUploadDrag(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setUploadDrag(false);
                  notify("Upload received", "File queued for processing");
                }}
              >
                <div className={styles.docsUploadIcon}>📤</div>
                <div className={styles.docsUploadTitle}>Drag files here to upload</div>
                <div className={styles.docsUploadSub}>or click to browse · Max 500MB per file · All formats accepted</div>
                <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => notify("Upload started", "Select files from your device")}>Choose Files</button>
              </div>

              <div className={styles.docsSectionTitle}>Recently Uploaded</div>
              <div className={styles.docsPanel}>
                {FILES.filter((file) => file.isNew).map((file) => (
                  <div key={file.name} className={styles.docsRecentRow}>
                    <div>
                      <div className={styles.docsFileName}><span>{file.icon}</span><span>{file.name}</span></div>
                      <div className={styles.docsFileType}>{file.type}</div>
                    </div>
                    <div className={styles.docsMono}>{file.size}</div>
                    <div><span className={cx("badge", "badgeAccent")}>Uploaded today</span></div>
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Downloading", file.name)}>↓</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Password Vault" && (
            <div className={styles.docsContent}>
              <div className={styles.docsSectionTitle}>Secure Credentials</div>
              <div className={styles.docsNotice}>All credentials are end-to-end encrypted. Only authorised team members and you can access these.</div>
              {VAULT.map((item) => (
                <div key={item.name} className={styles.docsVaultRow}>
                  <span className={styles.docsVaultIcon}>{item.icon}</span>
                  <div className={styles.docsVaultMain}>
                    <div className={styles.docsVaultName}>{item.name}</div>
                    <div className={styles.docsVaultMeta}>{item.meta}</div>
                  </div>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Credentials revealed", "Visible for 30 seconds")}>Reveal</button>
                </div>
              ))}
              <button type="button" className={cx("btnSm", "btnGhost", styles.docsFullBtn)} onClick={() => notify("Request sent", "Team will add credentials within 24h")}>Request New Credentials</button>
            </div>
          )}

          {tab === "Shared Links" && (
            <div className={styles.docsContent}>
              <div className={styles.docsSectionTitle}>Expiring Share Links</div>
              <div className={styles.docsPanel}>
                {SHARED_LINKS.map((item) => (
                  <div key={item.name} className={styles.docsLinkRow}>
                    <div className={styles.docsLinkMain}>
                      <div className={styles.docsLinkName}>{item.name}</div>
                      <div className={styles.docsLinkMeta}>{item.meta}</div>
                    </div>
                    <span className={cx(styles.docsLinkChip, item.tone === "ok" ? styles.docsLinkOk : item.tone === "soon" ? styles.docsLinkSoon : styles.docsLinkExpired)}>{item.expiry}</span>
                    <div className={styles.docsLinkActions}>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Link copied", "Share link copied to clipboard")}>Copy</button>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Link revoked", "Shared link is no longer accessible")}>Revoke</button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShareTarget("New File")}>Create New Share Link</button>
            </div>
          )}
        </section>
      </div>

      {previewFile ? (
        <div className={styles.docsModalBackdrop} onClick={() => setPreviewFile(null)}>
          <div className={styles.docsModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.docsModalHeader}>
              <div className={styles.docsModalTitle}>{previewFile.name}</div>
              <button type="button" className={styles.docsModalClose} onClick={() => setPreviewFile(null)}>✕</button>
            </div>
            <div className={styles.docsModalBody}>
              <div className={styles.docsPreviewArea}>
                <div className={styles.docsPreviewIcon}>{previewFile.icon}</div>
                <div className={styles.docsPreviewHint}>Preview not available in demo</div>
              </div>
              <div className={styles.docsMetaGrid}>
                {[
                  ["File name", previewFile.name],
                  ["Type", previewFile.type],
                  ["Size", previewFile.size],
                  ["Version", previewFile.ver],
                  ["Category", previewFile.cat],
                  ["Last updated", previewFile.date],
                ].map(([key, value]) => (
                  <div key={key} className={styles.docsMetaCell}>
                    <div className={styles.docsMetaKey}>{key}</div>
                    <div className={styles.docsMetaValue}>{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.docsModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setPreviewFile(null)}>Close</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => {
                  setPreviewFile(null);
                  notify("Downloading", previewFile.name);
                }}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {shareTarget ? (
        <div className={styles.docsModalBackdrop} onClick={() => setShareTarget(null)}>
          <div className={styles.docsModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.docsModalHeader}>
              <div className={styles.docsModalTitle}>Create Share Link</div>
              <button type="button" className={styles.docsModalClose} onClick={() => setShareTarget(null)}>✕</button>
            </div>
            <div className={styles.docsModalBody}>
              <label className={styles.docsFieldLabel}>File</label>
              <div className={styles.docsStaticField}>{shareTarget}</div>

              <label className={styles.docsFieldLabel}>Access Level</label>
              <select className={styles.docsSelect} defaultValue="View only">
                <option>View only</option>
                <option>Can download</option>
              </select>

              <label className={styles.docsFieldLabel}>Expiry Date</label>
              <input className={styles.docsInput} type="date" defaultValue="2026-03-21" />

              <label className={styles.docsFieldLabel}>Password protect (optional)</label>
              <input className={styles.docsInput} type="password" placeholder="Leave blank for no password" />
            </div>
            <div className={styles.docsModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShareTarget(null)}>Cancel</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => {
                  setShareTarget(null);
                  notify("Link created", "Share link copied to clipboard");
                }}
              >
                Create & Copy Link
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={cx("toastStack")}>
          <div className={cx("toast", "toastSuccess")}>
            <strong>{toast.title}</strong>
            <div>{toast.subtitle}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
