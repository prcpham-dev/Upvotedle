import type { FetchRoundOptions, GameRoundPayload } from '../../shared/lib/reddit/types';
/**
 * Fetches game rounds for the given subreddit.
 *
 * Min upvote fallback tiers: 1000 → 500 → 0
 * Max upvotes is always 1,000,000 (no cap).
 * Tries each tier in order until enough eligible posts are found to build the requested rounds.
 */
export declare function fetchGameRound(subreddit: string, options?: FetchRoundOptions, count?: number): Promise<GameRoundPayload>;
