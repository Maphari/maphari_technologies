import type { Metadata } from "next";
import { ContactPageClient } from "@/components/marketing/contact-page-client";

export const metadata: Metadata = {
  title: "Contact | Maphari Technologies",
  description:
    "Contact Maphari Technologies for web development, mobile apps, web design, automation, and maintenance delivery planning.",
  alternates: {
    canonical: "/contact"
  },
  openGraph: {
    title: "Contact | Maphari Technologies",
    description:
      "Share your project goals and get a practical roadmap with scope, sequence, and delivery recommendations.",
    url: "/contact",
    siteName: "Maphari Technologies",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact | Maphari Technologies",
    description:
      "Share your project goals and get a practical roadmap with scope and delivery recommendations."
  }
};

export default function ContactPage() {
  return <ContactPageClient />;
}
