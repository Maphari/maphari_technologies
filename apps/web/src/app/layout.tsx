import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans, Instrument_Serif, Syne } from "next/font/google";
import { cookies } from "next/headers";
import "./style/globals.css";
import "./style/print.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Maphari Technologies",
  description: "Maphari marketing, portal, and admin platform",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon.ico", sizes: "any" }
    ],
    apple: "/favicon/apple-touch-icon.png"
  },
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#c8f135",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap"
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap"
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
  display: "swap"
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap"
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const resolvedTheme = (cookieStore.get("maphari:theme-r")?.value ?? "light") as "light" | "dark";
  return (
    <html lang="en" data-theme={resolvedTheme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('maphari:theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=d?'dark':'light';document.documentElement.setAttribute('data-theme',r);document.cookie='maphari:theme-r='+r+';path=/;max-age=31536000;SameSite=Lax';})();` }} />
        {/* PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Maphari" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        {/* Service worker registration */}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(err){console.warn('SW registration failed:',err);});});}` }} />
      </head>
      <body className={`${syne.variable} ${dmSans.variable} ${dmMono.variable} ${instrumentSerif.variable}`}>{children}</body>
    </html>
  );
}
