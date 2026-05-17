/** Upper bound for user-configured upvote limits. */
export const MAX_UPVOTES_LIMIT = 1_000_000;

/** Default: no practical maximum (posts of any popularity are eligible). */
export const DEFAULT_MAX_UPVOTES = MAX_UPVOTES_LIMIT;

/** Default floor: only posts with at least this many upvotes are eligible. */
export const DEFAULT_MIN_UPVOTES = 1000;

/** True when a maximum upvote cap is active (below the no-limit sentinel). */
export function hasMaxUpvoteCap(maxUpvotes: number): boolean {
  return Number.isFinite(maxUpvotes) && maxUpvotes < MAX_UPVOTES_LIMIT;
}
