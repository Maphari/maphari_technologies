"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";

type BriefTab = "Brief" | "Version History" | "Team Notes";

type BriefVersion = {
  num: string;
  name: string;
  meta: string;
  current: boolean;
};

type BriefField = {
  id: string;
  label: string;
  value: string;
};

type TeamNote = {
  av: string;
  color: string;
  name: string;
  date: string;
  note: string;
};

const TABS: BriefTab[] = ["Brief", "Version History", "Team Notes"];

const VERSIONS: BriefVersion[] = [
  { num: "v3", name: "Current Brief", meta: "Submitted Feb 20 · Acknowledged by team", current: true },
  { num: "v2", name: "Updated Brief", meta: "Submitted Feb 10 · Minor scope additions", current: false },
  { num: "v1", name: "Initial Brief", meta: "Submitted Jan 10 · Original submission", current: false },
];

const BRIEF_FIELDS: BriefField[] = [
  {
    id: "overview",
    label: "Business Overview",
    value:
      "Veldt Finance is a fintech startup providing micro-lending solutions to SMEs in South Africa. We currently serve 2,400+ clients across 5 provinces and are looking to modernise our digital presence to scale to 10,000+ clients by end of 2026.",
  },
  {
    id: "goals",
    label: "Project Goals",
    value:
      "1. Redesign client-facing dashboard for ease of use\n2. Increase loan application completion rate from 43% to 70%+\n3. Reduce support tickets by 35% through better UX\n4. Build mobile-first for our primarily smartphone-based users",
  },
  {
    id: "audience",
    label: "Target Audience",
    value:
      "SME owners aged 28–55 in peri-urban and urban South Africa. Mostly using mobile (Android). Not very tech-savvy — need simple, clear interfaces. Primary language English and Zulu.",
  },
  {
    id: "references",
    label: "Design References",
    value:
      "Flutterwave dashboard — clean, African market-friendly\nKuda Bank — minimal, mobile-first\nWe want something that feels modern but not 'Silicon Valley cold'",
  },
  {
    id: "metrics",
    label: "Success Metrics",
    value:
      "- Loan application completion rate > 70%\n- Support ticket volume down 35%\n- App Store rating > 4.2\n- Load time under 1.5s on 4G",
  },
  {
    id: "constraints",
    label: "Constraints & Must-Haves",
    value:
      "- Must integrate with existing Temenos core banking system\n- All UI in English + Zulu\n- Launch before June 2026 AGM\n- Budget cap: R 80,000",
  },
];

const TEAM_NOTES: TeamNote[] = [
  {
    av: "SN",
    color: "#c8f135",
    name: "Sipho Ndlovu",
    date: "Feb 20",
    note: "Noted the Temenos integration requirement — flagged to our backend team. We will confirm feasibility by Feb 25.",
  },
  {
    av: "LM",
    color: "#8b6fff",
    name: "Lerato Mokoena",
    date: "Feb 12",
    note: "The reference to Flutterwave and Kuda is helpful. I will use both as visual benchmarks for brand identity.",
  },
];

const STATUS_STEPS = ["Submitted", "Acknowledged", "In Use", "Locked"] as const;

export function ProjectRequestPage() {
  const [tab, setTab] = useState<BriefTab>("Brief");
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<BriefField[]>(BRIEF_FIELDS);
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  return (
    <div className={cx("pageBody", styles.projBriefRoot)}>
      <div className={styles.projBriefLayout}>
        <aside className={styles.projBriefSidebar}>
          <div className={styles.projBriefSection}>Brief</div>
          {TABS.map((item, idx) => (
            <button
              key={item}
              type="button"
              className={cx(styles.projBriefSideItem, tab === item && styles.projBriefSideItemActive)}
              onClick={() => setTab(item)}
            >
              <span
                className={styles.projBriefSideDot}
                style={{
                  background:
                    idx === 0 ? "var(--accent)" : idx === 1 ? "var(--purple)" : "var(--blue)",
                }}
              />
              <span>{item}</span>
            </button>
          ))}

          <div className={styles.projBriefDivider} />
          <div className={styles.projBriefStatusCard}>
            <div className={styles.projBriefStatusTitle}>Status</div>
            <span className={cx("badge", "badgeGreen")}>v3 · Acknowledged</span>
            <div className={styles.projBriefStatusMeta}>
              Last updated Feb 20.
              <br />
              You can edit until work begins on each phase.
            </div>
          </div>
        </aside>

        <section className={styles.projBriefMain}>
          <div className={cx("pageHeader", "mb0")}>
            <div>
              <div className={cx("pageEyebrow")}>Veldt Finance · Project Brief</div>
              <h1 className={cx("pageTitle")}>Project Brief</h1>
              <p className={cx("pageSub")}>
                Your submitted brief is the foundation everything is built on. Edit anytime before a phase starts.
              </p>
            </div>
            <div className={cx("pageActions")}>
              {editing ? (
                <>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    onClick={() => {
                      setEditing(false);
                      notify("Brief saved", "Version 4 submitted — team notified");
                    }}
                  >
                    Save &amp; Submit v4
                  </button>
                </>
              ) : (
                <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setEditing(true)}>
                  Edit Brief
                </button>
              )}
            </div>
          </div>

          {tab === "Brief" ? (
            <div className={styles.projBriefContent}>
              <div className={styles.projBriefSteps}>
                {STATUS_STEPS.map((step, idx) => (
                  <div
                    key={step}
                    className={cx(
                      styles.projBriefStep,
                      idx < 2 && styles.projBriefStepDone,
                      idx === 2 && styles.projBriefStepActive,
                    )}
                  >
                    {idx < 2 ? "✓ " : ""}
                    {step}
                  </div>
                ))}
              </div>

              {editing ? (
                <div className={styles.projBriefEditBanner}>
                  Editing mode — changes will create a new version (v4) and notify your project lead.
                </div>
              ) : null}

              <div className={cx("card", styles.projBriefCard)}>
                {fields.map((field, idx) => (
                  <div key={field.id}>
                    <div className={styles.projBriefLabel}>{field.label}</div>
                    {editing ? (
                      <textarea
                        className={styles.projBriefTextarea}
                        value={field.value}
                        onChange={(event) =>
                          setFields((prev) =>
                            prev.map((item, itemIdx) =>
                              itemIdx === idx ? { ...item, value: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    ) : (
                      <div className={styles.projBriefReadBlock}>{field.value}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.projBriefAck}>
                <span className={styles.projBriefAckIcon}>✅</span>
                <div>
                  <div className={styles.projBriefAckTitle}>Brief acknowledged by Sipho Ndlovu</div>
                  <div className={styles.projBriefAckText}>
                    Feb 20, 2026 at 09:14 — "Brief received and reviewed. We are aligned on goals and constraints.
                    Work begins Monday."
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Version History" ? (
            <div className={styles.projBriefContent}>
              <div className={styles.projBriefSectionLine}>All Versions</div>
              <div className={cx("card", styles.projBriefVersionCard)}>
                {VERSIONS.map((version) => (
                  <div key={version.num} className={styles.projBriefVersionItem}>
                    <div className={styles.projBriefVersionNum}>{version.num}</div>
                    <div className={styles.projBriefGrow}>
                      <div className={styles.projBriefVersionName}>
                        {version.name}
                        {version.current ? <span className={cx("badge", "badgeAccent", styles.projBriefCurrent)}>Current</span> : null}
                      </div>
                      <div className={styles.projBriefVersionMeta}>{version.meta}</div>
                    </div>
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost")}
                      onClick={() => notify("Version loaded", `Viewing ${version.num}`)}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "Team Notes" ? (
            <div className={styles.projBriefContent}>
              <div className={styles.projBriefSectionLine}>Notes from Your Team</div>
              {TEAM_NOTES.map((note) => (
                <div key={`${note.name}-${note.date}`} className={cx("card", styles.projBriefNoteCard)}>
                  <div
                    className={styles.projBriefNoteAvatar}
                    style={{ background: note.color, color: "#050508" }}
                  >
                    {note.av}
                  </div>
                  <div className={styles.projBriefGrow}>
                    <div className={styles.projBriefNoteHead}>
                      {note.name}
                      <span className={styles.projBriefNoteDate}>· {note.date}</span>
                    </div>
                    <div className={styles.projBriefNoteText}>{note.note}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {toast ? (
        <div className={cx("toastStack")}>
          <div className={cx("toast", "toastSuccess")}>
            <strong>{toast.title}</strong>
            <div>{toast.subtitle}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
