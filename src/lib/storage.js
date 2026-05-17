export const STORAGE_KEYS = {
  LAST_PLAYED: "redditdle_lastPlayed",
  STATS: "redditdle_stats",
};

export function getLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDefaultStats() {
  return {
    gamesPlayed: 0,
    totalWins: 0,
    currentStreak: 0,
    maxStreak: 0,
  };
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return getDefaultStats();
    return { ...getDefaultStats(), ...JSON.parse(raw) };
  } catch {
    return getDefaultStats();
  }
}

export function saveStats(stats) {
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

export function hasPlayedOnDate(dateString) {
  return localStorage.getItem(STORAGE_KEYS.LAST_PLAYED) === dateString;
}

/**
 * Persists completion for today and updates aggregate stats.
 * Streak continues if the previous play was yesterday; otherwise resets to 1.
 */
export function saveGameResults(score) {
  const today = getLocalDateString();
  const yesterday = getLocalDateString(
    new Date(Date.now() - 24 * 60 * 60 * 1000),
  );
  const lastPlayed = localStorage.getItem(STORAGE_KEYS.LAST_PLAYED);
  const stats = loadStats();

  stats.gamesPlayed += 1;
  if (score === 10) {
    stats.totalWins += 1;
  }

  if (lastPlayed === yesterday) {
    stats.currentStreak += 1;
  } else if (lastPlayed !== today) {
    stats.currentStreak = 1;
  }

  stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);

  localStorage.setItem(STORAGE_KEYS.LAST_PLAYED, today);
  saveStats(stats);
}
