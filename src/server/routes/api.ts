import { Hono } from 'hono';
import { redis } from '@devvit/web/server';
import { parseExcludePostIds } from '../../shared/lib/reddit/parseMaxUpvotes';
import { fetchDailyPuzzle } from '../reddit/fetchDaily';
import { fetchGameRound } from '../reddit/fetchRound';
import { getDailyDateKey } from '../../shared/lib/reddit/seededRandom';
import type { FetchRoundOptions } from '../../shared/lib/reddit/types';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

function parseRoundOptions(c: { req: { query: (key: string) => string | undefined } }): FetchRoundOptions {
  const roundParam = c.req.query('round');
  const round = roundParam ? Number.parseInt(roundParam, 10) : 1;

  const seedParam = c.req.query('seed');
  const parsedSeed = seedParam ? Number.parseInt(seedParam, 10) : NaN;
  const seed = Number.isFinite(parsedSeed) ? parsedSeed : undefined;

  const sort = c.req.query('sort') as 'hot' | 'new' | 'top' | 'rising' | undefined;

  return {
    round: Number.isFinite(round) ? round : 1,
    excludePostIds: parseExcludePostIds(c.req.query('excludePostIds')),
    ...(seed !== undefined ? { seed } : {}),
    ...(sort ? { sort } : {}),
  };
}

// GET /api/daily — serves the pre-crawled daily puzzle from Redis, or crawls live.
api.get('/daily', async (c) => {
  const cacheKey = `daily:${getDailyDateKey()}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return c.json(parsed);
    }
  } catch {
    // Fall through to live crawl
  }

  try {
    const payload = await fetchDailyPuzzle();
    try { await redis.set(cacheKey, JSON.stringify(payload)); } catch { /* ok */ }
    return c.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load daily puzzle';
    return c.json<ErrorResponse>({ status: 'error', message }, 502);
  }
});

// GET /api/round — returns one game round for custom/endless mode.
// Query params: subreddit (required), round, sort, excludePostIds, seed
api.get('/round', async (c) => {
  const subreddit = c.req.query('subreddit');
  if (!subreddit?.trim()) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Query parameter `subreddit` is required' },
      400
    );
  }

  try {
    const payload = await fetchGameRound(subreddit, parseRoundOptions(c));
    return c.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build game round';
    return c.json<ErrorResponse>({ status: 'error', message }, 502);
  }
});
