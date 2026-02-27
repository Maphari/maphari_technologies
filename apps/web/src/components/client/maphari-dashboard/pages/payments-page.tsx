"use client";
import { useState, useMemo } from "react";
import { cx, styles } from "../style";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────────── */
type CardBrand = "Visa" | "Mastercard" | "Amex";

type SavedCard = {
  id: string;
  brand: CardBrand;
  last4: string;
  expiry: string;
  isDefault: boolean;
  holderName: string;
};

type PaymentHistoryItem = {
  id: string;
  date: string;
  amount: number;
  method: string;
  invoiceNumber: string;
  status: "completed" | "pending" | "failed";
};

type PayTab = "Methods" | "History" | "Auto-Pay";

type AutoPaySettings = {
  enabled: boolean;
  threshold: number;
  maxMonthly: number;
  defaultCardId: string;
};

/* ─────────────────────────────────────────────────────────────────────────────
   Seed data
   ───────────────────────────────────────────────────────────────────────────── */
const INITIAL_CARDS: SavedCard[] = [
  { id: "card-1", brand: "Visa", last4: "4242", expiry: "09/28", isDefault: true, holderName: "Naledi Dlamini" },
  { id: "card-2", brand: "Mastercard", last4: "8819", expiry: "03/27", isDefault: false, holderName: "Naledi Dlamini" },
  { id: "card-3", brand: "Amex", last4: "3701", expiry: "12/26", isDefault: false, holderName: "Dlamini Holdings (Pty) Ltd" },
];

const INITIAL_HISTORY: PaymentHistoryItem[] = [
  { id: "pay-001", date: "2026-02-25", amount: 22000, method: "Visa •••• 4242", invoiceNumber: "INV-2026-008", status: "completed" },
  { id: "pay-002", date: "2026-02-20", amount: 11000, method: "Visa •••• 4242", invoiceNumber: "INV-2026-007", status: "completed" },
  { id: "pay-003", date: "2026-02-18", amount: 16000, method: "Mastercard •••• 8819", invoiceNumber: "INV-2026-011", status: "pending" },
  { id: "pay-004", date: "2026-02-15", amount: 8500, method: "Visa •••• 4242", invoiceNumber: "INV-2026-009", status: "completed" },
  { id: "pay-005", date: "2026-02-10", amount: 5500, method: "EFT", invoiceNumber: "INV-2026-006", status: "failed" },
  { id: "pay-006", date: "2026-01-28", amount: 18000, method: "Visa •••• 4242", invoiceNumber: "INV-2025-042", status: "completed" },
  { id: "pay-007", date: "2026-01-15", amount: 9200, method: "Amex •••• 3701", invoiceNumber: "INV-2025-039", status: "completed" },
  { id: "pay-008", date: "2026-01-05", amount: 14000, method: "Visa •••• 4242", invoiceNumber: "INV-2025-037", status: "completed" },
  { id: "pay-009", date: "2025-12-20", amount: 6800, method: "Mastercard •••• 8819", invoiceNumber: "INV-2025-034", status: "completed" },
  { id: "pay-010", date: "2025-12-10", amount: 32000, method: "EFT", invoiceNumber: "INV-2025-031", status: "completed" },
];

const STATUS_BADGE: Record<PaymentHistoryItem["status"], string> = {
  completed: styles.badgeGreen,
  pending: styles.badgeAmber,
  failed: styles.badgeRed,
};

const BRAND_ICON: Record<CardBrand, string> = {
  Visa: "\uD83D\uDCB3",
  Mastercard: "\uD83D\uDC8E",
  Amex: "\uD83D\uDCB3",
};

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────────────────── */
function fmtMoney(v: number): string {
  return `R ${v.toLocaleString("en-ZA")}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─────────────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────────────── */
export function ClientPaymentsPage({ active }: { active: boolean }) {
  /* ── State ────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<PayTab>("Methods");
  const [cards, setCards] = useState<SavedCard[]>(INITIAL_CARDS);
  const [history] = useState<PaymentHistoryItem[]>(INITIAL_HISTORY);
  const [historySearch, setHistorySearch] = useState("");
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);

  // Add-card form
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardCvv, setNewCardCvv] = useState("");
  const [newCardName, setNewCardName] = useState("");

  // Auto-pay
  const [autoPay, setAutoPay] = useState<AutoPaySettings>({
    enabled: false,
    threshold: 25000,
    maxMonthly: 80000,
    defaultCardId: "card-1",
  });

  /* ── Derived ──────────────────────────────────────────── */
  const totalPaid = useMemo(
    () => history.filter((h) => h.status === "completed").reduce((a, h) => a + h.amount, 0),
    [history],
  );

  const thisMonthPaid = useMemo(() => {
    const now = new Date();
    return history
      .filter((h) => h.status === "completed" && new Date(h.date).getMonth() === now.getMonth() && new Date(h.date).getFullYear() === now.getFullYear())
      .reduce((a, h) => a + h.amount, 0);
  }, [history]);

  const pendingCount = useMemo(
    () => history.filter((h) => h.status === "pending").length,
    [history],
  );

  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase();
    if (!q) return history;
    return history.filter(
      (h) =>
        h.invoiceNumber.toLowerCase().includes(q) ||
        h.method.toLowerCase().includes(q) ||
        h.date.includes(q),
    );
  }, [history, historySearch]);

  /* ── Actions ──────────────────────────────────────────── */
  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3500);
  };

  const handleSetDefault = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) => ({ ...c, isDefault: c.id === cardId })),
    );
    const card = cards.find((c) => c.id === cardId);
    showToast("Default card updated", `${card?.brand} •••• ${card?.last4} is now your default`);
  };

  const handleRemoveCard = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (card?.isDefault) {
      showToast("Cannot remove default", "Set another card as default first");
      return;
    }
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    showToast("Card removed", `${card?.brand} •••• ${card?.last4} has been removed`);
  };

  const handleAddCard = () => {
    if (!newCardNumber || !newCardExpiry || !newCardCvv || !newCardName) {
      showToast("Missing fields", "Please fill all card details");
      return;
    }
    const last4 = newCardNumber.replace(/\s/g, "").slice(-4);
    const newCard: SavedCard = {
      id: `card-${Date.now()}`,
      brand: "Visa",
      last4,
      expiry: newCardExpiry,
      isDefault: false,
      holderName: newCardName,
    };
    setCards((prev) => [...prev, newCard]);
    setNewCardNumber("");
    setNewCardExpiry("");
    setNewCardCvv("");
    setNewCardName("");
    showToast("Card added", `Visa •••• ${last4} saved successfully`);
  };

  const handleSaveAutoPay = () => {
    showToast("Auto-Pay saved", autoPay.enabled ? `Threshold R ${autoPay.threshold.toLocaleString()}` : "Auto-Pay disabled");
  };

  /* ── Stat cards ───────────────────────────────────────── */
  const statCards = [
    { lbl: "Total Paid", val: fmtMoney(totalPaid), sub: `${history.filter((h) => h.status === "completed").length} transactions`, bar: styles.statBarAccent },
    { lbl: "This Month", val: fmtMoney(thisMonthPaid), sub: "February 2026", bar: styles.statBarGreen },
    { lbl: "Pending", val: String(pendingCount), sub: pendingCount === 1 ? "1 payment awaiting" : `${pendingCount} payments awaiting`, bar: styles.statBarAmber },
    { lbl: "Auto-Pay", val: autoPay.enabled ? "Active" : "Inactive", sub: autoPay.enabled ? `Up to ${fmtMoney(autoPay.threshold)}` : "Not configured", bar: styles.statBarAccent },
  ];

  /* ── Render ───────────────────────────────────────────── */
  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-payments">
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Finance</div>
          <div className={styles.pageTitle}>Payment Portal</div>
          <div className={styles.pageSub}>
            Manage your payment methods, view transaction history, and configure automatic payments.
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statGrid}>
        {statCards.map((s, i) => (
          <div key={s.lbl} className={styles.statCard} style={{ "--i": i } as React.CSSProperties}>
            <div className={cx(styles.statBar, s.bar)} />
            <div className={styles.statLabel}>{s.lbl}</div>
            <div className={styles.statValue}>{s.val}</div>
            <div className={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className={styles.filterBar}>
        {(["Methods", "History", "Auto-Pay"] as const).map((t) => (
          <button
            key={t}
            className={cx(styles.filterTab, activeTab === t && styles.filterTabActive)}
            onClick={() => setActiveTab(t)}
            type="button"
          >
            {t}
          </button>
        ))}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* ── Methods tab ──────────────────────────────────── */}
        {activeTab === "Methods" ? (
          <div style={{ padding: "24px 32px 40px" }}>
            <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>Saved Payment Methods</div>

            <div className={styles.methodCards} style={{ flexDirection: "column" }}>
              {cards.map((card, i) => (
                <div
                  key={card.id}
                  className={cx(styles.methodCard, card.isDefault && styles.methodCardActive)}
                  style={{
                    "--i": i,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 20px",
                    cursor: "default",
                    flex: "none",
                    width: "100%",
                  } as React.CSSProperties}
                >
                  {/* Brand icon */}
                  <div className={styles.cardBrandIcon}>{BRAND_ICON[card.brand]}</div>

                  {/* Card details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: ".78rem", fontWeight: 700 }}>{card.brand}</span>
                      {card.isDefault ? (
                        <span className={cx(styles.badge, styles.badgeAccent)}>Default</span>
                      ) : null}
                    </div>
                    <div className={styles.cardNumber}>
                      {"\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 "}{card.last4}
                    </div>
                    <div className={styles.cardMeta}>
                      <div>
                        <div className={styles.cardMetaLabel}>Expires</div>
                        <div className={styles.cardMetaValue}>{card.expiry}</div>
                      </div>
                      <div>
                        <div className={styles.cardMetaLabel}>Holder</div>
                        <div className={styles.cardMetaValue}>{card.holderName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {!card.isDefault ? (
                      <button
                        className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}
                        type="button"
                        onClick={() => handleSetDefault(card.id)}
                      >
                        Set Default
                      </button>
                    ) : null}
                    <button
                      className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}
                      style={{ color: "var(--red)", borderColor: "rgba(255,95,95,.3)" }}
                      type="button"
                      onClick={() => handleRemoveCard(card.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Payment Method */}
            <div className={styles.sectionTitle} style={{ marginTop: 32, marginBottom: 14 }}>
              Add Payment Method
            </div>
            <div className={styles.card} style={{ padding: "20px 24px" }}>
              <div className={styles.formGrid}>
                <div>
                  <label className={styles.formLabel}>Card Number</label>
                  <input
                    className={styles.formInput}
                    placeholder="1234 5678 9012 3456"
                    value={newCardNumber}
                    onChange={(e) => setNewCardNumber(e.target.value)}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className={styles.formLabel}>Expiry</label>
                    <input
                      className={styles.formInput}
                      placeholder="MM/YY"
                      value={newCardExpiry}
                      onChange={(e) => setNewCardExpiry(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabel}>CVV</label>
                    <input
                      className={styles.formInput}
                      placeholder="123"
                      type="password"
                      value={newCardCvv}
                      onChange={(e) => setNewCardCvv(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className={styles.formLabel}>Cardholder Name</label>
                  <input
                    className={styles.formInput}
                    placeholder="Full name as it appears on card"
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ marginTop: 18 }}>
                <button
                  className={cx(styles.button, styles.buttonAccent)}
                  type="button"
                  onClick={handleAddCard}
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── History tab ──────────────────────────────────── */}
        {activeTab === "History" ? (
          <div style={{ padding: "24px 32px 40px" }}>
            {/* Search */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  padding: "9px 14px",
                  maxWidth: 340,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="var(--muted)" strokeWidth="1.5" />
                  <path d="M11 11l3 3" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text)",
                    fontSize: ".72rem",
                    width: "100%",
                    outline: "none",
                  }}
                  placeholder="Search by invoice, method, or date..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Invoice #</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((h) => (
                    <tr key={h.id}>
                      <td style={{ fontSize: ".72rem" }}>{fmtDate(h.date)}</td>
                      <td style={{ fontSize: ".82rem", fontWeight: 600 }}>{fmtMoney(h.amount)}</td>
                      <td style={{ fontSize: ".72rem" }}>{h.method}</td>
                      <td>
                        <span style={{ fontSize: ".72rem", color: "var(--accent)", fontWeight: 500 }}>
                          {h.invoiceNumber}
                        </span>
                      </td>
                      <td>
                        <span className={cx(styles.badge, STATUS_BADGE[h.status])}>
                          {h.status}
                        </span>
                      </td>
                      <td>
                        {h.status === "completed" ? (
                          <button
                            className={styles.receiptLink}
                            type="button"
                            onClick={() => showToast("Receipt downloaded", `${h.invoiceNumber} PDF generated`)}
                          >
                            Download
                          </button>
                        ) : h.status === "failed" ? (
                          <span style={{ fontSize: ".64rem", color: "var(--muted2)" }}>--</span>
                        ) : (
                          <span style={{ fontSize: ".64rem", color: "var(--muted2)" }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredHistory.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 0",
                    color: "var(--muted2)",
                    fontSize: ".72rem",
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                  }}
                >
                  No transactions match your search
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* ── Auto-Pay tab ─────────────────────────────────── */}
        {activeTab === "Auto-Pay" ? (
          <div style={{ padding: "24px 32px 40px" }}>
            {/* Enable toggle */}
            <div className={styles.autoPayCard} style={{ marginBottom: 20 }}>
              <div className={styles.autoPayRow}>
                <div>
                  <div className={styles.autoPayLabel}>Enable Auto-Pay</div>
                  <div className={styles.autoPayDesc}>
                    Automatically pay invoices when they are approved
                  </div>
                </div>
                <button
                  className={cx(styles.toggle, autoPay.enabled && styles.toggleOn)}
                  type="button"
                  onClick={() => setAutoPay((prev) => ({ ...prev, enabled: !prev.enabled }))}
                >
                  <div className={styles.toggleKnob} />
                </button>
              </div>
            </div>

            {/* Settings (visible when enabled) */}
            {autoPay.enabled ? (
              <div className={styles.autoPayCard} style={{ marginBottom: 20 }}>
                <div className={styles.sectionTitle} style={{ marginBottom: 16 }}>Auto-Pay Settings</div>

                <div className={styles.autoPayRow}>
                  <div style={{ flex: 1 }}>
                    <div className={styles.autoPayLabel}>Payment Threshold</div>
                    <div className={styles.autoPayDesc}>
                      Auto-pay invoices under this amount
                    </div>
                  </div>
                  <div style={{ width: 160 }}>
                    <input
                      className={styles.formInput}
                      type="number"
                      value={autoPay.threshold}
                      onChange={(e) =>
                        setAutoPay((prev) => ({
                          ...prev,
                          threshold: Number(e.target.value) || 0,
                        }))
                      }
                      style={{ textAlign: "right" }}
                    />
                  </div>
                </div>

                <div className={styles.autoPayRow}>
                  <div style={{ flex: 1 }}>
                    <div className={styles.autoPayLabel}>Max Monthly Limit</div>
                    <div className={styles.autoPayDesc}>
                      Total auto-pay cap per calendar month
                    </div>
                  </div>
                  <div style={{ width: 160 }}>
                    <input
                      className={styles.formInput}
                      type="number"
                      value={autoPay.maxMonthly}
                      onChange={(e) =>
                        setAutoPay((prev) => ({
                          ...prev,
                          maxMonthly: Number(e.target.value) || 0,
                        }))
                      }
                      style={{ textAlign: "right" }}
                    />
                  </div>
                </div>

                <div className={styles.autoPayRow}>
                  <div style={{ flex: 1 }}>
                    <div className={styles.autoPayLabel}>Default Payment Method</div>
                    <div className={styles.autoPayDesc}>
                      Card used for automatic payments
                    </div>
                  </div>
                  <div style={{ width: 200 }}>
                    <select
                      className={styles.formSelect}
                      value={autoPay.defaultCardId}
                      onChange={(e) =>
                        setAutoPay((prev) => ({
                          ...prev,
                          defaultCardId: e.target.value,
                        }))
                      }
                    >
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.brand} •••• {c.last4}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Summary card */}
            <div className={styles.autoPayCard} style={{ marginBottom: 24 }}>
              <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>Current Configuration</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <div className={styles.cardMetaLabel}>Status</div>
                  <div
                    style={{
                      fontSize: ".82rem",
                      fontWeight: 700,
                      color: autoPay.enabled ? "var(--green)" : "var(--muted)",
                      marginTop: 4,
                    }}
                  >
                    {autoPay.enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <div>
                  <div className={styles.cardMetaLabel}>Threshold</div>
                  <div style={{ fontSize: ".82rem", fontWeight: 700, marginTop: 4 }}>
                    {autoPay.enabled ? fmtMoney(autoPay.threshold) : "--"}
                  </div>
                </div>
                <div>
                  <div className={styles.cardMetaLabel}>Monthly Limit</div>
                  <div style={{ fontSize: ".82rem", fontWeight: 700, marginTop: 4 }}>
                    {autoPay.enabled ? fmtMoney(autoPay.maxMonthly) : "--"}
                  </div>
                </div>
              </div>
              {autoPay.enabled ? (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--b1)" }}>
                  <div className={styles.cardMetaLabel}>Payment Method</div>
                  <div style={{ fontSize: ".78rem", fontWeight: 600, marginTop: 4 }}>
                    {(() => {
                      const c = cards.find((card) => card.id === autoPay.defaultCardId);
                      return c ? `${c.brand} •••• ${c.last4} (${c.holderName})` : "No card selected";
                    })()}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Save button */}
            <button
              className={cx(styles.button, styles.buttonAccent)}
              type="button"
              onClick={handleSaveAutoPay}
            >
              Save Settings
            </button>
          </div>
        ) : null}
      </div>

      {/* ── Toast ─────────────────────────────────────────── */}
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
              fontSize: ".7rem",
              fontWeight: 700,
              flexShrink: 0,
              borderRadius: "50%",
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontSize: ".76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: ".6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
