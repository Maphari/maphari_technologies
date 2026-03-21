import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MarketingHomeContent } from "../components/marketing/marketing-home";
import { AUTH_ROLE_COOKIE, isRole, roleHomePath } from "../lib/auth/routing";

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

export default async function MarketingHome() {
  // If the user is already logged in, redirect them to their dashboard.
  // The proxy.ts matcher does not cover "/", so we handle the redirect here.
  const cookieStore = await cookies();
  const rawRole = cookieStore.get(AUTH_ROLE_COOKIE)?.value;
  if (isRole(rawRole)) {
    redirect(roleHomePath(rawRole));
  }

  return <MarketingHomeContent />;
}
