import { getPostUpvotes, isNsfw, isDeletedOrRemoved } from '../../shared/lib/reddit/filters';
import { toRoundPost } from '../../shared/lib/reddit/mapPost';
import { getPostId } from '../../shared/lib/reddit/postId';
import { createSeededRandom } from '../../shared/lib/reddit/seededRandom';
import type {
  FetchRoundOptions,
  GameRoundPayload,
  ListingSource,
  RedditPostRaw,
} from '../../shared/lib/reddit/types';
import { reddit } from '@devvit/web/server';

// Max is always uncapped. Min falls back through these tiers if posts are scarce.
const MIN_UPVOTE_TIERS = [1000, 500, 0] as const;

const POOLED_LISTING_SOURCES: ListingSource[] = [
  { sort: 'hot' },
  { sort: 'new' },
  { sort: 'rising' },
  { sort: 'top', topTime: 'day' },
  { sort: 'top', topTime: 'week' },
  { sort: 'top', topTime: 'month' },
];

function normalizeSubreddit(subreddit: string): string {
  return subreddit.replace(/^\/?r\//i, '').trim();
}

function formatSubreddit(subreddit: string): string {
  return `r/${normalizeSubreddit(subreddit)}`;
}

function pickRandom<T>(items: T[], count: number, random: () => number = Math.random): T[] {
  if (items.length < count) {
    throw new Error(`Not enough eligible posts (need ${count}, found ${items.length})`);
  }
  const pool = [...items];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j] as T, pool[i] as T];
  }
  return pool.slice(0, count);
}

function dedupePosts(posts: RedditPostRaw[]): RedditPostRaw[] {
  const seen = new Set<string>();
  const unique: RedditPostRaw[] = [];
  for (const post of posts) {
    const key = getPostId(post);
    if (seen.has(key)) continue;
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
    sources.map(async (source) => {
      const normalizedSub = normalizeSubreddit(subreddit);
      let posts: any[] = [];
      const queryOptions = { subredditName: normalizedSub, limit };

      if (source.sort === 'hot') {
        posts = await reddit.getHotPosts(queryOptions).all();
      } else if (source.sort === 'new') {
        posts = await reddit.getNewPosts(queryOptions).all();
      } else if (source.sort === 'rising') {
        posts = await reddit.getRisingPosts(queryOptions).all();
      } else if (source.sort === 'top') {
        posts = await reddit.getTopPosts({
          ...queryOptions,
          timeframe: source.topTime ?? 'week',
        }).all();
      }

      return posts.map((post): RedditPostRaw => {
        let domain = 'reddit.com';
        try {
          if (post.url) domain = new URL(post.url).hostname;
        } catch {
          // ignore invalid URLs
        }
        return {
          id: post.id,
          title: post.title,
          ups: post.score,
          score: post.score,
          author: post.authorName,
          permalink: post.permalink,
          created_utc: post.createdAt ? Math.floor(post.createdAt.getTime() / 1000) : 0,
          over_18: !!post.nsfw,
          stickied: !!post.stickied,
          is_video: !!post.secureMedia?.redditVideo || post.url?.includes('v.redd.it'),
          is_self: !post.url || post.url === post.permalink || post.url.includes(post.permalink),
          is_gallery: post.gallery && post.gallery.length > 0,
          url: post.url,
          url_overridden_by_dest: post.url,
          domain,
          selftext: post.body ?? '',
          preview: post.thumbnail
            ? { images: [{ source: { url: post.thumbnail.url } }] }
            : undefined,
        };
      });
    }),
  );

  const posts: RedditPostRaw[] = [];
  const errors: string[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      posts.push(...result.value);
    } else {
      errors.push(result.reason instanceof Error ? result.reason.message : 'Listing fetch failed');
    }
  }

  console.log(`[fetchPooledPosts] Subreddit: r/${subreddit}. Raw posts fetched: ${posts.length}. Failures: ${errors.length ? errors.join(', ') : 'none'}`);

  if (posts.length === 0) {
    throw new Error(
      errors.length > 0
        ? `Failed to fetch subreddit listings: ${errors.join('; ')}`
        : 'No posts returned from subreddit listings',
    );
  }

  const deduped = dedupePosts(posts);
  console.log(`[fetchPooledPosts] Deduplicated posts count: ${deduped.length}`);
  return deduped;
}

// Only exclude posts that are truly unplayable: NSFW, deleted, or stickied.
// Image posts, gallery posts, and video posts are all valid for an upvote guessing game.
function filterEligiblePosts(
  posts: RedditPostRaw[],
  minUpvotes: number,
  excludeIds: Set<string>,
): RedditPostRaw[] {
  return posts.filter((post) => {
    if (!post.title?.trim()) return false;
    if (post.stickied) return false;
    if (isNsfw(post) || isDeletedOrRemoved(post)) return false;
    if (minUpvotes > 0 && getPostUpvotes(post) < minUpvotes) return false;
    return !excludeIds.has(getPostId(post));
  });
}


/**
 * Fetches game rounds for the given subreddit.
 *
 * Min upvote fallback tiers: 1000 → 500 → 0
 * Max upvotes is always 1,000,000 (no cap).
 * Tries each tier in order until enough eligible posts are found to build the requested rounds.
 */
export async function fetchGameRound(
  subreddit: string,
  options: FetchRoundOptions = {},
  count = 1,
): Promise<GameRoundPayload> {
  const excludeIds = new Set(options.excludePostIds ?? []);
  const roundNumber = options.round ?? 1;
  const random = options.seed != null ? createSeededRandom(options.seed) : Math.random;

  console.log(`[fetchGameRound] Subreddit: r/${subreddit}, count requested: ${count}, posts needed: ${count * 2}`);

  // Fetch the post pool once — reuse across min upvote tiers
  const posts = await fetchPooledPosts(subreddit, options);
  const postsNeeded = count * 2;

  for (const minUpvotes of MIN_UPVOTE_TIERS) {
    const eligible = filterEligiblePosts(posts, minUpvotes, excludeIds);
    console.log(`[fetchGameRound] Tier minUpvotes=${minUpvotes}: found ${eligible.length} eligible posts (need ${postsNeeded})`);
    
    if (eligible.length >= postsNeeded) {
      const picked = pickRandom(eligible, postsNeeded, random);
      const formattedSub = formatSubreddit(subreddit);
      
      console.log(`[fetchGameRound] Successfully built ${count} rounds using tier minUpvotes=${minUpvotes}`);
      return Array.from({ length: count }, (_, index) => {
        const postA = picked[index * 2] as RedditPostRaw;
        const postB = picked[index * 2 + 1] as RedditPostRaw;
        return {
          round: roundNumber + index,
          subreddit: formattedSub,
          postA: toRoundPost(postA),
          postB: toRoundPost(postB),
        };
      });
    }
  }

  throw new Error(`Can't find enough posts in r/${normalizeSubreddit(subreddit)}.`);
}
