"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type Category = {
  id: "onboarding" | "delivery" | "finance" | "comms" | "tools" | "culture";
  label: string;
  icon: string;
  color: string;
};

type Article = {
  id: number;
  category: Category["id"];
  title: string;
  tags: string[];
  author: string;
  updatedAt: string;
  readTime: string;
  pinned: boolean;
  content: string;
};

const categories: Category[] = [
  { id: "onboarding", label: "Client Onboarding", icon: "◈", color: "var(--accent)" },
  { id: "delivery", label: "Delivery & QA", icon: "◎", color: "#a78bfa" },
  { id: "finance", label: "Finance & Billing", icon: "₹", color: "#f5c518" },
  { id: "comms", label: "Communication", icon: "✉", color: "#60a5fa" },
  { id: "tools", label: "Tools & Access", icon: "⊡", color: "#ff8c00" },
  { id: "culture", label: "Culture & Standards", icon: "◌", color: "#a0a0b0" }
];

const articles: Article[] = [
  {
    id: 1,
    category: "onboarding",
    title: "New client onboarding SOP",
    tags: ["SOP", "checklist", "critical"],
    author: "Account Team",
    updatedAt: "Feb 18",
    readTime: "4 min",
    pinned: true,
    content: `## Overview
Every new client must complete the 8-step onboarding process before any billable project work begins. This ensures legal, financial, and creative alignment from day one.

## Steps

**1. Welcome email (Staff - Day 0)**
Send the personalised welcome email within 2 hours of contract signature. Use the welcome email template in the Templates folder. Include: project manager name, portal login link, kickoff calendar invite.

**2. Project brief (Staff - Day 0)**
Share the completed project brief via the client portal. Brief must be approved internally by a senior before sending.

**3. Contract signature (Client - within 48h)**
Contract sent via PandaDoc. Chase after 48h if not signed. Do not begin work without a signed contract.

**4. Deposit invoice (Client - before kickoff)**
Invoice must be paid before the kickoff call. No exceptions. Escalate to account manager if payment is delayed more than 3 days.

**5. Portal activation (Staff - after deposit)**
Activate the client portal once deposit is confirmed. Grant access to: messages, milestones, documents, invoices.

**6. Kickoff call (Both - within first week)**
60-minute kickoff via Google Meet. Agenda: introductions, brief walkthrough, timeline, communication preferences, Q&A. Record and store in Drive.

**7. Brand assets (Client - within 5 days of kickoff)**
Request all existing brand materials: logos, guidelines, competitor references, photography. Send the asset checklist template.

**8. Tools access (Staff - within 24h of kickoff)**
Set up shared Drive folder, Slack channel (if applicable), Figma workspace. Grant appropriate access levels only.`
  },
  {
    id: 2,
    category: "delivery",
    title: "Milestone submission checklist",
    tags: ["SOP", "delivery", "quality"],
    author: "Design Lead",
    updatedAt: "Feb 10",
    readTime: "3 min",
    pinned: true,
    content: `## Before submitting any milestone

Use this checklist every time - no exceptions.

**Files**
- [ ] All assets exported in agreed formats (RGB + CMYK where applicable)
- [ ] File naming follows convention: Client_ProjectName_MilestoneName_v1
- [ ] Files uploaded to the correct client Drive folder
- [ ] No placeholder or temp content in deliverables

**Communication**
- [ ] Milestone summary written clearly (what was done, what to review)
- [ ] Context note added: any decisions made during the work
- [ ] Clear call to action for client (what you need from them)
- [ ] Estimated response time communicated

**Internal**
- [ ] Peer review completed (for milestones over R5,000)
- [ ] Hours logged against correct project and task
- [ ] Any scope creep flagged to account manager before submission`
  },
  {
    id: 3,
    category: "finance",
    title: "Invoice and payment process",
    tags: ["finance", "billing", "SOP"],
    author: "Finance Team",
    updatedAt: "Jan 30",
    readTime: "3 min",
    pinned: false,
    content: `## Invoicing schedule

Retainer invoices go out on the 1st of each month. Project invoices are sent upon milestone approval unless agreed otherwise.

## Creating an invoice

Use the invoice template in Drive > Finance > Templates. Always include:
- Client name, project name, invoice number
- Line items with descriptions
- Payment terms (standard: 14 days)
- Banking details

## Overdue invoices

**7 days overdue:** Send a gentle reminder via email (template available)
**14 days overdue:** Notify account manager
**21 days overdue:** Pause non-critical work, escalate to director

## Retainer overages

If a client's retainer hours are exceeded, flag to the account manager immediately. Do not continue work until an overage is approved in writing.`
  },
  {
    id: 4,
    category: "comms",
    title: "Client communication standards",
    tags: ["communication", "standards"],
    author: "Account Team",
    updatedAt: "Feb 5",
    readTime: "2 min",
    pinned: false,
    content: `## Response time targets

- Inbound client messages: respond within 2 hours during business hours
- After-hours messages: acknowledge by 9 AM next business day
- Milestone feedback: begin revisions within 24 hours of approval

## Tone guidelines

Use professional, warm language. Avoid jargon. Write as a trusted expert, not a vendor.

Always:
- Lead with what you've done, then what you need
- Be specific about timelines and deliverables
- Acknowledge feedback before responding to it

Never:
- Promise timelines without checking capacity first
- Use passive voice when communicating delays
- Copy admin or directors without flagging to account manager first

## Escalation

If a client becomes difficult or unresponsive for more than 5 business days, escalate to the account manager. Do not try to resolve relationship issues unilaterally.`
  },
  {
    id: 5,
    category: "tools",
    title: "Tool access and credentials policy",
    tags: ["tools", "security", "access"],
    author: "IT / Ops",
    updatedAt: "Jan 20",
    readTime: "2 min",
    pinned: false,
    content: `## General rules

Never share personal login credentials. All client credentials must be stored in the shared 1Password vault under the correct client folder.

## Access levels

**Client-facing tools** (portal, Drive, Figma): Grant read or comment access only unless client explicitly needs edit rights.

**Internal tools** (Notion, Slack, Linear): Do not grant client access without director approval.

## Offboarding

When a project closes, revoke all client access within 24 hours. Archive the client Drive folder and transfer final assets. Do not delete - archive only.

## Reporting a breach

If you suspect a credentials breach or unauthorised access, notify the account director immediately via Slack (not email). Do not attempt to resolve it yourself.`
  },
  {
    id: 6,
    category: "culture",
    title: "Creative review standards",
    tags: ["quality", "review", "design"],
    author: "Creative Director",
    updatedAt: "Feb 14",
    readTime: "3 min",
    pinned: false,
    content: `## The golden rule

Never show a client something you wouldn't be proud to put in your portfolio. If it's not ready, say so.

## Internal review

All design work must be reviewed by at least one senior team member before client delivery. This is non-negotiable for milestones over R3,000.

## Giving feedback

Be specific and actionable. "The hierarchy isn't working" is not feedback. "The heading is competing with the body text - reduce the heading size or increase contrast" is feedback.

## Receiving feedback

Don't defend - understand first. Ask clarifying questions if needed. Acknowledge before responding.

## The 3-concept rule

For all brand and campaign deliverables, present minimum 3 distinct directions unless the brief explicitly limits this. Clients should always feel they have a choice.`
  }
];

type SelectedCategory = "all" | Category["id"] | "bookmarked";

function ArticleRow({
  article,
  selected,
  onSelect,
  bookmarked,
  onBookmark,
  categoriesList
}: {
  article: Article;
  selected: boolean;
  onSelect: () => void;
  bookmarked: boolean;
  onBookmark: () => void;
  categoriesList: Category[];
}) {
  const category = categoriesList.find((entry) => entry.id === article.category);
  return (
    <div
      onClick={onSelect}
      style={{
        padding: "11px 10px",
        borderRadius: 3,
        marginBottom: 3,
        background: selected ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "transparent",
        border: `1px solid ${selected ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "transparent"}`,
        cursor: "pointer"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: 11, color: category?.color, flexShrink: 0, marginTop: 1 }}>{category?.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: selected ? "#fff" : "#a0a0b0", lineHeight: 1.4, marginBottom: 4 }}>{article.title}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "var(--muted2)" }}>{article.updatedAt}</span>
            <span style={{ fontSize: 9, color: "var(--muted2)" }}>{article.readTime}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onBookmark();
          }}
          style={{ fontSize: 12, color: bookmarked ? "#f5c518" : "#222230", flexShrink: 0, background: "none", border: "none", cursor: "pointer" }}
        >
          {bookmarked ? "★" : "☆"}
        </button>
      </div>
    </div>
  );
}

export function KnowledgeBasePage({ isActive }: { isActive: boolean }) {
  const [selectedCat, setSelectedCat] = useState<SelectedCategory>("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(articles[0] ?? null);
  const [search, setSearch] = useState("");
  const [bookmarked, setBookmarked] = useState<number[]>([1, 2]);

  const categoryFiltered = useMemo(() => {
    if (selectedCat === "all") return articles;
    if (selectedCat === "bookmarked") return articles.filter((article) => bookmarked.includes(article.id));
    return articles.filter((article) => article.category === selectedCat);
  }, [bookmarked, selectedCat]);

  const filtered = useMemo(() => {
    return categoryFiltered.filter(
      (article) =>
        !search ||
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }, [categoryFiltered, search]);

  const pinned = filtered.filter((article) => article.pinned);
  const rest = filtered.filter((article) => !article.pinned);

  const visibleList = selectedCat === "bookmarked" ? filtered : [...pinned, ...rest];

  const toggleBookmark = (id: number) =>
    setBookmarked((previous) => (previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]));

  const renderContent = (content: string) => {
    return content.split("\n").map((line, index) => {
      if (line.startsWith("## ")) {
        return (
          <div key={index} style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", margin: "20px 0 10px", letterSpacing: "-0.01em" }}>
            {line.replace("## ", "")}
          </div>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <div key={index} style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500, margin: "12px 0 6px" }}>
            {line.replace(/\*\*/g, "")}
          </div>
        );
      }
      if (line.startsWith("- [ ]")) {
        return (
          <div key={index} style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: "4px 0" }}>
            <div style={{ width: 14, height: 14, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2, marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.5 }}>{line.replace("- [ ] ", "")}</span>
          </div>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <div key={index} style={{ display: "flex", gap: 8, alignItems: "flex-start", margin: "4px 0 4px 8px" }}>
            <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 6, fontSize: 6 }}>●</span>
            <span style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.6 }}>{line.replace("- ", "")}</span>
          </div>
        );
      }
      if (line === "") return <div key={index} style={{ height: 6 }} />;
      return (
        <p key={index} style={{ fontSize: 13, color: "#a0a0b0", lineHeight: 1.8, margin: "4px 0" }}>
          {line}
        </p>
      );
    });
  };

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-knowledge-base" style={{ padding: 0 }}>
      <style>{`
        .kb-cat-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; text-align: left; }
        .kb-cat-btn:hover { background: rgba(255,255,255,0.04) !important; }
        .kb-article-row { transition: all 0.12s ease; cursor: pointer; }
        .kb-article-row:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "'DM Mono', monospace", color: "var(--text)", display: "grid", gridTemplateColumns: "240px 280px 1fr" }}>
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", padding: "28px 16px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 8 }}>Staff Wiki</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 20, paddingLeft: 8 }}>Knowledge Base</div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search articles…"
            style={{ width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "var(--text)", fontSize: 11, marginBottom: 16, outline: "none" }}
          />

          <button
            type="button"
            className="kb-cat-btn"
            onClick={() => setSelectedCat("all")}
            style={{ padding: "8px 10px", borderRadius: 2, background: selectedCat === "all" ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent", color: selectedCat === "all" ? "var(--accent)" : "var(--muted2)", fontSize: 11, letterSpacing: "0.06em", marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span>All articles</span>
            <span style={{ fontSize: 10, color: "var(--muted2)" }}>{articles.length}</span>
          </button>

          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0 10px" }} />

          {categories.map((category) => {
            const count = articles.filter((article) => article.category === category.id).length;
            const isActive = selectedCat === category.id;
            return (
              <button
                key={category.id}
                type="button"
                className="kb-cat-btn"
                onClick={() => setSelectedCat(category.id)}
                style={{ padding: "8px 10px", borderRadius: 2, background: isActive ? `${category.color}12` : "transparent", fontSize: 11, marginBottom: 3, display: "flex", alignItems: "center", gap: 8, color: isActive ? category.color : "var(--muted2)" }}
              >
                <span style={{ fontSize: 12 }}>{category.icon}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{category.label}</span>
                <span style={{ fontSize: 10, color: "#333344" }}>{count}</span>
              </button>
            );
          })}

          <div style={{ marginTop: "auto" }}>
            <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0 10px" }} />
            <button
              type="button"
              className="kb-cat-btn"
              onClick={() => setSelectedCat("bookmarked")}
              style={{ padding: "8px 10px", borderRadius: 2, background: selectedCat === "bookmarked" ? "rgba(245,197,24,0.08)" : "transparent", color: selectedCat === "bookmarked" ? "#f5c518" : "var(--muted2)", fontSize: 11, width: "100%", display: "flex", alignItems: "center", gap: 8 }}
            >
              <span>★</span>
              <span>Bookmarked</span>
              <span style={{ fontSize: 10, color: "#333344", marginLeft: "auto" }}>{bookmarked.length}</span>
            </button>
          </div>
        </div>

        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", padding: "20px 12px", overflowY: "auto" }}>
          {selectedCat !== "bookmarked" && pinned.length > 0 ? (
            <>
              <div style={{ fontSize: 9, color: "#333344", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>Pinned</div>
              {pinned.map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  selected={selectedArticle?.id === article.id}
                  onSelect={() => setSelectedArticle(article)}
                  bookmarked={bookmarked.includes(article.id)}
                  onBookmark={() => toggleBookmark(article.id)}
                  categoriesList={categories}
                />
              ))}
              {rest.length > 0 ? <div style={{ fontSize: 9, color: "#333344", letterSpacing: "0.12em", textTransform: "uppercase", margin: "14px 0 8px", paddingLeft: 8 }}>All</div> : null}
            </>
          ) : null}

          {visibleList.map((article) => (
            <ArticleRow
              key={`article-${article.id}`}
              article={article}
              selected={selectedArticle?.id === article.id}
              onSelect={() => setSelectedArticle(article)}
              bookmarked={bookmarked.includes(article.id)}
              onBookmark={() => toggleBookmark(article.id)}
              categoriesList={categories}
            />
          ))}

          {filtered.length === 0 ? <div style={{ padding: "20px 8px", fontSize: 11, color: "#333344" }}>No articles found.</div> : null}
        </div>

        <div style={{ padding: "32px 40px", overflowY: "auto" }}>
          {selectedArticle ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  {(() => {
                    const category = categories.find((entry) => entry.id === selectedArticle.category);
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 10, color: category?.color, padding: "2px 8px", borderRadius: 2, background: `${category?.color}12`, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          {category?.label}
                        </span>
                        {selectedArticle.pinned ? <span style={{ fontSize: 10, color: "#f5c518" }}>◈ Pinned</span> : null}
                      </div>
                    );
                  })()}
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", marginBottom: 10 }}>{selectedArticle.title}</h2>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "var(--muted2)" }}>By {selectedArticle.author}</span>
                    <span style={{ fontSize: 10, color: "var(--muted2)" }}>Updated {selectedArticle.updatedAt}</span>
                    <span style={{ fontSize: 10, color: "var(--muted2)" }}>{selectedArticle.readTime} read</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBookmark(selectedArticle.id)}
                  style={{ fontSize: 18, color: bookmarked.includes(selectedArticle.id) ? "#f5c518" : "#333344", padding: "4px 8px", background: "none", border: "none", cursor: "pointer" }}
                >
                  {bookmarked.includes(selectedArticle.id) ? "★" : "☆"}
                </button>
              </div>

              <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
                {selectedArticle.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: "rgba(255,255,255,0.04)", color: "var(--muted2)", letterSpacing: "0.06em" }}>
                    {tag}
                  </span>
                ))}
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24 }}>{renderContent(selectedArticle.content)}</div>
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: 80, color: "#333344" }}>Select an article to read</div>
          )}
        </div>
      </div>
    </section>
  );
}
