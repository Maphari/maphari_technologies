"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasRequiredRole } from "../../lib/auth/roles";
import { usePortalWorkspace } from "../../lib/auth/use-portal-workspace";
import { MainLogo } from "../shared/main-logo";
import styles from "../../app/style/portal.module.css";
import { WorkspaceTopNav } from "../workspace/workspace-top-nav";
import { formatMoneyCents } from "../../lib/i18n/currency";

function formatDate(dateIso: string | null): string {
  if (!dateIso) return "N/A";
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatMoney(amountCents: number, currency = "AUTO"): string {
  return formatMoneyCents(amountCents, {
    currency: currency === "AUTO" ? null : currency,
    minimumFractionDigits: 2
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PortalShell() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    session,
    snapshot,
    selectedConversationId,
    conversationMessages,
    loading,
    messagesLoading,
    uploadState,
    uploadMessage,
    error,
    signOut,
    selectConversation,
    uploadFile
  } = usePortalWorkspace();

  const role = session?.user.role;
  const authorized = role ? hasRequiredRole(role, ["CLIENT", "STAFF", "ADMIN"]) : false;
  const selectedConversation = snapshot.conversations.find((item) => item.id === selectedConversationId) ?? null;
  const topNavItems =
    role === "CLIENT"
      ? [
          { href: "/portal", label: "Portal" }
        ]
      : [
          { href: "/portal", label: "Portal" },
          { href: "/admin", label: "Admin" }
        ];

  useEffect(() => {
    if (session || loading) return;
    router.replace("/login?next=/portal");
  }, [loading, router, session]);

  return (
    <div className={styles.page}>
      {session ? <WorkspaceTopNav items={topNavItems} actionLabel="Sign out" onAction={signOut} /> : null}
      <aside className={`${styles.sidebar} ${session ? styles.sidebarWithTopNav : ""} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <span className={styles.logoMark}>M</span>
          <div>
            <p className={styles.brandName}><MainLogo suffix="Portal" /></p>
            <p className={styles.brandSub}>Client Workspace</p>
          </div>
        </div>
        <nav className={styles.sideNav} aria-label="Portal navigation">
          <a href="#chat">Chat</a>
          <a href="#files">Files</a>
          <a href="#billing">Billing</a>
          <Link href="/admin">Admin</Link>
          <Link href="/">Marketing</Link>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setSidebarOpen((current) => !current)}
            aria-expanded={sidebarOpen}
            aria-label="Toggle sidebar"
          >
            <span />
            <span />
            <span />
          </button>
          <div>
            <h1>Client Portal</h1>
            <p>Role-aware chat, files, and billing views through gateway APIs only.</p>
          </div>
        </header>

        {!session ? (
          <section className={styles.authCard}>
            <h2>Session required</h2>
            <p>You are being redirected to login. If this takes longer than expected, continue manually.</p>
            <Link href="/logout?next=%2Flogin%3Fnext%3D%2Fportal">Force logout</Link>
          </section>
        ) : !authorized ? (
          <section className={styles.authCard}>
            <h2>Access restricted</h2>
            <p>This user role is not authorized for portal views.</p>
          </section>
        ) : (
          <>
            <section className={styles.metrics}>
              <article className={styles.metricCard}>
                <p>Conversations</p>
                <strong>{snapshot.conversations.length}</strong>
              </article>
              <article className={styles.metricCard}>
                <p>Files</p>
                <strong>{snapshot.files.length}</strong>
              </article>
              <article className={styles.metricCard}>
                <p>Invoices</p>
                <strong>{snapshot.invoices.length}</strong>
              </article>
              <article className={styles.metricCard}>
                <p>Payments</p>
                <strong>{snapshot.payments.length}</strong>
              </article>
            </section>

            <section id="chat" className={styles.section}>
              <header className={styles.sectionHead}>
                <h2>Conversations & Messages</h2>
                <span className={styles.roleBadge}>{session.user.role}</span>
              </header>
              <div className={styles.chatLayout}>
                <div className={styles.panel}>
                  <h3>Threads</h3>
                  {snapshot.conversations.length === 0 ? <p className={styles.empty}>No conversations found.</p> : null}
                  {snapshot.conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      className={`${styles.threadItem} ${selectedConversationId === conversation.id ? styles.threadItemActive : ""}`}
                      onClick={() => selectConversation(conversation.id)}
                    >
                      <span>{conversation.subject}</span>
                      <small>{formatDate(conversation.updatedAt)}</small>
                    </button>
                  ))}
                </div>
                <div className={styles.panel}>
                  <h3>Messages</h3>
                  {!selectedConversation ? <p className={styles.empty}>Select a conversation to view messages.</p> : null}
                  {messagesLoading ? <p className={styles.empty}>Loading messages...</p> : null}
                  {!messagesLoading && selectedConversation && conversationMessages.length === 0 ? (
                    <p className={styles.empty}>No messages in this conversation yet.</p>
                  ) : null}
                  {conversationMessages.map((message) => (
                    <article key={message.id} className={styles.messageCard}>
                      <p>{message.content}</p>
                      <small>{formatDate(message.createdAt)}</small>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section id="files" className={styles.section}>
              <header className={styles.sectionHead}>
                <h2>File Library</h2>
              </header>
              <form
                className={styles.uploadForm}
                onSubmit={async (event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const file = formData.get("fileInput");
                  if (!(file instanceof File) || file.size === 0) return;
                  const successful = await uploadFile(file);
                  if (successful) {
                    event.currentTarget.reset();
                  }
                }}
              >
                <label htmlFor="fileInput">Upload file (presigned flow)</label>
                <input id="fileInput" name="fileInput" type="file" required />
                <button type="submit" disabled={uploadState === "uploading"}>
                  {uploadState === "uploading" ? "Uploading..." : "Upload"}
                </button>
                {uploadMessage ? (
                  <p className={uploadState === "error" ? styles.uploadError : styles.uploadSuccess}>{uploadMessage}</p>
                ) : null}
              </form>
              <div className={styles.table}>
                <div className={styles.tableHead}>
                  <span>Name</span>
                  <span>Type</span>
                  <span>Size</span>
                  <span>Uploaded</span>
                </div>
                {snapshot.files.length === 0 ? <p className={styles.empty}>No files found.</p> : null}
                {snapshot.files.map((file) => (
                  <div key={file.id} className={styles.tableRow}>
                    <span>{file.fileName}</span>
                    <span>{file.mimeType}</span>
                    <span>{formatBytes(file.sizeBytes)}</span>
                    <span>{formatDate(file.createdAt)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section id="billing" className={styles.section}>
              <header className={styles.sectionHead}>
                <h2>Billing</h2>
              </header>
              <div className={styles.billingGrid}>
                <div className={styles.table}>
                  <div className={styles.tableHead}>
                    <span>Invoice</span>
                    <span>Status</span>
                    <span>Amount</span>
                    <span>Due</span>
                  </div>
                  {snapshot.invoices.length === 0 ? <p className={styles.empty}>No invoices found.</p> : null}
                  {snapshot.invoices.map((invoice) => (
                    <div key={invoice.id} className={styles.tableRow}>
                      <span>{invoice.number}</span>
                      <span>
                        <i className={`${styles.statusBadge} ${styles[`status${invoice.status}` as keyof typeof styles] ?? ""}`}>
                          {invoice.status}
                        </i>
                      </span>
                      <span>{formatMoney(invoice.amountCents, invoice.currency)}</span>
                      <span>{formatDate(invoice.dueAt)}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.table}>
                  <div className={styles.tableHead}>
                    <span>Payment</span>
                    <span>Status</span>
                    <span>Amount</span>
                    <span>Date</span>
                  </div>
                  {snapshot.payments.length === 0 ? <p className={styles.empty}>No payments found.</p> : null}
                  {snapshot.payments.map((payment) => (
                    <div key={payment.id} className={styles.tableRow}>
                      <span>{payment.provider ?? "manual"}</span>
                      <span>
                        <i className={`${styles.statusBadge} ${styles[`payment${payment.status}` as keyof typeof styles] ?? ""}`}>
                          {payment.status}
                        </i>
                      </span>
                      <span>{formatMoney(payment.amountCents)}</span>
                      <span>{formatDate(payment.paidAt ?? payment.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {error ? <p className={styles.error}>[{loading ? "LOADING" : "ERROR"}] {error}</p> : null}
      </main>
    </div>
  );
}
