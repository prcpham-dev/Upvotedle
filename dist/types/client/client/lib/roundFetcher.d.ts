import type { RoundData } from '../../shared/types/types';
export declare const BATCH_SIZE = 5;
export interface FetchRoundBatchOptions {
    subreddits: string[];
    count: number;
    startRound: number;
    limitsQuery: string;
    seed: number;
    usedPostIds?: Set<string>;
}
export declare function fetchRoundBatch({ subreddits, count, startRound, limitsQuery, seed, usedPostIds, }: FetchRoundBatchOptions): Promise<RoundData[]>;
