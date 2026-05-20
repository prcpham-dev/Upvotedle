import { getPostUpvotes, isImageOnlyPost } from './filters';
import { getPostId } from './postId';
import type { RedditPostRaw, RoundPost } from './types';

export { isImageOnlyPost };

const IMAGE_URL_PATTERN = /\.(jpe?g|png|gif|webp|bmp)(\?.*)?$/i;

function decodeRedditUrl(url: string): string {
  return url.replace(/&amp;/g, '&');
}

function pickPreviewImageUrl(post: RedditPostRaw): string | undefined {
  const candidates = [
    post.url_overridden_by_dest,
    post.url,
    post.preview?.images?.[0]?.source?.url,
    post.preview?.images?.[0]?.resolutions?.slice(-1)[0]?.url,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const decoded = decodeRedditUrl(candidate);
    if (IMAGE_URL_PATTERN.test(decoded) || decoded.includes('i.redd.it')) {
      return decoded;
    }
  }

  return undefined;
}

export function getPostImageUrl(post: RedditPostRaw): string | undefined {
  return pickPreviewImageUrl(post);
}

export function getPostBody(post: RedditPostRaw): string {
  return (post.selftext ?? '').trim();
}

export function toRoundPost(post: RedditPostRaw): RoundPost {
  const roundPost: RoundPost = {
    id: getPostId(post),
    title: post.title.trim(),
    upvotes: getPostUpvotes(post),
    body: getPostBody(post),
    author: post.author ?? 'unknown',
    permalink: post.permalink ?? '',
    createdAt: post.created_utc ?? 0,
  };

  const image = getPostImageUrl(post);
  if (image) {
    roundPost.image = image;
  }

  return roundPost;
}
