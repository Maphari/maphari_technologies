"use client";

import { useMemo, useState } from "react";
import { cx, styles } from "../style";

type Sentiment = "positive" | "neutral" | "at_risk";
type SignalType = "positive" | "neutral" | "negative";

type ClientSignal = {
  type: SignalType;
  text: string;
};

type SentimentHistoryRow = {
  sentiment: Sentiment;
  note: string;
  date: string;
  by: string;
};

type SentimentClient = {
  id: number;
  name: string;
  avatar: string;
  project: string;
  contact: string;
  sentiment: Sentiment;
  sentimentNote: string;
  sentimentUpdatedAt: string;
  sentimentUpdatedBy: string;
  history: SentimentHistoryRow[];
  signals: ClientSignal[];
};

const initialClients: SentimentClient[] = [
  {
    id: 1,
    name: "Volta Studios",
    avatar: "VS",
    project: "Brand Identity System",
    contact: "Lena Muller",
    sentiment: "positive",
    sentimentNote: "Responsive, engaged, loves the direction. No friction.",
    sentimentUpdatedAt: "Today",
    sentimentUpdatedBy: "You",
    history: [
      { sentiment: "positive", note: "Responsive, engaged, loves the direction. No friction.", date: "Feb 22", by: "You" },
      { sentiment: "neutral", note: "Quiet after first concepts - hard to read.", date: "Feb 10", by: "You" },
      { sentiment: "positive", note: "Strong kickoff - very aligned on brief.", date: "Jan 9", by: "You" }
    ],
    signals: [
      { type: "positive", text: "Replied within 2h yesterday" },
      { type: "positive", text: "Approved milestone ahead of schedule" },
      { type: "positive", text: "Paid invoice 3 days early" }
    ]
  },
  {
    id: 2,
    name: "Kestrel Capital",
    avatar: "KC",
    project: "Q1 Campaign Strategy",
    contact: "Marcus Rehn",
    sentiment: "at_risk",
    sentimentNote: "Invoice overdue 7 days, 3 messages unanswered. AP issues likely but relationship feels fragile.",
    sentimentUpdatedAt: "2 days ago",
    sentimentUpdatedBy: "You",
    history: [
      { sentiment: "at_risk", note: "Invoice overdue, messages unanswered.", date: "Feb 20", by: "You" },
      { sentiment: "neutral", note: "Slow to respond but reliable. No major concerns.", date: "Feb 8", by: "You" },
      { sentiment: "neutral", note: "Good kickoff but slower feedback loop than expected.", date: "Jan 22", by: "You" }
    ],
    signals: [
      { type: "negative", text: "Invoice 7 days overdue" },
      { type: "negative", text: "3 messages unanswered" },
      { type: "negative", text: "Milestone approval 5 days late" }
    ]
  },
  {
    id: 3,
    name: "Mira Health",
    avatar: "MH",
    project: "Website Redesign",
    contact: "Dr. Amara Nkosi",
    sentiment: "neutral",
    sentimentNote: "Solid but demanding. Clinical review delays are frustrating her team - nothing personal.",
    sentimentUpdatedAt: "Yesterday",
    sentimentUpdatedBy: "You",
    history: [
      { sentiment: "neutral", note: "Solid but demanding. Clinical review delays frustrating her team.", date: "Feb 21", by: "You" },
      { sentiment: "positive", note: "Loved the initial wireframe direction - very enthusiastic.", date: "Feb 5", by: "You" }
    ],
    signals: [
      { type: "positive", text: "Responsive and engaged on calls" },
      { type: "neutral", text: "Clinical delays creating tension" },
      { type: "neutral", text: "1 revision request - reasonable" }
    ]
  },
  {
    id: 4,
    name: "Dune Collective",
    avatar: "DC",
    project: "Editorial Design System",
    contact: "Kofi Asante",
    sentiment: "at_risk",
    sentimentNote: "6 days silent. Project overdue. No explanation given. High escalation risk.",
    sentimentUpdatedAt: "Today",
    sentimentUpdatedBy: "You",
    history: [
      { sentiment: "at_risk", note: "6 days silent, project overdue, escalation risk.", date: "Feb 22", by: "You" },
      { sentiment: "neutral", note: "Kofi went quiet for a week then came back with feedback. Normal pattern.", date: "Feb 1", by: "You" },
      { sentiment: "positive", note: "Very enthusiastic about editorial direction. Good energy at kickoff.", date: "Nov 5", by: "You" }
    ],
    signals: [
      { type: "negative", text: "6 days without response" },
      { type: "negative", text: "Milestone 12 days overdue" },
      { type: "negative", text: "Retainer exceeded" }
    ]
  },
  {
    id: 5,
    name: "Okafor & Sons",
    avatar: "OS",
    project: "Annual Report 2025",
    contact: "Chidi Okafor",
    sentiment: "positive",
    sentimentNote: "Dream client. Fast, appreciative, pays early. Keep this relationship warm.",
    sentimentUpdatedAt: "3 days ago",
    sentimentUpdatedBy: "You",
    history: [
      { sentiment: "positive", note: "Dream client. Fast, appreciative, pays early.", date: "Feb 19", by: "You" },
      { sentiment: "positive", note: "Strong relationship from day one.", date: "Jan 15", by: "You" }
    ],
    signals: [
      { type: "positive", text: "Paid invoice 5 days early" },
      { type: "positive", text: "Approved milestone with no changes" },
      { type: "positive", text: "Sent unsolicited positive feedback" }
    ]
  }
];

const sentimentConfig: Record<
  Sentiment,
  {
    label: string;
    icon: string;
    description: string;
    toneClass: string;
    bgClass: string;
    borderClass: string;
    filterClass: string;
    portfolioClass: string;
    topBorderClass: string;
  }
> = {
  positive: {
    label: "Positive",
    icon: "◉",
    description: "Client is engaged, responsive, and satisfied.",
    toneClass: "sfTonePositive",
    bgClass: "sfBgPositive",
    borderClass: "sfBorderPositive",
    filterClass: "sfFilterPositive",
    portfolioClass: "sfPortfolioPositive",
    topBorderClass: "sfTopBorderPositive"
  },
  neutral: {
    label: "Neutral",
    icon: "◎",
    description: "No major concerns. Relationship is steady.",
    toneClass: "sfToneNeutral",
    bgClass: "sfBgNeutral",
    borderClass: "sfBorderNeutral",
    filterClass: "sfFilterNeutral",
    portfolioClass: "sfPortfolioNeutral",
    topBorderClass: "sfTopBorderNeutral"
  },
  at_risk: {
    label: "At Risk",
    icon: "◌",
    description: "Client showing signs of friction, disengagement, or dissatisfaction.",
    toneClass: "sfToneRisk",
    bgClass: "sfBgRisk",
    borderClass: "sfBorderRisk",
    filterClass: "sfFilterRisk",
    portfolioClass: "sfPortfolioRisk",
    topBorderClass: "sfTopBorderRisk"
  }
};

const signalColors: Record<SignalType, string> = {
  positive: "sfSignalPositive",
  neutral: "sfSignalNeutral",
  negative: "sfSignalNegative"
};

export function SentimentFlagsPage({ isActive }: { isActive: boolean }) {
  const [clients, setClients] = useState(initialClients);
  const [selected, setSelected] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [draftSentiment, setDraftSentiment] = useState<Sentiment | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [filter, setFilter] = useState<"all" | Sentiment>("all");
  const [showHistory, setShowHistory] = useState(false);

  const current = clients.find((client) => client.id === selected) ?? clients[0];
  const cfg = sentimentConfig[current.sentiment];

  const filtered = useMemo(
    () => clients.filter((client) => (filter === "all" ? true : client.sentiment === filter)),
    [clients, filter]
  );

  const counts = useMemo(
    () => ({
      positive: clients.filter((client) => client.sentiment === "positive").length,
      neutral: clients.filter((client) => client.sentiment === "neutral").length,
      at_risk: clients.filter((client) => client.sentiment === "at_risk").length
    }),
    [clients]
  );

  const handleEdit = () => {
    setDraftSentiment(current.sentiment);
    setDraftNote(current.sentimentNote);
    setEditMode(true);
  };

  const handleSave = () => {
    if (!draftSentiment) return;
    setClients((previous) =>
      previous.map((client) => {
        if (client.id !== selected) return client;
        const newEntry: SentimentHistoryRow = {
          sentiment: draftSentiment,
          note: draftNote,
          date: "Today",
          by: "You"
        };
        return {
          ...client,
          sentiment: draftSentiment,
          sentimentNote: draftNote,
          sentimentUpdatedAt: "Just now",
          sentimentUpdatedBy: "You",
          history: [newEntry, ...client.history]
        };
      })
    );
    setEditMode(false);
  };

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-sentiment-flags">
      <div className={cx("pageHeaderBar", "pb20")}>
        <div className={cx("flexBetween", "mb20", "itemsStart")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>
              Staff Dashboard / Client Intelligence
            </div>
            <h1 className={cx("pageTitleText")}>
              Sentiment Flags
            </h1>
          </div>
          <div className={cx("flexRow", "gap20")}>
            {Object.entries(sentimentConfig).map(([key, conf]) => (
              <div key={key} className={cx("textRight")}>
                <div className={cx("statLabelNew")}>
                  {conf.label}
                </div>
                <div className={cx("statValueNew", conf.toneClass)}>
                  {counts[key as Sentiment]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("filterRow")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter sentiment"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | Sentiment)}
          >
            <option value="all">All clients</option>
            {Object.entries(sentimentConfig).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.sfLayout}>
        <div className={cx("flexCol", "gap8", "p16", "sfSidebar")}>
          {filtered.map((client) => {
            const clientCfg = sentimentConfig[client.sentiment];
            const isSelected = selected === client.id;
            return (
              <div
                key={client.id}
                className={cx(styles.sfClientRow, "sfClientCard", isSelected ? clientCfg.portfolioClass : "sfClientCardIdle")}
                onClick={() => {
                  setSelected(client.id);
                  setEditMode(false);
                  setShowHistory(false);
                }}
              >
                <div className={cx("flexRow", "gap10", "mb8")}>
                  <div className={cx("avatarMd", "text10", "colorMuted")}>
                    {client.avatar}
                  </div>
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("text12", "truncate", isSelected ? "colorText" : "colorMuted")}>{client.name}</div>
                    <div className={cx("text10", "colorMuted2", "mt1")}>{client.contact}</div>
                  </div>
                  <div className={cx("flexCol", "itemsEnd", "gap3")}>
                    <span className={cx("sfClientSentimentIcon", clientCfg.toneClass)}>{clientCfg.icon}</span>
                    <span className={cx("uppercase", "sfClientSentimentLabel", clientCfg.toneClass)}>{clientCfg.label}</span>
                  </div>
                </div>
                <div className={cx("text11", "colorMuted2", styles.sfIndicator)}>{client.sentimentNote}</div>
                <div className={cx("text10", "mt6", "sfUpdatedText")}>Updated {client.sentimentUpdatedAt}</div>
              </div>
            );
          })}
        </div>

        <div className={cx("flexCol", "gap20", "sfDetailPane")}>
          <div className={cx("flexBetween", "itemsStart")}>
            <div>
              <div className={cx("fontDisplay", "fw800", "colorText", "mb4", "sfClientTitle")}>{current.name}</div>
              <div className={cx("text11", "colorMuted2")}>
                {current.contact} · {current.project}
              </div>
            </div>
            <div className={cx("flexRow", "gap8")}>
              <button
                type="button"
                className={cx(styles.sfEditBtn, "sfHistoryBtn")}
                onClick={() => setShowHistory((value) => !value)}
              >
                {showHistory ? "← Back" : "History"}
              </button>
              {!editMode && !showHistory ? (
                <button
                  type="button"
                  className={`${styles.sfEditBtn} ${cx("accentBtnBase")}`}
                  onClick={handleEdit}
                >
                  Update flag
                </button>
              ) : null}
            </div>
          </div>

          {showHistory ? (
            <div className={cx("sfHistoryWrap")}>
              <div className={cx("sectionLabel", "mb16")}>Sentiment History</div>
              <div className={cx("flexCol")}>
                {current.history.map((entry, index) => {
                  const entryCfg = sentimentConfig[entry.sentiment];
                  return (
                    <div key={`${entry.date}-${index}`} className={cx("flexRow", "gap16", "sfHistoryRow")}>
                      <div className={cx("flexCol", "noShrink", "sfHistoryCol")}>
                        <span className={cx("sfHistoryIcon", entryCfg.toneClass)}>{entryCfg.icon}</span>
                        {index < current.history.length - 1 ? <div className={cx("flex1", "sfHistoryRail")} /> : null}
                      </div>
                      <div className={cx("flex1")}>
                        <div className={cx("flexRow", "gap10", "mb6")}>
                          <span className={cx("text11", "uppercase", entryCfg.toneClass)}>{entryCfg.label}</span>
                          <span className={cx("text10", "colorMuted2")}>{entry.date} · {entry.by}</span>
                        </div>
                        <div className={cx("text12", "colorMuted", "lh16")}>{entry.note}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : editMode ? (
            <div className={cx("flexCol", "gap20", "sfEditWrap")}>
              <div className={cx("sectionLabel", "mb4")}>Set Sentiment</div>
              <div className={cx("flexRow", "gap10")}>
                {Object.entries(sentimentConfig).map(([key, entryCfg]) => (
                  <button
                    key={key}
                    type="button"
                    className={cx(styles.sfSentimentBtn, "sfSentimentChoice", draftSentiment === key ? entryCfg.portfolioClass : "sfSentimentChoiceIdle")}
                    onClick={() => setDraftSentiment(key as Sentiment)}
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
                  onChange={(event) => setDraftNote(event.target.value)}
                  placeholder="What's driving this sentiment? Be specific - this will be visible in the history."
                  className={cx("inputBase", "wFull", "text12", "sfNoteInput")}
                />
              </div>

              <div className={cx("flexRow", "gap10")}>
                <button
                  type="button"
                  className={`${styles.sfSaveBtn} ${cx("saveBtnBase")}`}
                  onClick={handleSave}
                >
                  Save flag
                </button>
                <button
                  type="button"
                  className={cx("cancelBtnBase")}
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.sfDetailGrid}>
              <div className={cx("flexCol", "gap20")}>
                <div className={cx("sfCurrentCard", cfg.bgClass, cfg.borderClass)}>
                  <div className={cx("flexRow", "gap14", "mb14")}>
                    <span className={cx("sfCurrentIcon", cfg.toneClass)}>{cfg.icon}</span>
                    <div>
                      <div className={cx("fontDisplay", "fw800", "sfCurrentLabel", cfg.toneClass)}>{cfg.label}</div>
                      <div className={cx("text11", "colorMuted2", "mt2")}>
                        Updated {current.sentimentUpdatedAt} by {current.sentimentUpdatedBy}
                      </div>
                    </div>
                  </div>
                  <div className={cx("text13", "colorMuted", "sfCurrentNote", cfg.topBorderClass)}>
                    {current.sentimentNote}
                  </div>
                </div>

                <div>
                  <div className={cx("sectionLabel", "mb12")}>Recent Signals</div>
                  <div className={cx("flexCol", "gap6")}>
                    {current.signals.map((signal, index) => (
                      <div key={`${signal.text}-${index}`} className={cx("flexRow", "gap10", "cardSurface")}>
                        <div className={cx(styles.signalDot, signalColors[signal.type])} />
                        <span className={cx("text12", "colorMuted")}>{signal.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={cx("flexCol", "gap14")}>
                <div className={cx("sectionLabel", "mb4")}>Portfolio Sentiment</div>
                {clients.map((client) => {
                  const clientCfg = sentimentConfig[client.sentiment];
                  const isCurrent = client.id === current.id;
                  return (
                    <div
                      key={`portfolio-${client.id}`}
                      onClick={() => {
                        setSelected(client.id);
                        setEditMode(false);
                        setShowHistory(false);
                      }}
                      className={cx("flexRow", "gap10", "pointerCursor", "sfPortfolioRow", isCurrent ? clientCfg.portfolioClass : "sfPortfolioIdle")}
                    >
                      <span className={cx("noShrink", "sfPortfolioIcon", clientCfg.toneClass)}>{clientCfg.icon}</span>
                      <div className={cx("flex1", "minW0")}>
                        <div className={cx("text11", "truncate", isCurrent ? "colorText" : "colorMuted")}>{client.name}</div>
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
