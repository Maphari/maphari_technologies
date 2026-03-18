import { redirect } from "next/navigation";

interface Props {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: Props) {
  const resolved = searchParams ? await searchParams : {};
  const next = resolved.next;
  const nextValue = Array.isArray(next) ? next[0] : next;
  const qs = nextValue ? `?next=${encodeURIComponent(nextValue)}` : "";
  redirect(`/client/login${qs}`);
}
