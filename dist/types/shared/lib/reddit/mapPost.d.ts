import { isImageOnlyPost } from './filters';
import type { RedditPostRaw, RoundPost } from './types';
export { isImageOnlyPost };
export declare function getPostImageUrl(post: RedditPostRaw): string | undefined;
export declare function getPostBody(post: RedditPostRaw): string;
export declare function toRoundPost(post: RedditPostRaw): RoundPost;
