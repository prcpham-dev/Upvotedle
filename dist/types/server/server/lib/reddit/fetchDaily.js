import { DEFAULT_MAX_UPVOTES, DEFAULT_MIN_UPVOTES } from '../../../shared/lib/reddit/constants';
import { DAILY_ROUND_COUNT, getDailySubredditOrder, } from '../../../shared/lib/reddit/dailySubreddits';
import { fetchGameRound } from './fetchRound';
import { dailyRoundSeed, getDailyDateKey } from '../../../shared/lib/reddit/seededRandom';
/**
 * Builds today's puzzle: tries subreddits in date-seeded order until
 * {@link DAILY_ROUND_COUNT} rounds succeed (skips subs with too few eligible posts).
 */
export async function fetchDailyPuzzle(options = {}) {
    const maxUpvotes = options.maxUpvotes ?? DEFAULT_MAX_UPVOTES;
    const minUpvotes = options.minUpvotes ?? DEFAULT_MIN_UPVOTES;
    const dateKey = getDailyDateKey();
    const candidates = getDailySubredditOrder(dateKey);
    const payload = [];
    for (const subreddit of candidates) {
        if (payload.length >= DAILY_ROUND_COUNT) {
            break;
        }
        const round = payload.length + 1;
        try {
            const [gameRound] = await fetchGameRound(subreddit, {
                round,
                maxUpvotes,
                minUpvotes,
                seed: dailyRoundSeed(dateKey, subreddit, round),
            });
            if (gameRound)
                payload.push(gameRound);
        }
        catch (err) {
            // Try next subreddit in today's order.
        }
    }
    if (payload.length < DAILY_ROUND_COUNT) {
        throw new Error(`Could only build ${payload.length} of ${DAILY_ROUND_COUNT} daily rounds with current upvote limits. Try widening the range or lowering the minimum.`);
    }
    return payload.slice(0, DAILY_ROUND_COUNT).map((round, index) => ({
        ...round,
        round: index + 1,
    }));
}
//# sourceMappingURL=fetchDaily.js.map