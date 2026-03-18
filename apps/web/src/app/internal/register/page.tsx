import type { Metadata } from "next";
import { RegisterScreen } from "@/components/auth/register-screen";

export const metadata: Metadata = {
  title: "Register | Maphari Technologies",
  description: "Request staff or admin access to Maphari Technologies.",
  robots: { index: false, follow: false }
};

export default function InternalRegisterPage() {
  return <RegisterScreen />;
}
