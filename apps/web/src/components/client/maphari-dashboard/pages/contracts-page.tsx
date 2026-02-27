"use client";
import { useState, useMemo } from "react";
import { cx, styles } from "../style";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────────── */
type ContractType = "NDA" | "MSA" | "SOW" | "ADDENDUM";
type ContractStatus = "active" | "pending_signature" | "expired" | "archived";

type AmendmentItem = {
  id: string;
  title: string;
  date: string;
  description: string;
  status: "applied" | "pending";
};

type ContractItem = {
  id: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  project: string;
  startDate: string;
  endDate: string;
  parties: string[];
  amendments: AmendmentItem[];
  signedBy?: string;
  signedAt?: string;
};

type ContractTab = "Active" | "Pending" | "Archived";

/* ─────────────────────────────────────────────────────────────────────────────
   Badge lookups
   ───────────────────────────────────────────────────────────────────────────── */
const TYPE_BADGE: Record<ContractType, string> = {
  NDA: styles.badgePurple,
  MSA: styles.badgeAccent,
  SOW: styles.badgeAmber,
  ADDENDUM: styles.badgeMuted,
};

const STATUS_BADGE: Record<ContractStatus, string> = {
  active: styles.badgeGreen,
  pending_signature: styles.badgeAmber,
  expired: styles.badgeRed,
  archived: styles.badgeMuted,
};

/* ─────────────────────────────────────────────────────────────────────────────
   Status display label
   ───────────────────────────────────────────────────────────────────────────── */
function statusLabel(s: ContractStatus): string {
  if (s === "pending_signature") return "Pending Signature";
  if (s === "active") return "Active";
  if (s === "expired") return "Expired";
  return "Archived";
}

/* ─────────────────────────────────────────────────────────────────────────────
   Seed data — 8 contracts
   ───────────────────────────────────────────────────────────────────────────── */
const SEED_CONTRACTS: ContractItem[] = [
  {
    id: "CTR-001",
    title: "Non-Disclosure Agreement — Client Portal v2",
    type: "NDA",
    status: "active",
    project: "Client Portal v2",
    startDate: "2025-11-01",
    endDate: "2026-11-01",
    parties: ["Maphari Technologies", "Veldt Finance"],
    amendments: [
      { id: "A1", title: "Extended scope clause", date: "2026-01-15", description: "Added AI/ML data handling clause to cover model training artifacts.", status: "applied" },
    ],
    signedBy: "Naledi Dlamini",
    signedAt: "2025-11-01",
  },
  {
    id: "CTR-002",
    title: "Non-Disclosure Agreement — Lead Pipeline",
    type: "NDA",
    status: "active",
    project: "Lead Pipeline Rebuild",
    startDate: "2025-12-05",
    endDate: "2026-12-05",
    parties: ["Maphari Technologies", "Ngozi Ltd"],
    amendments: [],
    signedBy: "Sipho Nkosi",
    signedAt: "2025-12-05",
  },
  {
    id: "CTR-003",
    title: "Master Service Agreement — Veldt Finance",
    type: "MSA",
    status: "active",
    project: "Client Portal v2",
    startDate: "2025-10-15",
    endDate: "2027-10-15",
    parties: ["Maphari Technologies", "Veldt Finance", "Veldt Legal Corp"],
    amendments: [
      { id: "A2", title: "Payment terms revision", date: "2026-01-20", description: "Net-30 changed to Net-15 for invoices above R 20,000.", status: "applied" },
      { id: "A3", title: "SLA addendum", date: "2026-02-10", description: "Added 99.5% uptime guarantee with penalty clauses.", status: "pending" },
    ],
    signedBy: "Naledi Dlamini",
    signedAt: "2025-10-15",
  },
  {
    id: "CTR-004",
    title: "Master Service Agreement — Ngozi Ltd",
    type: "MSA",
    status: "active",
    project: "Lead Pipeline Rebuild",
    startDate: "2025-12-01",
    endDate: "2027-12-01",
    parties: ["Maphari Technologies", "Ngozi Ltd"],
    amendments: [
      { id: "A4", title: "Scope extension", date: "2026-02-01", description: "Added analytics dashboard module to covered services.", status: "applied" },
    ],
    signedBy: "Sipho Nkosi",
    signedAt: "2025-12-01",
  },
  {
    id: "CTR-005",
    title: "Statement of Work — Automation Suite Phase 1",
    type: "SOW",
    status: "active",
    project: "Automation Suite",
    startDate: "2026-01-10",
    endDate: "2026-06-30",
    parties: ["Maphari Technologies", "Khumalo Brands"],
    amendments: [
      { id: "A5", title: "Timeline adjustment", date: "2026-02-15", description: "Phase 1 deadline extended by 2 weeks due to scope refinement.", status: "applied" },
      { id: "A6", title: "Resource allocation change", date: "2026-02-20", description: "Dedicated QA engineer added to the project team.", status: "pending" },
    ],
    signedBy: "Thabo Khumalo",
    signedAt: "2026-01-10",
  },
  {
    id: "CTR-006",
    title: "NDA — Brand Identity Partnership",
    type: "NDA",
    status: "pending_signature",
    project: "Brand Identity Pack",
    startDate: "2026-03-01",
    endDate: "2027-03-01",
    parties: ["Maphari Technologies", "Khumalo Brands"],
    amendments: [],
  },
  {
    id: "CTR-007",
    title: "SOW — CRM Integration Project",
    type: "SOW",
    status: "pending_signature",
    project: "CRM Integration",
    startDate: "2026-03-15",
    endDate: "2026-09-15",
    parties: ["Maphari Technologies", "Maphari Internal"],
    amendments: [
      { id: "A7", title: "Initial scope definition", date: "2026-02-25", description: "Defined API integration endpoints and data mapping requirements.", status: "pending" },
    ],
  },
  {
    id: "CTR-008",
    title: "Master Service Agreement — Legacy Client",
    type: "MSA",
    status: "archived",
    project: "Legacy Portal Migration",
    startDate: "2024-06-01",
    endDate: "2025-06-01",
    parties: ["Maphari Technologies", "Zulu Corp"],
    amendments: [
      { id: "A8", title: "Early termination clause", date: "2025-04-15", description: "Mutual early termination agreed upon project completion.", status: "applied" },
    ],
    signedBy: "Lerato Moloi",
    signedAt: "2024-06-01",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Legal placeholder text
   ───────────────────────────────────────────────────────────────────────────── */
const LEGAL_TEXT = `This agreement ("Agreement") is entered into by and between the parties identified herein for the purpose of defining the terms and conditions under which professional services will be rendered.

1. CONFIDENTIALITY. The receiving party agrees to hold in confidence all proprietary information disclosed by the disclosing party. Such information shall not be disclosed to any third party without prior written consent.

2. INTELLECTUAL PROPERTY. All work product, deliverables, and creative output produced during the engagement shall remain the property of the client upon full payment of all outstanding invoices.

3. TERM AND TERMINATION. This Agreement shall commence on the Start Date and continue until the End Date unless earlier terminated by either party with thirty (30) days written notice.

4. LIMITATION OF LIABILITY. Neither party shall be liable for indirect, incidental, or consequential damages arising from the performance of services under this Agreement.

5. DISPUTE RESOLUTION. Any disputes arising under this Agreement shall be resolved through binding arbitration in accordance with the rules of the applicable jurisdiction.

6. GOVERNING LAW. This Agreement shall be governed by and construed in accordance with the laws of the Republic of South Africa.

7. AMENDMENTS. No amendment or modification of this Agreement shall be valid unless made in writing and signed by both parties.

8. ENTIRE AGREEMENT. This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, and agreements.`;

/* ═════════════════════════════════════════════════════════════════════════════
   Component
   ═════════════════════════════════════════════════════════════════════════════ */
export function ClientContractsPage({ active }: { active: boolean }) {
  const [activeTab, setActiveTab] = useState<ContractTab>("Active");
  const [contracts, setContracts] = useState<ContractItem[]>(SEED_CONTRACTS);
  const [detailModal, setDetailModal] = useState<ContractItem | null>(null);
  const [signModal, setSignModal] = useState<ContractItem | null>(null);
  const [hasSigned, setHasSigned] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);

  /* ── Toast helper ─────────────────────────────────────────────────────── */
  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3500);
  };

  /* ── Tab filtering ────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (activeTab === "Active") return contracts.filter((c) => c.status === "active");
    if (activeTab === "Pending") return contracts.filter((c) => c.status === "pending_signature");
    return contracts.filter((c) => c.status === "archived" || c.status === "expired");
  }, [contracts, activeTab]);

  /* ── Stats ────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const activeCount = contracts.filter((c) => c.status === "active").length;
    const pendingCount = contracts.filter((c) => c.status === "pending_signature").length;
    const now = Date.now();
    const expiringCount = contracts.filter((c) => {
      if (c.status !== "active") return false;
      const end = new Date(c.endDate).getTime();
      const daysLeft = (end - now) / (1000 * 60 * 60 * 24);
      return daysLeft > 0 && daysLeft <= 90;
    }).length;
    return { activeCount, pendingCount, expiringCount, total: contracts.length };
  }, [contracts]);

  /* ── Sign handler ─────────────────────────────────────────────────────── */
  const handleSign = () => {
    if (!signModal || !hasSigned || !hasAgreed) return;
    const id = signModal.id;
    setContracts((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "active" as const,
              signedBy: "You (Client)",
              signedAt: new Date().toISOString().split("T")[0],
            }
          : c
      )
    );
    setSignModal(null);
    setHasSigned(false);
    setHasAgreed(false);
    showToast("Contract signed", `${id} is now active`);
  };

  /* ── Reset sign modal state on open ───────────────────────────────────── */
  const openSignModal = (contract: ContractItem) => {
    setHasSigned(false);
    setHasAgreed(false);
    setSignModal(contract);
  };

  /* ── Date formatting helper ───────────────────────────────────────────── */
  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" });
  };

  /* ── Days until expiry ────────────────────────────────────────────────── */
  const daysUntil = (d: string) => {
    const diff = new Date(d).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-contracts">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Finance</div>
          <div className={styles.pageTitle}>Contracts</div>
          <div className={styles.pageSub}>
            Manage active contracts, track amendments, and handle e-signatures in one place.
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            className={cx(styles.button, styles.buttonGhost)}
            type="button"
            onClick={() => showToast("Export started", "Contract summary CSV downloading")}
          >
            Export All
          </button>
          <button
            className={cx(styles.button, styles.buttonAccent)}
            type="button"
            onClick={() => showToast("Template ready", "Select a contract type to begin")}
          >
            + New Contract
          </button>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className={styles.statGrid}>
        {[
          { lbl: "Active", val: String(stats.activeCount), sub: "Signed & in effect", bar: "var(--green)" },
          { lbl: "Pending Signature", val: String(stats.pendingCount), sub: "Awaiting e-sign", bar: "var(--amber)" },
          { lbl: "Expiring Soon", val: String(stats.expiringCount), sub: "Within 90 days", bar: "var(--red)" },
          { lbl: "Total", val: String(stats.total), sub: "All contracts", bar: "var(--accent)" },
        ].map((s, i) => (
          <div key={s.lbl} className={styles.statCard} style={{ "--i": i } as React.CSSProperties}>
            <div className={styles.statBar} style={{ background: s.bar }} />
            <div className={styles.statLabel}>{s.lbl}</div>
            <div className={styles.statValue}>{s.val}</div>
            <div className={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        {(["Active", "Pending", "Archived"] as const).map((t) => (
          <button
            key={t}
            className={cx(styles.filterTab, activeTab === t && styles.filterTabActive)}
            onClick={() => setActiveTab(t)}
            type="button"
          >
            {t}
            {t === "Pending" && stats.pendingCount > 0 ? (
              <span
                style={{
                  marginLeft: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "var(--amber-d)",
                  color: "var(--amber)",
                  fontSize: "0.56rem",
                  fontWeight: 700,
                }}
              >
                {stats.pendingCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* ── Contract grid ─────────────────────────────────────────────── */}
        <div className={styles.contractGrid} style={{ paddingTop: 20 }}>
          {filtered.map((c, i) => (
            <div
              key={c.id}
              className={styles.contractCard}
              style={{ "--i": i } as React.CSSProperties}
              onClick={() => (c.status === "pending_signature" ? openSignModal(c) : setDetailModal(c))}
            >
              {/* Card header */}
              <div className={styles.contractCardHeader}>
                <span className={cx(styles.badge, TYPE_BADGE[c.type])}>{c.type}</span>
                <span className={cx(styles.badge, STATUS_BADGE[c.status])}>{statusLabel(c.status)}</span>
              </div>

              {/* Title */}
              <div className={styles.contractCardTitle}>{c.title}</div>

              {/* Meta */}
              <div className={styles.contractCardMeta}>
                <div>{c.project}</div>
                <div>
                  {fmtDate(c.startDate)} — {fmtDate(c.endDate)}
                </div>
                {c.status === "active" ? (
                  <div style={{ color: daysUntil(c.endDate) <= 90 ? "var(--amber)" : "var(--muted)" }}>
                    {daysUntil(c.endDate)} days remaining
                  </div>
                ) : null}
              </div>

              {/* Parties */}
              <div className={styles.contractCardParties}>
                {c.parties.map((p) => (
                  <span key={p} className={styles.contractCardParty}>
                    {p}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className={styles.contractCardFooter}>
                {c.signedBy ? (
                  <div className={styles.contractCardSigned}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Signed by {c.signedBy}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.6rem", color: "var(--amber)" }}>Awaiting signature</div>
                )}
                {c.status === "pending_signature" ? (
                  <button
                    className={cx(styles.button, styles.buttonAccent, styles.buttonSm)}
                    onClick={(e) => {
                      e.stopPropagation();
                      openSignModal(c);
                    }}
                    type="button"
                  >
                    Sign Now
                  </button>
                ) : (
                  <button
                    className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailModal(c);
                    }}
                    type="button"
                  >
                    View Details
                  </button>
                )}
              </div>

              {/* Amendments count */}
              {c.amendments.length > 0 ? (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: "0.58rem",
                    color: "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5 6h6M5 8.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  {c.amendments.length} amendment{c.amendments.length !== 1 ? "s" : ""}
                  {c.amendments.some((a) => a.status === "pending") ? (
                    <span style={{ color: "var(--amber)", fontWeight: 600 }}>
                      ({c.amendments.filter((a) => a.status === "pending").length} pending)
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}

          {filtered.length === 0 ? (
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
              {activeTab === "Active"
                ? "No active contracts"
                : activeTab === "Pending"
                  ? "No contracts pending signature"
                  : "No archived contracts"}
            </div>
          ) : null}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
         Detail Modal
         ═════════════════════════════════════════════════════════════════════ */}
      {detailModal ? (
        <div className={styles.overlay} onClick={() => setDetailModal(null)}>
          <div className={styles.modal} style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Contract Details</span>
              <button className={styles.modalClose} onClick={() => setDetailModal(null)} type="button">
                ✕
              </button>
            </div>

            {/* Contract info */}
            <div style={{ padding: "20px 24px 0" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <span className={cx(styles.badge, TYPE_BADGE[detailModal.type])}>{detailModal.type}</span>
                <span className={cx(styles.badge, STATUS_BADGE[detailModal.status])}>
                  {statusLabel(detailModal.status)}
                </span>
              </div>

              <div style={{ fontSize: "0.92rem", fontWeight: 800, marginBottom: 6 }}>{detailModal.title}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: 16 }}>
                {detailModal.id}
              </div>

              {/* Info rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {[
                  { label: "Project", value: detailModal.project },
                  { label: "Start Date", value: fmtDate(detailModal.startDate) },
                  { label: "End Date", value: fmtDate(detailModal.endDate) },
                  {
                    label: "Duration",
                    value: `${Math.round((new Date(detailModal.endDate).getTime() - new Date(detailModal.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months`,
                  },
                  { label: "Signed By", value: detailModal.signedBy ?? "—" },
                  { label: "Signed At", value: detailModal.signedAt ? fmtDate(detailModal.signedAt) : "—" },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid var(--b1)",
                      fontSize: "0.72rem",
                    }}
                  >
                    <span style={{ color: "var(--muted)" }}>{row.label}</span>
                    <span style={{ fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Parties */}
              <div
                style={{
                  fontSize: "0.58rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 8,
                }}
              >
                Parties
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {detailModal.parties.map((p) => (
                  <span
                    key={p}
                    style={{
                      padding: "4px 12px",
                      background: "var(--s2)",
                      border: "1px solid var(--b1)",
                      borderRadius: 99,
                      fontSize: "0.66rem",
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Amendment timeline */}
            {detailModal.amendments.length > 0 ? (
              <>
                <div
                  style={{
                    fontSize: "0.58rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    padding: "0 24px 8px",
                  }}
                >
                  Amendments ({detailModal.amendments.length})
                </div>
                <div className={styles.amendmentTimeline}>
                  {detailModal.amendments.map((a) => (
                    <div key={a.id} className={styles.amendmentItem}>
                      <div
                        className={cx(
                          styles.amendmentDot,
                          a.status === "applied" ? styles.amendmentDotApplied : styles.amendmentDotPending
                        )}
                      />
                      <div className={styles.amendmentBody}>
                        <div className={styles.amendmentTitle}>
                          {a.title}
                          <span
                            className={cx(
                              styles.badge,
                              a.status === "applied" ? styles.badgeGreen : styles.badgeAmber
                            )}
                            style={{ marginLeft: 8 }}
                          >
                            {a.status}
                          </span>
                        </div>
                        <div className={styles.amendmentDesc}>{a.description}</div>
                        <div className={styles.amendmentDate}>{fmtDate(a.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div
                style={{
                  padding: "12px 24px 20px",
                  fontSize: "0.68rem",
                  color: "var(--muted2)",
                  textAlign: "center",
                }}
              >
                No amendments on record
              </div>
            )}

            {/* Footer actions */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--b1)",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                className={cx(styles.button, styles.buttonGhost)}
                type="button"
                onClick={() => showToast("PDF downloading", `${detailModal.id}.pdf`)}
              >
                Download PDF
              </button>
              <button
                className={cx(styles.button, styles.buttonGhost)}
                type="button"
                onClick={() => setDetailModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ═════════════════════════════════════════════════════════════════════
         E-Sign Modal
         ═════════════════════════════════════════════════════════════════════ */}
      {signModal ? (
        <div
          className={styles.overlay}
          onClick={() => {
            setSignModal(null);
            setHasSigned(false);
            setHasAgreed(false);
          }}
        >
          <div className={styles.modal} style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Sign Contract</span>
              <button
                className={styles.modalClose}
                onClick={() => {
                  setSignModal(null);
                  setHasSigned(false);
                  setHasAgreed(false);
                }}
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Contract summary */}
            <div style={{ padding: "16px 24px 0" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <span className={cx(styles.badge, TYPE_BADGE[signModal.type])}>{signModal.type}</span>
                <span className={cx(styles.badge, styles.badgeAmber)}>Pending Signature</span>
              </div>
              <div style={{ fontSize: "0.84rem", fontWeight: 700, marginBottom: 4 }}>{signModal.title}</div>
              <div style={{ fontSize: "0.66rem", color: "var(--muted)", marginBottom: 4 }}>
                {signModal.project} &middot; {fmtDate(signModal.startDate)} — {fmtDate(signModal.endDate)}
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                {signModal.parties.map((p) => (
                  <span
                    key={p}
                    style={{
                      padding: "2px 8px",
                      background: "var(--s2)",
                      border: "1px solid var(--b1)",
                      borderRadius: 99,
                      fontSize: "0.58rem",
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Agreement text */}
            <div style={{ padding: "0 24px" }}>
              <div
                style={{
                  fontSize: "0.58rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 8,
                }}
              >
                Agreement Terms
              </div>
              <div className={styles.agreementText}>{LEGAL_TEXT}</div>
            </div>

            {/* Signature pad */}
            <div style={{ padding: "0 24px" }}>
              <div
                style={{
                  fontSize: "0.58rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 8,
                }}
              >
                Your Signature
              </div>
              <div
                className={cx(styles.signaturePad, hasSigned && styles.signaturePadSigned)}
                onClick={() => setHasSigned(true)}
              >
                {hasSigned ? (
                  <span className={styles.signatureText}>Client Signature</span>
                ) : (
                  <span className={styles.signatureHint}>Click to sign</span>
                )}
              </div>
              {hasSigned ? (
                <div style={{ fontSize: "0.58rem", color: "var(--green)", marginBottom: 4 }}>
                  Signature captured
                </div>
              ) : null}
            </div>

            {/* Checkbox */}
            <div style={{ padding: "0 24px" }}>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  style={{ accentColor: "var(--accent)" }}
                />
                I agree to the terms and conditions outlined in this contract
              </label>
            </div>

            {/* Pending amendments note */}
            {signModal.amendments.some((a) => a.status === "pending") ? (
              <div
                style={{
                  margin: "0 24px 12px",
                  padding: "10px 14px",
                  background: "var(--amber-d)",
                  border: "1px solid rgba(245, 166, 35, 0.25)",
                  borderRadius: "var(--r-sm)",
                  fontSize: "0.64rem",
                  color: "var(--amber)",
                }}
              >
                This contract has {signModal.amendments.filter((a) => a.status === "pending").length} pending
                amendment(s) that will take effect upon signing.
              </div>
            ) : null}

            {/* Actions */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--b1)",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                className={cx(styles.button, styles.buttonGhost)}
                type="button"
                onClick={() => {
                  setSignModal(null);
                  setHasSigned(false);
                  setHasAgreed(false);
                }}
              >
                Cancel
              </button>
              <button
                className={cx(styles.button, styles.buttonAccent)}
                type="button"
                disabled={!hasSigned || !hasAgreed}
                style={{
                  opacity: hasSigned && hasAgreed ? 1 : 0.4,
                  cursor: hasSigned && hasAgreed ? "pointer" : "not-allowed",
                }}
                onClick={handleSign}
              >
                Sign Document
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ═════════════════════════════════════════════════════════════════════
         Toast
         ═════════════════════════════════════════════════════════════════════ */}
      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            background: "var(--surface)",
            border: "1px solid var(--accent)",
            padding: "14px 20px",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "slideUp var(--dur-normal, 250ms) var(--ease-out, cubic-bezier(0.23,1,0.32,1))",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              background: "var(--accent)",
              color: "var(--on-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 700,
              flexShrink: 0,
              borderRadius: "50%",
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
