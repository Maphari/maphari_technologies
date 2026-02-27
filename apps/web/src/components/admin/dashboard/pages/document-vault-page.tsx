"use client";

import { useState } from "react";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  lime: "#a78bfa",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0",
};

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
  { id: "DOC-0089", client: "Volta Studios", clientColor: C.lime, category: "Contract", name: "Master Service Agreement - Volta Studios", version: "v1.2", uploaded: "Jan 6", uploadedBy: "Sipho Nkosi", size: "248 KB", type: "pdf", status: "active", accessLevel: "admin" },
  { id: "DOC-0088", client: "Volta Studios", clientColor: C.lime, category: "Brief", name: "Brand Identity Project Brief", version: "v2.0", uploaded: "Jan 8", uploadedBy: "Nomsa Dlamini", size: "1.2 MB", type: "pdf", status: "active", accessLevel: "shared" },
  { id: "DOC-0087", client: "Volta Studios", clientColor: C.lime, category: "Asset", name: "Client Logo Files - Master Pack", version: "v1.0", uploaded: "Jan 10", uploadedBy: "Renzo Fabbri", size: "18.4 MB", type: "zip", status: "active", accessLevel: "shared" },
  { id: "DOC-0086", client: "Kestrel Capital", clientColor: C.purple, category: "Contract", name: "Retainer Agreement - Kestrel Capital", version: "v1.0", uploaded: "Dec 15", uploadedBy: "Sipho Nkosi", size: "312 KB", type: "pdf", status: "active", accessLevel: "admin" },
  { id: "DOC-0085", client: "Kestrel Capital", clientColor: C.purple, category: "Invoice", name: "Invoice INV-0039 - Disputed", version: "v1.0", uploaded: "Feb 15", uploadedBy: "Nomsa Dlamini", size: "84 KB", type: "pdf", status: "disputed", accessLevel: "admin" },
  { id: "DOC-0084", client: "Kestrel Capital", clientColor: C.purple, category: "Brief", name: "Q1 Campaign Strategy Brief", version: "v1.1", uploaded: "Jan 22", uploadedBy: "Nomsa Dlamini", size: "540 KB", type: "pdf", status: "active", accessLevel: "shared" },
  { id: "DOC-0083", client: "Mira Health", clientColor: C.blue, category: "Contract", name: "Website Project Contract - Mira Health", version: "v1.0", uploaded: "Feb 3", uploadedBy: "Sipho Nkosi", size: "290 KB", type: "pdf", status: "active", accessLevel: "admin" },
  { id: "DOC-0082", client: "Mira Health", clientColor: C.blue, category: "Deliverable", name: "Homepage Wireframes v2", version: "v2.0", uploaded: "Feb 18", uploadedBy: "Kira Bosman", size: "4.8 MB", type: "figma", status: "in-review", accessLevel: "shared" },
  { id: "DOC-0081", client: "Mira Health", clientColor: C.blue, category: "Brief", name: "Website Redesign Brief - Signed", version: "v1.0", uploaded: "Feb 4", uploadedBy: "Nomsa Dlamini", size: "720 KB", type: "pdf", status: "active", accessLevel: "shared" },
  { id: "DOC-0080", client: "Dune Collective", clientColor: C.amber, category: "Contract", name: "Editorial Design Contract - Dune", version: "v1.1", uploaded: "Nov 28", uploadedBy: "Sipho Nkosi", size: "264 KB", type: "pdf", status: "active", accessLevel: "admin" },
  { id: "DOC-0079", client: "Dune Collective", clientColor: C.amber, category: "Deliverable", name: "Template Library Vol 1 - Rejected", version: "v3.0", uploaded: "Feb 10", uploadedBy: "Renzo Fabbri", size: "22.1 MB", type: "zip", status: "rejected", accessLevel: "shared" },
  { id: "DOC-0078", client: "Okafor & Sons", clientColor: C.orange, category: "Deliverable", name: "Annual Report 2025 - Draft v2", version: "v2.0", uploaded: "Feb 21", uploadedBy: "Tapiwa Moyo", size: "14.2 MB", type: "pdf", status: "in-review", accessLevel: "shared" },
];

const categories: Array<"All" | DocCategory> = ["All", "Contract", "Brief", "Deliverable", "Invoice", "Asset"];
const clientList = ["All", "Volta Studios", "Kestrel Capital", "Mira Health", "Dune Collective", "Okafor & Sons"];

const typeConfig: Record<DocType, { icon: string; color: string; label: string }> = {
  pdf: { icon: "📄", color: C.red, label: "PDF" },
  zip: { icon: "🗜", color: C.amber, label: "ZIP" },
  figma: { icon: "✦", color: C.purple, label: "Figma" },
  docx: { icon: "📝", color: C.blue, label: "DOCX" },
};

const statusConfig: Record<DocStatus, { color: string; label: string }> = {
  active: { color: C.lime, label: "Active" },
  "in-review": { color: C.blue, label: "In Review" },
  disputed: { color: C.red, label: "Disputed" },
  rejected: { color: C.red, label: "Rejected" },
  archived: { color: C.muted, label: "Archived" },
};

const accessConfig: Record<AccessLevel, { color: string; label: string; icon: string }> = {
  admin: { color: C.red, label: "Admin Only", icon: "🔒" },
  shared: { color: C.lime, label: "Shared w/ Client", icon: "🔗" },
};

const tabs: Tab[] = ["all documents", "by client", "contracts", "analytics"];

export function DocumentVaultPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all documents");
  const [filterCat, setFilterCat] = useState<"All" | DocCategory>("All");
  const [filterClient, setFilterClient] = useState("All");
  const [selected, setSelected] = useState<VaultDoc | null>(null);

  const filtered = vaultDocs.filter((d) => filterCat === "All" || d.category === filterCat).filter((d) => filterClient === "All" || d.client === filterClient);

  const contracts = vaultDocs.filter((d) => d.category === "Contract");
  const totalSize = "62.4 MB";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Document Vault</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Contracts - Briefs - Deliverables - Assets - Version control</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Export Index</button>
          <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Upload Document</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Documents", value: vaultDocs.length.toString(), color: C.lime, sub: `${totalSize} stored` },
          { label: "Active Contracts", value: contracts.length.toString(), color: C.blue, sub: "All clients" },
          { label: "In Review", value: vaultDocs.filter((d) => d.status === "in-review").length.toString(), color: C.amber, sub: "Pending approval" },
          { label: "Disputed / Rejected", value: vaultDocs.filter((d) => ["disputed", "rejected"].includes(d.status)).length.toString(), color: C.red, sub: "Require attention" },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === t ? C.lime : C.muted,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: `2px solid ${activeTab === t ? C.lime : "transparent"}`,
              marginBottom: -1,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "all documents" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {categories.map((c) => (
              <button key={c} onClick={() => setFilterCat(c)} style={{ background: filterCat === c ? C.lime : C.surface, color: filterCat === c ? C.bg : C.muted, border: `1px solid ${filterCat === c ? C.lime : C.border}`, padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>
                {c}
              </button>
            ))}
            <div style={{ width: 1, background: C.border }} />
            {clientList.map((c) => (
              <button
                key={c}
                onClick={() => setFilterClient(c)}
                style={{
                  background: filterClient === c && c !== "All" ? C.purple : C.surface,
                  color: filterClient === c ? (c !== "All" ? C.bg : C.lime) : C.muted,
                  border: `1px solid ${filterClient === c ? (c !== "All" ? C.purple : C.lime) : C.border}`,
                  padding: "5px 12px",
                  borderRadius: 20,
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 340px" : "1fr", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "60px 40px 200px 120px 100px 80px 80px 80px 80px", padding: "10px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", gap: 12 }}>
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
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 40px 200px 120px 100px 80px 80px 80px 80px",
                      padding: "12px 20px",
                      borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                      background: isSel ? `${C.lime}08` : doc.status === "disputed" || doc.status === "rejected" ? C.surface : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 9, color: C.muted }}>{doc.id}</span>
                    <span style={{ fontSize: 18, textAlign: "center" }}>{tc.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{doc.name}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{doc.uploadedBy} - {doc.uploaded}</div>
                    </div>
                    <span style={{ fontSize: 11, color: doc.clientColor, fontWeight: 600 }}>{doc.client.split(" ")[0]}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{doc.category}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{doc.version}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{doc.size}</span>
                    <span style={{ fontSize: 9, color: sc.color, background: `${sc.color}15`, padding: "2px 6px", borderRadius: 4 }}>{sc.label}</span>
                    <span style={{ fontSize: 11 }} title={ac.label}>
                      {ac.icon}
                    </span>
                  </div>
                );
              })}
            </div>

            {selected && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, height: "fit-content" }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 32 }}>{typeConfig[selected.type]?.icon || "📄"}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3, marginBottom: 4 }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: selected.clientColor }}>{selected.client}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "Document ID", value: selected.id },
                    { label: "Category", value: selected.category },
                    { label: "Version", value: selected.version },
                    { label: "Uploaded", value: `${selected.uploaded} by ${selected.uploadedBy}` },
                    { label: "File Size", value: selected.size },
                    { label: "Status", value: statusConfig[selected.status].label },
                    { label: "Access", value: accessConfig[selected.accessLevel].label },
                  ].map((f) => (
                    <div key={f.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ color: C.muted }}>{f.label}</span>
                      <span style={{ color: C.text, fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{f.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button style={{ background: C.lime, color: C.bg, border: "none", padding: "10px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>⬇ Download</button>
                  <button style={{ background: C.border, border: "none", color: C.text, padding: "10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>📤 Share with Client</button>
                  <button style={{ background: C.border, border: "none", color: C.text, padding: "10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>🔄 Upload New Version</button>
                  <button style={{ background: C.surface, color: C.red, border: "none", padding: "10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Archive</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "by client" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {["Volta Studios", "Kestrel Capital", "Mira Health", "Dune Collective", "Okafor & Sons"].map((client, ci) => {
            const color = [C.lime, C.purple, C.blue, C.amber, C.orange][ci];
            const docs = vaultDocs.filter((d) => d.client === client);
            return (
              <div key={client} style={{ background: C.surface, border: `1px solid ${color}33`, borderRadius: 10, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color }}>{client}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 800, color: C.blue }}>{docs.length}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {docs.map((doc) => (
                    <div key={doc.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", background: C.bg, borderRadius: 6 }}>
                      <span style={{ fontSize: 14 }}>{typeConfig[doc.type]?.icon || "📄"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>{doc.category} - {doc.version}</div>
                      </div>
                      <span style={{ fontSize: 9, color: statusConfig[doc.status].color, flexShrink: 0 }}>●</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "contracts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {contracts.map((doc) => (
            <div key={doc.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, display: "grid", gridTemplateColumns: "160px 1fr 100px 100px 100px auto", alignItems: "center", gap: 20 }}>
              <div style={{ fontWeight: 700, color: doc.clientColor }}>{doc.client}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Uploaded {doc.uploaded} - {doc.uploadedBy}</div>
              </div>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: C.muted }}>{doc.version}</span>
              <span style={{ fontSize: 10, color: statusConfig[doc.status].color, background: `${statusConfig[doc.status].color}15`, padding: "3px 8px", borderRadius: 4 }}>{statusConfig[doc.status].label}</span>
              <span style={{ fontSize: 11, color: accessConfig[doc.accessLevel].color }}>
                {accessConfig[doc.accessLevel].icon} {accessConfig[doc.accessLevel].label}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ background: C.lime, color: C.bg, border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⬇ Download</button>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>View</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Documents by Category</div>
            {(["Contract", "Brief", "Deliverable", "Invoice", "Asset"] as const).map((cat) => {
              const count = vaultDocs.filter((d) => d.category === cat).length;
              return (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, flex: 1 }}>{cat}</span>
                  <div style={{ width: 120, height: 8, background: C.border, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${(count / vaultDocs.length) * 100}%`, background: C.lime, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700, width: 20 }}>{count}</span>
                </div>
              );
            })}
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status Distribution</div>
            {(Object.entries(statusConfig) as Array<[DocStatus, { color: string; label: string }]>).map(([status, cfg]) => {
              const count = vaultDocs.filter((d) => d.status === status).length;
              return (
                <div key={status} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, flex: 1, color: cfg.color }}>{cfg.label}</span>
                  <div style={{ width: 120, height: 8, background: C.border, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${(count / vaultDocs.length) * 100}%`, background: cfg.color, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: cfg.color, fontWeight: 700, width: 20 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
