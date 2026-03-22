// ════════════════════════════════════════════════════════════════════════════
// status/page.tsx — Public platform status page (server component)
// ════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Platform Status | Maphari Technologies",
  description: "Real-time status of Maphari Technologies platform services."
};

export const revalidate = 30;

interface ServiceHealth {
  name: string;
  status: "operational" | "degraded";
  latencyMs?: number;
}

interface StatusPayload {
  overall: "operational" | "degraded";
  services: ServiceHealth[];
  updatedAt: string;
}

async function fetchStatus(): Promise<StatusPayload | null> {
  const gatewayUrl = process.env.GATEWAY_INTERNAL_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${gatewayUrl}/status`, {
      next: { revalidate: 30 }
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: StatusPayload };
    if (!json.success) return null;
    return json.data;
  } catch {
    return null;
  }
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Johannesburg"
    });
  } catch {
    return iso;
  }
}

export default async function StatusPage() {
  const data = await fetchStatus();

  const isOperational = data?.overall === "operational";
  const unavailable = data === null;

  return (
    <div
      style={{
        background: "#050508",
        color: "#f0ede8",
        minHeight: "100vh",
        fontFamily: "var(--font-syne), sans-serif"
      }}
    >
      {/* Nav */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 48px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(5,5,8,0.9)",
          backdropFilter: "blur(20px)"
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 800,
            fontSize: "1.05rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#f0ede8",
            textDecoration: "none"
          }}
        >
          Maphari<span style={{ color: "#c8f135" }}>.</span>
        </Link>
        <Link
          href="/"
          style={{
            color: "rgba(240,237,232,0.5)",
            fontSize: "0.78rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Main content */}
      <main
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "140px 48px 120px"
        }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: "0.65rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#c8f135",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}
        >
          <span
            style={{
              width: 32,
              height: 1,
              background: "#c8f135",
              display: "inline-block"
            }}
          />
          System Status
        </p>

        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            marginBottom: 48
          }}
        >
          Platform Status
        </h1>

        {/* Overall status banner */}
        {unavailable ? (
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: "32px 40px",
              marginBottom: 48,
              display: "flex",
              alignItems: "center",
              gap: 20
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "rgba(240,237,232,0.3)",
                flexShrink: 0,
                display: "inline-block"
              }}
            />
            <div>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginBottom: 4
                }}
              >
                Status Unavailable
              </p>
              <p
                style={{
                  color: "rgba(240,237,232,0.5)",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-dm-mono), monospace"
                }}
              >
                Could not retrieve status at this time. Please try again shortly.
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              border: `1px solid ${isOperational ? "rgba(200,241,53,0.25)" : "rgba(239,68,68,0.25)"}`,
              borderRadius: 12,
              padding: "32px 40px",
              marginBottom: 48,
              background: isOperational
                ? "rgba(200,241,53,0.04)"
                : "rgba(239,68,68,0.04)",
              display: "flex",
              alignItems: "center",
              gap: 20
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: isOperational ? "#c8f135" : "#ef4444",
                flexShrink: 0,
                display: "inline-block",
                boxShadow: isOperational
                  ? "0 0 12px rgba(200,241,53,0.6)"
                  : "0 0 12px rgba(239,68,68,0.6)"
              }}
            />
            <div>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: isOperational ? "#c8f135" : "#ef4444",
                  marginBottom: 4
                }}
              >
                {isOperational ? "All Systems Operational" : "Partial Outage"}
              </p>
              <p
                style={{
                  color: "rgba(240,237,232,0.5)",
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-dm-mono), monospace",
                  letterSpacing: "0.06em"
                }}
              >
                {isOperational
                  ? "All platform services are running normally."
                  : "One or more services are experiencing issues."}
              </p>
            </div>
          </div>
        )}

        {/* Service grid */}
        {!unavailable && data && (
          <>
            <p
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(240,237,232,0.4)",
                marginBottom: 20
              }}
            >
              Services
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 16
              }}
            >
              {data.services.map((svc) => {
                const ok = svc.status === "operational";
                return (
                  <div
                    key={svc.name}
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: "24px 28px",
                      background: "rgba(255,255,255,0.02)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background: ok ? "#c8f135" : "#f59e0b",
                          flexShrink: 0,
                          display: "inline-block"
                        }}
                      />
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          letterSpacing: "-0.01em"
                        }}
                      >
                        {svc.name}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-mono), monospace",
                          fontSize: "0.68rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: ok ? "#c8f135" : "#f59e0b",
                          marginBottom: svc.latencyMs != null ? 4 : 0
                        }}
                      >
                        {ok ? "Operational" : "Degraded"}
                      </p>
                      {svc.latencyMs != null && (
                        <p
                          style={{
                            fontFamily: "var(--font-dm-mono), monospace",
                            fontSize: "0.65rem",
                            color: "rgba(240,237,232,0.35)",
                            letterSpacing: "0.06em"
                          }}
                        >
                          {svc.latencyMs}ms
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Last updated */}
        {!unavailable && data && (
          <p
            style={{
              marginTop: 40,
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "0.68rem",
              color: "rgba(240,237,232,0.35)",
              letterSpacing: "0.08em"
            }}
          >
            Last updated: {formatTimestamp(data.updatedAt)}
          </p>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "32px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#050508"
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: "0.65rem",
            color: "rgba(240,237,232,0.35)",
            letterSpacing: "0.08em"
          }}
        >
          © 2026 Maphari Technologies
        </p>
        <div style={{ display: "flex", gap: 32 }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "0.65rem",
              color: "rgba(240,237,232,0.45)",
              letterSpacing: "0.08em",
              textDecoration: "none",
              textTransform: "uppercase"
            }}
          >
            Home
          </Link>
          <Link
            href="/privacy"
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "0.65rem",
              color: "rgba(240,237,232,0.45)",
              letterSpacing: "0.08em",
              textDecoration: "none",
              textTransform: "uppercase"
            }}
          >
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}
