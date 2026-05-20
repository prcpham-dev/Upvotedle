import type { RedditPostRaw } from './types';
/** Stable id for deduping and exclusion (Reddit id or title+author fallback). */
export declare function getPostId(post: RedditPostRaw): string;
export declare function collectPostIdsFromRound(round: {
    postA: {
        id: string;
    };
    postB: {
        id: string;
    };
}): string[];
export declare function collectPostIdsFromRounds(rounds: Array<{
    postA: {
        id: string;
    };
    postB: {
        id: string;
    };
}>): string[];
