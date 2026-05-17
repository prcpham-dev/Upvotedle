import { DEFAULT_MAX_UPVOTES } from "@/lib/reddit/constants";
import { clampMaxUpvotes } from "@/lib/reddit/parseMaxUpvotes";

export const STORAGE_KEY_MAX_UPVOTES = "redditdle_maxUpvotes";

export function loadMaxUpvotes(): number {
  if (typeof window === "undefined") {
    return DEFAULT_MAX_UPVOTES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAX_UPVOTES);
    if (raw == null || raw.trim() === "") {
      return DEFAULT_MAX_UPVOTES;
    }
    return clampMaxUpvotes(Number.parseInt(raw, 10));
  } catch {
    return DEFAULT_MAX_UPVOTES;
  }
}

export function saveMaxUpvotes(value: number): void {
  localStorage.setItem(STORAGE_KEY_MAX_UPVOTES, String(clampMaxUpvotes(value)));
}
