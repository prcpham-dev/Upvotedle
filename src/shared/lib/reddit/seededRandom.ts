/** Deterministic 32-bit hash for seed strings (date + subreddit + round). */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — returns a function that yields numbers in [0, 1). */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** UTC calendar day key (YYYY-MM-DD), shared by all players for that day. */
export function getDailyDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function dailyRoundSeed(
  dateKey: string,
  subreddit: string,
  round: number,
): number {
  return hashString(`${dateKey}:${subreddit}:${round}`);
}

/** Fisher–Yates partial shuffle; picks `count` distinct items deterministically. */
export function pickSeededSample<T>(
  items: T[],
  count: number,
  seed: number,
): T[] {
  if (items.length < count) {
    throw new Error(
      `Not enough items (need ${count}, found ${items.length})`,
    );
  }
  const random = createSeededRandom(seed);
  const pool = [...items];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j] as T, pool[i] as T];
  }
  return pool.slice(0, count);
}
