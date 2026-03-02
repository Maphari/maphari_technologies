"use client";

import { useState, useMemo } from "react";
import { cx, styles } from "../style";

const categories = [
  { icon: "🚀", name: "Getting Started", count: 8, description: "Portal setup and first steps" },
  { icon: "📋", name: "Project Process", count: 12, description: "Review cycles, scope, timelines" },
  { icon: "💰", name: "Billing & Invoices", count: 6, description: "Payments and budgets" },
  { icon: "📁", name: "Files & Deliverables", count: 9, description: "Access and download assets" },
  { icon: "🔒", name: "Security & Access", count: 5, description: "2FA and permissions" },
  { icon: "🛠", name: "Technical", count: 7, description: "Integrations and developer handoff" },
];

const articles = [
  { title: "How do I give feedback on a design?", category: "Project Process", readTime: "2 min", updated: "Feb 14, 2026" },
  { title: "What is the difference between a scope change and a revision?", category: "Project Process", readTime: "3 min", updated: "Feb 10, 2026" },
  { title: "When will I receive my next invoice?", category: "Billing & Invoices", readTime: "1 min", updated: "Feb 18, 2026" },
  { title: "How do I access source files after project completion?", category: "Files & Deliverables", readTime: "2 min", updated: "Jan 20, 2026" },
  { title: "How do I add a team member to my portal?", category: "Security & Access", readTime: "1 min", updated: "Jan 15, 2026" },
  { title: "How do I schedule a call with my project lead?", category: "Getting Started", readTime: "1 min", updated: "Jan 12, 2026" },
  { title: "What happens if the project runs over timeline?", category: "Project Process", readTime: "4 min", updated: "Feb 5, 2026" },
  { title: "Is my project data secure and confidential?", category: "Security & Access", readTime: "2 min", updated: "Jan 8, 2026" },
];

export function KnowledgeAccessPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = articles;
    if (selectedCategory) result = result.filter((a) => a.category === selectedCategory);
    if (search.trim()) result = result.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [search, selectedCategory]);

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>Veldt Finance · Knowledge</div>
          <h1 className={cx("pageTitle")}>Knowledge Base</h1>
          <p className={cx("pageSub")}>Find answers to common questions about your project and our process.</p>
        </div>
      </div>

      <div className={cx("card", "p16", "mb16")}>
        <input
          type="text"
          className={cx("input")}
          placeholder="🔍 Search the knowledge base..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {categories.map((c) => (
          <button
            key={c.name}
            type="button"
            className={cx("card", "p16")}
            style={{ cursor: "pointer", textAlign: "left", border: selectedCategory === c.name ? "1px solid var(--accent)" : undefined }}
            onClick={() => setSelectedCategory(selectedCategory === c.name ? null : c.name)}
          >
            <div style={{ fontSize: "24px", marginBottom: "6px" }}>{c.icon}</div>
            <div className={cx("fw700", "text12")}>{c.name}</div>
            <div className={cx("text11", "colorMuted")}>{c.description}</div>
            <div className={cx("text10", "colorAccent", "mt4")}>{c.count} articles</div>
          </button>
        ))}
      </div>

      <div className={cx("card")}>
        <div className={cx("cardHd")} style={{ padding: "12px 16px" }}>
          <span className={cx("cardHdTitle")}>{selectedCategory ? `${selectedCategory}` : "All Articles"} ({filtered.length})</span>
          {selectedCategory && <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setSelectedCategory(null)}>Clear</button>}
        </div>
        <div>
          {filtered.map((a) => (
            <div key={a.title} className={cx("flexBetween", "p12", "borderB")} style={{ cursor: "pointer" }}>
              <div>
                <div className={cx("fw600", "text12")}>{a.title}</div>
                <div className={cx("text10", "colorMuted")}>{a.category} · {a.readTime} · Updated {a.updated}</div>
              </div>
              <span className={cx("colorMuted")}>→</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className={cx("p24", "colorMuted")} style={{ textAlign: "center" }}>No articles found. Try a different search or category.</div>
          )}
        </div>
      </div>
    </div>
  );
}
