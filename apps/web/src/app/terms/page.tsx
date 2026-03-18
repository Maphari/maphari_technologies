// ════════════════════════════════════════════════════════════════════════════
// terms/page.tsx — Terms of Service page (server component)
// ════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Maphari Technologies",
  description: "Terms and conditions governing use of Maphari Technologies services.",
  alternates: { canonical: "/terms" }
};

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    body: "By engaging Maphari Technologies for any service or using our client portal, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services."
  },
  {
    title: "Services",
    body: "Maphari Technologies provides custom software development, design, process automation, platform maintenance, and related technology services. The specific scope, deliverables, and timeline for each engagement are defined in a separate project agreement or statement of work signed by both parties."
  },
  {
    title: "Intellectual Property",
    body: "Upon full payment for a project, clients receive ownership of all custom deliverables produced specifically for that project. Maphari Technologies retains ownership of general-purpose tools, frameworks, libraries, and methodologies developed independently of the engagement. Pre-existing third-party assets remain subject to their respective licences."
  },
  {
    title: "Payment Terms",
    body: "Payment schedules and milestones are outlined in individual project agreements. Invoices are due within the terms specified. Late payments may result in work being paused until outstanding balances are settled. Maphari Technologies reserves the right to charge interest on overdue amounts as permitted by applicable law."
  },
  {
    title: "Confidentiality",
    body: "Both parties agree to keep confidential all non-public information shared during the engagement. This includes but is not limited to business strategies, technical specifications, client data, and proprietary processes. Confidentiality obligations survive the termination of the engagement for a period of three years."
  },
  {
    title: "Limitation of Liability",
    body: "Maphari Technologies' total liability in connection with any engagement shall not exceed the total fees paid by the client for the specific project giving rise to the claim. We are not liable for indirect, incidental, or consequential damages. Clients are responsible for maintaining backups of data prior to any system changes."
  },
  {
    title: "Termination",
    body: "Either party may terminate an engagement with 14 days' written notice. Upon termination, the client is responsible for payment of work completed up to the termination date. Maphari Technologies will deliver all completed work-in-progress within 7 business days of the final payment being received."
  },
  {
    title: "Governing Law",
    body: "These terms are governed by the laws of the Republic of South Africa. Any disputes arising shall be subject to the exclusive jurisdiction of South African courts."
  },
  {
    title: "Contact",
    body: "For questions about these terms, please reach us via our Contact page or at legal@maphari.co.za."
  }
];

export default function TermsPage() {
  return (
    <div style={{
      background: "#050508",
      color: "#f0ede8",
      minHeight: "100vh",
      fontFamily: "var(--font-syne), sans-serif",
    }}>
      {/* Nav bar */}
      <nav style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 48px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(5,5,8,0.9)",
        backdropFilter: "blur(20px)",
      }}>
        <Link href="/" style={{
          fontWeight: 800,
          fontSize: "1.05rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#f0ede8",
          textDecoration: "none",
        }}>
          Maphari<span style={{ color: "#c8f135" }}>.</span>
        </Link>
        <Link href="/" style={{
          color: "rgba(240,237,232,0.5)",
          fontSize: "0.78rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textDecoration: "none",
          fontWeight: 600,
        }}>
          ← Back to Home
        </Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "160px 48px 120px" }}>
        <p style={{
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: "0.65rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#c8f135",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <span style={{ width: 32, height: 1, background: "#c8f135", display: "inline-block" }} />
          Legal
        </p>
        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          marginBottom: 16,
        }}>
          Terms of Service
        </h1>
        <p style={{
          color: "rgba(240,237,232,0.45)",
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: "0.72rem",
          letterSpacing: "0.1em",
          marginBottom: 80,
        }}>
          Last updated: March 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {SECTIONS.map((s) => (
            <div key={s.title} style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "40px 0",
            }}>
              <h2 style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: 16,
                letterSpacing: "-0.01em",
              }}>
                {s.title}
              </h2>
              <p style={{
                color: "rgba(240,237,232,0.6)",
                fontSize: "0.9rem",
                lineHeight: 1.75,
                fontWeight: 400,
              }}>
                {s.body}
              </p>
            </div>
          ))}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 48 }}>
            <Link href="/contact" style={{
              display: "inline-block",
              background: "#c8f135",
              color: "#050508",
              padding: "14px 32px",
              fontWeight: 700,
              fontSize: "0.8rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}>
              Contact Us
            </Link>
          </div>
        </div>
      </main>

      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "32px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#050508",
      }}>
        <p style={{
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: "0.65rem",
          color: "rgba(240,237,232,0.35)",
          letterSpacing: "0.08em",
        }}>
          © 2026 Maphari Technologies
        </p>
        <div style={{ display: "flex", gap: 32 }}>
          <Link href="/privacy" style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: "0.65rem",
            color: "rgba(240,237,232,0.45)",
            letterSpacing: "0.08em",
            textDecoration: "none",
            textTransform: "uppercase",
          }}>Privacy</Link>
          <Link href="/terms" style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: "0.65rem",
            color: "#c8f135",
            letterSpacing: "0.08em",
            textDecoration: "none",
            textTransform: "uppercase",
          }}>Terms</Link>
        </div>
      </footer>
    </div>
  );
}
