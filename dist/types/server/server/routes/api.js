import { Hono } from 'hono';
import { context, redis } from '@devvit/web/server';
import { parseMaxUpvotes, parseMinUpvotes, parseExcludePostIds } from '../../shared/lib/reddit/parseMaxUpvotes';
import { fetchDailyPuzzle } from '../lib/reddit/fetchDaily';
import { fetchGameRound, fetchMultipleGameRounds } from '../lib/reddit/fetchRound';
export const api = new Hono();
/**
 * GET /api/daily
 * Returns a full 10-round daily puzzle built from the date-seeded subreddit order.
 * Query params: minUpvotes, maxUpvotes
 */
api.get('/daily', async (c) => {
    const maxUpvotes = parseMaxUpvotes(c.req.query('maxUpvotes'));
    const minUpvotes = parseMinUpvotes(c.req.query('minUpvotes'));
    // Cache today's puzzle in Redis to avoid rate limits on repeated loads
    const todayKey = `daily:${new Date().toISOString().slice(0, 10)}`;
    try {
        const cached = await redis.get(todayKey);
        if (cached) {
            return c.json(JSON.parse(cached));
        }
    }
    catch {
        // Continue without cache if Redis fails
    }
    try {
        const payload = await fetchDailyPuzzle({ maxUpvotes, minUpvotes });
        // Cache for the day (no TTL needed - daily key changes each day)
        try {
            await redis.set(todayKey, JSON.stringify(payload));
        }
        catch {
            // Caching failed — still serve the response
        }
        return c.json(payload);
    }
    catch (error) {
        console.error('Error in /api/daily:', error);
        const message = error instanceof Error ? error.message : 'Failed to load daily puzzle';
        return c.json({ status: 'error', message }, 502);
    }
});
/**
 * GET /api/round
 * Returns one or more game rounds for a given subreddit.
 * Query params: subreddit (required), round, count, sort, minUpvotes, maxUpvotes, excludePostIds, seed
 */
api.get('/round', async (c) => {
    const subreddit = c.req.query('subreddit');
    if (!subreddit?.trim()) {
        return c.json({ status: 'error', message: 'Query parameter `subreddit` is required' }, 400);
    }
    const roundParam = c.req.query('round');
    const round = roundParam ? Number.parseInt(roundParam, 10) : 1;
    const countParam = c.req.query('count');
    const count = countParam ? Number.parseInt(countParam, 10) : 1;
    const sort = c.req.query('sort');
    const maxUpvotes = parseMaxUpvotes(c.req.query('maxUpvotes'));
    const minUpvotes = parseMinUpvotes(c.req.query('minUpvotes'));
    const excludePostIds = parseExcludePostIds(c.req.query('excludePostIds'));
    const seedParam = c.req.query('seed');
    const parsedSeed = seedParam ? Number.parseInt(seedParam, 10) : NaN;
    const seed = Number.isFinite(parsedSeed) ? parsedSeed : undefined;
    const roundOptions = {
        round: Number.isFinite(round) ? round : 1,
        maxUpvotes,
        minUpvotes,
        excludePostIds,
        ...(seed !== undefined ? { seed } : {}),
        ...(sort ? { sort } : {}),
    };
    try {
        const payload = Number.isFinite(count) && count > 1
            ? await fetchMultipleGameRounds(subreddit, count, roundOptions)
            : await fetchGameRound(subreddit, roundOptions);
        return c.json(payload);
    }
    catch (error) {
        console.error('Error in /api/round:', error);
        const message = error instanceof Error ? error.message : 'Failed to build game round';
        return c.json({ status: 'error', message }, 502);
    }
});
/**
 * Legacy /api/init kept for compatibility with any existing Devvit post tracking.
 * Returns the current user's username and post context.
 */
api.get('/init', async (c) => {
    const { postId } = context;
    if (!postId) {
        return c.json({ status: 'error', message: 'postId missing from context' }, 400);
    }
    try {
        const [count] = await Promise.all([redis.get('count')]);
        return c.json({
            type: 'init',
            postId,
            count: count ? parseInt(count) : 0,
        });
    }
    catch (error) {
        return c.json({ status: 'error', message: error instanceof Error ? error.message : 'Init failed' }, 400);
    }
});
//# sourceMappingURL=api.js.map