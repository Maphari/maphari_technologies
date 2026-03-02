"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

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

const categoryColors: Record<VendorCategory, string> = { Software: "var(--blue)", Freelancer: "var(--purple)", Supplier: "var(--amber)", Infrastructure: "var(--accent)" };
const priorityColors: Record<VendorPriority, string> = { critical: "var(--red)", high: "var(--orange)", medium: "var(--amber)", low: "var(--muted)" };

export function VendorCostControlPage() {
  const [activeTab, setActiveTab] = useState<Tab>("vendor registry");
  const [filterCat, setFilterCat] = useState<VendorCategory | "All">("All");

  const totalMonthly = vendors.filter((v) => v.status !== "cancelled").reduce((s, v) => s + v.monthlyCost, 0);
  const softwareMonthly = vendors.filter((v) => v.category === "Software").reduce((s, v) => s + v.monthlyCost, 0);
  const upcomingRenewals = vendors.filter((v) => v.renewalDate !== "Per project" && v.renewalDate !== "Per order" && new Date(v.renewalDate) < new Date("2026-04-01")).length;

  const categories = ["All", ...new Set(vendors.map((v) => v.category))] as const;
  const filtered = filterCat === "All" ? vendors : vendors.filter((v) => v.category === filterCat);

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / VENDOR & COST MANAGEMENT</div>
          <h1 className={styles.pageTitle}>Vendor & Cost Control</h1>
          <div className={styles.pageSub}>Vendors · Software spend · Freelancers · Cost per project</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Add Vendor</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          { label: "Total Monthly Vendor Cost", value: `R${(totalMonthly / 1000).toFixed(1)}k`, color: "var(--red)", sub: "All active vendors" },
          { label: "Software Spend", value: `R${(softwareMonthly / 1000).toFixed(1)}k`, color: "var(--blue)", sub: "9 tools, 8 seats avg" },
          { label: "Freelancer Spend", value: "R18k", color: "var(--purple)", sub: "Feb 2026 · 1 active" },
          { label: "Renewals Due (60d)", value: upcomingRenewals.toString(), color: "var(--amber)", sub: "Require review" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, "vendorToneText", toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="View" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {activeTab === "vendor registry" ? (
          <select title="Category" value={filterCat} onChange={e => setFilterCat(e.target.value as VendorCategory | "All")} className={styles.filterSelect}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        ) : null}
      </div>

      {activeTab === "vendor registry" && (
        <div>
          <div className={cx("card", "overflowHidden")}>
            <div className={cx("fontMono", "text10", "colorMuted", "uppercase", "vendorRegHead")}>
              {["Vendor", "Category", "Monthly", "Annual", "Renewal", "Status", "Priority", ""].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
            {filtered.map((v, i) => (
              <div
                key={v.id}
                className={cx("vendorRegRow", i < filtered.length - 1 && "borderB", v.status === "reviewing" && "vendorReviewRow")}
              >
                <div>
                  <div className={cx("fw600", "text13")}>{v.name}</div>
                  {v.seats ? <div className={cx("text11", "colorMuted")}>{v.seats} seats</div> : null}
                </div>
                <span className={cx("text10", "fontMono", "vendorToneTag", toneClass(categoryColors[v.category]))}>{v.category}</span>
                <span className={cx("fontMono", "colorRed", "fw700")}>R{v.monthlyCost.toLocaleString()}</span>
                <span className={cx("fontMono", "colorMuted", "text12")}>{v.annualCost > 0 ? `R${(v.annualCost / 1000).toFixed(0)}k` : "\u2014"}</span>
                <span className={cx("text11", "fontMono", "vendorToneText", toneClass(v.renewalDate !== "Per project" && v.renewalDate !== "Per order" && new Date(v.renewalDate) < new Date("2026-04-01") ? "var(--amber)" : "var(--muted)"))}>{v.renewalDate}</span>
                <span className={cx("text10", "fontMono", "vendorToneTag", toneClass(v.status === "active" ? "var(--accent)" : "var(--amber)"))}>{v.status}</span>
                <span className={cx("text10", "fontMono", "vendorToneText", toneClass(priorityColors[v.priority]))}>{v.priority}</span>
                <div className={cx("flexRow", "gap6")}>
                  <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
                  <button type="button" className={cx("btnSm", "btnGhost", "vendorAmberText")}>Review</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "software spend" && (
        <div className={cx("vendorSoftwareSplit", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>Software Spend by Tool</div>
            <div className={cx("flexCol", "gap16")}>
              {vendors
                .filter((v) => v.category === "Software")
                .sort((a, b) => b.monthlyCost - a.monthlyCost)
                .map((v) => {
                  const maxCost = vendors.filter((v2) => v2.category === "Software").reduce((m, v2) => Math.max(m, v2.monthlyCost), 0);
                  return (
                    <div key={v.id}>
                      <div className={cx("flexBetween", "mb6")}>
                        <div>
                          <span className={cx("text13", "fw600")}>{v.name}</span>
                          {v.seats ? <span className={cx("text11", "colorMuted", "vendorMl8")}>{v.seats} seats · R{Math.round(v.monthlyCost / v.seats).toLocaleString()}/seat</span> : null}
                        </div>
                        <span className={cx("fontMono", "colorRed", "fw700")}>R{v.monthlyCost.toLocaleString()}</span>
                      </div>
                      <div className={cx("progressBar", "vendorBarSm")}>
                        <progress className={cx("vendorBarFillRound")} max={maxCost} value={v.monthlyCost} aria-label={`${v.name} monthly software spend`} />
                      </div>
                      <div className={cx("text10", "colorMuted", "mt3")}>Annual: R{v.annualCost.toLocaleString()} · Renews {v.renewalDate}</div>
                    </div>
                  );
                })}
            </div>
          </div>
          <div className={cx("flexCol", "gap16")}>
            <div className={cx("card", "p24")}>
              <div className={cx("text13", "fw700", "mb16", "uppercase", "tracking")}>Cost Optimisation</div>
              {[
                { tool: "Miro Teams", issue: "Low usage - 2/8 seats active", saving: "R160/mo", action: "Downgrade or cancel" },
                { tool: "Slack Pro", issue: "Free tier may suffice", saving: "R480/mo", action: "Review usage" }
              ].map((opt) => (
                <div key={opt.tool} className={cx("card", "mb10", "vendorOptCard")}>
                  <div className={cx("fw600", "mb4")}>{opt.tool}</div>
                  <div className={cx("text12", "colorMuted", "mb8")}>{opt.issue}</div>
                  <div className={cx("flexBetween")}>
                    <span className={cx("colorAccent", "fontMono", "fw700")}>Save {opt.saving}</span>
                    <button type="button" className={cx("btnSm", "btnAccent")}>{opt.action}</button>
                  </div>
                </div>
              ))}
            </div>
            <div className={cx("card", "p24")}>
              <div className={cx("text13", "fw700", "mb12", "uppercase", "tracking")}>Cost Per Head</div>
              <div className={cx("fontMono", "fw800", "colorBlue", "mb4", "vendorCostHead")}>R{Math.round(softwareMonthly / 5).toLocaleString()}</div>
              <div className={cx("text12", "colorMuted")}>Software cost per staff member / month</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "freelancers" && (
        <div className={cx("flexCol", "gap16")}>
          {freelancers.map((f) => (
            <div
              key={f.name}
              className={cx("card", "vendorFreeRow")}
            >
              <div>
                <div className={cx("fw700", "mb4")}>{f.name}</div>
                <div className={cx("text12", "colorMuted")}>{f.specialty}</div>
              </div>
              <div>
                <div className={cx("text11", "colorMuted", "mb4")}>Rate</div>
                <div className={cx("fontMono", "fw700", "text13")}>{f.rate}</div>
              </div>
              <div>
                <div className={cx("text11", "colorMuted", "mb4")}>YTD Spend</div>
                <div className={cx("fontMono", "colorPurple", "fw700")}>R{f.ytd.toLocaleString()}</div>
              </div>
              <div>
                <div className={cx("text11", "colorMuted", "mb4")}>This Month</div>
                <div className={cx("fontMono", "vendorToneText", toneClass(f.projectsThisMonth > 0 ? "var(--accent)" : "var(--muted)"))}>{f.projectsThisMonth} project{f.projectsThisMonth !== 1 ? "s" : ""}</div>
              </div>
              <span className={cx("text10", "fontMono", "vendorToneTag", toneClass(f.status === "active" ? "var(--accent)" : "var(--amber)"))}>{f.status}</span>
              <div className={cx("flexRow", "gap8")}>
                <button type="button" className={cx("btnSm", "btnGhost")}>Brief</button>
                <button type="button" className={cx("btnSm", "btnGhost")}>Invoice</button>
              </div>
            </div>
          ))}
          <button type="button" className={cx("btnSm", "btnGhost", "textCenter", "vendorAddBtn")}>+ Add Freelancer</button>
        </div>
      )}

      {activeTab === "cost per project" && (
        <div className={cx("card", "overflowHidden")}>
          <div className={cx("fontMono", "text10", "colorMuted", "uppercase", "vendorProjectHead")}>
            {["Project", "Tool Costs", "Freelancer Costs", "Supplier Costs", "Total"].map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {costByProject.map((p, i) => (
            <div key={p.project} className={cx("vendorProjectRow", i < costByProject.length - 1 && "borderB")}>
              <span className={cx("fw600")}>{p.project}</span>
              <span className={cx("fontMono", "colorBlue")}>R{p.toolCosts.toLocaleString()}</span>
              <span className={cx("fontMono", "vendorToneText", toneClass(p.freelancerCosts > 0 ? "var(--purple)" : "var(--muted)"))}>{p.freelancerCosts > 0 ? `R${p.freelancerCosts.toLocaleString()}` : "\u2014"}</span>
              <span className={cx("fontMono", "vendorToneText", toneClass(p.supplierCosts > 0 ? "var(--amber)" : "var(--muted)"))}>{p.supplierCosts > 0 ? `R${p.supplierCosts.toLocaleString()}` : "\u2014"}</span>
              <span className={cx("fontMono", "colorRed", "fw800")}>R{p.total.toLocaleString()}</span>
            </div>
          ))}
          <div className={cx("bgSurface", "vendorProjectTotal")}>
            <span className={cx("fw800", "colorAccent")}>TOTAL</span>
            <span className={cx("fontMono", "colorBlue", "fw700")}>R{costByProject.reduce((s, p) => s + p.toolCosts, 0).toLocaleString()}</span>
            <span className={cx("fontMono", "colorPurple", "fw700")}>R{costByProject.reduce((s, p) => s + p.freelancerCosts, 0).toLocaleString()}</span>
            <span className={cx("fontMono", "colorAmber", "fw700")}>R{costByProject.reduce((s, p) => s + p.supplierCosts, 0).toLocaleString()}</span>
            <span className={cx("fontMono", "colorRed", "fw800")}>R{costByProject.reduce((s, p) => s + p.total, 0).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
