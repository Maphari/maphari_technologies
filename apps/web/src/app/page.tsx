import type { Metadata } from "next";
import { MarketingHomeContent } from "../components/marketing/marketing-home";

export const metadata: Metadata = {
  title: "Maphari Technologies | Web, Mobile, Design, Automation",
  description:
    "Maphari Technologies designs and delivers web development, mobile apps, web design, automation, and ongoing maintenance systems.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Maphari Technologies",
    description:
      "Build modern digital systems with one expert team: web development, mobile apps, web design, automation, and maintenance.",
    url: "/",
    siteName: "Maphari Technologies",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Maphari Technologies",
    description:
      "Web development, mobile apps, web design, automation, and maintenance for reliable service delivery."
  }
};

export default function MarketingHome() {
  return <MarketingHomeContent />;
}
