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
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  const totalClients    = teams.length;
  const totalContacts   = teams.reduce((s, t) => s + t.contacts.length, 0);
  const decisionMakers  = teams.reduce((s, t) => s + t.contacts.filter((c) => c.decisionAuthority === "Final").length, 0);
  const allLastContacts = teams.flatMap((t) => t.contacts.map((c) => c.lastContact));
  const lastTouch       = allLastContacts.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? "—";

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-team">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Client Team</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Client stakeholders and decision authorities</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("ctmStatGrid")}>

        <div className={cx("ctmStatCard")}>
          <div className={cx("ctmStatCardTop")}>
            <div className={cx("ctmStatLabel")}>Clients</div>
            <div className={cx("ctmStatValue", "colorAccent")}>{totalClients}</div>
          </div>
          <div className={cx("ctmStatCardDivider")} />
          <div className={cx("ctmStatCardBottom")}>
            <span className={cx("ctmStatDot", "dotBgAccent")} />
            <span className={cx("ctmStatMeta")}>managed accounts</span>
          </div>
        </div>

        <div className={cx("ctmStatCard")}>
          <div className={cx("ctmStatCardTop")}>
            <div className={cx("ctmStatLabel")}>Contacts</div>
            <div className={cx("ctmStatValue", "colorMuted2")}>{totalContacts}</div>
          </div>
          <div className={cx("ctmStatCardDivider")} />
          <div className={cx("ctmStatCardBottom")}>
            <span className={cx("ctmStatDot", "dotBgMuted2")} />
            <span className={cx("ctmStatMeta")}>total stakeholders</span>
          </div>
        </div>

        <div className={cx("ctmStatCard")}>
          <div className={cx("ctmStatCardTop")}>
            <div className={cx("ctmStatLabel")}>Decision Makers</div>
            <div className={cx("ctmStatValue", "colorAccent")}>{decisionMakers}</div>
          </div>
          <div className={cx("ctmStatCardDivider")} />
          <div className={cx("ctmStatCardBottom")}>
            <span className={cx("ctmStatDot", "dotBgAccent")} />
            <span className={cx("ctmStatMeta")}>final authority</span>
          </div>
        </div>

        <div className={cx("ctmStatCard")}>
          <div className={cx("ctmStatCardTop")}>
            <div className={cx("ctmStatLabel")}>Last Touch</div>
            <div className={cx("ctmStatValue", "colorGreen", "textLg105")} >{lastTouch}</div>
          </div>
          <div className={cx("ctmStatCardDivider")} />
          <div className={cx("ctmStatCardBottom")}>
            <span className={cx("ctmStatDot", "dotBgGreen")} />
            <span className={cx("ctmStatMeta")}>most recent contact</span>
          </div>
        </div>

      </div>

      {/* ── Client sections ───────────────────────────────────────────────── */}
      {teams.map((team) => (
        <div key={team.client} className={cx("ctmSection")}>

          <div className={cx("ctmSectionHeader")}>
            <div className={cx("ctmSectionLeft")}>
              <div className={cx("ctmClientAvatar", TEAM_AVATAR_CLS[team.avatar] ?? "ctmClientAvatarAccent")}>
                {team.avatar}
              </div>
              <div className={cx("ctmClientName")}>{team.client}</div>
            </div>
            <span className={cx("ctmSectionMeta")}>
              {team.contacts.length} CONTACT{team.contacts.length !== 1 ? "S" : ""}
            </span>
          </div>

          <div className={cx("ctmContactList")}>
            {team.contacts.map((c, idx) => (
              <div
                key={c.email}
                className={cx(
                  "ctmContactRow",
                  idx === team.contacts.length - 1 && "ctmContactRowLast",
                )}
              >
                {/* Initials avatar */}
                <div className={cx("ctmContactAvatar", contactAvatarCls(c.name))}>
                  {initials(c.name)}
                </div>

                {/* Name + role */}
                <div className={cx("ctmContactInfo")}>
                  <span className={cx("ctmContactName")}>{c.name}</span>
                  <span className={cx("ctmContactRole")}>{c.role}</span>
                </div>

                {/* Authority badge */}
                <span className={cx("ctmAuthBadge", authorityCls(c.decisionAuthority))}>
                  {c.decisionAuthority}
                </span>

                {/* Email */}
                <span className={cx("ctmEmail")}>{c.email}</span>

                {/* Last contact */}
                <div className={cx("ctmLastContact")}>
                  <span className={cx("ctmLastContactLabel")}>Last contact</span>
                  <span className={cx("ctmLastContactDate")}>{c.lastContact}</span>
                </div>

              </div>
            ))}
          </div>

        </div>
      ))}

    </section>
  );
}
