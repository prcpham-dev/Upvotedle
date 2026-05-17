export type Post = {
  title: string;
  upvotes: number;
  /** Direct image URL when the post is a single image. */
  image?: string;
}

export type RoundData = {
  round: number;
  subreddit: string;
  postA: Post;
  postB: Post;
}
