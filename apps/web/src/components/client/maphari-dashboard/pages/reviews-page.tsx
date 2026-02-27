"use client";
import { useState, useMemo, useCallback } from "react";
import { cx, styles } from "../style";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────────── */
type DeliverableStatus = "pending" | "approved" | "rejected" | "revision";
type FileType = "image" | "video" | "document" | "prototype";

type AnnotationItem = {
  id: string;
  x: number;
  y: number;
  author: string;
  comment: string;
  resolved: boolean;
  createdAt: string;
};

type DeliverableItem = {
  id: string;
  title: string;
  project: string;
  milestone: string;
  version: number;
  thumbnailEmoji: string;
  thumbnailBg: string;
  status: DeliverableStatus;
  submittedBy: string;
  submittedAt: string;
  fileType: FileType;
  description: string;
  annotations: AnnotationItem[];
};

type ReviewTab = "Pending" | "Approved" | "All";

/* ─────────────────────────────────────────────────────────────────────────────
   Seed data — 8 deliverables across 3 projects with mixed statuses
   ───────────────────────────────────────────────────────────────────────────── */
const SEED_DELIVERABLES: DeliverableItem[] = [
  {
    id: "DLV-001", title: "Homepage Hero Section", project: "Client Portal v2",
    milestone: "Phase 1 — Design", version: 3,
    thumbnailEmoji: "🎨", thumbnailBg: "var(--purple-d)",
    status: "pending", submittedBy: "Naledi D.", submittedAt: "Feb 24, 2026",
    fileType: "image",
    description: "Full-width hero section with animated gradient background and CTA buttons. Updated copy and mobile-responsive layout.",
    annotations: [
      { id: "a1", x: 25, y: 30, author: "Tshepo M.", comment: "CTA button contrast may be too low on mobile viewports — consider bumping font weight.", resolved: false, createdAt: "Feb 25" },
      { id: "a2", x: 70, y: 55, author: "Naledi D.", comment: "Gradient direction updated per brand guidelines v2.", resolved: true, createdAt: "Feb 24" },
      { id: "a3", x: 50, y: 80, author: "Client", comment: "Love the animation! Can we slow it down by ~20%?", resolved: false, createdAt: "Feb 26" },
    ],
  },
  {
    id: "DLV-002", title: "Dashboard Wireframes", project: "Client Portal v2",
    milestone: "Phase 1 — Design", version: 2,
    thumbnailEmoji: "📐", thumbnailBg: "var(--amber-d)",
    status: "pending", submittedBy: "Kgomotso L.", submittedAt: "Feb 22, 2026",
    fileType: "prototype",
    description: "Low-fidelity wireframes for the admin dashboard showing stat cards, sidebar navigation, and notification center.",
    annotations: [
      { id: "a4", x: 40, y: 25, author: "Client", comment: "Can we add a quick-actions bar at the top?", resolved: false, createdAt: "Feb 23" },
      { id: "a5", x: 60, y: 70, author: "Tshepo M.", comment: "Sidebar collapse behavior needs spec.", resolved: false, createdAt: "Feb 23" },
    ],
  },
  {
    id: "DLV-003", title: "Brand Guidelines PDF", project: "Khumalo Brands Identity",
    milestone: "Phase 2 — Brand System", version: 1,
    thumbnailEmoji: "📘", thumbnailBg: "var(--lime-d)",
    status: "approved", submittedBy: "Lerato K.", submittedAt: "Feb 18, 2026",
    fileType: "document",
    description: "Complete brand guidelines document including logo usage, colour palette, typography, and tone of voice specifications.",
    annotations: [
      { id: "a6", x: 30, y: 40, author: "Client", comment: "Perfect — approved as final.", resolved: true, createdAt: "Feb 19" },
      { id: "a7", x: 55, y: 60, author: "Lerato K.", comment: "Added CMYK values for print.", resolved: true, createdAt: "Feb 18" },
    ],
  },
  {
    id: "DLV-004", title: "API Documentation", project: "Lead Pipeline Rebuild",
    milestone: "Phase 1 — Architecture", version: 4,
    thumbnailEmoji: "📑", thumbnailBg: "var(--green-d)",
    status: "approved", submittedBy: "Thabo N.", submittedAt: "Feb 15, 2026",
    fileType: "document",
    description: "RESTful API reference with authentication flows, endpoint schemas, rate limiting docs, and Postman collection.",
    annotations: [
      { id: "a8", x: 20, y: 35, author: "Tshepo M.", comment: "Auth flow diagrams look great.", resolved: true, createdAt: "Feb 16" },
      { id: "a9", x: 75, y: 50, author: "Client", comment: "Webhook section is exactly what we needed.", resolved: true, createdAt: "Feb 16" },
    ],
  },
  {
    id: "DLV-005", title: "Onboarding Video Script", project: "Client Portal v2",
    milestone: "Phase 3 — Content", version: 1,
    thumbnailEmoji: "🎬", thumbnailBg: "var(--red-d)",
    status: "revision", submittedBy: "Naledi D.", submittedAt: "Feb 20, 2026",
    fileType: "video",
    description: "Script and storyboard for the 90-second onboarding walkthrough video covering signup, project creation, and messaging.",
    annotations: [
      { id: "a10", x: 35, y: 45, author: "Client", comment: "Intro feels too long — trim to 10 seconds max.", resolved: false, createdAt: "Feb 21" },
      { id: "a11", x: 65, y: 30, author: "Kgomotso L.", comment: "Missing the settings walkthrough segment.", resolved: false, createdAt: "Feb 21" },
      { id: "a12", x: 50, y: 75, author: "Tshepo M.", comment: "Voiceover tone should be warmer — see brand voice doc.", resolved: false, createdAt: "Feb 22" },
    ],
  },
  {
    id: "DLV-006", title: "Mobile App Prototype", project: "Lead Pipeline Rebuild",
    milestone: "Phase 2 — Mobile", version: 2,
    thumbnailEmoji: "📱", thumbnailBg: "var(--purple-d)",
    status: "pending", submittedBy: "Kgomotso L.", submittedAt: "Feb 25, 2026",
    fileType: "prototype",
    description: "Interactive Figma prototype for the iOS mobile app covering lead capture, pipeline view, and push notification flows.",
    annotations: [
      { id: "a13", x: 45, y: 20, author: "Client", comment: "Swipe gestures feel natural — nice work.", resolved: true, createdAt: "Feb 26" },
      { id: "a14", x: 30, y: 65, author: "Thabo N.", comment: "Need to account for offline state.", resolved: false, createdAt: "Feb 26" },
    ],
  },
  {
    id: "DLV-007", title: "Logo Variations Pack", project: "Khumalo Brands Identity",
    milestone: "Phase 1 — Logo Design", version: 5,
    thumbnailEmoji: "✨", thumbnailBg: "var(--amber-d)",
    status: "rejected", submittedBy: "Lerato K.", submittedAt: "Feb 10, 2026",
    fileType: "image",
    description: "Logo variations including horizontal, stacked, icon-only, and monochrome versions in SVG and PNG formats.",
    annotations: [
      { id: "a15", x: 40, y: 40, author: "Client", comment: "Monochrome version loses too much detail — needs rework.", resolved: false, createdAt: "Feb 11" },
      { id: "a16", x: 70, y: 25, author: "Client", comment: "Stacked version feels unbalanced.", resolved: false, createdAt: "Feb 11" },
    ],
  },
  {
    id: "DLV-008", title: "Database Schema Diagram", project: "Lead Pipeline Rebuild",
    milestone: "Phase 1 — Architecture", version: 3,
    thumbnailEmoji: "🗄️", thumbnailBg: "var(--green-d)",
    status: "revision", submittedBy: "Thabo N.", submittedAt: "Feb 19, 2026",
    fileType: "document",
    description: "Entity-relationship diagram covering leads, contacts, pipelines, stages, activities, and integrations tables.",
    annotations: [
      { id: "a17", x: 25, y: 50, author: "Tshepo M.", comment: "Missing junction table for many-to-many tag relationships.", resolved: false, createdAt: "Feb 20" },
      { id: "a18", x: 60, y: 35, author: "Client", comment: "Can we add a soft-delete flag to all entities?", resolved: false, createdAt: "Feb 20" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Badge class lookup
   ───────────────────────────────────────────────────────────────────────────── */
const STATUS_BADGE: Record<DeliverableStatus, string> = {
  pending: styles.badgeAmber,
  approved: styles.badgeGreen,
  rejected: styles.badgeRed,
  revision: styles.badgePurple,
};

const STATUS_LABEL: Record<DeliverableStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  revision: "Needs Revision",
};

const FILE_TYPE_LABEL: Record<FileType, string> = {
  image: "Image",
  video: "Video",
  document: "Document",
  prototype: "Prototype",
};

/* ─────────────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────────────── */
type Props = { active: boolean };

export function ClientReviewsPage({ active }: Props) {
  /* ── Local state ─────────────────────────────────────── */
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>(SEED_DELIVERABLES);
  const [activeTab, setActiveTab] = useState<ReviewTab>("Pending");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<DeliverableItem | null>(null);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);

  /* ── Toast helper ────────────────────────────────────── */
  const showToast = useCallback((text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  /* ── Stats ───────────────────────────────────────────── */
  const stats = useMemo(() => ({
    pending: deliverables.filter((d) => d.status === "pending").length,
    approved: deliverables.filter((d) => d.status === "approved").length,
    revision: deliverables.filter((d) => d.status === "revision").length,
    total: deliverables.length,
  }), [deliverables]);

  /* ── Filtered lists ──────────────────────────────────── */
  const filteredDeliverables = useMemo(() => {
    let list = deliverables;
    if (activeTab === "Pending") {
      list = list.filter((d) => d.status === "pending" || d.status === "revision");
    } else if (activeTab === "Approved") {
      list = list.filter((d) => d.status === "approved");
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.project.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [deliverables, activeTab, search]);

  /* ── Decision handlers ───────────────────────────────── */
  const handleDecision = useCallback(
    (decision: "approved" | "revision" | "rejected") => {
      if (!modal) return;
      const id = modal.id;
      const title = modal.title;
      setDeliverables((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: decision } : d))
      );
      setModal(null);
      setFeedback("");
      setActivePin(null);
      const labels: Record<string, string> = {
        approved: "Deliverable approved",
        revision: "Changes requested",
        rejected: "Deliverable rejected",
      };
      showToast(labels[decision], `${title} (${id})`);
    },
    [modal, showToast]
  );

  /* ── Add annotation on click ─────────────────────────── */
  const handleAnnotationLayerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!modal) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      const newAnnotation: AnnotationItem = {
        id: `a-new-${Date.now()}`,
        x,
        y,
        author: "You",
        comment: "New annotation — click to edit",
        resolved: false,
        createdAt: "Just now",
      };
      const updatedModal = {
        ...modal,
        annotations: [...modal.annotations, newAnnotation],
      };
      setModal(updatedModal);
      setDeliverables((prev) =>
        prev.map((d) => (d.id === modal.id ? updatedModal : d))
      );
      setActivePin(newAnnotation.id);
    },
    [modal]
  );

  /* ── Toggle pin visibility ───────────────────────────── */
  const togglePin = useCallback(
    (pinId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setActivePin((prev) => (prev === pinId ? null : pinId));
    },
    []
  );

  /* ── Resolve annotation ──────────────────────────────── */
  const resolveAnnotation = useCallback(
    (annotationId: string) => {
      if (!modal) return;
      const updatedAnnotations = modal.annotations.map((a) =>
        a.id === annotationId ? { ...a, resolved: true } : a
      );
      const updatedModal = { ...modal, annotations: updatedAnnotations };
      setModal(updatedModal);
      setDeliverables((prev) =>
        prev.map((d) => (d.id === modal.id ? updatedModal : d))
      );
      setActivePin(null);
      showToast("Annotation resolved", `Note marked as resolved`);
    },
    [modal, showToast]
  );

  /* ── Render ──────────────────────────────────────────── */
  return (
    <section className={cx("page", active && "pageActive")} id="page-reviews">
      {/* ── Header ─────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Work</div>
          <div className={styles.pageTitle}>Deliverable Review</div>
          <div className={styles.pageSub}>
            Review, annotate, and approve deliverables across your projects.
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            className={cx(styles.button, styles.buttonGhost)}
            type="button"
            onClick={() =>
              showToast("Export started", "Review summary PDF generating...")
            }
          >
            Export Summary
          </button>
          <button
            className={cx(styles.button, styles.buttonAccent)}
            type="button"
            onClick={() =>
              showToast("Reminders sent", "All pending reviewers have been notified")
            }
          >
            Send Reminders
          </button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className={styles.statGrid}>
        {[
          {
            lbl: "Pending Review",
            val: String(stats.pending),
            sub: "Awaiting your decision",
            bar: "var(--amber)",
          },
          {
            lbl: "Approved",
            val: String(stats.approved),
            sub: "Ready for production",
            bar: "var(--green)",
          },
          {
            lbl: "Needs Revision",
            val: String(stats.revision),
            sub: "Feedback provided",
            bar: "var(--purple)",
          },
          {
            lbl: "Total Deliverables",
            val: String(stats.total),
            sub: "Across all projects",
            bar: "var(--accent)",
          },
        ].map((s, i) => (
          <div
            key={s.lbl}
            className={styles.statCard}
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className={styles.statBar} style={{ background: s.bar }} />
            <div className={styles.statLabel}>{s.lbl}</div>
            <div className={styles.statValue}>{s.val}</div>
            <div className={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ────────────────────────────────────── */}
      <div className={styles.filterBar}>
        {(["Pending", "Approved", "All"] as const).map((tab) => (
          <button
            key={tab}
            className={cx("filterTab", activeTab === tab && "filterTabActive")}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "Pending" && stats.pending > 0 ? (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: "0.56rem",
                  padding: "1px 6px",
                  borderRadius: 99,
                  background: "var(--amber-d)",
                  color: "var(--amber)",
                }}
              >
                {stats.pending}
              </span>
            ) : null}
          </button>
        ))}

        {/* Search — visible in All tab */}
        {activeTab === "All" ? (
          <>
            <div style={{ flex: 1 }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                padding: "7px 12px",
                width: 220,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="var(--muted)" strokeWidth="1.5" />
                <path
                  d="M11 11l3 3"
                  stroke="var(--muted)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text)",
                  fontSize: "0.7rem",
                  width: "100%",
                  outline: "none",
                }}
                placeholder="Search deliverables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </>
        ) : null}
      </div>

      {/* ── Content area ───────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Grid view for Pending / Approved tabs */}
        {activeTab !== "All" ? (
          <div className={styles.reviewGrid}>
            {filteredDeliverables.map((d, i) => (
              <div
                key={d.id}
                className={styles.reviewCard}
                style={{ "--i": i } as React.CSSProperties}
                onClick={() => {
                  setModal(d);
                  setActivePin(null);
                  setFeedback("");
                }}
              >
                <div
                  className={styles.reviewCardThumb}
                  style={{ background: d.thumbnailBg }}
                >
                  <span>{d.thumbnailEmoji}</span>
                  <span className={styles.reviewCardVersion}>v{d.version}</span>
                </div>
                <div className={styles.reviewCardBody}>
                  <div className={styles.reviewCardTitle}>{d.title}</div>
                  <div className={styles.reviewCardMeta}>
                    {d.project} &middot; {d.milestone}
                  </div>
                  <div className={styles.reviewCardFooter}>
                    <span className={cx(styles.badge, STATUS_BADGE[d.status])}>
                      {STATUS_LABEL[d.status]}
                    </span>
                    {d.status === "pending" || d.status === "revision" ? (
                      <button
                        className={cx(
                          styles.button,
                          styles.buttonAccent,
                          styles.buttonSm
                        )}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal(d);
                          setActivePin(null);
                          setFeedback("");
                        }}
                      >
                        Review
                      </button>
                    ) : (
                      <button
                        className={cx(
                          styles.button,
                          styles.buttonGhost,
                          styles.buttonSm
                        )}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal(d);
                          setActivePin(null);
                          setFeedback("");
                        }}
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredDeliverables.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "48px 0",
                  color: "var(--muted2)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {activeTab === "Pending"
                  ? "No deliverables awaiting review"
                  : "No approved deliverables yet"}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* List view for All tab */}
        {activeTab === "All" ? (
          <div style={{ padding: "20px 32px 40px" }}>
            {/* Column headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 160px 100px 100px 120px 100px",
                padding: "8px 16px",
                borderBottom: "1px solid var(--border)",
                marginBottom: 4,
              }}
            >
              {[
                "ID",
                "Deliverable",
                "Project",
                "Type",
                "Version",
                "Status",
                "Actions",
              ].map((h) => (
                <span
                  key={h}
                  style={{
                    fontSize: "0.54rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--muted2)",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {filteredDeliverables.map((d) => (
              <div
                key={d.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 160px 100px 100px 120px 100px",
                  alignItems: "center",
                  padding: "14px 16px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  marginBottom: 8,
                  cursor: "pointer",
                  transition: "all 0.18s",
                }}
                onClick={() => {
                  setModal(d);
                  setActivePin(null);
                  setFeedback("");
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--accent)",
                    fontWeight: 500,
                  }}
                >
                  {d.id}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      marginBottom: 2,
                    }}
                  >
                    {d.thumbnailEmoji} {d.title}
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>
                    {d.milestone} &middot; by {d.submittedBy}
                  </div>
                </div>
                <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>
                  {d.project}
                </span>
                <span style={{ fontSize: "0.66rem", color: "var(--muted)" }}>
                  {FILE_TYPE_LABEL[d.fileType]}
                </span>
                <span
                  style={{
                    fontSize: "0.66rem",
                    color: "var(--muted)",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  v{d.version}
                </span>
                <span className={cx(styles.badge, STATUS_BADGE[d.status])}>
                  {STATUS_LABEL[d.status]}
                </span>
                <div>
                  <button
                    className={cx(
                      styles.button,
                      d.status === "pending" || d.status === "revision"
                        ? styles.buttonAccent
                        : styles.buttonGhost,
                      styles.buttonSm
                    )}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModal(d);
                      setActivePin(null);
                      setFeedback("");
                    }}
                  >
                    {d.status === "pending" || d.status === "revision"
                      ? "Review"
                      : "View"}
                  </button>
                </div>
              </div>
            ))}

            {filteredDeliverables.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "var(--muted2)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                No deliverables match your search
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ── Review modal ───────────────────────────────── */}
      {modal ? (
        <div className={styles.overlay} onClick={() => { setModal(null); setActivePin(null); setFeedback(""); }}>
          <div
            className={styles.modal}
            style={{ maxWidth: 800, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                Review: {modal.title}
              </span>
              <button
                className={styles.modalClose}
                onClick={() => { setModal(null); setActivePin(null); setFeedback(""); }}
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Deliverable info bar */}
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                padding: "12px 24px",
                borderBottom: "1px solid var(--b1)",
                flexWrap: "wrap",
              }}
            >
              <span className={cx(styles.badge, STATUS_BADGE[modal.status])}>
                {STATUS_LABEL[modal.status]}
              </span>
              <span
                style={{
                  fontSize: "0.64rem",
                  color: "var(--muted)",
                }}
              >
                {modal.project} &middot; {modal.milestone}
              </span>
              <span
                style={{
                  fontSize: "0.64rem",
                  color: "var(--muted)",
                  fontFamily: "var(--font-dm-mono)",
                }}
              >
                v{modal.version} &middot; {FILE_TYPE_LABEL[modal.fileType]}
              </span>
              <span
                style={{
                  fontSize: "0.64rem",
                  color: "var(--muted)",
                  marginLeft: "auto",
                }}
              >
                Submitted by {modal.submittedBy} on {modal.submittedAt}
              </span>
            </div>

            {/* Description */}
            <div style={{ padding: "14px 24px", fontSize: "0.74rem", color: "var(--muted)", lineHeight: 1.6 }}>
              {modal.description}
            </div>

            {/* Side-by-side comparison */}
            <div className={styles.reviewCompare}>
              <div className={styles.reviewComparePane}>
                <div className={styles.reviewComparePaneLabel}>Previous Version</div>
                <div className={styles.reviewComparePaneEmoji}>{modal.thumbnailEmoji}</div>
                <div
                  style={{
                    fontSize: "0.64rem",
                    color: "var(--muted)",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  v{Math.max(1, modal.version - 1)}
                </div>
              </div>
              <div className={styles.reviewComparePane}>
                <div className={styles.reviewComparePaneLabel}>Current Version</div>
                <div className={styles.reviewComparePaneEmoji}>{modal.thumbnailEmoji}</div>
                <div
                  style={{
                    fontSize: "0.64rem",
                    color: "var(--accent)",
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 700,
                  }}
                >
                  v{modal.version}
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: "0.54rem",
                      padding: "1px 6px",
                      borderRadius: 99,
                      background: "var(--accent-d)",
                      color: "var(--accent)",
                    }}
                  >
                    Latest
                  </span>
                </div>
              </div>
            </div>

            {/* Annotation layer */}
            <div style={{ padding: "0 24px 4px" }}>
              <div
                style={{
                  fontSize: "0.6rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--muted)",
                  fontFamily: "var(--font-dm-mono)",
                  marginBottom: 8,
                }}
              >
                Annotations ({modal.annotations.length})
              </div>
            </div>
            <div
              className={styles.annotationLayer}
              onClick={handleAnnotationLayerClick}
            >
              {/* Existing pins */}
              {modal.annotations.map((ann, idx) => (
                <div key={ann.id}>
                  <div
                    className={cx(
                      styles.annotationPin,
                      activePin === ann.id && styles.annotationPinActive
                    )}
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      opacity: ann.resolved ? 0.5 : 1,
                    }}
                    onClick={(e) => togglePin(ann.id, e)}
                  >
                    {idx + 1}
                  </div>

                  {/* Comment popover */}
                  {activePin === ann.id ? (
                    <div
                      className={styles.annotationComment}
                      style={{
                        left: ann.x > 60 ? `${ann.x - 25}%` : `${ann.x + 3}%`,
                        top: `${ann.y + 5}%`,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={styles.annotationCommentAuthor}>
                        {ann.author}
                        {ann.resolved ? (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: "0.52rem",
                              color: "var(--green)",
                            }}
                          >
                            Resolved
                          </span>
                        ) : null}
                      </div>
                      <div>{ann.comment}</div>
                      <div className={styles.annotationCommentTime}>
                        {ann.createdAt}
                      </div>
                      {!ann.resolved ? (
                        <button
                          className={cx(
                            styles.button,
                            styles.buttonGhost,
                            styles.buttonSm
                          )}
                          style={{ marginTop: 8, width: "100%" }}
                          type="button"
                          onClick={() => resolveAnnotation(ann.id)}
                        >
                          Mark Resolved
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
              <div className={styles.annotationLayerHint}>
                Click anywhere to add an annotation
              </div>
            </div>

            {/* Annotation summary list */}
            <div style={{ padding: "0 24px 16px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {modal.annotations.map((ann, idx) => (
                  <div
                    key={ann.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "8px 12px",
                      background: activePin === ann.id ? "var(--s2)" : "transparent",
                      border: "1px solid var(--b1)",
                      borderRadius: "var(--r-xs)",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      opacity: ann.resolved ? 0.5 : 1,
                    }}
                    onClick={() =>
                      setActivePin((prev) =>
                        prev === ann.id ? null : ann.id
                      )
                    }
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        color: "var(--on-accent)",
                        fontSize: "0.5rem",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          marginBottom: 2,
                        }}
                      >
                        {ann.author}
                        {ann.resolved ? (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: "0.52rem",
                              color: "var(--green)",
                              fontWeight: 400,
                            }}
                          >
                            Resolved
                          </span>
                        ) : null}
                      </div>
                      <div
                        style={{
                          fontSize: "0.64rem",
                          color: "var(--muted)",
                          lineHeight: 1.5,
                        }}
                      >
                        {ann.comment}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.54rem",
                        color: "var(--muted2)",
                        flexShrink: 0,
                      }}
                    >
                      {ann.createdAt}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision panel */}
            <div className={styles.decisionPanel}>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.formLabel}>Feedback (optional)</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Add your review notes here..."
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
              <div className={styles.decisionBtns}>
                <button
                  className={cx(styles.button, styles.buttonAccent)}
                  type="button"
                  onClick={() => handleDecision("approved")}
                  style={{ flex: 1 }}
                >
                  Approve
                </button>
                <button
                  className={cx(styles.button, styles.buttonGhost)}
                  type="button"
                  onClick={() => handleDecision("revision")}
                  style={{ flex: 1 }}
                >
                  Request Changes
                </button>
                <button
                  className={cx(styles.button, styles.buttonGhost)}
                  type="button"
                  onClick={() => handleDecision("rejected")}
                  style={{
                    flex: 1,
                    color: "var(--red)",
                    borderColor: "var(--red-d)",
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Toast ──────────────────────────────────────── */}
      {toast ? (
        <div className={styles.toast}>
          <div className={styles.toastIcon}>✓</div>
          <div>
            <div className={styles.toastText}>{toast.text}</div>
            <div className={styles.toastSub}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
