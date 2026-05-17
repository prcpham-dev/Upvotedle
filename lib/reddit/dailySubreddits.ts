import { hashString, pickSeededSample } from "./seededRandom";

/** Number of rounds in each daily puzzle. */
export const DAILY_ROUND_COUNT = 10;

/** Pool of subreddits; each daily picks {@link DAILY_ROUND_COUNT} without replacement. */
export const DAILY_SUBREDDITS = [
  "gaming",
  "AskReddit",
  "todayilearned",
  "technology",
  "movies",
  "science",
  "sports",
  "worldnews",
  "books",
  "showerthoughts",
  "mildlyinfuriating",
  "nottheonion",
  "funny",
  "aww",
  "history",
  "art",
  "music",
  "food",
  "travel",
  "mildlyinteresting",
  "pcmasterrace",
  "blursedimages",
  "terriblefacebookmemes",
  "me_irl",
  "cute",
  "wholesomememes",
  "interestingasfuck",
  "BeAmazed",
  "BrandNewSentence",
  "kitchencels",
  "CrappyDesign",
  "AskHistorians",
] as const;

/** Picks today's subreddits from the pool (unique, seeded by date). */
export function selectDailySubreddits(dateKey: string): string[] {
  const pool = [...DAILY_SUBREDDITS];
  const seed = hashString(`${dateKey}:daily-subreddits`);
  return pickSeededSample(pool, DAILY_ROUND_COUNT, seed);
}
