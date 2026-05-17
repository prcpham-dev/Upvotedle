export type Post = {
  title: string;
  upvotes: number;
}

export type RoundData = {
  round: number;
  subreddit: string;
  postA: Post;
  postB: Post;
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
}