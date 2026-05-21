import type { FetchRoundOptions, GameRoundPayload } from './types';
/**
 * Builds today's puzzle: tries subreddits in date-seeded order until
 * {@link DAILY_ROUND_COUNT} rounds succeed (skips subs with too few eligible posts).
 */
export declare function fetchDailyPuzzle(options?: Pick<FetchRoundOptions, 'maxUpvotes' | 'minUpvotes'>): Promise<GameRoundPayload>;
