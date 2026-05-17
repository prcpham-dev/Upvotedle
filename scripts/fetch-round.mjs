/**
 * CLI: node scripts/fetch-round.mjs gaming
 * Fetches a random pair of posts and prints game-engine JSON.
 */

const USER_AGENT = "redditdle:1.0.0 (by /u/redditdle-hackathon)";

const MEDIA_POST_HINTS = new Set([
  "image",
  "hosted:video",
  "rich:video",
  "gallery",
]);

const MEDIA_DOMAINS = new Set([
  "i.redd.it",
  "v.redd.it",
  "i.imgur.com",
  "imgur.com",
  "gfycat.com",
  "redgifs.com",
  "streamable.com",
]);

const IMAGE_URL_PATTERN = /\.(jpe?g|png|gif|webp|bmp)(\?.*)?$/i;

function normalizeSubreddit(subreddit) {
  return subreddit.replace(/^\/?r\//i, "").trim();
}

function formatSubreddit(subreddit) {
  return `r/${normalizeSubreddit(subreddit)}`;
}

function isDeletedOrRemoved(post) {
  const title = post.title?.trim() ?? "";
  if (
    title === "[removed]" ||
    title === "[deleted]" ||
    /^removed$/i.test(title)
  ) {
    return true;
  }
  if (post.author === "[deleted]" || post.author === "AutoModerator") {
    return true;
  }
  if (post.removed_by_category) return true;
  const body = post.selftext?.trim() ?? "";
  if (body === "[removed]" || body === "[deleted]") return true;
  return false;
}

function isMediaHeavy(post) {
  if (post.is_video || post.is_gallery) return true;
  if (post.gallery_data || post.media) return true;
  if (post.post_hint && MEDIA_POST_HINTS.has(post.post_hint)) return true;
  if (post.domain && MEDIA_DOMAINS.has(post.domain.toLowerCase())) return true;
  if (post.url && IMAGE_URL_PATTERN.test(post.url)) return true;
  return false;
}

function isEligiblePost(post) {
  if (!post.title?.trim()) return false;
  if (post.stickied) return false;
  if (post.over_18 || isDeletedOrRemoved(post) || isMediaHeavy(post)) {
    return false;
  }
  return true;
}

function pickRandom(items, count) {
  const pool = [...items];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

async function fetchGameRound(subreddit, round = 1) {
  const name = normalizeSubreddit(subreddit);
  const url = `https://www.reddit.com/r/${name}/hot.json?limit=100&raw_json=1`;
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Reddit request failed (${response.status})`);
  }
  const json = await response.json();
  const posts = json.data.children.map((c) => c.data);
  const eligible = posts.filter(isEligiblePost);
  if (eligible.length < 2) {
    throw new Error(`Not enough eligible posts (found ${eligible.length})`);
  }
  const [postA, postB] = pickRandom(eligible, 2);
  return [
    {
      round,
      subreddit: formatSubreddit(subreddit),
      postA: { title: postA.title.trim(), upvotes: postA.ups ?? postA.score ?? 0 },
      postB: { title: postB.title.trim(), upvotes: postB.ups ?? postB.score ?? 0 },
    },
  ];
}

const subreddit = process.argv[2];
if (!subreddit) {
  console.error("Usage: node scripts/fetch-round.mjs <subreddit>");
  process.exit(1);
}

fetchGameRound(subreddit)
  .then((payload) => console.log(JSON.stringify(payload, null, 2)))
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
