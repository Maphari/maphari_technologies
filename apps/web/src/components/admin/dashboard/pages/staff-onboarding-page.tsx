"use client";
// ════════════════════════════════════════════════════════════════════════════
// staff-onboarding-page.tsx — Admin Staff Onboarding (real API)
// GET /auth/staff/users  |  GET /staff/:id/onboarding (lazy per card)
// ════════════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import { AdminTabs } from "./shared";
import { cx, styles } from "../style";
import { formatDate, toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadStaffUsersWithRefresh, loadStaffOnboardingWithRefresh } from "../../../../lib/api/admin";
import type { StaffAccessUser, StaffOnboardingRecord } from "../../../../lib/api/admin";

type StaffOnboardingPageProps = { session: AuthSession | null; onNotify: (tone: "success" | "error" | "info", message: string) => void };
type OnboardingStatus = "upcoming" | "active" | "complete";
type OnboardingTask = { category: string; task: string; done: boolean; doneDate?: string; owner: string };
type Onboarding = { id: string; name: string; role: string; department: string; avatar: string; color: string; startDate: string; manager: string; buddyAssigned: string; status: OnboardingStatus; daysUntilStart: number | null; checklist: OnboardingTask[] };

const categories = ["Pre-Start Admin", "Tech & Tools Setup", "Day 1 Welcome", "Week 1 Training", "30-Day Check-In"] as const;
const categoryColors: Record<(typeof categories)[number], string> = {
  "Pre-Start Admin": "var(--accent)", "Tech & Tools Setup": "var(--blue)",
  "Day 1 Welcome": "var(--accent)", "Week 1 Training": "var(--amber)", "30-Day Check-In": "var(--amber)"
};
const statusBadge: Record<OnboardingStatus, { badge: string; label: string }> = {
  upcoming: { badge: "badgeAmber", label: "Upcoming" }, active: { badge: "badgeBlue", label: "Active" }, complete: { badge: "badgeGreen", label: "Complete" }
};
const templateChecklist: Record<(typeof categories)[number], string[]> = {
  "Pre-Start Admin": ["Offer letter signed and returned", "Employment contract sent", "Background check completed", "Bank details collected for payroll", "Tax number confirmed", "ID copy received"],
  "Tech & Tools Setup": ["Laptop ordered and configured", "Email account created", "Slack, Notion, Asana access granted", "Adobe CC / Figma licence assigned", "VPN and security setup"],
  "Day 1 Welcome": ["Welcome email sent to new hire", "Desk and workspace ready", "Studio tour and team intro scheduled", "Welcome lunch booked", "Buddy assigned and introduced"],
  "Week 1 Training": ["Maphari brand values walkthrough", "Client portfolio overview with manager", "Department-specific tool training", "First project brief assigned", "Company processes & SOPs reviewed"],
  "30-Day Check-In": ["1:1 check-in with manager", "Pulse survey sent to new hire", "Initial performance notes documented", "Probation goals set"]
};
const COLORS = ["var(--accent)", "var(--blue)", "var(--purple)", "var(--amber)"];
const tabs = ["active onboardings", "template", "completed"] as const;
type Tab = (typeof tabs)[number];

function initials(email: string) { return email.split("@")[0].split(/[._-]/).slice(0, 2).map((p) => (p[0] ?? "").toUpperCase()).join(""); }
function emailToName(email: string) { return email.split("@")[0].split(/[._-]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" "); }

function buildOnboarding(user: StaffAccessUser, records: StaffOnboardingRecord[], idx: number): Onboarding {
  const allDone = records.length > 0 && records.every((r) => r.status === "complete");
  const daysSince = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);
  const status: OnboardingStatus = allDone ? "complete" : daysSince < 0 ? "upcoming" : "active";
  const daysUntilStart = daysSince < 0 ? Math.abs(daysSince) : null;
  return {
    id: user.id, name: emailToName(user.email), role: user.role, department: "—",
    avatar: initials(user.email), color: COLORS[idx % COLORS.length],
    startDate: formatDate(user.createdAt), manager: "—", buddyAssigned: "—",
    status, daysUntilStart,
    checklist: records.map((r) => ({ category: r.category, task: r.task, done: r.status === "complete", doneDate: r.completedAt ? formatDate(r.completedAt) : undefined, owner: r.owner ?? "—" }))
  };
}

function Avatar({ initials: init, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return <div className={cx("fontMono", "flexCenter", "noShrink", "fw700", styles.onboardAvatar, size <= 28 ? styles.onboardAvatar28 : styles.onboardAvatar36, toneClass(color))}>{init}</div>;
}

type ModalForm = { staffUserId: string; startDate: string; notes: string };
const EMPTY_FORM: ModalForm = { staffUserId: "", startDate: "", notes: "" };

export function StaffOnboardingPage({ session, onNotify }: StaffOnboardingPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("active onboardings");
  const [expanded, setExpanded] = useState<string>("");
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());

  // ── Start Onboarding Modal ─────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [staffList, setStaffList] = useState<StaffAccessUser[]>([]);
  const [staffListLoading, setStaffListLoading] = useState(false);
  const [form, setForm] = useState<ModalForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const firstFocusRef = useRef<HTMLSelectElement>(null);

  function openModal() {
    setForm(EMPTY_FORM);
    setShowModal(true);
    if (!staffList.length && session) {
      setStaffListLoading(true);
      loadStaffUsersWithRefresh(session).then((res) => {
        setStaffListLoading(false);
        if (res.nextSession) saveSession(res.nextSession);
        if (res.error || !res.data) { onNotify("error", res.error?.message ?? "Failed to load staff."); return; }
        setStaffList(res.data.filter((u) => u.isActive));
      });
    }
    // Focus first field after paint
    setTimeout(() => firstFocusRef.current?.focus(), 80);
  }

  function closeModal() { setShowModal(false); }

  async function handleStartOnboarding(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !form.staffUserId) return;
    setSubmitting(true);

    const selectedUser = staffList.find((u) => u.id === form.staffUserId);
    const displayName = selectedUser ? emailToName(selectedUser.email) : "staff member";

    // Load their existing onboarding records — this seeds them if the backend
    // auto-creates records on first access, or confirms records already exist.
    const res = await loadStaffOnboardingWithRefresh(session, form.staffUserId);
    if (res.nextSession) saveSession(res.nextSession);
    setSubmitting(false);

    if (res.error) {
      onNotify("error", res.error.message ?? "Failed to start onboarding.");
      return;
    }

    // Merge the newly-loaded records into the existing onboardings list so the
    // page reflects the update without requiring a full reload.
    setLoadedIds((prev) => new Set(prev).add(form.staffUserId));
    setOnboardings((prev) => {
      const exists = prev.find((o) => o.id === form.staffUserId);
      if (!exists) return prev;
      const records = res.data ?? [];
      return prev.map((o) =>
        o.id !== form.staffUserId ? o : {
          ...o,
          startDate: form.startDate ? formatDate(form.startDate) : o.startDate,
          checklist: records.map((r) => ({
            category: r.category,
            task: r.task,
            done: r.status === "complete",
            doneDate: r.completedAt ? formatDate(r.completedAt) : undefined,
            owner: r.owner ?? "—"
          })),
          status: records.length > 0 && records.every((r) => r.status === "complete") ? "complete" : "active"
        }
      );
    });

    // Switch to the active tab and expand the selected staff card
    setActiveTab("active onboardings");
    setExpanded(form.staffUserId);
    closeModal();
    onNotify("success", `Onboarding started for ${displayName}.`);
  }

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      setLoading(true);
      const usersRes = await loadStaffUsersWithRefresh(session!);
      if (cancelled) return;
      if (usersRes.error || !usersRes.data) { onNotify("error", usersRes.error?.message ?? "Failed to load staff."); setLoading(false); return; }
      const active = usersRes.data.filter((u) => u.isActive);
      if (!active.length) { setOnboardings([]); setLoading(false); return; }
      const first = active[0];
      const firstRes = await loadStaffOnboardingWithRefresh(session!, first.id);
      if (cancelled) return;
      const built = active.map((u, i) => buildOnboarding(u, u.id === first.id ? (firstRes.data ?? []) : [], i));
      setOnboardings(built);
      setLoadedIds(new Set([first.id]));
      if (built.length) setExpanded(built[0].id);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleExpand(staffId: string) {
    const expanding = expanded !== staffId;
    setExpanded(expanding ? staffId : "");
    if (!expanding || loadedIds.has(staffId) || !session) return;
    setLoadingIds((p) => new Set(p).add(staffId));
    const res = await loadStaffOnboardingWithRefresh(session, staffId);
    setLoadingIds((p) => { const n = new Set(p); n.delete(staffId); return n; });
    if (res.error) { onNotify("error", res.error.message ?? "Failed to load onboarding records."); return; }
    setLoadedIds((p) => new Set(p).add(staffId));
    setOnboardings((prev) => prev.map((o) => o.id !== staffId ? o : { ...o, checklist: (res.data ?? []).map((r) => ({ category: r.category, task: r.task, done: r.status === "complete", doneDate: r.completedAt ? formatDate(r.completedAt) : undefined, owner: r.owner ?? "—" })), status: (res.data ?? []).every((r) => r.status === "complete") && (res.data ?? []).length > 0 ? "complete" : o.status }));
  }

  const active = onboardings.filter((o) => o.status !== "complete");
  const complete = onboardings.filter((o) => o.status === "complete");
  const allTasks = active[0]?.checklist ?? [];
  const doneTasks = allTasks.filter((t) => t.done).length;
  const overallPct = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;
  const nextStart = active.find((o) => o.daysUntilStart !== null);

  return (
    <div className={cx(styles.pageBody, styles.onboardRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / STAFF</div>
          <h1 className={styles.pageTitle}>Staff Onboarding</h1>
          <div className={styles.pageSub}>New hire checklists, pre-start tasks, week 1 welcome, and 30-day check-ins</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")} onClick={openModal}>+ Start Onboarding</button>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Upcoming Starts", value: active.length.toString(), color: "var(--amber)", sub: active[0] ? `${active[0].name} - ${active[0].startDate}` : "None" },
          { label: "Overall Progress", value: `${overallPct}%`, color: overallPct >= 60 ? "var(--accent)" : "var(--amber)", sub: `${doneTasks}/${allTasks.length} tasks done` },
          { label: "Days Until Start", value: nextStart?.daysUntilStart?.toString() ?? "—", color: (nextStart?.daysUntilStart ?? 99) <= 7 ? "var(--red)" : "var(--blue)", sub: nextStart?.name ?? "No upcoming" },
          { label: "Completed Onboardings", value: complete.length.toString(), color: "var(--accent)", sub: "This FY" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, "mb4", styles.onboardToneText, toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} primaryColor="var(--accent)" mutedColor="var(--muted)" panelColor="var(--surface)" borderColor="var(--border)" />

      <div className={cx("overflowAuto", "minH0")}>
        {loading && <div className={cx("text12", "colorMuted", "fontMono")}>Loading onboarding data...</div>}

        {!loading && activeTab === "active onboardings" ? (
          <div className={cx("flexCol", "gap16")}>
            {!active.length && <div className={cx("text12", "colorMuted")}>No active onboardings found.</div>}
            {nextStart && (nextStart.daysUntilStart ?? 999) <= 10 ? (
              <div className={cx("card", "flexRow", "gap16", "p16", styles.onboardAlert)}>
                <div>
                  <div className={cx("fw700", "colorAmber")}>Action Required - {nextStart.name} starts in {nextStart.daysUntilStart} days</div>
                  <div className={cx("text12", "colorMuted", "mt4")}>{nextStart.checklist.filter((t) => !t.done && t.category === "Pre-Start Admin").length} pre-start admin tasks still outstanding.</div>
                </div>
              </div>
            ) : null}
            {active.map((onb) => {
              const done = onb.checklist.filter((t) => t.done).length;
              const total = onb.checklist.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const sc = statusBadge[onb.status];
              const isExp = expanded === onb.id;
              const isLoadingRecs = loadingIds.has(onb.id);
              return (
                <div key={onb.id} className={styles.card}>
                  <div role="button" tabIndex={0} className={cx("p24", "pointerCursor")}
                    onClick={() => handleExpand(onb.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleExpand(onb.id); } }}>
                    <div className={styles.onboardRow}>
                      <div className={cx("flexRow", "gap12")}>
                        <Avatar initials={onb.avatar} color={onb.color} />
                        <div>
                          <div className={cx("fw700")}>{onb.name}</div>
                          <div className={cx("text11", "colorMuted")}>{onb.role}</div>
                          <div className={cx("text10", "colorMuted")}>Starts {onb.startDate}</div>
                        </div>
                      </div>
                      <div>
                        <div className={cx("flexBetween", "mb4")}>
                          <span className={cx("text11", "colorMuted")}>{done}/{total} tasks</span>
                          <span className={cx("fontMono", "fw700", styles.onboardToneText, pct >= 70 ? styles.onboardToneAccent : styles.onboardToneAmber)}>{pct}%</span>
                        </div>
                        <progress className={cx(styles.onboardProgTrack, styles.onboardProgFill, pct >= 70 ? styles.onboardToneAccent : styles.onboardToneAmber)} max={100} value={pct} aria-label={`${onb.name} onboarding ${pct}%`} />
                      </div>
                      <div>
                        <div className={cx("text10", "colorMuted", "mb3")}>Manager</div>
                        <div className={cx("text12")}>{onb.manager.split(" ")[0]}</div>
                      </div>
                      <div>
                        <div className={cx("text10", "colorMuted", "mb3")}>Buddy</div>
                        <div className={cx("text12")}>{onb.buddyAssigned.split(" ")[0]}</div>
                      </div>
                      <span className={cx("badge", sc.badge)}>{sc.label}</span>
                      <span className={cx(styles.onboardToneText, isExp ? styles.onboardToneAccent : styles.onboardToneMuted)}>{isExp ? "\u25b2" : "\u25bc"}</span>
                    </div>
                  </div>
                  {isExp ? (
                    <div className={cx("borderB", styles.onboardExpanded)}>
                      {isLoadingRecs ? <div className={cx("text12", "colorMuted", "fontMono", "p16")}>Loading tasks...</div> : (
                        <>
                          <div className={cx("grid3", "gap14", styles.onboardExpandedTop)}>
                            {categories.slice(0, 3).map((cat) => {
                              const catTasks = onb.checklist.filter((t) => t.category === cat);
                              const catDone = catTasks.filter((t) => t.done).length;
                              const catColor = categoryColors[cat];
                              return (
                                <div key={cat} className={cx("bgBg", "p16", styles.onboardToneBorder, toneClass(catColor))}>
                                  <div className={cx("flexBetween", "mb12")}>
                                    <span className={cx("text11", "fw700", "uppercase", "tracking", styles.onboardToneText, toneClass(catColor))}>{cat}</span>
                                    <span className={cx("text10", "fontMono", styles.onboardToneText, catDone === catTasks.length ? styles.onboardToneAccent : styles.onboardToneMuted)}>{catDone}/{catTasks.length}</span>
                                  </div>
                                  {catTasks.map((task, i) => (
                                    <div key={i} className={cx("flexRow", "gap8", "mb8", styles.onboardAlignStart)}>
                                      <div className={cx("flexCenter", "noShrink", styles.onboardTaskCheck, toneClass(task.done ? "var(--accent)" : "var(--border)"), task.done && styles.onboardTaskCheckDone)}>
                                        {task.done ? <span className={cx("fw800", styles.onboardCheckMark)}>&#10003;</span> : null}
                                      </div>
                                      <div className={styles.onboardGrow}>
                                        <div className={cx("text11", styles.onboardTaskText, task.done && styles.onboardTaskDone)}>{task.task}</div>
                                        <div className={cx("textXs", "colorMuted")}>{task.owner}{task.doneDate ? ` - Done ${task.doneDate}` : ""}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                          <div className={cx("grid2", "gap14", "mt16")}>
                            {categories.slice(3).map((cat) => {
                              const catTasks = onb.checklist.filter((t) => t.category === cat);
                              const catDone = catTasks.filter((t) => t.done).length;
                              const catColor = categoryColors[cat];
                              return (
                                <div key={cat} className={cx("bgBg", "p16", styles.onboardToneBorder, toneClass(catColor))}>
                                  <div className={cx("flexBetween", "mb12")}>
                                    <span className={cx("text11", "fw700", "uppercase", "tracking", styles.onboardToneText, toneClass(catColor))}>{cat}</span>
                                    <span className={cx("text10", "fontMono", styles.onboardToneText, catDone === catTasks.length ? styles.onboardToneAccent : styles.onboardToneMuted)}>{catDone}/{catTasks.length}</span>
                                  </div>
                                  {catTasks.map((task, i) => (
                                    <div key={i} className={cx("flexRow", "gap8", "mb8", styles.onboardAlignStart)}>
                                      <div className={cx("flexCenter", "noShrink", styles.onboardTaskCheck, toneClass(task.done ? "var(--accent)" : "var(--border)"), task.done && styles.onboardTaskCheckDone)}>
                                        {task.done ? <span className={cx("fw800", styles.onboardCheckMark)}>&#10003;</span> : null}
                                      </div>
                                      <div className={styles.onboardGrow}>
                                        <div className={cx("text11", styles.onboardTaskText, task.done && styles.onboardTaskDone)}>{task.task}</div>
                                        <div className={cx("textXs", "colorMuted")}>{task.owner}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                          <div className={cx("flexRow", "gap8", "mt20")}>
                            <button type="button" className={cx("btnSm", "btnAccent")}>Update Tasks</button>
                            <button type="button" className={cx("btnSm", "btnGhost")}>View Timeline</button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {!loading && activeTab === "template" ? (
          <div>
            <div className={cx("text13", "colorMuted", "mb20")}>Standard onboarding template applied to all new hires. Edit to customize per role or department.</div>
            <div className={cx("grid2", "gap14")}>
              {Object.entries(templateChecklist).map(([cat, tasks]) => {
                const color = categoryColors[cat as keyof typeof categoryColors];
                return (
                  <div key={cat} className={cx(styles.card, styles.onboardTemplateCard, toneClass(color))}>
                    <div className={cx("flexBetween", "mb16")}>
                      <div className={cx("text12", "fw700", "uppercase", "tracking", styles.onboardToneText, toneClass(color))}>{cat}</div>
                      <span className={cx("text10", "fontMono", "colorMuted")}>{tasks.length} tasks</span>
                    </div>
                    {tasks.map((task, i) => (
                      <div key={i} className={cx("flexRow", "gap10", "borderB", "py10")}>
                        <div className={cx("noShrink", styles.onboardTemplateChk)} />
                        <span className={cx("text12", styles.onboardGrow)}>{task}</span>
                      </div>
                    ))}
                    <button type="button" className={cx("btnSm", "btnGhost", "mt12")}>+ Add Task</button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {!loading && activeTab === "completed" ? (
          <div className={cx("flexCol", "gap10")}>
            {!complete.length && <div className={cx("text12", "colorMuted")}>No completed onboardings found.</div>}
            {complete.map((onb) => (
              <div key={onb.id} className={cx(styles.card, styles.onboardCompleteCard)}>
                <div className={styles.onboardCompleteRow}>
                  <div className={cx("flexRow", "gap10")}>
                    <Avatar initials={onb.avatar} color={onb.color} size={28} />
                    <div>
                      <div className={cx("fw600")}>{onb.name}</div>
                      <div className={cx("text11", "colorMuted")}>{onb.role}</div>
                    </div>
                  </div>
                  <div className={cx("text11", "colorMuted")}>Started {onb.startDate}</div>
                  <div className={cx("text11", "colorMuted")}>Manager: {onb.manager.split(" ")[0]}</div>
                  <span className={cx("text10", "colorAccent")}>100% Complete</span>
                  <button type="button" className={cx("btnSm", "btnGhost")}>View Archive</button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* ── Start Onboarding Modal ──────────────────────────────────────── */}
      {showModal ? (
        <div
          className={cx("modalOverlay")}
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboard-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          onKeyDown={(e) => { if (e.key === "Escape") closeModal(); }}
        >
          <div className={cx(styles.card, "modalPanel")} style={{ minWidth: 380, maxWidth: 520, width: "100%" }}>
            <div className={cx(styles.cardHd, "flexBetween")}>
              <span id="onboard-modal-title" className={cx("fw700", "text14")}>Start Onboarding</span>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={closeModal} aria-label="Close">✕</button>
            </div>
            <form className={styles.cardInner} onSubmit={handleStartOnboarding}>
              <div className={cx("flexCol", "gap14")}>

                {/* Staff member selector */}
                <div className={cx("flexCol", "gap6")}>
                  <label htmlFor="onboard-staff" className={cx("text11", "fw600", "colorMuted", "uppercase", "tracking")}>
                    Staff Member <span className={cx("colorRed")}>*</span>
                  </label>
                  {staffListLoading ? (
                    <div className={cx("text12", "colorMuted", "fontMono")}>Loading staff…</div>
                  ) : (
                    <select
                      id="onboard-staff"
                      ref={firstFocusRef}
                      className={cx("inputSm")}
                      value={form.staffUserId}
                      required
                      onChange={(e) => setForm((f) => ({ ...f, staffUserId: e.target.value }))}
                    >
                      <option value="">— Select staff member —</option>
                      {staffList.map((u) => (
                        <option key={u.id} value={u.id}>{emailToName(u.email)} ({u.role})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Start date */}
                <div className={cx("flexCol", "gap6")}>
                  <label htmlFor="onboard-start-date" className={cx("text11", "fw600", "colorMuted", "uppercase", "tracking")}>
                    Start Date
                  </label>
                  <input
                    id="onboard-start-date"
                    type="date"
                    className={cx("inputSm")}
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>

                {/* Notes / instructions */}
                <div className={cx("flexCol", "gap6")}>
                  <label htmlFor="onboard-notes" className={cx("text11", "fw600", "colorMuted", "uppercase", "tracking")}>
                    Notes / Instructions
                  </label>
                  <textarea
                    id="onboard-notes"
                    className={cx("inputSm")}
                    rows={3}
                    placeholder="Any special notes for this onboarding…"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    style={{ resize: "vertical" }}
                  />
                </div>

                {/* Actions */}
                <div className={cx("flexRow", "gap8", "mt4")}>
                  <button
                    type="submit"
                    className={cx("btnSm", "btnAccent")}
                    disabled={submitting || !form.staffUserId}
                  >
                    {submitting ? "Starting…" : "Start Onboarding"}
                  </button>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={closeModal} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
