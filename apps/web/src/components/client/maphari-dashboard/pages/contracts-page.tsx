"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";

type LegalTab = "Documents" | "NDA Viewer" | "Sign Here";

type LegalDoc = {
  icon: string;
  title: string;
  meta: string;
  signed: boolean;
  ref: string;
};

const TABS: LegalTab[] = ["Documents", "NDA Viewer", "Sign Here"];

const DOCS: LegalDoc[] = [
  { icon: "🤝", title: "Non-Disclosure Agreement (NDA)", meta: "Signed Jan 8, 2026 · Both parties", signed: true, ref: "NDA-2026-001" },
  { icon: "📋", title: "Service Agreement / Contract", meta: "Signed Jan 10, 2026 · Both parties", signed: true, ref: "CON-2026-001" },
  { icon: "📄", title: "Statement of Work (SOW)", meta: "Signed Jan 10, 2026 · Both parties", signed: true, ref: "SOW-2026-001" },
  { icon: "🔒", title: "Data Processing Agreement", meta: "Requires your signature", signed: false, ref: "DPA-2026-001" },
];

const NDA_SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: "NON-DISCLOSURE AGREEMENT",
    body: "This Non-Disclosure Agreement (\"Agreement\") is entered into as of January 8, 2026, between Maphari Studio (Pty) Ltd, a South African company (\"Agency\"), and Veldt Finance (Pty) Ltd (\"Client\").",
  },
  {
    title: "1. Confidential Information",
    body: "Each party agrees to treat as confidential all information received from the other party that is designated as confidential or that should reasonably be understood to be confidential.",
  },
  {
    title: "2. Obligations",
    body: "Each party shall: (a) protect confidential information with at least the same degree of care it uses for its own information; (b) not disclose confidential information to third parties without written consent; and (c) use confidential information solely to evaluate and execute the business relationship.",
  },
  {
    title: "3. Term",
    body: "This Agreement remains in effect for two (2) years from the signing date, unless terminated earlier by mutual written agreement.",
  },
  {
    title: "4. Governing Law",
    body: "This Agreement is governed by the laws of the Republic of South Africa. Any dispute will be resolved in the courts of Johannesburg, Gauteng.",
  },
];

export function ContractsPage() {
  const [tab, setTab] = useState<LegalTab>("Documents");
  const [signedDocs, setSignedDocs] = useState<boolean[]>(DOCS.map((doc) => doc.signed));
  const [signModal, setSignModal] = useState<number | null>(null);
  const [viewerDoc, setViewerDoc] = useState<number>(0);
  const [signatureName, setSignatureName] = useState("Naledi Dlamini");
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const unsignedCount = useMemo(
    () => signedDocs.reduce((count, signed, idx) => (signed || !DOCS[idx] ? count : count + 1), 0),
    [signedDocs],
  );

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  function openViewer(index: number): void {
    setViewerDoc(index);
    setTab("NDA Viewer");
  }

  function openSign(index: number): void {
    setSignModal(index);
    setTab("Sign Here");
  }

  function handleSignSubmit(): void {
    if (signModal === null) return;
    setSignedDocs((prev) => prev.map((signed, idx) => (idx === signModal ? true : signed)));
    setSignModal(null);
    notify("Document signed", "Timestamped signature recorded — copy sent to your email");
  }

  return (
    <div className={cx("pageBody", styles.legalAgRoot)}>
      <div className={styles.legalAgLayout}>
        <aside className={styles.legalAgSidebar}>
          <div className={styles.legalAgSection}>Legal</div>
          {TABS.map((item, idx) => (
            <button
              key={item}
              type="button"
              className={cx(styles.legalAgSideItem, tab === item && styles.legalAgSideItemActive)}
              onClick={() => setTab(item)}
            >
              <span
                className={styles.legalAgDot}
                style={{ background: idx === 0 ? "var(--accent)" : idx === 1 ? "var(--purple)" : "var(--green)" }}
              />
              <span>{item}</span>
            </button>
          ))}

          <div className={styles.legalAgDivider} />

          <div className={cx(styles.legalAgStatusCard, unsignedCount > 0 ? styles.legalAgStatusPending : styles.legalAgStatusDone)}>
            <div className={styles.legalAgStatusText}>
              {unsignedCount > 0
                ? `${unsignedCount} document${unsignedCount > 1 ? "s" : ""} awaiting signature`
                : "All documents signed"}
            </div>
          </div>
        </aside>

        <section className={styles.legalAgMain}>
          <div className={cx("pageHeader", "mb0")}>
            <div>
              <div className={cx("pageEyebrow")}>Veldt Finance · Legal</div>
              <h1 className={cx("pageTitle")}>Legal Agreements</h1>
              <p className={cx("pageSub")}>All NDAs, contracts, and legal agreements — signed, timestamped, and downloadable.</p>
            </div>
            <div className={cx("pageActions")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Downloaded", "All documents downloaded as ZIP")}>Download All</button>
            </div>
          </div>

          <div className={styles.legalAgTabs}>
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                className={cx(styles.legalAgTab, tab === item && styles.legalAgTabActive)}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === "Documents" ? (
            <div className={styles.legalAgContent}>
              <div className={styles.legalAgSectionTitle}>All Documents</div>
              {DOCS.map((doc, idx) => (
                <div key={doc.ref} className={styles.legalAgDocItem}>
                  <span className={styles.legalAgDocIcon}>{doc.icon}</span>
                  <div className={styles.legalAgGrow}>
                    <div className={styles.legalAgDocName}>{doc.title}</div>
                    <div className={styles.legalAgDocMeta}>{doc.meta} · Ref: {doc.ref}</div>
                  </div>
                  <span className={cx("badge", signedDocs[idx] ? "badgeGreen" : "badgeAmber")}>{signedDocs[idx] ? "Signed" : "Awaiting Signature"}</span>
                  <div className={styles.legalAgDocActions}>
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => openViewer(idx)}>View</button>
                    {signedDocs[idx] ? (
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Downloaded", `${doc.title} downloaded`)}>Download</button>
                    ) : (
                      <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => openSign(idx)}>Sign</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "NDA Viewer" ? (
            <div className={styles.legalAgContent}>
              <div className={styles.legalAgSectionTitle}>{DOCS[viewerDoc]?.title ?? "Non-Disclosure Agreement"}</div>
              <div className={styles.legalAgDocViewer}>
                {NDA_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <div className={styles.legalAgDocSectionTitle}>{section.title}</div>
                    <p>{section.body}</p>
                  </div>
                ))}
              </div>
              <div className={styles.legalAgSignedStrip}>
                Signed by Naledi Dlamini (Veldt Finance) and Sipho Ndlovu (Maphari Studio) · Jan 8, 2026 at 14:32 SAST
              </div>
            </div>
          ) : null}

          {tab === "Sign Here" ? (
            <div className={styles.legalAgContent}>
              <div className={styles.legalAgSectionTitle}>Documents Requiring Signature</div>
              {DOCS.map((doc, idx) => (
                !signedDocs[idx] ? (
                  <div key={doc.ref} className={cx("card", styles.legalAgSignCard)}>
                    <div className={styles.legalAgSignHead}>
                      <div>
                        <div className={styles.legalAgSignTitle}>{doc.title}</div>
                        <div className={styles.legalAgSignMeta}>Ref: {doc.ref}</div>
                      </div>
                      <span className={cx("badge", "badgeAmber")}>Awaiting Signature</span>
                    </div>
                    <div className={styles.legalAgSignBox}>
                      <div className={styles.legalAgSignHint}>Click to sign electronically</div>
                      <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => openSign(idx)}>Sign Document</button>
                    </div>
                  </div>
                ) : null
              ))}

              {signedDocs.every(Boolean) ? (
                <div className={styles.legalAgAllDone}>All documents signed. Nothing more needed from you.</div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      {signModal !== null ? (
        <div className={styles.legalAgModalBackdrop} onClick={() => setSignModal(null)}>
          <div className={styles.legalAgModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.legalAgModalHead}>
              <span className={styles.legalAgModalTitle}>Sign: {DOCS[signModal]?.title}</span>
              <button type="button" className={styles.legalAgModalClose} onClick={() => setSignModal(null)} aria-label="Close dialog">x</button>
            </div>
            <div className={styles.legalAgModalBody}>
              <div className={styles.legalAgModalInfo}>
                By signing, you confirm you have read and agree to the terms of this document. Your signature will be timestamped and legally binding.
              </div>
              <label className={styles.legalAgModalLabel} htmlFor="legal-sign-name">Type your full name to sign</label>
              <input
                id="legal-sign-name"
                className={styles.legalAgInput}
                value={signatureName}
                onChange={(event) => setSignatureName(event.target.value)}
                placeholder="Naledi Dlamini"
              />
              <div className={styles.legalAgSignaturePreview}>
                <div className={styles.legalAgSignatureName}>{signatureName || "Naledi Dlamini"}</div>
                <div className={styles.legalAgSignatureLabel}>Electronic Signature Preview</div>
              </div>
            </div>
            <div className={styles.legalAgModalFoot}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setSignModal(null)}>Cancel</button>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={handleSignSubmit}>Sign &amp; Submit</button>
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
