"use client";

import type { ReactNode } from "react";
import styles from "@/app/style/admin/widgets.module.css";

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render?: (value: unknown, row: T) => ReactNode;
}

interface TableWidgetProps<T extends Record<string, unknown>> {
  label: string;
  rows: T[];
  columns: TableColumn<T>[];
  /** Override displayed count (e.g. "showing 10 of 247"). Defaults to rows.length. */
  rowCount?: number;
  emptyMessage?: string;
  className?: string;
}

export function TableWidget<T extends Record<string, unknown>>({
  label,
  rows,
  columns,
  rowCount,
  emptyMessage = "No data",
  className,
}: TableWidgetProps<T>) {
  const displayCount = rowCount ?? rows.length;
  const wrapClass = [styles.widget, styles.span4, className].filter(Boolean).join(" ");

  return (
    <div className={wrapClass}>
      <div className={styles.tableHeader}>
        <div className={styles.widgetLabel}>{label}</div>
        <div className={styles.tableRowCount}>{displayCount} rows</div>
      </div>
      {rows.length === 0 ? (
        <div className={styles.tableEmpty}>{emptyMessage}</div>
      ) : (
        <table className={styles.widgetTable}>
          <thead className={styles.widgetThead}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ textAlign: col.align ?? (col.key === columns[0]?.key ? "left" : "right") }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={styles.widgetTr}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={styles.widgetTd}
                    style={{ textAlign: col.align ?? (col.key === columns[0]?.key ? "left" : "right") }}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
