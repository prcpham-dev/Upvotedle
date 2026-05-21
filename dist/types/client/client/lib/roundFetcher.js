import { getApiBase } from '../../shared/lib/api';
export const BATCH_SIZE = 5;
function buildExcludeParam(usedPostIds) {
    return usedPostIds.size > 0
        ? `&excludePostIds=${encodeURIComponent([...usedPostIds].join(','))}`
        : '';
}
async function fetchOneRound(subreddit, roundNumber, roundSeed, excludeParam) {
    const url = `${getApiBase()}/api/round` +
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
        if (!contentType.includes('application/json'))
            return null;
        const data = await res.json().catch(() => null);
        if (!data || !Array.isArray(data) || !data[0])
            return null;
        return { ...data[0], round: roundNumber };
    }
    catch (err) {
        if (err instanceof Error && err.message.startsWith('Server Error'))
            throw err;
        return null;
    }
}
export async function fetchRoundBatch({ subreddits, count, startRound, seed, usedPostIds = new Set(), }) {
    const excludeParam = buildExcludeParam(usedPostIds);
    // Optimization: if there's only 1 subreddit (custom game), fetch all rounds in a single call
    if (subreddits.length === 1 && subreddits[0]) {
        const sub = subreddits[0];
        const url = `${getApiBase()}/api/round` +
            `?subreddit=${encodeURIComponent(sub)}` +
            `&count=${count}` +
            `&round=${startRound}` +
            `&seed=${seed}` +
            excludeParam;
        const res = await fetch(url);
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            const msg = data?.message ?? `HTTP ${res.status}`;
            throw new Error(`Server Error (${res.status}): ${msg}`);
        }
        const data = await res.json().catch(() => null);
        if (data && Array.isArray(data) && data.length > 0) {
            return data;
        }
        throw new Error(`Can't find 10 posts. Try a different subreddit.`);
    }
    const payload = [];
    let candidateIndex = 0;
    while (payload.length < count && candidateIndex < subreddits.length * 3) {
        const roundNumber = startRound + payload.length;
        const sub = subreddits[candidateIndex % subreddits.length];
        candidateIndex++;
        const round = await fetchOneRound(sub, roundNumber, seed + roundNumber, excludeParam);
        if (round)
            payload.push(round);
    }
    if (payload.length < count) {
        throw new Error(`Can't find 10 posts. Try a different subreddit.`);
    }
    return payload;
}
//# sourceMappingURL=roundFetcher.js.map