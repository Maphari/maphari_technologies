import { useMemo, useState } from "react";
import type { PortalFile } from "../../../../lib/api/portal";
import { cx, styles } from "../style";
import { formatDateShort } from "../utils";

type DocumentTab = "all" | "contracts" | "quotes" | "handover";

type ClientDocumentsPageProps = {
  active: boolean;
  files: PortalFile[];
  activeProjectName: string;
  onDownloadAgreementTemplate: () => void;
};

type DocumentRow = {
  id: string;
  name: string;
  project: string;
  type: "Contract" | "Quote" | "Handover" | "File";
  badgeTone: "bgPurple" | "bgAmber" | "bgGreen" | "bgMuted";
  statusLabel: string;
  statusTone: "bgGreen" | "bgMuted";
  createdAt: string;
};

const DOC_TABS: Array<{ id: DocumentTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "contracts", label: "Contracts" },
  { id: "quotes", label: "Quotes" },
  { id: "handover", label: "Handover" }
];

function classifyFile(file: PortalFile, activeProjectName: string): DocumentRow {
  const lower = file.fileName.toLowerCase();
  const isContract = /agreement|contract|nda|addendum/.test(lower);
  const isQuote = /quote|estimate/.test(lower);
  const isHandover = /handover|hand[- ]?off|delivery/.test(lower);

  let type: DocumentRow["type"] = "File";
  let badgeTone: DocumentRow["badgeTone"] = "bgMuted";
  if (isContract) {
    type = "Contract";
    badgeTone = "bgPurple";
  } else if (isQuote) {
    type = "Quote";
    badgeTone = "bgAmber";
  } else if (isHandover) {
    type = "Handover";
    badgeTone = "bgGreen";
  }

  const statusLabel = /signed|approved|accepted/.test(lower) ? "Signed" : "Available";
  return {
    id: file.id,
    name: file.fileName,
    project: activeProjectName,
    type,
    badgeTone,
    statusLabel,
    statusTone: statusLabel === "Signed" ? "bgGreen" : "bgMuted",
    createdAt: file.createdAt
  };
}

export function ClientDocumentsPage({ active, files, activeProjectName, onDownloadAgreementTemplate }: ClientDocumentsPageProps) {
  const [activeTab, setActiveTab] = useState<DocumentTab>("all");
  const rows = useMemo(
    () =>
      [...files]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((file) => classifyFile(file, activeProjectName)),
    [activeProjectName, files]
  );

  const filteredRows = useMemo(() => {
    if (activeTab === "all") return rows;
    if (activeTab === "contracts") return rows.filter((row) => row.type === "Contract");
    if (activeTab === "quotes") return rows.filter((row) => row.type === "Quote");
    return rows.filter((row) => row.type === "Handover");
  }, [activeTab, rows]);

  return (
    <section className={cx("page", active && "pageActive")} id="page-docs">
      <div className={styles.pageHeader} id="tour-page-docs">
        <div>
          <div className={styles.pageEyebrow}>Document Library</div>
          <div className={styles.pageTitle}>Documents</div>
          <div className={styles.pageSub}>Contracts, agreements, quotes, and project files.</div>
        </div>
        <button className={cx("button", "buttonGhost")} type="button" onClick={onDownloadAgreementTemplate}>
          Download Agreement Template
        </button>
      </div>

      <div className={styles.filterTabs}>
        {DOC_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cx("filterTab", activeTab === tab.id && "filterTabActive")}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Document</th>
              <th>Project</th>
              <th>Type</th>
              <th>Date</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>No documents in this section yet.</div>
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className={styles.tableName}>{row.name}</div>
                  </td>
                  <td>
                    <div className={styles.tableSub}>{row.project}</div>
                  </td>
                  <td>
                    <span className={cx("badge", row.badgeTone)}>{row.type}</span>
                  </td>
                  <td>
                    <span className={styles.tableSub}>{formatDateShort(row.createdAt)}</span>
                  </td>
                  <td>
                    <span className={cx("badge", row.statusTone)}>{row.statusLabel}</span>
                  </td>
                  <td>
                    <button className={cx("button", "buttonGhost")} type="button" style={{ padding: "5px 12px", fontSize: "0.62rem" }}>
                      Stored
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
