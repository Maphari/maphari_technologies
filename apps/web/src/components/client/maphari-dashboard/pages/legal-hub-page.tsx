// ════════════════════════════════════════════════════════════════════════════
// legal-hub-page.tsx — Client Portal: Unified Legal Hub
// Quote → Contract → Sign lifecycle page.
// Replaces contractsProposals + quoteAcceptance + contracts-page.tsx
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../style";
import { usePageToast } from "../hooks/use-page-toast";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalProposalsWithRefresh,
  acceptPortalProposalWithRefresh,
  declinePortalProposalWithRefresh,
  type PortalProposal,
} from "../../../../lib/api/portal/proposals";
import {
  loadPortalContractsWithRefresh,
  signContractWithSignatureWithRefresh,
  getPortalContractFileIdWithRefresh,
  loadContractTemplateWithRefresh,
  type PortalContract,
} from "../../../../lib/api/portal/contracts";
import { getPortalFileDownloadUrlWithRefresh } from "../../../../lib/api/portal/files";
import { SignaturePad } from "../../../shared/ui/signature-pad";

// ── Types ─────────────────────────────────────────────────────────────────────

type DisplayDoc = {
  id:           string | null;
  icon:         string;
  title:        string;
  meta:         string;
  signed:       boolean;
  ref:          string;
  fileId:       string | null;
  signedByName: string | null;
  signedAt:     string | null;
  type:         string;
  status:       string;
  notes:        string | null;
};

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  NDA:      "🤝",
  SOW:      "📋",
  CONTRACT: "📄",
  DPA:      "🔒",
  MSA:      "📑",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCents(cents: number, currency = "ZAR"): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency, minimumFractionDigits: 0 }).format(cents / 100);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })} at ${d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function csvCell(value: string | number): string {
  return "\"" + String(value).replace(/"/g, "\"\"") + "\"";
}

function triggerLegalExportDownload(proposals: PortalProposal[], contracts: PortalContract[]): void {
  const proposalRows = [
    "Proposals",
    ["Title", "Status", "Amount", "Currency", "Valid Until", "Prepared By"].map(csvCell).join(","),
    ...proposals.map((proposal) =>
      [
        proposal.title,
        proposal.status,
        proposal.amountCents / 100,
        proposal.currency,
        proposal.validUntil ?? "—",
        proposal.preparedBy ?? "—",
      ].map(csvCell).join(",")
    ),
  ];

  const contractRows = [
    "",
    "Contracts",
    ["Title", "Type", "Status", "Signed", "Signed By", "Signed At", "Reference"].map(csvCell).join(","),
    ...contracts.map((contract) =>
      [
        contract.title,
        contract.type,
        contract.status,
        contract.signed ? "Yes" : "No",
        contract.signedByName ?? "—",
        contract.signedAt ?? "—",
        contract.ref ?? contract.id,
      ].map(csvCell).join(",")
    ),
  ];

  const csv = [...proposalRows, ...contractRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "maphari-legal-agreements.csv";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function formatContractMeta(c: PortalContract): string {
  if (c.signed && c.signedAt) {
    return `Signed ${fmtDate(c.signedAt)} · Both parties`;
  }
  if (c.status === "VOID") return "Voided";
  return "Requires your signature";
}

// ── ContractViewer ─────────────────────────────────────────────────────────────

interface ContractViewerProps {
  doc:      DisplayDoc;
  html:     string;
  loading:  boolean;
  previewNote: string | null;
  onClose:  () => void;
  onSigned: (name: string, signatureDataUrl: string) => void;
}

function ContractViewer({ doc, html, loading, previewNote, onClose, onSigned }: ContractViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const [scrollPct,        setScrollPct]        = useState(0);
  const [hasReadFull,      setHasReadFull]      = useState(false);
  const [viewState,        setViewState]        = useState<"viewing" | "signed">("viewing");
  const [signatureName,    setSignatureName]    = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [agreed,           setAgreed]           = useState(false);
  const [signing,          setSigning]          = useState(false);
  const [signedAt,         setSignedAt]         = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable <= 0) { setScrollPct(100); setHasReadFull(true); return; }
    const pct = (el.scrollTop / scrollable) * 100;
    setScrollPct(Math.min(100, pct));
    if (pct >= 95) setHasReadFull(true);
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 5) {
      const timer = window.setTimeout(() => {
        setScrollPct(100);
        setHasReadFull(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [html, loading]);

  const canSign = signatureName.trim().length > 0 && signatureDataUrl !== null && agreed && !signing && !previewNote && !loading && html.trim().length > 0;
  const now = useMemo(() => new Date(), []);

  async function handleSign(): Promise<void> {
    if (!canSign) return;
    setSigning(true);
    const ts = nowIso();
    setSignedAt(ts);
    await new Promise<void>((r) => setTimeout(r, 500));
    setSigning(false);
    setViewState("signed");
    onSigned(signatureName.trim(), signatureDataUrl ?? "");
  }

  return (
    <div className={cx("ctViewerOverlay")}>
      {/* Progress bar */}
      <div className={cx("ctProgressBar")}>
        <div className={cx("ctProgressFill")} style={{ width: `${scrollPct}%` }} />
      </div>

      {/* Header */}
      <div className={cx("ctViewerHeader")}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{doc.icon}</span>
          <span className={cx("ctViewerTitle")}>{doc.title}</span>
        </div>
        <button type="button" className={cx("btnSm", "btnGhost")} onClick={onClose} aria-label="Close document viewer">
          ✕ Close
        </button>
      </div>

      {/* Signed success state */}
      {viewState === "signed" ? (
        <div style={{ flex: 1, overflow: "auto", background: "var(--s1)" }}>
          <div className={cx("ctSignedSuccess")}>
            <div className={cx("ctSignedCircle")}>
              <span style={{ fontSize: 28 }}>✓</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Document signed successfully</div>
            <div style={{ fontSize: 12, color: "var(--muted2)", maxWidth: 320, textAlign: "center" }}>
              Your electronic signature has been recorded and timestamped.
              {signedAt ? ` Signed on ${fmtDateTime(signedAt)}.` : ""}
            </div>
            <button type="button" className={cx("btnSm", "btnGhost")} style={{ marginTop: 8 }} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Document body */}
          <div ref={contentRef} className={cx("ctViewerBody")} onScroll={handleScroll}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "#999" }}>
                Loading document…
              </div>
            ) : previewNote ? (
              <div className={cx("emptyState")} style={{ minHeight: 320 }}>
                <div className={cx("emptyStateIcon")}>📄</div>
                <div className={cx("emptyStateTitle")}>Preview unavailable</div>
                <div className={cx("emptyStateSub")}>{previewNote}</div>
              </div>
            ) : (
              <div className={cx("ctViewerContent")} dangerouslySetInnerHTML={{ __html: html }} />
            )}
          </div>

          {/* Sticky footer */}
          <div className={cx("ctSignFooter")}>
            {previewNote ? (
              <div className={cx("ctSigSection")}>
                <p className={cx("ctReadPrompt")} style={{ textAlign: "left" }}>
                  Signing is disabled until a rendered contract preview is available.
                </p>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={onClose} style={{ alignSelf: "flex-start" }}>
                  Close
                </button>
              </div>
            ) : !hasReadFull ? (
              <p className={cx("ctReadPrompt")}>
                Scroll to continue reading…
                <span style={{ marginLeft: 8, fontFamily: "var(--font-dm-mono), monospace", fontSize: 11 }}>
                  {Math.round(scrollPct)}%
                </span>
              </p>
            ) : (
              <div className={cx("ctSigSection")}>
                <p className={cx("ctReadPrompt")} style={{ textAlign: "left" }}>✓ You&apos;ve read the full document</p>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Type your full name to sign</div>
                <input
                  className={cx("input")}
                  placeholder="Enter your full legal name"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  style={{ fontSize: 13 }}
                  autoFocus
                />
                <div className={cx("ctSigPreview")}>
                  {signatureName
                    ? signatureName
                    : <span className={cx("ctSigPreviewEmpty")}>Your signature appears here</span>
                  }
                </div>
                <div>
                  <span className={cx("sigLabel")}>Draw your signature</span>
                  {signatureDataUrl ? (
                    <div className={cx("sigCanvasConfirmed")}>
                      <span style={{ fontSize: 13 }}>✓ Signature drawn</span>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setSignatureDataUrl(null)} style={{ fontSize: "0.75rem" }}>
                        Redo
                      </button>
                    </div>
                  ) : (
                    <SignaturePad height={140} onSave={(dataUrl) => setSignatureDataUrl(dataUrl)} onClear={() => setSignatureDataUrl(null)} />
                  )}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted2)", fontFamily: "var(--font-dm-mono), monospace" }}>
                  Signed on {fmtDateTime(now.toISOString())}
                </div>
                <label className={cx("ctAgreeRow")} style={{ fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>I agree to the terms of this document and confirm this constitutes my electronic signature.</span>
                </label>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  disabled={!canSign}
                  onClick={() => void handleSign()}
                  style={{ alignSelf: "flex-start" }}
                >
                  {signing ? "Signing…" : "Sign Document"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Pipeline ───────────────────────────────────────────────────────────────────

const STAGES = [
  { label: "Proposal Sent" },
  { label: "Quote Accepted" },
  { label: "Contract Sent" },
  { label: "Agreement Signed" },
] as const;

function deriveStage(proposals: PortalProposal[], contracts: PortalContract[]): number {
  if (contracts.length > 0 && contracts.every((c) => c.signed)) return 4;
  if (contracts.length > 0) return 3;
  if (proposals.some((p) => p.status === "ACCEPTED")) return 2;
  return 1;
}

interface PipelineProps {
  currentStage: number;
}

function Pipeline({ currentStage }: PipelineProps) {
  return (
    <div className={cx("legalPipeline")}>
      {STAGES.map((stage, i) => {
        const stageNum = i + 1;
        const isDone   = stageNum < currentStage;
        const isActive = stageNum === currentStage;
        const isLast   = i === STAGES.length - 1;

        return (
          <div key={stage.label} className={cx("legalPipelineStage")}>
            {!isLast && (
              <div className={cx("legalPipelineConnector", isDone && "legalPipelineConnectorDone")} />
            )}
            <div className={cx(
              "legalPipelineNode",
              isDone   && "legalPipelineNodeDone",
              isActive && "legalPipelineNodeActive",
            )}>
              {isDone ? "✓" : stageNum}
            </div>
            <div className={cx("legalPipelineLabel", isActive && "legalPipelineLabelActive")}>
              {stage.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── LegalHubPage ───────────────────────────────────────────────────────────────

export function LegalHubPage() {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();

  const [proposals,     setProposals]     = useState<PortalProposal[] | null>(null);
  const [contracts,     setContracts]     = useState<PortalContract[] | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const [expandedIds,   setExpandedIds]   = useState<Set<string>>(new Set());
  const [confirmId,     setConfirmId]     = useState<string | null>(null);
  const [decliningId,   setDecliningId]   = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [actingId,      setActingId]      = useState<string | null>(null);

  const [signedIds,     setSignedIds]     = useState<Set<string>>(new Set());
  const [signedNames,   setSignedNames]   = useState<Map<string, string>>(new Map());
  const [activeDoc,     setActiveDoc]     = useState<DisplayDoc | null>(null);
  const [contractHtml,  setContractHtml]  = useState<string>("");
  const [loadingHtml,   setLoadingHtml]   = useState(false);
  const [previewNote,   setPreviewNote]   = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadLegalData = useCallback(async (showLoading = true): Promise<boolean> => {
    if (!session) {
      setLoading(false);
      return false;
    }
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const [pRes, cRes] = await Promise.all([
      loadPortalProposalsWithRefresh(session, projectId ?? undefined),
      loadPortalContractsWithRefresh(session, projectId ?? undefined),
      ]);
      if (pRes.nextSession) saveSession(pRes.nextSession);
      if (cRes.nextSession) saveSession(cRes.nextSession);

      if (pRes.error) {
        setError(pRes.error.message ?? "Failed to load proposals.");
        setLoading(false);
        return false;
      }
      if (cRes.error) {
        setError(cRes.error.message ?? "Failed to load contracts.");
        setLoading(false);
        return false;
      }

      setProposals(pRes.data ?? []);
      const cData = cRes.data ?? [];
      setContracts(cData);
      const ids = new Set<string>();
      for (const c of cData) { if (c.signed) ids.add(c.id); }
      setSignedIds(ids);
      setLoading(false);
      return true;
    } catch {
      setError("Failed to load legal documents. Please try again.");
      setLoading(false);
      return false;
    }
  }, [projectId, session]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLegalData(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadLegalData]);

  const currentStage = useMemo(() => {
    if (!proposals || !contracts) return 1;
    return deriveStage(proposals, contracts);
  }, [proposals, contracts]);

  const displayDocs = useMemo<DisplayDoc[]>(() => {
    if (!contracts) return [];
    return contracts.map((c) => ({
      id:           c.id,
      icon:         TYPE_ICON[c.type] ?? "📄",
      title:        c.title,
      meta:         formatContractMeta(c),
      signed:       signedIds.has(c.id),
      ref:          c.ref ?? c.id.slice(0, 12).toUpperCase(),
      fileId:       c.fileId ?? null,
      signedByName: c.signedByName ?? null,
      signedAt:     c.signedAt ?? null,
      type:         c.type,
      status:       c.status,
      notes:        c.notes ?? null,
    }));
  }, [contracts, signedIds]);

  const pendingProposals  = proposals?.filter((p) => p.status === "PENDING")  ?? [];
  const acceptedProposals = proposals?.filter((p) => p.status === "ACCEPTED") ?? [];
  const pendingContracts  = displayDocs.filter((doc) => !doc.signed && doc.status !== "VOID");
  const signedContracts   = displayDocs.filter((doc) => doc.signed);
  const pendingValue  = pendingProposals.reduce( (s, p) => s + (p.amountCents ?? 0), 0);
  const acceptedValue = acceptedProposals.reduce((s, p) => s + (p.amountCents ?? 0), 0);

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    const ok = await loadLegalData(false);
    setRefreshing(false);
    if (ok) {
      notify("success", "Legal hub refreshed", "Latest proposal and agreement activity has been loaded.");
    }
  }

  function handleExport(): void {
    triggerLegalExportDownload(proposals ?? [], contracts ?? []);
    notify("success", "Downloading", "Legal agreements CSV is downloading.");
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleAccept(proposalId: string): Promise<void> {
    if (!session) return;
    setActingId(proposalId);
    setConfirmId(null);
    try {
      const r = await acceptPortalProposalWithRefresh(session, proposalId);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        notify("error", "Accept failed", r.error.message ?? "Please try again.");
      } else {
        await loadLegalData(false);
        notify("success", "Proposal accepted", "Your team has been notified.");
      }
    } catch {
      notify("error", "Accept failed", "Please try again.");
    } finally {
      setActingId(null);
    }
  }

  async function handleDecline(proposalId: string): Promise<void> {
    if (!session) return;
    setActingId(proposalId);
    const reason = declineReason.trim() || undefined;
    setDecliningId(null);
    setDeclineReason("");
    try {
      const r = await declinePortalProposalWithRefresh(session, proposalId, reason);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        notify("error", "Decline failed", r.error.message ?? "Please try again.");
      } else {
        await loadLegalData(false);
        notify("info", "Proposal declined", "Your team has been notified.");
      }
    } catch {
      notify("error", "Decline failed", "Please try again.");
    } finally {
      setActingId(null);
    }
  }

  async function openViewer(doc: DisplayDoc): Promise<void> {
    setActiveDoc(doc);
    setContractHtml("");
    setPreviewNote(null);
    if (!session) {
      setPreviewNote("Sign in again to review this agreement.");
      return;
    }

    let templateId: string | null = null;
    let variables: Record<string, string> = {};
    try {
      const parsed = JSON.parse(doc.notes ?? "{}") as Record<string, unknown>;
      if (typeof parsed.templateId === "string") templateId = parsed.templateId;
      if (parsed.variables && typeof parsed.variables === "object") variables = parsed.variables as Record<string, string>;
    } catch { /* no template info */ }

    if (!templateId) {
      setPreviewNote(doc.fileId
        ? "This agreement does not have a rendered web preview yet. Download the attached document to review the final copy."
        : "This agreement does not have a rendered preview yet. Ask your team to attach the final document before signing.");
      return;
    }

    setLoadingHtml(true);
    try {
      const r = await loadContractTemplateWithRefresh(session, templateId, variables);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data?.renderedHtml) {
        setContractHtml("");
        setPreviewNote("The document preview could not be rendered right now. Please try again later or download the attached file.");
      } else {
        setContractHtml(r.data.renderedHtml);
      }
    } catch {
      setContractHtml("");
      setPreviewNote("The document preview could not be rendered right now. Please try again later or download the attached file.");
    } finally {
      setLoadingHtml(false);
    }
  }

  async function handleSigned(doc: DisplayDoc, name: string, signatureDataUrl: string): Promise<void> {
    const id = doc.id;
    if (id) {
      setSignedIds((prev) => new Set([...prev, id]));
      setSignedNames((prev) => new Map([...prev, [id, name]]));
    }
    if (session && id) {
      try {
        const sr = await signContractWithSignatureWithRefresh(session, id, name, signatureDataUrl);
        if (sr.nextSession) saveSession(sr.nextSession);
        if (sr.data?.signed) {
          setSignedIds((prev) => new Set([...prev, id]));
          await loadLegalData(false);
        }
      } catch { /* optimistic update already applied */ }
    }
    setContracts((prev) => prev?.map((c) => c.id === id ? { ...c, signed: true } : c) ?? null);
    notify("success", "Document signed", "Timestamped signature recorded — copy sent to your email");
  }

  async function downloadContract(doc: DisplayDoc): Promise<void> {
    if (!doc.id || !session) return;
    setDownloadingId(doc.id);
    try {
      const ref = await getPortalContractFileIdWithRefresh(session, doc.id);
      if (ref.nextSession) saveSession(ref.nextSession);
      if (!ref.data?.fileId) { notify("error", "No file attached", "This contract doesn't have a downloadable file yet."); return; }
      const dl = await getPortalFileDownloadUrlWithRefresh(session, ref.data.fileId);
      if (dl.nextSession) saveSession(dl.nextSession);
      if (!dl.data?.downloadUrl) { notify("error", "Download failed", "Could not generate download link."); return; }
      window.open(dl.data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      notify("error", "Download failed", "Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

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
  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}>✕</div>
          <div className={cx("emptyStateTitle")}>Failed to load</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  const hasProposals = (proposals?.length ?? 0) > 0;
  const hasContracts = (contracts?.length ?? 0) > 0;
  const isEmpty = !hasProposals && !hasContracts;

  return (
    <>
      {activeDoc !== null && (
        <ContractViewer
          doc={activeDoc}
          html={contractHtml}
          loading={loadingHtml}
          previewNote={previewNote}
          onClose={() => setActiveDoc(null)}
          onSigned={(name, sigDataUrl) => void handleSigned(activeDoc, name, sigDataUrl)}
        />
      )}

      <div className={cx("pageBody")}>
        <div className={cx("pageHeader", "mb0")}>
          <div>
            <div className={cx("pageEyebrow")}>Finance · Legal</div>
            <h1 className={cx("pageTitle")}>Legal & Agreements</h1>
            <p className={cx("pageSub")}>Track live proposals, review pending agreements, and download signed documents from one place.</p>
          </div>
          <div className={cx("pageActions", "flexRow", "gap8", "flexWrap")}>
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
              onClick={() => void handleRefresh()}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
              onClick={handleExport}
              disabled={!hasProposals && !hasContracts}
            >
              Export CSV
            </button>
          </div>
        </div>

        <Pipeline currentStage={currentStage} />

        {isEmpty && (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}>📋</div>
            <div className={cx("emptyStateTitle")}>Nothing here yet</div>
            <div className={cx("emptyStateSub")}>Your team will send a proposal shortly.</div>
          </div>
        )}

        {hasProposals && (
          <>
            <div className={cx("topCardsStack")}>
              <div className={cx("statCard")}>
                <div className={cx("statLabel")}>Proposals</div>
                <div className={cx("statValue")}>{proposals!.length}</div>
              </div>
              <div className={cx("statCard")}>
                <div className={cx("statLabel")}>Pending Value</div>
                <div className={cx("statValue")}>{pendingValue > 0 ? formatCents(pendingValue) : "—"}</div>
              </div>
              <div className={cx("statCard")}>
                <div className={cx("statLabel")}>Awaiting Signature</div>
                <div className={cx("statValue")}>{pendingContracts.length}</div>
              </div>
              <div className={cx("statCard")}>
                <div className={cx("statLabel")}>Signed Agreements</div>
                <div className={cx("statValue")}>{signedContracts.length}</div>
              </div>
              <div className={cx("statCard")}>
                <div className={cx("statLabel")}>Accepted Value</div>
                <div className={cx("statValue")}>{acceptedValue > 0 ? formatCents(acceptedValue) : "—"}</div>
              </div>
            </div>

            <div className={cx("pageHeader", "mb0")} style={{ marginTop: 20 }}>
              <div>
                <div className={cx("pageEyebrow")}>Proposals</div>
                <h2 className={cx("pageTitle")} style={{ fontSize: "1.1rem" }}>Open Commercial Decisions</h2>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {proposals!.map((proposal) => {
                const isExpanded   = expandedIds.has(proposal.id);
                const isConfirming = confirmId === proposal.id;
                const isDeclining  = decliningId === proposal.id;
                const isActing     = actingId === proposal.id;

                return (
                  <div key={proposal.id} className={cx("card")}>
                    <div className={cx("cardHd")}>
                      <span className={cx("cardHdTitle")}>{proposal.title}</span>
                      <span className={cx("badge",
                        proposal.status === "ACCEPTED" ? "badgeGreen"
                        : proposal.status === "DECLINED" ? "badgeMuted"
                        : proposal.status === "EXPIRED"  ? "badgeRed"
                        : "badgeAmber"
                      )}>
                        {proposal.status === "ACCEPTED" ? "Accepted"
                          : proposal.status === "DECLINED" ? "Declined"
                          : proposal.status === "EXPIRED"  ? "Expired"
                          : "Pending"}
                      </span>
                    </div>

                    <div style={{ padding: "0 20px 16px" }}>
                      <div className={cx("qaAmountBig")}>
                        {proposal.amountCents ? formatCents(proposal.amountCents, proposal.currency ?? "ZAR") : "—"}
                      </div>
                      <div className={cx("qaQuoteTitle")} style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
                        {proposal.validUntil && <span>Valid until {fmtDate(proposal.validUntil)}</span>}
                        {proposal.preparedBy  && <span>Prepared by {proposal.preparedBy}</span>}
                      </div>

                      {proposal.summary && <p className={cx("qaSummary")}>{proposal.summary}</p>}

                      {proposal.items && proposal.items.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <button
                            type="button"
                            className={cx("btnSm", "btnGhost")}
                            style={{ fontSize: "0.72rem", marginBottom: 8 }}
                            onClick={() => toggleExpand(proposal.id)}
                          >
                            {isExpanded ? "▲ Hide line items" : `▼ Show ${proposal.items.length} line items`}
                          </button>
                          {isExpanded && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {proposal.items.map((item, idx) => (
                                <div key={idx} className={cx("qaLineItem")}>
                                  <span className={cx("qaLineItemIcon")}>·</span>
                                  <span style={{ flex: 1 }}>{item.description}</span>
                                  {item.amountCents != null && (
                                    <span style={{ fontVariantNumeric: "tabular-nums" }}>
                                      {formatCents(item.amountCents, proposal.currency ?? "ZAR")}
                                    </span>
                                  )}
                                </div>
                              ))}
                              <div className={cx("qaTotalRow")}>
                                <span>Total</span>
                                <span>{formatCents(proposal.amountCents ?? 0, proposal.currency ?? "ZAR")}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {proposal.status === "ACCEPTED" && (
                        <div className={cx("qaAcceptedBanner")}>
                          ✓ Accepted{proposal.acceptedAt ? ` on ${fmtDate(proposal.acceptedAt)}` : ""}
                        </div>
                      )}
                      {proposal.status === "DECLINED" && (
                        <div className={cx("qaDeclinedBanner")}>
                          Declined{proposal.declineReason ? ` — "${proposal.declineReason}"` : ""}
                        </div>
                      )}
                      {proposal.status === "EXPIRED" && (
                        <div className={cx("qaExpiredBanner")}>This proposal has expired.</div>
                      )}

                      {proposal.status === "PENDING" && !isConfirming && !isDeclining && (
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          <button type="button" className={cx("btnSm", "btnAccent")} disabled={isActing} onClick={() => setConfirmId(proposal.id)}>Accept</button>
                          <button type="button" className={cx("btnSm", "btnGhost")} disabled={isActing} onClick={() => { setDecliningId(proposal.id); setConfirmId(null); }}>Decline</button>
                        </div>
                      )}

                      {isConfirming && (
                        <div className={cx("qaConfirmBox")}>
                          <p style={{ margin: 0, fontSize: 13 }}>Accept this proposal for {formatCents(proposal.amountCents ?? 0, proposal.currency ?? "ZAR")}?</p>
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <button type="button" className={cx("btnSm", "btnAccent")} disabled={isActing} onClick={() => void handleAccept(proposal.id)}>
                              {isActing ? "Accepting…" : "Yes, Accept"}
                            </button>
                            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setConfirmId(null)}>Cancel</button>
                          </div>
                        </div>
                      )}

                      {isDeclining && (
                        <div className={cx("qaDeclBox")}>
                          <p style={{ margin: 0, fontSize: 13 }}>Reason for declining (optional)</p>
                          <input
                            className={cx("input")}
                            placeholder="e.g. Budget constraints"
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            style={{ fontSize: 13, marginTop: 8 }}
                          />
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <button type="button" className={cx("btnSm", "btnGhost")} style={{ borderColor: "var(--red, #e74c3c)", color: "var(--red, #e74c3c)" }} disabled={isActing} onClick={() => void handleDecline(proposal.id)}>
                              {isActing ? "Declining…" : "Decline"}
                            </button>
                            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => { setDecliningId(null); setDeclineReason(""); }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {hasContracts && (
          <>
            <div className={cx("pageHeader", "mb0")} style={{ marginTop: 24 }}>
              <div>
                <div className={cx("pageEyebrow")}>Contracts</div>
                <h2 className={cx("pageTitle")} style={{ fontSize: "1.1rem" }}>Awaiting Signature</h2>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingContracts.length === 0 && (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}>✓</div>
                  <div className={cx("emptyStateTitle")}>No pending signatures</div>
                  <div className={cx("emptyStateSub")}>All available agreements have already been completed.</div>
                </div>
              )}
              {pendingContracts.map((doc) => {
                const isSigned   = doc.signed || signedIds.has(doc.id ?? "");
                const signerName = doc.signedByName ?? (doc.id ? signedNames.get(doc.id) : undefined);
                const signedDate = doc.signedAt ? fmtDate(doc.signedAt) : null;

                return (
                  <div key={doc.ref} className={cx("ctCard")}>
                    <div className={cx("ctCardIcon")}>{doc.icon}</div>
                    <div className={cx("ctCardBody")}>
                      <div className={cx("ctCardTitle")}>{doc.title}</div>
                      <div className={cx("ctCardMeta")}>
                        {isSigned && signedDate
                          ? `✓ Signed ${signedDate}${signerName ? ` by ${signerName}` : ""}`
                          : doc.status === "VOID" ? "Voided" : `Ref: ${doc.ref}`}
                      </div>
                    </div>
                    <div className={cx("ctCardActions")}>
                      <span className={cx("badge", isSigned ? "badgeGreen" : "badgeAmber")}>
                        {isSigned ? "Signed" : "Pending"}
                      </span>
                      {doc.fileId && (
                        <button
                          type="button"
                          className={cx("btnSm", "btnGhost")}
                          disabled={downloadingId === doc.id}
                          title="Download this contract"
                          onClick={() => void downloadContract(doc)}
                        >
                          {downloadingId === doc.id ? "…" : "Download"}
                        </button>
                      )}
                      {!isSigned && (
                        <button
                          type="button"
                          className={cx("btnSm", "btnAccent")}
                          onClick={() => void openViewer(doc)}
                        >
                          View &amp; Sign →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={cx("pageHeader", "mb0")} style={{ marginTop: 24 }}>
              <div>
                <div className={cx("pageEyebrow")}>Archive</div>
                <h2 className={cx("pageTitle")} style={{ fontSize: "1.1rem" }}>Signed Agreements</h2>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {signedContracts.length === 0 && (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}>📁</div>
                  <div className={cx("emptyStateTitle")}>No signed agreements yet</div>
                  <div className={cx("emptyStateSub")}>Completed contracts will appear here once both parties have signed.</div>
                </div>
              )}
              {signedContracts.map((doc) => {
                const signerName = doc.signedByName ?? (doc.id ? signedNames.get(doc.id) : undefined);
                const signedDate = doc.signedAt ? fmtDate(doc.signedAt) : null;

                return (
                  <div key={doc.ref} className={cx("ctCard")}>
                    <div className={cx("ctCardIcon")}>{doc.icon}</div>
                    <div className={cx("ctCardBody")}>
                      <div className={cx("ctCardTitle")}>{doc.title}</div>
                      <div className={cx("ctCardMeta")}>
                        {signedDate
                          ? "Signed " + signedDate + (signerName ? " by " + signerName : "")
                          : "Signed agreement"}
                      </div>
                    </div>
                    <div className={cx("ctCardActions")}>
                      <span className={cx("badge", "badgeGreen")}>Signed</span>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        disabled={!doc.fileId || downloadingId === doc.id}
                        title={doc.fileId ? "Download this contract" : "No file attached yet"}
                        onClick={() => void downloadContract(doc)}
                      >
                        {downloadingId === doc.id ? "…" : "Download"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
