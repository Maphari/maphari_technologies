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

const impactToneClass: Record<Impact, string> = {
  Design: "dlImpactDesign",
  Strategy: "dlImpactStrategy",
  "Scope & Finance": "dlImpactScope",
  Technical: "dlImpactTechnical",
  Finance: "dlImpactFinance"
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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-decision-log">
      <div className={cx("pageHeaderBar", "mb20")}>
        <div className={cx("flexBetween", "mb20")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Knowledge</div>
            <h1 className={cx("pageTitleText")}>Decision Log</h1>
          </div>
          <div className={cx("flexRow", "gap16")}>
            <div className={cx("flexRow", "gap20")}>
              {[
                { label: "Total", value: decisions.length },
                { label: "Projects", value: [...new Set(decisions.map((decision) => decision.clientId))].length }
              ].map((stat) => (
                <div key={stat.label} className={cx("textRight")}>
                  <div className={cx("statLabelNew")}>{stat.label}</div>
                  <div className={cx("statValueNew", "colorMuted")}>{stat.value}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={cx("button", "buttonBlue", "dlAddBtn")}
              onClick={() => {
                setAdding(true);
                setSelected(null);
              }}
            >
              + Log decision
            </button>
          </div>
        </div>

        <div className={cx("flexBetween", "gap10")}>
          <div className={cx("flexRow", "gap10")}>
            <input
              className={cx("fieldInput", "dlSearchInput")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search decisions..."
            />
            <div className={cx("dlDividerV")} />
            <select
              className={cx("fieldInput", "fieldSelect", "dlClientSelect")}
              aria-label="Filter decisions by project"
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
            >
              <option value="all">All projects</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <span className={cx("text11", "colorMuted2")}>{filtered.length} decisions</span>
        </div>
      </div>

      <div className={cx("dlShell", (current || adding) && "dlShellWithPanel")}>
        <div className={cx("dlListPane", (current || adding) && "dlListPaneWithPanel")}>
          {Object.entries(grouped).map(([clientName, clientDecisions]) => (
            <div key={clientName} className={cx("mb28")}>
              <div className={cx("dlGroupHead")}> 
                <div className={cx("dlGroupAvatar")}>{clients.find((client) => client.name === clientName)?.avatar}</div>
                <span className={cx("text12", "colorMuted", "fw600")}>{clientName}</span>
                <div className={cx("dlGroupLine")} />
                <span className={cx("text10", "colorMuted2")}>{clientDecisions.length}</span>
              </div>

              <div className={cx("flexCol", "gap6")}>
                {clientDecisions.map((decision) => {
                  const isSelected = selected === decision.id;
                  return (
                    <button
                      key={decision.id}
                      type="button"
                      className={cx(
                        "dlDecisionRow",
                        "dlDecisionCard",
                        `dlDecisionBorder${decision.impact.replace(/\s|&/g, "")}`,
                        isSelected && "dlDecisionCardSelected"
                      )}
                      onClick={() => {
                        setSelected(isSelected ? null : decision.id);
                        setAdding(false);
                      }}
                    >
                      <div className={cx("flexBetween", "gap12")}> 
                        <div className={cx("flex1", "minW0")}>
                          <div className={cx("text13", "colorText", "mb6", "truncate")}>{decision.title}</div>
                          <div className={cx("text11", "colorMuted2", "truncate", "mb8")}>{decision.context}</div>
                          <div className={cx("flexRow", "gap6", "flexWrap")}>
                            <span className={cx("dlImpactChip", impactToneClass[decision.impact])}>{decision.impact}</span>
                            {decision.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className={cx("dlTagChip")}>{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className={cx("textRight", "noShrink")}>
                          <div className={cx("text10", "colorMuted2")}>{decision.date}</div>
                          <div className={cx("text10", "dlRecordedBy")}>by {decision.recordedBy}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 ? <div className={cx("dlEmpty")}>No decisions match your filters.</div> : null}
        </div>

        {adding ? (
          <div className={cx("dlPanel")}>
            <div className={cx("dlPanelTitle", "mb4")}>Log a Decision</div>
            <div className={cx("text11", "colorMuted2", "mb16")}>Record what was decided, by whom, and why - so nothing is lost.</div>

            <div className={cx("mb16")}>
              <label className={cx("fieldLabel")}>Project</label>
              <select
                className={cx("fieldInput", "fieldSelect")}
                aria-label="Decision project"
                value={draft.clientId}
                onChange={(event) => setDraft((previous) => ({ ...previous, clientId: event.target.value }))}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.project}
                  </option>
                ))}
              </select>
            </div>

            <div className={cx("mb16")}>
              <label className={cx("fieldLabel")}>Decision title</label>
              <input
                className={cx("fieldInput")}
                value={draft.title}
                onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
                placeholder="e.g. Typography changed to Syne + DM Mono"
              />
            </div>

            <div className={cx("mb16")}>
              <label className={cx("fieldLabel")}>Context & rationale</label>
              <textarea
                className={cx("fieldInput", "dlContextArea")}
                value={draft.context}
                onChange={(event) => setDraft((previous) => ({ ...previous, context: event.target.value }))}
                placeholder="What led to this decision? What were the alternatives? What was agreed?"
              />
            </div>

            <div className={cx("mb16")}>
              <label className={cx("fieldLabel")}>Decision made by</label>
              <input
                className={cx("fieldInput")}
                value={draft.madeBy}
                onChange={(event) => setDraft((previous) => ({ ...previous, madeBy: event.target.value }))}
                placeholder="e.g. Client / Both on call / Internal"
              />
            </div>

            <div className={cx("formGrid2", "mb16")}>
              <div>
                <label className={cx("fieldLabel")}>Impact area</label>
                <select
                  className={cx("fieldInput", "fieldSelect")}
                  aria-label="Decision impact"
                  value={draft.impact}
                  onChange={(event) => setDraft((previous) => ({ ...previous, impact: event.target.value as Impact }))}
                >
                  {Object.keys(impactToneClass).map((impact) => (
                    <option key={impact} value={impact}>
                      {impact}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={cx("fieldLabel")}>Tags</label>
                <input
                  className={cx("fieldInput")}
                  value={draft.tags}
                  onChange={(event) => setDraft((previous) => ({ ...previous, tags: event.target.value }))}
                  placeholder="colour, scope, UX..."
                />
              </div>
            </div>

            <div className={cx("flexRow", "gap10", "mt4")}>
              <button type="button" className={cx("button", "buttonBlue", "dlSaveBtn")} disabled={!canSave} onClick={handleAdd}>
                Save decision
              </button>
              <button type="button" className={cx("button", "buttonGhost", "dlCancelBtn")} onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {current && !adding ? (
            <div className={cx("dlPanel", "overflowAuto")}>
            <div className={cx("mb16")}>
              <div className={cx("flexRow", "gap8", "mb10", "flexWrap")}>
                <span className={cx("dlImpactChip", impactToneClass[current.impact])}>{current.impact}</span>
                <span className={cx("dlDateChip")}>{current.date}</span>
              </div>
              <div className={cx("dlPanelTitle", "mb6")}>{current.title}</div>
              <div className={cx("text11", "colorMuted2")}>
                {clients.find((client) => client.id === current.clientId)?.name} · {clients.find((client) => client.id === current.clientId)?.project}
              </div>
            </div>

            <div className={cx("cardSurface", "mb10")}>
              <div className={cx("sectionLabel", "mb8")}>Context & rationale</div>
              <div className={cx("text13", "colorMuted", "dlContextBody")}>{current.context}</div>
            </div>

              <div className={cx("formGrid2", "mb10")}>
                <div className={cx("cardSurfaceSm")}>
                  <div className={cx("sectionLabel", "mb4")}>Decision by</div>
                  <div className={cx("text12", "colorMuted")}>{current.madeBy}</div>
                </div>
                <div className={cx("cardSurfaceSm")}>
                  <div className={cx("sectionLabel", "mb4")}>Recorded by</div>
                  <div className={cx("text12", "colorMuted")}>{current.recordedBy}</div>
                </div>
              </div>

            {current.linked ? (
              <div className={cx("dlLinkedCard", "mb10")}>
                <div className={cx("text9", "dlLinkedLabel", "uppercase", "mb4")}>Linked to</div>
                <div className={cx("text12", "dlLinkedValue")}>↗ {current.linked}</div>
              </div>
            ) : null}

            <div>
              <div className={cx("sectionLabel", "mb8")}>Tags</div>
              <div className={cx("flexRow", "gap6", "flexWrap")}>
                {current.tags.map((tag) => (
                  <span key={tag} className={cx("dlTagChip")}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
