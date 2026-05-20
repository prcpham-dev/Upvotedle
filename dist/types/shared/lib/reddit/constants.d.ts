/** Upper bound for user-configured upvote limits. */
export declare const MAX_UPVOTES_LIMIT = 1000000;
/** Default: no practical maximum (posts of any popularity are eligible). */
export declare const DEFAULT_MAX_UPVOTES = 1000000;
/** Default floor: only posts with at least this many upvotes are eligible. */
export declare const DEFAULT_MIN_UPVOTES = 1000;
/** True when a maximum upvote cap is active (below the no-limit sentinel). */
export declare function hasMaxUpvoteCap(maxUpvotes: number): boolean;
