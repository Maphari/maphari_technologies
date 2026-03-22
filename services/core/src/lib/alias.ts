// Deterministic @adjective-animal alias generator.
// Given the same userId it always returns the same string.
// ~50 × ~50 = 2,500 unique combinations.

const ADJECTIVES = [
  "amber", "azure", "bold", "bright", "calm", "cobalt", "cool", "coral",
  "crisp", "crystal", "cyan", "dark", "dawn", "deep", "dusk", "emerald",
  "faded", "fierce", "fiery", "foggy", "forest", "frosty", "glowing",
  "golden", "grand", "green", "grey", "hazy", "icy", "indigo", "ivory",
  "jade", "keen", "lofty", "lunar", "misty", "neon", "noble", "obsidian",
  "onyx", "opal", "pine", "prism", "quiet", "rapid", "rose", "ruby",
  "scarlet", "serene", "shadow", "sharp", "silent", "silver", "slate",
];

const ANIMALS = [
  "albatross", "badger", "bear", "bison", "buck", "condor", "crane",
  "crow", "dingo", "dolphin", "dove", "eagle", "elk", "falcon", "finch",
  "fox", "gecko", "heron", "hound", "ibis", "jackal", "jaguar", "kestrel",
  "kite", "koala", "lemur", "leopard", "lynx", "mako", "marlin", "mink",
  "moose", "narwhal", "newt", "orca", "osprey", "otter", "panther", "puma",
  "raven", "robin", "sable", "salmon", "shark", "snipe", "sparrow", "swift",
  "tiger", "viper", "vole", "weasel", "wolf",
];

/**
 * Hash a string into a non-negative 32-bit integer using djb2.
 */
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0; // keep 32-bit signed
  }
  return Math.abs(hash);
}

/**
 * Generate a deterministic anonymous alias for a userId.
 * Example: generateAlias("user-abc-123") → "@amber-falcon"
 */
export function generateAlias(userId: string): string {
  const hash = djb2(userId);
  const adj = ADJECTIVES[hash % ADJECTIVES.length];
  const animal = ANIMALS[Math.floor(hash / ADJECTIVES.length) % ANIMALS.length];
  return `@${adj}-${animal}`;
}
