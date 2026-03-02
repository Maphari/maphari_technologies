"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type Category = {
  id: "onboarding" | "delivery" | "finance" | "comms" | "tools" | "culture";
  label: string;
  icon: string;
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
  { id: "onboarding", label: "Client Onboarding", icon: "◈" },
  { id: "delivery", label: "Delivery & QA", icon: "◎" },
  { id: "finance", label: "Finance & Billing", icon: "₹" },
  { id: "comms", label: "Communication", icon: "✉" },
  { id: "tools", label: "Tools & Access", icon: "⊡" },
  { id: "culture", label: "Culture & Standards", icon: "◌" }
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
    <div onClick={onSelect} className={cx("kbArticleRow", "kbArticleRowShell", selected && "kbArticleRowSelected", "mb4")}>
      <div className={cx("flexRow", "gap8", "kbArticleRowTop")}>
        <span className={cx("text11", "noShrink", "kbCategoryTone")} data-category={article.category}>
          {category?.icon}
        </span>

        <div className={cx("flex1", "minW0")}>
          <div className={cx("text12", "mb4", "kbArticleTitle", selected && "kbArticleTitleSelected")}>{article.title}</div>
          <div className={cx("flexRow", "gap8")}>
            <span className={cx("textXs", "colorMuted2")}>{article.updatedAt}</span>
            <span className={cx("textXs", "colorMuted2")}>{article.readTime}</span>
          </div>
        </div>

        <button
          type="button"
          className={cx("kbBookmarkBtn", bookmarked && "kbBookmarkBtnActive")}
          onClick={(event) => {
            event.stopPropagation();
            onBookmark();
          }}
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

  const renderContent = (content: string) =>
    content.split("\n").map((line, index) => {
      if (line.startsWith("## ")) {
        return (
          <div key={index} className={cx("kbDocHeading")}>
            {line.replace("## ", "")}
          </div>
        );
      }

      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <div key={index} className={cx("kbDocStrong")}>{line.replace(/\*\*/g, "")}</div>
        );
      }

      if (line.startsWith("- [ ]")) {
        return (
          <div key={index} className={cx("kbDocChecklistRow")}>
            <div className={cx("kbDocCheckbox")} />
            <span className={cx("text12", "colorMuted", "kbDocChecklistText")}>{line.replace("- [ ] ", "")}</span>
          </div>
        );
      }

      if (line.startsWith("- ")) {
        return (
          <div key={index} className={cx("kbDocBulletRow")}>
            <span className={cx("kbDocBullet")}>●</span>
            <span className={cx("text12", "colorMuted", "kbDocBulletText")}>{line.replace("- ", "")}</span>
          </div>
        );
      }

      if (line === "") return <div key={index} className={cx("kbDocSpacer")} />;

      return (
        <p key={index} className={cx("text13", "colorMuted", "kbDocParagraph")}>
          {line}
        </p>
      );
    });

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive", "p0")} id="page-knowledge-base">
      <div className={cx("kbShell")}>
        <div className={cx("flexCol", "kbSidebar")}>
          <div className={cx("pageHeaderBar", "kbSidePad8")}>
            <div className={cx("pageEyebrowText", "mb6")}>Staff Wiki</div>
            <h1 className={cx("pageTitleText", "mb20", "kbSideTitle")}>Knowledge Base</h1>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search articles..."
            className={cx("kbSearchInput")}
          />

          <button
            type="button"
            className={cx("kbCatBtn", "flexBetween", "mb4", "kbCatBtnBase", selectedCat === "all" ? "kbCatBtnAllActive" : "kbCatBtnIdle")}
            onClick={() => setSelectedCat("all")}
          >
            <span>All articles</span>
            <span className={cx("text10", "colorMuted2")}>{articles.length}</span>
          </button>

          <div className={cx("kbDivider")} />

          {categories.map((category) => {
            const count = articles.filter((article) => article.category === category.id).length;
            const selected = selectedCat === category.id;

            return (
              <button
                key={category.id}
                type="button"
                className={cx("kbCatBtn", "flexRow", "gap8", "kbCatBtnBase", "kbCatBtnCategory", selected ? "kbCatBtnCategoryActive" : "kbCatBtnIdle")}
                data-category={category.id}
                onClick={() => setSelectedCat(category.id)}
              >
                <span className={cx("text12")}>{category.icon}</span>
                <span className={cx("flex1", "kbCatLabel")}>{category.label}</span>
                <span className={cx("text10", "colorMuted2")}>{count}</span>
              </button>
            );
          })}

          <div className={cx("kbSidebarBottom")}>
            <div className={cx("kbDivider", "kbDividerBottom")} />

            <button
              type="button"
              className={cx(
                "kbCatBtn",
                "wFull",
                "flexRow",
                "gap8",
                "kbCatBtnBase",
                selectedCat === "bookmarked" ? "kbBookBtnActive" : "kbCatBtnIdle"
              )}
              onClick={() => setSelectedCat("bookmarked")}
            >
              <span>★</span>
              <span>Bookmarked</span>
              <span className={cx("text10", "colorMuted2", "kbMlAuto")}>{bookmarked.length}</span>
            </button>
          </div>
        </div>

        <div className={cx("kbListPane")}>
          {selectedCat !== "bookmarked" && pinned.length > 0 ? (
            <>
              <div className={cx("textXs", "uppercase", "mb8", "kbSubhead")}>Pinned</div>
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

              {rest.length > 0 ? <div className={cx("textXs", "uppercase", "kbSubhead", "kbSubheadAll")}>All</div> : null}
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

          {filtered.length === 0 ? <div className={cx("text11", "kbListEmpty")}>No articles found.</div> : null}
        </div>

        <div className={cx("kbDetailPane")}>
          {selectedArticle ? (
            <>
              <div className={cx("flexBetween", "mb20", "kbDetailTop")}>
                <div className={cx("flex1")}>
                  {(() => {
                    const category = categories.find((entry) => entry.id === selectedArticle.category);
                    return (
                      <div className={cx("flexRow", "gap8", "mb10")}>
                        <span className={cx("text10", "uppercase", "kbCategoryChip")} data-category={selectedArticle.category}>
                          {category?.label}
                        </span>
                        {selectedArticle.pinned ? <span className={cx("text10", "kbPinnedPill")}>◈ Pinned</span> : null}
                      </div>
                    );
                  })()}

                  <h2 className={cx("fontDisplay", "fw800", "colorText", "mb10", "kbDetailTitle")}>{selectedArticle.title}</h2>
                  <div className={cx("flexRow", "gap14")}>
                    <span className={cx("text10", "colorMuted2")}>By {selectedArticle.author}</span>
                    <span className={cx("text10", "colorMuted2")}>Updated {selectedArticle.updatedAt}</span>
                    <span className={cx("text10", "colorMuted2")}>{selectedArticle.readTime} read</span>
                  </div>
                </div>

                <button type="button" className={cx("kbBookmarkMain", bookmarked.includes(selectedArticle.id) && "kbBookmarkMainActive")} onClick={() => toggleBookmark(selectedArticle.id)}>
                  {bookmarked.includes(selectedArticle.id) ? "★" : "☆"}
                </button>
              </div>

              <div className={cx("flexRow", "gap6", "mb28", "flexWrap")}>
                {selectedArticle.tags.map((tag) => (
                  <span key={tag} className={cx("text10", "colorMuted2", "kbTagChip")}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className={cx("kbDocWrap")}>{renderContent(selectedArticle.content)}</div>
            </>
          ) : (
            <div className={cx("textCenter", "kbDetailEmpty")}>Select an article to read</div>
          )}
        </div>
      </div>
    </section>
  );
}
