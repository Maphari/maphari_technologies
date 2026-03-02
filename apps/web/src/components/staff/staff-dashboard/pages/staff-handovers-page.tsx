"use client";

import { useState } from "react";
import { cx } from "../style";

type StaffMember = {
  id: number;
  name: string;
  avatar: string;
  toneClass: string;
  surfaceClass: string;
  role: string;
};

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  toneClass: string;
  surfaceClass: string;
  softSurfaceClass: string;
  borderClass: string;
  project: string;
};

type HandoverUrgency = "critical" | "high" | "medium" | "low";
type HandoverStatus = "active" | "complete" | "draft";

type HandoverItem = {
  id: number;
  fromId: number;
  toId: number;
  clientId: number;
  title: string;
  urgency: HandoverUrgency;
  context: string;
  openItems: string[];
  clientNotes: string;
  credentials: string;
  dueDate: string;
  myReturnDate: string;
  status: HandoverStatus;
  createdAt: string;
  acknowledged: boolean;
};

type Draft = {
  toId: number;
  clientId: number;
  title: string;
  urgency: HandoverUrgency;
  context: string;
  openItems: string[];
  clientNotes: string;
  credentials: string;
  dueDate: string;
  myReturnDate: string;
};

const staff: StaffMember[] = [
  { id: 1, name: "You", avatar: "YU", toneClass: "shToneAccent", surfaceClass: "shSurfaceAccent", role: "Senior Designer" },
  { id: 2, name: "Priya Nair", avatar: "PN", toneClass: "shTonePurple", surfaceClass: "shSurfacePurple", role: "Brand Strategist" },
  { id: 3, name: "James Osei", avatar: "JO", toneClass: "shToneBlue", surfaceClass: "shSurfaceBlue", role: "Junior Designer" },
  { id: 4, name: "Zara Hoffman", avatar: "ZH", toneClass: "shToneAmber", surfaceClass: "shSurfaceAmber", role: "Account Manager" },
  { id: 5, name: "Luca Ferreira", avatar: "LF", toneClass: "shToneOrange", surfaceClass: "shSurfaceOrange", role: "Motion Designer" }
];

const clients: ClientRow[] = [
  {
    id: 1,
    name: "Volta Studios",
    avatar: "VS",
    toneClass: "shToneAccent",
    surfaceClass: "shSurfaceAccent",
    softSurfaceClass: "shSoftSurfaceAccent",
    borderClass: "shBorderAccent",
    project: "Brand Identity System"
  },
  {
    id: 2,
    name: "Kestrel Capital",
    avatar: "KC",
    toneClass: "shTonePurple",
    surfaceClass: "shSurfacePurple",
    softSurfaceClass: "shSoftSurfacePurple",
    borderClass: "shBorderPurple",
    project: "Q1 Campaign Strategy"
  },
  {
    id: 3,
    name: "Mira Health",
    avatar: "MH",
    toneClass: "shToneBlue",
    surfaceClass: "shSurfaceBlue",
    softSurfaceClass: "shSoftSurfaceBlue",
    borderClass: "shBorderBlue",
    project: "Website Redesign"
  },
  {
    id: 4,
    name: "Dune Collective",
    avatar: "DC",
    toneClass: "shToneAmber",
    surfaceClass: "shSurfaceAmber",
    softSurfaceClass: "shSoftSurfaceAmber",
    borderClass: "shBorderAmber",
    project: "Editorial Design System"
  },
  {
    id: 5,
    name: "Okafor & Sons",
    avatar: "OS",
    toneClass: "shToneOrange",
    surfaceClass: "shSurfaceOrange",
    softSurfaceClass: "shSoftSurfaceOrange",
    borderClass: "shBorderOrange",
    project: "Annual Report 2025"
  }
];

const urgencyConfig: Record<
  HandoverUrgency,
  { label: string; cardClass: string; badgeClass: string; iconClass: string; dotClass: string }
> = {
  critical: {
    label: "Critical",
    cardClass: "shCardUrgencyCritical",
    badgeClass: "shBadgeUrgencyCritical",
    iconClass: "shToneRed",
    dotClass: "shDotRed"
  },
  high: {
    label: "High",
    cardClass: "shCardUrgencyHigh",
    badgeClass: "shBadgeUrgencyHigh",
    iconClass: "shToneOrange",
    dotClass: "shDotOrange"
  },
  medium: {
    label: "Medium",
    cardClass: "shCardUrgencyMedium",
    badgeClass: "shBadgeUrgencyMedium",
    iconClass: "shToneAmber",
    dotClass: "shDotAmber"
  },
  low: {
    label: "Low",
    cardClass: "shCardUrgencyLow",
    badgeClass: "shBadgeUrgencyLow",
    iconClass: "shToneMuted",
    dotClass: "shDotMuted"
  }
};

const initialHandovers: HandoverItem[] = [
  {
    id: 1,
    fromId: 1,
    toId: 3,
    clientId: 1,
    title: "Brand guidelines - cover the logo section while I am out",
    urgency: "high",
    context:
      "Lena approved the logo on Feb 22. The brand guidelines doc is in Drive > Volta > Brand Guidelines v1. Section 1 (logo usage) is 60% done - I drafted the clear space rules and misuse examples but have not done the responsive sizing chart yet.\n\nUse the sizing from the master Figma file (Volta / Logo / Sizing grid). The template for the chart is already on page 4.",
    openItems: [
      "Complete responsive logo sizing chart (Figma reference linked in Drive doc)",
      "Write the colour-on-colour usage rules - lime on dark, dark on white",
      "Do not approve any milestone until I am back - Lena prefers to deal with me directly"
    ],
    clientNotes: "Lena communicates via portal messages only. She replies fast in the mornings (9-11 AM). Do not CC Tobias on anything.",
    credentials: "Figma access already shared. Drive folder: Clients / Volta Studios / Brand Identity",
    dueDate: "Mar 1",
    myReturnDate: "Feb 28",
    status: "active",
    createdAt: "Feb 23",
    acknowledged: false
  },
  {
    id: 2,
    fromId: 4,
    toId: 1,
    clientId: 4,
    title: "Monitor Dune situation - escalate if needed",
    urgency: "critical",
    context:
      "Kofi Asante has been silent for 6 days. I sent 3 follow-ups. The Type & Grid System milestone is 12 days past due and the retainer has been exceeded by 4.5 hours.\n\nI am stepping away from this client for 2 weeks (holiday). You are the point of contact. Do not do any more billable work until Kofi responds and approves the exceeded hours.",
    openItems: [
      "Send one final follow-up message (template in SOPs > Comms)",
      "If no response by Feb 28 - escalate to director (email Sofia)",
      "Do not begin the Master Template milestone under any circumstances",
      "Log this handover in the decision log"
    ],
    clientNotes:
      "Kofi goes silent for 5-10 days, then comes back. This may be normal. But the retainer overage is new - that is the urgent bit. Keep tone warm but firm.",
    credentials: "Full project files in Drive > Dune Collective > Editorial Design. InDesign files in Packaging folder.",
    dueDate: "Mar 6",
    myReturnDate: "Mar 8",
    status: "active",
    createdAt: "Feb 22",
    acknowledged: true
  }
];

const statusConfig: Record<HandoverStatus, { label: string; badgeClass: string }> = {
  active: { label: "Active", badgeClass: "shBadgeStatusActive" },
  complete: { label: "Complete", badgeClass: "shBadgeStatusComplete" },
  draft: { label: "Draft", badgeClass: "shBadgeStatusDraft" }
};

const emptyDraft: Draft = {
  toId: 3,
  clientId: 1,
  title: "",
  urgency: "medium",
  context: "",
  openItems: [""],
  clientNotes: "",
  credentials: "",
  dueDate: "",
  myReturnDate: ""
};

export function StaffHandoversPage({ isActive }: { isActive: boolean }) {
  const [handovers, setHandovers] = useState<HandoverItem[]>(initialHandovers);
  const [selected, setSelected] = useState<HandoverItem | null>(initialHandovers[0]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [view, setView] = useState<"all" | "incoming" | "outgoing">("all");

  const acknowledge = (id: number) => {
    setHandovers((previous) => previous.map((row) => (row.id === id ? { ...row, acknowledged: true } : row)));
    if (selected?.id === id) setSelected((previous) => (previous ? { ...previous, acknowledged: true } : previous));
  };

  const addItem = () => setDraft((previous) => ({ ...previous, openItems: [...previous.openItems, ""] }));
  const updateItem = (index: number, value: string) =>
    setDraft((previous) => ({ ...previous, openItems: previous.openItems.map((item, itemIndex) => (itemIndex === index ? value : item)) }));
  const removeItem = (index: number) =>
    setDraft((previous) => ({ ...previous, openItems: previous.openItems.filter((_, itemIndex) => itemIndex !== index) }));

  const saveHandover = () => {
    const next: HandoverItem = {
      id: Date.now(),
      fromId: 1,
      toId: Number(draft.toId),
      clientId: Number(draft.clientId),
      title: draft.title,
      urgency: draft.urgency,
      context: draft.context,
      openItems: draft.openItems.filter(Boolean),
      clientNotes: draft.clientNotes,
      credentials: draft.credentials,
      dueDate: draft.dueDate,
      myReturnDate: draft.myReturnDate,
      status: "active",
      createdAt: "Today",
      acknowledged: false
    };
    setHandovers((previous) => [next, ...previous]);
    setSelected(next);
    setCreating(false);
    setDraft(emptyDraft);
  };

  const filtered = handovers.filter((row) => {
    if (view === "incoming") return row.toId === 1;
    if (view === "outgoing") return row.fromId === 1;
    return true;
  });

  const incomingUnack = handovers.filter((row) => row.toId === 1 && !row.acknowledged).length;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-staff-handovers">
      <div className={cx("pageHeaderBar", "borderB", "pb0")}>
        <div className={cx("flexBetween", "mb20")}>
          <div>
            <div className={cx("pageEyebrow")}>
              Staff Dashboard / Workflow
            </div>
            <h1 className={cx("pageTitle")}>
              Staff Handovers
            </h1>
          </div>
          <div className={cx("flexRow", "gap20")}>
            {[
              { label: "Active", value: handovers.filter((row) => row.status === "active").length, valueClass: "shToneMuted" },
              {
                label: "Incoming",
                value: handovers.filter((row) => row.toId === 1).length,
                valueClass: incomingUnack > 0 ? "shToneAmber" : "shToneMuted"
              },
              { label: "Unacked", value: incomingUnack, valueClass: incomingUnack > 0 ? "shToneRed" : "shToneMuted2" }
            ].map((stat) => (
              <div key={stat.label} className={cx("textRight")}>
                <div className={cx("shStatLabel")}>{stat.label}</div>
                <div className={cx("fontDisplay", "fw800", stat.valueClass)}>{stat.value}</div>
              </div>
            ))}
            <button
              type="button"
              className={cx("shNewBtn")}
              onClick={() => {
                setCreating(true);
                setSelected(null);
              }}
            >
              + New handover
            </button>
          </div>
        </div>

        <div className={cx("flexRow")}>
          {[
            { key: "all", label: "All handovers" },
            { key: "incoming", label: `Incoming${incomingUnack > 0 ? ` (${incomingUnack})` : ""}` },
            { key: "outgoing", label: "Outgoing" }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={cx(
                "shTabBtn",
                view === tab.key && "shTabBtnActive",
                view === tab.key && tab.key === "incoming" && incomingUnack > 0 && "shTabBtnIncomingWarn"
              )}
              onClick={() => setView(tab.key as "all" | "incoming" | "outgoing")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cx("shMainGrid")}>
        <div className={cx("shSidebar")}>
          {filtered.map((row) => {
            const urgency = urgencyConfig[row.urgency];
            const fromStaff = staff.find((item) => item.id === row.fromId);
            const toStaff = staff.find((item) => item.id === row.toId);
            const client = clients.find((item) => item.id === row.clientId);
            const isSelected = selected?.id === row.id;
            const isIncoming = row.toId === 1;
            return (
              <div
                key={row.id}
                className={cx("shHandoverCard", urgency.cardClass, isSelected && "shHandoverCardActive")}
                onClick={() => {
                  setSelected(row);
                  setCreating(false);
                }}
              >
                <div className={cx("flexRow", "gap8", "mb6", "flexWrap")}>
                  <span className={cx("shBadge", isIncoming ? "shBadgeIncoming" : "shBadgeOutgoing")}>
                    {isIncoming ? "Incoming" : "Outgoing"}
                  </span>
                  <span className={cx("shBadge", urgency.badgeClass)}>
                    {urgency.label}
                  </span>
                  <span className={cx("shBadge", statusConfig[row.status].badgeClass)}>
                    {statusConfig[row.status].label}
                  </span>
                  {isIncoming && !row.acknowledged ? <span className={cx("shNewBadge")}>NEW</span> : null}
                </div>
                <div className={cx("text12", "mb6", "shTitleClamp", isSelected ? "colorText" : "colorMuted")}>{row.title}</div>
                <div className={cx("flexRow", "gap8")}>
                  <span className={cx("text10", client?.toneClass)}>{client?.name}</span>
                  <span className={cx("text10", "colorMuted2")}>
                    {fromStaff?.name} &rarr; {toStaff?.name}
                  </span>
                </div>
                <div className={cx("text10", "colorMuted2", "mt4")}>Due {row.dueDate} - Created {row.createdAt}</div>
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <div className={cx("shEmptyState")}>No handovers in this view.</div>
          ) : null}
        </div>

        <div className={cx("overflowAuto")}>
          {creating ? (
            <div className={cx("shDetailPane")}>
              <div className={cx("fontDisplay", "fw800", "colorText", "shFormTitle")}>New Handover</div>
              <div className={cx("formGrid2")}>
                <div>
                  <label className={cx("shFormLabel")}>Handing over to</label>
                  <select aria-label="Handover recipient" value={draft.toId} onChange={(event) => setDraft((previous) => ({ ...previous, toId: Number(event.target.value) }))} className={cx("shFormSelect")}>
                    {staff.filter((item) => item.id !== 1).map((item) => (
                      <option key={item.id} value={item.id}>{item.name} - {item.role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cx("shFormLabel")}>Client / Project</label>
                  <select aria-label="Handover client" value={draft.clientId} onChange={(event) => setDraft((previous) => ({ ...previous, clientId: Number(event.target.value) }))} className={cx("shFormSelect")}>
                    {clients.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={cx("shFormLabel")}>Handover title</label>
                <input value={draft.title} onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))} placeholder="What needs covering while you are away?" className={cx("shFormInput")} />
              </div>

              <div className={cx("shFormGrid3")}>
                <div>
                  <label className={cx("shFormLabel")}>Urgency</label>
                  <select aria-label="Handover urgency" value={draft.urgency} onChange={(event) => setDraft((previous) => ({ ...previous, urgency: event.target.value as HandoverUrgency }))} className={cx("shFormSelect")}>
                    {(Object.keys(urgencyConfig) as HandoverUrgency[]).map((key) => (
                      <option key={key} value={key}>{urgencyConfig[key].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cx("shFormLabel")}>Cover until</label>
                  <input value={draft.dueDate} onChange={(event) => setDraft((previous) => ({ ...previous, dueDate: event.target.value }))} placeholder="e.g. Mar 1" className={cx("shFormInput")} />
                </div>
                <div>
                  <label className={cx("shFormLabel")}>My return date</label>
                  <input value={draft.myReturnDate} onChange={(event) => setDraft((previous) => ({ ...previous, myReturnDate: event.target.value }))} placeholder="e.g. Feb 28" className={cx("shFormInput")} />
                </div>
              </div>

              <div>
                <label className={cx("shFormLabel")}>Context & background</label>
                <textarea value={draft.context} onChange={(event) => setDraft((previous) => ({ ...previous, context: event.target.value }))} placeholder="What is the current state of play? What work is in progress? What decisions have been made?" className={cx("shFormTextarea")} />
              </div>

              <div>
                <label className={cx("shFormLabel")}>Open items & instructions</label>
                {draft.openItems.map((item, index) => (
                  <div key={index} className={cx("shOpenItemRow")}>
                    <span className={cx("text12", "colorMuted2")}>&rarr;</span>
                    <input value={item} onChange={(event) => updateItem(index, event.target.value)} placeholder={`Action item ${index + 1}...`} className={cx("shOpenItemInput")} />
                    <button type="button" className={cx("shRemoveItem")} onClick={() => removeItem(index)}>&times;</button>
                  </div>
                ))}
                <button type="button" className={cx("shAddItemBtn")} onClick={addItem}>
                  + Add item
                </button>
              </div>

              <div>
                <label className={cx("shFormLabel")}>Client notes (personality, preferences)</label>
                <textarea value={draft.clientNotes} onChange={(event) => setDraft((previous) => ({ ...previous, clientNotes: event.target.value }))} placeholder="How does this client communicate? What to avoid? Any sensitivities?" className={cx("shFormTextareaShort")} />
              </div>

              <div>
                <label className={cx("shFormLabel")}>File & tool access</label>
                <input value={draft.credentials} onChange={(event) => setDraft((previous) => ({ ...previous, credentials: event.target.value }))} placeholder="Drive folder, Figma link, any relevant access info" className={cx("shFormInput")} />
              </div>

              <div className={cx("flexRow", "gap10")}>
                <button type="button" className={cx("shSaveBtn")} disabled={!draft.title.trim() || !draft.context.trim()} onClick={saveHandover}>
                  Send handover
                </button>
                <button type="button" className={cx("shCancelBtn")} onClick={() => setCreating(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {selected && !creating
            ? (() => {
                const urgency = urgencyConfig[selected.urgency];
                const fromStaff = staff.find((item) => item.id === selected.fromId);
                const toStaff = staff.find((item) => item.id === selected.toId);
                const client = clients.find((item) => item.id === selected.clientId);
                const isIncoming = selected.toId === 1;
                return (
                  <div className={cx("shDetailPane")}>
                    <div className={cx("flexBetween")}>
                      <div>
                        <div className={cx("flexRow", "gap8", "mb10", "flexWrap")}>
                          <span className={cx("shDetailBadge", urgency.badgeClass, "shDetailBadgeOutline")}>{urgency.label}</span>
                          <span className={cx("shDetailBadge", isIncoming ? "shBadgeIncoming" : "shBadgeOutgoing")}>{isIncoming ? "Incoming" : "Outgoing"}</span>
                          <span className={cx("shDetailBadge", statusConfig[selected.status].badgeClass)}>{statusConfig[selected.status].label}</span>
                          {isIncoming && !selected.acknowledged ? <span className={cx("shDetailBadge", "shBadgeUnacked")}>Unacknowledged</span> : null}
                        </div>
                        <div className={cx("fontDisplay", "fw800", "colorText", "shDetailTitle")}>{selected.title}</div>
                      </div>
                    </div>

                    <div className={cx("shStaffRow")}>
                      {[fromStaff, toStaff].map((item, index) => (
                        <span key={index} className={cx("flexRow", "gap6")}>
                          {index === 1 ? <span className={cx("text14", "colorMuted2")}>&rarr;</span> : null}
                          <div className={cx("shPersonAvatar", item?.surfaceClass, item?.toneClass)}>{item?.avatar ?? "??"}</div>
                          <div>
                            <div className={cx("text11", item?.id === 1 ? "colorAccent" : "colorText")}>{item?.name ?? "Unknown"}</div>
                            <div className={cx("shPersonRole")}>{item?.role ?? "Unknown role"}</div>
                          </div>
                        </span>
                      ))}
                      <div className={cx("shDueMeta")}>
                        <div className={cx("text10", "colorMuted2")}>Cover until {selected.dueDate}</div>
                        <div className={cx("text10", "colorMuted2")}>Return {selected.myReturnDate}</div>
                      </div>
                    </div>

                    <div className={cx("shClientBanner", client?.softSurfaceClass, client?.borderClass)}>
                      <div className={cx("shClientAvatar", client?.surfaceClass, client?.toneClass)}>{client?.avatar ?? "??"}</div>
                      <div>
                        <div className={cx("text12", client?.toneClass ?? "shToneMuted")}>{client?.name ?? "Unknown client"}</div>
                        <div className={cx("text10", "colorMuted2")}>{client?.project ?? "Unknown project"}</div>
                      </div>
                    </div>

                    <div className={cx("shContextCard")}>
                      <div className={cx("shContextLabel")}>Context & background</div>
                      <div className={cx("text13", "colorMuted", "shContextText")}>{selected.context}</div>
                    </div>

                    <div>
                      <div className={cx("shContextLabel", "mb12")}>Open items</div>
                      {selected.openItems.map((item, index) => (
                        <div key={index} className={cx("shOpenItem")}>
                          <span className={cx("text11", "noShrink", urgency.iconClass, "shArrowTop")}>&rarr;</span>
                          <span className={cx("text12", "colorMuted", "shLine15")}>{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className={cx("grid2", "gap12")}>
                      {selected.clientNotes ? (
                        <div className={cx("shInfoCard")}>
                          <div className={cx("shInfoCardLabel")}>Client notes</div>
                          <div className={cx("text12", "colorMuted", "shLine16")}>{selected.clientNotes}</div>
                        </div>
                      ) : null}
                      {selected.credentials ? (
                        <div className={cx("shInfoCard")}>
                          <div className={cx("shInfoCardLabel")}>Files & access</div>
                          <div className={cx("text12", "colorMuted", "shLine16")}>{selected.credentials}</div>
                        </div>
                      ) : null}
                    </div>

                    {isIncoming && !selected.acknowledged ? (
                      <button type="button" className={cx("shAckBtn")} onClick={() => acknowledge(selected.id)}>
                        &#10003; Acknowledge handover
                      </button>
                    ) : null}
                    {isIncoming && selected.acknowledged ? (
                      <div className={cx("shAckedBanner")}>
                        &#10003; You acknowledged this handover
                      </div>
                    ) : null}
                  </div>
                );
              })()
            : null}

          {!selected && !creating ? (
            <div className={cx("shEmptyDetail")}>
              <div className={cx("shEmptyIcon")}>&cir;</div>
              <div className={cx("text13")}>Select a handover or create one</div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
