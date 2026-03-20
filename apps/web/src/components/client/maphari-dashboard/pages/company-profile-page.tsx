// ════════════════════════════════════════════════════════════════════════════
// company-profile-page.tsx — Client Company Profile (Advanced)
// Data     : loadPortalProfileWithRefresh → GET  /portal/profile
//            updatePortalProfileWithRefresh → PATCH /portal/profile
//            createPortalUploadUrlWithRefresh + confirmPortalUploadWithRefresh → logo upload
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalProfileWithRefresh,
  updatePortalProfileWithRefresh,
  createPortalUploadUrlWithRefresh,
  confirmPortalUploadWithRefresh,
  type PortalClientProfile,
  type PortalClientProfilePatch,
} from "../../../../lib/api/portal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function tierBadge(tier: string): string {
  const t = tier.toUpperCase();
  if (t === "ENTERPRISE") return "badgePurple";
  if (t === "PROFESSIONAL" || t === "PRO") return "badgeAccent";
  return "badgeMuted";
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

const TEAM_SIZE_OPTIONS = ["1–10", "11–50", "51–200", "201–500", "500+"];

const SOCIAL_FIELDS: Array<{ key: "linkedin" | "twitter" | "instagram" | "github"; label: string; placeholder: string; color: string }> = [
  { key: "linkedin",  label: "LinkedIn",     placeholder: "https://linkedin.com/company/…",  color: "#0A66C2" },
  { key: "twitter",   label: "Twitter / X",  placeholder: "https://twitter.com/…",            color: "#1DA1F2" },
  { key: "instagram", label: "Instagram",    placeholder: "https://instagram.com/…",          color: "#E1306C" },
  { key: "github",    label: "GitHub",       placeholder: "https://github.com/…",             color: "var(--text)" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function CompanyProfilePage() {
  const { session } = useProjectLayer();
  const notify = usePageToast();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [profile,       setProfile]       = useState<PortalClientProfile | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [editing,       setEditing]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [draft,         setDraft]         = useState<PortalClientProfilePatch>({});

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    void loadPortalProfileWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setProfile(r.data);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  function startEdit() {
    if (!profile) return;
    setDraft({
      companyName:   profile.companyName   ?? "",
      tagline:       profile.tagline       ?? "",
      mission:       profile.mission       ?? "",
      vision:        profile.vision        ?? "",
      description:   profile.description   ?? "",
      industry:      profile.industry      ?? "",
      website:       profile.website       ?? "",
      yearFounded:   profile.yearFounded   ?? undefined,
      teamSize:      profile.teamSize      ?? "",
      hqLocation:    profile.hqLocation    ?? "",
      socialLinks:   profile.socialLinks   ?? {},
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft({});
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      const r = await updatePortalProfileWithRefresh(session, draft);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        notify("error", "Save failed", r.error.message);
      } else if (r.data) {
        setProfile(r.data);
        setEditing(false);
        notify("success", "Profile saved", "Your company profile has been updated.");
      }
    } catch {
      notify("error", "Save failed", "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(file: File) {
    if (!session) return;
    setUploadingLogo(true);
    try {
      const urlRes = await createPortalUploadUrlWithRefresh(session, {
        fileName:  file.name,
        mimeType:  file.type,
        sizeBytes: file.size,
        category:  "logo",
      });
      if (urlRes.nextSession) saveSession(urlRes.nextSession);
      if (urlRes.error || !urlRes.data) {
        notify("error", "Upload failed", "Could not get upload URL.");
        return;
      }
      const { uploadUrl, fileId } = urlRes.data;
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!put.ok) { notify("error", "Upload failed", "Could not transfer file."); return; }

      const confirmRes = await confirmPortalUploadWithRefresh(session, fileId);
      if (confirmRes.nextSession) saveSession(confirmRes.nextSession);
      if (confirmRes.error) { notify("error", "Upload failed", confirmRes.error.message); return; }

      // Patch profile with the new logoUrl from confirmed upload
      const logoUrl = confirmRes.data?.id ?? fileId;
      const patchRes = await updatePortalProfileWithRefresh(session, { logoUrl });
      if (patchRes.nextSession) saveSession(patchRes.nextSession);
      if (patchRes.data) {
        setProfile(patchRes.data);
        notify("success", "Logo updated", "Your company logo has been uploaded.");
      }
    } catch {
      notify("error", "Upload failed", "An unexpected error occurred.");
    } finally {
      setUploadingLogo(false);
    }
  }

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("pageHeader", "mb0")}>
          <div>
            <div className={cx("pageEyebrow")}>Company</div>
            <h1 className={cx("pageTitle")}>Company Profile</h1>
          </div>
        </div>
        <div className={cx("skeletonBlock", "skeleH160", "mb16")} />
        <div className={cx("skeletonBlock", "skeleH200")} />
      </div>
    );
  }

  const displayName = profile?.companyName ?? profile?.name ?? "Your Company";
  const hasProfile  = !!(profile?.mission || profile?.vision || profile?.description);
  const initials    = displayName.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
  const socialLinks = profile?.socialLinks ?? {};

  return (
    <div className={cx("pageBody")}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Company · Identity</div>
          <h1 className={cx("pageTitle")}>Company Profile</h1>
          <p className={cx("pageSub")}>Your company identity, mission, social presence, and account information.</p>
        </div>
        <div className={cx("pageActions")}>
          {!editing ? (
            <button type="button" className={cx("btnSm", "btnAccent")} onClick={startEdit}>
              <Ic n="edit" sz={12} c="var(--bg)" /> Edit Profile
            </button>
          ) : (
            <>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={cancelEdit} disabled={saving}>Cancel</button>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void handleSave()} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Hero card ───────────────────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardBodyPad", "pt20")}>
          <div className={cx("flexAlignStart", "gap20", "flexWrap")}>
            {/* Logo / Avatar with upload */}
            <div className={cx("relative", "noShrink")}>
              <div
                className={cx("companyLogoBox", "dynBgColor")}
                style={{
                  "--bg-color": profile?.logoUrl
                    ? `url(${profile.logoUrl}) center/cover no-repeat`
                    : "color-mix(in oklab, var(--lime) 15%, var(--s3))",
                  "--color": "color-mix(in oklab, var(--lime) 25%, var(--b2))",
                } as React.CSSProperties}
              >
                {!profile?.logoUrl && (
                  <span className={cx("fw800", "colorAccent", "fs2rem")}>{initials}</span>
                )}
              </div>
              <button
                type="button"
                title="Upload logo"
                className={cx("cpLogoUploadBtn")}
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo
                  ? <span className={cx("fs9")}>…</span>
                  : <Ic n="upload" sz={11} c="var(--bg)" />}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className={cx("dNone")}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleLogoUpload(file);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Name + tagline */}
            <div className={cx("flex1", "minW200")}>
              {editing ? (
                <input
                  className={cx("input", "mb8")}
                  value={draft.companyName ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, companyName: e.target.value }))}
                  placeholder="Company name"
                />
              ) : (
                <h2 className={cx("fontSyne", "fw800", "fs14rem", "mb4")}>
                  {displayName}
                </h2>
              )}
              {editing ? (
                <input
                  className={cx("input")}
                  value={draft.tagline ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, tagline: e.target.value }))}
                  placeholder="Your tagline or motto…"
                />
              ) : (
                <p className={cx("text12", "colorMuted", "m0")}>
                  {profile?.tagline ?? "No tagline set — click Edit Profile to add one."}
                </p>
              )}
            </div>

            {/* Tier + SLA badges */}
            <div className={cx("flexAlignStart", "gap8", "flexWrap")}>
              {profile && <span className={cx("badge", tierBadge(profile.tier))}>{profile.tier}</span>}
              {profile && <span className={cx("badge", "badgeMuted")}>{profile.slaTier} SLA</span>}
            </div>
          </div>

          {/* ── Identity row: industry, website, year, team, HQ ── */}
          <div className={cx("flexRow", "flexWrap", "gap12", "mt20")}>
            {editing ? (
              <>
                <div className={cx("cpIdentityField")}>
                  <label className={cx("text10", "colorMuted")}>Industry</label>
                  <input className={cx("input", "h32")} value={draft.industry ?? ""} onChange={(e) => setDraft((p) => ({ ...p, industry: e.target.value }))} placeholder="e.g. Fintech" />
                </div>
                <div className={cx("cpIdentityField", "minW200")}>
                  <label className={cx("text10", "colorMuted")}>Website</label>
                  <input className={cx("input", "h32")} value={draft.website ?? ""} onChange={(e) => setDraft((p) => ({ ...p, website: e.target.value }))} placeholder="https://yourcompany.com" />
                </div>
                <div className={cx("cpIdentityField", "minW120")}>
                  <label className={cx("text10", "colorMuted")}>Year Founded</label>
                  <input className={cx("input", "h32")} type="number" value={draft.yearFounded ?? ""} onChange={(e) => setDraft((p) => ({ ...p, yearFounded: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="2018" />
                </div>
                <div className={cx("cpIdentityField", "minW140")}>
                  <label className={cx("text10", "colorMuted")}>Team Size</label>
                  <select className={cx("input", "h32")} value={draft.teamSize ?? ""} onChange={(e) => setDraft((p) => ({ ...p, teamSize: e.target.value }))}>
                    <option value="">Select…</option>
                    {TEAM_SIZE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className={cx("cpIdentityField", "minW200")}>
                  <label className={cx("text10", "colorMuted")}>HQ Location</label>
                  <input className={cx("input", "h32")} value={draft.hqLocation ?? ""} onChange={(e) => setDraft((p) => ({ ...p, hqLocation: e.target.value }))} placeholder="Cape Town, ZA" />
                </div>
              </>
            ) : (
              <>
                {profile?.industry && <span className={cx("badge", "badgeMuted")}><Ic n="briefcase" sz={9} c="var(--muted2)" /> {profile.industry}</span>}
                {profile?.website && (
                  <span className={cx("flexRow", "gap4")}>
                    <Ic n="globe" sz={10} c="var(--lime)" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className={cx("text11", "colorAccent")}>
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </span>
                )}
                {profile?.yearFounded && <span className={cx("badge", "badgeMuted")}>Est. {profile.yearFounded}</span>}
                {profile?.teamSize && <span className={cx("badge", "badgeMuted")}>{profile.teamSize} people</span>}
                {profile?.hqLocation && <span className={cx("badge", "badgeMuted")}><Ic n="location" sz={9} c="var(--muted2)" /> {profile.hqLocation}</span>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── About section ───────────────────────────────────────────────── */}
      {(hasProfile || editing) && (
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <Ic n="info" sz={14} c="var(--lime)" />
            <span className={cx("cardHdTitle", "ml8")}>About</span>
          </div>
          <div className={cx("cardBodyPad")}>
            {[
              { key: "description" as const, label: "What We Do",  placeholder: "Describe your business and what you do…" },
              { key: "mission"     as const, label: "Mission",      placeholder: "Our mission is to…" },
              { key: "vision"      as const, label: "Vision",       placeholder: "We envision a world where…" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className={cx("mb16")}>
                <div className={cx("fw600", "text11", "mb6", "colorMuted")}>{label}</div>
                {editing ? (
                  <textarea
                    className={cx("input", "wFull", "resizeV", "boxBorder")}
                    value={(draft[key] as string | undefined) ?? ""}
                    onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={3}
                  />
                ) : (
                  <p className={cx("text12", "m0", "lineH165", "preWrap")}>
                    {profile?.[key] ?? <span className={cx("colorMuted")}>Not set.</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Social Links ─────────────────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <Ic n="users" sz={14} c="var(--purple)" />
          <span className={cx("cardHdTitle", "ml8")}>Social Presence</span>
        </div>
        <div className={cx("cardBodyPad")}>
          {editing ? (
            <div className={cx("grid2Cols12Gap")}>
              {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={cx("text10", "colorMuted", "mb4", "block")}>{label}</label>
                  <input
                    className={cx("input")}
                    value={(draft.socialLinks as Record<string, string> | undefined)?.[key] ?? ""}
                    onChange={(e) => setDraft((p) => ({
                      ...p,
                      socialLinks: { ...(p.socialLinks ?? {}), [key]: e.target.value }
                    }))}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={cx("flexCol", "gap0")}>
              {SOCIAL_FIELDS.map(({ key, label, color }) => {
                const url = (socialLinks as Record<string, string | undefined>)[key];
                return (
                  <div key={key} className={cx("flexBetween", "py10_0", "borderB")}>
                    <span className={cx("text12", "colorMuted")}>{label}</span>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className={cx("text12", "dynColor")} style={{ "--color": color } as React.CSSProperties}>
                        {url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                      </a>
                    ) : (
                      <span className={cx("text11", "colorMuted")}>Not set</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Empty-state prompt ──────────────────────────────────────────── */}
      {!hasProfile && !editing && (
        <div className={cx("emptyState", "mt8")}>
          <div className={cx("emptyStateIcon")}><Ic n="file" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>Complete your company profile</div>
          <div className={cx("emptyStateSub")}>Add your mission, vision, social links, and company details to build credibility.</div>
          <button type="button" className={cx("btnSm", "btnAccent", "mt14")} onClick={startEdit}>
            Set Up Profile
          </button>
        </div>
      )}

      {/* ── Contact & Account Info ──────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <Ic n="users" sz={14} c="var(--amber)" />
          <span className={cx("cardHdTitle", "ml8")}>Contact & Account</span>
          <span className={cx("text10", "colorMuted", "mlAuto")}>Read-only · Managed by Maphari</span>
        </div>
        <div className={cx("cardBodyPad")}>
          {[
            { label: "Owner / Contact",   value: profile?.ownerName    ?? "—" },
            { label: "Billing Email",     value: profile?.billingEmail  ?? "—" },
            { label: "Timezone",          value: profile?.timezone      ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className={cx("flexBetween", "py9_0", "borderB")}>
              <span className={cx("text12", "colorMuted")}>{label}</span>
              <span className={cx("fw600", "text12")}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contract Details ────────────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <Ic n="file" sz={14} c="var(--purple)" />
          <span className={cx("cardHdTitle", "ml8")}>Contract</span>
        </div>
        <div className={cx("cardBodyPad")}>
          {[
            { label: "Tier",              value: profile?.tier             ?? "—" },
            { label: "SLA Level",         value: profile?.slaTier          ?? "—" },
            { label: "Contract Start",    value: fmtDate(profile?.contractStartAt   ?? null) },
            { label: "Contract Renewal",  value: fmtDate(profile?.contractRenewalAt ?? null) },
          ].map(({ label, value }) => (
            <div key={label} className={cx("flexBetween", "py9_0", "borderB")}>
              <span className={cx("text12", "colorMuted")}>{label}</span>
              <span className={cx("fw600", "text12", "fontMono")}>{value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
