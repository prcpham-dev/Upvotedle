import { hasMaxUpvoteCap } from "./constants";
import { isImageOnlyPost } from "./mapPost";
import type { RedditPostRaw } from "./types";

const MEDIA_POST_HINTS = new Set([
  "hosted:video",
  "rich:video",
  "gallery",
]);

const MEDIA_DOMAINS = new Set([
  "i.redd.it",
  "v.redd.it",
  "i.imgur.com",
  "imgur.com",
  "gfycat.com",
  "redgifs.com",
  "streamable.com",
]);

const IMAGE_URL_PATTERN = /\.(jpe?g|png|gif|webp|bmp)(\?.*)?$/i;

export function getPostUpvotes(post: RedditPostRaw): number {
  if (typeof post.ups === "number" && Number.isFinite(post.ups)) {
    return post.ups;
  }
  if (typeof post.score === "number" && Number.isFinite(post.score)) {
    return post.score;
  }
  return 0;
}

export function isWithinUpvoteLimit(
  post: RedditPostRaw,
  maxUpvotes: number,
): boolean {
  return getPostUpvotes(post) <= maxUpvotes;
}

export function isAboveMinUpvoteLimit(
  post: RedditPostRaw,
  minUpvotes: number,
): boolean {
  return getPostUpvotes(post) >= minUpvotes;
}

export function isDeletedOrRemoved(post: RedditPostRaw): boolean {
  const title = post.title?.trim() ?? "";
  if (
    title === "[removed]" ||
    title === "[deleted]" ||
    /^removed$/i.test(title)
  ) {
    return true;
  }
  if (post.author === "[deleted]" || post.author === "AutoModerator") {
    return true;
  }
  if (post.removed_by_category) {
    return true;
  }
  const body = post.selftext?.trim() ?? "";
  if (body === "[removed]" || body === "[deleted]") {
    return true;
  }
  return false;
}

export function isNsfw(post: RedditPostRaw): boolean {
  return post.over_18 === true;
}

export function isMediaHeavy(post: RedditPostRaw): boolean {
  if (isImageOnlyPost(post)) {
    return false;
  }
  if (post.is_video || post.is_gallery) {
    return true;
  }
  if (post.gallery_data || post.media) {
    return true;
  }
  if (post.post_hint && MEDIA_POST_HINTS.has(post.post_hint)) {
    return true;
  }
  if (post.domain && MEDIA_DOMAINS.has(post.domain.toLowerCase())) {
    return true;
  }
  if (post.url && IMAGE_URL_PATTERN.test(post.url)) {
    return true;
  }
  return false;
}

export function isEligiblePost(
  post: RedditPostRaw,
  maxUpvotes?: number,
  minUpvotes?: number,
): boolean {
  if (!post.title?.trim()) {
    return false;
  }
  if (post.stickied) {
    return false;
  }
  if (isNsfw(post) || isDeletedOrRemoved(post) || isMediaHeavy(post)) {
    return false;
  }
  if (minUpvotes !== undefined && minUpvotes > 0) {
    if (!isAboveMinUpvoteLimit(post, minUpvotes)) {
      return false;
    }
  }
  if (
    maxUpvotes !== undefined &&
    hasMaxUpvoteCap(maxUpvotes) &&
    !isWithinUpvoteLimit(post, maxUpvotes)
  ) {
    return false;
  }
  return true;
}
