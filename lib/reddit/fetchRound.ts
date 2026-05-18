import {
  DEFAULT_MAX_UPVOTES,
  DEFAULT_MIN_UPVOTES,
  hasMaxUpvoteCap,
} from "./constants";
import { getPostUpvotes, isEligiblePost } from "./filters";
import { toRoundPost } from "./mapPost";
import { getPostId } from "./postId";
import { createSeededRandom } from "./seededRandom";
import type {
  FetchRoundOptions,
  GameRoundPayload,
  ListingSource,
  RedditListingResponse,
  RedditPostRaw,
} from "./types";

/** Listings merged when no single `sort` is requested. */
const POOLED_LISTING_SOURCES: ListingSource[] = [
  { sort: "hot" },
  { sort: "new" },
  { sort: "rising" },
  { sort: "top", topTime: "day" },
  { sort: "top", topTime: "week" },
  { sort: "top", topTime: "month" },
];

const USER_AGENT = "redditdle:1.0.0 (by /u/redditdle-hackathon)";
const REDDIT_BASE = "https://www.reddit.com";

function normalizeSubreddit(subreddit: string): string {
  return subreddit.replace(/^\/?r\//i, "").trim();
}

function formatSubreddit(subreddit: string): string {
  return `r/${normalizeSubreddit(subreddit)}`;
}

function formatUpvoteRange(minUpvotes: number, maxUpvotes: number): string {
  if (minUpvotes > 0 && hasMaxUpvoteCap(maxUpvotes)) {
    return `with ${minUpvotes.toLocaleString()}–${maxUpvotes.toLocaleString()} upvotes`;
  }
  if (minUpvotes > 0) {
    return `with at least ${minUpvotes.toLocaleString()} upvotes`;
  }
  if (hasMaxUpvoteCap(maxUpvotes)) {
    return `with at most ${maxUpvotes.toLocaleString()} upvotes`;
  }
  return "matching upvote filters";
}

/** Fisher–Yates partial shuffle; picks `count` distinct random items. */
function pickRandom<T>(
  items: T[],
  count: number,
  random: () => number = Math.random,
): T[] {
  if (items.length < count) {
    throw new Error(
      `Not enough eligible posts (need ${count}, found ${items.length})`,
    );
  }
  const pool = [...items];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function buildListingUrl(
  subreddit: string,
  options: FetchRoundOptions,
): string {
  const name = normalizeSubreddit(subreddit);
  const sort = options.sort ?? "hot";
  const limit = Math.min(Math.max(options.limit ?? 100, 10), 100);
  const params = new URLSearchParams({
    limit: String(limit),
    raw_json: "1",
  });
  if (sort === "top") {
    params.set("t", options.topTime ?? "week");
  }
  return `${REDDIT_BASE}/r/${name}/${sort}.json?${params}`;
}

function dedupePosts(posts: RedditPostRaw[]): RedditPostRaw[] {
  const seen = new Set<string>();
  const unique: RedditPostRaw[] = [];
  for (const post of posts) {
    const key = getPostId(post);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(post);
  }
  return unique;
}

async function fetchPooledPosts(
  subreddit: string,
  options: FetchRoundOptions,
): Promise<RedditPostRaw[]> {
  const limit = Math.min(Math.max(options.limit ?? 100, 10), 100);
  const sources: ListingSource[] = options.sort
    ? [{ sort: options.sort, topTime: options.topTime }]
    : POOLED_LISTING_SOURCES;

  const results = await Promise.allSettled(
    sources.map((source) =>
      fetchListing(
        buildListingUrl(subreddit, { ...options, ...source, limit }),
      ),
    ),
  );

  const posts: RedditPostRaw[] = [];
  const errors: string[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      posts.push(...result.value);
    } else {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : "Listing fetch failed";
      errors.push(message);
    }
  }

  if (posts.length === 0) {
    throw new Error(
      errors.length > 0
        ? `Failed to fetch subreddit listings: ${errors.join("; ")}`
        : "No posts returned from subreddit listings",
    );
  }

  return dedupePosts(posts);
}

async function fetchListing(url: string): Promise<RedditPostRaw[]> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(
      `Reddit request failed (${response.status}): ${response.statusText}`,
    );
  }

  const json = (await response.json()) as RedditListingResponse;
  return json.data.children.map((child) => child.data);
}

function filterEligiblePosts(
  posts: RedditPostRaw[],
  maxUpvotes: number,
  minUpvotes: number,
  excludeIds: Set<string>,
): RedditPostRaw[] {
  return posts.filter(
    (post) =>
      isEligiblePost(post, maxUpvotes, minUpvotes) &&
      !excludeIds.has(getPostId(post)),
  );
}

function assertPostsWithinUpvoteRange(
  posts: RedditPostRaw[],
  minUpvotes: number,
  maxUpvotes: number,
): void {
  for (const post of posts) {
    const upvotes = getPostUpvotes(post);
    if (
      (hasMaxUpvoteCap(maxUpvotes) && upvotes > maxUpvotes) ||
      (minUpvotes > 0 && upvotes < minUpvotes)
    ) {
      throw new Error(
        `Selected post has ${upvotes} upvotes (allowed: ${formatUpvoteRange(minUpvotes, maxUpvotes)})`,
      );
    }
  }
}

/**
 * Fetches the listing pool once and builds multiple rounds without re-fetching.
 */
export async function fetchMultipleGameRounds(
  subreddit: string,
  roundCount: number,
  options: FetchRoundOptions = {},
): Promise<GameRoundPayload> {
  if (roundCount < 1) {
    throw new Error("roundCount must be at least 1");
  }

  const maxUpvotes = options.maxUpvotes ?? DEFAULT_MAX_UPVOTES;
  const minUpvotes = options.minUpvotes ?? DEFAULT_MIN_UPVOTES;
  const excludeIds = new Set(options.excludePostIds ?? []);
  const posts = await fetchPooledPosts(subreddit, options);
  const eligible = filterEligiblePosts(
    posts,
    maxUpvotes,
    minUpvotes,
    excludeIds,
  );

  const postsNeeded = roundCount * 2;
  if (eligible.length < postsNeeded) {
    const range = formatUpvoteRange(minUpvotes, maxUpvotes);
    throw new Error(
      `Not enough eligible posts ${range} (need ${postsNeeded}, found ${eligible.length})`,
    );
  }

  const random =
    options.seed != null ? createSeededRandom(options.seed) : Math.random;
  const picked = pickRandom(eligible, postsNeeded, random);
  assertPostsWithinUpvoteRange(picked, minUpvotes, maxUpvotes);

  const startRound = options.round ?? 1;
  const formattedSub = formatSubreddit(subreddit);

  return Array.from({ length: roundCount }, (_, index) => {
    const postA = picked[index * 2];
    const postB = picked[index * 2 + 1];
    return {
      round: startRound + index,
      subreddit: formattedSub,
      postA: toRoundPost(postA),
      postB: toRoundPost(postB),
    };
  });
}

/**
 * Fetches posts from reddit.com/r/{subreddit}, filters unsuitable entries,
 * picks two at random, and returns game-engine JSON.
 */
export async function fetchGameRound(
  subreddit: string,
  options: FetchRoundOptions = {},
): Promise<GameRoundPayload> {
  return fetchMultipleGameRounds(subreddit, 1, options);
}
