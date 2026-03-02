"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";

const services = [
  { id: 1, name: "Brand Identity System", category: "Branding", cost: 8000, price: 22000, hours: 60, margin: 63.6 },
  { id: 2, name: "UX/UI Design (per screen)", category: "Product Design", cost: 800, price: 2400, hours: 6, margin: 66.7 },
  { id: 3, name: "Website Design & Dev", category: "Digital", cost: 15000, price: 42000, hours: 140, margin: 64.3 },
  { id: 4, name: "Monthly Retainer - Core", category: "Retainer", cost: 12000, price: 28000, hours: 80, margin: 57.1 },
  { id: 5, name: "Monthly Retainer - Growth", category: "Retainer", cost: 18000, price: 45000, hours: 130, margin: 60.0 },
  { id: 6, name: "Monthly Retainer - Enterprise", category: "Retainer", cost: 26000, price: 72000, hours: 200, margin: 63.9 },
  { id: 7, name: "Social Media Management", category: "Content", cost: 5000, price: 12000, hours: 40, margin: 58.3 },
  { id: 8, name: "Content Strategy Workshop", category: "Strategy", cost: 2000, price: 6500, hours: 16, margin: 69.2 },
  { id: 9, name: "Photography Day Rate", category: "Production", cost: 1200, price: 3800, hours: 8, margin: 68.4 }
] as const;

const retainerTiers = [
  { name: "Core", hours: 80, price: 28000, features: ["Brand updates", "Copywriting", "Social content", "Monthly report"] },
  { name: "Growth", hours: 130, price: 45000, features: ["Core +", "UX/UI design", "Ad creatives", "Strategy sessions"] },
  { name: "Enterprise", hours: 200, price: 72000, features: ["Growth +", "Full campaign management", "Dev support", "Priority AM"] }
] as const;

const quoteItems = [
  { service: "Brand Identity System", qty: 1, price: 22000 },
  { service: "Website Design & Dev", qty: 1, price: 42000 },
  { service: "Photography Day Rate", qty: 2, price: 3800 }
] as const;

const pendingDiscounts = [
  { client: "Dune Collective", item: "Monthly Retainer - Growth", discount: 15, reason: "Long-term client loyalty", requestedBy: "Nomsa Dlamini", status: "pending" },
  { client: "Mira Health", item: "Website Design & Dev", discount: 10, reason: "Project scope reduction", requestedBy: "Renzo Fabbri", status: "pending" }
] as const;

const tabs = ["service catalog", "quote builder", "retainer tiers", "discount approvals"] as const;

const categories = [...new Set(services.map((s) => s.category))];

function MarginBadge({ margin }: { margin: number }) {
  return <span className={cx(styles.pricMarginBadge, margin >= 65 ? "colorAccent" : margin >= 55 ? "colorAmber" : "colorRed")}>{margin.toFixed(1)}%</span>;
}

export function PricingPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("service catalog");
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [quoteClient, setQuoteClient] = useState("Volta Studios");
  const [discount, setDiscount] = useState(0);

  const filtered = selectedCat === "All" ? services : services.filter((s) => s.category === selectedCat);

  const quoteSubtotal = quoteItems.reduce((s, i) => s + i.price * i.qty, 0);
  const quoteDiscount = quoteSubtotal * (discount / 100);
  const quoteTotal = quoteSubtotal - quoteDiscount;
  const quoteVAT = quoteTotal * 0.15;
  const quoteFinal = quoteTotal + quoteVAT;

  return (
    <div className={cx(styles.pageBody, styles.pricRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / PRICING &amp; QUOTE ENGINE</div>
          <h1 className={styles.pageTitle}>Pricing Control</h1>
          <div className={styles.pageSub}>Service catalog - Quote builder - Discount approvals</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Pricelist</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ New Service</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Avg Project Margin", value: "64.2%", color: "var(--accent)", sub: "Target: 60%" },
          { label: "Services in Catalog", value: "9", color: "var(--blue)", sub: "4 categories" },
          { label: "Pending Discounts", value: "2", color: "var(--amber)", sub: "Needs approval" },
          { label: "Active Quotes", value: "6", color: "var(--purple)", sub: "R284k total value" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as (typeof tabs)[number])} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "service catalog" && (
        <div>
          <select title="Filter by category" value={selectedCat} onChange={e => setSelectedCat(e.target.value)} className={styles.filterSelect}>
            {["All", ...categories].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className={styles.pricTableCard}>
            <div className={styles.pricTableInner}>
              <div className={cx(styles.pricTableHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                {"Service|Category|Est. Hours|Cost|Price|Margin|".split("|").map((h, idx) => <span key={`${h}-${idx}`}>{h}</span>)}
              </div>
              {filtered.map((s, i) => (
                <div key={s.id} className={cx(styles.pricTableRow, i < filtered.length - 1 && "borderB", editingId === s.id && styles.pricRowEditing)}>
                  <span className={cx("fw600")}>{s.name}</span>
                  <span className={cx("text11", "colorMuted", "fontMono")}>{s.category}</span>
                  <span className={cx("fontMono", "colorMuted")}>{s.hours}h</span>
                  <span className={cx("fontMono", "colorMuted")}>R{(s.cost / 1000).toFixed(0)}k</span>
                  <span className={cx("fontMono", "colorAccent", "fw700")}>R{(s.price / 1000).toFixed(0)}k</span>
                  <MarginBadge margin={s.margin} />
                  <button type="button" onClick={() => setEditingId(editingId === s.id ? null : s.id)} className={cx("btnSm", "btnGhost")}>
                    {editingId === s.id ? "Done" : "Edit"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "quote builder" && (
        <div className={styles.pricQuoteSplit}>
          <div>
            <div className={styles.pricQuoteCard}>
              <div className={styles.pricSectionTitle}>Quote Details</div>
              <div className={styles.pricFormGrid3}>
                <div>
                  <div className={styles.pricFieldLabel}>Client</div>
                  <select title="Quote client" value={quoteClient} onChange={(e) => setQuoteClient(e.target.value)} className={styles.formInput}>
                    {["Volta Studios", "Mira Health", "Kestrel Capital", "Dune Collective", "Okafor & Sons"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div className={styles.pricFieldLabel}>Valid Until</div>
                  <input type="date" defaultValue="2026-03-23" className={styles.formInput} />
                </div>
                <div>
                  <div className={styles.pricFieldLabel}>Discount %</div>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} min={0} max={30} className={cx("formInput", styles.pricDiscountInput)} />
                </div>
              </div>
            </div>

            <div className={styles.pricTableCard}>
              <div className={cx(styles.pricQuoteHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                {"Service|Qty|Unit Price|Total".split("|").map((h) => <span key={h}>{h}</span>)}
              </div>
              {quoteItems.map((item, i) => (
                <div key={i} className={cx(styles.pricQuoteRow, "borderB")}>
                  <span className={cx("fw600")}>{item.service}</span>
                  <span className={cx("fontMono", "colorMuted")}>{item.qty}</span>
                  <span className={cx("fontMono", "colorMuted")}>R{item.price.toLocaleString()}</span>
                  <span className={cx("fontMono", "colorAccent", "fw700")}>R{((item.price * item.qty) / 1000).toFixed(0)}k</span>
                </div>
              ))}
              <button type="button" className={styles.pricAddItemBtn}>+ Add Line Item</button>
            </div>
          </div>

          <div className={styles.pricSideStack}>
            <div className={styles.pricQuoteCard}>
              <div className={styles.pricSectionTitle}>Quote Summary</div>
              <div className={styles.pricSummaryStack}>
                {[
                  { label: "Subtotal", value: `R${(quoteSubtotal / 1000).toFixed(1)}k`, color: "var(--text)" },
                  { label: `Discount (${discount}%)`, value: `-R${(quoteDiscount / 1000).toFixed(1)}k`, color: "var(--amber)" },
                  { label: "Excl. VAT", value: `R${(quoteTotal / 1000).toFixed(1)}k`, color: "var(--text)" },
                  { label: "VAT (15%)", value: `R${(quoteVAT / 1000).toFixed(1)}k`, color: "var(--muted)" }
                ].map((r) => (
                  <div key={r.label} className={styles.pricSummaryRow}>
                    <span className={cx("text13", "colorMuted")}>{r.label}</span>
                    <span className={cx("fontMono", r.color === "var(--text)" ? "colorText" : colorClass(r.color))}>{r.value}</span>
                  </div>
                ))}
                <div className={styles.pricTotalRow}>
                  <span className={styles.pricTotalLabel}>Total</span>
                  <span className={styles.pricTotalValue}>R{(quoteFinal / 1000).toFixed(1)}k</span>
                </div>
              </div>
              <div className={styles.pricActionStack}>
                <button type="button" className={cx("btnSm", "btnAccent", styles.pricBigBtn)}>Send Quote to {quoteClient}</button>
                <button type="button" className={cx("btnSm", "btnGhost", styles.pricBigBtn)}>Download PDF</button>
              </div>
            </div>

            <div className={styles.pricQuoteCard}>
              <div className={styles.pricSectionTitle}>Margin Health</div>
              <div className={styles.pricMarginBig}>
                {(
                  ((quoteTotal - quoteItems.reduce((s, i) => {
                    const svc = services.find((sv) => sv.name === i.service);
                    return s + (svc ? svc.cost * i.qty : 0);
                  }, 0)) /
                    quoteTotal) *
                  100
                ).toFixed(1)}
                %
              </div>
              <div className={cx("text12", "colorMuted")}>Estimated margin on this quote</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "retainer tiers" && (
        <div className={styles.pricTierGrid}>
          {retainerTiers.map((tier, i) => (
            <div key={tier.name} className={cx(styles.pricTierCard, i === 1 && styles.pricTierCardPopular)}>
              {i === 1 && <div className={styles.pricPopularTag}>MOST POPULAR</div>}
              <div className={cx(styles.pricTierName, i === 1 ? styles.pricTierNamePopular : "colorText")}>{tier.name}</div>
              <div className={styles.pricTierPrice}>R{(tier.price / 1000).toFixed(0)}k</div>
              <div className={styles.pricTierSub}>per month - {tier.hours}h included</div>
              <div className={styles.pricDivider} />
              <div className={styles.pricFeatureStack}>
                {tier.features.map((f) => (
                  <div key={f} className={styles.pricFeatureRow}>
                    <span className={styles.pricCheck}>v</span>
                    <span className={styles.colorMuted}>{f}</span>
                  </div>
                ))}
              </div>
              <div className={styles.pricOverageBox}>
                <div className={styles.pricFieldLabel}>Overage Rate</div>
                <div className={styles.pricOverageVal}>R{Math.round((tier.price / tier.hours) * 1.2).toLocaleString()}/h</div>
              </div>
              <button type="button" className={cx("btnSm", i === 1 ? "btnAccent" : "btnGhost", styles.pricBigBtn)}>Edit Tier</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "discount approvals" && (
        <div className={styles.pricDiscountStack}>
          <div className={styles.pricPolicyCard}>
            <div className={styles.pricPolicyTitle}>Discount Policy</div>
            <div className={styles.pricPolicyText}>Any discount above 10% requires admin approval. Discounts exceeding 20% require justification and are logged for quarterly review. Max allowed discount: 30%.</div>
          </div>
          {pendingDiscounts.map((d, i) => (
            <div key={i} className={styles.pricDiscountCard}>
              <div className={styles.pricDiscountGrid}>
                <div>
                  <div className={styles.pricDiscountClient}>{d.client}</div>
                  <div className={cx("text12", "colorMuted")}>{d.item}</div>
                  <div className={styles.pricRequestedBy}>Requested by: {d.requestedBy}</div>
                </div>
                <div>
                  <div className={styles.pricFieldLabel}>Discount</div>
                  <div className={styles.pricDiscountValue}>{d.discount}%</div>
                </div>
                <div>
                  <div className={styles.pricFieldLabel}>Reason</div>
                  <div className={styles.text13}>{d.reason}</div>
                </div>
                <div className={styles.pricApprovalBtns}>
                  <button type="button" className={cx("btnSm", "btnAccent", styles.pricBigBtn)}>Approve</button>
                  <button type="button" className={cx("btnSm", "btnGhost", styles.pricRejectBtn, styles.pricBigBtn)}>Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
