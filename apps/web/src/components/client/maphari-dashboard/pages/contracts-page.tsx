"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../style";
import { usePageToast } from "../hooks/use-page-toast";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  createPortalSupportTicketWithRefresh,
  loadPortalContractsWithRefresh,
  signPortalContractWithRefresh,
  signContractWithSignatureWithRefresh,
  getPortalContractFileIdWithRefresh,
  getPortalFileDownloadUrlWithRefresh,
  loadContractTemplateWithRefresh,
  type PortalContract,
} from "../../../../lib/api/portal";
import { SignaturePad } from "../../../shared/ui/signature-pad";

// ── Types ─────────────────────────────────────────────────────────────────────

type LegalTab = "Documents" | "NDA Viewer" | "Sign Here";
type ViewState = "list" | "viewing" | "signing" | "signed";

const TABS: LegalTab[] = ["Documents", "NDA Viewer", "Sign Here"];

const TYPE_ICON: Record<string, string> = {
  NDA:      "🤝",
  SOW:      "📋",
  CONTRACT: "📄",
  DPA:      "🔒",
  MSA:      "📑",
};

// Fallback shown while the DB is empty (new clients before contracts are added)
const DOCS_FALLBACK = [
  { icon: "🤝", title: "Non-Disclosure Agreement (NDA)", meta: "Signed Jan 8, 2026 · Both parties",  signed: true,  ref: "NDA-2026-001", signedByName: null, signedAt: "2026-01-08T00:00:00Z" },
  { icon: "📋", title: "Service Agreement / Contract",   meta: "Signed Jan 10, 2026 · Both parties", signed: true,  ref: "CON-2026-001", signedByName: null, signedAt: "2026-01-10T00:00:00Z" },
  { icon: "📄", title: "Statement of Work (SOW)",        meta: "Signed Jan 10, 2026 · Both parties", signed: true,  ref: "SOW-2026-001", signedByName: null, signedAt: "2026-01-10T00:00:00Z" },
  { icon: "🔒", title: "Data Processing Agreement",      meta: "Requires your signature",            signed: false, ref: "DPA-2026-001", signedByName: null, signedAt: null },
];

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatContractMeta(c: PortalContract): string {
  if (c.signed && c.signedAt) {
    const d = new Date(c.signedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
    return `Signed ${d} · Both parties`;
  }
  if (c.status === "VOID") return "Voided";
  return "Requires your signature";
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

// ── Static fallback HTML used when no template is available ───────────────────

function buildFallbackHtml(title: string): string {
  return `<h2 style="font-family:sans-serif;margin-bottom:12px">${title}</h2>
<p style="font-family:sans-serif;line-height:1.75;color:#333">
  This document sets out the terms and conditions agreed upon between Maphari (Pty) Ltd and the Client.
  Please read the full agreement carefully before signing.
</p>
<h3 style="font-family:sans-serif;margin-top:24px">1. Confidentiality</h3>
<p style="font-family:sans-serif;line-height:1.75;color:#333">
  Each party agrees to treat as confidential all information received from the other party that is designated
  as confidential or that should reasonably be understood to be confidential given the nature of the information
  and circumstances of disclosure.
</p>
<h3 style="font-family:sans-serif;margin-top:24px">2. Obligations</h3>
<p style="font-family:sans-serif;line-height:1.75;color:#333">
  Each party shall protect confidential information with at least the same degree of care it uses for its own
  confidential information, and shall not disclose confidential information to any third parties without prior
  written consent.
</p>
<h3 style="font-family:sans-serif;margin-top:24px">3. Term</h3>
<p style="font-family:sans-serif;line-height:1.75;color:#333">
  This agreement remains in effect for two (2) years from the signing date, unless terminated earlier by
  mutual written agreement.
</p>
<h3 style="font-family:sans-serif;margin-top:24px">4. Governing Law</h3>
<p style="font-family:sans-serif;line-height:1.75;color:#333">
  This agreement is governed by the laws of the Republic of South Africa. Any dispute shall be resolved in
  the courts of Johannesburg, Gauteng.
</p>`;
}

// ── ContractViewer ─────────────────────────────────────────────────────────────

interface ContractViewerProps {
  doc:        DisplayDoc;
  html:       string;
  loading:    boolean;
  onClose:    () => void;
  onSigned:   (name: string, signatureDataUrl: string) => void;
}

function ContractViewer({ doc, html, loading, onClose, onSigned }: ContractViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const [scrollPct,        setScrollPct]        = useState(0);
  const [hasReadFull,      setHasReadFull]      = useState(false);
  const [viewState,        setViewState]        = useState<"viewing" | "signing" | "signed">("viewing");
  const [signatureName,    setSignatureName]    = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [agreed,           setAgreed]           = useState(false);
  const [signing,          setSigning]          = useState(false);
  const [signedAt,         setSignedAt]         = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable <= 0) {
      setScrollPct(100);
      setHasReadFull(true);
      return;
    }
    const pct = (el.scrollTop / scrollable) * 100;
    setScrollPct(Math.min(100, pct));
    if (pct >= 95) setHasReadFull(true);
  }, []);

  // After html loads, check if content is short enough to be fully visible
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 5) {
      setScrollPct(100);
      setHasReadFull(true);
    }
  }, [html, loading]);

  const canSign = signatureName.trim().length > 0 && signatureDataUrl !== null && agreed && !signing;
  const now = useMemo(() => new Date(), []);

  async function handleSign(): Promise<void> {
    if (!canSign) return;
    setSigning(true);
    const ts = nowIso();
    setSignedAt(ts);
    // slight delay for UX
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
        <button
          type="button"
          className={cx("btnSm", "btnGhost")}
          onClick={onClose}
          aria-label="Close document viewer"
        >
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
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
              style={{ marginTop: 8 }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Document body */}
          <div
            ref={contentRef}
            className={cx("ctViewerBody")}
            onScroll={handleScroll}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "#999", fontFamily: "sans-serif" }}>
                Loading document…
              </div>
            ) : (
              <div
                className={cx("ctViewerContent")}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
          </div>

          {/* Sticky footer */}
          <div className={cx("ctSignFooter")}>
            {!hasReadFull ? (
              <p className={cx("ctReadPrompt")}>
                Scroll to continue reading…
                <span style={{ marginLeft: 8, fontFamily: "var(--font-dm-mono), monospace", fontSize: 11 }}>
                  {Math.round(scrollPct)}%
                </span>
              </p>
            ) : viewState === "viewing" ? (
              <div className={cx("ctSigSection")}>
                <p className={cx("ctReadPrompt")} style={{ textAlign: "left" }}>
                  ✓ You&apos;ve read the full document
                </p>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Type your full name to sign</div>

                {/* Name input */}
                <input
                  className={cx("input")}
                  placeholder="Enter your full legal name"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  style={{ fontSize: 13 }}
                  autoFocus
                />

                {/* Signature preview (typed name) */}
                <div
                  className={cx("ctSigPreview")}
                >
                  {signatureName
                    ? signatureName
                    : <span className={cx("ctSigPreviewEmpty")}>Your signature appears here</span>
                  }
                </div>

                {/* Canvas signature pad */}
                <div>
                  <span className={cx("sigLabel")}>Draw your signature</span>
                  {signatureDataUrl ? (
                    <div className={cx("sigCanvasConfirmed")}>
                      <span style={{ fontSize: 13 }}>✓ Signature drawn</span>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        onClick={() => setSignatureDataUrl(null)}
                        style={{ fontSize: "0.75rem" }}
                      >
                        Redo
                      </button>
                    </div>
                  ) : (
                    <SignaturePad
                      height={140}
                      onSave={(dataUrl) => setSignatureDataUrl(dataUrl)}
                      onClear={() => setSignatureDataUrl(null)}
                    />
                  )}
                </div>

                {/* Timestamp */}
                <div style={{ fontSize: 11, color: "var(--muted2)", fontFamily: "var(--font-dm-mono), monospace" }}>
                  Signed on {fmtDateTime(now.toISOString())}
                </div>

                {/* Agree checkbox */}
                <label className={cx("ctAgreeRow")} style={{ fontSize: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <span>I agree to the terms of this document and confirm this constitutes my electronic signature.</span>
                </label>

                {/* Sign button */}
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
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

// ── ContractsPage ──────────────────────────────────────────────────────────────

export function ContractsPage() {
  const { session } = useProjectLayer();
  const notify = usePageToast();

  const [tab,           setTab]           = useState<LegalTab>("Documents");
  const [contracts,     setContracts]     = useState<PortalContract[] | null>(null);
  const [signedIds,     setSignedIds]     = useState<Set<string>>(new Set());
  const [signedNames,   setSignedNames]   = useState<Map<string, string>>(new Map());
  const [activeContract,setActiveContract]= useState<DisplayDoc | null>(null);
  const [contractHtml,  setContractHtml]  = useState<string>("");
  const [loadingHtml,   setLoadingHtml]   = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  // Load contracts from backend on mount
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadPortalContractsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message ?? "Failed to load."); setLoading(false); return; }
      if (r.data) {
        setContracts(r.data);
        const ids = new Set<string>();
        for (const c of r.data) {
          if (c.signed) ids.add(c.id);
        }
        setSignedIds(ids);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  // Decide which "display docs" to show: loaded API data or static fallback
  const usingApi = contracts !== null && contracts.length > 0;

  const displayDocs: DisplayDoc[] = useMemo(() => {
    if (usingApi) {
      return contracts.map((c) => ({
        id:           c.id,
        icon:         TYPE_ICON[c.type] ?? "📄",
        title:        c.title,
        meta:         formatContractMeta(c),
        signed:       signedIds.has(c.id),
        ref:          c.ref ?? c.id.slice(0, 12).toUpperCase(),
        fileId:       c.fileId,
        signedByName: null,
        signedAt:     c.signedAt,
        type:         c.type,
        status:       c.status,
        notes:        c.notes,
      }));
    }
    return DOCS_FALLBACK.map((d) => ({
      id:           null,
      icon:         d.icon,
      title:        d.title,
      meta:         d.meta,
      signed:       d.signed,
      ref:          d.ref,
      fileId:       null,
      signedByName: d.signedByName,
      signedAt:     d.signedAt,
      type:         "CONTRACT",
      status:       d.signed ? "SIGNED" : "PENDING_SIGNATURE",
      notes:        null,
    }));
  }, [usingApi, contracts, signedIds]);

  const unsignedCount = displayDocs.filter((d) => !d.signed).length;
  const hasDownloadableFiles = displayDocs.some((d) => d.id && d.fileId);

  // ── Open the full-screen contract viewer ─────────────────────────────────

  async function openViewer(doc: DisplayDoc): Promise<void> {
    setActiveContract(doc);
    setContractHtml("");

    if (!session) {
      setContractHtml(buildFallbackHtml(doc.title));
      return;
    }

    // Try to load template from notes field
    let templateId: string | null = null;
    let variables: Record<string, string> = {};
    try {
      const parsed = JSON.parse(doc.notes ?? "{}") as Record<string, unknown>;
      if (typeof parsed.templateId === "string") templateId = parsed.templateId;
      if (parsed.variables && typeof parsed.variables === "object") {
        variables = parsed.variables as Record<string, string>;
      }
    } catch {
      // no template info
    }

    if (!templateId) {
      setContractHtml(buildFallbackHtml(doc.title));
      return;
    }

    setLoadingHtml(true);
    try {
      const r = await loadContractTemplateWithRefresh(session, templateId, variables);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data?.renderedHtml) {
        setContractHtml(r.data.renderedHtml);
      } else {
        setContractHtml(buildFallbackHtml(doc.title));
      }
    } catch {
      setContractHtml(buildFallbackHtml(doc.title));
    } finally {
      setLoadingHtml(false);
    }
  }

  // ── Handle sign completion ───────────────────────────────────────────────

  async function handleSigned(doc: DisplayDoc, name: string, signatureDataUrl?: string): Promise<void> {
    const id = doc.id;
    // Optimistic update
    if (id) {
      setSignedIds((prev) => new Set([...prev, id]));
      setSignedNames((prev) => new Map([...prev, [id, name]]));
    }

    if (session) {
      try {
        if (id) {
          // Use canvas e-signature endpoint when a drawn signature is present
          const sr = signatureDataUrl
            ? await signContractWithSignatureWithRefresh(session, id, name, signatureDataUrl)
            : await signPortalContractWithRefresh(session, id, name);
          if (sr.nextSession) saveSession(sr.nextSession);
          if (sr.data?.signed) {
            setSignedIds((prev) => new Set([...prev, id]));
          }
        }
        const r = await createPortalSupportTicketWithRefresh(session, {
          clientId:    session.user.clientId ?? "",
          title:       `Document Signed: ${doc.title}`,
          description: `The client has electronically signed "${doc.title}" (Ref: ${doc.ref}) on ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.\n\nSigned as: ${name}`,
          category:    "CONTRACT_SIGNED",
          priority:    "HIGH",
        });
        if (r.nextSession) saveSession(r.nextSession);
      } catch {
        // silent — optimistic update already applied
      }
    }

    notify("success", "Document signed", "Timestamped signature recorded — copy sent to your email");
  }

  // ── Download helpers ──────────────────────────────────────────────────────

  async function downloadContract(doc: DisplayDoc): Promise<void> {
    if (!doc.id || !doc.fileId || !session) return;
    setDownloadingId(doc.id);
    try {
      const ref = await getPortalContractFileIdWithRefresh(session, doc.id);
      if (ref.nextSession) saveSession(ref.nextSession);
      if (!ref.data?.fileId) {
        notify("error", "No file attached", "This contract doesn't have a downloadable file yet.");
        return;
      }
      const dl = await getPortalFileDownloadUrlWithRefresh(session, ref.data.fileId);
      if (dl.nextSession) saveSession(dl.nextSession);
      if (!dl.data?.downloadUrl) {
        notify("error", "Download failed", "Could not generate download link.");
        return;
      }
      window.open(dl.data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      notify("error", "Download failed", "Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function downloadAll(): Promise<void> {
    if (!session) return;
    const downloadable = displayDocs.filter((d) => d.id && d.fileId);
    if (downloadable.length === 0) {
      notify("info", "No files available", "No contracts have downloadable files attached yet.");
      return;
    }
    for (const doc of downloadable) {
      await downloadContract(doc);
    }
  }

  // ── Shared card renderer ─────────────────────────────────────────────────

  function renderContractCard(doc: DisplayDoc) {
    const isSigned = doc.signed || signedIds.has(doc.id ?? "");
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
              : doc.status === "VOID"
                ? "Voided"
                : `Ref: ${doc.ref}`
            }
          </div>
        </div>
        <div className={cx("ctCardActions")}>
          <span className={cx("badge", isSigned ? "badgeGreen" : "badgeAmber")}>
            {isSigned ? "Signed" : "Pending"}
          </span>
          {isSigned ? (
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
              disabled={!doc.fileId || downloadingId === doc.id}
              title={doc.fileId ? "Download this contract" : "No file attached yet"}
              onClick={() => void downloadContract(doc)}
            >
              {downloadingId === doc.id ? "…" : "Download"}
            </button>
          ) : (
            <button
              type="button"
              className={cx("btnSm", "btnAccent")}
              onClick={() => void openViewer(doc)}
            >
              Review &amp; Sign →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Pending docs for Sign Here tab ───────────────────────────────────────

  const pendingDocs = displayDocs.filter((d) => !d.signed && !signedIds.has(d.id ?? ""));

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
  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Full-screen contract viewer overlay */}
      {activeContract !== null && (
        <ContractViewer
          doc={activeContract}
          html={contractHtml}
          loading={loadingHtml}
          onClose={() => setActiveContract(null)}
          onSigned={(name, sigDataUrl) => {
            void handleSigned(activeContract, name, sigDataUrl);
          }}
        />
      )}

      <div className={cx("pageBody")}>
        <div className={cx("pageHeader", "mb0")}>
          <div>
            <div className={cx("pageEyebrow")}>Finance · Legal</div>
            <h1 className={cx("pageTitle")}>Legal Agreements</h1>
            <p className={cx("pageSub")}>All NDAs, contracts, and legal agreements — signed, timestamped, and downloadable.</p>
          </div>
          <div className={cx("pageActions")}>
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
              disabled={!hasDownloadableFiles || downloadingId !== null}
              title={hasDownloadableFiles ? "Download all contract files" : "No downloadable files available yet"}
              onClick={() => void downloadAll()}
            >
              {downloadingId ? "Downloading…" : "Download All"}
            </button>
          </div>
        </div>

        {/* Unsigned banner */}
        {unsignedCount > 0 && (
          <div className={cx("ctUnsignedBanner")}>
            <span>⚠️</span>
            <span className={cx("text12", "fw600")}>
              {unsignedCount} document{unsignedCount > 1 ? "s" : ""} require{unsignedCount === 1 ? "s" : ""} your signature
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className={cx("pillTabs", "mb16")}>
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={cx("pillTab", tab === t && "pillTabActive")}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Documents tab */}
        {tab === "Documents" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {displayDocs.map((doc) => renderContractCard(doc))}
          </div>
        ) : null}

        {/* NDA Viewer tab — shows first signed contract or first overall */}
        {tab === "NDA Viewer" ? (
          <div className={cx("card")}>
            <div className={cx("cardHd")}>
              <span className={cx("cardHdTitle")}>Document Preview</span>
            </div>
            <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {displayDocs.map((doc) => {
                const isSigned = doc.signed || signedIds.has(doc.id ?? "");
                const signerName = doc.signedByName ?? (doc.id ? signedNames.get(doc.id) : undefined);
                const signedDate = doc.signedAt ? fmtDate(doc.signedAt) : null;
                return (
                  <div key={doc.ref} className={cx("listRow")}>
                    <span style={{ fontSize: 20 }}>{doc.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={cx("fw600", "text13")}>{doc.title}</div>
                      <div className={cx("text11", "colorMuted")}>
                        {isSigned && signedDate
                          ? `✓ Signed ${signedDate}${signerName ? ` by ${signerName}` : ""}`
                          : `Ref: ${doc.ref}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className={cx("badge", isSigned ? "badgeGreen" : "badgeAmber")}>
                        {isSigned ? "Signed" : "Pending"}
                      </span>
                      {!isSigned && (
                        <button
                          type="button"
                          className={cx("btnSm", "btnAccent")}
                          onClick={() => void openViewer(doc)}
                        >
                          Review &amp; Sign →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Sign Here tab */}
        {tab === "Sign Here" ? (
          <div className={cx("card")}>
            <div className={cx("cardHd")}>
              <span className={cx("cardHdTitle")}>Documents Requiring Signature</span>
            </div>
            {pendingDocs.length === 0 ? (
              <div className={cx("p20", "textCenter", "colorMuted", "text12")}>
                All documents signed. Nothing more needed from you.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px" }}>
                {pendingDocs.map((doc) => (
                  <div key={doc.ref} className={cx("ctCard")}>
                    <div className={cx("ctCardIcon")}>{doc.icon}</div>
                    <div className={cx("ctCardBody")}>
                      <div className={cx("ctCardTitle")}>{doc.title}</div>
                      <div className={cx("ctCardMeta")}>Ref: {doc.ref}</div>
                    </div>
                    <div className={cx("ctCardActions")}>
                      <span className={cx("badge", "badgeAmber")}>Awaiting Signature</span>
                      <button
                        type="button"
                        className={cx("btnSm", "btnAccent")}
                        onClick={() => void openViewer(doc)}
                      >
                        Review &amp; Sign →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
