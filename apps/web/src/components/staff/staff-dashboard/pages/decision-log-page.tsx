"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type Impact = "Design" | "Strategy" | "Scope & Finance" | "Technical" | "Finance";

type DecisionRow = {
  id: number;
  clientId: number;
  date: string;
  title: string;
  context: string;
  madeBy: string;
  recordedBy: string;
  impact: Impact;
  tags: string[];
  linked: string | null;
};

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  project: string;
};

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", project: "Brand Identity System" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", project: "Q1 Campaign Strategy" },
  { id: 3, name: "Mira Health", avatar: "MH", project: "Website Redesign" },
  { id: 4, name: "Dune Collective", avatar: "DC", project: "Editorial Design System" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", project: "Annual Report 2025" }
];

const initialDecisions: DecisionRow[] = [
  {
    id: 1,
    clientId: 1,
    date: "Feb 18",
    title: "Secondary colour changed to warmer amber",
    context:
      "Lena felt the original cool grey was too corporate for the brand direction. Agreed to shift to a warmer amber in the secondary palette.",
    madeBy: "Client (Lena Muller)",
    recordedBy: "You",
    impact: "Design",
    tags: ["colour", "brand direction"],
    linked: "Logo & Visual Direction milestone"
  },
  {
    id: 2,
    clientId: 1,
    date: "Feb 10",
    title: "Scope extended to include animation guidelines",
    context:
      "After reviewing the brand direction, Lena requested motion guidelines be included. Agreed to add as an addendum - R18,000 added to invoice.",
    madeBy: "Both (agreed on call)",
    recordedBy: "You",
    impact: "Scope & Finance",
    tags: ["scope change", "animation", "billing"],
    linked: "Kickoff call notes"
  },
  {
    id: 3,
    clientId: 1,
    date: "Jan 22",
    title: "Typography: Syne + DM Mono pairing selected",
    context:
      "Lena rejected the original serif options as too traditional. Syne + DM Mono was agreed as the brand typeface pairing after reviewing 6 options.",
    madeBy: "Client (Lena Muller)",
    recordedBy: "You",
    impact: "Design",
    tags: ["typography", "brand"],
    linked: null
  },
  {
    id: 4,
    clientId: 2,
    date: "Feb 12",
    title: "Q1 campaign limited to EMEA market only",
    context:
      "Marcus confirmed the US rollout has been deprioritised internally. Q1 campaign will focus on EMEA only - US pushed to Q2.",
    madeBy: "Client (Marcus Rehn)",
    recordedBy: "You",
    impact: "Strategy",
    tags: ["scope", "market focus"],
    linked: "Campaign Strategy Deck"
  },
  {
    id: 5,
    clientId: 2,
    date: "Feb 3",
    title: "KPI framework: CAC and LTV as primary metrics",
    context:
      "After reviewing the initial KPI options, Marcus confirmed customer acquisition cost and lifetime value are the board's priority metrics.",
    madeBy: "Client (Marcus Rehn)",
    recordedBy: "You",
    impact: "Strategy",
    tags: ["KPIs", "metrics"],
    linked: "KPI Framework doc"
  },
  {
    id: 6,
    clientId: 2,
    date: "Jan 28",
    title: "LinkedIn primary channel, Instagram secondary",
    context:
      "Paid search de-prioritised by Marcus - budget redirected to LinkedIn. Instagram kept as organic secondary. Confirmed in writing.",
    madeBy: "Client (Marcus Rehn)",
    recordedBy: "You",
    impact: "Strategy",
    tags: ["channels", "budget"],
    linked: null
  },
  {
    id: 7,
    clientId: 3,
    date: "Feb 15",
    title: "Booking flow simplified to 4-step wizard",
    context:
      "Dr. Nkosi found the original 7-step flow confusing for patients. Agreed to simplify to 4 steps - clinical team confirmed this covers all required fields.",
    madeBy: "Both (UX review call)",
    recordedBy: "You",
    impact: "Design",
    tags: ["UX", "booking flow"],
    linked: "Mobile Wireframes milestone"
  },
  {
    id: 8,
    clientId: 3,
    date: "Jan 12",
    title: "Framer chosen as build platform",
    context:
      "Mira Health has in-house Framer skills for post-handover maintenance. Agreed to build in Framer rather than custom code.",
    madeBy: "Both (kickoff call)",
    recordedBy: "You",
    impact: "Technical",
    tags: ["technology", "handover"],
    linked: "Kickoff call notes"
  },
  {
    id: 9,
    clientId: 4,
    date: "Jan 20",
    title: "12-column grid at 8pt baseline",
    context:
      "Matched to Dune's existing Quark templates. Kofi confirmed this is their in-house standard - deviation would require reprinting old materials.",
    madeBy: "Client (Kofi Asante)",
    recordedBy: "You",
    impact: "Design",
    tags: ["grid", "technical"],
    linked: "Type & Grid System milestone"
  },
  {
    id: 10,
    clientId: 4,
    date: "Nov 20",
    title: "Deliver as InDesign package, not Figma",
    context:
      "Dune Collective's team uses Adobe CC exclusively. Figma handover is not viable. Agreed to deliver as InDesign package with full documentation.",
    madeBy: "Both (kickoff call)",
    recordedBy: "You",
    impact: "Technical",
    tags: ["delivery format", "handover"],
    linked: null
  }
];

const impactColors: Record<Impact, string> = {
  Design: "#a78bfa",
  Strategy: "#60a5fa",
  "Scope & Finance": "#f5c518",
  Technical: "#ff8c00",
  Finance: "var(--accent)"
};

export function DecisionLogPage({ isActive }: { isActive: boolean }) {
  const [decisions, setDecisions] = useState<DecisionRow[]>(initialDecisions);
  const [clientFilter, setClientFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    clientId: "1",
    title: "",
    context: "",
    madeBy: "",
    impact: "Design" as Impact,
    tags: ""
  });

  const filtered = useMemo(() => {
    return decisions
      .filter((decision) => clientFilter === "all" || decision.clientId === Number.parseInt(clientFilter, 10))
      .filter((decision) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          decision.title.toLowerCase().includes(q) ||
          decision.context.toLowerCase().includes(q) ||
          decision.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      });
  }, [clientFilter, decisions, search]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, DecisionRow[]>>((accumulator, decision) => {
      const clientName = clients.find((client) => client.id === decision.clientId)?.name ?? "Unknown";
      if (!accumulator[clientName]) accumulator[clientName] = [];
      accumulator[clientName].push(decision);
      return accumulator;
    }, {});
  }, [filtered]);

  const current = selected ? decisions.find((decision) => decision.id === selected) ?? null : null;

  const handleAdd = () => {
    const newDecision: DecisionRow = {
      id: Date.now(),
      clientId: Number.parseInt(draft.clientId, 10),
      date: "Today",
      title: draft.title,
      context: draft.context,
      madeBy: draft.madeBy,
      recordedBy: "You",
      impact: draft.impact,
      tags: draft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      linked: null
    };
    setDecisions((previous) => [newDecision, ...previous]);
    setAdding(false);
    setDraft({ clientId: "1", title: "", context: "", madeBy: "", impact: "Design", tags: "" });
    setSelected(newDecision.id);
  };

  const canSave = draft.title.trim() && draft.context.trim() && draft.madeBy.trim();

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-decision-log">
      <style>{`
        .dl-decision-row { transition: all 0.12s ease; cursor: pointer; }
        .dl-decision-row:hover { background: color-mix(in srgb, var(--accent) 2%, transparent) !important; border-color: color-mix(in srgb, var(--accent) 15%, transparent) !important; }
        .dl-add-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .dl-add-btn:hover { background: #a8d420 !important; }
        .dl-save-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .dl-save-btn:hover:not(:disabled) { background: #a8d420 !important; }
        .dl-save-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .dl-cancel-btn { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .dl-cancel-btn:hover { opacity: 0.7; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Knowledge
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Decision Log
            </h1>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { label: "Total", value: decisions.length, color: "#a0a0b0" },
                { label: "Projects", value: [...new Set(decisions.map((decision) => decision.clientId))].length, color: "#a0a0b0" }
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="dl-add-btn"
              onClick={() => {
                setAdding(true);
                setSelected(null);
              }}
              style={{ padding: "10px 20px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              + Log decision
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search decisions…"
            style={{ width: 220, padding: "7px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "var(--text)", fontSize: 11, outline: "none" }}
          />
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
          <select
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            style={{ padding: "7px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "var(--text)", fontSize: 11, outline: "none" }}
          >
            <option value="all">All projects</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted2)" }}>{filtered.length} decisions</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: current || adding ? "1fr 420px" : "1fr", minHeight: "calc(100vh - 230px)" }}>
        <div style={{ padding: "20px 12px 8px 0", borderRight: current || adding ? "1px solid rgba(255,255,255,0.06)" : "none", overflowY: "auto" }}>
          {Object.entries(grouped).map(([clientName, clientDecisions]) => (
            <div key={clientName} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: 2, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#a0a0b0" }}>
                  {clients.find((client) => client.name === clientName)?.avatar}
                </div>
                <span style={{ fontSize: 12, color: "#a0a0b0", fontWeight: 500 }}>{clientName}</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
                <span style={{ fontSize: 10, color: "var(--muted2)" }}>{clientDecisions.length}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {clientDecisions.map((decision) => {
                  const impactColor = impactColors[decision.impact] ?? "#a0a0b0";
                  const isSelected = selected === decision.id;
                  return (
                    <div
                      key={decision.id}
                      className="dl-decision-row"
                      onClick={() => {
                        setSelected(isSelected ? null : decision.id);
                        setAdding(false);
                      }}
                      style={{ padding: "13px 16px", border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "rgba(255,255,255,0.05)"}`, borderLeft: `3px solid ${impactColor}`, borderRadius: "0 4px 4px 0", background: isSelected ? "color-mix(in srgb, var(--accent) 2%, transparent)" : "rgba(255,255,255,0.01)" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 5, lineHeight: 1.3 }}>{decision.title}</div>
                          <div style={{ fontSize: 11, color: "var(--muted2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 8 }}>{decision.context}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 2, background: `${impactColor}14`, color: impactColor, letterSpacing: "0.08em", textTransform: "uppercase" }}>{decision.impact}</span>
                            {decision.tags.slice(0, 2).map((tag) => (
                              <span key={tag} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 2, background: "rgba(255,255,255,0.04)", color: "var(--muted2)" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 10, color: "var(--muted2)" }}>{decision.date}</div>
                          <div style={{ fontSize: 10, color: "#333344", marginTop: 3 }}>by {decision.recordedBy}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <div style={{ textAlign: "center", paddingTop: 60, color: "#333344", fontSize: 12 }}>No decisions match your filters.</div> : null}
        </div>

        {adding ? (
          <div style={{ padding: "24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Log a Decision</div>
            <div style={{ fontSize: 11, color: "var(--muted2)" }}>Record what was decided, by whom, and why - so nothing is lost.</div>

            <div>
              <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Project</label>
              <select
                value={draft.clientId}
                onChange={(event) => setDraft((previous) => ({ ...previous, clientId: event.target.value }))}
                style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, outline: "none" }}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} — {client.project}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Decision title</label>
              <input
                value={draft.title}
                onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
                placeholder="e.g. Typography changed to Syne + DM Mono"
                style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, outline: "none" }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Context & rationale</label>
              <textarea
                value={draft.context}
                onChange={(event) => setDraft((previous) => ({ ...previous, context: event.target.value }))}
                placeholder="What led to this decision? What were the alternatives? What was agreed?"
                style={{ width: "100%", minHeight: 88, padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, lineHeight: 1.6, outline: "none", resize: "none" }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Decision made by</label>
              <input
                value={draft.madeBy}
                onChange={(event) => setDraft((previous) => ({ ...previous, madeBy: event.target.value }))}
                placeholder="e.g. Client (Lena Muller) / Both on call / Internal"
                style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, outline: "none" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Impact area</label>
                <select
                  value={draft.impact}
                  onChange={(event) => setDraft((previous) => ({ ...previous, impact: event.target.value as Impact }))}
                  style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, outline: "none" }}
                >
                  {Object.keys(impactColors).map((impact) => (
                    <option key={impact} value={impact}>
                      {impact}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Tags</label>
                <input
                  value={draft.tags}
                  onChange={(event) => setDraft((previous) => ({ ...previous, tags: event.target.value }))}
                  placeholder="colour, scope, UX…"
                  style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, outline: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                className="dl-save-btn"
                disabled={!canSave}
                onClick={handleAdd}
                style={{ padding: "11px 24px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                Save decision
              </button>
              <button
                type="button"
                className="dl-cancel-btn"
                onClick={() => setAdding(false)}
                style={{ padding: "11px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--muted2)", fontSize: 11 }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {current && !adding ? (
          <div style={{ padding: "24px 24px", display: "flex", flexDirection: "column", gap: 18, overflowY: "auto" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: `${impactColors[current.impact] ?? "#a0a0b0"}14`, color: impactColors[current.impact] ?? "#a0a0b0", letterSpacing: "0.08em", textTransform: "uppercase" }}>{current.impact}</span>
                <span style={{ fontSize: 10, color: "var(--muted2)", padding: "3px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>{current.date}</span>
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 6 }}>{current.title}</div>
              <div style={{ fontSize: 11, color: "var(--muted2)" }}>
                {clients.find((client) => client.id === current.clientId)?.name} · {clients.find((client) => client.id === current.clientId)?.project}
              </div>
            </div>

            <div style={{ padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
              <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Context & rationale</div>
              <div style={{ fontSize: 13, color: "#a0a0b0", lineHeight: 1.8 }}>{current.context}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Decision by</div>
                <div style={{ fontSize: 12, color: "#a0a0b0" }}>{current.madeBy}</div>
              </div>
              <div style={{ padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Recorded by</div>
                <div style={{ fontSize: 12, color: "#a0a0b0" }}>{current.recordedBy}</div>
              </div>
            </div>

            {current.linked ? (
              <div style={{ padding: "12px 14px", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 3, background: "rgba(96,165,250,0.05)" }}>
                <div style={{ fontSize: 9, color: "#60a5fa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Linked to</div>
                <div style={{ fontSize: 12, color: "#60a5fa" }}>↗ {current.linked}</div>
              </div>
            ) : null}

            <div>
              <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Tags</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {current.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 2, background: "rgba(255,255,255,0.04)", color: "#a0a0b0" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
