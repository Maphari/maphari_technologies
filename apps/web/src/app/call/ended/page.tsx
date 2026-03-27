export default function CallEndedPage() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "#0d0d14", fontFamily: "system-ui, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "#1a1a24", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px", padding: "40px 32px", maxWidth: "400px",
        textAlign: "center",
      }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%", background: "#1f2a1a",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", fontSize: "1.4rem",
        }}>
          ✓
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e8e5e0", marginBottom: "8px" }}>
          Call ended
        </div>
        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.55 }}>
          You have left the meeting. You can close this tab or return to your dashboard.
        </div>
        <a href="/portal" style={{
          display: "inline-block", marginTop: "20px", padding: "8px 20px",
          background: "#b5ff4d", color: "#0d0d14", borderRadius: "6px",
          fontWeight: 700, fontSize: "0.8rem", textDecoration: "none",
        }}>
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

export const metadata = { title: "Call Ended — Maphari Technologies" };
