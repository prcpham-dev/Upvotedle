/** Stable id for deduping and exclusion (Reddit id or title+author fallback). */
export function getPostId(post) {
    if (post.id) {
        return post.id;
    }
    return `${post.title}\0${post.author}`;
}
export function collectPostIdsFromRound(round) {
    return [round.postA.id, round.postB.id];
}
export function collectPostIdsFromRounds(rounds) {
    return rounds.flatMap(collectPostIdsFromRound);
}
//# sourceMappingURL=postId.js.map