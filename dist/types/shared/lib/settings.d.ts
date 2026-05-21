export declare const STORAGE_KEY_MAX_UPVOTES = "redditdle_maxUpvotes";
export declare const STORAGE_KEY_MIN_UPVOTES = "redditdle_minUpvotes";
export type UpvoteLimits = {
    minUpvotes: number;
    maxUpvotes: number;
};
export declare function loadMaxUpvotes(): number;
export declare function loadMinUpvotes(): number;
export declare function loadUpvoteLimits(): UpvoteLimits;
export declare function saveMaxUpvotes(value: number): void;
export declare function saveMinUpvotes(value: number): void;
export declare function saveUpvoteLimits(limits: UpvoteLimits): void;
