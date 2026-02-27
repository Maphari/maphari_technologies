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

type VendorCategory = "Software" | "Freelancer" | "Supplier" | "Infrastructure";
type VendorPriority = "critical" | "high" | "medium" | "low";
type VendorStatus = "active" | "reviewing" | "cancelled";
type Tab = "vendor registry" | "software spend" | "freelancers" | "cost per project";

const vendors = [
  { id: 1, name: "Adobe Creative Cloud", category: "Software" as VendorCategory, monthlyCost: 2400, annualCost: 28800, seats: 6, renewalDate: "2026-03-01", status: "active" as VendorStatus, priority: "critical" as VendorPriority },
  { id: 2, name: "Figma Organisation", category: "Software" as VendorCategory, monthlyCost: 1800, annualCost: 21600, seats: 6, renewalDate: "2026-07-15", status: "active" as VendorStatus, priority: "critical" as VendorPriority },
  { id: 3, name: "Slack Pro", category: "Software" as VendorCategory, monthlyCost: 480, annualCost: 5760, seats: 8, renewalDate: "2026-09-01", status: "active" as VendorStatus, priority: "high" as VendorPriority },
  { id: 4, name: "Linear", category: "Software" as VendorCategory, monthlyCost: 320, annualCost: 3840, seats: 8, renewalDate: "2026-09-01", status: "active" as VendorStatus, priority: "high" as VendorPriority },
  { id: 5, name: "Notion Teams", category: "Software" as VendorCategory, monthlyCost: 240, annualCost: 2880, seats: 8, renewalDate: "2026-06-01", status: "active" as VendorStatus, priority: "medium" as VendorPriority },
  { id: 6, name: "Studio Outpost", category: "Freelancer" as VendorCategory, monthlyCost: 18000, annualCost: 0, seats: null, renewalDate: "Per project", status: "active" as VendorStatus, priority: "high" as VendorPriority },
  { id: 7, name: "Lumi Print Studio", category: "Supplier" as VendorCategory, monthlyCost: 3200, annualCost: 0, seats: null, renewalDate: "Per order", status: "active" as VendorStatus, priority: "medium" as VendorPriority },
  { id: 8, name: "AWS Cloud", category: "Infrastructure" as VendorCategory, monthlyCost: 890, annualCost: 10680, seats: null, renewalDate: "2027-01-01", status: "active" as VendorStatus, priority: "critical" as VendorPriority },
  { id: 9, name: "Miro Teams", category: "Software" as VendorCategory, monthlyCost: 200, annualCost: 2400, seats: 8, renewalDate: "2026-11-01", status: "reviewing" as VendorStatus, priority: "low" as VendorPriority }
] as const;

const freelancers = [
  { name: "Studio Outpost", specialty: "Video Production", rate: "R1,800/day", ytd: 54000, projectsThisMonth: 1, status: "active" },
  { name: "Chidi Osei", specialty: "Illustration", rate: "R900/hr", ytd: 18000, projectsThisMonth: 0, status: "on-hold" },
  { name: "Thandi Khumalo", specialty: "Copywriting", rate: "R650/hr", ytd: 12000, projectsThisMonth: 2, status: "active" }
] as const;

const costByProject = [
  { project: "Volta Studios - Brand", toolCosts: 4200, freelancerCosts: 0, supplierCosts: 1800, total: 6000 },
  { project: "Kestrel Capital - Campaign", toolCosts: 2100, freelancerCosts: 9000, supplierCosts: 0, total: 11100 },
  { project: "Dune Collective - Editorial", toolCosts: 1800, freelancerCosts: 18000, supplierCosts: 3200, total: 23000 },
  { project: "Mira Health - Website", toolCosts: 2800, freelancerCosts: 0, supplierCosts: 0, total: 2800 }
] as const;

const tabs = ["vendor registry", "software spend", "freelancers", "cost per project"] as const;

const categoryColors: Record<VendorCategory, string> = { Software: C.blue, Freelancer: C.purple, Supplier: C.amber, Infrastructure: C.lime };
const priorityColors: Record<VendorPriority, string> = { critical: C.red, high: C.orange, medium: C.amber, low: C.muted };

export function VendorCostControlPage() {
  const [activeTab, setActiveTab] = useState<Tab>("vendor registry");
  const [filterCat, setFilterCat] = useState<VendorCategory | "All">("All");

  const totalMonthly = vendors.filter((v) => v.status !== "cancelled").reduce((s, v) => s + v.monthlyCost, 0);
  const softwareMonthly = vendors.filter((v) => v.category === "Software").reduce((s, v) => s + v.monthlyCost, 0);
  const upcomingRenewals = vendors.filter((v) => v.renewalDate !== "Per project" && v.renewalDate !== "Per order" && new Date(v.renewalDate) < new Date("2026-04-01")).length;

  const categories = ["All", ...new Set(vendors.map((v) => v.category))] as const;
  const filtered = filterCat === "All" ? vendors : vendors.filter((v) => v.category === filterCat);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / VENDOR & COST MANAGEMENT</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Vendor & Cost Control</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Vendors · Software spend · Freelancers · Cost per project</div>
        </div>
        <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Add Vendor</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Monthly Vendor Cost", value: `R${(totalMonthly / 1000).toFixed(1)}k`, color: C.red, sub: "All active vendors" },
          { label: "Software Spend", value: `R${(softwareMonthly / 1000).toFixed(1)}k`, color: C.blue, sub: "9 tools, 8 seats avg" },
          { label: "Freelancer Spend", value: "R18k", color: C.purple, sub: "Feb 2026 · 1 active" },
          { label: "Renewals Due (60d)", value: upcomingRenewals.toString(), color: C.amber, sub: "Require review" }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
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
              transition: "all 0.2s"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "vendor registry" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                style={{
                  background: filterCat === c ? (c === "All" ? C.lime : categoryColors[c]) : C.surface,
                  color: filterCat === c ? C.bg : C.muted,
                  border: `1px solid ${filterCat === c ? (c === "All" ? C.lime : categoryColors[c]) : C.border}`,
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
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 120px 80px 80px auto", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {["Vendor", "Category", "Monthly", "Annual", "Renewal", "Status", "Priority", ""].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
            {filtered.map((v, i) => (
              <div key={v.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 120px 80px 80px auto", padding: "14px 24px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", background: v.status === "reviewing" ? C.surface : "transparent" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{v.name}</div>
                  {v.seats ? <div style={{ fontSize: 11, color: C.muted }}>{v.seats} seats</div> : null}
                </div>
                <span style={{ fontSize: 10, color: categoryColors[v.category], background: `${categoryColors[v.category]}15`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{v.category}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.red, fontWeight: 700 }}>R{v.monthlyCost.toLocaleString()}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.muted, fontSize: 12 }}>{v.annualCost > 0 ? `R${(v.annualCost / 1000).toFixed(0)}k` : "—"}</span>
                <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: v.renewalDate !== "Per project" && v.renewalDate !== "Per order" && new Date(v.renewalDate) < new Date("2026-04-01") ? C.amber : C.muted }}>{v.renewalDate}</span>
                <span style={{ fontSize: 10, color: v.status === "active" ? C.lime : C.amber, background: `${v.status === "active" ? C.lime : C.amber}15`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{v.status}</span>
                <span style={{ fontSize: 10, color: priorityColors[v.priority], fontFamily: "DM Mono, monospace" }}>{v.priority}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ background: C.border, border: "none", color: C.text, padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Edit</button>
                  <button style={{ background: C.surface, color: C.amber, border: "none", padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Review</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "software spend" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Software Spend by Tool</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {vendors
                .filter((v) => v.category === "Software")
                .sort((a, b) => b.monthlyCost - a.monthlyCost)
                .map((v) => {
                  const maxCost = vendors.filter((v2) => v2.category === "Software").reduce((m, v2) => Math.max(m, v2.monthlyCost), 0);
                  return (
                    <div key={v.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</span>
                          {v.seats ? <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{v.seats} seats · R{Math.round(v.monthlyCost / v.seats).toLocaleString()}/seat</span> : null}
                        </div>
                        <span style={{ fontFamily: "DM Mono, monospace", color: C.red, fontWeight: 700 }}>R{v.monthlyCost.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
                        <div style={{ height: "100%", width: `${(v.monthlyCost / maxCost) * 100}%`, background: C.blue, borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>Annual: R{v.annualCost.toLocaleString()} · Renews {v.renewalDate}</div>
                    </div>
                  );
                })}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cost Optimisation</div>
              {[
                { tool: "Miro Teams", issue: "Low usage - 2/8 seats active", saving: "R160/mo", action: "Downgrade or cancel" },
                { tool: "Slack Pro", issue: "Free tier may suffice", saving: "R480/mo", action: "Review usage" }
              ].map((opt) => (
                <div key={opt.tool} style={{ padding: 14, background: C.surface, border: `1px solid ${C.lime}22`, borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{opt.tool}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{opt.issue}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: C.lime, fontFamily: "DM Mono, monospace", fontWeight: 700 }}>Save {opt.saving}</span>
                    <button style={{ background: C.lime, color: C.bg, border: "none", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{opt.action}</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cost Per Head</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: C.blue, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>R{Math.round(softwareMonthly / 5).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: C.muted }}>Software cost per staff member / month</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "freelancers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {freelancers.map((f) => (
            <div key={f.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, display: "grid", gridTemplateColumns: "1fr 120px 120px 100px 80px auto", alignItems: "center", gap: 20 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{f.specialty}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Rate</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 13 }}>{f.rate}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>YTD Spend</div>
                <div style={{ fontFamily: "DM Mono, monospace", color: C.purple, fontWeight: 700 }}>R{f.ytd.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>This Month</div>
                <div style={{ fontFamily: "DM Mono, monospace", color: f.projectsThisMonth > 0 ? C.lime : C.muted }}>{f.projectsThisMonth} project{f.projectsThisMonth !== 1 ? "s" : ""}</div>
              </div>
              <span style={{ fontSize: 10, color: f.status === "active" ? C.lime : C.amber, background: `${f.status === "active" ? C.lime : C.amber}15`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{f.status}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Brief</button>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Invoice</button>
              </div>
            </div>
          ))}
          <button style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10, padding: 20, color: C.muted, fontSize: 13, cursor: "pointer", textAlign: "center" }}>+ Add Freelancer</button>
        </div>
      )}

      {activeTab === "cost per project" && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px 100px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {["Project", "Tool Costs", "Freelancer Costs", "Supplier Costs", "Total"].map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {costByProject.map((p, i) => (
            <div key={p.project} style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px 100px", padding: "16px 24px", borderBottom: i < costByProject.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>{p.project}</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: C.blue }}>R{p.toolCosts.toLocaleString()}</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: p.freelancerCosts > 0 ? C.purple : C.muted }}>{p.freelancerCosts > 0 ? `R${p.freelancerCosts.toLocaleString()}` : "—"}</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: p.supplierCosts > 0 ? C.amber : C.muted }}>{p.supplierCosts > 0 ? `R${p.supplierCosts.toLocaleString()}` : "—"}</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: C.red, fontWeight: 800 }}>R{p.total.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px 100px", padding: "16px 24px", borderTop: `2px solid ${C.border}`, background: "#0d0d14" }}>
            <span style={{ fontWeight: 800, color: C.lime }}>TOTAL</span>
            <span style={{ fontFamily: "DM Mono, monospace", color: C.blue, fontWeight: 700 }}>R{costByProject.reduce((s, p) => s + p.toolCosts, 0).toLocaleString()}</span>
            <span style={{ fontFamily: "DM Mono, monospace", color: C.purple, fontWeight: 700 }}>R{costByProject.reduce((s, p) => s + p.freelancerCosts, 0).toLocaleString()}</span>
            <span style={{ fontFamily: "DM Mono, monospace", color: C.amber, fontWeight: 700 }}>R{costByProject.reduce((s, p) => s + p.supplierCosts, 0).toLocaleString()}</span>
            <span style={{ fontFamily: "DM Mono, monospace", color: C.red, fontWeight: 800 }}>R{costByProject.reduce((s, p) => s + p.total, 0).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
