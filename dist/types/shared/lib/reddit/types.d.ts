export type RoundPost = {
    id: string;
    title: string;
    upvotes: number;
    /** Post text (selftext); empty string when none. */
    body: string;
    /** Direct image URL when the post is a single image. */
    image?: string;
    /** Reddit username of the post author. */
    author: string;
    /** Reddit permalink path e.g. /r/sub/comments/abc/title/ */
    permalink: string;
    /** Unix timestamp (seconds) when the post was created. */
    createdAt: number;
};
export type GameRound = {
    round: number;
    subreddit: string;
    postA: RoundPost;
    postB: RoundPost;
};
/** Payload returned to the game engine (one or more rounds). */
export type GameRoundPayload = GameRound[];
export type RedditListingResponse = {
    data: {
        children: Array<{
            data: RedditPostRaw;
        }>;
    };
};
export type ListingSort = 'hot' | 'new' | 'top' | 'rising';
export type ListingSource = {
    sort: ListingSort;
    topTime?: FetchRoundOptions['topTime'];
};
export type RedditPostRaw = {
    id?: string;
    title: string;
    ups: number;
    score: number;
    author: string;
    permalink: string;
    created_utc: number;
    over_18: boolean;
    stickied: boolean;
    is_video: boolean;
    is_self?: boolean;
    is_gallery?: boolean;
    post_hint?: string;
    url?: string;
    url_overridden_by_dest?: string;
    domain?: string;
    selftext?: string;
    removed_by_category?: string | null;
    media?: unknown;
    gallery_data?: unknown;
    preview?: {
        images?: Array<{
            source?: {
                url?: string;
            };
            resolutions?: Array<{
                url?: string;
            }>;
        }>;
    };
};
export type FetchRoundOptions = {
    /** When set, only this listing is used; otherwise multiple sorts are pooled. */
    sort?: ListingSort;
    /** Time filter when sort is `top` (default: week). */
    topTime?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    /** How many posts to pull before filtering (default: 100, max 100). */
    limit?: number;
    round?: number;
    /** Only include posts at or below this value; at MAX_UPVOTES_LIMIT means no cap. */
    maxUpvotes?: number;
    /** Only include posts with at least this many upvotes (default: 1000). */
    minUpvotes?: number;
    /** When set, post selection uses this seed instead of Math.random(). */
    seed?: number;
    /** Post ids already used in this game; excluded from selection. */
    excludePostIds?: Iterable<string>;
};
