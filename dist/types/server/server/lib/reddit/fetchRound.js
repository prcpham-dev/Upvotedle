import { DEFAULT_MAX_UPVOTES, DEFAULT_MIN_UPVOTES, hasMaxUpvoteCap, } from '../../../shared/lib/reddit/constants';
import { getPostUpvotes, isEligiblePost } from '../../../shared/lib/reddit/filters';
import { toRoundPost } from '../../../shared/lib/reddit/mapPost';
import { getPostId } from '../../../shared/lib/reddit/postId';
import { createSeededRandom } from '../../../shared/lib/reddit/seededRandom';
import { reddit } from '@devvit/web/server';
/** Listings merged when no single `sort` is requested. */
const POOLED_LISTING_SOURCES = [
    { sort: 'hot' },
    { sort: 'new' },
    { sort: 'rising' },
    { sort: 'top', topTime: 'day' },
    { sort: 'top', topTime: 'week' },
    { sort: 'top', topTime: 'month' },
];
function normalizeSubreddit(subreddit) {
    return subreddit.replace(/^\/?r\//i, '').trim();
}
function formatSubreddit(subreddit) {
    return `r/${normalizeSubreddit(subreddit)}`;
}
function formatUpvoteRange(minUpvotes, maxUpvotes) {
    if (minUpvotes > 0 && hasMaxUpvoteCap(maxUpvotes)) {
        return `with ${minUpvotes.toLocaleString()}–${maxUpvotes.toLocaleString()} upvotes`;
    }
    if (minUpvotes > 0) {
        return `with at least ${minUpvotes.toLocaleString()} upvotes`;
    }
    if (hasMaxUpvoteCap(maxUpvotes)) {
        return `with at most ${maxUpvotes.toLocaleString()} upvotes`;
    }
    return 'matching upvote filters';
}
/** Fisher–Yates partial shuffle; picks `count` distinct random items. */
function pickRandom(items, count, random = Math.random) {
    if (items.length < count) {
        throw new Error(`Not enough eligible posts (need ${count}, found ${items.length})`);
    }
    const pool = [...items];
    for (let i = 0; i < count; i++) {
        const j = i + Math.floor(random() * (pool.length - i));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
}
function dedupePosts(posts) {
    const seen = new Set();
    const unique = [];
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
async function fetchPooledPosts(subreddit, options) {
    const limit = Math.min(Math.max(options.limit ?? 100, 10), 100);
    const sources = options.sort
        ? [{ sort: options.sort, topTime: options.topTime }]
        : POOLED_LISTING_SOURCES;
    const results = await Promise.allSettled(sources.map(async (source) => {
        const normalizedSub = normalizeSubreddit(subreddit);
        let posts = [];
        const queryOptions = {
            subredditName: normalizedSub,
            limit,
        };
        if (source.sort === 'hot') {
            posts = await reddit.getHotPosts(queryOptions).all();
        }
        else if (source.sort === 'new') {
            posts = await reddit.getNewPosts(queryOptions).all();
        }
        else if (source.sort === 'rising') {
            posts = await reddit.getRisingPosts(queryOptions).all();
        }
        else if (source.sort === 'top') {
            posts = await reddit.getTopPosts({
                ...queryOptions,
                timeframe: source.topTime ?? 'week',
            }).all();
        }
        // Map the Devvit Post objects to RedditPostRaw format
        return posts.map((post) => {
            let domain = 'reddit.com';
            try {
                if (post.url) {
                    domain = new URL(post.url).hostname;
                }
            }
            catch {
                // ignore invalid URLs
            }
            const mapped = {
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
                preview: post.thumbnail ? {
                    images: [{
                            source: { url: post.thumbnail.url }
                        }]
                } : undefined
            };
            return mapped;
        });
    }));
    const posts = [];
    const errors = [];
    for (const result of results) {
        if (result.status === 'fulfilled') {
            posts.push(...result.value);
        }
        else {
            const message = result.reason instanceof Error
                ? result.reason.message
                : 'Listing fetch failed';
            errors.push(message);
        }
    }
    if (posts.length === 0) {
        throw new Error(errors.length > 0
            ? `Failed to fetch subreddit listings: ${errors.join('; ')}`
            : 'No posts returned from subreddit listings');
    }
    return dedupePosts(posts);
}
function filterEligiblePosts(posts, maxUpvotes, minUpvotes, excludeIds) {
    return posts.filter((post) => isEligiblePost(post, maxUpvotes, minUpvotes) &&
        !excludeIds.has(getPostId(post)));
}
function assertPostsWithinUpvoteRange(posts, minUpvotes, maxUpvotes) {
    for (const post of posts) {
        const upvotes = getPostUpvotes(post);
        if ((hasMaxUpvoteCap(maxUpvotes) && upvotes > maxUpvotes) ||
            (minUpvotes > 0 && upvotes < minUpvotes)) {
            throw new Error(`Selected post has ${upvotes} upvotes (allowed: ${formatUpvoteRange(minUpvotes, maxUpvotes)})`);
        }
    }
}
/**
 * Fetches the listing pool once and builds multiple rounds without re-fetching.
 */
export async function fetchMultipleGameRounds(subreddit, roundCount, options = {}) {
    if (roundCount < 1) {
        throw new Error('roundCount must be at least 1');
    }
    const maxUpvotes = options.maxUpvotes ?? DEFAULT_MAX_UPVOTES;
    const minUpvotes = options.minUpvotes ?? DEFAULT_MIN_UPVOTES;
    const excludeIds = new Set(options.excludePostIds ?? []);
    const posts = await fetchPooledPosts(subreddit, options);
    const eligible = filterEligiblePosts(posts, maxUpvotes, minUpvotes, excludeIds);
    const postsNeeded = roundCount * 2;
    if (eligible.length < postsNeeded) {
        const range = formatUpvoteRange(minUpvotes, maxUpvotes);
        throw new Error(`Not enough eligible posts ${range} (need ${postsNeeded}, found ${eligible.length})`);
    }
    const random = options.seed != null ? createSeededRandom(options.seed) : Math.random;
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
export async function fetchGameRound(subreddit, options = {}) {
    return fetchMultipleGameRounds(subreddit, 1, options);
}
//# sourceMappingURL=fetchRound.js.map