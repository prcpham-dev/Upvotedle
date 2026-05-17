import { useCallback, useEffect, useState } from "react";
import {
  getLocalDateString,
  hasPlayedOnDate,
  saveGameResults,
} from "../lib/storage.js";

const TOTAL_ROUNDS = 10;

/** Mock daily puzzle — replace with real fetch when the JSON endpoint is ready. */
function createMockDailyData() {
  const pairs = [
    [5000, 12000],
    [8000, 3000],
    [15000, 22000],
    [42000, 41000],
    [1200, 1200],
    [99000, 45000],
    [2100, 2100],
    [6700, 6710],
    [33333, 3333],
    [100000, 250000],
  ];

  return pairs.map(([upvotesA, upvotesB], index) => ({
    round: index + 1,
    subreddit: `r/example${index + 1}`,
    postA: { title: `Post A — Round ${index + 1}`, upvotes: upvotesA },
    postB: { title: `Post B — Round ${index + 1}`, upvotes: upvotesB },
  }));
}

function isGuessCorrect(round, isHigher) {
  const { postA, postB } = round;
  const bIsHigher = postB.upvotes > postA.upvotes;
  return isHigher === bIsHigher;
}

export function useGameLogic() {
  const [gameState, setGameState] = useState("START");
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [guessHistory, setGuessHistory] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDailyData = useCallback(async () => {
    setIsLoading(true);
    const today = getLocalDateString();
    const playedToday = hasPlayedOnDate(today);
    setHasPlayedToday(playedToday);

    if (!playedToday) {
      // TODO: fetch(`/daily/${today}.json`) when the API is available
      await new Promise((resolve) => setTimeout(resolve, 0));
      setDailyData(createMockDailyData());
    } else {
      setDailyData(createMockDailyData());
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadDailyData();
  }, [loadDailyData]);

  const startGame = useCallback(() => {
    if (hasPlayedToday) return;

    setGameState("PLAYING");
    setCurrentRound(0);
    setScore(0);
    setGuessHistory([]);
  }, [hasPlayedToday]);

  const handleGuess = useCallback(
    (isHigher) => {
      if (gameState !== "PLAYING" || !dailyData.length) return;

      const round = dailyData[currentRound];
      if (!round) return;

      const correct = isGuessCorrect(round, isHigher);
      const nextHistory = [...guessHistory, correct];
      const nextScore = score + (correct ? 1 : 0);
      const isLastRound = currentRound === TOTAL_ROUNDS - 1;

      setGuessHistory(nextHistory);
      setScore(nextScore);

      if (isLastRound) {
        setGameState("GAME_OVER");
        saveGameResults(nextScore);
        setHasPlayedToday(true);
        return;
      }

      setCurrentRound((prev) => prev + 1);
    },
    [gameState, dailyData, currentRound, guessHistory, score],
  );

  const generateShareText = useCallback(() => {
    const date = getLocalDateString();
    const squares = guessHistory.map((correct) => (correct ? "🟩" : "🟥")).join("");
    return `Redditdle - ${date} - ${score}/${TOTAL_ROUNDS}\n${squares}`;
  }, [guessHistory, score]);

  const activeRound = dailyData[currentRound] ?? null;

  return {
    gameState,
    currentRound,
    score,
    guessHistory,
    dailyData,
    hasPlayedToday,
    isLoading,
    activeRound,
    totalRounds: TOTAL_ROUNDS,
    startGame,
    handleGuess,
    loadDailyData,
    generateShareText,
  };
}
