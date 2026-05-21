import { Hono } from 'hono';
import { redis } from '@devvit/web/server';
import { fetchDailyPuzzle } from '../reddit/fetchDaily';
import { getDailyDateKey } from '../../shared/lib/reddit/seededRandom';
export const scheduler = new Hono();
/**
 * Returns the YYYY-MM-DD date key for N days ago (UTC).
 */
function getDateKeyOffset(daysAgo) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - daysAgo);
    return getDailyDateKey(d);
}
/**
 * POST /internal/scheduler/daily-crawl
 * Triggered every day at 12:00 AM UTC by the cron in devvit.json.
 *
 * - Crawls the full 10-round daily puzzle for today and saves it to Redis.
 * - Keeps only today and yesterday in Redis; deletes any older daily keys.
 */
scheduler.post('/daily-crawl', async (c) => {
    const todayKey = `daily:${getDateKeyOffset(0)}`;
    // Keys to delete: the 7 days before yesterday (belt-and-suspenders cleanup)
    const keysToDelete = Array.from({ length: 7 }, (_, i) => `daily:${getDateKeyOffset(i + 2)}`);
    try {
        // Crawl today's puzzle
        const payload = await fetchDailyPuzzle();
        await redis.set(todayKey, JSON.stringify(payload));
        console.log(`[scheduler/daily-crawl] Cached puzzle for ${todayKey}`);
        // Delete any daily keys older than yesterday
        await Promise.allSettled(keysToDelete.map((key) => redis.del(key)));
        console.log(`[scheduler/daily-crawl] Pruned old keys (kept: today, yesterday)`);
        return c.json({}, 200);
    }
    catch (error) {
        console.error('[scheduler/daily-crawl] Failed:', error);
        return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
});
//# sourceMappingURL=scheduler.js.map