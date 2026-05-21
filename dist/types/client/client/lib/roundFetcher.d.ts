import type { RoundData } from '../../shared/types/types';
export declare const BATCH_SIZE = 5;
export interface FetchRoundBatchOptions {
    subreddits: string[];
    count: number;
    startRound: number;
    seed: number;
    usedPostIds?: Set<string>;
}
export declare function fetchRoundBatch({ subreddits, count, startRound, seed, usedPostIds, }: FetchRoundBatchOptions): Promise<RoundData[]>;
