"use client";

import { useMemo, useState } from "react";
import {
  createInvoiceWithRefresh,
  createPaymentWithRefresh
} from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import styles from "../../../../app/style/maphari-dashboard.module.css";
import { EmptyState, formatDate, formatMoney } from "./shared";

export function InvoicesPage({
  snapshot,
  session,
  onRefreshSnapshot,
  onNotify,
  clock
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  onRefreshSnapshot: (sessionOverride?: AuthSession) => Promise<void>;
  onNotify: (tone: "success" | "error", message: string) => void;
  clock: number;
}) {
  const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "VOID">("ALL");
  const [createClientId, setCreateClientId] = useState(snapshot.clients[0]?.id ?? "");
  const [createNumber, setCreateNumber] = useState(`INV-${new Date().getFullYear()}-${String(snapshot.invoices.length + 1).padStart(3, "0")}`);
  const [createAmount, setCreateAmount] = useState("");
  const [createCurrency, setCreateCurrency] = useState("ZAR");
  const [createDueAt, setCreateDueAt] = useState("");

  const invoicePaymentMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const payment of snapshot.payments) {
      if (payment.status !== "COMPLETED") continue;
      map.set(payment.invoiceId, (map.get(payment.invoiceId) ?? 0) + payment.amountCents);
    }
    return map;
  }, [snapshot.payments]);

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return snapshot.invoices
      .filter((invoice) => (statusFilter === "ALL" ? true : invoice.status === statusFilter))
      .filter((invoice) => {
        if (!q) return true;
        const clientName = snapshot.clients.find((client) => client.id === invoice.clientId)?.name ?? "";
        return (
          invoice.number.toLowerCase().includes(q) ||
          clientName.toLowerCase().includes(q) ||
          invoice.status.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [query, snapshot.clients, snapshot.invoices, statusFilter]);

  const outstandingCents = filteredInvoices
    .filter((invoice) => invoice.status !== "PAID" && invoice.status !== "VOID")
    .reduce((sum, invoice) => sum + Math.max(0, invoice.amountCents - (invoicePaymentMap.get(invoice.id) ?? 0)), 0);
  const paidThisMonthCents = filteredInvoices
    .filter((invoice) => invoice.status === "PAID" && invoice.paidAt)
    .filter((invoice) => {
      const paidAt = new Date(invoice.paidAt ?? "");
      const now = new Date(clock);
      return paidAt.getFullYear() === now.getFullYear() && paidAt.getMonth() === now.getMonth();
    })
    .reduce((sum, invoice) => sum + invoice.amountCents, 0);
  const ytdCents = filteredInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);

  async function handleCreateInvoice(): Promise<void> {
    if (!session || !canEdit) return;
    if (!createClientId || !createNumber.trim() || !createAmount.trim()) {
      onNotify("error", "Client, invoice number, and amount are required.");
      return;
    }
    const amountCents = Math.round(Number(createAmount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      onNotify("error", "Invoice amount must be greater than zero.");
      return;
    }
    const created = await createInvoiceWithRefresh(session, {
      clientId: createClientId,
      number: createNumber.trim(),
      amountCents,
      currency: createCurrency.trim().toUpperCase(),
      status: "ISSUED",
      issuedAt: new Date().toISOString(),
      dueAt: createDueAt ? new Date(createDueAt).toISOString() : undefined
    });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to create invoice.");
      return;
    }
    onNotify("success", `Invoice ${created.data.number} created.`);
    setCreateAmount("");
    setCreateDueAt("");
    setCreateNumber(`INV-${new Date().getFullYear()}-${String(snapshot.invoices.length + 2).padStart(3, "0")}`);
    await onRefreshSnapshot(created.nextSession);
  }

  async function handleMarkPaid(invoiceId: string): Promise<void> {
    if (!session || !canEdit) return;
    const invoice = snapshot.invoices.find((item) => item.id === invoiceId);
    if (!invoice) return;
    const paidCents = invoicePaymentMap.get(invoice.id) ?? 0;
    const remainingCents = Math.max(0, invoice.amountCents - paidCents);
    if (remainingCents <= 0) {
      onNotify("success", "Invoice already fully paid.");
      return;
    }
    const created = await createPaymentWithRefresh(session, {
      clientId: invoice.clientId,
      invoiceId: invoice.id,
      amountCents: remainingCents,
      status: "COMPLETED",
      provider: "MANUAL",
      transactionRef: `manual-${clock}`,
      paidAt: new Date().toISOString()
    });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to mark invoice paid.");
      return;
    }
    onNotify("success", `Payment recorded for ${invoice.number}.`);
    await onRefreshSnapshot(created.nextSession);
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Finance</div>
          <div className={styles.projName}>Invoices</div>
          <div className={styles.projMeta}>Billing history, outstanding balances, and payment collection.</div>
        </div>
      </div>

      <div className={`${styles.statsRow} ${styles.statsRowCols3}`}>
        <div className={`${styles.statCard} ${styles.amber}`}><div className={styles.statLabel}>Outstanding</div><div className={styles.statValue}>{formatMoney(outstandingCents, "AUTO")}</div><div className={`${styles.statDelta} ${styles.deltaDown}`}>Open invoice exposure</div></div>
        <div className={`${styles.statCard} ${styles.green}`}><div className={styles.statLabel}>Paid This Month</div><div className={styles.statValue}>{formatMoney(paidThisMonthCents, "AUTO")}</div><div className={`${styles.statDelta} ${styles.deltaUp}`}>Completed collections</div></div>
        <div className={`${styles.statCard} ${styles.purple}`}><div className={styles.statLabel}>Total Billed (View)</div><div className={styles.statValue}>{formatMoney(ytdCents, "AUTO")}</div><div className={styles.statDelta}>Current filtered set</div></div>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Invoice Controls</span>
          <div className={`${styles.toolbarRow} ${styles.toolbarRowNoWrap}`}>
            <input className={styles.searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoice number or client" />
            <select className={styles.selectInput} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="ALL">All status</option>
              <option value="ISSUED">Issued</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="DRAFT">Draft</option>
              <option value="VOID">Void</option>
            </select>
          </div>
        </div>
      </article>

      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Create Invoice</span></div>
        <div className={styles.formGrid}>
          <select className={styles.selectInput} value={createClientId} onChange={(event) => setCreateClientId(event.target.value)} disabled={!canEdit}>
            <option value="">Select client</option>
            {snapshot.clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <input className={styles.formInput} placeholder="Invoice number" value={createNumber} onChange={(event) => setCreateNumber(event.target.value)} disabled={!canEdit} />
          <input className={styles.formInput} placeholder="Amount" type="number" min="0" step="0.01" value={createAmount} onChange={(event) => setCreateAmount(event.target.value)} disabled={!canEdit} />
          <input className={styles.formInput} placeholder="Currency" value={createCurrency} onChange={(event) => setCreateCurrency(event.target.value)} disabled={!canEdit} />
          <input className={styles.formInput} type="datetime-local" value={createDueAt} onChange={(event) => setCreateDueAt(event.target.value)} disabled={!canEdit} />
          {canEdit ? <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleCreateInvoice()}>Create Invoice</button> : <div className={styles.emptySub}>Read-only mode for this role.</div>}
        </div>
      </article>

      <div className={styles.card}>
        <table className={styles.invTable}>
          <thead><tr><th>Invoice #</th><th>Client</th><th>Project</th><th>Issued</th><th>Due</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => {
                const client = snapshot.clients.find((item) => item.id === invoice.clientId);
                const paidCents = invoicePaymentMap.get(invoice.id) ?? 0;
                const remainingCents = Math.max(0, invoice.amountCents - paidCents);
                const isDueSoon = invoice.dueAt ? new Date(invoice.dueAt).getTime() - clock < 5 * 24 * 60 * 60 * 1000 : false;
                const statusClass =
                  invoice.status === "PAID" ? styles.badgeGreen :
                  invoice.status === "OVERDUE" ? styles.badgeRed :
                  invoice.status === "ISSUED" && isDueSoon ? styles.badgeAmber :
                  styles.badgeBlue;
                return (
                  <tr key={invoice.id}>
                    <td><div className={styles.cellStrong}>{invoice.number}</div></td>
                    <td>{client?.name ?? "Unknown client"}</td>
                    <td className={styles.cellMuted}>Billing item</td>
                    <td className={styles.metaMono}>{invoice.issuedAt ? formatDate(invoice.issuedAt) : "—"}</td>
                    <td className={styles.metaMono}>{invoice.dueAt ? formatDate(invoice.dueAt) : "—"}</td>
                    <td>
                      <span className={styles.invAmount}>
                        {formatMoney(invoice.amountCents, invoice.currency)}
                      </span>
                      {remainingCents > 0 && invoice.status !== "PAID" ? (
                        <div className={styles.cellSub}>Open: {formatMoney(remainingCents, invoice.currency)}</div>
                      ) : null}
                    </td>
                    <td><span className={`${styles.badge} ${statusClass}`}>{invoice.status}</span></td>
                    <td>
                      {invoice.status !== "PAID" && invoice.status !== "VOID" && canEdit ? (
                        <button type="button" className={`${styles.btnSm} ${styles.btnAccent} ${styles.btnInline}`} onClick={() => void handleMarkPaid(invoice.id)}>Mark Paid</button>
                      ) : (
                        <span className={styles.cellSub}>No action</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className={styles.emptyCell}>
                  <EmptyState title="No invoices in this view" subtitle="This view updates once filters match invoice records." compact />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
