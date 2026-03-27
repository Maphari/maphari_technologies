// ════════════════════════════════════════════════════════════════════════════
// wake-word.ts — Wake word detection and action item phrase matching
// ════════════════════════════════════════════════════════════════════════════

/**
 * Extracts the command portion that follows "hey maphari" in a transcript line.
 * Returns null if the wake word is not present.
 *
 * @example
 * extractWakeCommand("hey maphari, what's the project status?")
 * // => "what's the project status?"
 */
export function extractWakeCommand(text: string): string | null {
  const match = text.toLowerCase().match(/hey\s+maphari[,.]?\s*(.*)/s);
  const command = match?.[1]?.trim() ?? null;
  return command && command.length > 0 ? command : null;
}

/**
 * Returns true if the transcript snippet looks like an action item.
 * Used for real-time detection during a call.
 */
export function isActionItemPhrase(text: string): boolean {
  const patterns = [
    /\bwe need to\b/i,
    /\bcan you\b/i,
    /\bi('ll| will)\b/i,
    /\baction item\b/i,
    /\bfollow[ -]?up\b/i,
    /\bby (next|this|end of)\b/i,
    /\bdeadline\b/i,
    /\bmake sure\b/i,
    /\bdon't forget\b/i,
    /\bsomeone (should|needs to)\b/i,
    /\blet's (make sure|not forget|schedule|plan)\b/i,
    /\bassigned to\b/i,
    /\btake ownership\b/i,
  ];
  return patterns.some((p) => p.test(text));
}
