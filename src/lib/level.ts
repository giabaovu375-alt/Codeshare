// Level helpers
export const LEVEL_RANKS = [
  { min: 1, max: 4, label: "Beginner", emoji: "🌱", color: "text-green-500" },
  { min: 5, max: 9, label: "Coder", emoji: "💻", color: "text-blue-500" },
  { min: 10, max: 19, label: "Pro", emoji: "🚀", color: "text-purple-500" },
  { min: 20, max: 49, label: "Master", emoji: "🔥", color: "text-orange-500" },
  { min: 50, max: 999, label: "Legend", emoji: "🐧", color: "text-yellow-500" },
];

export function rankOf(level: number) {
  return LEVEL_RANKS.find((r) => level >= r.min && level <= r.max) ?? LEVEL_RANKS[0];
}

// XP cần để lên level kế tiếp: level n cần (n-1)^2 * 50 XP
export function xpForLevel(level: number) {
  return Math.pow(level - 1, 2) * 50;
}

export function xpProgress(xp: number, level: number) {
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const range = next - cur;
  const inLevel = Math.max(0, xp - cur);
  const pct = range > 0 ? Math.min(100, (inLevel / range) * 100) : 0;
  return { current: inLevel, needed: range, pct, nextXp: next };
}