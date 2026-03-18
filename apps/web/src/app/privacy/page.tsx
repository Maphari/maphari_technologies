// ════════════════════════════════════════════════════════════════════════════
// privacy/page.tsx — Privacy Policy page (server component)
// ════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Maphari Technologies",
  description: "How Maphari Technologies collects, uses, and protects your information.",
  alternates: { canonical: "/privacy" }
};

const SECTIONS = [
  {
    title: "Information We Collect",
    body: "We collect information you provide directly — such as your name, email address, company name, and project details — when you contact us through our website or use our client portal. We may also collect usage data automatically, including IP addresses, browser type, and page interaction data through standard web analytics tools."
  },
  {
    title: "How We Use Your Information",
    body: "We use collected information to respond to enquiries, deliver and improve our services, communicate project updates, and fulfil our contractual obligations. We do not sell or rent your personal information to third parties."
  },
  {
    title: "Data Storage & Security",
    body: "Your data is stored on secured, encrypted infrastructure. We apply role-based access controls and follow industry-standard security practices including TLS in transit and encryption at rest. Access to client data is restricted to authorised personnel only."
  },
  {
    title: "Third-Party Services",
    body: "We may use trusted third-party tools (such as analytics, payment processors, or communication platforms) that may have access to certain data as required to provide those services. These parties are contractually bound to handle data in accordance with applicable privacy laws."
  },
  {
    title: "Your Rights",
    body: "Depending on your jurisdiction, you may have the right to access, correct, or request deletion of personal data we hold about you. To exercise any of these rights, please contact us using the details below."
  },
  {
    title: "Cookies",
    body: "Our website uses essential cookies for functionality and, where applicable, analytics cookies to understand how visitors use our site. You can control cookie preferences through your browser settings."
  },
  {
    title: "Changes to This Policy",
    body: "We may update this policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of our services after changes constitutes acceptance of the revised policy."
  },
  {
    title: "Contact",
    body: "For any privacy-related questions or requests, please reach out via our Contact page or email us directly at privacy@maphari.co.za."
  }
];

export default function PrivacyPage() {
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
          Privacy Policy
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
            color: "#c8f135",
            letterSpacing: "0.08em",
            textDecoration: "none",
            textTransform: "uppercase",
          }}>Privacy</Link>
          <Link href="/terms" style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: "0.65rem",
            color: "rgba(240,237,232,0.45)",
            letterSpacing: "0.08em",
            textDecoration: "none",
            textTransform: "uppercase",
          }}>Terms</Link>
        </div>
      </footer>
    </div>
  );
}
