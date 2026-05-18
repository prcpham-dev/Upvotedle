"use client";

import { useCallback, useEffect, useState } from "react";
import GameSetup from "@/components/GameSetup/GameSetup";
import GameBoard from "@/components/GameBoard/GameBoard";
import { DEFAULT_MAX_UPVOTES, DEFAULT_MIN_UPVOTES } from "@/lib/reddit/constants";
import { loadUpvoteLimits, saveUpvoteLimits, type UpvoteLimits } from "@/lib/settings";
import { DAILY_SUBREDDITS } from "@/lib/reddit/dailySubreddits";
import { pickSeededSample } from "@/lib/reddit/seededRandom";
import { fetchRoundBatch, BATCH_SIZE } from "@/lib/reddit/roundFetcher";
import type { RoundData } from "@/types/types";
import { getApiBase } from "@/lib/api";

const DEFAULT_LIMITS: UpvoteLimits = {
  minUpvotes: DEFAULT_MIN_UPVOTES,
  maxUpvotes: DEFAULT_MAX_UPVOTES,
};

function buildLimitsQuery(limits: UpvoteLimits): string {
  return new URLSearchParams({
    minUpvotes: String(limits.minUpvotes),
    maxUpvotes: String(limits.maxUpvotes),
  }).toString();
}

function resolveSeed(seedStr: string): number {
  const parsed = Number.parseInt(seedStr.trim(), 10);
  return Number.isFinite(parsed) ? parsed : Math.floor(Math.random() * 1_000_000);
}

function buildCandidateList(subreddit: string, seed: number): string[] {
  if (subreddit.trim()) return [subreddit.trim()];
  const pool = [...DAILY_SUBREDDITS];
  return pickSeededSample(pool, pool.length, seed);
}

export default function Home() {
  const [gameState, setGameState] = useState<"setup" | "loading" | "playing" | "error">("setup");
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [upvoteLimits, setUpvoteLimits] = useState<UpvoteLimits>(DEFAULT_LIMITS);
  const [customConfig, setCustomConfig] = useState({
    subreddit: "",
    seed: "",
    isEndless: false,
  });
  const [isEndless, setIsEndless] = useState(false);
  const [currentRunSeed, setCurrentRunSeed] = useState<number | null>(null);
  const [subreddits, setSubreddits] = useState<string[]>([]);

  // Restore inputs from localStorage on mount
  useEffect(() => {
    setUpvoteLimits(loadUpvoteLimits());
    setCustomConfig({
      subreddit: localStorage.getItem("redditdle_custom_subreddit") || "",
      seed: localStorage.getItem("redditdle_custom_seed") || "",
      isEndless: false,
    });
  }, []);

  const handleConfigChange = (newConfig: Partial<typeof customConfig>) => {
    setCustomConfig((prev) => {
      if (newConfig.subreddit !== undefined)
        localStorage.setItem("redditdle_custom_subreddit", newConfig.subreddit);
      if (newConfig.seed !== undefined)
        localStorage.setItem("redditdle_custom_seed", newConfig.seed);
      return { ...prev, ...newConfig };
    });
  };

  const handleUpvoteLimitsChange = useCallback((limits: UpvoteLimits) => {
    setUpvoteLimits(limits);
    saveUpvoteLimits(limits);
  }, []);

  // ── Daily: fetch all 10 rounds server-side via /api/daily ─────────────────
  const handleStartDaily = async () => {
    setGameState("loading");
    setErrorMessage("");
    setIsEndless(false);
    setSubreddits([]);
    setCurrentRunSeed(null);

    const limits = loadUpvoteLimits();
    setUpvoteLimits(limits);

    try {
      const res = await fetch(`${getApiBase()}/api/daily?${buildLimitsQuery(limits)}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof json.error === "string" ? json.error : "Failed to fetch daily puzzle.",
        );
      }

      // /api/daily returns GameRound[] — shape-compatible with RoundData[]
      setRounds(json as RoundData[]);
      setGameState("playing");
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setGameState("error");
    }
  };

  // ── Custom: fetch first batch client-side, GameBoard prefetches the rest ──
  const handleStartCustom = async () => {
    const { subreddit, seed: seedStr, isEndless: endless } = customConfig;
    setGameState("loading");
    setErrorMessage("");
    setIsEndless(endless);

    const limits = loadUpvoteLimits();
    setUpvoteLimits(limits);

    const resolvedSeed = resolveSeed(seedStr);
    setCurrentRunSeed(resolvedSeed);

    const candidates = buildCandidateList(subreddit, resolvedSeed);
    setSubreddits(candidates);

    try {
      const firstBatch = await fetchRoundBatch({
        subreddits: candidates,
        count: BATCH_SIZE,
        startRound: 1,
        limitsQuery: buildLimitsQuery(limits),
        seed: resolvedSeed,
      });

      setRounds(firstBatch);
      setGameState("playing");
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setGameState("error");
    }
  };

  const handlePlayAgain = () => {
    setGameState("setup");
    setRounds([]);
    setSubreddits([]);
  };

  const showSetup = gameState === "setup" || gameState === "error";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 setup-bg">
      {showSetup && (
        <GameSetup
          upvoteLimits={upvoteLimits}
          customConfig={customConfig}
          onConfigChange={handleConfigChange}
          onStartDaily={handleStartDaily}
          onStartCustom={handleStartCustom}
          onUpvoteLimitsChange={handleUpvoteLimitsChange}
          error={errorMessage}
        />
      )}

      {gameState === "loading" && (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-xl text-gray-300">Fetching Reddit Posts...</p>
        </div>
      )}

      {gameState === "playing" && (
        <GameBoard
          rounds={rounds}
          onPlayAgain={handlePlayAgain}
          isEndless={isEndless}
          subreddits={subreddits}
          upvoteLimits={upvoteLimits}
          seed={currentRunSeed}
        />
      )}
    </main>
  );
}