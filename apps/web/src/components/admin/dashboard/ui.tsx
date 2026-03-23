"use client";

// ── Ic — SVG icon component (admin dashboard) ──────────────────────────────
// Mirrors the pattern in client/maphari-dashboard/ui.tsx and
// staff/staff-dashboard/ui.tsx. Add icons here as needed.

const IC_PATHS: Record<string, string> = {
  users:     "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  briefcase: "M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM10 5h4v2h-4V5z",
  dollar:    "M12 2v2m0 16v2M6 12H4m16 0h-2m-4-5.196l-1.5-.866M7.5 17.062l-1.5-.866m11.5-7.196l-1.5.866M7.5 6.938L6 7.804M17 12a5 5 0 11-10 0 5 5 0 0110 0z",
  activity:  "M22 12h-4l-3 9L9 3l-3 9H2",
  sparkle:   "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z",
  arrowRight:"M14 5l7 7m0 0l-7 7m7-7H3",
};

export function Ic({
  n,
  sz = 16,
  c = "currentColor",
  sw = 1.75,
}: {
  n: string;
  sz?: number;
  c?: string;
  sw?: number;
}) {
  return (
    <svg
      width={sz}
      height={sz}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={IC_PATHS[n] ?? ""} />
    </svg>
  );
}
