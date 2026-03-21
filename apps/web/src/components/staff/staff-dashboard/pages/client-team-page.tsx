"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "@/lib/auth/session";
import { saveSession } from "@/lib/auth/session";
import { getStaffClients, type StaffClient } from "@/lib/api/staff/clients";

type ContactEntry = {
  name: string;
  role: string;
  email: string;
  decisionAuthority: string;
  lastContact: string;
};

type TeamEntry = {
  client: string;
  avatar: string;
  contacts: ContactEntry[];
};

function buildInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
}

function buildTeams(clients: StaffClient[]): TeamEntry[] {
  return clients.map((c) => ({
    client: c.name,
    avatar: buildInitials(c.name),
    contacts: c.contactEmail
      ? [{
          name: c.name,
          role: c.tier ? `${c.tier} Client` : "Primary Contact",
          email: c.contactEmail,
          decisionAuthority: "Final",
          lastContact: new Date(c.updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
        }]
      : [],
  }));
}

const TEAM_AVATAR_CLS: Record<string, string> = {
  VS: "ctmClientAvatarAccent",
  KC: "ctmClientAvatarBlue",
  MH: "ctmClientAvatarGreen",
};

const CONTACT_AVATAR_COLORS = [
  "ctmAvatarAccent",
  "ctmAvatarBlue",
  "ctmAvatarGreen",
  "ctmAvatarAmber",
  "ctmAvatarPurple",
] as const;

function initials(name: string): string {
  const cleaned = name.replace(/^Dr\.\s*/i, "").trim();
  const parts   = cleaned.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function contactAvatarCls(name: string): string {
  const hash = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return CONTACT_AVATAR_COLORS[hash % CONTACT_AVATAR_COLORS.length];
}

function authorityCls(a: string): string {
  if (a === "Final")       return "ctmAuthFinal";
  if (a === "Design")      return "ctmAuthDesign";
  if (a === "Technical")   return "ctmAuthTechnical";
  if (a === "Operational") return "ctmAuthOperational";
  return "";
}

export function ClientTeamPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [teams, setTeams]     = useState<TeamEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void getStaffClients(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        setTeams(buildTeams(r.data));
      }
    }).catch(() => {
      // keep previous state on error
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  const totalClients    = teams.length;
  const totalContacts   = teams.reduce((s, t) => s + t.contacts.length, 0);
  const decisionMakers  = teams.reduce((s, t) => s + t.contacts.filter((c) => c.decisionAuthority === "Final").length, 0);
  const allLastContacts = teams.flatMap((t) => t.contacts.map((c) => c.lastContact));
  const lastTouch       = allLastContacts.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? "—";

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-team">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-team">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Client Team</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Client stakeholders and decision authorities</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("staffKpiStrip", "staffKpiStripFour")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Clients</div>
          <div className={cx("staffKpiValue", "colorAccent")}>{totalClients}</div>
          <div className={cx("staffKpiSub")}>managed accounts</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Contacts</div>
          <div className={cx("staffKpiValue")}>{totalContacts}</div>
          <div className={cx("staffKpiSub")}>total stakeholders</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Decision Makers</div>
          <div className={cx("staffKpiValue", "colorAccent")}>{decisionMakers}</div>
          <div className={cx("staffKpiSub")}>final authority</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Last Touch</div>
          <div className={cx("staffKpiValue", "colorGreen")}>{lastTouch}</div>
          <div className={cx("staffKpiSub")}>most recent contact</div>
        </div>
      </div>

      {/* ── Client sections ───────────────────────────────────────────────── */}
      {teams.map((team) => (
        <div key={team.client} className={cx("staffCard", "mb16")}>

          <div className={cx("staffSectionHd")}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className={cx("staffClientAvatar", TEAM_AVATAR_CLS[team.avatar] ?? "ctmClientAvatarAccent")}>
                {team.avatar}
              </div>
              <span className={cx("staffSectionTitle")}>{team.client}</span>
            </div>
            <span className={cx("staffChip")}>
              {team.contacts.length} CONTACT{team.contacts.length !== 1 ? "S" : ""}
            </span>
          </div>

          <div className={cx("ctmContactList")}>
            {team.contacts.map((c, idx) => (
              <div
                key={c.email}
                className={cx(
                  "staffTeamContactRow",
                  idx === team.contacts.length - 1 && "staffTeamContactRowLast",
                )}
              >
                {/* Initials avatar */}
                <div className={cx("staffTeamContactAvatar", contactAvatarCls(c.name))}>
                  {initials(c.name)}
                </div>

                {/* Name + role */}
                <div className={cx("staffTeamContactInfo")}>
                  <div className={cx("staffTeamContactName")}>{c.name}</div>
                  <div className={cx("staffRoleLabel")}>{c.role}</div>
                </div>

                {/* Authority badge */}
                <span className={cx("staffChip", authorityCls(c.decisionAuthority) === "ctmAuthFinal" ? "staffChipAccent" : "")}>
                  {c.decisionAuthority}
                </span>

                {/* Status dot */}
                <div className={cx("staffDotGreen")} />

                {/* Last contact */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className={cx("staffRoleLabel")}>Last contact</div>
                  <div className={cx("text11", "colorMuted")}>{c.lastContact}</div>
                </div>

              </div>
            ))}
          </div>

        </div>
      ))}

    </section>
  );
}
