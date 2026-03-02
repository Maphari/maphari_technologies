"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";

type PaymentTab = "Payment Schedule" | "Pay Now" | "Receipts";
type PaymentMethod = "eft" | "card" | "payfast";

type Instalment = {
  num: string;
  name: string;
  amount: number;
  due: string;
  paid: boolean;
  isNext?: boolean;
};

type Receipt = {
  icon: string;
  name: string;
  amount: number;
  date: string;
  ref: string;
};

const TABS: PaymentTab[] = ["Payment Schedule", "Pay Now", "Receipts"];

const INSTALMENTS: Instalment[] = [
  { num: "01", name: "Deposit (50%)", amount: 46000, due: "Due on signing", paid: true },
  { num: "02", name: "Design Completion (25%)", amount: 23000, due: "Due approx. Feb 28, 2026", paid: false, isNext: true },
  { num: "03", name: "Launch (25%)", amount: 23000, due: "Due approx. Mar 28, 2026", paid: false },
];

const BASE_RECEIPTS: Receipt[] = [
  {
    icon: "💳",
    name: "Payment - Deposit (50%)",
    amount: 46000,
    date: "Jan 10, 2026",
    ref: "TXN-2026-001",
  },
];

function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA")}`;
}

export function BillingPage() {
  const [tab, setTab] = useState<PaymentTab>("Payment Schedule");
  const [method, setMethod] = useState<PaymentMethod>("eft");
  const [payModal, setPayModal] = useState(false);
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);
  const [payment2Confirmed, setPayment2Confirmed] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const total = useMemo(() => INSTALMENTS.reduce((sum, item) => sum + item.amount, 0), []);
  const paid = payment2Confirmed ? 69000 : 46000;
  const outstanding = total - paid;

  const receipts = useMemo(() => {
    if (!payment2Confirmed) return BASE_RECEIPTS;
    return [
      ...BASE_RECEIPTS,
      {
        icon: "💳",
        name: "Payment - Design Completion (25%)",
        amount: 23000,
        date: "Mar 2, 2026",
        ref: "TXN-2026-002",
      },
    ];
  }, [payment2Confirmed]);

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  function confirmPayment(): void {
    setPayModal(false);
    setPayment2Confirmed(true);
    notify("Payment confirmed", "We will verify and send your receipt within 2 hours");
    setTab("Receipts");
  }

  return (
    <div className={cx("pageBody", styles.depositPayRoot)}>
      <div className={styles.depositPayLayout}>
        <aside className={styles.depositPaySidebar}>
          <div className={styles.depositPaySection}>Payments</div>
          {TABS.map((item, idx) => (
            <button
              key={item}
              type="button"
              className={cx(styles.depositPaySideItem, tab === item && styles.depositPaySideItemActive)}
              onClick={() => setTab(item)}
            >
              <span
                className={styles.depositPayDot}
                style={{ background: idx === 0 ? "var(--accent)" : idx === 1 ? "var(--green)" : "var(--purple)" }}
              />
              <span>{item}</span>
            </button>
          ))}

          <div className={styles.depositPayDivider} />

          <div className={styles.depositPaySummaryCard}>
            <div className={styles.depositPaySummaryTitle}>Payment Summary</div>
            <div className={styles.depositPaySummaryRow}>Paid: <strong className={styles.depositPaySummaryGood}>{formatCurrency(paid)}</strong></div>
            <div className={styles.depositPaySummaryRow}>Outstanding: <strong className={styles.depositPaySummaryWarn}>{formatCurrency(outstanding)}</strong></div>
            <div className={styles.depositPaySummaryRow}>Total: <strong className={styles.depositPaySummaryTotal}>{formatCurrency(total)}</strong></div>
          </div>
        </aside>

        <section className={styles.depositPayMain}>
          <div className={cx("pageHeader", "mb0")}>
            <div>
              <div className={cx("pageEyebrow")}>Veldt Finance · Payments</div>
              <h1 className={cx("pageTitle")}>Deposit &amp; Payments</h1>
              <p className={cx("pageSub")}>Your payment schedule, instalments, and receipts in one place.</p>
            </div>
            <div className={cx("pageActions")}>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => notify("Downloaded", "Payment schedule PDF saved")}
              >
                Schedule PDF
              </button>
            </div>
          </div>

          <div className={styles.depositPayTabs}>
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                className={cx(styles.depositPayTab, tab === item && styles.depositPayTabActive)}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === "Payment Schedule" ? (
            <div className={styles.depositPayContent}>
              <div className={styles.depositPayStepRow}>
                {INSTALMENTS.map((instalment) => {
                  const done = instalment.paid || (payment2Confirmed && instalment.num === "02");
                  const next = !done && instalment.isNext;
                  return (
                    <div
                      key={instalment.num}
                      className={cx(
                        styles.depositPayStepItem,
                        done && styles.depositPayStepDone,
                        next && styles.depositPayStepNext,
                      )}
                    >
                      <div className={styles.depositPayStepNum}>Payment {instalment.num}</div>
                      <div className={styles.depositPayStepName}>
                        {instalment.name}
                        {done ? " ✓" : ""}
                      </div>
                      <div className={styles.depositPayStepAmount}>{formatCurrency(instalment.amount)}</div>
                      <div className={styles.depositPayStepDue}>
                        {instalment.num === "01"
                          ? "Paid Jan 10"
                          : done
                            ? "Marked paid"
                            : next
                              ? "Due soon"
                              : instalment.due}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.depositPaySectionTitle}>Details</div>
              <div className={cx("card", styles.depositPayCardPadZero)}>
                {[
                  ["Total Project Value", formatCurrency(total)],
                  ["Total Paid", formatCurrency(paid)],
                  ["Balance Outstanding", formatCurrency(outstanding)],
                  ["Next Payment", payment2Confirmed ? `${formatCurrency(23000)} - Launch` : `${formatCurrency(23000)} - Design Completion`],
                  ["Expected Due Date", payment2Confirmed ? "Approx. Mar 28, 2026" : "Approx. Feb 28, 2026"],
                  ["Payment Method", method === "eft" ? "EFT to Maphari Studio" : method === "card" ? "Card via secure gateway" : "PayFast"],
                ].map(([label, value]) => (
                  <div key={label} className={styles.depositPayDetailRow}>
                    <div className={styles.depositPayDetailLabel}>{label}</div>
                    <div className={styles.depositPayDetailValue}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "Pay Now" ? (
            <div className={styles.depositPayContent}>
              <div className={styles.depositPayHeroCard}>
                <div className={styles.depositPayHeroEyebrow}>Next Payment Due</div>
                <div className={styles.depositPayHeroAmount}>{formatCurrency(payment2Confirmed ? 23000 : 23000)}</div>
                <div className={styles.depositPayHeroDesc}>
                  {payment2Confirmed
                    ? "Launch - Invoice #003 · Due approx. Mar 28"
                    : "Design Completion - Invoice #002 · Due approx. Feb 28"}
                </div>

                <div className={styles.depositPayMethodLabel}>Choose payment method</div>
                <div className={styles.depositPayMethods}>
                  {[
                    { key: "eft", label: "EFT / Bank Transfer" },
                    { key: "card", label: "Credit / Debit Card" },
                    { key: "payfast", label: "PayFast" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={cx(styles.depositPayMethodBtn, method === item.key && styles.depositPayMethodBtnActive)}
                      onClick={() => setMethod(item.key as PaymentMethod)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {method === "eft" ? (
                  <div className={styles.depositPayBankCard}>
                    <div className={styles.depositPayBankTitle}>Banking Details</div>
                    {[
                      ["Bank", "FNB"],
                      ["Account Name", "Maphari Studio (Pty) Ltd"],
                      ["Account Number", "62834719230"],
                      ["Branch Code", "250655"],
                      ["Reference", "VELDT-2026"],
                    ].map(([label, value]) => (
                      <div key={label} className={styles.depositPayBankRow}>
                        <span className={styles.depositPayBankLabel}>{label}</span>
                        <strong className={styles.depositPayBankValue}>{value}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}

                <button type="button" className={cx("btnSm", "btnAccent", styles.depositPayPayBtn)} onClick={() => setPayModal(true)}>
                  {method === "eft" ? "I've Made the Payment" : `Pay ${formatCurrency(23000)} Now`}
                </button>
              </div>
            </div>
          ) : null}

          {tab === "Receipts" ? (
            <div className={styles.depositPayContent}>
              <div className={styles.depositPaySectionTitle}>Payment Receipts</div>
              <div className={cx("card", styles.depositPayCardPadZero)}>
                {receipts.map((receipt) => (
                  <div key={receipt.ref} className={styles.depositPayReceiptRow}>
                    <span className={styles.depositPayReceiptIcon}>{receipt.icon}</span>
                    <div className={styles.depositPayGrow}>
                      <div className={styles.depositPayReceiptName}>{receipt.name}</div>
                      <div className={styles.depositPayReceiptMeta}>{receipt.date} · Ref: {receipt.ref}</div>
                    </div>
                    <div className={styles.depositPayReceiptAmount}>{formatCurrency(receipt.amount)}</div>
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost")}
                      onClick={() => notify("Downloaded", "Receipt saved")}
                    >
                      Download
                    </button>
                  </div>
                ))}

                <div className={styles.depositPayReceiptHint}>
                  {payment2Confirmed
                    ? "Receipt for final launch payment will appear here once paid."
                    : "Payment 2 receipt will appear here once payment is confirmed."}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {payModal ? (
        <div className={styles.depositPayModalBackdrop} onClick={() => setPayModal(false)}>
          <div className={styles.depositPayModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.depositPayModalHead}>
              <span className={styles.depositPayModalTitle}>Confirm Payment</span>
              <button type="button" className={styles.depositPayModalClose} onClick={() => setPayModal(false)} aria-label="Close dialog">x</button>
            </div>
            <div className={styles.depositPayModalBody}>
              <div className={styles.depositPayModalInfo}>
                Please confirm you transferred <strong>{formatCurrency(23000)}</strong> to Maphari Studio using reference <strong>VELDT-2026</strong>. We will verify and send your receipt within 2 business hours.
              </div>
            </div>
            <div className={styles.depositPayModalFoot}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setPayModal(false)}>Cancel</button>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={confirmPayment}>Confirm Payment</button>
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
