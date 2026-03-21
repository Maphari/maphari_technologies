// ════════════════════════════════════════════════════════════════════════════
// sentiment-flags-page.tsx — Staff Client Sentiment Flags
// Data : GET  /staff/client-sentiments → StaffClientSentiment[]
//        PATCH /staff/client-sentiments/:clientId → update sentiment
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import {
  getStaffClientSentiments,
  updateStaffClientSentiment,
  type StaffClientSentiment,
} from "../../../../lib/api/staff/clients";
import { saveSession, type AuthSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type SentimentFlagsPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Types ─────────────────────────────────────────────────────────────────────

type UISentiment = "positive" | "neutral" | "at_risk";
type SignalType  = "positive" | "neutral" | "negative";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toUI(api: string): UISentiment {
  if (api === "POSITIVE") return "positive";
  if (api === "NEUTRAL")  return "neutral";
  return "at_risk";
}

function toAPI(ui: UISentiment): "POSITIVE" | "NEUTRAL" | "AT_RISK" {
  if (ui === "positive") return "POSITIVE";
  if (ui === "neutral")  return "NEUTRAL";
  return "AT_RISK";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ── Config ────────────────────────────────────────────────────────────────────

const sentimentConfig: Record<UISentiment, {
  label: string; icon: string; description: string; toneClass: string;
  bgClass: string; borderClass: string; filterClass: string;
  portfolioClass: string; topBorderClass: string;
}> = {
  positive: {
    label: "Positive", icon: "◉",
    description: "Client is engaged, responsive, and satisfied.",
    toneClass: "sfTonePositive", bgClass: "sfBgPositive", borderClass: "sfBorderPositive",
    filterClass: "sfFilterPositive", portfolioClass: "sfPortfolioPositive", topBorderClass: "sfTopBorderPositive"
  },
  neutral: {
    label: "Neutral", icon: "◎",
    description: "No major concerns. Relationship is steady.",
    toneClass: "sfToneNeutral", bgClass: "sfBgNeutral", borderClass: "sfBorderNeutral",
    filterClass: "sfFilterNeutral", portfolioClass: "sfPortfolioNeutral", topBorderClass: "sfTopBorderNeutral"
  },
  at_risk: {
    label: "At Risk", icon: "◌",
    description: "Client showing signs of friction, disengagement, or dissatisfaction.",
    toneClass: "sfToneRisk", bgClass: "sfBgRisk", borderClass: "sfBorderRisk",
    filterClass: "sfFilterRisk", portfolioClass: "sfPortfolioRisk", topBorderClass: "sfTopBorderRisk"
  }
};

const signalColors: Record<SignalType, string> = {
  positive: "sfSignalPositive",
  neutral:  "sfSignalNeutral",
  negative: "sfSignalNegative"
};

// ── Page component ────────────────────────────────────────────────────────────

export function SentimentFlagsPage({ isActive, session }: SentimentFlagsPageProps) {
  const [clients, setClients]             = useState<StaffClientSentiment[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);
  const [selected, setSelected]           = useState<string | null>(null);
  const [editMode, setEditMode]           = useState(false);
  const [draftSentiment, setDraftSentiment] = useState<UISentiment | null>(null);
  const [draftNote, setDraftNote]         = useState("");
  const [filter, setFilter]               = useState<"all" | UISentiment>("all");

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void getStaffClientSentiments(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setClients(r.data);
        if (r.data.length > 0) setSelected(r.data[0].clientId);
      }
    }).catch((err) => {
      const msg = (err as Error)?.message ?? "Failed to load";
      setError(msg);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken]);

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!session || !selected || !draftSentiment || saving) return;
    setSaving(true);
    const r = await updateStaffClientSentiment(session, selected, {
      sentiment: toAPI(draftSentiment),
      note: draftNote || undefined,
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) {
      setClients((prev) =>
        prev.map((c) =>
          c.clientId === selected
            ? { ...c, sentiment: r.data!.sentiment as StaffClientSentiment["sentiment"], lastUpdated: new Date().toISOString() }
            : c
        )
      );
    }
    setSaving(false);
    setEditMode(false);
  }, [session, selected, draftSentiment, draftNote, saving]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const current = clients.find((c) => c.clientId === selected) ?? clients[0] ?? null;

  const filtered = useMemo(
    () => clients.filter((c) => filter === "all" ? true : toUI(c.sentiment) === filter),
    [clients, filter]
  );

  const counts = useMemo(() => ({
    positive: clients.filter((c) => toUI(c.sentiment) === "positive").length,
    neutral:  clients.filter((c) => toUI(c.sentiment) === "neutral").length,
    at_risk:  clients.filter((c) => toUI(c.sentiment) === "at_risk").length,
  }), [clients]);

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-sentiment-flags">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-sentiment-flags">
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  if (!current) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-sentiment-flags">
        <div className={cx("pageHeaderBar", "pb20")}>
          <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
          <h1 className={cx("pageTitleText")}>Sentiment Flags</h1>
        </div>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="target" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No client sentiment data</div>
          <div className={cx("emptyStateSub")}>Sentiment data will appear once clients are assigned to you.</div>
        </div>
      </section>
    );
  }

  const cfg       = sentimentConfig[toUI(current.sentiment)];
  const currentUI = toUI(current.sentiment);

  return (
    <section
      className={cx("page", "pageBody", isActive && "pageActive")}
      id="page-sentiment-flags"
      style={isActive ? { height: "100%", display: "flex", flexDirection: "column", padding: 0 } : undefined}
    >
      <div className={cx("pageHeaderBar", "pb20", "noShrink")}>
        <div className={cx("flexBetween", "mb20", "itemsStart")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
            <h1 className={cx("pageTitleText")}>Sentiment Flags</h1>
          </div>
          <div className={cx("flexRow", "gap20")}>
            {Object.entries(sentimentConfig).map(([key, conf]) => (
              <div key={key} className={cx("textRight")}>
                <div className={cx("statLabelNew")}>{conf.label}</div>
                <div className={cx("statValueNew", conf.toneClass)}>{counts[key as UISentiment]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter pills */}
        <div className={cx("sfFilterPills")}>
          {([
            { value: "all",      label: "All",      activeClass: "sfFilterPillActiveAll",      idleClass: "sfFilterPillIdle",        count: clients.length },
            { value: "positive", label: "Positive", activeClass: "sfFilterPillActivePositive", idleClass: "sfFilterPillIdlePositive", count: counts.positive },
            { value: "neutral",  label: "Neutral",  activeClass: "sfFilterPillActiveNeutral",  idleClass: "sfFilterPillIdleNeutral",  count: counts.neutral },
            { value: "at_risk",  label: "At Risk",  activeClass: "sfFilterPillActiveRisk",     idleClass: "sfFilterPillIdleRisk",     count: counts.at_risk },
          ] as const).map((tab) => {
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                className={cx("sfFilterPill", active ? "sfFilterPillActive" : "sfFilterPillIdle")}
                onClick={() => setFilter(tab.value)}
              >
                {tab.label}
                <span className={cx("sfFilterPillCount")}>{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={cx("sfLayout")}>
        {/* ── Sidebar ── */}
        <div className={cx("flexCol", "gap8", "p16", "sfSidebar")}>
          {filtered.map((client) => {
            const clientUI  = toUI(client.sentiment);
            const clientCfg = sentimentConfig[clientUI];
            const isSel     = selected === client.clientId;
            return (
              <div
                key={client.clientId}
                className={cx("sfClientRow", "sfClientCard", isSel ? clientCfg.portfolioClass : "sfClientCardIdle")}
                onClick={() => { setSelected(client.clientId); setEditMode(false); }}
              >
                <div className={cx("flexRow", "gap10", "mb8")}>
                  <div className={cx("avatarMd", "text10", "colorMuted")}>{initials(client.clientName)}</div>
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("text12", "truncate", isSel ? "colorText" : "colorMuted")}>{client.clientName}</div>
                    <div className={cx("text10", "colorMuted2", "mt1")}>Score: {client.score}</div>
                  </div>
                  <div className={cx("flexCol", "itemsEnd", "gap3")}>
                    <span className={cx("sfClientSentimentIcon", clientCfg.toneClass)}>{clientCfg.icon}</span>
                    <span className={cx("uppercase", "sfClientSentimentLabel", clientCfg.toneClass)}>{clientCfg.label}</span>
                  </div>
                </div>
                <div className={cx("text10", "mt6", "sfUpdatedText")}>Updated {fmtDate(client.lastUpdated)}</div>
              </div>
            );
          })}
        </div>

        {/* ── Detail pane ── */}
        <div className={cx("flexCol", "gap20", "sfDetailPane")}>
          <div className={cx("flexBetween", "itemsStart")}>
            <div>
              <div className={cx("fontDisplay", "fw800", "colorText", "mb4", "sfClientTitle")}>{current.clientName}</div>
              <div className={cx("text11", "colorMuted2")}>Updated {fmtDate(current.lastUpdated)}</div>
            </div>
            {!editMode && (
              <button
                type="button"
                className={`${cx("sfEditBtn")} ${cx("accentBtnBase")}`}
                onClick={() => { setDraftSentiment(currentUI); setDraftNote(""); setEditMode(true); }}
              >
                Update flag
              </button>
            )}
          </div>

          {editMode ? (
            <div className={cx("flexCol", "gap20", "sfEditWrap")}>
              <div className={cx("sectionLabel", "mb4")}>Set Sentiment</div>
              <div className={cx("flexRow", "gap10")}>
                {Object.entries(sentimentConfig).map(([key, entryCfg]) => (
                  <button
                    key={key}
                    type="button"
                    className={cx("sfSentimentBtn", "sfSentimentChoice", draftSentiment === key ? entryCfg.portfolioClass : "sfSentimentChoiceIdle")}
                    onClick={() => setDraftSentiment(key as UISentiment)}
                  >
                    <span className={cx("sfChoiceIcon", entryCfg.toneClass)}>{entryCfg.icon}</span>
                    <span className={cx("text11", "uppercase", draftSentiment === key ? entryCfg.toneClass : "colorMuted2")}>{entryCfg.label}</span>
                    <span className={cx("text10", "colorMuted2", "textCenter", "lh14")}>{entryCfg.description}</span>
                  </button>
                ))}
              </div>
              <div>
                <div className={cx("sectionLabel", "mb10")}>Note</div>
                <textarea
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="What's driving this sentiment? Be specific."
                  className={cx("inputBase", "wFull", "text12", "sfNoteInput")}
                />
              </div>
              <div className={cx("flexRow", "gap10")}>
                <button
                  type="button"
                  className={`${cx("sfSaveBtn")} ${cx("saveBtnBase")}`}
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  {saving ? "Saving…" : "Save flag"}
                </button>
                <button type="button" className={cx("cancelBtnBase")} onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={cx("sfDetailGrid")}>
              <div className={cx("flexCol", "gap20")}>
                <div className={cx("sfCurrentCard", cfg.bgClass, cfg.borderClass)}>
                  <div className={cx("flexRow", "gap14", "mb14")}>
                    <span className={cx("sfCurrentIcon", cfg.toneClass)}>{cfg.icon}</span>
                    <div>
                      <div className={cx("fontDisplay", "fw800", "sfCurrentLabel", cfg.toneClass)}>{cfg.label}</div>
                      <div className={cx("text11", "colorMuted2", "mt2")}>Score: {current.score} / 100</div>
                    </div>
                  </div>
                  <div className={cx("text13", "colorMuted", "sfCurrentNote", cfg.topBorderClass)}>
                    Last updated {fmtDate(current.lastUpdated)}
                  </div>
                </div>

                <div>
                  <div className={cx("sectionLabel", "mb12")}>Recent Signals</div>
                  {current.signals.length === 0 ? (
                    <div className={cx("text12", "colorMuted2")}>No signals recorded for this client.</div>
                  ) : (
                    <div className={cx("flexCol", "gap6")}>
                      {current.signals.map((signal, idx) => (
                        <div key={idx} className={cx("flexRow", "gap10", "cardSurface")}>
                          <div className={cx("signalDot", signalColors[signal.type as SignalType] ?? "sfSignalNeutral")} />
                          <span className={cx("text12", "colorMuted")}>{signal.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio overview */}
              <div className={cx("flexCol", "gap14")}>
                <div className={cx("sectionLabel", "mb4")}>Portfolio Sentiment</div>
                {clients.map((client) => {
                  const clientUI  = toUI(client.sentiment);
                  const clientCfg = sentimentConfig[clientUI];
                  const isCurr    = client.clientId === current.clientId;
                  return (
                    <div
                      key={`portfolio-${client.clientId}`}
                      onClick={() => { setSelected(client.clientId); setEditMode(false); }}
                      className={cx("flexRow", "gap10", "pointerCursor", "sfPortfolioRow", isCurr ? clientCfg.portfolioClass : "sfPortfolioIdle")}
                    >
                      <span className={cx("noShrink", "sfPortfolioIcon", clientCfg.toneClass)}>{clientCfg.icon}</span>
                      <div className={cx("flex1", "minW0")}>
                        <div className={cx("text11", "truncate", isCurr ? "colorText" : "colorMuted")}>{client.clientName}</div>
                        <div className={cx("uppercase", "mt4", "sfPortfolioLabel", clientCfg.toneClass)}>{clientCfg.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
