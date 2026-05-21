import type { RedditPostRaw } from './types';
/** True when the post is essentially a single image (no video/gallery). */
export declare function isImageOnlyPost(post: RedditPostRaw): boolean;
export declare function getPostUpvotes(post: RedditPostRaw): number;
export declare function isWithinUpvoteLimit(post: RedditPostRaw, maxUpvotes: number): boolean;
export declare function isAboveMinUpvoteLimit(post: RedditPostRaw, minUpvotes: number): boolean;
export declare function isDeletedOrRemoved(post: RedditPostRaw): boolean;
export declare function isNsfw(post: RedditPostRaw): boolean;
export declare function isMediaHeavy(post: RedditPostRaw): boolean;
export declare function isEligiblePost(post: RedditPostRaw, maxUpvotes?: number, minUpvotes?: number): boolean;
