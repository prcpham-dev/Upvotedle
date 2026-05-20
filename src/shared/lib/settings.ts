import {
  DEFAULT_MAX_UPVOTES,
  DEFAULT_MIN_UPVOTES,
} from './reddit/constants';
import {
  clampMaxUpvotes,
  clampMinUpvotes,
} from './reddit/parseMaxUpvotes';

export const STORAGE_KEY_MAX_UPVOTES = 'redditdle_maxUpvotes';
export const STORAGE_KEY_MIN_UPVOTES = 'redditdle_minUpvotes';

export type UpvoteLimits = {
  minUpvotes: number;
  maxUpvotes: number;
};

export function loadMaxUpvotes(): number {
  if (typeof window === 'undefined') {
    return DEFAULT_MAX_UPVOTES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAX_UPVOTES);
    if (raw == null || raw.trim() === '') {
      return DEFAULT_MAX_UPVOTES;
    }
    return clampMaxUpvotes(Number.parseInt(raw, 10));
  } catch {
    return DEFAULT_MAX_UPVOTES;
  }
}

export function loadMinUpvotes(): number {
  if (typeof window === 'undefined') {
    return DEFAULT_MIN_UPVOTES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_MIN_UPVOTES);
    if (raw == null || raw.trim() === '') {
      return DEFAULT_MIN_UPVOTES;
    }
    return clampMinUpvotes(Number.parseInt(raw, 10));
  } catch {
    return DEFAULT_MIN_UPVOTES;
  }
}

export function loadUpvoteLimits(): UpvoteLimits {
  if (typeof window !== 'undefined') {
    const savedMax = localStorage.getItem(STORAGE_KEY_MAX_UPVOTES);
    const savedMin = localStorage.getItem(STORAGE_KEY_MIN_UPVOTES);
    // Migrate legacy default (max 1000, no min) to min 1000 with no cap.
    if (savedMax === '1000' && savedMin == null) {
      const limits: UpvoteLimits = {
        minUpvotes: DEFAULT_MIN_UPVOTES,
        maxUpvotes: DEFAULT_MAX_UPVOTES,
      };
      saveUpvoteLimits(limits);
      return limits;
    }
  }

  return {
    minUpvotes: loadMinUpvotes(),
    maxUpvotes: loadMaxUpvotes(),
  };
}

export function saveMaxUpvotes(value: number): void {
  localStorage.setItem(STORAGE_KEY_MAX_UPVOTES, String(clampMaxUpvotes(value)));
}

export function saveMinUpvotes(value: number): void {
  localStorage.setItem(STORAGE_KEY_MIN_UPVOTES, String(clampMinUpvotes(value)));
}

export function saveUpvoteLimits(limits: UpvoteLimits): void {
  saveMinUpvotes(limits.minUpvotes);
  saveMaxUpvotes(limits.maxUpvotes);
}
