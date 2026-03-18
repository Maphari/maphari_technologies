"use client";

import { useState, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { saveSession } from "../../../../lib/auth/session";
import {
  createPortalSupportTicketWithRefresh,
  loadPortalSupportTicketsWithRefresh,
  setPortalPreferenceWithRefresh,
  getPortalPreferenceWithRefresh,
  type PortalSupportTicket,
} from "../../../../lib/api/portal";

// ── Types & Data ──────────────────────────────────────────────────────────────

type Consent = { id: string; label: string; description: string; enabled: boolean; required?: boolean };

const INITIAL_CONSENTS: Consent[] = [
  { id: "essential",  label: "Essential Cookies",         description: "Required for the portal to function — authentication, session management, and security. Cannot be disabled.", enabled: true,  required: true  },
  { id: "analytics",  label: "Analytics Cookies",         description: "Help us understand which features you use most so we can improve the portal experience.",                      enabled: true  },
  { id: "email",      label: "Email Notifications",       description: "Receive project updates, invoice alerts, milestone completions, and approval requests via email.",             enabled: true  },
  { id: "activity",   label: "Portal Activity Tracking",  description: "Allows us to track which pages you visit and how long you spend in the portal to personalise your experience.", enabled: false },
];

const DATA_RECORDS = [
  { category: "Profile Data",    items: "Name, email, company name, phone number",                           retention: "Contract duration + 5 years", legal: "Contractual necessity", icon: "user",    color: "var(--lime)"   },
  { category: "Payment Data",    items: "Invoice history, payment method (last 4 digits only), VAT records", retention: "7 years (SARS compliance)",   legal: "Legal obligation",       icon: "dollar",  color: "var(--green)"  },
  { category: "Project Data",    items: "Approvals, feedback, change requests, meeting notes, file access",  retention: "Contract duration + 2 years", legal: "Legitimate interest",    icon: "layers",  color: "var(--amber)"  },
  { category: "Usage Analytics", items: "Page views, session duration, feature interactions (anonymised)",   retention: "12 months rolling",           legal: "Consent",                icon: "activity", color: "var(--purple)" },
];

const POPIA_RIGHTS = [
  { icon: "eye",      label: "Right to Access",     desc: "Request a copy of all personal data we hold about you. Delivered within 5 business days.",     cta: "Request Export",     category: "DATA_EXPORT_REQUEST"     },
  { icon: "edit",     label: "Right to Correction",  desc: "Request correction of inaccurate or incomplete personal data held in your account.",             cta: "Request Correction", category: "DATA_CORRECTION_REQUEST" },
  { icon: "trash",    label: "Right to Erasure",     desc: "Request deletion of your data where there is no legal obligation to retain it.",                 cta: "Request Deletion",   category: "DATA_DELETION_REQUEST"   },
  { icon: "alert",    label: "Right to Object",      desc: "Object to processing based on legitimate interest or for direct marketing purposes.",             cta: "Raise Objection",    category: "DATA_OBJECTION"          },
];

// Privacy score: computed from enabled consents (essential = always 30pts, analytics = 25, email = 20, activity = 25)
const SCORE_WEIGHTS: Record<string, number> = {
  essential: 30,
  analytics: 25,
  email:     20,
  activity:  25,
};

// CIRC for r=54: 2π×54 ≈ 339.3
const CIRC = 339.3;

// ── Component ─────────────────────────────────────────────────────────────────

export function DataPrivacyPage() {
  const { session } = useProjectLayer();
  const notify = usePageToast();

  const [consents,       setConsents]       = useState<Consent[]>(INITIAL_CONSENTS);
  const [saved,          setSaved]          = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [mounted,        setMounted]        = useState(false);
  const [popiaRequests,  setPopiaRequests]  = useState<PortalSupportTicket[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Load saved consents from preferences API on mount
  useEffect(() => {
    if (!session) return;
    void getPortalPreferenceWithRefresh(session, "privacyConsents").then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data?.value) {
        try {
          const saved = JSON.parse(r.data.value) as Array<{ id: string; enabled: boolean }>;
          setConsents(INITIAL_CONSENTS.map((c) => {
            const savedItem = saved.find((s) => s.id === c.id);
            return savedItem ? { ...c, enabled: c.required ? true : savedItem.enabled } : c;
          }));
        } catch { /* keep defaults */ }
      }
    });
    // Load POPIA request history
    void loadPortalSupportTicketsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        setPopiaRequests(r.data.filter((t) => t.title?.startsWith("POPIA Request:")));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const toggle = (id: string) => {
    setConsents((prev) => prev.map((c) => c.id === id && !c.required ? { ...c, enabled: !c.enabled } : c));
    setSaved(false);
  };

  async function handleSavePreferences(): Promise<void> {
    if (saving || saved) return;
    setSaving(true);
    try {
      if (session) {
        const r = await setPortalPreferenceWithRefresh(session, {
          key:   "privacyConsents",
          value: JSON.stringify(consents.map(c => ({ id: c.id, enabled: c.enabled })))
        });
        if (r.nextSession) saveSession(r.nextSession);
      }
      setSaved(true);
      notify("success", "Preferences saved", "Your privacy consent settings have been updated.");
    } catch {
      notify("error", "Save failed", "Could not save your preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePOPIARequest(rightLabel: string, category: string): Promise<void> {
    if (!session) { notify("error", "Not signed in", "Please sign in to submit a POPIA request."); return; }
    try {
      const r = await createPortalSupportTicketWithRefresh(session, {
        clientId:    session.user.clientId ?? "",
        title:       `POPIA Request: ${rightLabel}`,
        description: `Client has submitted a formal POPIA right request: "${rightLabel}". Please process within 5 business days as required by the Protection of Personal Information Act.`,
        category,
        priority:    "HIGH",
      });
      if (r.nextSession) saveSession(r.nextSession);
      notify("success", "Request submitted", "Your POPIA request has been received. We'll respond within 5 business days.");
    } catch {
      notify("error", "Request failed", "Could not submit your request. Please email privacy@maphari.co.za directly.");
    }
  }

  // Privacy score = sum of weights of enabled consents
  const privacyScore = consents.reduce((sum, c) => sum + (c.enabled ? 0 : (SCORE_WEIGHTS[c.id] ?? 0)), 0) + 30; // 30 base for essential
  const clampedScore = Math.min(100, Math.max(0, privacyScore));

  const scoreColor = clampedScore >= 80 ? "var(--green)" : clampedScore >= 60 ? "var(--amber)" : "var(--red)";
  const scoreLabel = clampedScore >= 80 ? "High Privacy" : clampedScore >= 60 ? "Moderate" : "Low Privacy";

  return (
    <div className={cx("pageBody")}>

      {/* Header */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Account · Privacy</div>
          <h1 className={cx("pageTitle")}>Data &amp; Privacy</h1>
          <p className={cx("pageSub")}>Understand what data we hold, manage your consent preferences, and exercise your POPIA rights.</p>
        </div>
      </div>

      {/* Top row: Score ring + Consent toggles */}
      <div className={cx("dpTopGrid")}>

        {/* Privacy Score Ring */}
        <div className={cx("card", "dpScoreCard")}>
          <div className={cx("cardHd", "wFull", "mb12")}>
            <span className={cx("cardHdTitle")}>Privacy Score</span>
          </div>
          <svg width={140} height={140} viewBox="-10 -10 128 128">
            <circle cx={54} cy={54} r={54} fill="none" stroke="var(--b2)" strokeWidth={12} />
            <circle
              cx={54} cy={54} r={54}
              fill="none"
              stroke={scoreColor}
              strokeWidth={12}
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={mounted ? CIRC * (1 - clampedScore / 100) : CIRC}
              strokeLinecap="round"
              transform="rotate(-90 54 54)"
              className={cx("dpRingTransition")}
            />
            <text x={54} y={50} textAnchor="middle" dominantBaseline="middle" fontSize={32} fontWeight={800} fill={scoreColor}>{clampedScore}</text>
            <text x={54} y={70} textAnchor="middle" fontSize={9} fill="var(--muted2)">/100</text>
          </svg>
          <span className={cx("badge", clampedScore >= 80 ? "badgeGreen" : clampedScore >= 60 ? "badgeAmber" : "badgeRed", "mt8")}>{scoreLabel}</span>
          <div className={cx("text10", "colorMuted", "mt6", "textCenter", "lineH15")}>Toggle consents below to adjust your privacy level</div>
        </div>

        {/* Consent Toggles */}
        <div className={cx("card")}>
          <div className={cx("cardHd", "mb4")}>
            <span className={cx("cardHdTitle")}>Consent Preferences</span>
          </div>
          <div className={cx("dpConsentList")}>
            {consents.map((c, idx) => (
              <div key={c.id} className={cx("dpConsentRow", idx < consents.length - 1 && "borderB")}>
                <div className={cx("flex1")}>
                  <div className={cx("flexRow", "gap6", "mb3")}>
                    <span className={cx("fw600", "text12")}>{c.label}</span>
                    {c.required && <span className={cx("badge", "badgeMuted", "fs9")}>Required</span>}
                  </div>
                  <div className={cx("text11", "colorMuted", "lineH16")}>{c.description}</div>
                </div>
                <button
                  type="button"
                  aria-checked={c.enabled}
                  role="switch"
                  onClick={() => toggle(c.id)}
                  className={cx("dpToggleBtn", "dynBgColor")}
                  style={{ "--bg-color": c.enabled ? "var(--lime)" : "var(--b2)", "--cursor": c.required ? "default" : "pointer" } as React.CSSProperties}
                >
                  <span className={cx("dpToggleKnob")} style={{ "--left": c.enabled ? "23px" : "3px" } as React.CSSProperties} />
                </button>
              </div>
            ))}
          </div>
          <div className={cx("mt14", "p14x20x18", "borderT")}>
            <button
              type="button"
              className={cx("btnSm", saved ? "btnGhost" : "btnAccent")}
              disabled={saving}
              onClick={() => { void handleSavePreferences(); }}
            >
              {saving ? "Saving…" : saved ? <><Ic n="check" sz={11} c="var(--green)" /> Saved</> : "Save Preferences"}
            </button>
          </div>
        </div>
      </div>

      {/* Data Records */}
      <div className={cx("card", "mb20")}>
        <div className={cx("cardHd", "borderB")}>
          <Ic n="layers" sz={14} c="var(--lime)" />
          <span className={cx("cardHdTitle", "ml8")}>Data We Hold About You</span>
        </div>
        <div className={cx("grid2Cols", "gap0")}>
          {DATA_RECORDS.map((d, idx) => (
            <div
              key={d.category}
              className={cx("dpDataCell", idx % 2 === 0 && "dpDataCellBorderR", idx < DATA_RECORDS.length - 2 && "dpDataCellBorderB")}
            >
              <div className={cx("flexRow", "gap10", "mb8")}>
                <div className={cx("dpDataIconBox", "dynBgColor", "dynBorderColor")} style={{ "--bg-color": `color-mix(in oklab, ${d.color} 12%, transparent)`, "--border-color": `color-mix(in oklab, ${d.color} 22%, transparent)` } as React.CSSProperties}>
                  <Ic n={d.icon} sz={13} c={d.color} />
                </div>
                <span className={cx("fw700", "text12")}>{d.category}</span>
              </div>
              <div className={cx("text11", "colorMuted", "mb8", "lineH15")}>{d.items}</div>
              <div className={cx("flexRow", "gap6", "flexWrap")}>
                <span className={cx("badge", "badgeMuted", "fs9")}>Retained: {d.retention}</span>
                <span className={cx("badge", "badgeMuted", "fs9")}>Basis: {d.legal}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* POPIA Rights */}
      <div className={cx("card")}>
        <div className={cx("cardHd", "borderB")}>
          <Ic n="key" sz={14} c="var(--amber)" />
          <span className={cx("cardHdTitle", "ml8")}>Your POPIA Rights</span>
          <span className={cx("text10", "colorMuted", "mlAuto")}>Responses within 5 business days</span>
        </div>
        <div className={cx("grid2Cols", "gap0")}>
          {POPIA_RIGHTS.map((r, idx) => (
            <div
              key={r.label}
              className={cx("dpDataCell", "dpDataCellFlexCol", idx % 2 === 0 && "dpDataCellBorderR", idx < POPIA_RIGHTS.length - 2 && "dpDataCellBorderB")}
            >
              <div className={cx("flexRow", "gap8")}>
                <Ic n={r.icon} sz={14} c="var(--amber)" />
                <span className={cx("fw600", "text12")}>{r.label}</span>
              </div>
              <div className={cx("text10", "colorMuted", "lineH15")}>{r.desc}</div>
              <button
                type="button"
                className={cx("btnSm", "btnGhost", "alignSelfStart", "mt4")}
                onClick={() => { void handlePOPIARequest(r.label, r.category); }}
              >
                {r.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Request History */}
      <div className={cx("card", "mt20")}>
        <div className={cx("cardHd")}>
          <Ic n="shieldCheck" sz={14} c="var(--purple)" />
          <span className={cx("cardHdTitle", "ml8")}>Request History</span>
          <span className={cx("text10", "colorMuted", "mlAuto")}>Your submitted POPIA requests</span>
        </div>
        {popiaRequests.length === 0 ? (
          <div className={cx("emptyState", "py24_px", "px20_px")}>
            <div className={cx("emptyStateIcon")}><Ic n="shieldCheck" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No requests submitted yet</div>
            <div className={cx("emptyStateSub")}>POPIA requests you submit above will appear here for tracking.</div>
          </div>
        ) : (
          <div className={cx("p0x20x8")}>
            {popiaRequests.map((ticket) => (
              <div key={ticket.id} className={cx("flexBetween", "py12_0", "borderB")}>
                <div>
                  <div className={cx("text12", "fw600")}>{ticket.title}</div>
                  <div className={cx("text10", "colorMuted", "mt2")}>
                    Submitted {new Date(ticket.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <span className={cx("badge", ticket.status === "CLOSED" || ticket.status === "RESOLVED" ? "badgeGreen" : "badgePurple")}>
                  {ticket.status === "CLOSED" || ticket.status === "RESOLVED" ? "Resolved" : "Open"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
