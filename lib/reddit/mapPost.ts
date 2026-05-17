import { getPostUpvotes } from "./filters";
import type { RedditPostRaw, RoundPost } from "./types";

const IMAGE_URL_PATTERN = /\.(jpe?g|png|gif|webp|bmp)(\?.*)?$/i;

const VIDEO_POST_HINTS = new Set(["hosted:video", "rich:video"]);

function decodeRedditUrl(url: string): string {
  return url.replace(/&amp;/g, "&");
}

/** True when the post is essentially a single image (no video/gallery). */
export function isImageOnlyPost(post: RedditPostRaw): boolean {
  if (post.is_video || post.is_gallery || post.gallery_data) {
    return false;
  }
  if (post.post_hint && VIDEO_POST_HINTS.has(post.post_hint)) {
    return false;
  }
  if (post.post_hint === "image") {
    return true;
  }
  const domain = post.domain?.toLowerCase() ?? "";
  if (domain === "i.redd.it" && post.url && IMAGE_URL_PATTERN.test(post.url)) {
    return true;
  }
  if (
    !post.is_self &&
    post.url &&
    IMAGE_URL_PATTERN.test(post.url) &&
    !(post.selftext?.trim())
  ) {
    return true;
  }
  return false;
}

export function getPostImageUrl(post: RedditPostRaw): string | undefined {
  if (!isImageOnlyPost(post)) {
    return undefined;
  }

  const candidates = [
    post.url_overridden_by_dest,
    post.url,
    post.preview?.images?.[0]?.source?.url,
    post.preview?.images?.[0]?.resolutions?.slice(-1)[0]?.url,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const decoded = decodeRedditUrl(candidate);
    if (IMAGE_URL_PATTERN.test(decoded) || decoded.includes("i.redd.it")) {
      return decoded;
    }
  }

  return undefined;
}

export function getPostBody(post: RedditPostRaw): string {
  return (post.selftext ?? "").trim();
}

export function toRoundPost(post: RedditPostRaw): RoundPost {
  const roundPost: RoundPost = {
    title: post.title.trim(),
    upvotes: getPostUpvotes(post),
    body: getPostBody(post),
  };

  const image = getPostImageUrl(post);
  if (image) {
    roundPost.image = image;
  }

  return roundPost;
}
