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
  text: "#e8e8f0",
};

type DeliverableStatus = "in-review" | "approved" | "changes-requested" | "rejected";
type Tab = "all deliverables" | "pending review" | "approved" | "revision history" | "qa metrics";
type FilterStatus = "All" | DeliverableStatus;

const deliverables: Array<{
  id: string;
  project: string;
  client: string;
  clientColor: string;
  name: string;
  type: string;
  assignee: string;
  reviewer: string;
  submittedDate: string;
  reviewDue: string;
  status: DeliverableStatus;
  round: number;
  revisions: Array<{ date: string; note: string; requestedBy: string }>;
  score: number | null;
  checklist: Array<{ item: string; done: boolean }>;
}> = [
  {
    id: "DLV-041",
    project: "Brand Identity System",
    client: "Volta Studios",
    clientColor: C.lime,
    name: "Logo System & Variants",
    type: "Design",
    assignee: "Renzo Fabbri",
    reviewer: "Sipho Nkosi",
    submittedDate: "Feb 20",
    reviewDue: "Feb 24",
    status: "in-review",
    round: 1,
    revisions: [],
    score: null,
    checklist: [
      { item: "Meets brand brief requirements", done: true },
      { item: "All file formats provided (SVG, PNG, PDF)", done: true },
      { item: "Dark & light variants included", done: true },
      { item: "Responsive/favicon versions included", done: false },
      { item: "Colour accessibility checked", done: false },
    ],
  },
  {
    id: "DLV-040",
    project: "Website Redesign",
    client: "Mira Health",
    clientColor: C.blue,
    name: "Homepage Wireframe",
    type: "UX",
    assignee: "Kira Bosman",
    reviewer: "Leilani Fotu",
    submittedDate: "Feb 18",
    reviewDue: "Feb 21",
    status: "changes-requested",
    round: 2,
    revisions: [
      { date: "Feb 19", note: "CTA hierarchy unclear - hero section needs revision", requestedBy: "Leilani Fotu" },
      { date: "Feb 22", note: "Mobile layout still does not reflect nav requirements", requestedBy: "Leilani Fotu" },
    ],
    score: null,
    checklist: [
      { item: "Matches UX brief scope", done: true },
      { item: "Mobile-first structure verified", done: false },
      { item: "Content blocks match sitemap", done: true },
      { item: "Navigation pattern consistent", done: false },
      { item: "Accessibility annotations included", done: false },
    ],
  },
  {
    id: "DLV-039",
    project: "Q1 Campaign Strategy",
    client: "Kestrel Capital",
    clientColor: C.purple,
    name: "Campaign Strategy Deck",
    type: "Strategy",
    assignee: "Nomsa Dlamini",
    reviewer: "Sipho Nkosi",
    submittedDate: "Feb 15",
    reviewDue: "Feb 17",
    status: "approved",
    round: 1,
    revisions: [],
    score: 88,
    checklist: [
      { item: "Objectives clearly defined", done: true },
      { item: "Target audience documented", done: true },
      { item: "Channel strategy justified", done: true },
      { item: "KPIs and measurement plan included", done: true },
      { item: "Budget allocation included", done: true },
    ],
  },
  {
    id: "DLV-038",
    project: "Annual Report 2025",
    client: "Okafor & Sons",
    clientColor: C.orange,
    name: "Annual Report Draft v2",
    type: "Copy + Design",
    assignee: "Tapiwa Moyo",
    reviewer: "Renzo Fabbri",
    submittedDate: "Feb 21",
    reviewDue: "Feb 25",
    status: "in-review",
    round: 2,
    revisions: [{ date: "Feb 17", note: "Page count exceeded - reduce section 3 by 2 pages", requestedBy: "Renzo Fabbri" }],
    score: null,
    checklist: [
      { item: "Word count within spec", done: true },
      { item: "All financial data verified", done: true },
      { item: "Photography sourced and licensed", done: true },
      { item: "Print-ready specs met", done: false },
      { item: "Client brand guidelines applied", done: true },
    ],
  },
  {
    id: "DLV-037",
    project: "Editorial Design System",
    client: "Dune Collective",
    clientColor: C.amber,
    name: "Template Library - Vol 1",
    type: "Design",
    assignee: "Renzo Fabbri",
    reviewer: "Sipho Nkosi",
    submittedDate: "Feb 10",
    reviewDue: "Feb 12",
    status: "rejected",
    round: 3,
    revisions: [
      { date: "Feb 11", note: "Typography system doesn't match editorial tone", requestedBy: "Sipho Nkosi" },
      { date: "Feb 14", note: "Layout grid inconsistent across templates", requestedBy: "Sipho Nkosi" },
      { date: "Feb 19", note: "Still not meeting client brand standards - escalate conversation", requestedBy: "Sipho Nkosi" },
    ],
    score: null,
    checklist: [
      { item: "Typography system consistent", done: false },
      { item: "Grid system applied correctly", done: false },
      { item: "All 12 templates included", done: true },
      { item: "Editable formats provided", done: true },
      { item: "Client branding applied", done: false },
    ],
  },
];

const statusConfig: Record<DeliverableStatus, { color: string; label: string; bg: string }> = {
  "in-review": { color: C.blue, label: "In Review", bg: `${C.blue}15` },
  approved: { color: C.lime, label: "Approved", bg: `${C.lime}15` },
  "changes-requested": { color: C.amber, label: "Changes Requested", bg: `${C.amber}15` },
  rejected: { color: C.red, label: "Rejected", bg: `${C.red}15` },
};

const typeColors: Record<string, string> = {
  Design: C.purple,
  UX: C.blue,
  Strategy: C.lime,
  Copy: C.amber,
  "Copy + Design": C.orange,
};

const tabs: Tab[] = ["all deliverables", "pending review", "approved", "revision history", "qa metrics"];

export function QualityAssurancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("all deliverables");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");

  const pending = deliverables.filter((d) => d.status === "in-review" || d.status === "changes-requested");
  const approved = deliverables.filter((d) => d.status === "approved");
  const avgRounds = (deliverables.reduce((s, d) => s + d.round, 0) / deliverables.length).toFixed(1);
  const approvalRate = Math.round((approved.length / deliverables.length) * 100);

  const filtered =
    activeTab === "pending review"
      ? pending
      : activeTab === "approved"
        ? approved
        : filterStatus === "All"
          ? deliverables
          : deliverables.filter((d) => d.status === filterStatus);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / OPERATIONS</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Quality Assurance</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Deliverable review - Revision rounds - Approval gates</div>
        </div>
        <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Log Deliverable</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Pending Review", value: pending.length.toString(), color: C.blue, sub: "Awaiting QA sign-off" },
          { label: "Approval Rate", value: `${approvalRate}%`, color: approvalRate >= 60 ? C.lime : C.amber, sub: "First-pass or later" },
          { label: "Avg Revision Rounds", value: avgRounds, color: parseFloat(avgRounds) <= 1.5 ? C.lime : C.amber, sub: "Target: <= 1.5 rounds" },
          { label: "Rejected / Blocked", value: deliverables.filter((d) => d.status === "rejected").length.toString(), color: C.red, sub: "Needs escalation" },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                background: "none",
                border: "none",
                color: activeTab === t ? C.lime : C.muted,
                padding: "8px 14px",
                cursor: "pointer",
                fontFamily: "Syne, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                borderBottom: `2px solid ${activeTab === t ? C.lime : "transparent"}`,
                marginBottom: -1,
                transition: "all 0.2s",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        {activeTab === "all deliverables" ? (
          <div style={{ display: "flex", gap: 6, paddingBottom: 8 }}>
            {(["All", ...Object.keys(statusConfig)] as Array<"All" | DeliverableStatus>).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  background: filterStatus === s ? (s === "All" ? C.lime : statusConfig[s].color) : C.surface,
                  color: filterStatus === s ? C.bg : C.muted,
                  border: `1px solid ${filterStatus === s ? (s === "All" ? C.lime : statusConfig[s].color) : C.border}`,
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 10,
                  cursor: "pointer",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {s === "All" ? "All" : statusConfig[s].label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {(activeTab === "all deliverables" || activeTab === "pending review" || activeTab === "approved") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((d) => {
            const sc = statusConfig[d.status];
            const checklistDone = d.checklist.filter((c) => c.done).length;
            const isExpanded = expanded === d.id;
            return (
              <div key={d.id} style={{ background: C.surface, border: `1px solid ${d.status === "rejected" ? `${C.red}55` : d.status === "changes-requested" ? `${C.amber}44` : C.border}`, borderRadius: 12 }}>
                <div style={{ padding: 24, cursor: "pointer" }} onClick={() => setExpanded(isExpanded ? null : d.id)}>
                  <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 120px 100px 80px 100px 80px", alignItems: "center", gap: 16 }}>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{d.id}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: d.clientColor }}>
                        {d.project} - {d.client}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: typeColors[d.type] || C.muted, background: `${typeColors[d.type] || C.muted}15`, padding: "3px 8px", borderRadius: 4 }}>{d.type}</span>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Assignee → Reviewer</div>
                      <div style={{ fontSize: 11 }}>
                        {d.assignee.split(" ")[0]} → {d.reviewer.split(" ")[0]}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Due</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{d.reviewDue}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Round</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: d.round >= 3 ? C.red : d.round >= 2 ? C.amber : C.lime }}>{d.round}</div>
                    </div>
                    <span style={{ fontSize: 10, color: sc.color, background: sc.bg, padding: "4px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace", whiteSpace: "nowrap" }}>{sc.label}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Checklist</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: checklistDone === d.checklist.length ? C.lime : C.amber }}>
                        {checklistDone}/{d.checklist.length}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded ? (
                  <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${C.border}` }}>
                    <div style={{ paddingTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>QA Checklist</div>
                        {d.checklist.map((c, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${c.done ? C.lime : C.border}`, background: c.done ? C.lime : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{c.done ? <span style={{ fontSize: 9, color: C.bg, fontWeight: 800 }}>✓</span> : null}</div>
                            <span style={{ fontSize: 12, color: c.done ? C.muted : C.text, textDecoration: c.done ? "line-through" : "none" }}>{c.item}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Revision History</div>
                        {d.revisions.length === 0
                          ? <div style={{ fontSize: 12, color: C.lime }}>✓ No revisions required</div>
                          : d.revisions.map((rev, i) => (
                              <div key={i} style={{ padding: 12, background: C.bg, borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${C.amber}` }}>
                                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontFamily: "DM Mono, monospace" }}>
                                  {rev.date} - {rev.requestedBy}
                                </div>
                                <div style={{ fontSize: 12 }}>{rev.note}</div>
                              </div>
                            ))}
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Actions</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {d.status !== "approved" ? <button style={{ background: C.lime, color: C.bg, border: "none", padding: "10px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>✓ Approve Deliverable</button> : null}
                          <button style={{ background: C.border, border: "none", color: C.text, padding: "10px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", textAlign: "left" }}>✎ Request Changes</button>
                          <button style={{ background: C.surface, color: C.red, border: `1px solid ${C.red}33`, padding: "10px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", textAlign: "left" }}>✗ Reject</button>
                          {d.score ? (
                            <div style={{ padding: 10, background: C.bg, borderRadius: 6, fontSize: 12 }}>
                              Quality Score: <span style={{ color: C.lime, fontFamily: "DM Mono, monospace", fontWeight: 700 }}>{d.score}/100</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "revision history" ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 80px 1fr 140px 140px auto", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {["DLV ID", "Date", "Revision Note", "Deliverable", "Requested By", "Round"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {deliverables
            .flatMap((d) => d.revisions.map((r, i) => ({ ...r, deliverable: d.name, id: d.id, client: d.client, clientColor: d.clientColor, round: i + 1 })))
            .map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 80px 1fr 140px 140px auto", padding: "14px 24px", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{r.id}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{r.date}</span>
                <span style={{ fontSize: 12, color: C.text }}>{r.note}</span>
                <span style={{ fontSize: 11, color: r.clientColor }}>{r.deliverable.substring(0, 20)}...</span>
                <span style={{ fontSize: 12 }}>{r.requestedBy.split(" ")[0]}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: r.round >= 3 ? C.red : r.round >= 2 ? C.amber : C.lime, fontWeight: 700 }}>R{r.round}</span>
              </div>
            ))}
        </div>
      ) : null}

      {activeTab === "qa metrics" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Revision Rounds by Assignee</div>
            {["Renzo Fabbri", "Kira Bosman", "Nomsa Dlamini", "Tapiwa Moyo"].map((name) => {
              const theirWork = deliverables.filter((d) => d.assignee === name);
              const avg = theirWork.length > 0 ? (theirWork.reduce((s, d) => s + d.round, 0) / theirWork.length).toFixed(1) : "0.0";
              const avgNum = parseFloat(avg);
              const color = avgNum <= 1.5 ? C.lime : avgNum <= 2.5 ? C.amber : C.red;
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, flex: 1 }}>{name}</span>
                  <div style={{ width: 100, height: 6, background: C.border, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${Math.min((avgNum / 4) * 100, 100)}%`, background: color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color, fontWeight: 700, width: 32, textAlign: "right" }}>{avg}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>QA Status Breakdown</div>
              {Object.entries(statusConfig).map(([status, cfg]) => {
                const count = deliverables.filter((d) => d.status === status).length;
                return (
                  <div key={status} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, flex: 1, color: cfg.color }}>{cfg.label}</span>
                    <div style={{ width: 80, height: 6, background: C.border, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${(count / deliverables.length) * 100}%`, background: cfg.color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: "DM Mono, monospace", color: cfg.color, fontWeight: 700, width: 20, textAlign: "right" }}>{count}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.amber}33`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, color: C.amber, marginBottom: 8 }}>⚠ QA Advisory</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
                Dune Collective deliverable is on round 3. This signals a deeper scope or communication issue - recommend admin-level conversation before submitting again.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
