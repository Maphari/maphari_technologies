// ════════════════════════════════════════════════════════════════════════════
// client/loading.tsx — Client portal loading screen
// ════════════════════════════════════════════════════════════════════════════

export default function ClientLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030309",
        backgroundImage:
          "radial-gradient(ellipse 900px 700px at 18% 28%, rgba(200,241,53,0.07) 0%, transparent 60%), radial-gradient(ellipse 700px 600px at 82% 78%, rgba(200,241,53,0.04) 0%, transparent 55%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
      `}</style>

      {/* Logo mark */}
      <div
        style={{
          width: 40,
          height: 40,
          background: "#c8f135",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-syne, 'Syne', system-ui, sans-serif)",
          fontWeight: 800,
          fontSize: 20,
          color: "#0a0a0a",
          animation: "pulse 1.8s ease-in-out infinite"
        }}
      >
        M
      </div>

      {/* Wordmark */}
      <span
        style={{
          fontFamily: "var(--font-syne, 'Syne', system-ui, sans-serif)",
          fontWeight: 700,
          fontSize: 18,
          color: "#f0ede8"
        }}
      >
        Maphari
      </span>

      {/* Subtitle */}
      <span
        style={{
          fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)",
          fontSize: 12,
          color: "rgba(240,237,232,0.35)",
          letterSpacing: "0.04em"
        }}
      >
        Client Portal
      </span>
    </div>
  );
}
