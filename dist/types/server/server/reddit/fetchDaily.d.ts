import type { FetchRoundOptions, GameRoundPayload } from '../../shared/lib/reddit/types';
export declare function fetchDailyPuzzle(options?: Pick<FetchRoundOptions, 'maxUpvotes' | 'minUpvotes'>): Promise<GameRoundPayload>;
