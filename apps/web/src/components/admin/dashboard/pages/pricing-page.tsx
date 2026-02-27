"use client";

import { useState } from "react";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  lime: "#a78bfa",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

const services = [
  { id: 1, name: "Brand Identity System", category: "Branding", cost: 8000, price: 22000, hours: 60, margin: 63.6 },
  { id: 2, name: "UX/UI Design (per screen)", category: "Product Design", cost: 800, price: 2400, hours: 6, margin: 66.7 },
  { id: 3, name: "Website Design & Dev", category: "Digital", cost: 15000, price: 42000, hours: 140, margin: 64.3 },
  { id: 4, name: "Monthly Retainer — Core", category: "Retainer", cost: 12000, price: 28000, hours: 80, margin: 57.1 },
  { id: 5, name: "Monthly Retainer — Growth", category: "Retainer", cost: 18000, price: 45000, hours: 130, margin: 60.0 },
  { id: 6, name: "Monthly Retainer — Enterprise", category: "Retainer", cost: 26000, price: 72000, hours: 200, margin: 63.9 },
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
  { client: "Dune Collective", item: "Monthly Retainer — Growth", discount: 15, reason: "Long-term client loyalty", requestedBy: "Nomsa Dlamini", status: "pending" },
  { client: "Mira Health", item: "Website Design & Dev", discount: 10, reason: "Project scope reduction", requestedBy: "Renzo Fabbri", status: "pending" }
] as const;

const tabs = ["service catalog", "quote builder", "retainer tiers", "discount approvals"] as const;

const categories = [...new Set(services.map((s) => s.category))];

function MarginBadge({ margin }: { margin: number }) {
  const color = margin >= 65 ? C.lime : margin >= 55 ? C.amber : C.red;
  return <span style={{ color, fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 12 }}>{margin.toFixed(1)}%</span>;
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
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>
            ADMIN / PRICING & QUOTE ENGINE
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Pricing Control</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Service catalog · Quote builder · Discount approvals</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>
            Export Pricelist
          </button>
          <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>
            + New Service
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Avg Project Margin", value: "64.2%", color: C.lime, sub: "Target: 60%" },
          { label: "Services in Catalog", value: "9", color: C.blue, sub: "4 categories" },
          { label: "Pending Discounts", value: "2", color: C.amber, sub: "Needs approval" },
          { label: "Active Quotes", value: "6", color: C.purple, sub: "R284k total value" }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === t ? C.lime : C.muted,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: `2px solid ${activeTab === t ? C.lime : "transparent"}`,
              marginBottom: -1,
              transition: "all 0.2s",
              whiteSpace: "nowrap"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "service catalog" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {["All", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCat(c)}
                style={{
                  background: selectedCat === c ? C.lime : C.surface,
                  color: selectedCat === c ? C.bg : C.muted,
                  border: `1px solid ${selectedCat === c ? C.lime : C.border}`,
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "DM Mono, monospace"
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflowX: "auto" }}>
            <div style={{ minWidth: 860 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 80px 80px 80px 80px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {["Service", "Category", "Est. Hours", "Cost", "Price", "Margin", ""].map((h) => <span key={h}>{h}</span>)}
              </div>
              {filtered.map((s, i) => (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 80px 80px 80px 80px", padding: "16px 24px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", background: editingId === s.id ? `${C.lime}10` : "transparent" }}>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: "DM Mono, monospace" }}>{s.category}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{s.hours}h</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>R{(s.cost / 1000).toFixed(0)}k</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{(s.price / 1000).toFixed(0)}k</span>
                  <MarginBadge margin={s.margin} />
                  <button onClick={() => setEditingId(editingId === s.id ? null : s.id)} style={{ background: C.border, border: "none", color: C.text, padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>
                    {editingId === s.id ? "Done" : "Edit"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "quote builder" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
          <div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quote Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Client</div>
                  <select value={quoteClient} onChange={(e) => setQuoteClient(e.target.value)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", borderRadius: 6, fontSize: 13, width: "100%", fontFamily: "Syne, sans-serif" }}>
                    {["Volta Studios", "Mira Health", "Kestrel Capital", "Dune Collective", "Okafor & Sons"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Valid Until</div>
                  <input type="date" defaultValue="2026-03-23" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", borderRadius: 6, fontSize: 13, width: "100%", fontFamily: "DM Mono, monospace" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Discount %</div>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} min={0} max={30} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.amber, padding: "8px 12px", borderRadius: 6, fontSize: 13, width: "100%", fontFamily: "DM Mono, monospace" }} />
                </div>
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {["Service", "Qty", "Unit Price", "Total"].map((h) => <span key={h}>{h}</span>)}
              </div>
              {quoteItems.map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px", padding: "16px 24px", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>{item.service}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{item.qty}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>R{item.price.toLocaleString()}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{((item.price * item.qty) / 1000).toFixed(0)}k</span>
                </div>
              ))}
              <button style={{ width: "100%", padding: 16, background: "transparent", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", borderTop: `1px dashed ${C.border}`, textAlign: "left" }}>
                + Add Line Item
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quote Summary</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Subtotal", value: `R${(quoteSubtotal / 1000).toFixed(1)}k`, color: C.text },
                  { label: `Discount (${discount}%)`, value: `-R${(quoteDiscount / 1000).toFixed(1)}k`, color: C.amber },
                  { label: "Excl. VAT", value: `R${(quoteTotal / 1000).toFixed(1)}k`, color: C.text },
                  { label: "VAT (15%)", value: `R${(quoteVAT / 1000).toFixed(1)}k`, color: C.muted }
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.muted }}>{r.label}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", color: r.color }}>{r.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.lime, fontFamily: "DM Mono, monospace" }}>R{(quoteFinal / 1000).toFixed(1)}k</span>
                </div>
              </div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <button style={{ background: C.lime, color: C.bg, border: "none", padding: "12px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Syne, sans-serif" }}>
                  Send Quote to {quoteClient}
                </button>
                <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "10px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                  Download PDF
                </button>
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Margin Health</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.lime, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>
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
              <div style={{ fontSize: 12, color: C.muted }}>Estimated margin on this quote</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "retainer tiers" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {retainerTiers.map((tier, i) => (
            <div key={tier.name} style={{ background: C.surface, border: `1px solid ${i === 1 ? C.lime : C.border}`, borderRadius: 10, padding: 28, position: "relative" }}>
              {i === 1 && <div style={{ position: "absolute", top: -10, left: 20, background: C.lime, color: C.bg, fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10, fontFamily: "DM Mono, monospace" }}>MOST POPULAR</div>}
              <div style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, color: i === 1 ? C.lime : C.text }}>{tier.name}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: C.lime, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>R{(tier.price / 1000).toFixed(0)}k</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>per month · {tier.hours}h included</div>
              <div style={{ height: 1, background: C.border, marginBottom: 20 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {tier.features.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                    <span style={{ color: C.lime }}>✓</span>
                    <span style={{ color: C.muted }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: 12, background: C.bg, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Overage Rate</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700 }}>R{Math.round((tier.price / tier.hours) * 1.2).toLocaleString()}/h</div>
              </div>
              <button style={{ width: "100%", background: i === 1 ? C.lime : C.border, color: i === 1 ? C.bg : C.text, border: "none", padding: "10px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                Edit Tier
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "discount approvals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.amber}33`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, color: C.amber, marginBottom: 4 }}>⚠ Discount Policy</div>
            <div style={{ fontSize: 12, color: C.muted }}>Any discount above 10% requires admin approval. Discounts exceeding 20% require justification and are logged for quarterly review. Max allowed discount: 30%.</div>
          </div>
          {pendingDiscounts.map((d, i) => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${C.amber}55`, borderRadius: 10, padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 24, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.client}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{d.item}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Requested by: {d.requestedBy}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Discount</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.amber, fontFamily: "DM Mono, monospace" }}>{d.discount}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Reason</div>
                  <div style={{ fontSize: 13 }}>{d.reason}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button style={{ background: C.lime, color: C.bg, border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Approve</button>
                  <button style={{ background: `${C.red}15`, color: C.red, border: "none", padding: "10px 20px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
