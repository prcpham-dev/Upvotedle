import { RoundData } from "@/types/types";
import { getApiBase } from "@/lib/api";

export const BATCH_SIZE = 5;

export interface FetchRoundBatchOptions {
  subreddits: string[];
  count: number;
  startRound: number;
  limitsQuery: string;
  seed: number;
  usedPostIds?: Set<string>;
}
export async function fetchRoundBatch({
  subreddits,
  count,
  startRound,
  limitsQuery,
  seed,
  usedPostIds = new Set(),
}: FetchRoundBatchOptions): Promise<RoundData[]> {
  const excludeParam =
    usedPostIds.size > 0
      ? `&excludePostIds=${encodeURIComponent([...usedPostIds].join(","))}`
      : "";

  if (subreddits.length === 1) {
    const sub = subreddits[0];
    const roundSeed = seed + startRound;
    const url = `${getApiBase()}/api/round?subreddit=${encodeURIComponent(sub)}&count=${count}&round=${startRound}&${limitsQuery}&seed=${roundSeed}${excludeParam}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(
        typeof data.error === "string"
          ? data.error
          : `Failed to fetch rounds for r/${sub}.`
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No rounds returned for r/${sub}.`);
    }

    return data.slice(0, count).map((r, i) => ({
      ...r,
      round: startRound + i,
    })) as RoundData[];
  }

  const payload: RoundData[] = [];
  let candidateIndex = 0;

  while (payload.length < count && candidateIndex < subreddits.length) {
    const roundNumber = startRound + payload.length;
    const sub = subreddits[(candidateIndex) % subreddits.length];
    candidateIndex++;

    const roundSeed = seed + roundNumber;
    const url = `${getApiBase()}/api/round?subreddit=${encodeURIComponent(sub)}&round=${roundNumber}&${limitsQuery}&seed=${roundSeed}${excludeParam}`;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      if (data.error || !Array.isArray(data) || !data[0]) continue;

      payload.push({ ...(data[0] as RoundData), round: roundNumber });
    } catch {
      // Try next candidate subreddit
    }
  }

  if (payload.length < count) {
    throw new Error(
      `Could only build ${payload.length} of ${count} rounds. Try lowering upvote filters.`
    );
  }

  return payload;
}
