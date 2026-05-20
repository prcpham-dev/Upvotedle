import { getApiBase } from '../../shared/lib/api';
export const BATCH_SIZE = 5;
export async function fetchRoundBatch({ subreddits, count, startRound, limitsQuery, seed, usedPostIds = new Set(), }) {
    const excludeParam = usedPostIds.size > 0
        ? `&excludePostIds=${encodeURIComponent([...usedPostIds].join(','))}`
        : '';
    if (subreddits.length === 1) {
        const sub = subreddits[0];
        const roundSeed = seed + startRound;
        const url = `${getApiBase()}/api/round?subreddit=${encodeURIComponent(sub)}&count=${count}&round=${startRound}&${limitsQuery}&seed=${roundSeed}${excludeParam}`;
        const res = await fetch(url);
        let data = null;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try {
                data = await res.json();
            }
            catch {
                // ignore and fallback to text
            }
        }
        if (!res.ok) {
            let errMsg = `Failed to fetch rounds for r/${sub}.`;
            if (data && (data.message || data.error)) {
                errMsg = data.message || data.error;
            }
            else {
                const text = await res.text().catch(() => '');
                if (text) {
                    errMsg = text;
                }
            }
            throw new Error(`Server Error (${res.status}): ${errMsg}`);
        }
        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error(`No rounds returned for r/${sub}.`);
        }
        return data.slice(0, count).map((r, i) => ({
            ...r,
            round: startRound + i,
        }));
    }
    const payload = [];
    let candidateIndex = 0;
    while (payload.length < count && candidateIndex < subreddits.length) {
        const roundNumber = startRound + payload.length;
        const sub = subreddits[candidateIndex % subreddits.length];
        candidateIndex++;
        const roundSeed = seed + roundNumber;
        const url = `${getApiBase()}/api/round?subreddit=${encodeURIComponent(sub)}&round=${roundNumber}&${limitsQuery}&seed=${roundSeed}${excludeParam}`;
        try {
            const res = await fetch(url);
            if (!res.ok)
                continue;
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json'))
                continue;
            const data = await res.json().catch(() => null);
            if (!data || data.error || data.message || !Array.isArray(data) || !data[0])
                continue;
            payload.push({ ...data[0], round: roundNumber });
        }
        catch {
            // Try next candidate subreddit
        }
    }
    if (payload.length < count) {
        throw new Error(`Could only build ${payload.length} of ${count} rounds. Try lowering upvote filters.`);
    }
    return payload;
}
//# sourceMappingURL=roundFetcher.js.map