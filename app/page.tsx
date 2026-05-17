"use client";

import React, { useCallback, useEffect, useState } from "react";
import GameSetup from "@/components/GameSetup/GameSetup";
import GameBoard from "@/components/GameBoard/GameBoard";
import {
  DEFAULT_MAX_UPVOTES,
  DEFAULT_MIN_UPVOTES,
} from "@/lib/reddit/constants";
import {
  loadUpvoteLimits,
  saveUpvoteLimits,
  type UpvoteLimits,
} from "@/lib/settings";
import { RoundData } from "@/types/types";
import { DAILY_SUBREDDITS } from "@/lib/reddit/dailySubreddits";
import { pickSeededSample } from "@/lib/reddit/seededRandom";

const DEFAULT_LIMITS: UpvoteLimits = {
  minUpvotes: DEFAULT_MIN_UPVOTES,
  maxUpvotes: DEFAULT_MAX_UPVOTES,
};

function buildUpvoteLimitsQuery(limits: UpvoteLimits): string {
  const params = new URLSearchParams({
    minUpvotes: String(limits.minUpvotes),
    maxUpvotes: String(limits.maxUpvotes),
  });
  return params.toString();
}

export default function Home() {
  const [gameState, setGameState] = useState<"setup" | "loading" | "playing" | "error">("setup");
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [upvoteLimits, setUpvoteLimits] = useState<UpvoteLimits>(DEFAULT_LIMITS);
  
  // Custom Game inputs kept on standby (never reset between runs)
  const [customSubreddit, setCustomSubreddit] = useState("");
  const [customSeed, setCustomSeed] = useState("");
  const [isEndless, setIsEndless] = useState(false);
  
  // The actual seed used for the current active playing game
  const [currentRunSeed, setCurrentRunSeed] = useState<number | null>(null);
  const [subreddits, setSubreddits] = useState<string[]>([]);

  useEffect(() => {
    setUpvoteLimits(loadUpvoteLimits());
    
    // Restore inputs from localStorage on load
    const savedSub = localStorage.getItem("redditdle_custom_subreddit");
    if (savedSub) setCustomSubreddit(savedSub);

    const savedSeed = localStorage.getItem("redditdle_custom_seed");
    if (savedSeed) setCustomSeed(savedSeed);
  }, []);

  const handleSetCustomSubreddit = (val: string) => {
    setCustomSubreddit(val);
    localStorage.setItem("redditdle_custom_subreddit", val);
  };

  const handleSetCustomSeed = (val: string) => {
    setCustomSeed(val);
    localStorage.setItem("redditdle_custom_seed", val);
  };

  const handleUpvoteLimitsChange = useCallback((limits: UpvoteLimits) => {
    setUpvoteLimits(limits);
    saveUpvoteLimits(limits);
  }, []);

  const handleStartDaily = async () => {
    setGameState("loading");
    setErrorMessage("");
    setIsEndless(false);
    setSubreddits([]);
    setCurrentRunSeed(null);

    const limits = loadUpvoteLimits();
    setUpvoteLimits(limits);

    try {
      const response = await fetch(`/api/daily?${buildUpvoteLimitsQuery(limits)}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof json.error === "string"
            ? json.error
            : "Failed to fetch daily puzzle data.",
        );
      }

      setRounds(json);
      setGameState("playing");
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setGameState("setup");
    }
  };

  const handleStartCustom = async (
    subreddit: string,
    seedStr: string,
    endless: boolean,
  ) => {
    setGameState("loading");
    setErrorMessage("");
    setIsEndless(endless);

    const limits = loadUpvoteLimits();
    setUpvoteLimits(limits);

    // Resolve the numerical seed (blank = random number generated)
    let resolvedSeed = seedStr.trim() ? Number.parseInt(seedStr, 10) : null;
    if (resolvedSeed === null || !Number.isFinite(resolvedSeed)) {
      resolvedSeed = Math.floor(Math.random() * 1000000);
    }
    setCurrentRunSeed(resolvedSeed);

    try {
      const isCustomSubProvided = !!subreddit.trim();
      
      // Seed-shuffled pool of DAILY_SUBREDDITS
      const pool = [...DAILY_SUBREDDITS];
      const fallbackPool = pickSeededSample(pool, pool.length, resolvedSeed);
      
      const numRounds = endless ? 3 : 10;
      const query = buildUpvoteLimitsQuery(limits);

      // If custom sub is provided, play strictly from that subreddit. Otherwise, use the shuffled list.
      let candidatesList: string[] = [];
      if (isCustomSubProvided) {
        candidatesList = Array(numRounds).fill(subreddit.trim());
        setSubreddits([subreddit.trim()]);
      } else {
        candidatesList = fallbackPool;
        setSubreddits(fallbackPool);
      }
      
      const payload: RoundData[] = [];
      let candidateIndex = 0;

      while (payload.length < numRounds && candidateIndex < candidatesList.length) {
        const remaining = numRounds - payload.length;
        const batch = candidatesList.slice(candidateIndex, candidateIndex + remaining);
        candidateIndex += batch.length;

        const results = await Promise.allSettled(
          batch.map((sub, i) => {
            const round = payload.length + i + 1;
            const seedNum = resolvedSeed + round;
            return fetch(
              `/api/round?subreddit=${encodeURIComponent(sub)}&round=${round}&${query}&seed=${seedNum}`
            ).then(async (res) => {
              if (!res.ok) throw new Error("HTTP error");
              const data = await res.json();
              if (data.error || !data[0]) throw new Error("Payload error");
              return data[0];
            });
          })
        );

        for (const result of results) {
          if (result.status === "fulfilled") {
            payload.push(result.value);
          }
        }
      }

      if (payload.length < numRounds) {
        throw new Error(
          `Could only build ${payload.length} of ${numRounds} rounds. Please check your internet connection or lower upvote limit filters.`
        );
      }

      // Re-map round indices
      const finalizedRounds = payload.slice(0, numRounds).map((r, index) => ({
        ...r,
        round: index + 1,
      }));

      setRounds(finalizedRounds);
      setGameState("playing");
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setGameState("error");
    }
  };

  const handlePlayAgain = () => {
    setGameState("setup");
    setRounds([]);
    setSubreddits([]);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {gameState === "setup" && (
        <GameSetup
          upvoteLimits={upvoteLimits}
          customSubreddit={customSubreddit}
          setCustomSubreddit={handleSetCustomSubreddit}
          customSeed={customSeed}
          setCustomSeed={handleSetCustomSeed}
          isEndless={isEndless}
          setIsEndless={setIsEndless}
          onStartDaily={handleStartDaily}
          onStartCustom={handleStartCustom}
          onUpvoteLimitsChange={handleUpvoteLimitsChange}
          error={errorMessage}
        />
      )}

      {gameState === "loading" && (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin"></div>
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

      {gameState === "error" && (
        <GameSetup
          upvoteLimits={upvoteLimits}
          customSubreddit={customSubreddit}
          setCustomSubreddit={handleSetCustomSubreddit}
          customSeed={customSeed}
          setCustomSeed={handleSetCustomSeed}
          isEndless={isEndless}
          setIsEndless={setIsEndless}
          onStartDaily={handleStartDaily}
          onStartCustom={handleStartCustom}
          onUpvoteLimitsChange={handleUpvoteLimitsChange}
          error={errorMessage}
        />
      )}
    </main>
  );
}
