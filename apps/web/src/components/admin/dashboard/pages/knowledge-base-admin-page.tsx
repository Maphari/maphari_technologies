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
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadKnowledgeArticlesWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) setError(r.error.message ?? "Failed to load.");
      else if (r.data) setArticles(r.data);
      setLoading(false);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load.");
      setLoading(false);
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

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  // ── Derived chart data ───────────────────────────────────────────────────
  const categoryCounts = articles.reduce<Record<string, number>>((acc, a) => {
    const cat = a.category ?? "Uncategorized";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});
  const categoryChartData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
  const avgViews = articles.length > 0 ? Math.round(totalViews / articles.length) : 0;

  return (
    <div className={styles.pageBody}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>KNOWLEDGE / BASE</div>
          <h1 className={styles.pageTitle}>Knowledge Base</h1>
          <div className={styles.pageSub}>Article inventory · Coverage gaps · Usage metrics</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ New Article</button>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Total Articles" value={articles.length} tone="accent" sparkData={[20, 25, 28, 30, 33, 35, 38, articles.length]} />
        <StatWidget label="Published" value={published} tone="green" progressValue={articles.length > 0 ? Math.round((published / articles.length) * 100) : 0} />
        <StatWidget label="Draft" value={drafts} tone="amber" progressValue={articles.length > 0 ? Math.round((drafts / articles.length) * 100) : 0} />
        <StatWidget label="Avg Views / Article" value={avgViews} sub="per article" />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Articles by Category"
          type="bar"
          data={categoryChartData.length > 0 ? categoryChartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Article Status"
          stages={[
            { label: "Published", count: published, total: articles.length, color: "#34d98b" },
            { label: "Draft", count: drafts, total: articles.length, color: "#f5a623" },
            { label: "Under Review", count: underReview, total: articles.length, color: "#8b6fff" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="All Articles"
          rows={articles as unknown as Record<string, unknown>[]}
          rowKey="id"
          columns={[
            { key: "title", header: "Title", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.title ?? "")}</span> },
            { key: "category", header: "Category", render: (_v, row) => <span className={cx("badge")}>{String(row.category ?? "—")}</span> },
            { key: "viewCount", header: "Views", align: "right", render: (_v, row) => <span className={cx("fontMono")}>{String(row.viewCount ?? 0)}</span> },
            { key: "updatedAt", header: "Last Updated", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{formatDate(String(row.updatedAt ?? ""))}</span> },
            { key: "status", header: "Status", align: "right", render: (_v, row) => <span className={cx("badge", statusBadge(String(row.status ?? "")))}>{String(row.status ?? "")}</span> },
            {
              key: "id", header: "Actions", align: "right",
              render: (_v, row) => (
                <div className={cx("flexRow", "gap6")} style={{ justifyContent: "flex-end" }}>
                  {String(row.status ?? "").toUpperCase() !== "PUBLISHED" && (
                    <button type="button" className={cx("btnSm", "btnAccent")} disabled={publishing === String(row.id)} onClick={() => void handlePublish(String(row.id))}>
                      {publishing === String(row.id) ? "…" : "Publish"}
                    </button>
                  )}
                  <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
                </div>
              ),
            },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}
