// ════════════════════════════════════════════════════════════════════════════
// survey/[token]/page.tsx — Public tokenised NPS survey (server component)
// No auth required — token validates access
// ════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import { SurveyForm } from "./survey-form";

export const metadata: Metadata = {
  title: "Share Your Feedback | Maphari Technologies",
  description: "Share your experience with Maphari Technologies."
};

interface SurveyData {
  surveyId: string;
  clientId: string;
  companyName: string;
  periodStart: string;
  periodEnd: string;
}

function SurveyInvalid() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#050508",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "24px"
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          textAlign: "center"
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px"
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#fff",
            margin: "0 0 12px"
          }}
        >
          Survey unavailable
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.6,
            margin: 0
          }}
        >
          This survey link has expired, already been used, or does not exist. Please contact your account manager if you believe this is an error.
        </p>
      </div>
    </div>
  );
}

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const gatewayBase = process.env.GATEWAY_BASE_URL ?? process.env.GATEWAY_INTERNAL_URL ?? "http://localhost:4000/api/v1";

  let surveyData: SurveyData | null = null;

  try {
    const res = await fetch(`${gatewayBase}/public/survey/${token}`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as { success: boolean; data: SurveyData };
      if (json.success && json.data) {
        surveyData = json.data;
      }
    }
  } catch {
    // Network error — treat as invalid
  }

  if (!surveyData) {
    return <SurveyInvalid />;
  }

  return <SurveyForm token={token} survey={surveyData} />;
}
