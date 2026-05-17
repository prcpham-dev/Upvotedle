import { useCallback, useEffect, useState } from "react";
import { fetchDailyDataFromApi } from "../lib/fetchDailyData.js";
import {
  getLocalDateString,
  hasPlayedOnDate,
  saveGameResults,
} from "../lib/storage.js";

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
  const [loadError, setLoadError] = useState(null);

  const totalRounds = dailyData.length;

  const loadDailyData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const today = getLocalDateString();
    const playedToday = hasPlayedOnDate(today);
    setHasPlayedToday(playedToday);

    if (playedToday) {
      setDailyData([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchDailyDataFromApi();
      setDailyData(data);
    } catch (error) {
      setDailyData([]);
      setLoadError(
        error instanceof Error ? error.message : "Failed to load daily puzzle",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDailyData();
  }, [loadDailyData]);

  const startGame = useCallback(() => {
    if (hasPlayedToday || !dailyData.length) return;

    setGameState("PLAYING");
    setCurrentRound(0);
    setScore(0);
    setGuessHistory([]);
  }, [hasPlayedToday, dailyData.length]);

  const handleGuess = useCallback(
    (isHigher) => {
      if (gameState !== "PLAYING" || !dailyData.length) return;

      const round = dailyData[currentRound];
      if (!round) return;

      const correct = isGuessCorrect(round, isHigher);
      const nextHistory = [...guessHistory, correct];
      const nextScore = score + (correct ? 1 : 0);
      const isLastRound = currentRound === dailyData.length - 1;

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
    const rounds = totalRounds || guessHistory.length;
    const squares = guessHistory.map((correct) => (correct ? "🟩" : "🟥")).join("");
    return `Redditdle - ${date} - ${score}/${rounds}\n${squares}`;
  }, [guessHistory, score, totalRounds]);

  const activeRound = dailyData[currentRound] ?? null;

  return {
    gameState,
    currentRound,
    score,
    guessHistory,
    dailyData,
    hasPlayedToday,
    isLoading,
    loadError,
    activeRound,
    totalRounds,
    startGame,
    handleGuess,
    loadDailyData,
    generateShareText,
  };
}
