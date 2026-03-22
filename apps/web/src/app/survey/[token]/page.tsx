// ════════════════════════════════════════════════════════════════════════════
// survey/[token]/page.tsx — Public tokenised NPS survey (server component)
// No auth required — token validates access
// ════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import { SurveyForm } from "./survey-form";

export interface SurveyData {
  surveyId: string;
  clientId: string;
  companyName: string;
  periodStart: string;
  periodEnd: string;
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const gatewayUrl = process.env.GATEWAY_BASE_URL ?? process.env.GATEWAY_INTERNAL_URL ?? "http://localhost:4000/api/v1";
  const res = await fetch(`${gatewayUrl}/public/survey/${token}`, { cache: "no-store" });
  if (!res.ok) return { title: "Survey | Maphari Technologies" };
  const json = await res.json() as { data?: { companyName?: string } };
  const company = json.data?.companyName;
  return {
    title: company ? `${company} — Share Your Feedback` : "Share Your Feedback | Maphari Technologies",
    description: "Share your experience with Maphari Technologies."
  };
}

type InvalidReason = "not_found" | "gone" | "error";

function SurveyInvalid({ reason }: { reason: InvalidReason }) {
  const message =
    reason === "not_found"
      ? "This survey link doesn't exist."
      : reason === "gone"
      ? "This survey has already been completed or the link has expired. Thank you!"
      : "Something went wrong. Please try again later or contact your account manager.";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#050508",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: "32px 16px"
      }}
    >
      <div
        style={{
          maxWidth: 600,
          width: "100%",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "40px 36px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
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
            margin: "0 0 12px",
            letterSpacing: "-0.02em"
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
          {message}
        </p>
      </div>
    </div>
  );
}

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const gatewayBase = process.env.GATEWAY_BASE_URL ?? process.env.GATEWAY_INTERNAL_URL ?? "http://localhost:4000/api/v1";

  let surveyData: SurveyData | null = null;
  let invalidReason: InvalidReason = "error";

  try {
    const res = await fetch(`${gatewayBase}/public/survey/${token}`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as { success: boolean; data: SurveyData };
      if (json.success && json.data) {
        surveyData = json.data;
      }
    } else if (res.status === 404) {
      invalidReason = "not_found";
    } else if (res.status === 410) {
      invalidReason = "gone";
    } else {
      invalidReason = "error";
    }
  } catch {
    // Network error — treat as generic error
    invalidReason = "error";
  }

  if (!surveyData) {
    return <SurveyInvalid reason={invalidReason} />;
  }

  return <SurveyForm token={token} survey={surveyData} />;
}
