// ── mentions.ts — @mention parser ────────────────────────────────────────────
import { prisma } from "./prisma.js";

const MENTION_RE = /@([\w.-]+)/g;

/** Parse @mentions from text and return matching staff records */
export async function resolveMentions(text: string): Promise<Array<{ staffId: string; userId: string | null; name: string }>> {
  const handles = [...text.matchAll(MENTION_RE)].map((m) => m[1]!.toLowerCase());
  if (handles.length === 0) return [];

  const staff = await prisma.staffProfile.findMany({
    where: { isActive: true },
    select: { id: true, userId: true, name: true },
  });

  const results: Array<{ staffId: string; userId: string | null; name: string }> = [];
  for (const handle of handles) {
    const match = staff.find((s) => s.name.toLowerCase().replace(/\s+/g, ".").startsWith(handle));
    if (match && !results.find((r) => r.staffId === match.id)) {
      results.push({ staffId: match.id, userId: match.userId, name: match.name });
    }
  }
  return results;
}

/** Log mention notifications (fire-and-forget).
 *  In Wave 3: replace clientActivity.create with notification queue emit. */
export function notifyMentions(
  mentions: Array<{ staffId: string; userId: string | null; name: string }>,
  context: { commentId: string; entityType: string; entityId: string; authorName: string | null; excerpt: string }
): void {
  for (const m of mentions) {
    prisma.clientActivity.create({
      data: {
        clientId: context.entityId,
        type:     "MENTION",
        message:  `${context.authorName ?? "Someone"} mentioned @${m.name} in a comment`,
        actorId:  m.userId ?? undefined,
        metadata: JSON.stringify({ commentId: context.commentId, entityType: context.entityType }),
      },
    }).catch(() => {});
    console.log(`[mentions] @${m.name} mentioned in ${context.entityType}:${context.entityId}`);
  }
}
