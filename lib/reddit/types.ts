export type RoundPost = {
  title: string;
  upvotes: number;
};

export type GameRound = {
  round: number;
  subreddit: string;
  postA: RoundPost;
  postB: RoundPost;
};

/** Payload returned to the game engine (one or more rounds). */
export type GameRoundPayload = GameRound[];

export type RedditListingResponse = {
  data: {
    children: Array<{
      data: RedditPostRaw;
    }>;
  };
};

export type RedditPostRaw = {
  title: string;
  ups: number;
  score: number;
  author: string;
  over_18: boolean;
  stickied: boolean;
  is_video: boolean;
  is_gallery?: boolean;
  post_hint?: string;
  url?: string;
  domain?: string;
  selftext?: string;
  removed_by_category?: string | null;
  media?: unknown;
  gallery_data?: unknown;
};

export type FetchRoundOptions = {
  /** Listing sort (default: hot). */
  sort?: "hot" | "new" | "top" | "rising";
  /** Time filter when sort is `top` (default: week). */
  topTime?: "hour" | "day" | "week" | "month" | "year" | "all";
  /** How many posts to pull before filtering (default: 100, max 100). */
  limit?: number;
  round?: number;
};
