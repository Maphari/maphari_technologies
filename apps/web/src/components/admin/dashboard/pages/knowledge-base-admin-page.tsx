// ════════════════════════════════════════════════════════════════════════════
// knowledge-base-admin-page.tsx — Admin Knowledge Base
// Data     : loadKnowledgeArticlesWithRefresh → GET /admin/knowledge
//            updateKnowledgeArticleWithRefresh → PATCH /admin/knowledge/:id
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadKnowledgeArticlesWithRefresh,
  updateKnowledgeArticleWithRefresh,
  type AdminKnowledgeArticle,
} from "../../../../lib/api/admin";

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "PUBLISHED") return "badgeGreen";
  if (s === "DRAFT")     return "badgeAmber";
  return "badgeBlue"; // REVIEW
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function KnowledgeBaseAdminPage({ session }: { session: AuthSession | null }) {
  const [articles,   setArticles]   = useState<AdminKnowledgeArticle[]>([]);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    void loadKnowledgeArticlesWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setArticles(r.data);
    });
  }, [session]);

  const published   = articles.filter((a) => a.status.toUpperCase() === "PUBLISHED").length;
  const drafts      = articles.filter((a) => a.status.toUpperCase() === "DRAFT").length;
  const underReview = articles.filter((a) => a.status.toUpperCase() === "REVIEW").length;
  const totalViews  = articles.reduce((s, a) => s + a.viewCount, 0);

  async function handlePublish(id: string) {
    if (!session || publishing) return;
    setPublishing(id);
    try {
      const r = await updateKnowledgeArticleWithRefresh(session, id, { status: "PUBLISHED" });
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setArticles((prev) => prev.map((a) => a.id === id ? r.data! : a));
    } finally {
      setPublishing(null);
    }
  }

  return (
    <div className={styles.pageBody}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / KNOWLEDGE</div>
          <h1 className={styles.pageTitle}>Knowledge Base Admin</h1>
          <div className={styles.pageSub}>Curate, organize, and moderate knowledge base articles</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ New Article</button>
      </div>

      {/* ── KPI Cards ── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Published",    value: String(published),   cls: "colorAccent" },
          { label: "Drafts",       value: String(drafts),      cls: "colorAmber"  },
          { label: "Under Review", value: String(underReview), cls: "colorBlue"   },
          { label: "Total Views",  value: String(totalViews),  cls: "colorAccent" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, s.cls)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>All Articles</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Author</th>
                <th scope="col">Views</th>
                <th scope="col">Updated</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={7} className={cx("colorMuted", "text12", "textCenter", "py16")}>
                    No articles yet.
                  </td>
                </tr>
              ) : (
                articles.map((a) => (
                  <tr key={a.id}>
                    <td className={cx("fw600")}>{a.title}</td>
                    <td><span className={cx("badge")}>{a.category ?? "—"}</span></td>
                    <td className={cx("colorMuted")}>{a.authorName ?? "—"}</td>
                    <td className={cx("fontMono")}>{a.viewCount}</td>
                    <td className={cx("text12", "colorMuted")}>{formatDate(a.updatedAt)}</td>
                    <td>
                      <span className={cx("badge", statusBadge(a.status))}>{a.status}</span>
                    </td>
                    <td>
                      <div className={cx("flexRow", "gap6")}>
                        {a.status.toUpperCase() !== "PUBLISHED" && (
                          <button
                            type="button"
                            className={cx("btnSm", "btnAccent")}
                            disabled={publishing === a.id}
                            onClick={() => void handlePublish(a.id)}
                          >
                            {publishing === a.id ? "…" : "Publish"}
                          </button>
                        )}
                        <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
