export type Post = {
  id: string;
  title: string;
  upvotes: number;
  /** Direct image URL when the post is a single image. */
  image?: string;
  /** Reddit username of the post author. */
  author: string;
  /** Reddit permalink path e.g. /r/sub/comments/abc/title/ */
  permalink: string;
  /** Unix timestamp (seconds) when the post was created. */
  createdAt: number;
}

export type RoundData = {
  round: number;
  subreddit: string;
  postA: Post;
  postB: Post;
}

export interface CustomConfig {
  subreddit: string;
  seed: string;
  isEndless: boolean;
}

export interface GameBoardProps {
  rounds: RoundData[];
  onPlayAgain: () => void;
  isEndless?: boolean;
  subreddits?: string[];
  upvoteLimits?: {
    minUpvotes: number;
    maxUpvotes: number;
  };
  seed?: number | null;
}