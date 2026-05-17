import {
  DEFAULT_MAX_UPVOTES,
  DEFAULT_MIN_UPVOTES,
  hasMaxUpvoteCap,
} from "./constants";
import { getPostUpvotes, isEligiblePost } from "./filters";
import { toRoundPost } from "./mapPost";
import type {
  FetchRoundOptions,
  GameRound,
  GameRoundPayload,
  RedditListingResponse,
  RedditPostRaw,
} from "./types";

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
function pickRandom<T>(items: T[], count: number): T[] {
  if (items.length < count) {
    throw new Error(
      `Not enough eligible posts (need ${count}, found ${items.length})`,
    );
  }
  const pool = [...items];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
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
  if (sort === "top" && options.topTime) {
    params.set("t", options.topTime);
  }
  return `${REDDIT_BASE}/r/${name}/${sort}.json?${params}`;
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

/**
 * Fetches posts from reddit.com/r/{subreddit}, filters unsuitable entries,
 * picks two at random, and returns game-engine JSON.
 */
export async function fetchGameRound(
  subreddit: string,
  options: FetchRoundOptions = {},
): Promise<GameRoundPayload> {
  const maxUpvotes = options.maxUpvotes ?? DEFAULT_MAX_UPVOTES;
  const minUpvotes = options.minUpvotes ?? DEFAULT_MIN_UPVOTES;
  const url = buildListingUrl(subreddit, options);
  const posts = await fetchListing(url);
  const eligible = posts.filter((post) =>
    isEligiblePost(post, maxUpvotes, minUpvotes),
  );

  if (eligible.length < 2) {
    const range = formatUpvoteRange(minUpvotes, maxUpvotes);
    throw new Error(
      `Not enough eligible posts ${range} (found ${eligible.length})`,
    );
  }

  const [postA, postB] = pickRandom(eligible, 2);

  for (const post of [postA, postB]) {
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

  const round: GameRound = {
    round: options.round ?? 1,
    subreddit: formatSubreddit(subreddit),
    postA: toRoundPost(postA),
    postB: toRoundPost(postB),
  };

  return [round];
}
