"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";

type DocType = "pdf" | "zip" | "figma" | "docx";
type DocStatus = "active" | "in-review" | "disputed" | "rejected" | "archived";
type AccessLevel = "admin" | "shared";
type DocCategory = "Contract" | "Brief" | "Deliverable" | "Invoice" | "Asset";
type Tab = "all documents" | "by client" | "contracts" | "analytics";

type VaultDoc = {
  id: string;
  client: string;
  clientColor: string;
  category: DocCategory;
  name: string;
  version: string;
  uploaded: string;
  uploadedBy: string;
  size: string;
  type: DocType;
  status: DocStatus;
  accessLevel: AccessLevel;
};

const vaultDocs: VaultDoc[] = [
  { id: "DOC-0089", client: "Volta Studios", clientColor: "var(--accent)", category: "Contract", name: "Master Service Agreement - Volta Studios", version: "v1.2", uploaded: "Jan 6", uploadedBy: "Sipho Nkosi", size: "248 KB", type: "pdf", status: "active", accessLevel: "admin" },
  { id: "DOC-0088", client: "Volta Studios", clientColor: "var(--accent)", category: "Brief", name: "Brand Identity Project Brief", version: "v2.0", uploaded: "Jan 8", uploadedBy: "Nomsa Dlamini", size: "1.2 MB", type: "pdf", status: "active", accessLevel: "shared" },
  { id: "DOC-0087", client: "Volta Studios", clientColor: "var(--accent)", category: "Asset", name: "Client Logo Files - Master Pack", version: "v1.0", uploaded: "Jan 10", uploadedBy: "Renzo Fabbri", size: "18.4 MB", type: "zip", status: "active", accessLevel: "shared" },
  { id: "DOC-0086", client: "Kestrel Capital", clientColor: "var(--purple)", category: "Contract", name: "Retainer Agreement - Kestrel Capital", version: "v1.0", uploaded: "Dec 15", uploadedBy: "Sipho Nkosi", size: "312 KB", type: "pdf", status: "active", accessLevel: "admin" },
  { id: "DOC-0085", client: "Kestrel Capital", clientColor: "var(--purple)", category: "Invoice", name: "Invoice INV-0039 - Disputed", version: "v1.0", uploaded: "Feb 15", uploadedBy: "Nomsa Dlamini", size: "84 KB", type: "pdf", status: "disputed", accessLevel: "admin" },
  { id: "DOC-0084", client: "Kestrel Capital", clientColor: "var(--purple)", category: "Brief", name: "Q1 Campaign Strategy Brief", version: "v1.1", uploaded: "Jan 22", uploadedBy: "Nomsa Dlamini", size: "540 KB", type: "pdf", status: "active", accessLevel: "shared" },
  { id: "DOC-0083", client: "Mira Health", clientColor: "var(--blue)", category: "Contract", name: "Website Project Contract - Mira Health", version: "v1.0", uploaded: "Feb 3", uploadedBy: "Sipho Nkosi", size: "290 KB", type: "pdf", status: "active", accessLevel: "admin" },
  { id: "DOC-0082", client: "Mira Health", clientColor: "var(--blue)", category: "Deliverable", name: "Homepage Wireframes v2", version: "v2.0", uploaded: "Feb 18", uploadedBy: "Kira Bosman", size: "4.8 MB", type: "figma", status: "in-review", accessLevel: "shared" },
  { id: "DOC-0081", client: "Mira Health", clientColor: "var(--blue)", category: "Brief", name: "Website Redesign Brief - Signed", version: "v1.0", uploaded: "Feb 4", uploadedBy: "Nomsa Dlamini", size: "720 KB", type: "pdf", status: "active", accessLevel: "shared" },
  { id: "DOC-0080", client: "Dune Collective", clientColor: "var(--amber)", category: "Contract", name: "Editorial Design Contract - Dune", version: "v1.1", uploaded: "Nov 28", uploadedBy: "Sipho Nkosi", size: "264 KB", type: "pdf", status: "active", accessLevel: "admin" },
  { id: "DOC-0079", client: "Dune Collective", clientColor: "var(--amber)", category: "Deliverable", name: "Template Library Vol 1 - Rejected", version: "v3.0", uploaded: "Feb 10", uploadedBy: "Renzo Fabbri", size: "22.1 MB", type: "zip", status: "rejected", accessLevel: "shared" },
  { id: "DOC-0078", client: "Okafor & Sons", clientColor: "var(--amber)", category: "Deliverable", name: "Annual Report 2025 - Draft v2", version: "v2.0", uploaded: "Feb 21", uploadedBy: "Tapiwa Moyo", size: "14.2 MB", type: "pdf", status: "in-review", accessLevel: "shared" },
];

const categories: Array<"All" | DocCategory> = ["All", "Contract", "Brief", "Deliverable", "Invoice", "Asset"];
const clientList = ["All", "Volta Studios", "Kestrel Capital", "Mira Health", "Dune Collective", "Okafor & Sons"];

const typeConfig: Record<DocType, { icon: string; color: string; label: string }> = {
  pdf: { icon: "📄", color: "var(--red)", label: "PDF" },
  zip: { icon: "🗜", color: "var(--amber)", label: "ZIP" },
  figma: { icon: "✦", color: "var(--purple)", label: "Figma" },
  docx: { icon: "📝", color: "var(--blue)", label: "DOCX" },
};

const statusConfig: Record<DocStatus, { color: string; label: string }> = {
  active: { color: "var(--accent)", label: "Active" },
  "in-review": { color: "var(--blue)", label: "In Review" },
  disputed: { color: "var(--red)", label: "Disputed" },
  rejected: { color: "var(--red)", label: "Rejected" },
  archived: { color: "var(--muted)", label: "Archived" },
};

const accessConfig: Record<AccessLevel, { color: string; label: string; icon: string }> = {
  admin: { color: "var(--red)", label: "Admin Only", icon: "🔒" },
  shared: { color: "var(--accent)", label: "Shared w/ Client", icon: "🔗" },
};

const tabs: Tab[] = ["all documents", "by client", "contracts", "analytics"];

function statusClass(status: DocStatus): string {
  if (status === "active") return styles.dvtStatusActive;
  if (status === "in-review") return styles.dvtStatusInReview;
  if (status === "disputed") return styles.dvtStatusDisputed;
  if (status === "rejected") return styles.dvtStatusRejected;
  return styles.dvtStatusArchived;
}

function categoryPillClass(category: "All" | DocCategory, selected: "All" | DocCategory): string {
  if (category === selected) return styles.dvtPillAccent;
  return styles.dvtPillDefault;
}

function clientPillClass(client: string, selected: string): string {
  if (client !== selected) return styles.dvtPillDefault;
  if (client === "All") return styles.dvtPillOutlineAccent;
  return styles.dvtPillPurple;
}

function clientCardToneClass(color: string): string {
  if (color === "var(--accent)") return styles.dvtClientCardAccent;
  if (color === "var(--purple)") return styles.dvtClientCardPurple;
  if (color === "var(--blue)") return styles.dvtClientCardBlue;
  return styles.dvtClientCardAmber;
}

function rowStateClass(doc: VaultDoc, selected: boolean): string {
  if (selected) return styles.dvtRowSelected;
  if (doc.status === "disputed" || doc.status === "rejected") return styles.dvtRowFlagged;
  return "";
}

function statusBarClass(status: DocStatus): string {
  if (status === "active") return styles.dvtBarFillAccent;
  if (status === "in-review") return styles.dvtBarFillBlue;
  if (status === "disputed" || status === "rejected") return styles.dvtBarFillRed;
  return styles.dvtBarFillMuted;
}

export function DocumentVaultPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all documents");
  const [filterCat, setFilterCat] = useState<"All" | DocCategory>("All");
  const [filterClient, setFilterClient] = useState("All");
  const [selected, setSelected] = useState<VaultDoc | null>(null);

  const filtered = vaultDocs.filter((d) => filterCat === "All" || d.category === filterCat).filter((d) => filterClient === "All" || d.client === filterClient);

  const contracts = vaultDocs.filter((d) => d.category === "Contract");
  const totalSize = "62.4 MB";

  return (
    <div className={cx(styles.pageBody, styles.dvtRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 className={styles.pageTitle}>Document Vault</h1>
          <div className={styles.pageSub}>Contracts - Briefs - Deliverables - Assets - Version control</div>
        </div>
        <div className={styles.dvtHeadActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Index</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Upload Document</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Total Documents", value: vaultDocs.length.toString(), color: "var(--accent)", sub: `${totalSize} stored` },
          { label: "Active Contracts", value: contracts.length.toString(), color: "var(--blue)", sub: "All clients" },
          { label: "In Review", value: vaultDocs.filter((d) => d.status === "in-review").length.toString(), color: "var(--amber)", sub: "Pending approval" },
          { label: "Disputed / Rejected", value: vaultDocs.filter((d) => ["disputed", "rejected"].includes(d.status)).length.toString(), color: "var(--red)", sub: "Require attention" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Filter by tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {activeTab === "all documents" ? (
          <>
            <select title="Filter by category" value={filterCat} onChange={e => setFilterCat(e.target.value as "All" | DocCategory)} className={styles.filterSelect}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select title="Filter by client" value={filterClient} onChange={e => setFilterClient(e.target.value)} className={styles.filterSelect}>
              {clientList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        ) : null}
      </div>

      {activeTab === "all documents" ? (
        <div>
          <div className={cx(styles.dvtMainSplit, selected ? styles.dvtMainSplitWithSide : styles.dvtMainSplitSingle)}>
            <div className={styles.dvtTableCard}>
              <div className={cx(styles.dvtHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                {["ID", "Type", "Name", "Client", "Category", "Version", "Size", "Status", "Access"].map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
              {filtered.map((doc, i) => {
                const tc = typeConfig[doc.type] || typeConfig.pdf;
                const sc = statusConfig[doc.status];
                const ac = accessConfig[doc.accessLevel];
                const isSel = selected?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelected(isSel ? null : doc)}
                    className={cx(styles.dvtRow, rowStateClass(doc, isSel), i < filtered.length - 1 && "borderB")}
                  >
                    <span className={styles.dvtMono9}>{doc.id}</span>
                    <span className={styles.dvtTypeIcon}>{tc.icon}</span>
                    <div>
                      <div className={styles.dvtName}>{doc.name}</div>
                      <div className={styles.dvtMeta}>{doc.uploadedBy} - {doc.uploaded}</div>
                    </div>
                    <span className={cx(styles.dvtClient, colorClass(doc.clientColor))}>{doc.client.split(" ")[0]}</span>
                    <span className={styles.dvtCat}>{doc.category}</span>
                    <span className={styles.dvtMono11}>{doc.version}</span>
                    <span className={styles.dvtMono10}>{doc.size}</span>
                    <span className={cx(styles.dvtStatus, statusClass(doc.status))}>{sc.label}</span>
                    <span className={styles.text11} title={ac.label}>{ac.icon}</span>
                  </div>
                );
              })}
            </div>

            {selected ? (
              <div className={styles.dvtSideCard}>
                <div className={styles.dvtSideHead}>
                  <span className={styles.dvtSideIcon}>{typeConfig[selected.type]?.icon || "📄"}</span>
                  <div>
                    <div className={styles.dvtSideTitle}>{selected.name}</div>
                    <div className={cx("text12", colorClass(selected.clientColor))}>{selected.client}</div>
                  </div>
                </div>
                <div className={styles.dvtFieldList}>
                  {[
                    { label: "Document ID", value: selected.id },
                    { label: "Category", value: selected.category },
                    { label: "Version", value: selected.version },
                    { label: "Uploaded", value: `${selected.uploaded} by ${selected.uploadedBy}` },
                    { label: "File Size", value: selected.size },
                    { label: "Status", value: statusConfig[selected.status].label },
                    { label: "Access", value: accessConfig[selected.accessLevel].label },
                  ].map((f) => (
                    <div key={f.label} className={styles.dvtFieldRow}>
                      <span className={styles.colorMuted}>{f.label}</span>
                      <span className={styles.dvtFieldValue}>{f.value}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.dvtActionStack}>
                  <button type="button" className={cx("btnSm", "btnAccent")}>⬇ Download</button>
                  <button type="button" className={cx("btnSm", "btnGhost")}>📤 Share with Client</button>
                  <button type="button" className={cx("btnSm", "btnGhost")}>🔄 Upload New Version</button>
                  <button type="button" className={styles.dvtArchiveBtn}>Archive</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "by client" ? (
        <div className={styles.dvtClientGrid}>
          {["Volta Studios", "Kestrel Capital", "Mira Health", "Dune Collective", "Okafor & Sons"].map((client, ci) => {
            const color = ["var(--accent)", "var(--purple)", "var(--blue)", "var(--amber)", "var(--amber)"][ci];
            const docs = vaultDocs.filter((d) => d.client === client);
            return (
              <div key={client} className={cx(styles.dvtClientCard, clientCardToneClass(color))}>
                <div className={styles.dvtClientHead}>
                  <div className={cx(styles.dvtClientTitle, colorClass(color))}>{client}</div>
                  <div className={styles.dvtClientCount}>{docs.length}</div>
                </div>
                <div className={styles.dvtClientList}>
                  {docs.map((doc) => (
                    <div key={doc.id} className={styles.dvtClientDoc}>
                      <span className={styles.text14}>{typeConfig[doc.type]?.icon || "📄"}</span>
                      <div className={styles.dvtClientDocMeta}>
                        <div className={styles.dvtClientDocName}>{doc.name}</div>
                        <div className={styles.dvtMeta}>{doc.category} - {doc.version}</div>
                      </div>
                      <span className={cx(styles.dvtDot, colorClass(statusConfig[doc.status].color))}>●</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {activeTab === "contracts" ? (
        <div className={styles.dvtContractsStack}>
          {contracts.map((doc) => (
            <div key={doc.id} className={styles.dvtContractRow}>
              <div className={cx(styles.dvtContractClient, colorClass(doc.clientColor))}>{doc.client}</div>
              <div>
                <div className={styles.dvtName}>{doc.name}</div>
                <div className={styles.dvtMeta}>Uploaded {doc.uploaded} - {doc.uploadedBy}</div>
              </div>
              <span className={styles.dvtMono12}>{doc.version}</span>
              <span className={cx(styles.dvtStatus, statusClass(doc.status))}>
                {statusConfig[doc.status].label}
              </span>
              <span className={cx("text11", colorClass(accessConfig[doc.accessLevel].color))}>
                {accessConfig[doc.accessLevel].icon} {accessConfig[doc.accessLevel].label}
              </span>
              <div className={styles.dvtActionRow}>
                <button type="button" className={cx("btnSm", "btnAccent")}>⬇ Download</button>
                <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "analytics" ? (
        <div className={styles.dvtAnalyticsSplit}>
          <div className={cx("card", "p24")}>
            <div className={styles.dvtSectionTitle}>Documents by Category</div>
            {(["Contract", "Brief", "Deliverable", "Invoice", "Asset"] as const).map((cat) => {
              const count = vaultDocs.filter((d) => d.category === cat).length;
              return (
                <div key={cat} className={styles.dvtBarRow}>
                  <span className={styles.text12}>{cat}</span>
                  <div className={styles.dvtTrack120}>
                    <progress className={cx(styles.dvtBarFillAccent, "uiProgress")} max={100} value={(count / vaultDocs.length) * 100} />
                  </div>
                  <span className={cx(styles.dvtBarCount, "colorAccent")}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className={cx("card", "p24")}>
            <div className={styles.dvtSectionTitle}>Status Distribution</div>
            {(Object.entries(statusConfig) as Array<[DocStatus, { color: string; label: string }]>).map(([status, cfg]) => {
              const count = vaultDocs.filter((d) => d.status === status).length;
              return (
                <div key={status} className={styles.dvtBarRow}>
                  <span className={cx("text12", colorClass(cfg.color))}>{cfg.label}</span>
                  <div className={styles.dvtTrack120}>
                    <progress className={cx(statusBarClass(status), "uiProgress")} max={100} value={(count / vaultDocs.length) * 100} />
                  </div>
                  <span className={cx(styles.dvtBarCount, colorClass(cfg.color))}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
