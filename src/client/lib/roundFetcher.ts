import type { RoundData } from '../../shared/types/types';
import { getApiBase } from '../../shared/lib/api';

export const BATCH_SIZE = 5;

export interface FetchRoundBatchOptions {
  subreddits: string[];
  count: number;
  startRound: number;
  seed: number;
  usedPostIds?: Set<string>;
}

function buildExcludeParam(usedPostIds: Set<string>): string {
  return usedPostIds.size > 0
    ? `&excludePostIds=${encodeURIComponent([...usedPostIds].join(','))}`
    : '';
}

async function fetchOneRound(
  subreddit: string,
  roundNumber: number,
  roundSeed: number,
  excludeParam: string,
): Promise<RoundData | null> {
  const url =
    `${getApiBase()}/api/round` +
    `?subreddit=${encodeURIComponent(subreddit)}` +
    `&round=${roundNumber}` +
    `&seed=${roundSeed}` +
    excludeParam;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => null);
        const msg = data?.message ?? data?.error ?? `HTTP ${res.status}`;
        throw new Error(`Server Error (${res.status}): ${msg}`);
      }
      const text = await res.text().catch(() => '');
      throw new Error(`Server Error (${res.status}): ${text || 'Unknown error'}`);
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) return null;

    const data = await res.json().catch(() => null);
    if (!data || !Array.isArray(data) || !data[0]) return null;

    return { ...(data[0] as RoundData), round: roundNumber };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Server Error')) throw err;
    return null;
  }
}

export async function fetchRoundBatch({
  subreddits,
  count,
  startRound,
  seed,
  usedPostIds = new Set(),
}: FetchRoundBatchOptions): Promise<RoundData[]> {
  const excludeParam = buildExcludeParam(usedPostIds);
  const payload: RoundData[] = [];
  let candidateIndex = 0;

  while (payload.length < count && candidateIndex < subreddits.length * 3) {
    const roundNumber = startRound + payload.length;
    const sub = subreddits[candidateIndex % subreddits.length] as string;
    candidateIndex++;

    const round = await fetchOneRound(sub, roundNumber, seed + roundNumber, excludeParam);
    if (round) payload.push(round);
  }

  if (payload.length < count) {
    throw new Error(`Can't find 10 posts. Try a different subreddit.`);
  }

  return payload;
}
