import { DEFAULT_MAX_UPVOTES, DEFAULT_MIN_UPVOTES, MAX_UPVOTES_LIMIT, } from './constants';
function clampUpvoteLimit(value, fallback) {
    if (!Number.isFinite(value)) {
        return fallback;
    }
    return Math.min(Math.max(Math.floor(value), 0), MAX_UPVOTES_LIMIT);
}
export function clampMaxUpvotes(value) {
    if (!Number.isFinite(value)) {
        return DEFAULT_MAX_UPVOTES;
    }
    return Math.min(Math.max(Math.floor(value), 1), MAX_UPVOTES_LIMIT);
}
export function clampMinUpvotes(value) {
    return clampUpvoteLimit(value, DEFAULT_MIN_UPVOTES);
}
/**
 * Parses `maxUpvotes` from a query string. Returns default when missing or invalid.
 */
export function parseMaxUpvotes(raw) {
    if (raw == null || raw.trim() === '') {
        return DEFAULT_MAX_UPVOTES;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return DEFAULT_MAX_UPVOTES;
    }
    return clampMaxUpvotes(parsed);
}
/**
 * Parses `minUpvotes` from a query string. Returns default when missing or invalid.
 */
export function parseMinUpvotes(raw) {
    if (raw == null || raw.trim() === '') {
        return DEFAULT_MIN_UPVOTES;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return DEFAULT_MIN_UPVOTES;
    }
    return clampMinUpvotes(parsed);
}
/** Parses comma-separated post ids to exclude from selection. */
export function parseExcludePostIds(raw) {
    if (raw == null || raw.trim() === '') {
        return new Set();
    }
    return new Set(raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean));
}
//# sourceMappingURL=parseMaxUpvotes.js.map