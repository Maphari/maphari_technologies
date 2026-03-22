"use client";
import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import type { PortalPayment, PortalInvoice } from "../../../../lib/api/portal/types";
import { usePageToast } from "../hooks/use-page-toast";
import { formatMoneyCents } from "../../../../lib/i18n/currency";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import { loadPortalProjectPaymentMilestonesWithRefresh } from "../../../../lib/api/portal";
import type { PortalProjectPaymentMilestone } from "../../../../lib/api/portal";

// ── Types ──────────────────────────────────────────────────────────────────────

type PTab      = "All" | "Paid" | "Pending" | "Overdue";
type PStatus   = "Paid" | "Pending" | "Overdue";
type PCategory = "Development" | "Design" | "Retainer" | "Strategy" | "QA" | "Change Request";
type PayMethod = "visa" | "mc" | "bank";
type AddMethodType = "card" | "bank" | "eft";
type PayState  = "idle" | "processing" | "success";

interface Payment {
  id: string; invoiceRef: string; description: string;
  date: string; dueDate: string; amountRaw: number;
  status: PStatus; method?: string; category: PCategory;
  project: string; contact: string; contactInitials: string;
  receiptNum?: string; note?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const CAT: Record<PCategory, { icon: string; color: string }> = {
  Development:     { icon: "code",        color: "var(--cyan)"   },
  Design:          { icon: "pen",         color: "var(--purple)" },
  Retainer:        { icon: "layers",      color: "var(--blue)"   },
  Strategy:        { icon: "target",      color: "var(--amber)"  },
  QA:              { icon: "shieldCheck", color: "var(--green)"  },
  "Change Request":{ icon: "edit",        color: "var(--lime)"   },
};

const STATUS_COLOR: Record<PStatus, string> = {
  Paid: "var(--lime)", Pending: "var(--amber)", Overdue: "var(--red)",
};

// ── Data ───────────────────────────────────────────────────────────────────────

const CHART_H = 104;

const TABS: PTab[] = ["All", "Paid", "Pending", "Overdue"];

const daysAgo = (dateStr: string, now: number) => {
  const d = new Date(dateStr.split(" ").reverse().join("-").replace("Apr","04").replace("Mar","03").replace("Feb","02").replace("Jan","01"));
  return Math.max(0, Math.floor((now - d.getTime()) / 86_400_000));
};

// ── Page Styles ────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  @keyframes pmSpin    { to { transform: rotate(360deg); } }
  @keyframes pmFadeIn  { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
  @keyframes pmCheck   { 0%{transform:scale(0)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
  @keyframes payRowIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

  .pm-spin     { animation: pmSpin 0.8s linear infinite; }
  .pm-fadein   { animation: pmFadeIn 0.25s ease; }
  .pm-checkpop { animation: pmCheck 0.45s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
  .pay-row     { animation: payRowIn 300ms cubic-bezier(0.23,1,0.32,1) both; }
  .pay-expand  { animation: payRowIn 220ms cubic-bezier(0.23,1,0.32,1) both; }
  .pay-chevron { transition: transform 200ms cubic-bezier(0.23,1,0.32,1); display:flex; }
  .pay-chevron-open { transform: rotate(90deg); }
  .pay-method  { transition: border-color 0.15s, transform 0.15s; cursor: pointer; }
  .pay-method:hover { transform: translateY(-1px); }

  @keyframes pmShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }

  @media (prefers-reduced-motion: reduce) {
    .pm-fadein, .pm-checkpop, .pay-row, .pay-expand { animation: none; }
    .pm-spin { animation: pmSpin 1.5s linear infinite; }
    .pay-chevron, .pay-method { transition: none; }
    .pay-method:hover { transform: none; }
  }
`;

// ── Card helpers ──────────────────────────────────────────────────────────────

type CardNetwork = "visa" | "mastercard" | "amex" | "discover" | "unknown";

function detectNetwork(num: string): CardNetwork {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(6011|622|64[4-9]|65)/.test(n)) return "discover";
  return "unknown";
}

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\s/g, "");
  if (digits.length < 13) return false;
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d; alt = !alt;
  }
  return sum % 10 === 0;
}

function formatCardNumber(raw: string, network: CardNetwork): string {
  const digits = raw.replace(/\D/g, "");
  const maxLen = network === "amex" ? 15 : 16;
  const trimmed = digits.slice(0, maxLen);
  if (network === "amex") {
    return trimmed.replace(/^(\d{0,4})(\d{0,6})(\d{0,5})$/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(" ")
    );
  }
  return trimmed.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

function isExpiryValid(expiry: string): boolean {
  const [mm, yy] = expiry.split("/");
  if (!mm || !yy || mm.length < 2 || yy.length < 2) return false;
  const month = parseInt(mm, 10);
  const year  = 2000 + parseInt(yy, 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

const NETWORK_LABELS: Record<CardNetwork, string> = {
  visa: "VISA", mastercard: "MASTERCARD", amex: "AMEX", discover: "DISCOVER", unknown: "",
};

const NETWORK_GRADIENTS: Record<CardNetwork, string> = {
  visa:       "linear-gradient(135deg, #1a1f4e 0%, #1e3a7a 100%)",
  mastercard: "linear-gradient(135deg, #23141a 0%, #4a1028 100%)",
  amex:       "linear-gradient(135deg, #00443a 0%, #006e5a 100%)",
  discover:   "linear-gradient(135deg, #7c2200 0%, #c84400 100%)",
  unknown:    "linear-gradient(135deg, var(--s3) 0%, var(--s2) 100%)",
};

const SA_BANKS = [
  "ABSA Bank", "FNB (First National Bank)", "Standard Bank", "Nedbank",
  "Capitec Bank", "Investec Bank", "African Bank", "Bidvest Bank",
  "Discovery Bank", "TymeBank", "Bank Zero", "Mercantile Bank",
];

const BANK_BRANCH_CODES: Record<string, string> = {
  "ABSA Bank": "632005",
  "FNB (First National Bank)": "250655",
  "Standard Bank": "051001",
  "Nedbank": "198765",
  "Capitec Bank": "470010",
  "Investec Bank": "580105",
  "Bidvest Bank": "462005",
};

const ACCOUNT_TYPES = [
  "Cheque / Current Account",
  "Savings Account",
  "Transmission Account",
  "Credit Card Account",
];

const SA_PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape",
];

// ── Saved method record ────────────────────────────────────────────────────────

interface SavedMethodRecord {
  id: string;
  type: AddMethodType;
  network?: CardNetwork;
  holderName: string;
  maskedNumber: string;
  expiry?: string;
  bankName?: string;
  accountType?: string;
  branchCode?: string;
  billingAddress?: string;
  billingCity?: string;
  billingCountry?: string;
  isDefault: boolean;
  addedAt: string;
}

// ── Card Face Preview ──────────────────────────────────────────────────────────

function CardPreview({ network, number, name, expiry, flipped }: {
  network: CardNetwork; number: string; name: string; expiry: string; flipped: boolean;
}) {
  const rawDigits = number.replace(/\s/g, "");
  const maxLen = network === "amex" ? 15 : 16;
  const paddedDigits = rawDigits.padEnd(maxLen, "•");
  let displayNumber: string;
  if (network === "amex") {
    displayNumber = `${paddedDigits.slice(0,4)} ${paddedDigits.slice(4,10)} ${paddedDigits.slice(10,15)}`;
  } else {
    displayNumber = `${paddedDigits.slice(0,4)} ${paddedDigits.slice(4,8)} ${paddedDigits.slice(8,12)} ${paddedDigits.slice(12,16)}`;
  }
  const displayName   = name.trim().toUpperCase() || "CARDHOLDER NAME";
  const displayExpiry = expiry || "MM/YY";

  return (
    <div style={{ perspective: "1000px", marginBottom: "4px" }}>
      <div style={{
        position: "relative", width: "100%", height: "162px",
        transformStyle: "preserve-3d",
        transition: "transform 0.5s cubic-bezier(0.23,1,0.32,1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        borderRadius: "14px",
      }}>
        {/* ── Card Front ── */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" as React.CSSProperties["WebkitBackfaceVisibility"],
          background: NETWORK_GRADIENTS[network], borderRadius: "14px",
          padding: "18px 20px", display: "flex", flexDirection: "column",
          justifyContent: "space-between", overflow: "hidden",
          boxShadow: "0 8px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)", pointerEvents: "none" }} />
          {/* Top row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* EMV chip */}
            <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
              <rect x="0.5" y="0.5" width="35" height="27" rx="5.5" fill="#d4a843" stroke="#c09020"/>
              <rect x="12" y="0.5" width="12" height="27" fill="#c09020" opacity="0.4"/>
              <rect x="0.5" y="9" width="35" height="10" fill="#c09020" opacity="0.4"/>
              <rect x="13" y="9.5" width="10" height="9" rx="1" fill="#b8882a" stroke="#a07018"/>
              <line x1="18" y1="0.5" x2="18" y2="27.5" stroke="#a07018" strokeWidth="0.5"/>
              <line x1="0.5" y1="14" x2="35.5" y2="14" stroke="#a07018" strokeWidth="0.5"/>
            </svg>
            {/* Contactless waves */}
            <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
              {[8, 12, 16].map((r) => (
                <svg key={r} width={r} height={r} viewBox={`0 0 ${r} ${r}`} fill="none" opacity={0.5}>
                  <path d={`M${r*0.2} ${r*0.5} A${r*0.3} ${r*0.3} 0 0 1 ${r*0.8} ${r*0.5}`} stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ))}
            </div>
          </div>
          {/* Card number */}
          <div style={{
            fontFamily: "'Courier New', Courier, monospace", fontSize: "15px",
            letterSpacing: "2.5px", color: "rgba(255,255,255,0.92)", fontWeight: 700,
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}>
            {displayNumber}
          </div>
          {/* Name + expiry + network */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.38)", marginBottom: "2px", letterSpacing: "0.5px" }}>CARD HOLDER</div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.90)", letterSpacing: "1px", maxWidth: "168px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.38)", marginBottom: "2px", letterSpacing: "0.5px" }}>EXPIRES</div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.90)", letterSpacing: "1px" }}>
                {displayExpiry}
              </div>
            </div>
          </div>
          {/* Network badge */}
          {network !== "unknown" && (
            <div style={{ position: "absolute", top: "16px", right: "16px", fontSize: "9px", fontWeight: 900, letterSpacing: "1.5px", color: "rgba(255,255,255,0.55)" }}>
              {NETWORK_LABELS[network]}
            </div>
          )}
        </div>

        {/* ── Card Back ── */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" as React.CSSProperties["WebkitBackfaceVisibility"],
          transform: "rotateY(180deg)",
          background: NETWORK_GRADIENTS[network], borderRadius: "14px", overflow: "hidden",
          boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
        }}>
          <div style={{ width: "100%", height: "38px", background: "#111", marginTop: "22px" }} />
          <div style={{ margin: "10px 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              flex: 1, height: "34px", background: "repeating-linear-gradient(90deg,#f5f0e8 0px,#f0ebe0 4px,#e8e0d0 4px,#f5f0e8 8px)",
              borderRadius: "3px", display: "flex", alignItems: "center", paddingLeft: "8px",
            }}>
              <span style={{ fontSize: "9px", color: "rgba(0,0,0,0.28)", letterSpacing: "0.5px" }}>AUTHORISED SIGNATURE</span>
            </div>
            <div style={{
              width: "54px", height: "34px", background: "rgba(0,0,0,0.22)", borderRadius: "3px",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.12)",
            }}>
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "9px", letterSpacing: "0.5px" }}>CVV</span>
            </div>
          </div>
          <div style={{ margin: "10px 20px 0", fontSize: "8px", color: "rgba(255,255,255,0.22)", lineHeight: "13px" }}>
            This card is issued subject to the conditions set out in the Cardholder Agreement. Unauthorised use is prohibited.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pay Modal ──────────────────────────────────────────────────────────────────

function PayModal({ amount, desc, method, onClose }: { amount: number; desc: string; method: PayMethod; onClose: () => void }) {
  const [payState, setPayState] = useState<PayState>("idle");
  const [splitPay, setSplitPay] = useState(false);
  const [cardNum, setCardNum]   = useState("");
  const [expiry, setExpiry]     = useState("");
  const [cvv, setCvv]           = useState("");
  const [receiptNum]            = useState(() => "RCP-" + Date.now().toString().slice(-6));

  const installment    = Math.ceil(amount / 3);
  const fmtDec = (n: number) => formatMoneyCents(Math.round(n * 100), { currency: "ZAR" });

  useEffect(() => {
    if (payState !== "processing") return;
    const t = setTimeout(() => setPayState("success"), 2200);
    return () => clearTimeout(t);
  }, [payState]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && payState !== "processing") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [payState, onClose]);

  return (
    <>
      <div
        className={cx("modalOverlay")}
        onClick={(e) => { if (e.target === e.currentTarget && payState !== "processing") onClose(); }}
      >
        <div className={cx("pm-fadein", "pmModalInner")}>

          <div className={cx("pmModalHd")}>
            <div className={cx("flexRow", "gap8")}>
              <Ic n="shieldCheck" sz={15} c="var(--lime)" />
              <span className={cx("fw600", "text11", "colorAccent")}>Secure Payment · 256-bit encrypted</span>
            </div>
            {payState !== "processing" && (
              <button type="button" onClick={onClose} className={cx("iconBtnGhost")}>
                <Ic n="x" sz={16} />
              </button>
            )}
          </div>

          <div className={cx("p24x24x20")}>
            {payState !== "success" && (
              <div className={cx("textCenter", "mb20")}>
                <div className={cx("invTotalVal")}>
                  {fmtDec(splitPay ? installment : amount)}
                </div>
                <div className={cx("text11", "colorMuted", "mt4")}>
                  {splitPay ? `Instalment 1 of 3 · ${desc}` : desc}
                </div>
              </div>
            )}

            {payState === "idle" && (
              <>
                <div className={cx("pmCardFace", "dynBgColor")} style={{ "--bg-color": "var(--s3)" } as React.CSSProperties}>
                  <div className={cx("flexBetween")}>
                    <div className={cx("cardChipAmber")} />
                    {method === "bank" && <Ic n="bank" sz={16} c="var(--muted2)" />}
                  </div>
                  <div className={cx("pmCardNumberLabel", "dynColor")} style={{ "--color": method !== "bank" ? "rgba(255,255,255,0.8)" : "var(--muted2)" } as React.CSSProperties}>
                    {method !== "bank" ? `•••• •••• •••• ????` : `FNB Business •••• ?????`}
                  </div>
                </div>

                {method !== "bank" && (
                  <div className={cx("flexCol", "gap10", "mb16")}>
                    <div className={cx("relative")}>
                      <div className={cx("searchIconWrap")}>
                        <Ic n="creditCard" sz={14} c="var(--muted2)" />
                      </div>
                      <input className={cx("input", "pl34")} placeholder="•••• •••• •••• ••••" value={cardNum} onChange={(e) => setCardNum(e.target.value.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim())} />
                    </div>
                    <div className={cx("grid2Cols10Gap")}>
                      <input className={cx("input")} placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                      <input className={cx("input")} placeholder="CVV" value={cvv} onChange={(e) => setCvv(e.target.value.slice(0,4))} type="password" />
                    </div>
                  </div>
                )}

                {method === "bank" && (
                  <div className={cx("card", "p12x14", "mb16", "dynBgColor")}>
                    <div className={cx("fw600", "text11", "mb6")}>Bank Transfer Reference</div>
                    <div className={cx("text12", "colorMuted")}>Account: FNB 62 345 678 9</div>
                    <div className={cx("fontMono", "text11", "mt4", "colorAccent")}>VEL-{desc.split(" ")[0].toUpperCase().slice(0,4)}-{amount}</div>
                  </div>
                )}

                <div className={cx("splitPayToggleRow")}>
                  <button type="button" onClick={() => setSplitPay((p) => !p)} className={cx("splitPayToggleBtn", "dynBgColor")}>
                    <Ic n="splitPay" sz={14} c={splitPay ? "var(--amber)" : "var(--muted2)"} />
                    <span className={cx("fw600", "text12", "dynColor", "flex1", "textLeft")} style={{ "--color": splitPay ? "var(--amber)" : "inherit" } as React.CSSProperties}>
                      Split into 3 monthly payments
                    </span>
                    <span className={cx("splitPayBadge", "dynBgColor")} style={{ "--bg-color": splitPay ? "color-mix(in oklab, var(--amber) 15%, transparent)" : "var(--s3)", "--color": splitPay ? "var(--amber)" : "var(--muted2)" } as React.CSSProperties}>
                      {splitPay ? "ON" : "OFF"}
                    </span>
                  </button>
                  {splitPay && (
                    <div className={cx("mt10", "flexCol", "gap4")}>
                      {["Today", "30 days", "60 days"].map((label, i) => (
                        <div key={i} className={cx("flexBetween")}>
                          <span className={cx("text11", "colorMuted")}>{label}</span>
                          <span className={cx("fontMono", "fw700", "text11", "colorAmber", "tabularNums")}>{fmtDec(installment)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" onClick={() => setPayState("processing")} className={cx("btnPrimary")}>
                  <Ic n="lock" sz={14} c="var(--bg)" />
                  Pay {fmtDec(splitPay ? installment : amount)} Securely
                </button>
              </>
            )}

            {payState === "processing" && (
              <div className={cx("textCenter", "p20x0x8")}>
                <div className={cx("spinnerLg", "pm-spin")} />
                <div className={cx("fw700", "text13", "mb4")}>Processing securely...</div>
                <div className={cx("text11", "colorMuted")}>Please don&apos;t close this window</div>
              </div>
            )}

            {payState === "success" && (
              <div className={cx("textCenter", "p8x0x4")}>
                <div className={cx("pmSuccessCircle")}>
                  <Ic n="check" sz={28} c="var(--lime)" sw={2.5} />
                </div>
                <div className={cx("fw800", "text16", "mb4")}>Payment Successful!</div>
                <div className={cx("text11", "colorMuted", "mb16")}>{desc}</div>
                <div className={cx("pmReceiptBlock", "dynBgColor")}>
                  <div className={cx("text10", "colorMuted", "mb2")}>Receipt Number</div>
                  <div className={cx("fontMono", "fw700", "text13", "colorAccent", "monoTag")}>{receiptNum}</div>
                </div>
                <div className={cx("flexRow", "justifyCenter", "gap8")}>
                  <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap5")} title="Download not yet available" disabled>
                    <Ic n="download" sz={13} /> Download Receipt
                  </button>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={onClose}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function PaymentsPage({ payments: apiPayments = [], invoices: apiInvoices = [], currency = "ZAR" }: { payments?: PortalPayment[]; invoices?: PortalInvoice[]; currency?: string }) {
  const notify = usePageToast();

  const { session, projectId } = useProjectLayer();
  const [milestones, setMilestones] = useState<PortalProjectPaymentMilestone[] | null>(null);

  useEffect(() => {
    if (!session || !projectId) return;
    loadPortalProjectPaymentMilestonesWithRefresh(session, projectId).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setMilestones(r.data);
    });
  }, [session, projectId]);

  const [tab, setTab]                   = useState<PTab>("All");
  const [search, setSearch]             = useState("");
  const [expanded, setExpanded]         = useState<string | null>(null);
  const [selectedMethod]                = useState<PayMethod>("visa");
  const [payModal, setPayModal]         = useState<{ amount: number; desc: string } | null>(null);

  const monthlyActivity = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleDateString("en-ZA", { month: "short" });
      const total = (apiPayments ?? [])
        .filter(p => {
          const pd = new Date(p.createdAt);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        })
        .reduce((s, p) => s + p.amountCents, 0);
      return { label, amountCents: total };
    });
  }, [apiPayments]);

  const paymentData: Payment[] = useMemo(() => {
    if (apiPayments.length === 0) return [];
    const invoiceMap = new Map(apiInvoices.map((inv) => [inv.id, inv]));
    const statusMap: Record<string, PStatus> = {
      COMPLETED: "Paid", PENDING: "Pending", FAILED: "Overdue", REFUNDED: "Paid",
    };
    return apiPayments.map((pay) => {
      const inv = invoiceMap.get(pay.invoiceId);
      const status: PStatus = statusMap[pay.status] ?? "Pending";
      return {
        id: pay.id.slice(0, 8).toUpperCase(),
        invoiceRef: inv?.number ?? pay.invoiceId.slice(0, 8),
        description: inv ? `Invoice ${inv.number}` : "Payment",
        date: pay.paidAt ? new Date(pay.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
        dueDate: inv?.dueAt ? new Date(inv.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
        amountRaw: pay.amountCents / 100,
        status,
        method: pay.provider ?? undefined,
        category: "Development" as PCategory,
        project: "Active Project",
        contact: "Account Manager",
        contactInitials: "AM",
        receiptNum: pay.transactionRef ?? undefined,
      };
    });
  }, [apiPayments, apiInvoices]);

  const filtered = useMemo(() => {
    let list = tab === "All" ? paymentData : paymentData.filter((p) => p.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.description.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return list;
  }, [tab, search, paymentData]);

  const overdueItems     = paymentData.filter((p) => p.status === "Overdue");
  const totalPaidCents   = apiPayments.filter((p) => p.status === "COMPLETED" || p.status === "REFUNDED").reduce((s, p) => s + p.amountCents, 0);
  const totalPendingCents = apiPayments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amountCents, 0);
  const totalOverdueCents = apiPayments.filter((p) => p.status === "FAILED").reduce((s, p) => s + p.amountCents, 0);

  const statusBadge = (s: PStatus) => s === "Paid" ? "badgeGreen" : s === "Pending" ? "badgeAmber" : "badgeRed";

  return (
    <div className={cx("pageBody")}>
      <style>{PAGE_STYLES}</style>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Payments</div>
          <h1 className={cx("pageTitle")}>Payments</h1>
          <p className={cx("pageSub")}>Manage payments, track history, and settle outstanding invoices securely.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")}>
            <Ic n="download" sz={13} /> Download Statement
          </button>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")}>
            <Ic n="bell" sz={13} /> Reminders
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Paid",   value: apiPayments.length > 0 ? formatMoneyCents(totalPaidCents,    { currency })    : "—", color: "statCardGreen", icon: "check",    iconColor: "var(--green)", trend: `${paymentData.filter(p => p.status === "Paid").length} transactions` },
          { label: "Outstanding",  value: apiPayments.length > 0 ? formatMoneyCents(totalPendingCents, { currency }) : "—", color: "statCardAmber", icon: "clock",    iconColor: "var(--amber)", trend: `${paymentData.filter(p => p.status === "Pending").length} pending` },
          { label: "Overdue",      value: apiPayments.length > 0 ? formatMoneyCents(totalOverdueCents, { currency }) : "—", color: "statCardRed",   icon: "alert",    iconColor: "var(--red)",   trend: paymentData.length > 0 ? "See payment list" : "No overdue items" },
          { label: "Next Due",     value: "—",                                               color: "statCardBlue",  icon: "calendar", iconColor: "var(--cyan)",  trend: "No upcoming payments" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("flexBetween", "mb8")}>
              <div className={cx("statLabel")}>{s.label}</div>
              <Ic n={s.icon} sz={14} c={s.iconColor} />
            </div>
            <div className={cx("statValue", "fontMono", "tabularNums")}>{s.value}</div>
            <div className={cx("fontMono", "text10", "colorMuted2", "mt6")}>{s.trend}</div>
          </div>
        ))}
      </div>

      {/* ── Payment Activity + Upcoming Schedule ─────────────────────────── */}
      <div className={cx("grid2", "mb16")}>

        {/* Payment Activity */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Payment Activity</span>
            <div className={cx("flexRow", "gap10")}>
              {[{ color: "var(--lime)", label: "Paid" }, { color: "var(--amber)", label: "Pending" }, { color: "var(--red)", label: "Overdue" }].map(({ color, label }) => (
                <span key={label} className={cx("flexRow", "gap4")}>
                  <span className={cx("dot7", "inlineBlock")} style={{ "--bg-color": color } as React.CSSProperties} />
                  <span className={cx("fontMono", "text10", "colorMuted2")}>{label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Chart */}
          {monthlyActivity.every(m => m.amountCents === 0) ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="activity" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No payment activity yet</div>
              <div className={cx("emptyStateSub")}>Payment activity data will appear here once payments are recorded.</div>
            </div>
          ) : (
          <div className={cx("relative")}>
            {/* Amount labels row — separate from bar columns to avoid overflow */}
            <div className={cx("flexRow", "gap16", "mb4")}>
              {monthlyActivity.map((m) => {
                const isEmpty = m.amountCents === 0;
                return (
                  <span key={m.label} className={cx("actBarLabel", "fontMono", "dynColor")} style={{ "--color": isEmpty ? "var(--muted2)" : "var(--lime)" } as React.CSSProperties}>
                    {isEmpty ? "—" : formatMoneyCents(m.amountCents, { currency })}
                  </span>
                );
              })}
            </div>

            {/* Bars */}
            <div className={cx("actBarContainer")}>
              {(() => {
                const chartMax = Math.max(...monthlyActivity.map(b => b.amountCents), 1);
                return monthlyActivity.map((m) => {
                  const totalH = (m.amountCents / chartMax) * CHART_H;
                  const isEmpty = totalH === 0;
                  return (
                    <div key={m.label} className={cx("actMonthCol")}>
                      {/* Bar */}
                      <div className={cx("chartContainerBase", "dynBgColor")} style={{ "--bg-color": isEmpty ? "var(--s3)" : "transparent", "--pct": `${CHART_H}px` } as React.CSSProperties}>
                        {!isEmpty && <div className={cx("colBarFill", "dotBgAccent")} style={{ "--pct": `${totalH}px` } as React.CSSProperties} />}
                      </div>
                      {/* Month label */}
                      <span className={cx("fontMono", "text10", "colorMuted2")}>{m.label}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          )}

          {/* Footer summary */}
          {!monthlyActivity.every(m => m.amountCents === 0) && (
          <div className={cx("pt10", "borderT", "flexRow", "justifyBetween")}>
            <span className={cx("text10", "colorMuted2")}>Activity summary</span>
            <span className={cx("fontMono", "fw700", "text10", "colorAccent", "tabularNums")}>
              {formatMoneyCents(monthlyActivity.reduce((s, m) => s + m.amountCents, 0), { currency })} collected
            </span>
          </div>
          )}
        </div>

        {/* Upcoming Schedule */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Upcoming Schedule</span>
            {milestones !== null && milestones.filter(m => !m.paid).length > 0 && (
              <span className={cx("fontMono", "text10", "colorMuted2")}>{formatMoneyCents(milestones.filter(m => !m.paid).reduce((s, m) => s + m.amountCents, 0), { currency })} due</span>
            )}
          </div>

          {milestones === null ? (
            <div className={cx("flexCol", "gap8")}>
              {[1, 2, 3].map(n => <div key={n} className={cx("skeletonRow")} />)}
            </div>
          ) : milestones.filter(m => !m.paid).length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No upcoming payments</div>
              <div className={cx("emptyStateSub")}>Scheduled upcoming payments will appear here.</div>
            </div>
          ) : (
          <div className={cx("flexCol", "gap8")}>
            {milestones.filter(m => !m.paid).map((m) => (
              <div key={m.stage} className={cx("upcomingRowCard", "dynBorderLeft3")} style={{ "--color": "var(--amber)" } as React.CSSProperties}>
                <div className={cx("dot8", "noShrink", "dynBgColor")} style={{ "--bg-color": "var(--amber)" } as React.CSSProperties} />
                <div className={cx("flex1", "minW0")}>
                  <div className={cx("fw600", "text11", "truncate")}>
                    {m.stage === "MILESTONE_30" ? "Milestone Payment (30%)" : m.stage === "FINAL_20" ? "Final Payment (20%)" : m.stage}
                  </div>
                </div>
                <div className={cx("flexColEndRight")}>
                  <span className={cx("fontMono", "fw700", "text11", "tabularNums")}>{formatMoneyCents(m.amountCents, { currency })}</span>
                  <span className={cx("badge", "badgeAmber", "badgeSm2")}>Upcoming</span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* ── Overdue alert ────────────────────────────────────────────────── */}
      {overdueItems.length > 0 && (
        <div className={cx("invOverdueBanner")}>
          <Ic n="alert" sz={16} c="var(--red)" />
          <div className={cx("flex1")}>
            <div className={cx("fs078")}>
              <strong className={cx("fontMono")}>{overdueItems[0].id}</strong>
              <span className={cx("colorMuted")}> — {overdueItems[0].description} · {formatMoneyCents(Math.round(overdueItems[0].amountRaw * 100), { currency })}</span>
            </div>
            <div className={cx("fontMono", "text10", "colorMuted2", "mt2")}>
              Due {overdueItems[0].dueDate} · {overdueItems[0].project}
            </div>
          </div>
          <button
            type="button"
            className={cx("btnSm", "btnPayNow", "dynBgColor")}
            onClick={() => setPayModal({ amount: overdueItems[0].amountRaw, desc: overdueItems[0].description })}
          >
            <Ic n="creditCard" sz={12} c="var(--red)" />
            Pay {formatMoneyCents(Math.round(overdueItems[0].amountRaw * 100), { currency })} Now
          </button>
        </div>
      )}

      {/* ── Tabs + Search ─────────────────────────────────────────────────── */}
      <div className={cx("flexBetween", "gap10", "mb16")}>
        <div className={cx("pillTabs", "gap6", "mb0")}>
          {TABS.map((t) => (
            <button key={t} type="button" className={cx("pillTab", tab === t && "pillTabActive")} onClick={() => { setTab(t); setSearch(""); }}>
              {t}
            </button>
          ))}
        </div>
        <div className={cx("relative", "minW200", "maxW260")}>
          <span className={cx("searchIconWrap")}>
            <Ic n="filter" sz={13} c="var(--muted2)" />
          </span>
          <input
            className={cx("input", "searchInput")}
            placeholder="Filter by description, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Transaction list ─────────────────────────────────────────────── */}
      <div className={cx("card", "overflowHidden")}>

        {filtered.length > 0 && (
          <div className={cx("tableHeadGrid6col")}>
            {["", "Description", "Date", "Amount", "Status", ""].map((h, i) => (
              <span key={i} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{h}</span>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="creditCard" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No payments found</div>
            <div className={cx("emptyStateSub")}>
              {search ? `No results for "${search}"` : `No ${tab === "All" ? "" : tab.toLowerCase() + " "}payments found.`}
            </div>
            {search && (
              <button type="button" className={cx("btnSm", "btnGhost", "mt12")} onClick={() => setSearch("")}>
                Clear filter
              </button>
            )}
          </div>
        ) : (
          filtered.map((p, idx) => {
            const isOpen      = expanded === p.id;
            const catCfg      = CAT[p.category];
            const statusColor = STATUS_COLOR[p.status];
            return (
              <div
                key={p.id}
                className={cx("dynBorderLeft3", idx < filtered.length - 1 && "borderB")}
                style={{ "--color": statusColor, "--delay": `${idx * 0.04}s` } as React.CSSProperties}
              >
                {/* Row trigger */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className={cx("gridRowBtn6col")}
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                >
                  {/* Category icon box */}
                  <div className={cx("pmIconBox36", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${catCfg.color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${catCfg.color} 25%, transparent)` } as React.CSSProperties}>
                    <Ic n={catCfg.icon} sz={15} c={catCfg.color} />
                  </div>

                  {/* Description + ID */}
                  <div className={cx("minW0")}>
                    <div className={cx("fw600", "text12", "truncate")}>{p.description}</div>
                    <div className={cx("flexRow", "flexCenter", "gap6", "mt2")}>
                      <span className={cx("fontMono", "text10", "colorAccent")}>{p.id}</span>
                      <span className={cx("fontMono", "text10", "pmCatBadge", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${catCfg.color} 10%, var(--s3))`, "--color": catCfg.color } as React.CSSProperties}>
                        {p.category}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <span className={cx("fontMono", "text10", "colorMuted2")}>
                    {p.status === "Paid" ? p.date : p.dueDate}
                  </span>

                  {/* Amount */}
                  <span className={cx("fontMono", "fw700", "text12", "textRight", "tabularNums")}>{formatMoneyCents(Math.round(p.amountRaw * 100), { currency })}</span>

                  {/* Status badge */}
                  <span className={cx("badge", statusBadge(p.status))}>{p.status}</span>

                  {/* Chevron */}
                  <span className={`pay-chevron${isOpen ? " pay-chevron-open" : ""}`}>
                    <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                  </span>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className={cx("payRowExpanded", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${statusColor} 4%, var(--s2))` } as React.CSSProperties}>
                    <div className={cx("payRowGrid")}>

                      {/* Left: Payment details */}
                      <div className={cx("panelL")}>
                        <div className={cx("grid2Cols", "gap8", "mb12")}>
                          {[
                            { label: "Invoice Ref", value: p.invoiceRef },
                            { label: "Project",     value: p.project    },
                            { label: "Method",      value: p.method ?? "—"  },
                            { label: "Category",    value: p.category   },
                          ].map(({ label, value }) => (
                            <div key={label} className={cx("infoChip")}>
                              <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb3")}>{label}</div>
                              <div className={cx("fw700", "text11")}>{value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Receipt / overdue info */}
                        {p.receiptNum && (
                          <div className={cx("pmDetailReceiptRow")}>
                            <Ic n="check" sz={13} c="var(--lime)" sw={2.5} />
                            <span className={cx("text11")}>Paid in full ·</span>
                            <span className={cx("fontMono", "text11", "fw700", "colorAccent")}>{p.receiptNum}</span>
                            <button type="button" className={cx("btnSm", "btnGhost", "mlAuto", "flexRow", "gap4", "colorInherit")}>
                              <Ic n="download" sz={11} /> Receipt
                            </button>
                          </div>
                        )}
                        {p.status === "Overdue" && (
                          <div className={cx("pmDetailReceiptRow", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, var(--red) 6%, var(--s1))", "--color": "color-mix(in oklab, var(--red) 18%, transparent)" } as React.CSSProperties}>
                            <Ic n="alert" sz={13} c="var(--red)" />
                            <span className={cx("text11")}>Overdue ·</span>
                            <span className={cx("fontMono", "text11", "fw700", "colorRed")}>Due {p.dueDate}</span>
                          </div>
                        )}

                        {p.note && (
                          <div className={cx("cardS3", "p8x10", "mt8")}>
                            <p className={cx("text10", "colorMuted", "m0", "lineH16")}>{p.note}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Contact + actions */}
                      <div className={cx("p14x20", "flexCol", "gap10")}>
                        <div className={cx("infoChip")}>
                          <Av initials={p.contactInitials} size={32} />
                          <div className={cx("minW0")}>
                            <div className={cx("fw700", "text11", "truncate")}>{p.contact}</div>
                            <div className={cx("fontMono", "text10", "colorMuted2")}>{p.project}</div>
                          </div>
                        </div>

                        <div className={cx("flexCol", "gap5")}>
                          {[
                            { label: "Due",    value: p.dueDate, icon: "calendar" },
                            ...(p.status === "Paid" ? [{ label: "Paid", value: p.date, icon: "check" }] : []),
                          ].map(({ label, value, icon }) => (
                            <div key={label} className={cx("flexBetween")}>
                              <div className={cx("flexRow", "gap5")}>
                                <Ic n={icon} sz={11} c="var(--muted2)" />
                                <span className={cx("text10", "colorMuted2")}>{label}</span>
                              </div>
                              <span className={cx("fontMono", "text10", "fw600")}>{value}</span>
                            </div>
                          ))}
                        </div>

                        <div className={cx("flexCol", "gap6", "mtAuto")}>
                          {p.status !== "Paid" && (
                            <button
                              type="button"
                              className={cx("btnSm", "btnAccent", "wFull", "flexRow", "flexCenter", "justifyCenter", "gap5")}
                              onClick={() => setPayModal({ amount: p.amountRaw, desc: p.description })}
                            >
                              <Ic n="creditCard" sz={12} /> Pay {formatMoneyCents(Math.round(p.amountRaw * 100), { currency })} Now
                            </button>
                          )}
                          {p.status === "Paid" && (
                            <div className={cx("pmPaidFullBadge")}>
                              <Ic n="check" sz={12} c="var(--lime)" sw={2.5} />
                              <span className={cx("fontMono", "text10", "fw700", "colorAccent")}>Paid in Full</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Pay Modal ─────────────────────────────────────────────────────── */}
      {payModal && (
        <PayModal
          amount={payModal.amount}
          desc={payModal.desc}
          method={selectedMethod}
          onClose={() => setPayModal(null)}
        />
      )}

    </div>
  );
}
