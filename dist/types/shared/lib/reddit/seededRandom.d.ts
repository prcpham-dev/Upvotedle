/** Deterministic 32-bit hash for seed strings (date + subreddit + round). */
export declare function hashString(input: string): number;
/** Mulberry32 — returns a function that yields numbers in [0, 1). */
export declare function createSeededRandom(seed: number): () => number;
/** UTC calendar day key (YYYY-MM-DD), shared by all players for that day. */
export declare function getDailyDateKey(date?: Date): string;
export declare function dailyRoundSeed(dateKey: string, subreddit: string, round: number): number;
/** Fisher–Yates partial shuffle; picks `count` distinct items deterministically. */
export declare function pickSeededSample<T>(items: T[], count: number, seed: number): T[];
