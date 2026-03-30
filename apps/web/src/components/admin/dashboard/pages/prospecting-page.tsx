"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import {
  runProspectingWithRefresh,
  fetchLeadsForDedupWithRefresh,
  buildDuplicateSet,
  sendPitchWithRefresh,
  loadProspectingCampaignsWithRefresh,
  createProspectingCampaignWithRefresh,
  type ProspectResult,
  type OpportunityFilter,
  type ProspectingCampaign
} from "../../../../lib/api/admin/prospecting";
import { createLeadWithRefresh } from "../../../../lib/api/admin/clients";

// ── Constants ──────────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { id: OpportunityFilter; label: string; description: string }[] = [
  { id: "no_website", label: "No website", description: "No web presence at all" },
  { id: "needs_redesign", label: "Needs redesign", description: "Outdated or poor website" },
  { id: "needs_automation", label: "Needs automation", description: "Missing booking, chatbot, or CRM tools" },
  { id: "needs_seo", label: "Needs SEO", description: "Poor local search visibility" }
];

const OPPORTUNITY_LABELS: Record<OpportunityFilter, string> = {
  no_website: "No Website",
  needs_redesign: "Needs Redesign",
  needs_automation: "Needs Automation",
  needs_seo: "Needs SEO"
};

const COUNT_OPTIONS = [10, 20, 50] as const;

const SA_CITIES = [
  "Johannesburg", "Cape Town", "Durban", "Pretoria",
  "Sandton", "Bloemfontein", "Port Elizabeth", "East London",
] as const;

const INDUSTRY_SUGGESTIONS = [
  "restaurant", "hair salon", "barbershop", "nail salon",
  "physiotherapy clinic", "accounting firm", "tax consultant",
  "plumbing services", "electrician", "cleaning services",
  "real estate agent", "property developer",
  "dental practice", "optometrist", "pharmacy",
  "gym and fitness", "personal trainer",
  "wedding photographer", "graphic designer",
  "car wash", "auto repair", "driving school",
  "daycare centre", "tutoring centre",
  "clothing boutique", "hardware store",
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function opportunityBadgeClass(type: OpportunityFilter): string {
  switch (type) {
    case "no_website": return "badgeRed";
    case "needs_redesign": return "badgeAmber";
    case "needs_automation": return "badgeAccent";
    case "needs_seo": return "badgePurple";
  }
}

function leadScoreBadgeClass(score: number): string {
  if (score >= 80) return "badgeGreen";
  if (score >= 50) return "badgeAmber";
  return "badgeMuted";
}

function healthScoreBadgeClass(score: number): string {
  if (score >= 90) return "badgeGreen";
  if (score >= 50) return "badgeAmber";
  return "badgeRed";
}

function buildLeadTitle(prospect: ProspectResult): string {
  return `${prospect.company} — ${OPPORTUNITY_LABELS[prospect.opportunityType]}`;
}


function exportToCsv(prospects: ProspectResult[]): void {
  const headers = [
    "Company", "Website", "Opportunity Type", "Contact Email",
    "Contact Phone", "Rating", "Lead Score", "Health Score", "Pitch"
  ];
  const rows = prospects.map((p) => [
    `"${p.company.replace(/"/g, '""')}"`,
    p.website ?? "",
    OPPORTUNITY_LABELS[p.opportunityType],
    p.contactEmail ?? "",
    p.contactPhone ?? "",
    p.rating?.toFixed(1) ?? "",
    p.leadScore?.toString() ?? "",
    p.healthScore?.toString() ?? "",
    `"${(p.pitch || "").replace(/"/g, '""').replace(/\n/g, " ")}"`
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prospects-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProspectingPage() {
  const { session } = useAdminWorkspaceContext();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [count, setCount] = useState<10 | 20 | 50>(20);
  const [selectedFilters, setSelectedFilters] = useState<Set<OpportunityFilter>>(
    new Set(["no_website"])
  );

  // ── Results state ──────────────────────────────────────────────────────────
  const [prospects, setProspects] = useState<ProspectResult[]>([]);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  // ── Dedup state ────────────────────────────────────────────────────────────
  const [duplicates, setDuplicates] = useState<Set<string>>(new Set());

  // ── Selection + expanded pitch ──────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // ── Lead creation state ───────────────────────────────────────────────────
  const [creating, setCreating] = useState(false);
  const [createDone, setCreateDone] = useState(false);

  // ── Send pitch state ───────────────────────────────────────────────────────
  const [sendingPitchFor, setSendingPitchFor] = useState<Set<number>>(new Set());
  const [sentPitches, setSentPitches] = useState<Set<number>>(new Set());

  // ── Campaign history (persisted to DB) ────────────────────────────────────
  const [history, setHistory] = useState<ProspectingCampaign[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // ── Rotation indices for deterministic "randomize" (no Math.random) ────────
  const cityIdxRef = useRef(0);
  const industryIdxRef = useRef(0);

  // ── Location autocomplete ─────────────────────────────────────────────────
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [locationFetching, setLocationFetching] = useState(false);
  const [locationHighlight, setLocationHighlight] = useState(-1);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session) return;
    void loadProspectingCampaignsWithRefresh(session).then((result) => {
      if (result.data) setHistory(result.data);
    });
  }, [session]);

  // ── Rotate fields (no Math.random) ────────────────────────────────────────
  const randomizeFields = useCallback(() => {
    const city = SA_CITIES[cityIdxRef.current % SA_CITIES.length]!;
    const industry = INDUSTRY_SUGGESTIONS[industryIdxRef.current % INDUSTRY_SUGGESTIONS.length]!;
    cityIdxRef.current = (cityIdxRef.current + 1) % SA_CITIES.length;
    industryIdxRef.current = (industryIdxRef.current + 1) % INDUSTRY_SUGGESTIONS.length;
    setLocation(city);
    setIndustry(industry);
  }, []);

  // ── Location suggestions (Nominatim) ─────────────────────────────────────
  const fetchLocationSuggestions = useCallback((query: string) => {
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    if (query.length < 2) {
      setLocationSuggestions([]);
      setLocationDropdownOpen(false);
      return;
    }
    locationDebounceRef.current = setTimeout(async () => {
      setLocationFetching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "en", "User-Agent": "Maphari-Admin/1.0" }
        });
        if (!res.ok) return;
        const data = (await res.json()) as Array<{
          display_name: string;
          address?: { city?: string; town?: string; village?: string; suburb?: string };
        }>;
        const seen = new Set<string>();
        const names: string[] = [];
        for (const result of data) {
          const name =
            result.address?.city ??
            result.address?.town ??
            result.address?.suburb ??
            result.address?.village ??
            result.display_name.split(",")[0]!;
          if (name && !seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            names.push(name);
          }
        }
        setLocationSuggestions(names);
        setLocationDropdownOpen(names.length > 0);
      } catch {
        // silently fall back — no broken UI
      } finally {
        setLocationFetching(false);
      }
    }, 300);
  }, []);

  // ── Filter toggle ─────────────────────────────────────────────────────────
  const toggleFilter = useCallback((id: OpportunityFilter) => {
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // ── Row selection ─────────────────────────────────────────────────────────
  const toggleRow = useCallback((idx: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === prospects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(prospects.map((_, i) => i)));
    }
  }, [selectedIds.size, prospects]);

  // ── Run prospecting ───────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (!session || !industry.trim() || !location.trim()) return;

    setRunning(true);
    setRunError(null);
    setProspects([]);
    setSelectedIds(new Set());
    setExpandedIdx(null);
    setCreateDone(false);
    setDuplicates(new Set());

    const result = await runProspectingWithRefresh(session, {
      industry: industry.trim(),
      location: location.trim(),
      count,
      filters: Array.from(selectedFilters),
      draftPitch: true
    });

    setRunning(false);
    setHasRun(true);

    if (!result.nextSession) {
      setRunError("Session expired. Please sign in again.");
      return;
    }
    if (result.error) {
      setRunError(result.error.message);
      return;
    }

    const found = result.data?.prospects ?? [];
    setProspects(found);

    if (found.length > 0) {
      // Persist campaign to DB
      void createProspectingCampaignWithRefresh(result.nextSession, {
        filters: { industry: industry.trim(), location: location.trim(), count, filters: Array.from(selectedFilters) },
        resultsCount: found.length,
        status: "completed",
      }).then((saved) => {
        if (saved.data) setHistory((prev) => [saved.data!, ...prev]);
      });

      // Dedup check against existing leads
      const dedupResult = await fetchLeadsForDedupWithRefresh(result.nextSession);
      if (dedupResult.data) {
        const dupSet = buildDuplicateSet(dedupResult.data);
        setDuplicates(
          new Set(
            found
              .map((p) => p.company.toLowerCase().trim())
              .filter((c) => dupSet.has(c))
          )
        );
      }
    }
  }, [session, industry, location, count, selectedFilters]);

  // ── Create leads ──────────────────────────────────────────────────────────
  const handleCreateLeads = useCallback(async () => {
    if (!session || selectedIds.size === 0 || creating) return;

    setCreating(true);

    const chosen = Array.from(selectedIds).map((i) => prospects[i]).filter(Boolean);

    await Promise.all(
      chosen.map((p) =>
        createLeadWithRefresh(session, {
          title: buildLeadTitle(p),
          source: "ai_prospect",
          status: "NEW",
          notes: p.pitch || p.opportunityReason,
          contactName: p.name !== p.company ? p.name : undefined,
          contactEmail: p.contactEmail,
          contactPhone: p.contactPhone,
          company: p.company
        })
      )
    );

    setCreating(false);
    setCreateDone(true);
    setSelectedIds(new Set());
  }, [session, selectedIds, prospects, creating]);

  // ── Send pitch email ───────────────────────────────────────────────────────
  const handleSendPitch = useCallback(async (idx: number, prospect: ProspectResult) => {
    if (!session || !prospect.contactEmail || sendingPitchFor.has(idx)) return;

    // Build subject from pitch first line or fallback
    const firstLine = prospect.pitch.split("\n").find((l) => l.trim().length > 0) ?? "";
    const subject = firstLine.replace(/^subject:\s*/i, "").slice(0, 120) || `Proposal for ${prospect.company}`;

    setSendingPitchFor((prev) => new Set([...prev, idx]));
    try {
      await sendPitchWithRefresh(session, {
        to: prospect.contactEmail,
        subject,
        body: prospect.pitch
      });
      setSentPitches((prev) => new Set([...prev, idx]));
    } finally {
      setSendingPitchFor((prev) => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
    }
  }, [session, sendingPitchFor]);

  // ── Restore from history ──────────────────────────────────────────────────
  const restoreFromHistory = useCallback((record: ProspectingCampaign) => {
    const f = record.filters as Record<string, unknown>;
    if (typeof f.industry === "string") setIndustry(f.industry);
    if (typeof f.location === "string") setLocation(f.location);
    if (f.count === 10 || f.count === 20 || f.count === 50) setCount(f.count);
    if (Array.isArray(f.filters)) setSelectedFilters(new Set(f.filters as OpportunityFilter[]));
    setShowHistory(false);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const canRun = !!session && industry.trim().length > 0 && location.trim().length > 0 && !running;
  const allSelected = prospects.length > 0 && selectedIds.size === prospects.length;
  const duplicateCount = prospects.filter(
    (p) => duplicates.has(p.company.toLowerCase().trim())
  ).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.pageBody}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>OPERATIONS / AI PROSPECTING</div>
          <h1 className={styles.pageTitle}>AI Prospecting</h1>
          <div className={styles.pageSub}>
            Find local businesses with digital gaps. Enriched with PageSpeed health scores,
            contact discovery, and AI lead scoring.
          </div>
        </div>
        {history.length > 0 && (
          <div className={styles.pageActions}>
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
              onClick={() => setShowHistory((v) => !v)}
            >
              {showHistory ? "Hide History" : `History (${history.length})`}
            </button>
          </div>
        )}
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <WidgetGrid columns={4}>
        <StatWidget label="Prospects" value={String(prospects.length)} sub="Current results" />
        <StatWidget label="Contacted" value={String(sentPitches.size)} tone="accent" sub="Pitches sent" />
        <StatWidget label="Meetings Booked" value="—" sub="Not tracked yet" />
        <StatWidget label="Conversion Rate" value={prospects.length > 0 ? `${Math.round((sentPitches.size / prospects.length) * 100)}%` : "—"} tone="green" />
      </WidgetGrid>

      {/* ── Charts & Pipeline ───────────────────────────────────────────── */}
      {hasRun && prospects.length > 0 && (
        <WidgetGrid columns={2}>
          <ChartWidget
            label="Prospects by Source"
            data={[
              { source: "No Website", count: prospects.filter((p) => p.opportunityType === "no_website").length },
              { source: "Needs Redesign", count: prospects.filter((p) => p.opportunityType === "needs_redesign").length },
              { source: "Needs Automation", count: prospects.filter((p) => p.opportunityType === "needs_automation").length },
              { source: "Needs SEO", count: prospects.filter((p) => p.opportunityType === "needs_seo").length },
            ]}
            dataKey="count"
            xKey="source"
            type="bar"
            color="#8b6fff"
          />
          <PipelineWidget
            label="Prospecting Stages"
            stages={[
              { label: "Found", count: prospects.length, total: Math.max(prospects.length, 1), color: "#8b6fff" },
              { label: "Selected", count: selectedIds.size, total: Math.max(prospects.length, 1), color: "#f5a623" },
              { label: "Contacted", count: sentPitches.size, total: Math.max(prospects.length, 1), color: "#34d98b" },
            ]}
          />
        </WidgetGrid>
      )}

      {/* ── Campaign history panel ───────────────────────────────────────── */}
      {showHistory && history.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Past Campaigns</span>
          </div>
          <div className={styles.cardInner}>
            <div className={cx("flexCol", "gap8")}>
              {(() => {
                const today = new Date().toDateString();
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                const groups: Record<string, ProspectingCampaign[]> = { Today: [], "This Week": [], Earlier: [] };
                for (const rec of history) {
                  const d = new Date(rec.createdAt);
                  if (d.toDateString() === today) groups["Today"]!.push(rec);
                  else if (d.getTime() >= weekAgo) groups["This Week"]!.push(rec);
                  else groups["Earlier"]!.push(rec);
                }
                return (Object.entries(groups) as [string, ProspectingCampaign[]][])
                  .filter(([, recs]) => recs.length > 0)
                  .map(([label, recs]) => (
                    <div key={label} className={cx("flexCol", "gap8")}>
                      <div className={cx("text10", "colorMuted", "uppercase")} style={{ letterSpacing: "0.08em", paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>{label}</div>
                      {recs.map((rec) => {
                        const f = rec.filters as Record<string, unknown>;
                        const recIndustry = typeof f.industry === "string" ? f.industry : "—";
                        const recLocation = typeof f.location === "string" ? f.location : "—";
                        const recFilters = Array.isArray(f.filters) ? (f.filters as OpportunityFilter[]) : [];
                        return (
                          <div key={rec.id} className={cx("flex", "gap12", "itemsCenter", "flexBetween")} style={{ paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}>
                            <div>
                              <div className={cx("flex", "gap6", "itemsCenter", "mb4")} style={{ flexWrap: "wrap" }}>
                                <span className={cx("text12")}>{recIndustry}</span>
                                <span className={cx("text12", "colorMuted")}>in</span>
                                <span className={cx("text12")}>{recLocation}</span>
                                <span className={cx("text11", "colorMuted")}>— {rec.resultsCount} result{rec.resultsCount !== 1 ? "s" : ""}</span>
                              </div>
                              <div className={cx("flex", "gap4")} style={{ flexWrap: "wrap" }}>
                                {recFilters.slice(0, 2).map((filt) => (
                                  <span key={filt} className={cx("badge", "badgeMuted")}>{OPPORTUNITY_LABELS[filt]}</span>
                                ))}
                                {recFilters.length > 2 && <span className={cx("badge", "badgeMuted")}>+{recFilters.length - 2}</span>}
                              </div>
                            </div>
                            <div className={cx("flexCol", "gap4", "itemsEnd")}>
                              <span className={cx("text11", "colorMuted")}>{new Date(rec.createdAt).toLocaleDateString()}</span>
                              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => restoreFromHistory(rec)}>Restore</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Automation notice ───────────────────────────────────────────── */}
      <div
        className={cx(styles.card, styles.cardInner)}
        style={{ borderLeft: "3px solid var(--accent)", display: "flex", gap: "12px", alignItems: "flex-start" }}
      >
        <div style={{ flex: 1 }}>
          <div className={cx("flex", "gap8", "itemsCenter", "mb4")}>
            <span className={cx("badge", "badgeAccent")}>Auto</span>
            <span className={cx("text12", "fw600")}>Daily auto-prospecting is active</span>
          </div>
          <div className={cx("text11", "colorMuted")}>
            A scheduled job runs every day at 08:00 — it picks a random industry, city, and filters, finds leads, and sends pitch emails automatically.
            Use this page for manual, on-demand campaigns with custom targeting.
          </div>
        </div>
      </div>

      {/* ── Campaign form ───────────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Campaign Setup</span>
        </div>
        <div className={styles.cardInner}>
          <div className={cx("flex", "gap16", "mb20")} style={{ flexWrap: "wrap" }}>
            {/* Industry */}
            <div className={cx("flexCol", "gap8")} style={{ flex: "1 1 200px" }}>
              <label className={styles.inputLabel}>Industry</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. hair salons, restaurants…"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={running}
                list="prospect-industries"
              />
            </div>
            {/* Location */}
            <div className={cx("flexCol", "gap8")} style={{ flex: "1 1 200px" }}>
              <label className={styles.inputLabel}>Location</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Cape Town, South Africa"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    fetchLocationSuggestions(e.target.value);
                  }}
                  disabled={running}
                  onKeyDown={(e) => {
                    if (!locationDropdownOpen || locationSuggestions.length === 0) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setLocationHighlight((prev) => Math.min(prev + 1, locationSuggestions.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setLocationHighlight((prev) => Math.max(prev - 1, 0));
                    } else if (e.key === "Enter" && locationHighlight >= 0) {
                      e.preventDefault();
                      setLocation(locationSuggestions[locationHighlight]!);
                      setLocationDropdownOpen(false);
                      setLocationHighlight(-1);
                    } else if (e.key === "Escape") {
                      setLocationDropdownOpen(false);
                      setLocationHighlight(-1);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setLocationDropdownOpen(false), 150);
                    if (!industry.trim()) {
                      const idx = industryIdxRef.current % INDUSTRY_SUGGESTIONS.length;
                      industryIdxRef.current = (industryIdxRef.current + 1) % INDUSTRY_SUGGESTIONS.length;
                      setIndustry(INDUSTRY_SUGGESTIONS[idx]!);
                    }
                  }}
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={locationDropdownOpen}
                  aria-haspopup="listbox"
                />
                {locationDropdownOpen && locationSuggestions.length > 0 && (
                  <div
                    role="listbox"
                    style={{
                      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                      background: "var(--s2)", border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)", marginTop: 4,
                      boxShadow: "var(--shadow-card)", overflow: "hidden",
                    }}
                  >
                    {locationFetching && (
                      <div className={cx("text11", "colorMuted")} style={{ padding: "8px 12px" }}>
                        Searching…
                      </div>
                    )}
                    {locationSuggestions.map((name, i) => (
                      <div
                        key={name}
                        role="option"
                        aria-selected={i === locationHighlight}
                        onMouseDown={() => {
                          setLocation(name);
                          setLocationDropdownOpen(false);
                          setLocationHighlight(-1);
                        }}
                        className={cx("text12", "pointerCursor")}
                        style={{
                          padding: "8px 12px",
                          background: i === locationHighlight ? "var(--s3)" : "transparent",
                          borderBottom: i < locationSuggestions.length - 1 ? "1px solid var(--border)" : "none",
                          cursor: "pointer",
                        }}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Count */}
            <div className={cx("flexCol", "gap8")} style={{ flex: "0 0 auto" }}>
              <div className={cx("flex", "gap8", "itemsCenter", "flexBetween")}>
                <label className={styles.inputLabel}>Prospects</label>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={randomizeFields} disabled={running} title="Randomize industry and location">
                  ⟳ Random
                </button>
              </div>
              <div className={cx("flex", "gap10")}>
                {COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={cx("btnSm", count === n ? "btnAccent" : "btnGhost")}
                    onClick={() => setCount(n)}
                    disabled={running}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Opportunity filters */}
          <div className={cx("flexCol", "gap8", "mb24")}>
            <div className={styles.inputLabel}>Opportunity Filters</div>
            <div className={cx("flex", "gap12")} style={{ flexWrap: "wrap" }}>
              {FILTER_OPTIONS.map((f) => {
                const active = selectedFilters.has(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFilter(f.id)}
                    disabled={running}
                    className={cx("btnSm", active ? "btnAccent" : "btnGhost")}
                    title={f.description}
                  >
                    {active ? "✓ " : ""}{f.label}
                  </button>
                );
              })}
            </div>
            <div className={cx("text11", "colorMuted")}>
              Select one or more opportunity types. PageSpeed checks run automatically for
              prospects with websites. Requires SERPAPI_KEY for real results.
            </div>
          </div>

          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            onClick={() => void handleRun()}
            disabled={!canRun}
          >
            {running ? "Finding prospects…" : "Find Prospects"}
          </button>
        </div>
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {running && (
        <div className={cx("flexCol", "gap12")}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={cx(styles.card)}
              style={{ height: 64, opacity: 0.5 + n * 0.1 }}
            />
          ))}
          <div className={cx("text12", "colorMuted", "textCenter")}>
            Searching, running PageSpeed checks, and generating pitch emails — this may take
            20–40 seconds…
          </div>
        </div>
      )}

      {/* ── Error state ──────────────────────────────────────────────────── */}
      {!running && runError && (
        <div className={cx(styles.card, styles.cardInner)}>
          <div className={cx("text13", "colorRed", "mb4")}>Prospecting failed</div>
          <div className={cx("text12", "colorMuted")}>{runError}</div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!running && !runError && hasRun && prospects.length === 0 && (
        <div className={cx(styles.card, styles.cardInner, "textCenter")}>
          <svg
            width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ margin: "0 auto 12px", display: "block", color: "var(--muted)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M11 8v6M8 11h6" />
          </svg>
          <div className={cx("text13", "mb4")}>
            No results for &ldquo;{industry}&rdquo; in {location}
          </div>
          <div className={cx("text12", "colorMuted", "mb16")}>
            SerpAPI returned no local businesses matching this combination. Try a different industry or nearby city.
          </div>
          <div className={cx("flex", "gap8", "justifyCenter")} style={{ flexWrap: "wrap" }}>
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
              onClick={() => {
                const idx = industryIdxRef.current % INDUSTRY_SUGGESTIONS.length;
                industryIdxRef.current = (industryIdxRef.current + 1) % INDUSTRY_SUGGESTIONS.length;
                setIndustry(INDUSTRY_SUGGESTIONS[idx]!);
              }}
            >
              Try different industry
            </button>
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
              onClick={() => {
                const idx = cityIdxRef.current % SA_CITIES.length;
                cityIdxRef.current = (cityIdxRef.current + 1) % SA_CITIES.length;
                setLocation(SA_CITIES[idx]!);
              }}
            >
              Try different city
            </button>
            <button
              type="button"
              className={cx("btnSm", "btnAccent")}
              onClick={() => void handleRun()}
              disabled={!canRun}
            >
              Search again
            </button>
          </div>
        </div>
      )}

      {/* ── Success banner ───────────────────────────────────────────────── */}
      {createDone && (
        <div className={cx(styles.card, styles.cardInner)}>
          <div className={cx("text13", "colorGreen")}>
            Leads created successfully. Navigate to the Leads page to view them in the pipeline.
          </div>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {!running && prospects.length > 0 && (
        <>
          {/* Bulk action bar */}
          <div
            className={cx(styles.card, styles.cardInner, "flexBetween")}
            style={{ flexWrap: "wrap", gap: "8px" }}
          >
            <div className={cx("flex", "gap12", "itemsCenter")} style={{ flexWrap: "wrap" }} aria-live="polite">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all prospects"
              />
              <span className={cx("text12", "colorMuted")}>
                {selectedIds.size > 0
                  ? `${selectedIds.size} of ${prospects.length} selected`
                  : `${prospects.length} prospect${prospects.length !== 1 ? "s" : ""} found`}
              </span>
              {prospects[0]?.source === "mock" && (
                <span className={cx("badge", "badgeMuted")}>
                  Mock data — set SERPAPI_KEY for real results
                </span>
              )}
              {duplicateCount > 0 && (
                <span className={cx("badge", "badgeAmber")}>
                  {duplicateCount} already in pipeline
                </span>
              )}
            </div>
            <div className={cx("flex", "gap8")}>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => exportToCsv(prospects)}
              >
                Export CSV
              </button>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  onClick={() => void handleCreateLeads()}
                  disabled={creating}
                >
                  {creating
                    ? "Creating…"
                    : `Create ${selectedIds.size} Lead${selectedIds.size !== 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          </div>

          {/* Prospect rows */}
          <div className={cx("flexCol", "gap8")}>
            {prospects.map((p, idx) => {
              const isSelected = selectedIds.has(idx);
              const isExpanded = expandedIdx === idx;
              const isDuplicate = duplicates.has(p.company.toLowerCase().trim());

              return (
                <article
                  key={idx}
                  className={styles.card}
                  style={{ outline: isSelected ? "1px solid var(--accent)" : undefined }}
                >
                  <div className={cx(styles.cardHd, "gap12")}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(idx)}
                      aria-label={`Select ${p.company}`}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className={cx("flex", "gap8", "itemsCenter", "mb2")}
                        style={{ flexWrap: "wrap" }}
                      >
                        <span className={styles.cardHdTitle}>{p.company}</span>
                        <span className={cx("badge", opportunityBadgeClass(p.opportunityType))}>
                          {OPPORTUNITY_LABELS[p.opportunityType]}
                        </span>
                        {p.rating !== undefined && (
                          <span className={cx("badge", "badgeMuted")}>
                            ★ {p.rating.toFixed(1)}
                          </span>
                        )}
                        {p.leadScore !== undefined && (
                          <span className={cx("badge", leadScoreBadgeClass(p.leadScore))}>
                            Score {p.leadScore}
                          </span>
                        )}
                        {isDuplicate && (
                          <span className={cx("badge", "badgeMuted")}>Already a lead</span>
                        )}
                      </div>
                      <div className={cx("text11", "colorMuted")}>{p.opportunityReason}</div>
                      {p.contactEmail && (
                        <div className={cx("text11", "colorAccent")} style={{ marginTop: 2 }}>
                          {p.contactEmail}
                        </div>
                      )}
                    </div>

                    <div
                      className={cx("flexCol", "gap4")}
                      style={{ textAlign: "right", flexShrink: 0 }}
                    >
                      {p.website ? (
                        <a
                          href={p.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cx("text11", "colorAccent")}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.website.replace(/^https?:\/\//, "").slice(0, 30)}
                        </a>
                      ) : (
                        <span className={cx("text11", "colorMuted")}>No website</span>
                      )}
                      {p.healthScore !== undefined && (
                        <span className={cx("badge", healthScoreBadgeClass(p.healthScore))}>
                          Perf {p.healthScore}
                        </span>
                      )}
                      {p.contactPhone && (
                        <span className={cx("text11", "colorMuted")}>{p.contactPhone}</span>
                      )}
                      {p.address && (
                        <span className={cx("text11", "colorMuted")}>{p.address}</span>
                      )}
                    </div>

                    <div className={cx("flexCol", "gap4")} style={{ flexShrink: 0 }}>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                      >
                        {isExpanded ? "Hide pitch" : "View pitch"}
                      </button>
                      {p.contactEmail && (
                        <button
                          type="button"
                          className={cx("btnSm", sentPitches.has(idx) ? "btnAccent" : "btnGhost")}
                          disabled={sendingPitchFor.has(idx) || sentPitches.has(idx)}
                          onClick={() => void handleSendPitch(idx, p)}
                          style={sentPitches.has(idx) ? { opacity: 0.7 } : undefined}
                        >
                          {sentPitches.has(idx) ? "✓ Sent" : sendingPitchFor.has(idx) ? "Sending…" : "Send Pitch"}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={cx(styles.cardInner)}>
                      {p.healthIssues && p.healthIssues.length > 0 && (
                        <div
                          className={cx("flex", "gap8", "mb12")}
                          style={{ flexWrap: "wrap", alignItems: "center" }}
                        >
                          <span className={cx("text11", "colorMuted")}>Issues detected:</span>
                          {p.healthIssues.map((issue) => (
                            <span key={issue} className={cx("badge", "badgeRed")}>
                              {issue}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className={cx("text11", "colorMuted", "mb8")}>
                        Claude-generated pitch email:
                      </div>
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          fontSize: 12,
                          lineHeight: 1.6,
                          margin: 0,
                          fontFamily: "inherit"
                        }}
                      >
                        {p.pitch || "(No pitch generated)"}
                      </pre>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      <datalist id="prospect-industries">
        {INDUSTRY_SUGGESTIONS.map((i) => <option key={i} value={i} />)}
      </datalist>
    </div>
  );
}
