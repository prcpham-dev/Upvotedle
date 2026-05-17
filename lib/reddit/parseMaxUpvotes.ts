import {
  DEFAULT_MAX_UPVOTES,
  MAX_UPVOTES_LIMIT,
} from "./constants";

export function clampMaxUpvotes(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_UPVOTES;
  }
  return Math.min(Math.max(Math.floor(value), 1), MAX_UPVOTES_LIMIT);
}

/**
 * Parses `maxUpvotes` from a query string. Returns default when missing or invalid.
 */
export function parseMaxUpvotes(raw: string | null | undefined): number {
  if (raw == null || raw.trim() === "") {
    return DEFAULT_MAX_UPVOTES;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_MAX_UPVOTES;
  }

  return clampMaxUpvotes(parsed);
}
