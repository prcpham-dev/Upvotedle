import { hashString, pickSeededSample } from './seededRandom';
/** Number of rounds in each daily puzzle. */
export const DAILY_ROUND_COUNT = 10;
/** Pool of subreddits; each daily picks {@link DAILY_ROUND_COUNT} without replacement. */
export const DAILY_SUBREDDITS = [
    'gaming',
    'AskReddit',
    'todayilearned',
    'technology',
    'movies',
    'science',
    'sports',
    'worldnews',
    'books',
    'showerthoughts',
    'mildlyinfuriating',
    'nottheonion',
    'funny',
    'aww',
    'history',
    'art',
    'music',
    'food',
    'travel',
    'mildlyinteresting',
    'pcmasterrace',
    'blursedimages',
    'terriblefacebookmemes',
    'me_irl',
    'cute',
    'wholesomememes',
    'interestingasfuck',
    'BeAmazed',
    'BrandNewSentence',
    'kitchencels',
    'CrappyDesign',
    'AskHistorians',
];
/** Full pool shuffled for the day; used to pick rounds with fallbacks. */
export function getDailySubredditOrder(dateKey) {
    const pool = [...DAILY_SUBREDDITS];
    const seed = hashString(`${dateKey}:daily-subreddits`);
    return pickSeededSample(pool, pool.length, seed);
}
/** First N subs in today's order (may not all be playable at current upvote limits). */
export function selectDailySubreddits(dateKey) {
    return getDailySubredditOrder(dateKey).slice(0, DAILY_ROUND_COUNT);
}
//# sourceMappingURL=dailySubreddits.js.map