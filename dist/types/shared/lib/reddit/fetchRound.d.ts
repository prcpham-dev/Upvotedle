import type { FetchRoundOptions, GameRoundPayload } from './types';
/**
 * Fetches the listing pool once and builds multiple rounds without re-fetching.
 */
export declare function fetchMultipleGameRounds(subreddit: string, roundCount: number, options?: FetchRoundOptions): Promise<GameRoundPayload>;
/**
 * Fetches posts from reddit.com/r/{subreddit}, filters unsuitable entries,
 * picks two at random, and returns game-engine JSON.
 */
export declare function fetchGameRound(subreddit: string, options?: FetchRoundOptions): Promise<GameRoundPayload>;
