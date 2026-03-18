// ════════════════════════════════════════════════════════════════════════════
// rate-card-page.tsx — Staff Rate Card Reference
// Data     : getMyProfile → GET /staff/me (to highlight current role)
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getMyProfile, type StaffProfile } from "../../../../lib/api/staff";
import { inferCountryFromLocale, currencyFromCountry } from "../../../../lib/i18n/currency";

// ── Static rate reference (read-only, no rate card API yet) ─────────────────
const STANDARD_RATES = [
  { role: "Senior Designer",   hourlyRate: 450, dayRate: 3600,  retainerMonthly: 36000 },
  { role: "Mid-level Designer", hourlyRate: 350, dayRate: 2800,  retainerMonthly: 28000 },
  { role: "Junior Designer",   hourlyRate: 250, dayRate: 2000,  retainerMonthly: 20000 },
  { role: "Brand Strategist",  hourlyRate: 500, dayRate: 4000,  retainerMonthly: 40000 },
  { role: "UX Researcher",     hourlyRate: 400, dayRate: 3200,  retainerMonthly: 32000 },
  { role: "Copywriter",        hourlyRate: 300, dayRate: 2400,  retainerMonthly: 24000 },
  { role: "Project Manager",   hourlyRate: 380, dayRate: 3040,  retainerMonthly: 30400 },
  { role: "Motion Designer",   hourlyRate: 420, dayRate: 3360,  retainerMonthly: 33600 },
  { role: "Developer",         hourlyRate: 480, dayRate: 3840,  retainerMonthly: 38400 },
];

const ADD_ONS = [
  { item: "Rush delivery (< 48h)",   multiplier: "1.5×"  as string | undefined, fixed: undefined as string | undefined, note: "Applied to hourly rate"             },
  { item: "Weekend / After-hours",   multiplier: "1.75×" as string | undefined, fixed: undefined as string | undefined, note: "Applied to hourly rate"             },
  { item: "Strategy workshop",       multiplier: undefined as string | undefined, fixed: "R8,000"  as string | undefined, note: "Half-day facilitated session"       },
  { item: "Brand audit",             multiplier: undefined as string | undefined, fixed: "R12,000" as string | undefined, note: "Comprehensive brand health review"  },
  { item: "User testing session",    multiplier: undefined as string | undefined, fixed: "R6,500"  as string | undefined, note: "Moderated, 5 participants"          },
];

function tierOf(role: string): { label: string; cls: string } {
  if (role.includes("Senior"))    return { label: "Senior",     cls: "rcTierSenior"     };
  if (role.includes("Mid"))       return { label: "Mid-level",  cls: "rcTierMid"        };
  if (role.includes("Junior"))    return { label: "Junior",     cls: "rcTierJunior"     };
  return                                 { label: "Specialist", cls: "rcTierSpecialist" };
}

function fmt(n: number) {
  return `R${n.toLocaleString()}`;
}

export function RateCardPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch staff profile to highlight current role ───────────────────────
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    getMyProfile(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setProfile(r.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  const localCurrency = useMemo(() => {
    if (typeof navigator === "undefined") return "USD";
    const country = inferCountryFromLocale(navigator.language);
    return currencyFromCountry(country) ?? "USD";
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────
  const rates = STANDARD_RATES;
  const hourlyRates = useMemo(() => rates.map((r) => r.hourlyRate), [rates]);
  const minRate     = Math.min(...hourlyRates);
  const maxRate     = Math.max(...hourlyRates);
  const avgRate     = Math.round(hourlyRates.reduce((s, r) => s + r, 0) / hourlyRates.length);
  const minRole     = rates.find((r) => r.hourlyRate === minRate)!;
  const maxRole     = rates.find((r) => r.hourlyRate === maxRate)!;

  // ── Match current user's role to a rate row ────────────────────────────
  const myRole = profile?.role ?? null;
  const myRateMatch = myRole
    ? rates.find((r) => r.role.toLowerCase() === myRole.toLowerCase())
    : null;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-rate-card">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Rate Card Reference</h1>
        <p className={cx("pageSubtitleText", "mb20")}>
          Standard pricing and rate reference (read-only)
          {myRateMatch && profile ? ` \u2014 Your role: ${profile.role}` : ""}
        </p>
      </div>

      {/* ── Loading state ──────────────────────────────────────────────────── */}
      {loading && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Loading rate card...</div>
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────────── */}
      {!loading && (
        <>
          {/* ── Summary stats ──────────────────────────────────────────────── */}
          <div className={cx("rcStatGrid")}>

            {/* Roles listed */}
            <div className={cx("rcStatCard")}>
              <div className={cx("rcStatCardTop")}>
                <div className={cx("rcStatLabel")}>Roles Listed</div>
                <div className={cx("rcStatValue", "colorAccent")}>{rates.length}</div>
              </div>
              <div className={cx("rcStatCardDivider")} />
              <div className={cx("rcStatCardBottom")}>
                <span className={cx("rcStatDot", "dotBgAccent")} />
                <span className={cx("rcStatMeta")}>read-only reference</span>
              </div>
            </div>

            {/* Min hourly */}
            <div className={cx("rcStatCard")}>
              <div className={cx("rcStatCardTop")}>
                <div className={cx("rcStatLabel")}>Min Hourly</div>
                <div className={cx("rcStatValue", "colorGreen")}>{fmt(minRate)}</div>
              </div>
              <div className={cx("rcStatCardDivider")} />
              <div className={cx("rcStatCardBottom")}>
                <span className={cx("rcStatDot", "dotBgGreen")} />
                <span className={cx("rcStatMeta")}>{minRole.role}</span>
              </div>
            </div>

            {/* Avg hourly */}
            <div className={cx("rcStatCard")}>
              <div className={cx("rcStatCardTop")}>
                <div className={cx("rcStatLabel")}>Avg Hourly</div>
                <div className={cx("rcStatValue")}>{fmt(avgRate)}</div>
              </div>
              <div className={cx("rcStatCardDivider")} />
              <div className={cx("rcStatCardBottom")}>
                <span className={cx("rcStatDot", "dotBgMuted2")} />
                <span className={cx("rcStatMeta")}>across all {rates.length} roles</span>
              </div>
            </div>

            {/* Max hourly */}
            <div className={cx("rcStatCard")}>
              <div className={cx("rcStatCardTop")}>
                <div className={cx("rcStatLabel")}>Max Hourly</div>
                <div className={cx("rcStatValue", "colorAmber")}>{fmt(maxRate)}</div>
              </div>
              <div className={cx("rcStatCardDivider")} />
              <div className={cx("rcStatCardBottom")}>
                <span className={cx("rcStatDot", "dotBgAmber")} />
                <span className={cx("rcStatMeta")}>{maxRole.role}</span>
              </div>
            </div>

            {/* Your rate (when profile matches) */}
            {myRateMatch && (
              <div className={cx("rcStatCard")}>
                <div className={cx("rcStatCardTop")}>
                  <div className={cx("rcStatLabel")}>Your Rate</div>
                  <div className={cx("rcStatValue", "colorAccent")}>{fmt(myRateMatch.hourlyRate)}/hr</div>
                </div>
                <div className={cx("rcStatCardDivider")} />
                <div className={cx("rcStatCardBottom")}>
                  <span className={cx("rcStatDot", "dotBgAccent")} />
                  <span className={cx("rcStatMeta")}>{myRateMatch.role}</span>
                </div>
              </div>
            )}

          </div>

          {/* ── Standard rates ─────────────────────────────────────────────── */}
          <div className={cx("rcSection")}>
            <div className={cx("rcSectionHeader")}>
              <div className={cx("rcSectionTitle")}>Standard Rates</div>
              <span className={cx("rcSectionMeta")}>{rates.length} ROLES · {localCurrency}</span>
            </div>

            <div className={cx("rcRoleGrid")}>
              {rates.map((rate) => {
                const tier = tierOf(rate.role);
                const isMyRole = myRole ? rate.role.toLowerCase() === myRole.toLowerCase() : false;
                return (
                  <div
                    key={rate.role}
                    className={cx("rcRoleCard")}
                    style={isMyRole ? { outline: "2px solid var(--accent)", outlineOffset: -2 } : undefined}
                  >

                    {/* Role name + tier badge */}
                    <div className={cx("rcRoleHead")}>
                      <div className={cx("rcRoleName")}>
                        {rate.role}
                        {isMyRole && <span className={cx("ml6", "opacity70")}>(you)</span>}
                      </div>
                      <span className={cx("rcTierBadge", tier.cls)}>{tier.label}</span>
                    </div>

                    {/* Hourly rate (large) */}
                    <div className={cx("rcHourlyDisplay")}>
                      <span className={cx("rcHourlyAmount")}>{fmt(rate.hourlyRate)}</span>
                      <span className={cx("rcHourlyPer")}>/hr</span>
                    </div>

                    {/* Day rate + monthly retainer */}
                    <div className={cx("rcRateRow")}>
                      <div className={cx("rcRateCell")}>
                        <div className={cx("rcRateCellLabel")}>Day Rate</div>
                        <div className={cx("rcRateCellValue")}>{fmt(rate.dayRate)}</div>
                      </div>
                      <div className={cx("rcRateCell")}>
                        <div className={cx("rcRateCellLabel")}>Monthly</div>
                        <div className={cx("rcRateCellValue")}>{fmt(rate.retainerMonthly)}</div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Add-ons & modifiers ────────────────────────────────────────── */}
          <div className={cx("rcSection")}>
            <div className={cx("rcSectionHeader")}>
              <div className={cx("rcSectionTitle")}>Add-on Services &amp; Modifiers</div>
              <span className={cx("rcSectionMeta")}>{ADD_ONS.length} ITEMS</span>
            </div>
            <div className={cx("tableWrap")}>
              <table className={cx("table")}>
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Rate / Multiplier</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {ADD_ONS.map((addon) => (
                    <tr key={addon.item}>
                      <td className={cx("fw600")}>{addon.item}</td>
                      <td>
                        {addon.multiplier
                          ? <span className={cx("rcMultiplierBadge")}>{addon.multiplier}</span>
                          : <span className={cx("rcFixedBadge")}>{addon.fixed}</span>
                        }
                      </td>
                      <td className={cx("colorMuted")}>{addon.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
