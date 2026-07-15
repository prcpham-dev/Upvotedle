import { Hono } from 'hono';
import { redis, reddit } from '@devvit/web/server';
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

  const countParam = c.req.query('count');
  const count = countParam ? Number.parseInt(countParam, 10) : 1;
  const parsedCount = Number.isFinite(count) && count > 0 ? count : 1;

  try {
    const payload = await fetchGameRound(subreddit, parseRoundOptions(c), parsedCount);
    return c.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build game round';
    return c.json<ErrorResponse>({ status: 'error', message }, 502);
  }
});

// POST /api/leaderboard/submit
api.post('/leaderboard/submit', async (c) => {
  try {
    const body = await c.req.json() as { score: number; time: number; isDaily?: boolean };
    const { score, time, isDaily } = body;
    if (typeof score !== 'number' || typeof time !== 'number') {
      return c.json({ status: 'error', message: 'Invalid payload' }, 400);
    }

    const user = await reddit.getCurrentUser();
    const username = user?.username ?? 'Anonymous';

    const dateKey = getDailyDateKey();
    const key = isDaily ? `leaderboard:daily:${dateKey}` : 'leaderboard:custom';

    let list: { username: string; points: number; time: number; timestamp: number }[] = [];
    try {
      const cached = await redis.get(key);
      if (cached) {
        list = JSON.parse(cached);
      }
    } catch {
      // Ignore
    }

    const existingIndex = list.findIndex((item) => item.username === username);
    if (existingIndex !== -1) {
      if (isDaily) {
        return c.json({ status: 'success', message: 'Daily score already submitted' });
      } else {
        const existing = list[existingIndex];
        if (existing) {
          const isNewScoreBetter = 
            score > existing.points || 
            (score === existing.points && time < existing.time);
          
          if (isNewScoreBetter) {
            list[existingIndex] = { username, points: score, time, timestamp: Date.now() };
          } else {
            return c.json({ status: 'success', message: 'Existing custom score is better' });
          }
        }
      }
    } else {
      list.push({ username, points: score, time, timestamp: Date.now() });
    }

    list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (a.time !== b.time) return a.time - b.time;
      return a.timestamp - b.timestamp;
    });

    const top10 = list.slice(0, 10);
    await redis.set(key, JSON.stringify(top10));

    return c.json({ status: 'success', leaderboard: top10 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit score';
    return c.json({ status: 'error', message }, 500);
  }
});

// GET /api/leaderboard
api.get('/leaderboard', async (c) => {
  try {
    const isDaily = c.req.query('isDaily') === 'true';
    const dateKey = getDailyDateKey();
    const key = isDaily ? `leaderboard:daily:${dateKey}` : 'leaderboard:custom';

    let list = [];
    try {
      const cached = await redis.get(key);
      if (cached) {
        list = JSON.parse(cached);
      }
    } catch {
      
    }

    return c.json(list);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get leaderboard';
    return c.json({ status: 'error', message }, 500);
  }
});
