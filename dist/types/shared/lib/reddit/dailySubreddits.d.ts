/** Number of rounds in each daily puzzle. */
export declare const DAILY_ROUND_COUNT = 10;
/** Pool of subreddits; each daily picks {@link DAILY_ROUND_COUNT} without replacement. */
export declare const DAILY_SUBREDDITS: readonly ["gaming", "AskReddit", "todayilearned", "technology", "movies", "science", "sports", "worldnews", "books", "showerthoughts", "mildlyinfuriating", "nottheonion", "funny", "aww", "history", "art", "music", "food", "travel", "mildlyinteresting", "pcmasterrace", "blursedimages", "terriblefacebookmemes", "me_irl", "cute", "wholesomememes", "interestingasfuck", "BeAmazed", "BrandNewSentence", "kitchencels", "CrappyDesign", "AskHistorians"];
/** Full pool shuffled for the day; used to pick rounds with fallbacks. */
export declare function getDailySubredditOrder(dateKey: string): string[];
/** First N subs in today's order (may not all be playable at current upvote limits). */
export declare function selectDailySubreddits(dateKey: string): string[];
