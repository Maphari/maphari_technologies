// ════════════════════════════════════════════════════════════════════════════
// automation-audit-trail-page.tsx — Admin Automation Audit Trail
// Data : loadAuditEventsWithRefresh → GET /admin/audit-events
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAuditEventsWithRefresh,
  type AdminAuditEvent,
} from "../../../../lib/api/admin/governance";
import {
  simulateAutomation,
  type SimulateResult,
} from "../../../../lib/api/admin/automation";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTs(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-ZA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function shortResourceId(id: string | null): string {
  if (!id) return "—";
  return id.slice(0, 8).toUpperCase();
}

function roleBadge(role: string | null): string {
  switch (role?.toUpperCase()) {
    case "ADMIN":  return "badgePurple";
    case "STAFF":  return "badgeAccent";
    case "CLIENT": return "badgeAmber";
    default:       return "badgeMuted";
  }
}

// ── Topic list (matches automationTopics in automation service) ──────────────

const ALL_TOPICS = [
  "auth.user.logged-in",
  "auth.token.refreshed",
  "core.project.created",
  "core.project.status-updated",
  "core.project.completed",
  "core.booking.created",
  "core.proposal.signed",
  "core.onboarding.submitted",
  "ops.maintenance.check-completed",
  "security.incident.detected",
  "reporting.report.generated",
  "growth.testimonial.received",
  "growth.client.reengagement-due",
  "ai.lead.qualified",
  "ai.proposal.drafted",
  "ai.estimate.generated",
  "core.lead.created",
  "core.lead.status-updated",
  "core.lead.follow-up-due",
  "core.client.created",
  "core.client.status-updated",
  "core.client.renewal-due",
  "chat.conversation.created",
  "chat.message.created",
  "files.file.uploaded",
  "billing.invoice.issued",
  "billing.invoice.paid",
  "billing.invoice.overdue",
  "core.task.assigned",
  "core.appointment.created",
] as const;

// ── SimulationLab ──────────────────────────────────────────────────────────────

function SimulationLab({ session }: { session: AuthSession | null }) {
  const [topic, setTopic]           = useState<string>(ALL_TOPICS[0]);
  const [payload, setPayload]       = useState('{\n  "example": "value"\n}');
  const [payloadErr, setPayloadErr] = useState<string | null>(null);
  const [running, setRunning]       = useState(false);
  const [result, setResult]         = useState<SimulateResult | null>(null);
  const [simError, setSimError]     = useState<string | null>(null);

  const handleRun = useCallback(async () => {
    if (!session || running) return;
    setPayloadErr(null);
    setSimError(null);
    setResult(null);

    let parsed: Record<string, unknown> = {};
    try {
      const raw = JSON.parse(payload) as unknown;
      if (typeof raw !== "object" || Array.isArray(raw) || raw === null) {
        throw new Error("Payload must be a JSON object.");
      }
      parsed = raw as Record<string, unknown>;
    } catch (e) {
      setPayloadErr(e instanceof Error ? e.message : "Invalid JSON.");
      return;
    }

    setRunning(true);
    const res = await simulateAutomation(session, { topic, payload: parsed });
    if (res.nextSession) saveSession(res.nextSession);
    if (res.error) {
      setSimError(res.error.message);
    } else {
      setResult(res.data);
    }
    setRunning(false);
  }, [session, topic, payload, running]);

  return (
    <article className={styles.card}>
      <div className={styles.cardHd}>
        <span className={styles.cardHdTitle}>Simulation Lab</span>
        <span className={cx("badge", "badgeMuted")}>Dry-run — no execution</span>
      </div>
      <div className={styles.cardInner}>
        <div className={cx("colorMuted", "text12", "mb16")}>
          Validate that an event topic would trigger a workflow and preview estimated actions — without executing anything.
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="sim-topic">Event Topic</label>
          <select
            id="sim-topic"
            title="Select event topic"
            className={styles.selectInput}
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setResult(null); setSimError(null); }}
          >
            {ALL_TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="sim-payload">Payload (JSON object)</label>
          <textarea
            id="sim-payload"
            className={cx(styles.msgInput, "fontMono")}
            rows={4}
            value={payload}
            onChange={(e) => { setPayload(e.target.value); setPayloadErr(null); }}
            spellCheck={false}
          />
          {payloadErr && (
            <div className={cx("text11", "colorRed", "mt4")}>{payloadErr}</div>
          )}
        </div>

        <button
          type="button"
          className={cx("btnSm", "btnAccent")}
          onClick={() => void handleRun()}
          disabled={running || !session}
        >
          {running ? "Running…" : "Run Simulation"}
        </button>

        {simError && (
          <div className={cx("text12", "colorRed", "mt16")}>{simError}</div>
        )}

        {result && (
          <div className={cx("mt20")}>
            <div className={cx("flexRow", "gap8", "mb12")}>
              <span className={cx("text12", "fw600")}>Would trigger?</span>
              <span className={cx("badge", result.wouldTrigger ? "badgeGreen" : "badgeRed")}>
                {result.wouldTrigger ? "Yes" : "No"}
              </span>
            </div>

            <div className={cx("text12", "fw600", "mb4")}>Workflow</div>
            <div className={cx("fontMono", "text12", "colorAccent", "mb12")}>{result.workflow}</div>

            {result.estimatedActions.length > 0 && (
              <div>
                <div className={cx("text12", "fw600", "mb8")}>
                  Estimated Actions ({result.estimatedActions.length})
                </div>
                <ol className={cx("flexCol", "gap6")}>
                  {result.estimatedActions.map((action, i) => (
                    <li key={i} className={cx("fontMono", "text11", "colorMuted")}>
                      {i + 1}. {action}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {result.payloadKeys.length > 0 && (
              <div className={cx("mt12")}>
                <div className={cx("text11", "colorMuted")}>
                  Payload keys received: {result.payloadKeys.join(", ")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AutomationAuditTrailPage({ session }: { session: AuthSession | null }) {
  const [entries, setEntries] = useState<AdminAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void loadAuditEventsWithRefresh(session, { limit: 150 }).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setEntries(r.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / GOVERNANCE</div>
          <h1 className={styles.pageTitle}>Automation Audit Trail</h1>
          <div className={styles.pageSub}>Complete log of system actions and automated executions</div>
        </div>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Execution Log</span>
          {!loading && <span className={cx("colorMuted", "text12")}>{entries.length} entries</span>}
        </div>
        <div className={styles.cardInner}>
          {entries.length === 0 ? (
            <div className={cx("colorMuted2", "text13", "mt16")}>No audit events found.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Role</th>
                  <th scope="col">Resource</th>
                  <th scope="col">Target ID</th>
                  <th scope="col">Action</th>
                  <th scope="col">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className={cx("fontMono", "text12")}>{shortId(e.id)}</td>
                    <td className={cx("fw600", "text12")}>{e.actorName ?? "System"}</td>
                    <td>
                      {e.actorRole ? (
                        <span className={cx("badge", roleBadge(e.actorRole))}>
                          {e.actorRole}
                        </span>
                      ) : (
                        <span className={cx("colorMuted2", "text11")}>—</span>
                      )}
                    </td>
                    <td className={cx("text12")}>{e.resourceType}</td>
                    <td className={cx("fontMono", "text11", "colorMuted")}>{shortResourceId(e.resourceId)}</td>
                    <td className={cx("text12", "colorMuted")}>{e.action}</td>
                    <td className={cx("fontMono", "text11", "colorMuted")}>{formatTs(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>

      <SimulationLab session={session} />
    </div>
  );
}
