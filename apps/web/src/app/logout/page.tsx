import { LogoutPageClient } from "@/components/auth/logout-page-client";

interface LogoutPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function resolveNextPath(next: string | string[] | undefined): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/")) return "/login";
  return value;
}

export default async function LogoutPage({ searchParams }: LogoutPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const nextPath = resolveNextPath(resolved.next);
  return <LogoutPageClient nextPath={nextPath} />;
}

